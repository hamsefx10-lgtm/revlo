import postgres from 'postgres';

const NEON_URL = 'postgresql://neondb_owner:npg_kDcYIZvOL74J@ep-blue-violet-ad0xhu8r-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const RAILWAY_URL = 'postgresql://postgres:mgiDtiBmrTjEuYHWZVwxPtpruskpvqem@ballast.proxy.rlwy.net:21779/railway';

const sqlN = postgres(NEON_URL, { ssl: 'require' });
const sqlR = postgres(RAILWAY_URL, { ssl: 'require' });

function sanitizeRow(row) {
    const newRow = { ...row };
    for (const [key, value] of Object.entries(newRow)) {
        if (value instanceof Date && isNaN(value.getTime())) {
            newRow[key] = null;
        }
    }
    return newRow;
}

async function migrate() {
    console.log('--- Starting Ultra-Safe Individual Migration ---');

    try {
        const tables = [
            'companies',
            'users',
            'wallets',
            'customers',
            'shop_vendors',
            'employees',
            'accounts',
            'fiscal_years',
            'expense_categories',
            'product_catalog',
            'projects',
            'inventory_items',
            'fixed_assets',
            'expenses',
            'transactions',
            'payments',
            'project_materials',
            'project_labor',
            'company_labor',
            'project_documents',
            'employee_attendance',
            'notifications',
            'pending_expenses',
            'telegram_chats',
            'telegram_user_links',
            'personalization_settings',
            'production_orders',
            'bill_of_materials',
            'work_orders',
            'material_purchases',
            'cost_tracking',
            'manufacturing_used',
            'chat_rooms',
            'chat_members',
            'chat_messages',
            'chat_files',
            'chat_reactions',
            'contact_messages',
            'products',
            'shop_clients',
            'sales',
            'sale_items',
            'purchase_orders',
            'purchase_order_items',
            'stock_movements',
            'till_sessions',
            'tax_returns',
            'workshop_jobs',
            'job_expenses',
            'deleted_items',
            'audit_logs',
            'exchange_rates',
            'trusted_devices',
            'verification_tokens',
            'tasks'
        ];

        for (const table of tables) {
            console.log(`Migrating table: ${table}...`);
            try {
                const data = await sqlN`SELECT * FROM ${sqlN(table)}`;
                
                if (data.length > 0) {
                    console.log(`- Found ${data.length} rows in ${table}. Transferring...`);
                    let successCount = 0;
                    let failCount = 0;

                    for (const item of data) {
                        try {
                            const cleanItem = sanitizeRow(item);
                            await sqlR`INSERT INTO ${sqlR(table)} ${sqlR(cleanItem)} ON CONFLICT DO NOTHING`;
                            successCount++;
                        } catch (itemError) {
                            failCount++;
                            // Only log few errors to avoid flooding
                            if (failCount < 5) {
                                console.error(`  [FAIL] Row at ${table}: ${itemError.message}`);
                            }
                        }
                    }
                    console.log(`- Table ${table} finished: ${successCount} synced, ${failCount} failed.`);
                } else {
                    console.log(`- Table ${table} is empty.`);
                }
            } catch (tableError) {
                console.error(`- Fatal Error for table ${table}:`, tableError.message);
            }
        }

        console.log('--- Full Migration Attempt Finished ---');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await sqlN.end();
        await sqlR.end();
    }
}

migrate();
