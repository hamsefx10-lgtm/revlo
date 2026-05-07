'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Users, DollarSign, AlertCircle } from 'lucide-react';
import UltraIcon from '@/components/shop/ui/UltraIcon';
import { format } from 'date-fns';

export default function CustomerBalancesPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchCustomers(); }, []);

    const fetchCustomers = async () => {
        try {
            const res = await fetch('/api/shop/customers');
            const data = await res.json();
            setCustomers(data.customers || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    // Only customers with balance > 0
    const withBalance = customers
        .filter(c => Number(c.balance || 0) > 0)
        .sort((a, b) => Number(b.balance) - Number(a.balance));
    const totalReceivables = withBalance.reduce((s, c) => s + Number(c.balance || 0), 0);

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-7xl mx-auto p-4 md:p-8">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/shop/reports" className="p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-blue-500 transition-all shadow-sm">
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <UltraIcon icon={Users} variant="primary" />
                        Macaamiisha Aan Daynta Ku Lenahay (Receivables)
                    </h1>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Customer Balances Report — Lacagaha macaamiishu nagu hayo</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
            ) : (
                <>
                    {/* Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-500/20">
                            <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-2">Wadarta Lacagta Nagu Hayo</p>
                            <h3 className="text-4xl font-black">{totalReceivables.toLocaleString()} <span className="text-lg opacity-60">ETB</span></h3>
                        </div>
                        <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Macaamiisha Daynta Ku Lenahay</p>
                            <h3 className="text-4xl font-black text-gray-900 dark:text-white">{withBalance.length}</h3>
                            <p className="text-gray-400 text-xs mt-2">ka mid ah {customers.length} macaamiil</p>
                        </div>
                        <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Celceliska Lacagta Nagu Hayo</p>
                            <h3 className="text-4xl font-black text-gray-900 dark:text-white">
                                {withBalance.length > 0 ? Math.round(totalReceivables / withBalance.length).toLocaleString() : 0} <span className="text-lg opacity-40">ETB</span>
                            </h3>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                                <DollarSign size={18} className="text-blue-500" /> Liiska Macaamiisha Daynta Ku Lenahay
                            </h3>
                        </div>
                        {withBalance.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <Users size={48} className="mx-auto mb-3 opacity-20" />
                                <p className="font-bold">Ma jiraan macaamiil dayn nagu hayo</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                                            <th className="text-left py-4 px-6">#</th>
                                            <th className="text-left py-4 px-4">Macmiilka</th>
                                            <th className="text-left py-4 px-4">Telefoonka</th>
                                            <th className="text-right py-4 px-6">Lacagta Nagu Hayo (ETB)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                                        {withBalance.map((c, i) => (
                                            <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="py-4 px-6 text-xs text-gray-400 font-bold">{i + 1}</td>
                                                <td className="py-4 px-4">
                                                    <Link href={`/shop/customers/${c.id}`} className="font-bold text-sm text-gray-900 dark:text-white hover:text-blue-500 transition-colors">
                                                        {c.name}
                                                    </Link>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-gray-500">{c.phone || '—'}</td>
                                                <td className="py-4 px-6 text-right font-black text-rose-600 text-sm">
                                                    {Number(c.balance).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gray-900 dark:bg-white/5 text-white">
                                            <td colSpan={3} className="py-4 px-6 font-black text-sm text-right">WADARTA</td>
                                            <td className="py-4 px-6 text-right font-black text-lg">{totalReceivables.toLocaleString()} ETB</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
