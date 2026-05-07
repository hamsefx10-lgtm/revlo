'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Receipt, TrendingDown, Filter, Download, PieChart } from 'lucide-react';
import { format, subDays } from 'date-fns';
import UltraIcon from '@/components/shop/ui/UltraIcon';

export default function ExpenseReportPage() {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('30days');
    const [categoryFilter, setCategoryFilter] = useState('All');

    useEffect(() => { fetchExpenses(); }, [dateRange]);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/shop/expenses');
            const data = await res.json();
            setExpenses(data.expenses || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Filter by date
    const now = new Date();
    const fromDate = dateRange === '7days' ? subDays(now, 7) : dateRange === '30days' ? subDays(now, 30) : dateRange === '90days' ? subDays(now, 90) : new Date(0);
    const filtered = expenses
        .filter(e => new Date(e.transactionDate || e.createdAt) >= fromDate)
        .filter(e => categoryFilter === 'All' || e.category === categoryFilter);

    // Category breakdown
    const categoryMap: Record<string, number> = {};
    filtered.forEach(e => {
        const cat = e.category || 'Kale';
        categoryMap[cat] = (categoryMap[cat] || 0) + Number(e.amount);
    });
    const categories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
    const totalExpenses = filtered.reduce((s, e) => s + Number(e.amount), 0);

    const categoryColors = ['bg-rose-500', 'bg-amber-500', 'bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500'];

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-7xl mx-auto p-4 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/shop/reports" className="p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-rose-500 transition-all shadow-sm">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                            <UltraIcon icon={Receipt} variant="danger" />
                            Warbixinta Kharashaadka
                        </h1>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Expense Report — Kharashaadka oo kala saaran</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="bg-white dark:bg-gray-900 p-1.5 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center">
                        {['7days','30days','90days','all'].map(r => (
                            <button key={r} onClick={() => setDateRange(r)} className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${dateRange === r ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' : 'text-gray-400 hover:text-gray-600'}`}>
                                {r === '7days' ? '7 Maalmood' : r === '30days' ? '30 Maalmood' : r === '90days' ? '3 Bilood' : 'Dhammaantii'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-rose-500" size={40} /></div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-[2rem] p-8 text-white shadow-xl shadow-rose-500/20">
                            <p className="text-rose-100 text-[10px] font-black uppercase tracking-widest mb-2">Wadarta Kharashaadka</p>
                            <h3 className="text-4xl font-black">{totalExpenses.toLocaleString()} <span className="text-lg opacity-60">ETB</span></h3>
                            <p className="text-rose-200 text-xs mt-2">{filtered.length} kharash oo la diiwaangeliyay</p>
                        </div>
                        <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Qaybaha Kharashaadka</p>
                            <h3 className="text-4xl font-black text-gray-900 dark:text-white">{categories.length}</h3>
                            <p className="text-gray-400 text-xs mt-2">Noocyada kala duwan</p>
                        </div>
                        <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Celceliska Maalinlaha</p>
                            <h3 className="text-4xl font-black text-gray-900 dark:text-white">
                                {Math.round(totalExpenses / Math.max(1, dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90)).toLocaleString()} <span className="text-lg opacity-40">ETB</span>
                            </h3>
                        </div>
                    </div>

                    {/* Category Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
                            <h3 className="font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <PieChart size={18} className="text-rose-500" /> Qaybinta Qaybaha
                            </h3>
                            <div className="space-y-4">
                                {categories.map(([cat, amount], i) => {
                                    const pct = totalExpenses > 0 ? (amount / totalExpenses * 100) : 0;
                                    return (
                                        <div key={cat}>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{cat}</span>
                                                <span className="text-sm font-black text-gray-900 dark:text-white">{amount.toLocaleString()} ETB <span className="text-[10px] text-gray-400 ml-1">({pct.toFixed(1)}%)</span></span>
                                            </div>
                                            <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${categoryColors[i % categoryColors.length]} transition-all duration-700`} style={{ width: `${pct}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {categories.length === 0 && <p className="text-gray-400 text-sm italic">Ma jiraan kharashyo</p>}
                            </div>
                        </div>

                        {/* Recent Expenses */}
                        <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
                            <h3 className="font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <TrendingDown size={18} className="text-rose-500" /> Kharashaadyadii Ugu Dambeeyay
                            </h3>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {filtered.slice(0, 20).map(e => (
                                    <div key={e.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <div>
                                            <p className="font-bold text-sm text-gray-900 dark:text-white">{e.description || e.category}</p>
                                            <p className="text-[10px] text-gray-400 font-bold">{e.category} • {format(new Date(e.transactionDate || e.createdAt), 'dd MMM yyyy')}</p>
                                        </div>
                                        <span className="font-black text-rose-600 text-sm">-{Number(e.amount).toLocaleString()} ETB</span>
                                    </div>
                                ))}
                                {filtered.length === 0 && <p className="text-gray-400 text-sm italic text-center py-8">Wax kharash ah lama helin</p>}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
