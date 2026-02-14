
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        // parallel fetching for speed
        const [userCount, transactionCount, dbCheck, logsCount] = await Promise.all([
            prisma.user.count(),
            prisma.transaction.count(),
            prisma.$queryRaw`SELECT 1`, // fast DB health check
            prisma.auditLog.count(), // assuming AuditLog model exists based on file view earlier
        ]);

        // Active Users Approx (since session tracking isn't in DB usually)
        // We'll use total users for now as "Registered Users"

        // API Calls Approx (using transaction volume + logs as proxy for system activity)
        const apiCallsProxy = transactionCount + logsCount;

        return NextResponse.json({
            systemStatus: 'Online',
            databaseStatus: dbCheck ? 'Healthy' : 'Error',
            activeUsers: userCount,
            apiCalls: apiCallsProxy,
            lastUpdated: new Date().toISOString(),
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=59',
            },
        });

    } catch (error: any) {
        console.error('Error fetching admin dashboard stats:', error);
        return NextResponse.json(
            {
                systemStatus: 'Degraded',
                databaseStatus: 'Error',
                activeUsers: 0,
                apiCalls: 0,
                error: error.message
            },
            { status: 500 }
        );
    }
}
