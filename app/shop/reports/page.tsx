'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    BarChart3,
    PieChart,
    LineChart,
    TrendingUp,
    Package,
    Users,
    Wallet,
    Calendar,
    FileText,
    ChevronRight,
    ArrowUpRight,
    Download,
    Filter,
    Loader2,
    Scale
} from 'lucide-react';
import UltraIcon from '@/components/shop/ui/UltraIcon';
import { subDays } from 'date-fns';

interface ReportCardProps {
    title: string;
    desc: string;
    icon: any;
    color: 'blue' | 'green' | 'orange' | 'purple' | 'red';
    href: string;
}

const ReportCard = ({ title, desc, icon: Icon, color, href }: ReportCardProps) => {

    const variantMap: Record<string, 'primary' | 'secondary' | 'accent' | 'neutral' | 'danger'> = {
        blue: 'primary',
        green: 'secondary',
        orange: 'accent',
        purple: 'neutral', // Fallback
        red: 'danger'
    };

    return (
        <Link href={href} className="block h-full group">
            <div className="bg-white dark:bg-gray-900 border border-lightGray dark:border-gray-800 rounded-[2rem] p-8 hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 relative overflow-hidden h-full flex flex-col">

                <div className="mb-6 transform group-hover:scale-110 transition-transform duration-300 origin-left">
                    <UltraIcon icon={Icon} variant={variantMap[color] || 'neutral'} />
                </div>

                <h3 className="text-xl font-black text-darkGray dark:text-white mb-3 line-clamp-1 group-hover:text-primary transition-colors">{title}</h3>
                <p className="text-sm font-medium text-mediumGray dark:text-gray-400 leading-relaxed mb-8 flex-1">{desc}</p>

                <div className="flex items-center text-xs font-black text-mediumGray group-hover:text-primary transition-colors mt-auto uppercase tracking-wider">
                    View Report <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute top-0 right-0 p-24 bg-gradient-to-br from-white/0 to-gray-50/0 group-hover:from-white/0 group-hover:to-gray-100/50 dark:group-hover:to-white/5 transition-all duration-500 rounded-bl-[100px] pointer-events-none" />
            </div>
        </Link>
    );
};

