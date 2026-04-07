// app/api/employees/route.ts - Employee Management API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { isValidEmail } from '@/lib/utils'; // For email validation if needed
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants
import { Decimal } from '@prisma/client/runtime/library'; // MUHIIM: Import Decimal
import { getSessionCompanyId } from './auth';

// GET /api/employees - Soo deji dhammaan shaqaalaha

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const employees = await prisma.employee.findMany({
      where: { companyId },
      orderBy: { fullName: 'asc' },
      include: {
        laborRecords: {
          include: {
            project: true
          }
        }
      }
    });

    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const currentDayOfMonth = today.getDate();

    // OPTIMIZATION: Fetch ALL relevant expenses for ALL employees in the list at once
    const employeeIds = employees.map(e => e.id);
    const allSalaryExpenses = await prisma.expense.findMany({
      where: {
        companyId,
        employeeId: { in: employeeIds },
        OR: [
          { category: 'Salary' },
          { category: 'Labor' },
          { category: 'Company Labor' },
          { subCategory: 'Salary' },
        ],
      },
    });

    // Group expenses by employeeId for efficient lookup
    const expensesByEmployee: Record<string, any[]> = {};
    allSalaryExpenses.forEach(expense => {
      if (!expense.employeeId) return;
      if (!expensesByEmployee[expense.employeeId]) {
        expensesByEmployee[expense.employeeId] = [];
      }
      expensesByEmployee[expense.employeeId].push(expense);
    });

    const processedEmployees = employees.map((emp: any) => {
      // monthlySalary can be null
      const monthlySalaryNum = emp.monthlySalary ? Number(emp.monthlySalary) : null;

      // Calculate total months worked
      const startDate = new Date(emp.startDate);
      const yearDiff = today.getFullYear() - startDate.getFullYear();
      const monthDiff = today.getMonth() - startDate.getMonth();
      const totalMonthsWorked = Math.max(1, yearDiff * 12 + monthDiff + 1);
      const totalSalaryOwed = monthlySalaryNum ? monthlySalaryNum * totalMonthsWorked : 0;

      // Get ACTUAL total paid from pre-fetched expenses
      const salaryExpenses = expensesByEmployee[emp.id] || [];
      const totalPaid = salaryExpenses.reduce((sum, expense) => {
        return sum + (expense.amount ? Number(expense.amount) : 0);
      }, 0);

      const dailyRate = monthlySalaryNum ? monthlySalaryNum / daysInMonth : null;
      const earnedThisMonth = dailyRate ? dailyRate * currentDayOfMonth : null;
      const totalRemaining = monthlySalaryNum ? totalSalaryOwed - totalPaid : 0;
      const overpaidAmount = totalRemaining < 0 ? Math.abs(totalRemaining) : 0;

      // Project labor records
      const laborRecords = (emp.laborRecords || []).map((labor: any) => ({
        id: labor.id,
        projectId: labor.projectId,
        projectName: labor.project?.name || '',
        workDescription: labor.workDescription,
        agreedWage: labor.agreedWage ? Number(labor.agreedWage) : null,
        paidAmount: labor.paidAmount ? Number(labor.paidAmount) : null,
        remainingWage: labor.remainingWage ? Number(labor.remainingWage) : null,
        dateWorked: labor.dateWorked,
      }));

      return {
        id: emp.id,
        fullName: emp.fullName,
        email: emp.email,
        phone: emp.phone,
        role: emp.role,
        category: emp.category,
        isActive: emp.isActive,
        startDate: emp.startDate,
        monthlySalary: monthlySalaryNum,
        totalPaid,
        totalSalaryOwed,
        totalRemaining,
        dailyRate,
        earnedThisMonth,
        overpaidAmount,
        daysWorkedThisMonth: currentDayOfMonth,
        laborRecords,
        totalMonthsWorked,
      };
    });
    return NextResponse.json({ employees: processedEmployees }, { status: 200 });
  } catch (error) {
    console.error('Cilad ayaa dhacday marka shaqaalaha la soo gelinayay:', error);
    return NextResponse.json(
      { message: `Cilad server ayaa dhacday: ${error instanceof Error ? error.message : 'Fadlan isku day mar kale.'}` },
      { status: 500 }
    );
  }
}

