// app/sales/add/page.tsx - Add New Sale Page
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import { ArrowLeft, Save, Loader2, Package, DollarSign, Users } from 'lucide-react';
import Toast from '../../../components/common/Toast';

interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  sellingPrice: number;
}

interface Customer {
  id: string;
  name: string;
}

interface Account {
  id: string;
  name: string;
}

export default function AddSalePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [formData, setFormData] = useState({
    productId: '',
    customerId: '',
    quantity: '',
    unitPrice: '',
    totalAmount: '',
    accountId: '',
    saleDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setPageLoading(true);
      const [productsRes, customersRes, accountsRes] = await Promise.all([
        fetch('/api/manufacturing/products'),
        fetch('/api/customers'),
        fetch('/api/accounting/accounts'),
      ]);

      if (!productsRes.ok) throw new Error('Failed to fetch products');
      if (!customersRes.ok) throw new Error('Failed to fetch customers');
      if (!accountsRes.ok) throw new Error('Failed to fetch accounts');

      const productsData = await productsRes.json();
      const customersData = await customersRes.json();
      const accountsData = await accountsRes.json();

      setProducts(productsData.products || []);
      setCustomers(customersData.customers || []);
      setAccounts(accountsData.accounts || []);
    } catch (error: any) {
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka xogta la soo gelinayay.', type: 'error' });
    } finally {
      setPageLoading(false);
    }
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setFormData({
        ...formData,
        productId,
        unitPrice: product.sellingPrice.toString(),
        totalAmount: formData.quantity ? (parseFloat(formData.quantity) * product.sellingPrice).toString() : '',
      });
    }
  };

  const handleQuantityChange = (quantity: string) => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(formData.unitPrice) || 0;
    setFormData({
      ...formData,
      quantity,
      totalAmount: (qty * price).toString(),
    });
  };

  const handlePriceChange = (price: string) => {
    const p = parseFloat(price) || 0;
    const qty = parseFloat(formData.quantity) || 0;
    setFormData({
      ...formData,
      unitPrice: price,
      totalAmount: (qty * p).toString(),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToastMessage(null);

    if (!formData.productId || !formData.quantity || !formData.accountId) {
      setToastMessage({ message: 'Fadlan buuxi dhammaan beeraha waajibka ah.', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: formData.productId,
          customerId: formData.customerId || null,
          quantity: parseFloat(formData.quantity),
          unitPrice: parseFloat(formData.unitPrice) || 0,
          totalAmount: parseFloat(formData.totalAmount) || 0,
          accountId: formData.accountId,
          saleDate: formData.saleDate,
          notes: formData.notes || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create sale');
      }

      setToastMessage({ message: 'Iibka si guul leh ayaa loo diiwaan geliyay!', type: 'success' });
      setTimeout(() => {
        router.push('/sales');
      }, 1500);
    } catch (error: any) {
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </Layout>
    );
  }

  const selectedProduct = products.find(p => p.id === formData.productId);

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/sales" className="p-2 hover:bg-lightGray dark:hover:bg-gray-700 rounded-lg transition">
              <ArrowLeft size={24} className="text-darkGray dark:text-gray-100" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-darkGray dark:text-gray-100">Ku Dar Iib Cusub</h1>
              <p className="text-mediumGray dark:text-gray-400 mt-1">Diiwaan geli iib cusub</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-lightGray dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                  Alaabta <span className="text-redError">*</span>
                </label>
                <select
                  required
                  value={formData.productId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full px-4 py-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="">Dooro alaabta...</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.sellingPrice.toLocaleString()} ETB/{product.unit}
                    </option>
                  ))}
                </select>
                {selectedProduct && (
                  <p className="text-xs text-mediumGray dark:text-gray-400 mt-1">
                    Qaybta: {selectedProduct.category} | Halbeegga: {selectedProduct.unit}
                  </p>
                )}
              </div>

              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                  Macmiilka
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full px-4 py-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="">Dooro macmiilka...</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Quantity */}
              <div>
                <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                  Tirada <span className="text-redError">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
                />
                {selectedProduct && (
                  <p className="text-xs text-mediumGray dark:text-gray-400 mt-1">
                    Halbeegga: {selectedProduct.unit}
                  </p>
                )}
              </div>

              {/* Unit Price */}
              <div>
                <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                  Qiimaha Halbeegga (ETB) <span className="text-redError">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              {/* Total Amount */}
              <div>
                <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                  Wadarta (ETB)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary font-semibold text-secondary"
                  readOnly
                />
                <p className="text-xs text-mediumGray dark:text-gray-400 mt-1">
                  Waa la xisaabayaa si toos ah
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Account Selection */}
              <div>
                <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                  Account <span className="text-redError">*</span>
                </label>
                <select
                  required
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  className="w-full px-4 py-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="">Dooro account-ka...</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </select>
              </div>

              {/* Sale Date */}
              <div>
                <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                  Taariikhda Iibka
                </label>
                <input
                  type="date"
                  value={formData.saleDate}
                  onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                  className="w-full px-4 py-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-darkGray dark:text-gray-100 mb-2">
                Xusuusin
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Xusuusin kooban..."
                rows={3}
                className="w-full px-4 py-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-secondary text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-600 transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Waa la kaydiyayaa...</span>
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    <span>Kaydi Iibka</span>
                  </>
                )}
              </button>
              <Link
                href="/sales"
                className="px-6 py-3 border border-lightGray dark:border-gray-700 rounded-lg font-semibold text-darkGray dark:text-gray-100 hover:bg-lightGray dark:hover:bg-gray-700 transition"
              >
                Jooji
              </Link>
            </div>
          </form>
        </div>
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

