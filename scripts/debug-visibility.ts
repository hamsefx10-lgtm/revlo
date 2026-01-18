
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging Visibility Issue ---');

    // 1. Find the user "hamse moalin"
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { fullName: { contains: 'hamse', mode: 'insensitive' } },
                { fullName: { contains: 'moalin', mode: 'insensitive' } },
                { email: { contains: 'hamse', mode: 'insensitive' } }
            ]
        },
        include: { company: true }
    });

    console.log(`\nFound ${users.length} matching users:`);
    users.forEach(u => {
        console.log(`- ${u.fullName} (${u.email}) | Company: ${u.company?.name} (ID: ${u.companyId})`);
    });

    if (users.length > 0) {
        const targetCompanyId = users[0].companyId;
        console.log(`\nChecking Vendors for Company ID: ${targetCompanyId}`);

        const vendors = await prisma.shopVendor.findMany({
            where: { companyId: targetCompanyId }
        });

        console.log(`Found ${vendors.length} vendors for this company:`);
        vendors.forEach(v => console.log(`- ${v.name} (ID: ${v.id})`));
    }

    // 2. Search for "Al-Barako" specifically
    console.log('\n--- Searching for Al-Barako ---');
    const alBarako = await prisma.shopVendor.findMany({
        where: { name: { contains: 'Barako', mode: 'insensitive' } }
    });

    if (alBarako.length > 0) {
        console.log(`Found "Al-Barako" ${alBarako.length} times:`);
        alBarako.forEach(v => {
            console.log(`- ${v.name} | Company ID: ${v.companyId} | User ID: ${v.userId}`);
        });
    } else {
        console.log('Al-Barako NOT FOUND in shopVendor table.');
    }

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
