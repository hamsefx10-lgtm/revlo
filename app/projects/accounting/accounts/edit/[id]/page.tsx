// app/accounting/accounts/edit/[id]/page.tsx - Edit Account Page (10000% Design - API Integration)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/layouts/Layout';
import {
  ArrowLeft, Plus, Search, Filter, Calendar, List, LayoutGrid,
  DollarSign, CreditCard, Banknote, RefreshCw, Eye, Edit, Trash2,
  TrendingUp, TrendingDown, Info as InfoIcon, CheckCircle, XCircle, Clock as ClockIcon,
  User as UserIcon, Briefcase as BriefcaseIcon, Tag as TagIcon,
  Send, Repeat, ReceiptText, Users, Building, Package, Scale, Truck, Mail, Phone, MapPin, Coins, Loader2, ChevronRight
} from 'lucide-react';
import Toast from '@/components/common/Toast';

// --- Account Data Interface (Refined for API response) ---
interface Account {
  id: string;
  name: string;
  type: string; // e.g., "BANK", "CASH", "MOBILE_MONEY"
  balance: number; // Converted from Decimal
  currency: string;
}

export default function EditAccountPage() {
  const router = useRouter();
  const { id } = useParams(); // Get account ID from URL

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [currency, setCurrency] = useState('');
  const [balance, setBalance] = useState('');

  const [loading, setLoading] = useState(true); // For initial fetch
  const [submitting, setSubmitting] = useState(false); // For form submission
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const accountTypes = ['BANK', 'CASH', 'MOBILE_MONEY'];
  const currencies = ['ETB', 'USD', 'EUR', 'GBP']; // Example currencies

  // --- Fetch Account Details ---
  useEffect(() => {
    const fetchAccountDetails = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/projects/accounting/accounts/${id}`);
        if (!response.ok) throw new Error('Failed to fetch account details');
        const data = await response.json();

        // Populate form fields with fetched data
        const acc = data.account;
        setName(acc.name);
        setType(acc.type);
        setCurrency(acc.currency);
        setBalance(acc.balance.toString());

      } catch (error: any) {
        console.error('Error fetching account details for edit:', error);
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka faahfaahinta account-ka la soo gelinayay.', type: 'error' });
        router.push('/projects/accounting/accounts');
      } finally {
        setLoading(false);
      }
    };
    fetchAccountDetails();
  }, [id, router]);

  // --- Validation Logic ---
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Magaca Account-ka waa waajib.';
    if (!type) newErrors.type = 'Nooca Account-ka waa waajib.';
    if (!currency) newErrors.currency = 'Currency-ga waa waajib.';
    if (!balance || isNaN(Number(balance))) newErrors.balance = 'Balance waa waajib inuu ahaado tiro.';

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Handlers ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setValidationErrors({});
    setToastMessage(null);

    if (!validateForm()) {
      setSubmitting(false);
      setToastMessage({ message: 'Fadlan sax khaladaadka foomka.', type: 'error' });
      return;
    }

    try {
      const accountData = {
        name,
        type,
        currency,
        balance: parseFloat(balance),
      };

      const response = await fetch(`/api/projects/accounting/accounts/${id}`, { // Use PUT method for update
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update account');
      }

      setToastMessage({ message: data.message || 'Account-ka si guul leh ayaa loo cusboonaysiiyay!', type: 'success' });
      router.push('/projects/accounting/accounts'); // Redirect to accounts list on success
    } catch (error: any) {
      console.error('Account Edit API error:', error);
      setToastMessage({ message: 'Cilad shabakadeed ayaa dhacday. Fadlan isku day mar kale.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} /> Loading Account Data...
        </div>
      </Layout>
    );
  }

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
          Edit Account: {name}
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

          {/* Currency */}
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

          {/* Balance */}
          <div>
            <label htmlFor="balance" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Balance <span className="text-rose-500">*</span></label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <input
                type="number"
                step="0.01"
                id="balance"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
                className={`w-full p-3 pl-10 border rounded-2xl bg-white/60 dark:bg-gray-900/40 backdrop-blur-md text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner ${validationErrors.balance ? 'border-rose-500 ring-1 ring-rose-500' : 'border-lightGray dark:border-gray-700'}`}
              />
            </div>
            {validationErrors.balance && <p className="text-rose-500 text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1" />{validationErrors.balance}</p>}
          </div>

          {/* Info Note */}
          <div className="bg-orange-50/50 dark:bg-orange-900/10 backdrop-blur-md p-5 rounded-2xl flex items-start space-x-4 border border-orange-200/50 dark:border-orange-800/20">
            <InfoIcon className="text-orange-500 dark:text-orange-400 mt-0.5" size={20} />
            <p className="text-sm text-orange-700 dark:text-orange-300">
              <span className="font-bold">Digniin:</span> Adiga ayaa si ku meel gaadh ah loogu furay in aad Balance-ka beddesho. Guud ahaan habkan waa xiran yahay si aan lacagaha loo qaldin.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-primary text-white py-4 px-6 rounded-2xl font-black text-lg hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-1 flex items-center justify-center"
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="animate-spin mr-2" size={20} />
            ) : (
              <Edit size={20} className="mr-2" />
            )}
            {submitting ? 'Cusboonaysiinaya Account...' : 'Cusboonaysii Account'}
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
