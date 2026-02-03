'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
    Activity,
    AlertCircle,
    ArrowLeft,
    Download,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Briefcase,
    Building2,
    DollarSign,
    Scale
} from 'lucide-react';
import Layout from '../../../components/layouts/Layout';

export default function FinancialSummaryPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/accounting/reports/financial-summary');
            if (res.ok) {
                const result = await res.json();
                setData(result);
            } else {
                console.error("Failed to fetch financial summary");
            }
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingState />;
    if (!data) return <ErrorState onRetry={fetchSummary} />;

    const { performance, position } = data;

    return (
        <Layout>
            <div className="min-h-screen pb-20 font-sans w-full max-w-7xl mx-auto md:p-6 text-gray-800 dark:text-gray-100">

                {/* HEADER */}
                <Header onRefresh={fetchSummary} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* SECTION A: PERFORMANCE (PROFIT FLOW) */}
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                <TrendingUp size={24} />
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-wider text-gray-800 dark:text-gray-100">
                                A. Performance
                                <span className="block text-xs font-normal text-gray-500 capitalize mt-1">Profit & Loss Flow (Life to Date)</span>
                            </h2>
                        </div>

                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
                            {/* 1. REVENUE */}
                            <SummaryRow
                                label="Revenue (Dakhliga)"
                                value={performance.revenue.total}
                                icon={<DollarSign size={20} />}
                                bgClass="bg-emerald-50 dark:bg-emerald-900/20"
                                colorClass="text-emerald-700 dark:text-emerald-400"
                                breakdown={performance.revenue.breakdown}
                            />

                            {/* 2. DIRECT COSTS */}
                            <div className="px-6 py-2">
                                <div className="border-l-2 border-red-200 pl-4 my-2">
                                    <SummaryRow
                                        label="Less: Direct Project Costs"
                                        value={performance.directCosts.total}
                                        isExpense
                                        icon={<Briefcase size={16} />}
                                        subtext="Materials, Labor, Project Expenses"
                                    />
                                </div>
                            </div>

                            {/* 3. GROSS PROFIT */}
                            <ResultRow label="= Gross Profit" value={performance.grossProfit} />

                            {/* 4. OPEX */}
                            <div className="px-6 py-2">
                                <div className="border-l-2 border-orange-200 pl-4 my-2">
                                    <SummaryRow
                                        label="Less: Operating Expenses"
                                        value={performance.operatingExpenses.total}
                                        isExpense
                                        icon={<Building2 size={16} />}
                                        subtext="Rent, Salaries, Admin, Utilities"
                                        breakdown={performance.operatingExpenses.breakdown}
                                    />
                                </div>
                            </div>

                            {/* 5. OPERATING PROFIT */}
                            <ResultRow label="= Operating Profit" value={performance.operatingProfit} />

                            {/* 6. OTHER */}
                            {performance.otherExpenses !== 0 && (
                                <div className="px-6 py-2">
                                    <SummaryRow label="Less: Other Expenses (Tax/Interest)" value={performance.otherExpenses} isExpense />
                                </div>
                            )}

                            {/* 7. NET PROFIT */}
                            <div className="mt-4 bg-gray-900 text-white p-6">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-1">Net Profit (Final)</h3>
                                        <p className="text-xs text-gray-500">Transfers to Equity</p>
                                    </div>
                                    <span className={`text-4xl font-black ${performance.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {performance.netProfit.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* SECTION B: FINANCIAL POSITION */}
                    <div className="space-y-6 animate-fade-in-up delay-100">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                                <Scale size={24} />
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-wider text-gray-800 dark:text-gray-100">
                                B. Position
                                <span className="block text-xs font-normal text-gray-500 capitalize mt-1">Assets vs Liabilities vs Equity</span>
                            </h2>
                        </div>

                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col h-full">

                            {/* ASSETS */}
                            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                                <h3 className="text-emerald-700 dark:text-emerald-500 font-bold uppercase tracking-widest mb-4 flex justify-between items-center">
                                    <span>Assets (Hantida)</span>
                                    <span>{position.assets.total.toLocaleString()}</span>
                                </h3>
                                <div className="space-y-3 pl-2 text-sm">
                                    <SummaryRow
                                        label="Cash & Bank"
                                        value={position.assets.breakdown.cash ?? 0}
                                        subtext="Total Liquidity"
                                        breakdown={position.assets.breakdown.cashBreakdown}
                                    />
                                    <SummaryRow label="Inventory" value={position.assets.breakdown.inventory ?? 0} />

                                    <SummaryRow
                                        label="Project Receivables (Previous)"
                                        value={position.assets.breakdown.projectReceivables ?? 0}
                                        subtext="Unpaid Balances (Direct)"
                                    />
                                    <SummaryRow
                                        label="Customer Debts (Loans/Exp)"
                                        value={position.assets.breakdown.customerReceivables ?? 0}
                                        subtext="Loans & Expenses"
                                    />

                                    <SummaryRow label="Fixed Assets" value={position.assets.breakdown.fixed ?? 0} />
                                </div>
                            </div>

                            {/* LIABILITIES */}
                            <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-red-50/30 dark:bg-red-900/5">
                                <h3 className="text-rose-700 dark:text-rose-500 font-bold uppercase tracking-widest mb-4 flex justify-between items-center">
                                    <span>Liabilities (Deymaha)</span>
                                    <span>{position.liabilities.total.toLocaleString()}</span>
                                </h3>
                                <div className="space-y-3 pl-2 text-sm">
                                    <SummaryRow
                                        label="Unpaid Expenses (Bills)"
                                        value={position.liabilities.breakdown.unpaidExpenses ?? 0}
                                        subtext="Outstanding Bills"
                                    />
                                    <SummaryRow
                                        label="Loans Taken (Deymaha)"
                                        value={position.liabilities.breakdown.vendorLoans ?? 0}
                                        subtext="Cash/Vendor Loans"
                                    />
                                    <SummaryRow
                                        label="Unearned Revenue (Advances)"
                                        value={position.liabilities.breakdown.unearnedRevenue ?? 0}
                                    />
                                </div>
                            </div>

                            {/* EQUITY */}
                            <div className="p-6 flex-grow bg-blue-50/30 dark:bg-blue-900/5">
                                <h3 className="text-blue-700 dark:text-blue-500 font-bold uppercase tracking-widest mb-4 flex justify-between items-center">
                                    <span>Equity (Raasamaalka)</span>
                                    <span>{position.equity.total.toLocaleString()}</span>
                                </h3>
                                <div className="space-y-3 pl-2 text-sm">
                                    <DetailRow label="Owner's Capital" value={position.equity.breakdown.capital} />
                                    <div className="flex justify-between items-center pt-2 border-t border-blue-200/50">
                                        <span className="font-bold text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                            <TrendingUp size={14} /> Net Profit (Retained)
                                        </span>
                                        <span className={`font-black ${position.equity.breakdown.netProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {position.equity.breakdown.netProfit.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>

                <div className="mt-12 text-center text-xs text-gray-400">
                    <p>Generated by Revlo Financial System • IFRS Compliant Summary</p>
                </div>
            </div>
        </Layout>
    );
}


// --- COMPONENTS ---

function SummaryRow({ label, value, icon, isExpense, bgClass, colorClass, subtext, breakdown }: any) {
    if (value === undefined || value === null) return null;

    // Check if breakdown exists and calculate total from it if value is 0 or mismatch? No, trust value.

    return (
        <>
            <div className={`p-4 rounded-xl flex justify-between items-center ${bgClass || ''} mb-1 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800`}>
                <div className="flex items-center gap-3">
                    {icon && <div className={`opacity-50 ${isExpense ? 'text-red-500' : 'text-emerald-500'}`}>{icon}</div>}
                    <div>
                        <span className={`font-bold block ${colorClass || (isExpense ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-200')}`}>
                            {label}
                        </span>
                        {subtext && <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">{subtext}</span>}
                    </div>
                </div>
                <span className={`font-mono font-bold text-lg ${isExpense ? 'text-red-600' : 'text-gray-800 dark:text-white'}`}>
                    {isExpense && value > 0 ? '-' : ''}{value.toLocaleString()}
                </span>
            </div>

            {/* Breakdown List */}
            {breakdown && breakdown.length > 0 && (
                <div className="mb-4 pl-14 pr-4 space-y-1">
                    {breakdown.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm items-center border-b border-gray-50 dark:border-gray-800 pb-1 last:border-0 border-dashed">
                            <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                            <span className="font-mono text-gray-600 dark:text-gray-300">
                                {isExpense ? '-' : ''}{item.value.toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

function ResultRow({ label, value }: any) {
    const isPositive = value >= 0;
    return (
        <div className="mx-6 py-3 border-t border-b border-gray-100 dark:border-gray-700 flex justify-between items-center my-1 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg px-4">
            <span className="font-black text-gray-500 text-sm uppercase tracking-widest">{label}</span>
            <span className={`font-black text-xl ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                {value.toLocaleString()}
            </span>
        </div>
    );
}

function DetailRow({ label, value, highlight }: any) {
    return (
        <div className="flex justify-between items-center py-1">
            <span className={`text-gray-500 dark:text-gray-400 ${highlight ? 'font-bold text-gray-700 dark:text-gray-200' : ''}`}>{label}</span>
            <span className={`font-mono font-medium ${value < 0 ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}>
                {value < 0 ? `(${Math.abs(value).toLocaleString()})` : value.toLocaleString()}
            </span>
        </div>
    );
}

function LoadingState() {
    return (
        <Layout>
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="text-gray-400 animate-pulse">Calculating Financial Position...</p>
            </div>
        </Layout>
    );
}

function ErrorState({ onRetry }: any) {
    return (
        <Layout>
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <AlertCircle size={48} className="text-red-400" />
                <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200">System Error</h3>
                <p className="text-gray-500">Failed to load financial data.</p>
                <button onClick={onRetry} className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:opacity-90 transition-opacity">
                    Retry Analysis
                </button>
            </div>
        </Layout>
    );
}

function Header({ onRefresh }: any) {
    return (
        <div className="mb-8 px-4 md:px-0 print:mb-4 relative flex items-center justify-between">
            <Link href="/reports" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors text-xs font-bold uppercase tracking-wider print:hidden">
                <ArrowLeft size={16} /> Reports
            </Link>

            <div className="flex-1 flex flex-col items-center justify-center gap-1">
                <h1 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-widest flex items-center gap-3">
                    <Activity className="text-primary" size={28} />
                    Financial Company Data
                </h1>
                <p className="text-gray-400 font-medium text-xs tracking-widest uppercase">Executive Summary • {format(new Date(), 'MMMM yyyy')}</p>
            </div>

            <div className="print:hidden flex gap-2">
                <button onClick={onRefresh} className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm transition-all active:scale-95">
                    <RefreshCw size={16} className="text-gray-500" />
                </button>
                <button
                    onClick={() => window.print()}
                    className="p-2 bg-gray-800 dark:bg-white text-white dark:text-black rounded-lg hover:shadow-lg transition-all active:scale-95"
                >
                    <Download size={16} />
                </button>
            </div>
        </div>
    );
}
