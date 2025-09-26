// app/accounting/accounts/add/page.tsx - Add New Account Page (10000% Design - API Integration)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '../../../../components/layouts/Layout';
import { 
  ArrowLeft, Plus, DollarSign, Banknote, Tag as TagIcon, Coins, Loader2, Info as InfoIcon,
  CheckCircle, XCircle, ChevronRight // General icons
} from 'lucide-react';
import Toast from '../../../../components/common/Toast';

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
      const response = await fetch('/api/accounting/accounts', {
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

      router.push('/accounting/accounts'); // Redirect to accounts list
    } catch (error: any) {
      console.error('Account Add API error:', error);
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka account-ka la darayay.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/accounting/accounts" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Ku Dar Account Cusub
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md animate-fade-in-up">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Name */}
          <div>
            <label htmlFor="name" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Magaca Account-ka <span className="text-redError">*</span></label>
            <div className="relative">
              <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tusaale: CBE Account"
                className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.name ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
              />
            </div>
            {validationErrors.name && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1"/>{validationErrors.name}</p>}
          </div>

          {/* Account Type */}
          <div>
            <label htmlFor="type" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Nooca Account-ka <span className="text-redError">*</span></label>
            <div className="relative">
              <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.type ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
              >
                <option value="">-- Dooro Nooca --</option>
                {accountTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
              <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
            </div>
            {validationErrors.type && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1"/>{validationErrors.type}</p>}
          </div>

          {/* Balance & Currency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.balance ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
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
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.balance ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                />
              )}
              {balanceMode === 'custom' && (
                <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary text-xs underline" onClick={() => setBalanceMode('option')}>Back to options</button>
              )}
              <p className="text-xs text-mediumGray mt-1">Waa la ogol yahay in account la abuuro asagoo balance-kiisu eber yahay ama banaan yahay.</p>
            </div>
            {validationErrors.balance && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1"/>{validationErrors.balance}</p>}
            </div>
            <div>
              <label htmlFor="currency" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Currency <span className="text-redError">*</span></label>
              <div className="relative">
                <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.currency ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                >
                  <option value="">-- Dooro Currency --</option>
                  {currencies.map(curr => <option key={curr} value={curr}>{curr}</option>)}
                </select>
                <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
              </div>
              {validationErrors.currency && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1"/>{validationErrors.currency}</p>}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-primary text-white py-3 px-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md transform hover:scale-105 flex items-center justify-center"
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
    </Layout>
  );
}
