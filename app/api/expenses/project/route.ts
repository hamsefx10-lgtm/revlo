// Project Expenses API
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';

// GET /api/expenses/project - List all project expenses
export async function GET(request: Request) {
  try {
    const { companyId } = await getSessionCompanyUser();
    const expenses = await prisma.expense.findMany({
      where: { companyId, projectId: { not: null } },
      orderBy: { expenseDate: 'desc' },
    });
    return NextResponse.json({ expenses }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}

// POST /api/expenses/project - Add new project expense
export async function POST(request: Request) {
  try {
    const { companyId, userId } = await getSessionCompanyUser();
    const reqBody = await request.json();
  const { description, amount, category, subCategory, paidFrom, expenseDate, note, projectId, employeeId, laborPaidAmount = 0, employeeName, transportType, consultantName, consultancyType, consultancyFee, equipmentName, rentalPeriod, rentalFee, supplierName, bankAccountId } = reqBody;
    // General required fields
    if (!category) {
      return NextResponse.json({ message: 'Category is required.' }, { status: 400 });
    }
    if (!amount) {
      return NextResponse.json({ message: 'Amount is required.' }, { status: 400 });
    }
    if (!paidFrom) {
      return NextResponse.json({ message: 'Paid from (account) is required.' }, { status: 400 });
    }
    if (!expenseDate) {
      return NextResponse.json({ message: 'Expense date is required.' }, { status: 400 });
    }

    // Category-specific validation
    if (category === 'Transport' && !transportType) {
      return NextResponse.json({ message: 'Nooca gaadiidka waa waajib.' }, { status: 400 });
    }

    if (category === 'Labor') {
      if (!employeeId) {
        return NextResponse.json({ message: 'Employee is required for Labor expense.' }, { status: 400 });
      }
      if (!projectId) {
        return NextResponse.json({ message: 'Project is required for Labor expense.' }, { status: 400 });
      }
      if (laborPaidAmount === undefined || laborPaidAmount === null || laborPaidAmount === '') {
        return NextResponse.json({ message: 'Paid amount for labor is required.' }, { status: 400 });
      }
      if (!paidFrom) {
        return NextResponse.json({ message: 'Account (paidFrom) is required for Labor expense.' }, { status: 400 });
      }
      if (!expenseDate) {
        return NextResponse.json({ message: 'Date worked is required for Labor expense.' }, { status: 400 });
      }
    }

    if (category === 'Material') {
      if (!projectId) {
        return NextResponse.json({ message: 'Project is required for Material expense.' }, { status: 400 });
      }
      if (!Array.isArray(reqBody.materials) || reqBody.materials.length === 0) {
        return NextResponse.json({ message: 'At least one material is required for Material expense.' }, { status: 400 });
      }
      for (const mat of reqBody.materials) {
        if (!mat.name || !mat.qty || !mat.price || !mat.unit) {
          return NextResponse.json({ message: 'Material name, quantity, price, and unit are required for each material.' }, { status: 400 });
        }
      }
    }

    if (category === 'Equipment Rental') {
      if (!equipmentName || !rentalPeriod || !rentalFee || !supplierName || !projectId || !bankAccountId) {
        return NextResponse.json({ message: 'Dhammaan fields-ka Equipment Rental waa waajib.' }, { status: 400 });
      }
    }

    let finalWage = amount;
    let projectLabor;
    if (category === 'Labor') {
      // Find previous record for this employee/project
      const previousLabor = await prisma.projectLabor.findFirst({
        where: { employeeId, projectId },
        orderBy: { dateWorked: 'desc' },
      });
      let agreedWage: number = 0;
      let previousPaidAmount: number = 0;
      let remainingWage: number = 0;
      if (previousLabor) {
        // Safely handle nullable Decimal fields
        agreedWage = previousLabor.agreedWage !== null ? (typeof previousLabor.agreedWage === 'object' && 'toNumber' in previousLabor.agreedWage ? previousLabor.agreedWage.toNumber() : Number(previousLabor.agreedWage)) : 0;
        previousPaidAmount = previousLabor.paidAmount !== null ? (typeof previousLabor.paidAmount === 'object' && 'toNumber' in previousLabor.paidAmount ? previousLabor.paidAmount.toNumber() : Number(previousLabor.paidAmount)) : 0;
        const prevRemaining = previousLabor.remainingWage !== null ? (typeof previousLabor.remainingWage === 'object' && 'toNumber' in previousLabor.remainingWage ? previousLabor.remainingWage.toNumber() : Number(previousLabor.remainingWage)) : 0;
        remainingWage = prevRemaining - Number(laborPaidAmount);
      } else {
        agreedWage = amount ? Number(amount) : 0;
        previousPaidAmount = 0;
        remainingWage = agreedWage - Number(laborPaidAmount);
      }
      // Create new ProjectLabor record
      projectLabor = await prisma.projectLabor.create({
        data: {
          projectId,
          employeeId,
          agreedWage,
          paidAmount: Number(laborPaidAmount),
          previousPaidAmount,
          remainingWage,
          description,
          paidFrom,
          dateWorked: new Date(expenseDate),
        },
      });
    }

    // 1. Create the expense
    // Always provide a non-empty string for description
    const safeDescription = description || note || (category === 'Transport' ? transportType : '') || 'Expense';
    const newExpense = await prisma.expense.create({
      data: {
        description: safeDescription,
        amount: finalWage.toString(),
        category,
        subCategory: subCategory || null,
        paidFrom,
        expenseDate: new Date(expenseDate),
        note: note || null,
        approved: false,
        company: { connect: { id: companyId } },
        user: { connect: { id: userId } },
        project: projectId ? { connect: { id: projectId } } : undefined,
        employee: employeeId ? { connect: { id: employeeId } } : undefined,
        transportType: category === 'Transport' ? transportType : undefined,
        consultantName: category === 'Consultancy' ? consultantName : undefined,
        consultancyType: category === 'Consultancy' ? consultancyType : undefined,
        consultancyFee: category === 'Consultancy' ? consultancyFee ? Number(consultancyFee) : undefined : undefined,
        equipmentName: category === 'Equipment Rental' ? equipmentName : undefined,
        rentalPeriod: category === 'Equipment Rental' ? rentalPeriod : undefined,
        rentalFee: category === 'Equipment Rental' ? rentalFee ? Number(rentalFee) : undefined : undefined,
        supplierName: category === 'Equipment Rental' ? supplierName : undefined,
        bankAccountId: category === 'Equipment Rental' ? bankAccountId : undefined,
        materials: reqBody.materials ? reqBody.materials : undefined,
      },
    });

    // 1b. If Material expense, create ProjectMaterial records for each material
    if (category === 'Material' && Array.isArray(reqBody.materials) && projectId) {
      for (const mat of reqBody.materials) {
        await prisma.projectMaterial.create({
          data: {
            name: mat.name,
            quantityUsed: typeof mat.qty === 'number' ? mat.qty : parseFloat(mat.qty),
            unit: mat.unit,
            costPerUnit: typeof mat.price === 'number' ? mat.price : parseFloat(mat.price),
            leftoverQty: 0,
            projectId,
          },
        });
      }
    }

    // 2. Create a corresponding transaction (always for every expense)
    const transactionAmount = -Math.abs(Number(laborPaidAmount > 0 ? laborPaidAmount : amount));
    // Always provide a non-empty string for description
    const transactionDescription = description || note || category || 'Expense transaction';
    await prisma.transaction.create({
      data: {
        description: transactionDescription,
        amount: transactionAmount,
        type: 'EXPENSE',
        transactionDate: new Date(expenseDate),
        note: note || null,
        accountId: category === 'Equipment Rental' ? bankAccountId : paidFrom,
        expenseId: newExpense.id,
        employeeId: employeeId || undefined,
        userId,
        companyId,
        projectId,
      },
    });

    // 3. Decrement the account balance in real time
    if (paidFrom && amount) {
      await prisma.account.update({
        where: { id: paidFrom },
        data: {
          balance: { decrement: Number(amount) },
        },
      });
    }

    return NextResponse.json({ expense: newExpense }, { status: 201 });
  } catch (error) {
    console.error('Labor expense API error:', error);
    const errorMessage = error && typeof error === 'object' && 'message' in error ? (error as any).message : String(error);
    return NextResponse.json({ message: 'Server error.', details: errorMessage }, { status: 500 });
  }
}
