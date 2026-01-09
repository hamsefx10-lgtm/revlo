'use client';

import React, { useState } from 'react';
import {
    Save,
    ArrowLeft,
    Briefcase,
    Mail,
    Phone,
    MapPin,
    CheckCircle2,
    Calendar,
    DollarSign,
    Shield
} from 'lucide-react';
import Link from 'next/link';

export default function AddEmployeePage() {
    const [isLoading, setIsLoading] = useState(false);

    const ROLES = ['Cashier', 'Store Manager', 'Stock Keeper', 'Sales Associate', 'Accountant'];
    const DEPARTMENTS = ['Sales', 'Inventory', 'Accounting', 'Management'];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            alert('Employee added successfully!');
        }, 1500);
    };

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-5xl mx-auto p-4 md:p-8">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/shop/employees" className="text-gray-400 hover:text-[#3498DB] transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                            <ArrowLeft size={14} /> Back to Employees
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-[#3498DB] to-[#2980B9] rounded-xl shadow-lg shadow-blue-500/20 text-white">
                            <Briefcase size={28} />
                        </div>
                        Add New Employee
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">Register a new team member.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-xl overflow-hidden">

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* LEFT COLUMN */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                            <Briefcase size={18} className="text-[#3498DB]" /> Personal Information
                        </h3>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                            <input type="text" placeholder="e.g. Ahmed Hassan" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all" required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Phone size={16} />
                                    </div>
                                    <input type="tel" placeholder="+252 61..." className="w-full pl-9 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Mail size={16} />
                                    </div>
                                    <input type="email" placeholder="email@..." className="w-full pl-9 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Address</label>
                            <input type="text" placeholder="e.g. Hodan District, Mogadishu" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date of Birth</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Calendar size={16} />
                                </div>
                                <input type="date" className="w-full pl-9 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all text-gray-700 dark:text-gray-300" />
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                            <Shield size={18} className="text-[#2ECC71]" /> Employment Details
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Role</label>
                                <select className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all appearance-none cursor-pointer text-gray-700 dark:text-gray-300" required>
                                    <option value="" disabled selected>Select...</option>
                                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Department</label>
                                <select className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all appearance-none cursor-pointer text-gray-700 dark:text-gray-300" required>
                                    <option value="" disabled selected>Select...</option>
                                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Hire Date</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Calendar size={16} />
                                </div>
                                <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full pl-9 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all text-gray-700 dark:text-gray-300" required />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Monthly Salary (ETB)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <DollarSign size={16} />
                                </div>
                                <input type="number" placeholder="0" className="w-full pl-9 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all" required />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                            <select className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all appearance-none cursor-pointer text-gray-700 dark:text-gray-300">
                                <option>Active</option>
                                <option>On Leave</option>
                                <option>Inactive</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes</label>
                            <textarea rows={2} placeholder="Additional information..." className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium transition-all resize-none"></textarea>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                    <Link href="/shop/employees" className="px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-8 py-3 rounded-xl bg-[#2ECC71] hover:bg-[#27AE60] text-white font-bold shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Saving...' : <><CheckCircle2 size={18} /> Save Employee</>}
                    </button>
                </div>

            </form>

        </div>
    );
}
