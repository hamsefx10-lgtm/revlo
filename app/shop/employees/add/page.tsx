'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, User, Mail, Phone, Briefcase, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

export default function AddEmployeePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        role: 'Cashier',
        phone: '',
        email: '',
        salary: '',
        status: 'Active'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/shop/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create employee');
            }

            toast({ title: 'Success', description: 'Employee added successfully' });
            router.push('/shop/employees');
        } catch (error: any) {
            console.error(error);
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 pb-20 font-sans">
            {/* TOP BAR */}
            <div className="sticky top-0 z-20 bg-white dark:bg-[#0f172a] border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/shop/employees" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                        <ArrowLeft size={20} className="text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                            Add New Employee
                        </h1>
                        <p className="text-xs text-gray-500">Create a new staff profile</p>
                    </div>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="px-6 py-3 bg-[#3498DB] hover:bg-[#2980B9] text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center gap-2 disabled:opacity-70"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    Save Employee
                </button>
            </div>

            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white dark:bg-[#1f2937] rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-800 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Full Name */}
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Full Name *</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Abdi Hassan"
                                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                                        value={formData.fullName}
                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Role */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Role *</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                    <select
                                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-medium text-gray-900 dark:text-white cursor-pointer appearance-none"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="Manager">Manager</option>
                                        <option value="Cashier">Cashier</option>
                                        <option value="Stock Clerk">Stock Clerk</option>
                                        <option value="Security">Security</option>
                                        <option value="Cleaner">Cleaner</option>
                                    </select>
                                </div>
                            </div>

                            {/* Salary */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Monthly Salary (ETB)</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                                    value={formData.salary}
                                    onChange={e => setFormData({ ...formData, salary: e.target.value })}
                                />
                            </div>

                            {/* Contact Info */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                    <input
                                        type="tel"
                                        placeholder="+252..."
                                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        placeholder="employee@shop.so"
                                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Account Status</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="Active"
                                            checked={formData.status === 'Active'}
                                            onChange={() => setFormData({ ...formData, status: 'Active' })}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span className="text-sm font-medium">Active</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="Inactive"
                                            checked={formData.status === 'Inactive'}
                                            onChange={() => setFormData({ ...formData, status: 'Inactive' })}
                                            className="w-4 h-4 text-gray-600"
                                        />
                                        <span className="text-sm font-medium text-gray-500">Inactive</span>
                                    </label>
                                </div>
                            </div>

                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
