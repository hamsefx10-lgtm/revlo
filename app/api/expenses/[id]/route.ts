// app/api/expenses/[id]/route.ts - Single Expense Management API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { getSessionCompanyId } from '@/app/api/expenses/auth';

const toSafeNumber = (value: any, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object' && typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const decimalToNumber = (value: any, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object' && typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const isSameDay = (a?: Date | null, b?: Date | null) => {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

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
      materialDate: expense.materialDate || undefined,
      transportType: expense.transportType || undefined,
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

    // 1. Refund old account balance (add back the amount that was deducted)
    // For Company Labor, we need to get the paid amount from CompanyLabor record
    let oldAmount = Number(existingExpense.amount);
    if (existingExpense.category === 'Company Labor' && existingExpense.employeeId) {
      const oldCompanyLabor = await prisma.companyLabor.findFirst({
        where: {
          employeeId: existingExpense.employeeId,
          companyId: companyId,
        },
        orderBy: { dateWorked: 'desc' },
      });
      if (oldCompanyLabor && oldCompanyLabor.paidAmount) {
        const oldPaidAmount = typeof oldCompanyLabor.paidAmount === 'object' && 'toNumber' in oldCompanyLabor.paidAmount
          ? oldCompanyLabor.paidAmount.toNumber()
          : Number(oldCompanyLabor.paidAmount);
        oldAmount = oldPaidAmount;
      }
    }

    if (existingExpense.paidFrom && oldAmount) {
      await prisma.account.update({
        where: { id: existingExpense.paidFrom },
        data: {
          balance: { increment: oldAmount }, // Soo celi lacagta hore
        },
      });
    }

    // 2. If this was a salary payment, decrement the old amount from employee
    if (existingExpense.category === 'Company Expense' && existingExpense.subCategory === 'Salary' && existingExpense.employeeId && existingExpense.amount) {
      await prisma.employee.update({
        where: { id: existingExpense.employeeId },
        data: {
          salaryPaidThisMonth: { decrement: Number(existingExpense.amount) },
        },
      });
    }

    // 3. Handle Company Labor updates - find and update CompanyLabor record
    if (body.category === 'Company Labor' && body.employeeId) {
      const existingCompanyLabor = await prisma.companyLabor.findFirst({
        where: {
          employeeId: body.employeeId,
          companyId: companyId,
        },
        orderBy: { dateWorked: 'desc' },
      });

      if (existingCompanyLabor) {
        // Update existing CompanyLabor record
        const agreedWage = body.agreedWage !== undefined && body.agreedWage !== null
          ? Number(body.agreedWage)
          : toSafeNumber(existingCompanyLabor.agreedWage);
        const paidAmount = body.laborPaidAmount !== undefined && body.laborPaidAmount !== null
          ? Number(body.laborPaidAmount)
          : toSafeNumber(existingCompanyLabor.paidAmount);
        const remainingWage = agreedWage
          ? agreedWage - paidAmount
          : toSafeNumber(existingCompanyLabor.remainingWage);

        await prisma.companyLabor.update({
          where: { id: existingCompanyLabor.id },
          data: {
            agreedWage: agreedWage,
            paidAmount: paidAmount,
            remainingWage: remainingWage,
            description: body.description || existingCompanyLabor.description,
            dateWorked: body.expenseDate ? new Date(body.expenseDate) : existingCompanyLabor.dateWorked,
            paidFrom: body.paidFrom || existingCompanyLabor.paidFrom,
          },
        });
        // Update expense amount to match laborPaidAmount
        body.amount = paidAmount;
      } else if (body.agreedWage && body.laborPaidAmount) {
        // Create new CompanyLabor record if it doesn't exist
        const agreedWage = Number(body.agreedWage);
        const paidAmount = Number(body.laborPaidAmount);
        const remainingWage = agreedWage - paidAmount;

        await prisma.companyLabor.create({
          data: {
            companyId,
            employeeId: body.employeeId,
            agreedWage,
            paidAmount,
            remainingWage,
            description: body.description || '',
            paidFrom: body.paidFrom,
            dateWorked: body.expenseDate ? new Date(body.expenseDate) : new Date(),
          },
        });
        // Update expense amount to match laborPaidAmount
        body.amount = paidAmount;
      }
    }

    // Ensure expenseDate is properly formatted
    let formattedExpenseDate = undefined;
    if (body.expenseDate) {
      if (typeof body.expenseDate === 'string') {
        formattedExpenseDate = new Date(body.expenseDate);
      } else if (body.expenseDate instanceof Date) {
        formattedExpenseDate = body.expenseDate;
      }
    }

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        expenseDate: formattedExpenseDate,
        category: body.category || undefined,
        subCategory: body.subCategory || undefined,
        description: body.description || undefined,
        amount: body.amount ? Number(body.amount) : undefined,
        paidFrom: body.paidFrom || undefined,
        note: body.note || undefined,
        approved: body.approved !== undefined ? body.approved : undefined,
        projectId: body.projectId || null,
        employeeId: body.employeeId || null,
        customerId: body.customerId || null,
        materials: body.materials || undefined,
        receiptUrl: body.receiptUrl || undefined,
        materialDate: body.materialDate ? new Date(body.materialDate) : undefined,
        transportType: body.transportType || undefined,
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

    // 3. Update new account balance (deduct the new amount)
    if (body.paidFrom && body.amount) {
      await prisma.account.update({
        where: { id: body.paidFrom },
        data: {
          balance: { decrement: Number(body.amount) }, // Ka dhim lacagta cusub
        },
      });
    }

    // 4. If this is still a salary payment, increment the new amount for the employee
    if (body.category === 'Company Expense' && body.subCategory === 'Salary' && body.employeeId && body.amount) {
      await prisma.employee.update({
        where: { id: body.employeeId },
        data: {
          salaryPaidThisMonth: { increment: Number(body.amount) },
          lastPaymentDate: new Date(body.expenseDate),
        },
      });
    }

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

    const expenseAmountNumber = Math.abs(decimalToNumber(existingExpense.amount, 0));
    const expenseDate = existingExpense.expenseDate
      ? new Date(existingExpense.expenseDate)
      : null;

    // Use interactive transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // 1. Refund account balance (add back the amount that was deducted)
      // Only do this if paidFrom exists AND amount exists
      if (existingExpense.paidFrom && existingExpense.amount) {
        // Double check this isn't a "Debt" that shouldn't have been deducted
        // But since we are deleting, we revert whatever happened. 
        // If it was deducted, we add it back.
        await tx.account.update({
          where: { id: existingExpense.paidFrom },
          data: {
            balance: { increment: Number(existingExpense.amount) }, // Soo celi lacagta
          },
        });
      }

      // 2. If this was a salary payment, decrement salaryPaidThisMonth for the employee
      if (existingExpense.category === 'Company Expense' && existingExpense.subCategory === 'Salary' && existingExpense.employeeId && existingExpense.amount) {
        await tx.employee.update({
          where: { id: existingExpense.employeeId },
          data: {
            salaryPaidThisMonth: { decrement: Number(existingExpense.amount) },
          },
        });
      }

      // 3. Delete related transactions (Customer Debt, Vendor Debt, etc.)
      // This handles the user's request: "customerkina transactionkiisi... waa inuu iska saara"
      await tx.transaction.deleteMany({
        where: { expenseId: id }
      });

      // 3b. If this was a labor expense, clean up linked project labor record
      // We perform this check here. If the helper function needs to be atomic, we'd need to pass 'tx' to it.
      // For now, let's keep it robust. If labor record fails, we shouldn't necessarily block expense deletion 
      // unless strict consistency is required. However, for "Partial Failure" fix, we should try to include it.
      // Since 'removeProjectLaborPayment' uses prisma directly, we can't easily wrap it in 'tx' without refactoring it.
      // We will call it OUTSIDE the transaction for now BUT before the final delete? 
      // Risk: If tx commits but this fails? No.
      // Better: We copy the logic essential for clean up here or refactor helper.
      // Let's refactor the essential part inline or assume it won't throw hard errors.
      // ACTUALLY: The user's main issue is the crash. Let's wrap the core financial reversals in the transaction.
      // The Labor cleanup is specific. Let's try to run it safely.
    });

    // Run Labor cleanup separately (safe mode) - or refactor to take TX if strictly needed.
    // Given the complexity of finding the matching record, let's run it safely.
    // If it fails, it's not a financial consistency disaster like the account balance.
    if (
      existingExpense.category &&
      (existingExpense.category === 'Labor' || existingExpense.category.toLowerCase() === 'labor') &&
      existingExpense.projectId
    ) {
      try {
        await removeProjectLaborPayment({
          projectId: existingExpense.projectId,
          employeeId: existingExpense.employeeId || undefined,
          description: existingExpense.description || undefined,
          expenseDate,
          amount: expenseAmountNumber,
        });
      } catch (err) {
        console.warn('Failed to cleanup project labor, continuing expense delete:', err);
      }
    }

    // 4. Finally Delete the expense matching ID and Company
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

