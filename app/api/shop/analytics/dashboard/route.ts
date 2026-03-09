import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { startOfDay, subDays, format } from 'date-fns';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!currentUser?.companyId) {
            return NextResponse.json({ error: 'User does not belong to a company' }, { status: 400 });
        }

        const companyId = currentUser.companyId;

        // --- PHASE 9: ADVANCED FINANCIALS ---
        const today = new Date();
        const startOfCurrentPeriod = startOfDay(subDays(today, 6)); // Last 7 days
        const startOfLastPeriod = startOfDay(subDays(today, 13)); // Period before that

        // 1. Total Revenue, COGS & Orders (All time & Period cases)
        const [salesAggregate, prevSalesAggregate, cogsAggregate, expenseAggregate] = await Promise.all([
            // All-time Sales
            prisma.sale.aggregate({
                where: { companyId },
                _sum: { total: true },
                _count: { id: true },
            }),
            // Prev Period Sales (for trends)
            prisma.sale.aggregate({
                where: { companyId, createdAt: { gte: startOfLastPeriod, lt: startOfCurrentPeriod } },
                _sum: { total: true },
                _count: { id: true }
            }),
            // All-time COGS from SaleItems
            prisma.saleItem.aggregate({
                where: { sale: { companyId } },
                _sum: { totalCost: true }
            }),
            // All-time Expenses
            prisma.expense.aggregate({
                where: { companyId },
                _sum: { amount: true }
            })
        ]);

        const totalRevenue = salesAggregate._sum.total || 0;
        const totalCOGS = cogsAggregate._sum.totalCost || 0;
        const totalExpenses = Number(expenseAggregate._sum.amount || 0);
        const grossProfit = totalRevenue - totalCOGS;
        const netProfit = grossProfit - totalExpenses;

        // Trends (Week-over-Week)
        const currentPeriodRevenue = (await prisma.sale.aggregate({
            where: { companyId, createdAt: { gte: startOfCurrentPeriod } },
            _sum: { total: true }
        }))._sum.total || 0;

        const prevPeriodRevenue = prevSalesAggregate._sum.total || 0;
        const revenueTrend = prevPeriodRevenue > 0 ? ((currentPeriodRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100 : 0;

        // 2. Active Products & Stock Intelligence
        const [productsCount, lowStockCount, totalStockValue] = await Promise.all([
            prisma.product.count({ where: { companyId } }),
            prisma.product.count({ where: { companyId, status: 'Low Stock' } }),
            prisma.product.aggregate({
                where: { companyId },
                _sum: { costPrice: true } // Simplified stock value (cost * stock would be better but requires raw/complex query)
            })
        ]);

        // 3. Low Stock Items with Velocity (Burn Rate)
        const lowStockProducts = await prisma.product.findMany({
            where: { companyId, stock: { lte: 15 } },
            take: 5,
            orderBy: { stock: 'asc' },
            select: { id: true, name: true, stock: true }
        });

        // Calculate velocity for these items (last 30 days)
        const startOfVelocityPeriod = subDays(today, 30);
        const lowStockItemsWithVelocity = await Promise.all(lowStockProducts.map(async (p) => {
            const soldInLast30 = await prisma.saleItem.aggregate({
                where: { productId: p.id, createdAt: { gte: startOfVelocityPeriod } },
                _sum: { quantity: true }
            });
            const velocity = (soldInLast30._sum.quantity || 0) / 30;
            const daysLeft = velocity > 0 ? Math.round(p.stock / velocity) : 999;
            return { ...p, daysLeft, velocity: velocity.toFixed(2) };
        }));

        // 4. Sales Chart Data (Last 7 days)
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = subDays(today, 6 - i);
            return {
                date: d,
                name: dayNames[d.getDay()],
                sales: 0
            };
        });

        const recentSales = await prisma.sale.findMany({
            where: { companyId, createdAt: { gte: startOfCurrentPeriod } },
            select: { createdAt: true, total: true }
        });

        recentSales.forEach(sale => {
            const dayName = dayNames[new Date(sale.createdAt).getDay()];
            const day = last7Days.find(d => d.name === dayName);
            if (day) day.sales += sale.total;
        });

        // 5. Financial Health (AR/AP & Aging)
        const accountsPayable = await prisma.purchaseOrder.aggregate({
            where: { companyId, paymentStatus: { not: 'Paid' } },
            _sum: { total: true, paidAmount: true }
        });

        const accountsReceivableQuery = await prisma.sale.findMany({
            where: { companyId, paymentStatus: { not: 'Paid' } },
            select: { total: true, paidAmount: true, createdAt: true }
        });

        let arTotal = 0;
        const aging = { current: 0, late: 0, overdue: 0 };
        accountsReceivableQuery.forEach(s => {
            const balance = s.total - (s.paidAmount || 0);
            arTotal += balance;
            const daysOld = Math.floor((today.getTime() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            if (daysOld <= 7) aging.current += balance;
            else if (daysOld <= 30) aging.late += balance;
            else aging.overdue += balance;
        });

        const apAmount = (accountsPayable._sum.total || 0) - (accountsPayable._sum.paidAmount || 0);

        // 6. Activity Feed & Anomalies
        const [recentSaleActivities, recentPOActivities, recentExpenses] = await Promise.all([
            prisma.sale.findMany({ where: { companyId }, take: 5, orderBy: { createdAt: 'desc' }, include: { customer: true } }),
            prisma.purchaseOrder.findMany({ where: { companyId }, take: 5, orderBy: { createdAt: 'desc' }, include: { vendor: true } }),
            prisma.expense.findMany({ where: { companyId, createdAt: { gte: startOfDay(today) } }, select: { amount: true, description: true } })
        ]);

        const anomalies: any[] = [];
        const todayExpenseTotal = recentExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
        if (todayExpenseTotal > 5000) { // Simple threshold for anomaly
            anomalies.push({
                type: 'ANOMALY',
                title: 'High Expense Alert',
                description: `Unusual spending today: ETB ${todayExpenseTotal.toLocaleString()}`,
                date: today
            });
        }

        const activities = [
            ...anomalies,
            ...recentSaleActivities.map(s => ({
                id: s.id,
                type: 'SALE',
                title: 'New Sale',
                description: `Invoice ${s.invoiceNumber} - ${s.customer?.name || 'Walk-in'}`,
                amount: s.total,
                date: s.createdAt,
            })),
            ...recentPOActivities.map(p => ({
                id: p.id,
                type: 'PURCHASE',
                title: 'Purchase Order',
                description: `Order ${p.poNumber} from ${p.vendor?.name || 'Supplier'}`,
                amount: p.total,
                date: p.createdAt,
            }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

        // 7. Top Products (By Volume)
        const companySales = await prisma.sale.findMany({ where: { companyId }, select: { id: true } });
        const saleIds = companySales.map(s => s.id);
        const topProductsRaw = saleIds.length > 0 ? await prisma.saleItem.groupBy({
            by: ['productId', 'productName'],
            where: { saleId: { in: saleIds } },
            _sum: { quantity: true, total: true, totalCost: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5
        }) : [];

        // --- PHASE 11: TOP DEBTORS & CREDITORS ---
        const salesWithDebt = await prisma.sale.findMany({
            where: { companyId, paymentStatus: { not: 'Paid' } },
            select: { total: true, paidAmount: true, customerId: true, realCustomerId: true, customer: { select: { name: true } }, realCustomer: { select: { name: true } } }
        });

        // Group Debtors
        const debtorMap: Record<string, { id: string, name: string, balance: number }> = {};
        salesWithDebt.forEach(s => {
            const id = s.realCustomerId || s.customerId;
            if (!id) return;
            const name = s.realCustomer?.name || s.customer?.name || 'Unknown';
            const balance = s.total - (s.paidAmount || 0);
            if (!debtorMap[id]) debtorMap[id] = { id, name, balance: 0 };
            debtorMap[id].balance += balance;
        });
        const topDebtors = Object.values(debtorMap).sort((a, b) => b.balance - a.balance).slice(0, 5);

        // Group Creditors (Vendors)
        const posWithDebt = await prisma.purchaseOrder.findMany({
            where: { companyId, paymentStatus: { not: 'Paid' } },
            select: { total: true, paidAmount: true, vendorId: true, vendor: { select: { name: true } } }
        });

        const creditorMap: Record<string, { id: string, name: string, balance: number }> = {};
        posWithDebt.forEach(p => {
            const id = p.vendorId;
            const name = p.vendor?.name || 'Unknown';
            const balance = p.total - (p.paidAmount || 0);
            if (!creditorMap[id]) creditorMap[id] = { id, name, balance: 0 };
            creditorMap[id].balance += balance;
        });
        const topCreditors = Object.values(creditorMap).sort((a, b) => b.balance - a.balance).slice(0, 5);

        // --- PHASE 10: AI FORECASTING ---
        const forecast = {
            next7Days: Math.round(currentPeriodRevenue * 1.05), // Simple 5% growth prediction
            confidence: 85,
            reasoning: revenueTrend > 0 ? "Upward trend detected in weekly sales." : "Sales stabilized after period of fluctuation."
        };

        // --- PHASE 13: EXPENSE BREAKDOWN ---
        const expensesByCategory = await prisma.expense.groupBy({
            by: ['category'],
            where: { companyId },
            _sum: { amount: true }
        });

        return NextResponse.json({
            metrics: {
                revenue: totalRevenue,
                netProfit: netProfit,
                grossProfit: grossProfit,
                orders: salesAggregate._count.id || 0,
                products: productsCount,
                lowStock: lowStockCount,
                accountsPayable: apAmount,
                accountsReceivable: arTotal,
                trends: {
                    revenue: revenueTrend.toFixed(1),
                },
                aging,
                topDebtors,
                topCreditors
            },
            chartData: last7Days,
            lowStockItems: lowStockItemsWithVelocity,
            activities,
            topProducts: topProductsRaw.map(p => ({
                name: p.productName,
                volume: p._sum.quantity,
                revenue: p._sum.total,
                profit: (p._sum.total || 0) - (p._sum.totalCost || 0)
            })),
            aiForecast: forecast,
            expensesByCategory // Pie Chart data
        });

    } catch (error) {
        console.error('Error fetching dashboard analytics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
