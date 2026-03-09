'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    ArrowLeft,
    Package,
    Edit,
    Trash2,
    TrendingUp,
    Calendar,
    DollarSign,
    Layers,
    AlertCircle,
    History,
    Barcode,
    Printer,
    Info,
    ArrowUpRight,
    ArrowDownRight,
    LucideIcon
} from 'lucide-react';
import BarcodeComponent from 'react-barcode';
import { useReactToPrint } from 'react-to-print';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import StatusBadge from '@/components/shop/ui/StatusBadge';

// Data fetched from API now

export default function ProductDetailsPage() {
    const params = useParams();
    const [isEditing, setIsEditing] = useState(false);
    const [product, setProduct] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [exchangeRate, setExchangeRate] = useState<number>(1);

    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        // @ts-ignore
        content: () => printRef.current,
    });

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await fetch(`/api/shop/inventory/${params.id}`);
                if (!response.ok) throw new Error('Product not found');
                const data = await response.json();
                setProduct(data.product);

                // Format history
                const formattedHistory = (data.history || []).map((h: any) => ({
                    date: new Date(h.createdAt).toLocaleDateString(),
                    type: h.type,
                    quantity: h.quantity,
                    note: h.reference || '-'
                }));
                setHistory(formattedHistory);
                // Fetch exchange rate
                const rateRes = await fetch('/api/settings/exchange-rate');
                const rateData = await rateRes.json();
                if (rateData.rate) {
                    setExchangeRate(rateData.rate.rate);
                }
            } catch (error) {
                console.error('Error loading product:', error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchProduct();
        }
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3498DB]"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <AlertCircle size={48} className="text-red-500" />
                <h2 className="text-xl font-bold">Product not found</h2>
                <Link href="/shop/inventory" className="text-[#3498DB] hover:underline">
                    Back to Inventory
                </Link>
            </div>
        );
    }

    const displayedCostPrice = product.costPriceUSD > 0
        ? product.costPriceUSD * exchangeRate
        : product.costPrice;

    const profit = product.sellingPrice - displayedCostPrice;
    const profitMargin = product.sellingPrice > 0
        ? ((profit / product.sellingPrice) * 100).toFixed(1)
        : '0.0';

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-7xl mx-auto p-4 md:p-8">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Link href="/shop/inventory" className="group flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-gray-400 hover:text-[#3498DB] transition-all">
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Inventory
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                            {product.name}
                        </h1>
                        <StatusBadge status={product.status} />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">SKU: <span className="text-gray-900 dark:text-gray-200 font-bold font-mono">{product.sku}</span></p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handlePrint}
                        className="px-6 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-black text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2 group shadow-sm"
                    >
                        <Printer size={20} className="group-hover:-translate-y-0.5 transition-transform" /> Print Label
                    </button>
                    <Link href={`/shop/inventory/${params.id}/edit`} className="px-6 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 font-black text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2 group shadow-sm">
                        <Edit size={20} className="group-hover:rotate-12 transition-transform" /> Edit
                    </Link>
                    <button className="px-6 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black shadow-xl shadow-red-500/20 transition-all flex items-center gap-2 transform active:scale-95">
                        <Trash2 size={20} /> Delete
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT COLUMN: Main Info & History (8 cols) */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Visual Asset Card */}
                    <div className="bg-white dark:bg-[#151C2C] border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-10 shadow-sm overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                        <div className="relative z-10 flex flex-col md:flex-row gap-10 items-start">
                            {/* Product Representation */}
                            <div className="w-56 h-56 rounded-[2rem] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center flex-shrink-0 border border-gray-100 dark:border-gray-700 shadow-inner group overflow-hidden">
                                <Package size={100} className="text-gray-300 dark:text-gray-700 group-hover:scale-110 group-hover:text-blue-500/20 transition-all duration-500" />
                            </div>

                            <div className="flex-1 space-y-6">
                                <div>
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Product Overview</h3>
                                    <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                                        {product.description || 'No detailed description provided for this catalog item. High-quality stock item maintained by Revlo Inventory System.'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-gray-50 dark:border-gray-800">
                                    <InfoItem label="Catalog Category" value={product.category} icon={Layers} color="blue" />
                                    <InfoItem label="Primary Supplier" value={product.supplier?.name || 'Direct Import'} icon={Package} color="orange" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Barcode & Label Section */}
                    <div className="bg-white dark:bg-[#151C2C] border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-10 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                                    <Barcode size={24} />
                                </div>
                                Barcode Label & Assets
                            </h3>
                            <button
                                onClick={handlePrint}
                                className="text-sm font-black text-blue-600 hover:text-blue-700 flex items-center gap-2 px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-xl transition-all"
                            >
                                <Printer size={16} /> Print Label Template
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row gap-8 items-center justify-center bg-gray-50/50 dark:bg-gray-800/20 p-8 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-700">
                            {/* The Label used for Print */}
                            <div
                                ref={printRef}
                                className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center gap-2 print:m-0 print:border-none print:shadow-none min-w-[300px]"
                            >
                                <h4 className="font-black text-gray-900 text-center uppercase text-sm">{product.name}</h4>
                                <div className="py-2">
                                    <BarcodeComponent
                                        value={product.sku || 'SKU-000000'}
                                        width={1.5}
                                        height={60}
                                        fontSize={12}
                                        margin={0}
                                        background="#ffffff"
                                    />
                                </div>
                                <div className="flex justify-between w-full mt-1 border-t pt-2 px-2">
                                    <span className="text-[10px] font-black italic">REVLO-SYSTEM</span>
                                    <span className="text-xs font-black">ETB {product.sellingPrice.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="max-w-xs space-y-4">
                                <p className="text-sm text-gray-500 font-medium">
                                    Use this barcode for POS scanning and inventory tracking. Labels are formatted for standard 50x30mm thermal printers.
                                </p>
                                <div className="flex items-center gap-2 text-xs font-black text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-lg w-fit">
                                    <AlertCircle size={14} /> Unique SKU Required
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stock Movement History */}
                    <div className="bg-white dark:bg-[#151C2C] border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-xl">
                                    <History size={24} />
                                </div>
                                Operational History
                            </h3>
                        </div>

                        <div className="space-y-4 relative">
                            {/* Vertical Line */}
                            <div className="absolute left-[27px] top-2 bottom-10 w-0.5 bg-gray-100 dark:bg-gray-800 hidden sm:block"></div>

                            {history.length === 0 ? (
                                <div className="text-center py-10 opacity-30">
                                    <Package size={48} className="mx-auto mb-2" />
                                    <p className="font-bold">No historical data recorded</p>
                                </div>
                            ) : (
                                history.map((entry, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-4 relative z-10 group">
                                        <div className={`hidden sm:flex w-14 h-14 rounded-2xl items-center justify-center shrink-0 border-4 border-white dark:border-[#151C2C] shadow-sm transition-all group-hover:scale-110 ${entry.quantity > 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                            }`}>
                                            {entry.quantity > 0 ? <TrendingUp size={20} /> : <TrendingUp size={20} className="rotate-180" />}
                                        </div>
                                        <div className="flex-1 bg-gray-50/50 dark:bg-gray-800/10 hover:bg-white dark:hover:bg-gray-800 p-5 rounded-2xl border border-transparent hover:border-gray-100 transition-all flex items-center justify-between shadow-sm hover:shadow-md">
                                            <div>
                                                <p className="font-black text-gray-900 dark:text-white text-base">{entry.type}</p>
                                                <p className="text-sm text-gray-500 font-medium">{entry.note}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-xl font-black ${entry.quantity > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    {entry.quantity > 0 ? '+' : ''}{entry.quantity}
                                                </p>
                                                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mt-1">{entry.date}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Business Intelligence (4 cols) */}
                <div className="lg:col-span-4 space-y-8">

                    {/* Valutaion / Selling Section */}
                    <div className="bg-gradient-to-br from-[#2ECC71] to-[#27AE60] p-10 rounded-[2.5rem] shadow-xl shadow-green-500/10 text-white relative overflow-hidden group">
                        <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                        <div className="relative z-10 space-y-8">
                            <div>
                                <h4 className="text-green-100 text-xs font-black uppercase tracking-[0.2em] mb-4">Market Valuation</h4>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xl font-bold opacity-80 uppercase">ETB</span>
                                    <h2 className="text-5xl font-black tracking-tighter">{product.sellingPrice.toLocaleString()}</h2>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-white/20 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-green-100 mb-1">Stock Value</p>
                                    <p className="text-xl font-black">ETB {(product.sellingPrice * product.stock).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${profit >= 0 ? 'text-green-100' : 'text-red-100'}`}>
                                        Est. Profit
                                    </p>
                                    <p className="text-xl font-black">ETB {(profit * product.stock).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Profit Margin Analysis */}
                    <div className="bg-white dark:bg-[#151C2C] border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-8 shadow-sm">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Financial Performance</h4>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                                        <TrendingUp size={18} />
                                    </div>
                                    <span className="text-sm font-bold text-gray-600 dark:text-gray-400">Unit Profit</span>
                                </div>
                                <span className="font-black text-gray-900 dark:text-white">ETB {profit.toLocaleString()}</span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-bold text-gray-500 uppercase text-[10px] tracking-widest">ROI Efficiency</span>
                                    <span className={`font-black ${parseFloat(profitMargin) > 30 ? 'text-green-500' : 'text-orange-500'}`}>{profitMargin}%</span>
                                </div>
                                <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${parseFloat(profitMargin) > 30 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]'}`}
                                        style={{ width: `${Math.min(parseFloat(profitMargin), 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium italic">Calculated based on unit acquisition cost vs current listing price.</p>
                            </div>
                        </div>
                    </div>

                    {/* Stock & Availability */}
                    <div className="bg-white dark:bg-[#151C2C] border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-8 shadow-sm">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Stock Intelligence</h4>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="relative w-16 h-16 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle className="text-gray-100 dark:text-gray-800" strokeWidth="6" stroke="currentColor" fill="transparent" r="28" cx="32" cy="32" />
                                        <circle
                                            className={`${product.stock > product.minStock ? 'text-blue-500' : 'text-red-500'}`}
                                            strokeWidth="6"
                                            strokeDasharray={175.9}
                                            strokeDashoffset={175.9 - (175.9 * Math.min(product.stock / (product.minStock * 4 || 100), 1))}
                                            strokeLinecap="round"
                                            stroke="currentColor"
                                            fill="transparent"
                                            r="28"
                                            cx="32"
                                            cy="32"
                                        />
                                    </svg>
                                    <span className="absolute text-sm font-black text-gray-900 dark:text-white">{product.stock}</span>
                                </div>
                                <div>
                                    <p className="font-black text-gray-900 dark:text-white text-lg">Current Count</p>
                                    <p className="text-xs text-gray-500 font-medium">System reports active units</p>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-gray-800/20 rounded-2xl flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Reorder Point</span>
                                <span className="font-black text-gray-900 dark:text-white">{product.minStock} Units</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}

// Helper Component for Info Items
function InfoItem({ label, value, icon: Icon, color }: { label: string; value: string; icon: LucideIcon; color: 'blue' | 'orange' }) {
    return (
        <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'} dark:bg-opacity-5`}>
                <Icon size={18} />
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
                <p className="font-black text-gray-800 dark:text-gray-200 text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">{value}</p>
            </div>
        </div>
    );
}
