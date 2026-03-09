import { Client, LocalAuth } from 'whatsapp-web.js';
import { updateCompanyWhatsAppStatus } from './store';
import qrcode from 'qrcode';
import path from 'path';
import fs from 'fs';

const LOG_FILE = 'c:/Users/OMEN/projects/revlo-vr/whatsapp_logs.txt';

export function logToFile(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    try {
        fs.appendFileSync(LOG_FILE, logMessage);
    } catch (e) {
        // console.error('Failed to write to log file:', e);
    }
    console.log(message);
}

const clearLockFile = (clientId: string) => {
    try {
        const lockPath = path.join(process.cwd(), '.wwebjs_auth', `session-${clientId}`, 'SingletonLock');
        if (fs.existsSync(lockPath)) {
            logToFile(`[WhatsApp] Force-clearing lock file at ${lockPath}`);
            fs.unlinkSync(lockPath);
        }
    } catch (e) {
        logToFile(`[WhatsApp] Failed to clear lock file: ${e}`);
    }
    // Also try to clear the data directory lock if it exists (for newer puppeteer/chrome)
    try {
        const parentLock = path.join(process.cwd(), '.wwebjs_auth', `session-${clientId}`, 'lockfile');
        if (fs.existsSync(parentLock)) {
            logToFile(`[WhatsApp] Force-clearing parent lock file at ${parentLock}`);
            fs.unlinkSync(parentLock);
        }
    } catch (e) { }
};

logToFile('[WhatsApp Manager] Module Loaded / Hot Reloaded');

// --- CLEANUP FOR OLD SINGLETONS ---
if (typeof global !== 'undefined') {
    // Try to cleanup OLD versions of the manager to release locks
    const oldManagers = [
        (global as any).prismaWhatsAppManager,
        (global as any).prismaWhatsAppManager_v2, // Add the current v2 name
    ];

    for (const oldManager of oldManagers) {
        if (oldManager && typeof oldManager.cleanupSessions === 'function') {
            logToFile('[WhatsApp Manager] Cleaning up sessions from an OLD singleton instance...');
            oldManager.cleanupSessions().catch((e: any) => logToFile(`[WhatsApp] Failed to cleanup old manager: ${e}`));
        }
    }
}
// ----------------------------------
interface CompanySession {
    client: Client;
    qrCodeDataUrl: string | null;
    status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED';
    phoneNumber: string | null;
    lastUpdated: number;
}

class WhatsAppManager {
    private sessions: Map<string, CompanySession> = new Map();

    constructor() {
        logToFile('[WhatsApp Manager] New instance created (Constructor)');
    }

