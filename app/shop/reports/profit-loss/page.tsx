'use client';

import React, { useEffect, useState } from 'react';
import {
    ArrowLeft, TrendingUp, TrendingDown, DollarSign, ShoppingCart,
    Minus, BarChart3, Loader2, ChevronDown, ChevronUp, Calendar,
    ArrowUpRight, ArrowDownRight, Package, Receipt, Wallet
} from 'lucide-react';
import Link from 'next/link';

const fmt = (v: number) => {
    const abs = Math.abs(v);
    const str = abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return v < 0 ? `(${str})` : str;
};

const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;

function PLLine({ label, value, indent, bold, negative, sub, icon: Icon }: {
    label: string; value: number; indent?: boolean; bold?: boolean; negative?: boolean; sub?: boolean;
    icon?: any;
}) {
    const isNeg = value < 0 || negative;
    return (
        <div className={`flex items-center justify-between py-2.5 ${indent ? 'pl-6' : ''} ${bold ? 'border-t border-slate-200 dark:border-slate-700 pt-3 mt-1' : ''} ${sub ? 'py-1.5' : ''}`}>
            <div className="flex items-center gap-2">
                {Icon && <Icon size={sub ? 12 : 14} className="text-slate-400" />}
                <span className={`${bold ? 'font-black text-sm' : sub ? 'text-[10px] text-slate-400' : 'text-xs font-semibold text-slate-600 dark:text-slate-300'}`}>
                    {label}
                </span>
            </div>
            <span className={`tabular-nums ${bold ? 'font-black text-sm' : sub ? 'text-[10px] font-bold' : 'text-xs font-bold'} ${isNeg ? 'text-rose-500' : bold ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                {negative ? `-${fmt(Math.abs(value))}` : fmt(value)}
            </span>
        </div>
    );
}

function TrendBadge({ value, label }: { value: number; label: string }) {
    const up = value >= 0;
    return (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${up ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'}`}>
            {up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {fmtPct(value)} {label}
        </div>
    );
}

export default function ProfitLossPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [period, setPeriod] = useState('month');
    const [showExpenses, setShowExpenses] = useState(true);

    const fetchData = async (p: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/shop/reports/profit-loss?period=${p}`);
            if (res.ok) setData(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(period); }, [period]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    if (!data) return <div className="min-h-screen flex items-center justify-center text-gray-500">Failed to load</div>;

    const periodLabels: Record<string, string> = {
        month: 'Bishan',
        quarter: 'Rubuckan',
        year: 'Sanadkan',
    };

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-5xl mx-auto p-4 md:p-8">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/shop/reports" className="text-gray-400 hover:text-[#3498DB] transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                            <ArrowLeft size={14} /> Warbixinyada
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
                            <BarChart3 size={28} />
                        </div>
                        Profit & Loss Statement
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm font-medium">
                        Dakhliga, Kharashaadka & Faa'iidada — {periodLabels[period] || period}
                    </p>
                </div>

                {/* Period Selector */}
                <div className="flex gap-2">
                    {['month', 'quarter', 'year'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${period === p
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            {p === 'month' ? 'Bishii' : p === 'quarter' ? 'Rubuc' : 'Sannad'}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {/* Revenue */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-[2rem] text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    <div className="relative z-10">
                        <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mb-1">Dakhliga Guud</p>
                        <h2 className="text-2xl font-black">ETB {fmt(data.revenue.netRevenue)}</h2>
                        <TrendBadge value={data.trends.revenueGrowth} label="vs last" />
                    </div>
                </div>

                {/* COGS */}
                <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <Package size={14} className="text-orange-400" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">COGS</p>
                    </div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white">ETB {fmt(data.costOfGoodsSold.total)}</h2>
                </div>

                {/* Gross Profit */}
                <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp size={14} className="text-blue-400" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Faa'iido Guud</p>
                    </div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white">ETB {fmt(data.grossProfit.value)}</h2>
                    <span className="text-[10px] font-bold text-blue-500">{data.grossProfit.margin.toFixed(1)}% margin</span>
                </div>

                {/* Net Profit */}
                <div className={`p-5 rounded-[2rem] shadow-xl relative overflow-hidden ${data.netProfit.afterTax >= 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20 text-white' : 'bg-gradient-to-br from-rose-500 to-red-600 shadow-red-500/20 text-white'}`}>
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    <div className="relative z-10">
                        <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">Faa'iido Saafi</p>
                        <h2 className="text-2xl font-black">ETB {fmt(data.netProfit.afterTax)}</h2>
                        <span className="text-[10px] font-bold text-white/80">{data.netProfit.margin.toFixed(1)}% net margin</span>
                    </div>
                </div>
            </div>

            {/* P&L STATEMENT */}
            <div className="bg-white/80 dark:bg-[#161B2E]/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/80 rounded-[2rem] p-6 md:p-8 shadow-sm">

                {/* Period */}
                <div className="flex items-center gap-2 mb-6 text-xs text-slate-400 font-bold">
                    <Calendar size={14} />
                    {new Date(data.period.start).toLocaleDateString()} — {new Date(data.period.end).toLocaleDateString()}
                </div>

                {/* ═══ REVENUE ═══ */}
                <div className="mb-1">
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> DAKHLIGA (REVENUE)
                    </p>
                    <PLLine label="Gross Revenue (Dakhli Wadarta)" value={data.revenue.grossRevenue} indent icon={DollarSign} />
                    {data.revenue.salesReturns > 0 && (
                        <PLLine label="Less: Returns & Allowances" value={data.revenue.salesReturns} indent negative />
                    )}
                    <PLLine label="NET REVENUE" value={data.revenue.netRevenue} bold />
                </div>

                {/* ═══ COGS ═══ */}
                <div className="mb-1 mt-4">
                    <p className="text-[9px] font-black text-orange-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500" /> QIIMAHA ALAABTA (COGS)
                    </p>
                    <PLLine label="Cost of Goods Sold" value={data.costOfGoodsSold.total} indent negative icon={Package} />
                </div>

                {/* ═══ GROSS PROFIT ═══ */}
                <div className="bg-slate-50 dark:bg-slate-800/20 rounded-xl p-3 mb-4 mt-2">
                    <PLLine label={`GROSS PROFIT (${data.grossProfit.margin.toFixed(1)}%)`} value={data.grossProfit.value} bold />
                </div>

                {/* ═══ OPERATING EXPENSES ═══ */}
                <div className="mb-1">
                    <button
                        onClick={() => setShowExpenses(!showExpenses)}
                        className="w-full flex items-center justify-between text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] mb-2 hover:text-rose-600 transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500" /> KHARASHAADKA HAWLAHA (OPERATING EXPENSES)
                        </span>
                        {showExpenses ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {showExpenses && (
                        <div className="ml-4 space-y-0">
                            {data.operatingExpenses.categories.map((cat: any) => (
                                <PLLine key={cat.name} label={cat.name} value={cat.amount} indent sub icon={Receipt} />
                            ))}
                        </div>
                    )}
                    <PLLine label="TOTAL OPERATING EXPENSES" value={data.operatingExpenses.total} bold />
                </div>

                {/* ═══ OPERATING INCOME ═══ */}
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3 mb-4 mt-2">
                    <PLLine label="OPERATING INCOME" value={data.operatingIncome.value} bold />
                </div>

                {/* ═══ OTHER INCOME/EXPENSES ═══ */}
                {(data.otherIncomeExpenses.otherIncome > 0 || data.otherIncomeExpenses.otherExpenses > 0) && (
                    <div className="mb-4">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-400" /> DAKHLI/KHARASH KALE
                        </p>
                        {data.otherIncomeExpenses.otherIncome > 0 && (
                            <PLLine label="Other Income" value={data.otherIncomeExpenses.otherIncome} indent icon={Wallet} />
                        )}
                        {data.otherIncomeExpenses.otherExpenses > 0 && (
                            <PLLine label="Other Expenses" value={data.otherIncomeExpenses.otherExpenses} indent negative icon={Minus} />
                        )}
                    </div>
                )}

                {/* ═══ NET PROFIT ═══ */}
                <div className={`rounded-xl p-4 mt-2 ${data.netProfit.afterTax >= 0 ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10' : 'bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-900/10 dark:to-red-900/10'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${data.netProfit.afterTax >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                {data.netProfit.afterTax >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase">NET PROFIT (FAA'IIDO SAAFI)</p>
                                <p className="text-[10px] text-slate-400 font-bold">{data.netProfit.margin.toFixed(1)}% net margin</p>
                            </div>
                        </div>
                        <p className={`text-xl font-black ${data.netProfit.afterTax >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            ETB {fmt(data.netProfit.afterTax)}
                        </p>
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <div className="mt-6 p-4 bg-slate-900 dark:bg-slate-950 rounded-2xl flex items-center justify-between text-white/60 text-[10px] font-bold">
                <span>INCOME STATEMENT — {data.revenue.salesCount} Sales, {data.operatingExpenses.count} Expenses</span>
                <span>Revlo Shop System — Accrual Basis</span>
            </div>
        </div>
    );
}
