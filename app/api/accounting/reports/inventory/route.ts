// app/api/accounting/reports/inventory/route.ts - Inventory Report API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants
import { Decimal } from '@prisma/client/runtime/library'; // Import Decimal type

// GET /api/accounting/reports/inventory - Soo deji xogta warbixinta inventory-ga
export async function GET(request: Request) {
  try {
    // Mustaqbalka, halkan waxaad ku dari doontaa authentication iyo authorization
    // Tusaale: const session = await getServerSession(authOptions);
    // if (!session || !isManagerOrAdmin(session.user.role)) return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 403 });
    // const companyId = session.user.companyId;

    // Parameters for filters
    const { searchParams } = new URL(request.url);
    const categoryFilter = searchParams.get('category');
    const stockStatusFilter = searchParams.get('stockStatus'); // e.g., 'Low Stock', 'In Stock'

    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        category: categoryFilter || undefined,
        // companyId: companyId // Mustaqbalka, ku dar filter-kan
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Filter by stock status in memory (since minStock is not directly in where clause for calculated status)
    const filteredItems = inventoryItems.filter((item: any) => {
      if (stockStatusFilter === 'Low Stock') {
        return item.inStock <= item.minStock;
      }
      if (stockStatusFilter === 'In Stock') {
        return item.inStock > item.minStock;
      }
      return true; // All
    });

    // Calculate aggregated data for the report
    const totalItemsCount = filteredItems.length;
    const totalInStockQty = filteredItems.reduce((sum: number, item: any) => sum + item.inStock, 0);
    const lowStockItemsCount = filteredItems.filter((item: any) => item.inStock <= item.minStock).length;
    const totalValueAtCost = filteredItems.reduce((sum: number, item: any) => sum + (item.inStock * item.purchasePrice.toNumber()), 0);
    const totalPotentialSellingValue = filteredItems.reduce((sum: number, item: any) => sum + (item.inStock * item.sellingPrice.toNumber()), 0);

    // Chart Data: Category Distribution
    const categoryDistributionMap: { [key: string]: number } = {};
    filteredItems.forEach((item: any) => {
      categoryDistributionMap[item.category] = (categoryDistributionMap[item.category] || 0) + item.inStock;
    });
    const categoryDistributionData = Object.keys(categoryDistributionMap).map((key: string) => ({
      name: key,
      value: categoryDistributionMap[key],
    }));

    // Chart Data: Top Used Materials
    const topUsedMaterialsData = filteredItems.sort((a: any, b: any) => b.usedInProjects - a.usedInProjects).slice(0, 5).map((item: any) => ({
      name: item.name,
      value: item.usedInProjects,
    }));


    return NextResponse.json(
      {
        totalItemsCount: totalItemsCount,
        totalInStockQty: totalInStockQty,
        lowStockItemsCount: lowStockItemsCount,
        totalValueAtCost: totalValueAtCost,
        totalPotentialSellingValue: totalPotentialSellingValue,
        categoryDistribution: categoryDistributionData,
        topUsedMaterials: topUsedMaterialsData,
        items: filteredItems.map((item: any) => ({ // Return original items with converted Decimal to Number
            ...item,
            purchasePrice: item.purchasePrice.toNumber(),
            sellingPrice: item.sellingPrice.toNumber(),
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cilad ayaa dhacday marka warbixinta inventory-ga la soo gelinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
