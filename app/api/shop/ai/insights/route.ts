import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { sendAiWhatsAppMessage } from '@/lib/whatsapp/send-ai-message';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const companyId = session.user.companyId;
        if (!companyId) return NextResponse.json({ error: 'Company ID missing' }, { status: 400 });

        // 1. Fetch Company Data + AI Profile for Deep Context
        const [company, sales, products, customers, expenses] = await Promise.all([
            prisma.company.findUnique({
                where: { id: companyId },
                select: { id: true, name: true, aiProfile: true }
            }),
            prisma.sale.findMany({ where: { companyId }, take: 30, orderBy: { createdAt: 'desc' } }),
            prisma.product.findMany({ where: { companyId, stock: { lte: 20 } }, take: 15 }),
            prisma.shopClient.findMany({ where: { companyId }, take: 15 }),
            prisma.expense.findMany({ where: { companyId }, take: 15, orderBy: { createdAt: 'desc' } })
        ]);

        // Get owner phone separately to avoid Prisma include issues
        const owner = await prisma.user.findFirst({
            where: { companyId },
            orderBy: { createdAt: 'asc' },
            select: { phone: true, fullName: true }
        });

        const aiProfile = company?.aiProfile as any;

        const statsContext = {
            companyName: company?.name,
            recentSalesCount: sales.length,
            totalRevenue: sales.reduce((s, r) => s + r.total, 0),
            totalProfit: sales.reduce((s, r) => s + (r.profit || 0), 0),
            unpaidSales: sales.filter(s => s.paymentStatus === 'Unpaid' || s.paymentStatus === 'Partial').length,
            totalDebt: sales.filter(s => s.paymentStatus !== 'Paid').reduce((s, r) => s + (r.total - r.paidAmount), 0),
            lowStockCount: products.length,
            lowStockItems: products.map(p => ({ name: p.name, stock: p.stock })),
            topExpenses: expenses.slice(0, 5).map(e => ({ desc: e.description, amount: e.amount, category: e.category })),
            customerCount: customers.length,
            // Deep learning context
            businessHealth: aiProfile?.businessHealth || 'UNKNOWN',
            healthScore: aiProfile?.healthScore || 0,
            growthTrend: aiProfile?.growthTrend || 'UNKNOWN',
            cashFlowStatus: aiProfile?.cashFlowStatus || 'UNKNOWN',
            strengths: aiProfile?.strengths || [],
            weaknesses: aiProfile?.weaknesses || [],
            previousSummary: aiProfile?.summary || ''
        };

        // 2. Ask Gemini for Proactive Insights (using deep profile)
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

        const prompt = `Waxaad tahay Revlo AI — COO-ka rasmiga ah ee shirkadda "${company?.name}". Shirkaddaan si qoto dheer ayaad u garanaysaa.

        Xogta Ganacsiga (Live):
        ${JSON.stringify(statsContext)}

        Fariimuhu waa inay noqdaan kuwo:
        - Ku salaysan xogta dhab ah ee sare
        - Ku haboon shirkaddan gaarka ah (isticmaal strongpoints iyo weaknesses-keeda)
        - Af-Soomaali qurux badan oo dhiirigelin leh
        - Faa'iido leh oo tallaabo leh (actionable)

        Soo saar 5 ilaa 7 fariimood JSON ah:
        [
          { "type": "WARNING" | "ADVICE" | "PROFIT" | "REMINDER" | "MILESTONE", "title": "...", "content": "...", "priority": "HIGH" | "MEDIUM" | "LOW", "actionUrl": "/shop/..." }
        ]

        Noocyada cusub:
        - MILESTONE: Hambalyo iyo guulaha shirkadda (sida "Hambalyo! 100 macaamiil ayaad gaadhay!")
        
        JSON kaliya soo celi.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        const insights = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

        // 3. Save to DB
        if (insights.length > 0) {
            await prisma.aiInsight.deleteMany({ where: { companyId } });
            await prisma.aiInsight.createMany({
                data: insights.map((ins: any) => ({
                    companyId,
                    type: ins.type,
                    title: ins.title,
                    content: ins.content,
                    priority: ins.priority || 'MEDIUM'
                }))
            });
        }

        // 4. AUTO-ALERT: Send HIGH priority insights to manager via WhatsApp
        const highPriorityInsights = insights.filter((i: any) => i.priority === 'HIGH');
        if (highPriorityInsights.length > 0 && owner?.phone) {
            const alertMsg = `🚨 *REVLO AI — DIGNINO MUHIIM AH*\n\n` +
                highPriorityInsights.map((i: any, idx: number) => 
                    `${idx + 1}. *${i.title}*\n   ${i.content}`
                ).join('\n\n') +
                `\n\n_Fadlan gal Dashboard-kaaga si aad tallaabo u qaadato._`;

            // Send async - don't block the response
            sendAiWhatsAppMessage(companyId, owner.phone, alertMsg).catch(err => {
                console.error('[AI Auto-Alert] Failed to send:', err);
            });
        }

        const dbInsights = await prisma.aiInsight.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        return NextResponse.json(dbInsights);
    } catch (error: any) {
        console.error('[AI Insights Error]:', error);
        // Return empty array instead of error so frontend doesn't break
        return NextResponse.json([]);
    }
}
