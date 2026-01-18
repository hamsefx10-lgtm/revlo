'use client';

import React, { useState, useEffect } from 'react';
import {
    Save,
    Plus,
    Trash2,
    Calendar,
    Users,
    FileText,
    ArrowLeft,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

export default function ReceivablesPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [receivables, setReceivables] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/shop/accounting/receivables');
                if (res.ok) {
                    const data = await res.json();
                    setReceivables(data.receivables || []);
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
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-600">
                            <Users size={28} />
                        </div>
                        Accounts Receivable
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">Track money owed by customers (Invoices).</p>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-xl overflow-hidden min-h-[300px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="animate-spin text-green-500" size={32} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-xs font-bold uppercase">
                                <tr>
                                    <th className="p-6">Customer</th>
                                    <th className="p-6">Invoice #</th>
                                    <th className="p-6">Due Date</th>
                                    <th className="p-6">Status</th>
                                    <th className="p-6 text-right">Amount Due</th>
                                    <th className="p-6">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {receivables.length === 0 ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-gray-500">No outstanding invoices found.</td></tr>
                                ) : receivables.map(r => (
                                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="p-6 font-bold">{r.customer}</td>
                                        <td className="p-6 font-mono text-xs">{r.invoiceNumber}</td>
                                        <td className="p-6 text-sm">{r.dueDate ? format(new Date(r.dueDate), 'MMM dd, yyyy') : '-'}</td>
                                        <td className="p-6">
                                            <span className={`px-3 py-1 rounded-lg text-xs font-bold ${new Date(r.dueDate) < new Date() ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                                                }`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right font-black">ETB {r.dueAmount.toLocaleString()}</td>
                                        <td className="p-6">
                                            <Link href={`/shop/sales/${r.id}`} className="text-blue-500 font-bold text-xs hover:underline">View</Link>
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
