'use client';

import React, { useEffect, useState } from 'react';
import {
    ArrowLeft, Building2, Calculator, CalendarClock, DollarSign,
    FileCheck, Percent, Loader2, CheckCircle, Clock, Wallet,
    CreditCard, AlertTriangle, Receipt, ChevronDown, ChevronUp, X
} from 'lucide-react';
import Link from 'next/link';
import MetricCard from '@/components/shop/ui/MetricCard';

interface PayModalState {
    open: boolean;
    taxReturnId: string;
    taxDue: number;
    reference: string;
}

export default function TaxCenterPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [payModal, setPayModal] = useState<PayModalState>({ open: false, taxReturnId: '', taxDue: 0, reference: '' });
    const [payForm, setPayForm] = useState({ accountId: '', reference: '' });
    const [paying, setPaying] = useState(false);
    const [showAllHistory, setShowAllHistory] = useState(false);

    useEffect(() => { fetchTaxData(); }, []);

    const fetchTaxData = async () => {
        try {
            const res = await fetch('/api/shop/accounting/tax');
            if (res.ok) setData(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleFileTaxReturn = async () => {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString();
        const end = new Date(today.getFullYear(), today.getMonth(), 0).toISOString();

        if (!confirm(`File VAT Return for last month?\n${new Date(start).toLocaleDateString()} — ${new Date(end).toLocaleDateString()}`)) return;

        try {
            const res = await fetch('/api/shop/accounting/tax/file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ periodStart: start, periodEnd: end })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            alert(`✅ Tax Return Filed!\nCanshuur La Qabo: ETB ${json.taxReturn.taxDue.toLocaleString()}`);
            fetchTaxData();
        } catch (e: any) { alert(e.message); }
    };

    const handlePayTax = async () => {
        if (!payForm.accountId) { alert('Fadlan dooro account!'); return; }
        setPaying(true);
        try {
            const res = await fetch(`/api/shop/accounting/tax/${payModal.taxReturnId}/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountId: payForm.accountId,
                    reference: payForm.reference || undefined,
                    amount: payModal.taxDue
                })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            alert(`✅ ${json.message}`);
            setPayModal({ open: false, taxReturnId: '', taxDue: 0, reference: '' });
            setPayForm({ accountId: '', reference: '' });
            fetchTaxData();
        } catch (e: any) { alert(e.message); }
        finally { setPaying(false); }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-red-500" size={32} />
            </div>
        );
    }

    const historyItems = data?.history || [];
    const displayHistory = showAllHistory ? historyItems : historyItems.slice(0, 5);

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-7xl mx-auto md:p-8">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-4 md:px-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/shop/accounting" className="text-gray-400 hover:text-[#3498DB] transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                            <ArrowLeft size={14} /> Xisaabaadka
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl text-red-500 shadow-sm border border-red-100 dark:border-red-900/30">
                            <Building2 size={28} />
                        </div>
                        Xarunta Canshuurta
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm font-medium">Maareeya canshuuraha, rasiidyada iyo daymahaaga canshuur</p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleFileTaxReturn}
                        className="px-5 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold shadow-lg hover:opacity-90 flex items-center gap-2 transition-all hover:-translate-y-0.5">
                        <FileCheck size={18} /> Canshuur Diiwaangali (Bisha Hore)
                    </button>
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 px-4 md:px-0">
                <MetricCard
                    label="Canshuur La Qabo (Net)"
                    value={`ETB ${(data?.stats?.taxDue || 0).toLocaleString()}`}
                    trend="Dayn Dawladda"
                    isPositive={data?.stats?.taxDue <= 0}
                    icon={AlertTriangle}
                    variant="danger"
                />
                <MetricCard
                    label="Canshuur La Ururiyay"
                    value={`ETB ${(data?.stats?.taxCollected || 0).toLocaleString()}`}
                    trend="Iibka — Output VAT"
                    isPositive={true}
                    icon={Percent}
                    variant="accent"
                />
                <MetricCard
                    label="Canshuur La Bixiyay (Iibsashada)"
                    value={`ETB ${(data?.stats?.taxPaid || 0).toLocaleString()}`}
                    trend="Input VAT"
                    isPositive={true}
                    icon={CalendarClock}
                    variant="neutral"
                />
                <MetricCard
                    label="La Bixiyay (Dawladda)"
                    value={`ETB ${(data?.stats?.totalRemitted || 0).toLocaleString()}`}
                    trend={`${data?.stats?.pendingReturns || 0} sugaya`}
                    isPositive={true}
                    icon={CheckCircle}
                    variant="primary"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 md:px-0">
                {/* TAX RATES */}
                <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <Calculator size={20} className="text-gray-400" /> Heerka Canshuurta
                    </h3>
                    <div className="space-y-4">
                        {data?.rates?.map((rate: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">{rate.name}</p>
                                    <p className="text-xs text-gray-500">{rate.description}</p>
                                </div>
                                <span className="text-lg font-black text-[#3498DB]">{rate.rate}%</span>
                            </div>
                        ))}
                    </div>

                    {/* Tax Liability Summary */}
                    <div className="mt-8 p-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl">
                        <h4 className="text-sm font-black text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                            <AlertTriangle size={16} /> Daynta Canshuurta (Tax Liability)
                        </h4>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Canshuur la ururiyay</span>
                                <span className="font-bold text-gray-900 dark:text-white">ETB {(data?.stats?.taxCollected || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">- Input VAT (Iibsashada)</span>
                                <span className="font-bold text-green-600">-ETB {(data?.stats?.taxPaid || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">- La bixiyay (Dawladda)</span>
                                <span className="font-bold text-green-600">-ETB {(data?.stats?.totalRemitted || 0).toLocaleString()}</span>
                            </div>
                            <div className="border-t border-red-200 dark:border-red-800 my-2"></div>
                            <div className="flex justify-between text-sm">
                                <span className="font-black text-red-600 dark:text-red-400">WALI LA QABO</span>
                                <span className="font-black text-red-600 dark:text-red-400 text-lg">ETB {(data?.stats?.taxDue || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TAX RETURN HISTORY */}
                <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <Receipt size={20} className="text-gray-400" /> Taariikhda Canshuurta
                    </h3>

                    <div className="space-y-4">
                        {displayHistory.length === 0 ? (
                            <div className="text-center py-12">
                                <Receipt className="mx-auto text-gray-300 dark:text-gray-700 mb-4" size={48} />
                                <p className="text-gray-500 text-sm font-medium">Rasiid canshuur ah lama diiwaan galin</p>
                                <p className="text-gray-400 text-xs mt-1">Riix "Canshuur Diiwaangali" si aad u bilowdo</p>
                            </div>
                        ) : displayHistory.map((h: any) => (
                            <div key={h.id} className={`p-4 rounded-xl border transition-all ${
                                h.status === 'PAID'
                                    ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20'
                                    : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20'
                            }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {h.status === 'PAID' ? (
                                            <CheckCircle size={16} className="text-green-500" />
                                        ) : (
                                            <Clock size={16} className="text-amber-500" />
                                        )}
                                        <p className="font-bold text-sm text-gray-900 dark:text-white">{h.period}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                                        h.status === 'PAID'
                                            ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-100'
                                            : 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-100'
                                    }`}>
                                        {h.status === 'PAID' ? 'La Bixiyay' : 'Sugaysa Bixin'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-gray-500 space-y-0.5">
                                        <p>La ururiyay: ETB {h.taxCollected?.toLocaleString()}</p>
                                        <p>Canshuur: ETB {h.taxDue?.toLocaleString()}</p>
                                        {h.paymentDate && <p className="text-green-600 font-bold">Bixinta: {new Date(h.paymentDate).toLocaleDateString()}</p>}
                                    </div>
                                    {h.status === 'FILED' && (
                                        <button
                                            onClick={() => {
                                                setPayModal({ open: true, taxReturnId: h.id, taxDue: h.taxDue, reference: h.reference || '' });
                                                setPayForm({ accountId: '', reference: '' });
                                            }}
                                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:-translate-y-0.5 shadow-lg shadow-red-500/20">
                                            <CreditCard size={14} /> Bixi Canshuurta
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {historyItems.length > 5 && (
                        <button
                            onClick={() => setShowAllHistory(!showAllHistory)}
                            className="mt-4 w-full text-center text-sm font-bold text-[#3498DB] hover:text-blue-600 flex items-center justify-center gap-1 transition-colors">
                            {showAllHistory ? <><ChevronUp size={16} /> Iska yar</> : <><ChevronDown size={16} /> Tus dhammaan ({historyItems.length})</>}
                        </button>
                    )}
                </div>
            </div>

            {/* PAYMENT MODAL */}
            {payModal.open && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-[#1f2937] rounded-[2rem] p-8 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                <CreditCard size={22} className="text-red-500" /> Bixi Canshuurta
                            </h3>
                            <button onClick={() => setPayModal({ open: false, taxReturnId: '', taxDue: 0, reference: '' })} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Amount Display */}
                        <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl mb-6 text-center">
                            <p className="text-xs text-red-400 font-bold uppercase tracking-wider mb-1">Lacagta La Bixinayo</p>
                            <p className="text-3xl font-black text-red-600 dark:text-red-400">ETB {payModal.taxDue.toLocaleString()}</p>
                        </div>

                        {/* Account Select */}
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                <Wallet size={12} className="inline mr-1" /> Ka bixi Account-kan
                            </label>
                            <select
                                value={payForm.accountId}
                                onChange={e => setPayForm(f => ({ ...f, accountId: e.target.value }))}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none">
                                <option value="">— Dooro Account —</option>
                                {data?.accounts?.map((a: any) => (
                                    <option key={a.id} value={a.id}>
                                        {a.name} ({a.currency}) — {a.balance.toLocaleString()}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Reference */}
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                <Receipt size={12} className="inline mr-1" /> Reference / Rasiidka
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. VAT-2026-04"
                                value={payForm.reference}
                                onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setPayModal({ open: false, taxReturnId: '', taxDue: 0, reference: '' })}
                                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                Jooji
                            </button>
                            <button
                                onClick={handlePayTax}
                                disabled={paying || !payForm.accountId}
                                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2">
                                {paying ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                {paying ? 'Waa la bixinayaa...' : 'Xaqiiji Bixinta'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
