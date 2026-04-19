'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
    Users, Plus, TrendingUp, DollarSign, PieChart, ArrowLeft,
    Edit, ChevronRight, Search, Filter, Loader2, X, Info,
    CheckCircle, Clock, AlertCircle, Phone, Mail, Calendar,
    Wallet, BarChart3, RefreshCw
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
    dividends: any[];
    totalPaid?: number;
}

interface Analytics {
    totalRevenue: number;
    totalProfit: number;
    allTimeDividendsPaid: number;
    shareholders: {
        id: string;
        name: string;
        sharePercentage: number;
        profitShare: number;
        totalPaid: number;
        balance: number;
        roi: number;
    }[];
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
function ShareholderModal({
    editing,
    onClose,
    onSaved,
}: {
    editing?: Shareholder | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [form, setForm] = useState({
        name: editing?.name || '',
        email: editing?.email || '',
        phone: editing?.phone || '',
        sharePercentage: editing?.sharePercentage?.toString() || '',
        initialInvestment: editing?.initialInvestment?.toString() || '',
        joinedDate: editing?.joinedDate ? format(new Date(editing.joinedDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        notes: editing?.notes || '',
    });
    const [saving, setSaving] = useState(false);

    const ch = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.sharePercentage || !form.joinedDate) {
            toast.error('Buuxi dhammaan meelaha muhiimka ah');
            return;
        }
        setSaving(true);
        try {
            const url = editing ? `/api/shop/shareholders/${editing.id}` : '/api/shop/shareholders';
            const method = editing ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            const data = await res.json();
            if (!res.ok) { toast.error(data.error || 'Qalad ayaa dhacay'); return; }
            toast.success(editing ? 'Saamilaha waa la cusboonaysiiyay!' : 'Saamilaha cusub waa la daray!');
            onSaved();
            onClose();
        } catch { toast.error('Xiriirka shabakadda ee qalad'); }
        finally { setSaving(false); }
    };

    const inputCls = "w-full px-4 py-3 rounded-xl bg-[#F8FAFC] dark:bg-[#161B2E] border border-slate-200 dark:border-slate-700 focus:border-[#3498DB] focus:ring-2 focus:ring-[#3498DB]/10 outline-none text-sm font-medium text-slate-900 dark:text-white transition-all";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#161B2E] rounded-[2rem] shadow-2xl w-full max-w-md border border-slate-200/60 dark:border-slate-700/60 animate-[fadeInUp_0.2s_ease]">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white">
                            {editing ? 'Wax ka Baddal Saamilaha' : 'Ku Dar Saamiley Cusub'}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">Buuxi xogta saamilaha</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-all">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Magaca *</label>
                            <input value={form.name} onChange={e => ch('name', e.target.value)} placeholder="Axmed Cali" className={inputCls} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Email *</label>
                                <input type="email" value={form.email} onChange={e => ch('email', e.target.value)} placeholder="axmed@gmail.com" className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Taleefon</label>
                                <input value={form.phone} onChange={e => ch('phone', e.target.value)} placeholder="+251 9XX XXX" className={inputCls} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Saamiga (%) *</label>
                                <input type="number" min="0.1" max="100" step="0.1" value={form.sharePercentage} onChange={e => ch('sharePercentage', e.target.value)} placeholder="e.g. 40" className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Maalgashiga (ETB)</label>
                                <input type="number" min="0" value={form.initialInvestment} onChange={e => ch('initialInvestment', e.target.value)} placeholder="0" className={inputCls} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Taariikhda Ku Biirista *</label>
                            <input type="date" value={form.joinedDate} onChange={e => ch('joinedDate', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Xusuusin</label>
                            <textarea rows={2} value={form.notes} onChange={e => ch('notes', e.target.value)} placeholder="Macluumaad dheeraad ah..." className={inputCls + ' resize-none'} />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                            Jooji
                        </button>
                        <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-[#3498DB] hover:bg-[#2980B9] text-white font-black text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            {editing ? 'Kaydi' : 'Ku Dar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
const COLORS = ['#3498DB', '#2ECC71', '#E74C3C', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22'];

function DonutChart({ shareholders }: { shareholders: { name: string; sharePercentage: number }[] }) {
    const total = shareholders.reduce((s, sh) => s + sh.sharePercentage, 0);
    const unallocated = Math.max(0, 100 - total);
    const data = [...shareholders.map((sh, i) => ({ label: sh.name, value: sh.sharePercentage, color: COLORS[i % COLORS.length] })),
    ...(unallocated > 0 ? [{ label: 'La Qaybin', value: unallocated, color: '#e2e8f0' }] : [])];

    let cumulative = 0;
    const slices = data.map(d => {
        const startAngle = (cumulative / 100) * 360;
        cumulative += d.value;
        const endAngle = (cumulative / 100) * 360;
        return { ...d, startAngle, endAngle };
    });

    const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
        const a = (angle - 90) * Math.PI / 180;
        return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    };

    const describeArc = (cx: number, cy: number, r: number, inner: number, startAngle: number, endAngle: number) => {
        const s = polarToCartesian(cx, cy, r, endAngle);
        const e = polarToCartesian(cx, cy, r, startAngle);
        const si = polarToCartesian(cx, cy, inner, endAngle);
        const ei = polarToCartesian(cx, cy, inner, startAngle);
        const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
        return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 0 ${e.x} ${e.y} L ${ei.x} ${ei.y} A ${inner} ${inner} 0 ${largeArc} 1 ${si.x} ${si.y} Z`;
    };

    return (
        <div className="flex items-center gap-6">
            <svg viewBox="0 0 120 120" className="w-32 h-32 flex-shrink-0">
                {slices.map((s, i) => (
                    <path key={i} d={describeArc(60, 60, 55, 35, s.startAngle, s.endAngle)} fill={s.color}
                        className="transition-all duration-500 hover:opacity-80" />
                ))}
                <text x="60" y="57" textAnchor="middle" className="fill-slate-700 dark:fill-white" fontSize="10" fontWeight="900">{total.toFixed(0)}%</text>
                <text x="60" y="68" textAnchor="middle" className="fill-slate-400" fontSize="6">Allocated</text>
            </svg>
            <div className="space-y-1.5 flex-1">
                {slices.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{s.label}</span>
                        <span className="ml-auto text-xs font-black text-slate-500">{s.value.toFixed(1)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ShareholdersPage() {
    const [shareholders, setShareholders] = useState<Shareholder[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Shareholder | null>(null);
    const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('Active');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [shRes, anRes] = await Promise.all([
                fetch('/api/shop/shareholders'),
                fetch('/api/shop/shareholders/analytics'),
            ]);
            const shData = await shRes.json();
            const anData = await anRes.json();
            setShareholders(shData.shareholders || []);
            setAnalytics(anData);
        } catch { toast.error('Xogta soo qaadis wuu fashilmay'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const filtered = shareholders.filter(sh => {
        const matchSearch = sh.name.toLowerCase().includes(search.toLowerCase()) ||
            sh.email.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'All' || sh.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalShare = shareholders.filter(s => s.status === 'Active').reduce((s, sh) => s + sh.sharePercentage, 0);

    const statCards = [
        { label: 'Saamileyda', value: shareholders.filter(s => s.status === 'Active').length.toString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { label: 'Saamiyada Lou Qoondeeyay', value: `${totalShare.toFixed(1)}%`, icon: PieChart, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        { label: "Faa'iidada Xilliga", value: `${(analytics?.totalProfit || 0).toLocaleString()} ETB`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        { label: 'Dividends La Bixiyay', value: `${(analytics?.allTimeDividendsPaid || 0).toLocaleString()} ETB`, icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    ];

    return (
        <div className="min-h-screen animate-fade-in font-sans pb-20">
            {/* HEADER */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/shop/settings" className="p-2.5 rounded-xl bg-white dark:bg-[#161B2E] border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-[#3498DB] hover:border-[#3498DB]/30 transition-all shadow-sm">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Saamileyda Dukaanka</h1>
                        <p className="text-xs text-slate-500 mt-0.5">Maamul saamileyda iyo qaybsiga faa'iidada</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchData} className="p-2.5 rounded-xl bg-white dark:bg-[#161B2E] border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-[#3498DB] transition-all shadow-sm">
                        <RefreshCw size={16} />
                    </button>
                    <button
                        onClick={() => { setEditing(null); setShowModal(true); }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3498DB] hover:bg-[#2980B9] text-white font-black text-sm shadow-lg shadow-blue-500/20 transition-all"
                    >
                        <Plus size={16} /> Ku Dar Saamiley
                    </button>
                </div>
            </div>

            {/* STAT CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map(card => (
                    <div key={card.label} className="bg-white/80 dark:bg-[#161B2E]/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/80 rounded-[2rem] p-5 shadow-sm hover:shadow-md transition-all">
                        <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                            <card.icon size={18} className={card.color} />
                        </div>
                        <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums">{loading ? '...' : card.value}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* CHART + TABLE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Donut Chart */}
                <div className="bg-white/80 dark:bg-[#161B2E]/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/80 rounded-[2rem] p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <PieChart size={14} /> Qaybsiga Saamiga
                        </h3>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center h-32"><Loader2 className="animate-spin text-[#3498DB]" size={28} /></div>
                    ) : shareholders.filter(s => s.status === 'Active').length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 opacity-30">
                            <PieChart size={36} className="mb-2" />
                            <p className="text-xs font-black uppercase tracking-widest">Saamiley ma jiro</p>
                        </div>
                    ) : (
                        <DonutChart shareholders={shareholders.filter(s => s.status === 'Active')} />
                    )}

                    {/* Profit Split per shareholder from analytics */}
                    {analytics && analytics.shareholders.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Faa'iidada Xilliga</p>
                            {analytics.shareholders.map(sh => (
                                <div key={sh.id} className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{sh.name}</span>
                                    <span className="text-xs font-black text-emerald-600">{sh.profitShare.toLocaleString()} <span className="text-[8px] opacity-60">ETB</span></span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Shareholders Table */}
                <div className="lg:col-span-2 bg-white/80 dark:bg-[#161B2E]/80 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/80 rounded-[2rem] shadow-sm overflow-hidden">
                    {/* Filters */}
                    <div className="p-4 px-6 border-b border-slate-100 dark:border-slate-800/50 flex items-center gap-3 bg-gradient-to-r from-transparent via-slate-50/40 to-transparent dark:via-slate-800/20">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Raadi saamilaha..."
                                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-[#3498DB]/30 outline-none text-slate-700 dark:text-slate-300 font-medium transition-all"
                            />
                        </div>
                        {(['All', 'Active', 'Inactive'] as const).map(s => (
                            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${statusFilter === s ? 'bg-[#3498DB] text-white shadow-md shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-[#3498DB]'}`}>
                                {s === 'All' ? 'Dhamaan' : s === 'Active' ? 'Firfircoon' : 'Joojiyay'}
                            </button>
                        ))}
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-[#3498DB]" size={32} /></div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 opacity-30">
                            <Users size={40} className="mb-2" />
                            <p className="text-xs font-black uppercase tracking-widest">La ma helin saamilahan</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                                        <th className="text-left py-3 px-6">Saamilaha</th>
                                        <th className="text-center py-3 px-4">Saamiga</th>
                                        <th className="text-right py-3 px-4">Faa'iidada</th>
                                        <th className="text-right py-3 px-4">Xaalada</th>
                                        <th className="text-right py-3 px-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50/50 dark:divide-slate-800/30">
                                    {filtered.map(sh => {
                                        const analyticsData = analytics?.shareholders.find(a => a.id === sh.id);
                                        return (
                                            <tr key={sh.id} className="group hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-colors">
                                                <td className="py-3 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3498DB] to-[#2ECC71] flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                                                            {sh.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-slate-900 dark:text-white group-hover:text-[#3498DB] transition-colors">{sh.name}</p>
                                                            <p className="text-[9px] text-slate-400 font-medium">{sh.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className="inline-block px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-[#3498DB] text-xs font-black">
                                                        {sh.sharePercentage}%
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <p className="text-xs font-black text-emerald-600">{(analyticsData?.profitShare || 0).toLocaleString()} <span className="text-[8px] opacity-50">ETB</span></p>
                                                    <p className="text-[9px] text-slate-400">Xilliga</p>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${sh.status === 'Active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                                                        {sh.status === 'Active' ? <CheckCircle size={8} /> : <Clock size={8} />}
                                                        {sh.status === 'Active' ? 'Firfircoon' : 'Joojiyay'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => { setEditing(sh); setShowModal(true); }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-[#3498DB] transition-all">
                                                            <Edit size={13} />
                                                        </button>
                                                        <Link href={`/shop/settings/shareholders/${sh.id}`} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-[#3498DB] transition-all">
                                                            <ChevronRight size={13} />
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ADD/EDIT MODAL */}
            {showModal && (
                <ShareholderModal
                    editing={editing}
                    onClose={() => { setShowModal(false); setEditing(null); }}
                    onSaved={fetchData}
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
