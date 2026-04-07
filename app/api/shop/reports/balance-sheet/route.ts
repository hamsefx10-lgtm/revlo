import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Helper to safe cast to Number
function toNumber(val: any): number {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'object' && val !== null && 'toNumber' in val) {
        return Number(val.toNumber());
    }
    const num = Number(val);
    return isNaN(num) ? 0 : num;
}


export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const companyId = session.user.companyId;
        const url = new URL(req.url);

        // PARAMS
        const projectId = url.searchParams.get('projectId');
        const dateParam = url.searchParams.get('date');
        const filterDate = dateParam ? new Date(dateParam) : new Date();
        filterDate.setHours(23, 59, 59, 999);

        // FILTERS
        const commonFilter = {
            companyId,
            ...(projectId ? { projectId } : {}),
            createdAt: { lte: filterDate }
        };

        const transactionFilter = {
            companyId,
            ...(projectId ? { projectId } : {}),
            transactionDate: { lte: filterDate }
        };

        // --- 1. ASSETS ---
        let totalCashAndBank = 0;
        let inventoryValue = 0;
        let fixedAssetsValue = 0;
        let ar = 0;
        let wipValue = 0;

        // A. CASH & BANK (Financial Accounts)
        if (!projectId) {
            const accounts = await prisma.account.findMany({ where: { companyId } });
            totalCashAndBank = accounts.reduce((sum, acc) => sum + toNumber(acc.balance), 0);
        }

        // C. INVENTORY
        if (!projectId) {
            const inventoryItems = await prisma.inventoryItem.findMany({
                where: { companyId }
            });
            if (inventoryItems.length > 0) {
                inventoryValue = inventoryItems.reduce((sum, item) => sum + (toNumber(item.inStock) * toNumber(item.purchasePrice)), 0);
            }

            const activeProjectsExpenses = await prisma.expense.aggregate({
                where: {
                    companyId,
                    project: { status: 'Active' },
                    createdAt: { lte: filterDate }
                },
                _sum: { amount: true }
            });
            wipValue = toNumber(activeProjectsExpenses._sum.amount);
        }

        // C. FIXED ASSETS
        if (!projectId) {
            const assets = await prisma.fixedAsset.findMany({
                where: {
                    companyId,
                    purchaseDate: { lte: filterDate }
                }
            });
            fixedAssetsValue = assets.reduce((sum, fa) => sum + toNumber(fa.currentBookValue), 0);
        }

        // D. ACCOUNTS RECEIVABLE
        if (!projectId) {
            const unpaidSales = await prisma.sale.findMany({
                where: { userId, createdAt: { lte: filterDate }, paymentStatus: { not: 'Paid' } }
            });
            const shopAr = unpaidSales.reduce((sum, sale) => sum + (toNumber(sale.total) - toNumber(sale.paidAmount)), 0);

            const completedProjects = await prisma.project.findMany({
                where: { companyId, status: 'Completed' },
                include: { payments: true }
            });

            let projectsAr = 0;
            completedProjects.forEach(p => {
                const totalPaid = p.payments.reduce((s, pay) => s + toNumber(pay.amount), 0) + toNumber(p.advancePaid);
                const due = Math.max(0, toNumber(p.agreementAmount) - totalPaid);
                projectsAr += due;
            });

            ar = shopAr + projectsAr;
        }

        // --- 2. LIABILITIES ---
        let accountsPayable = 0;
        let taxPayable = 0;
        let longTermLoans = 0;
        let unearnedRevenue = 0;

        const unpaidExpenses = await prisma.expense.findMany({
            where: {
                ...commonFilter,
                paymentStatus: 'UNPAID'
            }
        });
        accountsPayable = unpaidExpenses.reduce((sum, e) => sum + toNumber(e.amount), 0);

        if (!projectId) {
            const allSales = await prisma.sale.findMany({
                where: { userId, createdAt: { lte: filterDate } },
                select: { tax: true }
            });
            taxPayable = allSales.reduce((sum, s) => sum + toNumber(s.tax), 0);

            const activeProjects = await prisma.project.findMany({
                where: { companyId, status: 'Active' },
                include: { payments: true }
            });

            activeProjects.forEach(p => {
                const advances = toNumber(p.advancePaid);
                const payments = p.payments.reduce((s, pay) => s + toNumber(pay.amount), 0);
                unearnedRevenue += (advances + payments);
            });

            const debts = await prisma.transaction.findMany({
                where: {
                    ...transactionFilter,
                    type: { in: ['DEBT_TAKEN', 'DEBT_REPAID'] }
                }
            });
            debts.forEach(t => {
                const amt = toNumber(t.amount);
                if (t.type === 'DEBT_TAKEN') longTermLoans += amt;
                if (t.type === 'DEBT_REPAID') longTermLoans -= amt;
            });
        }

        // --- 3. EQUITY ---
        let totalCapital = 0;
        let retainedEarnings = 0;

        if (!projectId) {
            const capitalTx = await prisma.transaction.findMany({
                where: {
                    ...transactionFilter,
                    OR: [
                        { shareholderId: { not: null } },
                        { category: { equals: 'Capital', mode: 'insensitive' } }
                    ]
                }
            });
            totalCapital = capitalTx.reduce((sum, t) => {
                if (['INCOME', 'OTHER'].includes(t.type)) return sum + toNumber(t.amount);
                return sum;
            }, 0);
        }

        let revenue = 0;
        if (projectId) {
            const project = await prisma.project.findUnique({ where: { id: projectId } });
            if (project && project.status === 'Completed') {
                revenue = toNumber(project.agreementAmount);
            }
        } else {
            const saleData = await prisma.sale.findMany({
                where: { userId, createdAt: { lte: filterDate } },
                select: { subtotal: true }
            });
            const shopRevenue = saleData.reduce((sum, s) => sum + toNumber(s.subtotal), 0);

            const completedProjects = await prisma.project.findMany({
                where: { companyId, status: 'Completed' }
            });
            const projectsRevenue = completedProjects.reduce((sum, p) => sum + toNumber(p.agreementAmount), 0);

            revenue = shopRevenue + projectsRevenue;
        }

        const allExpenses = await prisma.expense.findMany({
            where: {
                ...commonFilter,
                OR: [
                    { projectId: null },
                    { project: { status: { not: 'Active' } } }
                ]
            }
        });
        const totalExps = allExpenses.reduce((sum, e) => sum + toNumber(e.amount), 0);

        let cogs = 0;
        if (!projectId) {
            const completedSales = await prisma.sale.findMany({
                where: { userId, status: 'Completed', createdAt: { lte: filterDate } },
                include: { items: { include: { product: true } } }
            });
            completedSales.forEach(s => {
                if (s.items && Array.isArray(s.items)) {
                    s.items.forEach(item => {
                        if (item.product) {
                            cogs += (toNumber(item.quantity) * toNumber(item.product.costPrice));
                        }
                    });
                }
            });
        }

        retainedEarnings = revenue - totalExps - cogs;

        const responseData = {
            assets: {
                current: {
                    cashAndBank: { value: totalCashAndBank, drillType: 'ACCOUNT', drillId: 'all' },
                    accountsReceivable: { value: ar, drillType: 'CUSTOMER', drillId: 'all' },
                    inventory: { value: inventoryValue, drillType: 'INVENTORY', drillId: 'all' },
                    workInProgress: { value: wipValue, drillType: 'PROJECT', drillId: 'active' }
                },
                fixed: { value: fixedAssetsValue, drillType: 'ASSET', drillId: 'all' },
                total: totalCashAndBank + ar + inventoryValue + fixedAssetsValue + wipValue
            },
            liabilities: {
                current: {
                    accountsPayable: { value: accountsPayable, drillType: 'CATEGORY', drillId: 'Payables' },
                    taxPayable: { value: taxPayable, drillType: 'TAX', drillId: 'all' },
                    unearnedRevenue: { value: unearnedRevenue, drillType: 'PROJECT', drillId: 'active' }
                },
                longTerm: { value: longTermLoans, drillType: 'ACCOUNT', drillId: 'Loans' },
                total: accountsPayable + taxPayable + longTermLoans + unearnedRevenue
            },
            equity: {
                capital: { value: totalCapital, drillType: 'SHAREHOLDER', drillId: 'all' },
                retainedEarnings: { value: retainedEarnings, drillType: 'PROFIT_LOSS', drillId: 'all' },
                total: totalCapital + retainedEarnings
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
