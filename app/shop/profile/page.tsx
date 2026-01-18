'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { User, Mail, Building, Briefcase, Crown, LogOut, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    if (!session) {
        return <div>Access Denied</div>;
    }

    const user = session.user as any;

    if (!user) {
        return <div>User not found</div>;
    }

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-4xl mx-auto md:p-8">
            {/* HEADER */}
            <div className="mb-8 px-4 md:px-0">
                <Link href="/shop/dashboard" className="inline-flex items-center gap-2 text-mediumGray hover:text-primary transition-colors text-xs font-bold uppercase tracking-wider mb-4">
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>
                <h1 className="text-3xl font-black text-darkGray dark:text-white mb-2">My Profile</h1>
                <p className="text-mediumGray font-medium">Manage your account settings and preferences.</p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-lightGray dark:border-gray-800 shadow-xl overflow-hidden px-4 md:px-0">
                {/* Profile Header */}
                <div className="h-48 bg-gradient-to-r from-primary to-blue-600 relative">
                    <div className="absolute top-0 right-0 p-12 bg-white/10 rounded-bl-[150px]"></div>
                </div>

                <div className="px-8 pb-12 relative">
                    {/* Avatar */}
                    <div className="relative -mt-20 mb-6 inline-block">
                        <div className="w-40 h-40 rounded-full border-8 border-white dark:border-gray-900 bg-gradient-to-br from-[#F39C12] to-[#E67E22] flex items-center justify-center text-white text-5xl font-black shadow-2xl">
                            {user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                        {/* Info */}
                        <div className="flex-1">
                            <h2 className="text-4xl font-black text-darkGray dark:text-white mb-2">{user.name}</h2>
                            <div className="flex flex-wrap gap-4 mb-8">
                                <span className="flex items-center gap-2 text-sm font-bold text-mediumGray bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                                    <Mail size={16} /> {user.email}
                                </span>
                                <span className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-800">
                                    <Crown size={16} /> {user.role}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                                    <p className="text-xs font-black text-mediumGray uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Building size={16} /> Company Details
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-500">Company Name</span>
                                            <span className="text-sm font-bold text-darkGray dark:text-white">{user.companyName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-500">Plan Type</span>
                                            <span className="text-sm font-bold text-emerald-500 flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                {user.planType} Plan
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                                    <p className="text-xs font-black text-mediumGray uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Briefcase size={16} /> Account Stats
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-500">User ID</span>
                                            <span className="text-sm font-mono text-darkGray dark:text-white">{user.id.slice(0, 8)}...</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-500">Status</span>
                                            <span className="text-sm font-bold text-green-600">Active</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3 w-full md:w-auto">
                            <button
                                onClick={() => signOut()}
                                className="px-8 py-4 bg-red-50 dark:bg-red-900/10 text-red-600 font-bold rounded-2xl border border-red-100 dark:border-red-900 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all flex items-center justify-center gap-2 w-full md:w-auto"
                            >
                                <LogOut size={20} /> Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
