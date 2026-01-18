import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// PUT /api/shop/accounts/[id] - Update Account
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = params;
        const body = await req.json();
        const { name, type, description } = body;

        const account = await prisma.account.update({
            where: { id },
            data: { name, type, description }
        });

        return NextResponse.json(account);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
    }
}

// DELETE /api/shop/accounts/[id] - Delete Account
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = params;

        // Check for transactions
        const transactions = await prisma.transaction.count({
            where: { accountId: id }
        });

        if (transactions > 0) {
            // Alternatively, mark as inactive instead of delete?
            // For now, prevent delete.
            return NextResponse.json({ error: 'Cannot delete account with existing transactions.' }, { status: 400 });
        }

        await prisma.account.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }
}
