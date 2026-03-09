'use client';

import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    ShoppingBag,
    DollarSign,
    TrendingUp,
    Edit,
    Loader2,
    CreditCard,
    X,
    CheckCircle2,
    Banknote
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function CustomerProfilePage() {
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [customer, setCustomer] = useState<any>(null);
    const [stats, setStats] = useState({
        totalSpent: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        totalDebt: 0
    });
    const [history, setHistory] = useState<any[]>([]);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        accountId: '',
        notes: ''
    });

    useEffect(() => {
        if (params.id) {
            fetchCustomerData();
            fetchAccounts();
        }
    }, [params.id]);

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/accounts');
            const data = await res.json();
            if (data.success) {
                setAccounts(data.accounts || []);
                if (data.accounts?.length > 0) {
                    setPaymentData(prev => ({ ...prev, accountId: data.accounts[0].id }));
                }
            }
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
        }
    };

    const fetchCustomerData = async () => {
        try {
            const response = await fetch(`/api/shop/customers/${params.id}`);
            if (!response.ok) return;
            const data = await response.json();

            if (data.customer) {
                setCustomer(data.customer);

                // Calculate total debt from history if not provided in analytics
                const historyData = data.history || [];
                const debt = historyData.reduce((sum: number, sale: any) => {
                    const paid = sale.paidAmount || (sale.paymentStatus === 'Paid' ? sale.total : 0);
                    const bal = sale.total - paid;
                    return sum + Math.max(0, bal);
                }, 0);

                setStats({
                    ...data.analytics,
                    totalDebt: debt
                });
                setHistory(historyData);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentData.amount || Number(paymentData.amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        if (!paymentData.accountId) {
            toast.error('Please select an account');
            return;
        }

        setPaymentLoading(true);
        try {
            const res = await fetch('/api/shop/receivables/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: params.id,
                    amount: Number(paymentData.amount),
                    accountId: paymentData.accountId,
                    notes: paymentData.notes
                })
            });

            const data = await res.json();
            if (res.ok) {
                toast.success('Payment recorded successfully!');
                setIsPaymentModalOpen(false);
                setPaymentData({ amount: '', accountId: accounts[0]?.id || '', notes: '' });
                fetchCustomerData(); // Refresh history and debt
            } else {
                toast.error(data.error || 'Payment failed');
            }
        } catch (error) {
            console.error('Payment Error:', error);
            toast.error('Something went wrong');
        } finally {
            setPaymentLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <h2 className="text-xl font-bold">Customer not found</h2>
                <Link href="/shop/customers" className="text-blue-500 hover:underline mt-2">Go Back</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-7xl mx-auto p-4 md:p-8">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/shop/customers" className="text-gray-400 hover:text-[#3498DB] transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                            <ArrowLeft size={14} /> Back to Customers
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-[#F39C12] to-[#E67E22] rounded-xl shadow-lg shadow-orange-500/20 text-white">
                            <User size={28} />
                        </div>
                        Customer Profile
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">View customer details and purchase history.</p>
                </div>

                <div className="flex gap-3">
                    {stats.totalDebt > 0 && (
                        <button
                            onClick={() => setIsPaymentModalOpen(true)}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-green-600 shadow-lg shadow-green-500/30 text-white font-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                        >
                            <Banknote size={18} /> Pay Debt
                        </button>
                    )}
                    <Link href={`/shop/customers/${params.id}/edit`} className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center gap-2">
                        <Edit size={18} /> Edit Customer
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT: Customer Info */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Profile Card */}
                    <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm">
                        <div className="flex items-start gap-6">
                            {/* Avatar */}
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#F39C12] to-[#E67E22] flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-orange-500/20 flex-shrink-0 uppercase">
                                {customer.name ? customer.name.slice(0, 2) : 'CU'}
                            </div>

                            {/* Details */}
                            <div className="flex-1">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">{customer.name}</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                            <Mail size={16} className="text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase">Email</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{customer.email || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                            <Phone size={16} className="text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase">Phone</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{customer.phone || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                            <MapPin size={16} className="text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase">Address</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{customer.address || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                                            <Calendar size={16} className="text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase">Customer Since</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {customer.createdAt ? format(new Date(customer.createdAt), 'MMM yyyy') : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Purchase History */}
                    <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Purchase History</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/50 dark:bg-gray-800/20 border-b border-gray-100 dark:border-gray-800">
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Invoice</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase">Date</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-400 uppercase">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase">Amount</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {history.length === 0 ? (
                                        <tr><td colSpan={5} className="p-6 text-center text-gray-500">No purchase history available.</td></tr>
                                    ) : (
                                        history.map((purchase) => {
                                            const paid = purchase.paidAmount || (purchase.paymentStatus === 'Paid' ? purchase.total : 0);
                                            const balance = purchase.total - paid;

                                            // Determine display status if not explicitly 'Credit'/'Partial' but has balance?
                                            // Rely on purchase.paymentStatus mainly.

                                            return (
                                                <tr key={purchase.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                    <td className="px-6 py-4 font-mono text-sm font-bold text-[#3498DB]">
                                                        <Link href={`/shop/sales/${purchase.id}`}>{purchase.invoiceNumber || purchase.id}</Link>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                        {format(new Date(purchase.createdAt), 'MMM dd, yyyy')}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${purchase.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                                                            purchase.paymentStatus === 'Credit' ? 'bg-red-100 text-red-700' :
                                                                purchase.paymentStatus === 'Partial' ? 'bg-orange-100 text-orange-700' :
                                                                    'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            {purchase.paymentStatus || 'Paid'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm font-black text-gray-900 dark:text-white">
                                                        ETB {purchase.total.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm font-bold">
                                                        {balance > 0 ? (
                                                            <span className="text-red-500">ETB {balance.toFixed(2)}</span>
                                                        ) : (
                                                            <span className="text-gray-300">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Stats */}
                <div className="space-y-6">

                    {/* Total Debt (New) */}
                    {(() => {
                        const totalDebt = stats.totalDebt;

                        return (
                            <div className={`p-6 rounded-[2rem] shadow-xl relative overflow-hidden text-white transition-all duration-500 ${totalDebt > 0 ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/20' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
                                <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-red-100 text-xs font-bold uppercase tracking-wider">Total Debt</p>
                                        {totalDebt > 0 && (
                                            <button
                                                onClick={() => setIsPaymentModalOpen(true)}
                                                className="p-1 px-3 bg-white/20 hover:bg-white/30 rounded-lg text-white text-[10px] font-black uppercase tracking-widest transition-all"
                                            >
                                                Pay Now
                                            </button>
                                        )}
                                    </div>
                                    <h2 className="text-4xl font-black mb-2 animate-pulse-subtle">ETB {totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                                    <p className="text-red-100 text-sm flex items-center gap-2">
                                        {totalDebt > 0 ? (
                                            <><TrendingUp size={14} /> Outstanding Balance</>
                                        ) : (
                                            <><CheckCircle2 size={14} /> No outstanding debt</>
                                        )}
                                    </p>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Total Spent */}
                    <div className="bg-gradient-to-br from-[#2ECC71] to-[#27AE60] p-6 rounded-[2rem] shadow-xl shadow-green-500/20 text-white relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="relative z-10">
                            <p className="text-green-100 text-xs font-bold uppercase tracking-wider mb-2">Total Spent</p>
                            <h2 className="text-2xl font-black mb-2">ETB {stats.totalSpent.toLocaleString()}</h2>
                            <p className="text-green-100 text-sm">Lifetime value</p>
                        </div>
                    </div>

                    {/* Total Purchases */}
                    <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-[#3498DB]/10 text-[#3498DB]">
                                <ShoppingBag size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Total Orders</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalOrders}</p>
                            </div>
                        </div>
                        {history.length > 0 && <p className="text-sm text-gray-500">Last: <span className="font-bold">{format(new Date(history[0].createdAt), 'MMM dd')}</span></p>}
                    </div>

                    {/* Average Order */}
                    <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-[#F39C12]/10 text-[#F39C12]">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Avg. Order Value</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">ETB {Math.round(stats.averageOrderValue).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* PAYMENT MODAL */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-[#1f2937] w-full max-w-md rounded-[2.5rem] shadow-2xl shadow-black/40 overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="p-8 pb-4 flex justify-between items-center bg-gradient-to-r from-green-500/10 to-transparent">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white">Pay Debt</h3>
                                <p className="text-sm text-gray-500 mt-1 uppercase tracking-widest font-bold">New Payment Entry</p>
                            </div>
                            <button
                                onClick={() => setIsPaymentModalOpen(false)}
                                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all text-gray-400"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handlePaymentSubmit} className="p-8 pt-4 space-y-6">
                            {/* Total Debt Display */}
                            <div className="p-5 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-100 dark:border-red-500/20">
                                <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Max Outstanding</p>
                                <p className="text-2xl font-black text-red-600 dark:text-red-400">ETB {stats.totalDebt.toLocaleString()}</p>
                            </div>

                            {/* Amount Input */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Amount to Pay (ETB)</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors">
                                        <Banknote size={20} />
                                    </div>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        value={paymentData.amount}
                                        onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                        placeholder="0.00"
                                        className="w-full pl-12 pr-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 focus:border-green-500 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all font-black text-lg"
                                    />
                                </div>
                            </div>

                            {/* Account Selector */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Destination Account</label>
                                <div className="relative">
                                    <select
                                        required
                                        value={paymentData.accountId}
                                        onChange={(e) => setPaymentData({ ...paymentData, accountId: e.target.value })}
                                        className="w-full px-4 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 outline-none appearance-none font-bold text-gray-700 dark:text-gray-200 cursor-pointer"
                                    >
                                        <option value="" disabled>Select an account</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.name} - ({acc.balance.toLocaleString()} ETB)
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <TrendingUp size={16} />
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Notes (Optional)</label>
                                <textarea
                                    value={paymentData.notes}
                                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                                    placeholder="e.g. Received via Bank Transfer..."
                                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 outline-none h-24 font-medium"
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={paymentLoading}
                                className="w-full py-5 rounded-[1.5rem] bg-gradient-to-r from-green-600 to-green-500 text-white font-black text-lg shadow-xl shadow-green-600/30 hover:shadow-green-600/40 hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:translate-y-0 transition-all flex items-center justify-center gap-3"
                            >
                                {paymentLoading ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <>
                                        Confirm Payment <CheckCircle2 size={24} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
