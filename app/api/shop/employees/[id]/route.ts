import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/shop/employees/[id]
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        const employee = await prisma.employee.findUnique({
            where: { id },
            include: {
                expenses: { orderBy: { expenseDate: 'desc' }, take: 10 },
                attendance: { orderBy: { date: 'desc' }, take: 30 },
                companyLaborRecords: { orderBy: { dateWorked: 'desc' }, take: 5 }
            }
        });

        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        // ✅ Also fetch salary transactions from the unified Payroll system
        const salaryTransactions = await prisma.transaction.findMany({
            where: { employeeId: id, category: 'SALARY' },
            orderBy: { transactionDate: 'desc' },
            take: 20,
            select: {
                id: true,
                description: true,
                amount: true,
                transactionDate: true,
                note: true,
            }
        });

        return NextResponse.json({ employee, salaryTransactions });
    } catch (error) {
        console.error('Error fetching employee:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PATCH /api/shop/employees/[id]
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const body = await req.json();

        const updatedEmployee = await prisma.employee.update({
            where: { id },
            data: {
                fullName: body.fullName,
                email: body.email,
                phone: body.phone,
                position: body.position,
                department: body.department,
                monthlySalary: body.monthlySalary ? parseFloat(body.monthlySalary) : undefined,
                isActive: body.isActive,
                startDate: body.startDate ? new Date(body.startDate) : undefined,
            }
        });

        return NextResponse.json({ employee: updatedEmployee });
    } catch (error) {
        console.error('Error updating employee:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE /api/shop/employees/[id]
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        await prisma.employee.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting employee:', error);
        return NextResponse.json({ error: 'Failed to delete employee. They may have related records.' }, { status: 400 });
    }
}
