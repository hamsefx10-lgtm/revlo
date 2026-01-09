'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, LogIn, Chrome, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Auth3DBackground from '@/components/Auth3DBackground';
import { useNotifications } from '@/contexts/NotificationContext';

import LandingNavbar from '@/components/LandingNavbar';

export default function LoginPage() {
  const { addNotification } = useNotifications();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (result?.ok) {
      // Fetch session data to determine planType
      const response = await fetch('/api/auth/session');
      const session = await response.json();

      addNotification({
        type: 'success',
        message: 'Si guul leh ayaad ku gashay! Waad soo dhowaal.'
      });
      // Redirect based on planType
      setTimeout(() => {
        if (session?.user?.planType === 'SHOPS_ONLY') {
          router.push('/shop/dashboard');
        } else {
          router.push('/dashboard');
        }
      }, 500);
    } else {
      addNotification({
        type: 'error',
        message: result?.error || 'Login failed. Fadlan hubi emailkaaga iyo passwordkaaga.'
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex font-sans selection:bg-primary/30 selection:text-primary relative">
      <LandingNavbar />
      {/* Left Side - Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 pt-32 lg:pt-16 relative z-10 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up">
          {/* Header */}
          <div className="text-center lg:text-left">
            <Link href="/" className="inline-block text-3xl lg:text-4xl font-extrabold tracking-tight text-darkGray dark:text-white mb-2">
              Rev<span className="text-secondary">lo</span>.
            </Link>
            <h2 className="text-2xl lg:text-3xl font-bold text-darkGray dark:text-gray-100 mt-4">Soo Dhowow Mar Kale!</h2>
            <p className="mt-2 text-mediumGray dark:text-gray-400">
              Fadlan gali xogtaada si aad u sii wadato howlahaaga.
            </p>
          </div>

          {/* Error display removed in favor of Toast */}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Email Input */}
              <div className="group">
                <label htmlFor="email" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1 transition-colors group-focus-within:text-primary">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-gray-50 dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition duration-200 sm:text-sm"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="group">
                <label htmlFor="password" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1 transition-colors group-focus-within:text-primary">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-gray-50 dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-primary/20 focus:border-primary transition duration-200 sm:text-sm"
                    placeholder="••••••••"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  disabled
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-not-allowed opacity-60"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-500 cursor-not-allowed opacity-60">
                  I xasuuso
                </label>
              </div>

              <div className="text-sm">
                <Link href="#" className="font-medium text-primary hover:text-blue-600 transition-colors">
                  Ilaawday Password-ka?
                </Link>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <>
                    Gal Akoonka <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">Ama ku gal</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <button
                disabled
                className="w-full inline-flex justify-center items-center py-3 px-4 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none transition-colors opacity-70 cursor-not-allowed"
              >
                <Chrome className="h-5 w-5 text-gray-900 dark:text-gray-100 mr-2" />
                <span className="sr-only">Sign in with</span> Google (Dhawaan)
              </button>
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Wali ma lihid akoon?{' '}
            <Link href="/signup" className="font-bold text-secondary hover:text-green-600 transition-colors">
              Is Diwaangali Hadda
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