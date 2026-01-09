'use client';

import React from 'react';
import {
    ArrowLeft,
    Receipt,
    User,
    Calendar,
    CreditCard,
    Package,
    Printer,
    Download,
    Mail
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import StatusBadge from '@/components/shop/ui/StatusBadge';

// Mock data
const SALE_DATA = {
    id: '1',
    invoiceNumber: 'INV-2024-001',
    date: '2024-01-07',
    time: '14:30',
    customer: {
        name: 'Ahmed Ali Mohamed',
        phone: '+252 61 555 1234',
        email: 'ahmed.ali@example.com'
    },
    items: [
        { id: '1', name: 'iPhone 15 Pro Max', sku: 'ELE-001', quantity: 1, unitPrice: 1200, total: 1200 },
        { id: '2', name: 'AirPods Pro 2', sku: 'ELE-004', quantity: 2, unitPrice: 250, total: 500 },
        { id: '3', name: 'USB-C Cable', sku: 'ELE-006', quantity: 3, unitPrice: 20, total: 60 }
    ],
    subtotal: 1760,
    tax: 264,
    total: 2024,
    paymentMethod: 'Cash',
    status: 'Completed' as const,
    cashier: 'Muna Jibril',
    notes: 'Customer requested gift wrapping'
};

export default function SaleDetailsPage() {
    const params = useParams();

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-5xl mx-auto p-4 md:p-8">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/shop/sales" className="text-gray-400 hover:text-[#3498DB] transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                            <ArrowLeft size={14} /> Back to Sales
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-[#2ECC71] to-[#27AE60] rounded-xl shadow-lg shadow-green-500/20 text-white">
                            <Receipt size={28} />
                        </div>
                        Invoice Details
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">Invoice #{SALE_DATA.invoiceNumber}</p>
                </div>

                <div className="flex gap-3">
                    <button className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2">
                        <Mail size={18} /> Email
                    </button>
                    <button className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2">
                        <Download size={18} /> Download
                    </button>
                    <button className="px-5 py-2.5 rounded-xl bg-[#3498DB] hover:bg-[#2980B9] text-white font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
                        <Printer size={18} /> Print
                    </button>
                </div>
            </div>

            {/* INVOICE CARD */}
            <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-xl overflow-hidden">

                {/* Header Section */}
                <div className="p-8 border-b border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">INVOICE</h2>
                            <p className="text-sm text-gray-500">Invoice #: <span className="font-bold text-gray-900 dark:text-white">{SALE_DATA.invoiceNumber}</span></p>
                            <p className="text-sm text-gray-500">Date: <span className="font-bold text-gray-900 dark:text-white">{SALE_DATA.date} at {SALE_DATA.time}</span></p>
                        </div>
                        <StatusBadge status={SALE_DATA.status} />
                    </div>
                </div>

                {/* Customer & Payment Info */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Bill To</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <User size={16} className="text-gray-400" />
                                <span className="font-bold text-gray-900 dark:text-white">{SALE_DATA.customer.name}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 ml-6">{SALE_DATA.customer.phone}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 ml-6">{SALE_DATA.customer.email}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Payment Details</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <CreditCard size={16} className="text-gray-400" />
                                <span className="font-bold text-gray-900 dark:text-white">{SALE_DATA.paymentMethod}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 ml-6">Cashier: {SALE_DATA.cashier}</p>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="p-8">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="pb-3 text-left text-xs font-bold text-gray-400 uppercase">Item</th>
                                <th className="pb-3 text-center text-xs font-bold text-gray-400 uppercase">Qty</th>
                                <th className="pb-3 text-right text-xs font-bold text-gray-400 uppercase">Unit Price</th>
                                <th className="pb-3 text-right text-xs font-bold text-gray-400 uppercase">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {SALE_DATA.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="py-4">
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">{item.name}</p>
                                            <p className="text-xs text-gray-400 font-mono">SKU: {item.sku}</p>
                                        </div>
                                    </td>
                                    <td className="py-4 text-center font-bold text-gray-900 dark:text-white">{item.quantity}</td>
                                    <td className="py-4 text-right font-medium text-gray-700 dark:text-gray-300">ETB {item.unitPrice.toLocaleString()}</td>
                                    <td className="py-4 text-right font-black text-gray-900 dark:text-white">ETB {item.total.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-8 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex justify-end">
                        <div className="w-full md:w-1/3 space-y-3">
                            <div className="flex justify-between text-sm text-gray-500 font-medium">
                                <span>Subtotal</span>
                                <span>ETB {SALE_DATA.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500 font-medium">
                                <span>Tax (15%)</span>
                                <span>ETB {SALE_DATA.tax.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                                <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                                <span className="text-2xl font-black text-[#2ECC71]">ETB {SALE_DATA.total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {SALE_DATA.notes && (
                        <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Notes</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{SALE_DATA.notes}</p>
                        </div>
                    )}
                </div>

            </div>

        </div>
    );
}
