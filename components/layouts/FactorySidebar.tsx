'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Factory,
    ClipboardList,
    Package,
    LayoutGrid,
    Settings,
    LogOut,
    BarChart3,
    ShoppingCart,
    Tag,
    DollarSign,
    Users,
    CreditCard,
    Briefcase,
    Zap
} from 'lucide-react';

interface FactorySidebarProps {
    isCollapsed: boolean;
    currentUser: any;
    handleLogout: () => void;
    setIsSidebarOpen?: (isOpen: boolean) => void;
}

const FactorySidebar: React.FC<FactorySidebarProps> = ({
    isCollapsed,
    currentUser,
    handleLogout,
    setIsSidebarOpen
}) => {
    const pathname = usePathname();

    // Auto close mobile sidebar on nav click
    const handleNavClick = () => {
        if (setIsSidebarOpen) setIsSidebarOpen(false);
    };

    const menuItems = [
        { name: 'Factory OS', href: '/manufacturing', icon: <Factory />, group: 'Main' },

        { name: 'Production', href: '/manufacturing/production-orders', icon: <ClipboardList />, group: 'Operations' },
        { name: 'Inventory', href: '/manufacturing/inventory', icon: <Package />, group: 'Operations' },
        { name: 'Recipes (BOM)', href: '/manufacturing/bom', icon: <LayoutGrid />, group: 'Operations' },

        { name: 'Purchases', href: '/manufacturing/material-purchases', icon: <ShoppingCart />, group: 'Business' },
        { name: 'Sales Orders', href: '/manufacturing/sales', icon: <Briefcase />, group: 'Business' },
        { name: 'Customers', href: '/manufacturing/customers', icon: <Users />, group: 'Business' },

        { name: 'Accounting', href: '/manufacturing/accounting', icon: <DollarSign />, group: 'Finance' },
        { name: 'Expenses', href: '/manufacturing/expenses', icon: <CreditCard />, group: 'Finance' },

        { name: 'Employees', href: '/manufacturing/employees', icon: <Users />, group: 'HR & People' },

        { name: 'Products', href: '/manufacturing/products', icon: <Tag />, group: 'Catalog' },
        { name: 'Reports', href: '/manufacturing/reports', icon: <BarChart3 />, group: 'Analytics' },

        { name: 'Settings', href: '/settings', icon: <Settings />, group: 'System' },
    ];

    const groupedItems = menuItems.reduce((acc: any, item) => {
        if (!acc[item.group]) acc[item.group] = [];
        acc[item.group].push(item);
        return acc;
    }, {});

    const SidebarContent = () => (
        <div className={`
        flex flex-col h-full 
        bg-white dark:bg-[#0f172a] 
        border-r border-gray-200 dark:border-gray-800
        bg-gradient-to-b from-white to-gray-50 dark:from-[#0f172a] dark:to-[#0b1120]
    `}>
            {/* Branding */}
            <div className={`h-[70px] flex items-center ${isCollapsed ? 'justify-center' : 'px-6'} border-b border-gray-100 dark:border-gray-800`}>
                {isCollapsed ? (
                    <div className="w-10 h-10 bg-[#3498DB] rounded-xl flex items-center justify-center text-white font-bold shadow-[#3498DB]/30 shadow-lg">
                        F<span className="text-blue-200">OS</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-[#3498DB] rounded-xl shadow-lg shadow-[#3498DB]/20 text-white">
                            <Zap size={18} fill="currentColor" />
                        </div>
                        <div>
                            <h1 className="font-black text-lg leading-none text-gray-900 dark:text-white">Factory OS</h1>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Enterprise</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-6 custom-scrollbar">
                {Object.entries(groupedItems).map(([group, items]: [string, any]) => (
                    <div key={group}>
                        {!isCollapsed && (
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">
                                {group}
                            </h3>
                        )}
                        <ul className="space-y-1">
                            {items.map((item: any) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            onClick={handleNavClick}
                                            className={`
                         flex items-center px-3 py-2.5 rounded-[14px] transition-all duration-300 group relative overflow-hidden
                         ${isActive
                                                    ? 'bg-[#3498DB]/10 text-[#3498DB] dark:text-[#3498DB] font-bold ring-1 ring-[#3498DB]/20 shadow-sm transition-all'
                                                    : 'hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white text-gray-500 dark:text-gray-400 font-medium'}
                         ${isCollapsed ? 'justify-center' : ''}
                       `}
                                        >
                                            <span className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-[#3498DB]' : 'text-gray-400 group-hover:text-green-500 dark:group-hover:text-green-400'}`}>
                                                {item.icon}
                                            </span>
                                            {!isCollapsed && (
                                                <span className="ml-3 text-sm tracking-wide">{item.name}</span>
                                            )}

                                            {/* Tooltip for collapsed state */}
                                            {isCollapsed && (
                                                <div className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border border-gray-800">
                                                    {item.name}
                                                </div>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* User Profile / Logout */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0b1120]/50">
                <button
                    onClick={handleLogout}
                    className={`flex items-center gap-3 w-full p-2.5 rounded-xl text-gray-600 hover:text-red-500 hover:bg-red-50 dark:text-gray-400 dark:hover:bg-red-900/10 dark:hover:text-red-400 transition-all ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <LogOut size={20} />
                    {!isCollapsed && <span className="font-bold text-sm">Log Out</span>}
                </button>
            </div>
        </div>
    );

    return <SidebarContent />;
};

export default FactorySidebar;
