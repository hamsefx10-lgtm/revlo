const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAccountFlow() {
    // Let's check CBE for the main Birshiil company
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';
    const cbeAcc = await prisma.account.findFirst({
        where: { name: { contains: 'CBE', mode: 'insensitive' }, companyId }
    });

    if (!cbeAcc) {
        console.log("CBE Account not found.");
        return;
    }

    const transactions = await prisma.transaction.findMany({
        where: {
            OR: [
                { accountId: cbeAcc.id },
                { fromAccountId: cbeAcc.id },
                { toAccountId: cbeAcc.id }
            ],
            companyId
        }
    });

    let sumIn = 0;
    let sumOut = 0;

    for (const t of transactions) {
        const amt = Math.abs(Number(t.amount));

        if (t.accountId === cbeAcc.id) {
            if (['INCOME', 'DEBT_REPAID', 'TRANSFER_IN', 'SHAREHOLDER_DEPOSIT'].includes(t.type)) {
                sumIn += amt;
            } else {
                sumOut += amt;
            }
        } else if (t.fromAccountId === cbeAcc.id && t.type === 'TRANSFER_OUT') {
            sumOut += amt;
        } else if (t.toAccountId === cbeAcc.id && t.type === 'TRANSFER_IN') {
            sumIn += amt;
        } else {
            sumOut += amt;
        }
    }

    console.log(`=== XISAABTA ACCOUNT-KA: ${cbeAcc.name} ===`);
    console.log(`1. Wadarta Soo Gashay (IN): $${sumIn.toLocaleString()}`);
    console.log(`2. Wadarta Baxday (OUT): $${sumOut.toLocaleString()}`);
    console.log(`3. (IN) ka jar (OUT) = Natiijada: $${(sumIn - sumOut).toLocaleString()}`);
    console.log(`\n4. Balance-ka dhabta ah ee ku qoran Database-ka Hadda: $${Number(cbeAcc.balance).toLocaleString()}`);

    if ((sumIn - sumOut) === Number(cbeAcc.balance)) {
        console.log("\n✅ Natiijadu: 100% Waa Isku Mid! Xisaabtaadu waa sax.");
    } else {
        console.log("\n❌ Farqi ayaa jira!");
    }
}

checkAccountFlow().finally(() => prisma.$disconnect());
