'use client';

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
    Package,
    ShoppingBag,
    CreditCard,
    Box,
    Wallet,
    Coins,
    ArrowUpRight,
    Sparkles,
    BarChart3,
    Loader2,
    MessageSquare,
    Send,
    AlertCircle,
    CheckCircle2,
    Headphones,
    Bot,
    ArrowRight,
    HelpCircle,
    BrainCircuit
} from 'lucide-react';
import AiInsightsFeed from '@/components/shop/AiInsightsFeed';
import Link from 'next/link';
import { format } from 'date-fns';

import MetricCard from '@/components/shop/ui/MetricCard';
import { useShopLang } from '@/contexts/ShopLanguageContext';

export default function ShopDashboard() {
    const { t } = useShopLang();
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
    const [isTyping, setIsTyping] = useState(false);

    const [stats, setStats] = useState({
        metrics: {
            revenue: 0,
            netProfit: 0,
            grossProfit: 0,
            orders: 0,
            products: 0,
            lowStock: 0,
            accountsPayable: 0,
            accountsReceivable: 0,
            trends: { revenue: "0" },
            aging: { current: 0, late: 0, overdue: 0 },
            topDebtors: [] as any[],
            topCreditors: [] as any[]
        },
        chartData: [] as any[],
        lowStockItems: [] as any[],
        activities: [] as any[],
        topProducts: [] as any[],
        aiForecast: { next7Days: 0, confidence: 0, reasoning: "" },
        expensesByCategory: [] as { category: string, _sum: { amount: number } }[]
    });

    useEffect(() => {
        fetchDashboardData();

        const interval = setInterval(() => {
            fetchDashboardData(true);
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async (isBackground = false) => {
        try {
            if (!isBackground) setLoading(true);
            const response = await fetch('/api/shop/analytics/dashboard');
            const data = await response.json();
            if (data.metrics) {
                setStats(data);
                setLastUpdated(new Date());
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    const handleAskAI = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        const userMsg = query;
        setQuery('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsTyping(true);

        try {
            const response = await fetch('/api/shop/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: userMsg, 
                    sessionId: 'dashboard-expert'
                })
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({ error: 'AI server error' }));
                setMessages(prev => [...prev, { role: 'ai', content: '⚠️ ' + (err.error || 'Khalad ayaa dhacay.') }]);
                setIsTyping(false);
                return;
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            if (reader) {
                // Add placeholder message for streaming
                const aiIdx = messages.length + 1; // approximate index
                setMessages(prev => [...prev, { role: 'ai', content: '' }]);
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                if (data.error) fullText = '⚠️ ' + data.error;
                                else if (data.text) fullText += data.text;
                                
                                if (data.done) {
                                    setMessages(prev => {
                                        const updated = [...prev];
                                        updated[updated.length - 1] = { role: 'ai', content: fullText };
                                        return updated;
                                    });
                                } else {
                                    setMessages(prev => {
                                        const updated = [...prev];
                                        updated[updated.length - 1] = { role: 'ai', content: fullText };
                                        return updated;
                                    });
                                }
                            } catch {}
                        }
                    }
                }
            }
        } catch (error) {
            console.error('AI Chat Error:', error);
            setMessages(prev => [...prev, { role: 'ai', content: 'AI server-ka ma shaqaynayo. Dib u isku day.' }]);
        } finally {
            setIsTyping(false);
        }
    };

    const COLORS = ['#3498DB', '#9B59B6', '#E67E22', '#F1C40F', '#1ABC9C'];

    return (
        <div className="min-h-screen space-y-8 animate-fade-in pb-12 font-sans">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2ECC71] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2ECC71]"></span>
                        </span>
                        <span className="text-xs font-bold text-[#2ECC71] uppercase tracking-widest">{t('system_online')}</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tighter">
                        {t('dashboard_title')}
                    </h1>
                    {lastUpdated && (
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                            {t('live_sync')}: {format(lastUpdated, 'HH:mm:ss')}
                        </p>
                    )}
                </div>

                <div className="flex items-center w-full md:w-auto">
                    <Link href="/shop/pos" className="relative group w-full md:w-auto">
                        <div className="absolute inset-0 bg-[#3498DB] rounded-xl sm:rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                        <div className="relative px-6 py-3 sm:px-8 sm:py-4 bg-[#0f172a] rounded-xl sm:rounded-2xl border border-[#3498DB]/30 flex justify-center items-center gap-2 sm:gap-3 hover:bg-[#1e293b] transition-colors w-full md:w-auto">
                            <Sparkles className="text-[#3498DB] animate-pulse sm:w-5 sm:h-5 w-4 h-4" />
                            <span className="text-sm sm:text-base font-bold text-white">{t('start_new_sale')}</span>
                            <ArrowUpRight className="text-gray-500 group-hover:text-white transition-colors sm:w-[18px] sm:h-[18px] w-4 h-4" />
                        </div>
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-[#3498DB]" />
                </div>
            ) : (
                <>
                    {/* METRICS ROW */}
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
                        <MetricCard
                            label={t('total_revenue')}
                            value={`ETB ${Math.round(stats.metrics.revenue).toLocaleString()}`}
                            trend={`${stats.metrics.trends.revenue}%`}
                            isPositive={Number(stats.metrics.trends.revenue) >= 0}
                            icon={Wallet}
                            variant="primary"
                            subtext={t('vs_last_week')}
                        />
                        <MetricCard
                            label={t('net_profit')}
                            value={`ETB ${Math.round(stats.metrics.netProfit).toLocaleString()}`}
                            trend={t('real_profit')}
                            isPositive={stats.metrics.netProfit > 0}
                            icon={Coins}
                            variant="accent"
                        />
                        <MetricCard
                            label={t('orders')}
                            value={stats.metrics.orders.toString()}
                            trend={t('total_sales')}
                            isPositive={true}
                            icon={ShoppingBag}
                            variant="neutral"
                        />
                        <MetricCard
                            label={t('products')}
                            value={stats.metrics.products.toString()}
                            trend={t('live_items')}
                            isPositive={true}
                            icon={Package}
                            variant="accent"
                        />
                        <MetricCard
                            label={t('low_stock')}
                            value={stats.metrics.lowStock.toString()}
                            trend={stats.metrics.lowStock > 0 ? t('action_needed') : t('stock_solid')}
                            isPositive={stats.metrics.lowStock === 0}
                            icon={Box}
                            variant="danger"
                        />
                    </div>

                    {/* MAIN CONTENT AREA */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">

                        {/* LEFT COLUMN */}
                        <div className="lg:col-span-8 space-y-4 md:space-y-8">

                            {/* REVENUE CHART */}
                            <div className="bg-white/50 dark:bg-[#1f2937]/30 backdrop-blur-md rounded-2xl sm:rounded-[24px] p-1 border border-gray-100 dark:border-white/5 shadow-sm">
                                <div className="bg-white dark:bg-[#0f172a] rounded-[20px] p-4 sm:p-8 h-[300px] md:h-[400px] flex flex-col">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                <BarChart3 className="text-[#3498DB]" size={22} />
                                                {t('sales_performance')}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('week_trend')}</p>
                                        </div>
                                        <div className="px-4 py-2 bg-[#2ECC71]/10 rounded-xl border border-[#2ECC71]/20">
                                            <span className="text-[#2ECC71] text-xs font-black">+{stats.metrics.trends.revenue}% {t('momentum')}</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 w-full min-h-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="chartGlowBrand" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3498DB" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#3498DB" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" strokeOpacity={0.5} className="dark:stroke-slate-700" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={15} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} tickFormatter={(value) => `${value / 1000}k`} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '12px' }}
                                                    itemStyle={{ color: '#fff' }}
                                                    formatter={(val: any) => [`ETB ${val.toLocaleString()}`, t('revenue')]}
                                                    labelStyle={{ color: '#94a3b8' }}
                                                />
                                                <Area type="monotone" dataKey="sales" stroke="#3498DB" strokeWidth={4} fill="url(#chartGlowBrand)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* FINANCIAL LISTS (AR/AP) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Receivables */}
                                <div className="bg-white/50 dark:bg-[#1f2937]/30 backdrop-blur-md rounded-[24px] p-1 border border-gray-100 dark:border-white/5 shadow-sm">
                                    <div className="bg-white dark:bg-[#0f172a] rounded-[20px] p-8">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                <ArrowUpRight className="text-red-500" size={20} />
                                                {t('receivables')}
                                            </h3>
                                            <Link href="/shop/reports?tab=receivables" className="text-[10px] font-black text-[#3498DB] uppercase hover:underline">{t('view_all')}</Link>
                                        </div>
                                        <div className="mb-6">
                                            <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-2 py-1 rounded-md uppercase tracking-tighter">
                                                {t('total')}: ETB {Math.round(stats.metrics.accountsReceivable).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            {stats.metrics.topDebtors?.length > 0 ? stats.metrics.topDebtors.map((debtor: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#151C2C] border border-gray-100 dark:border-gray-800">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-bold text-gray-900 dark:text-white text-xs truncate">{debtor.name}</p>
                                                        <p className="text-[10px] text-red-500 font-bold uppercase">ETB {Math.round(debtor.balance).toLocaleString()}</p>
                                                    </div>
                                                    <Link href={`/shop/customers/${debtor.id}`} className="ml-4 px-3 py-1 bg-red-500/10 text-red-500 rounded-lg text-[10px] font-black hover:bg-red-500 hover:text-white transition-all">
                                                        {t('pay')}
                                                    </Link>
                                                </div>
                                            )) : (
                                                <p className="text-center py-4 text-xs text-gray-400">{t('no_debtors')}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Payables */}
                                <div className="bg-white/50 dark:bg-[#1f2937]/30 backdrop-blur-md rounded-[24px] p-1 border border-gray-100 dark:border-white/5 shadow-sm">
                                    <div className="bg-white dark:bg-[#0f172a] rounded-[20px] p-8">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                <CreditCard className="text-[#3498DB]" size={20} />
                                                {t('payables')}
                                            </h3>
                                            <Link href="/shop/reports?tab=payables" className="text-[10px] font-black text-[#3498DB] uppercase hover:underline">{t('view_all')}</Link>
                                        </div>
                                        <div className="mb-6">
                                            <span className="text-[10px] font-black text-[#3498DB] bg-[#3498DB]/10 px-2 py-1 rounded-md uppercase tracking-tighter">
                                                {t('total')}: ETB {Math.round(stats.metrics.accountsPayable).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            {stats.metrics.topCreditors?.length > 0 ? stats.metrics.topCreditors.map((creditor: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#151C2C] border border-gray-100 dark:border-gray-800">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-bold text-gray-900 dark:text-white text-xs truncate">{creditor.name}</p>
                                                        <p className="text-[10px] text-[#3498DB] font-bold uppercase">ETB {Math.round(creditor.balance).toLocaleString()}</p>
                                                    </div>
                                                    <Link href={`/shop/vendors/${creditor.id}`} className="ml-4 px-3 py-1 bg-[#3498DB]/10 text-[#3498DB] rounded-lg text-[10px] font-black hover:bg-[#3498DB] hover:text-white transition-all">
                                                        {t('pay')}
                                                    </Link>
                                                </div>
                                            )) : (
                                                <p className="text-center py-4 text-xs text-gray-400">{t('no_payables')}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* TOP PRODUCTS & EXPENSE BREAKDOWN */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Profit Leaders */}
                                <div className="bg-white/50 dark:bg-[#1f2937]/30 backdrop-blur-md rounded-[24px] p-1 border border-gray-100 dark:border-white/5 shadow-sm">
                                    <div className="bg-white dark:bg-[#0f172a] rounded-[20px] p-8 h-full">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                            <Sparkles className="text-[#F39C12]" size={22} />
                                            {t('profit_leaders')}
                                        </h3>
                                        <div className="space-y-4">
                                            {stats.topProducts.map((product: any, idx: number) => (
                                                <div key={idx} className="p-3 rounded-2xl bg-gray-50 dark:bg-[#151C2C] border border-gray-100 dark:border-gray-800 flex items-center justify-between group hover:border-[#3498DB] transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#1a2333] border border-gray-100 dark:border-gray-800 flex items-center justify-center font-black text-[#3498DB] text-xs">
                                                            {idx + 1}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-gray-900 dark:text-white text-[11px] truncate">{product.name}</p>
                                                            <p className="text-[10px] text-gray-500">{product.volume} {t('sold')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[11px] font-black text-[#2ECC71]">ETB {Math.round(product.profit).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Expense Breakdown Pie Chart */}
                                <div className="bg-white/50 dark:bg-[#1f2937]/30 backdrop-blur-md rounded-[24px] p-1 border border-gray-100 dark:border-white/5 shadow-sm">
                                    <div className="bg-white dark:bg-[#0f172a] rounded-[20px] p-8 h-full">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                            <Wallet className="text-[#9B59B6]" size={22} />
                                            {t('expense_mix')}
                                        </h3>
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={stats.expensesByCategory?.length > 0 ? stats.expensesByCategory.map(e => ({ name: e.category, value: e._sum.amount })) : [{ name: 'None', value: 1 }]}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {(stats.expensesByCategory || []).map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '12px' }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="mt-4 grid grid-cols-2 gap-2">
                                            {stats.expensesByCategory?.map((e, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase truncate">{e.category}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="lg:col-span-4 space-y-8">

                            {/* DEBT AGING WIDGET */}
                            <div className="bg-white/50 dark:bg-[#1f2937]/30 backdrop-blur-md rounded-[24px] p-1 border border-gray-100 dark:border-white/5 shadow-sm">
                                <div className="bg-white dark:bg-[#0f172a] rounded-[20px] p-6">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">{t('debt_aging')}</h4>
                                    <div className="space-y-4">
                                        {[
                                            { label: t('current_debt'), val: stats.metrics.aging.current, color: '#3498DB' },
                                            { label: t('late_debt'), val: stats.metrics.aging.late, color: '#F39C12' },
                                            { label: t('overdue_debt'), val: stats.metrics.aging.overdue, color: '#E74C3C' }
                                        ].map((bucket, i) => (
                                            <div key={i}>
                                                <div className="flex justify-between text-[11px] mb-1 font-bold">
                                                    <span className="text-gray-400">{bucket.label}</span>
                                                    <span className="text-gray-900 dark:text-white">ETB {Math.round(bucket.val).toLocaleString()}</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full" style={{
                                                        width: `${(bucket.val / (stats.metrics.accountsReceivable || 1)) * 100}%`,
                                                        backgroundColor: bucket.color
                                                    }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* ACTIVITY FEED */}
                            <div className="bg-white/50 dark:bg-[#1f2937]/30 backdrop-blur-md rounded-[24px] p-1 border border-gray-100 dark:border-white/5 shadow-sm">
                                <div className="bg-white dark:bg-[#0f172a] rounded-[20px] p-6 h-[460px] flex flex-col">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">{t('live_activity')}</h4>
                                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                        <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-gray-100 dark:before:bg-gray-800">
                                            {stats.activities.map((activity: any, idx: number) => (
                                                <div key={idx} className="relative pl-10 group">
                                                    <div className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white dark:border-[#0f172a] shadow-sm z-10 ${activity.type === 'SALE' ? 'bg-[#2ECC71] text-white' :
                                                        activity.type === 'ANOMALY' ? 'bg-red-500 text-white animate-pulse' : 'bg-[#3498DB] text-white'
                                                        }`}>
                                                        {activity.type === 'SALE' ? <ShoppingBag size={12} /> : <Package size={12} />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <p className={`text-sm font-bold truncate ${activity.type === 'ANOMALY' ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{activity.title}</p>
                                                            <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2">
                                                                {format(new Date(activity.date), 'HH:mm')}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{activity.description}</p>
                                                        {activity.type !== 'ANOMALY' && (
                                                            <div className="mt-1 font-bold text-[11px] text-[#3498DB]">
                                                                ETB {Math.round(activity.amount).toLocaleString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* LOW STOCK WIDGET */}
                            <div className="bg-white/50 dark:bg-[#1f2937]/30 backdrop-blur-md rounded-[24px] p-1 border border-gray-100 dark:border-white/5 shadow-sm">
                                <div className="bg-white dark:bg-[#0f172a] rounded-[20px] p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{t('predictive_stockouts')}</h4>
                                        <Link href="/shop/inventory?status=Low%20Stock" className="text-[10px] font-black text-[#3498DB] uppercase tracking-tighter hover:underline">{t('refill_now')}</Link>
                                    </div>
                                    <div className="space-y-4">
                                        {stats.lowStockItems.length === 0 ? (
                                            <div className="text-center py-6">
                                                <p className="text-xs font-bold text-gray-400 tracking-widest">{t('inventory_optimized')}</p>
                                            </div>
                                        ) : (
                                            stats.lowStockItems.slice(0, 3).map((item: any) => (
                                                <div key={item.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-[#151C2C] border border-gray-100 dark:border-gray-800">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{item.name}</p>
                                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${item.daysLeft < 3 ? 'bg-red-500 text-white' : 'bg-orange-400 text-white'}`}>
                                                            {item.daysLeft}{t('days_left')}
                                                        </span>
                                                    </div>
                                                    <div className="h-1 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${item.daysLeft < 3 ? 'bg-red-500' : 'bg-orange-400'}`} style={{ width: `${Math.min((item.stock / 20) * 100, 100)}%` }}></div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI INTELLIGENCE SECTION */}
                    <div className="pt-8 border-t border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-2 mb-6">
                            <BrainCircuit className="text-[#3498DB]" size={20} />
                            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">AI Business Strategy</h3>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-7">
                                <AiInsightsFeed />
                            </div>
                            <div className="lg:col-span-5">
                            <div className="bg-white/50 dark:bg-[#1f2937]/30 backdrop-blur-md rounded-[24px] p-1 border border-gray-100 dark:border-white/5 shadow-sm flex flex-col h-[560px] relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-[#3498DB]/5 dark:bg-[#3498DB]/10 rounded-full blur-[80px]" />
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#2ECC71]/5 dark:bg-[#2ECC71]/10 rounded-full blur-[60px]" />
                                <div className="flex items-center justify-between p-5 pb-4 relative z-10 bg-white dark:bg-[#0f172a] rounded-t-[20px]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#3498DB] to-[#2ECC71] flex items-center justify-center shadow-lg shadow-[#3498DB]/20">
                                            <Bot size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                                                REVL<span className="text-[#2ECC71]">O</span>
                                                <span className="text-gray-400 dark:text-gray-500 font-medium text-sm">AI</span>
                                            </h4>
                                            <p className="text-[10px] text-[#3498DB] font-bold uppercase tracking-widest">{t('talk_to_data')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-[#2ECC71]/10 px-2.5 py-1 rounded-full border border-[#2ECC71]/20">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#2ECC71] animate-pulse" />
                                        <span className="text-[9px] font-black text-[#2ECC71] uppercase">Online</span>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto px-5 space-y-3 custom-scrollbar relative z-10 bg-gray-50/50 dark:bg-[#0b1120]">
                                    {messages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center">
                                            <div className="w-16 h-16 rounded-3xl bg-[#3498DB]/10 flex items-center justify-center mb-4 border border-[#3498DB]/20">
                                                <Sparkles size={28} className="text-[#3498DB]" />
                                            </div>
                                            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-loose whitespace-pre-line">
                                                {t('ask_anything')}
                                            </p>
                                            <div className="mt-4 grid grid-cols-2 gap-2">
                                                {["Imisa ayaan maanta iibiyay?", "Stock-ka sidee u yahay?", "Faa'iidada bishaan?", "Macaamiishayda?"].map((q, i) => (
                                                    <button key={i} onClick={() => { setQuery(q); }} className="text-[10px] px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-[#3498DB] hover:bg-[#3498DB]/5 hover:border-[#3498DB]/30 transition-all font-medium text-left">
                                                        {q}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        messages.map((m, i) => (
                                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                {m.role !== 'user' && (
                                                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#3498DB]/15 to-[#2ECC71]/15 flex items-center justify-center flex-shrink-0 mr-2 mt-1 border border-[#3498DB]/10">
                                                        <Bot size={14} className="text-[#3498DB]" />
                                                    </div>
                                                )}
                                                <div className={`max-w-[80%] p-3.5 rounded-2xl ${m.role === 'user' ? 'bg-[#3498DB] text-white rounded-tr-sm' : 'bg-white dark:bg-[#1a2236] text-gray-800 dark:text-gray-200 rounded-tl-sm border border-gray-200/80 dark:border-gray-800/50 shadow-sm'}`}>
                                                    <p className="text-[13px] font-medium leading-relaxed whitespace-pre-wrap">{m.content}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    {isTyping && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-xl bg-[#3498DB]/10 flex items-center justify-center"><Bot size={14} className="text-[#3498DB]" /></div>
                                            <div className="bg-white dark:bg-[#1a2236] p-3 rounded-2xl rounded-tl-sm border border-gray-200/80 dark:border-gray-800/50 shadow-sm">
                                                <div className="flex gap-1">
                                                    <span className="w-2 h-2 bg-[#3498DB] rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                                                    <span className="w-2 h-2 bg-[#3498DB] rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                                                    <span className="w-2 h-2 bg-[#3498DB] rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <form onSubmit={handleAskAI} className="p-4 relative z-10 bg-white dark:bg-[#0f172a] rounded-b-[20px]">
                                    <div className="relative">
                                        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('ask_placeholder')} className="w-full bg-gray-50 dark:bg-[#1a2236] border border-gray-200 dark:border-gray-800/50 rounded-2xl pl-5 pr-14 py-3.5 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-[#3498DB]/50 transition-all" />
                                        <button disabled={isTyping} type="submit" className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 bg-[#3498DB] hover:bg-[#2980B9] text-white rounded-xl font-bold hover:shadow-lg hover:shadow-[#3498DB]/20 transition-all flex items-center justify-center disabled:opacity-40">
                                            <Send size={16} />
                                        </button>
                                    </div>
                                </form>
                            </div>
                            </div>
                        </div>
                    </div>


                </>
            )}
        </div>
    );
}
