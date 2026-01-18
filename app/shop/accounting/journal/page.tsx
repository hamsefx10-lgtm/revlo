'use client';

import React, { useState, useEffect } from 'react';
import {
    Save,
    Plus,
    Trash2,
    ArrowLeft,
    Calendar,
    NotebookPen,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

interface JournalLine {
    id: number;
    accountId: string; // This will start as empty string, so it should be valid for select value
    description: string;
    debit: number;
    credit: number;
}

export default function JournalEntryPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [reference, setReference] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);

    useEffect(() => {
        const fetchAccounts = async () => {
            const res = await fetch('/api/shop/accounts');
            if (res.ok) {
                const data = await res.json();
                setAccounts(data.accounts || []);
            }
        };
        fetchAccounts();
    }, []);

    const [lines, setLines] = useState<JournalLine[]>([
        { id: 1, accountId: '', description: '', debit: 0, credit: 0 },
        { id: 2, accountId: '', description: '', debit: 0, credit: 0 }
    ]);

    const addLine = () => {
        setLines([...lines, { id: Date.now(), accountId: '', description: '', debit: 0, credit: 0 }]);
    };

    const removeLine = (id: number) => {
        if (lines.length <= 2) return;
        setLines(lines.filter(l => l.id !== id));
    };

    const updateLine = (id: number, field: keyof JournalLine, value: any) => {
        setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    const totalDebit = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

    const handleSubmit = async () => {
        if (!isBalanced) return;
        setLoading(true);

        try {
            const res = await fetch('/api/shop/accounting/journal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date,
                    reference,
                    notes,
                    lines: lines.map(l => ({ ...l, debit: Number(l.debit), credit: Number(l.credit) }))
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to post journal');
            }

            toast({ title: 'Success', description: 'Journal Entry Posted Successfully' });
            router.push('/shop/accounting/ledger');

        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/shop/accounting" className="text-gray-400 hover:text-[#3498DB] transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                            <ArrowLeft size={14} /> Back to Accounting
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600">
                            <NotebookPen size={28} />
                        </div>
                        Journal Entry
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">Record manual accounting adjustments (Double Entry).</p>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!isBalanced || loading}
                    className="px-6 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                    Post Journal
                </button>
            </div>

            {/* FORM */}
            <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-xl overflow-hidden p-8">

                {/* Meta Data */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none font-medium text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reference #</label>
                        <input
                            type="text"
                            placeholder="e.g. JE-2024-001"
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes</label>
                        <input
                            type="text"
                            placeholder="Description of adjustment..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none font-medium"
                        />
                    </div>
                </div>

                {/* Journal Lines */}
                <div className="space-y-4 mb-8">
                    {lines.map((line) => (
                        <div key={line.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                            <div className="md:col-span-4">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Account</label>
                                <select
                                    value={line.accountId}
                                    onChange={(e) => updateLine(line.id, 'accountId', e.target.value)}
                                    className="w-full p-2.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-semibold text-sm appearance-none cursor-pointer"
                                >
                                    <option value="" disabled>Select Account</option>
                                    {accounts.map(acc => <option key={acc.id} value={acc.name}>{acc.name} ({acc.type})</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-4">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Description</label>
                                <input
                                    type="text"
                                    placeholder="Line description"
                                    value={line.description}
                                    onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                                    className="w-full p-2.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-medium text-sm"
                                />
                            </div>
                            <div className="md:col-span-3 grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Debit</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={line.debit}
                                        onChange={(e) => updateLine(line.id, 'debit', parseFloat(e.target.value) || 0)}
                                        className="w-full p-2.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-bold text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Credit</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={line.credit}
                                        onChange={(e) => updateLine(line.id, 'credit', parseFloat(e.target.value) || 0)}
                                        className="w-full p-2.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 outline-none font-bold text-sm"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-1 pt-6 text-center">
                                <button
                                    onClick={() => removeLine(line.id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                    disabled={lines.length <= 2}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={addLine}
                        className="text-[#3498DB] font-bold text-sm flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-4 py-2 rounded-lg transition-colors"
                    >
                        <Plus size={16} /> Add Line
                    </button>

                    <div className="flex gap-8 px-8">
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Debit</p>
                            <p className="text-xl font-black text-gray-900 dark:text-white">{totalDebit.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Credit</p>
                            <p className="text-xl font-black text-gray-900 dark:text-white">{totalCredit.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Balance</p>
                            <p className={`text-xl font-black ${isBalanced ? 'text-green-500' : 'text-red-500'}`}>
                                {isBalanced ? 'Matched' : (totalDebit - totalCredit).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
