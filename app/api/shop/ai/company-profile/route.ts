import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

// GET: Retrieve Company AI Profile
// POST: Regenerate Company AI Profile
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const companyId = session.user.companyId;
        if (!companyId) return NextResponse.json({ error: 'Company ID missing' }, { status: 400 });

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { aiProfile: true, name: true }
        });

        return NextResponse.json({ profile: company?.aiProfile, companyName: company?.name });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const companyId = session.user.companyId;
        if (!companyId) return NextResponse.json({ error: 'Company ID missing' }, { status: 400 });

        // ── 1. Gather Comprehensive Company Data ──
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [
            company,
            totalProducts,
            totalCustomers,
            totalEmployees,
            totalVendors,
            monthlySales,
            weeklySales,
            lowStockProducts,
            topSellingProducts,
            monthlyExpenses,
            unpaidSales,
            recentPurchaseOrders
        ] = await Promise.all([
            prisma.company.findUnique({ where: { id: companyId }, select: { name: true, industry: true, createdAt: true } }),
            prisma.product.count({ where: { companyId } }),
            prisma.shopClient.count({ where: { companyId } }),
            prisma.employee.count({ where: { companyId } }),
            prisma.shopVendor.count({ where: { companyId } }),
            prisma.sale.findMany({ where: { companyId, createdAt: { gte: thirtyDaysAgo } }, select: { total: true, createdAt: true, paymentStatus: true } }),
            prisma.sale.findMany({ where: { companyId, createdAt: { gte: sevenDaysAgo } }, select: { total: true, createdAt: true } }),
            prisma.product.findMany({ where: { companyId, stock: { lte: 10 } }, select: { name: true, stock: true, sellingPrice: true }, take: 15 }),
            prisma.product.findMany({ where: { companyId }, orderBy: { stock: 'asc' }, take: 10, select: { name: true, sellingPrice: true, costPrice: true, stock: true } }),
            prisma.expense.findMany({ where: { companyId, createdAt: { gte: thirtyDaysAgo } }, select: { amount: true, category: true, description: true } }),
            prisma.sale.findMany({ where: { companyId, paymentStatus: { in: ['Partial', 'Unpaid'] } }, include: { customer: { select: { name: true } } } }),
            prisma.purchaseOrder.findMany({ where: { companyId, status: { in: ['Ordered', 'Pending'] } }, take: 5, select: { status: true, total: true } })
        ]);

        // ── 2. Compute Analytics ──
        const monthlyRevenue = monthlySales.reduce((s, r) => s + r.total, 0);
        const monthlyProfit = monthlyRevenue * 0.25; // Estimate 25% profit since field is missing
        const weeklyRevenue = weeklySales.reduce((s, r) => s + r.total, 0);
        const totalExpenses = monthlyExpenses.reduce((s, e) => s + Number(e.amount), 0);
        const totalDebt = unpaidSales.reduce((s, r) => s + (r.total - r.paidAmount), 0);
        const avgDailySales = weeklyRevenue / 7;

        // Sales by day of week
        const dayMap: Record<number, number> = {};
        weeklySales.forEach(s => {
            const day = new Date(s.createdAt).getDay();
            dayMap[day] = (dayMap[day] || 0) + s.total;
        });
        const bestDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];
        const dayNames = ['Axad', 'Isniin', 'Talaado', 'Arbaco', 'Khamiis', 'Jimco', 'Sabti'];

        // Expense breakdown
        const expenseByCategory: Record<string, number> = {};
        monthlyExpenses.forEach(e => {
            expenseByCategory[e.category || 'Other'] = (expenseByCategory[e.category || 'Other'] || 0) + Number(e.amount);
        });

        const companyData = {
            name: company?.name,
            businessType: company?.industry,
            ageInDays: Math.floor((now.getTime() - (company?.createdAt?.getTime() || now.getTime())) / (1000 * 60 * 60 * 24)),
            totalProducts,
            totalCustomers,
            totalEmployees,
            totalVendors,
            monthlyRevenue,
            monthlyProfit,
            weeklyRevenue,
            avgDailySales: Math.round(avgDailySales),
            totalExpenses,
            profitMargin: monthlyRevenue > 0 ? Math.round((monthlyProfit / monthlyRevenue) * 100) : 0,
            totalOutstandingDebt: totalDebt,
            lowStockCount: lowStockProducts.length,
            lowStockItems: lowStockProducts.map(p => p.name),
            bestSalesDay: bestDay ? dayNames[Number(bestDay[0])] : 'N/A',
            expenseBreakdown: expenseByCategory,
            pendingOrders: recentPurchaseOrders.length,
            topDebtors: unpaidSales.slice(0, 5).map(s => ({
                name: s.customer?.name || 'Unknown',
                owed: s.total - s.paidAmount
            }))
        };

        // ── 3. Ask AI to Generate Company DNA Profile ──
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

        const prompt = `Waxaad tahay Revlo AI Business Strategist oo takhasus ku leh falanqaynta shirkadaha yar-yar. 

Xogta Shirkadda:
${JSON.stringify(companyData, null, 2)}

Fadlan soo saar "Company DNA Profile" oo qaab JSON ah oo ay ku jiraan:
{
  "businessHealth": "HEALTHY" | "WARNING" | "CRITICAL",
  "healthScore": 0-100,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "opportunities": ["..."],
  "threats": ["..."],
  "cashFlowStatus": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "growthTrend": "GROWING" | "STABLE" | "DECLINING",
  "recommendedActions": ["..."],
  "personalityType": "...",
  "summary": "Soo koobi ganacsigan 2-3 jumlad Af-Soomaali ah"
}

Luqadda ku jawaab Af-Soomaali qurux badan.
JSON kaliya soo celi, wax kale ha ku darin.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const profile = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

        if (!profile) {
            return NextResponse.json({ error: 'Failed to generate profile' }, { status: 500 });
        }

        // Add raw stats to profile
        const fullProfile = {
            ...profile,
            rawStats: companyData,
            generatedAt: new Date().toISOString()
        };

        // ── 4. Save to Database ──
        await prisma.company.update({
            where: { id: companyId },
            data: { aiProfile: fullProfile }
        });

        return NextResponse.json({ profile: fullProfile, message: 'Company DNA profile generated successfully' });
    } catch (error: any) {
        console.error('[Company Profile Error]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
