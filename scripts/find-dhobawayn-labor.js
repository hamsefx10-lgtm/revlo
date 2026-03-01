
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const project = await prisma.project.findFirst({
        where: { name: { contains: 'Dhobawayn' } }
    });

    if (project) {
        console.log(`Project: ${project.name} (ID: ${project.id})`);
        const labor = await prisma.projectLabor.findMany({
            where: { projectId: project.id }
        });
        console.log(`Found ${labor.length} labor records:`);
        labor.forEach(l => {
            console.log(`- ID: ${l.id}, Amount: ${l.agreedWage}, Paid: ${l.paidAmount}, Desc: ${l.description}`);
        });
    } else {
        console.log("Project not found.");
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
