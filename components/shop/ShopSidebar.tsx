'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    History,
    Users,
    Settings,
    Truck,
    CreditCard,
    FileBarChart,
    LogOut,
    Menu,
    X,
    Briefcase,
    FileText
} from 'lucide-react';

interface SidebarItemProps {
    icon: any;
    label: string;
    href: string;
    active: boolean;
    collapsed: boolean;
    onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, href, active, collapsed, onClick }: SidebarItemProps) => {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`
                flex items-center p-3.5 my-1.5 rounded-xl transition-all duration-300 group relative overflow-hidden
                ${active
                    ? 'bg-[#3498DB] text-white shadow-lg shadow-blue-500/25 ring-1 ring-white/10'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }
                ${collapsed ? 'justify-center' : ''}
            `}
        >
            {/* Active Indicator Glow */}
            {active && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-50" />
            )}

            <Icon
                size={22}
                strokeWidth={active ? 2.5 : 2}
                className={`
                    flex-shrink-0 z-10 transition-transform duration-300 group-hover:scale-110 
                    ${collapsed ? '' : 'mr-3.5'}
                `}
            />

            {!collapsed && (
                <span className={`font-bold text-sm tracking-wide z-10 whitespace-nowrap overflow-hidden transition-all duration-300`}>
                    {label}
                </span>
            )}

            {/* Tooltip for collapsed mode */}
            {collapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-[#1e293b] text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 whitespace-nowrap shadow-xl border border-white/10 translate-x-1 group-hover:translate-x-0">
                    {label}
                </div>
            )}
        </Link>
    );
};

export default function ShopSidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            // Auto collapse on small screens if not explicitly mobile view (tablet)
            if (!mobile && window.innerWidth < 1280) {
                setCollapsed(true);
            } else if (!mobile && window.innerWidth >= 1280) {
                setCollapsed(false);
            }

            if (!mobile) {
                setMobileOpen(false);
            }
        };
        handleResize(); // Init
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/shop/dashboard' },
        { icon: ShoppingCart, label: 'Point of Sale', href: '/shop/pos' },
        { icon: FileText, label: 'Manual Entry', href: '/shop/manual-entry' },
        { icon: Package, label: 'Inventory', href: '/shop/inventory' },
        { icon: History, label: 'Sales History', href: '/shop/sales' },
        { icon: Truck, label: 'Purchases', href: '/shop/purchases' },
        { icon: CreditCard, label: 'Accounting', href: '/shop/accounting' },
        { icon: Users, label: 'Customers', href: '/shop/customers' },
        { icon: Truck, label: 'Vendors', href: '/shop/vendors' }, // Reused Truck icon, distinct label
        { icon: Briefcase, label: 'Employees', href: '/shop/employees' },
        { icon: FileBarChart, label: 'Reports', href: '/shop/reports' },
        { icon: Settings, label: 'Settings', href: '/shop/settings' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isMobile && mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile Toggle Button */}
            {isMobile && (
                <button
                    onClick={() => setMobileOpen(true)}
                    className="fixed top-4 left-4 z-30 p-2.5 bg-white dark:bg-[#1f2937] border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg text-gray-600 dark:text-gray-300 pointer-events-auto lg:hidden"
                >
                    <Menu size={24} />
                </button>
            )}

            {/* Sidebar Container */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-50
                    bg-white/80 dark:bg-[#0f172a]/95 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-800/50
                    transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none
                    ${mobileOpen ? 'translate-x-0' : (isMobile ? '-translate-x-full' : 'translate-x-0')}
                    ${collapsed ? 'w-24' : 'w-72'}
                    flex flex-col h-screen
                `}
            >
                {/* Logo Area */}
                <div className="h-24 flex items-center justify-between px-6 border-b border-gray-100 dark:border-gray-800/60">
                    {!collapsed && (
                        <div className="flex flex-col">
                            <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                                REVLO<span className="text-[#3498DB]">VR</span>
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">Shop Manager</span>
                        </div>
                    )}
                    {collapsed && (
                        <div className="w-full flex justify-center">
                            <span className="text-xl font-black text-[#3498DB]">RV</span>
                        </div>
                    )}

                    {/* Desktop Collapse Toggle */}
                    {!isMobile && (
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            {collapsed ? <Menu size={20} /> : <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded"><X size={16} /></div>}
                        </button>
                    )}

                    {/* Mobile Close Button */}
                    {isMobile && (
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="p-2 text-gray-400 hover:text-red-500"
                        >
                            <X size={24} />
                        </button>
                    )}
                </div>

                {/* Navigation Items */}
                <div className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar space-y-1">
                    {menuItems.map((item) => (
                        <SidebarItem
                            key={item.href}
                            icon={item.icon}
                            label={item.label}
                            href={item.href}
                            active={pathname === item.href}
                            collapsed={collapsed}
                            onClick={() => isMobile && setMobileOpen(false)}
                        />
                    ))}
                </div>

                {/* Footer / User Profile Summary */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-[#0b1120]/50">
                    <button className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-3 p-2 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700 group`}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#F39C12] to-[#E67E22] flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/20">
                            MK
                        </div>
                        {!collapsed && (
                            <div className="text-left overflow-hidden">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">Mohamed Kamil</p>
                                <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Online
                                </p>
                            </div>
                        )}
                    </button>
                </div>
            </aside>
        </>
    );
}
