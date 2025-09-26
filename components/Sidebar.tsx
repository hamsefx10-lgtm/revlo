// components/layouts/Sidebar.tsx - Sidebar for Layout (with Collapse/Expand logic)
'use client'; // Muhiim: Tani waa Client Component

import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Briefcase, DollarSign, Warehouse, Users, Truck, LineChart, Settings, X, ChevronLast, ChevronFirst } from 'lucide-react'; // Icons: X (close) and new ChevronLast/First

interface NavItemProps {
  name: string;
  href: string;
  icon: React.ReactNode;
  isCollapsed: boolean; // New prop for collapsed state
  onClick?: () => void; // Optional click handler to close sidebar (for mobile)
}

const NavItem: React.FC<NavItemProps> = ({ name, href, icon, isCollapsed, onClick }) => (
  <li>
    <Link 
      href={href} 
      onClick={onClick} 
      className="flex items-center space-x-3 text-lg py-2 px-3 rounded-lg text-white hover:bg-primary transition-all duration-200 group relative"
    >
      <div className={`text-2xl group-hover:scale-110 transition-transform duration-200 ${isCollapsed ? 'mx-auto' : ''}`}>{icon}</div>
      <span className={`transition-opacity duration-300 ${isCollapsed ? 'opacity-0 absolute left-full ml-4 w-auto bg-darkGray text-white text-sm px-2 py-1 rounded-md whitespace-nowrap invisible group-hover:visible group-hover:opacity-100' : 'opacity-100'}`}>
        {name}
      </span>
    </Link>
  </li>
);

interface SidebarProps {
  setIsSidebarOpen: (isOpen: boolean) => void; // For mobile toggle
  isCollapsed: boolean; // For desktop collapse/expand
}

const Sidebar: React.FC<SidebarProps> = ({ setIsSidebarOpen, isCollapsed }) => {
  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard /> },
    { name: 'Projects', href: '/projects', icon: <Briefcase /> },
    { name: 'Expenses', href: '/expenses', icon: <DollarSign /> },
    { name: 'Inventory', href: '/inventory', icon: <Warehouse /> },
    { name: 'Customers', href: '/customers', icon: <Users /> },
    { name: 'Vendors', href: '/vendors', icon: <Truck /> },
    { name: 'Reports', href: '/reports', icon: <LineChart /> },
  ];

  return (
    <aside className={`h-full bg-darkGray dark:bg-gray-900 text-white p-6 flex flex-col justify-between shadow-xl ${isCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 ease-in-out`}>
      <div>
        {/* Logo and Close Button for Mobile / Collapsed Logo for Desktop */}
        <div className="flex justify-between items-center mb-10">
          {isCollapsed ? (
            <h2 className="text-4xl font-extrabold tracking-wide mx-auto">
              R<span className="text-secondary">.</span>
            </h2>
          ) : (
            <h2 className="text-4xl font-extrabold tracking-wide">
              Revl<span className="text-secondary">o</span>
            </h2>
          )}
          {/* Close button for mobile sidebar */}
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="md:hidden text-white hover:text-primary transition-colors duration-200"
          >
            <X size={28} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <NavItem 
                key={item.name} 
                {...item} 
                isCollapsed={isCollapsed} 
                onClick={() => setIsSidebarOpen(false)} // Close mobile sidebar on click
              />
            ))}
          </ul>
        </nav>
      </div>

      {/* Settings Link at the bottom */}
      <div className="mt-8 pt-4 border-t border-gray-700">
        <NavItem 
          name="Settings" 
          href="/settings" 
          icon={<Settings />} 
          isCollapsed={isCollapsed} 
          onClick={() => setIsSidebarOpen(false)} 
        />
      </div>
    </aside>
  );
};

export default Sidebar;