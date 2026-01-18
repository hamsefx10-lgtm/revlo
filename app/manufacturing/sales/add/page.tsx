'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, Loader2, DollarSign, User as UserIcon } from 'lucide-react';
import Toast from '@/components/common/Toast';

interface Product {
    id: string;
    name: string;
    sellingPrice: number;
}

interface Customer {
    id: string;
    name: string;
    companyName?: string;
}

export default function NewSalesOrderPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Data sources
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);

    // Form State
    const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
    const [customerId, setCustomerId] = useState('');
    const [manualCustomerName, setManualCustomerName] = useState('');
    const [isExistingCustomer, setIsExistingCustomer] = useState(true);

    const [items, setItems] = useState([
        { id: 1, productId: '', productName: '', quantity: 1, unitPrice: 0 }
    ]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pRes, cRes] = await Promise.all([
                    fetch('/api/manufacturing/products'),
                    fetch('/api/manufacturing/customers')
                ]);

                if (pRes.ok) {
                    const pData = await pRes.json();
                    setProducts(pData.products || []);
                }
                if (cRes.ok) {
                    const cData = await cRes.json();
                    setCustomers(cData.customers || []);
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchData();
    }, []);

    const addItem = () => {
        setItems([...items, { id: Date.now(), productId: '', productName: '', quantity: 1, unitPrice: 0 }]);
    };

    const removeItem = (id: number) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== id));
        }
    };

    const updateItem = (id: number, field: string, value: any) => {
        setItems(items.map(item => {
            if (item.id === id) {
                if (field === 'productName') {
                    // Find product by name match for autocomplete feel (or improved ID selection)
                    const match = products.find(p => p.name === value);
                    if (match) return {
                        ...item,
                        productName: value,
                        productId: match.id,
                        unitPrice: Number(match.sellingPrice)
                    };
                }
                if (field === 'productId') {
                    const match = products.find(p => p.id === value);
                    if (match) return {
                        ...item,
                        productId: value,
                        productName: match.name,
                        unitPrice: Number(match.sellingPrice)
                    };
                }
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const customerName = isExistingCustomer
            ? customers.find(c => c.id === customerId)?.name
            : manualCustomerName;

        if (!customerName) {
            setToast({ message: 'Please select or enter a customer name.', type: 'error' });
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/manufacturing/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: saleDate,
                    customerId: isExistingCustomer ? customerId : null,
                    customerName: customerName,
                    status: 'Completed',
                    items: items.map(i => ({
                        productId: i.productId,
                        productName: i.productName,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice
                    }))
                })
            });

            if (!response.ok) throw new Error('Failed to create order');

            setToast({ message: 'Sales Order created successfully!', type: 'success' });
            setTimeout(() => router.push('/manufacturing/sales'), 1000);

        } catch (error) {
            setToast({ message: 'Error creating order. Please try again.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-2 lg:p-4 min-h-screen pb-20">

            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/manufacturing/sales" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">New Sales Order</h1>
                    <p className="text-sm font-medium text-gray-500">Create invoice for customer</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="lg:col-span-2 space-y-6">
                    {/* Customer & Date */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <UserIcon size={20} className="text-[#3498DB]" /> Customer Details
                        </h3>

                        <div className="mb-4">
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={isExistingCustomer}
                                        onChange={() => setIsExistingCustomer(true)}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Existing Customer</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={!isExistingCustomer}
                                        onChange={() => setIsExistingCustomer(false)}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Walk-in / New</span>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Customer Name</label>
                                {isExistingCustomer ? (
                                    <select
                                        value={customerId}
                                        onChange={(e) => setCustomerId(e.target.value)}
                                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-[#3498DB] outline-none"
                                    >
                                        <option value="">Select Customer...</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} {c.companyName ? `(${c.companyName})` : ''}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        required={!isExistingCustomer}
                                        value={manualCustomerName}
                                        onChange={(e) => setManualCustomerName(e.target.value)}
                                        placeholder="e.g. Walk-in Client"
                                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-[#3498DB] outline-none"
                                    />
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Order Date</label>
                                <input
                                    type="date"
                                    required
                                    value={saleDate}
                                    onChange={(e) => setSaleDate(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-[#3498DB] outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Order Items</h3>
                            <button type="button" onClick={addItem} className="text-sm font-bold text-[#3498DB] hover:underline flex items-center gap-1">
                                <Plus size={16} /> Add Item
                            </button>
                        </div>

                        <div className="space-y-3">
                            {items.map((item, idx) => (
                                <div key={item.id} className="flex flex-col md:flex-row gap-3 items-end md:items-center bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <span className="text-xs font-bold text-gray-400 w-6 hidden md:block">#{idx + 1}</span>
                                    <div className="flex-1 w-full">
                                        <label className="md:hidden text-xs font-bold text-gray-400 mb-1 block">Item Name</label>
                                        <select
                                            value={item.productId}
                                            onChange={(e) => updateItem(item.id, 'productId', e.target.value)}
                                            className="w-full p-2 bg-white dark:bg-gray-800 rounded-lg border-transparent focus:border-[#3498DB] outline-none"
                                        >
                                            <option value="">Select Product...</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-full md:w-24">
                                        <label className="md:hidden text-xs font-bold text-gray-400 mb-1 block">Qty</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                                            className="w-full p-2 bg-white dark:bg-gray-800 rounded-lg border-transparent focus:border-[#3498DB] outline-none"
                                        />
                                    </div>
                                    <div className="w-full md:w-32">
                                        <label className="md:hidden text-xs font-bold text-gray-400 mb-1 block">Price</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={item.unitPrice}
                                            onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value))}
                                            className="w-full p-2 bg-white dark:bg-gray-800 rounded-lg border-transparent focus:border-[#3498DB] outline-none"
                                        />
                                    </div>
                                    <div className="font-bold text-gray-700 dark:text-gray-300 w-24 text-right">
                                        ${(item.quantity * item.unitPrice).toFixed(2)}
                                    </div>
                                    <button type="button" onClick={() => removeItem(item.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end items-center gap-4">
                            <span className="text-sm font-bold text-gray-500 uppercase">Grand Total</span>
                            <span className="text-3xl font-black text-[#3498DB]">${calculateTotal().toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-[#3498DB] hover:bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 mb-3"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        Complete Order
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 transition"
                    >
                        Cancel
                    </button>
                </div>

            </form>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
