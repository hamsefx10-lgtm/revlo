'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    Search,
    UserPlus,
    MoreVertical,
    Users,
    Briefcase,
    Clock,
    Shield,
    CalendarDays
} from 'lucide-react';
import StatusBadge from '@/components/shop/ui/StatusBadge';

// --- TYPES ---
interface Employee {
    id: string;
    name: string;
    role: 'Manager' | 'Cashier' | 'Stock Clerk' | 'Security';
    phone: string;
    email: string;
    shift: 'Morning' | 'Afternoon' | 'Night';
    status: 'Active' | 'On Leave' | 'Terminated';
    joinedDate: string;
}

// --- DUMMY DATA ---
const EMPLOYEES_DATA: Employee[] = [
    { id: '1', name: 'Abdi Hassan', role: 'Manager', phone: '+252 61 555 1234', email: 'abdi.hassan@shop.so', shift: 'Morning', status: 'Active', joinedDate: '2023-01-15' },
    { id: '2', name: 'Muna Jibril', role: 'Cashier', phone: '+252 61 222 3344', email: 'muna.jibril@shop.so', shift: 'Morning', status: 'Active', joinedDate: '2023-06-10' },
    { id: '3', name: 'Farah Mohamed', role: 'Stock Clerk', phone: '+252 61 333 4455', email: 'farah.m@shop.so', shift: 'Afternoon', status: 'Active', joinedDate: '2023-09-01' },
    { id: '4', name: 'Amina Ali', role: 'Cashier', phone: '+252 61 777 8899', email: 'amina.ali@shop.so', shift: 'Afternoon', status: 'On Leave', joinedDate: '2023-03-22' },
    { id: '5', name: 'Yusuf Dhere', role: 'Security', phone: '+252 61 999 0011', email: '-', shift: 'Night', status: 'Active', joinedDate: '2022-11-05' },
];

const RoleBadge = ({ role }: { role: Employee['role'] }) => {
    const styles = {
        'Manager': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
        'Cashier': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        'Stock Clerk': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
        'Security': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold ${styles[role]}`}>
            <Briefcase size={12} /> {role}
        </span>
    );
};

export default function EmployeesPage() {
    const [search, setSearch] = useState('');

    const filteredData = EMPLOYEES_DATA.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.role.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-[#3498DB]">
                            <Users size={28} />
                        </div>
                        Employees
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">Manage shop staff, roles and shifts.</p>
                </div>

                <div className="flex gap-3">
                    <Link href="/shop/employees/add" className="px-5 py-2.5 rounded-xl bg-[#3498DB] hover:bg-[#2980B9] text-white font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center gap-2">
                        <UserPlus size={18} /> Add Employee
                    </Link>
                </div>
            </div>

            {/* SEARCH BAR */}
            <div className="mb-6 max-w-md">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by name or role..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB] transition-all font-medium text-sm shadow-sm"
                    />
                </div>
            </div>

            {/* TABLE CARD */}
            <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-800/20 border-b border-gray-100 dark:border-gray-800">
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Shift</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Joined Date</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredData.map((e) => (
                                <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 font-bold border border-gray-200 dark:border-gray-600">
                                                {e.name.charAt(0)}
                                            </div>
                                            <div>
                                                <span className="block font-bold text-gray-900 dark:text-white text-sm">{e.name}</span>
                                                <span className="text-xs text-gray-400">ID: {e.id}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <RoleBadge role={e.role} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 flex flex-col gap-1">
                                        <span>{e.phone}</span>
                                        <span className="text-xs text-gray-400">{e.email}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 w-fit">
                                            <Clock size={14} className="text-gray-400" />
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{e.shift}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                            <CalendarDays size={14} />
                                            {e.joinedDate}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center flex justify-center">
                                        <StatusBadge status={e.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-gray-400 hover:text-[#3498DB] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                                <Shield size={18} />
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                                <MoreVertical size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
