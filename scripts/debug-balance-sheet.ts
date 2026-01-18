import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugBalanceSheet() {
    try {
        console.log("Starting Debug...");

        // 1. Get a user to test with
        const user = await prisma.user.findFirst();
        if (!user) {
            console.error("No user found!");
            return;
        }
        console.log(`Testing with User: ${user.id} (${user.email}), Company: ${user.companyId ?? 'No Company'}`);

        const userId = user.id;
        const companyId = user.companyId ?? 'missing-company-id';

        // A. Financial Accounts (Cash, Bank, Mobile)
        console.log("--> Fetching Financial Accounts...");
        const financialAccounts = await prisma.account.findMany({
            where: { companyId: companyId }
        });
        console.log(`--> Found ${financialAccounts.length} accounts.`);
        const totalCashAndBank = financialAccounts.reduce((sum, acc) => sum + acc.balance, 0);

        // C. Inventory Asset
        console.log("--> Fetching Inventory...");
        const products = await prisma.product.findMany({
            where: { userId: userId },
            select: { stock: true, costPrice: true }
        });
        console.log(`--> Found ${products.length} products.`);
        const inventoryValue = products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);

        // D. Fixed Assets
        console.log("--> Fetching Fixed Assets...");
        const fixedAssets = await prisma.fixedAsset.findMany({
            where: { companyId: companyId }
        });
        console.log(`--> Found ${fixedAssets.length} fixed assets.`);
        const fixedAssetsValue = fixedAssets.reduce((sum, fa) => sum + Number(fa.currentBookValue), 0);

        // 2. LIABILITIES
        // A. Accounts Payable (Unpaid Purchase Orders)
        console.log("--> Fetching Unpaid POs...");
        const unpaidPOs = await prisma.purchaseOrder.findMany({
            where: {
                userId: userId,
                paymentStatus: { not: 'Paid' }
            }
        });
        console.log(`--> Found ${unpaidPOs.length} unpaid POs.`);
        const accountsPayable = unpaidPOs.reduce((sum, po) => sum + (po.total - po.paidAmount), 0);

        // B. Tax Payable
        console.log("--> Fetching Sales for Tax...");
        const allSales = await prisma.sale.findMany({
            where: { userId: userId }
        });
        console.log(`--> Found ${allSales.length} total sales.`);
        const totalTaxCollected = allSales.reduce((sum, s) => sum + s.tax, 0);

        // 3. EQUITY
        // A. Shareholder Capital
        console.log("--> Fetching Shareholders...");
        const shareholders = await prisma.shareholder.findMany({
            where: { companyId: companyId }
        });
        console.log(`--> Found ${shareholders.length} shareholders.`);
        const totalCapital = shareholders.reduce((sum, sh) => sum + 0 /* sh.totalInvested */, 0);

        // B. Retained Earnings
        // Expenses
        console.log("--> Fetching Expenses...");
        const allExpenses = await prisma.expense.findMany({
            where: { companyId: companyId }
        });
        console.log(`--> Found ${allExpenses.length} expenses.`);

        // Sales Items for COGS
        console.log("--> Fetching Completed Sales for COGS...");
        const completedSales = await prisma.sale.findMany({
            where: { userId: userId, status: 'Completed' },
            include: { items: { include: { product: true } } }
        });
        console.log(`--> Found ${completedSales.length} completed sales.`);

        let totalCOGS = 0;
        completedSales.forEach(s => {
            s.items.forEach(item => {
                // Potential crash point if product is null, though it shouldn't be
                if (!item.product) console.warn(`Item ${item.id} has no product!`);
                totalCOGS += (item.quantity * item.product.costPrice);
            });
        });

        console.log("SUCCESS! All queries finished without error.");

    } catch (e) {
        console.error("CRITICAL ERROR IN SCRIPT:", e);
    } finally {
        await prisma.$disconnect();
    }
}

debugBalanceSheet();
