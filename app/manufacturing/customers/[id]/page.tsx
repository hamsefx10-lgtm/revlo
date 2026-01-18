'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft, Edit, Trash2, Phone, Mail, MapPin,
    Briefcase, Calendar, Clock, Loader2, User, Building
} from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function ViewCustomerPage() {
    const params = useParams();
    const router = useRouter();
    const customerId = params.id as string;

    const [customer, setCustomer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        fetchCustomer();
    }, [customerId]);

    const fetchCustomer = async () => {
        try {
            const response = await fetch(`/api/manufacturing/customers/${customerId}`);
            if (response.ok) {
                const data = await response.json();
                setCustomer(data.customer);
            } else {
                setToast({ message: 'Customer not found', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'Error fetching customer', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) return;
        try {
            const res = await fetch(`/api/manufacturing/customers/${customerId}`, { method: 'DELETE' });
            if (res.ok) {
                setToast({ message: 'Customer deleted', type: 'success' });
                router.push('/manufacturing/customers');
            } else {
                setToast({ message: 'Cannot delete customer with existing orders', type: 'error' });
            }
        } catch (e) {
            setToast({ message: 'Error deleting customer', type: 'error' });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-[#3498DB]" size={32} />
            </div>
        );
    }

    if (!customer) return null;

    return (
        <div className="flex flex-col gap-6 p-2 lg:p-4 min-h-screen pb-20">

            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/manufacturing/customers" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        {customer.name}
                        <span className="text-xs font-bold uppercase px-2 py-1 bg-gray-100 text-gray-500 rounded-lg border border-gray-200">{customer.type}</span>
                    </h1>
                    <p className="text-sm font-medium text-gray-500">{customer.companyName || 'Individual Client'}</p>
                </div>
                <div className="flex gap-2">
                    <Link href={`/manufacturing/customers/${customerId}/edit`} className="p-2 bg-blue-50 text-[#3498DB] rounded-xl hover:bg-blue-100 font-bold flex items-center gap-2 transition-colors">
                        <Edit size={18} /> <span className="hidden md:inline">Edit</span>
                    </Link>
                    <button onClick={handleDelete} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 font-bold flex items-center gap-2 transition-colors">
                        <Trash2 size={18} /> <span className="hidden md:inline">Delete</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Contact Information</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"><Phone size={16} /></div>
                                <span className="font-medium">{customer.phone || 'No phone'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"><Mail size={16} /></div>
                                <span className="font-medium">{customer.email || 'No email'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"><MapPin size={16} /></div>
                                <span className="font-medium">{customer.address || 'No address'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"><User size={16} /></div>
                                <span className="font-medium">{customer.contactPerson || 'No contact person'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2">Notes</h3>
                        <p className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-gray-100">
                            {customer.notes || 'No notes available.'}
                        </p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Recent Orders */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                                <Briefcase className="text-[#3498DB]" /> Recent Production Orders
                            </h3>
                            <Link href="/manufacturing/production-orders" className="text-sm font-bold text-[#3498DB] hover:underline">View All</Link>
                        </div>

                        {(!customer.productionOrders || customer.productionOrders.length === 0) ? (
                            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-gray-500 font-medium">No orders found for this customer.</p>
                                <Link href="/manufacturing/production-orders/add" className="text-[#3498DB] hover:underline text-sm font-bold mt-2 inline-block">Create New Order</Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {customer.productionOrders.map((order: any) => (
                                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 transition-colors">
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                {order.orderNumber}
                                                <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded border ${order.status === 'COMPLETED' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-blue-50 text-blue-600 border-blue-200'
                                                    }`}>{order.status}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">{order.productName} • {order.quantity} units</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-gray-400 uppercase">Due Date</div>
                                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {order.dueDate ? new Date(order.dueDate).toLocaleDateString() : '-'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
