// app/api/accounting/accounts/[id]/route.ts - Single Accounting Account Management API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants
import { Decimal } from '@prisma/client/runtime/library'; // Import Decimal type

// GET /api/accounting/accounts/[id] - Soo deji account gaar ah
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { getServerSession } = await import('next-auth/next');
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).user?.companyId) {
      return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 401 });
    }
    const companyId = (session as any).user.companyId;

    const account = await prisma.account.findFirst({
      where: { id: id, companyId },
      include: {
        transactions: true,
      },
    });

    if (!account) {
      return NextResponse.json({ message: 'Account-ka lama helin.' }, { status: 404 });
    }

    const processedAccount = {
      ...account,
      balance: Number(account.balance),
    };

    return NextResponse.json({ account: processedAccount }, { status: 200 });
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka account-ka ${params.id} la soo gelinayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// PUT /api/accounting/accounts/[id] - Cusboonaysii account gaar ah
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { getServerSession } = await import('next-auth/next');
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).user?.companyId) {
      return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 401 });
    }
    const companyId = (session as any).user.companyId;
    const { name, type, balance, currency } = await request.json();

    if (!name || !type || typeof balance !== 'number' || typeof currency !== 'string') {
      return NextResponse.json(
        { message: 'Fadlan buuxi dhammaan beeraha waajibka ah: Magaca, Nooca, Balance, Currency.' },
        { status: 400 }
      );
    }
    if (balance < 0) {
      return NextResponse.json(
        { message: 'Balance-ka ma noqon karo mid taban.' },
        { status: 400 }
      );
    }

    // Only update if account belongs to this company
    const existingAccount = await prisma.account.findFirst({ where: { id, companyId } });
    if (!existingAccount) {
      return NextResponse.json({ message: 'Account-ka lama helin.' }, { status: 404 });
    }

    const updatedAccount = await prisma.account.update({
      where: { id },
      data: {
        name,
        type,
  balance: Number(balance),
        currency,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      { message: 'Account-ka si guul leh ayaa loo cusboonaysiiyay!', account: updatedAccount },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka account-ka ${params.id} la cusboonaysiinayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// DELETE /api/accounting/accounts/[id] - Tirtir account gaar ah
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { getServerSession } = await import('next-auth/next');
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).user?.companyId) {
      return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 401 });
    }
    const companyId = (session as any).user.companyId;

    // Hubi in account-ku jiro oo uu shirkaddan leeyahay
    const existingAccount = await prisma.account.findFirst({ where: { id, companyId } });
    if (!existingAccount) {
      return NextResponse.json({ message: 'Account-ka lama helin.' }, { status: 404 });
    }

    await prisma.account.delete({ where: { id } });

    return NextResponse.json(
      { message: 'Account-ka si guul leh ayaa loo tirtiray!' },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka account-ka ${params.id} la tirtirayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
