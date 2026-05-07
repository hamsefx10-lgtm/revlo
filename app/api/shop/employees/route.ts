import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET /api/shop/employees - List employees

export const dynamic = 'force-dynamic';

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
        const { fullName, email, phone, role, salary, shift, status, createAccount, password } = body;

        if (!fullName || !role) {
            return NextResponse.json({ error: 'Name and Role are required' }, { status: 400 });
        }

        if (createAccount) {
            if (!email || !password) {
                return NextResponse.json({ error: 'Email and Password are required to create a system account' }, { status: 400 });
            }
            // Check if email already exists
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
            }
        }

        // Get User Company
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'User company not found' }, { status: 400 });
        }

        // Map employee role to system role
        let systemRole: any = 'MEMBER';
        if (role === 'Manager') systemRole = 'MANAGER';
        else if (role === 'Cashier' || role === 'Stock Clerk') systemRole = 'MEMBER';
        else if (role === 'Security' || role === 'Cleaner') systemRole = 'VIEWER';

        // Transaction to ensure both are created
        const employee = await prisma.$transaction(async (tx) => {
            const emp = await tx.employee.create({
                data: {
                    fullName,
                    email: email || null,
                    phone: phone || null,
                    role,
                    monthlySalary: salary ? parseFloat(salary) : 0,
                    companyId: user.companyId,
                    isActive: status === 'Active',
                    category: 'COMPANY',
                }
            });

            if (createAccount) {
                const hashedPassword = await bcrypt.hash(password, 10);
                await tx.user.create({
                    data: {
                        fullName,
                        email,
                        password: hashedPassword,
                        role: systemRole,
                        companyId: user.companyId,
                        phone: phone || '',
                        status: status === 'Active' ? 'Active' : 'Inactive'
                    }
                });
            }

            return emp;
        });

        return NextResponse.json({ employee }, { status: 201 });

    } catch (error) {
        console.error('Error creating employee:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
