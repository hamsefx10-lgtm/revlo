import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { visitorId, path, referrer, browser, os, device, timestamp } = payload;
    
    // We get IP ideally from headers (e.g. Vercel's x-forwarded-for or real-ip)
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    let companyId = (session?.user as any)?.companyId;
    
    // If no companyId from session, and path implies a company logic, we could infer it.
    // For now, if no session, we just use a default company or require the client to pass it.
    // Assuming this is a multi-tenant app but tracks mostly logged out visitors on public pages.
    // We will attempt to find a default company if none exists, or just use a fallback ID for global traffic.
    // For this context, standard practice in Revlo might be to have a primary tenant or skip company dependency for purely public visits, but our schema requires companyId.
    if (!companyId) {
       const firstCompany = await prisma.company.findFirst();
       if (!firstCompany) {
         return NextResponse.json({ success: false, message: 'No company setup yet' });
       }
       companyId = firstCompany.id;
    }

    // Upsert Visitor
    // We need to resolve GeoIP. In a real app we'd call an external service here if city/country is not cached for this IP.
    // Example: fetch(`https://ipapi.co/${ipAddress}/json/`) ...
    // For speed, let's keep it minimal and mock geo if not available on server headers.
    let country = req.headers.get('x-vercel-ip-country') || 'Unknown';
    let city = req.headers.get('x-vercel-ip-city') || 'Unknown';

    // In a development environment or non-vercel, let's just make it Unknown unless we use an API.
    // We can also fetch from ipapi.co if needed. (Skipped to prevent slow requests or abuse limits).

    const visitor = await prisma.visitor.upsert({
      where: {
        fingerprint_companyId: {
          fingerprint: visitorId,
          companyId: companyId
        }
      },
      update: {
        lastVisit: new Date(),
        ipAddress,
        country: country !== 'Unknown' ? country : undefined,
        city: city !== 'Unknown' ? city : undefined,
        browser,
        os,
        device
      },
      create: {
        fingerprint: visitorId,
        companyId,
        ipAddress,
        country,
        city,
        browser,
        os,
        device,
      }
    });

    // Record PageVisit
    await prisma.pageVisit.create({
      data: {
        companyId,
        visitorId: visitor.id,
        userId,
        path,
        referrer,
      }
    });

    // If User is logged in, update their last active stats
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          lastActiveAt: new Date(),
          lastLocation: country !== 'Unknown' ? `${city}, ${country}` : 'Unknown',
          lastDevice: device
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
