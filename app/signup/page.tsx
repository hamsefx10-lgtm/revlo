'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Building, Chrome, Eye, EyeOff, UserPlus, Briefcase, Factory, Package, ArrowRight, CheckCircle2, Store } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Auth3DBackground from '@/components/Auth3DBackground';
import { useNotifications } from '@/contexts/NotificationContext';

import LandingNavbar from '@/components/LandingNavbar';

interface InputGroupProps {
  id: string;
  label: string;
  icon: any;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  isPassword?: boolean;
  showPassword?: boolean;
  togglePassword?: () => void;
}

const InputGroup = ({
  id, label, icon: Icon, type = 'text', placeholder, value, onChange, required = true, isPassword = false, showPassword = false, togglePassword
}: InputGroupProps) => (
  <div className="group">
    <label htmlFor={id} className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-1">{label}</label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
      </div>
      <input
        type={type}
        id={id}
        name={id}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={onChange}
        className={`block w-full pl-10 ${isPassword ? 'pr-10' : 'pr-3'} py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-gray-50 dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition duration-200 sm:text-sm`}
      />
      {isPassword && (
        <button
          type="button"
          onClick={togglePassword}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  </div>
);

export default function SignUpPage() {
  const { addNotification } = useNotifications();
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [planType, setPlanType] = useState('SHOPS_ONLY'); // PROJECTS_ONLY, FACTORIES_ONLY, SHOPS_ONLY
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successSent, setSuccessSent] = useState(false);
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

        await signIn('credentials', {
          redirect: false,
          email,
          password,
        });

        if (planType === 'SHOPS_ONLY') {
          setTimeout(() => router.push('/shop/dashboard'), 1000);
        } else {
          setTimeout(() => router.push('/dashboard'), 1000);
        }
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

  if (successSent) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4 selection:bg-primary/30 selection:text-primary">
        <LandingNavbar />
        <div className="w-full max-w-lg bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-300 text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">Email Waa La Diray!</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Waxaan kuu dirnay email xaqiijin ah. Fadlan hubi inbox-kaaga <strong>{email}</strong> oo guji link-ga si aad u dhamaystirto.
          </p>
          <div className="space-y-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full py-3 px-6 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-primary hover:bg-primary/90 transition-all"
            >
              Tag Bogga Login-ka
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
            >
              Ma heshay email-ka? Dib u dir
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              <InputGroup
                id="companyName"
                label="Shirkadda"
                icon={Building}
                placeholder="Company Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              <InputGroup
                id="fullName"
                label="Magacaaga"
                icon={User}
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <InputGroup
              id="email"
              type="email"
              label="Email Address"
              icon={Mail}
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputGroup
                id="password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                icon={Lock}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                isPassword
                showPassword={showPassword}
                togglePassword={() => setShowPassword(!showPassword)}
              />
              <InputGroup
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                label="Xaqiiji"
                icon={Lock}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                isPassword
                showPassword={showConfirmPassword}
                togglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            </div>

            {/* Plan Selection */}
            <div className="pt-2">
              <label className="block text-sm font-bold text-darkGray dark:text-gray-300 mb-4">Choose Business Type</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'SHOPS_ONLY', label: 'Shop', icon: Store, color: 'text-orange-500', activeBorder: 'border-orange-500', activeBg: 'bg-orange-500/5', desc: 'Supermarket & POS' },
                  { id: 'FACTORIES_ONLY', label: 'Factory', icon: Factory, color: 'text-blue-500', activeBorder: 'border-blue-500', activeBg: 'bg-blue-500/5', desc: 'Manufacturing' },
                  { id: 'PROJECTS_ONLY', label: 'Projects', icon: Briefcase, color: 'text-secondary', activeBorder: 'border-secondary', activeBg: 'bg-secondary/5', desc: 'Construction' },
                ].map((plan) => {
                  const Icon = plan.icon;
                  const isSelected = planType === plan.id;

                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setPlanType(plan.id)}
                      className={`relative p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-start text-left group hover:shadow-md ${isSelected
                        ? `${plan.activeBorder} ${plan.activeBg} shadow-sm`
                        : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                    >
                      {/* Checkmark Circle */}
                      <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? `border-current ${plan.color} bg-white dark:bg-gray-900` : 'border-gray-300 dark:border-gray-600'
                        }`}>
                        {isSelected && <div className={`w-2.5 h-2.5 rounded-full bg-current ${plan.color}`}></div>}
                      </div>



                      <div className={`p-2.5 rounded-xl mb-3 transition-colors ${isSelected ? 'bg-white dark:bg-gray-900 shadow-sm' : 'bg-gray-50 dark:bg-gray-700'} ${plan.color}`}>
                        <Icon size={20} />
                      </div>

                      <div>
                        <div className={`font-bold text-sm ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{plan.label}</div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5 leading-tight">{plan.desc}</div>
                      </div>
                    </button>
                  );
                })}
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
      </div >

      {/* Right Side - Visual Section */}
      < div className="hidden lg:flex w-1/2 relative bg-gray-900 overflow-hidden" >
        <Auth3DBackground />
      </div >
    </div >
  );
}