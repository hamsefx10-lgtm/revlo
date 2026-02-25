// app/api/accounting/reports/bank/route.ts - Bank & Cash Flow Report API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants
import { Decimal } from '@prisma/client/runtime/library'; // Import Decimal type
import { getSessionCompanyUser } from '@/lib/auth';

// GET /api/accounting/reports/bank - Soo deji xogta warbixinta bangiga iyo dhaqdhaqaaqa lacagta
export async function GET(request: Request) {
  try {
    // Mustaqbalka, halkan waxaad ku dari doontaa authentication iyo authorization
    // Tusaale: const session = await getServerSession(authOptions);
    // if (!session || !isManagerOrAdmin(session.user.role)) return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 403 });
    // const companyId = session.user.companyId;

    // Parameters for filters
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const accountFilter = searchParams.get('account');
    const typeFilter = searchParams.get('type');

    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    const sessionData = await getSessionCompanyUser();
    if (!sessionData) {
      return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 401 });
    }
    const { companyId } = sessionData;

    // Fetch all accounts
    const accounts = await prisma.account.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });

    // Fetch transactions for the specified period and filters
    const transactions = await prisma.transaction.findMany({
      where: {
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
        accountId: accountFilter || undefined,
        type: typeFilter && ['INCOME', 'EXPENSE', 'TRANSFER_IN', 'TRANSFER_OUT', 'DEBT_TAKEN', 'DEBT_REPAID'].includes(typeFilter) ? (typeFilter as any) : undefined,
        companyId: companyId
      },
      include: {
          account: { select: { name: true } },
      },
      orderBy: {
        transactionDate: 'desc',
      },
    });

    // Calculate aggregated data
    const totalBalance = accounts.reduce((sum: number, acc: any) => sum + acc.balance.toNumber(), 0);
    const totalBankBalance = accounts.filter((acc: any) => acc.type === 'BANK' || acc.type === 'MOBILE_MONEY').reduce((sum: number, acc: any) => sum + acc.balance.toNumber(), 0);
    const totalCashBalance = accounts.filter((acc: any) => acc.type === 'CASH').reduce((sum: number, acc: any) => sum + acc.balance.toNumber(), 0);

    // Aggregate monthly cash flow data
    const monthlyCashFlowMap: { [key: string]: { month: string; income: number; expense: number; net: number } } = {};
    transactions.forEach((trx: any) => {
      const monthYear = trx.transactionDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      if (!monthlyCashFlowMap[monthYear]) {
        monthlyCashFlowMap[monthYear] = { month: monthYear, income: 0, expense: 0, net: 0 };
      }
      if (trx.type === 'INCOME' || trx.type === 'TRANSFER_IN' || trx.type === 'DEBT_TAKEN') {
        monthlyCashFlowMap[monthYear].income += trx.amount.toNumber();
      } else if (trx.type === 'EXPENSE' || trx.type === 'TRANSFER_OUT' || trx.type === 'DEBT_REPAID') {
        monthlyCashFlowMap[monthYear].expense += Math.abs(trx.amount.toNumber()); // Ensure expense is positive for chart
      }
      monthlyCashFlowMap[monthYear].net = monthlyCashFlowMap[monthYear].income - monthlyCashFlowMap[monthYear].expense;
    });

    const monthlyCashFlowData = Object.values(monthlyCashFlowMap).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    // Account distribution data for pie chart
    const accountDistributionData = accounts.map((acc: any) => ({ name: acc.name, value: acc.balance.toNumber() })).filter((item: any) => item.value > 0);


    return NextResponse.json(
      {
        totalBalance: totalBalance,
        totalBankBalance: totalBankBalance,
        totalCashBalance: totalCashBalance,
        monthlyCashFlow: monthlyCashFlowData,
        accountDistribution: accountDistributionData,
        transactions: transactions.map((trx: any) => ({ // Return original transactions with converted Decimal to Number
            ...trx,
            amount: trx.amount.toNumber(),
        })),
        accounts: accounts.map((acc: any) => ({ // Return original accounts with converted Decimal to Number
            ...acc,
            balance: acc.balance.toNumber(),
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cilad ayaa dhacday marka warbixinta bangiga la soo gelinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
