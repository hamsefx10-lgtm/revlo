// app/settings/assets/page.tsx - Fixed Assets Settings Page (10000% Design)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import { 
  ArrowLeft, HardDrive, Plus, Search, Filter, Edit, Trash2, X, Loader2, Info, 
  Tag, Briefcase, Calendar, DollarSign, CheckCircle, XCircle, ChevronRight, Building, Home 
} from 'lucide-react';
import Toast from '../../../components/common/Toast'; // Reuse Toast component

// --- Types ---
interface FixedAsset {
  id: string;
  name: string;
  type: string;
  value: number;
  purchaseDate: string;
  assignedTo: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// --- Fixed Asset Table Row Component ---
const FixedAssetRow: React.FC<{ asset: FixedAsset; onEdit: (id: string) => void; onDelete: (id: string) => void }> = ({ asset, onEdit, onDelete }) => (
  <tr className="hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-150 border-b border-lightGray dark:border-gray-700 last:border-b-0">
    <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-medium flex items-center space-x-2">
        <HardDrive size={18} className="text-primary"/> <span>{asset.name}</span>
    </td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300 flex items-center space-x-2">
        <Tag size={16} className="text-secondary"/> <span>{asset.type}</span>
    </td>
    <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-semibold">${asset.value.toLocaleString()}</td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{new Date(asset.purchaseDate).toLocaleDateString()}</td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300 flex items-center space-x-2">
        {asset.assignedTo === 'Factory' ? <Building size={16}/> : asset.assignedTo === 'Office' ? <Home size={16}/> : <Briefcase size={16}/>}
        <span>{asset.assignedTo}</span>
    </td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{new Date(asset.updatedAt).toLocaleDateString()}</td>
    <td className="p-4 whitespace-nowrap text-right">
      <div className="flex items-center justify-end space-x-2">
        <button onClick={() => onEdit(asset.id)} className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Edit Asset">
          <Edit size={18} />
        </button>
        <button onClick={() => onDelete(asset.id)} className="p-2 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete Asset">
          <Trash2 size={18} />
        </button>
      </div>
    </td>
  </tr>
);

// --- Modal Component (Reusable) ---
interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}
const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-lg animate-fade-in-up">
      <div className="flex justify-between items-center mb-4 border-b pb-3 border-lightGray dark:border-gray-700">
        <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100">{title}</h3>
        <button 
          onClick={onClose} 
          title="Close modal"
          className="text-mediumGray dark:text-gray-400 hover:text-redError transition-colors"
        >
          <X size={24} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

