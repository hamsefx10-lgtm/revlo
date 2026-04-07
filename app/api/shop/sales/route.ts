import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { sendShopReceiptViaWhatsApp } from '@/lib/whatsapp/send-shop-receipt';
import { logToFile } from '@/lib/whatsapp/manager';
import { autoConvertAgedDebts } from '@/lib/shop/currency-utils';

// Define Expected Body Type
interface SaleRequestBody {
    customerId?: string | null;
    items: { productId: string; quantity: number }[];
    paymentMethod?: string;
    notes?: string;
    accountId?: string; // Legacy/Single
    paidAmount?: number; // Legacy/Single
    payments?: { accountId: string; amount: number; method: string }[]; // Multi-payment
    paymentStatus?: string;
    supplierReceiptNumber?: string;
    taxAmount?: number;
    invoiceNumber?: string;
    dueDate?: string;
    currency?: string;
    exchangeRate?: number;
    autoConvertDebt?: boolean;
    convertDebtAfterDays?: number;
    employeeId?: string;
    sendWhatsApp?: boolean;
}

// POST /api/shop/sales - Create new sale (Checkout)

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: SaleRequestBody = await req.json();
        console.log("Creating Sale - Payload:", JSON.stringify(body, null, 2)); // DEBUG LOG

        const {
            customerId, items, paymentMethod, notes, accountId,
            paidAmount, payments, paymentStatus, supplierReceiptNumber,
            taxAmount, invoiceNumber, dueDate,
            currency, exchangeRate,
            autoConvertDebt, convertDebtAfterDays,
            employeeId, sendWhatsApp
        } = body;

        // Fetch user to get accurate Company ID and Name
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { company: true }
        });

        if (!currentUser?.companyId) {
            console.error("User has no company ID:", session.user.id);
            return NextResponse.json({ error: 'User does not belong to a company' }, { status: 400 });
        }

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'No items in sale' }, { status: 400 });
        }

        const activeCurrency = currency || 'ETB';
        const activeRate = exchangeRate || 1;

        // Fetch all products BEFORE transaction to avoid slow network timeouts mapping over items sequentially
        const productIds = items.map(item => item.productId);
        const products = await prisma.product.findMany({
            where: {
                id: { in: productIds },
                companyId: currentUser.companyId
            }
        });

        const productMap = new Map<string, any>();
        for (const p of products) {
            productMap.set(p.id, p);
        }

        // Pre-calculate to ensure valid data before transaction starts
        let subtotal = 0;
        const saleItems: any[] = [];

        for (const item of items) {
            const product = productMap.get(item.productId);
            if (!product) {
                return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 404 });
            }
            if (product.stock < item.quantity) {
                return NextResponse.json({ error: `Insufficient stock for ${product.name}. Requested: ${item.quantity}, Available: ${product.stock}` }, { status: 400 });
            }

            const itemTotal = product.sellingPrice * item.quantity;
            subtotal += itemTotal;

            saleItems.push({
                productId: product.id,
                productName: product.name,
                quantity: item.quantity,
                unitPrice: product.sellingPrice,
                total: itemTotal,
                costPrice: product.costPrice || 0,
                totalCost: (product.costPrice || 0) * item.quantity,
                // Multi-currency calculation
                unitPriceUSD: activeCurrency === 'USD' ? product.sellingPrice : (product.sellingPrice / activeRate),
                costPriceUSD: product.costPriceUSD > 0 ? product.costPriceUSD : (activeCurrency === 'USD' ? (product.costPrice || 0) : ((product.costPrice || 0) / activeRate)),
                // These are passed to the transaction for updates
                originalStock: product.stock,
                minStock: product.minStock
            });
        }

        const calculatedTax = taxAmount !== undefined ? Number(taxAmount) : (subtotal * 0.15); // Fallback to 15% if frontend didn't pass it
        const total = subtotal + calculatedTax;
        const finalInvoiceNumber = invoiceNumber || `INV-${Date.now()}`;

        const finalNotes = supplierReceiptNumber
            ? `Supplier Receipt #: ${supplierReceiptNumber}\n${notes || ''}`.trim()
            : notes;

        // Use Prisma transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            // 1. Update stock and create movements
            for (const item of saleItems) {
                const newStock = item.originalStock - item.quantity;
                const newStatus = newStock > item.minStock ? 'In Stock' :
                    newStock > 0 ? 'Low Stock' : 'Out of Stock';

                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: newStock,
                        status: newStatus,
                    },
                });

                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        type: 'Sale',
                        quantity: -item.quantity,
                        userId: session.user.id,
                        reference: `Manual Entry: ${finalInvoiceNumber}`
                    },
                });
            }

            // 2. Create Sale Record
            const sale = await tx.sale.create({
                data: {
                    invoiceNumber: finalInvoiceNumber,
                    subtotal,
                    tax: calculatedTax,
                    total,
                    paymentMethod: paymentMethod || 'Cash',
                    paymentStatus: paymentStatus || 'Paid',
                    paidAmount: paidAmount !== undefined ? paidAmount : total,
                    dueDate: dueDate ? new Date(dueDate) : null,
                    notes: finalNotes,
                    userId: session.user.id,
                    companyId: currentUser.companyId,
                    customerId: customerId || null,
                    currency: activeCurrency,
                    exchangeRate: activeRate,
                    autoConvertDebt: autoConvertDebt !== undefined ? autoConvertDebt : true,
                    convertDebtAfterDays: convertDebtAfterDays !== undefined ? Number(convertDebtAfterDays) : 7,
                    employeeId: employeeId || null,
                    items: {
                        create: saleItems.map(({ productId, productName, quantity, unitPrice, total, costPrice, totalCost, unitPriceUSD, costPriceUSD }) => ({
                            productId, productName, quantity, unitPrice, total, costPrice, totalCost, unitPriceUSD, costPriceUSD
                        }))
                    }
                },
                include: {
                    items: true,
                    customer: true,
                    company: true
                }
            });

            // 3. Handle Accounting (Revenue Entry)
            // 3. Handle Accounting (Revenue Entry - Multiple or Single)
            const activePayments = payments && payments.length > 0
                ? payments
                : (accountId ? [{ accountId, amount: paidAmount !== undefined ? paidAmount : total, method: paymentMethod || 'Cash' }] : []);

            for (const p of activePayments) {
                if (!p.accountId || p.amount <= 0) continue;

                const targetAccount = await tx.account.findUnique({ where: { id: p.accountId } });
                if (targetAccount) {
                    let amountToDeposit = p.amount;
                    const accCurrency = targetAccount.currency || 'ETB';

                    if (activeCurrency === 'USD' && accCurrency === 'ETB') {
                        amountToDeposit = p.amount * activeRate;
                    } else if (activeCurrency === 'ETB' && accCurrency === 'USD') {
                        amountToDeposit = p.amount / activeRate;
                    }

                    await tx.account.update({
                        where: { id: p.accountId },
                        data: { balance: { increment: amountToDeposit } }
                    });

                    await tx.transaction.create({
                        data: {
                            type: 'INCOME',
                            amount: amountToDeposit,
                            description: `Sale Receipt #${finalInvoiceNumber}${activeCurrency === 'USD' ? ` ($${p.amount})` : ''} - [${p.method}]`,
                            category: 'Sales',
                            transactionDate: new Date(),
                            accountId: p.accountId,
                            note: `Ref Sale: ${sale.id} | Sale Currency: ${activeCurrency} | Rate: ${activeRate}`,
                            userId: session.user.id,
                            companyId: currentUser.companyId,
                            employeeId: employeeId || null
                        }
                    });
                }
            }

            return sale;
        }, {
            maxWait: 5000, // 5 seconds wait
            timeout: 30000 // 30 seconds for transaction
        });

        console.log("Sale Created Successfully:", result.id);

        // Auto-send WhatsApp receipt if triggered and customer phone exists
        if (sendWhatsApp && result.customer && result.customer.phone && currentUser.company?.name) {
            logToFile(`[WhatsApp API] Auto-triggering receipt for ${result.invoiceNumber} to ${result.customer.phone}`);
            sendShopReceiptViaWhatsApp(
                currentUser.companyId,
                currentUser.company.name,
                result.customer.phone,
                result
            ).catch(e => {
                logToFile(`[WhatsApp API ERROR] Failed to auto-send for ${result.invoiceNumber}: ${e}`);
            });
        } else {
            logToFile(`[WhatsApp API SKIP] Conditions not met for ${result.invoiceNumber}. Customer: ${!!result.customer}, Phone: ${result.customer?.phone}, Company: ${currentUser.company?.name}`);
        }

        return NextResponse.json({ sale: result }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating sale API:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET /api/shop/sales
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

        // Trigger automatic debt conversion for this company


        await autoConvertAgedDebts(currentUser.companyId);

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const sales = await prisma.sale.findMany({
            where: {
                companyId: currentUser.companyId,
            },
            include: {
                items: true,
                customer: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
            skip: offset,
        });

        return NextResponse.json({ sales });
    } catch (error) {
        console.error('Error fetching sales:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

