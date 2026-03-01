const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const companyCounts = await prisma.project.groupBy({
        by: ['companyId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } }
    });

    for (const c of companyCounts) {
        const company = await prisma.company.findUnique({ where: { id: c.companyId } });
        console.log(`Company: ${company?.name || 'Unknown'} (ID: ${c.companyId}) - Projects: ${c._count.id}`);
    }
}

check().catch(console.error).finally(() => prisma.$disconnect());
