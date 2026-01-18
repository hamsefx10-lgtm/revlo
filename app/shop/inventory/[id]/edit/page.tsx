'use client';

import React, { useState, useEffect } from 'react';
import {
    Save,
    ArrowLeft,
    Package,
    CheckCircle2,
    AlertCircle,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

export default function EditProductPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        category: '',
        supplierId: '',
        description: '',
        costPrice: 0,
        sellingPrice: 0,
        stock: 0,
        minStock: 5
    });

    // State for Lists
    const [categories, setCategories] = useState<string[]>([]);
    const [suppliers, setSuppliers] = useState<{ id: string, name: string }[]>([]);

    // Modal State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newSupplierData, setNewSupplierData] = useState({ name: '', contact: '' });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch lists in parallel
                const [productRes, catsRes, vendsRes] = await Promise.all([
                    fetch(`/api/shop/inventory/${params.id}`),
                    fetch('/api/shop/categories'),
                    fetch('/api/shop/vendors')
                ]);

                if (catsRes.ok) setCategories(await catsRes.json());
                if (vendsRes.ok) {
                    const data = await vendsRes.json();
                    setSuppliers((data.vendors || []).map((v: any) => ({ id: v.id, name: v.companyName || v.name })));
                }

                if (!productRes.ok) throw new Error('Product not found');
                const data = await productRes.json();
                const product = data.product;

                setFormData({
                    name: product.name,
                    category: product.category,
                    supplierId: product.supplierId || '',
                    description: product.description || '',
                    costPrice: product.costPrice,
                    sellingPrice: product.sellingPrice,
                    stock: product.stock,
                    minStock: product.minStock
                });
            } catch (error) {
                console.error('Error loading data:', error);
                toast({
                    title: "Error",
                    description: "Failed to load product details.",
                    variant: "destructive"
                });
            } finally {
                setIsFetching(false);
            }
        };

        if (params.id) {
            fetchInitialData();
        }
    }, [params.id, toast]);

    const handleCreateCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName) return;
        setCategories(prev => [...prev, newCategoryName]);
        handleChange('category', newCategoryName);
        setIsCategoryModalOpen(false);
        setNewCategoryName('');
    };

    const handleCreateSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSupplierData.name) return;

        try {
            const res = await fetch('/api/shop/vendors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyName: newSupplierData.name,
                    contactPerson: newSupplierData.contact,
                    category: 'General'
                })
            });

            if (res.ok) {
                const data = await res.json();
                const newVendor = { id: data.vendor.id, name: data.vendor.name || data.vendor.companyName };
                setSuppliers(prev => [...prev, newVendor]);
                handleChange('supplierId', newVendor.id);
                setIsSupplierModalOpen(false);
                setNewSupplierData({ name: '', contact: '' });
                toast({ title: "Supplier added successfully" });
            }
        } catch (error) {
            console.error('Error adding supplier:', error);
            toast({ title: "Failed to add supplier", variant: "destructive" });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`/api/shop/inventory/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to update product');

            toast({
                title: "Success",
                description: "Product updated successfully.",
            });

            router.push(`/shop/inventory/${params.id}`);
        } catch (error) {
            console.error('Error updating product:', error);
            toast({
                title: "Error",
                description: "Failed to update product.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-5xl mx-auto p-4 md:p-8">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href={`/shop/inventory/${params.id}`} className="text-gray-400 hover:text-[#3498DB] transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                            <ArrowLeft size={14} /> Back to Product
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-[#F39C12] to-[#E67E22] rounded-xl shadow-lg shadow-orange-500/20 text-white">
                            <Package size={28} />
                        </div>
                        Edit Product
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">Update product information and pricing.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-xl overflow-hidden">

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* LEFT COLUMN */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                            <Package size={18} className="text-[#3498DB]" /> Basic Information
                        </h3>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Product Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Category
                                    <button
                                        type="button"
                                        onClick={() => setIsCategoryModalOpen(true)}
                                        className="text-[#3498DB] hover:text-[#2980B9] text-[10px] flex items-center gap-1"
                                    >
                                        + New
                                    </button>
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => handleChange('category', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all appearance-none cursor-pointer text-gray-700 dark:text-gray-300"
                                >
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Supplier
                                    <button
                                        type="button"
                                        onClick={() => setIsSupplierModalOpen(true)}
                                        className="text-[#3498DB] hover:text-[#2980B9] text-[10px] flex items-center gap-1"
                                    >
                                        + New
                                    </button>
                                </label>
                                <select
                                    value={formData.supplierId}
                                    onChange={(e) => handleChange('supplierId', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all appearance-none cursor-pointer text-gray-700 dark:text-gray-300"
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                            <textarea
                                rows={4}
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all resize-none"
                            ></textarea>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                            <AlertCircle size={18} className="text-[#2ECC71]" /> Pricing & Stock
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cost Price</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-bold">ETB</div>
                                    <input
                                        type="number"
                                        value={formData.costPrice}
                                        onChange={(e) => handleChange('costPrice', parseFloat(e.target.value))}
                                        className="w-full pl-14 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Selling Price</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-bold">ETB</div>
                                    <input
                                        type="number"
                                        value={formData.sellingPrice}
                                        onChange={(e) => handleChange('sellingPrice', parseFloat(e.target.value))}
                                        className="w-full pl-14 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Profit Preview */}
                        <div className="p-4 rounded-xl bg-[#2ECC71]/10 border border-[#2ECC71]/20">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Profit Margin</p>
                            <p className="text-2xl font-black text-[#2ECC71]">
                                {((((formData.sellingPrice - formData.costPrice) / formData.sellingPrice) * 100) || 0).toFixed(1)}%
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Profit per unit: <span className="font-bold">ETB {(formData.sellingPrice - formData.costPrice).toLocaleString()}</span>
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Stock</label>
                                <input
                                    type="number"
                                    value={formData.stock}
                                    onChange={(e) => handleChange('stock', parseInt(e.target.value))}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Min. Stock Alert</label>
                                <input
                                    type="number"
                                    value={formData.minStock}
                                    onChange={(e) => handleChange('minStock', parseInt(e.target.value))}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#F39C12] focus:ring-0 outline-none font-medium transition-all"
                                />
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                    <Link href={`/shop/inventory/${params.id}`} className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-8 py-3 rounded-xl bg-[#2ECC71] hover:bg-[#27AE60] text-white font-bold shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Updating...' : <><CheckCircle2 size={18} /> Update Product</>}
                    </button>
                </div>

            </form>

            {/* QUICK CREATE MODALS */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <form onSubmit={handleCreateCategory} className="bg-white dark:bg-[#1f2937] rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Add New Category</h3>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Category Name"
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none mb-4 font-medium"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsCategoryModalOpen(false)}
                                className="px-4 py-2 rounded-lg text-gray-500 hover:bg-gray-100 font-bold text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!newCategoryName}
                                className="px-6 py-2 rounded-lg bg-[#3498DB] text-white font-bold text-sm hover:bg-blue-600 disabled:opacity-50"
                            >
                                Add Category
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {isSupplierModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <form onSubmit={handleCreateSupplier} className="bg-white dark:bg-[#1f2937] rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Add New Supplier</h3>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Supplier Name"
                            value={newSupplierData.name}
                            onChange={e => setNewSupplierData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none mb-3 font-medium"
                        />
                        <input
                            type="text"
                            placeholder="Contact Info (Optional)"
                            value={newSupplierData.contact}
                            onChange={e => setNewSupplierData(prev => ({ ...prev, contact: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none mb-4 font-medium"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsSupplierModalOpen(false)}
                                className="px-4 py-2 rounded-lg text-gray-500 hover:bg-gray-100 font-bold text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!newSupplierData.name}
                                className="px-6 py-2 rounded-lg bg-[#3498DB] text-white font-bold text-sm hover:bg-blue-600 disabled:opacity-50"
                            >
                                Add Supplier
                            </button>
                        </div>
                    </form>
                </div>
            )}

        </div>
    );
}
