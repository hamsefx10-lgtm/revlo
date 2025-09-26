import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/admin/auth';

export async function GET() {
  try {
    const companyId = await getSessionCompanyId();
    
    // Get recent transactions (last 100)
    const transactions = await prisma.transaction.findMany({
      where: { companyId },
      include: {
        customer: { select: { name: true } },
        project: { select: { name: true } },
        user: { select: { email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Transform the data for the frontend
  const liveTransactions = transactions.map((transaction: any) => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount.toNumber(),
      description: transaction.description || '',
      customerId: transaction.customerId,
      customerName: transaction.customer?.name,
      projectId: transaction.projectId,
      projectName: transaction.project?.name,
      timestamp: transaction.createdAt,
      status: 'completed', // All stored transactions are completed
      userId: transaction.userId || 'system',
      userEmail: transaction.user?.email || 'system@company.com'
    }));

    return NextResponse.json({ 
      success: true, 
      transactions: liveTransactions,
      timestamp: new Date()
    });

  } catch (error: any) {
    console.error('Error fetching live transactions:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch live transactions', error: error.message },
      { status: 500 }
    );
  }
}
