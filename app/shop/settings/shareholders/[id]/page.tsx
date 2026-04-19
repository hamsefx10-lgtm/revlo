'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import {
    ArrowLeft, User, Mail, Phone, Calendar, Percent, Wallet,
    TrendingUp, DollarSign, Clock, CheckCircle, AlertCircle,
    Loader2, Edit, X, Plus, BarChart3, History, ReceiptText,
    BadgeDollarSign, Send, ChevronRight, RefreshCw, PieChart,
    ArrowUpRight, Minus
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Shareholder {
    id: string;
    name: string;
    email: string;
    phone?: string;
    sharePercentage: number;
    initialInvestment: number;
    totalReceived: number;
    joinedDate: string;
    status: string;
    notes?: string;
    dividends: Dividend[];
}

interface Dividend {
    id: string;
    amount: number;
    profitAmount: number;
    periodStart: string;
    periodEnd: string;
    paidDate?: string;
    status: string;
    note?: string;
    account?: { name: string };
}

interface Analytics {
    totalProfit: number;
    shareholders: {
        id: string;
        profitShare: number;
        totalPaid: number;
        balance: number;
        roi: number;
    }[];
}

// ─── Dividend Pay Modal ───────────────────────────────────────────────────────
function PayDividendModal({
    shareholder,
    analyticsData,
    onClose,
    onPaid,
}: {
    shareholder: Shareholder;
    analyticsData?: Analytics['shareholders'][0];
    onClose: () => void;
    onPaid: () => void;
}) {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [form, setForm] = useState({
        amount: analyticsData?.balance?.toFixed(2) || '',
        periodStart: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
        periodEnd: format(new Date(), 'yyyy-MM-dd'),
        accountId: '',
        note: '',
        status: 'Paid',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/api/shop/accounts').then(r => r.json()).then(d => setAccounts(d.accounts || [])).catch(() => { });
    }, []);

    const ch = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

    const handlePay = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.amount || parseFloat(form.amount) <= 0) { toast.error('Geli lacagta saxda ah'); return; }
        setSaving(true);
        try {
            const res = await fetch('/api/shop/shareholders/dividends', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shareholderId: shareholder.id,
                    amount: form.amount,
                    profitAmount: analyticsData?.profitShare || form.amount,
                    periodStart: form.periodStart,
                    periodEnd: form.periodEnd,
                    accountId: form.accountId || null,
                    note: form.note,
                    status: form.status,
                }),
            });
            const data = await res.json();
            if (!res.ok) { toast.error(data.error || 'Qalad ayaa dhacay'); return; }
            toast.success('Dividend si guul leh ayaa loo bixiyay!');
            onPaid();
            onClose();
        } catch { toast.error('Xiriirka shabakadda ee qalad'); }
        finally { setSaving(false); }
    };

    const inputCls = "w-full px-4 py-3 rounded-xl bg-[#F8FAFC] dark:bg-[#0d1929] border border-slate-200 dark:border-slate-700 focus:border-[#3498DB] focus:ring-2 focus:ring-[#3498DB]/10 outline-none text-sm font-medium text-slate-900 dark:text-white transition-all";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#161B2E] rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-200/60 dark:border-slate-700/60" style={{ animation: 'fadeInUp 0.2s ease' }}>
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <BadgeDollarSign size={20} className="text-[#3498DB]" />
                                Bixin Dividend
                            </h2>
                            <p className="text-sm text-slate-500 mt-0.5">{shareholder.name} — {shareholder.sharePercentage}% saamiga</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-all"><X size={20} /></button>
                    </div>

                    {/* Summary info box */}
                    {analyticsData && (
                        <div className="mt-4 grid grid-cols-3 gap-2">
                            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 text-center">
                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Faa'iidada</p>
                                <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 tabular-nums">{analyticsData.profitShare.toLocaleString()}</p>
                                <p className="text-[8px] text-emerald-500">ETB</p>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 text-center">
                                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">La Bixiyay</p>
                                <p className="text-sm font-black text-blue-700 dark:text-blue-400 tabular-nums">{analyticsData.totalPaid.toLocaleString()}</p>
                                <p className="text-[8px] text-blue-500">ETB</p>
                            </div>
                            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 text-center">
                                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Hadhka</p>
                                <p className="text-sm font-black text-amber-700 dark:text-amber-400 tabular-nums">{analyticsData.balance.toLocaleString()}</p>
                                <p className="text-[8px] text-amber-500">ETB</p>
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handlePay} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bilowga Xilliga</label>
                            <input type="date" value={form.periodStart} onChange={e => ch('periodStart', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Dhamaadka Xilliga</label>
                            <input type="date" value={form.periodEnd} onChange={e => ch('periodEnd', e.target.value)} className={inputCls} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Lacagta La Bixinayo (ETB) *</label>
                        <div className="relative">
                            <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input type="number" min="1" step="0.01" value={form.amount} onChange={e => ch('amount', e.target.value)} placeholder="0.00" className={inputCls + ' pl-10 text-lg font-black'} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Account (Meeshii Lacagtu Ka Timid)</label>
                        <select value={form.accountId} onChange={e => ch('accountId', e.target.value)} className={inputCls}>
                            <option value="">-- Xulo Account --</option>
                            {accounts.map((a: any) => (
                                <option key={a.id} value={a.id}>{a.name} ({a.balance?.toLocaleString()} ETB)</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Xusuusin</label>
                        <textarea rows={2} value={form.note} onChange={e => ch('note', e.target.value)} placeholder="Sababta bixinta..." className={inputCls + ' resize-none'} />
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.status === 'Paid'} onChange={e => ch('status', e.target.checked ? 'Paid' : 'Pending')}
                                className="w-4 h-4 accent-[#3498DB]" />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Hadda u calaamadee sidii La-Bixiyay (Paid)</span>
                        </label>
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                            Jooji
                        </button>
                        <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-[#3498DB] hover:bg-[#2980B9] text-white font-black text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            Xaqiiji Bixinta
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({ label, value, sub, icon: Icon, color, bg }: { label: string; value: string; sub?: string; icon: any; color: string; bg: string }) {
    return (
        <div className={`bg-white/80 dark:bg-[#161B2E]/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/80 rounded-[2rem] p-5 shadow-sm hover:shadow-md transition-all`}>
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={18} className={color} />
            </div>
            <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums leading-tight">{value}</p>
            {sub && <p className="text-[9px] font-bold text-slate-400 mt-0.5">{sub}</p>}
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{label}</p>
        </div>
    );
}

// ─── Main Profile Page ────────────────────────────────────────────────────────
export default function ShareholderProfilePage() {
    const { id } = useParams<{ id: string }>();
    const [shareholder, setShareholder] = useState<Shareholder | null>(null);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPayModal, setShowPayModal] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [shRes, anRes] = await Promise.all([
                fetch(`/api/shop/shareholders/${id}`),
                fetch('/api/shop/shareholders/analytics'),
            ]);
            const shData = await shRes.json();
            const anData = await anRes.json();
            if (!shRes.ok) { toast.error('Saamilaha la ma helin'); return; }
            setShareholder(shData.shareholder);
            setAnalytics(anData);
        } catch { toast.error('Xogta soo qaadis wuu fashilmay'); }
        finally { setLoading(false); }
    }, [id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const analyticsData = analytics?.shareholders?.find(s => s.id === id);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="animate-spin text-[#3498DB] mx-auto mb-3" size={40} />
                    <p className="text-sm text-slate-500 font-medium">Waa la soo qaadayaa xogta saamilaha...</p>
                </div>
            </div>
        );
    }

    if (!shareholder) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle size={40} className="text-rose-400 mx-auto mb-2" />
                    <p className="text-slate-500 font-medium">Saamilaha la ma helin</p>
                    <Link href="/shop/settings/shareholders" className="mt-4 inline-flex items-center gap-2 text-[#3498DB] font-bold text-sm">
                        <ArrowLeft size={14} /> Ku noqo liiska
                    </Link>
                </div>
            </div>
        );
    }

    const totalDividends = shareholder.dividends.filter(d => d.status === 'Paid').reduce((s, d) => s + Number(d.amount), 0);
    const balance = (analyticsData?.balance || 0);
    const daysSinceJoined = Math.floor((new Date().getTime() - new Date(shareholder.joinedDate).getTime()) / (1000 * 60 * 60 * 24));

    return (
        <div className="min-h-screen font-sans pb-20 animate-fade-in">

            {/* TOP NAV */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <Link href="/shop/settings/shareholders" className="p-2.5 rounded-xl bg-white dark:bg-[#161B2E] border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-[#3498DB] hover:border-[#3498DB]/30 transition-all shadow-sm">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 dark:text-white">Profile Saamilaha</h1>
                        <p className="text-xs text-slate-500">Xogta buuxda iyo taariikhda lacag-bixinta</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchData} className="p-2.5 rounded-xl bg-white dark:bg-[#161B2E] border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-[#3498DB] transition-all shadow-sm">
                        <RefreshCw size={16} />
                    </button>
                    <button
                        onClick={() => setShowPayModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-lg shadow-emerald-500/20 transition-all"
                    >
                        <BadgeDollarSign size={16} /> Bixin Dividend
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT COL — Profile card + KPIs */}
                <div className="lg:col-span-1 flex flex-col gap-5">

                    {/* Profile Card */}
                    <div className="bg-white/80 dark:bg-[#161B2E]/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/80 rounded-[2rem] p-6 shadow-sm relative overflow-hidden">
                        {/* Decorative gradient */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#3498DB]/10 blur-[50px] rounded-full pointer-events-none" />

                        <div className="flex flex-col items-center text-center mb-5">
                            {/* Avatar */}
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#3498DB] to-[#2ECC71] flex items-center justify-center text-white font-black text-3xl mb-3 shadow-lg shadow-blue-500/20">
                                {shareholder.name.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">{shareholder.name}</h2>
                            <div className={`mt-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${shareholder.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/30' : 'bg-slate-100 text-slate-500'}`}>
                                {shareholder.status === 'Active' ? 'Firfircoon' : 'Joojiyay'}
                            </div>
                        </div>

                        {/* Contact details */}
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/30">
                                <Mail size={14} className="text-slate-400 flex-shrink-0" />
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{shareholder.email}</span>
                            </div>
                            {shareholder.phone && (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/30">
                                    <Phone size={14} className="text-slate-400 flex-shrink-0" />
                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{shareholder.phone}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/30">
                                <Calendar size={14} className="text-slate-400 flex-shrink-0" />
                                <div>
                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                        {format(new Date(shareholder.joinedDate), 'MMM d, yyyy')}
                                    </span>
                                    <span className="text-[10px] text-slate-400 ml-2">({daysSinceJoined} maalmood)</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/20">
                                <Percent size={14} className="text-[#3498DB] flex-shrink-0" />
                                <span className="text-sm font-black text-[#3498DB]">{shareholder.sharePercentage}% Saamiga</span>
                            </div>
                        </div>

                        {shareholder.notes && (
                            <div className="mt-4 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/20">
                                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Xusuusin</p>
                                <p className="text-xs text-amber-700 dark:text-amber-400">{shareholder.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* KPI Cards */}
                    <KPICard label="Maalgashiga" value={`${Number(shareholder.initialInvestment).toLocaleString()} ETB`} icon={Wallet} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-900/20" />
                    <KPICard label="Faa'iidada Xilliga" value={`${(analyticsData?.profitShare || 0).toLocaleString()} ETB`} icon={TrendingUp} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-900/20" />
                    <KPICard label="Wadarta La Bixiyay" value={`${totalDividends.toLocaleString()} ETB`} icon={DollarSign} color="text-purple-500" bg="bg-purple-50 dark:bg-purple-900/20" />
                    <KPICard label="Hadhka (Balance)" value={`${balance.toLocaleString()} ETB`} sub={balance > 0 ? 'Wali lama bixin' : 'Dhamaan la bixiyay'} icon={BarChart3} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-900/20" />
                    {analyticsData && (
                        <KPICard label="ROI (Return on Investment)" value={`${analyticsData.roi}%`} icon={ArrowUpRight} color="text-teal-500" bg="bg-teal-50 dark:bg-teal-900/20" />
                    )}
                </div>

                {/* RIGHT COL — Dividend history */}
                <div className="lg:col-span-2 flex flex-col gap-6">

                    {/* Dividend Summary Bar */}
                    <div className="bg-white/80 dark:bg-[#161B2E]/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/80 rounded-[2rem] p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <History size={14} /> Taariikhda Lacag-bixinta
                            </h3>
                            <button onClick={() => setShowPayModal(true)} className="flex items-center gap-1 text-[10px] font-black text-[#3498DB] hover:text-[#2980B9] transition-colors">
                                <Plus size={12} /> Bixin Cusub
                            </button>
                        </div>

                        {shareholder.dividends.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 opacity-30">
                                <ReceiptText size={48} className="mb-3" />
                                <p className="text-sm font-black uppercase tracking-widest">Wax lacag bixin ah lama diiwaangelinin</p>
                                <p className="text-xs text-slate-400 mt-1">Bilaabin kadib badhanka "Bixin Dividend"</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {shareholder.dividends.map((div, i) => (
                                    <div key={div.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/20 border border-slate-100/50 dark:border-slate-800/30 hover:border-slate-200 dark:hover:border-slate-700 transition-all group">
                                        {/* Status icon */}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${div.status === 'Paid' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-500'}`}>
                                            {div.status === 'Paid' ? <CheckCircle size={18} /> : <Clock size={18} />}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${div.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'}`}>
                                                    {div.status === 'Paid' ? 'La Bixiyay' : 'La Sugayo'}
                                                </span>
                                                {div.account && <span className="text-[9px] text-slate-400 font-medium">{div.account.name}</span>}
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-medium">
                                                {format(new Date(div.periodStart), 'MMM d')} — {format(new Date(div.periodEnd), 'MMM d, yyyy')}
                                            </p>
                                            {div.note && <p className="text-[9px] text-slate-400 italic mt-0.5 truncate">{div.note}</p>}
                                        </div>

                                        {/* Amount */}
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                                                {Number(div.amount).toLocaleString()} <span className="text-[9px] opacity-50">ETB</span>
                                            </p>
                                            <p className="text-[9px] text-slate-400">
                                                {div.paidDate ? format(new Date(div.paidDate), 'MMM d, yyyy') : format(new Date(div.periodEnd), 'MMM d, yyyy')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Financial Summary */}
                    <div className="bg-white/80 dark:bg-[#161B2E]/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/80 rounded-[2rem] p-6 shadow-sm">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-5">
                            <BarChart3 size={14} /> Xisaabta Guud
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                                { label: 'Dividends Bixiyay', value: shareholder.dividends.filter(d => d.status === 'Paid').length, suffix: 'jeer', color: 'text-blue-600' },
                                { label: 'La Sugayo', value: shareholder.dividends.filter(d => d.status === 'Pending').length, suffix: 'xilli', color: 'text-amber-600' },
                                { label: 'Wadarta Xilliyada', value: shareholder.dividends.length, suffix: 'dhamaan', color: 'text-slate-600' },
                            ].map(stat => (
                                <div key={stat.label} className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/20 border border-slate-100/50 dark:border-slate-800/30 text-center">
                                    <p className={`text-2xl font-black ${stat.color} dark:text-opacity-80 tabular-nums`}>{stat.value}</p>
                                    <p className="text-[9px] text-slate-400 font-medium">{stat.suffix}</p>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Progress bar - investment vs received */}
                        {Number(shareholder.initialInvestment) > 0 && (
                            <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800/50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waxa La Helay vs Maalgashiga</span>
                                    <span className="text-[10px] font-black text-slate-500">
                                        {((totalDividends / Number(shareholder.initialInvestment)) * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#3498DB] to-[#2ECC71] rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.min(100, (totalDividends / Number(shareholder.initialInvestment)) * 100)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1">
                                    <span className="text-[9px] text-slate-400">{totalDividends.toLocaleString()} ETB helay</span>
                                    <span className="text-[9px] text-slate-400">{Number(shareholder.initialInvestment).toLocaleString()} ETB maalgashiga</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* PAY MODAL */}
            {showPayModal && (
                <PayDividendModal
                    shareholder={shareholder}
                    analyticsData={analyticsData}
                    onClose={() => setShowPayModal(false)}
                    onPaid={fetchData}
                />
            )}

            <style jsx global>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeInUp 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
