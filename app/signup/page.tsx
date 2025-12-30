'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Building, Chrome, Eye, EyeOff, UserPlus, Briefcase, Factory, Package, ArrowRight, CheckCircle2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Auth3DBackground from '@/components/Auth3DBackground';
import { useNotifications } from '@/contexts/NotificationContext';

import LandingNavbar from '@/components/LandingNavbar';

export default function SignUpPage() {
  const { addNotification } = useNotifications();
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [planType, setPlanType] = useState('COMBINED'); // PROJECTS_ONLY, FACTORIES_ONLY, COMBINED
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (password !== confirmPassword) {
      addNotification({ type: 'error', message: 'Password-yadu isma mid aha.' });
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      addNotification({ type: 'error', message: 'Password-ku waa inuu ugu yaraan 6 xaraf ka koobnaadaa.' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ companyName, fullName, email, password, planType }),
      });

      const data = await response.json();

      if (response.ok) {
        addNotification({ type: 'success', message: 'Akoonkaaga si guul leh ayaa loo sameeyay! Waxaa laguugu gudbinayaa dashboard...' });

        // Si toos ah user-ka ugu login-geli NextAuth
        await signIn('credentials', {
          redirect: false,
          email,
          password,
        });
        setTimeout(() => router.push('/dashboard'), 1000);
      } else {
        addNotification({ type: 'error', message: data.message || 'Diiwaan gelintu waa ay guuldareysatay. Fadlan isku day mar kale.' });
      }
    } catch (err: any) {
      console.error('Error during registration:', err);
      addNotification({ type: 'error', message: err.message || 'Cilad lama filaan ah ayaa dhacday. Fadlan isku day mar kale.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex font-sans selection:bg-primary/30 selection:text-primary relative">
      <LandingNavbar />
      {/* Left Side - Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 pt-32 lg:pt-16 relative z-10 bg-white dark:bg-gray-900">
        <div className="w-full max-w-lg space-y-6 animate-fade-in-up">
          {/* Header */}
          <div className="text-center lg:text-left">
            <Link href="/" className="inline-block text-3xl lg:text-4xl font-extrabold tracking-tight text-darkGray dark:text-white mb-2">
              Rev<span className="text-secondary">lo</span>.
            </Link>
            <h2 className="text-2xl lg:text-3xl font-bold text-darkGray dark:text-gray-100 mt-2">Bilow Safarkaaga</h2>
            <p className="mt-2 text-mediumGray dark:text-gray-400">
              Sameyso akoon cusub oo maamul ganacsigaaga si casri ah.
            </p>
          </div>

          {/* Alerts replaced by Global Notifications */}

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} autoComplete="off">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="group">
                <label htmlFor="companyName" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Shirkadda</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    placeholder="Company Name"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-gray-50 dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition duration-200 sm:text-sm"
                  />
                </div>
              </div>
              <div className="group">
                <label htmlFor="fullName" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Magacaaga</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    placeholder="Full Name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-gray-50 dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition duration-200 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="group">
              <label htmlFor="email" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="name@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-gray-50 dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition duration-200 sm:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="group">
                <label htmlFor="password" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-gray-50 dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition duration-200 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="group">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">Xaqiiji</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="••••••••"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-gray-50 dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition duration-200 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Plan Selection */}
            <div className="pt-4">
              <label className="block text-sm font-bold text-darkGray dark:text-gray-300 mb-4">Dooro Qorshahaaga</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setPlanType('PROJECTS_ONLY')}
                  className={`relative p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center justify-center text-center group ${planType === 'PROJECTS_ONLY'
                    ? 'border-secondary bg-secondary/5 shadow-lg shadow-secondary/10 scale-105 z-10'
                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 hover:border-secondary/30 hover:shadow-md'
                    }`}
                >
                  {planType === 'PROJECTS_ONLY' && <div className="absolute top-2 right-2 text-secondary bg-white dark:bg-gray-900 rounded-full p-0.5"><CheckCircle2 size={16} fill="currentColor" className="text-secondary" /></div>}
                  <div className={`p-3 rounded-xl mb-3 transition-colors ${planType === 'PROJECTS_ONLY' ? 'bg-gradient-to-br from-secondary to-green-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 group-hover:bg-secondary/10 group-hover:text-secondary'}`}>
                    <Briefcase size={20} />
                  </div>
                  <div className="font-bold text-sm text-darkGray dark:text-white">Mashruucyada</div>
                  <div className="text-[11px] text-gray-500 font-medium mt-1">Maamulka Mashaariicda</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPlanType('FACTORIES_ONLY')}
                  className={`relative p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center justify-center text-center group ${planType === 'FACTORIES_ONLY'
                    ? 'border-secondary bg-secondary/5 shadow-lg shadow-secondary/10 scale-105 z-10'
                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 hover:border-secondary/30 hover:shadow-md'
                    }`}
                >
                  {planType === 'FACTORIES_ONLY' && <div className="absolute top-2 right-2 text-secondary bg-white dark:bg-gray-900 rounded-full p-0.5"><CheckCircle2 size={16} fill="currentColor" className="text-secondary" /></div>}
                  <div className={`p-3 rounded-xl mb-3 transition-colors ${planType === 'FACTORIES_ONLY' ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 group-hover:bg-blue-500/10 group-hover:text-blue-500'}`}>
                    <Factory size={20} />
                  </div>
                  <div className="font-bold text-sm text-darkGray dark:text-white">Warshadaha</div>
                  <div className="text-[11px] text-gray-500 font-medium mt-1">Maamulka Warshadaha</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPlanType('COMBINED')}
                  className={`relative p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center justify-center text-center group ${planType === 'COMBINED'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10 shadow-lg shadow-purple-500/10 scale-105 z-10'
                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 hover:border-purple-500/30 hover:shadow-md'
                    }`}
                >
                  {planType === 'COMBINED' && <div className="absolute top-2 right-2 text-purple-500 bg-white dark:bg-gray-900 rounded-full p-0.5"><CheckCircle2 size={16} fill="currentColor" className="text-purple-500" /></div>}
                  <div className={`p-3 rounded-xl mb-3 transition-colors ${planType === 'COMBINED' ? 'bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 group-hover:bg-purple-500/10 group-hover:text-purple-500'}`}>
                    <Package size={20} />
                  </div>
                  <div className="font-bold text-sm text-darkGray dark:text-white">Complete</div>
                  <div className="text-[11px] text-gray-500 font-medium mt-1">Labada Adeegba</div>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-secondary to-green-600 hover:from-green-600 hover:to-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-all duration-300 transform hover:-translate-y-0.5 mt-4"
              disabled={loading}
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <UserPlus className="mr-2" size={20} /> Sameyso Akoon
                </>
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">Ama ku gal</span>
              </div>
            </div>

            <button
              disabled
              className="w-full inline-flex justify-center items-center py-3 px-4 mt-4 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none transition-colors opacity-70 cursor-not-allowed"
            >
              <Chrome className="h-5 w-5 text-gray-900 dark:text-gray-100 mr-2" />
              Google (Dhawaan)
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            Akoon hore ma ku lahayd?{' '}
            <Link href="/login" className="font-bold text-primary hover:text-blue-700 transition-colors">
              Gasho Hadda
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Visual Section */}
      <div className="hidden lg:flex w-1/2 relative bg-gray-900 overflow-hidden">
        <Auth3DBackground />
      </div>
    </div>
  );
}