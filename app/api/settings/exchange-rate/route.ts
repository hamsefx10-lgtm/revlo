import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { startOfDay } from 'date-fns';




export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!currentUser?.companyId) {
            return NextResponse.json({ error: 'Company not found' }, { status: 400 });
        }

        const latestRate = await prisma.exchangeRate.findFirst({
            where: { companyId: currentUser.companyId },
            orderBy: { date: 'desc' }
        });

        return NextResponse.json({ rate: latestRate });
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { rate } = await req.json();
        if (rate === undefined || isNaN(rate)) {
            return NextResponse.json({ error: 'Valid rate is required' }, { status: 400 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!currentUser?.companyId) {
            return NextResponse.json({ error: 'Company not found' }, { status: 400 });
        }

        const today = startOfDay(new Date());

        const updatedRate = await prisma.exchangeRate.upsert({
            where: {
                date_companyId: {
                    date: today,
                    companyId: currentUser.companyId
                }
            },
            update: { rate: parseFloat(rate) },
            create: {
                rate: parseFloat(rate),
                date: today,
                companyId: currentUser.companyId
            }
        });

        return NextResponse.json({ rate: updatedRate });
    } catch (error: any) {
        console.error('Error updating exchange rate:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
