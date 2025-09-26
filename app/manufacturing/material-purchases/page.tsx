'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import { 
  Plus, Search, Filter, Calendar, List, LayoutGrid, DollarSign, Tag, Package, ChevronRight,
  Eye, Edit, Trash2, Loader2, Info as InfoIcon, CheckCircle, XCircle, RefreshCw,
  Clock as ClockIcon, TrendingUp, TrendingDown, Factory, Wrench, Users, BarChart3,
  ShoppingCart, Truck, Receipt
} from 'lucide-react';
import Toast from '../../../components/common/Toast';

// --- Material Purchase Data Interfaces ---
interface MaterialPurchase {
  id: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  vendorId: string;
  purchaseDate: string;
  invoiceNumber?: string;
  notes?: string;
  productionOrderId?: string;
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: string;
    name: string;
    contactPerson?: string;
    phone?: string;
  };
  productionOrder?: {
    id: string;
    orderNumber: string;
    productName: string;
  };
}

interface Vendor {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}

interface ProductionOrder {
  id: string;
  orderNumber: string;
  productName: string;
  status: string;
}

const MaterialPurchaseRow: React.FC<{ 
  purchase: MaterialPurchase; 
  onEdit: (id: string) => void; 
  onDelete: (id: string) => void; 
  onView: (id: string) => void;
}> = ({ purchase, onEdit, onDelete, onView }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <tr className="border-b border-lightGray dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <td className="p-2 lg:p-4">
        <div className="flex items-center space-x-2 lg:space-x-3">
          <div className="flex-shrink-0">
            <Package className="h-6 w-6 lg:h-8 lg:w-8 text-primary" />
          </div>
          <div>
            <div className="text-xs lg:text-sm font-medium text-darkGray dark:text-gray-100">
              {purchase.materialName}
            </div>
            <div className="text-xs lg:text-sm text-mediumGray dark:text-gray-400">
              {purchase.quantity} {purchase.unit}
            </div>
          </div>
        </div>
      </td>
      <td className="p-2 lg:p-4">
        <div className="text-xs lg:text-sm text-darkGray dark:text-gray-100">
          {purchase.vendor?.name || 'N/A'}
        </div>
        <div className="text-xs lg:text-sm text-mediumGray dark:text-gray-400">
          {purchase.vendor?.contactPerson || ''}
        </div>
      </td>
      <td className="p-2 lg:p-4">
        <div className="text-xs lg:text-sm text-darkGray dark:text-gray-100">
          {purchase.productionOrder?.orderNumber || 'N/A'}
        </div>
        <div className="text-xs lg:text-sm text-mediumGray dark:text-gray-400">
          {purchase.productionOrder?.productName || ''}
        </div>
      </td>
      <td className="p-2 lg:p-4">
        <div className="text-xs lg:text-sm font-medium text-darkGray dark:text-gray-100">
          ${purchase.unitPrice.toFixed(2)}
        </div>
        <div className="text-xs lg:text-sm text-mediumGray dark:text-gray-400">
          per {purchase.unit}
        </div>
      </td>
      <td className="p-2 lg:p-4">
        <div className="text-xs lg:text-sm font-bold text-primary">
          ${purchase.totalPrice.toFixed(2)}
        </div>
      </td>
      <td className="p-2 lg:p-4">
        <div className="text-xs lg:text-sm text-darkGray dark:text-gray-100">
          {new Date(purchase.purchaseDate).toLocaleDateString()}
        </div>
      </td>
      <td className="p-2 lg:p-4">
        <div className="flex items-center space-x-1 lg:space-x-2">
          <button
            onClick={() => onView(purchase.id)}
            className="p-1 lg:p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="View details"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => onEdit(purchase.id)}
            className="p-1 lg:p-2 text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
            title="Edit purchase"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => onDelete(purchase.id)}
            className="p-1 lg:p-2 text-redError hover:bg-redError/10 rounded-lg transition-colors"
            title="Delete purchase"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default function MaterialPurchasesPage() {
  const [materialPurchases, setMaterialPurchases] = useState<MaterialPurchase[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVendor, setFilterVendor] = useState('All');
  const [filterDate, setFilterDate] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [pageLoading, setPageLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // --- API Functions ---
  const fetchMaterialPurchases = async () => {
    setPageLoading(true);
    try {
      const response = await fetch('/api/manufacturing/material-purchases');
      if (!response.ok) throw new Error('Failed to fetch material purchases');
      const data = await response.json();
      setMaterialPurchases(data.materialPurchases || []);
    } catch (error: any) {
      console.error('Error fetching material purchases:', error);
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka iibka alaabta la soo gelinayay.', type: 'error' });
      setMaterialPurchases([]);
    } finally {
      setPageLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors');
      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors || []);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchProductionOrders = async () => {
    try {
      const response = await fetch('/api/manufacturing/production-orders');
      if (response.ok) {
        const data = await response.json();
        setProductionOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching production orders:', error);
    }
  };

  const handleDeletePurchase = async (id: string) => {
    if (!confirm('Ma hubtaa inaad tirtirto iibkan alaabta?')) return;

    try {
      const response = await fetch(`/api/manufacturing/material-purchases/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete material purchase');

      setToastMessage({ 
        message: 'Iibka alaabta si guul leh ayaa loo tirtiray!', 
        type: 'success' 
      });
      fetchMaterialPurchases();
    } catch (error: any) {
      console.error('Error deleting material purchase:', error);
      setToastMessage({ 
        message: error.message || 'Cilad ayaa dhacday marka iibka alaabta la tirtirayay.', 
        type: 'error' 
      });
    }
  };

  const handleEditPurchase = (id: string) => {
    // Navigate to edit page
    window.location.href = `/manufacturing/material-purchases/${id}/edit`;
  };

  const handleViewPurchase = (id: string) => {
    // Navigate to view page
    window.location.href = `/manufacturing/material-purchases/${id}`;
  };


  useEffect(() => {
    fetchMaterialPurchases();
    fetchVendors();
    fetchProductionOrders();
  }, []);

  // Filter and search
  const filteredPurchases = materialPurchases.filter(purchase => {
    const matchesSearch = purchase.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         purchase.vendor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         purchase.productionOrder?.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesVendor = filterVendor === 'All' || purchase.vendor?.name === filterVendor;
    
    const matchesDate = filterDate === 'All' || 
                       (filterDate === 'Today' && new Date(purchase.purchaseDate).toDateString() === new Date().toDateString()) ||
                       (filterDate === 'This Week' && (() => {
                         const weekAgo = new Date();
                         weekAgo.setDate(weekAgo.getDate() - 7);
                         return new Date(purchase.purchaseDate) >= weekAgo;
                       })()) ||
                       (filterDate === 'This Month' && (() => {
                         const monthAgo = new Date();
                         monthAgo.setMonth(monthAgo.getMonth() - 1);
                         return new Date(purchase.purchaseDate) >= monthAgo;
                       })());

    return matchesSearch && matchesVendor && matchesDate;
  });

  const totalPurchases = filteredPurchases.length;
  const totalValue = filteredPurchases.reduce((sum, purchase) => sum + purchase.totalPrice, 0);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Mobile-Responsive Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-4xl font-bold text-darkGray dark:text-gray-100">Material Purchases</h1>
            <p className="text-mediumGray dark:text-gray-400 mt-1 lg:mt-2 text-sm lg:text-base">Manage material purchases and inventory</p>
          </div>
          <Link
            href="/manufacturing/material-purchases/add"
            className="bg-primary text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm lg:text-base justify-center"
          >
            <Plus size={18} />
            New Purchase
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="bg-gradient-to-br from-primary/10 to-primary/20 p-4 lg:p-6 rounded-xl shadow-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm lg:text-lg font-semibold text-primary">Total Purchases</h3>
                <p className="text-2xl lg:text-3xl font-bold text-darkGray dark:text-gray-100">{totalPurchases}</p>
              </div>
              <ShoppingCart className="text-primary" size={24} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-secondary/10 to-secondary/20 p-4 lg:p-6 rounded-xl shadow-lg border border-secondary/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm lg:text-lg font-semibold text-secondary">Total Value</h3>
                <p className="text-2xl lg:text-3xl font-bold text-darkGray dark:text-gray-100">${totalValue.toFixed(2)}</p>
              </div>
              <DollarSign className="text-secondary" size={24} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-accent/10 to-accent/20 p-4 lg:p-6 rounded-xl shadow-lg border border-accent/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm lg:text-lg font-semibold text-accent">Active Vendors</h3>
                <p className="text-2xl lg:text-3xl font-bold text-darkGray dark:text-gray-100">{vendors.length}</p>
              </div>
              <Truck className="text-accent" size={24} />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search materials, vendors, or orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 lg:pl-10 pr-4 py-2 lg:py-2 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm lg:text-base"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
              <select
                value={filterVendor}
                onChange={(e) => setFilterVendor(e.target.value)}
                className="px-3 lg:px-4 py-2 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm lg:text-base"
              >
                <option value="All">All Vendors</option>
                {vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.name}>{vendor.name}</option>
                ))}
              </select>

              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 lg:px-4 py-2 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary text-sm lg:text-base"
              >
                <option value="All">All Time</option>
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
              </select>

              <div className="flex border border-lightGray dark:border-gray-600 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100'}`}
                >
                  <List size={18} />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 ${viewMode === 'cards' ? 'bg-primary text-white' : 'bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100'}`}
                >
                  <LayoutGrid size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Material Purchases Table */}
        {pageLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-darkGray dark:text-gray-100">Material Purchases</h3>
            </div>
            
            {filteredPurchases.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No material purchases found</p>
                <Link
                  href="/manufacturing/material-purchases/add"
                  className="mt-4 inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} />
                  Add First Purchase
                </Link>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Material</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vendor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Production Order</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Unit Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Purchase Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredPurchases.map((purchase) => (
                        <MaterialPurchaseRow
                          key={purchase.id}
                          purchase={purchase}
                          onEdit={handleEditPurchase}
                          onDelete={handleDeletePurchase}
                          onView={handleViewPurchase}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4 p-4">
                  {filteredPurchases.map((purchase) => (
                    <div key={purchase.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Package className="h-6 w-6 text-primary" />
                          <div>
                            <h3 className="text-sm font-medium text-darkGray dark:text-gray-100">
                              {purchase.materialName}
                            </h3>
                            <p className="text-xs text-mediumGray dark:text-gray-400">
                              {purchase.quantity} {purchase.unit}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleViewPurchase(purchase.id)}
                            className="p-1 text-primary hover:bg-primary/10 rounded transition-colors"
                            title="View details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEditPurchase(purchase.id)}
                            className="p-1 text-secondary hover:bg-secondary/10 rounded transition-colors"
                            title="Edit purchase"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeletePurchase(purchase.id)}
                            className="p-1 text-redError hover:bg-redError/10 rounded transition-colors"
                            title="Delete purchase"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-mediumGray dark:text-gray-400">Vendor</p>
                          <p className="text-darkGray dark:text-gray-100 font-medium">
                            {purchase.vendor?.name || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-mediumGray dark:text-gray-400">Production Order</p>
                          <p className="text-darkGray dark:text-gray-100 font-medium">
                            {purchase.productionOrder?.orderNumber || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-mediumGray dark:text-gray-400">Unit Price</p>
                          <p className="text-darkGray dark:text-gray-100 font-medium">
                            ${purchase.unitPrice.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-mediumGray dark:text-gray-400">Total Price</p>
                          <p className="text-primary font-bold">
                            ${purchase.totalPrice.toFixed(2)}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-mediumGray dark:text-gray-400">Purchase Date</p>
                          <p className="text-darkGray dark:text-gray-100 font-medium">
                            {new Date(purchase.purchaseDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
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
