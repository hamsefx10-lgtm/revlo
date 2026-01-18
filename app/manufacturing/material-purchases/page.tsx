'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus, Search, ShoppingCart, Filter, Calendar, FileText, Loader2, DollarSign
} from 'lucide-react';

export default function MaterialPurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/manufacturing/material-purchases?search=${searchTerm}`);
      if (res.ok) {
        const data = await res.json();
        setPurchases(data.purchases || []);
      }
    } catch (e) {
      console.error("Failed to load purchases", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchPurchases, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const totalSpent = purchases.reduce((acc, p) => acc + (p.totalPrice || 0), 0);

  return (
    <div className="flex flex-col gap-6 p-2 lg:p-4 min-h-screen pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="text-emerald-500" /> Material Purchases
          </h1>
          <p className="text-sm text-gray-500 font-medium">Track procurement of raw materials and expenses.</p>
        </div>
        <Link href="/manufacturing/material-purchases/add" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-all hover:-translate-y-0.5">
          <Plus size={18} /> Record Purchase
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Spend</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1">
              {loading ? '-' : `$${totalSpent.toLocaleString()}`}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
            <ShoppingCart size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Purchases</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1">{loading ? '-' : purchases.length}</p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col min-h-[400px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex gap-4">
          <div className="relative flex-1 md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search material, vendor, invoice..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          {loading && purchases.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-gray-400 gap-2">
              <Loader2 className="animate-spin" /> Loading records...
            </div>
          ) : purchases.length === 0 ? (
            <div className="flex flex-col h-64 items-center justify-center text-gray-400 gap-4">
              <ShoppingCart size={48} className="opacity-20" />
              <p>No purchase records found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 font-bold border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Material</th>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4">Qty / Price</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4">Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(p.purchaseDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-white">{p.materialName}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {p.vendor?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {p.quantity} {p.unit} x ${p.unitPrice?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                      ${p.totalPrice?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                      {p.invoiceNumber || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
