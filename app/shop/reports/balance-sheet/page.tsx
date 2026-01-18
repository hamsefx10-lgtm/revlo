'use client';

import React, { useState, useEffect } from 'react';
import {
    Scale,
    ArrowLeft,
    Download,
    RefreshCw,
    Building2,
    Wallet,
    Package,
    Landmark,
    TrendingUp,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function BalanceSheetPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBalanceSheet();
    }, []);

    const fetchBalanceSheet = async () => {
        setLoading(true);
        try {
            console.log("Fetching balance sheet from /api/shop/reports/balance-sheet");
            const res = await fetch('/api/shop/reports/balance-sheet');
            console.log("Response status:", res.status);

            if (res.ok) {
                const result = await res.json();
                console.log("Data received:", result);
                setData(result);
            } else {
                console.error("Failed to fetch:", res.status, res.statusText);
                const text = await res.text();
                console.error("Response body:", text);
            }
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!data) return (
        <div className="p-8 text-center">
            <h3 className="text-xl font-bold text-red-500 mb-2">Failed to load report</h3>
            <p className="text-mediumGray mb-4">The server encountered an error while generating the balance sheet.</p>
            <button
                onClick={fetchBalanceSheet}
                className="px-4 py-2 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
            >
                Try Again
            </button>
        </div>
    );

    const isBalanced = Math.abs(data.assets.total - data.liabilities.total) < 1; // Allow small float variance

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-5xl mx-auto md:p-8">

            {/* HEADER */}
            <div className="mb-8 px-4 md:px-0 print:mb-4">
                <Link href="/shop/reports" className="inline-flex items-center gap-2 text-mediumGray hover:text-primary transition-colors text-xs font-bold uppercase tracking-wider mb-4 print:hidden">
                    <ArrowLeft size={16} /> Back to Reports
                </Link>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-darkGray dark:text-white mb-2 flex items-center gap-3">
                            <Scale size={32} className="text-primary" />
                            Balance Sheet
                        </h1>
                        <p className="text-mediumGray font-medium">Financial Position as of {format(new Date(), 'MMMM dd, yyyy')}</p>
                    </div>

                    <div className="flex items-center gap-3 print:hidden">
                        <button
                            onClick={fetchBalanceSheet}
                            className="p-3 bg-white dark:bg-gray-900 border border-lightGray dark:border-gray-800 rounded-xl hover:shadow-md transition-all text-mediumGray hover:text-primary"
                        >
                            <RefreshCw size={20} />
                        </button>
                        <button className="px-6 py-3 bg-darkGray dark:bg-white text-white dark:text-black font-bold rounded-xl shadow-lg flex items-center gap-2 hover:translate-y-[-2px] transition-transform">
                            <Download size={18} /> Export PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* BALANCE INDICATOR */}
            {!isBalanced && (
                <div className="mb-8 mx-4 md:mx-0 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 animate-pulse">
                    <AlertCircle size={24} />
                    <span className="font-bold">Warning: The Balance Sheet is not balanced. Difference: ETB {Math.abs(data.assets.total - data.liabilities.total).toLocaleString()}</span>
                </div>
            )}

            {/* MAIN CONTENT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4 md:px-0">

                {/* ASSETS COLUMN */}
                <div className="space-y-6">
                    <h2 className="text-xl font-black text-darkGray dark:text-white uppercase tracking-wider border-b-2 border-emerald-500 pb-2">Assets</h2>

                    {/* Current Assets */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-lightGray dark:border-gray-800 shadow-sm">
                        <h3 className="font-bold text-mediumGray mb-4 flex items-center gap-2">
                            <Wallet size={18} className="text-emerald-500" /> Current Assets
                        </h3>
                        <div className="space-y-3">
                            <Row label="Cash & Bank Accounts" value={data.assets.current.cashAndBank} />
                            <Row label="Accounts Receivable" value={data.assets.current.accountsReceivable} />
                            <Row label="Inventory Value" value={data.assets.current.inventory} />
                        </div>
                        <div className="mt-6 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
                            <Row label="Total Current Assets" value={data.assets.current.cashAndBank + data.assets.current.accountsReceivable + data.assets.current.inventory} bold />
                        </div>
                    </div>

                    {/* Fixed Assets */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-lightGray dark:border-gray-800 shadow-sm">
                        <h3 className="font-bold text-mediumGray mb-4 flex items-center gap-2">
                            <Building2 size={18} className="text-blue-500" /> Fixed Assets
                        </h3>
                        <div className="space-y-3">
                            <Row label="Property, Plant & Equipment" value={data.assets.fixed} />
                        </div>
                        <div className="mt-6 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
                            <Row label="Total Fixed Assets" value={data.assets.fixed} bold />
                        </div>
                    </div>

                    {/* Total Assets */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-[2rem] border border-emerald-100 dark:border-emerald-800/30">
                        <div className="flex justify-between items-end">
                            <span className="text-lg font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">Total Assets</span>
                            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 underline decoration-4 decoration-emerald-200 dark:decoration-emerald-800">
                                {data.assets.total.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* LIABILITIES & EQUITY COLUMN */}
                <div className="space-y-6">
                    <h2 className="text-xl font-black text-darkGray dark:text-white uppercase tracking-wider border-b-2 border-orange-500 pb-2">Liabilities & Equity</h2>

                    {/* Current Liabilities */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-lightGray dark:border-gray-800 shadow-sm">
                        <h3 className="font-bold text-mediumGray mb-4 flex items-center gap-2">
                            <ArrowLeft size={18} className="text-red-500 rotate-45" /> Current Liabilities
                        </h3>
                        <div className="space-y-3">
                            <Row label="Accounts Payable" value={data.liabilities.current.accountsPayable} />
                            <Row label="Tax Payable" value={data.liabilities.current.taxPayable} />
                        </div>
                        <div className="mt-6 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
                            <Row label="Total Current Liabilities" value={data.liabilities.current.accountsPayable + data.liabilities.current.taxPayable} bold />
                        </div>
                    </div>

                    {/* Long Term Liabilities */}
                    {data.liabilities.longTerm !== 0 && (
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-lightGray dark:border-gray-800 shadow-sm">
                            <h3 className="font-bold text-mediumGray mb-4 flex items-center gap-2">
                                <Landmark size={18} className="text-orange-500" /> Long Term Liabilities
                            </h3>
                            <div className="space-y-3">
                                <Row label="Long Term Loans" value={data.liabilities.longTerm} />
                            </div>
                        </div>
                    )}

                    {/* Equity */}
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-lightGray dark:border-gray-800 shadow-sm">
                        <h3 className="font-bold text-mediumGray mb-4 flex items-center gap-2">
                            <Landmark size={18} className="text-purple-500" /> Owner's Equity
                        </h3>
                        <div className="space-y-3">
                            <Row label="Capital Investment" value={data.equity.capital} />
                            <Row label="Retained Earnings" value={data.equity.retainedEarnings} />
                        </div>
                        <div className="mt-6 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
                            <Row label="Total Equity" value={data.equity.total} bold />
                        </div>
                    </div>

                    {/* Total Liabilities & Equity */}
                    <div className="bg-orange-50 dark:bg-orange-900/10 p-6 rounded-[2rem] border border-orange-100 dark:border-orange-800/30">
                        <div className="flex justify-between items-end">
                            <span className="text-lg font-black text-orange-800 dark:text-orange-400 uppercase tracking-widest text-right w-1/2 leading-tight">Total Liabilities & Equity</span>
                            <span className="text-3xl font-black text-orange-600 dark:text-orange-400 underline decoration-4 decoration-orange-200 dark:decoration-orange-800">
                                {(data.liabilities.total + data.equity.total).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

function Row({ label, value, bold = false }: { label: string, value: number, bold?: boolean }) {
    return (
        <div className={`flex justify-between items-center ${bold ? 'text-lg' : 'text-sm'}`}>
            <span className={`${bold ? 'font-black text-darkGray dark:text-white' : 'text-mediumGray dark:text-gray-400 font-medium'}`}>
                {label}
            </span>
            <span className={`${bold ? 'font-black text-darkGray dark:text-white' : 'font-bold text-darkGray dark:text-gray-200'}`}>
                {value < 0 ? `(${Math.abs(value).toLocaleString()})` : value.toLocaleString()}
            </span>
        </div>
    );
}
