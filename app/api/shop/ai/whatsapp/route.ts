import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendAiWhatsAppMessage, sendBulkWhatsAppMessages } from '@/lib/whatsapp/send-ai-message';

export const dynamic = 'force-dynamic';

// POST /api/shop/ai/whatsapp — Send WhatsApp messages via AI
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const companyId = session.user.companyId;
        if (!companyId) return NextResponse.json({ error: 'Company ID missing' }, { status: 400 });

        const body = await req.json();
        const { action } = body;

        // ─── SINGLE MESSAGE ───
        if (action === 'send-single') {
            const { phone, message, customerName } = body;
            if (!phone || !message) {
                return NextResponse.json({ error: 'Phone and message required' }, { status: 400 });
            }

            const result = await sendAiWhatsAppMessage(companyId, phone, message);

            // Log the action
            await prisma.auditLog.create({
                data: {
                    companyId,
                    userId: session.user.id,
                    action: 'WHATSAPP_SEND',
                    entity: 'WhatsApp',
                    entityId: phone,
                    details: `[Revlo AI] WhatsApp sent to ${customerName || phone}: "${message.substring(0, 80)}..."`
                }
            });

            return NextResponse.json(result);
        }

        // ─── BULK MESSAGE ───
        if (action === 'send-bulk') {
            const { filter, message: msgTemplate } = body;
            if (!filter || !msgTemplate) {
                return NextResponse.json({ error: 'Filter and message required' }, { status: 400 });
            }

            let recipients: { phone: string; name: string }[] = [];

            if (filter === 'all-customers') {
                const customers = await prisma.shopClient.findMany({
                    where: { companyId, phone: { not: '' } },
                    select: { name: true, phone: true }
                });
                recipients = customers.map(c => ({ name: c.name, phone: c.phone || '' })).filter(r => r.phone);
            } else if (filter === 'debtors') {
                const debtors = await prisma.sale.findMany({
                    where: { companyId, paymentStatus: { in: ['Partial', 'Unpaid'] } },
                    include: { customer: { select: { name: true, phone: true } } },
                    distinct: ['customerId']
                });
                recipients = debtors
                    .filter(d => d.customer?.phone)
                    .map(d => ({ name: d.customer!.name, phone: d.customer!.phone || '' }));
            } else if (filter === 'vendors') {
                const vendors = await prisma.shopVendor.findMany({
                    where: { companyId, phone: { not: '' } },
                    select: { name: true, phone: true }
                });
                recipients = vendors.map(v => ({ name: v.name, phone: v.phone || '' })).filter(r => r.phone);
            }

            if (recipients.length === 0) {
                return NextResponse.json({ error: 'No recipients found with phone numbers.' }, { status: 400 });
            }

            const result = await sendBulkWhatsAppMessages(companyId, recipients, msgTemplate);

            // Log the action
            await prisma.auditLog.create({
                data: {
                    companyId,
                    userId: session.user.id,
                    action: 'WHATSAPP_BULK',
                    entity: 'WhatsApp',
                    entityId: `BULK_${filter}`,
                    details: `[Revlo AI] Bulk WhatsApp to ${filter}: ${result.sent} sent, ${result.failed} failed`
                }
            });

            return NextResponse.json({
                success: true,
                sent: result.sent,
                failed: result.failed,
                total: recipients.length,
                errors: result.errors
            });
        }

        // ─── SEND REPORT TO MANAGER ───
        if (action === 'send-report') {
            // Get the company owner separately to avoid Prisma include issues
            const owner = await prisma.user.findFirst({
                where: { companyId },
                orderBy: { createdAt: 'asc' },
                select: { phone: true, fullName: true }
            });

            if (!owner?.phone) {
                return NextResponse.json({ error: 'Owner phone number not found.' }, { status: 400 });
            }

            // Build a quick summary
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const [todaySales, lowStock, pendingDebts] = await Promise.all([
                prisma.sale.aggregate({ _sum: { total: true }, _count: { id: true }, where: { companyId, createdAt: { gte: today } } }),
                prisma.product.count({ where: { companyId, stock: { lte: 5 } } }),
                prisma.sale.aggregate({ _sum: { total: true }, where: { companyId, paymentStatus: { in: ['Partial', 'Unpaid'] } } })
            ]);

            const reportMsg = `📊 *WARBIXINTA MAANTA*\n\n` +
                `💰 Iibka Maanta: ETB ${Number(todaySales._sum.total || 0).toLocaleString()} (${todaySales._count.id} iib)\n` +
                `📦 Alaab Stock Hoose: ${lowStock} nooc\n` +
                `💳 Lacag La Qaadanayo: ETB ${Number(pendingDebts._sum.total || 0).toLocaleString()}\n\n` +
                `_Warbixintan waxaa soo saaray Revlo AI si otomaatig ah._`;

            const result = await sendAiWhatsAppMessage(companyId, owner.phone, reportMsg);

            await prisma.auditLog.create({
                data: {
                    companyId,
                    userId: session.user.id,
                    action: 'WHATSAPP_REPORT',
                    entity: 'WhatsApp',
                    entityId: owner.phone,
                    details: `[Revlo AI] Daily report sent to manager ${owner.fullName}`
                }
            });

            return NextResponse.json(result);
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

    } catch (error: any) {
        console.error('[AI WhatsApp API Error]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
