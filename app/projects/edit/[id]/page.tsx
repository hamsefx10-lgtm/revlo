// app/projects/edit/[id]/page.tsx - Edit Project Page (MATCHING ADD PAGE DESIGN)
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '../../../../components/layouts/Layout';
import Toast from '../../../../components/common/Toast';
import { 
  Plus, X, Loader2, Info, Briefcase, DollarSign, Calendar, Users, Tag,
  ArrowLeft, ChevronRight, Save
} from 'lucide-react';

// --- Type Definitions ---
interface Customer {
  id: string;
  name: string;
}
interface Account {
  id: string;
  name: string;
}

const projectTypes = [
  'Furniture Manufacturing', 'Office Fit-out', 'Restaurant Design', 'Home Renovation', 'Shop Fit-out', 'Consulting Service', 'Other'
];

// Tusaale: companyId waxaa laga keenayaa user session/profile
const getUserCompanyId = () => {
  return '0704a10a-37fd-4d0c-9984-2e5e6e2e3b3e'; // Ku beddel id-ga saxda ah ee user-ka
};

const EditProjectPage: React.FC = () => {
    const { id } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [project, setProject] = useState<any>(null);
  
  // Form state (matching add page)
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [agreementAmount, setAgreementAmount] = useState<number | ''>('');
  const [projectType, setProjectType] = useState('');
  const [expectedCompletionDate, setExpectedCompletionDate] = useState('');
  const [actualCompletionDate, setActualCompletionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [status, setStatus] = useState('Active');
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

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const companyId = getUserCompanyId();

  // Fetch project data
    const fetchProject = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/projects/${id}`);
            const data = await res.json();
            if (res.ok) {
                setProject(data.project);
        setName(data.project.name || '');
        setDescription(data.project.description || '');
        setAgreementAmount(data.project.agreementAmount || '');
        setProjectType(data.project.projectType || '');
        setExpectedCompletionDate(data.project.expectedCompletionDate?.slice(0, 10) || '');
        setActualCompletionDate(data.project.actualCompletionDate?.slice(0, 10) || '');
        setNotes(data.project.notes || '');
        setCustomerId(data.project.customer?.id || '');
        setStatus(data.project.status || 'Active');
        
        // Set advance payments if they exist
        if (data.project.advancePaid > 0) {
          // For edit, we'll need to fetch advance payment details from transactions
          // For now, set a single row with the total
          setAdvancePayments([{ accountId: '', amount: data.project.advancePaid }]);
        }
            } else {
        setToastMessage({ message: data.message || 'Mashruucaan lama helin', type: 'error' });
            }
        } catch (e) {
      setToastMessage({ message: 'Cilad ayaa dhacday marka mashruuca la soo gelinayay.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

  // Fetch customers
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

  // Fetch accounts
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

  // Fetch project data
  useEffect(() => {
    if (id) {
      fetchProject();
      fetchCustomers();
      fetchAccounts();
    }
  }, [id]);

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
    if (!agreementAmountNum || isNaN(agreementAmountNum) || agreementAmountNum <= 0) newErrors.agreementAmount = 'Qiimaha Heshiiska waa inuu noqdaa nambar wanaagsan.';
    if (advancePaidNum < 0) newErrors.advancePaid = 'Lacagta Hore Loo Bixiyay waa inuu noqdaa nambar wanaagsan.';
    if (advancePaidNum > agreementAmountNum) newErrors.advancePaid = 'Lacagta Hore Loo Bixiyay ma dhaafi karto Qiimaha Heshiiska.';
    if (!projectType) newErrors.projectType = 'Nooca Mashruuca waa waajib.';
    if (!expectedCompletionDate) newErrors.expectedCompletionDate = 'Taariikhda Dhammaystirka waa waajib.';
    if (!customerId) newErrors.customerId = 'Macmiilka waa waajib.';
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
    setSaving(true);
    setErrors({});
    setToastMessage(null);

    if (!validateForm()) {
      setSaving(false);
      setToastMessage({ message: 'Fadlan sax khaladaadka foomka.', type: 'error' });
            return;
        }

    try {
      const response = await fetch(`/api/projects/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          agreementAmount: typeof agreementAmount === 'number' ? agreementAmount : parseFloat(agreementAmount as any) || 0,
          advancePaid,
          advancePayments: advancePaid > 0 ? advancePayments : [],
          projectType,
          expectedCompletionDate,
          actualCompletionDate: actualCompletionDate || null,
          notes: notes || null,
          customerId,
          status,
          companyId,
        }),
      });

      const data = await response.json();
            
      if (response.ok) {
        setToastMessage({ message: data.message || 'Mashruuca si guul leh ayaa loo cusbooneysiiyey!', type: 'success' });
        // Trigger accounts refresh event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('accountsShouldRefresh'));
          localStorage.setItem('accountsShouldRefresh', Date.now().toString());
        }
                setTimeout(() => {
                    router.push(`/projects/${id}`);
                }, 1500);
            } else {
        setToastMessage({ message: data.message || 'Cilad ayaa dhacday marka mashruuca la cusbooneysiinayay.', type: 'error' });
            }
        } catch (error: any) {
      setToastMessage({ message: 'Cilad shabakadeed ayaa dhacday. Fadlan isku day mar kale.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

  if (loading) {
    return (
        <Layout>
            <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
                <Loader2 className="animate-spin text-primary mb-4" size={48} />
                <h2 className="text-2xl font-semibold text-darkGray dark:text-gray-200">Waa la soo kaxaynayaa...</h2>
            </div>
        </Layout>
    );
  }

  if (!project) {
    return (
        <Layout>
            <div className="max-w-2xl mx-auto text-center p-8 mt-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex flex-col items-center gap-4">
          <Info size={48} className="text-redError"/>
                <h2 className="text-2xl font-bold text-redError">Mashruucaan Lama Helin</h2>
                <Link href="/projects" className="mt-4 inline-flex items-center gap-2 bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition">
                    <ArrowLeft size={18}/> Ku noqo Liiska Mashaariicda
                </Link>
            </div>
        </Layout>
    );
  }

    return (
        <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href={`/projects/${id}`} className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
                    </Link>
          Beddel Mashruuc
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
            {errors.name && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.name}</p>}
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
            {errors.customerId && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.customerId}</p>}
                            </div>

          {/* Agreement Amount & Advance Paid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
              <label htmlFor="agreementAmount" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Qiimaha Heshiiska ($) <span className="text-redError">*</span></label>
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
              {errors.agreementAmount && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.agreementAmount}</p>}
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
              {errors.advancePayments && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.advancePayments}</p>}
                                </div>
                            </div>

          {/* Project Type & Expected Completion Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              {errors.projectType && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.projectType}</p>}
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
              {errors.expectedCompletionDate && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.expectedCompletionDate}</p>}
                                </div>
                            </div>
                            
          {/* Actual Completion Date & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="actualCompletionDate" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Taariikhda Dhammaystirka Dhabta ah</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <input
                  type="date"
                  id="actualCompletionDate"
                  value={actualCompletionDate}
                  onChange={(e) => setActualCompletionDate(e.target.value)}
                  className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
                />
              </div>
            </div>
                            <div>
              <label htmlFor="status" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Heerka Mashruuca</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
                >
                                        <option value="Active">Active</option>
                                        <option value="On Hold">On Hold</option>
                                        <option value="Nearing Deadline">Nearing Deadline</option>
                                        <option value="Overdue">Overdue</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
              </div>
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
          <div className="flex gap-4">
            <Link
              href={`/projects/${id}`}
              className="flex-1 text-center px-6 py-3 rounded-lg font-bold text-mediumGray dark:text-gray-400 hover:bg-lightGray dark:hover:bg-gray-700 transition duration-200"
            >
              Iska Daa
                                </Link>
            <button
              type="submit"
              className="flex-1 bg-primary text-white py-3 px-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md transform hover:scale-105 flex items-center justify-center"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="animate-spin mr-2" size={20} />
              ) : (
                <Save className="mr-2" size={20} />
              )}
                                    {saving ? 'Waa la keydinayaa...' : 'Update Garee'}
                                </button>
                            </div>
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
};

export default EditProjectPage;
