// app/sales/edit/[id]/page.tsx - Edit Sale Page
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Layout from '../../../../components/layouts/Layout';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import Toast from '../../../../components/common/Toast';

interface Customer {
    id: string;
    name: string;
}

interface Account {
    id: string;
    name: string;
}

export default function EditSalePage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);

    const [formData, setFormData] = useState({
        customerId: '',
        totalAmount: '',
        accountId: '',
        saleDate: '',
        notes: '',
    });

    useEffect(() => {
        fetchInitialData();
    }, [id]);

    const fetchInitialData = async () => {
        try {
            setPageLoading(true);
            const [saleRes, customersRes, accountsRes] = await Promise.all([
                fetch(`/api/sales/${id}`),
                fetch('/api/customers'),
                fetch('/api/accounting/accounts'),
            ]);

            if (!saleRes.ok) throw new Error('Failed to fetch sale details');

            const saleData = await saleRes.json();
            const customersData = await customersRes.json();
            const accountsData = await accountsRes.json();

            setCustomers(customersData.customers || []);
            setAccounts(accountsData.accounts || []);

            const sale = saleData.sale;
            setFormData({
                customerId: sale.customerId || '',
                totalAmount: sale.amount ? String(Number(sale.amount)) : '',
                accountId: sale.accountId || '',
                saleDate: sale.transactionDate ? new Date(sale.transactionDate).toISOString().split('T')[0] : '',
                notes: sale.note || '',
            });

        } catch (error: any) {
            setToastMessage({ message: error.message || 'Error loading data', type: 'error' });
        } finally {
            setPageLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setToastMessage(null);

        if (!formData.totalAmount || !formData.accountId) {
            setToastMessage({ message: 'Amount and Account are required.', type: 'error' });
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`/api/sales/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: formData.customerId || null,
                    totalAmount: parseFloat(formData.totalAmount),
                    accountId: formData.accountId,
                    saleDate: formData.saleDate,
                    notes: formData.notes || null,
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Update failed');

            setToastMessage({ message: 'Sale updated successfully!', type: 'success' });
            setTimeout(() => router.push(`/sales/${id}`), 1000);
        } catch (error: any) {
            setToastMessage({ message: error.message || 'Update failed', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-screen">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            {toastMessage && <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />}
            <div className="p-6 space-y-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href={`/sales/${id}`} className="p-2 hover:bg-lightGray dark:hover:bg-gray-700 rounded-lg transition">
                            <ArrowLeft size={24} className="text-darkGray dark:text-gray-100" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-darkGray dark:text-gray-100">Edit Sale</h1>
                            <p className="text-mediumGray dark:text-gray-400 mt-1">Modify sale transaction</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border border-lightGray dark:border-gray-700">
                    <form onSubmit={handleSubmit} className="space-y-8">

                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg flex items-start gap-3 border border-blue-100 dark:border-blue-800">
                            <AlertCircle className="text-blue-500 mt-1 flex-shrink-0" size={20} />
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Editing a sale will adjust the account balances to reflect the new amount. Please ensure the new amount is correct.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Customer Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                                    Customer
                                </label>
                                <select
                                    value={formData.customerId}
                                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                                    className="w-full px-4 py-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
                                >
                                    <option value="">Walk-in Customer</option>
                                    {customers.map(customer => (
                                        <option key={customer.id} value={customer.id}>{customer.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Account Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                                    Account (Received In) <span className="text-redError">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.accountId}
                                    onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                                    className="w-full px-4 py-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
                                >
                                    <option value="">Select Account...</option>
                                    {accounts.map(account => (
                                        <option key={account.id} value={account.id}>{account.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Total Amount */}
                            <div>
                                <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                                    Total Amount (ETB) <span className="text-redError">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.totalAmount}
                                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                                    className="w-full px-4 py-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary font-bold"
                                />
                            </div>

                            {/* Sale Date */}
                            <div>
                                <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                                    Sale Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.saleDate}
                                    onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                                    className="w-full px-4 py-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                                Notes
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Additional notes..."
                                rows={3}
                                className="w-full px-4 py-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex space-x-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>Saving Changes...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        <span>Update Sale</span>
                                    </>
                                )}
                            </button>
                            <Link
                                href={`/sales/${id}`}
                                className="px-6 py-3 border border-lightGray dark:border-gray-700 rounded-lg font-semibold text-darkGray dark:text-gray-100 hover:bg-lightGray dark:hover:bg-gray-700 transition"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
