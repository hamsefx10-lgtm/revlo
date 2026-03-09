'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/layouts/Layout';
import {
    Globe,
    ArrowLeft,
    Save,
    TrendingUp,
    History,
    RefreshCcw,
    DollarSign,
    Info,
    Loader2,
    CheckCircle2,
    AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

export default function CurrencySettingsPage() {
    const { toast } = useToast();
    const [rate, setRate] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentRate, setCurrentRate] = useState<any>(null);

    useEffect(() => {
        fetchCurrentRate();
    }, []);

    const fetchCurrentRate = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/settings/exchange-rate');
            const data = await res.json();
            if (data.rate) {
                setCurrentRate(data.rate);
                setRate(data.rate.rate.toString());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rate || isNaN(parseFloat(rate))) {
            toast({ title: "Invalid Rate", description: "Please enter a valid number.", variant: "destructive" });
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/settings/exchange-rate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rate: parseFloat(rate) })
            });

            if (res.ok) {
                toast({ title: "Exchange Rate Updated", description: `Today's rate set to ${rate} ETB per 1 USD.`, variant: "default" });
                fetchCurrentRate();
            } else {
                throw new Error("Failed to update rate");
            }
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto pb-20 animate-fade-in text-left">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <Link href="/settings" className="group text-slate-400 hover:text-primary transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                            <ArrowLeft size={12} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
                            Back to Settings
                        </Link>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
                            <Globe size={28} className="text-blue-500" strokeWidth={2.5} />
                            Currency & Rates
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium text-sm">
                            Maamul qiimaha dollarka iyo siday ugu kala dhigmaan Birta iyo Dollarka.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 bg-blue-500/10 px-4 py-2 rounded-2xl border border-blue-500/20">
                        <TrendingUp size={16} className="text-blue-500" />
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Live Integration Active</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Settings Card */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white dark:bg-[#161B2E] rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden text-left">
                            <div className="p-8 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                    <RefreshCcw size={16} className="text-blue-500" />
                                    Daily Exchange Rate
                                </h2>
                            </div>

                            <div className="p-8">
                                <form onSubmit={handleSave} className="space-y-8">
                                    <div className="bg-slate-50 dark:bg-blue-500/5 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 relative overflow-hidden text-left">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] rounded-full"></div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">
                                            Rate: 1 USD = ? ETB
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={rate}
                                                onChange={(e) => setRate(e.target.value)}
                                                className="w-full bg-white dark:bg-[#0B0F1A] border-2 border-slate-100 dark:border-slate-700 rounded-3xl px-8 py-6 text-4xl font-black focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all tabular-nums"
                                                placeholder="0.00"
                                                required
                                            />
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 font-black text-xl">
                                                ETB
                                            </div>
                                        </div>
                                        <p className="mt-4 text-[10px] font-bold text-slate-400 italic ml-1">
                                            Qiimahan waxaa loo isticmaali doonaa dhammaan iibka (Sales) iyo daymaha (Debts) ee maanta.
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 disabled:opacity-50 group"
                                    >
                                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} className="group-hover:scale-110 transition-transform" />}
                                        Update Today's Rate
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Info Boxes */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-[2rem] border border-blue-100 dark:border-blue-800/50 text-left">
                                <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Info size={14} /> Fiscal Protection
                                </h3>
                                <p className="text-xs font-medium text-blue-600/80 leading-relaxed">
                                    Nidaamku wuxuu si otomatik ah u beddelayaa daymaha Birta ah haddii ay ku dib dhacaan muddo ka badan 7 maalmood.
                                </p>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-[2rem] border border-emerald-100 dark:border-emerald-800/50 text-left">
                                <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <CheckCircle2 size={14} /> Buying Consistency
                                </h3>
                                <p className="text-xs font-medium text-emerald-600/80 leading-relaxed">
                                    Iibsashadaada Dollarka (USD) ee Soomaaliya waxaa lagu xisaabin doonaa qiimaha hadda jira si faaiidadaada loo sifeeyo.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Current Status */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-[#161B2E] p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group text-left">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-[40px] rounded-full"></div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 dark:border-slate-800 pb-4">Current Status</h3>

                            <div className="space-y-6">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Last Updated</p>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                        {currentRate ? format(new Date(currentRate.date), 'MMMM dd, yyyy') : 'No rates recorded'}
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-left">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">Active Rate</span>
                                        <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">Verified</span>
                                    </div>
                                    <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                                        {currentRate?.rate || '0.00'} <span className="text-xs font-bold opacity-30">ETB</span>
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-slate-50 dark:border-slate-800 text-left">
                                    <div className="flex items-center gap-3 text-rose-500 mb-2">
                                        <AlertTriangle size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Caution</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-500 leading-tight">
                                        Marka aad badashid qiimaha (Rate), waxay saameyn doontaa dhammaan iibka lacagtu ku dhiman tahay ee maanta la bixinayo.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#161B2E] p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm text-left">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <History size={14} /> Recent History
                            </h3>
                            <div className="space-y-4">
                                {/* Placeholder for history list */}
                                <div className="text-center py-8">
                                    <Globe size={32} className="text-slate-100 dark:text-slate-800 mx-auto mb-2" />
                                    <p className="text-[10px] font-black text-slate-300 uppercase italic">No history available</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
