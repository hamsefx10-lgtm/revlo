'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Building, Chrome, Eye, EyeOff, UserPlus, Briefcase, Factory, Package, ArrowRight, CheckCircle2 } from 'lucide-react';
import { signIn } from 'next-auth/react';

export default function SignUpPage() {
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [planType, setPlanType] = useState('COMBINED'); // PROJECTS_ONLY, FACTORIES_ONLY, COMBINED
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Password-yadu isma mid aha.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password-ku waa inuu ugu yaraan 6 xaraf ka koobnaadaa.');
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
        setSuccess('Akoonkaaga si guul leh ayaa loo sameeyay! Waxaa laguugu gudbinayaa dashboard...');
        // Si toos ah user-ka ugu login-geli NextAuth
        await signIn('credentials', {
          redirect: false,
          email,
          password,
        });
        setTimeout(() => router.push('/dashboard'), 1000);
      } else {
        setError(data.message || 'Diiwaan gelintu waa ay guuldareysatay. Fadlan isku day mar kale.');
      }
    } catch (err: any) {
      console.error('Error during registration:', err);
      setError(err.message || 'Cilad lama filaan ah ayaa dhacday. Fadlan isku day mar kale.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex font-sans selection:bg-primary/30 selection:text-primary">
      {/* Left Side - Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16 relative z-10 bg-white dark:bg-gray-900">
        <div className="w-full max-w-lg space-y-6 animate-fade-in-up">
          {/* Header */}
          <div className="text-center lg:text-left">
            <Link href="/" className="inline-block text-4xl font-extrabold tracking-tight text-darkGray dark:text-white mb-2">
              Rev<span className="text-secondary">lo</span>.
            </Link>
            <h2 className="text-3xl font-bold text-darkGray dark:text-gray-100 mt-2">Bilow Safarkaaga</h2>
            <p className="mt-2 text-mediumGray dark:text-gray-400">
              Sameyso akoon cusub oo maamul ganacsigaaga si casri ah.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md text-sm animate-pulse">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-md text-sm animate-pulse">
              {success}
            </div>
          )}

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
            <div className="pt-2">
              <label className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-3">Dooro Qorshahaaga</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPlanType('PROJECTS_ONLY')}
                  className={`relative p-3 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center text-center group ${planType === 'PROJECTS_ONLY'
                      ? 'border-secondary bg-secondary/10 dark:bg-secondary/20 shadow-sm ring-1 ring-secondary'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-secondary/50 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  {planType === 'PROJECTS_ONLY' && <div className="absolute top-2 right-2 text-secondary"><CheckCircle2 size={16} /></div>}
                  <div className={`p-2 rounded-full mb-2 transition-colors ${planType === 'PROJECTS_ONLY' ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-secondary/20 group-hover:text-secondary'}`}>
                    <Briefcase size={20} />
                  </div>
                  <div className="font-bold text-sm text-darkGray dark:text-gray-200">Mashruucyada</div>
                  <div className="text-[10px] text-gray-500 mt-1">Maamulka Mashaariicda</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPlanType('FACTORIES_ONLY')}
                  className={`relative p-3 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center text-center group ${planType === 'FACTORIES_ONLY'
                      ? 'border-secondary bg-secondary/10 dark:bg-secondary/20 shadow-sm ring-1 ring-secondary'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-secondary/50 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  {planType === 'FACTORIES_ONLY' && <div className="absolute top-2 right-2 text-secondary"><CheckCircle2 size={16} /></div>}
                  <div className={`p-2 rounded-full mb-2 transition-colors ${planType === 'FACTORIES_ONLY' ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-secondary/20 group-hover:text-secondary'}`}>
                    <Factory size={20} />
                  </div>
                  <div className="font-bold text-sm text-darkGray dark:text-gray-200">Warshadaha</div>
                  <div className="text-[10px] text-gray-500 mt-1">Maamulka Warshadaha</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPlanType('COMBINED')}
                  className={`relative p-3 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center text-center group ${planType === 'COMBINED'
                      ? 'border-secondary bg-secondary/10 dark:bg-secondary/20 shadow-sm ring-1 ring-secondary'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-secondary/50 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  {planType === 'COMBINED' && <div className="absolute top-2 right-2 text-secondary"><CheckCircle2 size={16} /></div>}
                  <div className={`p-2 rounded-full mb-2 transition-colors ${planType === 'COMBINED' ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-secondary/20 group-hover:text-secondary'}`}>
                    <Package size={20} />
                  </div>
                  <div className="font-bold text-sm text-darkGray dark:text-gray-200">Combined</div>
                  <div className="text-[10px] text-gray-500 mt-1">Labada Adeegba</div>
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

      {/* Right Side - Visual Section (Reused/Adapted) */}
      <div className="hidden lg:flex w-1/2 relative bg-darkGray overflow-hidden">
        {/* Animated Background Gradients - Variation */}
        <div className="absolute bottom-0 -left-1/4 w-full h-full bg-gradient-to-tr from-secondary/30 to-transparent rounded-full blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute top-0 -right-1/4 w-full h-full bg-gradient-to-bl from-primary/30 to-transparent rounded-full blur-3xl opacity-50 animate-pulse delay-700"></div>

        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

        {/* Content Container */}
        <div className="relative z-10 flex flex-col justify-center items-center text-white px-12 text-center w-full">
          {/* 3D-ish Visual for Signup */}
          <div className="relative w-full max-w-sm mb-12">
            {/* Floating Cards */}
            <div className="absolute -top-12 -right-8 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-xl animate-float">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg text-green-400"><Factory size={24} /></div>
                <div className="text-left">
                  <div className="text-xs text-white/60">Warshad</div>
                  <div className="font-bold text-sm">+24% Output</div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-8 -left-8 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-xl animate-float" style={{ animationDelay: '2s' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Briefcase size={24} /></div>
                <div className="text-left">
                  <div className="text-xs text-white/60">Mashruuc</div>
                  <div className="font-bold text-sm">On Time</div>
                </div>
              </div>
            </div>

            {/* Main Dashboard Preview Card */}
            <div className="aspect-square bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="h-full border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-tr from-secondary to-primary rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <Package size={32} className="text-white" />
                  </div>
                  <h4 className="font-bold text-xl">All-in-One</h4>
                  <p className="text-sm text-white/60 mt-2">Xal dhameystiran</p>
                </div>
              </div>
            </div>
          </div>

          <h3 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-secondary to-white">
            Ku Biir Mustaqbalka
          </h3>
          <p className="text-lg text-gray-300 max-w-md">
            Diiwaangeli shirkaddaada maanta oo hel nidaam casri ah oo kordhiya wax-soo-saarkaaga iyo faa'iidadaada.
          </p>
        </div>
      </div>
    </div>
  );
}