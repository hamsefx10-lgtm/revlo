import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function scanOrphanedAdvances() {
    console.log("Baaritaan labaad ayaa bilowday... (Orphaned Advances scan)");

    const projects = await prisma.project.findMany();
    const affectedProjects = [];

    for (const project of projects) {
        // Tixgeli sidii uu xaalku ahaa
        let currentAdvanceDB = Number(project.advancePaid || 0);

        // Raadi transaction aan lahayn projectId balse magaca mashruuca wata!
        const orphanedTxs = await prisma.transaction.findMany({
            where: {
                projectId: null,
                type: 'INCOME',
                description: { contains: project.name }
            }
        });

        // Sidoo kale ka fiiri advance-yada ku xiran ee saxda ah:
        const linkedTxs = await prisma.transaction.findMany({
            where: {
                projectId: project.id,
                type: 'INCOME'
            }
        });

        const sumOrphaned = orphanedTxs.reduce((sum, t) => sum + Number(t.amount||0), 0);
        const sumLinked = linkedTxs.reduce((sum, t) => sum + Number(t.amount||0), 0);

        // Haddii advancePaid uu yahay 0 balse la helay lacago dibada heehaabaya oo aan ku xirnayn (Orphaned)
        // Ama haddii sum(Linked) uu ka yar yahay DB value.
        if (sumOrphaned > 0 || (sumLinked !== currentAdvanceDB)) {
             affectedProjects.push({
                 projectName: project.name,
                 id: project.id,
                 advanceInDB: currentAdvanceDB,
                 advanceLinkedTotal: sumLinked,
                 orphanedTotalFound: sumOrphaned,
                 orphanedDetails: orphanedTxs.map(t => ({ amount: Number(t.amount), desc: t.description }))
             });
        }
    }

    if (affectedProjects.length === 0) {
        console.log("Wax mashruuc ah lama helin oo dhibkan haysto.");
    } else {
        console.log(`\n\n=============== NATIIJADA BAARITAANKA ==============="`);
        console.log(`Mashaariicda ciladdu saameysay waa: ${affectedProjects.length}\n`);
        affectedProjects.forEach(p => {
             console.log(`Mashruuca: ${p.projectName} (ID: ${p.id})`);
             console.log(`-> Advance-ka u qoran Mashruuca dushiisa: $${p.advanceInDB}`);
             console.log(`-> Lacagaha sida saxda ugu xiran (Linked Advances): $${p.advanceLinkedTotal}`);
             console.log(`-> Lacagaha lunsan/kala go'an ee dibada wareegaya (Orphaned): $${p.orphanedTotalFound}`);
             if (p.orphanedDetails.length > 0) {
                 console.log(`   (Faahfaahin Orphaned: `);
                 p.orphanedDetails.forEach(o => console.log(`     Xaddi: ${o.amount}, Sharaxaad: ${o.desc}`));
             }
             if (p.advanceLinkedTotal !== p.advanceInDB) {
                 console.log(`   *** [Fiiro Gaar Ah]: Mashruucan xisaabta ugu jirta Databaseka waa $${p.advanceInDB} balse wixii ku xiran dhab ahaan waa $${p.advanceLinkedTotal}`);
             }
             console.log("-----------------------------------------------------");
        });
    }

    await prisma.$disconnect();
}

scanOrphanedAdvances().catch(console.error);
