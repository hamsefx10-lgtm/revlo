import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';

// Helper to safe cast to Number
function toNumber(val: any): number {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'object' && val !== null && 'toNumber' in val) {
        return Number(val.toNumber());
    }
    const num = Number(val);
    return isNaN(num) ? 0 : num;
}

export async function GET(request: Request) {
    try {
        const sessionData = await getSessionCompanyUser();
        if (!sessionData) {
            return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 401 });
        }
        const { companyId, companyName, companyLogoUrl } = sessionData;

        // Get query parameters for date filtering
        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        // Determine Date Range
        let dateFilter: any = {};
        let startDate: Date | undefined;
        let endDate: Date | undefined;

        if (startDateParam && endDateParam) {
            startDate = new Date(startDateParam);
            endDate = new Date(endDateParam);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            dateFilter = {
                gte: startDate,
                lte: endDate
            };
        } else {
            const today = new Date();
            startDate = new Date(today.getFullYear(), 0, 1);
            endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
            dateFilter = {
                gte: startDate,
                lte: endDate
            };
        }

        // ==========================================
        // 1. CASH AVAILABLE (Lacagta Hada Taala)
        // ==========================================
        // This is a snapshot of all Asset Accounts (Cash + Bank)
        const accounts = await prisma.account.findMany({
            where: {
                companyId,
                type: { in: ['ASSET', 'BANK', 'CASH'] }
            }
        });
        const currentCashBalance = accounts.reduce((sum, acc) => sum + toNumber(acc.balance), 0);


        // ==========================================
        // 2. PROJECT FUNDS (Active vs Completed)
        // ==========================================

        // Fetch projects interacting in this period
        const projects = await prisma.project.findMany({
            where: { companyId },
            include: {
                payments: true, // Incoming money (Advances/Payments)
                expenses: true // Outgoing money
            }
        });

        let completedProjectsProfit = 0;
        let activeProjectsSurplus = 0; // "Lacagta u hadhay"
        let totalProjectDirectCosts = 0;

        projects.forEach(p => {
            // Calculate totals for this project
            // Note: We might want ALL time totals for the project status, or just period?
            // "Profit" is usually total for completed. "Surplus" is current state.
            // If we filter by date, we might miss the big picture of the project.
            // User wants "Profit of Completed Projects" -> This implies final profit.
            // "Remaining funds of Active" -> Current status.
            // Let's use LIFETIME totals for project status calculation to be accurate on "Profit/Surplus",
            // but maybe report it as "Realized/Available in this period"? 
            // Actually, for a Company Report, usually we report what happened in the period.
            // BUT user wording "Lacagta u hadhay" implies current state.

            // Strategy:
            // 1. Completed Projects: (Total Revenue - Total Expenses). 
            //    If completed in this period, count it? Or just list all completed?
            //    Let's filter: If UpdatedAt is in period OR if it has activity. 
            //    For now, let's include ALL Completed (Realized) and ALL Active (Surplus) to give full picture.
            //    If date filter is applied, maybe restrict? 
            //    Let's stick to ALL for the "Balances", but filter transactions for "Flow"?
            //    The user's request is "Calculate Profit of Completed AND Remaining of Active". This sounds like a Position Report (Balance Sheet style).

            const totalRev = p.payments.reduce((sum, pay) => sum + toNumber(pay.amount), 0);
            const totalExp = p.expenses.reduce((sum, e) => sum + toNumber(e.amount), 0);
            const net = totalRev - totalExp;

            if (p.status === 'Completed') {
                completedProjectsProfit += net;
            } else {
                // Active or On Hold
                activeProjectsSurplus += net; // If positive, it's "Remaining Funds". If negative, it's "Company Invested".
            }

            // Track Direct Costs for the period for expense reporting?
            // We'll separate this.
        });


        // ==========================================
        // 3. OTHER INCOME
        // ==========================================
        const otherIncome = await prisma.transaction.findMany({
            where: {
                companyId,
                transactionDate: dateFilter,
                type: 'INCOME',
                projectId: null
            }
        });
        const totalOtherIncome = otherIncome.reduce((sum, t) => sum + toNumber(t.amount), 0);


        // ==========================================
        // 4. OPERATING EXPENSES (OpEx)
        // ==========================================
        const opExExpenses = await prisma.expense.findMany({
            where: {
                companyId,
                expenseDate: dateFilter,
                projectId: null,
                NOT: [
                    { category: { contains: 'Withdrawal', mode: 'insensitive' } },
                    { category: { contains: 'Drawing', mode: 'insensitive' } }
                ]
            },
            include: { expenseCategory: true }
        });

        const opExMap: Record<string, number> = {};
        opExExpenses.forEach(e => {
            const cat = e.category || 'General';
            opExMap[cat] = (opExMap[cat] || 0) + toNumber(e.amount);
        });

        const opExBreakdown = Object.entries(opExMap).map(([category, amount]) => ({
            category,
            amount
        })).sort((a, b) => b.amount - a.amount);

        const totalOpEx = opExBreakdown.reduce((sum, item) => sum + item.amount, 0);


        // ==========================================
        // 5. FIXED ASSETS
        // ==========================================
        const fixedAssets = await prisma.fixedAsset.findMany({
            where: { companyId }
        });
        const totalFixedAssetsVal = fixedAssets.reduce((sum, fa) => sum + toNumber(fa.currentBookValue), 0);
        const fixedAssetsList = fixedAssets.map(fa => ({
            name: fa.name,
            value: toNumber(fa.currentBookValue),
            purchaseDate: fa.purchaseDate,
            type: fa.type
        }));


        // ==========================================
        // SUMMARY TOTALS
        // ==========================================

        // Total "Gains" = Completed Profit + Other Income + (Active Surplus ???)
        // Usually, Active Surplus is Liability (Unearned Revenue). But User sees it as "Money Remaining".
        // Let's display them distinctly.

        // "Net Position" or "Virtual Profit"
        const totalNetPosition = (completedProjectsProfit + totalOtherIncome) - totalOpEx;


        return NextResponse.json({
            company: {
                name: companyName,
                logoUrl: companyLogoUrl
            },
            dateRange: {
                startDate: startDate,
                endDate: endDate
            },
            summary: {
                currentCashBalance, // Real Cash in Hand
                completedProjectsProfit, // Realized Profit
                activeProjectsSurplus,  // Remaining Funds (Liquidity from Projects)
                totalOtherIncome,
                totalOpEx,
                netProfit: totalNetPosition, // (Completed + Other) - OpEx
                totalFixedAssets: totalFixedAssetsVal
            },
            breakdowns: {
                income: [
                    { name: 'Faa\'iidada Mashaariicda Dhammaystiran (Realized)', amount: completedProjectsProfit },
                    { name: 'Lacagta Mashaariicda u Hadhay (Active Surplus)', amount: activeProjectsSurplus },
                    { name: 'Dakhliga Kale (Other Income)', amount: totalOtherIncome }
                ],
                expenses: opExBreakdown,
                fixedAssets: fixedAssetsList
            }
        });

    } catch (error) {
        console.error('Company Report API Error:', error);
        return NextResponse.json({ message: 'Server Error' }, { status: 500 });
    }
}
