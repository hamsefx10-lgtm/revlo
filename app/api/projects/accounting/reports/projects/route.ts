import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';

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
                customer: true,
            },
        });

        const reportProjects = [];

        // Summary Aggregations
        let summaryTotalRevenue = 0;
        let summaryTotalExpenses = 0;
        let summaryTotalProfit = 0;
        let activeProjectsCount = 0;
        let completedProjectsCount = 0;
        let onHoldProjectsCount = 0;

        for (const project of allProjects) {
            // Count Statuses
            if (project.status === 'Active') activeProjectsCount++;
            if (project.status === 'Completed') completedProjectsCount++;
            if (project.status === 'On Hold') onHoldProjectsCount++;

            // Check if project should be included.
            // Requirement: "include everything that had income/outflow this month, without excluding active projects"
            let hasActivity = false;

            // It's active, always include if requested (or we can just always include if no date filter)
            if (!dateFilter || project.status === 'Active') {
                hasActivity = true;
            } else if (dateFilter) {
                // If there's a date filter and it's NOT active, only include if it had activity
                if (project.expenses.length > 0 || project.transactions.length > 0) {
                    hasActivity = true;
                }
                // Or if it was created/completed in this window
                if (project.createdAt >= startDate! && project.createdAt <= endDate!) hasActivity = true;
                if (project.actualCompletionDate && project.actualCompletionDate >= startDate! && project.actualCompletionDate <= endDate!) hasActivity = true;
            }

            if (!hasActivity) continue; // Skip if no relevant data for this period and not active

            const projectValue = Number(project.agreementAmount) || 0;

            // Calculate Expenses
            let materialCosts = 0;
            let laborCosts = 0;
            let transportCosts = 0;
            let equipmentCosts = 0;
            let utilitiesCosts = 0;
            let consultancyCosts = 0;
            let totalExpenses = 0;

            const mappedExpenses = project.expenses.map(exp => {
                const amt = Number(exp.amount) || 0;
                totalExpenses += amt;

                if (exp.category === 'Material') materialCosts += amt;
                if (exp.category === 'Labor') laborCosts += amt;
                if (exp.category === 'Transport') transportCosts += amt;
                if (exp.category === 'Equipment') equipmentCosts += amt;
                if (exp.category === 'Utilities') utilitiesCosts += amt;
                if (exp.category === 'Consultancy' || exp.category === 'Subcontractor') consultancyCosts += amt;

                return {
                    id: exp.id,
                    category: exp.category,
                    description: exp.description,
                    amount: amt,
                    date: exp.expenseDate.toISOString().split('T')[0],
                    employeeName: exp.employee?.fullName || exp.supplierName || null,
                    // Additional info mapping could go here if Prisma schema has them
                };
            });

            // Calculate Revenue / Transactions
            let totalRevenue = (Number(project.advancePaid) || 0); // Always count advance if no filter? 
            // Better: transactions hold the exact data of inflows!
            let totalTransactions = 0;
            let mappedTransactions = [];
            let mappedPayments = [];

            for (const trx of project.transactions) {
                const amt = Number(trx.amount) || 0;
                totalTransactions += amt;

                mappedTransactions.push({
                    id: trx.id,
                    type: trx.type,
                    description: trx.description || '',
                    amount: amt,
                    date: trx.transactionDate.toISOString().split('T')[0]
                });

                // If it's an inflow to the project (customer paying us)
                if (trx.type === 'INCOME' || (trx.type === 'DEBT_REPAID' && !!trx.customerId)) {
                    totalRevenue += amt;
                    mappedPayments.push({
                        id: trx.id,
                        amount: amt,
                        date: trx.transactionDate.toISOString().split('T')[0],
                        description: trx.description || 'Lacag bixin'
                    });
                }
            }

            // Since advancePaid is often not strictly recorded as a transaction DATE inside the project filter, 
            // if we are looking at ALL time (no date filter), we just use advancePaid + incomes. 
            // Actually, if we use transactions, advancePaid is usually captured as an 'INCOME' transaction.
            // Let's rely strictly on the transactions collected during this period for totalRevenue.

            // Wait, if no date filter, we use the project's overall advancePaid + incomes.
            if (!dateFilter) {
                totalRevenue = Number(project.advancePaid) || 0;
                // add other incomes if they aren't part of advancePaid, but let's assume they are stored in transactions properly now.
            }

            const remainingRevenue = Math.max(0, projectValue - totalRevenue);
            const grossProfit = totalRevenue - totalExpenses;
            const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
            const completionPercentage = projectValue > 0 ? (totalRevenue / projectValue) * 100 : 0;

            summaryTotalRevenue += totalRevenue;
            summaryTotalExpenses += totalExpenses;
            summaryTotalProfit += grossProfit;

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
                expenses: mappedExpenses,
                transactions: mappedTransactions,
                payments: mappedPayments
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
                averageProfitMargin
            }
        });

    } catch (error) {
        console.error('Project reports error:', error);
        return NextResponse.json({ message: 'Cilad server' }, { status: 500 });
    }
}
