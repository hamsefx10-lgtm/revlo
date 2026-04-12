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
    // ... [Original code removed for brevity or kept commented] ...

    // 8. 🛡️ REGISTRATION ALERT AGENT (NEW) 🛡️
    try {
       // A. Soo saarista Xogta Asoolkaca
       const userAgent = request.headers.get('user-agent') || 'Aalad aan La garan';
       const ip = clientIP || 'IP Lama Helin';

       // B. Hubinta in SuperAdmin-ku daaray Agent-ga (We use the first company as SuperAdmin storage)
       const superAdminCompany = await prisma.company.findFirst({
          orderBy: { createdAt: 'asc' }
       });
       
       if (superAdminCompany) {
          const settings = await prisma.personalizationSettings.findUnique({
             where: { companyId: superAdminCompany.id }
          });
          const features: any = settings?.enabledFeatures || {};

          if (features.registerAlertsEnabled && features.registerAlertsEmail) {
             // C. Raadinta meesha uu joogo qofka (GeoLocation via ip-api)
             let locationStr = 'Wadanka Lama garaneyn';
             let isp = '';
             if (ip && ip !== '::1' && ip !== '127.0.0.1') {
                try {
                   // Create an AbortController for setting a timeout
                   const controller = new AbortController();
                   const timeoutId = setTimeout(() => controller.abort(), 3000);
                   
                   const geoRes = await fetch(`http://ip-api.com/json/${ip}`, { signal: controller.signal });
                   clearTimeout(timeoutId);
                   
                   const geoData = await geoRes.json();
                   if (geoData.status === 'success') {
                      locationStr = `${geoData.city}, ${geoData.country} ${geoData.countryCode}`;
                      isp = geoData.isp;
                   }
                } catch(e) { console.log('Location fetch failed'); }
             } else {
                locationStr = 'Localhost (Kumbiyuutarkaaga gudihiisa)';
             }

             // D. Habaynta Fariinta Email-ka ee Cusub
             const { sendEmail } = require('@/lib/email');
             
             const alertHtml = `
               <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                  <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center;">
                     <h2 style="margin: 0;">🚨 Alert: Qof Cusub Ayaa Is-Diiwaangeliyay!</h2>
                  </div>
                  <div style="padding: 24px; background-color: #fafafa;">
                     <p style="color: #444; font-size: 16px;">Mudane Super Admin,</p>
                     <p style="color: #666; line-height: 1.5;">Waxaa hadda system-ka iskusoo diiwaangeliyay qof cusub. Fadlan hoos ka eeg xogtiisa oo faah-faahsan si aad amni ahaan ugu hubiso.</p>
                     
                     <div style="background-color: white; border: 1px solid #ddd; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #1f2937; border-bottom: 1px solid #eee; padding-bottom: 8px;">Xogta Shakhsiga ah</h3>
                        <p><b>👤 Magaca:</b> ${fullName}</p>
                        <p><b>📧 Emailka:</b> ${email}</p>
                        <p><b>🏢 Shirkadda:</b> ${companyName}</p>
                        <p><b>📋 Nooca Plan-ka:</b> ${planType || 'COMBINED'}</p>
                     </div>

                     <div style="background-color: white; border: 1px solid #ddd; padding: 15px; border-radius: 6px;">
                        <h3 style="margin-top: 0; color: #1f2937; border-bottom: 1px solid #eee; padding-bottom: 8px;">Xogta Raad-Raaca (Tracking details)</h3>
                        <p><b>🌍 Meesha uu joogo:</b> ${locationStr}</p>
                        <p><b>📡 Xarigga Internetka (ISP):</b> ${isp || 'Lama Helin'}</p>
                        <p><b>🌐 Ciwaanka IP:</b> ${ip}</p>
                        <p><b>📱 Qalabka/Browserka:</b> ${userAgent}</p>
                     </div>

                     <p style="color: #888; font-size: 12px; margin-top: 24px; text-align: center;">
                        Haddii aadan aqoonsanayn qofkan, waxaad si degdeg ah uga xannibi kartaa qeybta Users ee Super Admin-ka.
                     </p>
                  </div>
               </div>
             `;

             // E. Dirista fariinta
             await sendEmail({
                to: features.registerAlertsEmail,
                subject: `🚨 Diiwaangelin Cusub: ${email}`,
                html: alertHtml
             });
             
             console.log('Registration Alert sent successfully to:', features.registerAlertsEmail);
          }
       }
    } catch (agentError) {
       console.error('Registration Agent Failed:', agentError);
       // We DON'T block the registration if the alert agent breaks!
    }

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
