// app/api/employees/[id]/status/route.ts - Employee Status Management API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants

// PUT /api/employees/[id]/status - Cusboonaysii xaaladda shaqaale gaar ah
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { status } = await request.json(); // Expected status: "Active" or "Inactive"

    // Mustaqbalka, halkan waxaad ku dari doontaa authentication iyo authorization
    // Tusaale: const session = await getServerSession(authOptions);
    // if (!session || !isManagerOrAdmin(session.user.role)) return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 403 });
    // const companyId = session.user.companyId;

    // 1. Xaqiijinta Input-ka
    if (typeof status !== 'boolean') { // Xaaladda waa inay noqotaa boolean (isActive)
      return NextResponse.json(
        { message: 'Xaaladda cusub waa waajib oo waa inay noqotaa boolean (true/false).' },
        { status: 400 }
      );
    }

    // Hubi in shaqaaluhu jiro
    const existingEmployee = await prisma.employee.findUnique({
      where: { id: id },
      // and: { companyId: companyId } // Mustaqbalka, ku dar filter-kan
    });

    if (!existingEmployee) {
      return NextResponse.json({ message: 'Shaqaalaha lama helin.' }, { status: 404 });
    }

    // Cusboonaysii xaaladda shaqaalaha
    const updatedEmployee = await prisma.employee.update({
      where: { id: id },
      data: {
        isActive: status, // Cusboonaysii isActive field
        updatedAt: new Date(), // Cusboonaysii taariikhda
      },
    });

    return NextResponse.json(
      { message: `Shaqaalaha '${updatedEmployee.fullName}' xaaladdiisa si guul leh ayaa loo beddelay ${updatedEmployee.isActive ? 'Active' : 'Inactive'}!`, employee: updatedEmployee },
      { status: 200 } // OK
    );
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka xaaladda shaqaalaha ${params.id} la cusboonaysiinayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
