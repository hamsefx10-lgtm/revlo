import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '@/app/api/projects/expenses/auth';
import { whatsappManager } from '@/lib/whatsapp/manager';

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
            return NextResponse.json({ message: 'WhatsApp ma xirna. Fadlan marka hore xir.' }, { status: 400 });
        }

        // Format phone number for WhatsApp:
        // Remove all non-digit characters (spaces, +, -, etc.)
        let formattedPhone = phoneNumber.replace(/[\+\s\-\(\)]/g, '');

        // If number starts with 0, replace with Ethiopian country code 251
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '251' + formattedPhone.substring(1);
        }

        // Append WhatsApp suffix if not already present
        if (!formattedPhone.endsWith('@c.us')) {
            formattedPhone = `${formattedPhone}@c.us`;
        }

        // Send the test message
        const finalMessage = message || "Tijaabo: Revlo WhatsApp integration-kaagu si guul leh ayuu u shaqeynayaa! 🎉";
        await session.client.sendMessage(formattedPhone, finalMessage);

        return NextResponse.json({ message: 'Farriinta tijaabada ah si guul leh ayaa loo diray!' });
    } catch (error: any) {
        console.error('[WhatsApp Test API] Error sending test message:', error);
        return NextResponse.json({
            message: 'Cilad ayaa dhacday marka farriinta la dirayay.',
            error: error.message
        }, { status: 500 });
    }
}
