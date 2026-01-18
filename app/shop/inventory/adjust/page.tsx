'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    AlertTriangle,
    Check,
    ArrowRight,
    Package,
    ArrowLeft,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

interface Product {
    id: string;
    name: string;
    sku: string;
    stock: number;
    category: string;
}

export default function StockAdjustmentPage() {
    const router = useRouter();
    const { toast } = useToast();

    // States
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(false);

    // Form States
    const [action, setAction] = useState<'remove' | 'add'>('remove');
    const [reason, setReason] = useState('Damage');
    const [quantity, setQuantity] = useState<number>(1);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Fetch Products based on search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search.length > 1) {
                fetchProducts(search);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchProducts = async (term: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/shop/products?search=${term}`);
            if (res.ok) {
                setProducts(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) {
            toast({ title: "Select a product", variant: "destructive" });
            return;
        }

        setSubmitting(true);
        try {
            // Calculate final signed quantity
            const finalQty = action === 'add' ? quantity : -quantity;

            const res = await fetch('/api/shop/inventory/adjust', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: selectedProduct.id,
                    quantity: finalQty,
                    type: reason,
                    notes: notes
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Adjustment failed');
            }

            toast({ title: "Stock Updated Successfully" });
            router.push('/shop/inventory');
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-3xl mx-auto">
            {/* HEADER */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/shop/inventory" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                    <ArrowLeft size={24} className="text-gray-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Stock Adjustment</h1>
                    <p className="text-sm text-gray-500">Correct inventory levels for damages, loss, or differences.</p>
                </div>
            </div>

            <div className="grid gap-6">
                {/* STEP 1: FIND PRODUCT */}
                <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-black">1</span>
                        Select Product
                    </h2>

                    <div className="relative mb-4">
                        <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name or SKU..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                        />
                    </div>

                    {/* Search Results */}
                    {search.length > 1 && (
                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {loading && <div className="text-center py-4 text-gray-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>}
                            {!loading && products.length === 0 && <div className="text-center py-4 text-gray-400">No products found</div>}

                            {products.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => { setSelectedProduct(p); setSearch(''); setProducts([]); }}
                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all text-left group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 font-bold text-lg">
                                            {p.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{p.name}</p>
                                            <p className="text-xs text-gray-500">SKU: {p.sku}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{p.stock} in stock</p>
                                        <p className="text-xs text-gray-500">{p.category}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Selected Product Display */}
                    {selectedProduct && (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                                    <Package className="text-blue-500" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">{selectedProduct.name}</h3>
                                    <p className="text-sm text-gray-500">Current Stock: <span className="font-bold text-blue-600">{selectedProduct.stock}</span></p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedProduct(null)} className="text-sm font-bold text-red-500 hover:underline">
                                Change
                            </button>
                        </div>
                    )}
                </div>

                {/* STEP 2: ADJUSTMENT DETAILS */}
                {selectedProduct && (
                    <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-black">2</span>
                            Adjustment Details
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Action Type */}
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => { setAction('remove'); setReason('Damage'); }}
                                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${action === 'remove' ? 'border-red-500 bg-red-50 dark:bg-red-900/10 text-red-600' : 'border-gray-100 dark:border-gray-800 hover:border-red-200 text-gray-500'}`}
                                >
                                    <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500"><AlertTriangle size={20} /></div>
                                    <span className="font-bold">Remove Stock</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setAction('add'); setReason('Correction'); }}
                                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${action === 'add' ? 'border-green-500 bg-green-50 dark:bg-green-900/10 text-green-600' : 'border-gray-100 dark:border-gray-800 hover:border-green-200 text-gray-500'}`}
                                >
                                    <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-500"><Check size={20} /></div>
                                    <span className="font-bold">Add Stock</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Reason</label>
                                    <select
                                        value={reason}
                                        onChange={e => setReason(e.target.value)}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 font-bold outline-none"
                                    >
                                        {action === 'remove' ? (
                                            <>
                                                <option value="Damage">Damage</option>
                                                <option value="Loss">Loss / Theft</option>
                                                <option value="Expired">Expired</option>
                                                <option value="Correction">Inventory Correction</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="Correction">Inventory Correction</option>
                                                <option value="Found">Found Item</option>
                                                <option value="Return">Customer Return</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={e => setQuantity(parseInt(e.target.value) || 0)}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 font-bold outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Notes</label>
                                <textarea
                                    rows={2}
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Optional details..."
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 font-medium outline-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || quantity <= 0}
                                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${action === 'remove' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-green-500 hover:bg-green-600 shadow-green-500/20'}`}
                            >
                                {submitting ? <Loader2 className="animate-spin" /> : (
                                    <>
                                        Confirm {action === 'remove' ? 'Removal' : 'Addition'}
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
