import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function rollback() {
    console.log("Bilaabayaa Dib-U-Celinta (Rollback Process)...");
    const backupPath = './backup_orphaned_txs.json';

    if (!fs.existsSync(backupPath)) {
        console.log("Xogta Kaydka ah (Backup file) lama helin!");
        await prisma.$disconnect();
        return;
    }
    
    const rollbackData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    let count = 0;
    
    for (const data of rollbackData) {
        // Revert transactions' project mapping exactly back to null
        for (const tx of data.transactionsModified) {
            await prisma.transaction.update({
                where: { id: tx.transactionId },
                data: { projectId: tx.oldProjectId } // sets back to null
            });
        }
        
        // Revert project's advancePaid to its old value
        await prisma.project.update({
            where: { id: data.projectId },
            data: { advancePaid: data.oldAdvancePaid }
        });
        count++;
        console.log(`[-] Dib baa loogu celiyay sidii hore Mashruuca ID: ${data.projectId}`);
    }
    
    console.log(`\n⏪ Wax kasta sidoodii hore ayaa loogu celiyay guul! Loo celiyay: ${count} Mashruuc.`);
    await prisma.$disconnect();
}

rollback().catch(e => {
    console.error("Cilad ayaa dhacday:", e);
    prisma.$disconnect();
});
