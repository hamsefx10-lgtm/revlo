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
        /* vendor: { // Removed temporarily due to schema issue
          select: {
            id: true,
            name: true,
            contactPerson: true,
            phoneNumber: true,
            email: true,
            address: true
          }
        }, */
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
        },
        account: { // Fetch Account Name directly if relation exists
          select: {
            id: true,
            name: true
          }
        }
      },
    });

    if (!expense) {
      return NextResponse.json({ message: 'Kharashka lama helin.' }, { status: 404 });
    }

    // Manual Account Name Lookup if relation failed but ID exists
    let accountName = expense.paidFrom;
    if (expense.account) {
      accountName = expense.account.name;
    } else if (expense.paidFrom && !expense.account) {
      // Try to find account by ID stored in paidFrom
      // This handles cases where 'paidFrom' has ID but 'accountId' relation is null
      const relatedAccount = await prisma.account.findUnique({
        where: { id: expense.paidFrom }
      });
      if (relatedAccount) {
        accountName = relatedAccount.name;
      }
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
      paidFrom: accountName, // Use resolved Name
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
      vendor: undefined,
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

    // 1. Refund old account balance
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

    // Resolve Account ID for refund
    let accountIdToRefund = existingExpense.accountId;
    if (!accountIdToRefund && existingExpense.paidFrom) {
      // specific check: if paidFrom looks like an ID, check it first
      const byId = await prisma.account.findUnique({ where: { id: existingExpense.paidFrom } });
      if (byId) accountIdToRefund = byId.id;
      else {
        const byName = await prisma.account.findUnique({ where: { name_companyId: { name: existingExpense.paidFrom, companyId } } });
        // Note: account has @@unique([name, companyId]) so findUnique works if we use composite
        // But easier to use findFirst to be safe with partial matches or if defined differently
        const byNameSafe = await prisma.account.findFirst({ where: { name: existingExpense.paidFrom, companyId } });
        accountIdToRefund = byNameSafe?.id || null;
      }
    }

    if (accountIdToRefund && oldAmount) {
      await prisma.account.update({
        where: { id: accountIdToRefund },
        data: {
          balance: { increment: oldAmount },
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
        },
        account: {
          select: {
            id: true,
            name: true
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

// DELETE /api/expenses/[id] - Tirtir kharash gaar ah (With Recycle Bin)
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

    // Resolve Account ID for refund
    let accountIdToRefund = existingExpense.accountId;
    if (!accountIdToRefund && existingExpense.paidFrom) {
      const byId = await prisma.account.findUnique({ where: { id: existingExpense.paidFrom } });
      if (byId) accountIdToRefund = byId.id;
      else {
        const byNameSafe = await prisma.account.findFirst({ where: { name: existingExpense.paidFrom, companyId } });
        accountIdToRefund = byNameSafe?.id || null;
      }
    }

    // Use interactive transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // 0. Archive to Recycle Bin
      await tx.deletedItem.create({
        data: {
          modelName: 'Expense',
          originalId: id,
          data: JSON.parse(JSON.stringify(existingExpense)),
          companyId,
          deletedBy: existingExpense.userId,
        }
      });

      // 1. Refund account balance
      if (accountIdToRefund && existingExpense.amount) {
        await tx.account.update({
          where: { id: accountIdToRefund },
          data: {
            balance: { increment: Number(existingExpense.amount) },
          },
        });
      }

      // 2. If this was a salary payment
      if (existingExpense.category === 'Company Expense' && existingExpense.subCategory === 'Salary' && existingExpense.employeeId && existingExpense.amount) {
        await tx.employee.update({
          where: { id: existingExpense.employeeId },
          data: {
            salaryPaidThisMonth: { decrement: Number(existingExpense.amount) },
          },
        });
      }

      // 3. Delete related transactions
      await tx.transaction.deleteMany({
        where: { expenseId: id }
      });

      // 4. Finally Delete the expense
      await tx.expense.delete({
        where: { id }
      });
    });

    // Run Labor cleanup separately (safe mode) - This logic remains outside transaction as it was before
    // Although ideally it should be inside, keeping it as is to minimize regression risk on labor helper logic
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

    return NextResponse.json(
      { message: 'Kharashka si guul leh ayaa loo tirtiray oo Recycle Bin la geeyay!' },
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