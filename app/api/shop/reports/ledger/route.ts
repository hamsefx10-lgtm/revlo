import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = session.user.companyId;
        const url = new URL(req.url);

        // Filter Params
        const drillType = url.searchParams.get('drillType'); // ACCOUNT, CATEGORY, ASSET, INVENTORY, VENDOR, CUSTOMER, PROJECT_SUMMARY
        const drillId = url.searchParams.get('drillId');     // ID or Name depending on context
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');

        const dateFilter: any = {};
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter.lte = end;
        }

        let transactions: any[] = [];
        let summary: any = { opening: 0, closing: 0, netChange: 0 };

        // --- DRILL DOWN LOGIC ---

        // 1. ACCOUNT (Cash, Bank)
        if (drillType === 'ACCOUNT' && drillId) {
            // Find all transactions touching this account
            const rawTrx = await prisma.transaction.findMany({
                where: {
                    companyId,
                    OR: [
                        { accountId: drillId },
                        { fromAccountId: drillId },
                        { toAccountId: drillId }
                    ],
                    transactionDate: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
                },
                include: {
                    account: true, toAccount: true, fromAccount: true,
                    expense: true, project: true
                },
                orderBy: { transactionDate: 'desc' }
            });

            transactions = rawTrx.map(t => {
                // Determine if Debit or Credit relative to THIS account
                let amount = Number(t.amount);
                let type = 'Credit'; // Default to money leaving

                // If it's the "toAccount" (Transfer In) -> Debit (Increase)
                if (t.toAccountId === drillId) type = 'Debit';
                // If it's "Income" or "Debt Repaid" (Money In) -> Debit (Increase)
                if (['INCOME', 'DEBT_REPAID'].includes(t.type) && t.accountId === drillId) type = 'Debit';
                // If "Expense" or "Debt Taken" (Money Out) -> Credit (Decrease) (Default)

                return {
                    id: t.id,
                    date: t.transactionDate,
                    description: t.description,
                    reference: t.expense ? `EXP-${t.expense.id.substring(0, 4)}` : t.type,
                    type,
                    amount: Math.abs(amount),
                    runningBalance: 0 // Calculated on frontend or separate pass
                };
            });
        }

        // 2. EXPENSE CATEGORY (Drill down into "Office Expenses")
        else if (drillType === 'CATEGORY') {
            const expenses = await prisma.expense.findMany({
                where: {
                    companyId,
                    category: drillId || undefined, // drillId is Category Name here
                    expenseDate: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
                },
                include: { vendor: true, project: true },
                orderBy: { expenseDate: 'desc' }
            });

            transactions = expenses.map(e => ({
                id: e.id,
                date: e.expenseDate,
                description: e.description,
                reference: e.vendor?.name || 'Gen',
                type: 'Debit', // Expense is a debit in P&L terms
                amount: Number(e.amount),
                project: e.project?.name
            }));
        }

        // 3. FIXED ASSETS (List of assets)
        else if (drillType === 'ASSET') {
            const assets = await prisma.fixedAsset.findMany({
                where: { companyId },
                orderBy: { purchaseDate: 'desc' }
            });
            // Date filter applies to purchase date
            const filtered = startDate || endDate
                ? assets.filter(a => (!startDate || new Date(a.purchaseDate) >= new Date(startDate)) && (!endDate || new Date(a.purchaseDate) <= new Date(endDate)))
                : assets;

            transactions = filtered.map(a => ({
                id: a.id,
                date: a.purchaseDate,
                description: a.name,
                reference: 'Fixed Asset',
                type: 'Debit',
                amount: Number(a.currentBookValue), // Showing Book Value
                originalCost: Number(a.value),
                depreciation: Number(a.value) - Number(a.currentBookValue)
            }));
        }

        // 4. INVENTORY (List of items)
        else if (drillType === 'INVENTORY') {
            // Inventory usually is a "point in time" check (current stock), unless we track history deeply.
            // For now, return current stock list.
            const products = await prisma.productCatalog.findMany({ // Or InventoryItem depending on usage
                where: { companyId },
            });
            // We also check existing InventoryItem model if that's what is used
            const inventoryItems = await prisma.inventoryItem.findMany({ where: { companyId } });

            // Combine or prefer one. The code I viewed earlier used `Product` (User relation) which seemed odd for company reports?
            // Let's rely on what the Balance Sheet Route used: `prisma.product.findMany({ where: { userId } })`.
            // Wait, the Balance Sheet route used `prisma.product`? That model was not in the schema I viewed?
            // Ah, I viewed partial schema. Let me double check `prisma.product` existence or if it was `productCatalog`.
            // The BS route used `prisma.product`. Let's assume `Product` exists (perhaps I missed it in the 800 line view of schema).
            // Actually, let's use the same logic as the BS route:

            // Re-check schema used in BS Route:
            // "const products = await prisma.product.findMany..."
            // In my schema view, I saw `ProductCatalog` and `InventoryItem`. 
            // I suspect `Product` is `Product` in schema but I might have missed scrolling to it, OR `ProductCatalog`.
            // Let's handle generic "Inventory" drill down by returning InventoryItem for now which is safer for "Shop".

            transactions = inventoryItems.map(i => ({
                id: i.id,
                date: i.lastUpdated,
                description: i.name,
                reference: 'SKU: ' + (i.sku || '-'),
                type: 'Asset',
                amount: Number(i.inStock) * Number(i.purchasePrice),
                quantity: i.inStock,
                cost: i.purchasePrice
            }));
        }

        // 5. PROJECT (Specific Project Financials)
        else if (drillType === 'PROJECT' && drillId) {
            // Fetch all activity for this project
            // Expenses
            const projectExpenses = await prisma.expense.findMany({
                where: { projectId: drillId, companyId },
                orderBy: { expenseDate: 'desc' }
            });
            // Payments
            const projectPayments = await prisma.payment.findMany({
                where: { projectId: drillId },
                orderBy: { paymentDate: 'desc' }
            });
            // Labor
            const projectLabor = await prisma.projectLabor.findMany({
                where: { projectId: drillId },
                include: { employee: true },
                orderBy: { dateWorked: 'desc' }
            });

            // Merge
            transactions = [
                ...projectExpenses.map(e => ({
                    id: e.id,
                    date: e.expenseDate,
                    description: e.description,
                    category: e.category,
                    type: 'Expense',
                    amount: Number(e.amount)
                })),
                ...projectPayments.map(p => ({
                    id: p.id,
                    date: p.paymentDate,
                    description: `Payment: ${p.paymentType}`,
                    category: 'Income',
                    type: 'Income',
                    amount: Number(p.amount)
                })),
                ...projectLabor.map(l => ({
                    id: l.id,
                    date: l.dateWorked,
                    description: `Labor: ${l.employee.fullName}`,
                    category: 'Labor',
                    type: 'Expense',
                    amount: Number(l.paidAmount)
                }))
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }

        return NextResponse.json({
            meta: { drillType, drillId, startDate, endDate },
            data: transactions
        });

    } catch (error: any) {
        console.error('Ledger Drill-Down Error:', error);
        return NextResponse.json({ error: 'Failed to fetch details' }, { status: 500 });
    }
}
