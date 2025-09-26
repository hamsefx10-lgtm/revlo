// app/api/customers/payments/route.ts - Customer Payment Management API
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';
import { Decimal } from '@prisma/client/runtime/library';

// POST /api/customers/payments - Record customer payment
export async function POST(request: Request) {
  try {
    const { companyId, userId } = await getSessionCompanyUser();
    const {
      customerId,
      projectId,
      amount,
      paymentMethod,
      accountId,
      notes,
      paymentDate
    } = await request.json();

    // Validation
    if (!customerId || !amount || !accountId) {
      return NextResponse.json(
        { message: 'Customer ID, amount, iyo account ID waa waajib.' },
        { status: 400 }
      );
    }

    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json(
        { message: 'Qiimaha waa inuu noqdaa nambar wanaagsan.' },
        { status: 400 }
      );
    }

    // Hubi in customer uu jiro
    const customer = await prisma.customer.findUnique({
      where: { id: customerId, companyId }
    });
    if (!customer) {
      return NextResponse.json(
        { message: 'Macmiilka lama helin.' },
        { status: 400 }
      );
    }

    // Hubi in account uu jiro
    const account = await prisma.account.findUnique({
      where: { id: accountId, companyId }
    });
    if (!account) {
      return NextResponse.json(
        { message: 'Akoonka lama helin.' },
        { status: 400 }
      );
    }

    // Hubi in project uu jiro (haddii la keenay)
    let project = null;
    if (projectId) {
      project = await prisma.project.findUnique({
        where: { id: projectId, companyId }
      });
      if (!project) {
        return NextResponse.json(
          { message: 'Mashruuca lama helin.' },
          { status: 400 }
        );
      }
      
      // Validate payment amount doesn't exceed remaining amount
      const currentRemaining = Number(project.remainingAmount);
      if (Number(amount) > currentRemaining) {
        return NextResponse.json(
          { message: `Lacagta $${Number(amount).toLocaleString()} waa ka weyn tahay ku dhiman $${currentRemaining.toLocaleString()}.` },
          { status: 400 }
        );
      }
    }

    // 1. Create Transaction (DEBT_REPAID)
    const transaction = await prisma.transaction.create({
      data: {
        description: `Payment received from ${customer.name}${project ? ` for project: ${project.name}` : ''} - ${paymentMethod || 'Cash'}`,
        amount: Number(amount),
        type: 'DEBT_REPAID',
        transactionDate: new Date(paymentDate || new Date()),
        note: notes || null,
        accountId: accountId,
        projectId: projectId || null,
        customerId: customerId,
        userId: userId,
        companyId: companyId,
      },
    });

    // 2. Update Account Balance (Add money to account)
    await prisma.account.update({
      where: { id: accountId },
      data: { balance: { increment: Number(amount) } },
    });

    // 3. Update Project Balance (haddii project la keenay)
    if (projectId && project) {
      // Calculate new values correctly
      const newAdvancePaid = Number(project.advancePaid) + Number(amount);
      const newRemainingAmount = Number(project.agreementAmount) - newAdvancePaid;
      
      await prisma.project.update({
        where: { id: projectId },
        data: {
          advancePaid: newAdvancePaid,
          remainingAmount: newRemainingAmount  // ✅ Calculated correctly
        }
      });

      // Haddii project-ku dhammaado (remaining amount <= 0), mark as completed
      if (newRemainingAmount <= 0) {
        await prisma.project.update({
          where: { id: projectId },
          data: { status: 'Completed' }
        });
      }
    }

    // 4. Create Payment Record (for detailed tracking)
    const payment = await prisma.payment.create({
      data: {
        amount: Number(amount),
        paymentDate: new Date(paymentDate || new Date()),
        paymentType: projectId ? 'Milestone' : 'General Payment',
        receivedIn: account.name,
        note: notes || null,
        projectId: projectId || null,
        customerId: customerId,
      },
    });

    // 5. Calculate Customer Debt Status
    const customerDebts = await prisma.transaction.findMany({
      where: {
        customerId,
        companyId,
        type: 'DEBT_TAKEN'
      }
    });
    
    const customerPayments = await prisma.transaction.findMany({
      where: {
        customerId,
        companyId,
        type: 'DEBT_REPAID'
      }
    });
    
    const totalDebt = customerDebts.reduce((sum, debt) => sum + Number(debt.amount), 0);
    const totalPaid = customerPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const remainingDebt = totalDebt - totalPaid;

    return NextResponse.json({
      message: 'Lacagta si guul leh ayaa la diiwaan geliyay!',
      transaction,
      payment,
      projectId: projectId, // Include projectId for real-time updates
      customerId: customerId,
      customerDebtStatus: {
        totalDebt,
        totalPaid,
        remainingDebt,
        isFullyPaid: remainingDebt <= 0
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Customer payment error:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// GET /api/customers/payments - Get customer payment history
export async function GET(request: Request) {
  try {
    const { companyId } = await getSessionCompanyUser();
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const projectId = searchParams.get('projectId');

    if (!customerId) {
      return NextResponse.json(
        { message: 'Customer ID waa waajib.' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = { 
      customerId,
      companyId,
      type: 'DEBT_REPAID'
    };
    
    if (projectId) {
      where.projectId = projectId;
    }

    const payments = await prisma.transaction.findMany({
      where,
      include: {
        account: { select: { name: true } },
        project: { select: { name: true } },
        customer: { select: { name: true } },
        user: { select: { fullName: true } }
      },
      orderBy: { transactionDate: 'desc' }
    });

    // Calculate debt summary
    const customerDebts = await prisma.transaction.findMany({
      where: {
        customerId,
        companyId,
        type: 'DEBT_TAKEN'
      }
    });
    
    const customerPayments = await prisma.transaction.findMany({
      where: {
        customerId,
        companyId,
        type: 'DEBT_REPAID'
      }
    });
    
    const totalDebt = customerDebts.reduce((sum, debt) => sum + Number(debt.amount), 0);
    const totalPaid = customerPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const remainingDebt = totalDebt - totalPaid;

    return NextResponse.json({
      payments,
      debtSummary: {
        totalDebt,
        totalPaid,
        remainingDebt,
        isFullyPaid: remainingDebt <= 0
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Get customer payments error:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday.' },
      { status: 500 }
    );
  }
}
