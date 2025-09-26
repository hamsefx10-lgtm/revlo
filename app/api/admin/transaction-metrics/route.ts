import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/admin/auth';

export async function GET() {
  try {
    const companyId = await getSessionCompanyId();
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get transaction counts
    const [totalTransactions, transactionsToday, transactionsThisWeek, transactionsThisMonth] = await Promise.all([
      prisma.transaction.count({ where: { companyId } }),
      prisma.transaction.count({ 
        where: { 
          companyId, 
          transactionDate: { gte: today } 
        } 
      }),
      prisma.transaction.count({ 
        where: { 
          companyId, 
          transactionDate: { gte: weekAgo } 
        } 
      }),
      prisma.transaction.count({ 
        where: { 
          companyId, 
          transactionDate: { gte: monthAgo } 
        } 
      })
    ]);

    // Get average transaction value
    const avgResult = await prisma.transaction.aggregate({
      where: { companyId },
      _avg: { amount: true }
    });
    const averageTransactionValue = avgResult._avg.amount?.toNumber() || 0;

    // Get transaction types distribution
    const transactionTypes = await prisma.transaction.groupBy({
      by: ['type'],
      where: { companyId },
      _count: { type: true }
    });

    const topTransactionTypes = transactionTypes
      .map(type => ({
        type: type.type,
        count: type._count.type,
        percentage: Math.round((type._count.type / totalTransactions) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6); // Top 6 transaction types

    const metrics = {
      totalTransactions,
      transactionsToday,
      transactionsThisWeek,
      transactionsThisMonth,
      averageTransactionValue,
      topTransactionTypes
    };

    return NextResponse.json({ 
      success: true, 
      metrics,
      timestamp: new Date()
    });

  } catch (error: any) {
    console.error('Error fetching transaction metrics:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch transaction metrics', error: error.message },
      { status: 500 }
    );
  }
}

