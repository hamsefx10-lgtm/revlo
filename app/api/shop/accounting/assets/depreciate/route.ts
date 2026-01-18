import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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

        const result = await prisma.$transaction(async (tx) => {
            // 1. Get Active Assets
            const assets = await tx.fixedAsset.findMany({
                where: {
                    companyId: user.companyId,
                    status: 'Active',
                    currentBookValue: { gt: 0 } // Only depreciate if value remains
                }
            });

            if (assets.length === 0) {
                return { count: 0, total: 0 };
            }

            let totalDepreciation = 0;

            for (const asset of assets) {
                // Rate is per year (e.g., 0.20 for 20%)
                // Monthly Depreciation = (Initial Value * Rate) / 12
                // Or user might want Book Value * Rate / 12 (Declining Balance). 
                // Let's assume Straight Line on Initial Value for simplicity, but we only have `value` (initial) in schema.

                const initialValue = Number(asset.value);
                const rate = asset.depreciationRate || 0;

                if (rate <= 0) continue;

                const monthlyAmount = (initialValue * rate) / 12;

                // Don't depreciate below 0
                const currentVal = Number(asset.currentBookValue);
                const actualAmount = Math.min(monthlyAmount, currentVal);

                if (actualAmount <= 0) continue;

                totalDepreciation += actualAmount;

                // Update Asset Value
                await tx.fixedAsset.update({
                    where: { id: asset.id },
                    data: {
                        currentBookValue: { decrement: actualAmount },
                        lastUpdated: new Date()
                    }
                });

                // Create Expense Entry
                await tx.transaction.create({
                    data: {
                        description: `Depreciation - ${asset.name}`,
                        amount: actualAmount,
                        type: 'EXPENSE',
                        category: 'Depreciation',
                        companyId: user.companyId,
                        userId: session.user.id,
                        transactionDate: new Date(),
                        fixedAssetId: asset.id
                    }
                });

                // Note: We are not crediting an "Accumulated Depreciation" account explicitly here because
                // our simplistic system creates an EXPENSE transaction which reduces Net Income (and thus Equity).
                // The Asset Value is reduced directly on the Asset Model.
                // In a full Double-Entry, we would Credit "Accumulated Depreciation" (Contra-Asset).
                // But reducing `currentBookValue` effectively reduces Total Assets on Balance Sheet.
            }

            return { count: assets.length, total: totalDepreciation };
        });

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        console.error('Error running depreciation:', error);
        return NextResponse.json({ error: error.message || 'Depreciation failed' }, { status: 500 });
    }
}
