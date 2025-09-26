'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import Layout from '../../../../components/layouts/Layout';
import {
  ArrowLeft, Edit, Loader2, Banknote, Tag as TagIcon, Coins, DollarSign, ChevronRight, Info as InfoIcon
} from 'lucide-react';
import Toast from '../../../../components/common/Toast';

// --- Account Data Interface ---
interface Account {
  id: string;
  name: string;
  type: string; // e.g., "BANK", "CASH", "MOBILE_MONEY"
  balance: number;
  currency: string;
}

export default function EditAccountPage() {
  const router = useRouter();
  const params = useParams();
  const accountId = params?.id as string;

  const [account, setAccount] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('BANK');
  const [balance, setBalance] = useState<number | ''>('');
  const [currency, setCurrency] = useState('ETB');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const accountTypes = ['BANK', 'CASH', 'MOBILE_MONEY'];
  const currencies = ['ETB', 'USD', 'EUR', 'GBP'];

  // Fetch account data
  useEffect(() => {
    const fetchAccount = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/accounting/accounts/${accountId}`);
        if (!res.ok) throw new Error('Account lama helin');
        const data = await res.json();
        setAccount(data.account);
        setName(data.account.name);
        setType(data.account.type);
        setBalance(data.account.balance);
        setCurrency(data.account.currency);
      } catch (err: any) {
        setToastMessage({ message: err.message || 'Cilad ayaa dhacday.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    if (accountId) fetchAccount();
  }, [accountId]);

  // Validation
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Magaca Account-ka waa waajib.';
    if (!type) newErrors.type = 'Nooca Account-ka waa waajib.';
    if (balance === '' || isNaN(Number(balance)) || Number(balance) < 0) newErrors.balance = 'Balance-ka waa inuu noqdaa nambar wanaagsan (ama eber).';
    if (!currency) newErrors.currency = 'Currency-ga waa waajib.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setToastMessage(null);

    if (!validateForm()) {
      setSubmitting(false);
      setToastMessage({ message: 'Fadlan sax khaladaadka foomka.', type: 'error' });
      return;
    }

    try {
      const response = await fetch(`/api/accounting/accounts/${accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          balance: balance === '' ? 0 : Number(balance),
          currency,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to update account');

      setToastMessage({ message: data.message || 'Account-ka waa la cusboonaysiiyay!', type: 'success' });
      router.push('/accounting/accounts');
    } catch (error: any) {
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka account-ka la cusboonaysiinayay.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/accounting/accounts" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Edit Account
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md animate-fade-in-up max-w-xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin mr-2" size={28} />
            <span>Loading account...</span>
          </div>
        ) : (
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
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${errors.name ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                />
              </div>
              {errors.name && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1"/>{errors.name}</p>}
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
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${errors.type ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                >
                  <option value="">-- Dooro Nooca --</option>
                  {accountTypes.map(typeOpt => <option key={typeOpt} value={typeOpt}>{typeOpt}</option>)}
                </select>
                <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
              </div>
              {errors.type && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1"/>{errors.type}</p>}
            </div>

            {/* Balance & Currency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="balance" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Balance <span className="text-redError">*</span></label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                  <input
                    type="number"
                    id="balance"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="Tusaale: 10000.00"
                    min={0}
                    className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${errors.balance ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                  />
                </div>
                <p className="text-xs text-mediumGray mt-1">Waa la ogol yahay in account la cusboonaysiiyo asagoo balance-kiisu eber yahay.</p>
                {errors.balance && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1"/>{errors.balance}</p>}
              </div>
              <div>
                <label htmlFor="currency" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Currency <span className="text-redError">*</span></label>
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                  <select
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${errors.currency ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                  >
                    <option value="">-- Dooro Currency --</option>
                    {currencies.map(curr => <option key={curr} value={curr}>{curr}</option>)}
                  </select>
                  <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
                </div>
                {errors.currency && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1"/>{errors.currency}</p>}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-primary text-white py-3 px-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md transform hover:scale-105 flex items-center justify-center"
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
        )}
      </div>
      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}