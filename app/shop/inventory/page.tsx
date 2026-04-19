'use client';

import React, { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Package,
    Download,
    Edit,
    Trash2,
    Upload,
    TrendingUp,
    AlertTriangle,
    Archive,
    DollarSign,
    MoreVertical,
    Eye
} from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/shop/ui/StatusBadge';
import { useToast } from '@/components/ui/use-toast';
import { useShopLang } from '@/contexts/ShopLanguageContext';

// --- TYPES ---
interface InventoryItem {
    id: string;
    name: string;
    sku: string;
    category: string;
    sellingPrice: number;
    stock: number;
    status: 'In Stock' | 'Low Stock' | 'Out of Stock';
    lastUpdated: string;
    costPrice: number;
    costPriceUSD: number;
}

export default function InventoryPage() {
    const { t } = useShopLang();
    const [filter, setFilter] = useState<'All' | 'Low Stock' | 'Out of Stock'>('All');
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [exchangeRate, setExchangeRate] = useState<number>(1);
    const [viewCurrency, setViewCurrency] = useState<'ETB' | 'USD'>('ETB');
    const { toast } = useToast();

    // Fetch products from API
    useEffect(() => {
        fetchProducts();
    }, [filter, search]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (filter !== 'All') params.append('status', filter);

            const response = await fetch(`/api/shop/inventory?${params}`);

            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }

            const data = await response.json();
            setProducts(data.products || []);

            // Fetch exchange rate
            const rateRes = await fetch('/api/settings/exchange-rate');
            const rateData = await rateRes.json();
            if (rateData.rate) {
                setExchangeRate(rateData.rate.rate);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            toast({
                title: 'Error',
                description: 'Failed to load inventory. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`${t('delete')} "${name}"?`)) return;

        try {
            const response = await fetch(`/api/shop/inventory/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete product');
            }

            toast({
                title: t('success'),
                description: `${name} — ${t('delete')}`,
            });

            fetchProducts(); // Refresh list
        } catch (error) {
            console.error('Error deleting product:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete product. Please try again.',
                variant: 'destructive'
            });
        }
    };

    const filteredData = products.filter(item => {
        const matchesFilter = filter === 'All' || item.status === filter;
        const matchesSearch = search === '' ||
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.sku.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-[#F39C12] to-[#E67E22] rounded-2xl shadow-lg shadow-orange-500/20 text-white">
                            <Package size={32} />
                        </div>
                        Inventory <span className="text-[#3498DB]">Hub</span>
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-base font-medium">{t('inventory_desc')}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2 group">
                        <Download size={18} className="group-hover:translate-y-0.5 transition-transform" /> {t('export')}
                    </button>
                    <Link href="/shop/inventory/bulk-import" className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2 group">
                        <Upload size={18} className="group-hover:-translate-y-0.5 transition-transform" /> {t('bulk_import')}
                    </Link>
                    <Link href="/shop/inventory/adjust" className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2 group">
                        <Edit size={18} className="group-hover:rotate-12 transition-transform" /> {t('adjust_stock')}
                    </Link>
                    <Link href="/shop/inventory/add" className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#3498DB] to-[#2980B9] hover:from-[#2980B9] hover:to-[#3498DB] text-white font-bold shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center gap-2 transform active:scale-95">
                        <Plus size={20} strokeWidth={3} /> {t('add_product')}
                    </Link>
                </div>
            </div>

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {/* Total Products */}
                <div className="bg-white dark:bg-[#151C2C] p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm group hover:border-blue-500/50 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <Archive size={24} />
                        </div>
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total SKU</span>
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white">{products.length}</h3>
                    <p className="text-sm text-gray-500 mt-1">{t('in_stock')}</p>
                </div>

                {/* Stock Value */}
                <div className="bg-white dark:bg-[#151C2C] p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm group hover:border-green-500/50 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <DollarSign size={24} />
                        </div>
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Stock Value</span>
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white">
                        {viewCurrency === 'USD' ? '$' : ''}
                        {(products.reduce((acc, p) => {
                            const cost = p.costPriceUSD > 0
                                ? (viewCurrency === 'USD' ? p.costPriceUSD : p.costPriceUSD * exchangeRate)
                                : (viewCurrency === 'USD' ? p.costPrice / exchangeRate : p.costPrice);
                            return acc + (cost * p.stock);
                        }, 0)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        {viewCurrency === 'ETB' ? ' ETB' : ''}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{t('inventory_value')}</p>
                </div>

                {/* Low Stock */}
                <div className="bg-white dark:bg-[#151C2C] p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm group hover:border-yellow-500/50 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Low Stock</span>
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white">
                        {products.filter(p => p.status === 'Low Stock').length}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{t('reorder')}</p>
                </div>

                {/* Out of Stock */}
                <div className="bg-white dark:bg-[#151C2C] p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm group hover:border-red-500/50 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <AlertTriangle size={24} />
                        </div>
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Out of Stock</span>
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white text-red-500">
                        {products.filter(p => p.status === 'Out of Stock').length}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{t('action_needed')}</p>
                </div>
            </div>

            {/* FILTER BAR */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                {/* Tabs */}
                {/* Tabs & Currency Toggle */}
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
                        {[t('all_status'), t('low_stock_label'), t('out_of_stock')].map((tab, idx) => {
                            const filterKeys = ['All', 'Low Stock', 'Out of Stock'] as const;
                            return (
                            <button
                                key={filterKeys[idx]}
                                onClick={() => setFilter(filterKeys[idx])}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === filterKeys[idx]
                                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                {tab}
                            </button>
                            );
                        })}
                    </div>

                    {/* Currency Toggle */}
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
                        <button
                            onClick={() => setViewCurrency('ETB')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewCurrency === 'ETB'
                                ? 'bg-[#3498DB] text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            ETB View
                        </button>
                        <button
                            onClick={() => setViewCurrency('USD')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewCurrency === 'USD'
                                ? 'bg-[#27AE60] text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            USD View
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative w-full md:w-80">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder={t('search_placeholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB] transition-all font-medium text-sm"
                    />
                </div>
            </div>

            {/* TABLE CARD */}
            <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3498DB]"></div>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="text-center py-20">
                        <Package size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">{t('no_data')}</p>
                        <Link href="/shop/inventory/add" className="inline-block mt-4 text-[#3498DB] font-bold hover:underline">
                            {t('add_product')}
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-800/20 border-b border-gray-100 dark:border-gray-800">
                                    <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{t('product_name')}</th>
                                    <th className="px-6 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{t('category')}</th>
                                    <th className="px-6 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{t('buying_price')}</th>
                                    <th className="px-6 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{t('selling_price')}</th>
                                    <th className="px-6 py-5 text-center text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{t('in_stock')}</th>
                                    <th className="px-6 py-5 text-center text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{t('status')}</th>
                                    <th className="px-6 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredData.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link href={`/shop/inventory/${item.id}`} className="block hover:text-[#3498DB] transition-colors">
                                                <span className="block font-bold text-gray-900 dark:text-white text-sm">{item.name}</span>
                                                <span className="text-xs text-gray-400 font-mono">SKU: {item.sku}</span>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                                            <div className="font-bold">
                                                {viewCurrency === 'ETB' ? (
                                                    (item.costPriceUSD > 0 ? item.costPriceUSD * exchangeRate : item.costPrice).toLocaleString()
                                                ) : (
                                                    (item.costPriceUSD > 0 ? item.costPriceUSD : item.costPrice / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                )}
                                            </div>
                                            {item.costPriceUSD > 0 && viewCurrency === 'ETB' && (
                                                <div className="text-[10px] text-blue-500 font-bold">
                                                    USD {item.costPriceUSD.toLocaleString()}
                                                </div>
                                            )}
                                            {item.costPriceUSD === 0 && viewCurrency === 'USD' && (
                                                <div className="text-[10px] text-gray-400 font-bold">
                                                    ETB {item.costPrice.toLocaleString()}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-gray-900 dark:text-white">
                                            {viewCurrency === 'ETB'
                                                ? item.sellingPrice.toLocaleString()
                                                : (item.sellingPrice / exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`font-bold text-sm ${item.stock < 10 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {item.stock}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap flex justify-center">
                                            <StatusBadge status={item.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link href={`/shop/inventory/${item.id}`} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all" title="View Details">
                                                    <Eye size={18} />
                                                </Link>
                                                <Link href={`/shop/inventory/${item.id}/edit`} className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-all" title="Edit Product">
                                                    <Edit size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(item.id, item.name)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                    title="Delete Product"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
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
