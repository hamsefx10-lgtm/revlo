import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - Fetch all accounts for the company
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user || !session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accounts = await prisma.account.findMany({
      where: {
        companyId: session.user.companyId,
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      accounts: accounts || []
    });

  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

// POST - Create new account
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user || !session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      name,
      type,
      balance = 0,
      currency = 'USD',
      description
    } = await request.json();

    if (!name || !type) {
      return NextResponse.json({ error: 'Account name and type are required' }, { status: 400 });
    }

    const account = await prisma.account.create({
      data: {
        name,
        type,
        balance: parseFloat(balance),
        currency,
        description,
        companyId: session.user.companyId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      account
    });

  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
