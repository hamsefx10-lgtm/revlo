import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/shop/employees/payroll - Get all employees with payroll info
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { companyId: true } });
        if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 400 });

        const employees = await prisma.employee.findMany({
            where: { companyId: user.companyId, isActive: true },
            orderBy: { fullName: 'asc' },
        });

        // Get salary payment transactions for each employee this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const salaryTransactions = await prisma.transaction.findMany({
            where: {
                companyId: user.companyId,
                category: 'SALARY',
                transactionDate: { gte: startOfMonth },
            },
        });

        // Map paid amounts per employee this month
        const paidThisMonth: Record<string, number> = {};
        for (const tx of salaryTransactions) {
            if (tx.employeeId) {
                paidThisMonth[tx.employeeId] = (paidThisMonth[tx.employeeId] || 0) + Number(tx.amount);
            }
        }

        // Get all-time salary payments per employee
        const allTimeTx = await prisma.transaction.groupBy({
            by: ['employeeId'],
            where: {
                companyId: user.companyId,
                category: 'SALARY',
                employeeId: { not: null },
            },
            _sum: { amount: true },
        });
        const allTimePaid: Record<string, number> = {};
        for (const row of allTimeTx) {
            if (row.employeeId) allTimePaid[row.employeeId] = Number(row._sum.amount || 0);
        }

        const payroll = employees.map(e => ({
            id: e.id,
            fullName: e.fullName,
            role: e.role,
            phone: e.phone,
            monthlySalary: Number(e.monthlySalary || 0),
            paidThisMonth: paidThisMonth[e.id] || 0,
            totalPaidAllTime: allTimePaid[e.id] || 0,
            lastPaymentDate: e.lastPaymentDate,
            balance: Number(e.monthlySalary || 0) - (paidThisMonth[e.id] || 0),
        }));

        return NextResponse.json({ payroll });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST /api/shop/employees/payroll - Pay an employee
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { employeeId, amount, accountId, note, month } = body;

        if (!employeeId || !amount || !accountId) {
            return NextResponse.json({ error: 'employeeId, amount and accountId are required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { companyId: true } });
        if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 400 });

        const employee = await prisma.employee.findFirst({ where: { id: employeeId, companyId: user.companyId } });
        if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });

        const account = await prisma.account.findFirst({ where: { id: accountId, companyId: user.companyId } });
        if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

        // ── Strict balance check (correct accounting practice) ──────────
        const accountBalance = Number(account.balance);
        if (accountBalance < amount) {
            return NextResponse.json({
                error: `Xisaabta "${account.name}" lacag ku filan kuma jirto. Balance-ka hadda: ETB ${accountBalance.toLocaleString()}. Lacag soo geli ama xisaab kale dooro.`,
                code: 'INSUFFICIENT_BALANCE',
                accountBalance,
                required: amount,
            }, { status: 400 });
        }

        const [tx] = await prisma.$transaction([
            // Create salary transaction
            prisma.transaction.create({
                data: {
                    description: `Mushaharka ${employee.fullName} — ${month || new Date().toLocaleDateString('so-SO', { month: 'long', year: 'numeric' })}`,
                    amount,
                    type: 'EXPENSE',
                    category: 'SALARY',
                    transactionDate: new Date(),
                    note: note || null,
                    accountId,
                    employeeId,
                    companyId: user.companyId,
                    userId: session.user.id,
                },
            }),
            // Deduct from account
            prisma.account.update({
                where: { id: accountId },
                data: { balance: { decrement: amount } },
            }),
            // Update employee last payment date
            prisma.employee.update({
                where: { id: employeeId },
                data: { lastPaymentDate: new Date() },
            }),
        ]);

        return NextResponse.json({ success: true, transaction: tx });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
