import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from './auth';

// GET /api/projects/[id]/expenses - Get all expenses for a project
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id: projectId } = params;
    const companyId = await getSessionCompanyId();
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.companyId !== companyId) {
      return NextResponse.json({ message: 'Mashruuca lama helin.' }, { status: 404 });
    }
    const expenses = await prisma.expense.findMany({
      where: { projectId },
      orderBy: { expenseDate: 'desc' },
    });
    return NextResponse.json({ expenses }, { status: 200 });
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka expenses-ka mashruuca ${params.id} la soo gelinayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/expenses - Add expense to project
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id: projectId } = params;
    const companyId = await getSessionCompanyId();
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.companyId !== companyId) {
      return NextResponse.json({ message: 'Mashruuca lama helin.' }, { status: 404 });
    }
    const { description, amount, expenseDate, category, subCategory, paidFrom, note, approved, userId, vendorId, employeeId, categoryId } = await request.json();
    if (!description || !amount || !expenseDate || !category || !paidFrom) {
      return NextResponse.json(
        { message: 'Fadlan buuxi dhammaan beeraha waajibka ah: Description, Amount, Date, Category, PaidFrom.' },
        { status: 400 }
      );
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { message: 'Lacagta waa inuu noqdaa nambar wanaagsan.' },
        { status: 400 }
      );
    }
    const newExpense = await prisma.expense.create({
      data: {
        description,
        amount,
        expenseDate: new Date(expenseDate),
        category,
        subCategory,
        paidFrom,
        note,
        approved: approved ?? false,
        projectId,
        userId,
        vendorId,
        employeeId,
        categoryId,
        companyId,
      },
    });
    return NextResponse.json(
      { message: 'Expense si guul leh ayaa loo daray mashruuca!', expense: newExpense },
      { status: 201 }
    );
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka expense-ka mashruuca ${params.id} la darayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}