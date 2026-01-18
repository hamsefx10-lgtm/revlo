import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/shop/customers
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';

        const where: any = {
            userId: session.user.id,
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const customers = await prisma.shopClient.findMany({
            where,
            orderBy: {
                name: 'asc',
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                status: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ customers });
    } catch (error) {
        console.error('Error fetching customers:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/shop/customers
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, email, phone, address, status } = body;

        if (!name || !phone) {
            return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
        }

        const customer = await prisma.shopClient.create({
            data: {
                name,
                email: email || null,
                phone,
                address: address || null,
                status: status || 'Active',
                userId: session.user.id,
            },
        });

        return NextResponse.json({ customer }, { status: 201 });
    } catch (error) {
        console.error('Error creating customer:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

