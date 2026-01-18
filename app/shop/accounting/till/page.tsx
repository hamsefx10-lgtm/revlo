'use client';

import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    Loader2,
    Lock,
    Unlock,
    History
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

export default function TillManagementPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [activeSession, setActiveSession] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);

    // Modal states
    const [floatAmount, setFloatAmount] = useState('');
    const [closingCash, setClosingCash] = useState('');

    useEffect(() => {
        fetchTillData();
    }, []);

    const fetchTillData = async () => {
        try {
            const res = await fetch('/api/shop/accounting/till');
            if (res.ok) {
                const data = await res.json();
                setActiveSession(data.activeSession);
                setHistory(data.history || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: 'OPEN' | 'CLOSE', amount: string) => {
        try {
            const res = await fetch('/api/shop/accounting/till', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, amount })
            });
            if (res.ok) {
                toast({ title: 'Success', description: `Till ${action === 'OPEN' ? 'Opened' : 'Closed'} Successfully` });
                fetchTillData();
                setFloatAmount('');
                setClosingCash('');
            } else {
                throw new Error('Failed');
            }
        } catch (e) {
            toast({ title: 'Error', description: 'Action failed', variant: 'destructive' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/shop/accounting" className="text-gray-400 hover:text-[#3498DB] transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                            <ArrowLeft size={14} /> Back to Accounting
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600">
                            <Lock size={28} />
                        </div>
                        Till Management
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">Manage cash drawers and daily reconciliations.</p>
                </div>

                {!activeSession && (
                    <div className="flex gap-2">
                        <input
                            type="number"
                            placeholder="Opening Float..."
                            className="px-4 py-2 rounded-xl border border-gray-200"
                            value={floatAmount}
                            onChange={e => setFloatAmount(e.target.value)}
                        />
                        <button
                            onClick={() => handleAction('OPEN', floatAmount)}
                            disabled={!floatAmount}
                            className="px-6 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold shadow-lg flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
                        >
                            <Unlock size={18} /> Open New Session
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Active Session Card */}
                <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm">
                    {activeSession ? (
                        <>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className="px-3 py-1 bg-green-100 text-green-600 rounded-lg text-xs font-bold uppercase tracking-wider">Active</span>
                                    <h2 className="text-xl font-black mt-2">Main Register</h2>
                                    <p className="text-sm text-gray-500">Opened by {activeSession.user?.name} at {format(new Date(activeSession.openingTime), 'h:mm a')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Opening Float</p>
                                    <p className="text-2xl font-black text-[#3498DB]">ETB {activeSession.openingFloat.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <label className="text-xs font-bold uppercase text-gray-500">Closing Cash Count</label>
                                    <input
                                        type="number"
                                        className="w-full bg-white p-3 rounded-lg border mt-2 font-bold text-lg"
                                        placeholder="Enter counted cash..."
                                        value={closingCash}
                                        onChange={e => setClosingCash(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={() => handleAction('CLOSE', closingCash)}
                                    disabled={!closingCash}
                                    className="w-full py-4 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors"
                                >
                                    Close Till & Verify
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-10 text-gray-400">
                            <Lock size={48} className="mb-4 opacity-20" />
                            <p>No active till session. Open a new session to start.</p>
                        </div>
                    )}
                </div>

                {/* History */}
                <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm">
                    <h3 className="font-bold flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
                        <History size={18} className="text-gray-400" /> Recent Sessions
                    </h3>
                    {history.length === 0 ? (
                        <p className="text-gray-500 text-sm">No closed sessions yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {history.map(s => (
                                <div key={s.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                    <div>
                                        <p className="font-bold text-sm">Closed by {s.user?.name}</p>
                                        <p className="text-xs text-gray-500">{format(new Date(s.closingTime), 'MMM dd, h:mm a')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">ETB {s.closingCash?.toLocaleString()}</p>
                                        <p className={`text-xs font-bold ${s.variance === 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {s.variance === 0 ? 'Matched' : `Var: ${s.variance}`}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
