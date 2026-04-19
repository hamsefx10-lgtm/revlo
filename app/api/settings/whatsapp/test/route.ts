import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '@/app/api/projects/expenses/auth';
import { whatsappManager } from '@/lib/whatsapp/manager';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const companyId = await getSessionCompanyId();
        const { phoneNumber, message } = await request.json();

        if (!phoneNumber) {
            return NextResponse.json({ message: 'Nambarka taleefanka waa loo baahan yahay' }, { status: 400 });
        }

        // Get existing session
        const session = await whatsappManager.getSession(companyId);

        if (session.status !== 'CONNECTED') {
            return NextResponse.json({
                message: 'WhatsApp ma xirna. Fadlan marka hore bogga Settings → WhatsApp ku xir.'
            }, { status: 400 });
        }

        // ── Health-check: verify Puppeteer is still alive ──────────────────
        try {
            const state = await session.client.getState();
            if (!state) throw new Error('Client state is null');
        } catch (healthErr: any) {
            // Chrome has died (likely Hot-Reload) — softly reset without logging out
            console.warn('[WhatsApp Test] Client health-check failed, softly restarting session:', healthErr.message);
            await whatsappManager.softRestartSession(companyId);
            return NextResponse.json({
                message: 'Chrome ayaa yara dib u kacay. Fadlan bogga hal-mar refresh dheh, isaga ayaa si toos ah isugu soo xidhmaya!',
                reconnecting: true
            }, { status: 503 });
        }
        // ──────────────────────────────────────────────────────────────────

        // Format phone number
        let formattedPhone = phoneNumber.replace(/[\+\s\-\(\)]/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '251' + formattedPhone.substring(1);
        }
        if (!formattedPhone.endsWith('@c.us')) {
            formattedPhone = `${formattedPhone}@c.us`;
        }

        const finalMessage = message || '✅ Tijaabo: Revlo WhatsApp integration-kaagu si guul leh ayuu u shaqeynayaa! 🎉';

        try {
            await session.client.sendMessage(formattedPhone, finalMessage);
            return NextResponse.json({ message: 'Farriinta tijaabada ah si guul leh ayaa loo diray! ✅' });
        } catch (sendErr: any) {
            // If sending itself fails (TargetCloseError etc.), force a clean reset
            const isDeadBrowser = sendErr.message?.includes('Target closed') ||
                sendErr.message?.includes('Session closed') ||
                sendErr.message?.includes('Protocol error');

            if (isDeadBrowser) {
                console.warn('[WhatsApp Test] Dead browser detected during send, resetting session...');
                try { await whatsappManager.logoutSession(companyId); } catch (e) {}
                return NextResponse.json({
                    message: 'WhatsApp browser-kii xidhmay. Bogga refresh gareey — QR code cusub ayaa soo baxi doona.',
                    reconnecting: true
                }, { status: 503 });
            }

            throw sendErr; // Re-throw other errors
        }

    } catch (error: any) {
        console.error('[WhatsApp Test API] Unhandled error:', error);
        return NextResponse.json({
            message: 'Cilad ayaa dhacday: ' + (error.message || 'Server error'),
        }, { status: 500 });
    }
}
