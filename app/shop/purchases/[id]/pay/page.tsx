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
    Wallet
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
    createdAt: string;
    items: any[];
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

                const accData = await accRes.json();
                if (accData.accounts) setAccounts(accData.accounts);

                // Default amount
                const remaining = poData.purchaseOrder.total - poData.purchaseOrder.paidAmount;
                setAmount(remaining.toString());

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedAccountId) {
            toast.error('Please select a funding account');
            return;
        }

        const payVal = parseFloat(amount);
        if (!payVal || payVal <= 0) {
            toast.error('Invalid amount');
            return;
        }

        const selectedAcc = accounts.find(a => a.id === selectedAccountId);
        if (selectedAcc && selectedAcc.balance < payVal) {
            if (!confirm(`Warning: Insufficient funds in ${selectedAcc.name}. Current balance: ${selectedAcc.balance}. Proceed anyway?`)) {
                return;
            }
        }

        setIsSubmitting(true);

        try {
            const res = await fetch(`/api/shop/purchases/${params.id}/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: payVal,
                    accountId: selectedAccountId,
                    notes,
                    method: selectedAcc?.type || 'Bank Transfer'
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Payment failed');
            }

            toast.success('Payment processed successfully');
            router.push('/shop/purchases');

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

    const remainingBalance = po.total - po.paidAmount;

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] font-sans pb-20">
            {/* Header */}
            <div className="bg-white dark:bg-[#151C2C] border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30 shadow-sm/50">
                <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/shop/purchases" className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all text-gray-500">
                            <ArrowLeft size={22} strokeWidth={2} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-none mb-1.5">Process Payment</h1>
                            <p className="text-sm text-gray-500 font-medium">Order #{po.poNumber}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Order Summary Card */}
                    <div className="bg-white dark:bg-[#151C2C] rounded-[24px] p-6 text-center border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-500">
                            <Briefcase size={24} />
                        </div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Total Amount</p>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white">ETB {po.total.toLocaleString()}</h3>
                        <p className="text-xs text-blue-500 font-bold mt-2">{po.vendor.companyName}</p>
                    </div>

                    {/* Balance Card */}
                    <div className="bg-white dark:bg-[#151C2C] rounded-[24px] p-6 text-center border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                        <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-3 text-red-500">
                            <Wallet size={24} />
                        </div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Due Balance</p>
                        <h3 className="text-3xl font-black text-red-500">ETB {remainingBalance.toLocaleString()}</h3>
                        <p className="text-xs text-gray-400 font-medium mt-2">
                            Paid: {po.paidAmount.toLocaleString()}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white dark:bg-[#151C2C] rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-800 p-8 space-y-8">

                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold">1</span>
                            Select Funding Account
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {accounts.map(acc => (
                                <button
                                    key={acc.id}
                                    type="button"
                                    onClick={() => setSelectedAccountId(acc.id)}
                                    className={`relative p-4 rounded-2xl border-2 text-left transition-all group ${selectedAccountId === acc.id
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                                        : 'border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-gray-600'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-bold text-gray-900 dark:text-white">{acc.name}</p>
                                        {selectedAccountId === acc.id && <CheckCircle className="text-blue-500" size={20} />}
                                    </div>
                                    <p className="text-xs font-medium text-gray-500">{acc.type}</p>
                                    <p className={`text-sm font-bold mt-2 ${acc.balance < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        Available: {acc.balance.toLocaleString()}
                                    </p>
                                </button>
                            ))}

                            <Link href="/shop/accounting/accounts" className="p-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-blue-500 hover:border-blue-500 hover:bg-white dark:hover:bg-gray-800 transition-all">
                                <Building2 size={24} />
                                <span className="text-xs font-bold">Add Account</span>
                            </Link>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-bold">2</span>
                            Payment Details
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Amount to Pay</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-4 text-gray-400 text-lg font-bold">ETB</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 font-black text-2xl text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes</label>
                                <textarea
                                    rows={3}
                                    placeholder="Reference number, check description..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting || !selectedAccountId}
                            className="w-full py-4 bg-[#2ECC71] hover:bg-[#27AE60] text-white rounded-xl font-bold shadow-xl shadow-green-500/30 text-lg active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle size={22} />}
                            Confirm Payment
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
