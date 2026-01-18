'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Truck, Download } from 'lucide-react';
import Link from 'next/link';

export default function VendorAgingReport() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/shop/reports/aging/vendor')
            .then(res => res.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    const maxVal = data ? Math.max(...Object.values(data.buckets).map((v: any) => Number(v))) : 0;

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/shop/accounting" className="text-gray-400 hover:text-[#3498DB] transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                            <ArrowLeft size={14} /> Back to Accounting
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        Vendor Aging Report
                    </h1>
                </div>
                <button className="px-4 py-2 bg-[#3498DB] text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-blue-600 transition-colors">
                    <Download size={18} /> Export PDF
                </button>
            </div>

            {loading ? <Loader2 className="animate-spin text-blue-500 mx-auto" /> : (
                <div className="space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-4 gap-4">
                        {Object.entries(data.buckets).map(([key, value]: any) => (
                            <div key={key} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <p className="text-xs font-bold text-gray-500 uppercase">{key} Days</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                                    ETB {value.toLocaleString()}
                                </p>
                                <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                                    <div
                                        className="h-full bg-red-500 rounded-full"
                                        style={{ width: `${maxVal > 0 ? (value / maxVal) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Detailed List */}
                    <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold text-lg mb-6">Aged Payables Detail</h3>
                        <table className="w-full text-left">
                            <thead className="text-gray-500 text-xs font-bold uppercase border-b border-gray-100">
                                <tr>
                                    <th className="pb-4">Vendor</th>
                                    <th className="pb-4">PO #</th>
                                    <th className="pb-4 text-right">Days Overdue</th>
                                    <th className="pb-4 text-right">Amount Due</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {data.details.map((row: any) => (
                                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="py-4 font-bold">{row.vendor}</td>
                                        <td className="py-4 font-mono text-sm text-gray-500">{row.poNumber}</td>
                                        <td className={`py-4 text-right font-bold ${row.overdueDays > 60 ? 'text-red-500' : 'text-orange-500'}`}>
                                            {row.overdueDays} days
                                        </td>
                                        <td className="py-4 text-right font-black">
                                            {row.amountDue.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
