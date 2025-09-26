// app/accounting/accounts/[id]/page.tsx - Account Details Page (10000% Design - API Integration)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Layout from '../../../../components/layouts/Layout';
import { 
  ArrowLeft, Plus, DollarSign, Banknote, Tag as TagIcon, Coins, Loader2, Info as InfoIcon,
  CheckCircle, XCircle, ChevronRight, Edit, Trash2, Calendar, MessageSquare, Briefcase as BriefcaseIcon,
  User as UserIcon, ReceiptText, Repeat // Icons for various details and actions
} from 'lucide-react';
import Toast from '../../../../components/common/Toast';

// --- Account Data Interface (Refined for API response) ---
interface Account {
  id: string;
  name: string;
  type: string; // e.g., "BANK", "CASH", "MOBILE_MONEY"
  balance: number; // Converted from Decimal
  currency: string;
  createdAt: string;
  updatedAt: string;
  // Nested data from API includes
  transactions: { 
    id: string; 
    description: string; 
    amount: number; 
    type: string; 
    transactionDate: string; 
    project?: { name: string; }; 
    customer?: { name: string; }; 
    vendor?: { name: string; }; 
    user?: { fullName: string; }; 
    employee?: { fullName: string; };
  }[];
  fromTransactions: { 
    id: string; 
    description: string; 
    amount: number; 
    type: string; 
    transactionDate: string; 
    toAccount?: { name: string; }; 
  }[];
  toTransactions: { 
    id: string; 
    description: string; 
    amount: number; 
    type: string; 
    transactionDate: string; 
    fromAccount?: { name: string; }; 
  }[];
}

