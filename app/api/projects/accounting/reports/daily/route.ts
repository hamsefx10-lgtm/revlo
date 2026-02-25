// app/api/accounting/reports/daily/route.ts - Daily Report API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants
import { Decimal } from '@prisma/client/runtime/library'; // Import Decimal type

// GET /api/accounting/reports/daily - Soo deji xogta warbixinta maalinlaha ah
export async function GET(request: Request) {
  try {
    // Mustaqbalka, halkan waxaad ku dari doontaa authentication iyo authorization
    // Tusaale: const session = await getServerSession(authOptions);
    // if (!session || !isManagerOrAdmin(session.user.role)) return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 403 });
    // const companyId = session.user.companyId;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Bilowga maalinta

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Dhamaadka maalinta

    // Soo deji transactions-ka maalintaas
    const dailyTransactions = await prisma.transaction.findMany({
      where: {
        transactionDate: {
          gte: today,
          lt: tomorrow,
        },
        // companyId: companyId // Mustaqbalka, ku dar filter-kan
      },
      include: {
        project: { select: { name: true } },
        customer: { select: { name: true } },
        // vendor: { select: { name: true } },
        user: { select: { fullName: true } },
      }
    });

    let todayIncome = 0;
    let todayExpenses = 0;
    let newTransactionsCount = dailyTransactions.length;

    dailyTransactions.forEach((trx: any) => {
      if (trx.type === 'INCOME' || trx.type === 'TRANSFER_IN' || trx.type === 'DEBT_TAKEN') {
        todayIncome += trx.amount.toNumber();
      } else if (trx.type === 'EXPENSE' || trx.type === 'TRANSFER_OUT' || trx.type === 'DEBT_REPAID') {
        todayExpenses += trx.amount.toNumber();
      }
    });

    const todayNetFlow = todayIncome - todayExpenses;

    // Soo deji mashaariicda bilaabmay ama dhammaystiran maanta (simulated)
    const projectsStartedToday = await prisma.project.count({
      where: {
        createdAt: { gte: today, lt: tomorrow },
        // companyId: companyId
      }
    });
    const projectsCompletedToday = await prisma.project.count({
      where: {
        actualCompletionDate: { gte: today, lt: tomorrow },
        // companyId: companyId
      }
    });

    // Soo deji users-ka cusub maanta (simulated)
    const newUsersToday = await prisma.user.count({
      where: {
        createdAt: { gte: today, lt: tomorrow },
        // companyId: companyId
      }
    });


    return NextResponse.json(
      {
        date: today.toISOString().split('T')[0], // Taariikhda maanta
        todayIncome: todayIncome,
        todayExpenses: todayExpenses,
        todayNetFlow: todayNetFlow,
        newTransactions: newTransactionsCount,
        projectsStartedToday: projectsStartedToday,
        projectsCompletedToday: projectsCompletedToday,
        newUsersToday: newUsersToday,
        recentActivities: dailyTransactions.map((trx: any) => ({ // Soo deji dhaqdhaqaaqyo dhawaan ah
          id: trx.id,
          type: trx.type,
          description: trx.description,
          amount: trx.amount.toNumber(),
          date: trx.transactionDate.toISOString(),
          user: trx.user?.fullName || 'N/A',
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cilad ayaa dhacday marka warbixinta maalinlaha ah la soo gelinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
