'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Building, Chrome, Eye, EyeOff, UserPlus } from 'lucide-react';
import { signIn } from 'next-auth/react';

export default function SignUpPage() {
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
        body: JSON.stringify({ companyName, fullName, email, password }),
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
        router.push('/dashboard');
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
    <div className="min-h-screen bg-gradient-to-br from-secondary to-green-500 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Animated Background Shapes */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-white rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-bounce-slow"></div>
        <div className="absolute bottom-1/3 right-1/3 w-60 h-60 bg-primary rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-bounce-fast"></div>
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-accent rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-bounce-slowest"></div>
      </div>

      <div className="relative bg-white dark:bg-gray-800 p-8 md:p-10 rounded-xl shadow-2xl w-full max-w-md border border-lightGray dark:border-gray-700 animate-fade-in-up z-10">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold text-darkGray dark:text-gray-100 mb-3 tracking-tight">
            Revl<span className="text-secondary">o</span>.
          </h1>
          <p className="text-xl font-semibold text-mediumGray dark:text-gray-300">Abuur Akoon Bilaash ah</p>
        </div>

        {error && (
          <div className="bg-redError/10 border border-redError text-redError p-3 rounded-lg mb-6 text-center animate-fade-in">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-500 text-green-700 p-3 rounded-lg mb-6 text-center animate-fade-in">
            {success}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
          <div>
            <label htmlFor="companyName" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Magaca Shirkaddaada</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <input
                type="text"
                id="companyName"
                name="companyName"
                placeholder="Tusaale: My Furniture Co."
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition duration-200"
                autoComplete="organization"
              />
            </div>
          </div>
          <div>
            <label htmlFor="fullName" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Magacaaga Buuxa</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <input
                type="text"
                id="fullName"
                name="fullName"
                placeholder="Axmed Cali"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition duration-200"
                autoComplete="name"
              />
            </div>
          </div>
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
                className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition duration-200"
                autoComplete="email"
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
                className="w-full p-3 pl-10 pr-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition duration-200"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400 hover:text-darkGray dark:hover:text-gray-100 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Xaqiiji Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="********"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 pl-10 pr-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition duration-200"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400 hover:text-darkGray dark:hover:text-gray-100 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-secondary text-white py-3 px-4 rounded-lg font-bold text-lg hover:bg-green-600 transition duration-200 shadow-md transform hover:scale-105 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <UserPlus className="mr-2" size={20} /> Is Diiwaan Gali
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
          <Chrome className="mr-3" size={20} /> Is Diiwaan Gali Google-ka (Soon)
        </button>

        <p className="mt-8 text-center text-mediumGray dark:text-gray-400 text-sm">
          Akoon hore ma ku lahayd?{' '}
          <Link href="/login" className="font-medium text-primary hover:text-blue-700 transition-colors duration-200">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}