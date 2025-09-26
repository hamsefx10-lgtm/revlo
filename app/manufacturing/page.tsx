// app/manufacturing/page.tsx - Manufacturing Dashboard (Warshadaha)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../components/layouts/Layout';
import { 
  Plus, Search, Filter, Calendar, List, LayoutGrid, DollarSign, Tag, Package, ChevronRight,
  Eye, Edit, Trash2, Loader2, Info as InfoIcon, CheckCircle, XCircle, RefreshCw,
  Clock as ClockIcon, TrendingUp, TrendingDown, Factory, Wrench, Users, BarChart3
} from 'lucide-react';
import Toast from '../../components/common/Toast';

// --- Manufacturing Data Interfaces ---
interface ProductionOrder {
  id: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  startDate?: string;
  dueDate?: string;
  completedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
  };
  billOfMaterials?: BillOfMaterial[];
  workOrders?: WorkOrder[];
}

interface BillOfMaterial {
  id: string;
  materialName: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
  notes?: string;
}

interface WorkOrder {
  id: string;
  stage: string;
  description?: string;
  estimatedHours: number;
  actualHours?: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  startTime?: string;
  endTime?: string;
  assignedTo?: {
    id: string;
    fullName: string;
  };
}

// --- Production Order Row Component ---
const ProductionOrderRow: React.FC<{ 
  order: ProductionOrder; 
  onEdit: (id: string) => void; 
  onDelete: (id: string) => void; 
  onView: (id: string) => void;
}> = ({ order, onEdit, onDelete, onView }) => {
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'text-green-600 dark:text-green-400';
      case 'MEDIUM': return 'text-blue-600 dark:text-blue-400';
      case 'HIGH': return 'text-orange-600 dark:text-orange-400';
      case 'URGENT': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const totalMaterials = order.billOfMaterials?.length || 0;
  const totalWorkOrders = order.workOrders?.length || 0;
  const completedWorkOrders = order.workOrders?.filter(wo => wo.status === 'COMPLETED').length || 0;
  const progressPercentage = totalWorkOrders > 0 ? (completedWorkOrders / totalWorkOrders) * 100 : 0;

  return (
    <tr className="hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5 dark:hover:from-primary/10 dark:hover:to-secondary/10 transition-all duration-200 border-b border-lightGray dark:border-gray-700 last:border-b-0 group">
      <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-medium">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
            <Factory size={16} className="text-white"/>
          </div>
          <div>
            <span className="font-semibold">{order.productName}</span>
            <div className="text-xs text-mediumGray dark:text-gray-400">
              #{order.orderNumber}
            </div>
          </div>
        </div>
      </td>
      <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">
        <div className="flex items-center space-x-2">
          <Package size={16} className="text-accent"/> 
          <span className="font-medium">{order.quantity} pcs</span>
        </div>
      </td>
      <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">
        <div className="flex items-center space-x-2">
          <Users size={16} className="text-green-500"/> 
          <span>{order.customer?.name || 'N/A'}</span>
        </div>
      </td>
      <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-semibold text-right">
        <span className={`font-bold ${getPriorityColor(order.priority)}`}>
          {order.priority}
        </span>
      </td>
      <td className="p-4 whitespace-nowrap text-center">
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
          {order.status === 'PLANNED' ? 'Qorshaysan' : 
           order.status === 'IN_PROGRESS' ? 'Warshadaha' :
           order.status === 'COMPLETED' ? 'Dhammaaday' : 'Joojiyay'}
        </span>
      </td>
      <td className="p-4 whitespace-nowrap text-center">
        <div className="flex items-center justify-center space-x-2">
          <div className="text-sm text-mediumGray dark:text-gray-400">
            {completedWorkOrders}/{totalWorkOrders}
          </div>
          <div className="w-16 bg-lightGray dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </td>
      <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-semibold text-right">
        {order.dueDate ? (
          <span className="text-blue-600 dark:text-blue-400 font-bold">
            {new Date(order.dueDate).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-mediumGray">N/A</span>
        )}
      </td>
      <td className="p-4 whitespace-nowrap text-center">
        <div className="flex items-center justify-center space-x-1">
          <button onClick={() => onView(order.id)} className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-200 hover:scale-110 shadow-sm" title="View Details">
            <Eye size={16} />
          </button>
          <button onClick={() => onEdit(order.id)} className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all duration-200 hover:scale-110 shadow-sm" title="Edit Order">
            <Edit size={16} />
          </button>
          <button onClick={() => onDelete(order.id)} className="p-2 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-all duration-200 hover:scale-110 shadow-sm" title="Delete Order">
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default function ManufacturingPage() {
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [pageLoading, setPageLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // --- API Functions ---
  const fetchProductionOrders = async () => {
    setPageLoading(true);
    try {
      const response = await fetch('/api/manufacturing/production-orders');
      if (!response.ok) throw new Error('Failed to fetch production orders');
      const data = await response.json();
      setProductionOrders(data.orders || []);
    } catch (error: any) {
      console.error('Error fetching production orders:', error);
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka amarka warshadaha la soo gelinayay.', type: 'error' });
      setProductionOrders([]);
    } finally {
      setPageLoading(false);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (window.confirm('Ma hubtaa inaad tirtirto amarkan warshadaha? Tan lama soo celin karo!')) {
      try {
        const response = await fetch(`/api/manufacturing/production-orders/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete production order');
        
        setToastMessage({ message: data.message || 'Amarka warshadaha si guul leh ayaa loo tirtiray!', type: 'success' });
        fetchProductionOrders();
      } catch (error: any) {
        console.error('Error deleting production order:', error);
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka amarka warshadaha la tirtirayay.', type: 'error' });
      }
    }
  };

  const handleEditOrder = (id: string) => {
    window.location.href = `/manufacturing/production-orders/${id}/edit`;
  };

  const handleViewOrder = (id: string) => {
    window.location.href = `/manufacturing/production-orders/${id}`;
  };

  useEffect(() => {
    fetchProductionOrders();
  }, []);

  const filteredOrders = productionOrders.filter(order => {
    const matchesSearch = order.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (order.customer?.name && order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
    const matchesPriority = filterPriority === 'All' || order.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Statistics
  const totalOrders = filteredOrders.length;
  const plannedOrders = filteredOrders.filter(o => o.status === 'PLANNED').length;
  const inProgressOrders = filteredOrders.filter(o => o.status === 'IN_PROGRESS').length;
  const completedOrders = filteredOrders.filter(o => o.status === 'COMPLETED').length;
  const totalQuantity = filteredOrders.reduce((sum, order) => sum + order.quantity, 0);

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">Warshadaha</h1>
        <div className="flex space-x-3">
          <Link href="/manufacturing/production-orders/add" className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center">
            <Plus size={20} className="mr-2" /> Ku Dar Amarka Warshadaha
          </Link>
          <button onClick={fetchProductionOrders} className="bg-secondary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-green-600 transition duration-200 shadow-md flex items-center">
            <RefreshCw size={20} className="mr-2" /> Cusboonaysii
          </button>
        </div>
      </div>

      {/* Manufacturing Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in-up">
        <div className="bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30 p-6 rounded-xl shadow-lg border border-primary/20 dark:border-primary/30 text-center hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-center mb-3">
            <Factory className="text-primary" size={28} />
          </div>
          <h4 className="text-lg font-semibold text-primary dark:text-primary">Total Orders</h4>
          <p className="text-3xl font-extrabold text-darkGray dark:text-gray-100">{totalOrders}</p>
          <p className="text-sm text-mediumGray dark:text-gray-400 mt-1">Production Orders</p>
        </div>
        
        <div className="bg-gradient-to-br from-accent/10 to-accent/20 dark:from-accent/20 dark:to-accent/30 p-6 rounded-xl shadow-lg border border-accent/20 dark:border-accent/30 text-center hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-center mb-3">
            <ClockIcon className="text-accent" size={28} />
          </div>
          <h4 className="text-lg font-semibold text-accent dark:text-accent">In Progress</h4>
          <p className="text-3xl font-extrabold text-darkGray dark:text-gray-100">{inProgressOrders}</p>
          <p className="text-sm text-mediumGray dark:text-gray-400 mt-1">Active Production</p>
        </div>
        
        <div className="bg-gradient-to-br from-secondary/10 to-secondary/20 dark:from-secondary/20 dark:to-secondary/30 p-6 rounded-xl shadow-lg border border-secondary/20 dark:border-secondary/30 text-center hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-center mb-3">
            <CheckCircle className="text-secondary" size={28} />
          </div>
          <h4 className="text-lg font-semibold text-secondary dark:text-secondary">Completed</h4>
          <p className="text-3xl font-extrabold text-darkGray dark:text-gray-100">{completedOrders}</p>
          <p className="text-sm text-mediumGray dark:text-gray-400 mt-1">Finished Orders</p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/20 dark:from-purple-500/20 dark:to-purple-600/30 p-6 rounded-xl shadow-lg border border-purple-500/20 dark:border-purple-500/30 text-center hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-center mb-3">
            <Package className="text-purple-500" size={28} />
          </div>
          <h4 className="text-lg font-semibold text-purple-600 dark:text-purple-400">Total Products</h4>
          <p className="text-3xl font-extrabold text-darkGray dark:text-gray-100">{totalQuantity}</p>
          <p className="text-sm text-mediumGray dark:text-gray-400 mt-1">Items Produced</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8 animate-fade-in-up">
        <div className="flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="relative w-full lg:flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
            <input
              type="text"
              placeholder="🔍 Search amarka warshadaha..."
              className="w-full p-4 pl-12 border-2 border-lightGray dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Filter Controls */}
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            {/* Filter by Status */}
            <div className="relative w-full sm:w-48">
              <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
              <select
                title="Filter by status"
                className="w-full p-3 pl-10 border-2 border-lightGray dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 appearance-none shadow-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">Dhammaan Xaaladaha</option>
                <option value="PLANNED">Qorshaysan</option>
                <option value="IN_PROGRESS">Warshadaha</option>
                <option value="COMPLETED">Dhammaaday</option>
                <option value="CANCELLED">Joojiyay</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
                <ChevronRight className="transform rotate-90" size={18} />
              </div>
            </div>
            
            {/* Filter by Priority */}
            <div className="relative w-full sm:w-48">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={18} />
              <select
                title="Filter by priority"
                className="w-full p-3 pl-10 border-2 border-lightGray dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 appearance-none shadow-sm"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="All">Dhammaan Darajada</option>
                <option value="LOW">Hoos</option>
                <option value="MEDIUM">Dhexe</option>
                <option value="HIGH">Kor</option>
                <option value="URGENT">Degdeg</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
                <ChevronRight className="transform rotate-90" size={18} />
              </div>
            </div>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex space-x-2 w-full sm:w-auto justify-center">
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-3 rounded-lg transition-all duration-200 shadow-sm ${
                viewMode === 'list' 
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md' 
                  : 'bg-white dark:bg-gray-800 text-mediumGray dark:text-gray-400 border-2 border-lightGray dark:border-gray-700 hover:border-primary'
              }`}
              title="List View"
            >
              <List size={20} />
            </button>
            <button 
              onClick={() => setViewMode('cards')} 
              className={`p-3 rounded-lg transition-all duration-200 shadow-sm ${
                viewMode === 'cards' 
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md' 
                  : 'bg-white dark:bg-gray-800 text-mediumGray dark:text-gray-400 border-2 border-lightGray dark:border-gray-700 hover:border-primary'
              }`}
              title="Card View"
            >
              <LayoutGrid size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Production Orders View */}
      {pageLoading ? (
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} /> Loading Amarka Warshadaha...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center text-mediumGray dark:text-gray-400 animate-fade-in">
          Ma jiraan amarka warshadaha la helay.
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
              <thead className="bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20">
                <tr>
                  <th scope="col" className="px-4 py-4 text-left text-sm font-bold text-darkGray dark:text-gray-100 uppercase tracking-wider">ALAABTA</th>
                  <th scope="col" className="px-4 py-4 text-left text-sm font-bold text-darkGray dark:text-gray-100 uppercase tracking-wider">TIRO</th>
                  <th scope="col" className="px-4 py-4 text-left text-sm font-bold text-darkGray dark:text-gray-100 uppercase tracking-wider">MACMIILKA</th>
                  <th scope="col" className="px-4 py-4 text-left text-sm font-bold text-darkGray dark:text-gray-100 uppercase tracking-wider">DARAJADA</th>
                  <th scope="col" className="px-4 py-4 text-center text-sm font-bold text-darkGray dark:text-gray-100 uppercase tracking-wider">XAALADDA</th>
                  <th scope="col" className="px-4 py-4 text-center text-sm font-bold text-darkGray dark:text-gray-100 uppercase tracking-wider">HORUMAR</th>
                  <th scope="col" className="px-4 py-4 text-right text-sm font-bold text-darkGray dark:text-gray-100 uppercase tracking-wider">TAARIIKHDA DHAMMAADKA</th>
                  <th scope="col" className="px-4 py-4 text-center text-sm font-bold text-darkGray dark:text-gray-100 uppercase tracking-wider">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                {filteredOrders.map(order => (
                  <ProductionOrderRow key={order.id} order={order} onEdit={handleEditOrder} onDelete={handleDeleteOrder} onView={handleViewOrder} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in-up border-l-4 border-primary relative group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
                    <Factory size={20} className="text-white"/>
                  </div>
                  <div>
                    <h4 className="font-bold text-darkGray dark:text-gray-100 text-lg">{order.productName}</h4>
                    <p className="text-sm text-mediumGray dark:text-gray-400">#{order.orderNumber}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  order.status === 'PLANNED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                  order.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                  order.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  {order.status === 'PLANNED' ? 'Qorshaysan' : 
                   order.status === 'IN_PROGRESS' ? 'Warshadaha' :
                   order.status === 'COMPLETED' ? 'Dhammaaday' : 'Joojiyay'}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-sm text-mediumGray dark:text-gray-400 flex items-center space-x-2">
                  <Package size={14} className="text-accent"/> 
                  <span>Tirada: {order.quantity} pcs</span>
                </p>
                <p className="text-sm text-mediumGray dark:text-gray-400 flex items-center space-x-2">
                  <Users size={14} className="text-green-500"/> 
                  <span>Macmiilka: {order.customer?.name || 'N/A'}</span>
                </p>
                <p className="text-sm text-mediumGray dark:text-gray-400 flex items-center space-x-2">
                  <Tag size={14} className="text-blue-500"/> 
                  <span>Darajada: {order.priority}</span>
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="w-full bg-lightGray dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300" style={{ width: '60%' }}></div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-mediumGray dark:text-gray-400">60% Dhammaaday</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
