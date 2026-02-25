const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProjectsCompany() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

    const userProjects = await prisma.project.count({ where: { companyId } });
    const allProjects = await prisma.project.count();
    const otherCompanyProjects = await prisma.project.count({ where: { companyId: { not: companyId } } });

    console.log(`\n--- Projects Count ---`);
    console.log(`Belonging to User Company (${companyId}): ${userProjects}`);
    console.log(`Belonging to Other Companies: ${otherCompanyProjects}`);
    console.log(`Total Projects in Database: ${allProjects}`);

    if (otherCompanyProjects > 0) {
        const others = await prisma.project.findMany({
            where: { companyId: { not: companyId } },
            select: { id: true, name: true, companyId: true }
        });
        console.log(`\nOther company projects examples:`);
        console.log(others.slice(0, 5));
    }
}

checkProjectsCompany().finally(() => prisma.$disconnect());
