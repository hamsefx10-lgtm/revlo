import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const startStr = searchParams.get('startDate');
        const endStr = searchParams.get('endDate');

        const now = new Date();
        const start = startStr ? startOfDay(parseISO(startStr)) : startOfDay(now);
        const end = endStr ? endOfDay(parseISO(endStr)) : endOfDay(now);

        // Fetch User to get accurate Company ID (Session might not have it)
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });
        if (!user?.companyId) {
            return NextResponse.json({ error: 'User company not found' }, { status: 400 });
        }
        const companyId = user.companyId;

        // 1. Fetch Transactions (Income & Expenses)
        // We look for transactions in the date range.
        const transactions = await prisma.transaction.findMany({
            where: {
                companyId: companyId,
                transactionDate: {
                    gte: start,
                    lte: end
                }
            },
            select: {
                type: true,
                amount: true,
                category: true,
                description: true,
                transactionDate: true
            }
        });

        // 2. Calculate Totals
        let totalIncome = 0;
        let totalExpenses = 0;
        const expensesByCategory: Record<string, number> = {};

        transactions.forEach(t => {
            const amt = Number(t.amount);
            if (t.type === 'INCOME' || t.type === 'DEBT_REPAID') { // Debt Repaid to us? Or we repaid debt?
                // Usually INCOME is Sales.
                if (t.type === 'INCOME') totalIncome += amt;
            } else if (t.type === 'EXPENSE') {
                totalExpenses += amt;
                const cat = t.category || 'Uncategorized';
                expensesByCategory[cat] = (expensesByCategory[cat] || 0) + amt;
            }
        });

        // 3. Approximate COGS (Cost of Goods Sold)
        // We need to fetch Sales in this period and multiply items by their CURRENT cost price.
        const sales = await prisma.sale.findMany({
            where: {
                userId: session.user.id, // Or companyId? Sales model uses userId.
                createdAt: {
                    gte: start,
                    lte: end
                },
                status: 'Completed'
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: { costPrice: true }
                        }
                    }
                }
            }
        });

        let totalCOGS = 0;
        sales.forEach(sale => {
            sale.items.forEach(item => {
                totalCOGS += (item.quantity * item.product.costPrice);
            });
        });

        const grossProfit = totalIncome - totalCOGS;
        const netProfit = totalIncome - totalExpenses; // Cash Flow Net
        // Note: Real Net Profit would depend on whether "Expenses" includes Inventory Purchases.
        // If Expenses includes 'Purchases', then 'totalIncome - totalExpenses' is "Net Cash Flow".
        // A better "Net Profit" (Accrual) would be "GrossProfit - OperatingExpenses".
        // Separation of Operating Expenses vs Inventory Purchases is hard without strict categories.
        // We will return all metrics for the frontend to display.

        return NextResponse.json({
            stats: {
                totalIncome,
                totalExpenses,
                totalCOGS,
                grossProfit,
                netProfit, // Cash based
                transactionCount: transactions.length,
                salesCount: sales.length
            },
            expensesByCategory,
            transactions // Optional, for list view
        });

    } catch (error: any) {
        console.error("Report error:", error);
        return NextResponse.json({ error: error.message || 'Error generating report' }, { status: 500 });
    }
}
