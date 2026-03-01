const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const companies = await prisma.company.findMany();
    for (const c of companies) {
        const count = await prisma.project.count({ where: { companyId: c.id } });
        if (count > 40) {
            console.log(`TARGET FOUND: ${c.name} (${c.id}) - Count: ${count}`);
        } else if (count > 0) {
            console.log(`Other: ${c.name} (${c.id}) - Count: ${count}`);
        }
    }
}

run().catch(console.error).finally(() => prisma.$disconnect());
