import prisma from '@/lib/db';

export async function recalculateAccountBalance(accountId: string, upToDate?: Date) {
    if (!accountId) return;

    const whereClause: any = {
        OR: [
            { accountId: accountId },
            { fromAccountId: accountId },
            { toAccountId: accountId }
        ]
    };

    if (upToDate) {
        whereClause.transactionDate = { lte: upToDate };
    }

    const rawTransactions = await prisma.transaction.findMany({
        where: whereClause,
        orderBy: [
            { transactionDate: 'asc' },
            { createdAt: 'asc' }
        ]
    });

    let currentBalance = 0;

    rawTransactions.forEach((trx) => {
        const amount = Math.abs(Number(trx.amount));

        // 1. Unified Transfer Logic (For new single-record transfers)
        if (!trx.accountId) {
            if (trx.toAccountId === accountId) {
                currentBalance += amount;
            } else if (trx.fromAccountId === accountId) {
                currentBalance -= amount;
            }
            return;
        }

        // 2. Standard Logic (For non-transfers and OLD dual-record transfers)
        // CRITICAL: We only process the record if the accountId matches the ledger account.
        // This prevents double-counting old transfer pairs.
        if (trx.accountId !== accountId) return;

        const isStandardIn = [
            'INCOME',
            'DEBT_RECEIVED',
            'TRANSFER_IN'
        ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && !trx.vendorId);

        const isStandardOut = [
            'EXPENSE',
            'DEBT_GIVEN',
            'DEBT_TAKEN',
            'TRANSFER_OUT'
        ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && !!trx.vendorId);

        if (isStandardIn) {
            currentBalance += amount;
        } else if (isStandardOut) {
            currentBalance -= amount;
        }
    });

    // Only update the account record if we're calculating the current (non-historical) balance
    if (!upToDate) {
        await prisma.account.update({
            where: { id: accountId },
            data: { balance: currentBalance }
        });
    }

    return currentBalance;
}
