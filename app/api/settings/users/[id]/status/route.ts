import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// PUT /api/settings/users/[id]/status - Change user status
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { status } = await request.json();
    if (!status) {
      return NextResponse.json(
        { message: 'Status waa waajib.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { status },
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

    return NextResponse.json(
      { message: 'Status-ka user-ka waa la beddelay!', user: userProfile },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Cilad ayaa dhacday marka status-ka la beddelayay.' },
      { status: 500 }
    );
  }
}