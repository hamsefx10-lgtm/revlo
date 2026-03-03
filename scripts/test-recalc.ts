import { recalculateAccountBalance } from '../lib/accounting';

async function testRecalc() {
    const id = 'c8306c05-5279-4b05-b5fc-dda41c793a77';
    console.log(`Running recalculateAccountBalance for ${id}...`);
    const balance = await recalculateAccountBalance(id);
    console.log(`Calculated Balance: ${balance}`);
}

testRecalc().catch(console.error);
