'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Truck,
    Save,
    Trash2,
    Search,
    Loader2,
    Box,
    Plus,
    Calendar,
    FileText,
    ChevronDown,
    CreditCard
} from 'lucide-react';
import { toast } from 'sonner';

interface Vendor {
    id: string;
    companyName: string;
}

interface Product {
    id: string;
    name: string;
    sku: string;
    costPrice: number;
}

interface POItem {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitCost: number;
    total: number;
}

export default function AddPurchaseOrderPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    // Data Sources
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    // Form State
    const [selectedVendorId, setSelectedVendorId] = useState('');
    const [expectedDate, setExpectedDate] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<POItem[]>([]);

    // Quick Add State (The Draft Row)
    const [searchProduct, setSearchProduct] = useState('');
    const [blurTimeout, setBlurTimeout] = useState<NodeJS.Timeout | null>(null);

    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProductData, setNewProductData] = useState({
        name: '',
        category: 'General',
        sku: '',
        costPrice: '',
        sellingPrice: '',
        stock: '0',
        minStock: '5'
    });
    const [isCreatingProduct, setIsCreatingProduct] = useState(false);

    // Vendor Modal State
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [newVendorData, setNewVendorData] = useState({
        companyName: '',
        contactPerson: '',
        phone: ''
    });
    const [isCreatingVendor, setIsCreatingVendor] = useState(false);

    const handleCreateVendor = async () => {
        setIsCreatingVendor(true);
        try {
            const response = await fetch('/api/shop/vendors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyName: newVendorData.companyName,
                    contactName: newVendorData.contactPerson,
                    phone: newVendorData.phone
                })
            });

            if (!response.ok) throw new Error('Failed to create vendor');

            const data = await response.json();
            const newVendor = data.vendor || data;

            setVendors(prev => [...prev, { id: newVendor.id, companyName: newVendor.companyName }]);
            setSelectedVendorId(newVendor.id);
            toast.success('Vendor registered successfully');
            setIsVendorModalOpen(false);
            setNewVendorData({ companyName: '', contactPerson: '', phone: '' });

        } catch (error) {
            console.error('Error creating vendor:', error);
            toast.error('Failed to register vendor');
        } finally {
            setIsCreatingVendor(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [vRes, pRes] = await Promise.all([
                    fetch('/api/shop/vendors'),
                    fetch('/api/shop/inventory')
                ]);

                const vData = await vRes.json();
                const pData = await pRes.json();

                if (vData.vendors) setVendors(vData.vendors);
                if (pData.products) setProducts(pData.products);

            } catch (error) {
                console.error('Error loading data:', error);
                toast.error('Failed to load data');
            } finally {
                setPageLoading(false);
            }
        };
        fetchData();
    }, []);

    // Add item logic
    const addItem = (productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        // Check if exists, just increment qty
        const existingIndex = items.findIndex(i => i.productId === productId);
        if (existingIndex >= 0) {
            const newItems = [...items];
            newItems[existingIndex].quantity += 1;
            newItems[existingIndex].total = newItems[existingIndex].quantity * newItems[existingIndex].unitCost;
            setItems(newItems);
        } else {
            const newItem: POItem = {
                productId: product.id,
                productName: product.name,
                sku: product.sku,
                quantity: 1,
                unitCost: product.costPrice || 0,
                total: product.costPrice || 0
            };
            setItems([...items, newItem]);
        }
    };

    const updateItem = (index: number, field: keyof POItem, value: number) => {
        const newItems = [...items];
        const item = newItems[index];
        (item as any)[field] = value;
        item.total = item.quantity * item.unitCost;
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedVendorId) {
            toast.error('Please select a vendor');
            return;
        }
        if (items.length === 0) {
            toast.error('Please add at least one item');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/shop/purchases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vendorId: selectedVendorId,
                    items,
                    notes,
                    expectedDelivery: expectedDate,
                    // Payment info removed - will be handled separately
                    paidAmount: 0,
                    paymentMethod: null
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create purchase order');
            }

            toast.success('Purchase Order created successfully.');

            setTimeout(() => {
                router.push('/shop/purchases');
            }, 1000);

        } catch (error) {
            console.error('Submit error:', error);
            toast.error('Failed to submit order');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Quick Create Product
    const handleCreateProduct = async () => {
        setIsCreatingProduct(true);
        try {
            const response = await fetch('/api/shop/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newProductData.name,
                    sku: newProductData.sku || `SKU-${Date.now()}`,
                    category: newProductData.category,
                    costPrice: parseFloat(newProductData.costPrice) || 0,
                    sellingPrice: parseFloat(newProductData.sellingPrice) || 0,
                    stock: 0,
                    minStock: 5
                })
            });

            if (!response.ok) throw new Error('Failed to create product');

            const data = await response.json();
            const newProduct = data.product || data;

            const formattedProduct: Product = {
                id: newProduct.id,
                name: newProduct.name,
                sku: newProduct.sku,
                costPrice: newProduct.costPrice || 0
            };

            setProducts(prev => [...prev, formattedProduct]);

            // Add immediately
            const newItem: POItem = {
                productId: formattedProduct.id,
                productName: formattedProduct.name,
                sku: formattedProduct.sku,
                quantity: 1,
                unitCost: formattedProduct.costPrice,
                total: formattedProduct.costPrice
            };
            setItems([...items, newItem]);

            toast.success(`${newProductData.name} created and added to order`);
            setIsCreateModalOpen(false);
            setSearchProduct('');

            setNewProductData({
                name: '',
                category: 'General',
                sku: '',
                costPrice: '',
                sellingPrice: '',
                stock: '0',
                minStock: '5'
            });

        } catch (error) {
            console.error(error);
            toast.error('Failed to create product');
        } finally {
            setIsCreatingProduct(false);
        }
    };

    // Filter products
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchProduct.toLowerCase())
    ).slice(0, 5);

    if (pageLoading) return <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B1120]"><Loader2 className="animate-spin text-[#3498DB]" size={40} /></div>;

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] font-sans pb-32">

            {/* Header Section */}
            <div className="bg-white dark:bg-[#151C2C] border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30 shadow-sm/50 backdrop-blur-xl bg-white/80 dark:bg-[#151C2C]/90 supports-[backdrop-filter]:bg-white/50">
                <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/shop/purchases" className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all text-gray-500 hover:text-gray-900 dark:hover:text-white">
                            <ArrowLeft size={22} strokeWidth={2} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-none mb-1.5">New Purchase Order</h1>
                            <p className="text-sm text-gray-500 font-medium">Create order & manage items</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:block text-right">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Estimated Total</p>
                            <p className="text-2xl font-black text-[#2ECC71] tracking-tight">ETB {grandTotal.toLocaleString()}</p>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="px-6 py-3 bg-[#3498DB] hover:bg-[#2980B9] text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-95 transition-all flex items-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} strokeWidth={2.5} />}
                            <span className="hidden sm:inline">Create Order</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT COLUMN: Items Table */}
                <div className="lg:col-span-8">
                    <div className="bg-white dark:bg-[#151C2C] rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden min-h-[600px] flex flex-col">

                        {/* Table Header */}
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a2333]/50 flex justify-between items-center">
                            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Box size={20} className="text-[#3498DB]" />
                                Order Items
                            </h2>
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                                {items.length} Items
                            </span>
                        </div>

                        {/* Scrolling Table Area */}
                        <div className="flex-1 overflow-visible">
                            <table className="w-full">
                                <thead className="bg-[#F8FAFC] dark:bg-[#121826] border-b border-gray-100 dark:border-gray-800 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Product Info</th>
                                        <th className="px-6 py-4 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider w-32">Qty</th>
                                        <th className="px-6 py-4 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider w-40">Unit Cost</th>
                                        <th className="px-6 py-4 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider w-40">Total</th>
                                        <th className="px-6 py-4 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                                    {items.map((item, index) => (
                                        <tr key={index} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-gray-900 dark:text-white text-sm mb-0.5">{item.productName}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-gray-100 dark:bg-gray-800 text-gray-500">
                                                        {item.sku}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                                        className="w-full bg-white dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-center font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-[#3498DB] outline-none transition-all text-gray-900 dark:text-white text-sm shadow-sm"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={item.unitCost}
                                                        onChange={(e) => updateItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-white dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 text-right font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-[#3498DB] outline-none transition-all text-gray-900 dark:text-white text-sm shadow-sm"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-gray-900 dark:text-white text-sm">
                                                <span className="text-gray-400 text-xs font-normal mr-1">ETB</span>
                                                {item.total.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => removeItem(index)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* DRAFT ROW (Always Visible) */}
                                    <tr className="bg-blue-50/20 dark:bg-blue-900/5 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors">
                                        <td className="px-6 py-5 relative">
                                            <div className="relative">
                                                <Search className="absolute left-3.5 top-3.5 text-gray-400 pointer-events-none" size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="Type product name to add..."
                                                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-[#0F1623] border border-blue-200 dark:border-blue-800/50 focus:border-[#3498DB] focus:ring-4 focus:ring-blue-500/10 outline-none font-medium text-sm text-gray-900 dark:text-white shadow-sm transition-all placeholder:text-gray-400"
                                                    value={searchProduct}
                                                    onChange={(e) => setSearchProduct(e.target.value)}
                                                    onBlur={() => {
                                                        const tm = setTimeout(() => {
                                                            if (searchProduct.trim()) {
                                                                const exactMatch = products.find(p => p.name.toLowerCase() === searchProduct.toLowerCase());
                                                                if (!exactMatch) {
                                                                    setNewProductData(prev => ({ ...prev, name: searchProduct }));
                                                                    setIsCreateModalOpen(true);
                                                                }
                                                            }
                                                        }, 200);
                                                        setBlurTimeout(tm);
                                                    }}
                                                    onFocus={() => {
                                                        if (blurTimeout) clearTimeout(blurTimeout);
                                                    }}
                                                />
                                                {/* Autocomplete Dropdown */}
                                                {searchProduct && filteredProducts.length > 0 && (
                                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a2333] rounded-2xl shadow-xl shadow-gray-900/20 border border-gray-100 dark:border-gray-700 overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-100">
                                                        <div className="p-1.5 ">
                                                            {filteredProducts.map(p => (
                                                                <button
                                                                    key={p.id}
                                                                    onClick={() => {
                                                                        if (blurTimeout) clearTimeout(blurTimeout);
                                                                        addItem(p.id);
                                                                        setSearchProduct('');
                                                                    }}
                                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl flex items-center justify-between group transition-colors"
                                                                >
                                                                    <div>
                                                                        <p className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-[#3498DB] transition-colors">{p.name}</p>
                                                                        <p className="text-xs text-gray-500 font-mono mt-0.5">{p.sku}</p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-xs font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700">ETB {p.costPrice.toLocaleString()}</p>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 opacity-40">
                                            <div className="w-full h-11 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-xs font-medium text-gray-400">
                                                Qty
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 opacity-40">
                                            <div className="w-full h-11 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-xs font-medium text-gray-400">
                                                Cost
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right opacity-30 font-bold text-gray-400">---</td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Settings NO PAYMENT */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Supplier Card */}
                    <div className="bg-white dark:bg-[#151C2C] rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-5 uppercase tracking-wide flex items-center gap-2.5 pb-4 border-b border-gray-50 dark:border-gray-800">
                            <Truck size={18} className="text-[#3498DB]" />
                            Supplier Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex justify-between items-center px-1">
                                    <span>Select Vendor *</span>
                                    <button
                                        onClick={() => setIsVendorModalOpen(true)}
                                        className="text-[#3498DB] hover:underline flex items-center gap-1 text-[10px]"
                                    >
                                        <Plus size={12} /> New
                                    </button>
                                </label>
                                <div className="relative">
                                    <select
                                        className="w-full pl-4 pr-10 py-3.5 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 outline-none font-medium text-gray-900 dark:text-white text-sm focus:border-[#3498DB] focus:ring-2 focus:ring-blue-500/20 appearance-none transition-all"
                                        value={selectedVendorId}
                                        onChange={(e) => setSelectedVendorId(e.target.value)}
                                    >
                                        <option value="">Choose Supplier...</option>
                                        {vendors.map(v => <option key={v.id} value={v.id}>{v.companyName}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-4 text-gray-400 pointer-events-none" size={16} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Expected Delivery</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-3.5 text-gray-400 pointer-events-none" size={16} />
                                    <input
                                        type="date"
                                        className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 outline-none font-medium text-gray-900 dark:text-white text-sm focus:border-[#3498DB] focus:ring-2 focus:ring-blue-500/20 transition-all dark:[color-scheme:dark]"
                                        value={expectedDate}
                                        onChange={(e) => setExpectedDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Order Notes</label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-3.5 text-gray-400 pointer-events-none" size={16} />
                                    <textarea
                                        rows={3}
                                        className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 outline-none font-medium text-gray-900 dark:text-white text-sm focus:border-[#3498DB] focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                                        placeholder="Internal notes..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PAYMENT INFO NOTE */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/30">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                <CreditCard size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Payment Process</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                    Payment can be processed from the dashboard after creating the order. This allows you to select the funding account and verify details.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Quick Create Product Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0B1120]/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-[#151C2C] rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                        <div className="p-8 border-b border-gray-50 dark:border-gray-800 bg-gray-50/30 dark:bg-[#1a2333]/30 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white">New Product</h3>
                                <p className="text-sm text-gray-500 font-medium mt-1">Add details for "{newProductData.name}"</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400">
                                <ArrowLeft size={20} className="rotate-180" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Product Name</label>
                                <input
                                    type="text"
                                    value={newProductData.name}
                                    onChange={e => setNewProductData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-2 focus:ring-blue-500/10 outline-none font-bold text-gray-900 dark:text-white transition-all"
                                    placeholder="Product Name"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Cost Price (Buy)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-4 text-gray-400 font-bold text-xs">ETB</span>
                                        <input
                                            type="number"
                                            value={newProductData.costPrice}
                                            onChange={e => setNewProductData(prev => ({ ...prev, costPrice: e.target.value }))}
                                            className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-2 focus:ring-blue-500/10 outline-none font-bold text-gray-900 dark:text-white transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Selling Price (Sell)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-4 text-gray-400 font-bold text-xs">ETB</span>
                                        <input
                                            type="number"
                                            value={newProductData.sellingPrice}
                                            onChange={e => setNewProductData(prev => ({ ...prev, sellingPrice: e.target.value }))}
                                            className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-2 focus:ring-blue-500/10 outline-none font-bold text-gray-900 dark:text-white transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Category</label>
                                <div className="relative">
                                    <select
                                        value={newProductData.category}
                                        onChange={e => setNewProductData(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-2 focus:ring-blue-500/10 outline-none font-medium text-gray-900 dark:text-white appearance-none transition-all"
                                    >
                                        {['General', 'Electronics', 'Food', 'Clothing', 'Materials', 'Furniture'].map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-5 top-5 text-gray-400 pointer-events-none" size={16} />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a2333]/50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateProduct}
                                disabled={isCreatingProduct || !newProductData.name || !newProductData.costPrice}
                                className="px-8 py-3 rounded-xl bg-[#3498DB] text-white font-bold hover:bg-[#2980B9] shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
                            >
                                {isCreatingProduct ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                                Create Product
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Create Vendor Modal */}
            {isVendorModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0B1120]/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-[#151C2C] rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                        <div className="p-8 border-b border-gray-50 dark:border-gray-800 bg-gray-50/30 dark:bg-[#1a2333]/30 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white">New Supplier</h3>
                                <p className="text-sm text-gray-500 font-medium mt-1">Register a new vendor</p>
                            </div>
                            <button onClick={() => setIsVendorModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400">
                                <ArrowLeft size={20} className="rotate-180" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Company Name</label>
                                <input
                                    type="text"
                                    value={newVendorData.companyName}
                                    onChange={e => setNewVendorData(prev => ({ ...prev, companyName: e.target.value }))}
                                    className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-2 focus:ring-blue-500/10 outline-none font-bold text-gray-900 dark:text-white transition-all"
                                    placeholder="e.g. Al-Nur Wholesalers"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Contact Person</label>
                                    <input
                                        type="text"
                                        value={newVendorData.contactPerson}
                                        onChange={e => setNewVendorData(prev => ({ ...prev, contactPerson: e.target.value }))}
                                        className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-2 focus:ring-blue-500/10 outline-none font-medium text-gray-900 dark:text-white transition-all"
                                        placeholder="Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Phone</label>
                                    <input
                                        type="tel"
                                        value={newVendorData.phone}
                                        onChange={e => setNewVendorData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-2 focus:ring-blue-500/10 outline-none font-medium text-gray-900 dark:text-white transition-all"
                                        placeholder="+251..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a2333]/50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsVendorModalOpen(false)}
                                className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateVendor}
                                disabled={isCreatingVendor || !newVendorData.companyName}
                                className="px-8 py-3 rounded-xl bg-[#3498DB] text-white font-bold hover:bg-[#2980B9] shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
                            >
                                {isCreatingVendor ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                                Add Vendor
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

