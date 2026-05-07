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
            todaySalesData,
            inventoryData,
            debtorData,
            creditorData,
            expenseData,
            recentActivities,
            topCustomersData
        ] = await Promise.all([
            // Sales KPI (All Time)
            prisma.sale.aggregate({
                where: { companyId },
                _sum: { total: true },
                _count: { id: true }
            }),
            // Today's Sales
            prisma.sale.aggregate({
                where: { companyId, createdAt: { gte: startOfDay(today) } },
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
            }),
            // Top Customers by Grouping
            prisma.sale.groupBy({
                by: ['customerId'],
                where: { companyId, customerId: { not: null } },
                _sum: { total: true },
                orderBy: { _sum: { total: 'desc' } },
                take: 5
            })
        ]);

        // Fetch names for top customers
        const topCustomerIds = topCustomersData.map(t => t.customerId).filter(Boolean) as string[];
        const topCustomersDetails = topCustomerIds.length > 0 ? await prisma.shopClient.findMany({
            where: { id: { in: topCustomerIds } },
            select: { id: true, name: true }
        }) : [];

        const enrichedTopCustomers = topCustomersData.map(t => {
            const detail = topCustomersDetails.find(c => c.id === t.customerId);
            return {
                name: detail?.name || 'Walk-in',
                totalSpent: Number(t._sum.total || 0)
            };
        });

        // Summarize data for LLM
        const context = {
            businessName: "Revlo Managed Shop",
            ownerName: currentUser.fullName,
            kpis: {
                totalRevenueAllTime: Number(salesData._sum.total || 0),
                totalRevenueToday: Number(todaySalesData._sum.total || 0),
                ordersToday: todaySalesData._count.id || 0,
                lowStockCount: inventoryData.filter(i => i.stock <= 10).length,
                totalReceivables: debtorData.reduce((acc, s) => acc + (Number(s.total) - Number(s.paidAmount || 0)), 0),
                totalPayables: creditorData.reduce((acc, p) => acc + (Number(p.total) - Number(p.paidAmount || 0)), 0),
            },
            inventoryHighlights: inventoryData.slice(0, 10).map(i => `${i.name} (${i.stock} left)`),
            topExpenses: expenseData.map(e => `${e.category}: ETB ${e._sum.amount}`),
            recentSales: recentActivities.map(s => `${s.customer?.name || 'Walk-in'}: ETB ${s.total}`),
            topCustomers: enrichedTopCustomers.map(c => `${c.name} (Spent: ETB ${c.totalSpent})`),
            debtorsList: debtorData
                .filter(d => (Number(d.total) - Number(d.paidAmount || 0)) > 0)
                .map(d => `${d.customer?.name || 'Unknown'} owes ETB ${Number(d.total) - Number(d.paidAmount || 0)}`)
        };

        // 2. Initialize Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const systemPrompt = `
You are Revlo AI, an expert business consultant and financial analyst for a retail shop.
Your goal is to help the business owner, ${currentUser.fullName}, understand their data and make better decisions.

CONTEXT DATA:
${JSON.stringify(context, null, 2)}

GUIDELINES:
1. Be concise, professional, and data-driven.
2. Use the provided context to answer questions specifically about this business.
3. If asked about today's sales, use "totalRevenueToday" (ETB ${context.kpis.totalRevenueToday}).
4. If asked about debtors or people who owe money, list the names from "debtorsList".
5. If asked about the best/top customers, use the "topCustomers" list.
6. Provide actionable advice (e.g., "Replenish [Product] soon" or "Follow up with debtors").
7. Acknowledge the user's name if appropriate.
8. Language: Respond in the language used by the user (likely Somali or English).

Current Chat History:
${history.map((h: any) => `${h.role}: ${h.content}`).join('\n')}
`;

        const result = await model.generateContent([systemPrompt, message]).catch(async (err) => {
            console.log("Primary model failed, trying fallback...", err.message);
            // Fallback to gemini-1.5-flash if 503 or overload
            if (err.message?.includes('503') || err.message?.includes('demand')) {
                const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                return await fallbackModel.generateContent([systemPrompt, message]);
            }
            throw err;
        });

        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ content: text });

    } catch (error: any) {
        console.error('AI Chat Error:', error);
        
        let userMessage = 'Cillad ayaa ku timid AI-ga. Fadlan mar kale isku day.';
        if (error.message?.includes('503') || error.message?.includes('demand') || error.message?.includes('overloaded')) {
            userMessage = 'Server-yada AI-ga (Google Gemini) ayaa hadda aad mashquul u ah (High Demand). Fadlan waxyar sug oo mar kale isku day.';
        } else if (error.message?.includes('API_KEY')) {
            userMessage = 'Cillad xagga API Key-ga ah ayaa jirta. Fadlan hubi settings-kaaga.';
        }
        
        return NextResponse.json({ error: userMessage, details: error.message }, { status: 500 });
    }
}
