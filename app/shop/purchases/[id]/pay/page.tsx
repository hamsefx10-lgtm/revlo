'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    CheckCircle,
    Building2,
    DollarSign,
    CreditCard,
    Loader2,
    Briefcase,
    Calendar,
    Wallet,
    Globe,
    Info,
    ArrowRightLeft,
    FileText
} from 'lucide-react';
import { toast } from 'sonner';

interface Account {
    id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
}

interface PurchaseOrder {
    id: string;
    poNumber: string;
    vendor: { companyName: string };
    total: number;
    paidAmount: number;
    status: string;
    currency: string;
    exchangeRate: number;
    createdAt: string;
}

export default function PurchasePaymentPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [po, setPo] = useState<PurchaseOrder | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);

    // Form
    const [amount, setAmount] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [customExchangeRate, setCustomExchangeRate] = useState<string>('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [poRes, accRes] = await Promise.all([
                    fetch(`/api/shop/purchases/${params.id}`),
                    fetch('/api/shop/accounts')
                ]);

                if (!poRes.ok) throw new Error('Failed to load order');

                const poData = await poRes.json();
                setPo(poData.purchaseOrder);
                setCustomExchangeRate(String(poData.purchaseOrder.exchangeRate || 1));

                const accData = await accRes.json();
                if (accData.accounts) setAccounts(accData.accounts);

                // Default amount is remaining in PO currency
                // Note: po.total and po.paidAmount in DB are ETB. 
                // We need the PO-currency equivalents.
                const poCurrency = poData.purchaseOrder.currency || 'ETB';
                const rate = poData.purchaseOrder.exchangeRate || 1;

                let remainingInPOCurrency = 0;
                if (poCurrency === 'USD') {
                    remainingInPOCurrency = (poData.purchaseOrder.total - poData.purchaseOrder.paidAmount) / rate;
                    // Round to 2 decimals for USD
                    remainingInPOCurrency = Math.round(remainingInPOCurrency * 100) / 100;
                } else {
                    remainingInPOCurrency = poData.purchaseOrder.total - poData.purchaseOrder.paidAmount;
                }

                setAmount(remainingInPOCurrency.toString());

            } catch (error) {
                console.error(error);
                toast.error('Failed to load payment details');
                router.push('/shop/purchases');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [params.id, router]);

    const selectedAcc = accounts.find(a => a.id === selectedAccountId);
    const poCurrency = po?.currency || 'ETB';
    const payVal = parseFloat(amount) || 0;
    const currentRate = parseFloat(customExchangeRate) || po?.exchangeRate || 1;

    // Calculation for display
    let deductionFromAccount = payVal;
    let showConversion = false;

    if (selectedAcc && po) {
        if (selectedAcc.currency !== poCurrency) {
            showConversion = true;
            if (selectedAcc.currency === 'ETB' && poCurrency === 'USD') {
                deductionFromAccount = payVal * currentRate;
            } else if (selectedAcc.currency === 'USD' && poCurrency === 'ETB') {
                deductionFromAccount = payVal / currentRate;
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedAccountId) {
            toast.error('Please select a funding account');
            return;
        }

        if (payVal <= 0) {
            toast.error('Invalid amount');
            return;
        }

        if (selectedAcc && selectedAcc.balance < deductionFromAccount) {
            if (!confirm(`Warning: Insufficient funds in ${selectedAcc.name}. Deduction: ${selectedAcc.currency} ${deductionFromAccount.toLocaleString()}. Balance: ${selectedAcc.balance.toLocaleString()}. Proceed anyway?`)) {
                return;
            }
        }

        setIsSubmitting(true);

        try {
            const res = await fetch(`/api/shop/purchases/${params.id}/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: payVal, // Amount in PO currency
                    accountId: selectedAccountId,
                    notes,
                    method: selectedAcc?.type || 'Bank Transfer',
                    exchangeRate: currentRate
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Payment failed');
            }

            toast.success('Payment processed successfully');
            router.push(`/shop/purchases/${params.id}`);

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B1120]"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;
    }

    if (!po) return null;

    // In DB, total and paidAmount are ETB. 
    // Show remaining in PO currency
    const rate = po.exchangeRate || 1;
    const remainingInPOCurrency = poCurrency === 'USD'
        ? (po.total - po.paidAmount) / rate
        : (po.total - po.paidAmount);

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] font-sans pb-24">
            {/* Header */}
            <div className="bg-white dark:bg-[#151C2C] border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30 shadow-sm/50 backdrop-blur-xl bg-white/80 dark:bg-[#151C2C]/90">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/shop/purchases/${params.id}`} className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all text-gray-500">
                            <ArrowLeft size={22} strokeWidth={2} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-none mb-1.5">Record Payment</h1>
                            <p className="text-sm text-gray-500 font-medium">Order #{po.poNumber} • {po.vendor.companyName}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT: FORM */}
                    <div className="lg:col-span-12 space-y-8">
                        <div className="bg-white dark:bg-[#151C2C] rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-800 p-8">

                            <form onSubmit={handleSubmit} className="space-y-10">

                                {/* SECTION 1: ACCOUNT */}
                                <div>
                                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                            <Building2 size={18} />
                                        </div>
                                        1. Select Funding Account
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {accounts.map(acc => (
                                            <button
                                                key={acc.id}
                                                type="button"
                                                onClick={() => setSelectedAccountId(acc.id)}
                                                className={`relative p-5 rounded-2xl border-2 text-left transition-all group ${selectedAccountId === acc.id
                                                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 shadow-lg shadow-blue-500/10'
                                                    : 'border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20'}`}
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center shadow-sm">
                                                        <span className="text-[10px] font-black">{acc.currency}</span>
                                                    </div>
                                                    {selectedAccountId === acc.id && (
                                                        <div className="p-1 bg-blue-500 rounded-full text-white shadow-lg shadow-blue-500/30">
                                                            <CheckCircle size={14} />
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="font-bold text-gray-900 dark:text-white text-sm mb-0.5 truncate">{acc.name}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-2">{acc.type}</p>
                                                <p className={`text-base font-black ${acc.balance < 0 ? 'text-red-500' : 'text-[#2ECC71]'}`}>
                                                    {acc.balance.toLocaleString()} <span className="text-[10px] opacity-60">{acc.currency}</span>
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* SECTION 2: AMOUNT & CONVERSION */}
                                <div>
                                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                                            <CreditCard size={18} />
                                        </div>
                                        2. Payment Details
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-3">Amount to Pay ({poCurrency})</label>
                                                <div className="relative">
                                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gray-300 text-xl">{poCurrency === 'USD' ? '$' : 'B'}</div>
                                                    <input
                                                        type="number"
                                                        value={amount}
                                                        onChange={e => setAmount(e.target.value)}
                                                        className="w-full pl-12 pr-6 py-5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 font-black text-3xl text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 transition-all shadow-inner"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-400 mt-2 font-medium">Remaining balance: <span className="font-bold text-gray-900 dark:text-gray-200">{remainingInPOCurrency.toLocaleString()} {poCurrency}</span></p>
                                            </div>

                                            {poCurrency === 'USD' && (
                                                <div>
                                                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-3">Today's Exchange Rate</label>
                                                    <div className="relative group">
                                                        <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
                                                        <input
                                                            type="number"
                                                            value={customExchangeRate}
                                                            onChange={e => setCustomExchangeRate(e.target.value)}
                                                            className="w-full pl-12 pr-12 py-4 bg-blue-50/30 dark:bg-blue-900/5 rounded-xl border border-blue-100 dark:border-blue-900/20 font-black text-lg text-blue-600 dark:text-blue-400 outline-none focus:border-blue-400 transition-all"
                                                        />
                                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-400 uppercase">BIRR</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col justify-center gap-6">
                                            {selectedAcc && (
                                                <div className="bg-gray-50/50 dark:bg-gray-800/30 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
                                                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                                                        <Wallet size={120} />
                                                    </div>

                                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                        <ArrowRightLeft size={12} /> Account Deduction
                                                    </h4>

                                                    <div className="space-y-4 relative z-10">
                                                        <div className="flex justify-between items-end">
                                                            <div>
                                                                <p className="text-3xl font-black text-gray-900 dark:text-white">
                                                                    {deductionFromAccount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </p>
                                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{selectedAcc.currency} FROM {selectedAcc.name}</p>
                                                            </div>
                                                            {showConversion && (
                                                                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center animate-pulse shadow-lg shadow-blue-500/20">
                                                                    <Globe size={20} />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {showConversion && (
                                                            <div className="bg-blue-500/5 rounded-xl p-3 border border-blue-500/10">
                                                                <p className="text-[10px] font-medium text-blue-600 dark:text-blue-400 leading-relaxed flex items-center gap-2">
                                                                    <Info size={12} />
                                                                    Converting {payVal.toLocaleString()} {poCurrency} at {currentRate}
                                                                </p>
                                                            </div>
                                                        )}

                                                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">New Balance</span>
                                                            <span className="text-sm font-black text-gray-900 dark:text-white">
                                                                {(selectedAcc.balance - deductionFromAccount).toLocaleString()} {selectedAcc.currency}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {!selectedAcc && (
                                                <div className="h-full bg-gray-50/30 dark:bg-gray-800/10 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center p-8 text-center text-gray-400 group">
                                                    <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-800 mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        <Building2 size={24} />
                                                    </div>
                                                    <p className="text-xs font-bold uppercase tracking-widest">Wait, select an account first</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* NOTES */}
                                <div>
                                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Payment Notes (Optional)</label>
                                    <div className="relative">
                                        <FileText className="absolute left-5 top-5 text-gray-400" size={18} />
                                        <textarea
                                            rows={2}
                                            placeholder="Bank reference, check number, or specific instructions..."
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            className="w-full pl-12 pr-6 py-5 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-800 font-medium text-gray-900 dark:text-white outline-none focus:border-blue-500 transition-all resize-none shadow-sm"
                                        />
                                    </div>
                                </div>

                                {/* SUBMIT */}
                                <div className="pt-6">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !selectedAccountId}
                                        className="w-full py-6 bg-[#3498DB] hover:bg-[#2980B9] text-white rounded-3xl font-black shadow-2xl shadow-blue-500/30 text-xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3 relative group overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                        {isSubmitting ? (
                                            <Loader2 className="animate-spin" size={24} />
                                        ) : (
                                            <>
                                                <CheckCircle size={24} strokeWidth={2.5} />
                                                <span>Confirm & Record Payment</span>
                                            </>
                                        )}
                                    </button>
                                    <p className="text-center text-[10px] text-gray-400 mt-4 font-bold uppercase tracking-tighter">Secure transaction • Ledger will be updated automatically</p>
                                </div>

                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
