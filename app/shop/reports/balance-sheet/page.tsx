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
    AlertCircle,
    ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function BalanceSheetPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchBalanceSheet();
    }, []);

    const fetchBalanceSheet = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/shop/reports/balance-sheet');
            if (res.ok) {
                const result = await res.json();
                setData(result);
            } else {
                console.error("Failed to fetch balance sheet");
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
            <button onClick={fetchBalanceSheet} className="px-4 py-2 bg-primary text-white rounded-xl font-bold mt-4">Try Again</button>
        </div>
    );

    const isBalanced = Math.abs(data.assets.total - (data.liabilities.total + data.equity.total)) < 1;

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-4xl mx-auto md:p-8">

            {/* HEADER */}
            <div className="mb-8 px-4 md:px-0 print:mb-4 text-center">
                <Link href="/shop/reports" className="inline-flex items-center gap-2 text-mediumGray hover:text-primary transition-colors text-xs font-bold uppercase tracking-wider mb-4 print:hidden absolute left-4 md:left-8">
                    <ArrowLeft size={16} /> Back
                </Link>

                <div className="flex flex-col items-center justify-center gap-2">
                    <h1 className="text-3xl font-black text-darkGray dark:text-white uppercase tracking-wider">
                        Balance Sheet
                    </h1>
                    <p className="text-mediumGray font-medium">As of {format(new Date(), 'MMMM dd, yyyy')}</p>
                </div>

                <div className="absolute right-4 md:right-8 top-8 print:hidden">
                    <button className="px-4 py-2 bg-darkGray dark:bg-white text-white dark:text-black font-bold rounded-lg shadow-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
                        <Download size={16} /> PDF
                    </button>
                </div>
            </div>

            {/* BALANCE INDICATOR */}
            {!isBalanced && (
                <div className="mb-6 mx-4 md:mx-0 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-center gap-2 text-red-600 dark:text-red-400 text-sm font-bold">
                    <AlertCircle size={18} />
                    <span>Unbalanced: {(data.assets.total - (data.liabilities.total + data.equity.total)).toLocaleString()}</span>
                </div>
            )}

            {/* MAIN REPORT CONTAINER */}
            <div className="bg-white dark:bg-gray-900 shadow-xl rounded-none md:rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">

                {/* 1. ASSETS SECTION */}
                <div className="p-8 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-xl font-black text-emerald-700 dark:text-emerald-500 uppercase tracking-widest mb-6 border-b-2 border-emerald-500/20 pb-2">
                        1. Assets (Hantida)
                    </h2>

                    {/* Current Assets */}
                    <div className="mb-6 pl-4 border-l-2 border-gray-100 dark:border-gray-800">
                        <h3 className="font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider mb-3">Current Assets</h3>
                        <div className="space-y-3">
                            <ClickableRow label="Cash & Bank Accounts" data={data.assets.current.cashAndBank} />
                            <ClickableRow label="Accounts Receivable (Projects Due)" data={data.assets.current.accountsReceivable} />
                            <ClickableRow label="Inventory (Store Value)" data={data.assets.current.inventory} />
                            <ClickableRow label="WIP - Active Projects (Hantida Mashruuca Socda)" data={data.assets.current.workInProgress} />
                        </div>
                        <div className="mt-3 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700 ml-auto w-1/2">
                            <Row label="Total Current Assets" value={data.assets.current.cashAndBank.value + data.assets.current.accountsReceivable.value + data.assets.current.inventory.value + data.assets.current.workInProgress.value} bold />
                        </div>
                    </div>

                    {/* Fixed Assets */}
                    <div className="mb-6 pl-4 border-l-2 border-gray-100 dark:border-gray-800">
                        <h3 className="font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider mb-3">Fixed Assets</h3>
                        <div className="space-y-3">
                            <ClickableRow label="Property, Plant & Equipment" data={data.assets.fixed} />
                        </div>
                        <div className="mt-3 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700 ml-auto w-1/2">
                            <Row label="Total Fixed Assets" value={data.assets.fixed.value} bold />
                        </div>
                    </div>

                    {/* TOTAL ASSETS */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-lg mt-8 flex justify-between items-center border border-emerald-100 dark:border-emerald-800/30">
                        <span className="text-lg font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-widest">Total Assets</span>
                        <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                            {data.assets.total.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* 2. LIABILITIES SECTION */}
                <div className="p-8 border-b border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20">
                    <h2 className="text-xl font-black text-rose-700 dark:text-rose-500 uppercase tracking-widest mb-6 border-b-2 border-rose-500/20 pb-2">
                        2. Liabilities (Deymaha)
                    </h2>

                    {/* Current Liabilities */}
                    <div className="mb-6 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                        <h3 className="font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider mb-3">Current Liabilities</h3>
                        <div className="space-y-3">
                            <ClickableRow label="Accounts Payable" data={data.liabilities.current.accountsPayable} />
                            <ClickableRow label="Unearned Revenue (Customer Advances)" data={data.liabilities.current.unearnedRevenue} />
                            <ClickableRow label="Tax Payable" data={data.liabilities.current.taxPayable} />
                        </div>
                        <div className="mt-3 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700 ml-auto w-1/2">
                            <Row label="Total Current Liabilities" value={data.liabilities.current.accountsPayable.value + data.liabilities.current.unearnedRevenue.value + data.liabilities.current.taxPayable.value} bold />
                        </div>
                    </div>

                    {/* Long Term Liabilities */}
                    <div className="mb-6 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                        <h3 className="font-bold text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wider mb-3">Long Term Liabilities</h3>
                        <div className="space-y-3">
                            <ClickableRow label="Long Term Loans" data={data.liabilities.longTerm} />
                        </div>
                        <div className="mt-3 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700 ml-auto w-1/2">
                            <Row label="Total Long Term Liabilities" value={data.liabilities.longTerm.value} bold />
                        </div>
                    </div>

                    {/* TOTAL LIABILITIES */}
                    <div className="flex justify-between items-center py-4 border-t-2 border-gray-200 dark:border-gray-700 mt-4">
                        <span className="text-lg font-bold text-gray-700 dark:text-gray-300 uppercase">Total Liabilities</span>
                        <span className="text-xl font-bold text-rose-700 dark:text-rose-400">
                            {data.liabilities.total.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* 3. EQUITY SECTION */}
                <div className="p-8">
                    <h2 className="text-xl font-black text-blue-700 dark:text-blue-500 uppercase tracking-widest mb-6 border-b-2 border-blue-500/20 pb-2">
                        3. Equity (Raasamaalka)
                    </h2>

                    <div className="mb-6 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                        <div className="space-y-3">
                            <ClickableRow label="Owner's Capital (Raasamaalka Bilowga)" data={data.equity.capital} />
                            <ClickableRow label="Retained Earnings (Net Profit/Loss)" data={data.equity.retainedEarnings} />
                        </div>
                    </div>

                    {/* TOTAL EQUITY */}
                    <div className="flex justify-between items-center py-4 border-t-2 border-gray-200 dark:border-gray-700 mt-4">
                        <span className="text-lg font-bold text-gray-700 dark:text-gray-300 uppercase">Total Equity</span>
                        <span className="text-xl font-bold text-blue-700 dark:text-blue-400">
                            {data.equity.total.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* GRAND TOTAL */}
                <div className="bg-gray-900 text-white p-8 mt-0 flex justify-between items-center">
                    <span className="text-xl font-black uppercase tracking-widest">Total Liabilities & Equity</span>
                    <span className="text-3xl font-black text-emerald-400 underline decoration-4 decoration-emerald-500">
                        {(data.liabilities.total + data.equity.total).toLocaleString()}
                    </span>
                </div>
            </div>

            <div className="mt-8 text-center text-gray-400 text-xs print:hidden">
                <p>Standard Accrual Basis Report generated by Revlo System</p>
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

function ClickableRow({ label, data }: { label: string, data: { value: number, drillType?: string, drillId?: string } }) {
    const hasDrill = data.drillType && data.value !== 0;

    return (
        <div className="flex justify-between items-center text-sm group">
            <span className="text-mediumGray dark:text-gray-400 font-medium flex items-center gap-2">
                {label}
                {hasDrill && <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 text-primary transition-opacity" />}
            </span>

            {hasDrill ? (
                <Link
                    href={`/shop/reports/ledger?type=${data.drillType}&id=${data.drillId}`}
                    className="font-bold text-primary hover:underline hover:text-blue-700 transition-colors"
                >
                    {data.value < 0 ? `(${Math.abs(data.value).toLocaleString()})` : data.value.toLocaleString()}
                </Link>
            ) : (
                <span className="font-bold text-darkGray dark:text-gray-200">
                    {data.value < 0 ? `(${Math.abs(data.value).toLocaleString()})` : data.value.toLocaleString()}
                </span>
            )}
        </div>
    );
}
