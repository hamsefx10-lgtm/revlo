// app/api/auth/register/route.ts - User Registration API Route
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs'; // For password hashing
import prisma from '@/lib/db'; // Import Prisma Client
import { isValidEmail } from '@/lib/utils'; // Import email validation utility
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants

import { z } from 'zod';
import { authRateLimiter, getClientIP } from '@/lib/rate-limiter';

const registerSchema = z.object({
  fullName: z.string().min(2, "Magacu waa inuu ka badnaadaa 2 xaraf"),
  email: z.string().email("Email-ku sax maaha"),
  password: z.string().min(6, "Password-ku waa inuu ugu yaraan 6 xaraf ka koobnaadaa"),
  companyName: z.string().min(2, "Magaca shirkaddu waa inuu ka badnaadaa 2 xaraf"),
  planType: z.enum(['PROJECTS_ONLY', 'FACTORIES_ONLY', 'SHOPS_ONLY', 'COMBINED']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 0. Rate Limiting Check
    const clientIP = getClientIP(request);
    const rateLimit = authRateLimiter.checkLimit(clientIP);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { message: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { fullName, email, password, companyName, planType } = result.data;

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

    // 6. Abuur Token-ka Xaqiijinta (Create Verification Token)
    const verificationToken = crypto.randomUUID();
    const expires = new Date(new Date().getTime() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires,
      },
    });

    // 7. Dir Email-ka Xaqiijinta (Send Verification Email) via Resend
    // try {
    //   const { Resend } = require('resend');
    //   const resend = new Resend(process.env.RESEND_API_KEY);
    //
    //   const confirmLink = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`;
    //
    //   await resend.emails.send({
    //     from: 'Revlo <onboarding@resend.dev>', // Isticmaal domain-kaaga marka aad live tahay
    //     to: email,
    //     subject: 'Xaqiiji Akoonkaaga Revlo',
    //     html: `
    //       <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
    //         <h2 style="color: #333;">Soo dhawayn, ${fullName}!</h2>
    //         <p>Fadlan guji linkiga hoose si aad u xaqiijiso email-kaaga oo aad u bilowdo isticmaalka Revlo.</p>
    //         <a href="${confirmLink}" style="display: inline-block; background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Xaqiiji Email-kaaga</a>
    //         <p style="color: #666; font-size: 14px;">Haddii aadan adigu samayn akoonkan, iska iloow email-kan.</p>
    //       </div>
    //     `,
    //   });
    //   console.log('Verification email sent to:', email);
    // } catch (emailError) {
    //   console.error('Failed to send verification email:', emailError);
    //   // Note: We don't block registration if email fails, but user needs to request resend later
    // }

    // 8. Jawaab Guul ah (Success Response)
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
