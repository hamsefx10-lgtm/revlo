import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function scanProjects() {
    console.log("Baaritaanku wuu bilowday...");

    // Soo qaado mashaariicda oo dhan iyo dhaqdhaqaaqooda (INCOME, DEBT_REPAID, iwm)
    const projects = await prisma.project.findMany({
        include: {
            transactions: {
                where: {
                    OR: [
                        { type: 'INCOME' },
                        { type: 'DEBT_REPAID' }
                    ]
                },
                include: {
                    account: true
                }
            }
        }
    });

    const affectedProjects = [];

    for (const project of projects) {
        let theAdvancesAndRepayments = project.transactions.filter(t => t.type === 'INCOME');
        let standardDebtRepaid = project.transactions.filter(t => t.type === 'DEBT_REPAID' && !t.vendorId);
        
        let realAdvanceSum = theAdvancesAndRepayments.reduce((sum, t) => sum + Number(t.amount || 0), 0);
        let realRepaidSum = standardDebtRepaid.reduce((sum, t) => sum + Number(t.amount || 0), 0);

        let dBaseAdvancePaid = Number(project.advancePaid || 0);
        
        // Discrepancy definition:
        // The advancePaid saved in the DB should equal sum of all INCOME transactions.
        if (dBaseAdvancePaid !== realAdvanceSum && realAdvanceSum > 0) {
            affectedProjects.push({
                projectId: project.id,
                projectName: project.name,
                customer: project.customerId,
                dbAdvancePaid: dBaseAdvancePaid,
                realAdvanceIncomeFromAccounts: realAdvanceSum,
                discrepancyAmount: realAdvanceSum - dBaseAdvancePaid,
                transactionsDetails: theAdvancesAndRepayments.map(t => ({
                    id: t.id,
                    amount: Number(t.amount),
                    type: t.type,
                    description: t.description,
                    accountName: t.account?.name || 'Lama Helin (No Account)',
                    date: t.transactionDate
                }))
            });
        }
    }

    console.log("=============== NATIIJADA BAARITAANKA ===============");
    if (affectedProjects.length === 0) {
        console.log("Wax mashruuc ah oo uu dhibkan haysto lama helin.");
    } else {
        console.log(`Tirada Mashaariicda ciladdu hayso: ${affectedProjects.length}`);
        affectedProjects.forEach(p => {
            console.log(`\nMashruuca: ${p.projectName} (ID: ${p.projectId})`);
            console.log(`Lacagta Dusha uga qoran (DB Advance): ${p.dbAdvancePaid}`);
            console.log(`Lacagta rasmiga ah ee ku jirta Account-yada (Real Income): ${p.realAdvanceIncomeFromAccounts}`);
            console.log(`Farqiga (Lacagta maqan): ${p.discrepancyAmount}`);
            
            console.log(" -- Dhaqdhaqaaqyadii lagu helay Account-yada:");
            p.transactionsDetails.forEach(t => {
                console.log(`    * [Account: ${t.accountName}] - Xaddiga: ${t.amount} | Taariikh: ${new Date(t.date).toISOString().split('T')[0]} | Sabab: ${t.description}`);
            });
        });
    }

    await prisma.$disconnect();
}

scanProjects().catch(e => {
    console.error("Cilad ayaa dhacday:", e);
    prisma.$disconnect();
    process.exit(1);
});
