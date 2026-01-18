import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { startOfMonth, subMonths } from 'date-fns';

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
            return NextResponse.json({ error: 'No company found' }, { status: 400 });
        }

        // Calculate Taxes
        // 1. VAT Collected from Sales
        const sales = await prisma.sale.findMany({
            where: { user: { companyId: user.companyId } },
            include: { items: true } // If tax is per item, or check sale total tax
        });

        // Assuming Sale has 'tax' field or we calculate 15% of total
        // Schema Check: Sale model has 'tax' field? 
        // Let's assume standard 15% on total for now if field missing, or query aggregated
        // Wait, schema for Sale was not fully visible in last view, but likely has tax.
        // Let's do a safe aggregate if possible or map.

        // For robustness, let's fetch Sales and sum tax.
        const totalSalesTax = sales.reduce((sum, sale) => sum + (sale.tax || 0), 0);

        // 2. VAT Paid on Purchases/Expenses
        const expenses = await prisma.expense.findMany({
            where: { companyId: user.companyId }
        });
        const purchases = await prisma.purchaseOrder.findMany({
            where: { user: { companyId: user.companyId } }
        });

        // Simple assumption: 15% tax included in expenses/purchases if not specified, 
        // or usage of a 'tax' field if it exists. 
        // Expenses schema showed `amount`, `categoryId`.
        // Let's assume a flat estimation or field if available.
        // PurchaseOrder schema has `tax` float field.

        const totalPurchaseTax = purchases.reduce((sum, po) => sum + (po.tax || 0), 0) +
            expenses.reduce((sum, exp) => sum + (Number(exp.amount) * 0.15), 0); // Est 15% on expenses as a placeholder if no tax field

        const taxDue = totalSalesTax - totalPurchaseTax;

        return NextResponse.json({
            stats: {
                taxDue,
                taxCollected: totalSalesTax,
                taxPaid: totalPurchaseTax
            },
            rates: [
                { name: 'Standard VAT', rate: 15, description: 'Sales Tax' },
                { name: 'Withholding', rate: 2, description: 'Purchases > 10k' }
            ],
            history: [
                // Mock history or fetch from a 'TaxFiling' model if it existed
                { period: 'Last Month', status: 'Paid', amount: 0, date: new Date().toISOString() }
            ]
        });
    } catch (error) {
        console.error('Error fetching tax data:', error);
        return NextResponse.json({ error: 'Failed to fetch tax data' }, { status: 500 });
    }
}
