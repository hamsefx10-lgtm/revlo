
import postgres from 'postgres';

const DATABASE_URL = 'postgresql://postgres:mgiDtiBmrTjEuYHWZVwxPtpruskpvqem@ballast.proxy.rlwy.net:21779/railway';
const sql = postgres(DATABASE_URL);

async function inspect() {
    try {
        console.log('--- Inspecting Columns for "transactions" ---');
        const transactionCols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'transactions'`;
        process.stdout.write(JSON.stringify(transactionCols.map(c => c.column_name)) + '\n');

    } catch (e) {
        console.error(e);
    } finally {
        await sql.end();
    }
}

inspect();
