// app/api/sales/route.ts - Sales API
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET /api/sales - Get all sales (INCOME transactions with productId or sales category)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {
      companyId,
      type: 'INCOME',
      OR: [
        { category: 'SALES' },
        { description: { contains: 'Sale', mode: 'insensitive' } },
        { description: { contains: 'Iib', mode: 'insensitive' } },
      ]
    };

    if (startDate && endDate) {
      where.transactionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const sales = await prisma.transaction.findMany({
      where,
      include: {
        customer: true,
        account: true,
      },
      orderBy: {
        transactionDate: 'desc'
      }
    });

    // Calculate totals
    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.amount), 0);
    const totalCount = sales.length;

    return NextResponse.json({
      sales,
      summary: {
        totalSales,
        totalCount,
      }
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    );
  }
}

// POST /api/sales - Create a new sale
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.companyId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const userId = session.user.id;
    const body = await request.json();
    const { productId, customerId, quantity, unitPrice, totalAmount, accountId, saleDate, notes } = body;

    // Validation
    if (!productId || !quantity || !unitPrice || !accountId) {
      return NextResponse.json(
        { message: 'Fadlan buuxi dhammaan beeraha waajibka ah.' },
        { status: 400 }
      );
    }

    // Get product
    const product = await prisma.productCatalog.findFirst({
      where: { id: productId, companyId }
    });

    if (!product) {
      return NextResponse.json(
        { message: 'Alaabta lama helin.' },
        { status: 404 }
      );
    }

    // Get account
    const account = await prisma.account.findFirst({
      where: { id: accountId, companyId }
    });

    if (!account) {
      return NextResponse.json(
        { message: 'Account-ka lama helin.' },
        { status: 404 }
      );
    }

    // Calculate total if not provided
    const finalTotal = totalAmount || (quantity * unitPrice);

    // Create transaction (INCOME)
    const transaction = await prisma.transaction.create({
      data: {
        description: `Iibka: ${product.name} (${quantity} ${product.unit})`,
        amount: new Decimal(finalTotal),
        type: 'INCOME',
        transactionDate: saleDate ? new Date(saleDate) : new Date(),
        note: notes || null,
        accountId,
        customerId: customerId || null,
        category: 'SALES',
        userId,
        companyId,
      },
      include: {
        customer: true,
        account: true,
      }
    });

    // Update account balance
    await prisma.account.update({
      where: { id: account.id },
      data: { balance: account.balance + Number(finalTotal) },
    });

    return NextResponse.json(
      {
        message: 'Iibka si guul leh ayaa loo diiwaan geliyay!',
        sale: transaction
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json(
      { message: `Cilad server ayaa dhacday: ${error instanceof Error ? error.message : 'Fadlan isku day mar kale.'}` },
      { status: 500 }
    );
  }
}

