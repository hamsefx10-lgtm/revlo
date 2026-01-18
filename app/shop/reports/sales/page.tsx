'use client';

import React, { useState, useEffect } from 'react';
import {
    Calendar,
    BarChart3,
    TrendingUp,
    DollarSign,
    CreditCard,
    ArrowLeft,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export default function SalesReportPage() {
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('7days'); // 7days, 30days
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        fetchReport();
    }, [dateRange]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            let from = new Date();
            const to = new Date();

            if (dateRange === '7days') {
                from = subDays(new Date(), 7);
            } else if (dateRange === '30days') {
                from = subDays(new Date(), 30);
            }

            const query = `?from=${from.toISOString()}&to=${to.toISOString()}`;
            const response = await fetch(`/api/shop/reports/sales${query}`);
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-7xl mx-auto md:p-8">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-4 md:px-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/shop/reports" className="text-mediumGray hover:text-darkGray dark:hover:text-white transition-colors flex items-center gap-1 text-xs font-black uppercase tracking-wider">
                            <ArrowLeft size={14} /> Back to Reports
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-darkGray dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-lightGray dark:border-gray-700 text-primary">
                            <BarChart3 size={28} />
                        </div>
                        Sales Report
                    </h1>
                </div>

                <div className="flex bg-white dark:bg-gray-900 p-1.5 rounded-xl border border-lightGray dark:border-gray-800 self-start md:self-auto">
                    <button
                        onClick={() => setDateRange('7days')}
                        className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${dateRange === '7days' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-mediumGray hover:text-darkGray dark:hover:text-white'}`}
                    >
                        Last 7 Days
                    </button>
                    <button
                        onClick={() => setDateRange('30days')}
                        className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${dateRange === '30days' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-mediumGray hover:text-darkGray dark:hover:text-white'}`}
                    >
                        Last 30 Days
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-96 flex items-center justify-center bg-white dark:bg-gray-900 rounded-[2rem] border border-lightGray dark:border-gray-800 mx-4 md:mx-0">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                </div>
            ) : (
                <div className="px-4 md:px-0">
                    {/* STATS CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Revenue */}
                        <div className="bg-gradient-to-br from-primary to-blue-600 p-8 rounded-[2rem] shadow-xl shadow-primary/30 text-white relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <p className="text-blue-100 text-xs font-black uppercase tracking-wider mb-1">Total Revenue</p>
                                        <h3 className="text-3xl font-black">ETB {data?.stats?.revenue.toLocaleString()}</h3>
                                    </div>
                                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-md">
                                        <DollarSign size={24} className="text-white" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold text-blue-100">
                                        <span>Target (Monthly)</span>
                                        <span>75%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-white w-[75%] rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 p-16 bg-white/10 rounded-bl-[100px] transition-all group-hover:scale-110 duration-500"></div>
                        </div>

                        {/* Transactions */}
                        <div className="bg-white dark:bg-gray-900 border border-lightGray dark:border-gray-800 p-8 rounded-[2rem] shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-mediumGray text-xs font-black uppercase tracking-wider mb-2">Transactions</p>
                                    <h3 className="text-3xl font-black text-darkGray dark:text-white">{data?.stats?.transactions}</h3>
                                </div>
                                <div className="p-3 bg-secondary/10 rounded-xl text-secondary">
                                    <CreditCard size={24} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-secondary">
                                <TrendingUp size={14} /> +12% from last period
                            </div>
                        </div>

                        {/* Avg Order */}
                        <div className="bg-white dark:bg-gray-900 border border-lightGray dark:border-gray-800 p-8 rounded-[2rem] shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-mediumGray text-xs font-black uppercase tracking-wider mb-2">Avg. Order Value</p>
                                    <h3 className="text-3xl font-black text-darkGray dark:text-white">ETB {Math.round(data?.stats?.avgValue).toLocaleString()}</h3>
                                </div>
                                <div className="p-3 bg-orange-100 text-orange-600 dark:bg-orange-900/20 rounded-xl">
                                    <TrendingUp size={24} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-orange-600">
                                <DollarSign size={14} /> Per transaction
                            </div>
                        </div>

                        {/* Tax */}
                        <div className="bg-white dark:bg-gray-900 border border-lightGray dark:border-gray-800 p-8 rounded-[2rem] shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-mediumGray text-xs font-black uppercase tracking-wider mb-2">Total Tax (VAT)</p>
                                    <h3 className="text-3xl font-black text-darkGray dark:text-white">ETB {data?.stats?.tax.toLocaleString()}</h3>
                                </div>
                                <div className="p-3 bg-purple-100 text-purple-600 dark:bg-purple-900/20 rounded-xl">
                                    <DollarSign size={24} />
                                </div>
                            </div>
                            <p className="text-xs text-mediumGray font-medium">Estimated tax liability</p>
                        </div>
                    </div>

                    {/* CHART */}
                    <div className="bg-white dark:bg-gray-900 border border-lightGray dark:border-gray-800 rounded-[2rem] p-8 shadow-sm h-[500px] mb-8 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-lg font-black text-darkGray dark:text-white flex items-center gap-2">
                                <TrendingUp className="text-primary" size={20} /> Revenue Trend
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-primary"></span>
                                <span className="text-xs font-bold text-mediumGray">Revenue</span>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height="85%">
                            <AreaChart data={data?.chartData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3498DB" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3498DB" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                    tickFormatter={(value) => `${value.toLocaleString()}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                        padding: '12px 16px',
                                        fontFamily: 'inherit',
                                        backgroundColor: '#fff'
                                    }}
                                    itemStyle={{ color: '#2C3E50', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#3498DB"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorRev)"
                                    activeDot={{ r: 8, strokeWidth: 0, fill: '#3498DB' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}
