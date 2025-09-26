// app/reports/inventory/page.tsx - Inventory Report Page (10000% Design - API Integration & Enhanced)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Import useRouter
import Layout from '../../../components/layouts/Layout';
import { 
  ArrowLeft, Warehouse, Plus, Search, Filter, Calendar, List, LayoutGrid, 
  DollarSign, Tag, Box, CheckCircle, XCircle, ChevronRight, 
  TrendingUp, TrendingDown, Eye, Edit, Trash2, Download, Upload, BarChart, PieChart, LineChart as LineChartIcon,
  Info as InfoIcon, // For status and general info
  AlertTriangle, // For low stock alert
  ClipboardList, // For used in projects
  Loader2 // For loading spinner
} from 'lucide-react';
import Toast from '../../../components/common/Toast'; // Reuse Toast component
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

// --- Inventory Item Data Interface (Refined for API response) ---
interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  inStock: number;
  minStock: number; // Added minStock for low stock calculation
  purchasePrice: number;
  sellingPrice: number;
  usedInProjects: number;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

// Helper for chart colors
const CHART_COLORS = ['#3498DB', '#2ECC71', '#F39C12', '#E74C3C', '#9B59B6', '#1ABC9C', '#34495E', '#A0A0A0'];

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-sm font-semibold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// --- Inventory Item Table Row Component ---
const InventoryItemRow: React.FC<{ item: InventoryItem; onEdit: (id: string) => void; onDelete: (id: string) => void; onRestock: (id: string) => void }> = ({ item, onEdit, onDelete, onRestock }) => {
  const isLowStock = item.inStock <= item.minStock;
  const lowStockClass = isLowStock ? 'bg-redError/10 text-redError border-redError' : '';
  const iconColor = isLowStock ? 'text-redError' : 'text-primary';

  return (
    <tr className={`hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-150 border-b border-lightGray dark:border-gray-700 last:border-b-0 ${lowStockClass}`}>
      <td className="p-4 text-darkGray dark:text-gray-100 font-medium flex items-center space-x-2 w-[15%]">
          <Box size={18} className="text-primary"/> <span>{item.name}</span>
      </td>
      <td className="p-4 text-mediumGray dark:text-gray-300 flex items-center space-x-2 w-[10%]">
          <Tag size={16} className={iconColor}/> <span>{item.category}</span>
      </td>
      <td className="p-4 text-mediumGray dark:text-gray-300 w-[8%] text-center">{item.unit}</td>
      <td className={`p-4 font-semibold text-darkGray dark:text-gray-100 text-right w-[10%]`}>
          {item.inStock} {isLowStock && <AlertTriangle size={16} className="inline ml-1 text-redError"/>}
      </td>
      <td className="p-4 text-mediumGray dark:text-gray-300 text-right w-[10%]">${item.purchasePrice.toLocaleString()}</td>
      <td className="p-4 text-mediumGray dark:text-gray-300 text-right w-[10%]">${item.sellingPrice.toLocaleString()}</td>
      <td className="p-4 text-mediumGray dark:text-gray-300 text-right w-[10%]">{item.usedInProjects} {item.unit}</td>
      <td className="p-4 text-mediumGray dark:text-gray-300 w-[10%] text-right">{new Date(item.lastUpdated).toLocaleDateString()}</td>
      <td className="p-4 text-right w-[15%]">
        <div className="flex items-center justify-end space-x-2">
          <button onClick={() => onRestock(item.id)} className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200" title="Restock">
            <Plus size={18} />
          </button>
          <button onClick={() => onEdit(item.id)} className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Edit Item">
            <Edit size={18} />
          </button>
          <button onClick={() => onDelete(item.id)} className="p-2 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete Item">
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};

// --- Inventory Item Card Component (for Mobile View) ---
const InventoryItemCard: React.FC<{ item: InventoryItem; onEdit: (id: string) => void; onDelete: (id: string) => void; onRestock: (id: string) => void }> = ({ item, onEdit, onDelete, onRestock }) => {
    const isLowStock = item.inStock <= item.minStock;
    let borderColor = 'border-lightGray dark:border-gray-700';
    if (isLowStock) borderColor = 'border-redError';

    return (
        <div className={`bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md animate-fade-in-up border-l-4 ${borderColor} relative`}>
            <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-darkGray dark:text-gray-100 text-lg flex items-center space-x-2">
                    <Box size={20} className="text-primary"/> <span>{item.name}</span>
                </h4>
                <div className="flex space-x-2 flex-shrink-0">
                    <button onClick={() => onRestock(item.id)} className="p-1 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200" title="Restock">
                        <Plus size={16} />
                    </button>
                    <button onClick={() => onEdit(item.id)} className="p-1 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Edit">
                        <Edit size={16} />
                    </button>
                    <button onClick={() => onDelete(item.id)} className="p-1 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
            <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
                <Tag size={14}/> <span>Nooca: {item.category}</span>
            </p>
            <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
                <Warehouse size={14}/> <span>In Stock: {item.inStock} {item.unit} {isLowStock && <AlertTriangle size={14} className="inline ml-1 text-redError"/>}</span>
            </p>
            <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
                <DollarSign size={14}/> <span>Qiimaha Gadashada: ${item.purchasePrice.toLocaleString()}</span>
            </p>
            <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
                <DollarSign size={14}/> <span>Qiimaha Iibka: ${item.sellingPrice.toLocaleString()}</span>
            </p>
            <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
                <ClipboardList size={14}/> <span>Loo Isticmaalay Projects: {item.usedInProjects} {item.unit}</span>
            </p>
            <p className="text-sm text-mediumGray dark:text-gray-400 flex items-center space-x-2">
                <Calendar size={14}/> <span>Last Updated: {new Date(item.lastUpdated).toLocaleDateString()}</span>
            </p>
        </div>
    );
};


export default function InventoryReportPage() {
  const router = useRouter(); // Initialize useRouter
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStockStatus, setFilterStockStatus] = useState('All'); 
  const [filterDateRange, setFilterDateRange] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'charts' | 'cards'>('list'); 
  const [pageLoading, setPageLoading] = useState(true); 
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);


  // --- API Functions ---
  const fetchInventoryItems = async () => {
    setPageLoading(true);
    try {
      const response = await fetch('/api/reports/inventory');
      if (!response.ok) throw new Error('Failed to fetch inventory items');
      const data = await response.json();
      setInventoryItems(Array.isArray(data.inventory) ? data.inventory : []);
    } catch (error: any) {
      console.error('Error fetching inventory items:', error);
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka alaabta la soo gelinayay.', type: 'error' });
      setInventoryItems([]);
    } finally {
      setPageLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Ma hubtaa inaad tirtirto alaabtan? Tan lama soo celin karo!')) {
      try {
        const response = await fetch(`/api/inventory/store/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete item');
        
        setToastMessage({ message: data.message || 'Alaabta si guul leh ayaa loo tirtiray!', type: 'success' });
        fetchInventoryItems(); // Re-fetch items after deleting
      } catch (error: any) {
        console.error('Error deleting item:', error);
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka alaabta la tirtirayay.', type: 'error' });
      }
    }
  };

  const handleEditItem = (id: string) => {
    router.push(`/inventory/store/edit/${id}`); // Navigate to edit page
  };

  const handleRestockItem = (id: string) => {
    router.push(`/inventory/store/restock/${id}`); // Navigate to restock page
  };


  useEffect(() => {
    fetchInventoryItems(); // Fetch items on component mount
  }, []); 


  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.unit.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    const matchesStockStatus = filterStockStatus === 'All' || 
                               (filterStockStatus === 'Low Stock' && item.inStock <= item.minStock) ||
                               (filterStockStatus === 'In Stock' && item.inStock > item.minStock);
    const matchesDate = filterDateRange === 'All' ? true : true; 

    return matchesSearch && matchesCategory && matchesStockStatus && matchesDate;
  });

  // Filter options
  const categories = ['All', ...Array.from(new Set(inventoryItems.map(item => item.category)))];
  const stockStatuses = ['All', 'Low Stock', 'In Stock'];
  const dateRanges = ['All', 'Last 30 Days', 'This Month', 'This Quarter', 'This Year'];

  // Statistics
  const totalItemsCount = filteredItems.length;
  const totalInStockQty = filteredItems.reduce((sum, item) => sum + item.inStock, 0);
  const totalUsedQty = filteredItems.reduce((sum, item) => sum + item.usedInProjects, 0);
  const totalValueAtCost = filteredItems.reduce((sum, item) => sum + (item.inStock * item.purchasePrice), 0);
  const totalPotentialSellingValue = filteredItems.reduce((sum, item) => sum + (item.inStock * item.sellingPrice), 0);
  const lowStockItemsCount = filteredItems.filter(item => item.inStock <= item.minStock).length;

  // Chart Data
  const categoryDistributionData = categories.filter(cat => cat !== 'All').map(cat => ({
    name: cat,
    value: filteredItems.filter(item => item.category === cat).reduce((sum, item) => sum + item.inStock, 0),
  })).filter(item => item.value > 0);

  const topUsedMaterialsData = filteredItems.sort((a, b) => b.usedInProjects - a.usedInProjects).slice(0, 5).map(item => ({
    name: item.name,
    value: item.usedInProjects,
  }));

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/reports" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Inventory Report
        </h1>
        <div className="flex space-x-3">
          <button className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center" title="Download PDF">
            <Download size={20} className="mr-2" /> Soo Deji PDF
          </button>
          <button className="bg-secondary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-green-600 transition duration-200 shadow-md flex items-center" title="Export CSV">
            <Upload size={20} className="mr-2" /> Dhoofi CSV
          </button>
        </div>
      </div>

      {/* Inventory Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Wadarta Alaabta</h4>
          <p className="text-3xl font-extrabold text-primary">{totalItemsCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Wadarta Quantity Stock-ga</h4>
          <p className="text-3xl font-extrabold text-secondary">{totalInStockQty}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Alaab Yar</h4>
          <p className="text-3xl font-extrabold text-redError">{lowStockItemsCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Wadarta Qiimaha (Cost)</h4>
          <p className="text-3xl font-extrabold text-accent">${totalValueAtCost.toLocaleString()}</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-8 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 animate-fade-in-up">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search items by name or category..."
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Filter by Category */}
        <div className="relative w-full md:w-48">
          <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
          <select
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            title="Dooro category-ga alaabta"
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
            <ChevronRight className="transform rotate-90" size={20} />
          </div>
        </div>
        {/* Filter by Stock Status */}
        <div className="relative w-full md:w-48">
          <Warehouse size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
          <select
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none"
            value={filterStockStatus}
            onChange={(e) => setFilterStockStatus(e.target.value)}
            title="Dooro status-ka stock-ga"
          >
            {stockStatuses.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
            <ChevronRight className="transform rotate-90" size={20} />
          </div>
        </div>
        {/* Filter by Date Range */}
        <div className="relative w-full md:w-48">
          <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
          <select
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none"
            value={filterDateRange}
            onChange={(e) => setFilterDateRange(e.target.value)}
            title="Dooro xilliga taariikhda"
          >
            {dateRanges.map(range => <option key={range} value={range}>{range}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
            <ChevronRight className="transform rotate-90" size={20} />
          </div>
        </div>
        {/* View Mode Toggle */}
        <div className="flex space-x-2 w-full md:w-auto justify-center">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-lightGray dark:bg-gray-700 text-mediumGray dark:text-gray-400'} hover:bg-primary/80 dark:hover:bg-gray-600 transition-colors duration-200`}>
                <List size={20} />
                title="List View"
            </button>
            <button onClick={() => setViewMode('charts')} className={`p-2 rounded-lg ${viewMode === 'charts' ? 'bg-primary text-white' : 'bg-lightGray dark:bg-gray-700 text-mediumGray dark:text-gray-400'} hover:bg-primary/80 dark:hover:bg-gray-600 transition-colors duration-200`}>
                <BarChart size={20} />
            </button>
            <button onClick={() => setViewMode('cards')} className={`p-2 rounded-lg ${viewMode === 'cards' ? 'bg-primary text-white' : 'bg-lightGray dark:bg-gray-700 text-mediumGray dark:text-gray-400'} hover:bg-primary/80 dark:hover:bg-gray-600 transition-colors duration-200`}>
                <LayoutGrid size={20} />
            </button>
        </div>
      </div>

      {/* Inventory View */}
      {pageLoading ? (
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} /> Loading Inventory...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center text-mediumGray dark:text-gray-400 animate-fade-in">
          Ma jiraan alaab la helay.
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
              <thead className="bg-lightGray dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Magaca Alaabta</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Nooca</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Unit</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">In Stock</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Qiimaha Gadashada</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Qiimaha Iibka</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Loo Isticmaalay Projects</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Last Updated</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                {filteredItems.map(item => (
                  <InventoryItemRow key={item.id} item={item} onEdit={handleEditItem} onDelete={handleDeleteItem} onRestock={handleRestockItem} />
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination Placeholder */}
          <div className="p-4 flex justify-between items-center border-t border-lightGray dark:border-gray-700">
              <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Hore</button>
              <span className="text-sm text-darkGray dark:text-gray-100">Page 1 of {Math.ceil(filteredItems.length / 10) || 1}</span>
              <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Next</button>
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {filteredItems.map(item => (
                <InventoryItemCard key={item.id} item={item} onEdit={handleEditItem} onDelete={handleDeleteItem} onRestock={handleRestockItem} />
            ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            {/* Inventory Value by Category (Pie Chart) */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md animate-fade-in-up">
                <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-4">Wadarta Qiimaha Stock-ga (Nooc Ahaan)</h3>
                <div className="w-full h-[300px]">
                  <ResponsiveContainer>
                    <RechartsPieChart>
                      <Pie
                        data={categoryDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={120}
                        dataKey="value"
                      >
                        {categoryDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px' }}
                        labelStyle={{ color: '#2C3E50', fontWeight: 'bold' }}
                        itemStyle={{ color: '#2C3E50' }}
                      />
                      <Legend align="right" verticalAlign="middle" layout="vertical" wrapperStyle={{ paddingLeft: '20px' }} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
            </div>
            {/* Top 5 Most Used Materials (Bar Chart) */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md animate-fade-in-up">
                <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-4">5-ta Alaab ee Ugu Badan ee La Isticmaalay</h3>
                <div className="w-full h-[300px]">
                  <ResponsiveContainer>
                    <RechartsBarChart data={topUsedMaterialsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-700" vertical={false} />
                      <XAxis dataKey="name" stroke="#7F8C8D" className="dark:text-gray-400 text-sm" />
                      <YAxis stroke="#7F8C8D" className="dark:text-gray-400 text-sm" />
                      <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px' }} labelStyle={{ color: '#2C3E50', fontWeight: 'bold' }} itemStyle={{ color: '#2C3E50' }} />
                      <Legend />
                      <Bar dataKey="value" fill={CHART_COLORS[0]} name="Quantity Used" radius={[5, 5, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
            </div>
        </div>
      )}
    </Layout>
  );
}
