import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';
import { getSessionCompanyUser } from '@/lib/auth';

// GET /api/accounting/accounts - Soo deji dhammaan accounts-ka shirkadda user-ka
export async function GET(request: Request) {
  try {
    const sessionData = await getSessionCompanyUser();
    if (!sessionData) {
      return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 401 });
    }
    const { companyId } = sessionData;
    const accounts = await prisma.account.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });

    // Convert Decimal fields to Number for frontend display
    const processedAccounts = accounts.map((acc: any) => ({
      ...acc,
      balance: acc.balance instanceof Decimal ? acc.balance.toNumber() : acc.balance,
    }));

    return NextResponse.json({ accounts: processedAccounts }, { status: 200 });
  } catch (error) {
    console.error('Cilad ayaa dhacday marka accounts-ka la soo gelinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// POST /api/accounting/accounts - Ku dar account cusub shirkadda user-ka
export async function POST(request: Request) {
  // ...existing code...
  try {
    const sessionData = await getSessionCompanyUser();
    if (!sessionData) {
      return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 401 });
    }
    const { companyId } = sessionData;
    const body = await request.json();
    const { name, type, balance, currency } = body;

    // Get companyId from session (dynamic)
  // REMOVED: session logic and duplicate companyId declaration

    // 1. Xaqiijinta Input-ka
    if (!name || !type || !currency) {
      return NextResponse.json(
        { message: 'Fadlan buuxi dhammaan beeraha waajibka ah: Magaca, Nooca, Currency.' },
        { status: 400 }
      );
    }
    // Haddii balance la keenay, waa inuu sax noqdaa
    if (balance !== undefined && balance !== null) {
      if (typeof balance !== 'number' || isNaN(balance)) {
        return NextResponse.json(
          { message: 'Balance-ka waa inuu noqdaa nambar sax ah.' },
          { status: 400 }
        );
      }
      if (balance < 0) {
        return NextResponse.json(
          { message: 'Balance-ka bilowga ah ma noqon karo mid taban.' },
          { status: 400 }
        );
      }
    }

    // Hubi haddii account-kan horey u jiray (magac + shirkad)
    const existingAccount = await prisma.account.findUnique({
      where: { name_companyId: { name, companyId } },
    });

    if (existingAccount) {
      return NextResponse.json(
        { message: 'Account-kan horey ayuu u jiray.' },
        { status: 409 }
      );
    }

    // Abuur account cusub
    const newAccount = await prisma.account.create({
      data: {
        name,
        type,
        balance: (balance !== undefined && balance !== null && typeof balance === 'number' && !isNaN(balance)) ? balance : 0,
        currency,
        companyId,
      },
    });

    return NextResponse.json(
      { message: 'Account-ka si guul leh ayaa loo daray!', account: newAccount },
      { status: 201 }
    );
  } catch (error) {
    console.error('Cilad ayaa dhacday marka account-ka la darayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}