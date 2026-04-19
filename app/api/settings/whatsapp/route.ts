import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '@/app/api/projects/expenses/auth';
import { whatsappManager } from '@/lib/whatsapp/manager';
import prisma from '@/lib/db';
import fs from 'fs';

export const dynamic = 'force-dynamic';

const LOG_FILE = 'c:/Users/OMEN/projects/revlo-vr/whatsapp_logs.txt';
function logToFile(msg: string) {
    try { fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] [API] ${msg}\n`); } catch (e) {}
}

export async function GET(request: Request) {
    logToFile('GET /api/settings/whatsapp');
    try {
        const companyId = await getSessionCompanyId();
        logToFile(`Company ID: ${companyId}`);

        // 1. Get in-memory session first
        const session = await whatsappManager.getSession(companyId);
        logToFile(`Session Status: ${session.status}, QR: ${session.qrCodeDataUrl ? 'YES' : 'NO'}, Phone: ${session.phoneNumber}`);

        // 2. If session is CONNECTED → return immediately
        if (session.status === 'CONNECTED') {
            return NextResponse.json({
                status: 'CONNECTED',
                qrCodeDataUrl: null,
                phoneNumber: session.phoneNumber,
                lastUpdated: session.lastUpdated,
            });
        }

        // 3. If CONNECTING but QR not yet generated → check DB for a previously saved number
        //    (happens after server restart when WhatsApp was already connected before)
        if (session.status === 'CONNECTING' && !session.qrCodeDataUrl) {
            try {
                const company = await prisma.company.findUnique({
                    where: { id: companyId },
                    select: { whatsappSessionStatus: true, whatsappNumber: true }
                });

                if (company?.whatsappSessionStatus === 'CONNECTED' && company?.whatsappNumber) {
                    logToFile(`DB shows CONNECTED with number ${company.whatsappNumber}, returning DB state`);
                    return NextResponse.json({
                        status: 'CONNECTED',
                        qrCodeDataUrl: null,
                        phoneNumber: company.whatsappNumber,
                        lastUpdated: Date.now(),
                    });
                }
            } catch (dbErr) {
                logToFile(`DB check failed: ${dbErr}`);
            }

            // Still waiting for QR → return CONNECTING state
            return NextResponse.json({
                status: 'CONNECTING',
                qrCodeDataUrl: null,
                phoneNumber: null,
                lastUpdated: session.lastUpdated,
            });
        }

        // 4. CONNECTING + QR ready → return QR for scanning
        if (session.status === 'CONNECTING' && session.qrCodeDataUrl) {
            return NextResponse.json({
                status: 'CONNECTING',
                qrCodeDataUrl: session.qrCodeDataUrl,
                phoneNumber: null,
                lastUpdated: session.lastUpdated,
            });
        }

        // 5. DISCONNECTED → also check DB
        try {
            const company = await prisma.company.findUnique({
                where: { id: companyId },
                select: { whatsappSessionStatus: true, whatsappNumber: true }
            });
            if (company?.whatsappSessionStatus === 'CONNECTED' && company?.whatsappNumber) {
                logToFile(`Session DISCONNECTED in memory but DB shows CONNECTED — returning DB state`);
                return NextResponse.json({
                    status: 'CONNECTED',
                    qrCodeDataUrl: null,
                    phoneNumber: company.whatsappNumber,
                    lastUpdated: Date.now(),
                });
            }
        } catch (dbErr) {
            logToFile(`DB check failed: ${dbErr}`);
        }

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
        // Also clear DB status
        try {
            await prisma.company.update({
                where: { id: companyId },
                data: { whatsappSessionStatus: 'DISCONNECTED', whatsappNumber: null }
            });
        } catch (e) {}
        return NextResponse.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('[WhatsApp API] Error logging out:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
