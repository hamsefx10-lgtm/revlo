// app/projects/edit/[id]/page.tsx - Edit Project Page (MATCHING ADD PAGE DESIGN)
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/layouts/Layout';
import Toast from '@/components/common/Toast';
import {
  Plus, X, Loader2, Info, Briefcase, DollarSign, Calendar, Users, Tag, MessageSquare,
  ArrowLeft, ChevronRight, Save, Banknote, UserPlus, Trash, PlusCircle, CreditCard,
  Target, FileText, CheckCircle2, AlertCircle
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
  const [startDate, setStartDate] = useState(''); // Project start date
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

  // Dynamic Calculations (Mirroring Add Page)
  const totalAdvance = advancePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const remainingAmount = Number(agreementAmount || 0) - totalAdvance;

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
        setAgreementAmount(data.project.agreementAmount ?? '');
        setProjectType(data.project.projectType || '');
        setStartDate(data.project.startDate?.slice(0, 10) || ''); // Extract startDate
        setExpectedCompletionDate(data.project.expectedCompletionDate?.slice(0, 10) || '');
        setActualCompletionDate(data.project.actualCompletionDate?.slice(0, 10) || '');
        setNotes(data.project.notes || '');
        setCustomerId(data.project.customer?.id || '');
        setStatus(data.project.status || 'Active');

        // Set advance payments if they exist
        if (data.project.advancePaid > 0) {
          // For edit, we populate a dummy valid row if we don't have transaction details
          // This prevents the account selection error when only editing the agreement amount
          setAdvancePayments([{ accountId: 'existing', amount: data.project.advancePaid }]);
        } else {
          setAdvancePayments([{ accountId: '', amount: '' }]);
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
      const response = await fetch('/api/projects/customers');
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
      const response = await fetch('/api/projects/accounting/accounts');
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
      const res = await fetch('/api/projects/accounting/accounts', {
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
      const res = await fetch('/api/projects/customers', {
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
    if (agreementAmountNum > 0 && advancePaidNum > agreementAmountNum) newErrors.advancePaid = 'Lacagta Hore Loo Bixiyay ma dhaafi karto Qiimaha Heshiiska.';
    if (!projectType) newErrors.projectType = 'Nooca Mashruuca waa waajib.';
    if (!startDate) newErrors.startDate = 'Taariikhda Bilowga Mashruuca waa waajib.';
    if (!expectedCompletionDate) newErrors.expectedCompletionDate = 'Taariikhda Dhammaystirka waa waajib.';
    if (!customerId) newErrors.customerId = 'Macmiilka waa waajib.';
    // Advance Payments validation
    if (advancePaidNum > 0) {
      // Relax validation for edit: if accountId is 'existing', it means it's the fetched total
      if (advancePayments.some(row => !row.accountId || (row.amount === '' || row.amount < 0))) {
        newErrors.advancePayments = 'Fadlan buuxi account-yada iyo lacagaha advance-ka.';
      }
      const totalAdvance = advancePayments.reduce(
        (sum, row) => sum + (typeof row.amount === 'number' ? row.amount : parseFloat(row.amount as any) || 0),
        0
      );
      if (Math.abs(advancePaidNum - totalAdvance) > 0.01) {
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
          startDate, // ✅ Add startDate to API call
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
          router.push(`/projects/main/${id}`);
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
  }  if (!project) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto text-center p-8 mt-10 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col items-center gap-4">
          <Info size={48} className="text-redError" />
          <h2 className="text-2xl font-bold text-redError">Mashruucaan Lama Helin</h2>
          <Link href="/projects/main" className="mt-4 inline-flex items-center gap-2 bg-primary text-white py-2 px-6 rounded-xl font-bold hover:bg-blue-700 transition shadow-md">
            <ArrowLeft size={18} /> Ku noqo Liiska Mashaariicda
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
        {/* Breadcrumb & Header */}
        <div className="mb-8 animate-fade-in">
          <Link href={`/projects/main/${id}`} className="inline-flex items-center text-xs font-bold text-mediumGray hover:text-primary transition-all mb-2 group">
            <ArrowLeft size={16} className="mr-2 transform group-hover:-translate-x-1 transition-transform" /> Dib ugu noqo
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-6">
            <div>
              <h1 className="text-2xl font-black text-darkGray dark:text-gray-100 tracking-tight">
                Beddel Mashruuc
              </h1>
              <p className="text-mediumGray dark:text-gray-400 mt-1 text-sm font-medium">Cusbooneysii xogta mashruuca si ay ula socoto xaaladda dhabta ah.</p>
            </div>
            <div className="flex items-center gap-3 bg-primary/5 p-3 rounded-xl border border-primary/10 transition-all hover:shadow-sm">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest px-2 bg-primary/10 rounded-full mb-0.5">Haraaga Cusub</span>
                <span className={`text-2xl font-black ${remainingAmount >= 0 ? 'text-primary' : 'text-redError'}`}>
                  ${remainingAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* 1. Macluumaadka Guud Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-500 hover:shadow-[0_12px_30px_rgb(0,0,0,0.05)] hover:translate-y-[-2px] animate-fade-in-up">
              <div className="px-6 py-5 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target size={22} className="text-primary" />
                  <h3 className="text-sm font-black text-darkGray dark:text-gray-100 uppercase tracking-widest">Macluumaadka Guud</h3>
                </div>
              </div>
              <div className="p-6 space-y-8">
                <div className="group">
                  <label className="block text-xs font-bold text-mediumGray mb-2 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div> Magaca Mashruuca *
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-mediumGray group-focus-within:text-primary transition-colors" size={18} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tusaale: Furniture Design"
                      className={`w-full bg-gray-50/50 dark:bg-gray-700/30 border-2 rounded-xl py-3 pl-12 pr-6 focus:ring-0 focus:bg-white dark:focus:bg-gray-700 transition-all font-semibold text-base ${errors.name ? 'border-redError' : 'border-transparent focus:border-primary'}`}
                    />
                  </div>
                  {errors.name && <p className="text-redError text-xs font-bold mt-2 flex items-center gap-1.5"><AlertCircle size={14} /> {errors.name}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="group">
                    <label className="block text-xs font-bold text-mediumGray mb-2 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-secondary rounded-full"></div> Macmiilka *
                    </label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-mediumGray group-focus-within:text-secondary transition-colors" size={18} />
                        <select
                          value={customerId}
                          onChange={(e) => setCustomerId(e.target.value)}
                          className={`w-full bg-gray-50/50 dark:bg-gray-700/30 border-2 rounded-xl py-3 pl-12 pr-10 appearance-none focus:ring-0 focus:bg-white dark:focus:bg-gray-700 transition-all font-semibold text-base ${errors.customerId ? 'border-redError' : 'border-transparent focus:border-secondary'}`}
                        >
                          <option value="">-- Dooro Macmiil --</option>
                          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-mediumGray pointer-events-none rotate-90" size={16} />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddCustomerModal(true)}
                        className="p-3 bg-secondary/10 text-secondary border-2 border-transparent hover:border-secondary hover:bg-secondary/20 rounded-xl transition-all shadow-sm transform active:scale-95"
                      >
                        <UserPlus size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-xs font-bold text-mediumGray mb-2 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-accent rounded-full"></div> Nooca Mashruuca *
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-mediumGray group-focus-within:text-accent transition-colors" size={18} />
                      <select
                        value={projectType}
                        onChange={(e) => setProjectType(e.target.value)}
                        className={`w-full bg-gray-50/50 dark:bg-gray-700/30 border-2 rounded-xl py-3 pl-12 pr-10 appearance-none focus:ring-0 focus:bg-white dark:focus:bg-gray-700 transition-all font-semibold text-base ${errors.projectType ? 'border-redError' : 'border-transparent focus:border-accent'}`}
                      >
                        <option value="">-- Dooro Nooca --</option>
                        {projectTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-mediumGray pointer-events-none rotate-90" size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Financials & Payments Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-500 hover:shadow-[0_12px_30px_rgb(0,0,0,0.05)] hover:translate-y-[-2px] animate-fade-in-up md:delay-75">
              <div className="px-6 py-5 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DollarSign size={22} className="text-secondary" />
                  <h3 className="text-sm font-black text-darkGray dark:text-gray-100 uppercase tracking-widest">Lacagta & Bilowga</h3>
                </div>
              </div>
              <div className="p-6 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="group">
                    <label className="block text-xs font-bold text-mediumGray mb-2 uppercase tracking-widest flex items-center gap-2">
                      Qiimaha Heshiiska (Agreement Amount) *
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-mediumGray group-focus-within:text-secondary transition-colors" size={18} />
                      <input
                        type="number"
                        value={agreementAmount}
                        onChange={(e) => setAgreementAmount(parseFloat(e.target.value) || '')}
                        placeholder="Tusaale: 15000"
                        className={`w-full bg-gray-50/50 dark:bg-gray-700/30 border-2 rounded-xl py-4 pl-12 pr-6 focus:ring-0 focus:bg-white dark:focus:bg-gray-700 transition-all font-black text-xl ${errors.agreementAmount ? 'border-redError' : 'border-transparent focus:border-secondary'}`}
                      />
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-xs font-bold text-mediumGray mb-2 uppercase tracking-widest flex items-center gap-2">
                      Taariikhda Bilowga
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-mediumGray group-focus-within:text-secondary transition-colors" size={18} />
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-gray-50/50 dark:bg-gray-700/30 border-2 border-transparent focus:border-secondary rounded-xl py-3.5 pl-12 pr-6 focus:ring-0 focus:bg-white dark:focus:bg-gray-700 transition-all font-bold text-base"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-10 border-t-2 border-gray-50 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-darkGray dark:text-gray-200 uppercase tracking-widest flex items-center gap-2">
                      <Banknote size={20} className="text-primary" /> Lacagta Hore (Accounts)
                    </h4>
                    <button
                      type="button"
                      onClick={addAdvancePaymentRow}
                      className="text-primary hover:text-white hover:bg-primary text-[10px] font-black flex items-center gap-1.5 px-4 py-2.5 bg-primary/10 rounded-xl transition-all border border-primary/20 shadow-sm"
                    >
                      <PlusCircle size={16} /> Ku dar Account
                    </button>
                  </div>

                  <div className="space-y-4">
                    {advancePayments.map((row, idx) => (
                      <div key={idx} className="flex gap-4 items-end group/row">
                        <div className="flex-1 space-y-1.5">
                          <label className="text-[10px] font-black text-mediumGray uppercase ml-1 tracking-widest">Dooro Akoon</label>
                          <select
                            value={row.accountId}
                            onChange={(e) => updateAdvancePayment(idx, 'accountId', e.target.value)}
                            className="w-full bg-gray-50/50 dark:bg-gray-700/30 border-2 border-transparent focus:border-primary rounded-xl py-3 px-5 transition-all font-bold text-sm"
                          >
                            <option value="">-- Dooro Account --</option>
                            {row.accountId === 'existing' && <option value="existing" disabled>--- Sida uu ahaa (Existing) ---</option>}
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (${(acc as any).balance?.toLocaleString() || 0})</option>)}
                          </select>
                        </div>
                        <div className="w-48 space-y-1.5">
                          <label className="text-[10px] font-black text-mediumGray uppercase ml-1 tracking-widest">Lacag ($)</label>
                          <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
                            <input
                              type="number"
                              value={row.amount}
                              onChange={(e) => updateAdvancePayment(idx, 'amount', parseFloat(e.target.value) || '')}
                              className="w-full bg-gray-50/50 dark:bg-gray-700/30 border-2 border-transparent focus:border-primary rounded-xl py-3 pl-10 pr-5 transition-all font-black text-base"
                            />
                          </div>
                        </div>
                        {advancePayments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAdvancePaymentRow(idx)}
                            className="p-3.5 text-redError hover:bg-red-500 hover:text-white rounded-xl transition-all opacity-40 group-hover/row:opacity-100"
                          >
                            <Trash size={20} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm font-bold text-mediumGray flex justify-between px-2">
                    <span>Wadar Advance Paid:</span>
                    <span className="text-primary font-black">${totalAdvance.toLocaleString()}</span>
                  </p>
                  {errors.advancePayments && <p className="text-redError text-xs font-bold mt-2 flex items-center gap-1.5"><AlertCircle size={14} /> {errors.advancePayments}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-8">
            {/* 3. Planning Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-500 hover:shadow-[0_12px_30px_rgb(0,0,0,0.05)] hover:translate-y-[-2px] animate-fade-in-up md:delay-150">
              <div className="px-6 py-5 border-b border-gray-50 dark:border-gray-700 flex items-center gap-3">
                <Calendar size={22} className="text-accent" />
                <h3 className="text-sm font-black text-darkGray dark:text-gray-100 uppercase tracking-widest">Qorshaha</h3>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-mediumGray mb-2 uppercase tracking-widest">Dhammaystirka Filayo *</label>
                  <input
                    type="date"
                    value={expectedCompletionDate}
                    onChange={(e) => setExpectedCompletionDate(e.target.value)}
                    className={`w-full bg-gray-50/50 dark:bg-gray-700/30 border-2 rounded-xl py-3 px-5 transition-all font-bold text-base ${errors.expectedCompletionDate ? 'border-redError' : 'border-transparent focus:border-accent'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-mediumGray mb-2 uppercase tracking-widest">Heerka Mashruuca</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-gray-50/50 dark:bg-gray-700/30 border-2 border-transparent focus:border-accent rounded-xl py-3 px-5 transition-all font-bold text-base appearance-none"
                  >
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 4. Notes & Description */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-500 hover:shadow-[0_12px_30px_rgb(0,0,0,0.05)] hover:translate-y-[-2px] animate-fade-in-up md:delay-200">
              <div className="px-6 py-5 border-b border-gray-50 dark:border-gray-700 flex items-center gap-3">
                <MessageSquare size={22} className="text-mediumGray" />
                <h3 className="text-sm font-black text-darkGray dark:text-gray-100 uppercase tracking-widest">Fiiro & Sharaxaad</h3>
              </div>
              <div className="p-6 space-y-6">
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Sharaxaad mashruuca..."
                  className="w-full bg-gray-50/50 dark:bg-gray-700/30 border-2 border-transparent focus:border-gray-400 rounded-xl py-3 px-5 transition-all font-semibold text-sm resize-none"
                ></textarea>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes dheeraad ah..."
                  className="w-full bg-gray-50/50 dark:bg-gray-700/30 border-2 border-transparent focus:border-gray-400 rounded-xl py-3 px-5 transition-all font-semibold text-sm resize-none"
                ></textarea>
              </div>
            </div>

            {/* Submit Button Section */}
            <div className="sticky bottom-6 animate-fade-in-up md:delay-300">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-primary hover:bg-blue-600 text-white py-4 px-7 rounded-2xl font-black text-lg shadow-xl transform transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-4 disabled:opacity-70 group border-2 border-white/10"
              >
                {saving ? <Loader2 className="animate-spin" size={24} /> : <CheckCircle2 size={24} />}
                {saving ? 'Waa la keydinayaa...' : 'Update Garee Mashruuca'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Modals & Toast (Keep existing) */}
      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md animate-zoom-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black">Add New Account</h2>
              <button onClick={() => setShowAddAccountModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
            </div>
            <form onSubmit={handleAddAccount} className="space-y-6">
              <input
                type="text"
                value={newAccountName}
                onChange={e => setNewAccountName(e.target.value)}
                placeholder="Account Name"
                className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 font-bold"
                required
              />
              <button type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-black shadow-lg" disabled={addingAccount}>
                {addingAccount ? <Loader2 className="animate-spin inline-block mr-2" /> : <Plus className="inline-block mr-2" />}
                Save Account
              </button>
            </form>
          </div>
        </div>
      )}

      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md animate-zoom-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black">Add New Customer</h2>
              <button onClick={() => setShowAddCustomerModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
            </div>
            <form onSubmit={handleAddCustomer} className="space-y-6">
              <input
                type="text"
                value={newCustomerName}
                onChange={e => setNewCustomerName(e.target.value)}
                placeholder="Customer Name"
                className="w-full p-4 border-2 border-gray-100 rounded-xl bg-gray-50 font-bold"
                required
              />
              <button type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-black shadow-lg" disabled={addingCustomer}>
                {addingCustomer ? <Loader2 className="animate-spin inline-block mr-2" /> : <Plus className="inline-block mr-2" />}
                Save Customer
              </button>
            </form>
          </div>
        </div>
      )}

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}

      <style jsx global>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes zoom-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
        .animate-zoom-in { animation: zoom-in 0.3s ease-out forwards; }
      `}</style>
    </Layout>
  );
};
;

export default EditProjectPage;