// --- Add/Edit Asset Form (Inside Modal) ---
interface AssetFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  editingAsset?: FixedAsset | null; // Optional for editing
}
const AssetForm: React.FC<AssetFormProps> = ({ onSubmit, onCancel, editingAsset }) => {
  const [name, setName] = useState(editingAsset?.name || '');
  const [type, setType] = useState(editingAsset?.type || '');
  const [value, setValue] = useState<number | ''>(editingAsset?.value || '');
  const [purchaseDate, setPurchaseDate] = useState(editingAsset?.purchaseDate || new Date().toISOString().split('T')[0]);
  const [assignedTo, setAssignedTo] = useState(editingAsset?.assignedTo || 'Office');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Magaca Hantida waa waajib.';
    if (!type) newErrors.type = 'Nooca Hantida waa waajib.';
    if (typeof value !== 'number' || value <= 0) newErrors.value = 'Qiimaha waa inuu noqdaa nambar wanaagsan.';
    if (!purchaseDate) newErrors.purchaseDate = 'Taariikhda Gadashada waa waajib.';
    if (!assignedTo) newErrors.assignedTo = 'Meelaynta waa waajib.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    
    try {
      const url = editingAsset 
        ? `/api/settings/assets/${editingAsset.id}`
        : '/api/settings/assets';
      
      const method = editingAsset ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, value, purchaseDate, assignedTo }),
      });
      
      if (!response.ok) throw new Error('Failed to save asset');
      
      const data = await response.json();
      onSubmit(data.asset);
    } catch (error) {
      console.error('Error saving asset:', error);
      // Handle error - could show toast here
    } finally {
      setLoading(false);
    }
  };

  const assetTypes = ['Machinery', 'Furniture', 'Vehicle', 'Tool', 'Electronics', 'Other'];
  const assignedOptions = ['Office', 'Factory', 'Transport', 'Furniture Project A', 'Office Setup B', 'Other']; // Example projects/locations

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div>
        <label htmlFor="assetName" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Magaca Hantida <span className="text-redError">*</span></label>
        <input type="text" id="assetName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tusaale: CNC Machine" className={`w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary ${errors.name ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}/>
        {errors.name && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.name}</p>}
      </div>
      <div>
        <label htmlFor="assetType" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Nooca Hantida <span className="text-redError">*</span></label>
        <select id="assetType" value={type} onChange={(e) => setType(e.target.value)} className={`w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary appearance-none ${errors.type ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}>
          <option value="">-- Dooro Nooca --</option>
          {assetTypes.map(typeOpt => <option key={typeOpt} value={typeOpt}>{typeOpt}</option>)}
        </select>
        {errors.type && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.type}</p>}
      </div>
      <div>
        <label htmlFor="assetValue" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Qiimaha ($) <span className="text-redError">*</span></label>
        <input type="number" id="assetValue" value={value} onChange={(e) => setValue(parseFloat(e.target.value) || '')} placeholder="Tusaale: 25000.00" className={`w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary ${errors.value ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}/>
        {errors.value && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.value}</p>}
      </div>
      <div>
        <label htmlFor="purchaseDate" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Taariikhda Gadashada <span className="text-redError">*</span></label>
        <input type="date" id="purchaseDate" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className={`w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary ${errors.purchaseDate ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}/>
        {errors.purchaseDate && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.purchaseDate}</p>}
      </div>
      <div>
        <label htmlFor="assignedTo" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Meelaynta <span className="text-redError">*</span></label>
        <select id="assignedTo" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className={`w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary appearance-none ${errors.assignedTo ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}>
          <option value="">-- Dooro Meelayn --</option>
          {assignedOptions.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
        {errors.assignedTo && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.assignedTo}</p>}
      </div>
      <div className="flex justify-end space-x-3 mt-6">
        <button type="button" onClick={onCancel} className="bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 py-2 px-4 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition">Jooji</button>
        <button type="submit" className="bg-primary text-white py-2 px-4 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center" disabled={loading}>
          {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : <Plus size={20} className="mr-2"/>} {editingAsset ? 'Cusboonaysii Hantida' : 'Ku Dar Hantida'}
        </button>
      </div>
    </form>
  );
};


// Main Fixed Assets Page Component
export default function FixedAssetsSettingsPage() {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterAssignedTo, setFilterAssignedTo] = useState('All');
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch assets on component mount
  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/settings/assets');
      if (!response.ok) throw new Error('Failed to fetch assets');
      const data = await response.json();
      setAssets(data.assets || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
      setToastMessage({ message: 'Qalad ayaa dhacay markii la soo saarayay hantida', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Statistics
  const totalAssetsCount = assets.length;
  const totalAssetsValue = assets.reduce((sum, asset) => sum + asset.value, 0);
  const assignedAssetsCount = assets.filter(asset => asset.status === 'Assigned').length;

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          asset.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          asset.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || asset.type === filterType;
    const matchesAssignedTo = filterAssignedTo === 'All' || asset.assignedTo === filterAssignedTo;
    return matchesSearch && matchesType && matchesAssignedTo;
  });

  const assetTypes = ['All', 'Machinery', 'Furniture', 'Vehicle', 'Tool', 'Electronics', 'Other'];
  const assignedOptions = ['All', 'Office', 'Factory', 'Transport', 'Furniture Project A', 'Office Setup B'];

  const handleAddAsset = (newAssetData: FixedAsset) => {
    setAssets(prev => [...prev, newAssetData]);
    setToastMessage({ message: 'Hantida si guul leh ayaa loo daray!', type: 'success' });
    setShowAddEditModal(false);
  };

  const handleEditAsset = (updatedAssetData: FixedAsset) => {
    setAssets(prev => prev.map(asset => asset.id === updatedAssetData.id ? updatedAssetData : asset));
    setToastMessage({ message: 'Hantida si guul leh ayaa loo cusboonaysiiyay!', type: 'success' });
    setShowAddEditModal(false);
    setEditingAsset(null);
  };

  const handleDeleteAsset = async (id: string) => {
    if (window.confirm('Ma hubtaa inaad doonayso inaad tirtirto hantidan?')) {
      try {
        const response = await fetch(`/api/settings/assets/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) throw new Error('Failed to delete asset');
        
        setAssets(prev => prev.filter(asset => asset.id !== id));
        setToastMessage({ message: 'Hantida si guul leh ayaa loo tirtiray!', type: 'success' });
      } catch (error) {
        console.error('Error deleting asset:', error);
        setToastMessage({ message: 'Qalad ayaa dhacay markii la tirtirayay hantida', type: 'error' });
      }
    }
  };

  const openEditModal = (id: string) => {
    const assetToEdit = assets.find(asset => asset.id === id);
    if (assetToEdit) {
      setEditingAsset(assetToEdit);
      setShowAddEditModal(true);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/settings" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Fixed Assets
        </h1>
        <button 
          onClick={() => { setShowAddEditModal(true); setEditingAsset(null); }} 
          title="Add new asset"
          className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center"
        >
          <Plus size={20} className="mr-2" /> Ku Dar Hantida
        </button>
      </div>

      {/* Asset Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Wadarta Hantida</h4>
          <p className="text-3xl font-extrabold text-primary">{totalAssetsCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Wadarta Qiimaha Hantida</h4>
          <p className="text-3xl font-extrabold text-secondary">${totalAssetsValue.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Hantida La Meelayay</h4>
          <p className="text-3xl font-extrabold text-accent">{assignedAssetsCount}</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-8 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 animate-fade-in-up">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search assets by name, type, or assigned location..."
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Filter by Asset Type */}
        <div className="relative w-full md:w-48">
          <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
          <select
            title="Filter by asset type"
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            {assetTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
            <ChevronRight className="transform rotate-90" size={20} />
          </div>
        </div>
        {/* Filter by Assigned To */}
        <div className="relative w-full md:w-48">
          <Briefcase size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
          <select
            title="Filter by assigned location"
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none"
            value={filterAssignedTo}
            onChange={(e) => setFilterAssignedTo(e.target.value)}
          >
            {assignedOptions.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
            <ChevronRight className="transform rotate-90" size={20} />
          </div>
        </div>
      </div>

      {/* Fixed Assets Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
            <thead className="bg-lightGray dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Magaca Hantida</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Nooca</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Qiimaha</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Taariikhda Gadashada</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Meelaynta</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Last Updated</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Ficillo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lightGray dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-mediumGray dark:text-gray-400">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    <div>Waa la soo saarayaa hantida...</div>
                  </td>
                </tr>
              ) : filteredAssets.length > 0 ? (
                filteredAssets.map(asset => (
                  <FixedAssetRow 
                    key={asset.id} 
                    asset={asset} 
                    onEdit={openEditModal} 
                    onDelete={handleDeleteAsset} 
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-mediumGray dark:text-gray-400">Ma jiraan hanti la helay.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Placeholder */}
        <div className="p-4 flex justify-between items-center border-t border-lightGray dark:border-gray-700">
            <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Hore</button>
            <span className="text-sm text-darkGray dark:text-gray-100">Bogga 1 ee {Math.ceil(filteredAssets.length / 10) || 1}</span>
            <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Xiga</button>
        </div>
      </div>

      {/* Add/Edit Asset Modal */}
      {showAddEditModal && (
        <Modal title={editingAsset ? "Cusboonaysii Hantida" : "Ku Dar Hantida Cusub"} onClose={() => { setShowAddEditModal(false); setEditingAsset(null); }}>
          <AssetForm 
            onSubmit={editingAsset ? handleEditAsset : handleAddAsset} 
            onCancel={() => { setShowAddEditModal(false); setEditingAsset(null); }} 
            editingAsset={editingAsset}
          />
        </Modal>
      )}

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
