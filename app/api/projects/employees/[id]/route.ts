// app/api/employees/[id]/route.ts - Single Employee Management API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { isValidEmail } from '@/lib/utils'; // For email validation
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants
import { Decimal } from '@prisma/client/runtime/library'; // MUHIIM: Import Decimal
import { getSessionCompanyId } from '@/app/api/employees/auth';

// GET /api/employees/[id] - Soo deji shaqaale gaar ah
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const companyId = await getSessionCompanyId();

    const employee = await prisma.employee.findFirst({
      where: { id, companyId },
      include: {
        laborRecords: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }, // Ku dar diiwaanada shaqada mashruuca with project details
        transactions: true, // Ku dar transactions-ka shaqaalahan
      },
    });

    if (!employee) {
      return NextResponse.json({ message: 'Shaqaalaha lama helin.' }, { status: 404 });
    }

    // Calculate total months worked
    const today = new Date();
    const startDate = new Date(employee.startDate);
    const yearDiff = today.getFullYear() - startDate.getFullYear();
    const monthDiff = today.getMonth() - startDate.getMonth();
    const totalMonthsWorked = yearDiff * 12 + monthDiff + 1;

    // Get ACTUAL total paid from expenses (salary + labor expenses for this employee)
    const salaryExpenses = await prisma.expense.findMany({
      where: {
        employeeId: employee.id,
        companyId,
        OR: [
          { category: 'Salary' },
          { category: 'Labor' },
          { category: 'Company Labor' },
          { subCategory: 'Salary' },
        ],
      },
    });

    const totalPaid = salaryExpenses.reduce((sum, expense) => {
      return sum + (expense.amount ? expense.amount.toNumber() : 0);
    }, 0);

    // Calculate total salary owed (for COMPANY employees)
    const monthlySalaryNum = employee.monthlySalary ? employee.monthlySalary.toNumber() : null;
    const totalSalaryOwed = monthlySalaryNum ? monthlySalaryNum * totalMonthsWorked : 0;

    // Calculate remaining: total owed - total paid
    const totalRemaining = monthlySalaryNum ? totalSalaryOwed - totalPaid : 0;

    // Overpaid if remaining is negative
    const overpaidAmount = totalRemaining < 0 ? Math.abs(totalRemaining) : 0;

    // Convert Decimal fields to Number for frontend display
    const processedEmployee = {
      ...employee,
      monthlySalary: monthlySalaryNum,
      totalPaid, // NEW: Actual total paid from all expenses
      totalSalaryOwed, // NEW: Total owed based on months worked
      totalRemaining, // NEW: Remaining (negative if overpaid)
      overpaidAmount, // NEW: Amount overpaid (shown as debt)
      totalMonthsWorked, // NEW: Total months worked
    };

    return NextResponse.json({ employee: processedEmployee }, { status: 200 });
  } catch (error) {
    console.error('Cilad ayaa dhacday marka shaqaalaha la soo gelinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// PUT /api/employees/[id] - Cusboonaysii shaqaale gaar ah
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let employeeId: string = 'unknown';
  try {
    const { id } = await params;
    employeeId = id;
    const companyId = await getSessionCompanyId();
    const body = await request.json();

    // Verify employee exists and belongs to company
    const existingEmployee = await prisma.employee.findFirst({
      where: { id, companyId }
    });

    if (!existingEmployee) {
      return NextResponse.json({ message: 'Shaqaalaha lama helin.' }, { status: 404 });
    }

    // Validate email if provided
    if (body.email && !isValidEmail(body.email)) {
      return NextResponse.json({ message: 'Email-ka aan sax ahayn.' }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      role: body.role,
      isActive: body.isActive,
    };

    // Handle category if provided
    if (body.category !== undefined) {
      updateData.category = body.category;
    }

    // Handle monthlySalary
    if (body.monthlySalary !== undefined) {
      updateData.monthlySalary = body.monthlySalary ? new Decimal(body.monthlySalary) : null;
    }

    // Handle salaryPaidThisMonth
    if (body.salaryPaidThisMonth !== undefined) {
      updateData.salaryPaidThisMonth = body.salaryPaidThisMonth ? new Decimal(body.salaryPaidThisMonth) : undefined;
    }

    // Handle overpaidAmount
    if (body.overpaidAmount !== undefined) {
      updateData.overpaidAmount = body.overpaidAmount ? new Decimal(body.overpaidAmount) : undefined;
    }

    // Handle startDate - convert ISO string to Date or set to null
    if (body.startDate !== undefined) {
      updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: updateData,
    });

    // Convert Decimal fields to Number for response
    const processedEmployee = {
      ...updatedEmployee,
      monthlySalary: updatedEmployee.monthlySalary ? updatedEmployee.monthlySalary.toNumber() : null,
      salaryPaidThisMonth: updatedEmployee.salaryPaidThisMonth ? updatedEmployee.salaryPaidThisMonth.toNumber() : null,
      overpaidAmount: updatedEmployee.overpaidAmount ? updatedEmployee.overpaidAmount.toNumber() : null,
    };

    return NextResponse.json(
      { message: 'Shaqaalaha si guul leh ayaa la cusboonaysiiyay!', employee: processedEmployee },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka shaqaalaha ${employeeId} la cusboonaysiinayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// DELETE /api/employees/[id] - Tirtir shaqaale gaar ah
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let employeeId: string = 'unknown';
  try {
    const { id } = await params;
    employeeId = id;
    const companyId = await getSessionCompanyId();

    // Verify employee exists and belongs to company
    const existingEmployee = await prisma.employee.findFirst({
      where: { id, companyId }
    });

    if (!existingEmployee) {
      return NextResponse.json({ message: 'Shaqaalaha lama helin.' }, { status: 404 });
    }

    // Manual cascade delete - delete related records first
    // 1. Get all expenses for this employee to refund account balances
    const employeeExpenses = await prisma.expense.findMany({
      where: { employeeId: id },
      select: { paidFrom: true, amount: true }
    });

    // 2. Refund account balances for all expenses
    for (const expense of employeeExpenses) {
      if (expense.paidFrom && expense.amount) {
        await prisma.account.update({
          where: { id: expense.paidFrom },
          data: {
            balance: { increment: Number(expense.amount) }, // Soo celi lacagta
          },
        });
      }
    }

    // 3. Get all project labor records for this employee to refund account balances
    const projectLabors = await prisma.projectLabor.findMany({
      where: { employeeId: id },
      select: { paidFrom: true, paidAmount: true }
    });

    // 4. Refund account balances for all project labor records
    for (const labor of projectLabors) {
      if (labor.paidFrom && labor.paidAmount) {
        await prisma.account.update({
          where: { id: labor.paidFrom },
          data: {
            balance: { increment: Number(labor.paidAmount) }, // Soo celi lacagta
          },
        });
      }
    }

    // 5. Delete related project labor records
    await prisma.projectLabor.deleteMany({
      where: { employeeId: id }
    });

    // 6. Delete related transactions
    await prisma.transaction.deleteMany({
      where: { employeeId: id }
    });

    // 7. Delete related expenses
    await prisma.expense.deleteMany({
      where: { employeeId: id }
    });

    // 8. Delete the employee
    await prisma.employee.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Shaqaalaha si guul leh ayaa loo tirtiray!' },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka shaqaalaha ${employeeId} la tirtirayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}