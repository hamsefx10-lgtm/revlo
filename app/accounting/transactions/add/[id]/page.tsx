// app/accounting/transactions/edit/[id]/page.tsx - Edit Transaction Page (10000% Design - API Integration with Dynamic Forms)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import Layout from '../../../../../components/layouts/Layout';
import { 
  ArrowLeft, Plus, Search, Filter, Calendar, List, LayoutGrid, 
  DollarSign, CreditCard, Banknote, RefreshCw, Eye, Edit, Trash2, MessageSquare,
  TrendingUp, TrendingDown, Info as InfoIcon, CheckCircle, XCircle, Clock as ClockIcon,
  User as UserIcon, Briefcase as BriefcaseIcon, Tag as TagIcon,
  Send, Repeat, ReceiptText, Users, Building, Package, Scale, Truck, Mail, Phone, MapPin, Coins, Loader2, ChevronRight
} from 'lucide-react';
import Toast from '../../../../../components/common/Toast';

// --- Transaction Data Interface (Refined for API response) ---
interface Transaction {
  id: string;
  description: string;
  amount: number; // Converted from Decimal
  type: string; // e.g., "INCOME", "EXPENSE", "TRANSFER_IN", "TRANSFER_OUT", "DEBT_TAKEN", "DEBT_REPAID"
  transactionDate: string;
  note?: string;
  accountId?: string; // Primary account ID
  fromAccountId?: string; // For transfers
  toAccountId?: string;   // For transfers
  projectId?: string;     // If linked to project
  expenseId?: string; // If linked to expense
  customerId?: string;    // If linked to customer
  vendorId?: string;      // If linked to vendor
  userId?: string;    // Who recorded
  employeeId?: string; // If linked to employee
}

