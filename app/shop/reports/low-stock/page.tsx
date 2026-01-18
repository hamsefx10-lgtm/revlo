'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, ArrowLeft, Download, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface Product {
    id: string;
    name: string;
    sku: string;
    category: string;
    stock: number;
    minStock: number;
    costPrice: number;
    sellingPrice: number;
}

export default function LowStockReportPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/shop/inventory');
            const data = await response.json();
            if (data.products) {
                // Filter for low stock
                const lowStock = data.products.filter((p: Product) => p.stock <= p.minStock);
                setProducts(lowStock);
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-5xl mx-auto md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-4 md:px-0 print:hidden">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/shop/reports" className="text-mediumGray hover:text-darkGray dark:hover:text-white transition-colors flex items-center gap-1 text-xs font-black uppercase tracking-wider">
                            <ArrowLeft size={14} /> Back to Reports
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-darkGray dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl shadow-sm border border-red-200 dark:border-red-900 text-red-600">
                            <AlertTriangle size={28} />
                        </div>
                        Low Stock Report
                    </h1>
                </div>
                <button
                    onClick={handlePrint}
                    className="px-6 py-3 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-primary/30 transform hover:-translate-y-1 self-start md:self-auto"
                >
                    <Download size={18} /> Print Report
                </button>
            </div>

            {/* Report Content */}
            <div className="bg-white dark:bg-gray-900 border border-lightGray dark:border-gray-800 rounded-[2rem] shadow-sm overflow-hidden mx-4 md:mx-0 p-8 print:shadow-none print:border-none print:p-0 animate-fade-in-up">

                <div className="mb-8 border-b border-lightGray dark:border-gray-800 pb-8 flex justify-between items-end">
                    <div>
                        <h2 className="text-xl font-black text-darkGray dark:text-white uppercase tracking-tight">Inventory Alert Status</h2>
                        <p className="text-sm font-medium text-mediumGray mt-1">Generated automatically on {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-mediumGray uppercase tracking-wider mb-1">Items Needing Attention</p>
                        <p className="text-4xl font-black text-red-500">{products.length}</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-primary" size={40} />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-lightGray dark:border-gray-700 text-[10px] uppercase text-mediumGray font-black tracking-wider">
                                    <th className="py-4 pr-4">Product Name</th>
                                    <th className="py-4 px-4">SKU</th>
                                    <th className="py-4 px-4 text-center">Current Stock</th>
                                    <th className="py-4 px-4 text-center">Min Level</th>
                                    <th className="py-4 pl-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm font-bold text-darkGray dark:text-gray-300">
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-mediumGray font-medium">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                                    <AlertTriangle size={24} />
                                                </div>
                                                <p>Excellent! No low stock items found.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    products.map(p => (
                                        <tr key={p.id} className="border-b border-lightGray dark:border-gray-800 hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors">
                                            <td className="py-5 pr-4 font-black text-darkGray dark:text-white">{p.name}</td>
                                            <td className="py-5 px-4 font-mono text-xs text-mediumGray">{p.sku}</td>
                                            <td className="py-5 px-4 text-center">
                                                <span className="inline-block px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm font-black border border-red-200">
                                                    {p.stock}
                                                </span>
                                            </td>
                                            <td className="py-5 px-4 text-center text-mediumGray">{p.minStock}</td>
                                            <td className="py-5 pl-4 text-right">
                                                {p.stock === 0 ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-100 text-red-700 border border-red-200 text-[10px] font-black uppercase tracking-wide">
                                                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" /> Out of Stock
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-100 text-orange-700 border border-orange-200 text-[10px] font-black uppercase tracking-wide">
                                                        Low Stock
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-8 pt-8 border-t border-lightGray dark:border-gray-800 text-[10px] uppercase tracking-widest text-center text-mediumGray font-bold">
                    <p>End of Report • RevloVR Shop Manager</p>
                </div>
            </div>
        </div>
    );
}
