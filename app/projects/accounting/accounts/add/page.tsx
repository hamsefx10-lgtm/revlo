// app/accounting/accounts/add/page.tsx - Add New Account Page (10000% Design - API Integration)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layouts/Layout';
import {
  ArrowLeft, Plus, DollarSign, Banknote, Tag as TagIcon, Coins, Loader2, Info as InfoIcon,
  CheckCircle, XCircle, ChevronRight // General icons
} from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function AddAccountPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState(''); // e.g., "BANK", "CASH", "MOBILE_MONEY"
  const [balance, setBalance] = useState<number | ''>(''); // Initial balance
  const balanceOptions = [0, 100, 500, 1000, 5000, 10000, 'custom'];
  const [balanceMode, setBalanceMode] = useState<'option' | 'custom'>('option');
  const [currency, setCurrency] = useState('ETB'); // Default currency

  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const accountTypes = ['BANK', 'CASH', 'MOBILE_MONEY'];
  const currencies = ['ETB', 'USD', 'EUR', 'GBP']; // Example currencies

  // --- Validation Logic ---
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Magaca Account-ka waa waajib.';
    if (!type) newErrors.type = 'Nooca Account-ka waa waajib.';
    if (balance !== '' && (typeof balance !== 'number' || isNaN(balance) || balance < 0)) {
      newErrors.balance = 'Haddii aad geliso, balance-ku waa inuu noqdaa nambar wanaagsan (ama eber).';
    }
    if (!currency) newErrors.currency = 'Currency-ga waa waajib.';
    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Handlers ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setValidationErrors({});
    setToastMessage(null);

    if (!validateForm()) {
      setLoading(false);
      setToastMessage({ message: 'Fadlan sax khaladaadka foomka.', type: 'error' });
      return;
    }

    const accountData: any = {
      name,
      type,
      currency,
    };
    if (balance !== '' && typeof balance === 'number' && !isNaN(balance)) {
      accountData.balance = balance;
    }

    try {
      const response = await fetch('/api/projects/accounting/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add account');
      }

      setToastMessage({ message: data.message || 'Account-ka si guul leh ayaa loo daray!', type: 'success' });

      // Clear form
      setName(''); setType(''); setBalance(''); setCurrency('ETB');
      setValidationErrors({});

      router.push('/projects/accounting/accounts'); // Redirect to accounts list
    } catch (error: any) {
      console.error('Account Add API error:', error);
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka account-ka la darayay.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {/* Background Glow Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-primary/10 blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-emerald-400/5 dark:bg-emerald-500/10 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      <div className="relative z-10">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 sm:mb-8 lg:mb-10 gap-4 sm:gap-6">
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
          <Link href="/projects/accounting/accounts" className="inline-flex items-center text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-primary transition-colors mb-3">
            <ArrowLeft size={16} className="mr-2" /> Ku Noqo
          </Link>
          Ku Dar Account Cusub
        </h1>
      </div>

      <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl p-5 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] shadow-xl border border-white/50 dark:border-gray-700/50 animate-fade-in-up">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Account Name */}
          <div>
            <label htmlFor="name" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Magaca Account-ka <span className="text-rose-500">*</span></label>
            <div className="relative">
              <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tusaale: CBE Account"
                className={`w-full p-3 pl-10 border rounded-2xl bg-white/60 dark:bg-gray-900/40 backdrop-blur-md text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner ${validationErrors.name ? 'border-rose-500 ring-1 ring-rose-500' : 'border-lightGray dark:border-gray-700'}`}
              />
            </div>
            {validationErrors.name && <p className="text-rose-500 text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1" />{validationErrors.name}</p>}
          </div>

          {/* Account Type */}
          <div>
            <label htmlFor="type" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Nooca Account-ka <span className="text-rose-500">*</span></label>
            <div className="relative">
              <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={`w-full p-3 pl-10 border rounded-2xl bg-white/60 dark:bg-gray-900/40 backdrop-blur-md text-gray-900 dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner ${validationErrors.type ? 'border-rose-500 ring-1 ring-rose-500' : 'border-lightGray dark:border-gray-700'}`}
              >
                <option value="">-- Dooro Nooca --</option>
                {accountTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
              <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
            </div>
            {validationErrors.type && <p className="text-rose-500 text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1" />{validationErrors.type}</p>}
          </div>

          {/* Balance & Currency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label htmlFor="balance" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Balance ($) <span className="text-xs text-mediumGray">(optional)</span></label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                {balanceMode === 'option' ? (
                  <select
                    id="balance"
                    value={balance === '' ? '' : balance}
                    onChange={e => {
                      if (e.target.value === 'custom') {
                        setBalanceMode('custom');
                        setBalance('');
                      } else {
                        setBalance(Number(e.target.value));
                      }
                    }}
                    className={`w-full p-3 pl-10 border rounded-2xl bg-white/60 dark:bg-gray-900/40 backdrop-blur-md text-gray-900 dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner ${validationErrors.balance ? 'border-rose-500 ring-1 ring-rose-500' : 'border-lightGray dark:border-gray-700'}`}
                  >
                    <option value="">-- Dooro Balance --</option>
                    {balanceOptions.map(opt => (
                      <option key={opt} value={opt}>{opt === 'custom' ? 'Custom Value...' : `$${opt}`}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    id="balance-custom"
                    value={balance}
                    onChange={e => setBalance(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="Geli Balance Custom..."
                    min={0}
                    className={`w-full p-3 pl-10 border rounded-2xl bg-white/60 dark:bg-gray-900/40 backdrop-blur-md text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner ${validationErrors.balance ? 'border-rose-500 ring-1 ring-rose-500' : 'border-lightGray dark:border-gray-700'}`}
                  />
                )}
                {balanceMode === 'custom' && (
                  <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary text-xs underline" onClick={() => setBalanceMode('option')}>Back to options</button>
                )}
                <p className="text-xs text-mediumGray mt-1">Waa la ogol yahay in account la abuuro asagoo balance-kiisu eber yahay ama banaan yahay.</p>
              </div>
              {validationErrors.balance && <p className="text-rose-500 text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1" />{validationErrors.balance}</p>}
            </div>
            <div>
              <label htmlFor="currency" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Currency <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={`w-full p-3 pl-10 border rounded-2xl bg-white/60 dark:bg-gray-900/40 backdrop-blur-md text-gray-900 dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner ${validationErrors.currency ? 'border-rose-500 ring-1 ring-rose-500' : 'border-lightGray dark:border-gray-700'}`}
                >
                  <option value="">-- Dooro Currency --</option>
                  {currencies.map(curr => <option key={curr} value={curr}>{curr}</option>)}
                </select>
                <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
              </div>
              {validationErrors.currency && <p className="text-rose-500 text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1" />{validationErrors.currency}</p>}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-primary text-white py-4 px-6 rounded-2xl font-black text-lg hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-1 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin mr-2" size={20} />
            ) : (
              <Plus className="mr-2" size={20} />
            )}
            {loading ? 'Diiwaan Gelinaya Account...' : 'Diiwaan Geli Account'}
          </button>
        </form>
      </div>

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
      </div>
    </Layout>
  );
}
