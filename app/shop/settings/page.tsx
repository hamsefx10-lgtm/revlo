'use client';

import React, { useState, useEffect } from 'react';
import {
    Save,
    Store,
    CreditCard,
    Lock,
    Printer,
    Users,
    Loader2,
    Phone,
    Mail,
    Globe,
    MapPin,
    Hash,
    Receipt,
    ShieldCheck,
    KeyRound,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertTriangle,
    MessageCircle,
    Smartphone,
    RefreshCcw,
    History,
    Info,
    PieChart
} from 'lucide-react';
import UltraIcon from '@/components/shop/ui/UltraIcon';
import { toast } from 'sonner';
import Link from 'next/link';
import { useShopLang } from '@/contexts/ShopLanguageContext';

const inputCls = "w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-2 focus:ring-[#3498DB]/10 outline-none font-medium text-gray-900 dark:text-white transition-all";
const labelCls = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2";

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
    return (
        <div
            onClick={onChange}
            className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 flex-shrink-0 ${value ? 'bg-[#3498DB]' : 'bg-gray-300 dark:bg-gray-700'}`}
        >
            <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-6' : 'translate-x-0'}`} />
        </div>
    );
}

function SettingRow({ label, description, value, onChange, badge }: {
    label: string;
    description: string;
    value: boolean;
    onChange: () => void;
    badge?: string;
}) {
    return (
        <div className="flex items-center justify-between gap-6 py-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <div className="flex-1">
                <p className="font-bold text-gray-800 dark:text-white text-sm">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                {value && badge && (
                    <span className="mt-1.5 text-xs font-bold text-[#3498DB] bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-lg inline-block">
                        ✓ {badge}
                    </span>
                )}
            </div>
            <Toggle value={value} onChange={onChange} />
        </div>
    );
}

