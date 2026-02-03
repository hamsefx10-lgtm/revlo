'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Filter, Calendar } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

function GeneralLedgerContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>({});
    const [loading, setLoading] = useState(true);

    const type = searchParams.get('type');
    const id = searchParams.get('id');

    useEffect(() => {
        if (type && id) {
            fetchLedger();
        }
    }, [type, id]);

    const fetchLedger = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams(searchParams.toString());
            // Map 'type' from Balance Sheet to API expected 'drillType'
            if (query.get('type')) {
                query.set('drillType', query.get('type')!);
                query.delete('type');
            }
            if (query.get('id')) {
                query.set('drillId', query.get('id')!);
                query.delete('id');
            }

            const res = await fetch(`/api/shop/reports/ledger?${query.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setTransactions(data.data || []);
                setMeta(data.meta || {});
            }
        } catch (error) {
            console.error("Ledger fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const totalAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-5xl mx-auto md:p-8">

            {/* Header */}
            <div className="mb-8 px-4 md:px-0">
                <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-mediumGray hover:text-primary transition-colors text-xs font-bold uppercase tracking-wider mb-4">
                    <ArrowLeft size={16} /> Back
                </button>

                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black text-darkGray dark:text-white capitalize mb-2">
                            {type?.toLowerCase().replace('_', ' ')} Details
                        </h1>
                        <p className="text-mediumGray">Showing transactions for {id === 'all' ? 'All Items' : id}</p>
                    </div>
                    <div className="text-right">
                        <span className="block text-sm font-bold text-mediumGray uppercase tracking-wider">Total Value</span>
                        <span className="text-3xl font-black text-primary">
                            {totalAmount.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-lightGray dark:border-gray-800 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="p-12 text-center text-mediumGray font-medium">
                        No transactions found for this period.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-lightGray dark:border-gray-800 text-xs uppercase tracking-wider text-mediumGray">
                                    <th className="p-4 font-bold">Date</th>
                                    <th className="p-4 font-bold">Description</th>
                                    <th className="p-4 font-bold">Reference</th>
                                    <th className="p-4 font-bold text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-lightGray dark:divide-gray-800">
                                {transactions.map((t, i) => (
                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="p-4 text-sm font-bold text-darkGray dark:text-gray-300 whitespace-nowrap">
                                            {format(new Date(t.date), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="p-4 text-sm text-darkGray dark:text-gray-300 font-medium">
                                            {t.description}
                                            {t.project && <span className="block text-xs text-primary mt-0.5">{t.project}</span>}
                                        </td>
                                        <td className="p-4 text-xs font-bold text-mediumGray uppercase tracking-wider">
                                            {t.reference}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-darkGray dark:text-white text-right">
                                            {t.amount.toLocaleString()} <span className="text-xs font-medium text-mediumGray ml-1">{t.type === 'Credit' ? 'CR' : 'DR'}</span>
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

export default function GeneralLedgerPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
        }>
            <GeneralLedgerContent />
        </Suspense>
    );
}
