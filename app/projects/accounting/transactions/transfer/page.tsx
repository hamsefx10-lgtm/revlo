// app/accounting/transactions/transfer/page.tsx - Account to Account Transfer Page
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '@/components/layouts/Layout';
import {
  ArrowLeft, Repeat, DollarSign, Calendar, MessageSquare,
  Banknote, Loader2, Info as InfoIcon, CheckCircle, XCircle,
  ChevronRight
} from 'lucide-react';
import Toast from '@/components/common/Toast';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

function TransferPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillFromAccount = searchParams.get('fromAccount');

  const [fromAccountId, setFromAccountId] = useState(prefillFromAccount || '');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [feeAmount, setFeeAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [allowOverdraft, setAllowOverdraft] = useState(false);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Fetch accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      setPageLoading(true);
      try {
        const response = await fetch('/api/projects/accounting/accounts');
        if (!response.ok) throw new Error('Failed to fetch accounts');
        const data = await response.json();
        setAccounts(data.accounts || []);
      } catch (error: any) {
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka accounts-ka la soo gelinayay.', type: 'error' });
      } finally {
        setPageLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  // Get account details for display
  const fromAccount = accounts.find(a => a.id === fromAccountId);
  const toAccount = accounts.find(a => a.id === toAccountId);

  // Calculate fee percentage for display
  const feePercentage = (amount && feeAmount) ? ((Number(feeAmount) / Number(amount)) * 100).toFixed(2) : '0';
  const totalDeduction = (Number(amount) || 0) + (Number(feeAmount) || 0);

  // Validation
  const isOverdraft = fromAccount ? totalDeduction > fromAccount.balance : false;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!fromAccountId) newErrors.fromAccountId = 'Account-ka laga wareejiyay waa waajib.';
    if (!toAccountId) newErrors.toAccountId = 'Account-ka loo wareejiyay waa waajib.';
    if (fromAccountId === toAccountId) newErrors.toAccountId = 'Account-yada wareejinta ma noqon karaan isku mid.';
    if (!amount || amount <= 0) newErrors.amount = 'Qiimaha waa waajib oo waa inuu ka weyn yahay 0.';
    if (!description.trim()) newErrors.description = 'Sharaxaad waa waajib.';
    if (!transactionDate) newErrors.transactionDate = 'Taariikhda waa waajib.';

    // Only block if overdraft not acknowledged
    if (isOverdraft && !allowOverdraft) {
      newErrors.amount = `Caddayn waa waajib: Balance-ku wuu maynis noqon doonaa! Calaamadi sanduuqa hoose si aad u dhammaystirto.`;
    }

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setToastMessage({ message: 'Fadlan buuxi dhammaan beeraha si sax ah.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/projects/accounting/transactions/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAccountId,
          toAccountId,
          amount: Number(amount),
          description: description.trim(),
          transactionDate,
          note: note.trim() || null,
          feeAmount: Number(feeAmount) > 0 ? Number(feeAmount) : undefined,
          allowOverdraft,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Cilad ayaa dhacday marka lacagta la wareejinayay.');
      }

      setToastMessage({ message: data.message || 'Lacagta si guul leh ayaa loo wareejiyay!', type: 'success' });

      // Clear form
      setFromAccountId(prefillFromAccount || '');
      setToAccountId('');
      setAmount('');
      setFeeAmount('');
      setDescription('');
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setNote('');
      setAllowOverdraft(false);
      setValidationErrors({});

      // Redirect after 1.5 seconds
      setTimeout(() => {
        router.push('/projects/accounting/transactions');
      }, 1500);
    } catch (error: any) {
      console.error('Transfer API error:', error);
      setToastMessage({ message: error.message || 'Cilad shabakadeed ayaa dhacday. Fadlan isku day mar kale.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <Layout>
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} /> Loading Accounts...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Background Glow Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-primary/10 blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-emerald-400/5 dark:bg-emerald-500/10 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      <div className="relative z-10">
      <div className="flex justify-between items-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/projects/accounting/transactions" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-3 sm:mr-4">
            <ArrowLeft size={24} className="inline-block sm:w-7 sm:h-7" />
          </Link>
          Wareejin: Account to Account
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 lg:p-8 rounded-xl shadow-md animate-fade-in-up">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* From Account */}
          <div>
            <label htmlFor="fromAccountId" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">
              Laga Wareejiyay (From Account) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <select
                id="fromAccountId"
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className={`w-full p-3 pl-10 border rounded-2xl bg-white/60 dark:bg-gray-900/40 backdrop-blur-md text-gray-900 dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner ${validationErrors.fromAccountId ? 'border-rose-500 ring-1 ring-rose-500' : 'border-lightGray dark:border-gray-700'}`}
              >
                <option value="">-- Dooro Account-ka Laga Wareejiyay --</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.type}) - {account.balance.toLocaleString()} {account.currency}
                  </option>
                ))}
              </select>
              <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
            </div>
            {validationErrors.fromAccountId && (
              <p className="text-rose-500 text-sm mt-1 flex items-center">
                <InfoIcon size={16} className="mr-1" />{validationErrors.fromAccountId}
              </p>
            )}
            {fromAccount && (
              <div className="mt-2 p-3 bg-lightGray dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-mediumGray dark:text-gray-400">
                  Balance Hadda: <span className="font-semibold text-darkGray dark:text-gray-100">
                    {fromAccount.balance.toLocaleString()} {fromAccount.currency}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Transfer Arrow Icon */}
          <div className="flex justify-center my-4">
            <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-full">
              <Repeat className="text-primary" size={32} />
            </div>
          </div>

          {/* To Account */}
          <div>
            <label htmlFor="toAccountId" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">
              Loo Wareejiyay (To Account) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <select
                id="toAccountId"
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className={`w-full p-3 pl-10 border rounded-2xl bg-white/60 dark:bg-gray-900/40 backdrop-blur-md text-gray-900 dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner ${validationErrors.toAccountId ? 'border-rose-500 ring-1 ring-rose-500' : 'border-lightGray dark:border-gray-700'}`}
              >
                <option value="">-- Dooro Account-ka Loo Wareejiyay --</option>
                {accounts.filter(account => account.id !== fromAccountId).map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.type}) - {account.balance.toLocaleString()} {account.currency}
                  </option>
                ))}
              </select>
              <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
            </div>
            {validationErrors.toAccountId && (
              <p className="text-rose-500 text-sm mt-1 flex items-center">
                <InfoIcon size={16} className="mr-1" />{validationErrors.toAccountId}
              </p>
            )}
            {toAccount && (
              <div className="mt-2 p-3 bg-lightGray dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-mediumGray dark:text-gray-400">
                  Balance Hadda: <span className="font-semibold text-darkGray dark:text-gray-100">
                    {toAccount.balance.toLocaleString()} {toAccount.currency}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Amount & Description & Fee */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <label htmlFor="amount" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">
                Qiimaha <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || '')}
                  placeholder="Tusaale: 1000.00"
                  step="0.01"
                  min="0.01"
                  className={`w-full p-3 pl-10 border rounded-2xl bg-white/60 dark:bg-gray-900/40 backdrop-blur-md text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner ${validationErrors.amount ? 'border-rose-500 ring-1 ring-rose-500' : 'border-lightGray dark:border-gray-700'}`}
                />
              </div>
              {validationErrors.amount && (
                <p className="text-rose-500 text-sm mt-1 flex items-center">
                  <InfoIcon size={16} className="mr-1" />{validationErrors.amount}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="feeAmount" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">
                Khidmad (Lacag) (Ikhtiyaari)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <input
                  type="number"
                  id="feeAmount"
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(parseFloat(e.target.value) || '')}
                  placeholder="Tusaale: 50"
                  step="0.01"
                  min="0"
                  className={`w-full p-3 pl-10 border rounded-2xl bg-white/60 dark:bg-gray-900/40 backdrop-blur-md text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner border-lightGray dark:border-gray-700`}
                />
              </div>
              {amount && feeAmount && Number(feePercentage) > 0 && (
                <p className="text-xs text-mediumGray dark:text-gray-400 mt-1">
                  Boqolleyda: <span className="text-primary font-semibold">{feePercentage}%</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">
                Sharaxaad <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <input
                  type="text"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tusaale: Wareejin Bank ka Cash ka"
                  className={`w-full p-3 pl-10 border rounded-2xl bg-white/60 dark:bg-gray-900/40 backdrop-blur-md text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner ${validationErrors.description ? 'border-rose-500 ring-1 ring-rose-500' : 'border-lightGray dark:border-gray-700'}`}
                />
              </div>
              {validationErrors.description && (
                <p className="text-rose-500 text-sm mt-1 flex items-center">
                  <InfoIcon size={16} className="mr-1" />{validationErrors.description}
                </p>
              )}
            </div>
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label htmlFor="transactionDate" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">
                Taariikhda <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <input
                  type="date"
                  id="transactionDate"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.transactionDate ? 'border-rose-500 ring-1 ring-rose-500' : 'border-lightGray dark:border-gray-700'}`}
                />
              </div>
              {validationErrors.transactionDate && (
                <p className="text-rose-500 text-sm mt-1 flex items-center">
                  <InfoIcon size={16} className="mr-1" />{validationErrors.transactionDate}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="note" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">
                Note (Ikhtiyaari)
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 text-mediumGray dark:text-gray-400" size={20} />
                <textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Note xusuusin ah..."
                  rows={3}
                  className={`w-full p-3 pl-10 border rounded-2xl bg-white/60 dark:bg-gray-900/40 backdrop-blur-md text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner resize-none ${validationErrors.note ? 'border-rose-500 ring-1 ring-rose-500' : 'border-lightGray dark:border-gray-700'}`}
                />
              </div>
            </div>
          </div>

          {/* Overdraft Warning Block */}
          {isOverdraft && fromAccount && (
            <div className="rounded-xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/20 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mt-0.5">
                  <InfoIcon size={16} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-amber-800 dark:text-amber-300 text-sm mb-1">⚠️ Balance Ku Filan Ma Jirto!</p>
                  <div className="text-sm text-amber-700 dark:text-amber-400 space-y-0.5">
                    <p>Balance hadda: <span className="font-bold">${fromAccount.balance.toLocaleString()}</span></p>
                    <p>Wareejinta la rabaa: <span className="font-bold">${totalDeduction.toLocaleString()}</span></p>
                    <p>Balance ka hadhaya: <span className="font-bold text-red-600 dark:text-red-400">${(fromAccount.balance - totalDeduction).toLocaleString()}</span> (MAYNIS)</p>
                  </div>
                  <label className="flex items-center gap-3 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowOverdraft}
                      onChange={e => setAllowOverdraft(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                      Hubiyo: Waan ogsonahay balance-ku maynis ku dhacayo — Haddana Sii Wad Wareejinta
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Summary Preview */}
          {fromAccount && toAccount && amount && (
            <div className={`border rounded-xl p-4 ${
              isOverdraft
                ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                : 'bg-primary/10 dark:bg-primary/20 border-primary/20'
            }`}>
              <h3 className="font-semibold text-darkGray dark:text-gray-100 mb-2">Isku Xidhka Wareejinta:</h3>
              <div className="space-y-1 text-sm">
                <p className="text-mediumGray dark:text-gray-400">
                  <span className="font-medium">Laga Wareejiyay:</span> {fromAccount.name}
                  <span className="ml-2 text-rose-500">-{Number(amount).toLocaleString()} {fromAccount.currency}</span>
                </p>
                {Number(feeAmount) > 0 && (
                  <p className="text-mediumGray dark:text-gray-400">
                    <span className="font-medium">Khidmad ({feePercentage}%):</span>
                    <span className="ml-2 text-rose-500">-{Number(feeAmount).toLocaleString()} {fromAccount.currency}</span>
                  </p>
                )}
                <p className="text-mediumGray dark:text-gray-400">
                  <span className="font-medium">Loo Wareejiyay:</span> {toAccount.name}
                  <span className="ml-2 text-secondary">+{Number(amount).toLocaleString()} {toAccount.currency}</span>
                </p>
                <div className="border-t border-gray-200 dark:border-gray-600 my-2 pt-2"></div>
                <p className="text-mediumGray dark:text-gray-400">
                  <span className="font-medium">Total Laga Goynayo:</span>
                  <span className="ml-2 font-bold text-rose-500">{totalDeduction.toLocaleString()} {fromAccount.currency}</span>
                </p>
                <p className="text-mediumGray dark:text-gray-400">
                  <span className="font-medium">Balance ka hadhay ({fromAccount.name}):</span>
                  <span className={`ml-2 font-bold ${
                    fromAccount.balance - totalDeduction >= 0
                      ? 'text-darkGray dark:text-gray-100'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {(fromAccount.balance - totalDeduction).toLocaleString()} {fromAccount.currency}
                    {fromAccount.balance - totalDeduction < 0 && ' ⚠️ MAYNIS'}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              href="/projects/accounting/transactions"
              className="flex-1 sm:flex-initial px-6 py-3 bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 rounded-lg font-semibold hover:bg-mediumGray dark:hover:bg-gray-600 transition-colors duration-200 text-center"
            >
              Jooji
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-initial px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Waa la Wareejiyayaa...
                </>
              ) : (
                <>
                  <Repeat className="mr-2" size={20} />
                  Wareeji Lacagta
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
      </div>
    </Layout>
  );
}

export default function TransferPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} /> Loading...
        </div>
      </Layout>
    }>
      <TransferPageContent />
    </Suspense>
  );
}

