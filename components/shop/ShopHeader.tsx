'use client';

import React from 'react';
import { Bell, Search, User, Menu, ChevronDown, Globe } from 'lucide-react';

export default function ShopHeader() {
    return (
        <header className="h-20 bg-white/70 dark:bg-[#111827]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-40 px-6 flex items-center justify-between transition-all duration-300">
            {/* Mobile Menu Toggle */}
            <button className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                <Menu size={24} />
            </button>

            {/* Search Bar - Jewel Style */}
            <div className="hidden md:flex items-center flex-1 max-w-lg ml-0 lg:ml-4">
                <div className="relative w-full group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#3498DB] transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search products, invoices, customers..."
                        className="block w-full pl-11 pr-4 py-3 border border-transparent bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl leading-5 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-[#1f2937] focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB] shadow-inner transition-all duration-300 sm:text-sm font-medium"
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3 lg:gap-5">
                {/* Language Toggle */}
                <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                    <Globe size={18} className="text-[#3498DB]" />
                    <span className="hidden sm:inline">EN</span>
                </button>

                {/* Notifications */}
                <button className="relative p-3 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all hover:scale-105 active:scale-95 group">
                    <Bell size={22} className="group-hover:text-[#F39C12] transition-colors" />
                    <span className="absolute top-2.5 right-2.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#111827] animate-pulse"></span>
                </button>

                {/* User Profile - Jewel Gradient */}
                <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-gray-200 dark:border-gray-800">
                    <button className="flex items-center gap-3 group focus:outline-none">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#3498DB] to-[#2980B9] flex items-center justify-center text-white shadow-lg shadow-blue-500/20 ring-2 ring-transparent group-hover:ring-[#3498DB]/30 transition-all">
                            <User size={20} strokeWidth={2.5} />
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#3498DB] transition-colors">Shop Manager</p>
                            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Admin</p>
                        </div>
                        <ChevronDown size={16} className="text-gray-400 hidden md:block group-hover:text-[#3498DB] transition-colors" />
                    </button>
                </div>
            </div>
        </header>
    );
}
