import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

async function auditBalances() {
    try {
        const accountsToAudit = await prisma.account.findMany({
            where: {
                name: { in: ['CBE', 'E-Birr'] },
                balance: { not: 0 }
            }
        });

        let output = [];

        for (const account of accountsToAudit) {
            const txns = await prisma.transaction.findMany({
                where: {
                    OR: [
                        { accountId: account.id },
                        { fromAccountId: account.id },
                        { toAccountId: account.id }
                    ]
                },
                orderBy: { transactionDate: 'asc' }
            });

            let totalIn = 0;
            let totalOut = 0;

            for (const t of txns) {
                const amount = Number(t.amount);
                if (t.toAccountId === account.id) {
                    totalIn += amount;
                } else if (t.fromAccountId === account.id) {
                    totalOut += amount;
                } else if (t.accountId === account.id) {
                    if (['INCOME', 'DEBT_COLLECTION', 'SHAREHOLDER_DEPOSIT', 'PAYMENT_RECEIVED', 'ADVANCE_PAYMENT', 'SALE', 'REFUND_RECEIVED'].includes(t.type as string)) {
                        totalIn += amount;
                    } else if (['EXPENSE', 'PROJECT_EXPENSE', 'LABOR_PAYMENT', 'VENDOR_PAYMENT', 'TAX_PAYMENT', 'REFUND_GIVEN', 'PURCHASE'].includes(t.type as string)) {
                        totalOut += amount;
                    } else {
                        totalOut += amount;
                    }
                }
            }

            let lastTx = null;
            if (txns.length > 0) {
                const lt = txns[txns.length - 1];
                lastTx = {
                    date: lt.transactionDate,
                    type: lt.type,
                    amount: Number(lt.amount),
                };
            }

            output.push({
                name: account.name,
                dbBalance: account.balance,
                transactionsFound: txns.length,
                totalIn,
                totalOut,
                calculatedBalance: totalIn - totalOut,
                discrepancy: (totalIn - totalOut) - account.balance,
                lastTransaction: lastTx
            });
        }

        fs.writeFileSync('scripts/audit-output.json', JSON.stringify(output, null, 2));

    } catch (e) {
        console.error("Error during audit:", e);
    } finally {
        await prisma.$disconnect();
    }
}

auditBalances();
