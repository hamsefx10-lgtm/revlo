// app/inventory/page.tsx - Inventory Management Overview (10000% Design - API Integration & Enhanced)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '../../components/layouts/Layout';
import { 
  ArrowLeft, Warehouse, Box, Tag, DollarSign, AlertTriangle, CheckCircle, XCircle,
  Plus, Search, Filter, Calendar, List, LayoutGrid, Eye, Edit, Trash2, Download, Upload,
  BarChart, PieChart, LineChart as LineChartIcon, Info as InfoIcon, ClipboardList, RefreshCw,
  TrendingUp, TrendingDown, Coins, Briefcase, ArrowRight, Loader2, Factory // Added Factory icon for manufacturing
} from 'lucide-react';
import Toast from '../../components/common/Toast';

// --- Inventory Item Data Interface ---
interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  inStock: number;
  minStock: number; 
  purchasePrice: number;
  sellingPrice: number;
  usedInProjects: number;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

// --- Project Material Usage Data Interface (for Total Project Materials Value) ---
interface ProjectMaterialUsage {
    id: string;
    name: string;
    quantityUsed: number;
    unit: string;
    costPerUnit: number;
    leftoverQty: number;
    dateUsed: string;
    project: { name: string; customer: { name: string; }; };
}


// --- Overview Card Component ---
interface OverviewCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    bgColorClass: string;
    textColorClass: string;
    link?: string;
    trend?: 'up' | 'down';
    trendValue?: string;
}

