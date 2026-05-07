'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Activity, Clock, User, Shield, Loader2, Database, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    details: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
    user: {
        fullName: string;
        email: string;
        role: string;
    };
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/shop/audit-logs');
            const data = await res.json();
            if (data.logs) {
                setLogs(data.logs);
            }
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => 
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.entity.toLowerCase().includes(search.toLowerCase()) ||
        log.user.fullName.toLowerCase().includes(search.toLowerCase())
    );

    const getActionColor = (action: string) => {
        const lower = action.toLowerCase();
        if (lower.includes('create') || lower.includes('add')) return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400';
        if (lower.includes('delete') || lower.includes('remove')) return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400';
        if (lower.includes('update') || lower.includes('edit')) return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400';
        if (lower.includes('login')) return 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400';
        return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300';
    };

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-[#0B1120] pb-20 font-sans">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800/60 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/shop/settings" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                        <ArrowLeft size={20} className="text-gray-500" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <Activity className="text-[#3498DB]" size={24} />
                            Diiwaanka Dhaqdhaqaaqa (Audit Logs)
                        </h1>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">La soco dhaqdhaqaaqa shaqaalaha iyo isbedelada nidaamka</p>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-6 mt-4">
                
                {/* Search Bar */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Raadi ficil, magac, ama qayb..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-[#151f32] border border-gray-200 dark:border-gray-800/60 outline-none font-medium text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB] transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* Logs Table Card */}
                <div className="bg-white dark:bg-[#151f32] border border-gray-100 dark:border-gray-800/60 rounded-[2rem] shadow-sm overflow-hidden relative min-h-[400px]">
                    {loading ? (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-[#151f32]/50 backdrop-blur-sm">
                            <Loader2 className="w-8 h-8 animate-spin text-[#3498DB]" />
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
                            <Database size={48} className="mb-4 opacity-20" />
                            <p className="font-bold text-lg">Wax diiwaan ah lama helin</p>
                            <p className="text-sm">Ma jiraan dhaqdhaqaaqyo la sameeyay wali.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-800/20">
                                        <th className="pl-8 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Ficilka (Action)</th>
                                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Qaybta (Entity)</th>
                                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Isticmaalaha (User)</th>
                                        <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">IP / Qalabka</th>
                                        <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider pr-8">Waqtiga</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                                    {filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                                            <td className="pl-8 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border w-fit ${getActionColor(log.action)}`}>
                                                        {log.action}
                                                    </span>
                                                    {log.details && (
                                                        <span className="text-xs text-gray-500 mt-1.5 max-w-[200px] truncate" title={log.details}>
                                                            {log.details}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Database size={14} className="text-gray-400" />
                                                    <span className="font-bold text-sm text-gray-900 dark:text-gray-200">{log.entity}</span>
                                                </div>
                                                {log.entityId && (
                                                    <span className="text-[10px] text-gray-400 mt-0.5 block font-mono">ID: {log.entityId.slice(0, 8)}...</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#3498DB]/10 text-[#3498DB] flex items-center justify-center font-bold text-xs border border-[#3498DB]/20">
                                                        {log.user.fullName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-gray-900 dark:text-white">{log.user.fullName}</p>
                                                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{log.user.role}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded w-fit">
                                                        {log.ipAddress || 'Unknown IP'}
                                                    </span>
                                                    {log.userAgent && (
                                                        <span className="text-[10px] text-gray-500 truncate max-w-[150px]" title={log.userAgent}>
                                                            {log.userAgent.split(' ')[0]} {/* Simple parsing */}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right pr-8">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-sm font-bold text-gray-900 dark:text-gray-200">
                                                        {format(new Date(log.createdAt), 'dd MMM yyyy')}
                                                    </span>
                                                    <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                        <Clock size={12} />
                                                        {format(new Date(log.createdAt), 'hh:mm a')}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
