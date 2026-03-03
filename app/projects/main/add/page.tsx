// app/projects/add/page.tsx - Add New Project Page (Premium Modern Design)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layouts/Layout';
import {
  Plus, X, Loader2, Info, Briefcase, DollarSign, Calendar, Users, Tag, MessageSquare,
  ArrowLeft, ChevronRight, Banknote, UserPlus, Trash, PlusCircle, CreditCard,
  Target, FileText, CheckCircle2, AlertCircle
} from 'lucide-react';
import Toast from '@/components/common/Toast';

// --- Type Definitions ---
interface Customer {
  id: string;
  name: string;
  type: string;
}

interface Account {
  id: string;
  name: string;
  balance: number;
}

interface AdvancePayment {
  accountId: string;
  amount: number | '';
}

const projectTypes = [
  'Furniture Manufacturing', 'Office Fit-out', 'Restaurant Design', 'Home Renovation', 'Shop Fit-out', 'Consulting Service', 'Other'
];

export default function AddProjectPage() {
  const router = useRouter();

  // --- Form State ---
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [agreementAmount, setAgreementAmount] = useState<number | ''>('');
  const [projectType, setProjectType] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedCompletionDate, setExpectedCompletionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [customerId, setCustomerId] = useState('');

  // --- Multi-Account Payment State ---
  const [advancePayments, setAdvancePayments] = useState<AdvancePayment[]>([
    { accountId: '', amount: '' }
  ]);

  // --- UI/UX State ---
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // --- New Customer State ---
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    type: 'Individual',
    companyName: '',
    phone: '',
  });

  // --- Fetched Data State ---
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Calculate total advance
  const totalAdvance = advancePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const remainingAmount = Number(agreementAmount || 0) - totalAdvance;

  useEffect(() => {
    fetchRequiredData();
  }, []);

  const fetchRequiredData = async () => {
    try {
      const [custRes, accRes] = await Promise.all([
        fetch('/api/projects/customers'),
        fetch('/api/projects/accounting/accounts')
      ]);

      if (!custRes.ok || !accRes.ok) throw new Error('Cilad ayaa dhacday soo dejinta xogta.');

      const custData = await custRes.json();
      const accData = await accRes.json();

      setCustomers(custData.customers || []);
      setAccounts(accData.accounts || []);
    } catch (error: any) {
      setToastMessage({ message: error.message, type: 'error' });
    }
  };

  const handleAddPaymentRow = () => {
    setAdvancePayments([...advancePayments, { accountId: '', amount: '' }]);
  };

  const handleRemovePaymentRow = (index: number) => {
    const updated = advancePayments.filter((_, i) => i !== index);
    setAdvancePayments(updated.length ? updated : [{ accountId: '', amount: '' }]);
  };

  const handlePaymentChange = (index: number, field: keyof AdvancePayment, value: string) => {
    const updated = [...advancePayments];
    if (field === 'amount') {
      updated[index].amount = value === '' ? '' : parseFloat(value);
    } else {
      updated[index].accountId = value;
    }
    setAdvancePayments(updated);
  };

  const handleQuickAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name) return;

    setLoading(true);
    try {
      const res = await fetch('/api/projects/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setCustomers([data.customer, ...customers]);
      setCustomerId(data.customer.id);
      setShowCustomerModal(false);
      setNewCustomer({ name: '', type: 'Individual', companyName: '', phone: '' });
      setToastMessage({ message: 'Macmiilka si guul leh ayaa loo daray!', type: 'success' });
    } catch (error: any) {
      setToastMessage({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Magaca Mashruuca waa waajib.';
    if (!customerId) newErrors.customerId = 'Macmiilka waa waajib.';
    if (!agreementAmount || agreementAmount <= 0) newErrors.agreementAmount = 'Geli qiimo sax ah.';
    if (!projectType) newErrors.projectType = 'Nooca mashruuca waa waajib.';
    if (!expectedCompletionDate) newErrors.expectedCompletionDate = 'Geli taariikhda dhammaystirka.';

    // Validate payments
    const hasInvalidPayment = advancePayments.some(p => p.amount !== '' && (!p.accountId || Number(p.amount) < 0));
    if (hasInvalidPayment) newErrors.payments = 'Fadlan sax macluumaadka lacag bixinta.';

    if (totalAdvance > Number(agreementAmount)) newErrors.advance = 'Lacagta hore ma dhaafi karto heshiiska.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          agreementAmount,
          advancePaid: totalAdvance,
          advancePayments: advancePayments.filter(p => p.accountId && p.amount !== ''),
          projectType,
          startDate,
          expectedCompletionDate,
          notes,
          customerId
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setToastMessage({ message: 'Mashruuca si guul leh ayaa loo daray!', type: 'success' });
      router.push('/projects/main');
    } catch (error: any) {
      setToastMessage({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
        {/* Breadcrumb & Header */}
        <div className="mb-8 animate-fade-in">
          <Link href="/projects/main" className="inline-flex items-center text-xs font-bold text-mediumGray hover:text-primary transition-all mb-2 group">
            <ArrowLeft size={16} className="mr-2 transform group-hover:-translate-x-1 transition-transform" /> Mashruucyada
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-6">
            <div>
              <h1 className="text-2xl font-black text-darkGray dark:text-gray-100 tracking-tight">
                Ku Dar Mashruuc Cusub
              </h1>
              <p className="text-mediumGray dark:text-gray-400 mt-1 text-sm font-medium">Buuxi foomka hoose si aad u diiwaan geliso mashruuc cusub oo hufan.</p>
            </div>
            <div className="flex items-center gap-3 bg-primary/5 p-3 rounded-xl border border-primary/10 transition-all hover:shadow-sm">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest px-2 bg-primary/10 rounded-full mb-0.5">Haraaga la filayo</span>
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

            {/* 1. Basic Information Card */}
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
                      placeholder="Tusaale: Furniture Design for Office X"
                      className={`w-full bg-gray-50/50 dark:bg-gray-700/30 border-2 rounded-xl py-3 pl-12 pr-6 focus:ring-0 focus:bg-white dark:focus:bg-gray-700 transition-all font-semibold text-base ${errors.name ? 'border-redError' : 'border-transparent focus:border-primary'
                        }`}
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
                          className={`w-full bg-gray-50/50 dark:bg-gray-700/30 border-2 rounded-xl py-3 pl-12 pr-10 appearance-none focus:ring-0 focus:bg-white dark:focus:bg-gray-700 transition-all font-semibold text-base ${errors.customerId ? 'border-redError' : 'border-transparent focus:border-secondary'
                            }`}
                        >
                          <option value="">-- Dooro Macmiil --</option>
                          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-mediumGray pointer-events-none rotate-90" size={16} />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCustomerModal(true)}
                        className="p-3 bg-secondary/10 text-secondary border-2 border-transparent hover:border-secondary hover:bg-secondary/20 rounded-xl transition-all shadow-sm transform active:scale-95"
                        title="Register New Customer"
                      >
                        <UserPlus size={20} />
                      </button>
                    </div>
                    {errors.customerId && <p className="text-redError text-xs font-bold mt-2 flex items-center gap-1.5"><AlertCircle size={14} /> {errors.customerId}</p>}
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
                        className={`w-full bg-gray-50/50 dark:bg-gray-700/30 border-2 rounded-xl py-3 pl-12 pr-10 appearance-none focus:ring-0 focus:bg-white dark:focus:bg-gray-700 transition-all font-semibold text-base ${errors.projectType ? 'border-redError' : 'border-transparent focus:border-accent'
                          }`}
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
                      Qiimaha Heshiiska ($) *
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-mediumGray group-focus-within:text-secondary transition-colors" size={18} />
                      <input
                        type="number"
                        value={agreementAmount}
                        onChange={(e) => setAgreementAmount(parseFloat(e.target.value) || '')}
                        placeholder="Tusaale: 15000"
                        className={`w-full bg-gray-50/50 dark:bg-gray-700/30 border-2 rounded-xl py-3 pl-12 pr-6 focus:ring-0 focus:bg-white dark:focus:bg-gray-700 transition-all font-black text-lg ${errors.agreementAmount ? 'border-redError' : 'border-transparent focus:border-secondary'
                          }`}
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
                        className="w-full bg-gray-50/50 dark:bg-gray-700/30 border-2 border-transparent focus:border-secondary rounded-xl py-3 pl-12 pr-6 focus:ring-0 focus:bg-white dark:focus:bg-gray-700 transition-all font-bold text-base"
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
                      onClick={handleAddPaymentRow}
                      className="text-primary hover:text-white hover:bg-primary text-[10px] font-black flex items-center gap-1.5 px-4 py-2.5 bg-primary/10 rounded-xl transition-all border border-primary/20 shadow-sm transform active:scale-95"
                    >
                      <PlusCircle size={16} /> Ku dar Account
                    </button>
                  </div>

                  <div className="space-y-4">
                    {advancePayments.map((payment, idx) => (
                      <div key={idx} className="flex gap-4 items-end animate-slide-in-right group/row" style={{ animationDelay: `${idx * 0.1}s` }}>
                        <div className="flex-1 space-y-1.5">
                          <label className="text-[10px] font-black text-mediumGray uppercase ml-1 tracking-widest">Dooro Akoon</label>
                          <div className="relative">
                            <select
                              value={payment.accountId}
                              onChange={(e) => handlePaymentChange(idx, 'accountId', e.target.value)}
                              className="w-full bg-gray-50/50 dark:bg-gray-700/30 border-2 border-transparent focus:border-primary rounded-xl py-3 px-5 focus:ring-0 focus:bg-white transition-all font-bold text-sm shadow-sm"
                            >
                              <option value="">-- Mid dooro --</option>
                              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} (${a.balance.toLocaleString()})</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="w-48 space-y-1.5">
                          <label className="text-[10px] font-black text-mediumGray uppercase ml-1 tracking-widest">Migaarka ($)</label>
                          <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
                            <input
                              type="number"
                              value={payment.amount}
                              placeholder="0.00"
                              onChange={(e) => handlePaymentChange(idx, 'amount', e.target.value)}
                              className="w-full bg-gray-50/50 dark:bg-gray-700/30 border-2 border-transparent focus:border-primary rounded-xl py-3 pl-10 pr-5 focus:ring-0 focus:bg-white transition-all font-black text-base shadow-sm"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePaymentRow(idx)}
                          className="p-3.5 text-redError bg-red-50 dark:bg-red-900/10 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm opacity-40 hover:opacity-100 group-hover/row:opacity-100 transform active:scale-90"
                        >
                          <Trash size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {(errors.payments || errors.advance) && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center gap-3 animate-shake">
                      <AlertCircle className="text-redError" size={20} />
                      <div className="space-y-0.5">
                        {errors.payments && <p className="text-redError text-xs font-bold">{errors.payments}</p>}
                        {errors.advance && <p className="text-redError text-xs font-bold">{errors.advance}</p>}
                      </div>
                    </div>
                  )}
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
                <div className="group">
                  <label className="block text-xs font-bold text-mediumGray mb-2 uppercase tracking-widest">Dhammaystirka La Filayo *</label>
                  <input
                    type="date"
                    value={expectedCompletionDate}
                    onChange={(e) => setExpectedCompletionDate(e.target.value)}
                    className={`w-full bg-gray-50/50 dark:bg-gray-700/30 border-2 rounded-xl py-3 px-5 focus:ring-0 focus:bg-white transition-all font-bold text-base ${errors.expectedCompletionDate ? 'border-redError' : 'border-transparent focus:border-accent'
                      }`}
                  />
                </div>
                <div className="group">
                  <label className="block text-xs font-bold text-mediumGray mb-2 uppercase tracking-widest">Sharaxaad</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Waxyar ka sheeg mashruuca..."
                    className="w-full bg-gray-50/50 dark:bg-gray-700/30 border-2 border-transparent focus:border-accent rounded-xl py-3.5 px-5 focus:ring-0 focus:bg-white dark:focus:bg-gray-700 transition-all font-semibold text-sm resize-none min-h-[100px]"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* 4. Notes Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-500 hover:shadow-[0_12px_30px_rgb(0,0,0,0.05)] hover:translate-y-[-2px] animate-fade-in-up md:delay-200">
              <div className="px-6 py-5 border-b border-gray-50 dark:border-gray-700 flex items-center gap-3">
                <MessageSquare size={22} className="text-mediumGray" />
                <h3 className="text-sm font-black text-darkGray dark:text-gray-100 uppercase tracking-widest">Fiiro Gaar Ah</h3>
              </div>
              <div className="p-6">
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes halkan ku qor..."
                  className="w-full bg-gray-50/50 dark:bg-gray-700/30 border-2 border-transparent focus:border-gray-400 rounded-xl py-3 px-5 focus:ring-0 focus:bg-white transition-all font-semibold text-sm resize-none"
                ></textarea>
              </div>
            </div>

            {/* Submit Button Section */}
            <div className="sticky bottom-6 animate-fade-in-up md:delay-300">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-blue-600 text-white py-4.5 px-7 rounded-2xl font-black text-lg shadow-[0_12px_30px_rgb(0,0,0,0.15)] shadow-primary/20 transform transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-4 disabled:opacity-70 disabled:cursor-not-allowed group border-2 border-white/10"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <CheckCircle2 className="group-hover:scale-110 transition-transform" size={24} />
                )}
                {loading ? 'Diiwaan Gelinaya...' : 'Diiwaan Geli Mashruuca'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* --- Quick Add Customer Modal --- */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-lg animate-fade-in">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-zoom-in border border-white/10">
            <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-primary/5">
              <h3 className="text-xl font-black text-darkGray dark:text-gray-100 flex items-center gap-4">
                <UserPlus size={28} className="text-primary" /> Macmiil cusub
              </h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X size={20} className="text-mediumGray" />
              </button>
            </div>
            <form onSubmit={handleQuickAddCustomer} className="p-8 space-y-8">
              <div className="group">
                <label className="block text-xs font-black text-mediumGray mb-3 uppercase tracking-widest">Magaca Macmiilka *</label>
                <input
                  type="text"
                  required
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full bg-gray-50/50 dark:bg-gray-700 border-2 border-transparent focus:border-primary rounded-xl py-4 px-6 focus:ring-0 transition-all font-black text-lg"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-black text-mediumGray uppercase tracking-widest">Nooca</label>
                <div className="flex gap-6">
                  {['Individual', 'Company'].map(type => (
                    <label key={type} className="flex-1 group/radio">
                      <input
                        type="radio"
                        className="hidden peer"
                        name="custType"
                        checked={newCustomer.type === type}
                        onChange={() => setNewCustomer({ ...newCustomer, type })}
                      />
                      <div className="text-center p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary transition-all cursor-pointer font-black text-sm group-hover/radio:border-primary/50">
                        {type === 'Individual' ? 'Wali' : 'Shirkad'}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              {newCustomer.type === 'Company' && (
                <div className="animate-fade-in-up">
                  <label className="block text-xs font-black text-mediumGray mb-3 uppercase tracking-widest">Magaca Shirkadda</label>
                  <input
                    type="text"
                    value={newCustomer.companyName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, companyName: e.target.value })}
                    className="w-full bg-gray-50/50 dark:bg-gray-700 border-2 border-transparent focus:border-primary rounded-xl py-4 px-6 focus:ring-0 transition-all font-black text-lg"
                  />
                </div>
              )}
              <div className="group">
                <label className="block text-xs font-black text-mediumGray mb-3 uppercase tracking-widest">Telefoonka</label>
                <input
                  type="text"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="Tusaale: +252..."
                  className="w-full bg-gray-50/50 dark:bg-gray-700 border-2 border-transparent focus:border-primary rounded-xl py-4 px-6 focus:ring-0 transition-all font-black text-lg"
                />
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-blue-600 text-white py-4.5 rounded-[1.25rem] font-black text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 border-b-4 border-blue-800"
                >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : <UserPlus size={24} />}
                  Diiwaan Geli Macmiilka
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMessage && (
        <Toast
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}

      <style jsx global>{`
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes zoom-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-zoom-in {
          animation: zoom-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </Layout>
  );
}