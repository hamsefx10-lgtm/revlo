//app/accounting/accounts/page.tsx - Accounts List Page (10000% Design - API Integration)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '../../../components/layouts/Layout';
import { 
  ArrowLeft, Plus, Search, Filter, Calendar, List, LayoutGrid, 
  DollarSign, CreditCard, Banknote, RefreshCw, Eye, Edit, Trash2, Coins, Loader2,
  TrendingUp, TrendingDown, Info as InfoIcon, CheckCircle, XCircle, Clock as ClockIcon,
  User as UserIcon, Briefcase as BriefcaseIcon, Tag as TagIcon, ChevronRight, Repeat // General icons for tables
} from 'lucide-react';
import Toast from '../../../components/common/Toast';

// --- Account Data Interface (Refined for API response) ---
interface Account {
  id: string;
  name: string;
  type: string; // e.g., "BANK", "CASH", "MOBILE_MONEY"
  balance: number; // Converted from Decimal
  currency: string;
  createdAt: string;
  updatedAt: string;
}

// --- Account Table Row Component ---
const AccountRow: React.FC<{ account: Account; onEdit: (id: string) => void; onDelete: (id: string) => void }> = ({ account, onEdit, onDelete }) => (
  <tr className="hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-150 border-b border-lightGray dark:border-gray-700 last:border-b-0">
    <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-medium flex items-center space-x-2">
        <Banknote size={18} className="text-primary"/> <span>{account.name}</span>
    </td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{account.type}</td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{account.currency}</td>
    <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-semibold text-right">${account.balance.toLocaleString()}</td>
    <td className="p-4 whitespace-nowrap text-right">
      <div className="flex items-center justify-end space-x-2">
        <Link href={`/accounting/transactions/transfer?fromAccount=${account.id}`} className="p-2 rounded-full bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white transition-colors duration-200" title="Transfer Money" aria-label="Transfer Money">
          <Repeat size={18} />
        </Link>
        <Link href={`/accounting/accounts/${account.id}`} className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200" title="View Details">
          <Eye size={18} />
        </Link>
          <button onClick={() => onEdit(account.id)} className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Edit Account" aria-label="Edit Account">
            <Edit size={18} />
          </button>
          <button onClick={() => onDelete(account.id)} className="p-2 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete Account" aria-label="Delete Account">
            <Trash2 size={18} />
          </button>
      </div>
    </td>
  </tr>
);

// --- Account Card Component (for Mobile View) ---
const AccountCard: React.FC<{ account: Account; onEdit: (id: string) => void; onDelete: (id: string) => void }> = ({ account, onEdit, onDelete }) => (
  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md animate-fade-in-up border-l-4 border-primary relative">
    <div className="flex justify-between items-start mb-3">
      <h4 className="font-semibold text-darkGray dark:text-gray-100 text-lg flex items-center space-x-2">
        <Banknote size={20} className="text-primary"/> <span>{account.name}</span>
      </h4>
      <div className="flex space-x-2 flex-shrink-0">
        <button onClick={() => onEdit(account.id)} className="p-1 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Edit Account" aria-label="Edit Account">
          <Edit size={16} />
        </button>
        <button onClick={() => onDelete(account.id)} className="p-1 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete Account" aria-label="Delete Account">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
    <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
        <TagIcon size={14}/> <span>Nooca: {account.type}</span>
    </p>
    <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
        <Coins size={14}/> <span>Currency: {account.currency}</span>
    </p>
    <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
        <DollarSign size={14}/> <span>Balance: ${account.balance.toLocaleString()}</span>
    </p>
    <Link href={`/accounting/accounts/${account.id}`} className="mt-3 inline-block text-primary hover:underline text-sm font-medium">
        Fiiri Faahfaahin &rarr;
    </Link>
  </div>
);