    // Temporary fix for puppeteer executable path in different environments if needed
    private getPuppeteerOptions() {
        logToFile('[WhatsApp] Getting Puppeteer options...');
        return {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-extensions',
                '--disable-gpu',
                '--disable-setuid-sandbox',
                '--no-first-run',
                '--no-zygote',
                // Removed --single-process as it can cause deadlocks on Windows
            ],
            ignoreHTTPSErrors: true,
            // Timeout settings to prevent hangs
            waitTimeout: 60000,
        };
    }

    /**
     * Initializes or fetches an existing session for a given company.
     */
    public async getSession(companyId: string): Promise<CompanySession> {
        if (this.sessions.has(companyId)) {
            const existingSession = this.sessions.get(companyId)!;
            // If the session is stuck or disconnected, let's clear it to allow a retry
            const isStuck = existingSession.status === 'CONNECTING' && (Date.now() - existingSession.lastUpdated > 30000);

            if (existingSession.status === 'DISCONNECTED' || isStuck) {
                logToFile(`[WhatsApp] Removing existing ${isStuck ? 'STUCK ' : ''}${existingSession.status} session for company ${companyId} to allow retry.`);
                // Cleanup the client before deleting
                try {
                    existingSession.client.destroy();
                } catch (e) { }
                this.sessions.delete(companyId);
            } else {
                logToFile(`[WhatsApp] Returning existing ${existingSession.status} session for company ${companyId}.`);
                return existingSession;
            }
        }

        // Set up a new client instance
        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: `company-${companyId}-v2`,
                // Store sessions in a reliable path
                dataPath: path.join(process.cwd(), '.wwebjs_auth')
            }),
            puppeteer: this.getPuppeteerOptions(),
        });

        const session: CompanySession = {
            client,
            qrCodeDataUrl: null,
            status: 'CONNECTING',
            phoneNumber: null,
            lastUpdated: Date.now(),
        };

        this.sessions.set(companyId, session);

        // Event Listeners
        client.on('qr', async (qr) => {
            logToFile(`[WhatsApp] QR Code string received for company ${companyId}: ${qr.substring(0, 20)}...`);
            try {
                const dataUrl = await qrcode.toDataURL(qr);
                session.qrCodeDataUrl = dataUrl;
                session.status = 'CONNECTING';
                session.lastUpdated = Date.now();
                await updateCompanyWhatsAppStatus(companyId, 'CONNECTING');
                logToFile(`[WhatsApp] QR Code data URL generated successfully for company ${companyId}`);
            } catch (err) {
                logToFile(`[WhatsApp] Failed to generate QR code data URL for company ${companyId}: ${err}`);
            }
        });

        client.on('loading_screen', (percent, message) => {
            logToFile(`[WhatsApp] Loading: ${percent}% - ${message}`);
        });

        client.on('ready', async () => {
            logToFile(`[WhatsApp] Client is ready for company ${companyId}`);
            session.qrCodeDataUrl = null;
            session.status = 'CONNECTED';
            session.phoneNumber = client.info?.wid?.user || null;
            session.lastUpdated = Date.now();

            await updateCompanyWhatsAppStatus(companyId, 'CONNECTED', session.phoneNumber);
        });

        client.on('authenticated', () => {
            logToFile(`[WhatsApp] Authenticated for company ${companyId}`);
        });

        client.on('auth_failure', async (msg) => {
            logToFile(`[WhatsApp] Authentication failure for company ${companyId}: ${msg}`);
            session.status = 'DISCONNECTED';
            session.qrCodeDataUrl = null;
            await updateCompanyWhatsAppStatus(companyId, 'DISCONNECTED', null);
        });

        client.on('disconnected', async (reason) => {
            logToFile(`[WhatsApp] Client was logged out or disconnected for company ${companyId}: ${reason}`);
            session.status = 'DISCONNECTED';
            session.qrCodeDataUrl = null;
            session.phoneNumber = null;
            await updateCompanyWhatsAppStatus(companyId, 'DISCONNECTED', null);

            // We optionally remove it from memory so it can be re-initialized cleanly
            this.sessions.delete(companyId);
        });

        // Simple AI Agent / Auto-responder placeholder for vendors
        client.on('message', async (msg) => {
            if (msg.from === 'status@broadcast') return;

            logToFile(`[WhatsApp] Message received for company ${companyId} from ${msg.from}: ${msg.body}`);
        });

        // Start the initialization process asynchronously without blocking
        logToFile(`[WhatsApp] Starting client.initialize() for company ${companyId}...`);
        client.initialize().then(() => {
            logToFile(`[WhatsApp] client.initialize() promise resolved for company ${companyId}`);
        }).catch((err: any) => {
            const isLockError = err?.message?.includes('The browser is already running');
            logToFile(`[WhatsApp] ${isLockError ? 'LOCK ERROR' : 'CRITICAL'}: Failed to initialize client for company ${companyId}. Error: ${err?.message || err}`);

            if (isLockError) {
                logToFile(`[WhatsApp] Attempting to force-clear lock file and retry next time...`);
                clearLockFile(`company-${companyId}-v2`);
            }

            session.status = 'DISCONNECTED';
            session.qrCodeDataUrl = null;
            updateCompanyWhatsAppStatus(companyId, 'DISCONNECTED', null);
            // Remove from memory so next call to getSession can try fresh
            this.sessions.delete(companyId);
        });

        return session;
    }

    /**
     * Forces a logout and destroys the session for a company.
     */
    public async logoutSession(companyId: string) {
        if (this.sessions.has(companyId)) {
            const session = this.sessions.get(companyId)!;
            try {
                await session.client.logout();
            } catch (e) {
                console.error(`[WhatsApp] Error logging out company ${companyId}`, e);
                // Force destruction if logout fails
                try {
                    await session.client.destroy();
                } catch (e2) { }
            }
            this.sessions.delete(companyId);
            await updateCompanyWhatsAppStatus(companyId, 'DISCONNECTED', null);
        }
    }

    /**
     * Cleans up all active sessions (used during module reloads).
     */
    public async cleanupSessions() {
        logToFile('[WhatsApp Manager] Cleaning up all active sessions...');
        const cleanupPromises = [];
        for (const [companyId, session] of this.sessions.entries()) {
            logToFile(`[WhatsApp Manager] Destroying session for company ${companyId}...`);
            cleanupPromises.push(
                session.client.destroy().catch((e) => logToFile(`Failed to destroy client for company ${companyId}: ${e}`))
            );
        }
        await Promise.all(cleanupPromises);
        this.sessions.clear();
    }
}

// --- CLEANUP FOR OLD SINGLETONS ---
if (typeof global !== 'undefined') {
    // Try to cleanup OLD versions of the manager to release locks
    const oldManagers = [
        (global as any).prismaWhatsAppManager,
        (global as any).prismaWhatsAppManager_v2,
        (global as any).prismaWhatsAppManager_v3,
        (global as any).prismaWhatsAppManager_v4, // Self-cleanup if reloaded
    ];

    for (const oldManager of oldManagers) {
        if (oldManager && typeof oldManager.cleanupSessions === 'function') {
            logToFile('[WhatsApp Manager] Cleaning up sessions from an OLD singleton instance...');
            oldManager.cleanupSessions().catch((e: any) => logToFile(`[WhatsApp] Failed to cleanup old manager: ${e}`));
        }
    }
}
// ...
logToFile('[WhatsApp Manager] Module Loaded (Force Fresh v4)');

// Ensure non-blocking singleton in dev (hot reloads) and prod
declare global {
    var prismaWhatsAppManager_v4: WhatsAppManager | undefined;
}

export const whatsappManager =
    global.prismaWhatsAppManager_v4 || new WhatsAppManager();

if (process.env.NODE_ENV !== 'production') {
    global.prismaWhatsAppManager_v4 = whatsappManager;
}
