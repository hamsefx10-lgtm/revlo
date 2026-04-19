import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/shop/employees/payroll/history - Salary payment history
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { companyId: true } });
        if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 400 });

        const { searchParams } = new URL(req.url);
        const employeeId = searchParams.get('employeeId');

        const where: any = {
            companyId: user.companyId,
            category: 'SALARY',
        };
        if (employeeId) where.employeeId = employeeId;

        const history = await prisma.transaction.findMany({
            where,
            include: { employee: { select: { fullName: true, role: true } } },
            orderBy: { transactionDate: 'desc' },
            take: 100,
        });

        return NextResponse.json({ history });
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
