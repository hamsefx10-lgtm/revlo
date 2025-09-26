// app/api/settings/profile/route.ts - User Profile Settings API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { isValidEmail } from '@/lib/utils'; // For email validation
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants

// GET /api/settings/profile - Soo deji profile-ka user-ka hadda soo galay
export async function GET(request: Request) {
  try {
    // Mustaqbalka, halkan waxaad ku dari doontaa authentication si aad u hesho user-ka hadda soo galay
    // Tusaale: const session = await getServerSession(authOptions);
    // if (!session || !session.user?.id) return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 401 });
    // const userId = session.user.id;

    // Hadda, waxaan ku malaynaynaa user ID dummy ah
    const userId = "dummyUserId"; // Mustaqbalka, ka hel session-ka

    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: { // Kaliya soo deji beeraha loo baahan yahay
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        TwoFAEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!userProfile) {
      return NextResponse.json({ message: 'Profile-ka user-ka lama helin.' }, { status: 404 });
    }

    return NextResponse.json({ profile: userProfile }, { status: 200 });
  } catch (error) {
    console.error('Cilad ayaa dhacday marka profile-ka user-ka la soo gelinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// PUT /api/settings/profile - Cusboonaysii profile-ka user-ka hadda soo galay
export async function PUT(request: Request) {
  try {
    // Mustaqbalka, halkan waxaad ku dari doontaa authentication si aad u hesho user-ka hadda soo galay
    // Tusaale: const session = await getServerSession(authOptions);
    // if (!session || !session.user?.id) return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 401 });
    // const userId = session.user.id;

    // Hadda, waxaan ku malaynaynaa user ID dummy ah
    const userId = "dummyUserId"; // Mustaqbalka, ka hel session-ka

    const { 
      fullName, email, phone // Password change will be a separate API
    } = await request.json();

    // 1. Xaqiijinta Input-ka
    if (!fullName) {
      return NextResponse.json(
        { message: 'Magaca buuxa waa waajib.' },
        { status: 400 }
      );
    }
    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { message: 'Fadlan geli email sax ah.' },
        { status: 400 }
      );
    }

    // Hubi in user-ku jiro
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ message: 'User-ka lama helin.' }, { status: 404 });
    }

    // Hubi in email-ka uusan horey u diiwaan gashanayn user kale
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        return NextResponse.json(
          { message: 'Email-kan horey ayuu u diiwaan gashan yahay user kale.' },
          { status: 409 } // Conflict
        );
      }
    }

    const updatedProfile = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName,
        email: email || existingUser.email, // Ha beddelin email-ka haddii uusan la bixin
        phone: phone || null,
        updatedAt: new Date(),
      },
      select: { // Kaliya soo deji beeraha loo baahan yahay
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        TwoFAEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      { message: 'Profile-ka si guul leh ayaa loo cusboonaysiiyay!', profile: updatedProfile },
      { status: 200 } // OK
    );
  } catch (error) {
    console.error('Cilad ayaa dhacday marka profile-ka user-ka la cusboonaysiinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
