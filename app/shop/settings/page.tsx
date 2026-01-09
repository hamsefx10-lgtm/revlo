'use client';

import React, { useState } from 'react';
import {
    Save,
    Store,
    CreditCard,
    Bell,
    Lock,
    Globe,
    FileText,
    Printer,
    Users
} from 'lucide-react';
import UltraIcon from '@/components/shop/ui/UltraIcon';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('General');

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
                <button className="px-6 py-3 rounded-xl bg-[#3498DB] hover:bg-[#2980B9] text-white font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center gap-2">
                    <Save size={18} /> Save Changes
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
                        <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <UltraIcon icon={Store} color="#3498DB" />
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white">Store Profile</h2>
                                    <p className="text-sm text-gray-500">Basic information about your business.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Shop Name</label>
                                    <input type="text" defaultValue="My Awesome Shop" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                                    <input type="text" defaultValue="+252 61 555 1234" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Address</label>
                                    <input type="text" defaultValue="Maka Al-Mukarama Rd, Mogadishu" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Currency</label>
                                    <div className="relative">
                                        <select className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium text-gray-700 dark:text-white appearance-none">
                                            <option>ETB - Ethiopian Birr</option>
                                            <option>USD - US Dollar</option>
                                            <option>SOS - Somali Shilling</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500 rotate-90 scale-75">
                                            Details &gt;
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment & Tax */}
                    {activeTab === 'Payment' && (
                        <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <UltraIcon icon={CreditCard} color="#2ECC71" />
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white">Tax Configuration</h2>
                                    <p className="text-sm text-gray-500">Manage tax rates and IDs.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8 border-b border-gray-100 dark:border-gray-800">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">VAT Rate (%)</label>
                                    <input type="number" defaultValue="15" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tax ID / TIN</label>
                                    <input type="text" defaultValue="TIN-00998877" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium" />
                                </div>
                            </div>

                            <h2 className="text-xl font-black text-gray-900 dark:text-white mt-8 mb-6">Payment Methods</h2>
                            <div className="space-y-3">
                                {['Cash', 'E-Dahab', 'Zaad', 'Credit Card'].map(method => (
                                    <div key={method} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                                <CreditCard size={16} className="text-gray-500" />
                                            </div>
                                            <span className="font-bold text-gray-700 dark:text-white">{method}</span>
                                        </div>
                                        <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                            <input type="checkbox" defaultChecked={method !== 'Credit Card'} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-[#2ECC71] checked:right-0 transition-all duration-300" />
                                            <label className="toggle-label block overflow-hidden h-6 rounded-full bg-[#2ECC71] cursor-pointer"></label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Receipt */}
                    {activeTab === 'Receipt' && (
                        <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <UltraIcon icon={Printer} color="#F39C12" />
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white">Receipt Customization</h2>
                                    <p className="text-sm text-gray-500">Edit header, footer and layout.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Receipt Header</label>
                                    <input type="text" defaultValue="Welcome to My Shop" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Receipt Footer</label>
                                    <textarea rows={3} defaultValue="Thank you for your business! Please come again." className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-0 outline-none font-medium"></textarea>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <input type="checkbox" defaultChecked className="w-5 h-5 text-[#3498DB] rounded focus:ring-0 cursor-pointer" />
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Show Logo on Receipt</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* USERS - Placeholder if needed, utilizing standard view */}
                    {activeTab === 'Users' && (
                        <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-12 shadow-sm text-center">
                            <div className="inline-block p-6 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                                <Users size={48} className="text-gray-400" />
                            </div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Manage Users</h2>
                            <p className="text-gray-500 mb-6">Redirecting to employee management module...</p>
                            <button className="px-6 py-2 bg-gray-900 text-white rounded-lg font-bold">Go to Employees</button>
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
