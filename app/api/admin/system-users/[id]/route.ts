import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// PUT: Update any user in the system (Super Admin Only)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { fullName, email, role, status, companyId, password } = await req.json();

    const updateData: any = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    if (companyId) updateData.companyId = companyId;
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json({ success: true, message: 'User updated successfully', user: updatedUser });

  } catch (error: any) {
    console.error('Update System User Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE: Hard delete any user
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if ((session?.user as any)?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    if (userId === params.id) {
       return NextResponse.json({ success: false, message: 'Halkan kama tirtiri kartid naftaada!' }, { status: 400 });
    }

    // Since Prisma relations might restrict deletion, ideally we just soft-delete or cascade
    // For now, we will attempt a standard delete. If it fails due to fkeys, it throws an error.
    await prisma.user.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true, message: 'User deleted successfully' });

  } catch (error: any) {
    console.error('Delete System User Error:', error);
    return NextResponse.json({ success: false, message: 'User-kani waxa uu ku xiran yahay xog kale (Transactions/Expenses). Fadlan doorbidaa inaad Inactive ka dhigto bedelkii aad tirtiri lahayd.' }, { status: 500 });
  }
}
