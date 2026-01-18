import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ employees: [] });
        }

        const employees = await prisma.employee.findMany({
            where: { companyId: user.companyId },
            orderBy: { createdAt: 'desc' }
        });

        const formattedEmployees = employees.map(emp => ({
            id: emp.id,
            name: emp.fullName,
            role: emp.role,
            department: emp.department || 'General',
            status: emp.isActive ? 'Active' : 'Inactive',
            shift: 'Morning' // hardcoded for now or add to schema later
        }));

        return NextResponse.json({ employees: formattedEmployees });
    } catch (error) {
        console.error('Error fetching employees:', error);
        return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'No company found' }, { status: 400 });
        }

        const body = await req.json();
        const { fullName, role, department, phone } = body;

        const employee = await prisma.employee.create({
            data: {
                companyId: user.companyId,
                fullName,
                role,
                department,
                phone, // Ensure schema has this
                salaryPaidThisMonth: 0,
                // status: 'Active' // Removed: Not in schema, uses isActive default true
                // Schema has isActive: Boolean @default(true)
            }
        });

        return NextResponse.json({ success: true, employee });
    } catch (error) {
        // Schema checks: Employee has 'fullName', 'companyId', 'role'. 'phone' is optional.
        console.error('Error creating employee:', error);
        return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
    }
}
