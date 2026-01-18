import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/shop/employees - List employees
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';

        // Get User Company
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'User company not found' }, { status: 400 });
        }

        const where: any = {
            companyId: user.companyId
        };

        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { role: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        const employees = await prisma.employee.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ employees });
    } catch (error) {
        console.error('Error fetching employees:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/shop/employees - Create Employee
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { fullName, email, phone, role, salary, shift, status } = body;

        if (!fullName || !role) {
            return NextResponse.json({ error: 'Name and Role are required' }, { status: 400 });
        }

        // Get User Company
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'User company not found' }, { status: 400 });
        }

        const employee = await prisma.employee.create({
            data: {
                fullName,
                email: email || null,
                phone: phone || null,
                role,
                monthlySalary: salary ? parseFloat(salary) : 0,
                companyId: user.companyId,
                isActive: status === 'Active',
                // Additional fields to store shift/status if needed, but schema might not have them?
                // Schema has `isActive` (boolean).
                // Schema doesn't have `shift`. I will check if I can add it or ignore.
                // For now, I'll store what I can.
                category: 'COMPANY', // Default
            }
        });

        return NextResponse.json({ employee }, { status: 201 });

    } catch (error) {
        console.error('Error creating employee:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
