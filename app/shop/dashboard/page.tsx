'use client';

import React from 'react';
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
    BarChart3
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

// Shared UI Components
import MetricCard from '@/components/shop/ui/MetricCard';

// --- DATA (Values in ETB) ---
const data = [
    { name: 'Sat', sales: 40000 },
    { name: 'Sun', sales: 30000 },
    { name: 'Mon', sales: 20000 },
    { name: 'Tue', sales: 27800 },
    { name: 'Wed', sales: 18900 },
    { name: 'Thu', sales: 23900 },
    { name: 'Fri', sales: 34900 },
];

export default function ShopDashboard() {
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
                </div>

                <div className="flex items-center gap-4">
                    {/* Primary Action Button (Project Blue) */}
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

            {/* METRICS ROW - STRICT PROJECT COLORS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard label="Total Revenue" value="ETB 245K" trend="+12.5%" isPositive={true} icon={Wallet} variant="primary" />
                <MetricCard label="Active Orders" value="1,245" trend="+8.2%" isPositive={true} icon={ShoppingBag} variant="neutral" />
                <MetricCard label="Stock Levels" value="482" trend="+2.1%" isPositive={true} icon={Package} variant="accent" />
                <MetricCard label="Net Profit" value="ETB 84.2K" trend="+14.5%" isPositive={true} icon={Coins} variant="secondary" />
            </div>

            {/* MAIN ANALYTICS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* CHART CARD */}
                <div className="lg:col-span-2 bg-white/50 dark:bg-[#1f2937]/30 backdrop-blur-md rounded-[24px] p-1 border border-gray-100 dark:border-white/5 shadow-sm">
                    <div className="bg-white dark:bg-[#0f172a] rounded-[20px] p-8 h-[460px] flex flex-col shadow-sm dark:shadow-none">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <BarChart3 className="text-[#3498DB]" size={22} />
                                    Financial Overview
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Revenue in ETB</p>
                            </div>
                            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                {['1W', '1M', '3M', '1Y'].map((t, i) => (
                                    <button key={t} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${i === 0 ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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

                {/* SIDEBAR WIDGETS */}
                <div className="space-y-6">

                    {/* Quick Actions */}
                    <div className="bg-white/50 dark:bg-[#1f2937]/30 backdrop-blur-md rounded-[24px] p-1 border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="bg-white dark:bg-[#0f172a] rounded-[20px] p-6 shadow-sm dark:shadow-none">
                            <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Quick Actions</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <Link href="/shop/pos" className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-[#3498DB] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group cursor-pointer text-center">
                                    <CreditCard className="text-gray-400 group-hover:text-[#3498DB] mb-2" />
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">POS Sale</span>
                                </Link>
                                <Link href="/shop/inventory" className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-[#F39C12] hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all group cursor-pointer text-center">
                                    <Box className="text-gray-400 group-hover:text-[#F39C12] mb-2" />
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Add Stock</span>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Low Stock Widget */}
                    <div className="bg-white/50 dark:bg-[#1f2937]/30 backdrop-blur-md rounded-[24px] p-1 border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="bg-white dark:bg-[#0f172a] rounded-[20px] p-6 shadow-sm dark:shadow-none">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Low Stock</h4>
                                <Link href="/shop/inventory" className="text-xs font-bold text-[#3498DB] hover:text-[#2980B9]">See All</Link>
                            </div>
                            <div className="space-y-3">
                                {[1, 2, 3].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[#F39C12] font-bold text-xs">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-900 dark:text-gray-200">Item Name #{i + 40}</p>
                                            <p className="text-xs text-red-500 font-medium">3 units left</p>
                                        </div>
                                        <ChevronRight size={14} className="text-gray-400" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
