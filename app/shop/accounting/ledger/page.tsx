'use client';

import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownLeft,
    Download,
    Calendar,
    FileText,
    ArrowLeft,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface LedgerEntry {
    id: string;
    date: string;
    description: string;
    account: string;
    type: string;
    amount: number;
    reference: string;
    category: string;
}

export default function GeneralLedgerPage() {
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLedger();
    }, []);

    const fetchLedger = async () => {
        try {
            const res = await fetch('/api/shop/accounting/ledger');
            if (res.ok) {
                const data = await res.json();
                setEntries(data.entries || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/shop/accounting" className="text-gray-400 hover:text-[#3498DB] transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                            <ArrowLeft size={14} /> Back to Accounting
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-[#3498DB]">
                            <FileText size={28} />
                        </div>
                        General Ledger
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">Detailed record of all financial transactions.</p>
                </div>

                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <Filter size={18} /> Filter
                    </button>
                    <button className="px-4 py-2 bg-[#3498DB] text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-colors">
                        <Download size={18} /> Export
                    </button>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-xl overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-10 h-10 animate-spin text-[#3498DB]" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
                                    <th className="p-6">Date</th>
                                    <th className="p-6">Description</th>
                                    <th className="p-6">Account</th>
                                    <th className="p-6">Reference</th>
                                    <th className="p-6 text-right">Debit</th>
                                    <th className="p-6 text-right">Credit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {entries.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-400 font-bold">No ledger entries found.</td>
                                    </tr>
                                ) : entries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                        <td className="p-6 font-medium text-gray-600 dark:text-gray-300">
                                            {format(new Date(entry.date), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="p-6 font-bold text-gray-900 dark:text-white">
                                            {entry.description}
                                        </td>
                                        <td className="p-6">
                                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300">
                                                {entry.account}
                                            </span>
                                        </td>
                                        <td className="p-6 text-sm text-gray-500 font-mono">
                                            {entry.reference}
                                        </td>
                                        <td className="p-6 text-right font-bold text-gray-900 dark:text-white">
                                            {entry.type === 'Debit' ? entry.amount.toLocaleString() : '-'}
                                        </td>
                                        <td className="p-6 text-right font-bold text-gray-900 dark:text-white">
                                            {entry.type === 'Credit' ? entry.amount.toLocaleString() : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
