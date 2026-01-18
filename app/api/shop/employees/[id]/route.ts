import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
                expenses: {
                    orderBy: { expenseDate: 'desc' },
                    take: 10, // Latest 10 payments/expenses
                },
                attendance: {
                    orderBy: { date: 'desc' },
                    take: 30, // Last 30 days attendance
                },
                // You might want to include labor records if relevant
                companyLaborRecords: {
                    orderBy: { dateWorked: 'desc' },
                    take: 5
                }
            }
        });

        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        return NextResponse.json({ employee });
    } catch (error) {
        console.error('Error fetching employee:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PATCH /api/shop/employees/[id] - Update Details
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

        // Validate body if necessary (e.g. ensure salary is number)
        // For simplicity, we assume frontend sends correct types or Prisma will error.

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

        // Check if employee has related records that prevent deletion?
        // Prisma might throw error if relations exist and onDelete is not cascade.
        // Usually safer to soft delete (set isActive = false). 
        // User asked to delete, we'll try to delete.

        await prisma.employee.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting employee:', error);
        // Fallback to soft delete if hard delete fails due to constraints?
        // Or just return error.
        return NextResponse.json({ error: 'Failed to delete employee. They may have related records.' }, { status: 400 });
    }
}
