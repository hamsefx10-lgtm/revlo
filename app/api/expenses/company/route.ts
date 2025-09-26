// Company Expenses API
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';

// GET /api/expenses/company - List all company expenses
export async function GET(request: Request) {
  try {
    const { companyId } = await getSessionCompanyUser();
    const expenses = await prisma.expense.findMany({
      where: { companyId, projectId: null },
      orderBy: { expenseDate: 'desc' },
    });
    return NextResponse.json({ expenses }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
  }
}

// POST /api/expenses/company - Add new company expense
export async function POST(request: Request) {
  try {
    const { companyId, userId } = await getSessionCompanyUser();
    const { description, amount, category, subCategory, paidFrom, expenseDate, note, employeeId } = await request.json();
    if (!category || typeof amount !== 'number' || amount <= 0 || !paidFrom || !expenseDate) {
      return NextResponse.json({ message: 'Fadlan buuxi dhammaan beeraha waajibka ah: Category, Amount, PaidFrom, ExpenseDate.' }, { status: 400 });
    }
    // 1. Create the expense
    const newExpense = await prisma.expense.create({
      data: {
        description: description?.trim() || '',
        amount: amount.toString(),
        category,
        subCategory: subCategory || null,
        paidFrom,
        expenseDate: new Date(expenseDate),
        note: note?.trim() || null,
        approved: false,
        companyId,
        userId,
        employeeId: employeeId || undefined,
      },
    });

    // 2. Create a corresponding transaction (always for every expense)
    // Always store as negative for expense
    const transactionAmount = -Math.abs(Number(amount));
    await prisma.transaction.create({
      data: {
        description: description?.trim() || '',
        amount: transactionAmount,
        type: 'EXPENSE',
        transactionDate: new Date(expenseDate),
        note: note?.trim() || null,
        accountId: paidFrom,
        expenseId: newExpense.id,
        employeeId: employeeId || undefined,
        userId,
        companyId,
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
    return NextResponse.json({ message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
  }
}
