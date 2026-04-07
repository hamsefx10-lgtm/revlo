import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';


export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const sessionData = await getSessionCompanyUser();
        if (!sessionData) {
            return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 401 });
        }
        const { companyId, companyName, companyLogoUrl } = sessionData;

        const { searchParams } = new URL(request.url);
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');

        let dateFilter: any = undefined;
        let startDate: Date | undefined;
        let endDate: Date | undefined;

        if (startDateStr && endDateStr) {
            startDate = new Date(startDateStr);
            startDate.setHours(0, 0, 0, 0);

            endDate = new Date(endDateStr);
            endDate.setHours(23, 59, 59, 999);

            dateFilter = {
                gte: startDate,
                lte: endDate,
            };
        }

        // Fetch all projects for the company
        const allProjects = await prisma.project.findMany({
            where: { companyId },
            include: {
                expenses: dateFilter ? {
                    where: { expenseDate: dateFilter },
                    include: { employee: true }
                } : {
                    include: { employee: true }
                },
                transactions: dateFilter ? { where: { transactionDate: dateFilter } } : true,
                laborRecords: dateFilter ? { 
                    where: { dateWorked: dateFilter },
                    include: { employee: true }
                } : {
                    include: { employee: true }
                },
                customer: true,
                materialsUsed: true,
            },
        });

        const reportProjects = [];

        // Summary Aggregations
        let summaryTotalRevenue = 0;
        let summaryTotalExpenses = 0;
        let summaryTotalProfit = 0;
        let totalRemainingAgreement = 0;
        let totalLosses = 0;
        let totalReceivables = 0;
        let totalProjectValue = 0;
        let totalProfitMarginSum = 0;
        let activeProjectsCount = 0;
        let completedProjectsCount = 0;
        let onHoldProjectsCount = 0;

        for (const project of allProjects) {
            // Count Statuses
            if (project.status === 'Active') activeProjectsCount++;
            if (project.status === 'Completed') completedProjectsCount++;
            if (project.status === 'On Hold') onHoldProjectsCount++;

            const proj = project as any;
            // Check if project should be included.
            // Requirement: "include everything that had income/outflow this month, without excluding active projects"
            let hasActivity = false;

            // It's active, always include if requested (or we can just always include if no date filter)
            if (!dateFilter || proj.status === 'Active') {
                hasActivity = true;
            } else if (dateFilter) {
                // If there's a date filter and it's NOT active, only include if it had activity
                if (proj.expenses.length > 0 || proj.transactions.length > 0) {
                    hasActivity = true;
                }
                // Or if it was created/completed in this window
                if (proj.createdAt >= startDate! && proj.createdAt <= endDate!) hasActivity = true;
                if (proj.actualCompletionDate && proj.actualCompletionDate >= startDate! && proj.actualCompletionDate <= endDate!) hasActivity = true;
            }

            if (!hasActivity) continue; // Skip if no relevant data for this period and not active

            const projectValue = Number(proj.agreementAmount) || 0;

            // Calculate Expenses
            let materialCosts = 0;
            let laborCosts = 0;
            let transportCosts = 0;
            let equipmentCosts = 0;
            let utilitiesCosts = 0;
            let consultancyCosts = 0;
            let totalExpenses = 0;

            const mappedExpenses: any[] = [];
            const processedLaborExpenseIds = new Set();

            proj.expenses.forEach((exp: any) => {
                const amt = Number(exp.amount) || 0;
                totalExpenses += amt;

                if (exp.category === 'Material') materialCosts += amt;
                if (exp.category === 'Labor') laborCosts += amt;
                if (exp.category === 'Transport') transportCosts += amt;
                if (exp.category === 'Equipment') equipmentCosts += amt;
                if (exp.category === 'Utilities') utilitiesCosts += amt;
                if (exp.category === 'Consultancy' || exp.category === 'Subcontractor') consultancyCosts += amt;

                mappedExpenses.push({
                    id: exp.id,
                    category: exp.category,
                    subCategory: exp.subCategory,
                    description: exp.description,
                    amount: amt,
                    date: exp.expenseDate.toISOString().split('T')[0],
                    employeeName: exp.employee?.fullName || exp.supplierName || null,
                    materials: exp.materials,
                });
            });

            // Add Labor Records ONLY if they are not already counted in expenses
            // Note: ProjectLabor usually tracks what's agreed/paid to a worker, 
            // while Expense tracks the actual money leaving the account.
            // If the user already recorded an Expense for a labor payment, 
            // adding the LR paidAmount is a double-count.
            // For now, we prioritize Expenses as the source of truth for 'Total Expenses',
            // and only add LR paidAmount if the direct labor costs in Expenses are 0
            // OR if the LR record explicitly represents a DIFFERENT payment.
            // SIMPLIFIED FIX: In this system, Labor Expenses are the primary record.
            // We will NOT add LR paidAmount to totalExpenses if laborExpenses already exist,
            // or we will only add the difference if LR is higher.
            
            // Actually, let's treat LR as a record of commitment, and Expenses as truth.
            // If LR has paidAmount but there's no corresponding Labor expense, then add it.
            for (const lr of (proj.laborRecords || [])) {
                const amt = Number(lr.paidAmount || 0);
                
                // If we already have labor expenses, we assume they cover these payments
                // UNLESS the labor record description doesn't match any labor expense.
                // For a safe fix that doesn't miss data: 
                // We'll ONLY add LR paidAmount if total Labor category expenses are 0
                // OR if the LR is specifically for an employee who has NO labor expenses.
                
                const employeeHasExpense = proj.expenses.some((e: any) => 
                    e.category === 'Labor' && (e.employeeId === lr.employeeId || e.description.toLowerCase().includes(lr.employee?.fullName?.toLowerCase() || ''))
                );

                if (amt > 0 && !employeeHasExpense) {
                    laborCosts += amt;
                    totalExpenses += amt;
                    mappedExpenses.push({
                        id: lr.id,
                        category: 'Labor',
                        description: `Labor: ${lr.description || 'Shaqo'}`,
                        amount: amt,
                        date: (lr.dateWorked as Date).toISOString().split('T')[0],
                        employeeName: lr.employee?.fullName || 'Shaqaale'
                    });
                }
            }

            // Calculate Revenue / Transactions logic synced with Project ID page
            const advancePaid = Number(proj.advancePaid) || 0;
            let totalRevenueFromTransactions = 0;
            let mappedTransactions = [];
            let mappedPayments = [];
            let unlinkedVendorRepayments = 0;

            for (const trx of (proj.transactions || [])) {
                const amt = Math.abs(Number(trx.amount) || 0);

                mappedTransactions.push({
                    id: trx.id,
                    type: trx.type,
                    description: trx.description || '',
                    amount: Number(trx.amount),
                    date: trx.transactionDate.toISOString().split('T')[0]
                });

                // Customer Income (REPAID DEBT) - Skip INCOME type to avoid double-counting advance
                if (trx.type === 'DEBT_REPAID' && (trx.customerId || !trx.vendorId)) {
                    totalRevenueFromTransactions += amt;
                    mappedPayments.push({
                        id: trx.id,
                        amount: amt,
                        date: trx.transactionDate.toISOString().split('T')[0],
                        description: trx.description || 'Gidka Daynta (Customer)'
                    });
                }

                // Unlinked Vendor Repayments (Expenses)
                if (trx.type === 'DEBT_REPAID' && trx.vendorId && !trx.expenseId) {
                    unlinkedVendorRepayments += amt;
                    totalExpenses += amt;
                    mappedExpenses.push({
                        id: trx.id,
                        category: 'Debt Repayment',
                        description: trx.description || 'Gidka Daynta (Vendor)',
                        amount: amt,
                        date: trx.transactionDate.toISOString().split('T')[0],
                        employeeName: 'Vendor'
                    });
                }
            }

            // Total Revenue = Advance (Base) + Customer debt repayments
            const totalRevenue = advancePaid + totalRevenueFromTransactions;

            // Remaining Revenue correctly allows negative for overpayment
            const remainingRevenue = projectValue - totalRevenue;
            
            // ACTUAL PROFIT: Cash-based (Revenue Collected - Expenses)
            const grossProfit = totalRevenue - totalExpenses;
            
            // PROJECTED PROFIT: Contract-based (Agreement - Expenses)
            const projectedProfit = projectValue - totalExpenses;

            const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
            const completionPercentage = projectValue > 0 ? (totalRevenue / projectValue) * 100 : 0;

            summaryTotalRevenue += totalRevenue;
            summaryTotalExpenses += totalExpenses;
            // Summary Profit remains Cash-based (Collected - Spent) for tax/cashflow purposes
            summaryTotalProfit += (totalRevenue - totalExpenses);

            const receivables = Math.max(0, totalExpenses - totalRevenue);
            totalReceivables += receivables;
            totalProjectValue += projectValue;

            if (!isNaN(remainingRevenue) && remainingRevenue > 0) {
                totalRemainingAgreement += remainingRevenue;
            }
            if (grossProfit < 0) totalLosses += Math.abs(grossProfit);

            reportProjects.push({
                id: project.id,
                name: project.name,
                status: project.status,
                customer: project.customer?.name || 'Lama garanayo',
                startDate: project.createdAt.toISOString().split('T')[0],
                expectedCompletionDate: project.expectedCompletionDate ? project.expectedCompletionDate.toISOString().split('T')[0] : 'Lama sheegin',
                actualCompletionDate: project.actualCompletionDate ? project.actualCompletionDate.toISOString().split('T')[0] : 'Kama dambayn',
                projectValue,
                totalRevenue,
                totalPayments: totalRevenue, // simplified
                remainingRevenue,
                materialCosts,
                laborCosts,
                transportCosts,
                equipmentCosts,
                utilitiesCosts,
                consultancyCosts,
                totalExpenses,
                grossProfit,
                profitMargin,
                completionPercentage,
                expenseCount: mappedExpenses.length,
                transactionCount: mappedTransactions.length,
                paymentCount: mappedPayments.length,
                receivables,
                projectedProfit,
                expenses: mappedExpenses,
                transactions: mappedTransactions,
                payments: mappedPayments,
                materialsUsed: proj.materialsUsed || []
            });
        }

        const averageProfitMargin = summaryTotalRevenue > 0
            ? (summaryTotalProfit / summaryTotalRevenue) * 100
            : 0;

        return NextResponse.json({
            companyName: companyName || 'Shirkadda',
            companyLogoUrl: companyLogoUrl || null,
            startDate: startDateStr,
            endDate: endDateStr,
            projects: reportProjects,
            summary: {
                totalProjects: reportProjects.length,
                activeProjects: activeProjectsCount,
                completedProjects: completedProjectsCount,
                onHoldProjects: onHoldProjectsCount,
                totalRevenue: summaryTotalRevenue,
                totalExpenses: summaryTotalExpenses,
                totalProfit: summaryTotalProfit,
                totalRemainingAgreement: Number(totalRemainingAgreement || 0),
                totalLosses,
                totalReceivables,
                totalProjectValue,
                averageProfitMargin
            }
        });

    } catch (error) {
        console.error('Project reports error:', error);
        return NextResponse.json({ message: 'Cilad server' }, { status: 500 });
    }
}
