'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '../../../components/layouts/Layout';
import {
  Plus, X, Loader2, Info, Briefcase, DollarSign, Calendar, Users, Tag,
  ArrowLeft, ChevronRight
} from 'lucide-react';
import Toast from '../../../components/common/Toast';

// --- Type Definitions ---
interface Customer {
  id: string;
  name: string;
}
interface Account {
  id: string;
  name: string;
}

// Tusaale: companyId waxaa laga keenayaa user session/profile (halkan waa hardcoded demo)
const getUserCompanyId = () => {
  // Halkan ku beddel sida aad user session/profile uga heli lahayd companyId
  // Tusaale: return session?.user?.companyId;
  return '0704a10a-37fd-4d0c-9984-2e5e6e2e3b3e'; // Ku beddel id-ga saxda ah ee user-ka
};

const projectTypes = [
  'Furniture Manufacturing', 'Office Fit-out', 'Restaurant Design', 'Home Renovation', 'Shop Fit-out', 'Consulting Service', 'Other'
];

export default function AddProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [agreementAmount, setAgreementAmount] = useState<number | ''>('');
  const [projectType, setProjectType] = useState('');
  const [startDate, setStartDate] = useState(''); // Project start date
  const [expectedCompletionDate, setExpectedCompletionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [advancePayments, setAdvancePayments] = useState<{ accountId: string; amount: number | '' }[]>([
    { accountId: '', amount: '' }
  ]);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  // Add Account Modal State
  const [newAccountName, setNewAccountName] = useState('');
  const [addingAccount, setAddingAccount] = useState(false);

  // Add Customer Modal State
  const [newCustomerName, setNewCustomerName] = useState('');
  const [addingCustomer, setAddingCustomer] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // companyId si toos ah uga keen user session/profile
  const companyId = getUserCompanyId();

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/customers');
        if (!response.ok) throw new Error('Failed to fetch customers');
        const data = await response.json();
        setCustomers(data.customers || []);
      } catch (error: any) {
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka macaamiisha la soo gelinayay.', type: 'error' });
      }
    };
    fetchCustomers();
  }, []);

  // Fetch accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await fetch('/api/accounting/accounts');
        if (!response.ok) throw new Error('Failed to fetch accounts');
        const data = await response.json();
        setAccounts(data.accounts || []);
      } catch (error: any) {
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka accounts la soo gelinayay.', type: 'error' });
      }
    };
    fetchAccounts();
  }, []);

  // Advance Paid helpers
  const addAdvancePaymentRow = () => {
    setAdvancePayments([...advancePayments, { accountId: '', amount: '' }]);
  };
  const removeAdvancePaymentRow = (idx: number) => {
    setAdvancePayments(advancePayments.filter((_, i) => i !== idx));
  };
  const updateAdvancePayment = (idx: number, field: 'accountId' | 'amount', value: any) => {
    setAdvancePayments(advancePayments.map((row, i) =>
      i === idx ? { ...row, [field]: value } : row
    ));
  };
  // Calculate advancePaid as number
  const advancePaid: number = advancePayments.reduce(
    (sum, row) => sum + (typeof row.amount === 'number' ? row.amount : parseFloat(row.amount as any) || 0),
    0
  );

  // Add Account
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim()) return;
    setAddingAccount(true);
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAccountName }),
      });
      const data = await res.json();
      if (res.ok) {
        setAccounts((prev) => [...prev, data.account]);
        setShowAddAccountModal(false);
        setNewAccountName('');
        setToastMessage({ message: 'Account cusub waa la abuuray!', type: 'success' });
      } else {
        setToastMessage({ message: data.message || 'Account lama abuurin.', type: 'error' });
      }
    } catch (err) {
      setToastMessage({ message: 'Cilad ayaa dhacday.', type: 'error' });
    } finally {
      setAddingAccount(false);
    }
  };

  // Add Customer
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;
    setAddingCustomer(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCustomerName }),
      });
      const data = await res.json();
      if (res.ok) {
        setCustomers((prev) => [...prev, data.customer]);
        setShowAddCustomerModal(false);
        setNewCustomerName('');
        setCustomerId(data.customer.id);
        setToastMessage({ message: 'Macmiil cusub waa la abuuray!', type: 'success' });
      } else {
        setToastMessage({ message: data.message || 'Macmiil lama abuurin.', type: 'error' });
      }
    } catch (err) {
      setToastMessage({ message: 'Cilad ayaa dhacday.', type: 'error' });
    } finally {
      setAddingCustomer(false);
    }
  };

  // Validation
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    const agreementAmountNum = typeof agreementAmount === 'number' ? agreementAmount : parseFloat(agreementAmount as any) || 0;
    const advancePaidNum = typeof advancePaid === 'number' ? advancePaid : parseFloat(advancePaid as any) || 0;

    if (!name.trim()) newErrors.name = 'Magaca Mashruuca waa waajib.';
    if (agreementAmountNum < 0 || isNaN(agreementAmountNum)) newErrors.agreementAmount = 'Qiimaha Heshiiska waa inuu noqdaa nambar wanaagsan ( ama 0 for Pay-As-You-Go).';
    if (advancePaidNum < 0) newErrors.advancePaid = 'Lacagta Hore Loo Bixiyay waa inuu noqdaa nambar wanaagsan.';
    // Only cap advance if agreement is fixed (greater than 0)
    if (agreementAmountNum > 0 && advancePaidNum > agreementAmountNum) newErrors.advancePaid = 'Lacagta Hore Loo Bixiyay ma dhaafi karto Qiimaha Heshiiska.';
    if (!projectType) newErrors.projectType = 'Nooca Mashruuca waa waajib.';
    if (!startDate) newErrors.startDate = 'Taariikhda Bilowga Mashruuca waa waajib.';
    if (!expectedCompletionDate) newErrors.expectedCompletionDate = 'Taariikhda Dhammaystirka waa waajib.';
    if (!customerId) newErrors.customerId = 'Macmiilka waa waajib.';
    // companyId validation looma baahna, waa automatic
    // Advance Payments validation
    if (advancePaidNum > 0) {
      if (advancePayments.some(row => !row.accountId || !row.amount || row.amount <= 0)) {
        newErrors.advancePayments = 'Fadlan buuxi account-yada iyo lacagaha advance-ka.';
      }
      const totalAdvance = advancePayments.reduce(
        (sum, row) => sum + (typeof row.amount === 'number' ? row.amount : parseFloat(row.amount as any) || 0),
        0
      );
      if (advancePaidNum !== totalAdvance) {
        newErrors.advancePayments = 'Wadar advance-ka account-yada iyo advance paid waa inay is le\'ekaadaan.';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setToastMessage(null);

    if (!validateForm()) {
      setLoading(false);
      setToastMessage({ message: 'Fadlan sax khaladaadka foomka.', type: 'error' });
      return;
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          agreementAmount: typeof agreementAmount === 'number' ? agreementAmount : parseFloat(agreementAmount as any) || 0,
          advancePaid,
          advancePayments: advancePaid > 0 ? advancePayments.map(adv => ({
            ...adv,
            paymentDate: startDate // Use project start date as payment date
          })) : [],
          projectType,
          startDate, // ✅ Add startDate to API call
          expectedCompletionDate,
          notes: notes || null,
          customerId,
          companyId, // <-- Waa la dirayaa si toos ah, user-ka ayaa leh
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setToastMessage({ message: data.message || 'Mashruuca si guul leh ayaa loo daray!', type: 'success' });
        // Trigger accounts refresh event (all tabs)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('accountsShouldRefresh'));
          // For multi-tab support
          localStorage.setItem('accountsShouldRefresh', Date.now().toString());
        }
        router.push('/projects');
      } else {
        setToastMessage({ message: data.message || 'Cilad ayaa dhacday marka mashruuca la darayay.', type: 'error' });
      }
    } catch (error: any) {
      setToastMessage({ message: 'Cilad shabakadeed ayaa dhacday. Fadlan isku day mar kale.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/projects" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Ku Dar Mashruuc Cusub
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md animate-fade-in-up">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <div>
            <label htmlFor="projectName" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Magaca Mashruuca <span className="text-redError">*</span></label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <input
                type="text"
                id="projectName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tusaale: Furniture Project A"
                className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${errors.name ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
              />
            </div>
            {errors.name && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1" />{errors.name}</p>}
          </div>

          {/* Customer Selection */}
          <div>
            <label htmlFor="customer" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Macmiil <span className="text-redError">*</span></label>
            <div className="relative flex">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <select
                id="customer"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${errors.customerId ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
              >
                <option value="">-- Dooro Macmiil --</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
              <ChevronRight className="pointer-events-none absolute inset-y-0 right-10 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(true)}
                title="Add Customer"
                className="ml-2 px-3 py-2 rounded bg-primary text-white font-semibold hover:bg-blue-700 transition"
              >
                <Plus size={18} />
              </button>
            </div>
            {errors.customerId && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1" />{errors.customerId}</p>}
          </div>

          {/* Agreement Amount & Advance Paid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="agreementAmount" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Qiimaha Heshiiska ($) - (0 for T&M) <span className="text-redError">*</span></label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <input
                  type="number"
                  id="agreementAmount"
                  value={agreementAmount}
                  onChange={(e) => setAgreementAmount(parseFloat(e.target.value) || '')}
                  placeholder="Tusaale: 15000.00"
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${errors.agreementAmount ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                />
              </div>
              {errors.agreementAmount && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1" />{errors.agreementAmount}</p>}
            </div>
            <div>
              <label className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">
                Advance Payment Accounts
                <span className="text-redError">*</span>
              </label>
              {advancePayments.map((row, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <select
                    title="Select account for advance payment"
                    value={row.accountId}
                    onChange={e => updateAdvancePayment(idx, 'accountId', e.target.value)}
                    className="flex-1 p-3 border rounded-lg bg-lightGray dark:bg-gray-700"
                  >
                    <option value="">-- Dooro Account --</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={row.amount}
                    onChange={e => updateAdvancePayment(idx, 'amount', parseFloat(e.target.value) || '')}
                    placeholder="Amount"
                    className="w-32 p-3 border rounded-lg bg-lightGray dark:bg-gray-700"
                  />
                  {advancePayments.length > 1 && (
                    <button type="button" onClick={() => removeAdvancePaymentRow(idx)} title="Remove this account" className="text-red-500">X</button>
                  )}
                </div>
              ))}
              <div className="flex gap-2">
                <button type="button" onClick={addAdvancePaymentRow} title="Add Another Account" className="text-primary underline">Add Another Account</button>
                <button type="button" onClick={() => setShowAddAccountModal(true)} title="Add Account" className="text-primary underline">Add Account</button>
              </div>
              <div className="mt-2 text-sm text-mediumGray">
                Wadar Advance Paid: <span className="font-bold">{advancePaid || 0}</span>
              </div>
              {errors.advancePayments && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1" />{errors.advancePayments}</p>}
            </div>
          </div>

          {/* Project Type, Start Date & Expected Completion Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="projectType" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Nooca Mashruuca <span className="text-redError">*</span></label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <select
                  id="projectType"
                  title="Select project type"
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${errors.projectType ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                >
                  <option value="">-- Dooro Nooca Mashruuca --</option>
                  {projectTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
              </div>
              {errors.projectType && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1" />{errors.projectType}</p>}
            </div>
            <div>
              <label htmlFor="startDate" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Taariikhda Bilowga Mashruuca <span className="text-redError">*</span></label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${errors.startDate ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                />
              </div>
              {errors.startDate && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1" />{errors.startDate}</p>}
            </div>
            <div>
              <label htmlFor="expectedCompletionDate" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Taariikhda Dhammaystirka La Filayo <span className="text-redError">*</span></label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <input
                  type="date"
                  id="expectedCompletionDate"
                  value={expectedCompletionDate}
                  onChange={(e) => setExpectedCompletionDate(e.target.value)}
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${errors.expectedCompletionDate ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                />
              </div>
              {errors.expectedCompletionDate && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1" />{errors.expectedCompletionDate}</p>}
            </div>
          </div>

          {/* Description & Notes */}
          <div>
            <label htmlFor="description" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Sharaxaad (Optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Sharaxaad kooban oo ku saabsan mashruucan..."
              className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
            ></textarea>
          </div>
          <div>
            <label htmlFor="notes" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Fiiro Gaar Ah (Optional)</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Wixii faahfaahin dheeraad ah ee mashruuca..."
              className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
            ></textarea>
          </div>

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
            {loading ? 'Diiwaan Gelinaya Mashruuca...' : 'Diiwaan Geli Mashruuca'}
          </button>
        </form>
      </div>

      {/* Add Account Modal */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Add New Account</h2>
              <button onClick={() => setShowAddAccountModal(false)} title="Close modal"><X /></button>
            </div>
            <form onSubmit={handleAddAccount}>
              <input
                type="text"
                value={newAccountName}
                onChange={e => setNewAccountName(e.target.value)}
                placeholder="Account Name"
                className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 mb-4"
                required
              />
              <button
                type="submit"
                className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                disabled={addingAccount}
              >
                {addingAccount ? <Loader2 className="animate-spin inline-block mr-2" size={18} /> : <Plus className="inline-block mr-2" size={18} />}
                {addingAccount ? 'Adding...' : 'Add Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Add New Customer</h2>
              <button onClick={() => setShowAddCustomerModal(false)} title="Close modal"><X /></button>
            </div>
            <form onSubmit={handleAddCustomer}>
              <input
                type="text"
                value={newCustomerName}
                onChange={e => setNewCustomerName(e.target.value)}
                placeholder="Customer Name"
                className="w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 mb-4"
                required
              />
              <button
                type="submit"
                className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                disabled={addingCustomer}
              >
                {addingCustomer ? <Loader2 className="animate-spin inline-block mr-2" size={18} /> : <Plus className="inline-block mr-2" size={18} />}
                {addingCustomer ? 'Adding...' : 'Add Customer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}