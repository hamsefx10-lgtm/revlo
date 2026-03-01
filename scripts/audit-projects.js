const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProjects() {
    const projects = await prisma.project.findMany({
        where: { companyId: '081fb675-b41e-4cea-92f7-50a5eb3e6f1e' },
        include: {
            transactions: true,
            payments: true
        }
    });

    console.log('--- Project Audit ---');
    let globalAgreement = 0;
    let globalStaticPaid = 0;
    let globalDynamicPaid = 0;
    let globalRemaining = 0;
    let counts = { Active: 0, Completed: 0, 'On Hold': 0, Cancelled: 0, Overdue: 0, 'Nearing Deadline': 0 };

    for (const p of projects) {
        if (counts[p.status] !== undefined) counts[p.status]++;
        const agreement = Number(p.agreementAmount);
        const staticAdvance = Number(p.advancePaid);

        const debtRepaidTrx = p.transactions
            .filter(t => t.type === 'DEBT_REPAID')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        // CURRENT API LOGIC:
        const apiTotalPaid = staticAdvance + debtRepaidTrx;
        const apiRemaining = agreement - apiTotalPaid;

        globalAgreement += agreement;
        globalStaticPaid += staticAdvance;
        globalDynamicPaid += apiTotalPaid;
        globalRemaining += apiRemaining;

        if (debtRepaidTrx > 0) {
            console.log(`Project: ${p.name}`);
            console.log(`  Agreement: ${agreement}`);
            console.log(`  Static advancePaid: ${staticAdvance}`);
            console.log(`  Subsequent Paid (DEBT_REPAID): ${debtRepaidTrx}`);
            console.log(`  API totalPaid: ${apiTotalPaid}`);
            console.log(`---------------------`);
        }
    }

    console.log('\n--- COUNTS ---');
    console.log(JSON.stringify(counts, null, 2));

    console.log('\n--- GLOBAL TOTALS (API Logic) ---');
    console.log(`Heshiiska (Total): ${globalAgreement}`);
    console.log(`La Bixiyay (Advance): ${globalDynamicPaid}`);
    console.log(`Haraaga (Remaining): ${globalRemaining}`);

    console.log('\n--- TARGET TOTALS (From Screenshot) ---');
    console.log(`Heshiiska (Total): 16,274,208.1`);
    console.log(`La Bixiyay (Advance): 13,490,649`);
    console.log(`Haraaga (Remaining): 2,783,559.1`);
}

checkProjects().catch(console.error).finally(() => prisma.$disconnect());
