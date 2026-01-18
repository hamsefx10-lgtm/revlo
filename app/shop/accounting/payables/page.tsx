'use client';

import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Loader2,
    Truck,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function PayablesPage() {
    const [loading, setLoading] = useState(true);
    const [payables, setPayables] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/shop/accounting/payables');
                if (res.ok) {
                    const data = await res.json();
                    setPayables(data.payables || []);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/shop/accounting" className="text-gray-400 hover:text-[#3498DB] transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                            <ArrowLeft size={14} /> Back to Accounting
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600">
                            <Truck size={28} />
                        </div>
                        Accounts Payable
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">Track bills and money owed to vendors.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-xl overflow-hidden min-h-[300px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin text-red-500" size={32} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-xs font-bold uppercase">
                                <tr>
                                    <th className="p-6">Vendor</th>
                                    <th className="p-6">PO #</th>
                                    <th className="p-6">Expected / Due</th>
                                    <th className="p-6">Status</th>
                                    <th className="p-6 text-right">Amount Due</th>
                                    <th className="p-6">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {payables.length === 0 ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">No pending bills found.</td></tr>
                                ) : payables.map(r => (
                                    <tr key={r.id}>
                                        <td className="p-6 font-bold">{r.vendor}</td>
                                        <td className="p-6 font-mono text-xs">{r.poNumber}</td>
                                        <td className="p-6 text-sm">{format(new Date(r.dueDate), 'MMM dd, yyyy')}</td>
                                        <td className="p-6">
                                            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-orange-100 text-orange-600">
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right font-black">ETB {r.dueAmount.toLocaleString()}</td>
                                        <td className="p-6">
                                            <Link href={`/shop/purchases/${r.id}`} className="text-blue-500 font-bold text-xs hover:underline">Pay Now</Link>
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
