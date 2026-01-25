
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        // 1. Get all vendor IDs
        const vendors = await prisma.shopVendor.findMany({ select: { id: true } });
        const vendorIds = new Set(vendors.map(v => v.id));

        // 2. Find expenses with vendorId NOT in vendorIds
        const params = Array.from(vendorIds);
        // Since we can't easily do "NOT IN" with many IDs in prisma findMany depending on version/limits, 
        // and raw query is safer for "all invalid":

        // Actually, let's just fetch batches of expenses with vendorId != null
        // This might be heavy if many expenses. 
        // Better approach: Update where vendorId NOT IN (...)

        // If no vendors exist, all vendorIds are invalid.

        let count = 0;

        if (vendorIds.size === 0) {
            const res = await prisma.expense.updateMany({
                where: { vendorId: { not: null } },
                data: { vendorId: null }
            });
            count = res.count;
        } else {
            // Find invalid ones first (safe way)
            const expensesWithVendor = await prisma.expense.findMany({
                where: { vendorId: { not: null } },
                select: { id: true, vendorId: true }
            });

            const invalidExpenseIds = expensesWithVendor
                .filter(e => e.vendorId && !vendorIds.has(e.vendorId))
                .map(e => e.id);

            if (invalidExpenseIds.length > 0) {
                const res = await prisma.expense.updateMany({
                    where: { id: { in: invalidExpenseIds } },
                    data: { vendorId: null }
                });
                count = res.count;
            }
        }

        return NextResponse.json({ success: true, cleanedCount: count });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
