import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Helper to safe cast to Number
function toNumber(val: any): number {
    if (val === null || val === undefined) return 0;
    // Check if it's a Prisma Decimal (has .toNumber method) or object that acts like one
    if (typeof val === 'object' && val !== null && 'toNumber' in val) {
        return Number(val.toNumber());
    }
    // Check if it's string or number
    const num = Number(val);
    return isNaN(num) ? 0 : num;
}

export async function GET(req: NextRequest) {
    try {
        console.log("--> API: Safe Balance Sheet Gen Started");
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const companyId = session.user.companyId;

        const url = new URL(req.url);
        const dateParam = url.searchParams.get('date');
        // If date provided, use end of that day. Else end of today.
        const filterDate = dateParam ? new Date(dateParam) : new Date();
        filterDate.setHours(23, 59, 59, 999);

        console.log(`--> Filtering Data up to: ${filterDate.toISOString()}`);

        const dateFilter = {
            createdAt: {
                lte: filterDate
            }
        };

        const transactionDateFilter = {
            transactionDate: {
                lte: filterDate
            }
        };

        // Initialize Values
        let totalCashAndBank = 0;
        let inventoryValue = 0;
        let fixedAssetsValue = 0;
        let accountsPayable = 0;
        let totalTaxCollected = 0;
        let totalCapital = 0;
        let ar = 0; // Accounts Receivable
        let calculatedRetainedEarnings = 0;
        let longTermLoans = 0;

        // --- 1. ASSETS ---

        // A. FINANCIAL ACCOUNTS
        try {
            // Ideally should be historical, but taking current for now as discussed
            const accounts = await prisma.account.findMany({ where: { companyId } });
            totalCashAndBank = accounts.reduce((sum, acc) => sum + toNumber(acc.balance), 0);
        } catch (e) {
            console.error("BS_Err_Cash:", e);
        }

        // B. INVENTORY
        try {
            const products = await prisma.product.findMany({
                where: { userId }, // Typically inventory is "as is" unless we have snapshots
                select: { stock: true, costPrice: true }
            });
            inventoryValue = products.reduce((sum, p) => sum + (toNumber(p.stock) * toNumber(p.costPrice)), 0);
        } catch (e) {
            console.error("BS_Err_Inv:", e);
        }

        // C. FIXED ASSETS
        try {
            const assets = await prisma.fixedAsset.findMany({
                where: { companyId, ...dateFilter }
            });
            fixedAssetsValue = assets.reduce((sum, fa) => sum + toNumber(fa.currentBookValue), 0);
        } catch (e) {
            console.error("BS_Err_Fixed:", e);
        }

        // D. ACCOUNTS RECEIVABLE
        try {
            // Sales created before date that are NOT fully paid
            const unpaidSales = await prisma.sale.findMany({
                where: {
                    userId: userId,
                    createdAt: { lte: filterDate },
                    paymentStatus: { not: 'Paid' }
                }
            });
            ar = unpaidSales.reduce((sum, sale) => sum + (toNumber(sale.total) - toNumber(sale.paidAmount)), 0);
        } catch (e) {
            console.error("BS_Err_AR:", e);
        }


        // --- 2. LIABILITIES ---

        // A. ACCOUNTS PAYABLE
        try {
            const unpaidPOs = await prisma.purchaseOrder.findMany({
                where: {
                    userId,
                    createdAt: { lte: filterDate },
                    paymentStatus: { not: 'Paid' }
                }
            });
            accountsPayable = unpaidPOs.reduce((sum, po) => sum + (toNumber(po.total) - toNumber(po.paidAmount)), 0);
        } catch (e) {
            console.error("BS_Err_AP:", e);
        }

        // B. TAX PAYABLE
        try {
            const allSales = await prisma.sale.findMany({
                where: { userId, createdAt: { lte: filterDate } },
                select: { tax: true }
            });
            totalTaxCollected = allSales.reduce((sum, s) => sum + toNumber(s.tax), 0);
        } catch (e) {
            console.error("BS_Err_Tax:", e);
        }

        // C. LONG TERM LOANS
        try {
            const debts = await prisma.transaction.findMany({
                where: {
                    userId,
                    type: { in: ['DEBT_TAKEN', 'DEBT_REPAID'] },
                    ...transactionDateFilter
                }
            });

            debts.forEach(t => {
                const amt = toNumber(t.amount);
                if (t.type === 'DEBT_TAKEN') longTermLoans += amt;
                if (t.type === 'DEBT_REPAID') longTermLoans -= amt;
            });
        } catch (e) {
            console.error("BS_Err_Loans:", e);
        }


        // --- 3. EQUITY ---

        // A. CAPITAL
        try {
            // Logic: Sum 'OTHER' or 'INCOME' transactions linked to Shareholders OR categorized explicitly
            const capitalTx = await prisma.transaction.findMany({
                where: {
                    companyId,
                    ...transactionDateFilter,
                    OR: [
                        { shareholderId: { not: null } },
                        { category: { equals: 'Capital', mode: 'insensitive' } }
                    ]
                }
            });

            totalCapital = capitalTx.reduce((sum, t) => {
                // Defensive check: don't sum EXPENSES as capital even if linked to shareholder (could be dividends)
                if (['INCOME', 'OTHER'].includes(t.type)) {
                    return sum + toNumber(t.amount);
                }
                return sum;
            }, 0);

        } catch (e) {
            console.error("BS_Err_Cap:", e);
        }

        // B. RETAINED EARNINGS
        try {
            // Revenue
            const saleData = await prisma.sale.findMany({
                where: { userId, createdAt: { lte: filterDate } },
                select: { subtotal: true }
            });
            const revenue = saleData.reduce((sum, s) => sum + toNumber(s.subtotal), 0);

            // Expenses
            const expenseData = await prisma.expense.findMany({
                where: { companyId, createdAt: { lte: filterDate } }
            });
            const expenses = expenseData.reduce((sum, e) => sum + toNumber(e.amount), 0);

            // COGS
            const completedSales = await prisma.sale.findMany({
                where: { userId, status: 'Completed', createdAt: { lte: filterDate } },
                include: { items: { include: { product: true } } }
            });

            let cogs = 0;
            completedSales.forEach(s => {
                if (s.items && Array.isArray(s.items)) {
                    s.items.forEach(item => {
                        if (item.product) {
                            cogs += (toNumber(item.quantity) * toNumber(item.product.costPrice));
                        }
                    });
                }
            });

            calculatedRetainedEarnings = revenue - expenses - cogs;

        } catch (e) {
            console.error("BS_Err_RE:", e);
        }

        const responseData = {
            assets: {
                current: {
                    cashAndBank: totalCashAndBank,
                    accountsReceivable: ar,
                    inventory: inventoryValue
                },
                fixed: fixedAssetsValue,
                total: totalCashAndBank + ar + inventoryValue + fixedAssetsValue
            },
            liabilities: {
                current: {
                    accountsPayable,
                    taxPayable: totalTaxCollected
                },
                longTerm: longTermLoans,
                total: accountsPayable + totalTaxCollected + longTermLoans
            },
            equity: {
                capital: totalCapital,
                retainedEarnings: calculatedRetainedEarnings,
                total: totalCapital + calculatedRetainedEarnings
            }
        };

        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error("BS_Critical_Fail:", error);
        return NextResponse.json({
            error: 'Failed to generate balance sheet',
            details: error.message
        }, { status: 500 });
    }
}
