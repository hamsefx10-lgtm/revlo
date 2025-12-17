// app/manufacturing/products/page.tsx - Product Catalog Management Page
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import { 
  ArrowLeft, Plus, Search, Filter, Edit, Trash2, Package, DollarSign, 
  Tag, Loader2, CheckCircle, XCircle, RefreshCw, Eye, Info as InfoIcon
} from 'lucide-react';
import Toast from '../../../components/common/Toast';

interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  standardCost: number;
  sellingPrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/manufacturing/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error: any) {
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka alaabta la soo gelinayay.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/manufacturing/products/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete product');
      setToastMessage({ message: 'Alaabta si guul leh ayaa loo tirtiray!', type: 'success' });
      fetchProducts();
      setDeleteConfirm(null);
    } catch (error: any) {
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka alaabta la tirtirayay.', type: 'error' });
    }
  };

  const categories = Array.from(new Set(products.map(p => p.category)));
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.isActive).length;
  const totalValue = products.reduce((sum, p) => sum + (p.sellingPrice * 0), 0); // Placeholder

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/manufacturing" className="p-2 hover:bg-lightGray dark:hover:bg-gray-700 rounded-lg transition">
              <ArrowLeft size={24} className="text-darkGray dark:text-gray-100" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-darkGray dark:text-gray-100">Kataloogga Alaabta</h1>
              <p className="text-mediumGray dark:text-gray-400 mt-1">Maamul alaabta iyo qiimaha</p>
            </div>
          </div>
          <Link
            href="/manufacturing/products/add"
            className="bg-secondary text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Ku Dar Alaab Cusub</span>
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-lightGray dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mediumGray dark:text-gray-400 text-sm">Wadarta Alaabta</p>
                <p className="text-2xl font-bold text-darkGray dark:text-gray-100 mt-1">{totalProducts}</p>
              </div>
              <Package className="text-secondary" size={32} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-lightGray dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mediumGray dark:text-gray-400 text-sm">Alaabta Firfircoon</p>
                <p className="text-2xl font-bold text-darkGray dark:text-gray-100 mt-1">{activeProducts}</p>
              </div>
              <CheckCircle className="text-green-500" size={32} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-lightGray dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mediumGray dark:text-gray-400 text-sm">Qaybaha</p>
                <p className="text-2xl font-bold text-darkGray dark:text-gray-100 mt-1">{categories.length}</p>
              </div>
              <Tag className="text-primary" size={32} />
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
                placeholder="Raadi alaabta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="all">Dhammaan Qaybaha</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button
              onClick={fetchProducts}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
            >
              <RefreshCw size={18} />
              <span>Dib u soo celi</span>
            </button>
          </div>
        </div>

        {/* Products Table */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-12 rounded-lg shadow border border-lightGray dark:border-gray-700 text-center">
            <Package className="mx-auto text-mediumGray dark:text-gray-400 mb-4" size={48} />
            <p className="text-mediumGray dark:text-gray-400 text-lg">Ma jiro alaab la heli karo</p>
            <Link href="/manufacturing/products/add" className="text-secondary hover:underline mt-2 inline-block">
              Ku dar alaab cusub
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-lightGray dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-lightGray dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-darkGray dark:text-gray-100">Alaabta</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-darkGray dark:text-gray-100">Qaybta</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-darkGray dark:text-gray-100">Halbeegga</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-darkGray dark:text-gray-100">Kharashka</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-darkGray dark:text-gray-100">Qiimaha Iibka</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-darkGray dark:text-gray-100">Xaaladda</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-darkGray dark:text-gray-100">Ficilada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-lightGray/50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-darkGray dark:text-gray-100">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-mediumGray dark:text-gray-400 mt-1">{product.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-mediumGray dark:text-gray-300">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-mediumGray dark:text-gray-300">{product.unit}</td>
                      <td className="px-6 py-4 text-right font-semibold text-darkGray dark:text-gray-100">
                        {product.standardCost.toLocaleString()} ETB
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-secondary">
                        {product.sellingPrice.toLocaleString()} ETB
                      </td>
                      <td className="px-6 py-4 text-center">
                        {product.isActive ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded text-xs font-medium">
                            Firfircoon
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded text-xs font-medium">
                            Naafo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <Link
                            href={`/manufacturing/products/edit/${product.id}`}
                            className="p-2 text-primary hover:bg-primary/10 rounded transition"
                            title="Wax ka beddel"
                          >
                            <Edit size={18} />
                          </Link>
                          <button
                            onClick={() => setDeleteConfirm(product.id)}
                            className="p-2 text-redError hover:bg-redError/10 rounded transition"
                            title="Tirtir"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-darkGray dark:text-gray-100 mb-4">Xaqiijinta Tirtirka</h3>
            <p className="text-mediumGray dark:text-gray-400 mb-6">
              Ma hubtaa inaad tirtirto alaabtan? Tani waa ficil aan la soo celin karin.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-redError text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition"
              >
                Haa, Tirtir
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Maya
              </button>
            </div>
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
    </Layout>
  );
}

