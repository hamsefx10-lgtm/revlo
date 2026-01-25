import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Adjust path if needed, e.g. @/app/lib/auth
import prisma from '@/lib/prisma'; // Adjust path if needed, usually @/lib/prisma

// Helper to convert decimal-like objects to number
const toSafeNumber = (value: any) => {
    if (value && typeof value === 'object' && typeof value.toNumber === 'function') {
        return value.toNumber();
    }
    return Number(value || 0);
};

// GET /api/shop/recycle-bin - List deleted items
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });
        if (!user?.companyId) return NextResponse.json({ error: 'Company not found' }, { status: 400 });

        const items = await prisma.deletedItem.findMany({
            where: { companyId: user.companyId },
            orderBy: { deletedAt: 'desc' },
            include: {
                user: { select: { fullName: true } } // who deleted it
            }
        });

        // Parse JSON data for frontend convenience (optional, or send raw)
        const parsedItems = items.map(item => ({
            ...item,
            data: typeof item.data === 'string' ? JSON.parse(item.data) : item.data
        }));

        return NextResponse.json({ items: parsedItems });
    } catch (error: any) {
        console.error('Error fetching recycled items:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/shop/recycle-bin - Restore item
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await req.json(); // DeletedItem ID
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const deletedItem = await prisma.deletedItem.findUnique({
            where: { id }
        });

        if (!deletedItem) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        if (deletedItem.modelName === 'Expense') {
            const expenseData = typeof deletedItem.data === 'string'
                ? JSON.parse(deletedItem.data)
                : deletedItem.data;

            // Prepare validation for restore
            const accountId = expenseData.accountId;
            // Need to re-resolve account if it doesn't exist? 
            // Ideally we check if account exists.
            let accountExists = false;
            if (accountId) {
                const acc = await prisma.account.findUnique({ where: { id: accountId } });
                accountExists = !!acc;
            }

            // Restore logic
            await prisma.$transaction(async (tx) => {
                // 1. Re-create Expense
                // Remove ID to let it generate new one? Or attempt to keep original ID?
                // Keeping original ID is risky if it was reused (unlikely for UUID).
                // Let's try to keep original ID so references might work, but Prisma 'create' with defined ID works.
                // However, safe bet is to use the data as is.
                // CLEANUP: remove properties that shouldn't be blindly inserted like createdAt, updatedAt related
                const {
                    id: oldId,
                    createdAt,
                    updatedAt,
                    project,
                    employee,
                    customer,
                    user,
                    expenseCategory,
                    company,
                    account,
                    transactions, // remove relations if they were included
                    ...cleanData
                } = expenseData;

                // Ensure dates are Dates
                if (cleanData.expenseDate) cleanData.expenseDate = new Date(cleanData.expenseDate);
                if (cleanData.paymentDate) cleanData.paymentDate = new Date(cleanData.paymentDate);
                if (cleanData.materialDate) cleanData.materialDate = new Date(cleanData.materialDate);

                // Make sure we have numbers
                if (cleanData.amount) cleanData.amount = toSafeNumber(cleanData.amount);
                if (cleanData.consultancyFee) cleanData.consultancyFee = toSafeNumber(cleanData.consultancyFee);
                // ... others

                const restoredExpense = await tx.expense.create({
                    data: {
                        ...cleanData,
                        id: oldId, // Restore with same ID
                        updatedAt: new Date() // Set new update time
                    }
                });

                // 2. Charge Account (Decrement Balance)
                if (accountId && cleanData.amount) {
                    // Check if we can charge (account might be deleted? if so, strict restore might fail or we skip account update)
                    // If account is deleted, accountId might violate FK if we provided it.
                    // Actually, if account was deleted, `tx.expense.create` would fail on FK constraint `accountId`.
                    // So we wrap in try/catch or assume it exists. If it fails, user can't restore without fixing dependencies.
                    // For now, assume it fails if account is gone, which is correct (data integrity).

                    await tx.account.update({
                        where: { id: accountId },
                        data: { balance: { decrement: cleanData.amount } }
                    });
                }

                // 3. Re-create Transaction
                // We shouldn't blindly trust old transaction ID logic, but we should create a new one to represent this "new" expense?
                // Or restore the old one?
                // The delete logic deleted "related transactions". 
                // We should re-create a transaction entry for the ledger.
                await tx.transaction.create({
                    data: {
                        description: `Restored Expense: ${cleanData.description}`,
                        amount: cleanData.amount,
                        type: 'EXPENSE',
                        accountId: accountId || undefined,
                        expenseId: restoredExpense.id,
                        companyId: deletedItem.companyId,
                        userId: session.user.id,
                        transactionDate: cleanData.expenseDate || new Date(),
                        category: cleanData.category,
                        employeeId: cleanData.employeeId || undefined
                    }
                });

                // 4. Delete from Recycle Bin
                await tx.deletedItem.delete({
                    where: { id: deletedItem.id }
                });
            });

            return NextResponse.json({ message: 'Restored successfully' });
        }

        return NextResponse.json({ error: 'Unsupported item type ' + deletedItem.modelName }, { status: 400 });

    } catch (error: any) {
        console.error('Error restoring item:', error);
        // Handle FK errors (e.g. Account not found)
        if (error.code === 'P2003') {
            return NextResponse.json({ error: 'Cannot restore: Related record (e.g. Account or Project) no longer exists.' }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
