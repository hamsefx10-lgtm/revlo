import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/admin/auth';

export async function GET() {
  try {
    const companyId = await getSessionCompanyId();
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get total transactions and amount
    const [totalTransactions, totalAmountResult, todayTransactions, todayAmountResult] = await Promise.all([
      prisma.transaction.count({ where: { companyId } }),
      prisma.transaction.aggregate({
        where: { companyId },
        _sum: { amount: true }
      }),
      prisma.transaction.count({ 
        where: { 
          companyId, 
          createdAt: { gte: today } 
        } 
      }),
      prisma.transaction.aggregate({
        where: { 
          companyId, 
          createdAt: { gte: today } 
        },
        _sum: { amount: true }
      })
    ]);

    const totalAmount = totalAmountResult._sum.amount?.toNumber() || 0;
    const amountToday = todayAmountResult._sum.amount?.toNumber() || 0;
    const averageTransactionValue = totalTransactions > 0 ? totalAmount / totalTransactions : 0;

    // Get transaction types distribution
    const transactionTypes = await prisma.transaction.groupBy({
      by: ['type'],
      where: { companyId },
      _count: { type: true },
      _sum: { amount: true }
    });

    const topTransactionTypes = transactionTypes
      .map(type => ({
        type: type.type,
        count: type._count.type,
        amount: type._sum.amount?.toNumber() || 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Get recent activity (last 24 hours, grouped by hour)
    const recentActivity = [];
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
      
      const [count, amountResult] = await Promise.all([
        prisma.transaction.count({
          where: {
            companyId,
            createdAt: { gte: hourStart, lt: hourEnd }
          }
        }),
        prisma.transaction.aggregate({
          where: {
            companyId,
            createdAt: { gte: hourStart, lt: hourEnd }
          },
          _sum: { amount: true }
        })
      ]);

      recentActivity.push({
        time: hourStart.toISOString().slice(11, 16), // HH:MM format
        count,
        amount: amountResult._sum.amount?.toNumber() || 0
      });
    }

    const stats = {
      totalTransactions,
      totalAmount,
      transactionsToday: todayTransactions,
      amountToday,
      averageTransactionValue,
      topTransactionTypes,
      recentActivity
    };

    return NextResponse.json({ 
      success: true, 
      stats,
      timestamp: new Date()
    });

  } catch (error: any) {
    console.error('Error fetching transaction stats:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch transaction stats', error: error.message },
      { status: 500 }
    );
  }
}
