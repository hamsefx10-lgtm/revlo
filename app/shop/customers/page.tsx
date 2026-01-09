'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Search,
    UserPlus,
    Mail,
    Phone,
    MoreVertical,
    User,
    ShoppingBag,
    TrendingUp,
    MapPin
} from 'lucide-react';
import StatusBadge from '@/components/shop/ui/StatusBadge';
import { useToast } from '@/components/ui/use-toast';

// --- TYPES ---
interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    totalOrders: number;
    totalSpent: number;
    lastOrder: string;
    status: 'Active' | 'Inactive';
}

export default function CustomersPage() {
    const [search, setSearch] = useState('');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchCustomers();
    }, [search]);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (search) params.append('search', search);

            const response = await fetch(`/api/shop/customers?${params}`);

            if (!response.ok) {
                throw new Error('Failed to fetch customers');
            }

            const data = await response.json();
            setCustomers(data.customers || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
            toast({
                title: 'Error',
                description: 'Failed to load customers. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredData = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
    );

    // Calculate stats
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'Active').length;
    const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    const avgOrderValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-[#3498DB]">
                            <User size={28} />
                        </div>
                        Customers
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">Manage customer relationships and history.</p>
                </div>

                <div className="flex gap-3">
                    <Link href="/shop/customers/add" className="px-5 py-2.5 rounded-xl bg-[#3498DB] hover:bg-[#2980B9] text-white font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center gap-2">
                        <UserPlus size={18} /> Add Customer
                    </Link>
                </div>
            </div>

            {/* STATS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[#3498DB]/10 text-[#3498DB]">
                            <User size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Total Customers</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{totalCustomers}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[#2ECC71]/10 text-[#2ECC71]">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Active</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{activeCustomers}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-[#F39C12]/10 text-[#F39C12]">
                            <ShoppingBag size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Total Revenue</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">ETB {totalRevenue.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Avg. Lifetime Value</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">ETB {Math.round(avgOrderValue).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SEARCH BAR */}
            <div className="mb-6">
                <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name, phone, or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB] transition-all font-medium text-sm"
                    />
                </div>
            </div>

            {/* TABLE CARD */}
            <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3498DB]"></div>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="text-center py-20">
                        <User size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">No customers found</p>
                        <Link href="/shop/customers/add" className="inline-block mt-4 text-[#3498DB] font-bold hover:underline">
                            Add your first customer
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-800/20 border-b border-gray-100 dark:border-gray-800">
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Orders</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Total Spent</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredData.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link href={`/shop/customers/${customer.id}`} className="block hover:text-[#3498DB] transition-colors">
                                                <span className="block font-bold text-gray-900 dark:text-white text-sm">{customer.name}</span>
                                                <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                                    <MapPin size={12} /> {customer.address || 'No address'}
                                                </span>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm">
                                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-1">
                                                    <Phone size={14} className="text-gray-400" />
                                                    <span className="font-medium">{customer.phone}</span>
                                                </div>
                                                {customer.email && (
                                                    <div className="flex items-center gap-2 text-gray-500">
                                                        <Mail size={14} className="text-gray-400" />
                                                        <span className="text-xs">{customer.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="font-bold text-gray-900 dark:text-white">{customer.totalOrders || 0}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-gray-900 dark:text-white">
                                            ETB {(customer.totalSpent || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap flex justify-center">
                                            <StatusBadge status={customer.status} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
