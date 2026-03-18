
import postgres from 'postgres';

const DATABASE_URL = 'postgresql://postgres:mgiDtiBmrTjEuYHWZVwxPtpruskpvqem@ballast.proxy.rlwy.net:21779/railway';
const sql = postgres(DATABASE_URL);

async function runRecalculation() {
    try {
        console.log('--- Starting Global Balance Recalculation (REVERT MODE) ---');
        
        const accounts = await sql`SELECT _id as id, name, balance FROM accounts`;
        console.log(`Found ${accounts.length} accounts to process.`);

        for (const account of accounts) {
            console.log(`Processing Account: ${account.name} (${account.id})...`);
            
            const transactions = await sql`
                SELECT _id as id, type, amount, "accountId", "fromAccountId", "toAccountId", "transactionDate", "createdAt", "vendorId"
                FROM transactions 
                WHERE "accountId" = ${account.id} 
                   OR "fromAccountId" = ${account.id} 
                   OR "toAccountId" = ${account.id}
                ORDER BY "transactionDate" ASC, "createdAt" ASC
            `;

            let currentBalance = 0;

            for (const trx of transactions) {
                const amount = Math.abs(Number(trx.amount));

                if (!trx.accountId) {
                    if (trx.toAccountId === account.id) {
                        currentBalance += amount;
                    } else if (trx.fromAccountId === account.id) {
                        currentBalance -= amount;
                    }
                    continue;
                }

                if (trx.accountId !== account.id) continue;

                // OLD LOGIC
                const isStandardIn = [
                    'INCOME',
                    'DEBT_RECEIVED',
                    'TRANSFER_IN'
                ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && !trx.vendorId);

                const isStandardOut = [
                    'EXPENSE',
                    'DEBT_GIVEN',
                    'DEBT_TAKEN',
                    'TRANSFER_OUT'
                ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && !!trx.vendorId);

                if (isStandardIn) currentBalance += amount;
                else if (isStandardOut) currentBalance -= amount;
            }

            await sql`
                UPDATE accounts 
                SET balance = ${currentBalance} 
                WHERE _id = ${account.id}
            `;
            
            console.log(`- New Balance for ${account.name}: ${currentBalance}`);
        }

        console.log('--- Recalculation Complete ---');
    } catch (error) {
        console.error('Recalculation failed:', error);
    } finally {
        await sql.end();
    }
}

runRecalculation();
