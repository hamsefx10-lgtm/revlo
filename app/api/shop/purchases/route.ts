import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendPurchaseNotification } from '@/lib/whatsapp/send-purchase-notification';

// GET /api/shop/purchases - List POs
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!currentUser?.companyId) {
            return NextResponse.json({ error: 'User does not belong to a company' }, { status: 400 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || 'All';

        const where: any = {
            companyId: currentUser.companyId
        };

        if (status !== 'All') {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { poNumber: { contains: search, mode: 'insensitive' } },
                { vendor: { name: { contains: search, mode: 'insensitive' } } }
            ];
        }

        const purchases = await prisma.purchaseOrder.findMany({
            where,
            include: {
                vendor: true,
                _count: { select: { items: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ purchases });
    } catch (error) {
        console.error('Error fetching purchases:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/shop/purchases - Create PO
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { vendorId, items, notes, expectedDelivery, paidAmount, paymentMethod, shippingCost, customsFee, otherExpenses, notifyEmployeeIds, sendWhatsApp } = body;

        if (!vendorId || !items || items.length === 0) {
            return NextResponse.json({ error: 'Vendor and items are required' }, { status: 400 });
        }

        // Get User Company
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'User company not found' }, { status: 400 });
        }

        // Generate PO Number (PO-{Year}-{Sequence})
        const count = await prisma.purchaseOrder.count({ where: { companyId: user.companyId } });
        const poNumber = `PO-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;

        // Multi-Currency Logic
        const currency = body.currency || 'USD';
        let exchangeRate = parseFloat(body.exchangeRate || 1);

        // If USD, try to fetch today's rate if not provided
        if (currency === 'USD' && (!body.exchangeRate || body.exchangeRate === 1)) {
            const latestRateRecord = await prisma.exchangeRate.findFirst({
                where: { companyId: user.companyId },
                orderBy: { date: 'desc' }
            });
            if (latestRateRecord) {
                exchangeRate = latestRateRecord.rate;
            }
        }

        // Calculate totals in ETB
        let subtotalETB = 0;
        let totalQty = 0;
        items.forEach((item: any) => {
            const unitCostETB = currency === 'USD' ? item.unitCost * exchangeRate : item.unitCost;
            subtotalETB += item.quantity * unitCostETB;
            totalQty += parseInt(item.quantity) || 0;
        });

        // Calculate Additional Costs
        const shippingETB = currency === 'USD' ? (parseFloat(shippingCost) || 0) * exchangeRate : (parseFloat(shippingCost) || 0);
        const customsETB = currency === 'USD' ? (parseFloat(customsFee) || 0) * exchangeRate : (parseFloat(customsFee) || 0);
        const otherETB = currency === 'USD' ? (parseFloat(otherExpenses) || 0) * exchangeRate : (parseFloat(otherExpenses) || 0);
        const totalAdditionalCostsETB = shippingETB + customsETB + otherETB;

        const taxETB = 0;
        const totalETB = subtotalETB + taxETB + totalAdditionalCostsETB;

        // Determine Payment Status (Convert paid to ETB for comparison)
        const paidRaw = parseFloat(paidAmount || 0);
        const paidETB = currency === 'USD' ? paidRaw * exchangeRate : paidRaw;
        
        let paymentStatus = 'Unpaid';
        if (paidETB >= totalETB) paymentStatus = 'Paid';
        else if (paidETB > 0) paymentStatus = 'Partial';

        // Transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create PO
            const purchaseOrder = await tx.purchaseOrder.create({
                data: {
                    poNumber,
                    vendorId,
                    userId: session.user.id,
                    companyId: user.companyId,
                    status: 'Pending',
                    subtotal: subtotalETB,
                    tax: taxETB,
                    total: totalETB,
                    paidAmount: paidETB,
                    paymentStatus,
                    notes,
                    expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
                    currency,
                    exchangeRate,
                    shippingCost: parseFloat(shippingCost) || 0,
                    customsFee: parseFloat(customsFee) || 0,
                    otherExpenses: parseFloat(otherExpenses) || 0,
                    // Note: If Prisma schema doesn't have shipping/customs columns yet, we just roll it into the item's cost.
                    // But if you plan to save them, add them here. For now it affects landed cost perfectly.
                }
            });

            // Create Items
            for (const item of items) {
                // Base Cost
                const baseUnitCostETB = currency === 'USD' ? parseFloat(item.unitCost) * exchangeRate : parseFloat(item.unitCost);
                const itemTotalBaseCostETB = parseInt(item.quantity) * baseUnitCostETB;

                // Landed Cost Distribution (Proportional based on cost)
                let itemAdditionalCostETB = 0;
                if (subtotalETB > 0) {
                    const proportion = itemTotalBaseCostETB / subtotalETB;
                    itemAdditionalCostETB = totalAdditionalCostsETB * proportion;
                }

                // Final Landed Cost per unit
                const itemQty = parseInt(item.quantity) || 1; // Default to 1 to avoid division by zero
                const landedUnitCostETB = baseUnitCostETB + (itemAdditionalCostETB / itemQty);
                const landedUnitCostUSD = landedUnitCostETB / (exchangeRate || 1);

                // Create Items
                await tx.purchaseOrderItem.create({
                    data: {
                        poId: purchaseOrder.id,
                        productId: item.productId,
                        productName: item.productName,
                        sku: item.sku || null,
                        quantity: itemQty,
                        unitCost: landedUnitCostETB,
                        total: itemQty * landedUnitCostETB,
                        unitCostUSD: landedUnitCostUSD,
                        sellingPrice: parseFloat(item.sellingPrice) || null,
                    }
                });
            }

            // Create Expense (Payment)
            if (paid > 0) {
                await tx.expense.create({
                    data: {
                        description: `Payment for Purchase Order ${poNumber}`,
                        amount: paidETB,
                        paidFrom: paymentMethod || 'Check',
                        category: 'Inventory Purchase',
                        vendorId: vendorId,
                        expenseDate: new Date(),
                        companyId: user.companyId,
                        userId: session.user.id,
                        purchaseOrderId: purchaseOrder.id,
                        approved: true
                    }
                });
            }

            return purchaseOrder;
        });

        // If WhatsApp notification is requested, trigger it in background
        if (sendWhatsApp && notifyEmployeeIds?.length > 0) {
            // We don't await this to keep the API response fast
            sendPurchaseNotification(user.companyId, result.id, notifyEmployeeIds).catch(err => {
                console.error('WhatsApp notification failed:', err);
            });
        }

        return NextResponse.json({ purchaseOrder: result }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating purchase order:', error);
        // Include original error message if available for debugging
        return NextResponse.json({
            error: 'Internal server error',
            details: error?.message || 'Unknown error'
        }, { status: 500 });
    }
}
