// app/accounting/accounts/edit/[id]/page.tsx - Edit Account Page (10000% Design - API Integration)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import Layout from '../../../../../components/layouts/Layout';
import { 
  ArrowLeft, Plus, Search, Filter, Calendar, List, LayoutGrid, 
  DollarSign, CreditCard, Banknote, RefreshCw, Eye, Edit, Trash2,
  TrendingUp, TrendingDown, Info as InfoIcon, CheckCircle, XCircle, Clock as ClockIcon,
  User as UserIcon, Briefcase as BriefcaseIcon, Tag as TagIcon,
  Send, Repeat, ReceiptText, Users, Building, Package, Scale, Truck, Mail, Phone, MapPin, Coins, Loader2, ChevronRight
} from 'lucide-react';
import Toast from '../../../../../components/common/Toast';

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
  const [balance, setBalance] = useState<number | ''>('');
  const [currency, setCurrency] = useState('');

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
        const response = await fetch(`/api/accounting/accounts/${id}`);
        if (!response.ok) throw new Error('Failed to fetch account details');
        const data = await response.json();
        
        // Populate form fields with fetched data
        const acc = data.account;
        setName(acc.name);
        setType(acc.type);
        setBalance(parseFloat(acc.balance)); // Convert Decimal to number
        setCurrency(acc.currency);

      } catch (error: any) {
        console.error('Error fetching account details for edit:', error);
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka faahfaahinta account-ka la soo gelinayay.', type: 'error' });
        router.push('/accounting/accounts'); 
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
    if (typeof balance !== 'number' || balance < 0) newErrors.balance = 'Balance-ka waa waajib oo waa inuu noqdaa nambar wanaagsan (ama eber).';
    if (!currency) newErrors.currency = 'Currency-ga waa waajib.';
    
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
        balance,
        currency,
      };

      const response = await fetch(`/api/accounting/accounts/${id}`, { // Use PUT method for update
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update account');
      }

      setToastMessage({ message: data.message || 'Account-ka si guul leh ayaa loo cusboonaysiiyay!', type: 'success' });
      router.push('/accounting/accounts'); // Redirect to accounts list on success
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/accounting/accounts" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Edit Account: {name}
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
              <label htmlFor="balance" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Balance ($) <span className="text-redError">*</span></label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <input
                  type="number"
                  id="balance"
                  value={balance}
                  readOnly
                  // onChange-ka iyo suurtagalnimada beddelid waa la xadidayaa
                  placeholder="Tusaale: 10000.00"
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.balance ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                />
                <p className="text-info text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1" />Lacagta account-ka lama edit-gareyn karo si toos ah. Si lacag loo kordhiyo ama loo dhimo, isticmaal income, expense, ama transfer oo keliya.</p>
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
    </Layout>
  );
}
