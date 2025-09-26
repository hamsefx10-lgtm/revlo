// app/api/employees/salary-summary.ts - Returns salary summary for all employees (accurate, backend aggregation)
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  try {
    // Get all employees
    const employees = await prisma.employee.findMany({});
    // Get all approved expenses for this month
    const now = new Date();
    const thisMonth = now.toISOString().slice(0, 7); // 'YYYY-MM'
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDayOfMonth = now.getDate();

    // Get all expenses for this month (approved or not)
    const expenses = await prisma.expense.findMany({
      where: {
        expenseDate: {
          gte: new Date(`${thisMonth}-01T00:00:00.000Z`),
          lt: new Date(`${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}-01T00:00:00.000Z`),
        },
        employeeId: { not: null },
      },
    });

    // Get all transactions for all employees for this month
    const transactions = await prisma.transaction.findMany({
      where: {
        type: 'EXPENSE',
        transactionDate: {
          gte: new Date(`${thisMonth}-01T00:00:00.000Z`),
          lt: new Date(`${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}-01T00:00:00.000Z`),
        },
        employeeId: { not: null },
      },
    });

    // Build summary per employee
    const summary = employees.map(emp => {
      // All approved expenses for this employee this month
      const empExpenses = expenses.filter(e => e.employeeId === emp.id);
      // All transactions for this employee this month
      const empTransactions = transactions.filter(t => t.employeeId === emp.id);
      // Combine all
      const allTrx = [
        ...empExpenses.map(e => ({ amount: Number(e.amount), date: e.expenseDate })),
        ...empTransactions.map(t => ({ amount: Math.abs(Number(t.amount)), date: t.transactionDate })),
      ];
      // Sum paid this month
      const paidThisMonth = allTrx.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
      // Days worked this month
      let daysWorkedThisMonth = 0;
      const startDate = new Date(emp.startDate);
      if (now.getMonth() === startDate.getMonth() && now.getFullYear() === startDate.getFullYear()) {
        daysWorkedThisMonth = now.getDate() - startDate.getDate() + 1;
      } else {
        daysWorkedThisMonth = now.getDate();
      }
      daysWorkedThisMonth = Math.max(0, daysWorkedThisMonth);
      const dailyRate = Number(emp.monthlySalary) / daysInMonth;
      const earnedThisMonth = dailyRate * daysWorkedThisMonth;
      const overpaidAmount = paidThisMonth - earnedThisMonth;
      const salaryRemaining = Number(emp.monthlySalary) - paidThisMonth;
      const daysPaid = Math.floor(paidThisMonth / dailyRate);
      return {
        employeeId: emp.id,
        paidThisMonth,
        salaryRemaining,
        earnedThisMonth,
        overpaidAmount,
        daysPaid,
        daysWorked: daysWorkedThisMonth,
      };
    });
    return NextResponse.json({ summary }, { status: 200 });
  } catch (error) {
    console.error('Error in salary-summary:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
