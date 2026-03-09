import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendShopReceiptViaWhatsApp } from '@/lib/whatsapp/send-shop-receipt';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const sale = await (prisma as any).sale.findUnique({
            where: { id: params.id },
            include: {
                customer: true,
                company: true,
                items: true,
                user: true
            }
        });

        if (!sale) {
            return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
        }

        if (sale.companyId !== session.user.companyId) {
            return NextResponse.json({ error: 'Unauthorized sale access' }, { status: 403 });
        }

        const vendorPhone = sale.customer?.phone;
        const companyName = sale.company?.name || 'Company';

        if (!vendorPhone) {
            return NextResponse.json({ error: 'No phone number associated with this customer' }, { status: 400 });
        }

        const success = await sendShopReceiptViaWhatsApp(sale.companyId, companyName, vendorPhone, sale);

        if (success) {
            return NextResponse.json({ message: 'Receipt sent successfully via WhatsApp' }, { status: 200 });
        } else {
            return NextResponse.json({ error: 'Failed to send WhatsApp receipt. Ensure WhatsApp account is linked and active.' }, { status: 500 });
        }

    } catch (error: any) {
        console.error('WhatsApp Receipt Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
