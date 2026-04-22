import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';
import { USER_ROLES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const sessionData = await getSessionCompanyUser();
    if (!sessionData) {
      return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 401 });
    }
    const { companyId, role } = sessionData;

    // SECURE EXCLUSIVE ACCESS: Only the specific SUPER_ADMIN for company 6789dbe7-1d48-4775-a722-2f7fa8cbae38
    if (role !== USER_ROLES.SUPER_ADMIN || companyId !== '6789dbe7-1d48-4775-a722-2f7fa8cbae38') {
        return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 403 });
    }

    const periods = await prisma.financialPeriod.findMany({
      where: { companyId },
      orderBy: { startDate: 'desc' },
      include: {
        closedBy: { select: { fullName: true } }
      }
    });

    return NextResponse.json({ periods }, { status: 200 });
  } catch (error) {
    console.error('Cilad ayaa dhacday marka bilaha la soo gelinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const sessionData = await getSessionCompanyUser();
    if (!sessionData) {
      return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 401 });
    }
    const { companyId, role, userId } = sessionData;

    // SECURE EXCLUSIVE ACCESS: Only the specific SUPER_ADMIN for company 6789dbe7-1d48-4775-a722-2f7fa8cbae38
    if (role !== USER_ROLES.SUPER_ADMIN || companyId !== '6789dbe7-1d48-4775-a722-2f7fa8cbae38') {
        return NextResponse.json({ message: 'Awood uma lihid inaad bil xirto.' }, { status: 403 });
    }

    const { name, startDate, endDate, isClosed } = await request.json();

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { message: 'Fadlan buuxi Magaca, Taariikhda Bilowga iyo Taariikhda Dhammaadka.' },
        { status: 400 }
      );
    }

    const newPeriod = await prisma.financialPeriod.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isClosed: isClosed || false,
        companyId,
        closedAt: isClosed ? new Date() : null,
        closedById: isClosed ? userId : null,
      },
      include: {
        closedBy: { select: { fullName: true } }
      }
    });

    return NextResponse.json(
      { message: 'Bisha xisaabaadka si guul leh ayaa loo diiwaangeliyay.', period: newPeriod },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Cilad ayaa dhacday marka bisha la abuurayay:', error);
    if (error.code === 'P2002') {
       return NextResponse.json({ message: 'Bil magacan leh horay ayaa loo diiwaangeliyay.' }, { status: 400 });
    }
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
