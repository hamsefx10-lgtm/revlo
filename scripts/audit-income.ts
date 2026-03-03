  import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const companies = await prisma.company.findMany({
        where: { projects: { some: {} } }
    });

    for (const company of companies) {
        const projects = await prisma.project.findMany({
            where: { companyId: company.id },
            select: {
                id: true,
                name: true,
                agreementAmount: true,
                advancePaid: true,
                status: true,
                transactions: {
                    where: { type: { in: ['INCOME', 'DEBT_REPAID'] } },
                    select: { amount: true, type: true, description: true }
                }
            }
        });

        if (projects.length === 0) continue;

        console.log(`\n${'='.repeat(70)}`);
        console.log(`COMPANY: ${company.name}`);
        console.log(`${'='.repeat(70)}`);

        let totalAgreement = 0;
        let totalAdvance = 0;
        let totalCredit = 0;
        let overpaidCount = 0;

        for (const p of projects) {
            const agreement = Number(p.agreementAmount);
            const advance = Number(p.advancePaid);
            const incomeTxnTotal = p.transactions.reduce((s, t) => s + Number(t.amount), 0);

            // How much is "Total Paid" in the project detail page:
            // advancePaid + income transactions (but advance is already in transactions too sometimes)
            const displayedTotalPaid = advance + incomeTxnTotal; // what the UI shows
            const overAdvance = advance - agreement; // how much more advance was paid vs agreement

            totalAgreement += agreement;
            totalAdvance += advance;

            if (advance > agreement) {
                overpaidCount++;
                const credit = advance - agreement;
                totalCredit += credit;
                console.log(`\n🔴 OVERPAID: ${p.name}`);
                console.log(`   Agreement:    Br${agreement.toLocaleString()}`);
                console.log(`   AdvancePaid:  Br${advance.toLocaleString()}`);
                console.log(`   Overpaid by:  Br${credit.toLocaleString()} ← Lacagtaas ayaa la idin ku leeyahay`);
                console.log(`   Income Txns:  Br${incomeTxnTotal.toLocaleString()} (${p.transactions.length} transactions)`);
                console.log(`   UI Shows Paid: Br${displayedTotalPaid.toLocaleString()} ← possible double-count`);
            }
        }

        console.log(`\n--- SUMMARY ---`);
        console.log(`Total projects:         ${projects.length}`);
        console.log(`Overpaid projects:      ${overpaidCount}`);
        console.log(`Total Agreement:        Br${totalAgreement.toLocaleString()}`);
        console.log(`Total AdvancePaid:      Br${totalAdvance.toLocaleString()}`);
        console.log(`Total Credit (owed to clients): Br${totalCredit.toLocaleString()}`);
        console.log(`Net receivable (Agreement - Advance): Br${(totalAgreement - totalAdvance).toLocaleString()}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
