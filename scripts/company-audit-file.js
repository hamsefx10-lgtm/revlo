const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function check() {
    const companies = await prisma.company.findMany();
    const results = [];

    for (const c of companies) {
        const count = await prisma.project.count({ where: { companyId: c.id } });
        if (count > 0) {
            results.push({ name: c.name, id: c.id, projectCount: count });
        }
    }

    fs.writeFileSync('company_audit.json', JSON.stringify(results, null, 2));
    console.log('Results saved to company_audit.json');
}

check().catch(console.error).finally(() => prisma.$disconnect());
