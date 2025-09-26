'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../components/layouts/Layout';
import { 
  Plus, Search, Filter, Calendar, List, LayoutGrid, DollarSign, Tag, Package, ChevronRight,
  Eye, Edit, Trash2, Loader2, Info as InfoIcon, CheckCircle, XCircle, RefreshCw,
  Clock as ClockIcon, TrendingUp, TrendingDown, Factory, Wrench, Users, BarChart3,
  ShoppingCart, Truck, Receipt, Phone, Mail, MapPin, User
} from 'lucide-react';
import Toast from '../../components/common/Toast';

// --- Vendor Data Interfaces ---
interface Vendor {
  id: string;
  name: string;
  type: string;
  contactPerson?: string;
  phone?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  productsServices?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Fetch vendors
  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vendors');
      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors || []);
      } else {
        setToastMessage({ 
          message: 'Failed to fetch vendors', 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setToastMessage({ 
        message: 'Failed to fetch vendors', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // Filter vendors
  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || vendor.type === filterType;
    
    return matchesSearch && matchesType;
  });

  // Delete vendor
  const handleDeleteVendor = async (vendorId: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) {
      return;
    }

    try {
      const response = await fetch(`/api/vendors/${vendorId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setToastMessage({ 
          message: 'Vendor deleted successfully', 
          type: 'success' 
        });
        fetchVendors();
      } else {
        setToastMessage({ 
          message: 'Failed to delete vendor', 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('Error deleting vendor:', error);
      setToastMessage({ 
        message: 'Failed to delete vendor', 
        type: 'error' 
      });
    }
  };

  // Statistics
  const totalVendors = vendors.length;
  const materialVendors = vendors.filter(v => v.type === 'Material').length;
  const serviceVendors = vendors.filter(v => v.type === 'Service').length;
  const otherVendors = vendors.filter(v => v.type === 'Other').length;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Mobile-Responsive Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Vendors</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm lg:text-base">
              Manage your suppliers and service providers
            </p>
          </div>
          <Link
            href="/vendors/add"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-3 lg:px-4 py-2 rounded-lg transition-colors text-sm lg:text-base justify-center"
          >
            <Plus size={18} />
            Add Vendor
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">Total Vendors</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{totalVendors}</p>
              </div>
              <div className="p-2 lg:p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Users className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">Material Vendors</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{materialVendors}</p>
              </div>
              <div className="p-2 lg:p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Package className="h-5 w-5 lg:h-6 lg:w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">Service Vendors</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{serviceVendors}</p>
              </div>
              <div className="p-2 lg:p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Wrench className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600 dark:text-gray-400">Other Vendors</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{otherVendors}</p>
              </div>
              <div className="p-2 lg:p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <Tag className="h-5 w-5 lg:h-6 lg:w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 lg:pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm lg:text-base"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm lg:text-base"
              >
                <option value="all">All Types</option>
                <option value="Material">Material</option>
                <option value="Service">Service</option>
                <option value="Labor">Labor</option>
                <option value="Transport">Transport</option>
                <option value="Other">Other</option>
              </select>
              
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                {viewMode === 'grid' ? <List size={18} /> : <LayoutGrid size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Vendors List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No vendors found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by adding your first vendor'
                }
              </p>
              {!searchTerm && filterType === 'all' && (
                <Link
                  href="/vendors/add"
                  className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus size={20} />
                  Add Vendor
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: '800px' }}>
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Products/Services
                    </th>
                    <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-3 lg:px-6 py-2 lg:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                        <div>
                          <div className="text-xs lg:text-sm font-medium text-gray-900 dark:text-white">
                            {vendor.name}
                          </div>
                          {vendor.contactPerson && (
                            <div className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                              Contact: {vendor.contactPerson}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          vendor.type === 'Material' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          vendor.type === 'Service' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                          vendor.type === 'Labor' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                          vendor.type === 'Transport' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                        }`}>
                          {vendor.type}
                        </span>
                      </td>
                      <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                        <div className="text-xs lg:text-sm text-gray-900 dark:text-white">
                          {vendor.phone && (
                            <div className="flex items-center gap-1">
                              <Phone size={12} />
                              {vendor.phone}
                            </div>
                          )}
                          {vendor.email && (
                            <div className="flex items-center gap-1">
                              <Mail size={12} />
                              {vendor.email}
                            </div>
                          )}
                          {vendor.address && (
                            <div className="flex items-center gap-1">
                              <MapPin size={12} />
                              {vendor.address}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 lg:px-6 py-3 lg:py-4">
                        <div className="text-xs lg:text-sm text-gray-900 dark:text-white max-w-xs truncate">
                          {vendor.productsServices || 'Not specified'}
                        </div>
                      </td>
                      <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500 dark:text-gray-400">
                        {new Date(vendor.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1 lg:gap-2">
                          <Link
                            href={`/vendors/${vendor.id}`}
                            className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 p-1"
                          >
                            <Eye size={14} />
                          </Link>
                          <Link
                            href={`/vendors/${vendor.id}/edit`}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                          >
                            <Edit size={14} />
                          </Link>
                          <button
                            onClick={() => handleDeleteVendor(vendor.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Toast Message */}
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