export default function EditTransactionPage() {
  const router = useRouter();
  const { id } = useParams(); // Get transaction ID from URL
  
  const [transactionType, setTransactionType] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  
  // Account fields
  const [selectedAccount, setSelectedAccount] = useState(''); // Primary account
  const [fromAccount, setFromAccount] = useState(''); // For transfers
  const [toAccount, setToAccount] = useState('');     // For transfers

  // Related entity fields (optional)
  const [relatedProject, setRelatedProject] = useState('');
  const [relatedExpense, setRelatedExpense] = useState('');
  const [relatedCustomer, setRelatedCustomer] = useState('');
  const [relatedVendor, setRelatedVendor] = useState('');
  const [relatedEmployee, setRelatedEmployee] = useState('');

  // Debt-specific fields
  const [lenderName, setLenderName] = useState(''); // For DEBT_TAKEN
  const [loanDate, setLoanDate] = useState('');     // For DEBT_TAKEN
  const [selectedDebtToRepay, setSelectedDebtToRepay] = useState(''); // For DEBT_REPAID

  const [loading, setLoading] = useState(true); // For initial fetch
  const [submitting, setSubmitting] = useState(false); // For form submission
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // --- API-driven Data States ---
  const [accounts, setAccounts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]); // Not implemented, keep for future
  const [customers, setCustomers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]); // Not implemented, keep for future
  // --- Fetch Initial Data (Accounts, Projects, etc.) ---
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [accountsRes, projectsRes, customersRes, vendorsRes, employeesRes] = await Promise.all([
          fetch('/api/accounting/accounts'),
          fetch('/api/projects'),
          fetch('/api/customers'),
          fetch('/api/vendors'),
          fetch('/api/employees'),
        ]);
        if (!accountsRes.ok) throw new Error('Accounts fetch failed');
        if (!projectsRes.ok) throw new Error('Projects fetch failed');
        if (!customersRes.ok) throw new Error('Customers fetch failed');
        if (!vendorsRes.ok) throw new Error('Vendors fetch failed');
        if (!employeesRes.ok) throw new Error('Employees fetch failed');

        const accountsData = await accountsRes.json();
        const projectsData = await projectsRes.json();
        const customersData = await customersRes.json();
        const vendorsData = await vendorsRes.json();
        const employeesData = await employeesRes.json();

        setAccounts(accountsData.accounts || []);
        setProjects(projectsData.projects || []);
        setCustomers(customersData.customers || []);
        setVendors(vendorsData.vendors || []);
        setEmployees(employeesData.employees || []);
        // setDebts(debtsData.debts || []); // Uncomment if debts API exists
      } catch (error: any) {
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka xogta la soo gelinayay.', type: 'error' });
      }
    };
    fetchInitialData();
  }, []);

  // --- Fetch Transaction Details ---
  useEffect(() => {
    const fetchTransactionDetails = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/accounting/transactions/${id}`);
        if (!response.ok) throw new Error('Failed to fetch transaction details');
        const data = await response.json();
        
        // Populate form fields with fetched data
        const trx = data.transaction;
        setDescription(trx.description);
        setAmount(parseFloat(trx.amount));
        setTransactionType(trx.type);
        setTransactionDate(new Date(trx.transactionDate).toISOString().split('T')[0]);
        setNote(trx.note || '');

        // Set account fields
        setSelectedAccount(trx.accountId || '');
        setFromAccount(trx.fromAccountId || '');
        setToAccount(trx.toAccountId || '');

        // Set related entities
        setRelatedProject(trx.projectId || '');
        setRelatedExpense(trx.expenseId || '');
        setRelatedCustomer(trx.customerId || '');
        setRelatedVendor(trx.vendorId || '');
        setRelatedEmployee(trx.employeeId || '');

        // Set debt-specific fields
        if (trx.type === 'DEBT_TAKEN') {
            // This would require fetching debt details to get lenderName/loanDate
            // For now, these are not directly stored on transaction, so they'd be derived or re-entered
            setLenderName(''); // Placeholder
            setLoanDate(''); // Placeholder
        } else if (trx.type === 'DEBT_REPAID') {
            setSelectedDebtToRepay(trx.expenseId || ''); // Assuming expenseId links to debt for repayment
        }

      } catch (error: any) {
        console.error('Error fetching transaction details for edit:', error);
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka faahfaahinta dhaqdhaqaaqa la soo gelinayay.', type: 'error' });
        router.push('/accounting/transactions'); 
      } finally {
        setLoading(false);
      }
    };
    fetchTransactionDetails();
  }, [id, router]);

  // --- Validation Logic ---
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!transactionType) newErrors.transactionType = 'Nooca dhaqdhaqaaqa waa waajib.';
    if (!description.trim()) newErrors.description = 'Sharaxaadda waa waajib.';
    if (typeof amount !== 'number' || amount <= 0) newErrors.amount = 'Qiimaha waa waajib oo waa inuu noqdaa nambar wanaagsan.';
    if (!transactionDate) newErrors.transactionDate = 'Taariikhda dhaqdhaqaaqa waa waajib.';
    if (!selectedAccount && transactionType !== 'TRANSFER_OUT' && transactionType !== 'TRANSFER_IN') newErrors.selectedAccount = 'Account-ka waa waajib.';

    if (transactionType === 'TRANSFER_IN' || transactionType === 'TRANSFER_OUT') {
      if (!fromAccount) newErrors.fromAccount = 'Account-ka laga wareejinayo waa waajib.';
      if (!toAccount) newErrors.toAccount = 'Account-ka loo wareejinayo waa waajib.';
      if (fromAccount === toAccount) newErrors.transferAccounts = 'Account-yada wareejinta ma noqon karaan isku mid.';
    }

    if (transactionType === 'DEBT_TAKEN') {
      if (!lenderName.trim()) newErrors.lenderName = 'Magaca deyn bixiyaha waa waajib.';
      if (!loanDate) newErrors.loanDate = 'Taariikhda deynta waa waajib.';
    }
    if (transactionType === 'DEBT_REPAID') {
      if (!selectedDebtToRepay) newErrors.selectedDebtToRepay = 'Deynta la bixinayo waa waajib.';
    }

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

    const transactionData: any = {
      description,
      amount: transactionType === 'EXPENSE' || transactionType === 'TRANSFER_OUT' || transactionType === 'DEBT_REPAID' ? -Math.abs(amount as number) : amount, // Negative for expenses/transfers out/debt repaid
      type: transactionType,
      transactionDate,
      note: note || null,
      accountId: selectedAccount || null,
      fromAccountId: fromAccount || null,
      toAccountId: toAccount || null,
      projectId: relatedProject || null,
      expenseId: relatedExpense || null,
      customerId: relatedCustomer || null,
      vendorId: relatedVendor || null,
      employeeId: relatedEmployee || null,
      // userId: currentUserId, // Mustaqbalka, ka hel session-ka
      // companyId: currentCompanyId, // Mustaqbalka, ka hel session-ka
    };

    try {
      const response = await fetch(`/api/accounting/transactions/${id}`, { // Use PUT method for update
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update transaction');
      }

      setToastMessage({ message: data.message || 'Dhaqdhaqaaqa lacagta si guul leh ayaa loo cusboonaysiiyay!', type: 'success' });
      router.push(`/accounting/transactions/${id}`); // Redirect to transaction details page
    } catch (error: any) {
      console.error('Transaction Edit API error:', error);
      setToastMessage({ message: error.message || 'Cilad shabakadeed ayaa dhacday. Fadlan isku day mar kale.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} /> Loading Transaction Data...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href={`/accounting/transactions/${id}`} className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Edit Dhaqdhaqaaqa: {description}
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md animate-fade-in-up">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Type (Read-only) */}
          <div>
            <label htmlFor="transactionType" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Nooca Dhaqdhaqaaqa</label>
            <div className="relative">
              <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <input
                type="text"
                id="transactionType"
                value={transactionType}
                readOnly // Make it read-only
                className="w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Description & Amount (Common for most) */}
          {transactionType && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              <div>
                <label htmlFor="description" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Sharaxaad <span className="text-redError">*</span></label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                  <input
                    type="text"
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tusaale: Mushahar Shaqaale, Iibka Alaabta"
                    className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.description ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                  />
                </div>
                {validationErrors.description && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1"/>{validationErrors.description}</p>}
              </div>
              <div>
                <label htmlFor="amount" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Qiimaha ($) <span className="text-redError">*</span></label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || '')}
                    placeholder="Tusaale: 500.00"
                    className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.amount ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                  />
                </div>
                {validationErrors.amount && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1"/>{validationErrors.amount}</p>}
              </div>
            </div>
          )}

          {/* Account Selection (Dynamic based on type) */}
          {transactionType && (transactionType !== 'TRANSFER_IN' && transactionType !== 'TRANSFER_OUT') && (
            <div className="animate-fade-in">
              <label htmlFor="selectedAccount" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Account-ka <span className="text-redError">*</span></label>
              <div className="relative">
                <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <select
                  id="selectedAccount"
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.selectedAccount ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                >
                  <option value="">-- Dooro Account --</option>
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance?.toLocaleString?.() ?? acc.balance})</option>)}
                </select>
                <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
              </div>
              {validationErrors.selectedAccount && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1"/>{validationErrors.selectedAccount}</p>}
            </div>
          )}

          {/* Transfer Accounts (Specific for TRANSFER_IN/OUT) */}
          {(transactionType === 'TRANSFER_IN' || transactionType === 'TRANSFER_OUT') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-primary/20 rounded-lg bg-primary/5 animate-fade-in">
                <h3 className="col-span-full text-lg font-bold text-primary dark:text-blue-300 mb-2">Faahfaahinta Wareejinta</h3>
                <div>
                    <label htmlFor="fromAccount" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Laga Wareejiyay <span className="text-redError">*</span></label>
                    <div className="relative">
                        <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                        <select
                            id="fromAccount"
                            value={fromAccount}
                            onChange={(e) => setFromAccount(e.target.value)}
                            className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.fromAccount ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                        >
                            <option value="">-- Dooro Account --</option>
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                        <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
                    </div>
                    {validationErrors.fromAccount && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1"/>{validationErrors.fromAccount}</p>}
                </div>
                <div>
                    <label htmlFor="toAccount" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Loo Wareejiyay <span className="text-redError">*</span></label>
                    <div className="relative">
                        <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                        <select
                            id="toAccount"
                            value={toAccount}
                            onChange={(e) => setToAccount(e.target.value)}
                            className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.toAccount ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                        >
                            <option value="">-- Dooro Account --</option>
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                        <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
                    </div>
                    {validationErrors.toAccount && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1"/>{validationErrors.toAccount}</p>}
                </div>
                {validationErrors.transferAccounts && <p className="text-redError text-sm mt-1 col-span-full flex items-center"><InfoIcon size={16} className="mr-1"/>{validationErrors.transferAccounts}</p>}
            </div>
          )}

          {/* Debt Taken Specific Fields */}
          {transactionType === 'DEBT_TAKEN' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-redError/20 rounded-lg bg-redError/5 animate-fade-in">
              <h3 className="col-span-full text-lg font-bold text-redError dark:text-red-300 mb-2">Faahfaahinta Deynta (La Qaatay)</h3>
              <div>
                <label htmlFor="lenderName" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Magaca Deynta Bixiyaha <span className="text-redError">*</span></label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                  <input
                    type="text"
                    id="lenderName"
                    value={lenderName}
                    onChange={(e) => setLenderName(e.target.value)}
                    placeholder="Tusaale: Bank X"
                    className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.lenderName ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                  />
                </div>
                {validationErrors.lenderName && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1"/>{validationErrors.lenderName}</p>}
              </div>
              <div>
                <label htmlFor="loanDate" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Taariikhda Deynta <span className="text-redError">*</span></label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                  <input
                    type="date"
                    id="loanDate"
                    value={loanDate}
                    onChange={(e) => setLoanDate(e.target.value)}
                    className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.loanDate ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                  />
                </div>
                {validationErrors.loanDate && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1"/>{validationErrors.loanDate}</p>}
              </div>
            </div>
          )}

          {/* Debt Repaid Specific Fields */}
          {transactionType === 'DEBT_REPAID' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-green-500/20 rounded-lg bg-green-500/5 animate-fade-in">
              <h3 className="col-span-full text-lg font-bold text-green-500 dark:text-green-300 mb-2">Faahfaahinta Dib U Bixinta Deynta</h3>
              <div>
                <label htmlFor="selectedDebtToRepay" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Dooro Deynta La Bixinayo <span className="text-redError">*</span></label>
                <div className="relative">
                  <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                  <select
                    id="selectedDebtToRepay"
                    value={selectedDebtToRepay}
                    onChange={(e) => setSelectedDebtToRepay(e.target.value)}
                    className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.selectedDebtToRepay ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                  >
                    <option value="">-- Dooro Deynta --</option>
                    {/* debts.map(debt => <option key={debt.id} value={debt.id}>{debt.lender} (Remaining: ${debt.remaining})</option>) */}
                  </select>
                  <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
                </div>
                {validationErrors.selectedDebtToRepay && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1"/>{validationErrors.selectedDebtToRepay}</p>}
              </div>
            </div>
          )}

          {/* Transaction Date & Note */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="transactionDate" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Taariikhda Dhaqdhaqaaqa <span className="text-redError">*</span></label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <input
                  type="date"
                  id="transactionDate"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.transactionDate ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                />
              </div>
              {validationErrors.transactionDate && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1"/>{validationErrors.transactionDate}</p>}
            </div>
            <div>
              <label htmlFor="note" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Fiiro Gaar Ah (Optional)</label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Wixii faahfaahin dheeraad ah..."
                  className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Related Entities (Conditional based on type) */}
          {transactionType && (transactionType === 'EXPENSE' || transactionType === 'INCOME' || transactionType === 'OTHER') && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 border border-gray-400/20 rounded-lg bg-gray-400/5 animate-fade-in">
              <h3 className="col-span-full text-lg font-bold text-darkGray dark:text-gray-100 mb-2">La Xiriira (Optional)</h3>
              <div>
                <label htmlFor="relatedProject" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Mashruuc</label>
                <div className="relative">
                  <BriefcaseIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                  <select id="relatedProject" value={relatedProject} onChange={(e) => setRelatedProject(e.target.value)} className="w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200">
                    <option value="">-- Dooro Mashruuc --</option>
                    {projects.map(proj => <option key={proj.id} value={proj.id}>{proj.name}</option>)}
                  </select>
                  <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
                </div>
              </div>
              <div>
                <label htmlFor="relatedExpense" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Kharash (Diiwaan Gashan)</label>
                <div className="relative">
                  <ReceiptText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                  <select id="relatedExpense" value={relatedExpense} onChange={(e) => setRelatedExpense(e.target.value)} className="w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200">
                    <option value="">-- Dooro Kharash --</option>
                    {/* expenses.map(exp => <option key={exp.id} value={exp.id}>{exp.description} (${exp.amount})</option>) */}
                  </select>
                  <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
                </div>
              </div>
              <div>
                <label htmlFor="relatedCustomer" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Macmiil</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                  <select id="relatedCustomer" value={relatedCustomer} onChange={(e) => setRelatedCustomer(e.target.value)} className="w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200">
                    <option value="">-- Dooro Macmiil --</option>
                    {customers.map(cust => <option key={cust.id} value={cust.id}>{cust.name}</option>)}
                  </select>
                  <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
                </div>
              </div>
              <div>
                <label htmlFor="relatedVendor" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Iibiye</label>
                <div className="relative">
                  <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                  <select id="relatedVendor" value={relatedVendor} onChange={(e) => setRelatedVendor(e.target.value)} className="w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200">
                    <option value="">-- Dooro Iibiye --</option>
                    {vendors.map(ven => <option key={ven.id} value={ven.id}>{ven.name}</option>)}
                  </select>
                  <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
                </div>
              </div>
              <div>
                <label htmlFor="relatedEmployee" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Shaqaale</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                  <select id="relatedEmployee" value={relatedEmployee} onChange={(e) => setRelatedEmployee(e.target.value)} className="w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200">
                    <option value="">-- Dooro Shaqaale --</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
                  </select>
                  <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-primary text-white py-3 px-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md transform hover:scale-105 flex items-center justify-center"
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="animate-spin mr-2" size={20} />
            ) : (
              <Edit className="mr-2" size={20} />
            )}
            {submitting ? 'Cusboonaysiinaya Dhaqdhaqaaq...' : 'Cusboonaysii Dhaqdhaqaaq'}
          </button>
        </form>
      </div>

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
