import postgres from 'postgres';

const NEON_URL = 'postgresql://neondb_owner:npg_kDcYIZvOL74J@ep-blue-violet-ad0xhu8r-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const RAILWAY_URL = 'postgresql://postgres:mgiDtiBmrTjEuYHWZVwxPtpruskpvqem@ballast.proxy.rlwy.net:21779/railway';

const sqlN = postgres(NEON_URL, { ssl: 'require' });
const sqlR = postgres(RAILWAY_URL, { ssl: 'require' });

async function run() {
    try {
        console.log('Fetching projects from Neon...');
        const data = await sqlN`SELECT * FROM projects`;
        console.log(`Found ${data.length} projects.`);

        if (data.length > 0) {
            console.log('Inserting into Railway...');
            // Try inserting one by one to see specific errors if it fails
            for (const item of data) {
                try {
                    await sqlR`INSERT INTO projects ${sqlR(item)} ON CONFLICT DO NOTHING`;
                } catch (itemError) {
                    console.error(`Error for project ${item._id || item.id}:`, itemError.message);
                    // Log the first error and stop to see what's wrong
                    process.exit(1);
                }
            }
        }
        console.log('Success!');
    } catch (e) {
        console.error('Fatal Error:', e.message);
    } finally {
        await sqlN.end();
        await sqlR.end();
    }
}

run();
