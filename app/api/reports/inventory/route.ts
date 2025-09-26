import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';

export async function GET(request: Request) {
	try {
		const { companyId } = await getSessionCompanyUser();
		const items = await prisma.inventoryItem.findMany({
			where: { companyId },
			orderBy: { name: 'asc' },
		});

		const mappedItems = items.map((item: any) => ({
			id: item.id,
			name: item.name,
			category: item.category,
			unit: item.unit,
			inStock: item.inStock,
			minStock: item.minStock,
			purchasePrice: typeof item.purchasePrice === 'object' && 'toNumber' in item.purchasePrice ? item.purchasePrice.toNumber() : Number(item.purchasePrice),
			sellingPrice: typeof item.sellingPrice === 'object' && 'toNumber' in item.sellingPrice ? item.sellingPrice.toNumber() : Number(item.sellingPrice),
			usedInProjects: item.usedInProjects,
			lastUpdated: item.lastUpdated?.toISOString().slice(0, 10) || '',
			createdAt: item.createdAt?.toISOString().slice(0, 10) || '',
		}));

		return NextResponse.json({
			inventory: mappedItems,
			totalItems: mappedItems.length,
			totalStock: mappedItems.reduce((sum: number, i: any) => sum + i.inStock, 0),
		}, { status: 200 });
	} catch (error) {
		console.error('Inventory Report API error:', error);
		return NextResponse.json({ message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' }, { status: 500 });
	}
}
