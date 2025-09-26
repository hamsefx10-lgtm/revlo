import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET /api/settings/users - Get all users (optionally filter by companyId)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        companyId: true,
        company: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Cilad ayaa dhacday marka users-ka la soo gelinayay.' },
      { status: 500 }
    );
  }
}

// POST /api/settings/users - Add new user
export async function POST(request: Request) {
  try {
    const { fullName, email, password, role, status, companyId } = await request.json();

    if (!fullName || !email || !password || !role || !status || !companyId) {
      return NextResponse.json(
        { message: 'Fadlan buuxi dhammaan beeraha waajibka ah.' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { message: 'Email-kan hore ayaa loo isticmaalay.' },
        { status: 400 }
      );
    }

    // Hubi in company uu jiro
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return NextResponse.json(
        { message: 'Shirkadda lama helin.' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        role,
        status,
        company: { connect: { id: companyId } },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        companyId: true,
        company: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      { message: 'User cusub waa la abuuray!', user },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Cilad ayaa dhacday marka user-ka la abuurayay.' },
      { status: 500 }
    );
  }
}
