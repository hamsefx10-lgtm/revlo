'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Package, AlertTriangle, TrendingUp, BarChart3, DollarSign } from 'lucide-react';
import UltraIcon from '@/components/shop/ui/UltraIcon';

export default function InventoryReportPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchProducts(); }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/shop/products');
            const data = await res.json();
            setProducts(data.products || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const totalStock = products.reduce((s, p) => s + (p.stock || 0), 0);
    const totalValue = products.reduce((s, p) => s + ((p.stock || 0) * Number(p.costPrice || p.price || 0)), 0);
    const totalRetailValue = products.reduce((s, p) => s + ((p.stock || 0) * Number(p.price || 0)), 0);
    const lowStockProducts = products.filter(p => (p.stock || 0) <= (p.reorderLevel || 5) && p.stock > 0);
    const outOfStock = products.filter(p => (p.stock || 0) <= 0);
    const potentialProfit = totalRetailValue - totalValue;

    // Category breakdown
    const catMap: Record<string, { count: number; value: number; stock: number }> = {};
    products.forEach(p => {
        const cat = p.category?.name || 'Kale';
        if (!catMap[cat]) catMap[cat] = { count: 0, value: 0, stock: 0 };
        catMap[cat].count++;
        catMap[cat].value += (p.stock || 0) * Number(p.costPrice || p.price || 0);
        catMap[cat].stock += p.stock || 0;
    });
    const catEntries = Object.entries(catMap).sort((a, b) => b[1].value - a[1].value);

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-7xl mx-auto p-4 md:p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/shop/reports" className="p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-orange-500 transition-all shadow-sm">
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <UltraIcon icon={Package} variant="accent" />
                        Warbixinta Kaydka (Inventory Report)
                    </h1>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Stock Value, Low Stock, iyo Category Breakdown</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" size={40} /></div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-[2rem] p-6 text-white shadow-xl shadow-orange-500/20">
                            <p className="text-orange-100 text-[9px] font-black uppercase tracking-widest mb-1">Wadarta Alaabta</p>
                            <h3 className="text-3xl font-black">{products.length}</h3>
                            <p className="text-orange-200 text-[10px] mt-1">{totalStock.toLocaleString()} units guud</p>
                        </div>
                        <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                            <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-1">Qiimaha Kaydka (Cost)</p>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white">{totalValue.toLocaleString()}</h3>
                            <p className="text-gray-400 text-[10px] mt-1">ETB — Sicirka Gadashada</p>
                        </div>
                        <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
                            <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-1">Qiimaha Iibka (Retail)</p>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white">{totalRetailValue.toLocaleString()}</h3>
                            <p className="text-gray-400 text-[10px] mt-1">ETB — Sicirka Iibka</p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-[2rem] p-6 border border-emerald-100 dark:border-emerald-800/30 shadow-sm">
                            <p className="text-emerald-600 text-[9px] font-black uppercase tracking-widest mb-1">Faa'iido Suurtagal</p>
                            <h3 className="text-2xl font-black text-emerald-600">{potentialProfit.toLocaleString()}</h3>
                            <p className="text-emerald-500 text-[10px] mt-1">ETB — Hadii dhammaantii la iibiyo</p>
                        </div>
                    </div>

                    {/* Alerts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-5 flex items-start gap-3">
                            <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="font-black text-amber-800 dark:text-amber-300 text-sm">Low Stock Warning</p>
                                <p className="text-xs text-amber-600 dark:text-amber-400">{lowStockProducts.length} alaab oo stock-kooda yar yahay</p>
                            </div>
                        </div>
                        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/30 rounded-2xl p-5 flex items-start gap-3">
                            <Package className="text-rose-500 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="font-black text-rose-800 dark:text-rose-300 text-sm">Out of Stock</p>
                                <p className="text-xs text-rose-600 dark:text-rose-400">{outOfStock.length} alaab oo stock-koodu ebar yahay</p>
                            </div>
                        </div>
                    </div>

                    {/* Category Breakdown */}
                    <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm mb-8">
                        <h3 className="font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <BarChart3 size={18} className="text-orange-500" /> Qaybinta Qaybaha (Category Breakdown)
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                                        <th className="text-left py-3 px-4">Qaybta</th>
                                        <th className="text-center py-3">Alaabta</th>
                                        <th className="text-center py-3">Stock</th>
                                        <th className="text-right py-3 px-4">Qiimaha (ETB)</th>
                                        <th className="text-right py-3 px-4">%</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {catEntries.map(([cat, data]) => (
                                        <tr key={cat} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="py-3 px-4 font-bold text-sm text-gray-900 dark:text-white">{cat}</td>
                                            <td className="py-3 text-center text-sm text-gray-500 font-bold">{data.count}</td>
                                            <td className="py-3 text-center text-sm text-gray-500 font-bold">{data.stock.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right font-black text-sm text-gray-900 dark:text-white">{data.value.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right text-sm text-gray-400 font-bold">{totalValue > 0 ? (data.value / totalValue * 100).toFixed(1) : 0}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Low Stock Table */}
                    {lowStockProducts.length > 0 && (
                        <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 border border-amber-100 dark:border-amber-800/30 shadow-sm">
                            <h3 className="font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <AlertTriangle size={18} className="text-amber-500" /> Alaabta Stock-keeda Yar (Low Stock Items)
                            </h3>
                            <div className="space-y-2">
                                {lowStockProducts.map(p => (
                                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/5 border border-amber-100 dark:border-amber-800/20">
                                        <div>
                                            <p className="font-bold text-sm text-gray-900 dark:text-white">{p.name}</p>
                                            <p className="text-[10px] text-gray-400">{p.category?.name || 'Kale'} • SKU: {p.sku || 'N/A'}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-black">{p.stock} haray</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
