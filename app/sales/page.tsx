// app/sales/page.tsx - Sales Management Page
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../components/layouts/Layout';
import { 
  Plus, Search, Filter, Calendar, DollarSign, Package, 
  RefreshCw, Loader2, Eye, TrendingUp, Users
} from 'lucide-react';
import Toast from '../../components/common/Toast';

interface Sale {
  id: string;
  description: string;
  amount: number;
  transactionDate: string;
  note?: string;
  customer?: {
    id: string;
    name: string;
  };
  account?: {
    id: string;
    name: string;
  };
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      let url = '/api/sales';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch sales');
      const data = await response.json();
      setSales(data.sales || []);
    } catch (error: any) {
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka iibka la soo gelinayay.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalSales = filteredSales.reduce((sum, sale) => sum + Number(sale.amount), 0);
  const todaySales = filteredSales.filter(sale => {
    const saleDate = new Date(sale.transactionDate);
    const today = new Date();
    return saleDate.toDateString() === today.toDateString();
  }).reduce((sum, sale) => sum + Number(sale.amount), 0);

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-darkGray dark:text-gray-100">Iibka</h1>
            <p className="text-mediumGray dark:text-gray-400 mt-1">Maamul iibka alaabta</p>
          </div>
          <Link
            href="/sales/add"
            className="bg-secondary text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Ku Dar Iib Cusub</span>
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-lightGray dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mediumGray dark:text-gray-400 text-sm">Wadarta Iibka</p>
                <p className="text-2xl font-bold text-darkGray dark:text-gray-100 mt-1">
                  {totalSales.toLocaleString()} ETB
                </p>
              </div>
              <DollarSign className="text-secondary" size={32} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-lightGray dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mediumGray dark:text-gray-400 text-sm">Iibka Maanta</p>
                <p className="text-2xl font-bold text-darkGray dark:text-gray-100 mt-1">
                  {todaySales.toLocaleString()} ETB
                </p>
              </div>
              <TrendingUp className="text-green-500" size={32} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-lightGray dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mediumGray dark:text-gray-400 text-sm">Tirada Iibka</p>
                <p className="text-2xl font-bold text-darkGray dark:text-gray-100 mt-1">
                  {filteredSales.length}
                </p>
              </div>
              <Package className="text-primary" size={32} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-lightGray dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Raadi iibka..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="Bilow"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
                placeholder="Dhamaad"
              />
            </div>
            <button
              onClick={fetchSales}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
            >
              <RefreshCw size={18} />
              <span>Dib u soo celi</span>
            </button>
          </div>
        </div>

        {/* Sales Table */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-12 rounded-lg shadow border border-lightGray dark:border-gray-700 text-center">
            <Package className="mx-auto text-mediumGray dark:text-gray-400 mb-4" size={48} />
            <p className="text-mediumGray dark:text-gray-400 text-lg">Ma jiro iib la heli karo</p>
            <Link href="/sales/add" className="text-secondary hover:underline mt-2 inline-block">
              Ku dar iib cusub
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-lightGray dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-lightGray dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-darkGray dark:text-gray-100">Taariikhda</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-darkGray dark:text-gray-100">Sharaxaad</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-darkGray dark:text-gray-100">Macmiilka</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-darkGray dark:text-gray-100">Account</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-darkGray dark:text-gray-100">Qiimaha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-lightGray/50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-6 py-4 text-mediumGray dark:text-gray-300">
                        {new Date(sale.transactionDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-darkGray dark:text-gray-100">{sale.description}</div>
                        {sale.note && (
                          <div className="text-sm text-mediumGray dark:text-gray-400 mt-1">{sale.note}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-mediumGray dark:text-gray-300">
                        {sale.customer?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-mediumGray dark:text-gray-300">
                        {sale.account?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-secondary">
                        {Number(sale.amount).toLocaleString()} ETB
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
    </Layout>
  );
}

