'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../components/layouts/Layout';
import { 
  Plus, Search, Filter, Calendar, List, LayoutGrid, DollarSign, Tag, Package, ChevronRight,
  Eye, Edit, Trash2, Loader2, Info as InfoIcon, CheckCircle, XCircle, RefreshCw,
  Clock as ClockIcon, TrendingUp, TrendingDown, Factory, Wrench, Users, BarChart3,
  ShoppingCart, Truck, Receipt, Phone, Mail, MapPin, User, Building
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

  // Auto-switch to grid view on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode('grid');
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <div className="pb-20 md:pb-6">
        {/* Mobile Header */}
        <div className="block md:hidden mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border-l-4 border-primary mb-4">
            <h1 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-3">
              Iibiyayaal
            </h1>
            <div className="flex gap-2">
              <Link 
                href="/vendors/add"
                className="flex-1 py-2.5 px-3 rounded-lg font-medium text-sm transition duration-200 shadow-md bg-primary text-white hover:bg-blue-700 flex items-center justify-center"
              >
                <Plus size={16} className="mr-1" />
                Ku Dar Iibiye
              </Link>
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100 mb-2">
              Iibiyayaal
            </h1>
            <p className="text-mediumGray dark:text-gray-400 text-lg">
              Maareynta iibiyayaasha
            </p>
          </div>
          <Link
            href="/vendors/add"
            className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Ku Dar Iibiye
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {/* Total Vendors Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border-l-4 border-primary p-4 md:p-5 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Users className="text-primary" size={24} />
                </div>
              <div>
                  <p className="text-sm text-mediumGray dark:text-gray-400 mb-1">Wadarta Iibiyayaasha</p>
                  <p className="text-2xl font-bold text-darkGray dark:text-gray-100">{totalVendors}</p>
              </div>
              </div>
            </div>
          </div>

          {/* Material Vendors Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border-l-4 border-green-500 p-4 md:p-5 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-green-500/10 p-3 rounded-lg">
                  <Package className="text-green-500" size={24} />
                </div>
              <div>
                  <p className="text-sm text-mediumGray dark:text-gray-400 mb-1">Alaab</p>
                  <p className="text-2xl font-bold text-darkGray dark:text-gray-100">{materialVendors}</p>
              </div>
              </div>
            </div>
          </div>

          {/* Service Vendors Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border-l-4 border-purple-500 p-4 md:p-5 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500/10 p-3 rounded-lg">
                  <Wrench className="text-purple-500" size={24} />
                </div>
              <div>
                  <p className="text-sm text-mediumGray dark:text-gray-400 mb-1">Adeegyada</p>
                  <p className="text-2xl font-bold text-darkGray dark:text-gray-100">{serviceVendors}</p>
              </div>
              </div>
            </div>
          </div>

          {/* Other Vendors Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border-l-4 border-accent p-4 md:p-5 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-accent/10 p-3 rounded-lg">
                  <Tag className="text-accent" size={24} />
                </div>
              <div>
                  <p className="text-sm text-mediumGray dark:text-gray-400 mb-1">Kale</p>
                  <p className="text-2xl font-bold text-darkGray dark:text-gray-100">{otherVendors}</p>
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-md mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Raadi iibiyayaal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-lightGray dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2.5 border border-lightGray dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              >
                <option value="all">Dhammaan Noocaha</option>
                <option value="Material">Alaab</option>
                <option value="Service">Adeegyada</option>
                <option value="Labor">Shaqada</option>
                <option value="Transport">Gaadiidka</option>
                <option value="Other">Kale</option>
              </select>
              
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2.5 border border-lightGray dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 hover:bg-lightGray dark:hover:bg-gray-700 transition-colors"
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
              <Users className="h-12 w-12 text-mediumGray dark:text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-darkGray dark:text-gray-100 mb-2">Ma jiraan iibiyayaal</h3>
              <p className="text-mediumGray dark:text-gray-400 mb-4">
                {searchTerm || filterType !== 'all' 
                  ? 'Fadlan dib u eeg raadinta ama filterkaaga'
                  : 'Ku bilaaw dhismaha iibiyahaaga ugu horreeya'
                }
              </p>
              {!searchTerm && filterType === 'all' && (
                <Link
                  href="/vendors/add"
                  className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg transition-colors hover:bg-blue-700"
                >
                  <Plus size={20} />
                  Ku Dar Iibiye
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
              <table className="w-full" style={{ minWidth: '800px' }}>
                <thead className="bg-gradient-to-r from-primary to-blue-600">
                  <tr>
                    <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      <User size={16} className="inline mr-2" />
                      Iibiye
                    </th>
                    <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      <Tag size={16} className="inline mr-2" />
                      Nooca
                    </th>
                    <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      <Phone size={16} className="inline mr-2" />
                      Xidhiidhka
                    </th>
                    <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      <Package size={16} className="inline mr-2" />
                      Adeegyo/Alaab
                    </th>
                    <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      <Calendar size={16} className="inline mr-2" />
                      Taariikhda
                    </th>
                    <th className="px-3 lg:px-6 py-3 lg:py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                      Falconaxad
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

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 p-4">
                {filteredVendors.map((vendor) => (
                  <div key={vendor.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border-l-4 border-primary p-4 hover:shadow-lg transition-shadow duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="bg-primary/10 p-2.5 rounded-lg">
                          <Building className="text-primary" size={20} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-darkGray dark:text-gray-100 mb-1">{vendor.name}</h3>
                          {vendor.contactPerson && (
                            <p className="text-sm text-mediumGray dark:text-gray-400 flex items-center gap-1">
                              <User size={12} />
                              {vendor.contactPerson}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 ${
                        vendor.type === 'Material' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30' :
                        vendor.type === 'Service' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30' :
                        vendor.type === 'Labor' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30' :
                        vendor.type === 'Transport' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30' :
                        'bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/30'
                      }`}>
                        {vendor.type === 'Material' ? <Package size={14} /> :
                         vendor.type === 'Service' ? <Wrench size={14} /> :
                         vendor.type === 'Labor' ? <Factory size={14} /> :
                         vendor.type === 'Transport' ? <Truck size={14} /> :
                         <Tag size={14} />}
                        {vendor.type}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      {vendor.phone && (
                        <div className="flex items-center gap-2 text-sm text-darkGray dark:text-gray-300 bg-lightGray dark:bg-gray-700/50 p-2 rounded-lg">
                          <Phone size={16} className="text-primary" />
                          <span>{vendor.phone}</span>
                        </div>
                      )}
                      {vendor.email && (
                        <div className="flex items-center gap-2 text-sm text-darkGray dark:text-gray-300 bg-lightGray dark:bg-gray-700/50 p-2 rounded-lg">
                          <Mail size={16} className="text-primary" />
                          <span className="truncate">{vendor.email}</span>
                        </div>
                      )}
                      {vendor.address && (
                        <div className="flex items-center gap-2 text-sm text-darkGray dark:text-gray-300 bg-lightGray dark:bg-gray-700/50 p-2 rounded-lg">
                          <MapPin size={16} className="text-primary" />
                          <span className="truncate">{vendor.address}</span>
                        </div>
                      )}
                      {vendor.productsServices && (
                        <div className="pt-2 border-t border-lightGray dark:border-gray-700">
                          <p className="text-sm font-medium text-mediumGray dark:text-gray-400 mb-1 flex items-center gap-2">
                            <Package size={14} />
                            Adeegyo/Alaab:
                          </p>
                          <p className="text-sm text-darkGray dark:text-white bg-lightGray dark:bg-gray-700/50 p-2 rounded-lg">{vendor.productsServices}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-lightGray dark:border-gray-700">
                      <div className="text-xs text-mediumGray dark:text-gray-400 flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(vendor.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/vendors/${vendor.id}`}
                          className="bg-accent/10 text-accent hover:bg-accent hover:text-white p-2 rounded-lg transition-colors"
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          href={`/vendors/${vendor.id}/edit`}
                          className="bg-primary/10 text-primary hover:bg-primary hover:text-white p-2 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDeleteVendor(vendor.id)}
                          className="bg-redError/10 text-redError hover:bg-redError hover:text-white p-2 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
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