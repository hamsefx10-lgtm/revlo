
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function debugBalanceSheet() {
    try {
        console.log("Starting Debug...");

        // Mock Session User (Replace with valid user/company ID from your DB if needed)
        // Usually we fetch the first company/user to test context
        const user = await prisma.user.findFirst();
        if (!user) {
            console.error("No user found");
            return;
        }
        const companyId = user.companyId;
        console.log(`Debugging for Company: ${companyId}`);

        // 1. ASSETS
        const accounts = await prisma.account.findMany({ where: { companyId, isActive: true } });
        console.log(`Accounts Found: ${accounts.length}`);

        const projectsWithDebt = await prisma.project.findMany({ where: { companyId, remainingAmount: { gt: 0 } } });
        console.log(`Projects with Debt: ${projectsWithDebt.length}`);

        const inventoryItems = await prisma.inventoryItem.findMany({ where: { companyId } });
        console.log(`Inventory Items: ${inventoryItems.length}`);

        // ... Add more checks for potential NaN sources ...

        const employeesWithDebt = await prisma.employee.findMany({ where: { companyId, overpaidAmount: { gt: 0 } } });
        console.log(`Employees with Debt: ${employeesWithDebt.length}`);

        // Capital Check
        const shareholderTxns = await prisma.transaction.findMany({ where: { companyId, shareholderId: { not: null } } });
        console.log(`Shareholder Txns: ${shareholderTxns.length}`);

        console.log("Finished Debug - No obvious crashes in Prisma queries.");

    } catch (e) {
        console.error("DEBUG ERROR:", e);
    } finally {
        await prisma.$disconnect();
    }
}

debugBalanceSheet();
