import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '@/app/api/admin/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const companyId = await getSessionCompanyId();
    
    // Fetch REAL security events (AuditLogs) from the database
    const realLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50, // Limiting to latest 50 for performance
      include: {
         user: {
            select: { email: true }
         }
      }
    });

    const transformedEvents = realLogs.map(log => {
       // Determine severity based on action keywords
       let severity = 'low';
       const actionLower = log.action.toLowerCase();
       if (actionLower.includes('delete') || actionLower.includes('drop') || actionLower.includes('remove')) severity = 'high';
       if (actionLower.includes('login_failed') || actionLower.includes('breach') || actionLower.includes('unauthorized')) severity = 'critical';
       if (actionLower.includes('export') || actionLower.includes('import')) severity = 'medium';

       return {
          id: log.id,
          type: log.action.replace(/\s+/g, '_').toLowerCase() || 'system_change',
          description: `${log.action} on ${log.entity} ${log.details ? ` - ${log.details}` : ''}`,
          userId: log.userId,
          userEmail: log.user?.email || 'N/A',
          ipAddress: log.ipAddress || 'Unknown IP',
          userAgent: log.userAgent || 'Unknown Device',
          timestamp: log.createdAt,
          severity: severity,
          status: 'resolved' // Real audit logs are usually just records, so marking resolved
       };
    });

    return NextResponse.json({ 
      success: true, 
      events: transformedEvents,
      timestamp: new Date()
    });

  } catch (error: any) {
    console.error('Error fetching real security events:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch security events', error: error.message },
      { status: 500 }
    );
  }
}
