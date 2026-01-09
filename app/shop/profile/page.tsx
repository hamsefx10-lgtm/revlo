'use client';

import React from 'react';
import {
    ArrowLeft,
    User,
    Settings,
    Bell,
    Shield,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Edit,
    Camera,
    Briefcase,
    DollarSign
} from 'lucide-react';
import Link from 'next/link';

// Mock data - replace with actual session/auth data
const OWNER_DATA = {
    name: 'Mohamed Kamil Hassan',
    email: 'mohamed.kamil@revlovr.com',
    phone: '+252 61 555 9999',
    role: 'Shop Owner',
    shopName: 'RevloVR Electronics',
    address: 'Km4, Hodan District, Mogadishu, Somalia',
    joinDate: '2023-01-15',
    planType: 'SHOPS_ONLY',
    avatar: 'MK'
};

const SHOP_STATS = {
    totalRevenue: 2450000,
    totalOrders: 1250,
    activeProducts: 145,
    activeEmployees: 8
};

export default function ProfilePage() {
    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-6xl mx-auto p-4 md:p-8">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/shop/dashboard" className="text-gray-400 hover:text-[#3498DB] transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                            <ArrowLeft size={14} /> Back to Dashboard
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-[#3498DB] to-[#2980B9] rounded-xl shadow-lg shadow-blue-500/20 text-white">
                            <User size={28} />
                        </div>
                        My Profile
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">Manage your account settings and preferences.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT: Profile Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm text-center">

                        {/* Avatar */}
                        <div className="relative inline-block mb-6">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#F39C12] to-[#E67E22] flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-orange-500/20">
                                {OWNER_DATA.avatar}
                            </div>
                            <button className="absolute bottom-0 right-0 p-2 bg-[#3498DB] text-white rounded-full shadow-lg hover:bg-[#2980B9] transition-colors">
                                <Camera size={16} />
                            </button>
                        </div>

                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{OWNER_DATA.name}</h2>
                        <p className="text-sm font-bold text-[#3498DB] mb-6">{OWNER_DATA.role}</p>

                        <div className="space-y-3 text-left">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                                <Mail size={16} className="text-gray-400" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{OWNER_DATA.email}</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                                <Phone size={16} className="text-gray-400" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{OWNER_DATA.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                                <Briefcase size={16} className="text-gray-400" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{OWNER_DATA.shopName}</span>
                            </div>
                        </div>

                        <button className="w-full mt-6 px-6 py-3 rounded-xl bg-[#3498DB] hover:bg-[#2980B9] text-white font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2">
                            <Edit size={18} /> Edit Profile
                        </button>
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-6 bg-gradient-to-br from-[#2ECC71] to-[#27AE60] p-6 rounded-[2rem] shadow-xl shadow-green-500/20 text-white relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="relative z-10">
                            <p className="text-green-100 text-xs font-bold uppercase tracking-wider mb-2">Total Revenue</p>
                            <h2 className="text-3xl font-black mb-1">ETB {SHOP_STATS.totalRevenue.toLocaleString()}</h2>
                            <p className="text-green-100 text-sm">Since {OWNER_DATA.joinDate}</p>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Settings & Info */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Account Information */}
                    <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <User size={20} className="text-[#3498DB]" /> Account Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Full Name</label>
                                <input type="text" value={OWNER_DATA.name} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-white" readOnly />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Email Address</label>
                                <input type="email" value={OWNER_DATA.email} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-white" readOnly />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Phone Number</label>
                                <input type="tel" value={OWNER_DATA.phone} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-white" readOnly />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Shop Name</label>
                                <input type="text" value={OWNER_DATA.shopName} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-white" readOnly />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Address</label>
                                <input type="text" value={OWNER_DATA.address} className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-white" readOnly />
                            </div>
                        </div>
                    </div>

                    {/* Business Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Total Orders</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{SHOP_STATS.totalOrders}</p>
                        </div>
                        <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Products</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{SHOP_STATS.activeProducts}</p>
                        </div>
                        <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Employees</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{SHOP_STATS.activeEmployees}</p>
                        </div>
                        <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Plan</p>
                            <p className="text-sm font-black text-[#2ECC71]">SHOPS ONLY</p>
                        </div>
                    </div>

                    {/* Security Settings */}
                    <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <Shield size={20} className="text-[#2ECC71]" /> Security & Privacy
                        </h3>

                        <div className="space-y-4">
                            <button className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-[#3498DB]/10 text-[#3498DB]">
                                        <Shield size={18} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">Change Password</p>
                                        <p className="text-xs text-gray-500">Update your account password</p>
                                    </div>
                                </div>
                                <Edit size={16} className="text-gray-400" />
                            </button>

                            <button className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-[#F39C12]/10 text-[#F39C12]">
                                        <Bell size={18} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">Notification Settings</p>
                                        <p className="text-xs text-gray-500">Manage email and SMS alerts</p>
                                    </div>
                                </div>
                                <Edit size={16} className="text-gray-400" />
                            </button>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
}
