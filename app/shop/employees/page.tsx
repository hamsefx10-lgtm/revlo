'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Search,
    UserPlus,
    MoreVertical,
    Users,
    Briefcase,
    Clock,
    Shield,
    CalendarDays,
    Loader2
} from 'lucide-react';
import StatusBadge from '@/components/shop/ui/StatusBadge';
import { format } from 'date-fns';

// --- TYPES ---
interface Employee {
    id: string;
    fullName: string;
    role: string;
    phone: string;
    email: string;
    isActive: boolean;
    createdAt: string;
    monthlySalary: number;
}

const RoleBadge = ({ role }: { role: string }) => {
    // Simple hashing for color
    const colors = [
        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    ];
    const index = role.length % colors.length;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold ${colors[index]}`}>
            <Briefcase size={12} /> {role}
        </span>
    );
};

export default function EmployeesPage() {
    const [search, setSearch] = useState('');
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEmployees();
    }, [search]); // Re-fetch on search or filter locally? Search param is used in API, so re-fetch is good.
    // Debounce search ideally, but for now direct effect is fine if traffic low.

    // Better: Filter locally if list is small, or debounced API.
    // Given the API supports search, let's use API but maybe with delay. 
    // For simplicity, let's fetch all and filter locally for responsiveness, or API.
    // If I use API dependency, typing causes many requests.
    // I'll fetch ALL once, then filter locally.

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/shop/employees'); // Fetch all
            const data = await response.json();
            setEmployees(data.employees || []);
        } catch (error) {
            console.error('Error loading employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = employees.filter(e =>
        e.fullName.toLowerCase().includes(search.toLowerCase()) ||
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
            <div className="bg-white dark:bg-gray-900 border border-lightGray dark:border-gray-800 rounded-[2rem] shadow-sm overflow-hidden min-h-[300px] relative animate-fade-in-up">

                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-lightGray dark:border-gray-800">
                                <th className="pl-8 py-5 text-left text-[10px] font-black text-mediumGray uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-mediumGray uppercase tracking-wider">Role</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-mediumGray uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-5 text-center text-[10px] font-black text-mediumGray uppercase tracking-wider">Status</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-mediumGray uppercase tracking-wider">Joined Date</th>
                                <th className="px-6 py-5 text-right text-[10px] font-black text-mediumGray uppercase tracking-wider pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-lightGray dark:divide-gray-800">
                            {filteredData.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-mediumGray font-medium">
                                        No employees found. <Link href="/shop/employees/add" className="text-primary hover:underline font-bold">Add one?</Link>
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((e) => (
                                    <tr key={e.id} className="hover:bg-primary/5 dark:hover:bg-gray-800/50 transition-colors group cursor-pointer" onClick={() => window.location.href = `/shop/employees/${e.id}`}>
                                        <td className="pl-8 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center text-mediumGray font-black text-lg border border-lightGray dark:border-gray-600 uppercase shadow-inner group-hover:from-primary/20 group-hover:to-blue-600/20 group-hover:text-primary group-hover:border-primary/20 transition-all">
                                                    {e.fullName.charAt(0)}
                                                </div>
                                                <div>
                                                    <span className="block font-bold text-darkGray dark:text-white text-sm group-hover:text-primary transition-colors">{e.fullName}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <RoleBadge role={e.role} />
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-bold text-darkGray dark:text-gray-200">{e.phone || '-'}</span>
                                                <span className="text-xs font-medium text-mediumGray">{e.email || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-center">
                                            <div className="flex justify-center">
                                                <StatusBadge status={e.isActive ? 'Active' : 'Inactive'} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm font-medium text-mediumGray">
                                                <CalendarDays size={16} className="text-primary/60" />
                                                {format(new Date(e.createdAt), 'MMM dd, yyyy')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right pr-8">
                                            <div className="flex items-center justify-end" onClick={(ev) => ev.stopPropagation()}>
                                                <Link href={`/shop/employees/${e.id}`} className="p-2.5 text-mediumGray hover:text-primary hover:bg-primary/10 rounded-xl transition-all active:scale-95">
                                                    <MoreVertical size={20} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
