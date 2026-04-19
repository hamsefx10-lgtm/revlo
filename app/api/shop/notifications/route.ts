import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/shop/notifications - Get smart shop notifications
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { companyId: true } });
        if (!user?.companyId) return NextResponse.json({ notifications: [] });

        const companyId = user.companyId;
        const notifications: any[] = [];
        const now = new Date();

        // ── 1. LOW STOCK ALERTS ──────────────────────────────────
        const lowStockProducts = await prisma.product.findMany({
            where: {
                companyId,
                status: { in: ['Low Stock', 'Out of Stock'] }
            },
            select: { id: true, name: true, stock: true, minStock: true, status: true },
            take: 10,
        });

        for (const p of lowStockProducts) {
            notifications.push({
                id: `low-stock-${p.id}`,
                type: 'LOW_STOCK',
                severity: p.stock <= 0 ? 'critical' : 'warning',
                title: p.stock <= 0 ? 'Alaab Dhammay' : 'Kayd Hooseeya',
                message: `${p.name} — ${p.stock <= 0 ? 'Kaydku dhammaay' : `${p.stock} keliya baqay (min: ${p.minStock})`}`,
                icon: '📦',
                link: '/shop/inventory',
                createdAt: now.toISOString(),
                read: false,
            });
        }

        // ── 2. OVERDUE INVOICES (customers with unpaid sales) ─────
        const unpaidSalesList = await prisma.sale.findMany({
            where: { companyId, paymentStatus: 'Unpaid', customerId: { not: null } },
            select: { customerId: true, total: true, customer: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        // Aggregate per customer
        const debtByCustomer: Record<string, { name: string; total: number; count: number }> = {};
        for (const s of unpaidSalesList) {
            if (!s.customerId) continue;
            if (!debtByCustomer[s.customerId]) {
                debtByCustomer[s.customerId] = { name: s.customer?.name || 'Macmiil', total: 0, count: 0 };
            }
            debtByCustomer[s.customerId].total += Number(s.total);
            debtByCustomer[s.customerId].count++;
        }

        for (const [custId, info] of Object.entries(debtByCustomer).slice(0, 5)) {
            notifications.push({
                id: `debt-${custId}`,
                type: 'OVERDUE_INVOICE',
                severity: 'warning',
                title: 'Lacag La Qaadanayo',
                message: `${info.name} waxay kugu leedahay ETB ${info.total.toLocaleString()} (${info.count} invoice)`,
                icon: '💰',
                link: '/shop/customers',
                createdAt: now.toISOString(),
                read: false,
            });
        }

        // ── 3. PENDING PURCHASE ORDERS ────────────────────────────
        const pendingPOs = await prisma.purchaseOrder.count({
            where: { companyId, status: { in: ['Ordered', 'Pending'] } }
        });

        if (pendingPOs > 0) {
            notifications.push({
                id: 'pending-orders',
                type: 'PURCHASE_ORDER',
                severity: 'info',
                title: 'Dalabyo Sugaya',
                message: `${pendingPOs} dalabyo wali lama helin — raadi xidhiidhka`,
                icon: '🚚',
                link: '/shop/purchases',
                createdAt: now.toISOString(),
                read: false,
            });
        }

        // ── 4. SALARY DUE ─────────────────────────────────────────
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const activeEmployees = await prisma.employee.findMany({
            where: { companyId, isActive: true, monthlySalary: { gt: 0 } },
            select: { id: true, fullName: true, monthlySalary: true, lastPaymentDate: true },
        });

        const salaryPaidThisMonth = await prisma.transaction.findMany({
            where: {
                companyId,
                category: 'SALARY',
                transactionDate: { gte: startOfMonth },
            },
            select: { employeeId: true },
        });
        const paidEmployeeIds = new Set(salaryPaidThisMonth.map(t => t.employeeId));

        const unpaidEmployees = activeEmployees.filter(e => !paidEmployeeIds.has(e.id));
        if (unpaidEmployees.length > 0) {
            notifications.push({
                id: 'salary-due',
                type: 'SALARY_DUE',
                severity: now.getDate() >= 25 ? 'critical' : 'warning',
                title: 'Mushaharka La Bixin',
                message: `${unpaidEmployees.length} shaqaale mushaharka ${new Date().toLocaleDateString('so-SO', { month: 'long' })} ah wali lama bixin`,
                icon: '👥',
                link: '/shop/payroll',
                createdAt: now.toISOString(),
                read: false,
            });
        }

        // ── 5. TODAY'S SALES SUMMARY (after 6pm) ─────────────────
        if (now.getHours() >= 18) {
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const todaySales = await prisma.sale.aggregate({
                where: { companyId, createdAt: { gte: todayStart } },
                _sum: { total: true },
                _count: { id: true },
            });

            if ((todaySales._count.id || 0) > 0) {
                notifications.push({
                    id: 'daily-summary',
                    type: 'DAILY_SUMMARY',
                    severity: 'success',
                    title: 'Kooban Maanta',
                    message: `${todaySales._count.id} iib | ETB ${Number(todaySales._sum.total || 0).toLocaleString()} dakhli`,
                    icon: '📊',
                    link: '/shop/sales',
                    createdAt: now.toISOString(),
                    read: false,
                });
            }
        }

        // Sort: critical first, then warning, then info
        const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2, success: 3 };
        notifications.sort((a, b) => (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99));

        return NextResponse.json({ notifications, count: notifications.length });
    } catch (error) {
        console.error('Notifications error:', error);
        return NextResponse.json({ notifications: [], count: 0 });
    }
}
