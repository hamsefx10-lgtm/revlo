import postgres from 'postgres';

const NEON_URL = 'postgresql://neondb_owner:npg_kDcYIZvOL74J@ep-blue-violet-ad0xhu8r-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const RAILWAY_URL = 'postgresql://postgres:mgiDtiBmrTjEuYHWZVwxPtpruskpvqem@ballast.proxy.rlwy.net:21779/railway';

const sqlN = postgres(NEON_URL, { ssl: 'require' });
const sqlR = postgres(RAILWAY_URL, { ssl: 'require' });

const mapping = [{"model":"Wallet","table":"wallets"},{"model":"User","table":"users"},{"model":"TrustedDevice","table":"trusted_devices"},{"model":"VerificationToken","table":"verification_tokens"},{"model":"Task","table":"tasks"},{"model":"Company","table":"companies"},{"model":"Shareholder","table":"shareholders"},{"model":"Project","table":"projects"},{"model":"ProjectMaterial","table":"project_materials"},{"model":"ProjectLabor","table":"project_labor"},{"model":"CompanyLabor","table":"company_labor"},{"model":"ProjectDocument","table":"project_documents"},{"model":"Payment","table":"payments"},{"model":"Employee","table":"employees"},{"model":"EmployeeAttendance","table":"employee_attendance"},{"model":"ExpenseCategory","table":"expense_categories"},{"model":"Expense","table":"expenses"},{"model":"InventoryItem","table":"inventory_items"},{"model":"FixedAsset","table":"fixed_assets"},{"model":"Customer","table":"customers"},{"model":"ShopVendor","table":"shop_vendors"},{"model":"Account","table":"accounts"},{"model":"Transaction","table":"transactions"},{"model":"Notification","table":"notifications"},{"model":"PendingExpense","table":"pending_expenses"},{"model":"TelegramChat","table":"telegram_chats"},{"model":"TelegramUserLink","table":"telegram_user_links"},{"model":"PersonalizationSettings","table":"personalization_settings"},{"model":"ProductCatalog","table":"product_catalog"},{"model":"ProductionOrder","table":"production_orders"},{"model":"BillOfMaterial","table":"bill_of_materials"},{"model":"WorkOrder","table":"work_orders"},{"model":"FiscalYear","table":"fiscal_years"},{"model":"MaterialPurchase","table":"material_purchases"},{"model":"CostTracking","table":"cost_tracking"},{"model":"ManufacturingUsed","table":"manufacturing_used"},{"model":"ChatRoom","table":"chat_rooms"},{"model":"ChatMember","table":"chat_members"},{"model":"ChatMessage","table":"chat_messages"},{"model":"ChatFile","table":"chat_files"},{"model":"ChatReaction","table":"chat_reactions"},{"model":"ContactMessage","table":"contact_messages"},{"model":"Product","table":"products"},{"model":"FactoryMaterial","table":"factory_materials"},{"model":"ShopClient","table":"shop_clients"},{"model":"Sale","table":"sales"},{"model":"SaleItem","table":"sale_items"},{"model":"PurchaseOrder","table":"purchase_orders"},{"model":"PurchaseOrderItem","table":"purchase_order_items"},{"model":"StockMovement","table":"stock_movements"},{"model":"TillSession","table":"till_sessions"},{"model":"TaxReturn","table":"tax_returns"},{"model":"WorkshopJob","table":"workshop_jobs"},{"model":"JobExpense","table":"job_expenses"},{"model":"DeletedItem","table":"deleted_items"},{"model":"AuditLog","table":"audit_logs"},{"model":"ExchangeRate","table":"exchange_rates"}];

async function run() {
    console.log('| Table | Neon | Railway | Status |');
    console.log('| :--- | :--- | :--- | :--- |');
    for (const m of mapping) {
        try {
            const cN = await sqlN.unsafe(`SELECT count(*) FROM ${m.table}`);
            const cR = await sqlR.unsafe(`SELECT count(*) FROM ${m.table}`);
            const status = cN[0].count === cR[0].count ? '✅ Match' : '❌ Mismatch';
            console.log(`| ${m.table} | ${cN[0].count} | ${cR[0].count} | ${status} |`);
        } catch (e) {
            console.log(`| ${m.table} | ERROR | ERROR | ⚠️ Failed to Check |`);
        }
    }
    await sqlN.end();
    await sqlR.end();
    process.exit(0);
}

run();
