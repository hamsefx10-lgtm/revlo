// app/forgot-password/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, CheckCircle, ArrowLeft, Send, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import Auth3DBackground from '@/components/Auth3DBackground';
import { useNotifications } from '@/contexts/NotificationContext';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      addNotification({ type: 'error', message: 'Fadlan geli email sax ah.' }); return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (res.ok) { addNotification({ type: 'success', message: data.message || 'Lambarka xaqiijinta ayaa laguu soo diray.' }); setStep(2); }
      else addNotification({ type: 'error', message: data.message || 'Cilad ayaa dhacday.' });
    } catch { addNotification({ type: 'error', message: 'Cilad shabakadeed ayaa dhacday.' }); }
    finally { setLoading(false); }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) { addNotification({ type: 'error', message: 'Geli lambarka xaqiijinta.' }); return; }
    if (newPassword.length < 6) { addNotification({ type: 'error', message: 'Password-ku waa inuu ugu yaraan 6 xaraf ka koobnaadaa.' }); return; }
    if (newPassword !== confirmNewPassword) { addNotification({ type: 'error', message: 'Password-yadu isku mid maaha.' }); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password-reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, token, newPassword, confirmNewPassword }) });
      const data = await res.json();
      if (res.ok) { addNotification({ type: 'success', message: 'Password-kaaga si guul leh ayaa dib loogu dejiyay!' }); setTimeout(() => router.push('/login'), 1500); }
      else addNotification({ type: 'error', message: data.message || 'Cilad ayaa dhacday.' });
    } catch { addNotification({ type: 'error', message: 'Cilad shabakadeed ayaa dhacday.' }); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left Side */}
      <div className={`w-full lg:w-1/2 xl:w-[45%] min-h-screen flex flex-col justify-center bg-white dark:bg-gray-950 relative z-10 transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-full max-w-lg mx-auto px-8 sm:px-12 lg:px-16 py-12">

          {/* Logo */}
          <Link href="/" className="inline-flex items-baseline mb-14">
            <span className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">Rev</span>
            <span className="text-4xl font-black tracking-tight text-secondary">lo</span>
          </Link>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-10">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${step === 1 ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
              <Mail className="h-4 w-4" /> Email
            </div>
            <div className={`h-px flex-1 transition-all duration-500 ${step === 2 ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-800'}`} />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${step === 2 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
              <ShieldCheck className="h-4 w-4" /> Password
            </div>
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Password Dib U Dejin</h1>
              <p className="mt-3 mb-12 text-base text-gray-400 dark:text-gray-500">Geli email-kaaga, waxaan kuu dirnaa lambar xaqiijin</p>

              <form onSubmit={handleSendResetLink} className="space-y-7">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5">Email-ka</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 dark:text-gray-600" />
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@company.com"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white text-base placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200" />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-4 rounded-2xl text-base font-bold text-white transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
                  style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)' }}>
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <><Send className="h-5 w-5" /><span>Dir Lambarka Xaqiijinta</span></>}
                </button>

                <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-500 hover:text-primary transition-colors mt-8">
                  <ArrowLeft className="h-4 w-4" /> Ku Noqo Login
                </Link>
              </form>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Password Cusub</h1>
              <p className="mt-2 text-base text-gray-400 dark:text-gray-500">Geli lambarka iyo password cusub</p>
              <div className="mt-2 mb-10 inline-flex items-center gap-2 text-sm text-primary font-medium">
                <Mail className="h-4 w-4" /> {email}
              </div>

              <form onSubmit={handlePasswordReset} className="space-y-6">
                {/* Token */}
                <div>
                  <label htmlFor="token" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5">Lambarka Xaqiijinta</label>
                  <div className="relative">
                    <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 dark:text-gray-600" />
                    <input type="text" id="token" value={token} onChange={(e) => setToken(e.target.value)} required placeholder="123456"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white text-xl font-mono tracking-[0.3em] text-center placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-200" />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5">Password Cusub</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 dark:text-gray-600" />
                    <input type={showNewPassword ? 'text' : 'password'} id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white text-base placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200" />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} tabIndex={-1}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 hover:text-gray-500 transition-colors">
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Confirm */}
                <div>
                  <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5">Xaqiiji Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 dark:text-gray-600" />
                    <input type={showConfirmPassword ? 'text' : 'password'} id="confirmNewPassword" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white text-base placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200" />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600 hover:text-gray-500 transition-colors">
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Hints */}
                {newPassword.length > 0 && (
                  <div className="flex gap-5 text-xs">
                    <span className={newPassword.length >= 6 ? 'text-emerald-500' : 'text-gray-400'}>{newPassword.length >= 6 ? '✓' : '○'} 6+ xaraf</span>
                    {confirmNewPassword.length > 0 && <span className={newPassword === confirmNewPassword ? 'text-emerald-500' : 'text-red-400'}>{newPassword === confirmNewPassword ? '✓' : '✗'} Isku mid</span>}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-4 rounded-2xl text-base font-bold text-white transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30"
                  style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)' }}>
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <><ShieldCheck className="h-5 w-5" /><span>Deji Password Cusub</span></>}
                </button>

                <div className="flex items-center justify-between mt-4">
                  <button type="button" onClick={() => setStep(1)} className="text-sm text-gray-400 hover:text-primary transition-colors flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" /> Email kale
                  </button>
                  <Link href="/login" className="text-sm text-gray-400 hover:text-primary transition-colors">Ku Noqo Login</Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Right Side */}
      <div className="hidden lg:block lg:w-1/2 xl:w-[55%] relative bg-gray-900 overflow-hidden">
        <Auth3DBackground />
      </div>
    </div>
  );
}
