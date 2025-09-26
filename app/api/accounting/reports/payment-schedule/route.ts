// app/api/accounting/reports/payment-schedule/route.ts - Payment Schedule Report API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants
import { Decimal } from '@prisma/client/runtime/library'; // Import Decimal type

// GET /api/accounting/reports/payment-schedule - Soo deji xogta warbixinta deynaha iyo lacagaha la sugayo
export async function GET(request: Request) {
  try {
    // Mustaqbalka, halkan waxaad ku dari doontaa authentication iyo authorization
    // Tusaale: const session = await getServerSession(authOptions);
    // if (!session || !isManagerOrAdmin(session.user.role)) return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 403 });
    // const companyId = session.user.companyId;

    // Parameters for filters
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type'); // 'Client Payment', 'Loan Repayment', 'Vendor Payment'
    const statusFilter = searchParams.get('status'); // 'Upcoming', 'Overdue', 'Paid'
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    // Fetch all payments (income)
    const clientPayments = await prisma.payment.findMany({
      where: {
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
        // companyId: companyId, // Mustaqbalka, ku dar filter-kan
      },
      include: {
          project: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true } },
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });

    // Fetch all expenses related to loans/debts (for repayment schedule)
    const loanRepayments = await prisma.expense.findMany({
        where: {
            category: 'Company Expense',
            subCategory: 'Debt Repayment',
            expenseDate: {
                gte: startDate,
                lte: endDate,
            },
            // companyId: companyId
        },
        include: {
            vendor: { select: { id: true, name: true } } // Assuming vendor is the lender
        }
    });

    // Combine and process data into PaymentScheduleItem format
    const paymentSchedule: any[] = [];

    clientPayments.forEach(pay => {
        // For simplicity, assuming all client payments are "Upcoming" unless marked as "Paid"
        // In a real system, you'd track due dates for project milestones.
        const currentStatus = (pay.amount.toNumber() === 0) ? 'Upcoming' : 'Paid'; // Simplified status
        
        paymentSchedule.push({
            id: pay.id,
            description: `Client Payment - ${pay.project?.name || pay.customer?.name || 'N/A'}`,
            amount: pay.amount.toNumber(),
            dueDate: pay.paymentDate.toISOString(), // Assuming paymentDate is the due date for simplicity
            status: currentStatus,
            relatedEntity: { 
                type: pay.projectId ? 'Project' : (pay.customerId ? 'Customer' : 'Other'), 
                name: pay.project?.name || pay.customer?.name || 'N/A',
                id: pay.projectId || pay.customerId || 'N/A'
            },
            paidAmount: currentStatus === 'Paid' ? pay.amount.toNumber() : 0,
            remainingAmount: currentStatus === 'Paid' ? 0 : pay.amount.toNumber(),
        });
    });

    loanRepayments.forEach(rep => {
        // For simplicity, assuming all loan repayments are "Paid" once recorded as expense
        paymentSchedule.push({
            id: rep.id,
            description: `Loan Repayment - ${rep.vendor?.name || 'N/A'}`,
            amount: rep.amount.toNumber(),
            dueDate: rep.expenseDate.toISOString(), // Assuming expenseDate is the due date
            status: 'Paid', // Once recorded as expense, it's paid
            relatedEntity: { 
                type: 'Loan', 
                name: rep.vendor?.name || 'N/A',
                id: rep.vendor?.id || 'N/A'
            },
            paidAmount: rep.amount.toNumber(),
            remainingAmount: 0,
        });
    });

    // Apply filters (status and type)
    const filteredSchedule = paymentSchedule.filter(item => {
        const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
        const matchesType = typeFilter === 'All' || item.relatedEntity.type === typeFilter;
        // Date filtering is handled by Prisma query, but can add more here if needed
        return matchesStatus && matchesType;
    });

    return NextResponse.json(
      {
        schedule: filteredSchedule,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cilad ayaa dhacday marka jadwalka lacagaha la soo gelinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
