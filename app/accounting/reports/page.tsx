// app/accounting/reports/page.tsx - Accounting Reports Page
"use client";
import React, { useEffect, useState } from "react";
import { Banknote, DollarSign, TrendingUp, TrendingDown, RefreshCw, Smartphone, Wallet, Loader2, Info as InfoIcon, CheckCircle } from 'lucide-react';
import Toast from '../../../components/common/Toast';

interface ReportData {
  totalBalance: number;
  totalIncomeThisMonth: number;
  totalExpensesThisMonth: number;
  netFlowThisMonth: number;
  totalBankAccounts: number;
  totalCashAccounts: number;
  totalMobileMoneyAccounts: number;
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/accounting/reports");
        if (!res.ok) throw new Error("Server error");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Error fetching data");
        setToastMessage({ message: err.message || "Error fetching data", type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const currency = 'SOS';
  const format = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px]">
      <Loader2 className="animate-spin mr-3 text-primary" size={32} /> <span className="text-lg text-darkGray dark:text-gray-100">Xogta warbixinta ayaa soo dhacaysa...</span>
    </div>
  );
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[300px]">
      <InfoIcon size={32} className="mb-2 text-redError" />
      <div className="text-redError text-lg font-bold mb-2">{error}</div>
      <button onClick={() => window.location.reload()} className="bg-primary text-white px-4 py-2 rounded-lg font-semibold mt-2">Reload</button>
    </div>
  );
  if (!data) return <div className="text-center text-mediumGray">No data found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-darkGray dark:text-gray-100 text-center">Warbixinada Xisaabaadka</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex flex-col items-center">
          <Banknote size={32} className="mb-2 text-primary" />
          <div className="font-semibold text-mediumGray dark:text-gray-400">Hantida Guud</div>
          <div className="text-2xl font-extrabold text-primary">{format(data.totalBalance)} <span className="text-gray-500">{currency}</span></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex flex-col items-center">
          <TrendingUp size={32} className="mb-2 text-green-500" />
          <div className="font-semibold text-mediumGray dark:text-gray-400">Dakhli Bishan</div>
          <div className="text-xl font-bold text-green-600">{format(data.totalIncomeThisMonth)} {currency}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex flex-col items-center">
          <TrendingDown size={32} className="mb-2 text-redError" />
          <div className="font-semibold text-mediumGray dark:text-gray-400">Kharashyada Bishan</div>
          <div className="text-xl font-bold text-redError">{format(data.totalExpensesThisMonth)} {currency}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex flex-col items-center">
          <RefreshCw size={32} className="mb-2 text-blue-500" />
          <div className="font-semibold text-mediumGray dark:text-gray-400">Net Flow Bishan</div>
          <div className={`text-xl font-bold ${data.netFlowThisMonth >= 0 ? 'text-green-600' : 'text-redError'}`}>{format(data.netFlowThisMonth)} {currency}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex flex-col items-center">
          <Wallet size={32} className="mb-2 text-accent" />
          <div className="font-semibold text-mediumGray dark:text-gray-400">Xisaabaadka Bangiga</div>
          <div className="text-xl font-bold text-accent">{data.totalBankAccounts}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex flex-col items-center">
          <DollarSign size={32} className="mb-2 text-yellow-500" />
          <div className="font-semibold text-mediumGray dark:text-gray-400">Xisaabaadka Lacagta Caddaanka</div>
          <div className="text-xl font-bold text-yellow-600">{data.totalCashAccounts}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex flex-col items-center">
          <Smartphone size={32} className="mb-2 text-blue-400" />
          <div className="font-semibold text-mediumGray dark:text-gray-400">Xisaabaadka Mobile Money</div>
          <div className="text-xl font-bold text-blue-500">{data.totalMobileMoneyAccounts}</div>
        </div>
      </div>
      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
}
