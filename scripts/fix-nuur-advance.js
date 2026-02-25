const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixNuurDuplication() {
    const projectId = '2970784b-8a6f-415e-a0cd-a6d3e1177801';

    console.log("--- Executing Solution 2 for Nuur Moalin Site ---");

    // 1. Reset the advancePaid column to 0
    const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: { advancePaid: 0 }
    });
    console.log(`[1/3] Project 'Advance Paid' reset to: ${updatedProject.advancePaid}`);

    // 2. Find and delete the 173,000 auto-generated INCOME transaction
    const autoIncomeTxn = await prisma.transaction.findFirst({
        where: { projectId, type: 'INCOME', amount: 173000 }
    });

    if (autoIncomeTxn) {
        const deletedTxn = await prisma.transaction.delete({
            where: { id: autoIncomeTxn.id }
        });
        console.log(`[2/3] Deleted auto-generated INCOME transaction ID: ${deletedTxn.id} | Amount: ${deletedTxn.amount}`);
    } else {
        console.log(`[2/3] Auto-generated INCOME transaction not found. Already deleted or modified.`);
    }

    console.log(`[3/3] Fix applied! Next run rebuild-balances-v4.js to finalize physical balances.`);
}

fixNuurDuplication().finally(() => prisma.$disconnect());
