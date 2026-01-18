'use client';

import React, { useState, useEffect } from 'react';
import {
    Save,
    ArrowLeft,
    Package,
    Upload,
    DollarSign,
    Layers,
    Truck,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

export default function AddProductPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category: '',
        supplier: '',
        description: '',
        costPrice: '',
        sellingPrice: '',
        stock: '',
        minStock: '5'
    });

    // List State
    const [categories, setCategories] = useState<string[]>([]);
    const [suppliers, setSuppliers] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catsRes, vendsRes] = await Promise.all([
                    fetch('/api/shop/categories'),
                    fetch('/api/shop/vendors')
                ]);

                if (catsRes.ok) setCategories(await catsRes.json());
                if (vendsRes.ok) {
                    const data = await vendsRes.json();
                    setSuppliers((data.vendors || []).map((v: any) => ({ id: v.id, name: v.companyName || v.name })));
                }
            } catch (e) {
                console.error("Error fetching form data", e);
            }
        };
        fetchData();
    }, []);

    // Modal State
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newSupplierData, setNewSupplierData] = useState({ name: '', contact: '' });

    // --- BARCODE SCANNING LOGIC ---
    const lastKeyTime = React.useRef<number>(0);
    const barcodeBuffer = React.useRef<string>('');
    const skuInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            // Check if user is typing in a field that isn't the SKU input
            // We want to allow normal typing in Name, Description, etc.
            const isTypingField = (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && target !== skuInputRef.current;

            const currentTime = Date.now();
            const gap = currentTime - lastKeyTime.current;
            lastKeyTime.current = currentTime;

            // Scanner Logic: Detect bursts of fast input (< 60ms is typical for scanners)
            if (gap > 60) {
                // If the gap is large, we assume manual typing.
                // Reset buffer to avoid accumulating random slow keystrokes
                if (barcodeBuffer.current.length > 0) {
                    barcodeBuffer.current = '';
                }
            }

            if (e.key === 'Enter') {
                // ALWAYS prevent default form submission on Enter if we have a buffer
                // This stops the "disappearing" issue which is caused by the form submitting prematurely
                if (barcodeBuffer.current.length > 2) {
                    e.preventDefault();
                    e.stopPropagation(); // Stop bubbling

                    if (isTypingField) {
                        // If user is safely typing elsewhere, just clear buffer
                        barcodeBuffer.current = '';
                        return;
                    }

                    const scannedCode = barcodeBuffer.current;

                    // Update State
                    setFormData(prev => ({ ...prev, sku: scannedCode }));

                    // Show success
                    toast({
                        title: "Barcode Scanned!",
                        description: `SKU: ${scannedCode}`,
                        // duration: 2000,
                        // className: "bg-green-500 text-white border-none"
                    });

                    // Focus SKU input with slight delay to ensure render cycle
                    if (skuInputRef.current) {
                        skuInputRef.current.value = scannedCode; // Direct DOM update
                        skuInputRef.current.focus();
                    }

                    barcodeBuffer.current = '';
                    return false;
                }

                // Even if no buffer, if we are in the SKU field, Enter should NOT submit the form
                if (target === skuInputRef.current) {
                    e.preventDefault();
                    return false;
                }

                barcodeBuffer.current = '';
            } else if (e.key.length === 1) {
                // Append printable chars to buffer
                barcodeBuffer.current += e.key;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    // ------------------------------

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

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
                handleChange('supplier', newVendor.id);
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
            const response = await fetch('/api/shop/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    sku: formData.sku,
                    category: formData.category,
                    description: formData.description,
                    costPrice: parseFloat(formData.costPrice),
                    sellingPrice: parseFloat(formData.sellingPrice),
                    stock: parseInt(formData.stock),
                    minStock: parseInt(formData.minStock),
                    supplierId: formData.supplier || null
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create product');
            }

            const data = await response.json();

            toast({
                title: 'Success!',
                description: `${formData.name} has been added to inventory.`,
            });

            router.push('/shop/inventory');
        } catch (error: any) {
            console.error('Error creating product:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to create product. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-5xl mx-auto p-4 md:p-8">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/shop/inventory" className="text-gray-400 hover:text-[#3498DB] transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                            <ArrowLeft size={14} /> Back to Inventory
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-[#2ECC71] to-[#27AE60] rounded-xl shadow-lg shadow-green-500/20 text-white">
                            <Package size={28} />
                        </div>
                        Add New Product
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">Create a new item in your inventory catalog.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-xl overflow-hidden">

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* LEFT COLUMN: Basic Info */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                            <Layers size={18} className="text-[#3498DB]" /> Basic Information
                        </h3>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Product Name *</label>
                            <input
                                type="text"
                                placeholder="e.g. Wireless Headphones"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    Category *
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
                                    required
                                >
                                    <option value="">Select...</option>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">SKU (Stock Keeping Unit) *</label>
                            <input
                                ref={skuInputRef}
                                type="text"
                                placeholder="e.g. BAR-001"
                                value={formData.sku}
                                onChange={(e) => handleChange('sku', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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
                                    value={formData.supplier}
                                    onChange={(e) => handleChange('supplier', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all appearance-none cursor-pointer text-gray-700 dark:text-gray-300"
                                >
                                    <option value="">Select...</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                            <textarea
                                rows={4}
                                placeholder="Enter product details..."
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all resize-none"
                            ></textarea>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Price & Stock */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                            <DollarSign size={18} className="text-[#2ECC71]" /> Pricing & Stock
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cost Price *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-bold text-sm">ETB</div>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={formData.costPrice}
                                        onChange={(e) => handleChange('costPrice', e.target.value)}
                                        className="w-full pl-14 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Selling Price *</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-bold text-sm">ETB</div>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={formData.sellingPrice}
                                        onChange={(e) => handleChange('sellingPrice', e.target.value)}
                                        className="w-full pl-14 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Initial Stock Quantity <span className="text-gray-300 font-normal lowercase">(optional for opening stock)</span></label>
                            <input
                                type="number"
                                placeholder="0"
                                value={formData.stock}
                                onChange={(e) => handleChange('stock', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all"
                            />
                        </div>

                        <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20">
                            <div className="flex items-start gap-3">
                                <AlertCircle size={20} className="text-[#F39C12] mt-0.5" />
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-2">Low Stock Alert Level</label>
                                    <input
                                        type="number"
                                        value={formData.minStock}
                                        onChange={(e) => handleChange('minStock', e.target.value)}
                                        className="w-24 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-800 focus:border-[#F39C12] outline-none font-bold text-center"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">We'll notify you when stock falls below this number.</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                    <Link href="/shop/inventory" className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-8 py-3 rounded-xl bg-[#2ECC71] hover:bg-[#27AE60] text-white font-bold shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Saving...
                            </>
                        ) : (
                            <><CheckCircle2 size={18} /> Save Product</>
                        )}
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
