'use client';

import React, { useState } from 'react';
import {
    Save,
    ArrowLeft,
    Truck,
    Package,
    Calendar,
    CheckCircle2,
    Plus,
    Trash2,
    ChevronDown
} from 'lucide-react';
import Link from 'next/link';

interface PurchaseItem {
    id: number;
    productId: string;
    productName: string;
    quantity: number;
    unitCost: number;
}

const MOCK_VENDORS = [
    { id: '1', name: 'Al-Nur Wholesalers' },
    { id: '2', name: 'SomFresh Distributors' },
    { id: '3', name: 'TechWorld Imports' },
    { id: '4', name: 'Golden Grain Co.' }
];

const MOCK_PRODUCTS = [
    { id: 'p1', name: 'iPhone 15 Pro Max', cost: 1000 },
    { id: 'p2', name: 'Samsung Galaxy S24', cost: 900 },
    { id: 'p3', name: 'MacBook Air M2', cost: 1200 },
    { id: 'p4', name: 'AirPods Pro 2', cost: 200 }
];

export default function CreatePurchaseOrderPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [vendorId, setVendorId] = useState('');
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [expectedDelivery, setExpectedDelivery] = useState('');

    const [items, setItems] = useState<PurchaseItem[]>([
        { id: 1, productId: '', productName: '', quantity: 1, unitCost: 0 }
    ]);

    const addItem = () => {
        setItems([...items, { id: Date.now(), productId: '', productName: '', quantity: 1, unitCost: 0 }]);
    };

    const removeItem = (id: number) => {
        if (items.length === 1) return;
        setItems(items.filter(item => item.id !== id));
    };

    const handleProductSelect = (id: number, productId: string) => {
        const product = MOCK_PRODUCTS.find(p => p.id === productId);
        if (product) {
            setItems(items.map(item =>
                item.id === id ? { ...item, productId, productName: product.name, unitCost: product.cost } : item
            ));
        }
    };

    const updateItem = (id: number, field: keyof PurchaseItem, value: any) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
    const tax = subtotal * 0.15;
    const total = subtotal + tax;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            alert('Purchase Order created successfully!');
        }, 1500);
    };

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/shop/purchases" className="text-gray-400 hover:text-[#3498DB] transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                            <ArrowLeft size={14} /> Back to Purchases
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-[#3498DB] to-[#2980B9] rounded-xl shadow-lg shadow-blue-500/20 text-white">
                            <Truck size={28} />
                        </div>
                        Create Purchase Order
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 ml-16 text-sm">Order inventory from suppliers.</p>
                </div>

                <div className="flex gap-3">
                    <button className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2">
                        <Save size={18} /> Save Draft
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-6 py-3 rounded-xl bg-[#2ECC71] hover:bg-[#27AE60] text-white font-bold shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all flex items-center gap-2"
                    >
                        <CheckCircle2 size={18} /> {isLoading ? 'Creating...' : 'Create Order'}
                    </button>
                </div>
            </div>

            {/* MAIN FORM */}
            <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-xl overflow-hidden max-w-5xl mx-auto">

                {/* Top Section */}
                <div className="p-8 border-b border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20 grid grid-cols-1 md:grid-cols-3 gap-6">

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Vendor</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Truck size={18} className="text-gray-400" />
                            </div>
                            <select
                                value={vendorId}
                                onChange={(e) => setVendorId(e.target.value)}
                                className="block w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB] transition-all font-medium appearance-none cursor-pointer"
                                required
                            >
                                <option value="" disabled>Select Vendor...</option>
                                {MOCK_VENDORS.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                                <ChevronDown size={16} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Order Date</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar size={18} className="text-gray-400" />
                            </div>
                            <input
                                type="date"
                                value={orderDate}
                                onChange={(e) => setOrderDate(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB] transition-all font-medium text-gray-700 dark:text-gray-200"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Expected Delivery</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar size={18} className="text-gray-400" />
                            </div>
                            <input
                                type="date"
                                value={expectedDelivery}
                                onChange={(e) => setExpectedDelivery(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB] transition-all font-medium text-gray-700 dark:text-gray-200"
                            />
                        </div>
                    </div>
                </div>

                {/* Items Section */}
                <div className="p-8">
                    <div className="grid grid-cols-12 gap-4 mb-4 px-2">
                        <div className="col-span-6 text-xs font-bold text-gray-400 uppercase">Product</div>
                        <div className="col-span-2 text-xs font-bold text-gray-400 uppercase text-center">Quantity</div>
                        <div className="col-span-2 text-xs font-bold text-gray-400 uppercase text-right">Unit Cost</div>
                        <div className="col-span-2 text-xs font-bold text-gray-400 uppercase text-right">Total</div>
                    </div>

                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <div key={item.id} className="grid grid-cols-12 gap-4 items-center group">
                                <div className="col-span-6 relative">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Package size={16} className="text-gray-400" />
                                        </div>
                                        <select
                                            value={item.productId}
                                            onChange={(e) => handleProductSelect(item.id, e.target.value)}
                                            className="w-full pl-9 pr-8 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-[#3498DB] transition-all font-medium appearance-none cursor-pointer"
                                        >
                                            <option value="" disabled>Select Product...</option>
                                            {MOCK_PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                                            <ChevronDown size={14} />
                                        </div>
                                    </div>
                                    <span className="absolute left-[-24px] top-1/2 -translate-y-1/2 text-xs font-bold text-gray-300">{index + 1}</span>
                                </div>

                                <div className="col-span-2">
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-[#3498DB] transition-all font-bold text-center"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <input
                                        type="number"
                                        min="0"
                                        value={item.unitCost}
                                        onChange={(e) => updateItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-[#3498DB] transition-all font-bold text-right"
                                    />
                                </div>

                                <div className="col-span-2 flex items-center justify-end gap-3">
                                    <div className="font-bold text-gray-900 dark:text-white w-20 text-right">
                                        {(item.quantity * item.unitCost).toLocaleString()}
                                    </div>
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addItem}
                        className="mt-6 flex items-center gap-2 text-[#3498DB] font-bold text-sm hover:underline transition-all px-2"
                    >
                        <Plus size={16} /> Add Item
                    </button>
                </div>

                {/* Totals */}
                <div className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 p-8">
                    <div className="flex justify-end">
                        <div className="w-full md:w-1/3 space-y-3">
                            <div className="flex justify-between text-sm text-gray-500 font-medium">
                                <span>Subtotal</span>
                                <span>ETB {subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500 font-medium">
                                <span>Tax (15%)</span>
                                <span>ETB {tax.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                                <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                                <span className="text-2xl font-black text-[#2ECC71]">ETB {total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
