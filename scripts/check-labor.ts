import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Looking up project 'Dhagaxbur Masjid Yusuf' expenses...");

    // Find the project first
    const project = await prisma.project.findFirst({
        where: { name: { contains: 'Dhagaxbur Masjid Yusuf' } },
        include: {
            expenses: {
                include: { employee: true }
            }
        }
    });

    if (!project) {
        console.log("Project not found.");
        return;
    }

    console.log(`Found project: ${project.name} (ID: ${project.id})`);

    // List Labor expenses
    const laborExps = project.expenses.filter(e => e.category === 'Labor');

    console.log(`Labor Expenses count: ${laborExps.length}`);
    laborExps.forEach(e => {
        console.log(`- Date: ${e.expenseDate.toISOString()}`);
        console.log(`  Desc: ${e.description}`);
        console.log(`  Amt: ${e.amount}`);
        console.log(`  EmployeeId: ${e.employeeId}`);
        console.log(`  Employee: ${e.employee?.fullName}`);
        console.log(`  SupplierName: ${e.supplierName}`);
        console.log(`  ConsultantName: ${e.consultantName}`);
        console.log(`  SubCategory: ${e.subCategory}`);
        console.log(`---`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
