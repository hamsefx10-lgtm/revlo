import prisma from '../lib/db';

async function verifyAllLinkages() {
    console.log('--- Baaritaanka Guud ee Qaladka Transaction-ka ---\n');

    try {
        const expenses = await prisma.expense.findMany({
            include: {
                transactions: true,
            }
        });

        let noTrxCount = 0;

        for (const exp of expenses) {
            if (exp.transactions.length === 0) {
                noTrxCount++;
                console.log(`[KHATAR] Kharashkan MA LAHA TRANSACTIONS: ID ${exp.id} | $${exp.amount} | ${exp.description}`);
            }
        }

        if (noTrxCount === 0) {
            console.log("Warka Fiican: Ma jiro kharash qudha oo aan lahayn Transaction (Diiwaan). Dhammaan kharashyadu waxay leeyihiin ugu yaraan hal transaction.");
            console.log("Sidaa darteed, dhibaatada 'Invisible Expenses' ma jirto, ciladduna kaliya waxay ku koobnayd qaabka xisaabinta + iyo - ee Transactions-ka aan horay u soo sheegnay.");
        }

    } catch (error) {
        console.error('Cilad:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyAllLinkages();
