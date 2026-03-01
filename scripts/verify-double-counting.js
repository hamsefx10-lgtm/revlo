
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const company = await prisma.company.findFirst();
    if (!company) return;
    const cid = company.id;

    const projects = await prisma.project.findMany({
        where: { companyId: cid },
        include: {
            transactions: {
                where: { type: 'DEBT_REPAID' }
            }
        }
    });

    console.log(`Analyzing Double Counting for: ${company.name}`);

    projects.forEach(p => {
        const tableAdvance = parseFloat(p.advancePaid.toString());
        const txTotal = p.transactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

        console.log(`\nProject: ${p.name}`);
        console.log(`- advancePaid (in Project table): ${tableAdvance}`);
        console.log(`- DEBT_REPAID transactions: ${txTotal}`);

        if (txTotal > 0 && tableAdvance >= txTotal) {
            console.log(`!!! LIKELY DOUBLE COUNTED: This project has both a cumulative advancePaid and separate DEBT_REPAID transactions.`);
            console.log(`!!! Dashboard will count: ${tableAdvance} (from Table) + ${txTotal} (from Transactions) = ${tableAdvance + txTotal}`);
        }
    });

}

main().catch(console.error).finally(() => prisma.$disconnect());
