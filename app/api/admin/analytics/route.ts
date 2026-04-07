import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/admin/auth';


export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const companyId = await getSessionCompanyId();

    // Fetch basic stats
    const visitors = await prisma.visitor.findMany({
      where: { companyId },
    });
    
    const pageVisits = await prisma.pageVisit.findMany({
      where: { companyId },
      orderBy: { timestamp: 'desc' },
      take: 50,
      include: {
        visitor: true,
        user: { select: { fullName: true, email: true } }
      }
    });

    const activeUsers = await prisma.user.count({
      where: { companyId, status: 'Active' }
    });
    
    // Group Analytics Data


    const deviceStats = visitors.reduce((acc: Record<string, number>, v) => {
       const key = v.device || 'Unknown';
       acc[key] = (acc[key] || 0) + 1;
       return acc;
    }, {});

    const countryStats = visitors.reduce((acc: Record<string, number>, v) => {
       const key = v.country || 'Unknown';
       acc[key] = (acc[key] || 0) + 1;
       return acc;
    }, {});

    const osStats = visitors.reduce((acc: Record<string, number>, v) => {
       const key = v.os || 'Unknown';
       acc[key] = (acc[key] || 0) + 1;
       return acc;
    }, {});

    const browserStats = visitors.reduce((acc: Record<string, number>, v) => {
       const key = v.browser || 'Unknown';
       acc[key] = (acc[key] || 0) + 1;
       return acc;
    }, {});

    return NextResponse.json({ 
       success: true, 
       totalVisitors: visitors.length,
       totalPageVisits: await prisma.pageVisit.count({ where: { companyId } }),
       activeUsers,
       deviceStats,
       countryStats,
       osStats,
       browserStats,
       recentVisits: pageVisits 
    });

  } catch(error: any) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
