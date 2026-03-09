import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { startOfDay, subDays } from 'date-fns';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(req: Request) {
    console.log('AI CHAT REQUEST RECEIVED');
    console.log('GOOGLE_API_KEY DEFINED:', !!process.env.GOOGLE_API_KEY);
    console.log('GEMINI_API_KEY DEFINED:', !!process.env.GEMINI_API_KEY);

    if (!process.env.GOOGLE_API_KEY && !process.env.GEMINI_API_KEY && !process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
        console.error('MISSING BOTH KEY NAMES');
        return NextResponse.json({
            error: 'AI config error',
            details: 'No valid Google/Gemini API key found in platform environment.'
        }, { status: 500 });
    }

    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey!);

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { message, history = [] } = await req.json();
        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true, fullName: true }
        });

        if (!currentUser?.companyId) {
            return NextResponse.json({ error: 'No company context' }, { status: 400 });
        }

        const companyId = currentUser.companyId;

        // 1. Fetch Business Context for Gemini
        const today = new Date();
        const startOfPeriod = startOfDay(subDays(today, 30));

        const [
            salesData,
            inventoryData,
            debtorData,
            creditorData,
            expenseData,
            recentActivities
        ] = await Promise.all([
            // Sales KPI
            prisma.sale.aggregate({
                where: { companyId },
                _sum: { total: true },
                _count: { id: true }
            }),
            // Inventory KPI
            prisma.product.findMany({
                where: { companyId },
                select: { name: true, stock: true, status: true, sellingPrice: true },
                orderBy: { stock: 'asc' },
                take: 20
            }),
            // AR (Debtors)
            prisma.sale.findMany({
                where: { companyId, paymentStatus: { not: 'Paid' } },
                select: { total: true, paidAmount: true, customer: { select: { name: true } } }
            }),
            // AP (Creditors)
            prisma.purchaseOrder.findMany({
                where: { companyId, paymentStatus: { not: 'Paid' } },
                select: { total: true, paidAmount: true, vendor: { select: { name: true } } }
            }),
            // Expenses by Category
            prisma.expense.groupBy({
                by: ['category'],
                where: { companyId, createdAt: { gte: startOfPeriod } },
                _sum: { amount: true }
            }),
            // Recent meaningful logs
            prisma.sale.findMany({
                where: { companyId },
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { customer: true }
            })
        ]);

        // Summarize data for LLM
        const context = {
            businessName: "Revlo Managed Shop",
            ownerName: currentUser.fullName,
            kpis: {
                totalRevenue: salesData._sum.total || 0,
                orderCount: salesData._count.id,
                lowStockCount: inventoryData.filter(i => i.stock <= 10).length,
                totalReceivables: debtorData.reduce((acc, s) => acc + (s.total - (s.paidAmount || 0)), 0),
                totalPayables: creditorData.reduce((acc, p) => acc + (p.total - (p.paidAmount || 0)), 0),
            },
            inventoryHighlights: inventoryData.slice(0, 10),
            topExpenses: expenseData,
            recentSales: recentActivities.map(s => `${s.customer?.name || 'Walk-in'}: ETB ${s.total}`)
        };

        // 2. Initialize Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const systemPrompt = `
You are Revlo AI, an expert business consultant and financial analyst for a retail shop.
Your goal is to help the business owner, ${currentUser.fullName}, understand their data and make better decisions.

CONTEXT DATA:
${JSON.stringify(context, null, 2)}

GUIDELINES:
1. Be concise, professional, and data-driven.
2. Use the provided context to answer questions specifically about this business.
3. If asked for a forecast, use current sales trends (Revenue: ETB ${context.kpis.totalRevenue}).
4. If someone owes money, mention the "Receivables" total: ETB ${context.kpis.totalReceivables}.
5. Focus on increasing profit and decreasing expenses.
6. Provide actionable advice (e.g., "Replenish [Product] soon" or "Follow up with debtors").
7. Acknowledge the user's name if appropriate.
8. Language: Respond in the language used by the user (likely Somali or English).

Current Chat History:
${history.map((h: any) => `${h.role}: ${h.content}`).join('\n')}
`;

        const result = await model.generateContent([systemPrompt, message]);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ content: text });

    } catch (error) {
        console.error('AI Chat Error:', error);
        return NextResponse.json({ error: 'Failed to generate AI response' }, { status: 500 });
    }
}
