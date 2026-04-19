'use client';

import React, { useState, useEffect } from 'react';
import {
    Users, CheckCircle2, AlertTriangle, Loader2, X, Wallet,
    Search, Banknote, CreditCard, History, Download, TrendingDown,
    CalendarDays, Minus, Plus, DollarSign, ChevronDown, ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { useShopLang } from '@/contexts/ShopLanguageContext';

interface PayrollEmployee {
    id: string;
    fullName: string;
    role: string;
    phone: string;
    monthlySalary: number;
    paidThisMonth: number;
    totalPaidAllTime: number;
    lastPaymentDate: string | null;
    balance: number;
}

interface PayHistory {
    id: string;
    description: string;
    amount: number;
    transactionDate: string;
    note: string | null;
    employee: { fullName: string; role: string } | null;
}

const inputCls = "w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB] transition-all";

function DeductionRow({ label, amount, onLabelChange, onAmountChange, onRemove }: {
    label: string; amount: string;
    onLabelChange: (v: string) => void;
    onAmountChange: (v: string) => void;
    onRemove: () => void;
}) {
    return (
        <div className="flex gap-2 items-center">
            <input type="text" placeholder="Sababta (Advance...)" value={label}
                onChange={e => onLabelChange(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-medium outline-none focus:ring-2 focus:ring-red-400/20 focus:border-red-400 transition-all"
            />
            <input type="number" placeholder="ETB" value={amount}
                onChange={e => onAmountChange(e.target.value)}
                className="w-24 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-bold text-red-500 outline-none focus:ring-2 focus:ring-red-400/20 focus:border-red-400 transition-all"
            />
            <button type="button" onClick={onRemove} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0">
                <X size={14} />
            </button>
        </div>
    );
}

// ─── Mobile Employee Card ───────────────────────────────────────────────────
function EmployeeCard({ emp, isSelected, onSelect, onPay, processing }: {
    emp: PayrollEmployee;
    isSelected: boolean;
    onSelect: () => void;
    onPay: () => void;
    processing: string | null;
}) {
    const pct = emp.monthlySalary > 0 ? Math.min(100, Math.round((emp.paidThisMonth / emp.monthlySalary) * 100)) : 0;
    const isFullyPaid = emp.balance <= 0;

    return (
        <div
            onClick={onSelect}
            className={`rounded-2xl border transition-all cursor-pointer ${isSelected
                ? 'border-[#3498DB] bg-blue-50/50 dark:bg-blue-900/10 shadow-md shadow-blue-500/10'
                : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1f2937] hover:border-[#3498DB]/40'
                }`}
        >
            <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm flex-shrink-0 ${isSelected ? 'bg-[#3498DB] text-white' : 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-gray-700 dark:to-gray-600 text-gray-600 dark:text-gray-300'}`}>
                        {emp.fullName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{emp.fullName}</p>
                        <p className="text-xs text-gray-400 truncate">{emp.role}</p>
                    </div>
                    {isFullyPaid ? (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-[10px] font-bold flex-shrink-0">
                            <CheckCircle2 size={10} /> Bixiyay
                        </span>
                    ) : (
                        <span className="text-sm font-black text-orange-500 flex-shrink-0">ETB {emp.balance.toLocaleString()}</span>
                    )}
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold mb-1">
                        <span>ETB {emp.paidThisMonth.toLocaleString()} / {emp.monthlySalary.toLocaleString()}</span>
                        <span className="text-[#3498DB]">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#3498DB] to-emerald-400 transition-all duration-500"
                            style={{ width: `${pct}%` }} />
                    </div>
                </div>

                <button
                    onClick={e => { e.stopPropagation(); onPay(); }}
                    disabled={!!processing}
                    className="w-full py-2.5 rounded-xl bg-[#3498DB] hover:bg-[#2980B9] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 transition-all active:scale-95"
                >
                    <Banknote size={13} />
                    {processing === emp.id ? <Loader2 size={13} className="animate-spin" /> : 'Mushaharka Bixi'}
                </button>
            </div>
        </div>
    );
}

export default function PayrollPage() {
    const { t } = useShopLang();
    const { toast } = useToast();

    const [employees, setEmployees] = useState<PayrollEmployee[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [history, setHistory] = useState<PayHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'payroll' | 'history'>('payroll');
    const [search, setSearch] = useState('');
    const [processing, setProcessing] = useState<string | null>(null);
    const [selectedEmp, setSelectedEmp] = useState<PayrollEmployee | null>(null);
    const [showSidebar, setShowSidebar] = useState(false);

    // Pay Modal State
    const [payModal, setPayModal] = useState<PayrollEmployee | null>(null);
    const [payAmount, setPayAmount] = useState('');
    const [payAccountId, setPayAccountId] = useState('');
    const [payNote, setPayNote] = useState('');
    const [payType, setPayType] = useState<'full' | 'partial'>('partial');
    const [deductions, setDeductions] = useState<{ label: string; amount: string }[]>([]);
    const [payError, setPayError] = useState<string | null>(null);

    useEffect(() => {
        fetchPayroll();
        fetchAccounts();
        fetchHistory();
    }, []);

    const fetchPayroll = async () => {
        try { setLoading(true); const res = await fetch('/api/shop/employees/payroll'); const data = await res.json(); setEmployees(data.payroll || []); }
        catch (e) { console.error(e); } finally { setLoading(false); }
    };
    const fetchAccounts = async () => {
        try { const res = await fetch('/api/shop/accounts'); const data = await res.json(); setAccounts(data.accounts || []); if (data.accounts?.length) setPayAccountId(data.accounts[0].id); }
        catch (e) { }
    };
    const fetchHistory = async () => {
        try { const res = await fetch('/api/shop/employees/payroll/history'); const data = await res.json(); setHistory(data.history || []); }
        catch (e) { }
    };

    const openPayModal = (emp: PayrollEmployee) => {
        setPayModal(emp);
        setSelectedEmp(emp);
        setPayAmount(emp.balance > 0 ? emp.balance.toString() : emp.monthlySalary.toString());
        setPayNote('');
        setDeductions([]);
        setPayError(null);
        setShowSidebar(false);
    };

    const totalDeductions = deductions.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0);
    const netPay = Math.max(0, (parseFloat(payAmount) || 0) - totalDeductions);

    const addDeduction = () => setDeductions(d => [...d, { label: '', amount: '' }]);
    const removeDeduction = (i: number) => setDeductions(d => d.filter((_, idx) => idx !== i));
    const updateDeduction = (i: number, field: 'label' | 'amount', val: string) =>
        setDeductions(d => d.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

    const handlePay = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!payModal || !payAmount || !payAccountId) return;
        if (netPay <= 0) { toast({ title: 'Cabsi', description: 'Lacagta bixinta waa inay ka weyn tahay kharashyada', variant: 'destructive' }); return; }
        setProcessing(payModal.id);
        setPayError(null);

        const noteStr = [
            payNote,
            deductions.length > 0 ? `Kharashyo: ${deductions.filter(d => d.label).map(d => `${d.label} ETB ${d.amount}`).join(', ')}` : ''
        ].filter(Boolean).join(' | ');

        try {
            const res = await fetch('/api/shop/employees/payroll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: payModal.id,
                    amount: netPay,
                    accountId: payAccountId,
                    note: noteStr,
                    month: format(new Date(), 'MMMM yyyy'),
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                setPayError(err.error || 'Payment failed');
                return;
            }
            toast({ title: '✅ ' + t('success'), description: `${payModal.fullName} — ETB ${netPay.toLocaleString()} ${t('paid')}` });
            setPayModal(null);
            fetchPayroll(); fetchHistory();
        } catch (err: any) {
            setPayError(err.message || 'Khalad ayaa dhacay');
        } finally { setProcessing(null); }
    };

    const filtered = employees.filter(e =>
        e.fullName.toLowerCase().includes(search.toLowerCase()) ||
        e.role.toLowerCase().includes(search.toLowerCase())
    );

    const totalPayroll = employees.reduce((s, e) => s + e.monthlySalary, 0);
    const totalPaidThisMonth = employees.reduce((s, e) => s + e.paidThisMonth, 0);
    const totalPending = employees.reduce((s, e) => s + Math.max(0, e.balance), 0);
    const fullyPaid = employees.filter(e => e.balance <= 0).length;
    const progressPct = totalPayroll > 0 ? Math.round((totalPaidThisMonth / totalPayroll) * 100) : 0;

    const selEmpHistory = selectedEmp ? history.filter(h => h.employee?.fullName === selectedEmp.fullName) : [];
    const selectedAccount = accounts.find(a => a.id === payAccountId);

    return (
        <div className="min-h-screen animate-fade-in pb-24 font-sans w-full">

            {/* ── HEADER ── */}
            <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#3498DB]/10 dark:bg-[#3498DB]/20 rounded-xl">
                        <Banknote size={22} className="text-[#3498DB]" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                            {t('payroll_title')} <span className="text-[#3498DB]">Management</span>
                        </h1>
                        <p className="text-xs text-gray-400 hidden sm:block">{t('payroll_desc')}</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        const data = history.map(h => ({ Employee: h.employee?.fullName, Date: format(new Date(h.transactionDate), 'dd/MM/yyyy'), Amount: Number(h.amount), Note: h.note || '' }));
                        const csv = ['Employee,Date,Amount,Note', ...data.map(r => `${r.Employee},${r.Date},${r.Amount},"${r.Note}"`)].join('\n');
                        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv])); a.download = `payroll-${format(new Date(), 'yyyy-MM')}.csv`; a.click();
                    }}
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:border-[#3498DB] hover:text-[#3498DB] transition-all flex-shrink-0"
                    title={t('export')}
                >
                    <Download size={16} />
                </button>
            </div>

            {/* ── STATS (2-col mobile, 4-col desktop) ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                {[
                    { label: t('total_payroll'), value: `ETB ${totalPayroll.toLocaleString()}`, icon: Users, color: 'text-[#3498DB]', bg: 'from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/20', border: 'border-blue-100 dark:border-blue-900/30' },
                    { label: t('paid_this_month'), value: `ETB ${totalPaidThisMonth.toLocaleString()}`, icon: CheckCircle2, color: 'text-emerald-500', bg: 'from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20', border: 'border-emerald-100 dark:border-emerald-900/30' },
                    { label: t('remaining_salary'), value: `ETB ${totalPending.toLocaleString()}`, icon: AlertTriangle, color: 'text-orange-500', bg: 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20', border: 'border-orange-100 dark:border-orange-900/30' },
                    { label: t('fully_paid'), value: `${fullyPaid}/${employees.length}`, icon: CreditCard, color: 'text-purple-500', bg: 'from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/20', border: 'border-purple-100 dark:border-purple-900/30' },
                ].map(s => (
                    <div key={s.label} className={`bg-gradient-to-br ${s.bg} border ${s.border} rounded-2xl p-3 sm:p-4`}>
                        <div className="flex items-center gap-1.5 mb-2">
                            <s.icon size={13} className={s.color} />
                            <span className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-wider leading-tight">{s.label}</span>
                        </div>
                        <p className="text-base sm:text-xl font-black text-gray-900 dark:text-white leading-tight">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* ── PROGRESS BAR ── */}
            <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-2xl p-4 mb-5 shadow-sm">
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
                        {format(new Date(), 'MMMM yyyy')} — Horumarinta
                    </span>
                    <span className="text-xs font-black text-[#3498DB]">{progressPct}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#3498DB] to-[#2ECC71] transition-all duration-700"
                        style={{ width: `${progressPct}%` }} />
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] font-medium text-gray-400">
                    <span>ETB 0</span>
                    <span>ETB {totalPayroll.toLocaleString()}</span>
                </div>
            </div>

            {/* ── TABS ── */}
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-5">
                {[['payroll', t('employees_title'), <Users key="u" size={13} />], ['history', t('history'), <History key="h" size={13} />]].map(([key, label, icon]) => (
                    <button key={key as string} onClick={() => setTab(key as any)}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${tab === key ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                        {icon as React.ReactNode} {label as string}
                    </button>
                ))}
            </div>

            {/* ── PAYROLL TAB ── */}
            {tab === 'payroll' && (
                <div className="flex flex-col lg:flex-row gap-5">

                    {/* Left: Cards */}
                    <div className="flex-1 min-w-0">
                        {/* Search */}
                        <div className="mb-4 relative">
                            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="text" placeholder={t('search_placeholder')} value={search} onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm font-medium outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB]" />
                        </div>

                        {loading ? (
                            <div className="h-48 flex items-center justify-center">
                                <Loader2 className="animate-spin text-[#3498DB]" size={32} />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="py-16 text-center text-gray-400 text-sm">{t('no_employees')}</div>
                        ) : (
                            <>
                                {/* Mobile: Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:hidden">
                                    {filtered.map(emp => (
                                        <EmployeeCard key={emp.id} emp={emp}
                                            isSelected={selectedEmp?.id === emp.id}
                                            onSelect={() => {
                                                setSelectedEmp(prev => prev?.id === emp.id ? null : emp);
                                                setShowSidebar(true);
                                            }}
                                            onPay={() => openPayModal(emp)}
                                            processing={processing}
                                        />
                                    ))}
                                </div>

                                {/* Desktop: Table */}
                                <div className="hidden lg:block bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-gray-50 dark:border-gray-800">
                                                    {[t('employee_name'), t('salary'), t('paid_this_month'), t('balance'), t('actions')].map(h => (
                                                        <th key={h} className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                                                {filtered.map(emp => {
                                                    const isFullyPaid = emp.balance <= 0;
                                                    const pct = emp.monthlySalary > 0 ? Math.min(100, Math.round((emp.paidThisMonth / emp.monthlySalary) * 100)) : 0;
                                                    const isSelected = selectedEmp?.id === emp.id;
                                                    return (
                                                        <tr key={emp.id} onClick={() => setSelectedEmp(isSelected ? null : emp)}
                                                            className={`transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/70 dark:bg-blue-900/10' : 'hover:bg-gray-50/60 dark:hover:bg-gray-800/30'}`}>
                                                            <td className="px-5 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${isSelected ? 'bg-[#3498DB] text-white' : 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-gray-700 dark:to-gray-600 text-gray-600 dark:text-gray-300'}`}>
                                                                        {emp.fullName.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-gray-900 dark:text-white text-sm">{emp.fullName}</p>
                                                                        <p className="text-xs text-gray-400">{emp.role}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4"><span className="font-black text-gray-900 dark:text-white text-sm">ETB {emp.monthlySalary.toLocaleString()}</span></td>
                                                            <td className="px-5 py-4">
                                                                <div>
                                                                    <span className="font-bold text-emerald-500 text-sm">ETB {emp.paidThisMonth.toLocaleString()}</span>
                                                                    <div className="mt-1 w-24 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                        <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${pct}%` }} />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                {isFullyPaid ? (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-xs font-bold">
                                                                        <CheckCircle2 size={11} /> {t('paid')}
                                                                    </span>
                                                                ) : (
                                                                    <span className="font-bold text-orange-500 text-sm">ETB {emp.balance.toLocaleString()}</span>
                                                                )}
                                                            </td>
                                                            <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                                                                <button onClick={() => openPayModal(emp)}
                                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all bg-[#3498DB] hover:bg-[#2980B9] text-white shadow-md shadow-blue-500/20 active:scale-95">
                                                                    <Banknote size={13} /> {t('pay')}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Desktop Right Sidebar */}
                    {selectedEmp && (
                        <div className="hidden lg:flex w-72 flex-shrink-0 flex-col gap-4 animate-fade-in">
                            {/* Profile */}
                            <div className="bg-gradient-to-br from-[#3498DB] to-[#2980B9] rounded-2xl p-5 text-white shadow-xl shadow-blue-500/20">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center font-black text-lg">
                                        {selectedEmp.fullName.charAt(0)}
                                    </div>
                                    <button onClick={() => setSelectedEmp(null)} className="text-white/60 hover:text-white"><X size={16} /></button>
                                </div>
                                <h3 className="font-black text-lg leading-tight">{selectedEmp.fullName}</h3>
                                <p className="text-blue-200 text-xs font-medium mt-0.5">{selectedEmp.role}</p>
                                {selectedEmp.phone && <p className="text-blue-200 text-xs mt-1">📞 {selectedEmp.phone}</p>}
                            </div>

                            {/* Breakdown */}
                            <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-4">Mushaharka Kooban</p>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Mushaharka Bisheed', val: `ETB ${selectedEmp.monthlySalary.toLocaleString()}`, color: 'text-gray-900 dark:text-white' },
                                        { label: 'Bishaan La Bixiyay', val: `ETB ${selectedEmp.paidThisMonth.toLocaleString()}`, color: 'text-emerald-500' },
                                        { label: 'Haraaga', val: `ETB ${Math.max(0, selectedEmp.balance).toLocaleString()}`, color: selectedEmp.balance > 0 ? 'text-orange-500' : 'text-gray-400' },
                                        { label: 'Wadarta Jeer', val: `ETB ${selectedEmp.totalPaidAllTime.toLocaleString()}`, color: 'text-[#3498DB]' },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500 font-medium">{item.label}</span>
                                            <span className={`text-sm font-black ${item.color}`}>{item.val}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
                                    <div className="flex justify-between text-xs font-bold text-gray-400 mb-1.5">
                                        <span>Horumarinta</span>
                                        <span>{selectedEmp.monthlySalary > 0 ? Math.min(100, Math.round((selectedEmp.paidThisMonth / selectedEmp.monthlySalary) * 100)) : 0}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full bg-gradient-to-r from-[#3498DB] to-emerald-400 transition-all"
                                            style={{ width: `${selectedEmp.monthlySalary > 0 ? Math.min(100, Math.round((selectedEmp.paidThisMonth / selectedEmp.monthlySalary) * 100)) : 0}%` }} />
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                                    <CalendarDays size={12} />
                                    <span>{selectedEmp.lastPaymentDate ? `Bixintii dambe: ${format(new Date(selectedEmp.lastPaymentDate), 'dd MMM yyyy')}` : 'Wali lacag lama bixin'}</span>
                                </div>
                                <button onClick={() => openPayModal(selectedEmp)}
                                    className="mt-4 w-full py-2.5 rounded-xl bg-[#3498DB] hover:bg-[#2980B9] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                                    <Banknote size={15} /> {t('pay_salary')}
                                </button>
                            </div>

                            {selEmpHistory.length > 0 && (
                                <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">Taariikhda Bixinta</p>
                                    <div className="space-y-2.5 max-h-48 overflow-y-auto">
                                        {selEmpHistory.slice(0, 8).map(h => (
                                            <div key={h.id} className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-bold text-gray-900 dark:text-white">ETB {Number(h.amount).toLocaleString()}</p>
                                                    <p className="text-[10px] text-gray-400">{format(new Date(h.transactionDate), 'dd MMM yyyy')}</p>
                                                </div>
                                                <span className="text-[10px] text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-lg">✓</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── HISTORY TAB ── */}
            {tab === 'history' && (
                <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
                    {history.length === 0 ? (
                        <div className="py-16 text-center text-gray-400 text-sm">{t('no_data')}</div>
                    ) : (
                        <>
                            {/* Mobile history: Cards */}
                            <div className="lg:hidden divide-y divide-gray-50 dark:divide-gray-800">
                                {history.map(h => (
                                    <div key={h.id} className="p-4 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#3498DB] font-black text-xs flex-shrink-0">
                                            {h.employee?.fullName?.charAt(0) || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{h.employee?.fullName || '-'}</p>
                                            <p className="text-[10px] text-gray-400">{format(new Date(h.transactionDate), 'dd MMM yyyy')} {h.note ? `· ${h.note}` : ''}</p>
                                        </div>
                                        <span className="font-black text-[#3498DB] text-sm flex-shrink-0">ETB {Number(h.amount).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                            {/* Desktop history: Table */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-50 dark:border-gray-800">
                                            {[t('employee_name'), t('description'), t('amount'), t('date'), t('notes')].map(h => (
                                                <th key={h} className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                                        {history.map(h => (
                                            <tr key={h.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#3498DB] font-black text-xs">{h.employee?.fullName?.charAt(0) || '?'}</div>
                                                        <div>
                                                            <p className="font-bold text-sm text-gray-900 dark:text-white">{h.employee?.fullName || '-'}</p>
                                                            <p className="text-xs text-gray-400">{h.employee?.role}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-[200px] truncate">{h.description}</td>
                                                <td className="px-5 py-4"><span className="font-black text-[#3498DB]">ETB {Number(h.amount).toLocaleString()}</span></td>
                                                <td className="px-5 py-4 text-sm text-gray-500">{format(new Date(h.transactionDate), 'dd MMM yyyy')}</td>
                                                <td className="px-5 py-4 text-sm text-gray-400 max-w-[160px] truncate">{h.note || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── MOBILE: Employee Detail Bottom Sheet ── */}
            {selectedEmp && showSidebar && tab === 'payroll' && (
                <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSidebar(false)} />
                    {/* Sheet */}
                    <div className="relative bg-white dark:bg-[#1f2937] rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up">
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#3498DB] to-[#2980B9] mx-4 rounded-2xl p-5 text-white mt-2 mb-4 relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center font-black text-lg">
                                        {selectedEmp.fullName.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-base">{selectedEmp.fullName}</h3>
                                        <p className="text-blue-200 text-xs">{selectedEmp.role}</p>
                                        {selectedEmp.phone && <p className="text-blue-200 text-xs">📞 {selectedEmp.phone}</p>}
                                    </div>
                                </div>
                                <button onClick={() => setShowSidebar(false)} className="text-white/70 hover:text-white p-1">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="px-4 pb-6 space-y-4">
                            {/* Salary breakdown */}
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: 'Mushaharka', val: `ETB ${selectedEmp.monthlySalary.toLocaleString()}`, color: 'text-gray-900 dark:text-white' },
                                    { label: 'La Bixiyay', val: `ETB ${selectedEmp.paidThisMonth.toLocaleString()}`, color: 'text-emerald-500' },
                                    { label: 'Haraaga', val: `ETB ${Math.max(0, selectedEmp.balance).toLocaleString()}`, color: selectedEmp.balance > 0 ? 'text-orange-500' : 'text-gray-400' },
                                ].map(item => (
                                    <div key={item.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">{item.label}</p>
                                        <p className={`text-sm font-black ${item.color} leading-tight`}>{item.val}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Progress */}
                            <div>
                                <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1">
                                    <span>Horumarinta</span>
                                    <span>{selectedEmp.monthlySalary > 0 ? Math.min(100, Math.round((selectedEmp.paidThisMonth / selectedEmp.monthlySalary) * 100)) : 0}%</span>
                                </div>
                                <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-gradient-to-r from-[#3498DB] to-emerald-400 transition-all"
                                        style={{ width: `${selectedEmp.monthlySalary > 0 ? Math.min(100, Math.round((selectedEmp.paidThisMonth / selectedEmp.monthlySalary) * 100)) : 0}%` }} />
                                </div>
                            </div>

                            {/* History */}
                            {selEmpHistory.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Taariikhda Bixinta</p>
                                    <div className="space-y-2">
                                        {selEmpHistory.slice(0, 5).map(h => (
                                            <div key={h.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5">
                                                <div>
                                                    <p className="text-xs font-bold text-gray-900 dark:text-white">ETB {Number(h.amount).toLocaleString()}</p>
                                                    <p className="text-[10px] text-gray-400">{format(new Date(h.transactionDate), 'dd MMM yyyy')}</p>
                                                </div>
                                                <span className="text-[10px] text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">✓ Bixiyay</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Pay button */}
                            <button onClick={() => openPayModal(selectedEmp)}
                                className="w-full py-3.5 rounded-2xl bg-[#3498DB] hover:bg-[#2980B9] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all active:scale-95">
                                <Banknote size={16} /> {t('pay_salary')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── PAY MODAL (full-screen mobile, centered desktop) ── */}
            {payModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-[#1f2937] w-full sm:max-w-lg sm:rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col rounded-t-3xl">

                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-[#3498DB] to-[#2980B9] p-5 text-white relative overflow-hidden flex-shrink-0">
                            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
                            <div className="relative z-10 flex items-start justify-between">
                                <div>
                                    <p className="text-[9px] font-black opacity-70 uppercase tracking-widest mb-0.5">{t('pay_salary')}</p>
                                    <h3 className="text-lg font-black">{payModal.fullName}</h3>
                                    <p className="text-blue-200 text-xs">{payModal.role}</p>
                                </div>
                                <button onClick={() => setPayModal(null)} className="text-white/70 hover:text-white p-1"><X size={20} /></button>
                            </div>
                            <div className="relative z-10 mt-3 grid grid-cols-3 gap-2 text-center">
                                {[
                                    { label: 'Mushaharka', val: `ETB ${payModal.monthlySalary.toLocaleString()}` },
                                    { label: t('paid'), val: `ETB ${payModal.paidThisMonth.toLocaleString()}` },
                                    { label: 'Haraaga', val: `ETB ${Math.max(0, payModal.balance).toLocaleString()}` },
                                ].map(s => (
                                    <div key={s.label} className="bg-white/10 rounded-xl p-2">
                                        <p className="text-[8px] font-black opacity-70 uppercase">{s.label}</p>
                                        <p className="text-xs font-black mt-0.5">{s.val}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Modal Body — scrollable */}
                        <div className="overflow-y-auto flex-1">
                            <form onSubmit={handlePay} className="p-4 sm:p-5 space-y-4">

                                {/* Payment type */}
                                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                                    {[['full', '💯 Buuxa'], ['partial', '✂️ Qayb']].map(([key, label]) => (
                                        <button type="button" key={key}
                                            onClick={() => { setPayType(key as any); setPayAmount(key === 'full' ? payModal.monthlySalary.toString() : (payModal.balance > 0 ? payModal.balance.toString() : '')); }}
                                            className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all ${payType === key ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                                            {label}
                                        </button>
                                    ))}
                                </div>

                                {/* Amount */}
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5 block">{t('amount')} (ETB)</label>
                                    <div className="flex gap-2 items-center">
                                        <button type="button" onClick={() => setPayAmount(v => String(Math.max(0, (parseFloat(v) || 0) - 1000)))}
                                            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-red-300 text-gray-400 hover:text-red-400 transition-all flex-shrink-0"><Minus size={16} /></button>
                                        <input type="number" required min="1" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                                            className={inputCls + ' text-center text-xl font-black'} />
                                        <button type="button" onClick={() => setPayAmount(v => String((parseFloat(v) || 0) + 1000))}
                                            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-[#3498DB]/50 text-gray-400 hover:text-[#3498DB] transition-all flex-shrink-0"><Plus size={16} /></button>
                                    </div>
                                </div>

                                {/* Deductions */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                            <TrendingDown size={11} className="text-red-400" /> Kharashyo
                                        </label>
                                        <button type="button" onClick={addDeduction}
                                            className="text-xs font-bold text-[#3498DB] hover:underline flex items-center gap-1">
                                            <Plus size={12} /> Kudar
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {deductions.map((d, i) => (
                                            <DeductionRow key={i} label={d.label} amount={d.amount}
                                                onLabelChange={v => updateDeduction(i, 'label', v)}
                                                onAmountChange={v => updateDeduction(i, 'amount', v)}
                                                onRemove={() => removeDeduction(i)}
                                            />
                                        ))}
                                    </div>
                                    {deductions.length === 0 && <p className="text-xs text-gray-400 italic">Kuma jiraan kharashyo</p>}
                                </div>

                                {/* Net Pay Box */}
                                <div className={`rounded-xl p-3.5 border-2 transition-all ${netPay > 0 ? 'bg-[#3498DB]/5 border-[#3498DB]/20' : 'bg-red-50 border-red-200'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            {parseFloat(payAmount) > 0 && (
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span>Mushaharka:</span>
                                                    <span className="font-bold">ETB {(parseFloat(payAmount) || 0).toLocaleString()}</span>
                                                </div>
                                            )}
                                            {totalDeductions > 0 && (
                                                <div className="flex items-center gap-2 text-xs text-red-500">
                                                    <Minus size={10} /><span>Kharashyo: ETB {totalDeductions.toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">La Bixinayaa</p>
                                            <p className={`text-xl font-black ${netPay > 0 ? 'text-[#3498DB]' : 'text-red-500'}`}>ETB {netPay.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Account */}
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5 block">{t('select_account')}</label>
                                    <div className="relative">
                                        <Wallet size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <select value={payAccountId} onChange={e => setPayAccountId(e.target.value)} required
                                            className={inputCls + ' pl-9 appearance-none cursor-pointer'}>
                                            <option value="">{t('select_account')}</option>
                                            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} (ETB {Number(a.balance).toLocaleString()})</option>)}
                                        </select>
                                    </div>
                                    {payAccountId && selectedAccount && (
                                        Number(selectedAccount.balance) < netPay ? (
                                            <div className="mt-2 flex items-start gap-2 p-2.5 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                                                <AlertTriangle size={13} className="text-orange-500 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-xs font-bold text-orange-600">Xisaabta lacagteeda ma filna!</p>
                                                    <p className="text-[10px] text-orange-500">Balance: ETB {Number(selectedAccount.balance).toLocaleString()} · Lacag soo geli ama xisaab kale dooro.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-2 flex items-center gap-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                                                <CheckCircle2 size={12} className="text-emerald-500" />
                                                <p className="text-[10px] font-bold text-emerald-600">Xisaabta waa fiican — ETB {Number(selectedAccount.balance).toLocaleString()}</p>
                                            </div>
                                        )
                                    )}
                                </div>

                                {/* Note */}
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5 block">{t('notes')} ({t('optional')})</label>
                                    <input type="text" value={payNote} onChange={e => setPayNote(e.target.value)}
                                        placeholder="Tusaale: Advance, Bonus, Mushaharka Janaayo..."
                                        className={inputCls + ' text-sm'} />
                                </div>

                                {/* Error banner */}
                                {payError && (
                                    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                        <div className="p-1.5 bg-red-100 dark:bg-red-900/40 rounded-lg flex-shrink-0">
                                            <AlertTriangle size={15} className="text-red-500" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-black text-red-600 dark:text-red-400 mb-0.5">Lacag-bixintu way guuldareysatay</p>
                                            <p className="text-xs text-red-500 leading-relaxed">{payError}</p>
                                            <p className="text-[10px] text-red-400 mt-1 font-bold">💡 Xal: Accounting → Accounts lacag soo geli ama xisaab kale dooro.</p>
                                        </div>
                                        <button type="button" onClick={() => setPayError(null)} className="text-red-300 hover:text-red-500 flex-shrink-0"><X size={14} /></button>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 pb-2">
                                    <button type="button" onClick={() => setPayModal(null)}
                                        className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-sm">
                                        {t('cancel')}
                                    </button>
                                    <button type="submit"
                                        disabled={!!processing || netPay <= 0 || (payAccountId ? Number(selectedAccount?.balance) < netPay : false)}
                                        className="flex-[2] py-3 rounded-xl bg-[#3498DB] hover:bg-[#2980B9] text-white font-black shadow-lg shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm transition-all active:scale-95">
                                        {processing ? <Loader2 className="animate-spin" size={16} /> : <Banknote size={16} />}
                                        {processing ? t('loading') : `${t('confirm_payment')} — ETB ${netPay.toLocaleString()}`}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
