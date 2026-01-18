import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });
        if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 400 });

        const assets = await prisma.fixedAsset.findMany({
            where: { companyId: user.companyId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ assets });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });
        if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 400 });

        const body = await req.json();
        const { name, type, value, purchased, depreciation } = body;

        const newAsset = await prisma.fixedAsset.create({
            data: {
                name,
                type,
                value: Number(value),
                purchaseDate: new Date(purchased),
                depreciationRate: parseFloat(depreciation),
                currentBookValue: Number(value),
                companyId: user.companyId
            }
        });

        return NextResponse.json({ asset: newAsset });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
