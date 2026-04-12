import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function updateAdvancePaid(projectId: string) {
    const advanceTransactions = await prisma.transaction.findMany({
        where: {
            projectId: projectId,
            type: 'INCOME'
        }
    });

    const totalAdvance = advanceTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return;

    const agreementAmount = Number(project.agreementAmount || 0);
    const remainingAmount = agreementAmount - totalAdvance;

    return await prisma.project.update({
        where: { id: projectId },
        data: {
            advancePaid: totalAdvance,
            remainingAmount: remainingAmount
        }
    });
}

async function fixOrphans() {
    console.log("Bilaabayaa Nidaamka Saxidda (Fixing Process)...");
    const projects = await prisma.project.findMany();
    let rollbackData = [];
    let count = 0;

    for (const project of projects) {
        const orphanedTxs = await prisma.transaction.findMany({
            where: {
                projectId: null,
                OR: [
                    { type: 'INCOME' },
                    { type: 'DEBT_REPAID' }
                ],
                description: { contains: project.name }
            }
        });

        if (orphanedTxs.length > 0) {
             const oldProjectAdvancePaid = Number(project.advancePaid || 0);
             
             const projectRollbackInfo = {
                 projectId: project.id,
                 oldAdvancePaid: oldProjectAdvancePaid,
                 transactionsModified: [] as any[]
             };

             for (const tx of orphanedTxs) {
                 projectRollbackInfo.transactionsModified.push({
                     transactionId: tx.id,
                     oldProjectId: tx.projectId // should be null
                 });
                 
                 // Update the transaction to link to the project!
                 await prisma.transaction.update({
                     where: { id: tx.id },
                     data: { projectId: project.id }
                 });
             }
             
             // Now recalculate project advances
             await updateAdvancePaid(project.id);
             
             rollbackData.push(projectRollbackInfo);
             count++;
             console.log(`[+] Waa la saxay Mashruuca: ${project.name}`);
        }
    }
    
    const backupPath = './backup_orphaned_txs.json';
    fs.writeFileSync(backupPath, JSON.stringify(rollbackData, null, 2));
    
    console.log(`\n✅ Nidaamkii wuu dhammaaday! Waxaa si guul ah dhibka looga xaliyay ${count} Mashruuc.`);
    console.log(`🔒 Xogta dib loogu joojin karo (Rollback Backup) waxaa lagu keydiyay: ${backupPath}`);

    await prisma.$disconnect();
}

fixOrphans().catch(e => {
    console.error("Cilad ayaa dhacday:", e);
    prisma.$disconnect();
});
