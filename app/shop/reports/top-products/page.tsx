'use client';

import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    TrendingUp,
    Package,
    Trophy,
    Loader2
} from 'lucide-react';
import Link from 'next/link';

interface TopProduct {
    id: string;
    name: string;
    sold: number;
    revenue: number;
}

export default function TopProductsPage() {
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<TopProduct[]>([]);

    useEffect(() => {
        fetchTopProducts();
    }, []);

    const fetchTopProducts = async () => {
        try {
            const response = await fetch('/api/shop/reports/top-products');
            const data = await response.json();
            setProducts(data.topProducts || []);
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
                            <ArrowLeft size={14} /> Back to Reports
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-darkGray dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-accent to-orange-600 rounded-2xl shadow-lg shadow-accent/30 text-white">
                            <Trophy size={28} />
                        </div>
                        Top Selling Products
                    </h1>
                    <p className="text-mediumGray font-medium mt-2 ml-1 text-sm">Best performing items in the last 30 days.</p>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white dark:bg-gray-900 border border-lightGray dark:border-gray-800 rounded-[2rem] shadow-sm overflow-hidden mx-4 md:mx-0 animate-fade-in-up">
                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 animate-spin text-accent" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="p-12 text-center text-mediumGray font-medium">
                        No sales data found for this period.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-lightGray dark:border-gray-800">
                                    <th className="pl-8 py-5 text-left text-[10px] font-black text-mediumGray uppercase tracking-wider">Rank</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-mediumGray uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-5 text-center text-[10px] font-black text-mediumGray uppercase tracking-wider">Units Sold</th>
                                    <th className="px-6 py-5 text-right text-[10px] font-black text-mediumGray uppercase tracking-wider pr-8">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-lightGray dark:divide-gray-800">
                                {products.map((p, index) => (
                                    <tr key={p.id} className="hover:bg-accent/5 dark:hover:bg-gray-800/30 transition-colors group">
                                        <td className="pl-8 py-5 whitespace-nowrap">
                                            <div className={`
                                                w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-sm
                                                ${index === 0 ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-200' :
                                                    index === 1 ? 'bg-gray-100 text-gray-700 ring-2 ring-gray-200' :
                                                        index === 2 ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-200' : 'bg-gray-50 text-mediumGray ring-1 ring-gray-100'}
                                            `}>
                                                {index + 1}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-mediumGray border border-lightGray dark:border-gray-700 group-hover:bg-white group-hover:border-accent/20 group-hover:text-accent transition-all shadow-inner">
                                                    <Package size={22} />
                                                </div>
                                                <span className="font-bold text-darkGray dark:text-white text-sm group-hover:text-accent transition-colors">{p.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-center text-sm font-bold text-darkGray dark:text-gray-300">
                                            {p.sold.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-black text-darkGray dark:text-white pr-8">
                                            ETB {p.revenue.toLocaleString()}
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
