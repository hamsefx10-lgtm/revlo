// app/accounting/transactions/transfer/page.tsx - Account to Account Transfer Page
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '../../../../components/layouts/Layout';
import {
  ArrowLeft, Repeat, DollarSign, Calendar, MessageSquare,
  Banknote, Loader2, Info as InfoIcon, CheckCircle, XCircle,
  ChevronRight
} from 'lucide-react';
import Toast from '../../../../components/common/Toast';

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
        const response = await fetch('/api/accounting/accounts');
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
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!fromAccountId) newErrors.fromAccountId = 'Account-ka laga wareejiyay waa waajib.';
    if (!toAccountId) newErrors.toAccountId = 'Account-ka loo wareejiyay waa waajib.';
    if (fromAccountId === toAccountId) newErrors.toAccountId = 'Account-yada wareejinta ma noqon karaan isku mid.';
    if (!amount || amount <= 0) newErrors.amount = 'Qiimaha waa waajib oo waa inuu ka weyn yahay 0.';
    if (!description.trim()) newErrors.description = 'Sharaxaad waa waajib.';
    if (!transactionDate) newErrors.transactionDate = 'Taariikhda waa waajib.';

    // Check if from account has sufficient balance
    if (fromAccount && totalDeduction > fromAccount.balance) {
      newErrors.amount = `Account-ka '${fromAccount.name}' ma laha lacag ku filan. Waxa loo baahan yahay: ${totalDeduction.toLocaleString()} (Wareejin + Khidmad), Balance: ${fromAccount.balance.toLocaleString()} ${fromAccount.currency}`;
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
      const response = await fetch('/api/accounting/transactions/transfer', {
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
      setValidationErrors({});

      // Redirect after 1.5 seconds
      setTimeout(() => {
        router.push('/accounting/transactions');
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
      <div className="flex justify-between items-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/accounting/transactions" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-3 sm:mr-4">
            <ArrowLeft size={24} className="inline-block sm:w-7 sm:h-7" />
          </Link>
          Wareejin: Account to Account
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 lg:p-8 rounded-xl shadow-md animate-fade-in-up">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* From Account */}
          <div>
            <label htmlFor="fromAccountId" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">
              Laga Wareejiyay (From Account) <span className="text-redError">*</span>
            </label>
            <div className="relative">
              <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <select
                id="fromAccountId"
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.fromAccountId ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
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
              <p className="text-redError text-sm mt-1 flex items-center">
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
              Loo Wareejiyay (To Account) <span className="text-redError">*</span>
            </label>
            <div className="relative">
              <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <select
                id="toAccountId"
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.toAccountId ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
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
              <p className="text-redError text-sm mt-1 flex items-center">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="amount" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">
                Qiimaha <span className="text-redError">*</span>
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
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.amount ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                />
              </div>
              {validationErrors.amount && (
                <p className="text-redError text-sm mt-1 flex items-center">
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
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 border-lightGray dark:border-gray-700`}
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
                Sharaxaad <span className="text-redError">*</span>
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <input
                  type="text"
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tusaale: Wareejin Bank ka Cash ka"
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.description ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                />
              </div>
              {validationErrors.description && (
                <p className="text-redError text-sm mt-1 flex items-center">
                  <InfoIcon size={16} className="mr-1" />{validationErrors.description}
                </p>
              )}
            </div>
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="transactionDate" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">
                Taariikhda <span className="text-redError">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <input
                  type="date"
                  id="transactionDate"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.transactionDate ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                />
              </div>
              {validationErrors.transactionDate && (
                <p className="text-redError text-sm mt-1 flex items-center">
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
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 resize-none ${validationErrors.note ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                />
              </div>
            </div>
          </div>

          {/* Summary Preview */}
          {fromAccount && toAccount && amount && (
            <div className="bg-primary/10 dark:bg-primary/20 border border-primary/20 rounded-lg p-4">
              <h3 className="font-semibold text-darkGray dark:text-gray-100 mb-2">Isku Xidhka Wareejinta:</h3>
              <div className="space-y-1 text-sm">
                <p className="text-mediumGray dark:text-gray-400">
                  <span className="font-medium">Laga Wareejiyay:</span> {fromAccount.name}
                  <span className="ml-2 text-redError">-{Number(amount).toLocaleString()} {fromAccount.currency}</span>
                </p>
                {Number(feeAmount) > 0 && (
                  <p className="text-mediumGray dark:text-gray-400">
                    <span className="font-medium">Khidmad ({feePercentage}%):</span>
                    <span className="ml-2 text-redError">-{feeAmount.toLocaleString()} {fromAccount.currency}</span>
                  </p>
                )}
                <p className="text-mediumGray dark:text-gray-400">
                  <span className="font-medium">Loo Wareejiyay:</span> {toAccount.name}
                  <span className="ml-2 text-secondary">+{Number(amount).toLocaleString()} {toAccount.currency}</span>
                </p>
                <div className="border-t border-gray-200 dark:border-gray-600 my-2 pt-2"></div>
                <p className="text-mediumGray dark:text-gray-400">
                  <span className="font-medium">Total Laga Goynayo:</span>
                  <span className="ml-2 font-bold text-redError">
                    {totalDeduction.toLocaleString()} {fromAccount.currency}
                  </span>
                </p>
                <p className="text-mediumGray dark:text-gray-400">
                  <span className="font-medium">Balance ka hadhay ({fromAccount.name}):</span>
                  <span className="ml-2 font-semibold text-darkGray dark:text-gray-100">
                    {(fromAccount.balance - totalDeduction).toLocaleString()} {fromAccount.currency}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link
              href="/accounting/transactions"
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

