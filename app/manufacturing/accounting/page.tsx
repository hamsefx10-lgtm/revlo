'use client';

import React, { useState, useEffect } from 'react';
import {
    DollarSign, TrendingUp, TrendingDown, CreditCard,
    Activity, ArrowUpRight, ArrowDownRight, Briefcase, Loader2
} from 'lucide-react';

export default function FactoryAccountingPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/manufacturing/accounting/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const revenue = stats?.totalRevenue || 0;
    const expenses = stats?.totalExpenses || 0;
    const profit = stats?.netProfit || 0;
    const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0.0';

    return (
        <div className="flex flex-col gap-6 p-2 lg:p-4 min-h-screen pb-20">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Financial Overview</h1>
                <p className="text-sm text-gray-500 font-medium">Profit & Loss, Cashflow, and Balance Sheet summary.</p>
            </div>

            {/* Big Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-[#3498DB] to-blue-600 p-6 rounded-2xl shadow-lg shadow-blue-500/20 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 transform scale-150 rotate-12">
                        <DollarSign size={100} />
                    </div>
                    <div className="relative z-10">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl w-fit mb-4">
                            <Briefcase size={24} className="text-white" />
                        </div>
                        <p className="text-sm font-medium text-blue-100 uppercase tracking-wider">Net Profit</p>
                        <p className="text-3xl font-black mt-1">
                            {loading ? <Loader2 className="animate-spin inline" size={24} /> : `$${profit.toLocaleString()}`}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-sm font-bold text-blue-100 bg-white/10 w-fit px-2 py-1 rounded-lg">
                            <Activity size={16} /> {loading ? '-' : `${margin}% Margin`}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl">
                            <ArrowUpRight size={24} />
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Revenue</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                            {loading ? '-' : `$${revenue.toLocaleString()}`}
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl">
                            <ArrowDownRight size={24} />
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Expenses</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                            {loading ? '-' : `$${expenses.toLocaleString()}`}
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                    {/* Placeholder for future metric like Cash on Hand if we track accounts */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl">
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Cash Flow</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                            {loading ? '-' : ((revenue - expenses) > 0 ? 'Positive' : 'Negative')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Recent Transactions / Ledger Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Recent Transactions</h3>
                    <div className="space-y-4">
                        {loading && <div className="text-center text-gray-400"><Loader2 className="animate-spin inline" /> Loading transactions...</div>}

                        {!loading && stats?.transactions.length === 0 && (
                            <div className="text-center p-4 text-gray-500 italic">No recent transactions found.</div>
                        )}

                        {!loading && stats?.transactions.map((tx: any, i: number) => {
                            const isIncome = tx.type === 'income';
                            return (
                                <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-xl transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${isIncome ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                            {isIncome ? <ArrowUpRight size={20} /> : <CreditCard size={20} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">{tx.description}</p>
                                            <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <p className={`font-black text-sm ${isIncome ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                                        {isIncome ? '+' : '-'}${tx.amount.toFixed(2)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Info</h3>
                    <p className="text-gray-500 text-sm">
                        This overview combines Sales revenue and all expenses (including Material Purchases and registered Expenses).
                    </p>
                </div>
            </div>
        </div>
    );
}
