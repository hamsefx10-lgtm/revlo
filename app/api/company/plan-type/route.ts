// app/api/company/plan-type/route.ts - Get Company Plan Type
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.companyId) {
      return NextResponse.json({ planType: 'PROJECTS_ONLY' }, { status: 200 });
    }

    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { planType: true },
    });

    // COMBINED is removed — default to PROJECTS_ONLY
    const planType = company?.planType === 'PROJECTS_ONLY' || company?.planType === 'SHOPS_ONLY' || company?.planType === 'FACTORIES_ONLY'
      ? company.planType
      : 'PROJECTS_ONLY';

    return NextResponse.json({ planType });
  } catch (error) {
    return NextResponse.json({ planType: 'PROJECTS_ONLY' }, { status: 200 });
  }
}

