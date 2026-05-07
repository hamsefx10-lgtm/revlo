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

        // Fetch ALL projects for the company — always include ALL data (no date filter on includes)
        // Date filter is only used for activity-based inclusion logic, NOT for filtering expenses/transactions
        const allProjects = await prisma.project.findMany({
            where: { companyId },
            include: {
                expenses: {
                    include: {
                        employee: { select: { id: true, fullName: true } },
                        account: { select: { id: true, name: true } },
                    },
                    orderBy: { expenseDate: 'desc' }
                },
                transactions: {
                    include: {
                        employee: { select: { id: true, fullName: true } },
                        vendor: { select: { id: true, name: true } },
                        customer: { select: { id: true, name: true } },
                        account: { select: { id: true, name: true } },
                    },
                    orderBy: { transactionDate: 'desc' }
                },
                laborRecords: {
                    include: { employee: { select: { id: true, fullName: true } } },
                    orderBy: { dateWorked: 'desc' }
                },
                customer: true,
                materialsUsed: true,
                payments: true,
                company: { select: { id: true, name: true, logoUrl: true } },
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
        let activeProjectsCount = 0;
        let completedProjectsCount = 0;
        let onHoldProjectsCount = 0;

        for (const project of allProjects) {
            // Count Statuses
            if (project.status === 'Active') activeProjectsCount++;
            if (project.status === 'Completed') completedProjectsCount++;
            if (project.status === 'On Hold') onHoldProjectsCount++;

            const proj = project as any;

            // Include ALL projects — no date-based exclusion anymore
            const projectValue = Number(proj.agreementAmount) || 0;

            // Calculate Expenses — ALL TIME
            let materialCosts = 0;
            let laborCosts = 0;
            let transportCosts = 0;
            let equipmentCosts = 0;
            let utilitiesCosts = 0;
            let consultancyCosts = 0;
            let totalExpenses = 0;

            const mappedExpenses: any[] = [];
            const expensesByCategory: Record<string, any[]> = {};

            proj.expenses.forEach((exp: any) => {
                const amt = Number(exp.amount) || 0;
                totalExpenses += amt;

                const cat = exp.category || 'Other';
                if (cat === 'Material') materialCosts += amt;
                if (cat === 'Labor') laborCosts += amt;
                if (cat === 'Transport') transportCosts += amt;
                if (cat === 'Equipment') equipmentCosts += amt;
                if (cat === 'Utilities') utilitiesCosts += amt;
                if (cat === 'Consultancy' || cat === 'Subcontractor') consultancyCosts += amt;

                const mappedExp = {
                    id: exp.id,
                    category: cat,
                    subCategory: exp.subCategory,
                    description: exp.description,
                    amount: amt,
                    date: exp.expenseDate.toISOString().split('T')[0],
                    employeeName: exp.employee?.fullName || null,
                    supplierName: exp.supplierName || null,
                    materials: exp.materials,
                    accountName: exp.account?.name || null,
                };

                mappedExpenses.push(mappedExp);

                if (!expensesByCategory[cat]) expensesByCategory[cat] = [];
                expensesByCategory[cat].push(mappedExp);
            });

            // Add Labor Records ONLY if they are not already counted in expenses
            for (const lr of (proj.laborRecords || [])) {
                const amt = Number(lr.paidAmount || 0);
                const employeeHasExpense = proj.expenses.some((e: any) =>
                    e.category === 'Labor' && (e.employeeId === lr.employeeId || (e.description || '').toLowerCase().includes((lr.employee?.fullName || '').toLowerCase()))
                );

                if (amt > 0 && !employeeHasExpense) {
                    laborCosts += amt;
                    totalExpenses += amt;
                    const mappedExp = {
                        id: lr.id,
                        category: 'Labor',
                        description: `Labor: ${lr.description || 'Shaqo'}`,
                        amount: amt,
                        date: lr.dateWorked ? (lr.dateWorked as Date).toISOString().split('T')[0] : '-',
                        employeeName: lr.employee?.fullName || 'Shaqaale',
                    };
                    mappedExpenses.push(mappedExp);
                    if (!expensesByCategory['Labor']) expensesByCategory['Labor'] = [];
                    expensesByCategory['Labor'].push(mappedExp);
                }
            }

            // ====== LABOR BREAKDOWN (grouped by employee) ======
            const laborMap: Record<string, { employeeName: string; totalPaid: number; items: any[] }> = {};

            // From expenses with category 'Labor'
            proj.expenses
                .filter((e: any) => e.category === 'Labor')
                .forEach((e: any) => {
                    const key = e.employee?.id || e.employeeId || e.description || e.id;
                    const name = e.employee?.fullName || e.description || 'Shaqaale';
                    if (!laborMap[key]) laborMap[key] = { employeeName: name, totalPaid: 0, items: [] };
                    const amt = Number(e.amount) || 0;
                    laborMap[key].totalPaid += amt;
                    laborMap[key].items.push({
                        date: e.expenseDate.toISOString().split('T')[0],
                        description: e.description,
                        amount: amt,
                        accountName: e.account?.name || null,
                    });
                });

            // From labor records NOT covered by expenses
            for (const lr of (proj.laborRecords || [])) {
                const amt = Number(lr.paidAmount || 0);
                if (amt <= 0) continue;
                const employeeHasExpense = proj.expenses.some((e: any) =>
                    e.category === 'Labor' && (e.employeeId === lr.employeeId || (e.description || '').toLowerCase().includes((lr.employee?.fullName || '').toLowerCase()))
                );
                if (!employeeHasExpense) {
                    const key = lr.employee?.id || lr.employeeId || lr.id;
                    const name = lr.employee?.fullName || lr.employeeName || 'Shaqaale';
                    if (!laborMap[key]) laborMap[key] = { employeeName: name, totalPaid: 0, items: [] };
                    laborMap[key].totalPaid += amt;
                    laborMap[key].items.push({
                        date: lr.dateWorked ? (lr.dateWorked as Date).toISOString().split('T')[0] : '-',
                        description: lr.description || 'Shaqo',
                        amount: amt,
                    });
                }
            }

            const laborBreakdown = Object.values(laborMap).sort((a, b) => b.totalPaid - a.totalPaid);

            // ====== REVENUE / TRANSACTIONS ======
            const advancePaid = Number(proj.advancePaid) || 0;
            let totalRevenueFromTransactions = 0;
            let mappedPayments: any[] = [];
            let unlinkedVendorRepayments = 0;

            for (const trx of (proj.transactions || [])) {
                const amt = Math.abs(Number(trx.amount) || 0);

                // Customer Income (REPAID DEBT)
                if (trx.type === 'DEBT_REPAID' && (trx.customerId || !trx.vendorId)) {
                    totalRevenueFromTransactions += amt;
                    mappedPayments.push({
                        id: trx.id,
                        amount: amt,
                        date: trx.transactionDate.toISOString().split('T')[0],
                        description: trx.description || 'Gidka Daynta (Customer)',
                        customerName: trx.customer?.name || null,
                        accountName: trx.account?.name || null,
                    });
                }

                // Unlinked Vendor Repayments (count as expenses)
                if (trx.type === 'DEBT_REPAID' && trx.vendorId && !trx.expenseId) {
                    unlinkedVendorRepayments += amt;
                    totalExpenses += amt;
                    const mappedExp = {
                        id: trx.id,
                        category: 'Debt Repayment',
                        description: trx.description || 'Gidka Daynta (Vendor)',
                        amount: amt,
                        date: trx.transactionDate.toISOString().split('T')[0],
                        employeeName: trx.vendor?.name || 'Vendor',
                    };
                    mappedExpenses.push(mappedExp);
                    if (!expensesByCategory['Debt Repayment']) expensesByCategory['Debt Repayment'] = [];
                    expensesByCategory['Debt Repayment'].push(mappedExp);
                }
            }

            // Total Revenue = Advance (Base) + Customer debt repayments
            const totalRevenue = advancePaid + totalRevenueFromTransactions;
            const remainingRevenue = projectValue - totalRevenue;
            const grossProfit = totalRevenue - totalExpenses;
            const projectedProfit = projectValue - totalExpenses;
            const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
            const completionPercentage = projectValue > 0 ? (totalRevenue / projectValue) * 100 : 0;

            summaryTotalRevenue += totalRevenue;
            summaryTotalExpenses += totalExpenses;
            summaryTotalProfit += (totalRevenue - totalExpenses);

            // Receivables = daynta macmiilku wali ku leeyahay = qiimaha heshiiska - lacagta la helay
            const receivables = Math.max(0, remainingRevenue);
            totalReceivables += receivables;
            totalProjectValue += projectValue;

            if (!isNaN(remainingRevenue) && remainingRevenue > 0) {
                totalRemainingAgreement += remainingRevenue;
            }
            if (grossProfit < 0) totalLosses += Math.abs(grossProfit);

            // ====== MATERIALS USED ======
            const mappedMaterials = (proj.materialsUsed || []).map((m: any) => ({
                id: m.id,
                name: m.name,
                quantityUsed: Number(m.quantityUsed) || 0,
                unit: m.unit || '',
                costPerUnit: Number(m.costPerUnit) || 0,
                leftoverQty: Number(m.leftoverQty) || 0,
                totalCost: (Number(m.quantityUsed) || 0) * (Number(m.costPerUnit) || 0),
                dateUsed: m.dateUsed ? new Date(m.dateUsed).toISOString().split('T')[0] : null,
            }));

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
                totalPayments: totalRevenue,
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
                paymentCount: mappedPayments.length,
                receivables,
                projectedProfit,
                expenses: mappedExpenses,
                expensesByCategory,
                laborBreakdown,
                payments: mappedPayments,
                materialsUsed: mappedMaterials,
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
