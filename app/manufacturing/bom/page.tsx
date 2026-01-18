'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Search, Plus, Filter, Save, Trash2, Edit2, ChevronDown,
    ChevronRight, Box, Layers, DollarSign, Calculator, ArrowRight, Loader2
} from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function BOMPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const urlProductId = searchParams.get('productId');

    const [selectedProductId, setSelectedProductId] = useState<string | null>(urlProductId);
    const [products, setProducts] = useState<any[]>([]);
    const [bomItems, setBomItems] = useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingBOM, setLoadingBOM] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Filter Products
    const [productSearch, setProductSearch] = useState('');

    // Add Item Form
    const [showAddForm, setShowAddForm] = useState(false);
    const [newItem, setNewItem] = useState({
        materialName: '',
        quantity: 1,
        unit: 'pcs',
        costPerUnit: 0
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (selectedProductId) {
            // Update URL
            router.push(`/manufacturing/bom?productId=${selectedProductId}`);
            fetchBOM(selectedProductId);
        } else {
            setBomItems([]);
        }
    }, [selectedProductId]);

    const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
            const res = await fetch('/api/manufacturing/products');
            if (res.ok) {
                const data = await res.json();
                setProducts(data.products || []);
                // If URL param exists but products weren't loaded yet, now we can find the name if needed (but we just need ID)
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingProducts(false);
        }
    };

    const fetchBOM = async (id: string) => {
        setLoadingBOM(true);
        try {
            const res = await fetch(`/api/manufacturing/bom?productId=${id}`);
            if (res.ok) {
                const data = await res.json();
                setBomItems(data.bom || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingBOM(false);
        }
    };

    const handleAddItem = async () => {
        if (!selectedProductId) return;
        if (!newItem.materialName) {
            setToast({ message: 'Enter material name', type: 'error' });
            return;
        }

        try {
            const res = await fetch('/api/manufacturing/bom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: selectedProductId,
                    ...newItem
                })
            });

            if (res.ok) {
                setToast({ message: 'Item added', type: 'success' });
                setShowAddForm(false);
                setNewItem({ materialName: '', quantity: 1, unit: 'pcs', costPerUnit: 0 });
                fetchBOM(selectedProductId);
            } else {
                setToast({ message: 'Failed to add item', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'Error adding item', type: 'error' });
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (!confirm('Remove this item?')) return;
        try {
            await fetch(`/api/manufacturing/bom/${id}`, { method: 'DELETE' });
            fetchBOM(selectedProductId!);
        } catch (e) {
            setToast({ message: 'Error deleting item', type: 'error' });
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
    );

    const checkSelectedProduct = products.find(p => p.id === selectedProductId);

    // Costing
    const totalMaterialCost = bomItems.reduce((acc, item) => acc + parseFloat(item.totalCost), 0);
    const laborCost = 0; // Planned: Add Labor config
    const overhead = 0; // Planned: Add Overhead config
    const finalCost = totalMaterialCost + laborCost + overhead;

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-100px)] gap-6 p-2">

            {/* LEFT PANEL: Product Catalog */}
            <div className="w-full md:w-1/3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <Box className="text-blue-500" /> Product Recipes
                    </h2>
                    <div className="relative mt-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {loadingProducts ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-400" /></div>
                    ) : filteredProducts.map(p => (
                        <div
                            key={p.id}
                            onClick={() => setSelectedProductId(p.id)}
                            className={`p-3 rounded-xl cursor-pointer transition-all border ${selectedProductId === p.id
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm'
                                : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className={`font-semibold text-sm ${selectedProductId === p.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                        {p.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">{p.category}</p>
                                </div>
                                <ChevronRight size={16} className={`mt-1 ${selectedProductId === p.id ? 'text-blue-500' : 'text-gray-300'}`} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <Link href="/manufacturing/products/add" className="w-full py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                        <Plus size={16} /> Create Product
                    </Link>
                </div>
            </div>

            {/* RIGHT PANEL: BOM & Costing */}
            <div className="w-full md:w-2/3 flex flex-col gap-6">

                {selectedProductId && checkSelectedProduct ? (
                    <>
                        {/* BOM Editor */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex-1 flex flex-col">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                        <Layers className="text-purple-500" /> Bill of Materials
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">Recipe for: <span className="font-bold text-gray-900 dark:text-gray-200">{checkSelectedProduct.name}</span></p>
                                </div>
                                <button
                                    onClick={() => setShowAddForm(!showAddForm)}
                                    className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-100 transition"
                                >
                                    <Plus size={16} /> Add Material
                                </button>
                            </div>

                            {/* Add Item Form Inline */}
                            {showAddForm && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-5 gap-4 items-end animate-in slide-in-from-top-2">
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Material Name</label>
                                        <input
                                            autoFocus
                                            type="text"
                                            className="w-full p-2 rounded-lg border border-gray-300 text-sm"
                                            placeholder="e.g. Wood, Screw..."
                                            value={newItem.materialName}
                                            onChange={e => setNewItem({ ...newItem, materialName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Qty</label>
                                        <input
                                            type="number"
                                            className="w-full p-2 rounded-lg border border-gray-300 text-sm"
                                            value={newItem.quantity}
                                            onChange={e => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Cost/Unit</label>
                                        <input
                                            type="number"
                                            className="w-full p-2 rounded-lg border border-gray-300 text-sm"
                                            value={newItem.costPerUnit}
                                            onChange={e => setNewItem({ ...newItem, costPerUnit: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <button onClick={handleAddItem} className="bg-green-500 text-white p-2 rounded-lg font-bold text-sm hover:bg-green-600">Save</button>
                                </div>
                            )}

                            <div className="flex-1 overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-white dark:bg-gray-900/50 text-xs uppercase text-gray-500 font-bold border-b border-gray-200 dark:border-gray-700 sticky top-0">
                                        <tr>
                                            <th className="p-4">Material / Component</th>
                                            <th className="p-4">Quantity</th>
                                            <th className="p-4">Unit Cost</th>
                                            <th className="p-4 text-right">Total</th>
                                            <th className="p-4 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {loadingBOM ? (
                                            <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="animate-spin inline text-gray-400" /></td></tr>
                                        ) : bomItems.length > 0 ? bomItems.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 group">
                                                <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-200">{item.materialName}</td>
                                                <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                                                    <span className="font-bold text-gray-900 dark:text-gray-200">{item.quantity}</span> {item.unit}
                                                </td>
                                                <td className="p-4 text-sm text-gray-600 dark:text-gray-400">${parseFloat(item.costPerUnit).toFixed(2)}</td>
                                                <td className="p-4 text-sm font-bold text-gray-900 dark:text-gray-200 text-right">${parseFloat(item.totalCost).toFixed(2)}</td>
                                                <td className="p-4 text-center">
                                                    <button onClick={() => handleDeleteItem(item.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="p-10 text-center text-gray-400 italic">
                                                    No materials defined yet. Add materials to calculate cost.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Costing Summary Card */}
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-4 rounded-full bg-white/10 backdrop-blur-sm">
                                    <Calculator size={32} className="text-green-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-100">Estimated Cost Price</h3>
                                    <p className="text-sm text-gray-400">Calculated based on ingredients</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="text-right hidden md:block">
                                    <p className="text-xs text-gray-400 uppercase font-bold">Materials</p>
                                    <p className="font-mono text-lg">${totalMaterialCost.toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-green-400 uppercase font-bold">Total Unit Cost</p>
                                    <p className="font-black text-4xl">${finalCost.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                        <Box size={48} className="mb-4 opacity-50" />
                        <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300">Select a Produce</h3>
                        <p className="text-sm">Click on a product from the catalog to view or edit its BOM.</p>
                    </div>
                )}

            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
