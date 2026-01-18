import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/shop/receivables
// Returns list of customers with outstanding debt
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ customers: [] });
        }

        // Fetch clients with UPPAID or PARTIAL sales
        const clientsWithDebt = await prisma.shopClient.findMany({
            where: {
                user: {
                    companyId: user.companyId
                },
                sales: {
                    some: {
                        // @ts-ignore
                        paymentStatus: { in: ['Unpaid', 'Partial'] }
                    }
                }
            },
            include: {
                sales: {
                    where: {
                        // @ts-ignore
                        paymentStatus: { in: ['Unpaid', 'Partial'] }
                    },
                    select: {
                        id: true,
                        invoiceNumber: true,
                        total: true,
                        // @ts-ignore
                        paidAmount: true,
                        createdAt: true,
                        // @ts-ignore
                        dueDate: true,
                        // @ts-ignore
                        paymentStatus: true
                    }
                }
            }
        }) as any[];

        // Calculate totals and format
        const receivables = clientsWithDebt.map(client => {
            const totalDebt = client.sales.reduce((sum: number, sale: any) => {
                const pending = sale.total - (sale.paidAmount || 0);
                return sum + pending;
            }, 0);

            return {
                id: client.id,
                name: client.name,
                phone: client.phone,
                totalDebt,
                invoiceCount: client.sales.length,
                pendingInvoices: client.sales
            };
        }).sort((a, b) => b.totalDebt - a.totalDebt); // Highest debt first

        return NextResponse.json({ receivables });

    } catch (error) {
        console.error('Error fetching receivables:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
