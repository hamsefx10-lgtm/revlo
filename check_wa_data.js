
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
    const companies = await prisma.company.findMany({ select: { id: true, name: true, whatsappSessionStatus: true } });
    const vendors = await prisma.shopVendor.findMany({ select: { id: true, name: true, phoneNumber: true } });
    console.log('--- COMPANIES ---');
    companies.forEach(c => console.log(`${c.name}: ${c.whatsappSessionStatus || 'N/A'} (ID: ${c.id})`));
    console.log('\n--- VENDORS ---');
    vendors.filter(v => v.phoneNumber).forEach(v => console.log(`${v.name}: ${v.phoneNumber} (ID: ${v.id})`));
    process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
