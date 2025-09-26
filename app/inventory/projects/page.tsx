// app/dashboard/inventory/projects/page.tsx - Projects Using Inventory (10000% Design - API Integration & Enhanced)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '../../../components/layouts/Layout';
import { 
  ArrowLeft, Briefcase, Box, Tag, DollarSign, Calendar, List, LayoutGrid, 
  Search, Filter, Eye, Edit, Trash2, Download, Upload, Loader2, Info as InfoIcon,
  User as UserIcon, ClipboardList, RefreshCw, Plus, ChevronRight // Added ChevronRight for dropdown icon
} from 'lucide-react';
import Toast from '../../../components/common/Toast';

// --- Project Material Usage Data Interface ---
interface ProjectMaterialUsage {
  id: string;
  name: string; // Name of the material
  quantityUsed: number;
  unit: string;
  costPerUnit: number;
  leftoverQty: number;
  dateUsed: string;
  project: { // Nested project details
    id: string; // Added project.id to interface
    name: string;
    customer: { name: string; };
  };
}

// --- Project Material Usage Table Row Component ---
const ProjectMaterialUsageRow: React.FC<{ usage: ProjectMaterialUsage; onDelete: (id: string) => void }> = ({ usage, onDelete }) => (
  <tr className="hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-150 border-b border-lightGray dark:border-gray-700 last:border-b-0">
    <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-medium flex items-center space-x-2">
        <Box size={18} className="text-primary"/> <span>{usage.name}</span>
    </td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300 flex items-center space-x-2">
        <Briefcase size={16}/> 
        <Link href={`/projects/${usage.project.id}`} className="text-primary hover:underline">
            {usage.project.name}
        </Link>
    </td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{usage.quantityUsed} {usage.unit}</td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">${usage.costPerUnit.toLocaleString()}/{usage.unit}</td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">${(usage.quantityUsed * usage.costPerUnit).toLocaleString()}</td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{usage.leftoverQty} {usage.unit}</td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{new Date(usage.dateUsed).toLocaleDateString()}</td>
    <td className="p-4 whitespace-nowrap text-right">
      <div className="flex items-center justify-end space-x-2">
        <button className="p-2 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete Usage Record" onClick={() => onDelete(usage.id)}>
          <Trash2 size={18} />
        </button>
      </div>
    </td>
  </tr>
);

// --- Project Material Usage Card Component (for Mobile View) ---
const ProjectMaterialUsageCard: React.FC<{ usage: ProjectMaterialUsage; onDelete: (id: string) => void }> = ({ usage, onDelete }) => (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md animate-fade-in-up border-l-4 border-primary relative">
        <div className="flex justify-between items-start mb-3">
            <h4 className="font-semibold text-darkGray dark:text-gray-100 text-lg flex items-center space-x-2">
                <Box size={20} className="text-primary"/> <span>{usage.name}</span>
            </h4>
            <button className="p-1 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete" onClick={() => onDelete(usage.id)}>
                <Trash2 size={16} />
            </button>
        </div>
        <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
            <Briefcase size={14}/> 
            <span>Mashruuc: 
                <Link href={`/projects/${usage.project.id}`} className="text-primary hover:underline ml-1">
                    {usage.project.name} ({usage.project.customer.name})
                </Link>
            </span>
        </p>
        <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
            <ClipboardList size={14}/> <span>Quantity: {usage.quantityUsed} {usage.unit}</span>
        </p>
        <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
            <DollarSign size={14}/> <span>Cost/Unit: ${usage.costPerUnit.toLocaleString()}/{usage.unit}</span>
        </p>
        <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
            <DollarSign size={14}/> <span>Total Cost: ${(usage.quantityUsed * usage.costPerUnit).toLocaleString()}</span>
        </p>
        <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
            <Box size={14}/> <span>Hadhay: {usage.leftoverQty} {usage.unit}</span>
        </p>
        <p className="text-sm text-mediumGray dark:text-gray-400 flex items-center space-x-2">
            <Calendar size={14}/> <span>Taariikhda Isticmaalka: {new Date(usage.dateUsed).toLocaleDateString()}</span>
        </p>
    </div>
);


