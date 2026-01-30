import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { PROJECT_STATUSES } from '@/lib/constants';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// POST /api/projects - Add new project
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Authentication failed. Company not found.' }, { status: 401 });
    }
    const companyId = session.user.companyId;
    const {
      name,
      description,
      agreementAmount,
      advancePaid,
      advancePayments,
      projectType,
      expectedCompletionDate,
      notes,
      customerId
    } = await request.json();

    // Validation
    if (
      !name ||
      !agreementAmount ||
      !projectType ||
      !expectedCompletionDate ||
      !customerId
    ) {
      return NextResponse.json(
        { message: 'Fadlan buuxi dhammaan beeraha waajibka ah.' },
        { status: 400 }
      );
    }

    // Hubi in customer uu jiro
    const customer = await prisma.customer.findUnique({ where: { id: customerId, companyId } });
    if (!customer) {
      return NextResponse.json({ message: 'Macmiilka lama helin.' }, { status: 400 });
    }

    // Hubi in company uu jiro
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return NextResponse.json({ message: 'Shirkadda lama helin.' }, { status: 400 });
    }

    // Mashruuca cusub
    const newProject = await prisma.project.create({
      data: {
        name,
        description,
        agreementAmount: parseFloat(agreementAmount),
        advancePaid: parseFloat(advancePaid || 0),
        remainingAmount: parseFloat(agreementAmount) - parseFloat(advancePaid || 0),
        projectType,
        status: PROJECT_STATUSES?.ACTIVE || 'ACTIVE',
        expectedCompletionDate: new Date(expectedCompletionDate),
        notes,
        customerId,
        companyId,
      },
    });

    // Haddii advancePayments la keenay, samee transaction iyo update account balance
    if (advancePayments && Array.isArray(advancePayments) && advancePayments.length > 0) {
      for (const adv of advancePayments) {
        if (!adv.accountId || !adv.amount || isNaN(Number(adv.amount)) || Number(adv.amount) <= 0) continue;
        // 1. Create Transaction
        await prisma.transaction.create({
          data: {
            description: `Advance Payment for Project: ${name}`,
            amount: Number(adv.amount),
            type: 'INCOME',
            transactionDate: new Date(),
            companyId,
            accountId: adv.accountId,
            projectId: newProject.id,
            customerId: customerId,
            note: 'Advance payment received at project creation',
          },
        });
        // 2. Update Account Balance
        await prisma.account.update({
          where: { id: adv.accountId, companyId },
          data: { balance: { increment: Number(adv.amount) } },
        });
      }
    }

    // Notify about project creation for real-time updates
    const projectEvent = {
      id: newProject.id,
      action: 'created',
      timestamp: Date.now()
    };

    // Store in localStorage for cross-tab communication (this will be handled by client-side)
    // The client will listen for this event and update accordingly

    return NextResponse.json(
      { message: 'Mashruuca si guul leh ayaa loo daray!', project: newProject, event: projectEvent },
      { status: 201 }
    );
  } catch (error) {
    console.error('Cilad ayaa dhacday marka mashruuca la darayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// GET /api/projects - Get all projects
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Authentication failed. Company not found.' }, { status: 401 });
    }
    const companyId = session.user.companyId;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    // Build where clause
    const where: any = { companyId };
    if (customerId) {
      where.customerId = customerId;
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        transactions: {
          where: {
            OR: [
              { type: 'INCOME' },
              { type: 'DEBT_REPAID' }
            ]
          },
          select: { id: true, amount: true, type: true, description: true, transactionDate: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate dynamic values
    const projectsWithDynamicData = projects.map((project: any) => {
      const agreementAmount = Number(project.agreementAmount || 0);
      const advancePaid = Number(project.advancePaid || 0);

      // Deduplication Logic: Identify and suppress the auto-generated advance transaction
      // (Same logic as in details page)
      const advanceTransaction = project.transactions.find((t: any) => {
        const isIncome = t.type === 'INCOME';
        const trxTime = new Date(t.transactionDate).getTime();
        const projTime = new Date(project.createdAt).getTime();
        const isCloseTime = Math.abs(trxTime - projTime) < 5 * 60 * 1000;
        const desc = (t.description || '').toLowerCase();
        const isAutoGenerated = desc.includes('advance payment for project');
        return isIncome && isCloseTime && isAutoGenerated;
      });

      const totalRepaidViaTransactions = project.transactions
        .filter((t: any) => (t.type === 'DEBT_REPAID' || t.type === 'INCOME') && t.id !== advanceTransaction?.id)
        .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

      const totalPaid = advancePaid + totalRepaidViaTransactions;
      const remainingAmount = agreementAmount - totalPaid; // Allow negative for credit

      return {
        ...project,
        advancePaid: totalPaid, // Override static with dynamic total
        remainingAmount: remainingAmount, // Override static with dynamic total
        // Keep original for reference if needed? No, frontend expects these names.
      };
    });

    return NextResponse.json({ projects: projectsWithDynamicData }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday.' },
      { status: 500 }
    );
  }
}