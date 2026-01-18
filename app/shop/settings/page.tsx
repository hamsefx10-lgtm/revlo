'use client';

import React, { useState, useEffect } from 'react';
import {
    Save,
    Store,
    CreditCard,
    Bell,
    Lock,
    Globe,
    FileText,
    Printer,
    Users,
    Loader2
} from 'lucide-react';
import UltraIcon from '@/components/shop/ui/UltraIcon';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

export default function SettingsPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('General');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [company, setCompany] = useState({
        name: '',
        phone: '',
        address: '',
        currency: 'USD',
        email: '',
        website: '',
        taxId: '',
        taxRate: '',
        receiptHeader: '',
        receiptFooter: ''
    });

    useEffect(() => {
        fetchCompany();
    }, []);

    const fetchCompany = async () => {
        try {
            const response = await fetch('/api/shop/company');
            const data = await response.json();
            if (data.company) {
                setCompany({
                    name: data.company.name || '',
                    phone: data.company.phone || '',
                    address: data.company.address || '',
                    currency: 'USD', // Default as schema might not have it yet or it's named differently
                    email: data.company.email || '',
                    website: data.company.website || '',
                    taxId: data.company.taxId || '',
                    taxRate: data.company.taxRate ? data.company.taxRate.toString() : '',
                    receiptHeader: data.company.receiptHeader || '',
                    receiptFooter: data.company.receiptFooter || ''
                });
            }
        } catch (error) {
            console.error('Error fetching company:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/shop/company', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(company)
            });

            if (!response.ok) throw new Error("Failed to update settings");

            toast({ title: 'Success', description: 'Settings saved successfully.' });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const MENU_ITEMS = [
        { id: 'General', icon: Store, label: 'General' },
        { id: 'Payment', icon: CreditCard, label: 'Payment & Tax' },
        { id: 'Receipt', icon: Printer, label: 'Receipt Settings' },
        { id: 'Users', icon: Users, label: 'Users & Roles' },
        { id: 'Security', icon: Lock, label: 'Security' },
    ];

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Settings</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage your shop preferences and configuration.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || loading}
                    className="px-6 py-3 rounded-xl bg-[#3498DB] hover:bg-[#2980B9] text-white font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center gap-2 disabled:opacity-70"
                >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    Save Changes
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">

                {/* SIDEBAR NAVIGATION */}
                <div className="w-full lg:w-72 flex-shrink-0">
                    <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-4 sticky top-6 shadow-sm">
                        {MENU_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl font-bold text-sm transition-all mb-2 ${activeTab === item.id
                                    ? 'bg-[#3498DB] text-white shadow-lg shadow-blue-500/25'
                                    : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <item.icon size={20} className={activeTab === item.id ? 'opacity-100' : 'opacity-70'} />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="flex-1 space-y-6">

                    {/* General Settings */}
                    {activeTab === 'General' && (
                        <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm relative">
                            {loading && <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>}

                            <div className="flex items-center gap-4 mb-8">
                                <UltraIcon icon={Store} variant="primary" />
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white">Store Profile</h2>
                                    <p className="text-sm text-gray-500">Basic information about your business.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Shop Name</label>
                                    <input
                                        type="text"
                                        value={company.name}
                                        onChange={(e) => setCompany({ ...company, name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                                    <input
                                        type="text"
                                        value={company.phone}
                                        onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Address</label>
                                    <input
                                        type="text"
                                        value={company.address}
                                        onChange={(e) => setCompany({ ...company, address: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Currency</label>
                                    <div className="relative">
                                        <select
                                            value={company.currency}
                                            onChange={(e) => setCompany({ ...company, currency: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium text-gray-700 dark:text-white appearance-none"
                                        >
                                            <option value="ETB">ETB - Ethiopian Birr</option>
                                            <option value="USD">USD - US Dollar</option>
                                            <option value="SOS">SOS - Somali Shilling</option>
                                        </select>
                                    </div>

                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment & Tax - UI Only for now */}
                    {activeTab === 'Payment' && (
                        <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <UltraIcon icon={CreditCard} variant="secondary" />
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white">Tax Configuration</h2>
                                    <p className="text-sm text-gray-500">Manage tax rates and IDs.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-gray-100 dark:border-gray-800">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">VAT Rate (%)</label>
                                    <input
                                        type="number"
                                        value={company.taxRate}
                                        onChange={(e) => setCompany({ ...company, taxRate: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tax ID / TIN</label>
                                    <input
                                        type="text"
                                        value={company.taxId}
                                        onChange={(e) => setCompany({ ...company, taxId: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Receipt - UI Only for now */}
                    {activeTab === 'Receipt' && (
                        <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <UltraIcon icon={Printer} variant="accent" />
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white">Receipt Customization</h2>
                                    <p className="text-sm text-gray-500">Edit header, footer and layout.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Receipt Header</label>
                                    <input
                                        type="text"
                                        value={company.receiptHeader}
                                        onChange={(e) => setCompany({ ...company, receiptHeader: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Receipt Footer</label>
                                    <textarea
                                        rows={3}
                                        value={company.receiptFooter}
                                        onChange={(e) => setCompany({ ...company, receiptFooter: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* USERS - Redirects */}
                    {activeTab === 'Users' && (
                        <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-12 shadow-sm text-center">
                            <div className="inline-block p-6 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                                <Users size={48} className="text-gray-400" />
                            </div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Manage Employees</h2>
                            <p className="text-gray-500 mb-6">Staff roles and permissions are managed in the Employees module.</p>
                            <Link href="/shop/employees" className="inline-block px-6 py-3 bg-gray-900 text-white rounded-xl font-bold shadow-lg hover:opacity-90">
                                Go to Employees
                            </Link>
                        </div>
                    )}

                    {/* SECURITY - Placeholder */}
                    {activeTab === 'Security' && (
                        <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-12 shadow-sm text-center">
                            <div className="inline-block p-6 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                                <Lock size={48} className="text-gray-400" />
                            </div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Security Settings</h2>
                            <p className="text-gray-500">Password policies and audit logs coming soon.</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
