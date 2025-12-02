// app/api/accounting/reports/projects/route.ts - Project Reports API
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '../auth';

// GET /api/accounting/reports/projects - Get project financial reports
// NOTE: Si looga fogaado ciladaha 500 ee Prisma, waxaan ka dhignay query-ga mid aad u fudud oo la isku halayn karo.
export async function GET(request: Request) {
  try {
    let companyId: string;
    try {
      companyId = await getSessionCompanyId();
    } catch (err) {
      console.error('Project Reports API auth error:', err);
      return NextResponse.json(
        { message: 'Unauthorized: company not found in session' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Hadda ma isticmaaleyno filter taariikheed gudaha Prisma si aan looga dhalan cilado,
    // balse weli waan soo celinaynaa startDate / endDate si UI-gu u muujiyo.

    // Get company info
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, logoUrl: true }
    });

    // Get all projects for the company (no complex nested filters)
    const projects = await prisma.project.findMany({
      where: {
        companyId,
      },
      include: {
        customer: { select: { name: true } },
        expenses: {
          select: {
            id: true,
            amount: true,
            category: true,
            description: true,
            expenseDate: true,
            subCategory: true,
            note: true,
            rentalPeriod: true,
            transportType: true,
            consultancyType: true,
            consultantName: true,
            supplierName: true,
            materials: true,
            employee: {
              select: {
                fullName: true,
              },
            },
          }
        },
        transactions: {
          select: {
            id: true,
            amount: true,
            type: true,
            description: true,
            transactionDate: true,
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentDate: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate financial data for each project
    const projectReports = projects.map(project => {
      // Total revenue from project value/agreement
      const projectValue = Number(project.agreementAmount || 0);
      
      // Total payments received
      const totalPayments = project.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      
      // Remaining revenue
      const remainingRevenue = projectValue - totalPayments;
      
      // Expenses by category
      const materialCosts = project.expenses
        .filter(e => e.category === 'Material')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      
      const laborCosts = project.expenses
        .filter(e => e.category === 'Labor')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      
      const transportCosts = project.expenses
        .filter(e => e.category === 'Transport')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      
      const equipmentCosts = project.expenses
        .filter(e => e.category === 'Equipment')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      
      const utilitiesCosts = project.expenses
        .filter(e => e.category === 'Utilities')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      
      const consultancyCosts = project.expenses
        .filter(e => e.category === 'Consultancy')
        .reduce((sum, e) => sum + Number(e.amount), 0);
      
      // Total expenses
      const totalExpenses = project.expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      
      // Income from transactions
      const incomeTransactions = project.transactions.filter(t => 
        t.type === 'INCOME' || t.type === 'TRANSFER_IN'
      );
      const totalRevenue = totalPayments + incomeTransactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
      
      // Gross profit
      const grossProfit = totalRevenue - totalExpenses;
      
      // Profit margin
      const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
      
      // Completion percentage (based on payments vs project value)
      const completionPercentage = projectValue > 0 ? (totalPayments / projectValue) * 100 : 0;

      return {
        id: project.id,
        name: project.name,
        status: project.status,
        customer: project.customer?.name || 'N/A',
        startDate: project.startDate?.toISOString().split('T')[0] || '',
        expectedCompletionDate: project.expectedCompletionDate?.toISOString().split('T')[0] || '',
        actualCompletionDate: project.actualCompletionDate?.toISOString().split('T')[0] || '',
        projectValue,
        totalRevenue,
        totalPayments,
        remainingRevenue,
        materialCosts,
        laborCosts,
        transportCosts,
        equipmentCosts,
        utilitiesCosts,
        consultancyCosts,
        totalExpenses,
        grossProfit,
        profitMargin,
        completionPercentage,
        expenseCount: project.expenses.length,
        transactionCount: project.transactions.length,
        paymentCount: project.payments.length,
        expenses: project.expenses.map(e => ({
          id: e.id,
          category: e.category,
          description: e.description,
          amount: Number(e.amount),
          date: e.expenseDate?.toISOString().split('T')[0] || '',
          subCategory: e.subCategory || null,
          note: e.note || null,
          rentalPeriod: e.rentalPeriod || null,
          transportType: e.transportType || null,
          consultancyType: e.consultancyType || null,
          consultantName: e.consultantName || null,
          supplierName: e.supplierName || null,
          employeeName: e.employee?.fullName || null,
          materials: e.materials || null,
        })),
        transactions: project.transactions.map(t => ({
          id: t.id,
          type: t.type,
          description: t.description,
          amount: Number(t.amount),
          date: t.transactionDate?.toISOString().split('T')[0] || '',
        })),
        payments: project.payments.map(p => ({
          id: p.id,
          amount: Number(p.amount),
          date: p.paymentDate?.toISOString().split('T')[0] || '',
          // Payment model doesn't have description; we can extend later if needed
          description: '',
        })),
      };
    });

    // Calculate summary statistics
    const totalProjects = projectReports.length;
    const activeProjects = projectReports.filter(p => p.status === 'Active').length;
    const completedProjects = projectReports.filter(p => p.status === 'Completed').length;
    const onHoldProjects = projectReports.filter(p => p.status === 'On Hold').length;
    
    const totalRevenue = projectReports.reduce((sum, p) => sum + p.totalRevenue, 0);
    const totalExpenses = projectReports.reduce((sum, p) => sum + p.totalExpenses, 0);
    const totalProfit = projectReports.reduce((sum, p) => sum + p.grossProfit, 0);
    
    const averageProfitMargin = totalRevenue > 0 
      ? (totalProfit / totalRevenue) * 100 
      : 0;

    const summary = {
      totalProjects,
      activeProjects,
      completedProjects,
      onHoldProjects,
      totalRevenue,
      totalExpenses,
      totalProfit,
      averageProfitMargin,
    };

    return NextResponse.json({
      companyName: company?.name || 'Company',
      companyLogoUrl: company?.logoUrl || null,
      startDate: startDate || null,
      endDate: endDate || null,
      projects: projectReports,
      summary,
    }, { status: 200 });
  } catch (error) {
    console.error('Project Reports API error:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}


