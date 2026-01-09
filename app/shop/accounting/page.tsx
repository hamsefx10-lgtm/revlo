'use client';

import React, { useState } from 'react';
import {
    Plus,
    TrendingUp,
    TrendingDown,
    Download,
    ArrowUpRight,
    ArrowDownLeft,
    Wallet
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MetricCard from '@/components/shop/ui/MetricCard';

// --- TYPES ---
interface Transaction {
    id: string;
    description: string;
    type: 'Income' | 'Expense';
    category: string;
    amount: number;
    date: string;
    reference: string;
}

// --- DUMMY DATA ---
const TRANSACTIONS: Transaction[] = [
    { id: '1', description: 'Daily Sales - POS', type: 'Income', category: 'Sales', amount: 24500, date: '2024-01-07', reference: 'BATCH-001' },
    { id: '2', description: 'Restock Payment - Al-Nur', type: 'Expense', category: 'Inventory', amount: 12000, date: '2024-01-07', reference: 'PO-2024-001' },
    { id: '3', description: 'Shop Rent - January', type: 'Expense', category: 'Rent', amount: 8000, date: '2024-01-01', reference: 'RENT-JAN' },
    { id: '4', description: 'Electricity Bill', type: 'Expense', category: 'Utilities', amount: 1500, date: '2024-01-05', reference: 'UTIL-005' },
    { id: '5', description: 'Employee Salaries', type: 'Expense', category: 'Payroll', amount: 35000, date: '2024-01-01', reference: 'PAY-JAN' },
    { id: '6', description: 'Wholesale Order - Hotel', type: 'Income', category: 'Sales', amount: 18000, date: '2024-01-06', reference: 'INV-2024-002' },
];

const CHART_DATA = [
    { name: 'Mon', income: 4000, expense: 2400 },
    { name: 'Tue', income: 3000, expense: 1398 },
    { name: 'Wed', income: 2000, expense: 9800 },
    { name: 'Thu', income: 2780, expense: 3908 },
    { name: 'Fri', income: 1890, expense: 4800 },
    { name: 'Sat', income: 2390, expense: 3800 },
    { name: 'Sun', income: 3490, expense: 4300 },
];

export default function AccountingPage() {
    const [filter, setFilter] = useState<'All' | 'Income' | 'Expense'>('All');

    const filteredData = TRANSACTIONS.filter(t => filter === 'All' || t.type === filter);

    // Stats
    const totalIncome = TRANSACTIONS.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = TRANSACTIONS.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
    const netProfit = totalIncome - totalExpense;

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-[#3498DB]">
                            <Wallet size={28} />
                        </div>
                        Accounting & Finance
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">Track income, expenses, and financial health.</p>
                </div>

                <div className="flex gap-3">
                    <button className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2">
                        <Download size={18} /> Financial Report
                    </button>
                    <button className="px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold shadow-lg hover:opacity-90 transition-all flex items-center gap-2">
                        <Plus size={18} /> Record Transaction
                    </button>
                </div>
            </div>

            {/* STATS OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Income */}
                <MetricCard
                    label="Total Income"
                    value={`ETB ${totalIncome.toLocaleString()}`}
                    trend="12%"
                    isPositive={true}
                    icon={TrendingUp}
                    variant="accent" // Accent roughly maps to Green/Positive in our logic or can use custom
                />

                {/* Expense */}
                <MetricCard
                    label="Total Expenses"
                    value={`ETB ${totalExpense.toLocaleString()}`}
                    trend="5%"
                    isPositive={false}
                    icon={TrendingDown}
                    variant="danger"
                />

                {/* NET PROFIT */}
                <div className="bg-[#2ECC71] p-6 rounded-[2rem] shadow-xl shadow-green-500/20 relative overflow-hidden text-white group">
                    <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-black/10 rounded-full blur-3xl"></div>

                    <p className="text-green-100 text-xs font-bold uppercase tracking-wider mb-2 relative z-10">Net Profit</p>
                    <h2 className="text-4xl font-black text-white mb-2 relative z-10">ETB {netProfit.toLocaleString()}</h2>
                    <p className="text-green-100 text-sm font-medium relative z-10 opacity-80">This is a healthy margin.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* CHART */}
                <div className="lg:col-span-2 bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cash Flow</h3>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1 text-xs font-bold text-[#2ECC71]"><div className="w-2 h-2 rounded-full bg-[#2ECC71]"></div> Income</span>
                            <span className="flex items-center gap-1 text-xs font-bold text-red-400"><div className="w-2 h-2 rounded-full bg-red-400"></div> Expense</span>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={CHART_DATA}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2ECC71" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#2ECC71" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" strokeOpacity={0.5} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="income" stroke="#2ECC71" strokeWidth={3} fill="url(#colorIncome)" />
                                <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={3} fill="url(#colorExpense)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* LEDGER / TRANSACTIONS LIST */}
                <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Ledger</h3>
                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                            {['All', 'Income', 'Expense'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setFilter(tab as any)}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filter === tab ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar max-h-[400px]">
                        {filteredData.map(t => (
                            <div key={t.id} className="flex items-center justify-between p-3 mb-2 rounded-xl border border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${t.type === 'Income' ? 'bg-[#2ECC71]/10 text-[#2ECC71]' : 'bg-red-500/10 text-red-500'}`}>
                                        {t.type === 'Income' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">{t.description}</p>
                                        <p className="text-xs text-gray-500">{t.category} • {t.date}</p>
                                    </div>
                                </div>
                                <span className={`font-black text-sm ${t.type === 'Income' ? 'text-[#2ECC71]' : 'text-gray-900 dark:text-white'}`}>
                                    {t.type === 'Income' ? '+' : '-'} {t.amount.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 text-center">
                        <button className="text-sm font-bold text-[#3498DB] hover:underline">View All Transactions</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
