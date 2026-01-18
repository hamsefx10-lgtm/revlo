'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../components/layouts/Layout';
import {
    Hammer, ClipboardCheck, PackageCheck, Plus, Search,
    ArrowRight, Clock, DollarSign, Calendar, MoreVertical
} from 'lucide-react';

export default function WorkshopPage() {
    const [activeTab, setActiveTab] = useState<'active' | 'stock'>('active');
    const [isLoading, setIsLoading] = useState(true);

    // Mock Data for UI Dev
    const [jobs, setJobs] = useState<any[]>([
        { id: '1', name: 'Ganjeelo 4x4m', customer: 'Ahmed Ali', status: 'IN_PROGRESS', startDate: '2024-01-14', totalCost: 15000, progress: 60 },
        { id: '2', name: 'Daaqad Aluminium', customer: 'Hotel Subeer', status: 'PENDING', startDate: '2024-01-15', totalCost: 5000, progress: 10 },
        { id: '3', name: 'Albaabka Guriga', customer: 'Walk-in', status: 'COMPLETED', startDate: '2024-01-10', totalCost: 8000, progress: 100 },
    ]);

    useEffect(() => {
        // Simulate fetch
        setTimeout(() => setIsLoading(false), 1000);
    }, []);

    const activeJobs = jobs.filter(j => j.status !== 'COMPLETED' && j.status !== 'SOLD');
    const stockJobs = jobs.filter(j => j.status === 'COMPLETED');

    return (
        <Layout>
            <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in pb-20">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4 px-4 md:px-0">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                            <span className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg">
                                <Hammer size={24} />
                            </span>
                            Workshop
                        </h1>
                        <p className="text-gray-500 font-medium text-sm mt-1 ml-14">Manage production, track costs, & stock items.</p>
                    </div>
                    <Link href="/workshop/new" className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:translate-y-[-2px] transition-all">
                        <Plus size={20} strokeWidth={3} /> New Job
                    </Link>
                </div>

                {/* STATS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 md:px-0">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 dark:bg-orange-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="relative">
                            <div className="flex items-center gap-3 text-orange-600 mb-2">
                                <Clock size={20} /> <span className="text-xs font-bold uppercase tracking-widest">In Progress</span>
                            </div>
                            <div className="text-4xl font-black text-gray-900 dark:text-white mb-1">{activeJobs.length}</div>
                            <p className="text-sm text-gray-400">Active jobs in workshop</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 dark:bg-green-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="relative">
                            <div className="flex items-center gap-3 text-green-600 mb-2">
                                <PackageCheck size={20} /> <span className="text-xs font-bold uppercase tracking-widest">Ready / Stock</span>
                            </div>
                            <div className="text-4xl font-black text-gray-900 dark:text-white mb-1">{stockJobs.length}</div>
                            <p className="text-sm text-gray-400">Completed items ready for sale</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="relative">
                            <div className="flex items-center gap-3 text-blue-600 mb-2">
                                <DollarSign size={20} /> <span className="text-xs font-bold uppercase tracking-widest">Value in Production</span>
                            </div>
                            <div className="text-4xl font-black text-gray-900 dark:text-white mb-1">
                                {(activeJobs.reduce((s, j) => s + j.totalCost, 0)).toLocaleString()}
                            </div>
                            <p className="text-sm text-gray-400">Total accumulated cost</p>
                        </div>
                    </div>
                </div>

                {/* CONTENT TABS */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[500px] flex flex-col mx-4 md:mx-0">
                    <div className="flex items-center border-b border-gray-100 dark:border-gray-700 px-6 pt-6 gap-8">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`pb-4 text-sm font-bold uppercase tracking-wide border-b-2 transition-all ${activeTab === 'active' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            Active Jobs
                        </button>
                        <button
                            onClick={() => setActiveTab('stock')}
                            className={`pb-4 text-sm font-bold uppercase tracking-wide border-b-2 transition-all ${activeTab === 'stock' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            In Stock (Ready)
                        </button>
                    </div>

                    <div className="p-6">
                        {isLoading ? (
                            <div className="flex items-center justify-center p-20 text-gray-300">Loading...</div>
                        ) : activeTab === 'active' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {activeJobs.map(job => (
                                    <Link href={`/workshop/${job.id}`} key={job.id} className="group bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 hover:border-orange-300 hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-2.5 bg-white dark:bg-gray-800 rounded-xl text-orange-600 shadow-sm group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                                <Hammer size={20} />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md">
                                                {job.status}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-orange-600 transition-colors">{job.name}</h3>
                                        <p className="text-xs text-gray-500 mb-4 flex items-center gap-1"><Calendar size={12} /> Started: {job.startDate}</p>

                                        <div className="space-y-3">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span className="text-gray-400">Client</span>
                                                <span className="text-gray-700 dark:text-gray-300">{job.customer}</span>
                                            </div>
                                            <div className="flex justify-between text-xs font-medium">
                                                <span className="text-gray-400">Current Cost</span>
                                                <span className="text-gray-900 dark:text-white font-mono">{job.totalCost.toLocaleString()}</span>
                                            </div>

                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                                                <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${job.progress}%` }}></div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                                <Link href="/workshop/new" className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-5 text-gray-400 hover:text-orange-600 hover:border-orange-300 hover:bg-orange-50/50 transition-all cursor-pointer h-full min-h-[220px]">
                                    <Plus size={32} />
                                    <span className="font-bold text-sm uppercase">Create New Job</span>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {stockJobs.map(job => (
                                    <div key={job.id} className="group bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                                        <div className="flex justify-between items-start mb-4 pl-3">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-green-600 transition-colors">{job.name}</h3>
                                            <div className="p-2 bg-green-50 text-green-600 rounded-full">
                                                <PackageCheck size={18} />
                                            </div>
                                        </div>
                                        <div className="pl-3 mb-6">
                                            <p className="text-xs text-gray-500 mb-1">Total Production Cost</p>
                                            <p className="text-2xl font-black text-gray-900 dark:text-white">{job.totalCost.toLocaleString()}</p>
                                        </div>
                                        <div className="pl-3">
                                            <button className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all">
                                                <DollarSign size={16} /> Sell Item
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </Layout>
    );
}
