const { Client, LocalAuth } = require('whatsapp-web.js');
const path = require('path');

async function debugWhatsApp() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';
    console.log(`[Debug] Initializing WhatsApp for company: ${companyId}`);

    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: `company-${companyId}`,
            dataPath: path.join(process.cwd(), '.wwebjs_auth')
        }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-extensions',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
            ],
            ignoreHTTPSErrors: true,
        },
    });

    client.on('qr', (qr) => {
        console.log('[Debug] QR RECEIVED:', qr.substring(0, 50) + '...');
    });

    client.on('ready', () => {
        console.log('[Debug] Client is ready!');
    });

    client.on('error', (err) => {
        console.error('[Debug] Client ERROR:', err);
    });

    client.on('auth_failure', (msg) => {
        console.error('[Debug] AUTH FAILURE:', msg);
    });

    console.log('[Debug] Starting initialization...');
    try {
        await client.initialize();
        console.log('[Debug] Initialization promise resolved.');
    } catch (err) {
        console.error('[Debug] CRITICAL: Initialization FAILED!', err);
    }
}

debugWhatsApp().catch(console.error);
