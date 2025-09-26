
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';

export async function GET(request: Request) {
	try {
		const sessionUser = await getSessionCompanyUser();
		if (!sessionUser || !sessionUser.companyId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		const { companyId } = sessionUser;
		// Fetch all expenses for the company
			const expenses = await prisma.expense.findMany({
				where: { companyId },
				orderBy: { expenseDate: 'desc' },
				include: {
					project: { select: { name: true } },
					user: { select: { fullName: true } },
					vendor: { select: { name: true } },
					expenseCategory: { select: { name: true } },
				},
			});

		// Aggregate totals
		const companyExpenses = await prisma.expense.aggregate({
			_sum: { amount: true },
			where: { companyId: companyId, projectId: null },
		});
		const projectExpenses = await prisma.expense.aggregate({
			_sum: { amount: true },
			where: { companyId: companyId, projectId: { not: null } },
		});
		const companyAmount = companyExpenses._sum?.amount ? Number(companyExpenses._sum.amount) : 0;
		const projectAmount = projectExpenses._sum?.amount ? Number(projectExpenses._sum.amount) : 0;

		// Map expenses to frontend format
			const mappedExpenses = expenses.map((exp: any) => ({
				id: exp.id,
				date: exp.expenseDate?.toISOString().slice(0, 10) || '',
				project: exp.project?.name || exp.projectId || 'Internal',
				category: exp.expenseCategory?.name || exp.category || '',
				description: exp.description || '',
				amount: typeof exp.amount === 'object' && 'toNumber' in exp.amount ? exp.amount.toNumber() : Number(exp.amount),
				paidFrom: exp.paidFrom || '',
				note: exp.note || '',
				approved: exp.approved || false,
				user: exp.user?.fullName || '',
				vendor: exp.vendor?.name || '',
			}));

		return NextResponse.json({
			expenses: mappedExpenses,
			companyExpenses: companyAmount,
			projectExpenses: projectAmount,
			totalExpenses: companyAmount + projectAmount,
		}, { status: 200 });
	} catch (error) {
		console.error('Expenses Report API error:', error);
		return NextResponse.json({ message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' }, { status: 500 });
	}
}