// POST /api/employees - Ku dar shaqaale cusub
export async function POST(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const body = await request.json();
    const { category } = body;

    if (category === 'PROJECT') {
      // Project employee: create new project employee
      const { fullName, email, phone, role, isActive, startDate, projectId } = body;
      if (!fullName || !role) {
        return NextResponse.json(
          { message: 'Fadlan buuxi dhammaan beeraha waajibka ah: Magaca Buuxa, Doorka.' },
          { status: 400 }
        );
      }
      if (email && !isValidEmail(email)) {
        return NextResponse.json(
          { message: 'Fadlan geli email sax ah.' },
          { status: 400 }
        );
      }
      if (!startDate) {
        return NextResponse.json(
          { message: 'Taariikhda bilawga shaqada waa waajib.' },
          { status: 400 }
        );
      }

      if (email) {
        const existingEmployee = await prisma.employee.findUnique({
          where: { email: email },
        });
        if (existingEmployee) {
          return NextResponse.json(
            { message: 'Shaqaalahan email-kiisa horey ayuu u diiwaan gashan yahay.' },
            { status: 409 }
          );
        }
      }

      const newEmployee = await prisma.employee.create({
        data: {
          fullName,
          email: email || null,
          phone: phone || null,
          role,
          salaryPaidThisMonth: new Decimal(0),
          lastPaymentDate: null,
          isActive: isActive,
          startDate: new Date(startDate),
          company: { connect: { id: companyId } },
          category: 'PROJECT',
          // Note: Project connection is handled through ProjectLabor records, not directly
        },
      });

      return NextResponse.json(
        { message: 'Shaqaalaha mashruuca si guul leh ayaa loo daray!', employee: newEmployee },
        { status: 201 }
      );
    } else {
      // Default: COMPANY employee
      const { fullName, email, phone, role, monthlySalary, isActive, startDate } = body;
      if (!fullName || !role) {
        return NextResponse.json(
          { message: 'Fadlan buuxi dhammaan beeraha waajibka ah: Magaca Buuxa, Doorka.' },
          { status: 400 }
        );
      }
      if (email && !isValidEmail(email)) {
        return NextResponse.json(
          { message: 'Fadlan geli email sax ah.' },
          { status: 400 }
        );
      }
      // monthlySalary is now optional, only validate if provided


      let monthlySalaryValue = undefined;
      if (typeof monthlySalary === 'number' && monthlySalary > 0) {
        monthlySalaryValue = new Decimal(monthlySalary);
      }
      if (!startDate) {
        return NextResponse.json(
          { message: 'Taariikhda bilawga mushaharka waa waajib.' },
          { status: 400 }
        );
      }

      if (email) {
        const existingEmployee = await prisma.employee.findUnique({
          where: { email: email },
        });
        if (existingEmployee) {
          return NextResponse.json(
            { message: 'Shaqaalahan email-kiisa horey ayuu u diiwaan gashan yahay.' },
            { status: 409 }
          );
        }
      }

      const newEmployee = await prisma.employee.create({
        data: {
          fullName,
          email: email || null,
          phone: phone || null,
          role,
          salaryPaidThisMonth: new Decimal(0),
          lastPaymentDate: null,
          isActive: isActive,
          startDate: new Date(startDate),
          company: { connect: { id: companyId } },
          category: 'COMPANY',
          ...(monthlySalaryValue ? { monthlySalary: monthlySalaryValue } : {}),
        },
      });

      return NextResponse.json(
        { message: 'Shaqaalaha shirkadda si guul leh ayaa loo daray!', employee: newEmployee },
        { status: 201 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { message: `Cilad server ayaa dhacday: ${error instanceof Error ? error.message : 'Fadlan isku day mar kale.'}` },
      { status: 500 }
    );
  }
}
