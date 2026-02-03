import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Define Expected Body Type
interface SaleRequestBody {
    customerId?: string | null;
    items: { productId: string; quantity: number }[];
    paymentMethod?: string;
    notes?: string;
    accountId?: string;
    paidAmount?: number;
    paymentStatus?: string;
}

// POST /api/shop/sales - Create new sale (Checkout)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: SaleRequestBody = await req.json();
        console.log("Creating Sale - Payload:", JSON.stringify(body, null, 2)); // DEBUG LOG

        const { customerId, items, paymentMethod, notes, accountId, paidAmount, paymentStatus } = body;

        // Fetch user to get accurate Company ID
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!currentUser?.companyId) {
            console.error("User has no company ID:", session.user.id);
            return NextResponse.json({ error: 'User does not belong to a company' }, { status: 400 });
        }

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'No items in sale' }, { status: 400 });
        }

        // Use Prisma transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            let subtotal = 0;
            const saleItems = [];

            // Validate and prepare sale items
            for (const item of items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                });

                if (!product) {
                    throw new Error(`Product ${item.productId} not found`);
                }

                if (product.stock < item.quantity) {
                    throw new Error(`Insufficient stock for ${product.name}. Requested: ${item.quantity}, Available: ${product.stock}`);
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
                });

                // Update product stock
                const newStock = product.stock - item.quantity;
                const newStatus = newStock > product.minStock ? 'In Stock' :
                    newStock > 0 ? 'Low Stock' : 'Out of Stock';

                await tx.product.update({
                    where: { id: product.id },
                    data: {
                        stock: newStock,
                        status: newStatus,
                    },
                });

                // Create stock movement record
                await tx.stockMovement.create({
                    data: {
                        productId: product.id,
                        type: 'Sale',
                        quantity: -item.quantity,
                        userId: session.user.id,
                        reference: 'Manual Entry'
                    },
                });
            }

            const tax = subtotal * 0.15; // 15% VAT
            const total = subtotal + tax;
            const invoiceNumber = `INV-${Date.now()}`;

            // Create Sale Record
            const sale = await tx.sale.create({
                data: {
                    invoiceNumber,
                    subtotal,
                    tax,
                    total,
                    paymentMethod: paymentMethod || 'Cash',
                    paymentStatus: paymentStatus || 'Paid',
                    paidAmount: paidAmount !== undefined ? paidAmount : total,
                    notes,
                    userId: session.user.id,
                    customerId: customerId || null,
                    items: {
                        create: saleItems
                    }
                },
                include: {
                    items: true
                }
            });

            // Handle Accounting (Revenue Entry)
            // Only add transaction if there is an actual payment made
            if (accountId && (paidAmount === undefined || paidAmount > 0)) {

                // If paidAmount is specified, use it. Otherwise assume full payment (total).
                const amountToDeposit = paidAmount !== undefined ? paidAmount : total;

                // Update account balance
                await tx.account.update({
                    where: { id: accountId },
                    data: {
                        balance: { increment: amountToDeposit }
                    }
                });

                // Create Transaction Record
                await tx.transaction.create({
                    data: {
                        type: 'INCOME',
                        amount: amountToDeposit,
                        description: `Sale Receipt #${invoiceNumber}`,
                        category: 'Sales',
                        transactionDate: new Date(),
                        accountId: accountId,
                        note: `Ref Sale: ${sale.id}`,
                        userId: session.user.id,
                        companyId: currentUser.companyId
                    }
                });
            }

            return sale;
        });

        console.log("Sale Created Successfully:", result.id);
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

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const sales = await prisma.sale.findMany({
            where: {
                userId: session.user.id,
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

