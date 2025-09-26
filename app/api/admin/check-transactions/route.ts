// app/api/admin/check-transactions/route.ts - Check existing transactions and their project links
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const sessionData = await getSessionCompanyUser();
    if (!sessionData) {
      return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 401 });
    }
    const { companyId } = sessionData;
    
    console.log('🔍 Checking existing transactions...');
    
    // Get all transactions for this company
    const transactions = await prisma.transaction.findMany({
      where: { companyId },
      include: {
        project: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        account: { select: { name: true } }
      },
      orderBy: { transactionDate: 'desc' },
      take: 20 // Get last 20 transactions
    });

    // Check for INCOME transactions without project links
    const incomeWithoutProject = await prisma.transaction.findMany({
      where: {
        companyId,
        type: 'INCOME',
        projectId: null
      },
      include: {
        customer: { select: { name: true } },
        account: { select: { name: true } }
      }
    });

    // Check projects and their transactions
    const projects = await prisma.project.findMany({
      where: { companyId },
      include: {
        transactions: {
          where: { type: 'INCOME' },
          select: { id: true, description: true, amount: true, transactionDate: true }
        },
        customer: { select: { name: true } }
      }
    });

    return NextResponse.json({
      message: 'Transaction check completed',
      summary: {
        totalTransactions: transactions.length,
        incomeWithoutProject: incomeWithoutProject.length,
        totalProjects: projects.length
      },
  transactions: transactions.map((trx: any) => ({
        id: trx.id,
        description: trx.description,
        amount: trx.amount,
        type: trx.type,
        date: trx.transactionDate,
        account: trx.account?.name,
        project: trx.project ? { id: trx.project.id, name: trx.project.name } : null,
        customer: trx.customer ? { id: trx.customer.id, name: trx.customer.name } : null,
        hasProjectLink: !!trx.projectId
      })),
  incomeWithoutProject: incomeWithoutProject.map((trx: any) => ({
        id: trx.id,
        description: trx.description,
        amount: trx.amount,
        customer: trx.customer?.name,
        account: trx.account?.name
      })),
  projects: projects.map((project: any) => ({
        id: project.id,
        name: project.name,
        customer: project.customer.name,
        agreementAmount: project.agreementAmount,
        advancePaid: project.advancePaid,
        remainingAmount: project.remainingAmount,
        incomeTransactions: project.transactions.length,
  transactions: project.transactions.map((trx: any) => ({
          id: trx.id,
          description: trx.description,
          amount: trx.amount,
          date: trx.transactionDate
        }))
      }))
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error checking transactions:', error);
    return NextResponse.json(
      { message: 'Cilad ayaa dhacday marka transactions la baarayay.' },
      { status: 500 }
    );
  }
}
