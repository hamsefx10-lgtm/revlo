import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '../../admin/auth';
import prisma from '@/lib/db';

// GET /api/settings/assets-register - Get all assets with register details
export async function GET() {
  try {
    const companyId = await getSessionCompanyId();
    if (!companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const assets = await prisma.fixedAsset.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate depreciation and book values
  const assetsWithDepreciation = assets.map((asset: any) => {
      const depreciationRate = 0.15; // Default 15% annual depreciation
      const yearsSincePurchase = (new Date().getFullYear() - new Date(asset.purchaseDate).getFullYear());
      const depreciationAmount = asset.value * depreciationRate * yearsSincePurchase;
      const currentBookValue = Math.max(0, asset.value - depreciationAmount);

      return {
        ...asset,
        depreciationRate,
        currentBookValue,
      };
    });

    return NextResponse.json({ 
      assets: assetsWithDepreciation,
      message: 'Assets register retrieved successfully' 
    });
  } catch (error) {
    console.error('Error fetching assets register:', error);
    return NextResponse.json(
      { message: 'Failed to fetch assets register' },
      { status: 500 }
    );
  }
}