const OverviewCard: React.FC<OverviewCardProps> = ({ title, value, icon, bgColorClass, textColorClass, link, trend, trendValue }) => (
    <Link 
        href={link || '#'} 
        className={`bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between transform hover:-translate-y-1 ${link ? '' : 'cursor-default'}`}
    >
        <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm lg:text-lg font-semibold text-mediumGray dark:text-gray-400">{title}</h3>
            <div className={`p-2 rounded-full ${bgColorClass} ${textColorClass}`}>{icon}</div>
        </div>
        <p className={`text-2xl lg:text-4xl font-extrabold ${textColorClass}`}>{value}</p>
        {trend && trendValue && (
            <div className={`flex items-center text-xs lg:text-sm font-medium mt-2 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {trend === 'up' ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
                {trendValue}
            </div>
        )}
    </Link>
);


export default function InventoryManagementPage() {
  const router = useRouter(); 
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [projectMaterialUsages, setProjectMaterialUsages] = useState<ProjectMaterialUsage[]>([]); // For project materials value
  const [pageLoading, setPageLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // --- API Functions ---
  const fetchInventoryData = async () => {
    setPageLoading(true);
    try {
      const inventoryResponse = await fetch('/api/inventory/store');
      if (!inventoryResponse.ok) throw new Error('Failed to fetch inventory items');
      const inventoryData = await inventoryResponse.json();
      setInventoryItems(inventoryData.items); 
      
      // If API returned an event, notify other pages about inventory data update
      if (inventoryData.event) {
        const updateEvent = inventoryData.event;
        
        // Store in localStorage for cross-tab communication
        localStorage.setItem('inventory_updated', JSON.stringify(updateEvent));

        // Trigger storage events for same-tab listeners
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'inventory_updated',
          newValue: JSON.stringify(updateEvent)
        }));

        // Trigger custom events for same-tab listeners
        window.dispatchEvent(new CustomEvent('inventory_updated', { detail: updateEvent }));
      }

      const projectMaterialsResponse = await fetch('/api/inventory/projects');
      if (!projectMaterialsResponse.ok) throw new Error('Failed to fetch project material usages');
      const projectMaterialsData = await projectMaterialsResponse.json();
      setProjectMaterialUsages(projectMaterialsData.projectMaterials);
      
      // If API returned an event, notify other pages about project materials data update
      if (projectMaterialsData.event) {
        const updateEvent = projectMaterialsData.event;
        
        // Store in localStorage for cross-tab communication
        localStorage.setItem('inventory_updated', JSON.stringify(updateEvent));

        // Trigger storage events for same-tab listeners
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'inventory_updated',
          newValue: JSON.stringify(updateEvent)
        }));

        // Trigger custom events for same-tab listeners
        window.dispatchEvent(new CustomEvent('inventory_updated', { detail: updateEvent }));
      }

    } catch (error: any) {
      console.error('Error fetching inventory data:', error);
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka xogta bakhaarka la soo gelinayay.', type: 'error' });
      setInventoryItems([]);
      setProjectMaterialUsages([]);
    } finally {
      setPageLoading(false);
    }
  };

  const handleRestockItem = (id: string) => {
    router.push(`/inventory/store/restock/${id}`); 
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  // Auto-refresh data every 30 seconds for live updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchInventoryData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Listen for storage events (when inventory is added/deleted from other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'inventory_updated' || e.key === 'inventory_created' || e.key === 'inventory_deleted' || e.key === 'inventory_restocked') {
        console.log('Inventory main page: Storage event detected, refreshing data...', e.key);
        fetchInventoryData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen for custom events (when inventory is added/deleted from same tab)
  useEffect(() => {
    const handleInventoryUpdate = (event: any) => {
      console.log('Inventory main page: Custom event detected, refreshing data...', event.type, event.detail);
      fetchInventoryData();
    };

    window.addEventListener('inventory_updated', handleInventoryUpdate);
    window.addEventListener('inventory_created', handleInventoryUpdate);
    window.addEventListener('inventory_deleted', handleInventoryUpdate);
    window.addEventListener('inventory_restocked', handleInventoryUpdate);
    
    return () => {
      window.removeEventListener('inventory_updated', handleInventoryUpdate);
      window.removeEventListener('inventory_created', handleInventoryUpdate);
      window.removeEventListener('inventory_deleted', handleInventoryUpdate);
      window.removeEventListener('inventory_restocked', handleInventoryUpdate);
    };
  }, []);


  // --- Company Material Expenses Total ---
  const [companyMaterialExpensesTotal, setCompanyMaterialExpensesTotal] = useState(0);
  useEffect(() => {
    async function fetchCompanyMaterialExpensesTotal() {
      try {
        const response = await fetch('/api/expenses?category=Material&projectId=null');
        if (!response.ok) throw new Error('Failed to fetch company material expenses');
        const data = await response.json();
        let total = 0;
        for (const exp of data.expenses) {
          if (Array.isArray(exp.materials)) {
            exp.materials.forEach((mat: any) => {
              total += (mat.qty * mat.price);
            });
          }
        }
        setCompanyMaterialExpensesTotal(total);
      } catch {
        setCompanyMaterialExpensesTotal(0);
      }
    }
    fetchCompanyMaterialExpensesTotal();
  }, []);

  // --- Statistics ---
  const safeInventoryItems = Array.isArray(inventoryItems) ? inventoryItems : [];
  const totalItemsInStock = safeInventoryItems.reduce((sum, item) => sum + item.inStock, 0);
  const uniqueItemsCount = safeInventoryItems.length;
  const lowStockAlerts = safeInventoryItems.filter(item => item.inStock <= item.minStock).length;
  const companyStoreValueCost = safeInventoryItems.reduce((sum, item) => sum + (item.inStock * item.purchasePrice), 0);
  const companyStoreValueSelling = safeInventoryItems.reduce((sum, item) => sum + (item.inStock * item.sellingPrice), 0);
  const totalProjectMaterialsValue = projectMaterialUsages.reduce((sum, usage) => sum + (usage.quantityUsed * usage.costPerUnit), 0);
  const potentialProfitFromSelling = companyStoreValueSelling - companyStoreValueCost;

  return (
    <Layout>
      {/* Full Page Header - Mobile Optimized */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
        <h1 className="text-2xl lg:text-4xl font-bold text-darkGray dark:text-gray-100">Inventory Management</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/inventory/store/add" className="bg-primary text-white py-2 lg:py-2.5 px-4 lg:px-6 rounded-lg font-bold text-sm lg:text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center justify-center">
            <Plus size={18} className="mr-2" /> Ku Dar Alaab Cusub
          </Link>
          <button onClick={fetchInventoryData} className="bg-secondary text-white py-2 lg:py-2.5 px-4 lg:px-6 rounded-lg font-bold text-sm lg:text-lg hover:bg-green-600 transition duration-200 shadow-md flex items-center justify-center">
            <RefreshCw size={18} className="mr-2" /> Cusboonaysii
          </button>
        </div>
      </div>

      {/* Full Page Overview Statistics Cards - Mobile Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8 animate-fade-in-up">
        <OverviewCard
          title="Wadarta Qiimaha Bakhaarka"
          value={`$${companyStoreValueCost.toLocaleString()}`}
          icon={<DollarSign size={24}/>} 
          bgColorClass="bg-accent/10"
          textColorClass="text-accent"
          link="/inventory/store"
        />
        <OverviewCard
          title="Wadarta Qiimaha Alaabta Mashruuca"
          value={`$${totalProjectMaterialsValue.toLocaleString()}`}
          icon={<Briefcase size={24}/>} 
          bgColorClass="bg-secondary/10"
          textColorClass="text-secondary"
          link="/inventory/projects"
        />
        <OverviewCard
          title="Wadarta Qiimaha Alaabta Shirkadda"
          value={`$${companyMaterialExpensesTotal.toLocaleString()}`}
          icon={<Tag size={24}/>} 
          bgColorClass="bg-primary/10"
          textColorClass="text-primary"
          link="/inventory/expenses"
        />
      </div>

      {/* Full Page Quick Access Cards - Mobile Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8 animate-fade-in-up">
        <Link href="/inventory/store" className="bg-white dark:bg-gray-800 p-4 lg:p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center space-x-4 lg:space-x-6 group">
          <div className="bg-primary/10 text-primary p-3 lg:p-4 rounded-full group-hover:bg-primary group-hover:text-white transition-colors duration-200">
            <Warehouse size={32} />
          </div>
          <div>
            <h3 className="text-lg lg:text-2xl font-bold text-darkGray dark:text-gray-100 mb-2">Maamul Bakhaarka Shirkadda</h3>
            <p className="text-sm lg:text-base text-mediumGray dark:text-gray-400">Maamul dhammaan alaabta ku jirta bakhaarkaaga guud.</p>
          </div>
          <ArrowRight size={20} className="text-mediumGray dark:text-gray-400 group-hover:translate-x-2 transition-transform duration-200 ml-auto" />
        </Link>

        <Link href="/inventory/projects" className="bg-white dark:bg-gray-800 p-4 lg:p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center space-x-4 lg:space-x-6 group">
          <div className="bg-secondary/10 text-secondary p-3 lg:p-4 rounded-full group-hover:bg-secondary group-hover:text-white transition-colors duration-200">
            <ClipboardList size={32} />
          </div>
          <div>
            <h3 className="text-lg lg:text-2xl font-bold text-darkGray dark:text-gray-100 mb-2">Isticmaalka Alaabta Mashruuca</h3>
            <p className="text-sm lg:text-base text-mediumGray dark:text-gray-400">La socod alaabta loo isticmaalay mashruuc kasta iyo hadhaaga.</p>
          </div>
          <ArrowRight size={20} className="text-mediumGray dark:text-gray-400 group-hover:translate-x-2 transition-transform duration-200 ml-auto" />
        </Link>

        <Link href="/inventory/expenses" className="bg-white dark:bg-gray-800 p-4 lg:p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center space-x-4 lg:space-x-6 group">
          <div className="bg-accent/10 text-accent p-3 lg:p-4 rounded-full group-hover:bg-accent group-hover:text-white transition-colors duration-200">
            <Tag size={32} />
          </div>
          <div>
            <h3 className="text-lg lg:text-2xl font-bold text-darkGray dark:text-gray-100 mb-2">Isticmaalka Alaabta Shirkadda</h3>
            <p className="text-sm lg:text-base text-mediumGray dark:text-gray-400">La socod kharashyada alaabta shirkadda ee aan mashruuc la lahayn.</p>
          </div>
          <ArrowRight size={20} className="text-mediumGray dark:text-gray-400 group-hover:translate-x-2 transition-transform duration-200 ml-auto" />
        </Link>
      </div>

      {/* Full Page Manufacturing Usage Section - Mobile Optimized */}
      <div className="grid grid-cols-1 gap-4 lg:gap-6 mb-6 lg:mb-8 animate-fade-in-up">
        <Link href="/inventory/manufacturing" className="bg-white dark:bg-gray-800 p-4 lg:p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex items-center space-x-4 lg:space-x-6 group">
          <div className="bg-orange-500/10 text-orange-500 p-3 lg:p-4 rounded-full group-hover:bg-orange-500 group-hover:text-white transition-colors duration-200">
            <Factory size={32} />
          </div>
          <div>
            <h3 className="text-lg lg:text-2xl font-bold text-darkGray dark:text-gray-100 mb-2">Isticmaalka Alaabta Warshadaha</h3>
            <p className="text-sm lg:text-base text-mediumGray dark:text-gray-400">La socod alaabta loo isticmaalay warshadaha iyo mashruucyada.</p>
          </div>
          <ArrowRight size={20} className="text-mediumGray dark:text-gray-400 group-hover:translate-x-2 transition-transform duration-200 ml-auto" />
        </Link>
      </div>

      {toastMessage && (
        <Toast message={toastMessage.message} type="error" onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
