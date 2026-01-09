'use client';

import React, { useState } from 'react';
import {
    Save,
    ArrowLeft,
    User,
    Mail,
    Phone,
    MapPin,
    CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function EditCustomerPage() {
    const params = useParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Mock data - replace with API call
    const [formData, setFormData] = useState({
        name: 'Ahmed Ali Mohamed',
        email: 'ahmed.ali@example.com',
        phone: '+252 61 555 1234',
        address: 'Km4, Hodan District, Mogadishu',
        status: 'Active'
    });

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            alert('Customer updated successfully!');
            router.push(`/shop/customers/${params.id}`);
        }, 1500);
    };

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-4xl mx-auto p-4 md:p-8">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href={`/shop/customers/${params.id}`} className="text-gray-400 hover:text-[#3498DB] transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                            <ArrowLeft size={14} /> Back to Profile
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-[#F39C12] to-[#E67E22] rounded-xl shadow-lg shadow-orange-500/20 text-white">
                            <User size={28} />
                        </div>
                        Edit Customer
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">Update customer information.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-xl overflow-hidden">

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* LEFT COLUMN */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                            <User size={18} className="text-[#3498DB]" /> Personal Details
                        </h3>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Phone size={18} />
                                </div>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                            <MapPin size={18} className="text-[#F39C12]" /> Location & Status
                        </h3>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Address / Location</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => handleChange('status', e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all appearance-none cursor-pointer text-gray-700 dark:text-gray-300"
                            >
                                <option>Active</option>
                                <option>Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                    <Link href={`/shop/customers/${params.id}`} className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-8 py-3 rounded-xl bg-[#2ECC71] hover:bg-[#27AE60] text-white font-bold shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Updating...' : <><CheckCircle2 size={18} /> Update Customer</>}
                    </button>
                </div>

            </form>

        </div>
    );
}
