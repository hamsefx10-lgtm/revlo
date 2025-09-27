import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '../../admin/auth';
import prisma from '@/lib/db';

// GET /api/settings/assets - Get all fixed assets
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

    return NextResponse.json({ 
      assets,
      message: 'Assets retrieved successfully' 
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json(
      { message: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}

// POST /api/settings/assets - Create new fixed asset
export async function POST(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    if (!companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

  const { name, type, value, purchaseDate, assignedTo, depreciationRate, currentBookValue } = await request.json();

    if (!name || !type || !value || !purchaseDate) {
      return NextResponse.json(
        { message: 'Name, type, value, and purchase date are required' },
        { status: 400 }
      );
    }

    const asset = await prisma.fixedAsset.create({
      data: {
        name,
        type,
        value: parseFloat(value),
        purchaseDate: new Date(purchaseDate),
        assignedTo: assignedTo || 'Office',
        status: 'Active',
        companyId,
        depreciationRate: depreciationRate !== undefined ? parseFloat(depreciationRate) : 0,
        currentBookValue: currentBookValue !== undefined ? parseFloat(currentBookValue) : 0,
      },
    });

    return NextResponse.json({ 
      asset,
      message: 'Asset created successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json(
      { message: 'Failed to create asset' },
      { status: 500 }
    );
  }
}

