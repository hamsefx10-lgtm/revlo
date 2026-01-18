import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ expenses: [] });
        }

        const expenses = await prisma.expense.findMany({
            where: { companyId: user.companyId },
            orderBy: { expenseDate: 'desc' },
            take: 100
        });

        // Format for frontend
        const formattedExpenses = expenses.map(exp => ({
            id: exp.receiptUrl || exp.id.slice(0, 8), // Use receiptUrl as ID display if available, else standard ID
            description: exp.description,
            category: exp.category,
            date: new Date(exp.expenseDate).toISOString().split('T')[0],
            amount: Number(exp.amount),
            status: exp.paymentStatus || 'Paid' // Default to Paid if not set
        }));

        return NextResponse.json({ expenses: formattedExpenses });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'No company found' }, { status: 400 });
        }

        const body = await req.json();
        const { description, category, amount, date, status } = body;

        const expense = await prisma.expense.create({
            data: {
                companyId: user.companyId,
                description,
                category: category,
                amount: Number(amount),
                expenseDate: new Date(date),
                paidFrom: 'Petty Cash', // Default for now
                paymentStatus: status, // PAID or UNPAID
                userId: session.user.id
            }
        });

        return NextResponse.json({ success: true, expense });
    } catch (error) {
        console.error('Error creating expense:', error);
        return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
    }
}