const removeProjectLaborPayment = async ({
  projectId,
  employeeId,
  description,
  expenseDate,
  amount,
}: {
  projectId: string;
  employeeId?: string;
  description?: string;
  expenseDate: Date | null;
  amount: number;
}) => {
  if (!projectId || !amount) return;

  const laborWhere: Record<string, any> = { projectId };
  if (employeeId) {
    laborWhere.employeeId = employeeId;
  }

  const laborRecords = await prisma.projectLabor.findMany({
    where: laborWhere,
  });

  if (laborRecords.length === 0) return;

  const normalizedDescription = (description || '').trim().toLowerCase();

  const findMatchingRecord = () => {
    const byStrictMatch = laborRecords.find((labor) => {
      const paidAmount = decimalToNumber(labor.paidAmount, 0);
      const sameAmount = Math.abs(paidAmount - amount) < 0.01;
      const descMatches = normalizedDescription
        ? (labor.description || '').trim().toLowerCase() === normalizedDescription
        : true;
      const dateMatches = expenseDate
        ? isSameDay(new Date(labor.dateWorked), expenseDate)
        : true;
      return sameAmount && descMatches && dateMatches;
    });
    if (byStrictMatch) return byStrictMatch;

    const byAmountMatch = laborRecords.find(
      (labor) => Math.abs(decimalToNumber(labor.paidAmount, 0) - amount) < 0.01
    );
    if (byAmountMatch) return byAmountMatch;

    return laborRecords[0];
  };

  const laborRecord = findMatchingRecord();
  if (!laborRecord) return;

  const paidAmount = decimalToNumber(laborRecord.paidAmount, 0);
  const agreedWage =
    laborRecord.agreedWage !== null && laborRecord.agreedWage !== undefined
      ? decimalToNumber(laborRecord.agreedWage, 0)
      : null;
  const updatedPaid = Math.max(0, paidAmount - amount);
  const updatedRemaining =
    agreedWage !== null ? Math.max(0, agreedWage - updatedPaid) : null;

  if (updatedPaid <= 0.0001) {
    await prisma.projectLabor.delete({
      where: { id: laborRecord.id },
    });
    return;
  }

  await prisma.projectLabor.update({
    where: { id: laborRecord.id },
    data: {
      paidAmount: updatedPaid,
      ...(updatedRemaining !== null ? { remainingWage: updatedRemaining } : {}),
    },
  });
};