// app/api/employees/[id]/route.ts - Single Employee Management API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { isValidEmail } from '@/lib/utils'; // For email validation
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants
import { Decimal } from '@prisma/client/runtime/library'; // MUHIIM: Import Decimal
import { getSessionCompanyId } from '@/app/api/employees/auth';

// GET /api/employees/[id] - Soo deji shaqaale gaar ah
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const companyId = await getSessionCompanyId();

    const employee = await prisma.employee.findFirst({
      where: { id, companyId },
      include: {
        laborRecords: true, // Ku dar diiwaanada shaqada mashruuca
        transactions: true, // Ku dar transactions-ka shaqaalahan
      },
    });

    if (!employee) {
      return NextResponse.json({ message: 'Shaqaalaha lama helin.' }, { status: 404 });
    }

    // Convert Decimal fields to Number for frontend display
    const processedEmployee = {
      ...employee,
      monthlySalary: employee.monthlySalary ? employee.monthlySalary.toNumber() : null, // Handle null
      salaryPaidThisMonth: employee.salaryPaidThisMonth ? employee.salaryPaidThisMonth.toNumber() : null, // Handle null
      overpaidAmount: employee.overpaidAmount ? employee.overpaidAmount.toNumber() : null, // Handle null
    };

    return NextResponse.json({ employee: processedEmployee }, { status: 200 });
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka shaqaalaha ${params.id} la soo gelinayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// PUT /api/employees/[id] - Cusboonaysii shaqaale gaar ah
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
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

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        fullName: body.fullName,
        email: body.email,
        phone: body.phone,
        role: body.role,
        category: body.category,
        monthlySalary: body.monthlySalary ? new Decimal(body.monthlySalary) : undefined,
        salaryPaidThisMonth: body.salaryPaidThisMonth ? new Decimal(body.salaryPaidThisMonth) : undefined,
        overpaidAmount: body.overpaidAmount ? new Decimal(body.overpaidAmount) : undefined,
        isActive: body.isActive,
        startDate: body.startDate,
      },
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
    console.error(`Cilad ayaa dhacday marka shaqaalaha ${params.id} la cusboonaysiinayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// DELETE /api/employees/[id] - Tirtir shaqaale gaar ah
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const companyId = await getSessionCompanyId();

    // Verify employee exists and belongs to company
    const existingEmployee = await prisma.employee.findFirst({
      where: { id, companyId }
    });

    if (!existingEmployee) {
      return NextResponse.json({ message: 'Shaqaalaha lama helin.' }, { status: 404 });
    }

    // Delete employee (cascade will handle related records)
    await prisma.employee.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Shaqaalaha si guul leh ayaa loo tirtiray!' },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka shaqaalaha ${params.id} la tirtirayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}