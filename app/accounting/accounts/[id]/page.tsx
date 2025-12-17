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
    category?: string | null;
    project?: { name: string; } | null; 
    customer?: { name: string; } | null; 
    vendor?: { name: string; } | null; 
    user?: { fullName: string; } | null; 
    employee?: { fullName: string; } | null;
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
        <div className="flex flex-row justify-center items-center gap-4 mb-4">
          <button 
            onClick={() => router.push(`/accounting/transactions/transfer?fromAccount=${account.id}`)}
            aria-label="Transfer Money" 
            title="Transfer Money"
            className="bg-[#E8F5E9] hover:bg-[#4CAF50]/90 hover:ring-2 hover:ring-[#4CAF50] p-4 rounded-xl flex items-center justify-center cursor-pointer transition duration-150 text-[#4CAF50]"
          >
            <Repeat className="" size={30} />
            <span className="sr-only">Transfer Money</span>
          </button>
          <Link href={`/accounting/accounts/edit/${account.id}`} aria-label="Edit Account" title="Edit Account">
            <div className="bg-[#FFF4DF] hover:bg-[#F7A400]/90 hover:ring-2 hover:ring-[#F7A400] p-4 rounded-xl flex items-center justify-center cursor-pointer transition duration-150 text-[#F7A400]">
              <Edit className="" size={30} />
              <span className="sr-only">Edit Account</span>
            </div>
          </Link>
          <button onClick={handleDeleteAccount} aria-label="Delete Account" title="Delete Account">
            <div className="bg-[#FEE8E8] hover:bg-[#E03C32]/90 hover:ring-2 hover:ring-red-500 p-4 rounded-xl flex items-center justify-center cursor-pointer transition duration-150 text-[#E03C32]">
              <Trash2 className="" size={30} />
              <span className="sr-only">Delete Account</span>
            </div>
          </button>
        </div>
      </div>

      {/* Account Summary Cards - Mobile & Desktop Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 w-full max-w-full">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md text-center border-l-4 border-primary w-full min-w-0 max-w-full flex flex-col items-center py-3">
          <Banknote className="text-primary mb-1" size={30}/>
          <h4 className="text-xs font-semibold text-mediumGray dark:text-gray-400 mb-1">Magaca Account-ka</h4>
          <span className="text-2xl font-bold text-primary truncate">{account.name}</span>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md text-center border-l-4 border-secondary w-full min-w-0 max-w-full flex flex-col items-center py-3">
          <TagIcon className="text-secondary mb-1" size={30}/>
          <h4 className="text-xs font-semibold text-mediumGray dark:text-gray-400 mb-1">Nooca Account-ka</h4>
          <span className="text-2xl font-bold text-secondary">{account.type}</span>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md text-center border-l-4 border-accent w-full min-w-0 max-w-full flex flex-col items-center py-3">
          <Coins className="text-accent mb-1" size={30}/>
          <h4 className="text-xs font-semibold text-mediumGray dark:text-gray-400 mb-1">Currency</h4>
          <span className="text-2xl font-bold text-accent">{account.currency}</span>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md text-center border-l-4 border-darkGray w-full min-w-0 max-w-full flex flex-col items-center py-3">
          <DollarSign className="text-darkGray dark:text-gray-100 mb-1" size={30}/>
          <h4 className="text-xs font-semibold text-mediumGray dark:text-gray-400 mb-1">Balance Hadda</h4>
          <span className="text-2xl font-bold text-darkGray dark:text-gray-100">${account.balance.toLocaleString()}</span>
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

          {/* Transactions Section - Desktop Table & Mobile Cards */}
          {activeTab === 'Transactions' && (
            <div>
              <h3 className="text-xl font-bold text-darkGray dark:text-gray-100 mb-3">Dhaqdhaqaaqa Account-kan</h3>
              {account.transactions.length === 0 ? (
                <p className="text-sm text-mediumGray dark:text-gray-400">Ma jiraan dhaqdhaqaaq lacag ah oo la xiriira account-kan.</p>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto mb-4">
                    <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700 bg-white dark:bg-gray-800 rounded-lg">
                      <thead className="bg-lightGray dark:bg-gray-700">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Taariikhda</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Sharaxaad</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Nooca</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Category</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Project</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">La Xiriira</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Qiimaha</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                        {account.transactions.map((trx) => {
                          const isIncome = trx.type === 'INCOME' || trx.type === 'TRANSFER_IN' || trx.type === 'DEBT_REPAID';
                          const amountColorClass = isIncome ? 'text-secondary' : 'text-redError';
                          const typeBadgeClass = isIncome 
                            ? 'bg-secondary/10 text-secondary border border-secondary/20' 
                            : 'bg-redError/10 text-redError border border-redError/20';
                          const relatedName = trx.project?.name || trx.customer?.name || trx.vendor?.name || trx.employee?.fullName || trx.user?.fullName || 'N/A';
                          
                          return (
                            <tr key={trx.id} className="hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-150">
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-darkGray dark:text-gray-100">
                                {new Date(trx.transactionDate).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-mediumGray dark:text-gray-300">
                                {trx.description}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${typeBadgeClass}`}>
                                  {trx.type}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-mediumGray dark:text-gray-300">
                                {trx.category || 'N/A'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-mediumGray dark:text-gray-300">
                                {trx.project?.name || 'N/A'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-mediumGray dark:text-gray-300">
                                {relatedName}
                              </td>
                              <td className={`px-4 py-3 whitespace-nowrap text-right font-semibold ${amountColorClass}`}>
                                {isIncome ? '+' : '-'}${Math.abs(trx.amount).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <Link href={`/accounting/transactions/${trx.id}`} className="text-primary hover:underline text-xs font-medium">
                                  Fiiri →
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="lg:hidden flex flex-col gap-3 w-full max-w-full">
                    {account.transactions.map((trx) => {
                      const isIncome = trx.type === 'INCOME' || trx.type === 'TRANSFER_IN' || trx.type === 'DEBT_REPAID';
                      const amountColorClass = isIncome ? 'text-secondary' : 'text-redError';
                      const typeBadgeClass = isIncome 
                        ? 'bg-secondary/10 text-secondary border border-secondary/20' 
                        : 'bg-redError/10 text-redError border border-redError/20';
                      const relatedName = trx.project?.name || trx.customer?.name || trx.vendor?.name || trx.employee?.fullName || trx.user?.fullName || 'N/A';
                      
                      return (
                        <div key={trx.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-lightGray dark:border-gray-700 p-4 w-full">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {isIncome ? <DollarSign className="text-secondary flex-shrink-0" size={18}/> : <XCircle className="text-redError flex-shrink-0" size={18}/>} 
                                <span className="font-semibold text-darkGray dark:text-gray-100 text-sm break-words">{trx.description}</span>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${typeBadgeClass}`}>
                                  {trx.type}
                                </span>
                                {trx.category && (
                                  <span className="text-xs text-mediumGray dark:text-gray-400 bg-lightGray dark:bg-gray-700 px-2 py-0.5 rounded">
                                    {trx.category}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className={`font-bold text-lg ${amountColorClass} flex-shrink-0 ml-2`}>
                              {isIncome ? '+' : '-'}${Math.abs(trx.amount).toLocaleString()}
                            </span>
                          </div>
                          <div className="space-y-1 text-xs text-mediumGray dark:text-gray-400 border-t border-lightGray dark:border-gray-700 pt-2 mt-2">
                            <div className="flex justify-between">
                              <span>Taariikhda:</span>
                              <span>{new Date(trx.transactionDate).toLocaleDateString()}</span>
                            </div>
                            {trx.project?.name && (
                              <div className="flex justify-between">
                                <span>Project:</span>
                                <span>{trx.project.name}</span>
                              </div>
                            )}
                            {relatedName !== 'N/A' && (
                              <div className="flex justify-between">
                                <span>La Xiriira:</span>
                                <span>{relatedName}</span>
                              </div>
                            )}
                          </div>
                          <Link href={`/accounting/transactions/${trx.id}`} className="mt-2 text-primary hover:underline text-xs font-medium block">
                            Fiiri Faahfaahinta →
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              <Link href="/accounting/transactions/add" className="mt-5 bg-primary text-white py-2 px-4 rounded-lg flex items-center justify-center hover:bg-blue-700 transition w-full sm:w-fit text-sm font-bold">
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
