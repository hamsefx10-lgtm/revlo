
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/shop/till/close
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { closingCash, note } = body;

        if (closingCash === undefined || closingCash === null) {
            return NextResponse.json({ error: 'Closing cash amount is required' }, { status: 400 });
        }

        // Find open session
        const activeSession = await prisma.tillSession.findFirst({
            where: {
                userId: session.user.id,
                status: 'OPEN'
            }
        });

        if (!activeSession) {
            return NextResponse.json({ error: 'No open till session found.' }, { status: 404 });
        }

        // Calculate expected cash
        const cashSales = await prisma.sale.aggregate({
            where: {
                userId: session.user.id,
                createdAt: { gte: activeSession.openingTime },
                paymentMethod: 'Cash'
            },
            _sum: { total: true }
        });

        const salesTotal = cashSales._sum.total || 0;
        const expectedCash = activeSession.openingFloat + salesTotal;
        const actualCash = parseFloat(closingCash);
        const variance = actualCash - expectedCash; // Positive = Overage, Negative = Shortage

        // Update Session
        const updatedSession = await prisma.tillSession.update({
            where: { id: activeSession.id },
            data: {
                closingCash: actualCash,
                expectedCash,
                variance,
                closingTime: new Date(),
                status: 'CLOSED',
                note: note ? (activeSession.note ? activeSession.note + ' | ' + note : note) : activeSession.note
            }
        });

        // Optionally: Create a Transaction for the Variance?
        // Usually, shortages are recorded as expense, overages as income.
        // For now, we just record it in the TillSession. The manager can decide to book it later.

        return NextResponse.json({
            success: true,
            session: updatedSession,
            summary: {
                openingFloat: activeSession.openingFloat,
                salesTotal,
                expected: expectedCash,
                actual: actualCash,
                variance
            }
        });

    } catch (error) {
        console.error('Error closing till:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
