
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging ShopVendors ---');

    const vendors = await prisma.shopVendor.findMany({
        include: {
            user: { select: { email: true, id: true } },
            company: { select: { name: true, id: true } }
        }
    });

    console.log(`Total Vendors found: ${vendors.length}`);

    if (vendors.length === 0) {
        console.log('No vendors found in the database.');
    } else {
        console.log('Listing first 10 vendors:');
        vendors.slice(0, 10).forEach(v => {
            console.log(`ID: ${v.id} | Name: ${v.name} | Company: ${v.company?.name} (${v.companyId}) | User: ${v.user?.email} (${v.userId})`);
        });
    }

    // Check for specific user data
    const targetEmail = "birshil1@gmail.com";
    const targetUser = await prisma.user.findUnique({
        where: { email: targetEmail },
        include: { company: true }
    });

    if (targetUser) {
        console.log(`\n--- Target User Found: ${targetEmail} ---`);
        console.log(`User ID: ${targetUser.id}`);
        console.log(`Company: ${targetUser.company.name} (${targetUser.companyId})`);

        // Check ShopVendors for this user's company
        const companyVendors = await prisma.shopVendor.findMany({
            where: { companyId: targetUser.companyId }
        });
        console.log(`Vendors for ${targetUser.company.name}: ${companyVendors.length}`);
        companyVendors.forEach(v => console.log(` - ${v.name} (Type: ${v.type})`));

    } else {
        console.log(`\n!! Target User ${targetEmail} NOT found in database !!`);
    }

    // List all Users
    const users = await prisma.user.findMany({
        select: { id: true, email: true, companyId: true, fullName: true }
    });
    console.log('\n--- Listing Users to match IDs ---');
    users.forEach(u => {
        console.log(`User: ${u.email} (${u.fullName}) | ID: ${u.id} | Company: ${u.companyId}`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
