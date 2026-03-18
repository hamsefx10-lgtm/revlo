import postgres from 'postgres';

const NEON_URL = 'postgresql://neondb_owner:npg_kDcYIZvOL74J@ep-blue-violet-ad0xhu8r-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const RAILWAY_URL = 'postgresql://postgres:mgiDtiBmrTjEuYHWZVwxPtpruskpvqem@ballast.proxy.rlwy.net:21779/railway';

const sqlN = postgres(NEON_URL, { ssl: 'require' });
const sqlR = postgres(RAILWAY_URL, { ssl: 'require' });

async function run() {
    try {
        console.log('Fetching transactions from Neon...');
        const data = await sqlN`SELECT * FROM transactions LIMIT 10`;
        console.log(`Found ${data.length} transactions.`);

        for (const item of data) {
            try {
                // Sanitize date for transaction
                if (item.transactionDate instanceof Date && isNaN(item.transactionDate.getTime())) {
                    item.transactionDate = null;
                }
                await sqlR`INSERT INTO transactions ${sqlR(item)} ON CONFLICT DO NOTHING`;
                console.log(`- Success for transaction ${item._id || item.id}`);
            } catch (e) {
                console.error(`- Error for transaction ${item._id || item.id}:`, e.message);
                if (e.detail) console.error(`  Detail: ${e.detail}`);
            }
        }
    } catch (e) {
        console.error('Fatal:', e.message);
    } finally {
        await sqlN.end();
        await sqlR.end();
    }
}

run();
