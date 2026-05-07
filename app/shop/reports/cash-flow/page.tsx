'use client';

import React, { useEffect, useState } from 'react';
import {
    ArrowLeft, ArrowUpRight, ArrowDownRight, Banknote, Loader2,
    Calendar, TrendingUp, TrendingDown, Wallet, Package,
    Landmark, Users, ChevronDown, ChevronUp, DollarSign
} from 'lucide-react';
import Link from 'next/link';

const fmt = (v: number) => {
    const abs = Math.abs(v);
    const str = abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return v < 0 ? `(${str})` : str;
};

function FlowSection({ title, icon: Icon, color, items, net, defaultOpen = true }: {
    title: string; icon: any; color: string; items: any[]; net: number; defaultOpen?: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="mb-6">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between mb-3 group"
            >
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${color}`} />
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">{title}</span>
                </div>
                {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
            </button>

            {open && (
                <div className="space-y-1 ml-4">
                    {items.map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                            <div className="flex items-center gap-2">
                                {item.value >= 0 ? (
                                    <ArrowUpRight size={12} className="text-emerald-500" />
                                ) : (
                                    <ArrowDownRight size={12} className="text-rose-500" />
                                )}
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{item.label}</span>
                            </div>
                            <span className={`text-xs font-bold tabular-nums ${item.value >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                {item.value >= 0 ? '+' : ''}{fmt(item.value)}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between py-2.5 mt-1 border-t-2 border-slate-200 dark:border-slate-700">
                <span className="text-xs font-black text-slate-800 dark:text-white uppercase">Net {title.split('(')[0].trim()}</span>
                <span className={`text-sm font-black tabular-nums ${net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    ETB {net >= 0 ? '+' : ''}{fmt(net)}
                </span>
            </div>
        </div>
    );
}

export default function CashFlowPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [period, setPeriod] = useState('month');

    const fetchData = async (p: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/shop/reports/cash-flow?period=${p}`);
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

    const netChange = data.summary.netChange;

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
                        <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl text-white shadow-lg shadow-cyan-500/20">
                            <Banknote size={28} />
                        </div>
                        Cash Flow Statement
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm font-medium">
                        Socodka Lacagta — Meesha ay ka timaado, meesha ay ku baxdo
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Net Change */}
                <div className={`p-6 rounded-[2rem] shadow-xl relative overflow-hidden text-white ${netChange >= 0 ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20' : 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/20'}`}>
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    <div className="relative z-10">
                        <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-1">Isbeddel Saafi</p>
                        <h2 className="text-2xl font-black flex items-center gap-2">
                            {netChange >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                            ETB {fmt(netChange)}
                        </h2>
                        <p className="text-white/60 text-[10px] font-medium mt-1">Net Cash Change</p>
                    </div>
                </div>

                {/* Beginning Cash */}
                <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Wallet size={14} className="text-slate-400" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bilowga Mudada</p>
                    </div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white">ETB {fmt(data.summary.beginningCash)}</h2>
                    <p className="text-[10px] text-slate-400 font-medium">Opening Balance</p>
                </div>

                {/* Ending Cash */}
                <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign size={14} className="text-emerald-500" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dhammaadka Mudada</p>
                    </div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white">ETB {fmt(data.summary.endingCash)}</h2>
                    <p className="text-[10px] text-slate-400 font-medium">Ending Balance</p>
                </div>
            </div>

            {/* CASH FLOW STATEMENT */}
            <div className="bg-white/80 dark:bg-[#161B2E]/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/80 rounded-[2rem] p-6 md:p-8 shadow-sm">

                {/* Period */}
                <div className="flex items-center gap-2 mb-6 text-xs text-slate-400 font-bold">
                    <Calendar size={14} />
                    {new Date(data.period.start).toLocaleDateString()} — {new Date(data.period.end).toLocaleDateString()}
                </div>

                {/* A. Operating */}
                <FlowSection
                    title="HAWLAHA SHAQO (Operating Activities)"
                    icon={Wallet}
                    color="bg-emerald-500"
                    items={data.operating.items}
                    net={data.operating.net}
                />

                {/* B. Investing */}
                <FlowSection
                    title="MAALGASHIGA (Investing Activities)"
                    icon={Package}
                    color="bg-blue-500"
                    items={data.investing.items}
                    net={data.investing.net}
                />

                {/* C. Financing */}
                <FlowSection
                    title="MAALGELINTA (Financing Activities)"
                    icon={Users}
                    color="bg-purple-500"
                    items={data.financing.items}
                    net={data.financing.net}
                    defaultOpen={data.financing.items.length > 0}
                />

                {/* NET CHANGE */}
                <div className={`rounded-xl p-5 mt-4 ${netChange >= 0 ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-200 dark:border-emerald-900/30' : 'bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-900/10 dark:to-red-900/10 border border-rose-200 dark:border-rose-900/30'}`}>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">Lacagta Bilowga</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300 tabular-nums">ETB {fmt(data.summary.beginningCash)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">± Isbeddelka Saafiga</span>
                            <span className={`font-bold tabular-nums ${netChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {netChange >= 0 ? '+' : ''}{fmt(netChange)}
                            </span>
                        </div>
                        <div className="border-t-2 border-slate-200 dark:border-slate-700 pt-2 mt-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg ${netChange >= 0 ? 'bg-emerald-500' : 'bg-rose-500'} text-white`}>
                                        <Banknote size={14} />
                                    </div>
                                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase">Lacagta Dhammaadka</span>
                                </div>
                                <span className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                                    ETB {fmt(data.summary.endingCash)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ACCOUNTS BREAKDOWN */}
            {data.accounts && data.accounts.length > 0 && (
                <div className="mt-6 bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 shadow-sm">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Landmark size={16} className="text-slate-400" /> Accounts-ka Lacagta
                    </h3>
                    <div className="space-y-2">
                        {data.accounts.map((acc: any, i: number) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                        <Wallet size={14} className="text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white">{acc.name}</p>
                                        {acc.currency === 'USD' && (
                                            <p className="text-[9px] text-slate-400 font-medium">USD {acc.rawBalance.toLocaleString()}</p>
                                        )}
                                    </div>
                                </div>
                                <span className="text-xs font-black text-slate-700 dark:text-slate-200 tabular-nums">
                                    ETB {acc.balance.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* FOOTER */}
            <div className="mt-6 p-4 bg-slate-900 dark:bg-slate-950 rounded-2xl flex items-center justify-between text-white/60 text-[10px] font-bold">
                <span>CASH FLOW STATEMENT — Direct Method</span>
                <span>Revlo Shop System</span>
            </div>
        </div>
    );
}
