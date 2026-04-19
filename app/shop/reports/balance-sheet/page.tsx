'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Scale, ArrowLeft, Download, RefreshCw, Wallet, Package,
    TrendingUp, TrendingDown, AlertCircle, CheckCircle2,
    ChevronRight, Loader2, Building2, Users, BarChart3,
    CircleDollarSign, Landmark, PieChart, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────
interface BalanceData {
    asOf: string;
    isBalanced: boolean;
    difference: number;
    assets: {
        current: {
            cashAndBank: { value: number; breakdown: any[] };
            accountsReceivable: { value: number; count: number };
            inventory: { value: number; skuCount: number; breakdown: any[] };
        };
        fixed: { value: number; count: number };
        totalCurrent: number;
        totalFixed: number;
        total: number;
    };
    liabilities: {
        current: {
            accountsPayable: { value: number; count: number };
            taxPayable: { value: number };
            pendingDividends: { value: number };
        };
        longTerm: { value: number };
        totalCurrent: number;
        totalLongTerm: number;
        total: number;
    };
    equity: {
        shareholdersCapital: { value: number; shareholders: any[] };
        dividendsPaid: { value: number };
        retainedEarnings: { value: number; breakdown: any };
        total: number;
    };
    summary: {
        totalAssets: number;
        totalLiabilitiesAndEquity: number;
        grossProfit: number;
        netProfit: number;
        debtRatio: number;
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number) => {
    const abs = Math.abs(v);
    const str = abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return v < 0 ? `(${str})` : str;
};
const fmtK = (v: number) => {
    if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1_000) return `${(Math.abs(v) / 1_000).toFixed(0)}K`;
    return fmt(v);
};

// ─── Sub-Components ───────────────────────────────────────────────────────────
function SectionHeader({ num, label, color }: { num: string; label: string; color: string }) {
    return (
        <div className={`flex items-center gap-3 mb-6`}>
            <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center text-white text-xs font-black flex-shrink-0`}>
                {num}
            </div>
            <h2 className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-[0.25em]">{label}</h2>
        </div>
    );
}

function LineItem({
    label, value, bold = false, indent = false, negative = false, link, badge
}: {
    label: string; value: number; bold?: boolean; indent?: boolean; negative?: boolean; link?: string; badge?: string;
}) {
    const displayValue = fmt(negative ? -Math.abs(value) : value);
    const valueColor = negative ? 'text-rose-500' : bold ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300';

    return (
        <div className={`flex items-center justify-between py-2 group ${indent ? 'pl-4' : ''} ${bold ? 'border-t border-slate-100 dark:border-slate-800 mt-1 pt-3' : ''}`}>
            <div className="flex items-center gap-2">
                {indent && <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 flex-shrink-0" />}
                <span className={`text-xs ${bold ? 'font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider' : 'font-medium text-slate-600 dark:text-slate-400'}`}>
                    {label}
                </span>
                {badge && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {badge}
                    </span>
                )}
            </div>
            {link ? (
                <Link href={link} className={`text-sm tabular-nums font-black ${bold ? '' : 'text-[#3498DB] hover:underline'} flex items-center gap-1 group-hover:text-[#3498DB] transition-colors`}>
                    {displayValue}
                    <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
            ) : (
                <span className={`text-sm tabular-nums font-black ${valueColor}`}>{displayValue}</span>
            )}
        </div>
    );
}

function TotalBar({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className={`flex items-center justify-between p-4 px-5 rounded-2xl ${color} mt-4`}>
            <span className="text-xs font-black uppercase tracking-widest opacity-80">{label}</span>
            <span className="text-xl font-black tabular-nums">{fmt(value)}</span>
        </div>
    );
}

