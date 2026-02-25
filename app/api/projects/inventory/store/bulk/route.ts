import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '../auth';

export async function POST(req: NextRequest) {
    try {
        const companyId = await getSessionCompanyId();

        const body = await req.json();
        const { products } = body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ error: 'No products provided' }, { status: 400 });
        }

        let successCount = 0;
        let failedCount = 0;
        const errors = [];

        for (const item of products) {
            try {
                // For Project/Store, we use name + companyId for uniqueness normally,
                // but if they provide SKU we can use that too.
                // Looking at InventoryItem model, name is common.

                const existing = await prisma.inventoryItem.findFirst({
                    where: {
                        name: item.name,
                        companyId: companyId
                    }
                });

                if (existing) {
                    await prisma.inventoryItem.update({
                        where: { id: existing.id },
                        data: {
                            inStock: existing.inStock + (item.stock || 0),
                            purchasePrice: item.costPrice || item.purchasePrice,
                            sellingPrice: item.sellingPrice,
                            category: item.category,
                            minStock: item.minStock || 5
                        }
                    });
                } else {
                    await prisma.inventoryItem.create({
                        data: {
                            name: item.name,
                            category: item.category || 'General',
                            unit: item.unit || 'pcs',
                            inStock: item.stock || 0,
                            minStock: item.minStock || 5,
                            purchasePrice: item.costPrice || item.purchasePrice || 0,
                            sellingPrice: item.sellingPrice || 0,
                            companyId: companyId,
                            usedInProjects: 0
                        }
                    });
                }
                successCount++;
            } catch (err: any) {
                console.error(`Failed to import ${item.name}:`, err);
                failedCount++;
                errors.push({ name: item.name, error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            successCount,
            failedCount,
            errors
        });

    } catch (error: any) {
        console.error('Project Bulk Import Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
