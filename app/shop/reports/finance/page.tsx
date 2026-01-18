'use client';

import React, { useState, useEffect } from 'react';
import {
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    PieChart,
    Download,
    TrendingUp,
    TrendingDown,
    Activity,
    Package
} from 'lucide-react';
import { format, subDays, startOfMonth, startOfYear } from 'date-fns';
import { Loader2 } from 'lucide-react';

export default function FinancialReportPage() {
    const [dateRange, setDateRange] = useState('This Month');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    // Initial Date Setup
    useEffect(() => {
        handleRangeChange('This Month');
    }, []);

    const handleRangeChange = (range: string) => {
        setDateRange(range);
        const now = new Date();
        let start = now;

        switch (range) {
            case 'Today':
                start = now;
                break;
            case 'Last 7 Days':
                start = subDays(now, 7);
                break;
            case 'This Month':
                start = startOfMonth(now);
                break;
            case 'This Year':
                start = startOfYear(now);
                break;
        }

        setStartDate(start.toISOString());
        setEndDate(now.toISOString());
    };

    // Fetch Report
    useEffect(() => {
        if (startDate && endDate) fetchReport();
    }, [startDate, endDate]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/shop/reports/finance?startDate=${startDate}&endDate=${endDate}`);
            if (res.ok) {
                setData(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!startDate) return null;

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-7xl mx-auto md:p-8">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-4 md:px-0">
                <div>
                    <h1 className="text-3xl font-black text-darkGray dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-lightGray dark:border-gray-700 text-primary">
                            <PieChart size={28} />
                        </div>
                        Financial Overview
                    </h1>
                    <p className="text-mediumGray mt-2 ml-1 text-sm font-medium">Profit & Loss, Expense Breakdown and Cash Flow.</p>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-1.5 rounded-xl border border-lightGray dark:border-gray-800 shadow-sm self-start md:self-auto overflow-x-auto max-w-full">
                    {['Today', 'Last 7 Days', 'This Month', 'This Year'].map((range) => (
                        <button
                            key={range}
                            onClick={() => handleRangeChange(range)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${dateRange === range
                                ? 'bg-primary text-white shadow-md shadow-primary/30'
                                : 'text-mediumGray hover:text-darkGray dark:hover:text-white hover:bg-lightGray dark:hover:bg-gray-800'
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-900 rounded-[2rem] border border-lightGray dark:border-gray-800 mx-4 md:mx-0">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                </div>
            ) : data ? (
                <div className="space-y-6 px-4 md:px-0 animate-fade-in-up">
                    {/* KEY METRICS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-lightGray dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600">
                                    <ArrowUpRight size={20} />
                                </div>
                                <span className="text-xs font-black text-mediumGray uppercase tracking-wider">Total Revenue</span>
                            </div>
                            <p className="text-3xl font-black text-darkGray dark:text-white">ETB {data.stats.totalIncome.toLocaleString()}</p>
                            <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
                                <Activity size={12} /> {data.stats.salesCount} Sales Transactions
                            </p>
                        </div>

                        <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-lightGray dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600">
                                    <ArrowDownRight size={20} />
                                </div>
                                <span className="text-xs font-black text-mediumGray uppercase tracking-wider">Total Expenses</span>
                            </div>
                            <p className="text-3xl font-black text-darkGray dark:text-white">ETB {data.stats.totalExpenses.toLocaleString()}</p>
                            <p className="text-xs text-red-500 font-bold mt-2">Includes Purchasing & Overheads</p>
                        </div>

                        <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-lightGray dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600">
                                    <Package size={20} />
                                </div>
                                <span className="text-xs font-black text-mediumGray uppercase tracking-wider">Cost of Goods</span>
                            </div>
                            <p className="text-3xl font-black text-darkGray dark:text-white">ETB {data.stats.totalCOGS.toLocaleString()}</p>
                            <p className="text-xs text-orange-600 font-bold mt-2">Product Cost of Sold Items</p>
                        </div>

                        <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-lightGray dark:border-gray-800 shadow-sm ring-1 ring-primary/10 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600">
                                    <DollarSign size={20} />
                                </div>
                                <span className="text-xs font-black text-mediumGray uppercase tracking-wider">Gross Profit</span>
                            </div>
                            <p className="text-3xl font-black text-blue-600 dark:text-blue-400">ETB {data.stats.grossProfit.toLocaleString()}</p>
                            <p className="text-xs text-blue-500 font-bold mt-2">
                                Margin: {data.stats.totalIncome > 0 ? ((data.stats.grossProfit / data.stats.totalIncome) * 100).toFixed(1) : 0}%
                            </p>
                        </div>
                    </div>

                    {/* DETAILS GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Expense Breakdown */}
                        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-lightGray dark:border-gray-800 shadow-sm h-full">
                            <h3 className="font-black text-lg text-darkGray dark:text-white mb-6 uppercase tracking-tight flex items-center gap-2">
                                <PieChart size={20} className="text-primary" /> Expense Breakdown
                            </h3>
                            <div className="space-y-4">
                                {Object.entries(data.expensesByCategory).map(([cat, amt]: [string, any]) => (
                                    <div key={cat} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-100 dark:ring-red-900/30"></div>
                                            <span className="font-bold text-darkGray dark:text-gray-300">{cat}</span>
                                        </div>
                                        <span className="font-black text-darkGray dark:text-white">ETB {Number(amt).toLocaleString()}</span>
                                    </div>
                                ))}
                                {Object.keys(data.expensesByCategory).length === 0 && (
                                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                        <p className="text-mediumGray font-bold text-sm">No expenses recorded for this period</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Net Profit Summary */}
                        <div className="bg-gradient-to-br from-darkGray to-gray-900 text-white p-8 rounded-[2rem] shadow-xl flex flex-col justify-center relative overflow-hidden min-h-[300px]">
                            <div className="absolute top-0 right-0 p-10 opacity-5 transform translate-x-10 -translate-y-10 pointer-events-none">
                                <TrendingUp size={200} />
                            </div>

                            <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest mb-2 z-10">Net Cash Flow</h3>
                            <p className="text-sm text-gray-400 mb-8 max-w-xs font-medium z-10 relative">Total Income minus Total Expenses (including purchases made in this period).</p>

                            <div className="flex items-baseline gap-2 z-10 relative">
                                <span className={`text-5xl font-black ${data.stats.netProfit >= 0 ? 'text-secondary' : 'text-red-500'}`}>
                                    {data.stats.netProfit >= 0 ? '+' : ''} ETB {Math.abs(data.stats.netProfit).toLocaleString()}
                                </span>
                            </div>

                            <div className="mt-8 pt-8 border-t border-gray-700 grid grid-cols-2 gap-4 z-10 relative">
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Total In</p>
                                    <p className="text-xl font-black text-white">ETB {data.stats.totalIncome.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Total Out</p>
                                    <p className="text-xl font-black text-white">ETB {data.stats.totalExpenses.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
