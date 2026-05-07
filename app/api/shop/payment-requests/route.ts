import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const companyId = (session as any).user.companyId;
        if (!companyId) return NextResponse.json({ error: 'No company found' }, { status: 400 });

        const body = await req.json();
        const { packageId, packageName, amount, credits, paymentMethod, reference } = body;

        if (!packageId || !amount || !reference) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create an approval request
        const requestData = {
            packageId,
            packageName,
            amount,
            credits,
            paymentMethod,
            reference,
            timestamp: new Date().toISOString()
        };

        const approvalRequest = await prisma.approvalRequest.create({
            data: {
                type: 'BUY_CREDITS',
                entityType: 'Company',
                entityId: companyId,
                requestData,
                reason: `Payment submitted via ${paymentMethod}. Ref: ${reference}`,
                status: 'PENDING',
                requestedById: session.user.id,
                companyId: companyId
            }
        });

        return NextResponse.json({ success: true, request: approvalRequest });
    } catch (error: any) {
        console.error('[Payment Request POST] Error:', error?.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
