'use client';

import React, { useState, useEffect } from 'react';
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

import { generateInvoicePDF } from '@/lib/invoice-generator';

export default function SaleDetailsPage() {
    const params = useParams();
    const [sale, setSale] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchSaleDetails(params.id as string);
        }
    }, [params.id]);

    const fetchSaleDetails = async (id: string) => {
        try {
            setLoading(true);
            const res = await fetch(`/api/shop/sales/${id}`);
            if (res.ok) {
                const data = await res.json();
                setSale(data.sale);
            } else {
                console.error('Failed to fetch sale');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = (action: 'download' | 'print') => {
        if (!sale) return;

        const dateObj = new Date(sale.createdAt);

        const invoiceData = {
            invoiceNumber: sale.invoiceNumber,
            date: dateObj.toLocaleDateString(),
            time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            customerName: sale.customer?.name || 'Walk-in Customer',
            customerPhone: sale.customer?.phone,
            customerEmail: sale.customer?.email,
            cashierName: sale.user?.fullName || 'N/A',
            paymentMethod: sale.paymentMethod,
            subtotal: sale.subtotal,
            tax: sale.tax,
            total: sale.total,
            items: sale.items.map((item: any) => ({
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total
            })),
            notes: sale.notes,
            // Calculate and pass payment details
            paidAmount: sale.paidAmount !== undefined ? sale.paidAmount : (sale.status === 'Completed' || sale.paymentStatus === 'Paid' ? sale.total : 0),
            balanceDue: Math.max(0, sale.total - (sale.paidAmount !== undefined ? sale.paidAmount : (sale.status === 'Completed' || sale.paymentStatus === 'Paid' ? sale.total : 0)))
        };

        generateInvoicePDF(invoiceData, action);
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2ECC71]"></div>
            </div>
        );
    }

    if (!sale) {
        return (
            <div className="flex flex-col h-screen items-center justify-center p-4 text-center">
                <Receipt size={48} className="text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sale Not Found</h2>
                <Link href="/shop/sales" className="mt-4 text-[#3498DB] hover:underline">Return to Sales History</Link>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full p-4 md:p-6 lg:p-8">

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
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">Invoice #{sale.invoiceNumber}</p>
                </div>

                <div className="flex gap-3">
                    <button className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2"
                        onClick={() => alert('Email functionality coming soon!')}>
                        <Mail size={18} /> Email
                    </button>
                    <button
                        onClick={() => handleExport('download')}
                        className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2">
                        <Download size={18} /> Download
                    </button>
                    <button
                        onClick={() => handleExport('print')}
                        className="px-5 py-2.5 rounded-xl bg-[#3498DB] hover:bg-[#2980B9] text-white font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
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
                            <p className="text-sm text-gray-500">Invoice #: <span className="font-bold text-gray-900 dark:text-white">{sale.invoiceNumber}</span></p>
                            <p className="text-sm text-gray-500">Date: <span className="font-bold text-gray-900 dark:text-white">{formatDate(sale.createdAt)} at {formatTime(sale.createdAt)}</span></p>
                        </div>
                        <StatusBadge status={sale.status} />
                    </div>
                </div>

                {/* Customer & Payment Info */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Bill To</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <User size={16} className="text-gray-400" />
                                <span className="font-bold text-gray-900 dark:text-white">{sale.customer?.name || 'Walk-in Customer'}</span>
                            </div>
                            {sale.customer && (
                                <>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 ml-6">{sale.customer.phone}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 ml-6">{sale.customer.email}</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Payment Details</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <CreditCard size={16} className="text-gray-400" />
                                <span className="font-bold text-gray-900 dark:text-white">{sale.paymentMethod}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 ml-6">Cashier: {sale.user?.fullName || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="border-b border-gray-100 dark:border-gray-800">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Item</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Qty</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {sale.items.map((item: any, i: number) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-900 dark:text-white">{item.productName}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-gray-600 dark:text-gray-400">
                                        {item.quantity}
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-gray-600 dark:text-gray-400">
                                        {item.unitPrice.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                                        {item.total.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Totals */}
                <div className="bg-gray-50 dark:bg-[#111827] p-8 flex flex-col md:flex-row justify-between items-start gap-8">
                    <div className="flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2">Notes</h4>
                        <p className="text-sm text-gray-500 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 min-h-[60px]">
                            {sale.notes || 'No notes for this sale.'}
                        </p>

                        {/* Payment Info Badge */}
                        <div className="mt-6 flex gap-4">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex-1">
                                <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Payment Method</span>
                                <span className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <CreditCard size={18} className="text-[#3498DB]" /> {sale.paymentMethod}
                                </span>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex-1">
                                <span className="block text-xs font-bold text-gray-400 uppercase mb-1">Payment Status</span>
                                <StatusBadge status={sale.paymentStatus || sale.status} />
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-80 space-y-3">
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Subtotal</span>
                            <span className="font-bold text-gray-900 dark:text-white">ETB {sale.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Tax</span>
                            <span className="font-bold text-gray-900 dark:text-white">ETB {sale.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-black text-gray-900 dark:text-white pt-3 border-t border-gray-200 dark:border-gray-700">
                            <span>Total</span>
                            <span>ETB {sale.total.toFixed(2)}</span>
                        </div>

                        {/* Debt / Balance Calculation */}
                        {(sale.paymentStatus === 'Credit' || sale.paymentStatus === 'Partial' || sale.paymentStatus === 'Unpaid' || (sale.paidAmount !== undefined && sale.paidAmount < sale.total)) && (
                            <div className="pt-3 mt-1 border-dashed border-t border-gray-300 dark:border-gray-600">
                                <div className="flex justify-between text-sm text-green-600 dark:text-green-400 mb-1">
                                    <span className="font-bold">Paid Amount</span>
                                    <span className="font-bold">ETB {(sale.paidAmount || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-base text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                                    <span className="font-black uppercase text-xs flex items-center">Balance Due</span>
                                    <span className="font-black">ETB {(sale.total - (sale.paidAmount || 0)).toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
}
