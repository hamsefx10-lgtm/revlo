import prisma from '../lib/db';
import { recalculateAccountBalance } from '../lib/accounting';

async function fixBalances() {
    console.log('--- Sixitaanka Balances-ka Akoonada (Recalculating Accounts) ---\n');

    try {
        const accounts = await prisma.account.findMany();

        console.log(`Waxa la helay ${accounts.length} Akoon. Dib baa loo xisaabinayaa...`);

        for (const acc of accounts) {
            console.log(`\nDib u xisaabinta Akoonka: ${acc.name} (ID: ${acc.id})`);
            console.log(`Baaqigii hore (Old Balance): $${acc.balance}`);

            const newBalance = await recalculateAccountBalance(acc.id);

            console.log(`Baaqiga Cusub (New Balance): $${newBalance}`);
        }

        console.log('\nSi guul leh ayaa loo wada saxay dhammaan Akoonada.');

    } catch (error) {
        console.error('Cilad ayaa dhacday intii sixitaanka lagu jiray:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixBalances();
