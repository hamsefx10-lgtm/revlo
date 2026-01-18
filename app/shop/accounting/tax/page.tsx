'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Building2, Calculator, CalendarClock, DollarSign, FileCheck, Percent, Loader2 } from 'lucide-react';
import Link from 'next/link';
import MetricCard from '@/components/shop/ui/MetricCard';

export default function TaxCenterPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        fetchTaxData();
    }, []);

    const fetchTaxData = async () => {
        try {
            const res = await fetch('/api/shop/accounting/tax');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-red-500" size={32} />
            </div>
        );
    }

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
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-500">
                            <Building2 size={28} />
                        </div>
                        Tax Center
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">Manage tax rates, returns, and liabilities.</p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={async () => {
                            // Simple filing for Last Month
                            const today = new Date();
                            const start = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString();
                            const end = new Date(today.getFullYear(), today.getMonth(), 0).toISOString();

                            if (!confirm(`File VAT Return for last month (${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()})?`)) return;

                            try {
                                const res = await fetch('/api/shop/accounting/tax/file', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ periodStart: start, periodEnd: end })
                                });
                                const json = await res.json();
                                if (!res.ok) throw new Error(json.error);

                                alert(`Tax Return Filed! Tax Due: ${json.taxReturn.taxDue.toLocaleString()}`);
                                window.location.reload();
                            } catch (e: any) {
                                alert(e.message);
                            }
                        }}
                        className="px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold shadow-lg hover:opacity-90 flex items-center gap-2 transition-all">
                        <FileCheck size={18} /> File Return (Last Month)
                    </button>
                </div>
            </div>

            {/* OVERVIEW CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <MetricCard
                    label="Net Tax Due"
                    value={`ETB ${(data?.stats?.taxDue || 0).toLocaleString()}`}
                    trend="Computed Live"
                    isPositive={data?.stats?.taxDue <= 0}
                    icon={DollarSign}
                    variant="danger"
                />
                <MetricCard
                    label="Tax Collected (Sales)"
                    value={`ETB ${(data?.stats?.taxCollected || 0).toLocaleString()}`}
                    trend="Output VAT"
                    isPositive={true}
                    icon={Percent}
                    variant="accent"
                />
                <MetricCard
                    label="Tax Paid (Purchases)"
                    value={`ETB ${(data?.stats?.taxPaid || 0).toLocaleString()}`}
                    trend="Input VAT"
                    isPositive={true}
                    icon={CalendarClock}
                    variant="neutral"
                />
            </div>

            {/* SETTINGS AREA */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Tax Rates */}
                <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <Calculator size={20} className="text-gray-400" /> Active Tax Rates
                    </h3>

                    <div className="space-y-4">
                        {data?.rates?.map((rate: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">{rate.name}</p>
                                    <p className="text-xs text-gray-500">{rate.description}</p>
                                </div>
                                <span className="text-lg font-black text-[#3498DB]">{rate.rate}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Returns */}
                <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <FileCheck size={20} className="text-gray-400" /> Recent Filings
                    </h3>

                    <div className="space-y-4">
                        {data?.history?.length === 0 ? (
                            <p className="text-gray-500 text-sm">No filings yet.</p>
                        ) : data?.history?.map((h: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/20">
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">{h.period}</p>
                                    <p className="text-xs text-green-600 font-bold">{new Date(h.date).toLocaleDateString()}</p>
                                </div>
                                <span className="px-3 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-100 rounded-lg text-xs font-bold">{h.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
