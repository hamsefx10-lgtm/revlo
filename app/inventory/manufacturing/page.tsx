'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import { 
  ArrowLeft, Factory, Package, Calendar, DollarSign, Search, Filter, 
  Eye, Edit, Trash2, Download, RefreshCw, Loader2, AlertCircle, 
  CheckCircle, Clock, Users, Briefcase, Scissors, Hammer, Info,
  TrendingUp, TrendingDown, BarChart, PieChart, FileText, Tag
} from 'lucide-react';
import Toast from '../../../components/common/Toast';

// --- Manufacturing Used Data Interface ---
interface ManufacturingUsed {
  id: string;
  materialName: string;
  quantityUsed: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
  usedDate: string;
  productionOrderId: string;
  projectId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  productionOrder: {
    orderNumber: string;
    productName: string;
    status: string;
  };
  project?: {
    name: string;
    status: string;
  };
}

// --- Statistics Interface ---
interface ManufacturingStats {
  totalMaterialsUsed: number;
  totalCost: number;
  totalProductionOrders: number;
  totalProjects: number;
  averageCostPerUsage: number;
  mostUsedMaterial: string;
  recentUsage: number;
}

export default function ManufacturingUsagePage() {
  const [manufacturingUsed, setManufacturingUsed] = useState<ManufacturingUsed[]>([]);
  const [filteredData, setFilteredData] = useState<ManufacturingUsed[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [materialFilter, setMaterialFilter] = useState('all');
  
  // Statistics
  const [stats, setStats] = useState<ManufacturingStats>({
    totalMaterialsUsed: 0,
    totalCost: 0,
    totalProductionOrders: 0,
    totalProjects: 0,
    averageCostPerUsage: 0,
    mostUsedMaterial: '',
    recentUsage: 0
  });

  // Fetch manufacturing used data
  const fetchManufacturingUsed = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/inventory/manufacturing');
      if (!response.ok) throw new Error('Failed to fetch manufacturing usage data');
      
      const data = await response.json();
      setManufacturingUsed(data.manufacturingUsed || []);
      setFilteredData(data.manufacturingUsed || []);
      
      // Calculate statistics
      calculateStats(data.manufacturingUsed || []);
      
    } catch (error: any) {
      console.error('Error fetching manufacturing usage data:', error);
      setToastMessage({ 
        message: error.message || 'Cilad ayaa dhacday marka xogta isticmaalka warshadaha la soo gelinayay.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (data: ManufacturingUsed[]) => {
    const totalMaterialsUsed = data.reduce((sum, item) => sum + item.quantityUsed, 0);
    const totalCost = data.reduce((sum, item) => sum + item.totalCost, 0);
    const uniqueProductionOrders = new Set(data.map(item => item.productionOrderId)).size;
    const uniqueProjects = new Set(data.filter(item => item.projectId).map(item => item.projectId)).size;
    const averageCostPerUsage = data.length > 0 ? totalCost / data.length : 0;
    
    // Find most used material
    const materialCounts = data.reduce((acc, item) => {
      acc[item.materialName] = (acc[item.materialName] || 0) + item.quantityUsed;
      return acc;
    }, {} as Record<string, number>);
    
    const mostUsedMaterial = Object.entries(materialCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';
    
    // Recent usage (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsage = data.filter(item => new Date(item.usedDate) >= sevenDaysAgo).length;

    setStats({
      totalMaterialsUsed,
      totalCost,
      totalProductionOrders: uniqueProductionOrders,
      totalProjects: uniqueProjects,
      averageCostPerUsage,
      mostUsedMaterial,
      recentUsage
    });
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...manufacturingUsed];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productionOrder.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productionOrder.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.project?.name && item.project.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.productionOrder.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.usedDate);
        switch (dateFilter) {
          case 'today':
            return itemDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return itemDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return itemDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Material filter
    if (materialFilter !== 'all') {
      filtered = filtered.filter(item => item.materialName === materialFilter);
    }

    setFilteredData(filtered);
  }, [manufacturingUsed, searchTerm, statusFilter, dateFilter, materialFilter]);

  useEffect(() => {
    fetchManufacturingUsed();
  }, []);

  // Get unique materials for filter
  const uniqueMaterials = Array.from(new Set(manufacturingUsed.map(item => item.materialName)));

  // Get unique statuses for filter
  const uniqueStatuses = Array.from(new Set(manufacturingUsed.map(item => item.productionOrder.status)));

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/inventory"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-darkGray dark:text-gray-100" />
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">Manufacturing Material Usage</h1>
              <p className="text-mediumGray dark:text-gray-400 mt-2">Track materials used in production and projects</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchManufacturingUsed}
              className="bg-orange-500 text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-orange-600 transition duration-200 shadow-md flex items-center"
            >
              <RefreshCw size={20} className="mr-2" /> Refresh
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mediumGray dark:text-gray-400 text-sm font-medium">Total Materials Used</p>
                <p className="text-3xl font-bold text-darkGray dark:text-gray-100">{stats.totalMaterialsUsed.toLocaleString()}</p>
              </div>
              <div className="bg-orange-500/10 text-orange-500 p-3 rounded-full">
                <Scissors size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mediumGray dark:text-gray-400 text-sm font-medium">Total Cost</p>
                <p className="text-3xl font-bold text-darkGray dark:text-gray-100">${stats.totalCost.toLocaleString()}</p>
              </div>
              <div className="bg-green-500/10 text-green-500 p-3 rounded-full">
                <DollarSign size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mediumGray dark:text-gray-400 text-sm font-medium">Production Orders</p>
                <p className="text-3xl font-bold text-darkGray dark:text-gray-100">{stats.totalProductionOrders}</p>
              </div>
              <div className="bg-blue-500/10 text-blue-500 p-3 rounded-full">
                <Factory size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mediumGray dark:text-gray-400 text-sm font-medium">Projects</p>
                <p className="text-3xl font-bold text-darkGray dark:text-gray-100">{stats.totalProjects}</p>
              </div>
              <div className="bg-purple-500/10 text-purple-500 p-3 rounded-full">
                <Briefcase size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mediumGray dark:text-gray-400 text-sm font-medium">Average Cost</p>
                <p className="text-2xl font-bold text-darkGray dark:text-gray-100">${stats.averageCostPerUsage.toFixed(2)}</p>
              </div>
              <div className="bg-yellow-500/10 text-yellow-500 p-3 rounded-full">
                <BarChart size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mediumGray dark:text-gray-400 text-sm font-medium">Most Used Material</p>
                <p className="text-lg font-bold text-darkGray dark:text-gray-100 truncate">{stats.mostUsedMaterial}</p>
              </div>
              <div className="bg-red-500/10 text-red-500 p-3 rounded-full">
                <Package size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-mediumGray dark:text-gray-400 text-sm font-medium">Recent Usage (7 days)</p>
                <p className="text-2xl font-bold text-darkGray dark:text-gray-100">{stats.recentUsage}</p>
              </div>
              <div className="bg-indigo-500/10 text-indigo-500 p-3 rounded-full">
                <Clock size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">Search</label>
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search materials, orders, projects..."
                  className="w-full pl-10 pr-3 py-2 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Statuses</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">Date Range</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full p-2 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-darkGray dark:text-gray-100 mb-2">Material</label>
              <select
                value={materialFilter}
                onChange={(e) => setMaterialFilter(e.target.value)}
                className="w-full p-2 border border-lightGray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Materials</option>
                {uniqueMaterials.map(material => (
                  <option key={material} value={material}>{material}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-darkGray dark:text-gray-100">Manufacturing Usage Records</h2>
            <p className="text-mediumGray dark:text-gray-400 mt-1">Showing {filteredData.length} of {manufacturingUsed.length} records</p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <Loader2 size={32} className="animate-spin text-orange-500 mx-auto mb-4" />
              <p className="text-mediumGray dark:text-gray-400">Loading manufacturing usage data...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="p-8 text-center">
              <Package size={48} className="text-mediumGray dark:text-gray-400 mx-auto mb-4" />
              <p className="text-mediumGray dark:text-gray-400">No manufacturing usage records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Material</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Production Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date Used</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package size={20} className="text-orange-500 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-darkGray dark:text-gray-100">{item.materialName}</div>
                            {item.notes && (
                              <div className="text-xs text-mediumGray dark:text-gray-400 truncate max-w-xs">{item.notes}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-darkGray dark:text-gray-100">
                          {item.quantityUsed} {item.unit}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-darkGray dark:text-gray-100">
                          <div className="font-medium">${item.totalCost.toFixed(2)}</div>
                          <div className="text-xs text-mediumGray dark:text-gray-400">${item.costPerUnit.toFixed(2)}/unit</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Factory size={16} className="text-blue-500 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-darkGray dark:text-gray-100">{item.productionOrder.orderNumber}</div>
                            <div className="text-xs text-mediumGray dark:text-gray-400">{item.productionOrder.productName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.project ? (
                          <div className="flex items-center">
                            <Briefcase size={16} className="text-purple-500 mr-2" />
                            <div>
                              <div className="text-sm font-medium text-darkGray dark:text-gray-100">{item.project.name}</div>
                              <div className="text-xs text-mediumGray dark:text-gray-400">{item.project.status}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-mediumGray dark:text-gray-400">No Project</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-darkGray dark:text-gray-100">
                          {new Date(item.usedDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                            <Eye size={16} />
                          </button>
                          <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                            <Edit size={16} />
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
