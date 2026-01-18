import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - Fetch all vendors for the company
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user || !session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where: any = {
      companyId: session.user.companyId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
      ];
    }

    const vendors = await prisma.shopVendor.findMany({
      where,
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      vendors: vendors || []
    });

  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

// POST - Create new vendor
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user || !session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      name,
      type = 'Material',
      contactPerson,
      phone,
      phoneNumber,
      email,
      address,
      productsServices,
      notes
    } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 });
    }

    const vendor = await prisma.shopVendor.create({
      data: {
        name,
        type,
        contactPerson,
        phone,
        phoneNumber,
        email,
        address,
        productsServices,
        notes,
        companyId: session.user.companyId,
        userId: session.user.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Vendor created successfully',
      vendor
    });

  } catch (error) {
    console.error('Error creating vendor:', error);
    return NextResponse.json(
      { error: 'Failed to create vendor' },
      { status: 500 }
    );
  }
}