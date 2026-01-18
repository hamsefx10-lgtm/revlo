'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/layouts/Layout';
import {
    ArrowLeft, Check, Plus, Trash2, Calculator, User,
    CreditCard, Printer, Save, PackageCheck
} from 'lucide-react';

export default function NewSalePage() {
    const [customer, setCustomer] = useState('');
    const [items, setItems] = useState([{ id: 1, name: '', qty: 1, price: 0 }]);
    const [paidAmount, setPaidAmount] = useState(0);

    const addItem = () => {
        setItems([...items, { id: Date.now(), name: '', qty: 1, price: 0 }]);
    };

    const updateItem = (id: number, field: string, value: any) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const removeItem = (id: number) => {
        setItems(items.filter(item => item.id !== id));
    };

    const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
    const balance = subtotal - paidAmount;

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 pb-20 pt-6 px-4 md:px-0">

                {/* TOP BAR */}
                <div className="flex items-center justify-between">
                    <Link href="/sales" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold text-sm">
                        <ArrowLeft size={18} /> Back to Sales
                    </Link>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">New Sale</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* LEFT: FORM */}
                    <div className="md:col-span-2 space-y-6">

                        {/* CUSTOMER CARD */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <User size={16} /> Customer Details
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Customer Name</label>
                                    <input
                                        type="text"
                                        value={customer}
                                        onChange={e => setCustomer(e.target.value)}
                                        placeholder="Select or type customer name..."
                                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ITEMS CARD */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Calculator size={16} /> Items
                                </h3>
                                <div className="flex gap-3">
                                    <button onClick={() => alert('This would open a modal to select finished Workshop Jobs!')} className="text-xs font-bold text-green-600 flex items-center gap-1 hover:underline">
                                        <PackageCheck size={14} /> From Stock
                                    </button>
                                    <button onClick={addItem} className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
                                        <Plus size={14} /> Add Manual
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-gray-400 pl-2">
                                    <div className="col-span-6">Description</div>
                                    <div className="col-span-2 text-center">Qty</div>
                                    <div className="col-span-3 text-right">Price</div>
                                    <div className="col-span-1"></div>
                                </div>
                                {items.map((item, idx) => (
                                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-6">
                                            <input
                                                type="text"
                                                placeholder="Item name..."
                                                value={item.name}
                                                onChange={e => updateItem(item.id, 'name', e.target.value)}
                                                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary/20 outline-none text-sm font-medium"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input
                                                type="number"
                                                value={item.qty}
                                                onChange={e => updateItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                                                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary/20 outline-none text-center font-mono text-sm"
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <input
                                                type="number"
                                                value={item.price}
                                                onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary/20 outline-none text-right font-mono text-sm font-bold"
                                            />
                                        </div>
                                        <div className="col-span-1 text-center">
                                            {items.length > 1 && (
                                                <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 p-2">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* RIGHT: SUMMARY & PAYMENT */}
                    <div className="md:col-span-1 space-y-6">

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 sticky top-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-gray-100 dark:border-gray-700 pb-2">
                                Payment Summary
                            </h3>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-base font-medium text-gray-600 dark:text-gray-300">
                                    <span>Subtotal</span>
                                    <span>{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-2xl font-black text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-gray-700">
                                    <span>Total</span>
                                    <span>{subtotal.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl space-y-3 mb-6">
                                <label className="text-xs font-bold uppercase text-gray-500 flex items-center gap-1">
                                    <CreditCard size={12} /> Amount Paid
                                </label>
                                <input
                                    type="number"
                                    value={paidAmount}
                                    onChange={e => setPaidAmount(parseFloat(e.target.value) || 0)}
                                    className="w-full p-3 rounded-lg border-2 border-blue-100 focus:border-blue-500 focus:ring-0 outline-none text-xl font-bold text-right text-blue-600 bg-white"
                                />
                            </div>

                            <div className={`p-4 rounded-xl mb-6 flex justify-between items-center ${balance > 0 ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                                <span className="text-xs font-bold uppercase">Balance Due</span>
                                <span className="text-lg font-black">{Math.max(0, balance).toLocaleString()}</span>
                            </div>

                            <button className="w-full py-4 bg-gray-900 hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 text-white rounded-xl shadow-xl hover:shadow-2xl hover:translate-y-[-2px] transition-all font-bold text-lg flex items-center justify-center gap-2">
                                <Check size={20} strokeWidth={3} /> Complete Sale
                            </button>
                        </div>

                    </div>
                </div>

            </div>
        </Layout>
    );
}
