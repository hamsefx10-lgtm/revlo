import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function checkAccount() {
    let output = "";
    output += "Looking up CBE Account Balance and Transactions...\n";

    // Find the exact CBE account
    const account = await prisma.account.findUnique({
        where: { id: 'c8306c05-5279-4b05-b5fc-dda41c793a77' }
    });

    if (!account) {
        output += "CBE Account not found.\n";
        fs.writeFileSync('cbe_audit_full.txt', output);
        return;
    }

    output += `\n=== ACCOUNT: ${account.name} (ID: ${account.id}) ===\n`;
    output += `Current Saved Balance: ${account.balance}\n`;

    const allTrx = await prisma.transaction.findMany({
        where: { accountId: account.id },
        orderBy: { transactionDate: 'asc' }
    });

    let runningBalance = 0;
    output += "\n=== FULL RECALCULATION SIMULATION ===\n";
    for (const trx of allTrx) {
        const amountStr = typeof trx.amount.toNumber === 'function' ? trx.amount.toNumber() : Number(trx.amount);
        const amount = Math.abs(amountStr);
        let multiplier = 0;

        const isStandardIn = [
            'INCOME',
            'DEBT_RECEIVED',
            'TRANSFER_IN'
        ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && !!trx.customerId);

        const isStandardOut = [
            'EXPENSE',
            'DEBT_GIVEN',
            'DEBT_TAKEN',
            'TRANSFER_OUT'
        ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && !trx.customerId);

        if (isStandardIn) multiplier = 1;
        if (isStandardOut) multiplier = -1;

        runningBalance += (amount * multiplier);
    }

    output += `Simulated Correct Balance with CURRENT code: ${runningBalance}\n`;

    output += "\n=== ALL TRANSACTIONS ===\n";
    allTrx.forEach(trx => {
        const amountStr = typeof trx.amount.toNumber === 'function' ? trx.amount.toNumber() : Number(trx.amount);
        const amount = Math.abs(amountStr);
        let multiplier = 0;

        const isStandardIn = [
            'INCOME',
            'DEBT_RECEIVED',
            'TRANSFER_IN'
        ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && !!trx.customerId);

        const isStandardOut = [
            'EXPENSE',
            'DEBT_GIVEN',
            'DEBT_TAKEN',
            'TRANSFER_OUT'
        ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && !trx.customerId);

        let effect = isStandardIn ? '(+)' : isStandardOut ? '(-)' : '(0)';

        output += `[${trx.transactionDate.toISOString().split('T')[0]}] ${trx.type.padEnd(12)} | ${String(amount).padEnd(8)} | ${effect} | Cust: ${trx.customerId ? trx.customerId : 'No  '} | Ven: ${trx.vendorId ? trx.vendorId : 'No  '} | ${trx.description}\n`;
    });

    fs.writeFileSync('cbe_audit_full.txt', output);
}

checkAccount()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
