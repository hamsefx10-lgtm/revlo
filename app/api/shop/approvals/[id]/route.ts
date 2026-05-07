import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const { action } = await req.json(); // 'APPROVE' or 'REJECT'

        if (action !== 'APPROVE' && action !== 'REJECT') {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true, role: true }
        });

        // Only ADMIN or MANAGER can approve/reject
        if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER' && user.role !== 'SUPER_ADMIN')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const request = await prisma.approvalRequest.findUnique({
            where: { id, companyId: user.companyId }
        });

        if (!request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        if (request.status !== 'PENDING') {
            return NextResponse.json({ error: 'Request is already processed' }, { status: 400 });
        }

        const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

        // Process the request in a transaction
        await prisma.$transaction(async (tx) => {
            // 1. Update the request status
            await tx.approvalRequest.update({
                where: { id },
                data: {
                    status: newStatus,
                    approvedById: session.user.id
                }
            });

            // 2. If approved, execute the requested action
            if (newStatus === 'APPROVED') {
                const payload = request.requestData as any;
                
                if (request.type === 'DELETE_TRANSACTION') {
                    // Logic to delete transaction
                    // For now, we simulate this or just log it
                    // In a real app, we'd do: await tx.transaction.delete({ where: { id: request.entityId } });
                    // Also need to reverse any balances. This requires complex logic depending on transaction type.
                    
                    // For demonstration of the workflow, we'll log it
                    await tx.auditLog.create({
                        data: {
                            action: 'APPROVED_DELETION',
                            entity: request.entityType,
                            entityId: request.entityId,
                            details: `Approved deletion request for ${request.entityType}`,
                            userId: session.user.id,
                            companyId: user.companyId
                        }
                    });
                } else if (request.type === 'APPLY_DISCOUNT') {
                    // Logic to apply discount
                    await tx.auditLog.create({
                        data: {
                            action: 'APPROVED_DISCOUNT',
                            entity: request.entityType,
                            entityId: request.entityId,
                            details: `Approved discount request`,
                            userId: session.user.id,
                            companyId: user.companyId
                        }
                    });
                }
            } else {
                // If rejected, log it
                await tx.auditLog.create({
                    data: {
                        action: 'REJECTED_REQUEST',
                        entity: 'ApprovalRequest',
                        entityId: id,
                        details: `Rejected request of type ${request.type}`,
                        userId: session.user.id,
                        companyId: user.companyId
                    }
                });
            }
        });

        return NextResponse.json({ message: `Request ${newStatus.toLowerCase()}` });
    } catch (error) {
        console.error('Error processing approval:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
