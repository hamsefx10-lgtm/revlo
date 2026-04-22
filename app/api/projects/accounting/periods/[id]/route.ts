import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';
import { USER_ROLES } from '@/lib/constants';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const sessionData = await getSessionCompanyUser();
    if (!sessionData) {
      return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 401 });
    }
    const { companyId, role, userId } = sessionData;

    // SECURE EXCLUSIVE ACCESS: Only the specific SUPER_ADMIN for company 6789dbe7-1d48-4775-a722-2f7fa8cbae38
    if (role !== USER_ROLES.SUPER_ADMIN || companyId !== '6789dbe7-1d48-4775-a722-2f7fa8cbae38') {
        return NextResponse.json({ message: 'Awood uma lihid inaad bil xirto ama furto.' }, { status: 403 });
    }

    const { isClosed } = await request.json();

    const existingPeriod = await prisma.financialPeriod.findUnique({
      where: { id: id },
    });

    if (!existingPeriod || existingPeriod.companyId !== companyId) {
      return NextResponse.json({ message: 'Bisha lama helin.' }, { status: 404 });
    }

    const updatedPeriod = await prisma.financialPeriod.update({
      where: { id: id },
      data: {
        isClosed: isClosed,
        closedAt: isClosed ? new Date() : null,
        closedById: isClosed ? userId : null,
      },
      include: {
        closedBy: { select: { fullName: true } }
      }
    });

    return NextResponse.json(
      { message: `Bisha xisaabaadka si guul leh ayaa loo ${isClosed ? 'xiray' : 'furay'}.`, period: updatedPeriod },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka bisha ${params.id} la cusboonaysiinayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const sessionData = await getSessionCompanyUser();
    if (!sessionData) {
      return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 401 });
    }
    const { companyId, role } = sessionData;

    // SECURE EXCLUSIVE ACCESS: Only the specific SUPER_ADMIN for company 6789dbe7-1d48-4775-a722-2f7fa8cbae38
    if (role !== USER_ROLES.SUPER_ADMIN || companyId !== '6789dbe7-1d48-4775-a722-2f7fa8cbae38') {
        return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 403 });
    }

    const existingPeriod = await prisma.financialPeriod.findUnique({
      where: { id: id },
    });

    if (!existingPeriod || existingPeriod.companyId !== companyId) {
      return NextResponse.json({ message: 'Bisha lama helin.' }, { status: 404 });
    }

    await prisma.financialPeriod.delete({
      where: { id: id },
    });

    return NextResponse.json(
      { message: 'Bisha si guul leh ayaa loo tirtiray!' },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka bisha ${params.id} la tirtirayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
