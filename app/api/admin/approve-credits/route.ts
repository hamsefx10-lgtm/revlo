import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const SUPER_ADMIN_ID = process.env.SUPER_ADMIN_ID;
        if (session?.user?.id !== SUPER_ADMIN_ID) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { requestId, action } = await req.json();

        if (!requestId || !action) {
            return NextResponse.json({ error: 'Missing requestId or action' }, { status: 400 });
        }

        const request = await prisma.approvalRequest.findUnique({
            where: { id: requestId },
            include: { company: true }
        });

        if (!request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        if (request.status !== 'PENDING') {
            return NextResponse.json({ error: 'Request is already processed' }, { status: 400 });
        }

        if (action === 'APPROVE') {
            const requestData = request.requestData as any;
            const creditsToAdd = Number(requestData.credits || 0);

            // 1. Update Company Credits
            await prisma.company.update({
                where: { id: request.companyId },
                data: {
                    scanCredits: {
                        increment: creditsToAdd
                    }
                }
            });

            // 2. Mark Request as APPROVED
            await prisma.approvalRequest.update({
                where: { id: requestId },
                data: {
                    status: 'APPROVED',
                    approvedById: session.user.id
                }
            });

            // 3. Optional: Create Audit Log
            await prisma.auditLog.create({
                data: {
                    action: 'APPROVE_CREDITS',
                    entity: 'Company',
                    entityId: request.companyId,
                    details: `Approved ${creditsToAdd} credits. Reference: ${requestData.reference}`,
                    userId: session.user.id,
                    companyId: request.companyId
                }
            });

            return NextResponse.json({ success: true, message: 'Credits approved and added' });
        } else if (action === 'REJECT') {
            await prisma.approvalRequest.update({
                where: { id: requestId },
                data: {
                    status: 'REJECTED',
                    approvedById: session.user.id
                }
            });
            return NextResponse.json({ success: true, message: 'Request rejected' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('[Approve Credits POST] Error:', error?.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