export default function InventoryProjectsPage() {
  const router = useRouter(); 
  const [projectMaterialUsages, setProjectMaterialUsages] = useState<ProjectMaterialUsage[]>([]);
  const [dataSource, setDataSource] = useState<'projectMaterial' | 'expenses'>('projectMaterial');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All'); // Material category
  const [filterDateRange, setFilterDateRange] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list'); // Default to list view for mobile
  const [pageLoading, setPageLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // --- API Functions ---
  const fetchProjectMaterialUsages = async (source: 'projectMaterial' | 'expenses' = dataSource) => {
    setPageLoading(true);
    try {
      let url = source === 'projectMaterial' ? '/api/inventory/projects' : '/api/inventory/projects/expenses';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch project material usages');
      const data = await response.json();
      setProjectMaterialUsages(data.projectMaterials);
    } catch (error: any) {
      console.error('Error fetching project material usages:', error);
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka alaabta mashaariicda la soo gelinayay.', type: 'error' });
      setProjectMaterialUsages([]);
    } finally {
      setPageLoading(false);
    }
  };

  const handleDeleteUsage = async (id: string) => {
    if (window.confirm('Ma hubtaa inaad tirtirto diiwaankan isticmaalka alaabta? Tan lama soo celin karo!')) {
      try {
        // This would require a DELETE /api/inventory/projects/[id]/materials/[usageId] route
        // For now, simulate deletion
        setProjectMaterialUsages(prev => prev.filter(usage => usage.id !== id));
        setToastMessage({ message: 'Diiwaanka isticmaalka alaabta si guul leh ayaa loo tirtiray!', type: 'success' });
        // In a real app, you'd call the API:
        // const response = await fetch(`/api/inventory/projects/${usage.project.id}/materials/${id}`, { method: 'DELETE' });
        // if (!response.ok) throw new Error('Failed to delete usage record');
        // fetchProjectMaterialUsages();
      } catch (error: any) {
        console.error('Error deleting usage record:', error);
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka diiwaanka la tirtirayay.', type: 'error' });
      }
    }
  };

  useEffect(() => {
    fetchProjectMaterialUsages(dataSource);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSource]);

  // Filter options
  const projects = ['All', ...Array.from(new Set(projectMaterialUsages.map(usage => usage.project.name)))];
  const categories = ['All', ...Array.from(new Set(projectMaterialUsages.map(usage => usage.name)))]; // Assuming material name is unique enough for category filter
  const dateRanges = ['All', 'Last 30 Days', 'This Quarter', 'This Year'];

  const filteredUsages = projectMaterialUsages.filter(usage => {
    const matchesSearch = usage.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          usage.project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          usage.project.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = filterProject === 'All' || usage.project.name === filterProject;
    const matchesCategory = filterCategory === 'All' || usage.name === filterCategory; // Filter by material name as category
    const matchesDate = filterDateRange === 'All' ? true : true; 

    return matchesSearch && matchesProject && matchesCategory && matchesDate;
  });

  // Statistics
  const totalUsageRecords = filteredUsages.length;
  const totalMaterialCost = filteredUsages.reduce((sum, usage) => sum + (usage.quantityUsed * usage.costPerUnit), 0);
  const totalLeftoverQty = filteredUsages.reduce((sum, usage) => sum + usage.leftoverQty, 0);


  return (
    <Layout>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="bg-lightGray dark:bg-gray-700 rounded-full p-2 mr-2">
            <ArrowLeft size={24} className="text-primary" />
          </button>
          <button onClick={() => router.back()} className="bg-lightGray dark:bg-gray-700 rounded-full p-2 mr-2" type="button" title="Back">
          </button>
          <button onClick={() => router.back()} className="bg-lightGray dark:bg-gray-700 rounded-full p-2 mr-2" title="Back">
          </button>
          <h1 className="text-2xl font-bold text-darkGray dark:text-gray-100">Projects Using Inventory</h1>
        </div>
        <div className="w-full flex flex-col items-center">
          <div className="grid grid-cols-2 gap-3 w-full max-w-[400px] px-2 sm:grid-cols-2 md:grid-cols-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow text-center flex flex-col items-center justify-center transition hover:shadow-lg">
              <h4 className="text-xs sm:text-sm font-semibold text-mediumGray dark:text-gray-400 mb-1">Wadarta Diiwaanada</h4>
              <p className="text-xl sm:text-2xl font-extrabold text-primary">{totalUsageRecords}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow text-center flex flex-col items-center justify-center transition hover:shadow-lg">
              <h4 className="text-xs sm:text-sm font-semibold text-mediumGray dark:text-gray-400 mb-1">Wadarta Qiimaha</h4>
              <p className="text-xl sm:text-2xl font-extrabold text-redError">${totalMaterialCost.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow text-center flex flex-col items-center justify-center transition hover:shadow-lg">
              <h4 className="text-xs sm:text-sm font-semibold text-mediumGray dark:text-gray-400 mb-1">Alaabta Hadhay</h4>
              <p className="text-xl sm:text-2xl font-extrabold text-accent">{totalLeftoverQty}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow text-center flex flex-col items-center justify-center transition hover:shadow-lg">
              <h4 className="text-xs sm:text-sm font-semibold text-mediumGray dark:text-gray-400 mb-1">Projects-ka</h4>
              <p className="text-xl sm:text-2xl font-extrabold text-secondary">{new Set(filteredUsages.map(u => u.project.id)).size}</p>
            </div>
          </div>
        </div>
  {/* Removed Diiwaan Geli Isticmaal and Cusboonaysii buttons as requested */}
      </div>

      {/* Search and Filter Bar */}
  <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow mb-6 flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-3 animate-fade-in-up">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by material name or project..."
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Filter by Project */}
        <div className="relative w-full md:w-48">
          <Briefcase size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
          <select
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            title="Dooro mashruuca"
          >
            {projects.map(proj => <option key={proj} value={proj}>{proj}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
            <ChevronRight className="transform rotate-90" size={20} />
          </div>
        </div>
        {/* Filter by Material Category (using material name as category for simplicity) */}
        <div className="relative w-full md:w-48">
          <Tag size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
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
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-lightGray dark:bg-gray-700 text-mediumGray dark:text-gray-400'} hover:bg-primary/80 dark:hover:bg-gray-600 transition-colors duration-200`} title="List View">
        <List size={20} />
      </button>
      <button onClick={() => setViewMode('cards')} className={`p-2 rounded-lg ${viewMode === 'cards' ? 'bg-primary text-white' : 'bg-lightGray dark:bg-gray-700 text-mediumGray dark:text-gray-400'} hover:bg-primary/80 dark:hover:bg-gray-600 transition-colors duration-200`} title="Cards View">
        <LayoutGrid size={20} />
      </button>
        </div>
      </div>

      {/* Project Material Usages View */}
      {pageLoading ? (
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} /> Loading Project Material Usages...
        </div>
      ) : filteredUsages.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center text-mediumGray dark:text-gray-400 animate-fade-in">
          Ma jiraan diiwaan isticmaalka alaabta ah oo la helay.
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-0 animate-fade-in">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700 text-xs md:text-sm">
              <thead className="bg-lightGray dark:bg-gray-700">
                <tr>
                  <th className="p-2 md:p-3 text-left font-semibold text-mediumGray dark:text-gray-400">Alaabta</th>
                  <th className="p-2 md:p-3 text-left font-semibold text-mediumGray dark:text-gray-400">Mashruuc</th>
                  <th className="p-2 md:p-3 text-left font-semibold text-mediumGray dark:text-gray-400">Qty</th>
                  <th className="p-2 md:p-3 text-left font-semibold text-mediumGray dark:text-gray-400">Qiimaha</th>
                  <th className="p-2 md:p-3 text-left font-semibold text-mediumGray dark:text-gray-400">Total</th>
                  <th className="p-2 md:p-3 text-left font-semibold text-mediumGray dark:text-gray-400">Hadhay</th>
                  <th className="p-2 md:p-3 text-left font-semibold text-mediumGray dark:text-gray-400">Taariikhda</th>
                  <th className="p-2 md:p-3 text-right font-semibold text-mediumGray dark:text-gray-400">Delete</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsages.map(usage => (
                  <tr key={usage.id} className="border-b border-lightGray dark:border-gray-700 last:border-b-0 hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-150 md:rounded-xl md:shadow-sm md:border md:border-lightGray md:mb-2 md:bg-white md:dark:bg-gray-800">
                    <td className="p-2 md:p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-medium flex items-center space-x-2">
                      <Box size={16} className="text-primary" /> <span>{usage.name}</span>
                    </td>
                    <td className="p-2 md:p-4 whitespace-nowrap text-mediumGray dark:text-gray-300 flex flex-col md:flex-row md:items-center md:space-x-2">
                      <Briefcase size={14} />
                      <Link href={`/projects/${usage.project.id}`} className="text-primary hover:underline">
                        {usage.project.name}
                      </Link>
                    </td>
                    <td className="p-2 md:p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{usage.quantityUsed} {usage.unit}</td>
                    <td className="p-2 md:p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">${usage.costPerUnit.toLocaleString()}/{usage.unit}</td>
                    <td className="p-2 md:p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">${(usage.quantityUsed * usage.costPerUnit).toLocaleString()}</td>
                    <td className="p-2 md:p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{usage.leftoverQty} {usage.unit}</td>
                    <td className="p-2 md:p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{new Date(usage.dateUsed).toLocaleDateString()}</td>
                    <td className="p-2 md:p-4 whitespace-nowrap text-right">
                      <button className="p-1 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete Usage Record" onClick={() => handleDeleteUsage(usage.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {filteredUsages.map(usage => (
                <ProjectMaterialUsageCard key={usage.id} usage={usage} onDelete={handleDeleteUsage} />
            ))}
        </div>
      )}

      {toastMessage && (
        <Toast message={toastMessage.message} type="error" onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
