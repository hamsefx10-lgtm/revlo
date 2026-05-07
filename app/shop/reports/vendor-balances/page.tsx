'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Truck, DollarSign } from 'lucide-react';
import UltraIcon from '@/components/shop/ui/UltraIcon';

export default function VendorBalancesPage() {
    const [vendors, setVendors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchVendors(); }, []);

    const fetchVendors = async () => {
        try {
            const res = await fetch('/api/shop/vendors');
            const data = await res.json();
            setVendors(data.vendors || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const withBalance = vendors
        .filter(v => Number(v.balance || 0) > 0)
        .sort((a, b) => Number(b.balance) - Number(a.balance));
    const totalPayables = withBalance.reduce((s, v) => s + Number(v.balance || 0), 0);

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-7xl mx-auto p-4 md:p-8">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/shop/reports" className="p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-purple-500 transition-all shadow-sm">
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <UltraIcon icon={Truck} variant="neutral" />
                        Suplayerska / Vendorska Daynta Inagu Leh (Payables)
                    </h1>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Vendor Balances Report — Lacagaha aan suplayerska u qabno</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-purple-500" size={40} /></div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-[2rem] p-8 text-white shadow-xl shadow-purple-500/20">
                            <p className="text-purple-100 text-[10px] font-black uppercase tracking-widest mb-2">Wadarta Deymaha Loo Hayo</p>
                            <h3 className="text-4xl font-black">{totalPayables.toLocaleString()} <span className="text-lg opacity-60">ETB</span></h3>
                        </div>
                        <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Suplayerska Daynta Inagu Leh</p>
                            <h3 className="text-4xl font-black text-gray-900 dark:text-white">{withBalance.length}</h3>
                            <p className="text-gray-400 text-xs mt-2">ka mid ah {vendors.length} vendor</p>
                        </div>
                        <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Celceliska Lacagta Loo Qabo</p>
                            <h3 className="text-4xl font-black text-gray-900 dark:text-white">
                                {withBalance.length > 0 ? Math.round(totalPayables / withBalance.length).toLocaleString() : 0} <span className="text-lg opacity-40">ETB</span>
                            </h3>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                                <DollarSign size={18} className="text-purple-500" /> Liiska Suplayerska Lacagta Loo Qabo
                            </h3>
                        </div>
                        {withBalance.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <Truck size={48} className="mx-auto mb-3 opacity-20" />
                                <p className="font-bold">Ma jiraan jumladley deyn loo hayo</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                                            <th className="text-left py-4 px-6">#</th>
                                            <th className="text-left py-4 px-4">Jumladleya</th>
                                            <th className="text-left py-4 px-4">Telefoonka</th>
                                            <th className="text-right py-4 px-6">Lacagta Loo Qabo (ETB)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                                        {withBalance.map((v, i) => (
                                            <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="py-4 px-6 text-xs text-gray-400 font-bold">{i + 1}</td>
                                                <td className="py-4 px-4">
                                                    <Link href={`/shop/vendors/${v.id}`} className="font-bold text-sm text-gray-900 dark:text-white hover:text-purple-500 transition-colors">
                                                        {v.name}
                                                    </Link>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-gray-500">{v.phone || '—'}</td>
                                                <td className="py-4 px-6 text-right font-black text-purple-600 text-sm">
                                                    {Number(v.balance).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gray-900 dark:bg-white/5 text-white">
                                            <td colSpan={3} className="py-4 px-6 font-black text-sm text-right">WADARTA</td>
                                            <td className="py-4 px-6 text-right font-black text-lg">{totalPayables.toLocaleString()} ETB</td>
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
