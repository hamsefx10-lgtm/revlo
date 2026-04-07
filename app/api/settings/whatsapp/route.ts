import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '@/app/api/projects/expenses/auth';
import { whatsappManager } from '@/lib/whatsapp/manager';
import prisma from '@/lib/db';
import fs from 'fs';

// Version: 2.0.1 - Force Reload
const LOG_FILE = 'c:/Users/OMEN/projects/revlo-vr/whatsapp_logs.txt';
function logToFile(msg: string) {
    fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] [API] ${msg}\n`);
}


export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    logToFile('GET /api/settings/whatsapp');
    try {
        const companyId = await getSessionCompanyId();
        logToFile(`Company ID: ${companyId}`);

        // Trigger session initialization or get existing


        const session = await whatsappManager.getSession(companyId);
        logToFile(`Session Status: ${session.status}`);

        return NextResponse.json({
            status: session.status,
            qrCodeDataUrl: session.qrCodeDataUrl,
            phoneNumber: session.phoneNumber,
            lastUpdated: session.lastUpdated,
        });
    } catch (error) {
        console.error('[WhatsApp API] Error fetching status:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    logToFile('DELETE /api/settings/whatsapp');
    try {
        const companyId = await getSessionCompanyId();
        logToFile(`Logging out company: ${companyId}`);
        await whatsappManager.logoutSession(companyId);
        return NextResponse.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('[WhatsApp API] Error logging out:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