export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterCurrency, setFilterCurrency] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [pageLoading, setPageLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Dummy filter options (will be fetched from API in real app)
  const accountTypes = ['All', 'BANK', 'CASH', 'MOBILE_MONEY'];
  const currencies = ['All', 'ETB', 'USD', 'EUR', 'GBP'];

  // --- API Functions ---
  const fetchAccounts = async () => {
    setPageLoading(true);
    try {
      const response = await fetch('/api/accounting/accounts');
      if (!response.ok) throw new Error('Failed to fetch accounts');
      const data = await response.json();
      setAccounts(data.accounts.map((acc: any) => ({ ...acc, balance: parseFloat(acc.balance) }))); // Convert Decimal to Number
    } catch (error: any) {
      console.error('Error fetching accounts:', error);
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka accounts-ka la soo gelinayay.', type: 'error' });
      setAccounts([]);
    } finally {
      setPageLoading(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (window.confirm('Ma hubtaa inaad tirtirto account-kan? Tan lama soo celin karo!')) {
      try {
        const response = await fetch(`/api/accounting/accounts/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete account');
        
        setToastMessage({ message: data.message || 'Account-ka si guul leh ayaa loo tirtiray!', type: 'success' });
        fetchAccounts(); // Re-fetch accounts after deleting
      } catch (error: any) {
        console.error('Error deleting account:', error);
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka account-ka la tirtirayay.', type: 'error' });
      }
    }
  };

  const handleEditAccount = (id: string) => {
    router.push(`/accounting/accounts/edit/${id}`); // Navigate to edit account page
  };

  useEffect(() => {
    fetchAccounts(); // Fetch accounts on component mount
    // Listen for custom event to refresh accounts (e.g. after project add/edit/transaction)
    const handler = () => fetchAccounts();
    window.addEventListener('accountsShouldRefresh', handler);
    // Also listen for storage event (multi-tab)
    const storageHandler = (e: StorageEvent) => {
      if (e.key === 'accountsShouldRefresh') fetchAccounts();
    };
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener('accountsShouldRefresh', handler);
      window.removeEventListener('storage', storageHandler);
    };
  }, []);


  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          account.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          account.currency.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || account.type === filterType;
    const matchesCurrency = filterCurrency === 'All' || account.currency === filterCurrency;

    return matchesSearch && matchesType && matchesCurrency;
  });

  // Statistics
  const totalAccountsCount = filteredAccounts.length;
  const totalBalance = filteredAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const bankAccountsCount = filteredAccounts.filter(acc => acc.type === 'BANK').length;
  const cashAccountsCount = filteredAccounts.filter(acc => acc.type === 'CASH').length;
  const mobileMoneyAccountsCount = filteredAccounts.filter(acc => acc.type === 'MOBILE_MONEY').length;


  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/accounting" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Accounts
        </h1>
        <div className="flex space-x-3">
          <Link href="/accounting/accounts/add" className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center">
            <Plus size={20} className="mr-2" /> Ku Dar Account
          </Link>
          <button onClick={fetchAccounts} className="bg-secondary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-green-600 transition duration-200 shadow-md flex items-center">
            <RefreshCw size={20} className="mr-2" /> Cusboonaysii
          </button>
        </div>
      </div>

      {/* Account Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Wadarta Accounts-ka</h4>
          <p className="text-3xl font-extrabold text-primary">{totalAccountsCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Wadarta Balance</h4>
          <p className="text-3xl font-extrabold text-secondary">${totalBalance.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Accounts-ka Bankiga</h4>
          <p className="text-3xl font-extrabold text-accent">{bankAccountsCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Accounts-ka Cash-ka</h4>
          <p className="text-3xl font-extrabold text-darkGray dark:text-gray-100">{cashAccountsCount}</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-8 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 animate-fade-in-up">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search accounts by name or type..."
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Filter by Type */}
        <div className="relative w-full md:w-48">
          <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
          <label htmlFor="filterType" className="sr-only">Filter by Account Type</label>
          <select
            id="filterType"
            title="Filter by Account Type"
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            {accountTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
            <ChevronRight className="transform rotate-90" size={20} />
          </div>
        </div>
        {/* Filter by Currency */}
        <div className="relative w-full md:w-48">
          <Coins size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
          <label htmlFor="filterCurrency" className="sr-only">Filter by Currency</label>
          <select
            id="filterCurrency"
            title="Filter by Currency"
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none"
            value={filterCurrency}
            onChange={(e) => setFilterCurrency(e.target.value)}
          >
            {currencies.map(curr => <option key={curr} value={curr}>{curr}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
            <ChevronRight className="transform rotate-90" size={20} />
          </div>
        </div>
        {/* View Mode Toggle */}
        <div className="flex space-x-2 w-full md:w-auto justify-center">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-lightGray dark:bg-gray-700 text-mediumGray dark:text-gray-400'} hover:bg-primary/80 dark:hover:bg-gray-600 transition-colors duration-200`} title="List View" aria-label="List View">
                <List size={20} />
            </button>
            <button onClick={() => setViewMode('cards')} className={`p-2 rounded-lg ${viewMode === 'cards' ? 'bg-primary text-white' : 'bg-lightGray dark:bg-gray-700 text-mediumGray dark:text-gray-400'} hover:bg-primary/80 dark:hover:bg-gray-600 transition-colors duration-200`} title="Cards View" aria-label="Cards View">
                <LayoutGrid size={20} />
            </button>
        </div>
      </div>

      {/* Accounts View */}
      {pageLoading ? (
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} /> Loading Accounts...
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center text-mediumGray dark:text-gray-400 animate-fade-in">
          Ma jiraan accounts la helay.
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
              <thead className="bg-lightGray dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Magaca Account-ka</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Nooca</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Currency</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Balance</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                {filteredAccounts.map(account => (
                  <AccountRow key={account.id} account={account} onEdit={handleEditAccount} onDelete={handleDeleteAccount} />
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination Placeholder */}
          <div className="p-4 flex justify-between items-center border-t border-lightGray dark:border-gray-700">
              <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition" title="Previous Page" aria-label="Previous Page">Hore</button>
              <span className="text-sm text-darkGray dark:text-gray-100">Page 1 of {Math.ceil(filteredAccounts.length / 10) || 1}</span>
              <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition" title="Next Page" aria-label="Next Page">Next</button>
          </div>
        </div>
      ) : ( /* Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {filteredAccounts.map(account => (
                <AccountCard key={account.id} account={account} onEdit={handleEditAccount} onDelete={handleDeleteAccount} />
            ))}
        </div>
      )}

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
