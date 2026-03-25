// app/api/projects/expenses/[id]/receipt/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';
import { saveReceiptImage } from '@/lib/upload';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: expenseId } = params;
    const session = await getSessionCompanyUser();
    const companyId = session?.companyId;

    if (!companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if expense exists and belongs to company
    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, companyId },
    });

    if (!expense) {
      return NextResponse.json({ message: 'Expense not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { message: 'Fadlan soo geli sawirka rasiidka (file).' },
        { status: 400 }
      );
    }

    // Save image
    const receiptUrl = await saveReceiptImage(file);

    // Update Expense and all linked Transactions
    await prisma.$transaction([
      prisma.expense.update({
        where: { id: expenseId },
        data: { receiptUrl },
      }),
      prisma.transaction.updateMany({
        where: { expenseId },
        data: { receiptUrl },
      }),
    ]);

    return NextResponse.json(
      { message: 'Rasiidka si guul leh ayaa loo soo geliyay!', receiptUrl },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Receipt upload error:', error);
    return NextResponse.json(
      { message: error.message || 'Cilad ayaa dhacday marka rasiidka la soo gelinayay.' },
      { status: 500 }
    );
  }
}
