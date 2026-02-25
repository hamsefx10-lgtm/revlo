const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simulateDelete() {
    const projectId = '2970784b-8a6f-415e-a0cd-a6d3e1177801'; // Nuur Moalin Site
    try {
        console.log(`Simulating delete for Project ID: ${projectId}`);

        await prisma.$transaction(async (tx) => {
            // Replicate current API logic
            await tx.projectLabor.deleteMany({ where: { projectId } });
            await tx.transaction.deleteMany({ where: { projectId } });
            await tx.expense.deleteMany({ where: { projectId } });

            // Try to delete project
            await tx.project.delete({ where: { id: projectId } });

            // Immediately throw to rollback
            throw new Error("ROLLBACK_SUCCESS");
        });
    } catch (error) {
        if (error.message === "ROLLBACK_SUCCESS") {
            console.log("Deletion would succeed. No constraints blocking it.");
        } else {
            console.error("Deletion failed due to constraint:");
            console.error(error.message);
        }
    }
}
simulateDelete().finally(() => prisma.$disconnect());
