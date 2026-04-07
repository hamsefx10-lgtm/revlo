import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Find all expenses that are currently UNPAID (or null status) but have a 'paidFrom' account set.
        // This implies they were actually paid but recorded incorrectly.
        const expensesToFix = await prisma.expense.findMany({
            where: {
                OR: [
                    { paymentStatus: 'UNPAID' },
                    { paymentStatus: null }
                ],
                paidFrom: {
                    not: '', // Ensure paidFrom is not empty
                },
                // IMPORTANT: Exclude deleted items if you have soft delete, though usually deleted items are in a separate table.
            }
        });

        console.log(`Found ${expensesToFix.length} expenses to fix.`);

        let updatedCount = 0;

        // 2. Update all matching expenses in bulk
        const result = await prisma.expense.updateMany({
            where: {
                OR: [
                    { paymentStatus: 'UNPAID' },
                    { paymentStatus: null }
                ],
                paidFrom: {
                    not: '',
                },
            },
            data: {
                paymentStatus: 'PAID',
                // Note: Prisma updateMany doesn't support setting a field to the value of another field (like paymentDate = expenseDate).
                // However, we can set paymentDate to now or leave it null. For consistency, let's set it to now.


                paymentDate: new Date(),
            }
        });

        updatedCount = result.count;

        return NextResponse.json({
            success: true,
            message: `Successfully updated ${updatedCount} expenses to PAID status.`,
            scanned: expensesToFix.length,
        });

    } catch (error) {
        console.error('Error fixing expenses:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fix expenses' },
            { status: 500 }
        );
    }
}
