'use client';

import React, { useState } from 'react';
import FactorySidebar from './FactorySidebar';
import { useUser } from '@/components/providers/UserProvider';
import { Menu, Bell, Search, User, LogOut } from 'lucide-react';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import FloatingChat from '../common/FloatingChat';

export default function FactoryLayout({ children }: { children: React.ReactNode }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const { user, logout } = useUser();

    const currentUser = user ? {
        id: user.id,
        name: user.fullName || 'User',
        email: user.email || '',
        avatar: user.fullName?.charAt(0).toUpperCase() || 'U',
        role: user.role
    } : null;

    if (!user) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-[#3498DB]">Loading Factory OS...</div>;

    return (
        <LanguageProvider>
            <NotificationProvider>
                <div className="flex h-screen bg-gray-50/50 dark:bg-[#0B1120] overflow-hidden font-sans">

                    {/* Desktop Sidebar */}
                    <div className={`hidden md:block transition-all duration-300 ${sidebarCollapsed ? 'w-[5.5rem]' : 'w-[17rem]'} flex-shrink-0 relative z-20 shadow-xl lg:shadow-none`}>
                        <FactorySidebar
                            isCollapsed={sidebarCollapsed}
                            currentUser={currentUser}
                            handleLogout={logout}
                        />
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-gray-800 rounded-full text-gray-500 hover:text-[#3498DB] flex items-center justify-center shadow-md border border-gray-200 dark:border-gray-700 hover:scale-110 transition-transform z-50 text-xs"
                        >
                            {sidebarCollapsed ? '>' : '<'}
                        </button>
                    </div>

                    {/* Mobile Sidebar Overlay */}
                    {mobileSidebarOpen && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
                    )}
                    <div className={`fixed inset-y-0 left-0 w-72 transform transition-transform duration-300 z-50 md:hidden ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                        <FactorySidebar
                            isCollapsed={false}
                            currentUser={currentUser}
                            handleLogout={logout}
                            setIsSidebarOpen={setMobileSidebarOpen}
                        />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[#F8FAFC] dark:bg-[#0B1120]">

                        {/* Top Header - Factory Style */}
                        <header className="bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 h-[70px] flex items-center justify-between px-6 z-10 sticky top-0">
                            <div className="flex items-center gap-4">
                                <button
                                    className="p-2 -ml-2 text-gray-600 dark:text-gray-300 md:hidden hover:bg-gray-100 rounded-lg transition-colors"
                                    onClick={() => setMobileSidebarOpen(true)}
                                >
                                    <Menu size={24} />
                                </button>
                                <div className="hidden md:flex items-center gap-2 text-gray-400 bg-gray-100/50 dark:bg-gray-800/50 px-4 py-2 rounded-xl w-64 md:w-96 transition-all focus-within:ring-2 focus-within:ring-[#3498DB]/20 dark:focus-within:ring-blue-900 border border-transparent focus-within:border-[#3498DB]/30 dark:focus-within:border-blue-800 focus-within:bg-white dark:focus-within:bg-gray-800">
                                    <Search size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search production, orders, items..."
                                        className="bg-transparent border-none outline-none text-sm w-full text-gray-900 dark:text-white placeholder-gray-400"
                                    />
                                    <span className="text-[10px] bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 text-gray-400">⌘K</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <button className="relative p-2 text-gray-500 hover:text-[#3498DB] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                                    <Bell size={20} />
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0f172a]"></span>
                                </button>
                                <div className="h-8 w-px bg-gray-200 dark:bg-gray-800"></div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right hidden md:block">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{currentUser?.name}</p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{currentUser?.role}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#3498DB] to-cyan-500 p-[2px] shadow-md shadow-blue-500/20">
                                        <div className="w-full h-full rounded-full bg-white dark:bg-[#0f172a] flex items-center justify-center overflow-hidden">
                                            {currentUser?.avatar === 'U' ? <User size={20} className="text-gray-400" /> : (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img src={currentUser?.avatar} alt="User" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </header>

                        {/* Page Content */}
                        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] dark:bg-[#0B1120] relative scrollbar-hide">
                            <div className="max-w-[1920px] mx-auto">
                                {children}
                            </div>
                        </main>

                        <FloatingChat />
                    </div>
                </div>
            </NotificationProvider>
        </LanguageProvider>
    );
}
