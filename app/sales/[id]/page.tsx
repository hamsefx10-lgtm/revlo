// app/sales/[id]/page.tsx - View Sale Details (Invoice Style)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/layouts/Layout';
import {
    ArrowLeft, Edit, Trash2, Printer, Download,
    User, CheckCircle, AlertCircle, ShoppingCart, Calendar
} from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function SaleDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [sale, setSale] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (id) {
            fetchSaleDetails();
        }
    }, [id]);

    const fetchSaleDetails = async () => {
        setLoading(true);
        try {
            // Sales are transactions of type INCOME in this system
            const response = await fetch(`/api/sales/${id}`);
            if (!response.ok) {
                if (response.status === 404) { setSale(null); return; }
                throw new Error('Failed to load sale details');
            }
            const data = await response.json();
            setSale(data.sale);
        } catch (error: any) {
            console.error(error);
            setToastMessage({ message: 'Error loading details.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this sale? This will revert account balance changes.')) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/sales/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Delete failed');
            setToastMessage({ message: 'Deleted successfully', type: 'success' });
            setTimeout(() => router.push('/sales'), 1000);
        } catch (error: any) {
            setToastMessage({ message: 'Could not delete sale.', type: 'error' });
            setLoading(false);
        }
    };

    if (loading) return <Layout><div className="flex h-[80vh] items-center justify-center text-gray-400">Loading details...</div></Layout>;

    if (!sale) return (
        <Layout>
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4"><AlertCircle size={32} /></div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sale Not Found</h2>
                <p className="text-gray-500 mt-2 mb-6 max-w-md">The sale record you are looking for might have been deleted or does not exist.</p>
                <Link href="/sales" className="px-6 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg font-medium hover:opacity-90 transition">Return to Sales</Link>
            </div>
        </Layout>
    );

    return (
        <Layout>
            {toastMessage && <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />}

            <div className="max-w-4xl mx-auto py-8 animate-in slide-in-from-bottom-4 fade-in duration-500">

                {/* NAV */}
                <div className="flex items-center justify-between mb-6">
                    <Link href="/sales" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                        <ArrowLeft size={18} /> <span className="text-sm font-medium">Back to Sales</span>
                    </Link>
                    <div className="flex gap-2">
                        <button onClick={() => window.print()} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700 rounded-lg"><Printer size={18} /></button>
                        <button onClick={() => router.push(`/sales/edit/${sale.id}`)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors border border-transparent hover:border-blue-100 rounded-lg"><Edit size={18} /></button>
                        <button onClick={handleDelete} className="p-2 text-gray-400 hover:text-red-600 transition-colors border border-transparent hover:border-red-100 rounded-lg"><Trash2 size={18} /></button>
                    </div>
                </div>

                {/* INVOICE CARD */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden relative print:shadow-none print:border min-h-[600px] flex flex-col">

                    <div className="p-10 md:p-14 flex-1">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b-2 border-dashed border-gray-100 dark:border-gray-700 pb-10">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="h-8 w-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-xs">RV</span>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Sales Invoice</p>
                                </div>
                                <h1 className="text-3xl md:text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                                    {sale.description || 'Sale Transaction'}
                                </h1>
                                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                    <span className="bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider">{sale.category || 'SALE'}</span>
                                    <span className="text-gray-300">•</span>
                                    <span>{new Date(sale.transactionDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                            </div>
                            <div className="text-right bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800/50 min-w-[200px]">
                                <p className="text-sm text-blue-400 font-bold uppercase tracking-wider mb-1">Total Amount</p>
                                <p className="text-4xl font-black text-gray-900 dark:text-white tabular-nums tracking-tighter">
                                    {Number(sale.amount).toLocaleString()} <span className="text-xl font-bold text-gray-400">ETB</span>
                                </p>
                                <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    <CheckCircle size={14} />
                                    Paid
                                </div>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10 mb-12">

                            <div className="space-y-8">
                                <div>
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Customer Details</label>
                                    {sale.customer ? (
                                        <div className="group flex items-start gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg shadow-sm"><User size={24} /></div>
                                            <div>
                                                <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{sale.customer.name}</p>
                                                <p className="text-sm text-gray-500 font-medium mt-1">{sale.customer.phone || 'No phone number'}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-500 italic">
                                            Walk-in Customer
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Payment Details</label>
                                    <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-500">Method</span>
                                            <span className="font-bold text-gray-900 dark:text-white">
                                                {sale.type === 'INCOME' ? 'Cash/Transfer' : 'Other'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Account</span>
                                            <span className="font-bold text-gray-900 dark:text-white">
                                                {sale.account ? sale.account.name : 'Unknown Account'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Notes */}
                        {sale.note && (
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 mb-8">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Notes</label>
                                <p className="text-gray-700 dark:text-gray-300 italic">"{sale.note}"</p>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="mt-auto pt-10 flex justify-between items-end border-t border-gray-100 dark:border-gray-800">
                            <div className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">
                                <p>Transaction ID: {sale.id.split('-')[0]}</p>
                                <p className="mt-1">Generated by System</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-300 font-mono">REVLO-VR SYSTEM</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </Layout>
    );
}
