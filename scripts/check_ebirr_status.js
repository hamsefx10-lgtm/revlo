const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function checkEbirr() {
    const EBIRR_ID = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
    const count = await prisma.transaction.count({ where: { accountId: EBIRR_ID } });
    const acc = await prisma.account.findUnique({ where: { id: EBIRR_ID } });
    
    // We also want to sum up the mathematical total of these rows matching E-Birr
    // to see if they perfectly reflect the Excel's Net Balance!
    const allTxs = await prisma.transaction.findMany({ 
        where: { accountId: EBIRR_ID },
        orderBy: { transactionDate: 'asc' }
    });
    
    console.log('----- WARBIXINTA E-BIRR (EBIRR STATUS) -----');
    console.log(`Tirada Waraaqaha E-Birr (Total TXs): ${count}`);
    console.log(`Haraaga Rasmiga Ah ee Database-ka (Official DB Balance): ${acc.balance}`);

    // Let's get the 16th of March Balance specifically
    const cutoffDate = new Date('2026-03-16T23:59:59.999Z');
    let march16Balance = 0;
    
    for (let trx of allTxs) {
        if (trx.transactionDate > cutoffDate) continue;
        
        let txAmount = typeof trx.amount === 'object' ? trx.amount.toNumber() : trx.amount;

        const isStandardIn = ['INCOME', 'DEBT_RECEIVED', 'TRANSFER_IN', 'INFLOW'].includes(trx.type) || 
            (trx.type === 'DEBT_REPAID' && !trx.vendorId && !trx.expenseId && !trx.employeeId && !trx.payrollId);

        const isStandardOut = ['EXPENSE', 'DEBT_GIVEN', 'DEBT_TAKEN', 'TRANSFER_OUT', 'ASSET_PURCHASE', 'PAYROLL', 'SALES_REFUND'].includes(trx.type) || 
            (trx.type === 'DEBT_REPAID' && !!trx.vendorId && !!trx.expenseId) || 
            (trx.type === 'DEBT_REPAID' && !!trx.employeeId && !!trx.payrollId);

        if (isStandardIn) march16Balance += txAmount;
        if (isStandardOut) march16Balance -= txAmount;
    }

    console.log(`Haraaga markay ahayd 16-kii Bisha (Computed Balance up to Mar 16): ${march16Balance.toFixed(2)}`);
}
checkEbirr().catch(console.error).finally(()=>prisma.$disconnect());
