// app/settings/accounts/page.tsx - Bank Accounts Settings Page (10000% Design - FINAL Update)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import { 
  ArrowLeft, Banknote, Plus, Search, Filter, Edit, Trash2, X, Loader2, Info, 
  CreditCard, Landmark, DollarSign, CheckCircle, XCircle, ChevronRight, // MUHIIM: ChevronRight lagu daray!
  FileText, Download, Upload, Eye
} from 'lucide-react';
import Toast from '../../../components/common/Toast'; // Reuse Toast component

// --- API Types ---
type Account = {
  id: string;
  name: string;
  type: 'BANK' | 'CASH' | 'MOBILE_MONEY';
  balance: number;
  currency: string;
  createdAt?: string;
  updatedAt?: string;
};


// --- Bank Account Table Row Component ---
const BankAccountRow: React.FC<{ account: Account; onEdit: (id: string) => void; onDelete: (id: string) => void }> = ({ account, onEdit, onDelete }) => (
  <tr className="hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-150 border-b border-lightGray dark:border-gray-700 last:border-b-0">
    <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-medium flex items-center space-x-2">
        {account.type === 'BANK' ? <Landmark size={18} className="text-primary"/> : account.type === 'MOBILE_MONEY' ? <CreditCard size={18} className="text-secondary"/> : <DollarSign size={18} className="text-accent"/>}
        <span>{account.name}</span>
    </td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{account.type}</td>
    <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-semibold">${account.balance.toLocaleString()} {account.currency}</td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{account.updatedAt ? new Date(account.updatedAt).toLocaleDateString() : '-'}</td>
    <td className="p-4 whitespace-nowrap text-right">
      <div className="flex items-center justify-end space-x-2">
        <button onClick={() => onEdit(account.id)} className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Edit Account">
          <Edit size={18} />
        </button>
        <button onClick={() => onDelete(account.id)} className="p-2 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete Account">
          <Trash2 size={18} />
        </button>
        <Link href={`/accounting?filterAccount=${encodeURIComponent(account.name)}`} className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200" title="View Transactions">
            <Eye size={18} />
        </Link>
      </div>
    </td>
  </tr>
);

// --- Modal Component (Reusable) ---
interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}
const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-lg animate-fade-in-up">
      <div className="flex justify-between items-center mb-4 border-b pb-3 border-lightGray dark:border-gray-700">
        <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100">{title}</h3>
        <button onClick={onClose} className="text-mediumGray dark:text-gray-400 hover:text-redError transition-colors" title="Xidh Modal">
          <X size={24} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

// --- Add/Edit Account Form (Inside Modal) ---
interface AccountFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  editingAccount?: Account | null;
}
const AccountForm: React.FC<AccountFormProps> = ({ onSubmit, onCancel, editingAccount }) => {
  const [name, setName] = useState(editingAccount?.name || '');
  const [type, setType] = useState<Account['type']>(editingAccount?.type || 'BANK');
  const [balance, setBalance] = useState<number | ''>(editingAccount?.balance ?? '');
  const [currency, setCurrency] = useState(editingAccount?.currency || 'ETB');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Magaca Account-ka waa waajib.';
    if (!type) newErrors.type = 'Nooca Account-ka waa waajib.';
    if (typeof balance !== 'number' || balance < 0) newErrors.balance = 'Balance-ka waa inuu noqdaa nambar wanaagsan.';
    if (!currency.trim()) newErrors.currency = 'Lacagta waa waajib.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await onSubmit({ id: editingAccount?.id, name, type, balance, currency });
    } catch (err: any) {
      setApiError(err?.message || 'Cilad ayaa dhacday.');
    } finally {
      setLoading(false);
    }
  };

  const accountTypes = ['BANK', 'CASH', 'MOBILE_MONEY'];
  const currencies = ['ETB', 'USD', 'EUR'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div>
        <label htmlFor="accountName" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Magaca Account-ka <span className="text-redError">*</span></label>
        <input type="text" id="accountName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tusaale: CBE Main Account" className={`w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary ${errors.name ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}/>
        {errors.name && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.name}</p>}
      </div>
      <div>
        <label htmlFor="accountType" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Nooca Account-ka <span className="text-redError">*</span></label>
        <select id="accountType" value={type} onChange={(e) => setType(e.target.value as Account['type'])} className={`w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary appearance-none ${errors.type ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}>
          <option value="">-- Dooro Nooca --</option>
          {accountTypes.map(typeOpt => <option key={typeOpt} value={typeOpt}>{typeOpt}</option>)}
        </select>
        {errors.type && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.type}</p>}
      </div>
      <div>
        <label htmlFor="accountBalance" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Hada Ku Jira ($) <span className="text-redError">*</span></label>
        <input type="number" id="accountBalance" value={balance} onChange={(e) => setBalance(parseFloat(e.target.value) || '')} placeholder="Tusaale: 10000.00" className={`w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary ${errors.balance ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}/>
        {errors.balance && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.balance}</p>}
      </div>
      <div>
        <label htmlFor="accountCurrency" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Lacagta <span className="text-redError">*</span></label>
        <select id="accountCurrency" value={currency} onChange={(e) => setCurrency(e.target.value)} className={`w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary appearance-none ${errors.currency ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}>
          {currencies.map(curr => <option key={curr} value={curr}>{curr}</option>)}
        </select>
        {errors.currency && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.currency}</p>}
      </div>
      {apiError && <div className="text-redError text-sm flex items-center"><Info size={16} className="mr-1"/>{apiError}</div>}
      <div className="flex justify-end space-x-3 mt-6">
        <button type="button" onClick={onCancel} className="bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 py-2 px-4 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition">Jooji</button>
        <button type="submit" className="bg-primary text-white py-2 px-4 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center" disabled={loading}>
          {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : <Plus size={20} className="mr-2"/>} {editingAccount ? 'Cusboonaysii Account' : 'Ku Dar Account'}
        </button>
      </div>
    </form>
  );
};


