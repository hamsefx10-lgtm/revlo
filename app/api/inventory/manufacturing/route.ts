import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { company: true }
    });

    if (!user?.company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Fetch manufacturing used records with related data
    const manufacturingUsed = await prisma.manufacturingUsed.findMany({
      where: {
        companyId: user.company.id
      },
      include: {
        productionOrder: {
          select: {
            orderNumber: true,
            productName: true,
            status: true
          }
        },
        project: {
          select: {
            name: true,
            status: true
          }
        }
      },
      orderBy: {
        usedDate: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      manufacturingUsed
    });

  } catch (error) {
    console.error('Error fetching manufacturing usage data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch manufacturing usage data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
