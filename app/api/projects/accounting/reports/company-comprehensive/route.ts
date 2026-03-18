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
            // Default: All Time (Empty dateFilter means Prisma won't filter by date)
            dateFilter = undefined;
            startDate = undefined;
            endDate = undefined;
        }

        // ==========================================
        // 1. CASH AVAILABLE (Global)
        // ==========================================
        const accounts = await prisma.account.findMany({
            where: {
                companyId,
                type: { in: ['ASSET', 'BANK', 'CASH'] }
            }
        });
        const currentCashBalance = accounts.reduce((sum, acc) => sum + toNumber(acc.balance), 0);


        // ==========================================
        // 2. COMPANY RECEIVABLES (Non-Project)
        // ==========================================
        // Get actual loan transactions linked to company core (projectId: null)
        const loanTransactions = await prisma.transaction.findMany({
            where: {
                companyId,
                projectId: null,
                type: { in: ['DEBT_GIVEN', 'DEBT_TAKEN', 'DEBT_REPAID', 'DEBT_RECEIVED'] }
            },
            include: { customer: true, vendor: true }
        });

        const receivablesMap: Record<string, { customerName: string, amount: number, transactions: any[] }> = {};
        let totalReceivablesValue = 0;

        loanTransactions.forEach(t => {
            const amt = Math.abs(toNumber(t.amount));
            // Customer side debts (given to them or repaid by them)
            if (t.customerId && !t.vendorId) {
                const name = t.customer?.name || 'Macaamiil Kale';
                if (!receivablesMap[name]) {
                    receivablesMap[name] = { customerName: name, amount: 0, transactions: [] };
                }

                if (t.type === 'DEBT_GIVEN') {
                    receivablesMap[name].amount += amt;
                    receivablesMap[name].transactions.push({
                        id: t.id,
                        date: t.transactionDate ? t.transactionDate.toISOString().split('T')[0] : '-',
                        description: t.description || 'Dayn la bixiyay',
                        amount: amt,
                        customerName: name
                    });
                    totalReceivablesValue += amt;
                } else if (t.type === 'DEBT_REPAID') {
                    receivablesMap[name].amount -= amt;
                    receivablesMap[name].transactions.push({
                        id: t.id,
                        date: t.transactionDate ? t.transactionDate.toISOString().split('T')[0] : '-',
                        description: t.description || 'Dayn dib loo bixiyay',
                        amount: -amt,
                        customerName: name
                    });
                    totalReceivablesValue -= amt;
                }
            }
        });

        const totalReceivables = Math.max(0, totalReceivablesValue);


        // ==========================================
        // 3. COMPANY PAYABLES (Non-Project)
        // ==========================================
        const unpaidExpensesList = await prisma.expense.findMany({
            where: {
                companyId,
                projectId: null,
                paymentStatus: { not: 'PAID' }
            },
            include: { vendor: true, employee: true }
        });

        const unpaidCompanyLaborList = await prisma.companyLabor.findMany({
            where: { companyId, remainingWage: { gt: 0 } },
            include: { employee: true }
        });

        const unpaidProjectLaborList = await prisma.projectLabor.findMany({
            where: { 
                project: { companyId },
                remainingWage: { gt: 0 }
            },
            include: { employee: true, project: true }
        });

        // Group Payables
        const unpaidBillsTransactions = unpaidExpensesList
            .filter(e => e.purchaseOrderId === null) // DEDUPLICATION: Skip expenses linked to a PO
            .map(e => ({
                id: e.id,
                date: e.expenseDate ? e.expenseDate.toISOString().split('T')[0] : '-',
                description: e.description || e.category,
                amount: toNumber(e.amount),
                supplierName: e.vendor?.name || e.employee?.fullName || '-'
            }));

        const unpaidLaborTransactions = [
            ...unpaidCompanyLaborList.map(l => ({
                id: l.id,
                date: l.dateWorked ? l.dateWorked.toISOString().split('T')[0] : '-',
                description: `Mushahar: ${l.employee?.fullName || 'Shaqaale'}`,
                amount: toNumber(l.remainingWage),
                employeeName: l.employee?.fullName
            })),
            ...unpaidProjectLaborList.map(l => ({
                id: l.id,
                date: l.dateWorked ? l.dateWorked.toISOString().split('T')[0] : '-',
                description: `Labor (${l.project?.name}): ${l.employee?.fullName || 'Shaqaale'}`,
                amount: toNumber(l.remainingWage),
                employeeName: l.employee?.fullName
            }))
        ];

        // Fetch unpaid POs for total calculation
        const unpaidPOs = await prisma.purchaseOrder.findMany({
            where: { companyId, paymentStatus: { not: 'Paid' } }
        });
        const totalUnpaidPOs = unpaidPOs.reduce((sum, po) => sum + (toNumber(po.total) - toNumber(po.paidAmount)), 0);

        const payablesMap: Record<string, { entityName: string, amount: number, transactions: any[] }> = {};

        loanTransactions.forEach(t => {
            const amt = Math.abs(toNumber(t.amount));
            const name = t.vendor?.name || t.customer?.name || 'Macaamiil Kale';

            // 1. RECEIVABLES (Already handled above, but loansRepaid logic needs to be careful)
            if (t.customerId && !t.vendorId) {
                // ... logic already exists in the file for receivablesMap
            } 
            // 2. PAYABLES: If it's linked to a VENDOR or NO CUSTOMER (Bank/External)
            else {
                const isDebtIncrease = t.type === 'DEBT_TAKEN' || t.type === 'DEBT_RECEIVED';
                const isDebtDecrease = t.type === 'DEBT_REPAID';

                if (isDebtIncrease || isDebtDecrease) {
                    if (!payablesMap[name]) {
                        payablesMap[name] = { entityName: name, amount: 0, transactions: [] };
                    }

                    if (isDebtIncrease) {
                        payablesMap[name].amount += amt;
                        payablesMap[name].transactions.push({
                            id: t.id,
                            date: t.transactionDate ? t.transactionDate.toISOString().split('T')[0] : '-',
                            description: t.description || 'Dayn la qaatay',
                            amount: amt,
                            supplierName: name
                        });
                    } else {
                        payablesMap[name].amount -= amt;
                        payablesMap[name].transactions.push({
                            id: t.id,
                            date: t.transactionDate ? t.transactionDate.toISOString().split('T')[0] : '-',
                            description: t.description || 'Dayn la bixiyay',
                            amount: -amt,
                            supplierName: name
                        });
                    }
                }
            }
        });

        const groupedPayables = Object.values(payablesMap).map(group => ({
            id: `payable-${group.entityName}`,
            date: '-',
            description: `Haraaga: ${group.entityName}`,
            amount: group.amount,
            supplierName: group.entityName,
            isGroup: true,
            transactions: group.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        })).filter(g => g.amount > 0).sort((a, b) => b.amount - a.amount);

        const unpaidBills = unpaidBillsTransactions.reduce((sum, t) => sum + t.amount, 0);
        const totalUnpaidLabor = unpaidLaborTransactions.reduce((sum, t) => sum + t.amount, 0);
        const activeLoansPayable = Object.values(payablesMap).reduce((sum, g) => sum + Math.max(0, g.amount), 0);
        
        const totalPayables = totalUnpaidPOs + unpaidBills + totalUnpaidLabor + activeLoansPayable;


        // ==========================================
        // 4. COMPANY EXPENSES & LABOR (Opex Trends)
        // ==========================================
        const allCompanyExpenses = await prisma.expense.findMany({
            where: {
                companyId,
                projectId: null,
                expenseDate: dateFilter, 
            },
            include: { 
                employee: true,
                vendor: true
            },
            orderBy: { expenseDate: 'asc' }
        });

        // NEW: Fetch Company Labor (Daily/Hourly for non-project)
        const allCompanyLabors = await prisma.companyLabor.findMany({
            where: {
                companyId,
                dateWorked: dateFilter
            },
            include: { employee: true },
            orderBy: { dateWorked: 'asc' }
        });

        const opExMap: Record<string, { amount: number, transactions: any[] }> = {};
        const monthlyTrends: Record<string, number> = {};
        
        const categoryMapping: Record<string, string> = {
            'Labor': 'Mushahaar',
            'Company Labor': 'Mushahaar',
            'Utilities': 'Adeegyada Guud',
            'Company Expense': 'Kharashyo Kale',
            'General': 'Kharashyo Kale',
            'Taxi/Xamaal': 'Taxi',
            'Taxi': 'Taxi',
            'Material': 'Agabka Shirkadda'
        };

        // Process Expenses
        allCompanyExpenses.forEach(e => {
            const desc = (e.description || '').toLowerCase();
            const rawCat = e.category || 'General';
            const rawSub = e.subCategory || '';
            
            let cat = 'Kharashyo Kale'; // Default (Excluded)

            // Keywords
            const laborKeywords = ['mushaar', 'shaqaal', 'manpowe', 'kuuli', 'farsam', 'jibsum', 'wastar', 'work'];
            const utilityKeywords = ['koronto', 'internet', 'wif', 'biyo delivery', 'water', 'saacadalaydh'];
            const excludedKeywords = ['hagajin', 'hagaajin', 'dayactir', 'repair', 'fix', 'kira', 'faat', 'vat', 'transport', 'caano', 'basin', 'furaash', 'furniture', 'hardware', 'refreshment', 'shidaal', 'fuel', 'database'];

            // 1. Identify Labor/Mushahaar (Priority)
            const isLaborRaw = rawCat === 'Labor' || rawCat === 'Company Labor' || rawSub === 'Salary';
            const containsLaborWord = laborKeywords.some(kw => desc.includes(kw));
            const isExcludedFromLabor = desc.includes('transport') || desc.includes('ticket');
            
            if ((isLaborRaw || containsLaborWord) && !isExcludedFromLabor) {
                cat = 'Mushahaar';
            } 
            // 2. Identify Utilities/Adeegyada Guud
            else if (rawCat === 'Utilities' || rawSub === 'Utilities' || utilityKeywords.some(kw => desc.includes(kw))) {
                // Stricter check for utilities: exclude maintenance/misc
                const containsExclusion = excludedKeywords.some(kw => desc.includes(kw));
                if (!containsExclusion) {
                    cat = 'Adeegyada Guud';
                }
            }
            // 3. Other specific categories
            else if (rawCat === 'Taxi' || rawCat === 'Taxi/Xamaal' || desc.includes('taxi') || desc.includes('xamaal')) {
                cat = 'Taxi';
            }
            else if (rawCat === 'Material' || desc.includes('agab')) {
                cat = 'Agabka Shirkadda';
            }
            // 4. Fallback to mapping (if not already handled)
            else if (categoryMapping[rawCat] && cat === 'Kharashyo Kale') {
                cat = categoryMapping[rawCat];
            }
            // 5. EXCLUSION: If it still maps to 'Kharashyo Kale', we skip it as per user request
            if (cat === 'Kharashyo Kale') {
                return; 
            }

            const amt = toNumber(e.amount);
            
            if (!opExMap[cat]) {
                opExMap[cat] = { amount: 0, transactions: [] };
            }
            opExMap[cat].amount += amt;
            opExMap[cat].transactions.push({
                id: e.id,
                date: e.expenseDate ? e.expenseDate.toISOString().split('T')[0] : '-',
                description: e.description || e.category,
                amount: amt,
                employeeName: e.employee?.fullName,
                employeeId: e.employeeId,
                remaining: 0, 
                supplierName: e.vendor?.name || e.supplierName
            });

            if (e.expenseDate) {
                const month = e.expenseDate.toLocaleString('default', { month: 'short', year: '2-digit' });
                monthlyTrends[month] = (monthlyTrends[month] || 0) + amt;
            }
        });

        // Process Company Labor (Merge into Mushahaar)
        allCompanyLabors.forEach(l => {
            const cat = 'Mushahaar';
            const amt = toNumber(l.paidAmount);
            const remaining = toNumber(l.remainingWage);

            if (!opExMap[cat]) {
                opExMap[cat] = { amount: 0, transactions: [] };
            }
            opExMap[cat].amount += amt;
            opExMap[cat].transactions.push({
                id: l.id,
                date: l.dateWorked ? l.dateWorked.toISOString().split('T')[0] : '-',
                description: l.description || 'Labor Payment',
                amount: amt,
                remaining: remaining,
                employeeId: l.employeeId,
                employeeName: l.employee?.fullName
            });

            if (l.dateWorked) {
                const month = l.dateWorked.toLocaleString('default', { month: 'short', year: '2-digit' });
                monthlyTrends[month] = (monthlyTrends[month] || 0) + amt;
            }
        });

        // SPECIAL GROUPING: "Qofkasta wuxuu qabo" and "Daymaha Macaamiisha"
        const expenseBreakdown = Object.entries(opExMap).map(([category, data]) => {
            if (category === 'Mushahaar') {
                const employeeGroups: Record<string, { employeeName: string, amount: number, remaining: number, transactions: any[] }> = {};
                
                data.transactions.forEach(t => {
                    const name = t.employeeName || 'Others';
                    if (!employeeGroups[name]) {
                        employeeGroups[name] = { employeeName: name, amount: 0, remaining: 0, transactions: [] };
                    }
                    employeeGroups[name].amount += t.amount;
                    employeeGroups[name].remaining += (t.remaining || 0);
                    employeeGroups[name].transactions.push(t);
                });

                const groupedTransactions = Object.values(employeeGroups).map(group => ({
                    id: `group-${group.employeeName}`,
                    date: '-',
                    description: `Wadarta: ${group.employeeName}`,
                    amount: group.amount,
                    remaining: group.remaining,
                    employeeName: group.employeeName,
                    isGroup: true,
                    transactions: group.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                })).sort((a, b) => b.amount - a.amount);

                return {
                    category,
                    amount: data.amount,
                    remaining: groupedTransactions.reduce((sum, g) => sum + g.remaining, 0),
                    transactions: groupedTransactions
                };
            }

            return {
                category,
                amount: data.amount,
                transactions: data.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            };
        });

        // Add "Daymaha ka Maqan" (Accounts Receivable) to the breakdown
        if (Object.keys(receivablesMap).length > 0) {
            const groupedReceivables = Object.values(receivablesMap).map(group => ({
                id: `debt-${group.customerName}`,
                date: '-',
                description: `Haraaga: ${group.customerName}`,
                amount: group.amount,
                employeeName: group.customerName, // Reusing field for display
                isGroup: true,
                transactions: group.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            })).sort((a, b) => b.amount - a.amount);

            expenseBreakdown.push({
                category: 'Daymaha ka Maqan',
                amount: totalReceivables,
                transactions: groupedReceivables
            });
        }

        expenseBreakdown.sort((a, b) => b.amount - a.amount);

        const trendList = Object.entries(monthlyTrends).map(([month, amount]) => ({ month, amount }));

        // LIFETIME TOTALS (Must include CompanyLabor too)
        const lifetimeExpenses = await prisma.expense.aggregate({
            where: { companyId, projectId: null },
            _sum: { amount: true }
        });
        
        const lifetimeLabor = await prisma.companyLabor.aggregate({
            where: { companyId },
            _sum: { paidAmount: true }
        });

        const lifetimeDebtRepaid = await prisma.transaction.aggregate({
            where: { companyId, type: 'DEBT_REPAID', projectId: null, expenseId: null },
            _sum: { amount: true }
        });

        const lifetimeTotal = toNumber(lifetimeExpenses._sum.amount) + 
                               toNumber(lifetimeLabor._sum.paidAmount) + 
                               Math.abs(toNumber(lifetimeDebtRepaid._sum.amount));

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


        return NextResponse.json({
            company: {
                name: companyName,
                logoUrl: companyLogoUrl
            },
            dateRange: {
                startDate,
                endDate
            },
            summary: {
                currentCashBalance, 
                totalCompanyExpenses: lifetimeTotal,
                filteredCompanyExpenses: expenseBreakdown.reduce((sum, i) => sum + i.amount, 0),
                totalFixedAssets: totalFixedAssetsVal,
                totalReceivables,
                activeLoansReceivable: totalReceivables, 
                totalPayables,
                unpaidBills: unpaidBills,
                unpaidLabor: totalUnpaidLabor, 
                activeLoansPayable,
                unpaidBillsDetail: { amount: unpaidBills, transactions: unpaidBillsTransactions },
                unpaidLaborDetail: { amount: totalUnpaidLabor, transactions: unpaidLaborTransactions },
                activeLoansPayableDetail: { amount: activeLoansPayable, transactions: groupedPayables },
                netEquity: currentCashBalance + totalFixedAssetsVal + totalReceivables - totalPayables
            },
            breakdowns: {
                expenses: expenseBreakdown,
                fixedAssets: fixedAssetsList,
                trends: trendList
            }
        });

    } catch (error: any) {
        console.error('Company Operations Report API Error:', error);
        return NextResponse.json({ 
            message: 'Server Error', 
            details: error?.message || 'Unknown error' 
        }, { status: 500 });
    }
}
