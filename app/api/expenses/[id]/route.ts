// app/api/expenses/[id]/route.ts - Single Expense Management API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { getSessionCompanyId } from '@/app/api/expenses/auth';

// GET /api/expenses/[id] - Soo deji kharash gaar ah
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const companyId = await getSessionCompanyId();

    const expense = await prisma.expense.findFirst({
      where: { id, companyId },
      include: {
        project: { // Ku dar macluumaadka mashruuca haddii uu la xiriira
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
            budget: true,
            description: true,
            customer: { select: { name: true } }
          }
        },
        employee: { // Ku dar macluumaadka shaqaalaha haddii uu la xiriira
          select: {
            id: true,
            fullName: true,
            position: true,
            department: true,
            phoneNumber: true,
            email: true,
            role: true
          }
        },
        vendor: { // Ku dar macluumaadka kiriyaha haddii uu la xiriira
          select: {
            id: true,
            name: true,
            contactPerson: true,
            phoneNumber: true,
            email: true,
            address: true
          }
        },
        customer: { // Ku dar macluumaadka macaamiisha haddii uu la xiriira
          select: {
            id: true,
            name: true,
            contactPerson: true,
            phoneNumber: true,
            email: true
          }
        },
        user: { // Ku dar macluumaadka diiwaan geliyaha
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        },
        expenseCategory: { // Ku dar macluumaadka qaybta kharashka
          select: {
            id: true,
            name: true,
            type: true,
            description: true
          }
        },
        company: { // Ku dar macluumaadka shirkadda
          select: {
            id: true,
            name: true,
            address: true,
            phone: true
          }
        }
      },
    });

    if (!expense) {
      return NextResponse.json({ message: 'Kharashka lama helin.' }, { status: 404 });
    }

    // Transform the expense data to match frontend interface
    const transformedExpense = {
      id: expense.id,
      date: expense.expenseDate,
      project: expense.project ? {
        id: expense.project.id,
        name: expense.project.name,
        status: expense.project.status,
        startDate: expense.project.startDate,
        endDate: expense.project.endDate,
        budget: expense.project.budget,
        description: expense.project.description
      } : undefined,
      category: expense.category,
      subCategory: expense.subCategory,
      description: expense.description,
      amount: typeof expense.amount === 'object' && 'toNumber' in expense.amount ? expense.amount.toNumber() : Number(expense.amount),
      paidFrom: expense.paidFrom,
      note: expense.note,
      approved: expense.approved,
      receiptUrl: expense.receiptUrl || undefined,
      materials: expense.materials || [],
      employee: expense.employee ? {
        id: expense.employee.id,
        fullName: expense.employee.fullName,
        position: expense.employee.position,
        department: expense.employee.department,
        phoneNumber: expense.employee.phoneNumber,
        email: expense.employee.email
      } : undefined,
      vendor: expense.vendor ? {
        id: expense.vendor.id,
        name: expense.vendor.name,
        contactPerson: expense.vendor.contactPerson,
        phoneNumber: expense.vendor.phoneNumber,
        email: expense.vendor.email,
        address: expense.vendor.address
      } : undefined,
      customer: expense.customer ? {
        id: expense.customer.id,
        name: expense.customer.name,
        contactPerson: expense.customer.contactPerson,
        phoneNumber: expense.customer.phoneNumber,
        email: expense.customer.email
      } : undefined,
      user: expense.user ? {
        id: expense.user.id,
        fullName: expense.user.fullName,
        email: expense.user.email,
        role: expense.user.role
      } : undefined,
      expenseCategory: expense.expenseCategory ? {
        id: expense.expenseCategory.id,
        name: expense.expenseCategory.name,
        type: expense.expenseCategory.type,
        description: expense.expenseCategory.description
      } : undefined,
      company: expense.company ? {
        id: expense.company.id,
        name: expense.company.name,
        address: expense.company.address,
        phoneNumber: expense.company.phone
      } : undefined,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt
    };

    return NextResponse.json({ expense: transformedExpense }, { status: 200 });
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka kharashka ${params.id} la soo gelinayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// PUT /api/expenses/[id] - Cusboonaysii kharash gaar ah
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const companyId = await getSessionCompanyId();
    const body = await request.json();

    // Verify expense exists and belongs to company
    const existingExpense = await prisma.expense.findFirst({
      where: { id, companyId }
    });

    if (!existingExpense) {
      return NextResponse.json({ message: 'Kharashka lama helin.' }, { status: 404 });
    }

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        expenseDate: body.expenseDate,
        category: body.category,
        subCategory: body.subCategory,
        description: body.description,
        amount: body.amount,
        paidFrom: body.paidFrom,
        note: body.note,
        approved: body.approved,
        projectId: body.projectId,
        employeeId: body.employeeId,
        customerId: body.customerId,
        materials: body.materials,
        receiptUrl: body.receiptUrl,
        transportType: body.transportType,
        consultantName: body.consultantName,
        consultancyType: body.consultancyType,
        consultancyFee: body.consultancyFee,
        equipmentName: body.equipmentName,
        rentalPeriod: body.rentalPeriod,
        rentalFee: body.rentalFee,
        supplierName: body.supplierName,
        bankAccountId: body.bankAccountId,
        // wage: body.wage, // Field doesn't exist in schema
        // laborPaidAmount: body.laborPaidAmount, // Field doesn't exist in schema
        // workDescription: body.workDescription, // Field doesn't exist in schema
        // employeeName: body.employeeName, // Field doesn't exist in schema
        // companyExpenseType: body.companyExpenseType, // Field doesn't exist in schema
        // salaryPaymentAmount: body.salaryPaymentAmount, // Field doesn't exist in schema
        // officeRentPeriod: body.officeRentPeriod, // Field doesn't exist in schema
        // electricityMeterReading: body.electricityMeterReading, // Field doesn't exist in schema
        // fuelVehicle: body.fuelVehicle, // Field doesn't exist in schema
        // fuelLiters: body.fuelLiters, // Field doesn't exist in schema
        // marketingCampaignName: body.marketingCampaignName, // Field doesn't exist in schema
        // lenderName: body.lenderName, // Field doesn't exist in schema
        // loanDate: body.loanDate, // Field doesn't exist in schema
        // debtRepaymentAmount: body.debtRepaymentAmount, // Field doesn't exist in schema
        // selectedDebt: body.selectedDebt, // Field doesn't exist in schema
      },
      include: {
        project: { 
          select: { 
            id: true, 
            name: true, 
            status: true,
            startDate: true,
            endDate: true,
            budget: true,
            description: true
          } 
        },
        employee: { 
          select: { 
            id: true, 
            fullName: true,
            position: true,
            department: true,
            phoneNumber: true,
            email: true
          } 
        },
        vendor: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
            phoneNumber: true,
            email: true,
            address: true
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
            phoneNumber: true,
            email: true
          }
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        },
        expenseCategory: { 
          select: { 
            id: true, 
            name: true,
            type: true,
            description: true
          } 
        },
        company: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true
          }
        }
      },
    });

    return NextResponse.json(
      { message: 'Kharashka si guul leh ayaa la cusboonaysiiyay!', expense: updatedExpense },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka kharashka ${params.id} la cusboonaysiinayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// DELETE /api/expenses/[id] - Tirtir kharash gaar ah
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const companyId = await getSessionCompanyId();

    // Verify expense exists and belongs to company
    const existingExpense = await prisma.expense.findFirst({
      where: { id, companyId }
    });

    if (!existingExpense) {
      return NextResponse.json({ message: 'Kharashka lama helin.' }, { status: 404 });
    }

    // Manual cascade delete - delete related records first
    // 1. Refund account balance (add back the amount that was deducted)
    if (existingExpense.paidFrom && existingExpense.amount) {
      await prisma.account.update({
        where: { id: existingExpense.paidFrom },
        data: {
          balance: { increment: Number(existingExpense.amount) }, // Soo celi lacagta
        },
      });
    }

    // 2. Delete related transactions
    await prisma.transaction.deleteMany({
      where: { expenseId: id }
    });

    // 3. Delete the expense
    await prisma.expense.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Kharashka si guul leh ayaa loo tirtiray!' },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka kharashka ${params.id} la tirtirayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}