// app/api/auth/register/route.ts - User Registration API Route
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs'; // For password hashing
import prisma from '@/lib/db'; // Import Prisma Client
import { isValidEmail } from '@/lib/utils'; // Import email validation utility
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants
// import { Role } from '@prisma/client'; // Waa la saaray, enum-ka Role waxaa laga isticmaalaa USER_ROLES

export async function POST(request: Request) {
  try {
    const { fullName, email, password, companyName, planType } = await request.json();

    // 1. Xaqiijinta Input-ka (Input Validation)
    if (!fullName || !email || !password || !companyName) {
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

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password-ku waa inuu ugu yaraan 6 xaraf ka koobnaadaa.' },
        { status: 400 }
      );
    }

    // 2. Hubi haddii user-ku horey u jiray (Check if user already exists)
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User-kan horey ayuu u diiwaan gashan yahay.' },
        { status: 409 } // Conflict
      );
    }

    // 3. Hubi ama Abuur Shirkad (Check or Create Company)
    let company = await prisma.company.findUnique({
      where: { name: companyName },
    });

    if (!company) {
      // Haddii shirkaddu aysan jirin, abuur mid cusub
      company = await prisma.company.create({
        data: {
          name: companyName,
          industry: 'General', // Default industry, can be updated later
          planType: planType || 'COMBINED', // PROJECTS_ONLY, FACTORIES_ONLY, or COMBINED
        },
      });
    }

    // 4. Siraynta Password-ka (Hash Password)
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

    // 5. Abuur User Cusub (Create New User)
    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword, // Include the hashed password
        role: 'ADMIN', // Cast to Role enum string
        companyId: company.id,
      },
    });

    // 6. Jawaab Guul ah (Success Response)
    return NextResponse.json(
      {
        message: 'User-ka si guul leh ayaa loo diiwaan geliyay!',
        user: {
          id: newUser.id,
          fullName: newUser.fullName,
          email: newUser.email,
          role: newUser.role,
          company: company.name,
        },
      },
      { status: 201 } // Created
    );
  } catch (error) {
    console.error('Cilad ayaa dhacday marka user-ka la diiwaan gelinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
