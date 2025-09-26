'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, LogIn, Chrome, Eye, EyeOff } from 'lucide-react';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Isticmaal NextAuth signIn si aad u abuurto session sax ah
    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (result?.ok) {
      router.push('/dashboard');
    } else {
      setError(result?.error || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center p-4 md:p-8 overflow-hidden relative">
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-white rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-bounce-slow"></div>
        <div className="absolute bottom-1/3 right-1/3 w-60 h-60 bg-secondary rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-bounce-fast"></div>
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-accent rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-bounce-slowest"></div>
      </div>

      <div className="relative bg-white dark:bg-gray-800 p-8 md:p-10 rounded-xl shadow-2xl w-full max-w-md border border-lightGray dark:border-gray-700 animate-fade-in-up z-10">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold text-darkGray dark:text-gray-100 mb-3">
            Revl<span className="text-secondary">o</span>.
          </h1>
          <p className="text-xl font-semibold text-mediumGray dark:text-gray-300">Soo Gal Akoonkaaga</p>
        </div>

        {error && (
          <div className="bg-redError/10 border border-redError text-redError p-3 rounded-lg mb-6 text-center animate-fade-in">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <input
                type="email"
                id="email"
                name="email"
                placeholder="tusaale@ganacsi.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                placeholder="********"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pl-10 pr-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400 hover:text-darkGray dark:hover:text-gray-100 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-mediumGray rounded"
                disabled
              />
              <label htmlFor="remember-me" className="ml-2 block text-mediumGray dark:text-gray-400">
                I xasuuso
              </label>
            </div>
            <Link href="#" className="font-medium text-primary hover:text-blue-700 transition-colors duration-200">
              Password ma ilaawday?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-3 px-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md transform hover:scale-105 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <LogIn className="mr-2" size={20} /> Log In
              </>
            )}
          </button>
        </form>

        <div className="my-6 text-center text-mediumGray dark:text-gray-400 relative">
          <span className="relative z-10 bg-white dark:bg-gray-800 px-2">AMA</span>
          <div className="absolute inset-x-0 top-1/2 h-px bg-lightGray dark:bg-gray-700 -translate-y-1/2"></div>
        </div>

        {/* Social Login Options */}
        <button
          className="w-full flex items-center justify-center border border-lightGray dark:border-gray-600 bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 py-3 px-4 rounded-lg font-bold text-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition duration-200 shadow-sm transform hover:scale-[1.02] mb-3"
          type="button"
          disabled
        >
          <Chrome className="mr-3" size={20} /> Gal Google-ka
        </button>

        <p className="mt-8 text-center text-mediumGray dark:text-gray-400 text-sm">
          Akoon ma ku lahayn?{' '}
          <Link href="/signup" className="font-medium text-secondary hover:text-green-600 transition-colors duration-200">
            Is diiwaan gali
          </Link>
        </p>
      </div>
    </div>
  );
}