export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [dateRange, setDateRange] = useState('30days');

    useEffect(() => {
        fetchOverviewStats();
    }, [dateRange]);

    const fetchOverviewStats = async () => {
        setLoading(true);
        try {
            let from = new Date();
            const to = new Date();

            if (dateRange === '7days') from = subDays(new Date(), 7);
            else if (dateRange === '30days') from = subDays(new Date(), 30);
            else if (dateRange === '90days') from = subDays(new Date(), 90);

            const query = `?from=${from.toISOString()}&to=${to.toISOString()}`;
            // Reusing the sales report API for the high-level stats
            const response = await fetch(`/api/shop/reports/sales${query}`);
            const result = await response.json();
            setStats(result?.stats || null);
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-7xl mx-auto md:p-8">

            {/* HEADER */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-12 px-4 md:px-0">
                <div>
                    <h1 className="text-4xl font-black text-darkGray dark:text-white tracking-tight flex items-center gap-4 mb-2">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-lightGray dark:border-gray-700 text-primary">
                            <BarChart3 size={32} />
                        </div>
                        Business Reports
                    </h1>
                    <p className="text-mediumGray font-medium text-base ml-1">Gain insights into your business performance and growth.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Date Filter */}
                    <div className="bg-white dark:bg-gray-900 p-1.5 rounded-xl border border-lightGray dark:border-gray-800 flex items-center">
                        <button
                            onClick={() => setDateRange('7days')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${dateRange === '7days' ? 'bg-gray-100 dark:bg-gray-800 text-darkGray dark:text-white' : 'text-mediumGray hover:text-darkGray'}`}
                        >
                            7 Days
                        </button>
                        <button
                            onClick={() => setDateRange('30days')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${dateRange === '30days' ? 'bg-gray-100 dark:bg-gray-800 text-darkGray dark:text-white' : 'text-mediumGray hover:text-darkGray'}`}
                        >
                            30 Days
                        </button>
                        <button
                            onClick={() => setDateRange('90days')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${dateRange === '90days' ? 'bg-gray-100 dark:bg-gray-800 text-darkGray dark:text-white' : 'text-mediumGray hover:text-darkGray'}`}
                        >
                            3 Months
                        </button>
                    </div>

                    <button className="px-6 py-3 bg-darkGray dark:bg-white hover:bg-black text-white dark:text-black font-bold rounded-xl shadow-lg shadow-black/10 transition-all flex items-center gap-2">
                        <Download size={18} /> Export <span className="hidden sm:inline">Summary</span>
                    </button>
                </div>
            </div>

            {/* QUICK STATS (NEW SECTION) */}
            <div className="px-4 md:px-0 mb-12 animate-fade-in-up">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-40 bg-white dark:bg-gray-900 rounded-[2rem] border border-lightGray dark:border-gray-800 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Revenue Card */}
                        <div className="bg-gradient-to-br from-primary to-blue-600 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-primary/20 group hover:-translate-y-1 transition-transform">
                            <div className="relative z-10">
                                <p className="text-blue-100 text-xs font-black uppercase tracking-wider mb-2">Total Revenue</p>
                                <h3 className="text-4xl font-black mb-4">ETB {stats?.revenue?.toLocaleString() || '0'}</h3>
                                <div className="flex items-center gap-2 text-blue-100 text-sm font-bold bg-white/10 w-fit px-3 py-1 rounded-full backdrop-blur-md">
                                    <TrendingUp size={16} /> +12.5% vs last period
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 p-20 bg-white/10 rounded-bl-[150px] transition-transform group-hover:scale-110 duration-500"></div>
                            <Wallet className="absolute bottom-6 right-6 text-white/20 transform -rotate-12" size={64} />
                        </div>

                        {/* Transactions Card */}
                        <div className="bg-white dark:bg-gray-900 border border-lightGray dark:border-gray-800 rounded-[2rem] p-8 relative overflow-hidden group hover:shadow-lg transition-all hover:-translate-y-1">
                            <div className="relative z-10">
                                <p className="text-mediumGray text-xs font-black uppercase tracking-wider mb-2">Total Orders</p>
                                <h3 className="text-4xl font-black text-darkGray dark:text-white mb-4">{stats?.transactions?.toLocaleString() || '0'}</h3>
                                <div className="flex items-center gap-2 text-green-500 text-sm font-bold bg-green-50 w-fit px-3 py-1 rounded-full dark:bg-green-900/20">
                                    <TrendingUp size={16} /> +5.2% grow
                                </div>
                            </div>
                            <Package className="absolute bottom-6 right-6 text-lightGray dark:text-gray-800 transform rotate-12 group-hover:text-primary/10 transition-colors" size={64} />
                        </div>

                        {/* Avg Value Card */}
                        <div className="bg-white dark:bg-gray-900 border border-lightGray dark:border-gray-800 rounded-[2rem] p-8 relative overflow-hidden group hover:shadow-lg transition-all hover:-translate-y-1">
                            <div className="relative z-10">
                                <p className="text-mediumGray text-xs font-black uppercase tracking-wider mb-2">Avg. Order Value</p>
                                <h3 className="text-4xl font-black text-darkGray dark:text-white mb-4">ETB {Math.round(stats?.avgValue || 0).toLocaleString()}</h3>
                                <div className="flex items-center gap-2 text-orange-500 text-sm font-bold bg-orange-50 w-fit px-3 py-1 rounded-full dark:bg-orange-900/20">
                                    <Users size={16} /> stable
                                </div>
                            </div>
                            <PieChart className="absolute bottom-6 right-6 text-lightGray dark:text-gray-800 transform -rotate-6 group-hover:text-orange-500/10 transition-colors" size={64} />
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-12 px-4 md:px-0">
                {/* SALES REPORTS */}
                <div className="animate-fade-in-up delay-100">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-darkGray dark:text-white flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                            Sales & Revenue
                        </h2>
                        <div className="h-px bg-lightGray dark:bg-gray-800 flex-1 ml-6"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <ReportCard
                            title="Daily Sales Report"
                            desc="Detailed breakdown of sales by day. View transaction history."
                            icon={Calendar}
                            color="blue"
                            href="/shop/reports/sales"
                        />
                        <ReportCard
                            title="Top Selling Products"
                            desc="Identify your best performers."
                            icon={TrendingUp}
                            color="green"
                            href="/shop/reports/top-products"
                        />
                        <ReportCard
                            title="Sales by Category"
                            desc="Understand revenue by category."
                            icon={PieChart}
                            color="purple"
                            href="/shop/reports/categories"
                        />
                        <ReportCard
                            title="Customer Insights"
                            desc="Analyze customer spending habits."
                            icon={Users}
                            color="orange"
                            href="/shop/customers"
                        />
                    </div>
                </div>

                {/* INVENTORY & FINANCE */}
                <div className="animate-fade-in-up delay-200">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-darkGray dark:text-white flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-accent rounded-full"></div>
                            Inventory & Finance
                        </h2>
                        <div className="h-px bg-lightGray dark:bg-gray-800 flex-1 ml-6"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <ReportCard
                            title="Inventory Valuation"
                            desc="Current value of stock on hand."
                            icon={Package}
                            color="orange"
                            href="/shop/inventory"
                        />
                        <ReportCard
                            title="Low Stock Report"
                            desc="Items below minimum threshold."
                            icon={FileText}
                            color="blue"
                            href="/shop/reports/low-stock"
                        />
                        <ReportCard
                            title="Profit & Loss"
                            desc="Income vs expenses statement."
                            icon={LineChart}
                            color="green"
                            href="/shop/reports/finance"
                        />
                        <ReportCard
                            title="Balance Sheet"
                            desc="Assets, Liabilities, and Equity overview."
                            icon={Scale}
                            color="purple"
                            href="/shop/reports/balance-sheet"
                        />
                    </div>
                </div>

                {/* ACTIONS */}
                <div className="animate-fade-in-up delay-300">
                    <div className="bg-gradient-to-br from-primary/10 to-blue-600/5 border border-primary/10 rounded-[2.5rem] p-12 text-center relative overflow-hidden group hover:border-primary/20 transition-all duration-500">
                        <div className="relative z-10 flex flex-col items-center">
                            <h3 className="text-3xl font-black text-primary mb-4">Need a Custom Report?</h3>
                            <p className="text-mediumGray font-medium mb-10 max-w-lg text-lg">We can generate specific reports tailored to your business needs using our advanced data engine.</p>
                            <button className="px-10 py-4 bg-primary hover:bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center gap-2 transform hover:-translate-y-1">
                                Open Report Builder <ArrowUpRight size={20} />
                            </button>
                        </div>

                        {/* Background pattern */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                            <div className="absolute top-[-50%] left-[-10%] w-[600px] h-[600px] bg-primary rounded-full blur-[150px] group-hover:opacity-100 transition-opacity duration-700"></div>
                            <div className="absolute bottom-[-30%] right-[-10%] w-[500px] h-[500px] bg-accent rounded-full blur-[120px] opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
