
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

    const [allTransactions, advancesResult] = await Promise.all([
        prisma.transaction.findMany({ where: { companyId } }),
        prisma.project.aggregate({ _sum: { advancePaid: true }, where: { companyId } })
    ]);

    const totalProjectAdvances = advancesResult._sum.advancePaid ? Number(advancesResult._sum.advancePaid) : 0;
    let totalCashInflow = totalProjectAdvances;
    let totalCashOutflow = 0;

    allTransactions.forEach(trx => {
        const amount = Math.abs(Number(trx.amount));
        const isAutoAdvance = (trx.description || '').toLowerCase().includes('advance payment for project');

        const isUnifiedTransfer = trx.accountId === null && (trx.fromAccountId || trx.toAccountId);
        const isGhostTransaction = trx.accountId === null && !isUnifiedTransfer;

        if (!isGhostTransaction) {
            if (
                ['INCOME', 'TRANSFER_IN', 'SHAREHOLDER_DEPOSIT', 'DEBT_RECEIVED'].includes(trx.type) ||
                (trx.type === 'DEBT_REPAID' && !trx.vendorId) ||
                (trx.type === 'TRANSFER_OUT' && trx.accountId === null)
            ) {
                if (!(trx.type === 'INCOME' && isAutoAdvance)) {
                    totalCashInflow += amount;
                }
            }
            if (['EXPENSE', 'DEBT_TAKEN', 'DEBT_GIVEN', 'TRANSFER_OUT'].includes(trx.type)) {
                totalCashOutflow += amount;
            }
            if (trx.type === 'DEBT_REPAID' && trx.vendorId) {
                totalCashOutflow += amount;
            }
        }
    });

    console.log({ totalCashInflow, totalCashOutflow, net: totalCashInflow - totalCashOutflow });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
