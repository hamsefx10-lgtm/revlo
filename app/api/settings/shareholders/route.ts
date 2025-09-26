import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '../../admin/auth';
import prisma from '@/lib/db';

// GET /api/settings/shareholders - Get all shareholders
export async function GET() {
  try {
    const companyId = await getSessionCompanyId();
    if (!companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const shareholders = await prisma.shareholder.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ 
      shareholders,
      message: 'Shareholders retrieved successfully' 
    });
  } catch (error) {
    console.error('Error fetching shareholders:', error);
    return NextResponse.json(
      { message: 'Failed to fetch shareholders' },
      { status: 500 }
    );
  }
}

// POST /api/settings/shareholders - Create new shareholder
export async function POST(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    if (!companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, sharePercentage, joinedDate } = await request.json();

    if (!name || !email || !sharePercentage || !joinedDate) {
      return NextResponse.json(
        { message: 'Name, email, share percentage, and joined date are required' },
        { status: 400 }
      );
    }

    const shareholder = await prisma.shareholder.create({
      data: {
        name,
        email,
        sharePercentage: parseFloat(sharePercentage),
        joinedDate: new Date(joinedDate),
        profitSplit: 0, // Initial profit split
        companyId,
      },
    });

    return NextResponse.json({ 
      shareholder,
      message: 'Shareholder created successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating shareholder:', error);
    return NextResponse.json(
      { message: 'Failed to create shareholder' },
      { status: 500 }
    );
  }
}