// Main Bank Accounts Page Component
export default function BankAccountsSettingsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch accounts from API
  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/accounting/accounts');
      if (!res.ok) throw new Error((await res.json()).message || 'Cilad ayaa dhacday.');
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (err: any) {
      setError(err?.message || 'Cilad ayaa dhacday.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    // Listen for custom event to refresh accounts (e.g. after project add/edit)
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

  // Statistics
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const bankAccountsCount = accounts.filter(acc => acc.type === 'BANK').length;
  const cashAccountsCount = accounts.filter(acc => acc.type === 'CASH' || acc.type === 'MOBILE_MONEY').length;

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.currency.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || account.type === filterType;
    return matchesSearch && matchesType;
  });

  const accountTypes = ['All', 'BANK', 'CASH', 'MOBILE_MONEY'];

  // --- CRUD Handlers ---
  const handleAddAccount = async (newAccountData: any) => {
    try {
      const res = await fetch('/api/accounting/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccountData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Cilad ayaa dhacday.');
      setToastMessage({ message: data.message || 'Account-ka si guul leh ayaa loo daray!', type: 'success' });
      setShowAddEditModal(false);
      fetchAccounts();
    } catch (err: any) {
      setToastMessage({ message: err?.message || 'Cilad ayaa dhacday.', type: 'error' });
      throw err;
    }
  };

  const handleEditAccount = async (updatedAccountData: any) => {
    try {
      const res = await fetch(`/api/accounting/accounts/${updatedAccountData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAccountData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Cilad ayaa dhacday.');
      setToastMessage({ message: data.message || 'Account-ka si guul leh ayaa loo cusboonaysiiyay!', type: 'success' });
      setShowAddEditModal(false);
      setEditingAccount(null);
      fetchAccounts();
    } catch (err: any) {
      setToastMessage({ message: err?.message || 'Cilad ayaa dhacday.', type: 'error' });
      throw err;
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!window.confirm('Ma hubtaa inaad doonayso inaad tirtirto account-kan?')) return;
    try {
      const res = await fetch(`/api/accounting/accounts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Cilad ayaa dhacday.');
      setToastMessage({ message: data.message || 'Account-ka si guul leh ayaa loo tirtiray!', type: 'success' });
      fetchAccounts();
    } catch (err: any) {
      setToastMessage({ message: err?.message || 'Cilad ayaa dhacday.', type: 'error' });
    }
  };

  const openEditModal = (id: string) => {
    const accountToEdit = accounts.find(acc => acc.id === id);
    if (accountToEdit) {
      setEditingAccount(accountToEdit);
      setShowAddEditModal(true);
    }
  };

  // --- Responsive Table Wrapper ---
  const TableWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="overflow-x-auto w-full">
      <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">{children}</table>
    </div>
  );

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/settings" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Bank Accounts
        </h1>
        <button onClick={() => { setShowAddEditModal(true); setEditingAccount(null); }} className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center">
          <Plus size={20} className="mr-2" /> Ku Dar Account
        </button>
      </div>

      {/* Account Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Wadarta Guud ee Lacagta</h4>
          <p className="text-3xl font-extrabold text-primary">${totalBalance.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Accounts Bangiga</h4>
          <p className="text-3xl font-extrabold text-secondary">{bankAccountsCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Accounts Cash/Ebirr</h4>
          <p className="text-3xl font-extrabold text-accent">{cashAccountsCount}</p>
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
        {/* Filter by Account Type */}
        <div className="relative w-full md:w-48">
          <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
          <select
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
      </div>

      {/* Bank Accounts Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
            <thead className="bg-lightGray dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Magaca Account-ka</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Nooca</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Hada Ku Jira</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Last Updated</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Ficillo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lightGray dark:divide-gray-700">
              {filteredAccounts.length > 0 ? (
                filteredAccounts.map(account => (
                  <BankAccountRow 
                    key={account.id} 
                    account={account} 
                    onEdit={openEditModal} 
                    onDelete={handleDeleteAccount} 
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-mediumGray dark:text-gray-400">Ma jiraan accounts bangi ah oo la helay.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Placeholder */}
        <div className="p-4 flex justify-between items-center border-t border-lightGray dark:border-gray-700">
            <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Hore</button>
            <span className="text-sm text-darkGray dark:text-gray-100">Bogga 1 ee {Math.ceil(filteredAccounts.length / 10) || 1}</span>
            <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Xiga</button>
        </div>
      </div>

      {/* Add/Edit Account Modal */}
      {showAddEditModal && (
        <Modal title={editingAccount ? "Cusboonaysii Account" : "Ku Dar Account Cusub"} onClose={() => { setShowAddEditModal(false); setEditingAccount(null); }}>
          <AccountForm 
            onSubmit={editingAccount ? handleEditAccount : handleAddAccount} 
            onCancel={() => { setShowAddEditModal(false); setEditingAccount(null); }} 
            editingAccount={editingAccount}
          />
        </Modal>
      )}

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
