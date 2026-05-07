'use client';

import React, { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
    User, Mail, Building2, Crown, LogOut, ArrowLeft, Loader2,
    Shield, Calendar, Globe, Phone, MapPin, Percent,
    Briefcase, Clock, Settings, BadgeCheck, Eye, EyeOff,
    Key, Lock, Check, Save, AlertTriangle, Monitor, Moon,
    Sun, Smartphone, Trash2, Activity, Palette, Camera, ImagePlus, X
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const AVATAR_COLORS = ['#3498DB','#E74C3C','#2ECC71','#F39C12','#9B59B6','#1ABC9C','#E67E22','#34495E','#16A085','#C0392B'];

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({ current: '', newPass: '', confirm: '' });
    const [showPasswords, setShowPasswords] = useState({ current: false, newPass: false, confirm: false });
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [prefLoading, setPrefLoading] = useState('');
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [photoUploading, setPhotoUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Profile editing state
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editFields, setEditFields] = useState({ fullName: '', email: '', phone: '' });
    const [profileSaving, setProfileSaving] = useState(false);

    useEffect(() => { if (status === 'authenticated') fetchProfile(); }, [status]);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/shop/profile');
            if (res.ok) {
                const d = await res.json();
                setData(d);
                setPhotoUrl(d.company?.logoUrl || null);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const startEditProfile = () => {
        setEditFields({
            fullName: data?.user?.name || '',
            email: data?.user?.email || '',
            phone: data?.user?.phone || ''
        });
        setIsEditingProfile(true);
    };

    const saveProfile = async () => {
        if (!editFields.fullName.trim()) { toast.error('Magaca waa inaad buuxisaa'); return; }
        if (!editFields.email.trim()) { toast.error('Email-ka waa inaad buuxisaa'); return; }
        setProfileSaving(true);
        try {
            const res = await fetch('/api/shop/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: editFields.fullName.trim(),
                    email: editFields.email.trim(),
                    phone: editFields.phone.trim()
                })
            });
            const result = await res.json();
            if (res.ok) {
                setData((d: any) => ({
                    ...d,
                    user: { ...d.user, name: editFields.fullName.trim(), email: editFields.email.trim(), phone: editFields.phone.trim() }
                }));
                setIsEditingProfile(false);
                toast.success('Xogta waa la keydiyay ✓');
            } else {
                toast.error(result.error || 'Khalad dhacay');
            }
        } catch { toast.error('Khalad'); }
        finally { setProfileSaving(false); }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 4 * 1024 * 1024) { toast.error('Sawirku waa ka weyn yahay 4MB'); return; }
        setPhotoUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/shop/profile/photo', { method: 'POST', body: formData });
            const result = await res.json();
            if (res.ok && result.url) {
                setPhotoUrl(result.url);
                toast.success('Sawirka waa la beddelay ✓');
            } else toast.error(result.error || 'Upload khalad');
        } catch { toast.error('Khalad'); }
        finally { setPhotoUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };

    const removePhoto = async () => {
        try {
            const res = await fetch('/api/shop/profile/photo', { method: 'DELETE' });
            if (res.ok) { setPhotoUrl(null); toast.success('Sawirka waa la saaray'); }
        } catch { toast.error('Khalad'); }
    };

    const updatePref = async (key: string, value: string) => {
        setPrefLoading(key);
        try {
            const res = await fetch('/api/shop/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: value })
            });
            if (res.ok) {
                setData((d: any) => ({ ...d, preferences: { ...d.preferences, [key]: value } }));
                toast.success('Waa la keydiyay ✓');
                if (key === 'theme') {
                    document.documentElement.classList.toggle('dark', value === 'dark' || (value === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
                }
            }
        } catch { toast.error('Khalad'); }
        finally { setPrefLoading(''); }
    };

    const removeSession = async (deviceId: string) => {
        try {
            const res = await fetch('/api/shop/profile', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId })
            });
            if (res.ok) {
                setData((d: any) => ({ ...d, sessions: d.sessions.filter((s: any) => s.id !== deviceId) }));
                toast.success('Session waa la saaray');
            }
        } catch { toast.error('Khalad'); }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPass.length < 6) { toast.error('Ugu yaraan 6 xaraf'); return; }
        if (passwordData.newPass !== passwordData.confirm) { toast.error('Iskuma eka'); return; }
        setPasswordLoading(true);
        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: passwordData.current, newPassword: passwordData.newPass })
            });
            const result = await res.json();
            if (res.ok) { toast.success('Password waa la beddelay ✓'); setShowPasswordForm(false); setPasswordData({ current: '', newPass: '', confirm: '' }); }
            else toast.error(result.error || 'Khalad');
        } catch { toast.error('Khalad'); }
        finally { setPasswordLoading(false); }
    };

    if (status === 'loading' || loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
    );
    if (!session || !data) return <div className="min-h-screen flex items-center justify-center text-gray-500">Access Denied</div>;

    const { user, company, preferences, loginActivity = [], sessions = [] } = data;
    const themeVal = preferences?.theme || 'system';
    const langVal = preferences?.language || 'so';
    const avatarCol = preferences?.avatarColor || '#3498DB';

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-7xl mx-auto p-4 md:p-8">
            <div className="mb-8">
                <Link href="/shop/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-xs font-bold uppercase tracking-wider">
                    <ArrowLeft size={14} /> Dashboard
                </Link>
            </div>

            {/* ══ PROFILE CARD ══ */}
            <div className="bg-white dark:bg-[#1a1f2e] rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-6">
                <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                <div className="p-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg overflow-hidden" style={{ background: photoUrl ? undefined : `linear-gradient(135deg, ${avatarCol}, ${avatarCol}dd)` }}>
                                {photoUrl ? <img src={photoUrl} alt="" className="w-full h-full object-cover" /> : (user.name ? user.name.slice(0, 2).toUpperCase() : 'U')}
                            </div>
                            {/* Upload overlay */}
                            <button onClick={() => fileInputRef.current?.click()} disabled={photoUploading}
                                className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-2xl flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer">
                                {photoUploading ? <Loader2 size={20} className="text-white animate-spin" /> : <Camera size={20} className="text-white" />}
                            </button>
                            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handlePhotoUpload} />
                            {/* Online dot */}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-[3px] border-white dark:border-[#1a1f2e]" />
                            {/* Remove photo */}
                            {photoUrl && (
                                <button onClick={removePhoto} className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600">
                                    <X size={10} />
                                </button>
                            )}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{user.name}</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{user.email}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-1 rounded-lg"><Crown size={11} /> {user.role}</span>
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-lg"><BadgeCheck size={11} /> {user.status || 'Active'}</span>
                                {company?.planType && <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg"><Briefcase size={11} /> {company.planType.replace('_', ' ')}</span>}
                            </div>
                        </div>
                        <div className="flex gap-2 self-start">
                            <Link href="/shop/settings" className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"><Settings size={18} /></Link>
                            <button onClick={() => signOut()} className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"><LogOut size={18} /></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ GRID SECTIONS ══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* ── Personal Info (Editable) ── */}
                <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-800/50 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><User size={15} className="text-gray-400" /> Xogta Shakhsiga</h3>
                        {!isEditingProfile ? (
                            <button onClick={startEditProfile} className="text-[11px] font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all">
                                <Settings size={12} /> Edit
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button onClick={() => setIsEditingProfile(false)} className="text-[11px] font-bold text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                                    Ka noqo
                                </button>
                                <button onClick={saveProfile} disabled={profileSaving} className="text-[11px] font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50">
                                    {profileSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Kaydi
                                </button>
                            </div>
                        )}
                    </div>
                    <div>
                        {isEditingProfile ? (
                            <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
                                <EditRow label="Magaca" value={editFields.fullName} onChange={v => setEditFields(f => ({ ...f, fullName: v }))} icon={<User size={13} className="text-blue-400" />} />
                                <EditRow label="Email" value={editFields.email} onChange={v => setEditFields(f => ({ ...f, email: v }))} type="email" icon={<Mail size={13} className="text-blue-400" />} />
                                <EditRow label="Telefon" value={editFields.phone} onChange={v => setEditFields(f => ({ ...f, phone: v }))} type="tel" placeholder="+252..." icon={<Phone size={13} className="text-blue-400" />} />
                                <Row label="Doorka" value={user.role} />
                                <Row label="Ku Biirtay" value={user.joinedAt ? new Date(user.joinedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'} />
                                <Row label="Login-kii Ugu Dambeeyey" value={user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '—'} />
                            </div>
                        ) : (
                            <>
                                {[
                                    { l: 'Magaca', v: user.name }, { l: 'Email', v: user.email }, { l: 'Telefon', v: user.phone || '—' },
                                    { l: 'Doorka', v: user.role }, { l: 'Ku Biirtay', v: user.joinedAt ? new Date(user.joinedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                                    { l: 'Login-kii Ugu Dambeeyey', v: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '—' },
                                ].map((r, i) => <Row key={i} label={r.l} value={r.v} />)}
                            </>
                        )}
                    </div>
                </div>

                {/* ── Company Info ── */}
                <Section title="Xogta Shirkadda" icon={Building2}>
                    {[
                        { l: 'Magaca', v: company?.name }, { l: 'Warshadda', v: company?.industry || '—' },
                        { l: 'Email', v: company?.email || '—' }, { l: 'Telefon', v: company?.phone || '—' },
                        { l: 'Cinwaan', v: company?.address || '—' }, { l: 'Tax Rate', v: company?.taxRate ? `${company.taxRate}%` : '—' },
                        { l: 'Sannad Maaliyadeed', v: company?.fiscalYearStartMonth ? MONTHS[company.fiscalYearStartMonth - 1] + ' - ' + MONTHS[(company.fiscalYearStartMonth - 2 + 12) % 12] : 'Jan - Dec' },
                        { l: "Da'da", v: company?.age || '—' },
                    ].map((r, i) => <Row key={i} label={r.l} value={r.v} />)}
                </Section>

                {/* ── Theme & Language ── */}
                <Section title="Muuqaalka & Luuqada" icon={Palette}>
                    <div className="px-6 py-4">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Theme</p>
                        <div className="flex gap-2 mb-6">
                            {([
                                { v: 'light', l: 'Iftiinka', icon: Sun },
                                { v: 'dark', l: 'Mugdiga', icon: Moon },
                                { v: 'system', l: 'System', icon: Monitor },
                            ] as const).map(t => (
                                <button key={t.v} onClick={() => updatePref('theme', t.v)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${themeVal === t.v ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                    {prefLoading === 'theme' && themeVal !== t.v ? null : <t.icon size={14} />} {t.l}
                                </button>
                            ))}
                        </div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Luuqada</p>
                        <div className="flex gap-2 mb-6">
                            {[{ v: 'so', l: '🇸🇴 Soomaali' }, { v: 'en', l: '🇬🇧 English' }].map(lang => (
                                <button key={lang.v} onClick={() => updatePref('language', lang.v)}
                                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${langVal === lang.v ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                    {lang.l}
                                </button>
                            ))}
                        </div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Midabka Avatar-ka</p>
                        <div className="flex gap-2 flex-wrap">
                            {AVATAR_COLORS.map(c => (
                                <button key={c} onClick={() => updatePref('avatarColor', c)}
                                    className={`w-8 h-8 rounded-lg transition-all hover:scale-110 ${avatarCol === c ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900' : ''}`}
                                    style={{ background: c }} />
                            ))}
                        </div>
                    </div>
                </Section>

                {/* ── Security ── */}
                <div className={`bg-white dark:bg-[#1a1f2e] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden ${showPasswordForm ? 'lg:col-span-2' : ''}`}>
                    <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-800/50 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><Shield size={15} className="text-gray-400" /> Amniga</h3>
                        {!showPasswordForm && <button onClick={() => setShowPasswordForm(true)} className="text-[11px] font-bold text-blue-500 hover:text-blue-600">Bedel Password</button>}
                    </div>
                    {!showPasswordForm ? (
                        <div className="px-6 py-2 divide-y divide-gray-50 dark:divide-gray-800/50">
                            <Row label="Password" value="••••••••••" />
                            <Row label="2FA" value={user.twoFAEnabled ? '✅ Shiddan' : '❌ Daminan'} />
                            <Row label="Session Policy" value={<span className="flex items-center gap-1.5 text-emerald-500"><Lock size={11} /> Single Session</span>} />
                        </div>
                    ) : (
                        <form onSubmit={handlePasswordChange} className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <PassField label="Password-ka Hadda" value={passwordData.current} show={showPasswords.current}
                                onChange={v => setPasswordData({ ...passwordData, current: v })} onToggle={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })} placeholder="Gali password-kaaga" />
                            <PassField label="Password Cusub" value={passwordData.newPass} show={showPasswords.newPass}
                                onChange={v => setPasswordData({ ...passwordData, newPass: v })} onToggle={() => setShowPasswords({ ...showPasswords, newPass: !showPasswords.newPass })} placeholder="Ugu yaraan 6 xaraf" />
                            <PassField label="Xaqiiji" value={passwordData.confirm} show={showPasswords.confirm}
                                onChange={v => setPasswordData({ ...passwordData, confirm: v })} onToggle={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })} placeholder="Ku celi" />
                            {passwordData.newPass && (
                                <div className="md:col-span-3 flex items-center gap-3">
                                    <div className={`h-1 flex-1 rounded-full ${passwordData.newPass.length >= 8 ? 'bg-emerald-500' : passwordData.newPass.length >= 6 ? 'bg-amber-500' : 'bg-red-400'}`} />
                                    <span className={`text-[10px] font-bold ${passwordData.newPass.length >= 8 ? 'text-emerald-500' : passwordData.newPass.length >= 6 ? 'text-amber-500' : 'text-red-400'}`}>
                                        {passwordData.newPass.length >= 8 ? 'Xoog badan' : passwordData.newPass.length >= 6 ? 'OK' : 'Daciif'}
                                    </span>
                                </div>
                            )}
                            <div className="md:col-span-3 flex gap-3">
                                <button type="submit" disabled={passwordLoading || passwordData.newPass !== passwordData.confirm}
                                    className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold rounded-xl disabled:opacity-40 flex items-center gap-2">
                                    {passwordLoading ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />} Bedel
                                </button>
                                <button type="button" onClick={() => { setShowPasswordForm(false); setPasswordData({ current: '', newPass: '', confirm: '' }); }}
                                    className="px-5 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl">Ka noqo</button>
                            </div>
                        </form>
                    )}
                </div>

                {/* ── Login Activity ── */}
                <Section title="Login Activity" icon={Activity}>
                    <div className="px-6 py-3">
                        {loginActivity.length === 0 ? (
                            <p className="text-xs text-gray-400 py-4 text-center">Wali login log ma jiro</p>
                        ) : loginActivity.slice(0, 8).map((log: any, i: number) => (
                            <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] ${log.action.includes('LOGIN') || log.action === 'login' ? 'bg-emerald-500' : 'bg-gray-400'}`}>
                                        {log.action.includes('LOGIN') || log.action === 'login' ? '→' : '←'}
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{log.device}</p>
                                        <p className="text-[10px] text-gray-400">{log.ip} • {new Date(log.date).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* ── Active Sessions ── */}
                <Section title="Sessions-ka Firfircoon" icon={Smartphone}>
                    <div className="px-6 py-3">
                        {sessions.length === 0 ? (
                            <p className="text-xs text-gray-400 py-4 text-center">Session ma jiro</p>
                        ) : sessions.map((s: any, i: number) => (
                            <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${s.isCurrent ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                                        <Monitor size={13} />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            {s.device}
                                            {s.isCurrent && <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 px-1.5 py-0.5 rounded font-bold">HADDA</span>}
                                        </p>
                                        <p className="text-[10px] text-gray-400">Ugu dambeeyey: {new Date(s.lastUsed).toLocaleString()}</p>
                                    </div>
                                </div>
                                {!s.isCurrent && (
                                    <button onClick={() => removeSession(s.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all">
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </Section>

                {/* ── Danger Zone ── */}
                <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border border-red-100 dark:border-red-900/30 overflow-hidden self-start lg:col-span-2">
                    <div className="px-6 py-4 border-b border-red-50 dark:border-red-900/20">
                        <h3 className="text-sm font-bold text-red-500 flex items-center gap-2"><AlertTriangle size={15} /> Aag Khatar ah</h3>
                    </div>
                    <div className="px-6 py-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Ka bax akoonkaaga</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Dhammaan qalab-yaasha waa laga saari doonaa</p>
                        </div>
                        <button onClick={() => signOut()} className="px-4 py-2 text-xs font-bold text-red-500 border border-red-200 dark:border-red-900/30 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-all">Sign Out</button>
                    </div>
                </div>
            </div>

            <p className="text-center text-[10px] text-gray-300 dark:text-gray-600 mt-8 font-medium">
                © {new Date().getFullYear()} {company?.name || 'Revlo'} • Secured by Revlo Enterprise
            </p>
        </div>
    );
}

// ── Reusable Components ──
function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-[#1a1f2e] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-800/50">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><Icon size={15} className="text-gray-400" /> {title}</h3>
            </div>
            {children}
        </div>
    );
}

function Row({ label, value }: { label: string; value: any }) {
    return (
        <div className="flex items-center justify-between py-3.5 px-6 border-b border-gray-50 dark:border-gray-800/50 last:border-0">
            <span className="text-xs text-gray-400 font-medium">{label}</span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-right max-w-[60%] truncate">{value}</span>
        </div>
    );
}

function PassField({ label, value, show, onChange, onToggle, placeholder }: any) {
    return (
        <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
            <div className="relative">
                <input type={show ? 'text' : 'password'} required value={value} onChange={e => onChange(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 outline-none focus:border-blue-500 text-sm font-medium transition-colors" placeholder={placeholder} />
                <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
        </div>
    );
}

function EditRow({ label, value, onChange, type = 'text', placeholder, icon }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; icon?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between py-3 px-6 gap-4">
            <span className="text-xs text-gray-400 font-medium flex items-center gap-2 min-w-[100px] shrink-0">
                {icon} {label}
            </span>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder || label}
                className="flex-1 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/50 dark:border-blue-800/30 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all max-w-[60%]"
            />
        </div>
    );
}
