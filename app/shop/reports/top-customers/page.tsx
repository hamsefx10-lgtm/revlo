'use client';

import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Users,
    UserCircle,
    Trophy,
    Loader2,
    Phone
} from 'lucide-react';
import Link from 'next/link';

interface TopCustomer {
    id: string;
    name: string;
    phone: string;
    orders: number;
    revenue: number;
}

export default function TopCustomersPage() {
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState<TopCustomer[]>([]);

    useEffect(() => {
        fetchTopCustomers();
    }, []);

    const fetchTopCustomers = async () => {
        try {
            const response = await fetch('/api/shop/reports/top-customers');
            const data = await response.json();
            setCustomers(data.topCustomers || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-5xl mx-auto md:p-8">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-4 md:px-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/shop/reports" className="text-mediumGray hover:text-darkGray dark:hover:text-white transition-colors flex items-center gap-1 text-xs font-black uppercase tracking-wider">
                            <ArrowLeft size={14} /> Dib ugu Noqo Warbixinada
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-darkGray dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30 text-white">
                            <Users size={28} />
                        </div>
                        Macaamiisha Ugu Iibsiga Badan
                    </h1>
                    <p className="text-mediumGray font-medium mt-2 ml-1 text-sm">Liiska macaamiisha lacagta ugu badan ku bixiyay 30-kii maalmood ee la soo dhaafay.</p>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white dark:bg-gray-900 border border-lightGray dark:border-gray-800 rounded-[2rem] shadow-sm overflow-hidden mx-4 md:mx-0 animate-fade-in-up">
                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    </div>
                ) : customers.length === 0 ? (
                    <div className="p-12 text-center text-mediumGray font-medium">
                        Wali xogta macaamiisha lama hayo ama majiraan macaamiil wax iibsaday dhawaan.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-lightGray dark:border-gray-800">
                                    <th className="pl-8 py-5 text-left text-[10px] font-black text-mediumGray uppercase tracking-wider">Kaalinta</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-mediumGray uppercase tracking-wider">Macmiilka</th>
                                    <th className="px-6 py-5 text-center text-[10px] font-black text-mediumGray uppercase tracking-wider">Tirada Iibka (Orders)</th>
                                    <th className="px-6 py-5 text-right text-[10px] font-black text-mediumGray uppercase tracking-wider pr-8">Lacagta (Revenue)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-lightGray dark:divide-gray-800">
                                {customers.map((c, index) => (
                                    <tr key={c.id} className="hover:bg-blue-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                                        <td className="pl-8 py-5 whitespace-nowrap">
                                            <div className={`
                                                w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-sm
                                                ${index === 0 ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-200' :
                                                    index === 1 ? 'bg-gray-200 text-gray-700 ring-2 ring-gray-300' :
                                                        index === 2 ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-200' : 'bg-gray-50 text-mediumGray ring-1 ring-gray-100'}
                                            `}>
                                                {index === 0 ? <Trophy size={14} className="text-yellow-600" /> : index + 1}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-mediumGray border border-lightGray dark:border-gray-700 group-hover:bg-white group-hover:border-blue-500/20 group-hover:text-blue-500 transition-all shadow-inner">
                                                    <UserCircle size={24} strokeWidth={1.5} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-darkGray dark:text-white text-sm group-hover:text-blue-500 transition-colors">{c.name}</span>
                                                    {c.phone && c.phone !== 'N/A' && (
                                                        <span className="text-xs text-mediumGray flex items-center gap-1 mt-0.5">
                                                            <Phone size={10} /> {c.phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-center text-sm font-bold text-darkGray dark:text-gray-300">
                                            <span className="bg-gray-100 dark:bg-gray-800 text-darkGray dark:text-gray-300 px-3 py-1 rounded-full text-xs border border-gray-200 dark:border-gray-700">
                                                {c.orders.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-black text-darkGray dark:text-white pr-8">
                                            ETB {c.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
