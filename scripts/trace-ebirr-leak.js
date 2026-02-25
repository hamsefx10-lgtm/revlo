const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function traceMissingEbirr() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

    // Find accounts
    const eBirrAcc = await prisma.account.findFirst({
        where: { name: { contains: 'e-birr', mode: 'insensitive' }, companyId }
    });
    const cbeAcc = await prisma.account.findFirst({
        where: { name: { contains: 'CBE', mode: 'insensitive' }, companyId }
    });

    // Get all txns globally
    const allTxns = await prisma.transaction.findMany({
        where: { companyId },
        include: {
            fromAccount: { select: { name: true } },
            toAccount: { select: { name: true } },
            account: { select: { name: true } }
        }
    });

    console.log(`=== E-BIRR (ID: ${eBirrAcc.id}) TRACE ===`);

    let sumDirectEbirr = 0;
    let transfersHittingCBE_NotEbirr = 0;

    for (const t of allTxns) {
        const amt = Math.abs(Number(t.amount));

        // How much is directly attached via accountId
        if (t.accountId === eBirrAcc.id) {
            sumDirectEbirr += amt;
        }

        // Find transfers leaving CBE that hit E-Birr via toAccount
        if (t.fromAccountId === cbeAcc.id && t.toAccountId === eBirrAcc.id) {
            console.log(`Found CBE -> E-Birr Transfer: ${amt} on ${t.transactionDate}`);
        }

        // Find transfers leaving CBE that DO NOT hit Ebirr anywhere 
        // but equal our missing 321k
        if (t.fromAccountId === cbeAcc.id && t.toAccountId !== eBirrAcc.id) {
            // Maybe these aren't actually E-Birr transfers?
            // console.log(`CBE transferred out ${amt} to Account ID ${t.toAccountId}`);
        }
    }

    // The total CBE transferred OUT globally was exactly 321,596.42
    // We need to see where that money actually landed
    let cbeTransfersOutSum = 0;
    for (const t of allTxns) {
        if (t.fromAccountId === cbeAcc.id && t.type === 'TRANSFER_OUT') {
            cbeTransfersOutSum += Math.abs(Number(t.amount));
            const destinationName = t.toAccount ? t.toAccount.name : `Unknown Account (ID: ${t.toAccountId})`;
            console.log(`[CBE LEAK TRACE] Outgoing Transfer of ${Math.abs(Number(t.amount))} -> ${destinationName}`);
        }
    }
}
traceMissingEbirr().finally(() => prisma.$disconnect());
