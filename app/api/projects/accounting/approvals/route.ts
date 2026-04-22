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
        return NextResponse.json({ message: 'Awood uma lihid inaad aragto codsiyada.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';

    const approvals = await prisma.approvalRequest.findMany({
      where: { 
        companyId,
        status: status === 'ALL' ? undefined : status
      },
      orderBy: { createdAt: 'desc' },
      include: {
        requestedBy: { select: { fullName: true } },
        approvedBy: { select: { fullName: true } }
      }
    });

    return NextResponse.json({ approvals }, { status: 200 });
  } catch (error) {
    console.error('Cilad ayaa dhacday marka codsiyada la soo gelinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