function SummaryCard({ label, value, icon: Icon, trend, color }: {
    label: string; value: number; icon: any; trend?: 'up' | 'down'; color: string;
}) {
    return (
        <div className="bg-white/70 dark:bg-[#161B2E]/70 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/80 rounded-[1.5rem] p-4 shadow-sm hover:shadow-md transition-all">
            <div className={`w-8 h-8 ${color} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={16} className="text-white" />
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{fmtK(value)}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{label}</p>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BalanceSheetPage() {
    const [data, setData] = useState<BalanceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [expandedSections, setExpandedSections] = useState<string[]>([]);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const res = await window.fetch(`/api/shop/reports/balance-sheet?date=${dateFilter}`);
            const json = await res.json();
            if (!res.ok) { toast.error(json.error || 'API error'); return; }
            setData(json);
        } catch { toast.error('Failed to load balance sheet'); }
        finally { setLoading(false); }
    }, [dateFilter]);

    useEffect(() => { fetch(); }, [fetch]);

    const toggleSection = (key: string) =>
        setExpandedSections(p => p.includes(key) ? p.filter(x => x !== key) : [...p, key]);

    const handlePrint = () => window.print();

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-[#3498DB]/20 border-t-[#3498DB] animate-spin" />
                <Scale size={24} className="text-[#3498DB] absolute inset-0 m-auto" />
            </div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Generating Balance Sheet…</p>
        </div>
    );

    if (!data) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <AlertCircle size={40} className="text-rose-400 mx-auto mb-3" />
                <p className="font-bold text-slate-600">Failed to load. Check API logs.</p>
                <button onClick={fetch} className="mt-4 px-5 py-2.5 rounded-xl bg-[#3498DB] text-white font-bold text-sm">Retry</button>
            </div>
        </div>
    );

    const summaryCards = [
        { label: 'Total Assets', value: data.assets.total, icon: Wallet, color: 'bg-emerald-500' },
        { label: 'Total Liabilities', value: data.liabilities.total, icon: Landmark, color: 'bg-rose-500' },
        { label: 'Net Worth (Equity)', value: data.equity.total, icon: BarChart3, color: 'bg-[#3498DB]' },
        { label: 'Net Profit', value: data.summary.netProfit, icon: TrendingUp, color: data.summary.netProfit >= 0 ? 'bg-emerald-500' : 'bg-amber-500' },
    ];

    return (
        <div className="min-h-screen font-sans pb-24 animate-fade-in print:bg-white print:text-black">

            {/* ── TOP HEADER ───────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 print:hidden">
                <div className="flex items-center gap-4">
                    <Link href="/shop/reports" className="p-2.5 rounded-xl bg-white dark:bg-[#161B2E] border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-[#3498DB] hover:border-[#3498DB]/30 transition-all shadow-sm">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Balance Sheet</h1>
                        <p className="text-xs text-slate-500 mt-0.5">As of {format(new Date(data.asOf), 'MMMM d, yyyy')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={e => setDateFilter(e.target.value)}
                        className="px-4 py-2.5 text-xs rounded-xl bg-white dark:bg-[#161B2E] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium outline-none focus:border-[#3498DB]/40 transition-all shadow-sm"
                    />
                    <button onClick={fetch} className="p-2.5 rounded-xl bg-white dark:bg-[#161B2E] border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-[#3498DB] transition-all shadow-sm">
                        <RefreshCw size={16} />
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs shadow-md hover:opacity-90 transition-all">
                        <Download size={14} /> PDF
                    </button>
                </div>
            </div>

            {/* ── BALANCE STATUS ───────────────────────────── */}
            <div className={`mb-6 p-4 rounded-2xl flex items-center justify-between border ${data.isBalanced
                ? 'bg-emerald-50/70 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30'
                : 'bg-rose-50/70 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/30'}`}>
                <div className="flex items-center gap-3">
                    {data.isBalanced
                        ? <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />
                        : <AlertCircle size={20} className="text-rose-500 flex-shrink-0" />}
                    <div>
                        <p className={`text-sm font-black ${data.isBalanced ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                            {data.isBalanced ? '✓ Sheet is Balanced — Assets = Liabilities + Equity' : '⚠ Sheet Imbalanced — Investigating...'}
                        </p>
                        {!data.isBalanced && (
                            <p className="text-[10px] text-rose-500 mt-0.5">Difference: {fmt(Math.abs(data.difference))} ETB</p>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Debt Ratio</p>
                    <p className="text-sm font-black text-slate-700 dark:text-slate-300">{(data.summary.debtRatio * 100).toFixed(1)}%</p>
                </div>
            </div>

            {/* ── KPI SUMMARY CARDS ────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {summaryCards.map(c => <SummaryCard key={c.label} {...c} />)}
            </div>

            {/* ── MAIN GRID ────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ─────────── ASSETS ─────────── */}
                <div className="bg-white/80 dark:bg-[#161B2E]/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/80 rounded-[2rem] p-6 shadow-sm">
                    <SectionHeader num="1" label="Assets — Hantida" color="bg-emerald-500" />

                    {/* Current Assets */}
                    <div className="mb-5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                            <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" /> Current Assets <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                        </p>

                        <LineItem
                            label="Cash & Bank Accounts"
                            value={data.assets.current.cashAndBank.value}
                            indent
                            badge={`${data.assets.current.cashAndBank.breakdown.length} accounts`}
                        />
                        {/* Account breakdown */}
                        {data.assets.current.cashAndBank.breakdown.map((a: any, i: number) => (
                            <div key={i} className="flex justify-between items-center pl-8 py-1">
                                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                                    {a.name}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 tabular-nums">{fmt(a.value)}</span>
                            </div>
                        ))}

                        <LineItem
                            label="Accounts Receivable (Dayn Macaamiisha)"
                            value={data.assets.current.accountsReceivable.value}
                            indent
                            badge={data.assets.current.accountsReceivable.count > 0 ? `${data.assets.current.accountsReceivable.count} invoices` : undefined}
                        />
                        <LineItem
                            label="Shop Inventory"
                            value={data.assets.current.inventory.value}
                            indent
                            badge={data.assets.current.inventory.skuCount > 0 ? `${data.assets.current.inventory.skuCount} SKUs` : undefined}
                        />

                        <LineItem label="Total Current Assets" value={data.assets.totalCurrent} bold />
                    </div>

                    {/* Fixed Assets */}
                    <div className="mb-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                            <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" /> Fixed Assets <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                        </p>
                        <LineItem
                            label="Property, Plant & Equipment"
                            value={data.assets.fixed.value}
                            indent
                            badge={data.assets.fixed.count > 0 ? `${data.assets.fixed.count} assets` : undefined}
                        />
                        <LineItem label="Total Fixed Assets" value={data.assets.totalFixed} bold />
                    </div>

                    <TotalBar label="TOTAL ASSETS" value={data.assets.total} color="bg-emerald-500 text-white" />
                </div>

                {/* ─────────── RIGHT COLUMN ─────────── */}
                <div className="flex flex-col gap-6">

                    {/* LIABILITIES */}
                    <div className="bg-white/80 dark:bg-[#161B2E]/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/80 rounded-[2rem] p-6 shadow-sm">
                        <SectionHeader num="2" label="Liabilities — Deymaha" color="bg-rose-500" />

                        {/* Current */}
                        <div className="mb-5">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" /> Current Liabilities <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                            </p>
                            <LineItem
                                label="Accounts Payable (Unpaid Expenses)"
                                value={data.liabilities.current.accountsPayable.value}
                                indent
                                badge={data.liabilities.current.accountsPayable.count > 0 ? `${data.liabilities.current.accountsPayable.count} items` : undefined}
                            />
                            <LineItem
                                label="Tax Payable (VAT Collected)"
                                value={data.liabilities.current.taxPayable.value}
                                indent
                            />
                            <LineItem
                                label="Pending Dividends (Saamileyda)"
                                value={data.liabilities.current.pendingDividends.value}
                                indent
                            />
                            <LineItem label="Total Current Liabilities" value={data.liabilities.totalCurrent} bold />
                        </div>

                        {/* Long term */}
                        <div className="mb-2">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" /> Long-term Liabilities <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                            </p>
                            <LineItem label="Long-term Loans" value={data.liabilities.longTerm.value} indent />
                            <LineItem label="Total Long-term Liabilities" value={data.liabilities.totalLongTerm} bold />
                        </div>

                        <TotalBar label="TOTAL LIABILITIES" value={data.liabilities.total} color="bg-rose-500 text-white" />
                    </div>

                    {/* EQUITY */}
                    <div className="bg-white/80 dark:bg-[#161B2E]/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/80 rounded-[2rem] p-6 shadow-sm">
                        <SectionHeader num="3" label="Equity — Raasamaalka" color="bg-[#3498DB]" />

                        <LineItem
                            label="Shareholders Capital"
                            value={data.equity.shareholdersCapital.value}
                            indent
                            badge={data.equity.shareholdersCapital.shareholders.length > 0
                                ? `${data.equity.shareholdersCapital.shareholders.length} shareholders` : undefined}
                        />
                        {/* Shareholder breakdown */}
                        {data.equity.shareholdersCapital.shareholders.map((sh: any, i: number) => (
                            <div key={i} className="flex justify-between items-center pl-8 py-1">
                                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-[#3498DB]/30" />
                                    {sh.name} ({sh.pct}%)
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 tabular-nums">{fmt(sh.investment)}</span>
                            </div>
                        ))}

                        <LineItem
                            label="Dividends Paid (Lacag Bixinta)"
                            value={data.equity.dividendsPaid.value}
                            indent
                            negative
                        />

                        {/* Retained Earnings with breakdown */}
                        <LineItem label="Retained Earnings (Net Profit/Loss)" value={data.equity.retainedEarnings.value} indent />
                        {data.equity.retainedEarnings.breakdown && (
                            <div className="ml-8 mt-1 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/30 space-y-1 mb-2">
                                {[
                                    { label: 'Revenue', value: data.equity.retainedEarnings.breakdown.revenue, green: true },
                                    { label: 'Cost of Goods Sold', value: -data.equity.retainedEarnings.breakdown.cogs, red: true },
                                    { label: 'Gross Profit', value: data.equity.retainedEarnings.breakdown.grossProfit },
                                    { label: 'Operating Expenses', value: -data.equity.retainedEarnings.breakdown.expenses, red: true },
                                ].map(row => (
                                    <div key={row.label} className="flex justify-between items-center">
                                        <span className="text-[9px] text-slate-400">{row.label}</span>
                                        <span className={`text-[10px] font-black tabular-nums ${row.green ? 'text-emerald-500' : row.red ? 'text-rose-500' : 'text-slate-600 dark:text-slate-300'}`}>
                                            {fmt(row.value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <LineItem label="TOTAL EQUITY" value={data.equity.total} bold />
                        <TotalBar label="TOTAL EQUITY" value={data.equity.total} color="bg-[#3498DB] text-white" />
                    </div>
                </div>
            </div>

            {/* ── GRAND TOTAL ───────────────────────────────── */}
            <div className="mt-6 relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-slate-900 to-[#1a2a4a] dark:from-slate-950 dark:to-[#0d1929] p-6 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#3498DB]/10 blur-[80px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 blur-[60px] rounded-full pointer-events-none" />

                <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Scale size={18} className="text-[#3498DB]" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">The Accounting Equation</span>
                        </div>
                        <p className="text-slate-500 text-xs font-medium">Assets = Liabilities + Equity</p>
                        <p className="text-slate-400 text-xs mt-0.5 italic">Standard Accrual Basis — Revlo Shop System</p>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="text-right">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Liabilities + Equity</p>
                            <p className="text-2xl font-black text-white tabular-nums">
                                {fmt(data.summary.totalLiabilitiesAndEquity)}
                                <span className="text-[10px] font-bold text-[#3498DB] ml-1.5">ETB</span>
                            </p>
                        </div>
                        <div className={`w-px h-12 ${data.isBalanced ? 'bg-emerald-500/30' : 'bg-rose-500/30'}`} />
                        <div className="text-right">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Assets</p>
                            <p className="text-2xl font-black text-emerald-400 tabular-nums">
                                {fmt(data.summary.totalAssets)}
                                <span className="text-[10px] font-bold text-emerald-600 ml-1.5">ETB</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <p className="text-center text-[10px] text-slate-400 mt-6 print:block">
                Generated by Revlo Shop · {format(new Date(), 'MMM d, yyyy HH:mm')}
            </p>

            <style jsx global>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
                .animate-fade-in { animation: fadeIn 0.35s ease-out; }
                @media print {
                    body { background: white !important; }
                    .print\\:hidden { display: none !important; }
                }
            `}</style>
        </div>
    );
}