export default function SettingsPage() {
    const { t } = useShopLang();
    const [activeTab, setActiveTab] = useState('General');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [company, setCompany] = useState({
        name: '',
        phone: '',
        address: '',
        email: '',
        website: '',
        taxId: '',
        taxRate: '',
        receiptHeader: '',
        receiptFooter: '',
        requireReceiptNumber: false,
    });
    const [rate, setRate] = useState<string>('');
    const [currentRate, setCurrentRate] = useState<any>(null);

    useEffect(() => { fetchCompany(); }, []);

    const fetchCompany = async () => {
        try {
            const res = await fetch('/api/shop/company');
            const data = await res.json();

            // Also fetch current rate
            const rateRes = await fetch('/api/settings/exchange-rate');
            const rateData = await rateRes.json();
            if (rateData.rate) {
                setCurrentRate(rateData.rate);
                setRate(rateData.rate.rate.toString());
            }

            if (data.company) {
                setCompany({
                    name: data.company.name || '',
                    phone: data.company.phone || '',
                    address: data.company.address || '',
                    email: data.company.email || '',
                    website: data.company.website || '',
                    taxId: data.company.taxId || '',
                    taxRate: data.company.taxRate ? data.company.taxRate.toString() : '',
                    receiptHeader: data.company.receiptHeader || '',
                    receiptFooter: data.company.receiptFooter || '',
                    requireReceiptNumber: Boolean(data.company.requireReceiptNumber),
                });
            }
        } catch (err) {
            console.error('Error fetching company:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/shop/company', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(company),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to save settings');
            }

            toast.success('Settings saved successfully!');
        } catch (err: any) {
            toast.error(err.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const ch = (field: string, value: any) => setCompany(prev => ({ ...prev, [field]: value }));

    const MENU_ITEMS = [
        { id: 'General', icon: Store, label: t('company_info'), href: null },
        { id: 'Payment', icon: CreditCard, label: t('payment_method'), href: null },
        { id: 'Currency', icon: Globe, label: t('currency'), href: null },
        { id: 'Receipt', icon: Printer, label: t('receipt_header'), href: null },
        { id: 'WhatsApp', icon: MessageCircle, label: t('whatsapp'), href: null },
        { id: 'Users', icon: Users, label: t('employees_title'), href: null },
        { id: 'Security', icon: Lock, label: 'Security', href: null },
        { id: 'Shareholders', icon: PieChart, label: 'Saamileyda', href: '/shop/settings/shareholders' },
    ];

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#3498DB]" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{t('settings_title')}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t('settings_desc')}</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 rounded-xl bg-[#3498DB] hover:bg-[#2980B9] text-white font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all flex items-center gap-2 disabled:opacity-70"
                >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {t('save_settings')}
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">

                {/* SIDEBAR */}
                <div className="w-full lg:w-64 flex-shrink-0">
                    <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-4 sticky top-6 shadow-sm">
                        {MENU_ITEMS.map((item) => (
                            item.href ? (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all mb-1.5 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                                >
                                    <item.icon size={18} className="opacity-60" />
                                    {item.label}
                                </Link>
                            ) : (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all mb-1.5 ${activeTab === item.id
                                        ? 'bg-[#3498DB] text-white shadow-lg shadow-blue-500/25'
                                        : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    <item.icon size={18} className={activeTab === item.id ? 'opacity-100' : 'opacity-60'} />
                                    {item.label}
                                </button>
                            )
                        ))}
                    </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 space-y-6">

                    {/* ── GENERAL ── */}
                    {activeTab === 'General' && (
                        <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <UltraIcon icon={Store} variant="primary" />
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white">{t('company_name')}</h2>
                                    <p className="text-sm text-gray-500">Basic information about your business.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelCls}>{t('company_name')}</label>
                                    <div className="relative">
                                        <Store size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <input type="text" value={company.name} onChange={e => ch('name', e.target.value)}
                                            className={inputCls + ' pl-11'} placeholder="Your Shop Name" />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>{t('phone')}</label>
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <input type="tel" value={company.phone} onChange={e => ch('phone', e.target.value)}
                                            className={inputCls + ' pl-11'} placeholder="+251 9XX XXX XXX" />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>{t('email')}</label>
                                    <div className="relative">
                                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <input type="email" value={company.email} onChange={e => ch('email', e.target.value)}
                                            className={inputCls + ' pl-11'} placeholder="shop@example.com" />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Website</label>
                                    <div className="relative">
                                        <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <input type="url" value={company.website} onChange={e => ch('website', e.target.value)}
                                            className={inputCls + ' pl-11'} placeholder="https://yourshop.com" />
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelCls}>{t('address')}</label>
                                    <div className="relative">
                                        <MapPin size={16} className="absolute left-4 top-4 text-gray-400 pointer-events-none" />
                                        <input type="text" value={company.address} onChange={e => ch('address', e.target.value)}
                                            className={inputCls + ' pl-11'} placeholder="Street, City, Country" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── PAYMENT & TAX ── */}
                    {activeTab === 'Payment' && (
                        <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <UltraIcon icon={CreditCard} variant="secondary" />
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white">Payment & Tax</h2>
                                    <p className="text-sm text-gray-500">Tax rates, IDs, and receipt number requirements.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                                <div>
                                    <label className={labelCls}>{t('tax_rate')} (%)</label>
                                    <div className="relative">
                                        <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <input type="number" min="0" max="100" value={company.taxRate}
                                            onChange={e => ch('taxRate', e.target.value)}
                                            className={inputCls + ' pl-11'} placeholder="e.g. 15" />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Applied when VAT toggle is ON in Manual Entry / POS</p>
                                </div>
                                <div>
                                    <label className={labelCls}>{t('tax_title')}</label>
                                    <div className="relative">
                                        <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <input type="text" value={company.taxId} onChange={e => ch('taxId', e.target.value)}
                                            className={inputCls + ' pl-11'} placeholder="e.g. TIN-0001234" />
                                    </div>
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="pt-4">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Sale Entry Rules</p>
                                <SettingRow
                                    label="Require Supplier Receipt Number"
                                    description="Staff must enter the supplier's receipt/invoice number on every manual sale. Disable for shops that don't always receive printed receipts."
                                    value={company.requireReceiptNumber}
                                    onChange={() => ch('requireReceiptNumber', !company.requireReceiptNumber)}
                                    badge="Receipt # required on Manual Entry"
                                />
                            </div>
                        </div>
                    )}

                    {/* ── RECEIPT SETTINGS ── */}
                    {activeTab === 'Receipt' && (
                        <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <UltraIcon icon={Printer} variant="accent" />
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white">Receipt Customization</h2>
                                    <p className="text-sm text-gray-500">Customize the header and footer on printed and digital receipts.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className={labelCls}>{t('receipt_header')}</label>
                                    <input type="text" value={company.receiptHeader} onChange={e => ch('receiptHeader', e.target.value)}
                                        className={inputCls} placeholder="e.g. Thank you for shopping at Revlo!" />
                                    <p className="text-xs text-gray-400 mt-1">Shown at the top of every receipt printout</p>
                                </div>
                                <div>
                                    <label className={labelCls}>{t('receipt_footer')}</label>
                                    <textarea rows={4} value={company.receiptFooter} onChange={e => ch('receiptFooter', e.target.value)}
                                        className={inputCls + ' resize-none'} placeholder="e.g. No returns after 7 days. Contact us: +251900000000" />
                                    <p className="text-xs text-gray-400 mt-1">Shown at the bottom — return policies, contact info, etc.</p>
                                </div>

                                {/* Live preview */}
                                {(company.receiptHeader || company.receiptFooter) && (
                                    <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-5 bg-gray-50 dark:bg-gray-900">
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-3">Preview</p>
                                        <div className="font-mono text-sm text-center space-y-2 text-gray-700 dark:text-gray-300">
                                            {company.receiptHeader && <p className="font-bold">{company.receiptHeader}</p>}
                                            <div className="border-t border-b border-gray-300 dark:border-gray-700 py-2 text-xs text-gray-400">
                                                ···· sale items would appear here ····
                                            </div>
                                            {company.receiptFooter && <p className="text-xs">{company.receiptFooter}</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── WHATSAPP ── */}
                    {activeTab === 'WhatsApp' && (
                        <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <UltraIcon icon={MessageCircle} variant="primary" />
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white">WhatsApp Integration</h2>
                                    <p className="text-sm text-gray-500">Connect your WhatsApp to send receipts directly to customers.</p>
                                </div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl border border-green-100 dark:border-green-800 mb-6">
                                <h3 className="font-bold text-green-800 dark:text-green-400 mb-2">Ku xidh nambarkaaga WhatsApp-ka</h3>
                                <p className="text-sm text-green-700 dark:text-green-500 mb-6">
                                    Ku xir WhatsApp-ka shirkadda si aad macaamiisha ugu dirto rasiidka iibka (receipts) si toos ah marka ay alaabta iibsadaan ama lacag bixiyaan.
                                </p>
                                <Link
                                    href="/shop/settings/whatsapp"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-bold transition-all shadow-lg shadow-green-500/30"
                                >
                                    <Smartphone size={18} /> {t('connect_whatsapp')}
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* ── USERS & ROLES ── */}
                    {activeTab === 'Users' && (
                        <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <UltraIcon icon={Users} variant="primary" />
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white">Users & Roles</h2>
                                    <p className="text-sm text-gray-500">Manage staff accounts and access levels.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                {[
                                    { role: 'Admin', desc: 'Full access to all modules, settings, and reports', color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
                                    { role: 'Manager', desc: 'Access to all shop modules except Settings', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' },
                                    { role: 'Cashier', desc: 'POS and Manual Entry only', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
                                    { role: 'Accountant', desc: 'Accounting, Reports, Sales History access', color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
                                ].map(r => (
                                    <div key={r.role} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <span className={`inline-block px-3 py-1 rounded-lg text-xs font-black mb-2 ${r.color}`}>{r.role}</span>
                                        <p className="text-sm text-gray-500">{r.desc}</p>
                                    </div>
                                ))}
                            </div>
                            <Link
                                href="/shop/employees"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[#3498DB] hover:bg-[#2980B9] text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all"
                            >
                                <Users size={18} /> {t('employees_title')}
                            </Link>
                        </div>
                    )}

                    {/* ── SECURITY ── */}
                    {activeTab === 'Security' && (
                        /* ... existing security code ... */
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm">
                                <div className="flex items-center gap-4 mb-8">
                                    <UltraIcon icon={ShieldCheck} variant="secondary" />
                                    <div>
                                        <h2 className="text-xl font-black text-gray-900 dark:text-white">Security Overview</h2>
                                        <p className="text-sm text-gray-500">Access controls and session management.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                    {[
                                        { label: 'Active Sessions', value: '1', icon: ShieldCheck, color: 'text-green-500' },
                                        { label: 'Failed Logins (24h)', value: '0', icon: AlertTriangle, color: 'text-yellow-500' },
                                        { label: '2FA Status', value: 'Disabled', icon: KeyRound, color: 'text-red-500' },
                                    ].map(s => (
                                        <div key={s.label} className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                                            <s.icon size={20} className={s.color + ' mb-2'} />
                                            <p className="text-2xl font-black text-gray-900 dark:text-white">{s.value}</p>
                                            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-1">
                                    <SettingRow
                                        label="Require Password on Refunds"
                                        description="Staff must enter manager password to process a refund."
                                        value={false}
                                        onChange={() => toast.info('This feature is coming soon')}
                                    />
                                    <SettingRow
                                        label="Auto-logout after inactivity"
                                        description="Automatically log out cashier sessions after 30 minutes of inactivity."
                                        value={false}
                                        onChange={() => toast.info('This feature is coming soon')}
                                    />
                                    <SettingRow
                                        label="Two-Factor Authentication (2FA)"
                                        description="Require OTP for all admin logins."
                                        value={false}
                                        onChange={() => toast.info('This feature is coming soon')}
                                    />
                                </div>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 flex items-start gap-3">
                                <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">Security features are under development</p>
                                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Password policies and full 2FA will be available in the next release.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── CURRENCY ── */}
                    {activeTab === 'Currency' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm">
                                <div className="flex items-center gap-4 mb-8">
                                    <UltraIcon icon={RefreshCcw} variant="primary" />
                                    <div>
                                        <h2 className="text-xl font-black text-gray-900 dark:text-white">Currency & Rates</h2>
                                        <p className="text-sm text-gray-500">Manage your USD/ETB daily exchange rates.</p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-900/50 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 mb-8">
                                    <label className={labelCls}>Rate: 1 USD = ? ETB</label>
                                    <div className="flex gap-4">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={rate}
                                            onChange={e => setRate(e.target.value)}
                                            className={inputCls + ' text-3xl font-black h-20'}
                                            placeholder="0.00"
                                        />
                                        <button
                                            onClick={async () => {
                                                setSaving(true);
                                                try {
                                                    const res = await fetch('/api/settings/exchange-rate', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ rate: parseFloat(rate) }),
                                                    });
                                                    if (res.ok) {
                                                        toast.success('Exchange rate updated!');
                                                        fetchCompany();
                                                    }
                                                } catch (e) {
                                                    toast.error('Failed to update rate');
                                                } finally {
                                                    setSaving(false);
                                                }
                                            }}
                                            disabled={saving}
                                            className="px-8 bg-[#3498DB] hover:bg-[#2980B9] text-white rounded-2xl font-black shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center disabled:opacity-50"
                                        >
                                            {saving ? <Loader2 className="animate-spin" /> : <Save size={24} />}
                                        </button>
                                    </div>
                                    <p className="mt-4 text-[10px] font-bold text-gray-400 italic">
                                        Qiimahan waxaa loo isticmaali doonaa dhammaan iibka (Sales) iyo daymaha (Debts) ee maanta.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                                    <div className="p-5 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                                        <h4 className="text-[10px] font-black text-blue-600 uppercase mb-2 flex items-center gap-2"><Info size={14} /> Fiscal Protection</h4>
                                        <p className="text-[11px] leading-snug text-blue-600/80">Daymaha Birta ah haddii ay 7 maalmood dhaafaan, nidaamku USD ayuu u badalayaa si qiimuhu u dhowrsanaado.</p>
                                    </div>
                                    <div className="p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                                        <h4 className="text-[10px] font-black text-emerald-600 uppercase mb-2 flex items-center gap-2"><CheckCircle2 size={14} /> Buying Integrity</h4>
                                        <p className="text-[11px] leading-snug text-emerald-600/80">Iibsashadaada Somalia ee Dollarka ah nidaamku si toos ah ayuu u kaydinayaa faaiidadana u xisaabinayaa.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 shadow-sm flex flex-col items-center justify-center">
                                <Globe size={40} className="text-[#3498DB] mb-4" strokeWidth={2.5} />
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Current Status</h3>
                                <div className="text-center">
                                    <p className="text-xs font-bold text-gray-500">Active Suffix</p>
                                    <p className="text-4xl font-black text-gray-900 dark:text-white tabular-nums">{currentRate?.rate || '0.00'}</p>
                                    <p className="text-[10px] font-black text-[#3498DB] mt-1">SARRRIFKA MAANTA</p>
                                </div>
                                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 w-full">
                                    <div className="flex items-center gap-2 text-rose-500 mb-2">
                                        <AlertTriangle size={14} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Rate Risk Alert</span>
                                    </div>
                                    <p className="text-[10px] font-medium text-gray-400 leading-tight">Badalaada qiimuhu waxay saamayneysaa xisaabinta daymaha maanta la bixinayo.</p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
