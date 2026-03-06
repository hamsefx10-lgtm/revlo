//app/accounting/accounts/page.tsx - Accounts List Page (10000% Design - API Integration)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layouts/Layout';
import {
  ArrowLeft, Plus, Search, Filter, Calendar, List, LayoutGrid,
  DollarSign, CreditCard, Banknote, RefreshCw, Eye, Edit, Trash2, Coins, Loader2,
  TrendingUp, TrendingDown, Info as InfoIcon, CheckCircle, XCircle, Clock as ClockIcon,
  User as UserIcon, Briefcase as BriefcaseIcon, Tag as TagIcon, ChevronRight, Repeat, FileX2, Download, Component // Added FileX2, Download, Component
} from 'lucide-react';
import Toast from '@/components/common/Toast';

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
  <tr className="block md:table-row border-b md:border-b-0 border-lightGray dark:border-gray-700 mb-4 md:mb-0 rounded-lg md:rounded-none bg-white dark:bg-gray-800 md:bg-transparent shadow-md md:shadow-none md:hover:bg-lightGray/50 dark:md:hover:bg-gray-700/50 transition-colors duration-150">
    <td data-label="Account" className="p-3 md:p-4 flex justify-between items-center md:table-cell text-left font-bold text-lg md:font-medium md:text-base text-darkGray dark:text-gray-100 whitespace-nowrap border-b md:border-b-0 border-lightGray dark:border-gray-700/50">
      <div className="flex items-center space-x-2">
        <Banknote size={18} className="text-primary hidden md:block" />
        <span className="md:hidden text-primary font-bold">{account.name}</span>
        <span className="hidden md:inline">{account.name}</span>
      </div>
    </td>
    <td data-label="Type" className="p-3 md:p-4 flex justify-between items-center md:table-cell text-left text-mediumGray dark:text-gray-300 whitespace-nowrap border-b md:border-b-0 border-lightGray dark:border-gray-700/50">
      <span className="font-bold md:hidden">Type:</span> {account.type}
    </td>
    <td data-label="Currency" className="p-3 md:p-4 flex justify-between items-center md:table-cell text-left text-mediumGray dark:text-gray-300 whitespace-nowrap border-b md:border-b-0 border-lightGray dark:border-gray-700/50">
      <span className="font-bold md:hidden">Currency:</span> {account.currency}
    </td>
    <td data-label="Balance" className="p-3 md:p-4 flex justify-between items-center md:table-cell text-left md:text-right font-bold text-secondary dark:text-green-400 whitespace-nowrap border-b md:border-b-0 border-lightGray dark:border-gray-700/50">
      <span className="font-bold md:hidden text-darkGray dark:text-gray-300">Balance:</span>
      ${account.balance.toLocaleString()}
    </td>
    <td className="p-3 md:p-4 md:table-cell text-right">
      <div className="flex items-center justify-end space-x-2">
        <Link href={`/projects/accounting/transactions/transfer?fromAccount=${account.id}`} className="p-2 rounded-full bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white transition-colors duration-200" title="Transfer Money" aria-label="Transfer Money">
          <Repeat size={18} />
        </Link>
        <Link href={`/projects/accounting/accounts/${account.id}`} className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200" title="View Details">
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
const AccountCard: React.FC<{ account: Account; onEdit: (id: string) => void; onDelete: (id: string) => void }> = ({ account, onEdit, onDelete }) => {
  let borderColor = 'border-lightGray dark:border-gray-700';
  if (account.type === 'BANK') borderColor = 'border-accent';
  else if (account.type === 'MOBILE_MONEY') borderColor = 'border-primary';
  else if (account.type === 'CASH') borderColor = 'border-darkGray';

  return (
    <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg mb-4 border-l-4 ${borderColor} transform hover:scale-[1.02] hover:shadow-xl transition-all duration-300 flex flex-col justify-between`}>
      <div>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-bold text-lg text-darkGray dark:text-gray-100 flex items-center gap-2">
              <Banknote size={18} className="text-primary" /> {account.name}
            </h4>
            <span className="text-[10px] text-mediumGray font-bold uppercase tracking-wider block mt-1">{account.type}</span>
          </div>
          <span className="font-bold text-lg text-secondary dark:text-green-400">
            ${account.balance.toLocaleString()}
          </span>
        </div>

        <div className="space-y-2 text-sm text-mediumGray dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Coins size={14} className="text-gray-400" />
            <span>Currency: <span className="font-medium text-darkGray dark:text-gray-200">{account.currency}</span></span>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-lightGray dark:border-gray-700/50">
        <Link href={`/projects/accounting/transactions/transfer?fromAccount=${account.id}`} className="p-2 rounded-full bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white transition-colors duration-200" title="Transfer Money" aria-label="Transfer Money">
          <Repeat size={16} />
        </Link>
        <Link href={`/projects/accounting/accounts/${account.id}`} className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200" title="View Details">
          <Eye size={16} />
        </Link>
        <button onClick={() => onEdit(account.id)} className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Edit Account" aria-label="Edit Account">
          <Edit size={16} />
        </button>
        <button onClick={() => onDelete(account.id)} className="p-2 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete Account" aria-label="Delete Account">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};


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
      const response = await fetch('/api/projects/accounting/accounts');
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
        const response = await fetch(`/api/projects/accounting/accounts/${id}`, {
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
    router.push(`/projects/accounting/accounts/edit/${id}`); // Navigate to edit account page
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-darkGray dark:text-gray-100">
            <Link href="/projects/accounting" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4 inline-block align-middle pb-1">
              <ArrowLeft size={28} />
            </Link>
            Accounts
          </h1>
          <p className="text-mediumGray dark:text-gray-400 mt-1">Manage all your financial accounts from one place.</p>
        </div>
        <div className="flex gap-3 self-start md:self-center">
          <button onClick={fetchAccounts} className="bg-secondary text-white py-2.5 px-4 rounded-lg font-bold hover:bg-green-600 transition duration-200 shadow-md flex items-center" title="Refresh">
            <RefreshCw size={20} />
          </button>
          <Link href="/projects/accounting/accounts/add" className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-lg hover:shadow-primary/40 flex items-center gap-2">
            <Plus size={20} /> Ku Dar Account
          </Link>
        </div>
      </div>

      {/* Account Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 w-full text-center border-l-4 border-primary flex flex-col items-center justify-center min-h-[110px]">
          <Component className="text-primary mb-2" size={22} />
          <h4 className="text-xs font-semibold text-primary mb-1 truncate">Wadarta Accounts-ka</h4>
          <span className="text-2xl md:text-3xl font-bold text-primary">{totalAccountsCount}</span>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 w-full text-center border-l-4 border-secondary flex flex-col items-center justify-center min-h-[110px]">
          <DollarSign className="text-secondary mb-2" size={22} />
          <h4 className="text-xs font-semibold text-secondary mb-1 truncate">Wadarta Balance</h4>
          <span className="text-xl md:text-2xl font-bold text-secondary">${totalBalance.toLocaleString()}</span>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 w-full text-center border-l-4 border-accent flex flex-col items-center justify-center min-h-[110px]">
          <Banknote className="text-accent mb-2" size={22} />
          <h4 className="text-xs font-semibold text-accent mb-1 truncate">Accounts-ka Bankiga</h4>
          <span className="text-2xl md:text-3xl font-bold text-accent">{bankAccountsCount}</span>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 w-full text-center border-l-4 border-darkGray flex flex-col items-center justify-center min-h-[110px]">
          <Coins className="text-darkGray dark:text-gray-300 mb-2" size={22} />
          <h4 className="text-xs font-semibold text-darkGray dark:text-gray-300 mb-1 truncate">Accounts-ka Cash-ka</h4>
          <span className="text-2xl md:text-3xl font-bold text-darkGray dark:text-gray-100">{cashAccountsCount}</span>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md mb-8 flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-4 animate-fade-in-up">
        <div className="relative w-full lg:flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search accounts by name or type..."
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700/50 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-4">
          {/* Filter by Type */}
          <div className="relative w-full sm:w-auto">
            <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
            <select
              title="Filter by Account Type"
              className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700/50 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition appearance-none min-w-[160px]"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              {accountTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
            <ChevronRight className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 text-mediumGray dark:text-gray-400" size={20} />
          </div>
          {/* Filter by Currency */}
          <div className="relative w-full sm:w-auto">
            <Coins size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
            <select
              title="Filter by Currency"
              className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700/50 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition appearance-none min-w-[120px]"
              value={filterCurrency}
              onChange={(e) => setFilterCurrency(e.target.value)}
            >
              {currencies.map(curr => <option key={curr} value={curr}>{curr}</option>)}
            </select>
            <ChevronRight className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 text-mediumGray dark:text-gray-400" size={20} />
          </div>
        </div>

        <div className="flex items-center space-x-4 w-full lg:w-auto">
          {/* View Mode Toggle */}
          <div className="flex space-x-2 bg-lightGray dark:bg-gray-700/50 p-1 rounded-lg w-full">
            <button onClick={() => setViewMode('list')} className={`w-full sm:w-auto px-4 py-2 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 text-primary shadow' : 'text-mediumGray dark:text-gray-300'}`} title="List View" aria-label="List View">
              <List size={20} /> List
            </button>
            <button onClick={() => setViewMode('cards')} className={`w-full sm:w-auto px-4 py-2 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${viewMode === 'cards' ? 'bg-white dark:bg-gray-800 text-primary shadow' : 'text-mediumGray dark:text-gray-300'}`} title="Cards View" aria-label="Cards View">
              <LayoutGrid size={20} /> Cards
            </button>
          </div>
        </div>
      </div>

      {/* Accounts View */}
      {pageLoading ? (
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} /> Loading Accounts...
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md text-center text-mediumGray dark:text-gray-400 animate-fade-in flex flex-col items-center gap-4">
          <FileX2 size={48} className="text-gray-300 dark:text-gray-600" />
          <h3 className="text-xl font-semibold text-darkGray dark:text-gray-200">No Accounts Found</h3>
          <p>Codsigaaga wax account ah laguma helin. Isku day inaad beddesho miirayaasha.</p>
        </div>
      ) : viewMode === 'list' ? (
        <div className="animate-fade-in">
          <table className="hidden md:table min-w-full text-sm">
            <thead className="bg-lightGray dark:bg-gray-900/50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-medium text-mediumGray dark:text-gray-400 uppercase">Magaca Account-ka</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-mediumGray dark:text-gray-400 uppercase">Nooca</th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-mediumGray dark:text-gray-400 uppercase">Currency</th>
                <th scope="col" className="px-4 py-3 text-right font-medium text-mediumGray dark:text-gray-400 uppercase">Balance</th>
                <th scope="col" className="px-4 py-3 text-right font-medium text-mediumGray dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
          </table>
          <table className="min-w-full">
            <tbody className="md:divide-y md:divide-lightGray dark:md:divide-gray-700">
              {filteredAccounts.map(account => (
                <AccountRow key={account.id} account={account} onEdit={handleEditAccount} onDelete={handleDeleteAccount} />
              ))}
            </tbody>
          </table>
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
