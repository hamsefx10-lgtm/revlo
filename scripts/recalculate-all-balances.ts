import prisma from '../lib/db';
import { recalculateAccountBalance } from '../lib/accounting';

async function main() {
    console.log('--- Starting Global Account Balance Recalculation ---');

    const accounts = await prisma.account.findMany();
    console.log(`Found ${accounts.length} accounts to process.`);

    for (const account of accounts) {
        process.stdout.write(`Processing account: ${account.name} (ID: ${account.id})... `);
        try {
            const oldBalance = Number(account.balance);
            const newBalance = await recalculateAccountBalance(account.id);
            console.log(`Done. Old: ${oldBalance}, New: ${newBalance}`);
        } catch (error) {
            console.log(`Error processing ${account.name}:`, error);
        }
    }

    console.log('--- Recalculation Complete ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
