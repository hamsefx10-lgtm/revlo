// app/accounting/transactions/add/page.tsx - Add New Transaction Page (10000% Design - API Integration with Dynamic Forms)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layouts/Layout';
import {
  ArrowLeft, Plus, Search, Filter, Calendar, List, LayoutGrid,
  DollarSign, CreditCard, Banknote, RefreshCw, Eye, Edit, Trash2,
  TrendingUp, TrendingDown, Info as InfoIcon, CheckCircle, XCircle, Clock as ClockIcon,
  User as UserIcon, Briefcase as BriefcaseIcon, Tag as TagIcon,
  Send, Repeat, ReceiptText, Users, Building, Package, Scale, HardHat, Mail, Phone, Loader2, ChevronRight, MessageSquare, Truck // Added specific icons for dynamic fields
} from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function AddTransactionPage() {
  const router = useRouter();
  const [transactionType, setTransactionType] = useState(''); // INCOME, EXPENSE, TRANSFER_IN, TRANSFER_OUT, DEBT_TAKEN, DEBT_REPAID, OTHER
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  // Account fields
  const [selectedAccount, setSelectedAccount] = useState(''); // Primary account

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

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true); // For initial data fetch
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Quick Add Customer States
  const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false);
  const [quickCustomerName, setQuickCustomerName] = useState('');
  const [quickCustomerType, setQuickCustomerType] = useState('Individual');
  const [quickAddLoading, setQuickAddLoading] = useState(false);

  // Quick Add Vendor States
  const [showQuickAddVendor, setShowQuickAddVendor] = useState(false);
  const [quickVendorName, setQuickVendorName] = useState('');
  const [quickVendorType, setQuickVendorType] = useState('Supplier');
  const [quickAddVendorLoading, setQuickAddVendorLoading] = useState(false);

  // --- API-driven Data States ---
  const [accounts, setAccounts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]); // Not implemented, keep for future
  const [customers, setCustomers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]); // Customers with outstanding debt

  // --- Fetch Initial Data (Accounts, Projects, etc.) ---
  useEffect(() => {
    const fetchInitialData = async () => {
      setPageLoading(true);
      try {
        const [accountsRes, projectsRes, customersRes, vendorsRes, employeesRes, debtsRes] = await Promise.all([
          fetch('/api/projects/accounting/accounts'),
          fetch('/api/projects'),
          fetch('/api/projects/customers'),
          fetch('/api/projects/vendors'),
          fetch('/api/projects/employees'),
          fetch('/api/projects/accounting/reports/debts'),
        ]);
        if (!accountsRes.ok) throw new Error('Accounts fetch failed');
        if (!projectsRes.ok) throw new Error('Projects fetch failed');
        if (!customersRes.ok) throw new Error('Customers fetch failed');
        if (!vendorsRes.ok) throw new Error('Vendors fetch failed');
        if (!employeesRes.ok) throw new Error('Employees fetch failed');
        // debts is optional — don't throw if it fails

        const [accountsData, projectsData, customersData, vendorsData, employeesData] = await Promise.all([
          accountsRes.json(),
          projectsRes.json(),
          customersRes.json(),
          vendorsRes.json(),
          employeesRes.json(),
        ]);

        setAccounts(accountsData.accounts || []);
        setProjects(projectsData.projects || []);
        setCustomers(customersData.customers || []);
        setVendors(vendorsData.vendors || []);
        setEmployees(employeesData.employees || []);
        // Combine debts (vendors/projects) and receivables (customers) for the dropdown
        const debtsData = debtsRes.ok ? await debtsRes.json().catch(() => ({})) : {};
        const allDebts = [
          ...(debtsData.debts || []),
          ...(debtsData.receivables || [])
        ];
        setDebts(allDebts);
      } catch (error: any) {
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka xogta la soo gelinayay.', type: 'error' });
      } finally {
        setPageLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // --- Validation Logic ---
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!transactionType) newErrors.transactionType = 'Nooca dhaqdhaqaaqa waa waajib.';
    if (!description.trim()) newErrors.description = 'Sharaxaadda waa waajib.';
    if (typeof amount !== 'number' || amount <= 0) newErrors.amount = 'Qiimaha waa waajib oo waa inuu noqdaa nambar wanaagsan.';
    if (!transactionDate) newErrors.transactionDate = 'Taariikhda dhaqdhaqaaqa waa waajib.';
    if (!selectedAccount) newErrors.selectedAccount = 'Account-ka waa waajib.';

    if (transactionType === 'DEBT_TAKEN') {
      if (!lenderName.trim()) newErrors.lenderName = 'Magaca qofka deymaha la siiyay waa waajib.';
      if (!loanDate) newErrors.loanDate = 'Taariikhda deynta waa waajib.';
    }
    if (transactionType === 'DEBT_RECEIVED') {
      if (!lenderName.trim() && !relatedVendor) newErrors.lenderName = 'Dooro Iibiye amma geli Magaca deyn bixiyaha.';
      if (!loanDate) newErrors.loanDate = 'Taariikhda deynta waa waajib.';
    }
    if (transactionType === 'DEBT_REPAID' || transactionType === 'PAY_VENDOR_DEBT' || transactionType === 'COLLECT_CUSTOMER_DEBT' || transactionType === 'REPAY_PROJECT_DEBT') {
      if (!selectedDebtToRepay) newErrors.selectedDebtToRepay = 'Deynta la bixinayo waa waajib.';
    }

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

    // Determine the actual API transaction type
    let apiTransactionType = transactionType;
    if (transactionType === 'PAY_VENDOR_DEBT' || transactionType === 'COLLECT_CUSTOMER_DEBT' || transactionType === 'REPAY_PROJECT_DEBT') {
      apiTransactionType = 'DEBT_REPAID';
    }

    const transactionData: any = {
      description,
      amount: Math.abs(amount as number), // Always positive, API handles the logic
      type: apiTransactionType,
      transactionDate,
      note: note || null,
      accountId: selectedAccount,
      projectId: relatedProject || null,
      expenseId: relatedExpense || null,
      customerId: relatedCustomer || null,
      vendorId: relatedVendor || null,
      employeeId: relatedEmployee || null,
    };

    // If it's DEBT_TAKEN (Amaah la Siiyay), ensure we link the customer
    if (transactionType === 'DEBT_TAKEN') {
      transactionData.customerId = relatedCustomer || null;
      // If a borrower name is typed manually
      if (lenderName && !relatedCustomer) {
        transactionData.description = `${description} (${lenderName})`;
      }
    }

    // If it's DEBT_RECEIVED (Amaah la Qaatay), ensure we link the vendor or customer
    if (transactionType === 'DEBT_RECEIVED') {
      if (relatedVendor) transactionData.vendorId = relatedVendor;
      else if (relatedCustomer) transactionData.customerId = relatedCustomer;
      // If a lender name is typed manually
      if (lenderName && !relatedVendor && !relatedCustomer) {
        transactionData.description = `${description} (${lenderName})`;
      }
    }

    // Specific logic for DEBT_REPAID (and its split versions)
    if (apiTransactionType === 'DEBT_REPAID' && selectedDebtToRepay) {
      const debt = debts.find(d => d.id === selectedDebtToRepay);
      if (debt) {
        // Clear default related entities
        transactionData.customerId = null;
        transactionData.vendorId = null;
        transactionData.projectId = debt.projectId || null;

        // Logic based on the specific split types
        if (transactionType === 'PAY_VENDOR_DEBT') {
          // Explicitly Paying a Vendor
          if (debt.lenderId) {
            transactionData.vendorId = debt.lenderId;
          } else {
            transactionData.vendorId = debt.id; // Fallback
          }
        }
        else if (transactionType === 'COLLECT_CUSTOMER_DEBT') {
          // Explicitly Collecting from Customer
          if (debt.clientId || debt.customerId) {
            transactionData.customerId = debt.clientId || debt.customerId;
          }
        }
        else {
          if (debt.customerId || debt.clientId) {
            transactionData.customerId = debt.customerId || debt.clientId;
          }
          else if (debt.projectId) {
            // For Projects
            transactionData.projectId = debt.projectId;
            if (debt.customerId || debt.lenderId) transactionData.customerId = debt.customerId || debt.lenderId;
          }
          else if (debt.lenderId) {
            transactionData.vendorId = debt.lenderId;
          }
        }
      }
    }

    try {
      const response = await fetch('/api/projects/accounting/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to record transaction');
      }

      setToastMessage({ message: data.message || 'Dhaqdhaqaaqa lacagta si guul leh ayaa loo diiwaan geliyay!', type: 'success' });

      // If API returned an event, notify all pages about transaction creation for real-time updates
      if (data.event) {
        const transactionEvent = data.event;

        // Store in localStorage for cross-tab communication
        localStorage.setItem('transactionCreated', JSON.stringify(transactionEvent));
        localStorage.setItem('expenses_updated', JSON.stringify(transactionEvent));
        localStorage.setItem('project_updated', JSON.stringify(transactionEvent));

        // Trigger storage events for same-tab listeners
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'transactionCreated',
          newValue: JSON.stringify(transactionEvent)
        }));
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'expenses_updated',
          newValue: JSON.stringify(transactionEvent)
        }));
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'project_updated',
          newValue: JSON.stringify(transactionEvent)
        }));

        // Trigger custom events for same-tab listeners
        window.dispatchEvent(new CustomEvent('expense_updated', { detail: transactionEvent }));
        window.dispatchEvent(new CustomEvent('project_updated', { detail: transactionEvent }));
      }

      // Notify about project payment if it's related to a project
      if (transactionData.projectId && (transactionData.type === 'INCOME' || transactionData.type === 'DEBT_REPAID')) {
        const projectPaymentEvent = {
          customerId: transactionData.customerId,
          projectId: transactionData.projectId,
          type: transactionData.type,
          amount: transactionData.amount,
          timestamp: Date.now()
        };
        localStorage.setItem('projectPaymentMade', JSON.stringify(projectPaymentEvent));
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'projectPaymentMade',
          newValue: JSON.stringify(projectPaymentEvent)
        }));
      }

      // Clear form
      setTransactionType(''); setDescription(''); setAmount(''); setTransactionDate(new Date().toISOString().split('T')[0]); setNote('');
      setSelectedAccount('');
      setRelatedProject(''); setRelatedExpense(''); setRelatedCustomer(''); setRelatedVendor(''); setRelatedEmployee('');
      setLenderName(''); setLoanDate(''); setSelectedDebtToRepay('');
      setValidationErrors({});

      router.push('/projects/accounting/transactions'); // Redirect to transactions list
    } catch (error: any) {
      console.error('Transaction Add API error:', error);
      setToastMessage({ message: error.message || 'Cilad shabakadeed ayaa dhacday. Fadlan isku day mar kale.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustomerName.trim()) {
      setToastMessage({ message: 'Fadlan geli magaca macmiilka.', type: 'error' });
      return;
    }

    setQuickAddLoading(true);
    try {
      const response = await fetch('/api/projects/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: quickCustomerName,
          type: quickCustomerType,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to add customer');

      setCustomers(prev => [...prev, data.customer]);
      setRelatedCustomer(data.customer.id);
      setLenderName(data.customer.name); // Set as lender name too
      setShowQuickAddCustomer(false);
      setQuickCustomerName('');
      setToastMessage({ message: 'Macmiilka waa la daray!', type: 'success' });
    } catch (error: any) {
      setToastMessage({ message: error.message, type: 'error' });
    } finally {
      setQuickAddLoading(false);
    }
  };

  const handleQuickAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickVendorName.trim()) {
      setToastMessage({ message: 'Fadlan geli magaca deyn bixiyaha (Iibiyaha).', type: 'error' });
      return;
    }

    setQuickAddVendorLoading(true);
    try {
      const response = await fetch('/api/projects/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: quickVendorName,
          type: quickVendorType,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to add vendor');

      setVendors(prev => [...prev, data.vendor]);
      setRelatedVendor(data.vendor.id);
      setLenderName(data.vendor.name); // Set as lender name
      setShowQuickAddVendor(false);
      setQuickVendorName('');
      setToastMessage({ message: 'Deyn bixiyaha waa la daray!', type: 'success' });
    } catch (error: any) {
      setToastMessage({ message: error.message, type: 'error' });
    } finally {
      setQuickAddVendorLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <Layout>
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} /> Loading Data...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/projects/accounting/transactions" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Diiwaan Geli Dhaqdhaqaaq Cusub
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md animate-fade-in-up">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Type */}
          <div>
            <label htmlFor="transactionType" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Nooca Dhaqdhaqaaqa <span className="text-redError">*</span></label>
            <div className="relative">
              <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <select
                id="transactionType"
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
                className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.transactionType ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
              >
                <option value="">-- Dooro Nooca Dhaqdhaqaaqa --</option>
                <option value="INCOME">Dakhli (Soo Gal)</option>
                <option value="EXPENSE">Kharash (Baxay)</option>
                <option value="DEBT_TAKEN">Amaah La Siiyay — Lacag baxday oo dayn ahaan</option>
                <option value="DEBT_RECEIVED">Payables / Dayn la Qaatay — Lacag soo galay</option>
                <option value="PAY_VENDOR_DEBT">Bixi Deyn (Vendor/Iibiye)</option>
                <option value="COLLECT_CUSTOMER_DEBT">Soo Xaree Deyn (Macmiil)</option>
                <option value="REPAY_PROJECT_DEBT">Soo Xaree Deyn (Mashruuc)</option>
                <option value="OTHER">Kale</option>
              </select>
              <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
            </div>
            {validationErrors.transactionType && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1" />{validationErrors.transactionType}</p>}
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
                {validationErrors.description && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1" />{validationErrors.description}</p>}
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
                {validationErrors.amount && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1" />{validationErrors.amount}</p>}
              </div>
            </div>
          )}

          {/* Account Selection */}
          {transactionType && (
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
              {validationErrors.selectedAccount && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1" />{validationErrors.selectedAccount}</p>}
            </div>
          )}


          {/* Debt Taken Specific Fields */}
          {transactionType === 'DEBT_TAKEN' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-redError/20 rounded-lg bg-redError/5 animate-fade-in">
              <div className="col-span-full flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-redError dark:text-red-300">Faahfaahinta Deynta (La Qaatay)</h3>
                <button
                  type="button"
                  onClick={() => setShowQuickAddCustomer(!showQuickAddCustomer)}
                  className="text-xs bg-redError text-white px-2 py-1 rounded hover:bg-red-700 transition flex items-center"
                >
                  <Plus size={14} className="mr-1" /> Macmiil Cusub
                </button>
              </div>

              {showQuickAddCustomer ? (
                <div className="col-span-full bg-white dark:bg-gray-700 p-4 rounded-lg shadow-inner mb-4 border border-redError/30 animate-fade-in">
                  <h4 className="text-sm font-bold mb-3 text-darkGray dark:text-gray-200">Ku Dar Macmiil Cusub (Quick Add)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      value={quickCustomerName}
                      onChange={(e) => setQuickCustomerName(e.target.value)}
                      placeholder="Magaca Macmiilka"
                      className="p-2 border rounded bg-lightGray dark:bg-gray-600 text-sm"
                    />
                    <select
                      value={quickCustomerType}
                      onChange={(e) => setQuickCustomerType(e.target.value)}
                      className="p-2 border rounded bg-lightGray dark:bg-gray-600 text-sm"
                    >
                      <option value="Individual">Qof (Individual)</option>
                      <option value="Company">Shirkad (Company)</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleQuickAddCustomer}
                        disabled={quickAddLoading}
                        className="bg-primary text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
                      >
                        {quickAddLoading ? 'Laynaya...' : 'Keydi'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowQuickAddCustomer(false)}
                        className="bg-gray-400 text-white px-4 py-2 rounded text-sm font-bold hover:bg-gray-500"
                      >
                        Ka Noqo
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              <div>
                <label htmlFor="relatedCustomer" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Dooro Macmiilka (Deyn Bixiyaha)</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                  <select
                    id="relatedCustomer"
                    value={relatedCustomer}
                    onChange={(e) => {
                      setRelatedCustomer(e.target.value);
                      const cust = customers.find(c => c.id === e.target.value);
                      if (cust) setLenderName(cust.name);
                    }}
                    className="w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- Dooro Macmiil --</option>
                    {customers.map(cust => <option key={cust.id} value={cust.id}>{cust.name}</option>)}
                  </select>
                  <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray transform rotate-90" size={20} />
                </div>
              </div>

              <div>
                <label htmlFor="lenderName" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Magaca Deyn Bixiyaha (Haddii kale) <span className="text-redError">*</span></label>
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
                {validationErrors.lenderName && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1" />{validationErrors.lenderName}</p>}
              </div>

              <div className="col-span-full">
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
                {validationErrors.loanDate && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1" />{validationErrors.loanDate}</p>}
              </div>
            </div>
          )}

          {/* Debt Received Specific Fields */}
          {transactionType === 'DEBT_RECEIVED' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-blue-500/20 rounded-lg bg-blue-500/5 animate-fade-in">
              <div className="col-span-full flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400">Faahfaahinta Payables (Dayn la Qaatay)</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowQuickAddVendor(!showQuickAddVendor); setShowQuickAddCustomer(false); }}
                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition flex items-center"
                  >
                    <Plus size={14} className="mr-1" /> Iibiye Cusub
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowQuickAddCustomer(!showQuickAddCustomer); setShowQuickAddVendor(false); }}
                    className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition flex items-center"
                  >
                    <Plus size={14} className="mr-1" /> Macmiil Cusub
                  </button>
                </div>
              </div>

              {/* Quick Add Vendor Panel */}
              {showQuickAddVendor && (
                <div className="col-span-full bg-white dark:bg-gray-700 p-4 rounded-lg shadow-inner mb-2 border border-blue-500/30 animate-fade-in">
                  <h4 className="text-sm font-bold mb-3 text-darkGray dark:text-gray-200">Ku Dar Iibiye / Deyn Bixiye Cusub</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      value={quickVendorName}
                      onChange={(e) => setQuickVendorName(e.target.value)}
                      placeholder="Magaca Iibiyaha"
                      className="p-2 border rounded bg-lightGray dark:bg-gray-600 text-sm"
                    />
                    <select
                      value={quickVendorType}
                      onChange={(e) => setQuickVendorType(e.target.value)}
                      className="p-2 border rounded bg-lightGray dark:bg-gray-600 text-sm"
                    >
                      <option value="Supplier">Supplier / Qof</option>
                      <option value="Service">Adeeg Bixiye</option>
                    </select>
                    <div className="flex gap-2">
                      <button type="button" onClick={handleQuickAddVendor} disabled={quickAddVendorLoading} className="bg-primary text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700 disabled:opacity-50">
                        {quickAddVendorLoading ? 'Laynaya...' : 'Keydi'}
                      </button>
                      <button type="button" onClick={() => setShowQuickAddVendor(false)} className="bg-gray-400 text-white px-4 py-2 rounded text-sm font-bold hover:bg-gray-500">
                        Ka Noqo
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Add Customer Panel */}
              {showQuickAddCustomer && (
                <div className="col-span-full bg-white dark:bg-gray-700 p-4 rounded-lg shadow-inner mb-2 border border-green-500/30 animate-fade-in">
                  <h4 className="text-sm font-bold mb-3 text-darkGray dark:text-gray-200">Ku Dar Macmiil Cusub</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      value={quickCustomerName}
                      onChange={(e) => setQuickCustomerName(e.target.value)}
                      placeholder="Magaca Macmiilka"
                      className="p-2 border rounded bg-lightGray dark:bg-gray-600 text-sm col-span-2"
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={handleQuickAddCustomer} disabled={quickAddLoading} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-700 disabled:opacity-50">
                        {quickAddLoading ? 'Laynaya...' : 'Keydi'}
                      </button>
                      <button type="button" onClick={() => setShowQuickAddCustomer(false)} className="bg-gray-400 text-white px-4 py-2 rounded text-sm font-bold hover:bg-gray-500">
                        Ka Noqo
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Vendor Dropdown */}
              <div>
                <label htmlFor="debtReceivedVendor" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">
                  Dooro Iibiyaha (Vendor / Deyn Bixiye)
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                  <select
                    id="debtReceivedVendor"
                    value={relatedVendor}
                    onChange={(e) => {
                      setRelatedVendor(e.target.value);
                      if (e.target.value) {
                        setRelatedCustomer('');
                        const ven = vendors.find(v => v.id === e.target.value);
                        if (ven) setLenderName(ven.name);
                      }
                    }}
                    className="w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- Dooro Iibiye / Vendor --</option>
                    {vendors.map(ven => <option key={ven.id} value={ven.id}>{ven.name}</option>)}
                  </select>
                  <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray transform rotate-90" size={20} />
                </div>
              </div>

              {/* Customer Dropdown */}
              <div>
                <label htmlFor="debtReceivedCustomer" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">
                  Dooro Macmiilka (Customer / Deyn Bixiye)
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                  <select
                    id="debtReceivedCustomer"
                    value={relatedCustomer}
                    onChange={(e) => {
                      setRelatedCustomer(e.target.value);
                      if (e.target.value) {
                        setRelatedVendor('');
                        const cust = customers.find(c => c.id === e.target.value);
                        if (cust) setLenderName(cust.name);
                      }
                    }}
                    className="w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- Dooro Macmiil / Customer --</option>
                    {customers.map(cust => <option key={cust.id} value={cust.id}>{cust.name}</option>)}
                  </select>
                  <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray transform rotate-90" size={20} />
                </div>
              </div>

              {/* Manual lender name */}
              <div>
                <label htmlFor="lenderName" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">
                  Magaca Deyn Bixiyaha (Haddii kale) <span className="text-redError">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                  <input
                    type="text"
                    id="lenderName"
                    value={lenderName}
                    onChange={(e) => setLenderName(e.target.value)}
                    placeholder="Tusaale: Bankiga / Shirkadda / Qofka"
                    className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.lenderName ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                  />
                </div>
                {validationErrors.lenderName && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1" />{validationErrors.lenderName}</p>}
              </div>

              {/* Loan Date */}
              <div>
                <label htmlFor="loanDate" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">
                  Taariikhda Deynta La Qaatay <span className="text-redError">*</span>
                </label>
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
                {validationErrors.loanDate && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1" />{validationErrors.loanDate}</p>}
              </div>
            </div>
          )}

          {/* Pay Vendor Debt (Accounts Payable) */}
          {transactionType === 'PAY_VENDOR_DEBT' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-orange-500/20 rounded-lg bg-orange-500/5 animate-fade-in">
              <h3 className="col-span-full text-lg font-bold text-orange-600 dark:text-orange-400 mb-2">Bixi Deyn (Vendor/Iibiye)</h3>
              <div className="col-span-2">
                <label htmlFor="selectedDebtToRepay" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Dooro Deynta La Bixinayo (Vendor) <span className="text-redError">*</span></label>
                <div className="relative">
                  <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                  <select
                    id="selectedDebtToRepay"
                    value={selectedDebtToRepay}
                    onChange={(e) => setSelectedDebtToRepay(e.target.value)}
                    className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.selectedDebtToRepay ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                  >
                    <option value="">-- Dooro Deyn la siinayo (Amaah) --</option>
                    {debts && debts.filter(d => d.isLiability).length > 0 ? debts.filter(d => d.isLiability).map(debt => (
                      <option key={debt.id} value={debt.id}>
                        {debt.lender || 'N/A'} - Waa la rabaa: ${debt.remaining?.toLocaleString() || debt.amount?.toLocaleString() || 0}
                      </option>
                    )) : (
                      <option value="" disabled>Ma jiraan daymo laguugu leeyahay (Payables)</option>
                    )}
                  </select>
                  <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
                </div>
              </div>
            </div>
          )}

          {/* Collect Customer Debt (Accounts Receivable) */}
          {transactionType === 'COLLECT_CUSTOMER_DEBT' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-green-500/20 rounded-lg bg-green-500/5 animate-fade-in">
              <h3 className="col-span-full text-lg font-bold text-green-600 dark:text-green-400 mb-2">Soo Xaree Deyn (Macmiil)</h3>
              <div className="col-span-2">
                <label htmlFor="selectedDebtToRepay" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Dooro Deynta La Soo Xareynayo <span className="text-redError">*</span></label>
                <div className="relative">
                  <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                  <select
                    id="selectedDebtToRepay"
                    value={selectedDebtToRepay}
                    onChange={(e) => setSelectedDebtToRepay(e.target.value)}
                    className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.selectedDebtToRepay ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                  >
                    <option value="">-- Dooro Macmiil --</option>
                    {debts && debts.filter(d => d.isReceivable && d.type !== 'Project Debt').length > 0 ? debts.filter(d => d.isReceivable && d.type !== 'Project Debt').map(debt => (
                      <option key={debt.id} value={debt.id}>
                        {debt.client || debt.customer || 'N/A'} - Waa laga rabaa: ${debt.remaining?.toLocaleString() || debt.amount?.toLocaleString() || 0}
                      </option>
                    )) : (
                      <option value="" disabled>Ma jiraan daymo aad leedahay (Macmiil)</option>
                    )}
                  </select>
                  <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
                </div>
              </div>
            </div>
          )}

          {/* Collect Project Debt (New Feature) */}
          {transactionType === 'REPAY_PROJECT_DEBT' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-blue-500/20 rounded-lg bg-blue-500/5 animate-fade-in">
              <h3 className="col-span-full text-lg font-bold text-blue-600 dark:text-blue-400 mb-2">Soo Xaree Deyn (Mashruuc)</h3>
              <div className="col-span-2">
                <label htmlFor="selectedDebtToRepay" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Dooro Deynta Mashruuca <span className="text-redError">*</span></label>
                <div className="relative">
                  <HardHat className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                  <select
                    id="selectedDebtToRepay"
                    value={selectedDebtToRepay}
                    onChange={(e) => setSelectedDebtToRepay(e.target.value)}
                    className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.selectedDebtToRepay ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                  >
                    <option value="">-- Dooro Mashruuc --</option>
                    {debts && debts.filter(d => d.type === 'Project Debt' && d.remaining > 0).length > 0 ? debts.filter(d => d.type === 'Project Debt' && d.remaining > 0).map(debt => (
                      <option key={debt.id} value={debt.id}>
                        {debt.project || 'N/A'} - Laga rabo: ${debt.remaining?.toLocaleString() || 0}
                      </option>
                    )) : (
                      <option value="" disabled>Ma jiraan daymo mashruuc</option>
                    )}
                  </select>
                  <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
                </div>
              </div>
            </div>
          )}


          {/* Legacy DEBT_REPAID Specific Fields (Fallback if needed, or we can just hide it if we strictly use the two above) */}
          {
            transactionType === 'DEBT_REPAID' && (
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
                      {debts && debts.length > 0 ? debts.map(debt => (
                        <option key={debt.id} value={debt.id}>
                          {debt.lender || debt.customer || debt.vendor || 'N/A'} - Dayn dhan: ${debt.remaining?.toLocaleString() || debt.amount?.toLocaleString() || 0}
                        </option>
                      )) : (
                        <option value="" disabled>Ma jiraan daymo la helay</option>
                      )}
                    </select>
                    <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
                  </div>
                  {validationErrors.selectedDebtToRepay && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1" />{validationErrors.selectedDebtToRepay}</p>}
                  {(selectedDebtToRepay && debts && debts.length > 0) && (() => {
                    const debt = debts.find(d => d.id === selectedDebtToRepay);
                    if (!debt) return null;
                    return (
                      <div className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                        <span className="ml-2 text-orange-600 dark:text-orange-400 font-semibold">
                          Dayn dhan (Soo Celinayo): ${debt.remaining?.toLocaleString() || debt.amount?.toLocaleString() || 0}
                        </span>
                        {debt.lender && (
                          <span className="ml-2">Lender: {debt.lender}</span>
                        )}
                        {debt.project && (
                          <span className="ml-2">Mashruuc: {debt.project}</span>
                        )}
                      </div>
                    );
                  })()}
                  {(!debts || debts.length === 0) && (
                    <p className="text-orange-600 text-xs mt-1 flex items-center">
                      <InfoIcon size={14} className="inline mr-1" />
                      Ma jiraan customers-ka. <Link href="/projects/customers/add" className="underline text-primary hover:text-blue-700">Ku dar customer cusub</Link>
                    </p>
                  )}
                </div>
              </div>
            )
          }

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
              {validationErrors.transactionDate && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1" />{validationErrors.transactionDate}</p>}
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
          {
            transactionType && (transactionType === 'EXPENSE' || transactionType === 'INCOME' || transactionType === 'OTHER') && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 border border-gray-400/20 rounded-lg bg-gray-400/5 animate-fade-in">
                <h3 className="col-span-full text-lg font-bold text-darkGray dark:text-gray-100 mb-2">La Xiriira (Optional)</h3>
                <div>
                  <label htmlFor="relatedProject" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Mashruuc</label>
                  <div className="relative">
                    <BriefcaseIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                    <select id="relatedProject" value={relatedProject} onChange={(e) => setRelatedProject(e.target.value)} className="w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200">
                      <option value="">-- Dooro Mashruuc --</option>
                      {projects.map(proj => {
                        const relatedDebt = debts.find(d => d.projectId === proj.id);
                        return (
                          <option key={proj.id} value={proj.id}>
                            {proj.name} {relatedDebt && relatedDebt.remaining > 0 ? `(Laga rabo: $${relatedDebt.remaining.toLocaleString()})` : ''}
                          </option>
                        );
                      })}
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
            )
          }

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
            {loading ? 'Diiwaan Gelinaya Dhaqdhaqaaq...' : 'Diiwaan Geli Dhaqdhaqaaq'}
          </button>
        </form >
      </div >

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout >
  );
}
