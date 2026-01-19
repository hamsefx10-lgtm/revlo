'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../components/layouts/Layout';
import {
  ShoppingCart, Plus, Search, Filter,
  FileText, CheckCircle, Clock, ArrowUpRight, Loader2, AlertCircle
} from 'lucide-react';
import Toast from '../../components/common/Toast';

export default function SalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSales = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sales');
      if (!response.ok) throw new Error('Failed to fetch sales');
      const data = await response.json();
      setSales(data.sales || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error fetching sales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // Filter sales based on search term
  const filteredSales = sales.filter(sale =>
    (sale.description && sale.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (sale.customer && sale.customer.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in pb-20">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4 px-4 md:px-0">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              <span className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                <ShoppingCart size={24} />
              </span>
              Sales & Invoices
            </h1>
            <p className="text-gray-500 font-medium text-sm mt-1 ml-14">Track sales, payments, and customer balances.</p>
          </div>
          <Link href="/sales/add" className="bg-primary hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:translate-y-[-2px] transition-all">
            <Plus size={20} strokeWidth={3} /> New Sale
          </Link>
        </div>

        {/* SEARCH BAR */}
        <div className="mx-4 md:mx-0 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search description, customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-transparent text-sm font-medium focus:outline-none text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="mx-4 md:mx-0 bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}

        {/* SALES TABLE */}
        <div className="mx-4 md:mx-0 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No sales found</p>
              <p className="text-sm">Create a new sale to get started</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs">Description</th>
                  <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs">Date</th>
                  <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs">Customer</th>
                  <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs text-right">Amount</th>
                  <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{sale.description || 'Sale'}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(sale.transactionDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{sale.customer ? sale.customer.name : 'Walk-in Customer'}</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">{Number(sale.amount).toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <Link href={`/sales/${sale.id}`} className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
                        View <ArrowUpRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </Layout>
  );
}