function Page() {
  const { id } = useParams();
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const fetchAccountDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/accounting/accounts/${id}`);
      if (!response.ok) throw new Error('Failed to fetch account details');
      const data = await response.json();
      const processedAccount = {
        ...data.account,
        balance: parseFloat(data.account.balance),
        transactions: data.account.transactions.map((trx: any) => ({ ...trx, amount: parseFloat(trx.amount) })),
        fromTransactions: data.account.fromTransactions.map((trx: any) => ({ ...trx, amount: parseFloat(trx.amount) })),
        toTransactions: data.account.toTransactions.map((trx: any) => ({ ...trx, amount: parseFloat(trx.amount) })),
      };
      setAccount(processedAccount);
    } catch (error: any) {
      console.error('Error fetching account details:', error);
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka faahfaahinta account-ka la soo gelinayay.', type: 'error' });
      setAccount(null);
      router.push('/accounting/accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Ma hubtaa inaad tirtirto account-kan? Tan lama soo celin karo!')) {
      try {
        const response = await fetch(`/api/accounting/accounts/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete account');
        setToastMessage({ message: data.message || 'Account-ka si guul leh ayaa loo tirtiray!', type: 'success' });
        router.push('/accounting/accounts');
      } catch (error: any) {
        console.error('Error deleting account:', error);
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka account-ka la tirtirayay.', type: 'error' });
      }
    }
  };

  useEffect(() => {
    if (id) {
      fetchAccountDetails();
    }
  }, [id, router]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px] text-darkGray dark:text-gray-100">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} /> Loading Account Details...
        </div>
      </Layout>
    );
  }

  if (!account) {
    return (
      <Layout>
        <div className="text-center p-8 text-redError bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <InfoIcon size={32} className="inline-block mb-4 text-redError"/>
          <p className="text-xl font-bold">Account-ka ID "{id}" lama helin.</p>
          <Link href="/accounting/accounts" className="mt-4 inline-block text-primary hover:underline">Ku Noqo Accounts-ka &rarr;</Link>
        </div>
        {toastMessage && (
          <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
        )}
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 lg:mb-8 gap-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/accounting/accounts" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-3 sm:mr-4">
            <ArrowLeft size={24} className="inline-block sm:w-7 sm:h-7" />
          </Link>
          Account: {account.name}
        </h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Link href="/accounting/transactions/add" className="bg-primary text-white py-2.5 px-4 sm:px-6 rounded-lg font-bold text-sm sm:text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center justify-center">
            <Plus size={18} className="mr-2" /> Diiwaan Geli Dhaqdhaqaaq
          </Link>
          <Link href={`/accounting/accounts/edit/${account.id}`} className="bg-accent text-white py-2.5 px-4 sm:px-6 rounded-lg font-bold text-sm sm:text-lg hover:bg-orange-600 transition duration-200 shadow-md flex items-center justify-center">
            <Edit size={18} className="mr-2" /> Edit Account
          </Link>
          <button onClick={handleDeleteAccount} className="bg-redError text-white py-2.5 px-4 sm:px-6 rounded-lg font-bold text-sm sm:text-lg hover:bg-red-700 transition duration-200 shadow-md flex items-center justify-center">
            <Trash2 size={18} className="mr-2" /> Delete
          </button>
        </div>
      </div>

      {/* Account Summary Cards - Mobile Optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8 animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 lg:p-6 rounded-lg lg:rounded-xl shadow-md text-center hover:shadow-lg transition-shadow duration-300">
          <h4 className="text-xs sm:text-sm lg:text-lg font-semibold text-mediumGray dark:text-gray-400 mb-1 lg:mb-2">Magaca Account-ka</h4>
          <p className="text-sm sm:text-lg lg:text-3xl font-extrabold text-primary truncate">{account.name}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 lg:p-6 rounded-lg lg:rounded-xl shadow-md text-center hover:shadow-lg transition-shadow duration-300">
          <h4 className="text-xs sm:text-sm lg:text-lg font-semibold text-mediumGray dark:text-gray-400 mb-1 lg:mb-2">Nooca Account-ka</h4>
          <p className="text-sm sm:text-lg lg:text-3xl font-extrabold text-secondary">{account.type}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 lg:p-6 rounded-lg lg:rounded-xl shadow-md text-center hover:shadow-lg transition-shadow duration-300">
          <h4 className="text-xs sm:text-sm lg:text-lg font-semibold text-mediumGray dark:text-gray-400 mb-1 lg:mb-2">Currency</h4>
          <p className="text-sm sm:text-lg lg:text-3xl font-extrabold text-accent">{account.currency}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 lg:p-6 rounded-lg lg:rounded-xl shadow-md text-center hover:shadow-lg transition-shadow duration-300">
          <h4 className="text-xs sm:text-sm lg:text-lg font-semibold text-mediumGray dark:text-gray-400 mb-1 lg:mb-2">Balance Hadda</h4>
          <p className="text-sm sm:text-lg lg:text-3xl font-extrabold text-darkGray dark:text-gray-100">${account.balance.toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs for Account Details - Mobile Optimized */}
      <div className="bg-white dark:bg-gray-800 rounded-lg lg:rounded-xl shadow-md overflow-hidden animate-fade-in-up">
        <div className="border-b border-lightGray dark:border-gray-700">
          <nav className="-mb-px flex overflow-x-auto space-x-2 sm:space-x-4 lg:space-x-8 px-4 sm:px-6 lg:px-8" aria-label="Tabs">
            {['Overview', 'Transactions', 'Transfers'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-sm sm:text-base lg:text-lg focus:outline-none transition-colors duration-200 flex-shrink-0
                            ${activeTab === tab 
                              ? 'border-primary text-primary dark:text-gray-100' 
                              : 'border-transparent text-mediumGray dark:text-gray-400 hover:text-darkGray dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content - Mobile Optimized */}
        <div className="p-4 sm:p-6 lg:p-8">
          {activeTab === 'Overview' && (
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-darkGray dark:text-gray-100 mb-3 sm:mb-4">Macluumaadka Guud</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm sm:text-base text-darkGray dark:text-gray-100">
                <p><span className="font-semibold text-mediumGray dark:text-gray-400">Magaca Account-ka:</span> {account.name}</p>
                <p><span className="font-semibold text-mediumGray dark:text-gray-400">Nooca:</span> {account.type}</p>
                <p><span className="font-semibold text-mediumGray dark:text-gray-400">Currency:</span> {account.currency}</p>
                <p><span className="font-semibold text-mediumGray dark:text-gray-400">Balance Hadda:</span> ${account.balance.toLocaleString()}</p>
                <p><span className="font-semibold text-mediumGray dark:text-gray-400">Taariikhda Abuurista:</span> {new Date(account.createdAt).toLocaleDateString()}</p>
                <p><span className="font-semibold text-mediumGray dark:text-gray-400">Taariikhda Cusboonaysiinta:</span> {new Date(account.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}

          {activeTab === 'Transactions' && (
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-darkGray dark:text-gray-100 mb-3 sm:mb-4">Dhaqdhaqaaqa Account-kan</h3>
              {account.transactions.length === 0 ? (
                <p className="text-sm sm:text-base text-mediumGray dark:text-gray-400">Ma jiraan dhaqdhaqaaq lacag ah oo la xiriira account-kan.</p>
              ) : (
                <ul className="space-y-2 sm:space-y-3">
                  {account.transactions.map((trx: any) => (
                    <li key={trx.id} className="bg-lightGray dark:bg-gray-700 p-3 sm:p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          {trx.amount >= 0 ? <DollarSign className="text-secondary flex-shrink-0" size={18}/> : <XCircle className="text-redError flex-shrink-0" size={18}/>} 
                          <span className="font-semibold text-sm sm:text-base text-darkGray dark:text-gray-100 truncate">{trx.description}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <span className={`${trx.amount >= 0 ? 'text-secondary' : 'text-redError'} font-bold text-sm sm:text-base`}>
                            {trx.amount >= 0 ? '+' : '-'}${Math.abs(trx.amount).toLocaleString()}
                          </span>
                          <span className="text-xs sm:text-sm text-mediumGray dark:text-gray-400">{new Date(trx.transactionDate).toLocaleDateString()}</span>
                          <Link href={`/accounting/transactions/${trx.id}`} className="text-primary hover:underline text-xs sm:text-sm font-medium">Fiiri &rarr;</Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/accounting/transactions/add" className="mt-3 sm:mt-4 bg-primary text-white py-2 px-4 rounded-lg flex items-center hover:bg-blue-700 transition duration-200 w-fit text-sm sm:text-base">
                  <Plus size={16} className="mr-2"/> Diiwaan Geli Dhaqdhaqaaq
              </Link>
            </div>
          )}

          {activeTab === 'Transfers' && (
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-darkGray dark:text-gray-100 mb-3 sm:mb-4">Wareejinta Lacagta</h3>
              {account.fromTransactions.length === 0 && account.toTransactions.length === 0 ? (
                <p className="text-sm sm:text-base text-mediumGray dark:text-gray-400">Ma jiraan wareejin lacag ah oo la xiriira account-kan.</p>
              ) : (
                <ul className="space-y-2 sm:space-y-3">
                  {account.fromTransactions.map((trx: any) => (
                    <li key={trx.id} className="bg-lightGray dark:bg-gray-700 p-3 sm:p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <Repeat className="text-redError flex-shrink-0" size={18} />
                          <span className="font-semibold text-sm sm:text-base text-darkGray dark:text-gray-100 truncate">Laga Wareejiyay Account-kan ({trx.description})</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <span className="text-redError font-bold text-sm sm:text-base">-${trx.amount.toLocaleString()}</span>
                          <span className="text-xs sm:text-sm text-mediumGray dark:text-gray-400">Loo wareejiyay: {trx.toAccount?.name}</span>
                          <Link href={`/accounting/transactions/${trx.id}`} className="text-primary hover:underline text-xs sm:text-sm font-medium">Fiiri &rarr;</Link>
                        </div>
                      </div>
                    </li>
                  ))}
                  {account.toTransactions.map((trx: any) => (
                    <li key={trx.id} className="bg-lightGray dark:bg-gray-700 p-3 sm:p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <Repeat className="text-secondary flex-shrink-0" size={18} />
                          <span className="font-semibold text-sm sm:text-base text-darkGray dark:text-gray-100 truncate">Loo Wareejiyay Account-kan ({trx.description})</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <span className="text-secondary font-bold text-sm sm:text-base">+${trx.amount.toLocaleString()}</span>
                          <span className="text-xs sm:text-sm text-mediumGray dark:text-gray-400">Laga wareejiyay: {trx.fromAccount?.name}</span>
                          <Link href={`/accounting/transactions/${trx.id}`} className="text-primary hover:underline text-xs sm:text-sm font-medium">Fiiri &rarr;</Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
               <Link href="/accounting/transactions/add?type=TRANSFER_OUT" className="mt-3 sm:mt-4 bg-primary text-white py-2 px-4 rounded-lg flex items-center hover:bg-blue-700 transition duration-200 w-fit text-sm sm:text-base">
                  <Plus size={16} className="mr-2"/> Samee Wareejin Cusub
              </Link>
            </div>
          )}
        </div>
      </div>

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}

export default Page;
