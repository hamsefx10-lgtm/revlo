'use client';

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
    Package,
    ShoppingBag,
    CreditCard,
    Box,
    ChevronRight,
    Wallet,
    Coins,
    ArrowUpRight,
    Sparkles,
    BarChart3,
    Loader2,
    MessageSquare,
    Send,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

// Shared UI Components
import MetricCard from '@/components/shop/ui/MetricCard';

export default function ShopDashboard() {
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
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg, history: messages })
            });
            const data = await response.json();
            if (data.content) {
                setMessages(prev => [...prev, { role: 'ai', content: data.content }]);
            }
        } catch (error) {
            console.error('AI Chat Error:', error);
        } finally {
            setIsTyping(false);
        }
    };

    const COLORS = ['#3498DB', '#9B59B6', '#E67E22', '#F1C40F', '#1ABC9C'];

    return (
        <div className="min-h-screen space-y-8 animate-fade-in pb-12 font-sans">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2ECC71] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2ECC71]"></span>
                        </span>
                        <span className="text-xs font-bold text-[#2ECC71] uppercase tracking-widest">System Online</span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">
                        Dashboard
                    </h1>
                    {lastUpdated && (
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                            Live Sync: {format(lastUpdated, 'HH:mm:ss')}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/shop/pos" className="relative group">
                        <div className="absolute inset-0 bg-[#3498DB] rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                        <div className="relative px-8 py-4 bg-[#0f172a] rounded-2xl border border-[#3498DB]/30 flex items-center gap-3 hover:bg-[#1e293b] transition-colors">
                            <Sparkles className="text-[#3498DB] animate-pulse" size={20} />
                            <span className="font-bold text-white">Start New Sale</span>
                            <ArrowUpRight className="text-gray-500 group-hover:text-white transition-colors" size={18} />
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        <MetricCard
                            label="Total Revenue"
                            value={`ETB ${Math.round(stats.metrics.revenue).toLocaleString()}`}
                            trend={`${stats.metrics.trends.revenue}%`}
                            isPositive={Number(stats.metrics.trends.revenue) >= 0}
                            icon={Wallet}
                            variant="primary"
                            subtext="vs last week"
                        />
                        <MetricCard
                            label="Net Profit"
                            value={`ETB ${Math.round(stats.metrics.netProfit).toLocaleString()}`}
                            trend="Real Faaiido"
                            isPositive={stats.metrics.netProfit > 0}
                            icon={Coins}
                            variant="accent"
                        />
                        <MetricCard
                            label="Orders"
                            value={stats.metrics.orders.toString()}
                            trend="Total Sales"
                            isPositive={true}
                            icon={ShoppingBag}
                            variant="neutral"
                        />
                        <MetricCard
                            label="Products"
                            value={stats.metrics.products.toString()}
                            trend="Live items"
                            isPositive={true}
                            icon={Package}
                            variant="accent"
                        />
                        <MetricCard
                            label="Low Stock"
                            value={stats.metrics.lowStock.toString()}
                            trend={stats.metrics.lowStock > 0 ? "Action needed" : "Solid"}
                            isPositive={stats.metrics.lowStock === 0}
                            icon={Box}
                            variant="danger"
                        />
                    </div>

                    {/* MAIN CONTENT AREA */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* LEFT COLUMN: CHARTS & FINANCIAL LISTS */}
                        <div className="lg:col-span-8 space-y-8">

                            {/* REVENUE CHART */}
                            <div className="bg-white/50 dark:bg-[#1f2937]/30 backdrop-blur-md rounded-[24px] p-1 border border-gray-100 dark:border-white/5 shadow-sm">
                                <div className="bg-white dark:bg-[#0f172a] rounded-[20px] p-8 h-[400px] flex flex-col">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                <BarChart3 className="text-[#3498DB]" size={22} />
                                                Sales Performance
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Week-over-Week Trend Analysis</p>
                                        </div>
                                        <div className="px-4 py-2 bg-[#2ECC71]/10 rounded-xl border border-[#2ECC71]/20">
                                            <span className="text-[#2ECC71] text-xs font-black">+{stats.metrics.trends.revenue}% MOMENTUM</span>
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
                                                    formatter={(val: any) => [`ETB ${val.toLocaleString()}`, 'Revenue']}
                                                    labelStyle={{ color: '#94a3b8' }}
                                                />
                                                <Area type="monotone" dataKey="sales" stroke="#3498DB" strokeWidth={4} fill="url(#chartGlowBrand)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* FINANCIAL ACTIONABLE LISTS (AR/AP) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white/50 dark:bg-[#1f2937]/30 backdrop-blur-md rounded-[24px] p-1 border border-gray-100 dark:border-white/5 shadow-sm">
                                    <div className="bg-white dark:bg-[#0f172a] rounded-[20px] p-8">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                <ArrowUpRight className="text-red-500" size={20} />
                                                Receivables
                                            </h3>
                                            <Link href="/shop/reports?tab=receivables" className="text-[10px] font-black text-[#3498DB] uppercase hover:underline">View All</Link>
                                        </div>
                                        <div className="mb-6">
                                            <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-2 py-1 rounded-md uppercase tracking-tighter">
                                                Total: ETB {Math.round(stats.metrics.accountsReceivable).toLocaleString()}
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
                                                        PAY
                                                    </Link>
                                                </div>
                                            )) : (
                                                <p className="text-center py-4 text-xs text-gray-400">No debtors found.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/50 dark:bg-[#1f2937]/30 backdrop-blur-md rounded-[24px] p-1 border border-gray-100 dark:border-white/5 shadow-sm">
                                    <div className="bg-white dark:bg-[#0f172a] rounded-[20px] p-8">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                <CreditCard className="text-[#3498DB]" size={20} />
                                                Payables
                                            </h3>
                                            <Link href="/shop/reports?tab=payables" className="text-[10px] font-black text-[#3498DB] uppercase hover:underline">View All</Link>
                                        </div>
                                        <div className="mb-6">
                                            <span className="text-[10px] font-black text-[#3498DB] bg-[#3498DB]/10 px-2 py-1 rounded-md uppercase tracking-tighter">
                                                Total: ETB {Math.round(stats.metrics.accountsPayable).toLocaleString()}
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
                                                        PAY
                                                    </Link>
                                                </div>
                                            )) : (
                                                <p className="text-center py-4 text-xs text-gray-400">No payables found.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* TOP SELLING PRODUCTS & EXPENSE BREAKDOWN */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Profitability Leaders */}
                                <div className="bg-white/50 dark:bg-[#1f2937]/30 backdrop-blur-md rounded-[24px] p-1 border border-gray-100 dark:border-white/5 shadow-sm">
                                    <div className="bg-white dark:bg-[#0f172a] rounded-[20px] p-8 h-full">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                            <Sparkles className="text-[#F39C12]" size={22} />
                                            Profit Leaders
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
                                                            <p className="text-[10px] text-gray-500">{product.volume} sold</p>
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
                                            Expense Mix
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

                        {/* RIGHT COLUMN: ACTIVITY FEED & LOW STOCK & AGING */}
                        <div className="lg:col-span-4 space-y-8">

                            {/* DEBT AGING WIDGET */}
                            <div className="bg-white/50 dark:bg-[#1f2937]/30 backdrop-blur-md rounded-[24px] p-1 border border-gray-100 dark:border-white/5 shadow-sm">
                                <div className="bg-white dark:bg-[#0f172a] rounded-[20px] p-6">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Debt Aging (AR)</h4>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Current (0-7d)', val: stats.metrics.aging.current, color: '#3498DB' },
                                            { label: 'Late (8-30d)', val: stats.metrics.aging.late, color: '#F39C12' },
                                            { label: 'Overdue (30d+)', val: stats.metrics.aging.overdue, color: '#E74C3C' }
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
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Live Activity Audit</h4>
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
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Predictive Stockouts</h4>
                                        <Link href="/shop/inventory?status=Low%20Stock" className="text-[10px] font-black text-[#3498DB] uppercase tracking-tighter hover:underline">Refill Now</Link>
                                    </div>
                                    <div className="space-y-4">
                                        {stats.lowStockItems.length === 0 ? (
                                            <div className="text-center py-6">
                                                <p className="text-xs font-bold text-gray-400 tracking-widest">Inventory Optimized</p>
                                            </div>
                                        ) : (
                                            stats.lowStockItems.slice(0, 3).map((item: any) => (
                                                <div key={item.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-[#151C2C] border border-gray-100 dark:border-gray-800">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{item.name}</p>
                                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${item.daysLeft < 3 ? 'bg-red-500 text-white' : 'bg-orange-400 text-white'}`}>
                                                            {item.daysLeft}d left
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

                    {/* SEPARATED AI INTELLIGENCE SECTION */}
                    <div className="pt-8 border-t border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-2 mb-6">
                            <Sparkles className="text-[#3498DB]" size={20} />
                            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">AI Business Intelligence</h3>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Proactive Actionable Insights */}
                            <div className="bg-gradient-to-br from-[#3498DB]/5 to-[#8E44AD]/5 dark:from-[#3498DB]/10 dark:to-[#8E44AD]/10 backdrop-blur-md rounded-[32px] p-8 border border-[#3498DB]/20 relative overflow-hidden group">
                                <div className="relative z-10 h-full flex flex-col">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">AI Proactive Guard</p>
                                            <h4 className="text-2xl font-black text-gray-900 dark:text-white">Smart Insights</h4>
                                        </div>
                                        <AlertCircle className="text-[#3498DB] animate-pulse" size={24} />
                                    </div>

                                    <div className="space-y-4 flex-1">
                                        {stats.metrics.lowStock > 0 && (
                                            <div className="p-4 rounded-2xl bg-white/40 dark:bg-[#0f172a]/40 border border-[#3498DB]/20 backdrop-blur-sm flex items-start gap-3">
                                                <AlertCircle className="text-orange-500 mt-1" size={16} />
                                                <div>
                                                    <p className="text-xs font-bold text-gray-900 dark:text-white">Inventory Risk</p>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">{stats.metrics.lowStock} items are critically low. Replenish soon to avoid lost sales.</p>
                                                </div>
                                            </div>
                                        )}
                                        {stats.metrics.accountsReceivable > 10000 && (
                                            <div className="p-4 rounded-2xl bg-white/40 dark:bg-[#0f172a]/40 border border-[#3498DB]/20 backdrop-blur-sm flex items-start gap-3">
                                                <Wallet className="text-red-500 mt-1" size={16} />
                                                <div>
                                                    <p className="text-xs font-bold text-gray-900 dark:text-white">Cash Flow Alert</p>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">ETB {Math.round(stats.metrics.accountsReceivable).toLocaleString()} is tied up in receivables. Follow up with debtors.</p>
                                                </div>
                                            </div>
                                        )}
                                        {Number(stats.metrics.trends.revenue) < 0 && (
                                            <div className="p-4 rounded-2xl bg-white/40 dark:bg-[#0f172a]/40 border border-[#3498DB]/20 backdrop-blur-sm flex items-start gap-3">
                                                <BarChart3 className="text-blue-500 mt-1" size={16} />
                                                <div>
                                                    <p className="text-xs font-bold text-gray-900 dark:text-white">Sales Dip Detected</p>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">Revenue dropped {stats.metrics.trends.revenue}% vs last week. Analyze top products.</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="p-4 rounded-2xl bg-[#2ECC71]/10 border border-[#2ECC71]/20 flex items-start gap-3">
                                            <CheckCircle2 className="text-[#2ECC71] mt-1" size={16} />
                                            <p className="text-[11px] text-[#2ECC71] font-bold uppercase tracking-tight">System Optimized: Gemini Guarding Your Profit</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Gemini Interactive Chat Assistant */}
                            <div className="bg-white/50 dark:bg-[#1f2937]/30 backdrop-blur-md rounded-[32px] p-8 border border-gray-100 dark:border-white/5 flex flex-col h-[500px]">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h4 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                            <MessageSquare className="text-[#3498DB]" size={20} />
                                            Revlo Expert
                                        </h4>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Talk to your business data</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="h-2 w-2 rounded-full bg-[#2ECC71] animate-pulse"></span>
                                        <span className="text-[10px] font-black text-[#2ECC71]">ONLINE</span>
                                    </div>
                                </div>

                                {/* Chat Messages Window */}
                                <div className="flex-1 overflow-y-auto mb-6 space-y-4 pr-2 custom-scrollbar">
                                    {messages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center opacity-40 text-center">
                                            <Sparkles size={48} className="text-[#3498DB] mb-4" />
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-loose">
                                                Ask me anything about <br /> Sales, Inventory or Profit
                                            </p>
                                        </div>
                                    ) : (
                                        messages.map((m, i) => (
                                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] p-4 rounded-3xl ${m.role === 'user'
                                                    ? 'bg-[#3498DB] text-white rounded-tr-none'
                                                    : 'bg-gray-100 dark:bg-[#151C2C] text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-gray-800 shadow-sm'
                                                    }`}>
                                                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{m.content}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    {isTyping && (
                                        <div className="flex justify-start">
                                            <div className="bg-gray-100 dark:bg-[#151C2C] p-4 rounded-3xl rounded-tl-none border border-gray-200 dark:border-gray-800">
                                                <Loader2 size={16} className="animate-spin text-[#3498DB]" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <form onSubmit={handleAskAI} className="relative mt-auto">
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Type your question..."
                                        className="w-full bg-gray-50 dark:bg-[#0f172a] border-2 border-gray-100 dark:border-gray-800 rounded-2xl pl-6 pr-14 py-4 text-sm font-medium focus:outline-none focus:border-[#3498DB] transition-all"
                                    />
                                    <button disabled={isTyping} type="submit" className="absolute right-2 top-2 bottom-2 px-4 bg-[#3498DB] text-white rounded-xl font-bold hover:bg-[#2980B9] transition-all shadow-lg shadow-[#3498DB]/30 flex items-center justify-center disabled:opacity-50">
                                        <Send size={18} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
