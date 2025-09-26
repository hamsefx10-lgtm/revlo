// app/reports/bankbook/page.tsx - Bankbook Report Page (API-driven)
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import { ArrowLeft, Banknote, CreditCard, Search, Filter, Calendar, XCircle } from 'lucide-react';

interface BankbookEntry {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  account: string;
}

export default function BankbookReportPage() {
  const [entries, setEntries] = useState<BankbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBankbook() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/accounting/reports/bankbook');
        if (!res.ok) throw new Error('Failed to fetch bankbook data');
        const data = await res.json();
        setEntries(data.entries || data);
      } catch (err: any) {
        setError(err.message || 'Error fetching bankbook data');
      } finally {
        setLoading(false);
      }
    }
    fetchBankbook();
  }, []);

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center min-h-[400px] text-darkGray dark:text-gray-100">
        <span className="animate-spin mr-3"><Banknote size={32} className="text-primary" /></span> Warbixinta Bankbook-ga ayaa soo dhacaya...
      </div>
    </Layout>
  );
  if (error) return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <XCircle size={32} className="mb-2 text-redError" />
        <div className="text-redError text-lg font-bold mb-2">{error}</div>
        <button onClick={() => window.location.reload()} className="bg-primary text-white px-4 py-2 rounded-lg font-semibold mt-2">Reload</button>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/reports" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Bankbook Report
        </h1>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-x-auto animate-fade-in-up">
        <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
          <thead className="bg-lightGray dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Taariikhda</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Sharaxaad</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Debit</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Credit</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Balance</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Account</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-lightGray dark:divide-gray-700">
            {entries.length > 0 ? entries.map(entry => (
              <tr key={entry.id} className="hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-150">
                <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100">{new Date(entry.date).toLocaleDateString()}</td>
                <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{entry.description}</td>
                <td className="p-4 whitespace-nowrap text-right text-redError">{entry.debit > 0 ? `-$${entry.debit.toLocaleString()}` : '-'}</td>
                <td className="p-4 whitespace-nowrap text-right text-secondary">{entry.credit > 0 ? `+$${entry.credit.toLocaleString()}` : '-'}</td>
                <td className="p-4 whitespace-nowrap text-right font-semibold text-darkGray dark:text-gray-100">${entry.balance.toLocaleString()}</td>
                <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{entry.account}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="p-4 text-center text-mediumGray dark:text-gray-400">Ma jiraan xisaab-dhaqaaqyo la helay.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
