'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Briefcase, DollarSign, Users, Truck,
  Settings, X, UserCircle, LogOut,
  Landmark, UserCogIcon, Shield, Calendar, Menu, Wrench, Factory,
  Package, BarChart3, Scissors, MessageCircle
} from 'lucide-react';

interface NavItemProps {
  name: string;
  href: string;
  icon: React.ReactNode;
  isCollapsed: boolean;
  onClick?: () => void;
  badge?: number;
  isActive?: boolean;
  group?: string;
}

const NavItem: React.FC<NavItemProps> = ({ 
  name, 
  href, 
  icon, 
  isCollapsed, 
  onClick, 
  badge, 
  isActive,
  group 
}) => (
  <li>
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center text-lg py-2 px-3 rounded-md text-white hover:bg-primary/80 transition-all duration-300 group relative
                 ${isCollapsed ? 'justify-center' : 'justify-start'} space-x-3 animate-slide-in
                 ${isActive ? 'bg-primary/60 border-l-4 border-secondary' : ''}`}
    >
      <div className="text-2xl relative">
        {React.cloneElement(icon as React.ReactElement, { 
          className: `text-white group-hover:text-secondary dark:group-hover:text-secondary transition-colors duration-200
                     ${isActive ? 'text-secondary' : ''}` 
        })}
        {badge && badge > 0 && (
          <span className="absolute -top-2 -right-2 bg-redError text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      {/* Tooltip on hover when collapsed */}
      {isCollapsed ? (
        <span className="opacity-0 absolute left-full ml-4 w-auto bg-darkGray text-white text-sm px-3 py-2 rounded-lg shadow-xl whitespace-nowrap invisible group-hover:visible group-hover:opacity-100 z-50 transition-all duration-200">
          {name}
        </span>
      ) : (
        <div className="flex-1">
        <span className="truncate transition-all duration-300">{name}</span>
          {group && (
            <span className="text-xs text-mediumGray/70 block">{group}</span>
          )}
        </div>
      )}
    </Link>
  </li>
);

interface SidebarProps {
  setIsSidebarOpen?: (isOpen: boolean) => void;
  isCollapsed: boolean;
  currentTime: Date;
  currentUser: { name: string; email: string; avatar: string; id: string; role: string; } | null;
  currentCompany: { name: string; };
  handleLogout: () => Promise<void>;
  onNavItemClick?: () => void;
}

// Enhanced menu configuration with grouping
const menuConfig = {
  ADMIN: {
    main: [
      { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard />, group: 'Main' },
    ],
    business: [
      { name: 'Projects', href: '/projects', icon: <Briefcase />, group: 'Business' },
      { name: 'Manufacturing', href: '/manufacturing', icon: <Factory />, group: 'Business' },
      { name: 'Purchases', href: '/manufacturing/material-purchases', icon: <Package />, group: 'Business' },
      { name: 'Vendors', href: '/vendors', icon: <Users />, group: 'Business' },
      { name: 'Customers', href: '/customers', icon: <Users />, group: 'Business' },
      { name: 'Employees', href: '/employees', icon: <UserCogIcon />, group: 'Business' },
      { name: 'Company Chat', href: '/chat', icon: <MessageCircle />, group: 'Business' },
    ],
    financial: [
      { name: 'Expenses', href: '/expenses', icon: <DollarSign />, group: 'Financial', badge: 3 },
      { name: 'Accounting', href: '/accounting', icon: <Landmark />, group: 'Financial' },
      { name: 'Inventory', href: '/inventory', icon: <Package />, group: 'Financial' },
      { name: 'Vendors', href: '/vendors', icon: <Truck />, group: 'Financial' },
    ],
    reports: [
      { name: 'Reports', href: '/reports', icon: <BarChart3 />, group: 'Reports' },
      { name: 'Manufacturing Reports', href: '/manufacturing/reports', icon: <Factory />, group: 'Reports' },
    ],
    admin: [
      { name: 'Users', href: '/settings/users', icon: <Shield />, group: 'Administration' },
      { name: 'Fiscal Years', href: '/admin/fiscal-years', icon: <Calendar />, group: 'Administration' },
      { name: 'Admin', href: '/admin', icon: <Wrench />, group: 'Administration' },
    ]
  },
  MANAGER: {
    main: [
      { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard />, group: 'Main' },
    ],
    business: [
      { name: 'Projects', href: '/projects', icon: <Briefcase />, group: 'Business' },
      { name: 'Manufacturing', href: '/manufacturing', icon: <Factory />, group: 'Business' },
      { name: 'Purchases', href: '/manufacturing/material-purchases', icon: <Package />, group: 'Business' },
      { name: 'Vendors', href: '/vendors', icon: <Users />, group: 'Business' },
      { name: 'Customers', href: '/customers', icon: <Users />, group: 'Business' },
      { name: 'Employees', href: '/employees', icon: <UserCogIcon />, group: 'Business' },
      { name: 'Company Chat', href: '/chat', icon: <MessageCircle />, group: 'Business' },
    ],
    financial: [
      { name: 'Expenses', href: '/expenses', icon: <DollarSign />, group: 'Financial' },
      { name: 'Accounting', href: '/accounting', icon: <Landmark />, group: 'Financial' },
      { name: 'Inventory', href: '/inventory', icon: <Package />, group: 'Financial' },
      { name: 'Vendors', href: '/vendors', icon: <Truck />, group: 'Financial' },
    ],
    reports: [
      { name: 'Reports', href: '/reports', icon: <BarChart3 />, group: 'Reports' },
      { name: 'Manufacturing Reports', href: '/manufacturing/reports', icon: <Factory />, group: 'Reports' },
    ],
    admin: [
      { name: 'Fiscal Years', href: '/admin/fiscal-years', icon: <Calendar />, group: 'Administration' },
      { name: 'Admin', href: '/admin', icon: <Wrench />, group: 'Administration' },
    ]
  },
  MEMBER: {
    main: [
      { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard />, group: 'Main' },
    ],
    business: [
      { name: 'Projects', href: '/projects', icon: <Briefcase />, group: 'Business' },
      { name: 'Manufacturing', href: '/manufacturing', icon: <Factory />, group: 'Business' },
      { name: 'Purchases', href: '/manufacturing/material-purchases', icon: <Package />, group: 'Business' },
      { name: 'Vendors', href: '/vendors', icon: <Users />, group: 'Business' },
      { name: 'Company Chat', href: '/chat', icon: <MessageCircle />, group: 'Business' },
    ],
    financial: [
      { name: 'Expenses', href: '/expenses', icon: <DollarSign />, group: 'Financial' },
      { name: 'Inventory', href: '/inventory', icon: <Package />, group: 'Financial' },
    ]
  },
  VIEWER: {
    main: [
      { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard />, group: 'Main' },
    ],
    business: [
      { name: 'Projects', href: '/projects', icon: <Briefcase />, group: 'Business' },
      { name: 'Company Chat', href: '/chat', icon: <MessageCircle />, group: 'Business' },
    ]
  }
};


const Sidebar: React.FC<SidebarProps> = ({
  setIsSidebarOpen,
  isCollapsed,
  currentTime,
  currentUser,
  currentCompany,
  handleLogout,
  onNavItemClick,
}) => {
  const [collapsed, setCollapsed] = useState(isCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Detect mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto close sidebar on mobile nav click
  const handleNavClick = () => {
    if (isMobile) setMobileOpen(false);
    if (onNavItemClick) onNavItemClick();
  };

  useEffect(() => {
    setCollapsed(isCollapsed);
  }, [isCollapsed]);

  const role = currentUser?.role?.toUpperCase() as keyof typeof menuConfig;
  const menuStructure = menuConfig[role] || menuConfig['VIEWER'];


  const bottomItems = [
    { name: 'Settings', href: '/settings', icon: <Settings /> },
    { name: 'Log Out', href: '#', icon: <LogOut />, onClick: handleLogout },
  ];


  // Render menu section
  const renderMenuSection = (sectionName: string, items: any[]) => (
    <div key={sectionName} className="mb-6">
      {!collapsed && (
        <h3 className="text-xs font-semibold text-mediumGray/70 uppercase tracking-wider mb-2 px-3">
          {sectionName}
        </h3>
      )}
      <ul className="space-y-1">
        {items.map((item) => (
          <NavItem
            key={item.name}
            {...item}
            isCollapsed={collapsed}
            onClick={handleNavClick}
          />
        ))}
      </ul>
    </div>
  );

  // Mobile sidebar overlay
  if (isMobile) {
    return (
      <>
        {/* Hamburger menu (logo hidden when sidebar closed) */}
        {!mobileOpen && (
          <button
            className="fixed top-4 left-4 z-50 p-2 rounded-md bg-darkGray text-white shadow-lg md:hidden flex items-center"
            onClick={() => setMobileOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={28} />
          </button>
        )}
        {/* Sidebar Drawer */}
        <div
          className={`fixed inset-0 z-40 transition-all duration-300 ${mobileOpen ? 'visible' : 'invisible pointer-events-none'}`}
        >
          {/* Overlay */}
          <div
            className={`absolute inset-0 bg-black bg-opacity-40 transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setMobileOpen(false)}
          />
          {/* Sidebar */}
          <aside
            className={`
              h-full bg-darkGray dark:bg-gray-900 text-white flex flex-col shadow-xl
              w-60 transition-transform duration-300 ease-in-out
              rounded-tr-[0.2rem] rounded-br-[0.2rem]
              fixed top-0 left-0 z-50 border-r border-gray-800
              ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
              bg-[linear-gradient(135deg,_#233047_80%,_#1e293b_100%)]
              min-w-[240px] max-w-[240px]
            `}
          >
            {/* Top: Logo, Close Button */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
              <span className="text-3xl font-extrabold tracking-wide select-none">
                Revl<span className="text-secondary">o</span>.
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-full hover:bg-primary/20 transition-colors"
                aria-label="Close sidebar"
              >
                <X size={24} />
              </button>
            </div>

            {/* User Profile & Company Info */}
            {currentUser && (
              <Link href={`/profile/${currentUser.id}`} className="group flex items-center p-3 rounded-md text-white hover:bg-primary/80 transition-all duration-300 mb-4">
                <div className="rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg w-12 h-12 text-2xl border-2 border-primary/50 shadow-md flex-shrink-0">
                  {currentUser.avatar}
                </div>
                <div className="text-left flex-1 animate-fade-in ml-3">
                  <h3 className="text-base font-bold text-white leading-tight">{currentUser.name}</h3>
                  <p className="text-xs text-mediumGray dark:text-gray-400 leading-tight">{currentCompany.name}</p>
                  <p className="text-xs text-mediumGray dark:text-gray-400 leading-tight">Role: {currentUser.role}</p>
                </div>
              </Link>
            )}

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-1 custom-scrollbar">
              <div className="space-y-4 pb-8">
                {Object.entries(menuStructure).map(([sectionName, items]) => 
                  renderMenuSection(sectionName, items)
                )}
              </div>
            </nav>
            {/* Bottom: Settings, Logout */}
            <div className="px-2 pb-4 border-t border-gray-700 bg-darkGray/90 dark:bg-gray-900/90">
              <ul className="space-y-1">
                {bottomItems.map((item) =>
                  item.name === 'Log Out' ? (
                    <li key={item.name}>
                      <button
                        onClick={item.onClick}
                        className="w-full flex items-center text-lg py-2 px-3 rounded-md text-redError hover:bg-redError/10 transition-colors duration-300 group relative justify-start space-x-3 animate-slide-in"
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <span className="truncate transition-all duration-300">{item.name}</span>
                      </button>
                    </li>
                  ) : (
                    <NavItem
                      key={item.name}
                      {...item}
                      isCollapsed={false}
                      onClick={handleNavClick}
                    />
                  )
                )}
              </ul>
            </div>
          </aside>
        </div>
      </>
    );
  }

  // Desktop version
  return (
    <aside
      className={`
        h-full bg-darkGray dark:bg-gray-900 text-white flex flex-col shadow-xl
        ${collapsed ? 'w-16 min-w-[64px] max-w-[64px]' : 'w-60 min-w-[240px] max-w-[240px]'}
        transition-all duration-300 ease-in-out
        rounded-tr-[0.2rem] rounded-br-[0.2rem]
        fixed md:static top-0 left-0 z-40
        border-r border-gray-800
        bg-[linear-gradient(135deg,_#233047_80%,_#1e293b_100%)]
      `}
    >
      {/* Top: Logo only */}
      <div className="flex items-center justify-center px-4 py-4 border-b border-gray-700">
        <span className="text-3xl font-extrabold tracking-wide select-none">
          {collapsed ? <>R<span className="text-secondary">.</span></> : <>Revl<span className="text-secondary">o</span>.</>}
        </span>
      </div>


      {/* User Profile & Company Info */}
      {!collapsed && currentUser && (
        <Link href={`/profile/${currentUser.id}`} className="group flex items-center p-3 rounded-md text-white hover:bg-primary/80 transition-all duration-300 mb-4">
          <div className="rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg w-12 h-12 text-2xl border-2 border-primary/50 shadow-md flex-shrink-0">
            {currentUser.avatar}
          </div>
          <div className="text-left flex-1 animate-fade-in ml-3">
            <h3 className="text-base font-bold text-white leading-tight">{currentUser.name}</h3>
            <p className="text-xs text-mediumGray dark:text-gray-400 leading-tight">{currentCompany.name}</p>
            <p className="text-xs text-mediumGray dark:text-gray-400 leading-tight">Role: {currentUser.role}</p>
          </div>
        </Link>
      )}


      {/* Navigation (scrollable) */}
      <nav className="flex-1 overflow-y-auto px-1 sidebar-scrollbar">
        <div className="space-y-4 pb-8">
          {Object.entries(menuStructure).map(([sectionName, items]) => 
            renderMenuSection(sectionName, items)
          )}
        </div>
      </nav>

      {/* Bottom: Settings, Logout */}
      {!collapsed && (
        <div className="px-2 pb-4 border-t border-gray-700 bg-darkGray/90 dark:bg-gray-900/90">
          <ul className="space-y-1">
            {bottomItems.map((item) =>
              item.name === 'Log Out' ? (
                <li key={item.name}>
                  <button
                    onClick={item.onClick}
                    className="w-full flex items-center text-lg py-2 px-3 rounded-md text-redError hover:bg-redError/10 transition-colors duration-300 group relative justify-start space-x-3 animate-slide-in"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="truncate transition-all duration-300">{item.name}</span>
                  </button>
                </li>
              ) : (
                <NavItem
                  key={item.name}
                  {...item}
                  isCollapsed={collapsed}
                  onClick={onNavItemClick}
                />
              )
            )}
          </ul>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;