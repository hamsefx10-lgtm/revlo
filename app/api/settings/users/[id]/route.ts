import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET single user (for profile and edit forms)
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        company: { select: { id: true, name: true } },
        projects: { select: { id: true } },
        expenses: { select: { id: true } },
      },
    });
    if (!user) {
      return NextResponse.json({ message: 'User lama helin.' }, { status: 404 });
    }
    const projectsCount = user.projects?.length ?? 0;
    const expensesCount = user.expenses?.length ?? 0;
    const userProfile = {
      id: user.id,
      name: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      companyName: user.company?.name ?? '',
      projectsCount,
      expensesCount,
      avatarChar: user.fullName ? user.fullName[0] : '',
    };
    return NextResponse.json({ user: userProfile }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Cilad ayaa dhacday marka user-ka la helayay.' },
      { status: 500 }
    );
  }
}

// PUT /api/settings/users/[id] - Update user
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { fullName, email, password, role, status } = await request.json();

    if (!fullName || !email || !role || !status) {
      return NextResponse.json(
        { message: 'Fadlan buuxi dhammaan beeraha waajibka ah.' },
        { status: 400 }
      );
    }

    // Check if email is being changed to one that already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== params.id) {
      return NextResponse.json(
        { message: 'Email-kan hore ayaa loo isticmaalay.' },
        { status: 400 }
      );
    }

    let updateData: any = {
      fullName,
      email,
      role,
      status,
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      { message: 'User-ka waa la cusboonaysiiyay!', user },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Cilad ayaa dhacday marka user-ka la cusboonaysiinayay.' },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/users/[id] - Delete user
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.user.delete({
      where: { id: params.id },
    });
    return NextResponse.json(
      { message: 'User-ka waa la tirtiray!' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Cilad ayaa dhacday marka user-ka la tirtirayay.' },
      { status: 500 }
    );
  }
}