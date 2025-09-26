// app/api/auth/password-reset/route.ts - User Password Reset API Route
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { isValidEmail } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const { email, newPassword, confirmNewPassword } = await request.json();

    // 1. Xaqiijinta Input-ka (Input Validation)
    if (!email || !newPassword || !confirmNewPassword) {
      return NextResponse.json(
        { message: 'Fadlan buuxi dhammaan beeraha waajibka ah.' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { message: 'Fadlan geli email sax ah.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: 'Password-ka cusub waa inuu ugu yaraan 6 xaraf ka koobnaadaa.' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmNewPassword) {
      return NextResponse.json(
        { message: 'Password-ka cusub iyo xaqiijinta password-ka isku mid maaha.' },
        { status: 400 }
      );
    }

    // 2. Raadi User-ka (Find User)
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Amniga awgiis, ha sheegin haddii email-ka uusan jirin.
      // Kaliya sheeg in habka dib u dejinta la bilaabay (haddii ay jirto).
      return NextResponse.json(
        { message: 'Haddii email-kaagu uu ku jiro nidaamkeena, waxaad heli doontaa email dib u dejinta password-ka.' },
        { status: 200 } // OK, to avoid user enumeration
      );
    }

    // 3. Siraynta Password-ka Cusub (Hash New Password)
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Cusboonaysii Password-ka User-ka (Update User's Password)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // 5. Jawaab Guul ah (Success Response)
    return NextResponse.json(
      { message: 'Password-kaaga si guul leh ayaa dib loogu dejiyay!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cilad ayaa dhacday marka password-ka dib loo dejinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
