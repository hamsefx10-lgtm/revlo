import fs from 'fs';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testRecalculate() {
    let output = "--- Test Transaction Edit ---\n";

    // Find a recent expense transaction
    const transaction = await prisma.transaction.findFirst({
        where: { type: 'EXPENSE', accountId: { not: null } },
        orderBy: { createdAt: 'desc' },
        include: { account: true, expense: true }
    });

    if (!transaction) {
        fs.writeFileSync('test_result.txt', "No expense transaction found.");
        return;
    }

    output += `Found Transaction ID: ${transaction.id}\n`;
    output += `Original Account ID: ${transaction.accountId} | Balance: ${transaction.account?.balance}\n`;
    output += `Amount: ${transaction.amount}\n`;

    // Find another account to switch to
    const otherAccounts = await prisma.account.findMany({
        where: { id: { not: transaction.accountId! } },
        take: 1
    });

    if (otherAccounts.length === 0) {
        fs.writeFileSync('test_result.txt', "No other account found.");
        return;
    }
    const otherAccount = otherAccounts[0];
    output += `Target Account ID: ${otherAccount.id} | Balance: ${otherAccount.balance}\n\n`;

    output += "--- Simulating PUT request ---\n";

    // 1. Get affected accounts
    const affectedAccountIds = new Set<string>();
    affectedAccountIds.add(transaction.accountId!);
    affectedAccountIds.add(otherAccount.id);

    // 2. Perform the update
    await prisma.transaction.update({
        where: { id: transaction.id },
        data: { accountId: otherAccount.id }
    });
    output += "Transaction 'accountId' updated in database.\n";

    // 3. Recalculate balances
    const { recalculateAccountBalance } = await import('./lib/accounting.js');

    for (const accId of affectedAccountIds) {
        await recalculateAccountBalance(accId);
    }
    output += "Recalculation finished.\n";

    // 4. Check new balances
    const newOriginalAccount = await prisma.account.findUnique({ where: { id: transaction.accountId! } });
    const newTargetAccount = await prisma.account.findUnique({ where: { id: otherAccount.id } });

    output += "\n--- Results ---\n";
    output += `Original Account Balance: ${newOriginalAccount?.balance} (Expected: ${Number(transaction.account?.balance) + Number(transaction.amount)})\n`;
    output += `Target Account Balance: ${newTargetAccount?.balance} (Expected: ${Number(otherAccount.balance) - Number(transaction.amount)})\n`;

    // 5. Revert back
    output += "\n--- Reverting ---\n";
    await prisma.transaction.update({
        where: { id: transaction.id },
        data: { accountId: transaction.accountId }
    });
    for (const accId of affectedAccountIds) {
        await recalculateAccountBalance(accId);
    }
    output += "Reverted successfully.\n";

    fs.writeFileSync('test_result.txt', output);
}

testRecalculate().catch(e => fs.writeFileSync('test_result.txt', String(e))).finally(() => prisma.$disconnect());
