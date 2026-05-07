'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Building, Eye, EyeOff, UserPlus, Briefcase, Factory, Store, Loader2, Check, Smartphone } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Auth3DBackground from '@/components/Auth3DBackground';
import { useNotifications } from '@/contexts/NotificationContext';

const plans = [
  { id: 'SHOPS_ONLY', label: 'Dukaanka', icon: Store, desc: 'Supermarket & POS', gradient: 'from-orange-500 to-amber-500', bg: 'bg-orange-50 dark:bg-orange-950/20', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
  { id: 'FACTORIES_ONLY', label: 'Warshada', icon: Factory, desc: 'Wax Soo Saarka', gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  { id: 'PROJECTS_ONLY', label: 'Mashaariic', icon: Briefcase, desc: 'Dhismo & Mashaariic', gradient: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
];

const InputField = ({ id, label, icon: Icon, type = 'text', placeholder, value, onChange, isPassword, showPw, togglePw }: any) => (
  <div className="group">
    <label htmlFor={id} className="block text-[13px] font-semibold text-gray-600 dark:text-gray-400 mb-1.5 ml-1 transition-colors group-focus-within:text-secondary">
      {label}
    </label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-400 group-focus-within:text-secondary group-focus-within:bg-secondary/5 transition-all duration-300">
        <Icon size={18} />
      </div>
      <input
        id={id}
        type={type}
        required
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-16 pr-4 py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white text-[15px] placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-4 focus:ring-secondary/10 focus:border-secondary shadow-sm hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300"
      />
      {isPassword && (
        <button
          type="button"
          onClick={togglePw}
          tabIndex={-1}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-secondary transition-colors p-2"
        >
          {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  </div>
);

export default function SignUpPage() {
  const { addNotification } = useNotifications();
  useEffect(() => {
    // Custom style for autofill
    const style = document.createElement('style');
    style.innerHTML = `
      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus,
      input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 1000px white inset !important;
        -webkit-text-fill-color: #111827 !important;
        transition: background-color 5000s ease-in-out 0s;
      }
      .dark input:-webkit-autofill,
      .dark input:-webkit-autofill:hover,
      .dark input:-webkit-autofill:focus,
      .dark input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 1000px #111827 inset !important;
        -webkit-text-fill-color: white !important;
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [planType, setPlanType] = useState('SHOPS_ONLY');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { addNotification({ type: 'error', message: 'Password-yadu isma mid aha.' }); return; }
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (password.length < 8 || !hasUpper || !hasNumber) { 
      addNotification({ type: 'error', message: 'Fadlan hubi in password-ku waafaqsan yahay dhammaan shuruudaha.' }); 
      return; 
    }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ companyName, fullName, email, phone, password, planType }) });
      const data = await response.json();
      if (response.ok) {
        addNotification({ type: 'success', message: 'Akoonkaaga si guul leh ayaa loo sameeyay!' });
        await signIn('credentials', { redirect: false, email, password });
        setTimeout(() => router.push(planType === 'SHOPS_ONLY' ? '/shop/dashboard' : '/dashboard'), 1000);
      } else { addNotification({ type: 'error', message: data.message || 'Diiwaan gelintu waa ay guuldareysatay.' }); }
    } catch { addNotification({ type: 'error', message: 'Cilad ayaa dhacday.' }); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left Side */}
      <div className={`w-full lg:w-1/2 xl:w-[48%] min-h-screen flex flex-col justify-center bg-white dark:bg-gray-950 relative z-10 transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-full max-w-xl mx-auto px-8 sm:px-12 lg:px-14 py-10">

          {/* Logo */}
          <Link href="/" className="inline-flex items-baseline mb-10">
            <span className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">Rev</span>
            <span className="text-4xl font-black tracking-tight text-secondary">lo</span>
          </Link>

          {/* Header */}
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Bilow Safarkaaga</h1>
          <p className="mt-2 mb-10 text-base text-gray-400 dark:text-gray-500">Sameyso akoon cusub oo casri ah</p>

          <form className="space-y-5" onSubmit={handleSubmit} autoComplete="off">
            {/* Company + Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InputField id="companyName" label="Shirkadda" icon={Building} placeholder="Magaca Shirkadda" value={companyName} onChange={(e: any) => setCompanyName(e.target.value)} />
              <InputField id="fullName" label="Magacaaga" icon={User} placeholder="Magacaaga Buuxa" value={fullName} onChange={(e: any) => setFullName(e.target.value)} />
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InputField id="email" type="email" label="Email-ka" icon={Mail} placeholder="name@company.com" value={email} onChange={(e: any) => setEmail(e.target.value)} />
              <InputField id="phone" type="tel" label="Lambarka Tel" icon={Smartphone} placeholder="061xxxxxxx" value={phone} onChange={(e: any) => setPhone(e.target.value)} />
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InputField id="password" type={showPassword ? 'text' : 'password'} label="Password-ka" icon={Lock} placeholder="••••••••" value={password} onChange={(e: any) => setPassword(e.target.value)} isPassword showPw={showPassword} togglePw={() => setShowPassword(!showPassword)} />
              <InputField id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} label="Xaqiiji" icon={Lock} placeholder="••••••••" value={confirmPassword} onChange={(e: any) => setConfirmPassword(e.target.value)} isPassword showPw={showConfirmPassword} togglePw={() => setShowConfirmPassword(!showConfirmPassword)} />
            </div>

            {/* Password hints */}
            {password.length > 0 && (
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-medium">
                <span className={password.length >= 8 ? 'text-emerald-500' : 'text-gray-400'}>
                  {password.length >= 8 ? '✓' : '○'} 8+ xaraf
                </span>
                <span className={/[A-Z]/.test(password) ? 'text-emerald-500' : 'text-gray-400'}>
                  {/[A-Z]/.test(password) ? '✓' : '○'} Xaraf weyn
                </span>
                <span className={/[0-9]/.test(password) ? 'text-emerald-500' : 'text-gray-400'}>
                  {/[0-9]/.test(password) ? '✓' : '○'} Lambar
                </span>
                {confirmPassword.length > 0 && (
                  <span className={password === confirmPassword ? 'text-emerald-500' : 'text-red-400'}>
                    {password === confirmPassword ? '✓' : '✗'} Isku mid
                  </span>
                )}
              </div>
            )}

            {/* Plan Selection */}
            <div className="pt-2">
              <label className="block text-[13px] font-semibold text-gray-600 dark:text-gray-400 mb-4 ml-1">Nooca Ganacsiga</label>
              <div className="grid grid-cols-3 gap-4">
                {plans.map((plan) => {
                  const Icon = plan.icon;
                  const sel = planType === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setPlanType(plan.id)}
                      className={`relative p-5 rounded-2xl border-2 transition-all duration-500 text-center group flex flex-col items-center gap-3 ${
                        sel
                          ? `${plan.border} ${plan.bg} shadow-xl shadow-gray-200/50 dark:shadow-none -translate-y-1.5`
                          : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-lg hover:-translate-y-1'
                      }`}
                    >
                      {/* Selection Indicator */}
                      <div className={`absolute top-3 right-3 transition-all duration-500 ${sel ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center bg-gradient-to-br ${plan.gradient} shadow-lg shadow-current/20`}>
                          <Check className="h-3 w-3 text-white" strokeWidth={4} />
                        </div>
                      </div>

                      {/* Icon Container */}
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                        sel ? `bg-gradient-to-br ${plan.gradient} shadow-lg shadow-current/20 scale-110` : 'bg-gray-50 dark:bg-gray-800 group-hover:scale-105'
                      }`}>
                        <Icon className={`h-7 w-7 transition-colors duration-500 ${sel ? 'text-white' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                      </div>

                      <div className="space-y-1">
                        <div className={`font-bold text-[14px] transition-colors duration-500 ${sel ? 'text-gray-900 dark:text-white' : 'text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
                          {plan.label}
                        </div>
                        <div className={`text-[11px] leading-tight transition-colors duration-500 ${sel ? plan.text : 'text-gray-400 group-hover:text-gray-500'}`}>
                          {plan.desc}
                        </div>
                      </div>

                      {/* Active glow effect */}
                      {sel && (
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent opacity-50" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-2xl text-base font-bold text-white transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2.5 shadow-lg shadow-secondary/20 hover:shadow-xl hover:shadow-secondary/30 mt-4"
              style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)' }}>
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <><UserPlus className="h-5 w-5" /><span>Sameyso Akoon</span></>}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-10 text-sm text-gray-400 dark:text-gray-500">
            Hore ma ku lahayd akoon?{' '}
            <Link href="/login" className="font-bold text-primary hover:text-blue-700 dark:hover:text-blue-400 transition-colors">Gasho Hadda</Link>
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="hidden lg:block lg:w-1/2 xl:w-[52%] relative bg-gray-900 overflow-hidden">
        <Auth3DBackground />
      </div>
    </div>
  );
}