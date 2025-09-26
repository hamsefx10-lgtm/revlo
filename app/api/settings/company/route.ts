// app/api/settings/company/route.ts - Company Profile Settings API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { isValidEmail } from '@/lib/utils'; // For email validation
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants
import { getSessionCompanyId } from './auth';

// GET /api/settings/company - Soo deji profile-ka shirkadda
export async function GET(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return NextResponse.json({ message: 'Macluumaadka shirkadda lama helin.' }, { status: 404 });
    }
    return NextResponse.json({ company }, { status: 200 });
  } catch (error) {
    console.error('Cilad ayaa dhacday marka profile-ka shirkadda la soo gelinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// PUT /api/settings/company - Cusboonaysii profile-ka shirkadda
export async function PUT(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return NextResponse.json({ message: 'Macluumaadka shirkadda lama helin.' }, { status: 404 });
    }
    const { 
      name, industry, email, phone, address, website, taxId, registrationDate, logoUrl
    } = await request.json();
    if (!name) {
      return NextResponse.json(
        { message: 'Magaca shirkadda waa waajib.' },
        { status: 400 }
      );
    }
    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { message: 'Fadlan geli email sax ah.' },
        { status: 400 }
      );
    }
    if (registrationDate && isNaN(new Date(registrationDate).getTime())) {
        return NextResponse.json(
            { message: 'Taariikhda diiwaangelinta waa inuu noqdaa taariikh sax ah.' },
            { status: 400 }
        );
    }
    if (name && name !== company.name) {
      const nameExists = await prisma.company.findUnique({ where: { name } });
      if (nameExists) {
        return NextResponse.json(
          { message: 'Magacan shirkadda horey ayuu u diiwaan gashan yahay shirkad kale.' },
          { status: 409 }
        );
      }
    }
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        name,
        industry: industry || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        website: website || null,
        taxId: taxId || null,
        registrationDate: registrationDate ? new Date(registrationDate) : null,
        logoUrl: logoUrl || null,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json(
      { message: 'Profile-ka shirkadda si guul leh ayaa loo cusboonaysiiyay!', company: updatedCompany },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cilad ayaa dhacday marka profile-ka shirkadda la cusboonaysiinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
