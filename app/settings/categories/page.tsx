// app/settings/categories/page.tsx - Expense Categories Settings Page (10000% Design)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import { 
  ArrowLeft, Tag, Plus, Search, Filter, Edit, Trash2, X, Loader2, Info, 
  Briefcase, Building, Scale, CheckCircle, XCircle, ChevronRight,
  FileText, Download, Upload, Eye // General icons
} from 'lucide-react';
import Toast from '../../../components/common/Toast'; // Reuse Toast component

// --- Types ---
interface ExpenseCategory {
  id: string;
  name: string;
  type: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// --- Expense Category Table Row Component ---
const ExpenseCategoryRow: React.FC<{ category: ExpenseCategory; onEdit: (id: string) => void; onDelete: (id: string) => void }> = ({ category, onEdit, onDelete }) => (
  <tr className="hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-150 border-b border-lightGray dark:border-gray-700 last:border-b-0">
    <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-medium flex items-center space-x-2">
        <Tag size={18} className="text-primary"/> <span>{category.name}</span>
    </td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            category.type === 'Project' ? 'bg-primary/10 text-primary' :
            category.type === 'Company' ? 'bg-secondary/10 text-secondary' :
            'bg-accent/10 text-accent'
        }`}>
            {category.type}
        </span>
    </td>
    <td className="p-4 text-mediumGray dark:text-gray-300 truncate max-w-xs">{category.description}</td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{new Date(category.updatedAt).toLocaleDateString()}</td>
    <td className="p-4 whitespace-nowrap text-right">
      <div className="flex items-center justify-end space-x-2">
        <button onClick={() => onEdit(category.id)} className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Edit Category">
          <Edit size={18} />
        </button>
        <button onClick={() => onDelete(category.id)} className="p-2 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete Category">
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
        <button onClick={onClose} className="text-mediumGray dark:text-gray-400 hover:text-redError transition-colors" title="Xidh Modal">
          <X size={24} />
        </button>
      </div>
      {children}
    </div>
  </div>
);

// --- Add/Edit Category Form (Inside Modal) ---
interface CategoryFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  editingCategory?: ExpenseCategory | null; // Optional for editing
}
const CategoryForm: React.FC<CategoryFormProps> = ({ onSubmit, onCancel, editingCategory }) => {
  const [name, setName] = useState(editingCategory?.name || '');
  const [type, setType] = useState(editingCategory?.type || '');
  const [description, setDescription] = useState(editingCategory?.description || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Magaca Nooca waa waajib.';
    if (!type) newErrors.type = 'Nooca waa waajib.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    
    try {
      const url = editingCategory 
        ? `/api/settings/categories/${editingCategory.id}`
        : '/api/settings/categories';
      
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, description }),
      });
      
      if (!response.ok) throw new Error('Failed to save category');
      
      const data = await response.json();
      onSubmit(data.category);
    } catch (error) {
      console.error('Error saving category:', error);
      // Handle error - could show toast here
    } finally {
      setLoading(false);
    }
  };

  const categoryTypes = ['Project', 'Company', 'General'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div>
        <label htmlFor="categoryName" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Magaca Nooca <span className="text-redError">*</span></label>
        <input type="text" id="categoryName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tusaale: Material" className={`w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary ${errors.name ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}/>
        {errors.name && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.name}</p>}
      </div>
      <div>
        <label htmlFor="categoryType" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Nooca <span className="text-redError">*</span></label>
        <select id="categoryType" value={type} onChange={(e) => setType(e.target.value)} className={`w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary appearance-none ${errors.type ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}>
          <option value="">-- Dooro Nooca --</option>
          {categoryTypes.map(typeOpt => <option key={typeOpt} value={typeOpt}>{typeOpt}</option>)}
        </select>
        {errors.type && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.type}</p>}
      </div>
      <div>
        <label htmlFor="categoryDescription" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Sharaxaad (Optional)</label>
        <textarea id="categoryDescription" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Sharaxaad kooban oo ku saabsan noocan kharashka..." className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary"></textarea>
      </div>
      <div className="flex justify-end space-x-3 mt-6">
        <button type="button" onClick={onCancel} className="bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 py-2 px-4 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition">Jooji</button>
        <button type="submit" className="bg-primary text-white py-2 px-4 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center" disabled={loading}>
          {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : <Plus size={20} className="mr-2"/>} {editingCategory ? 'Cusboonaysii Nooca' : 'Ku Dar Nooca'}
        </button>
      </div>
    </form>
  );
};


// Main Expense Categories Page Component
export default function ExpenseCategoriesSettingsPage() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/settings/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setToastMessage({ message: 'Qalad ayaa dhacay markii la soo saarayay noocyada', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Statistics
  const totalCategories = categories.length;
  const projectCategories = categories.filter(cat => cat.type === 'Project').length;
  const companyCategories = categories.filter(cat => cat.type === 'Company').length;

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          category.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || category.type === filterType;
    return matchesSearch && matchesType;
  });

  const categoryTypes = ['All', 'Project', 'Company', 'General'];

  const handleAddCategory = (newCategoryData: ExpenseCategory) => {
    setCategories(prev => [...prev, newCategoryData]);
    setToastMessage({ message: 'Nooca si guul leh ayaa loo daray!', type: 'success' });
    setShowAddEditModal(false);
  };

  const handleEditCategory = (updatedCategoryData: ExpenseCategory) => {
    setCategories(prev => prev.map(cat => cat.id === updatedCategoryData.id ? updatedCategoryData : cat));
    setToastMessage({ message: 'Nooca si guul leh ayaa loo cusboonaysiiyay!', type: 'success' });
    setShowAddEditModal(false);
    setEditingCategory(null);
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Ma hubtaa inaad doonayso inaad tirtirto noocan kharashka?')) {
      try {
        const response = await fetch(`/api/settings/categories/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) throw new Error('Failed to delete category');
        
        setCategories(prev => prev.filter(cat => cat.id !== id));
        setToastMessage({ message: 'Nooca si guul leh ayaa loo tirtiray!', type: 'success' });
      } catch (error) {
        console.error('Error deleting category:', error);
        setToastMessage({ message: 'Qalad ayaa dhacay markii la tirtirayay nooca', type: 'error' });
      }
    }
  };

  const openEditModal = (id: string) => {
    const categoryToEdit = categories.find(cat => cat.id === id);
    if (categoryToEdit) {
      setEditingCategory(categoryToEdit);
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
          Expense Categories
        </h1>
        <button onClick={() => { setShowAddEditModal(true); setEditingCategory(null); }} className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center">
          <Plus size={20} className="mr-2" /> Ku Dar Nooc
        </button>
      </div>

      {/* Category Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Wadarta Noocyada</h4>
          <p className="text-3xl font-extrabold text-primary">{totalCategories}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Noocyada Mashruuca</h4>
          <p className="text-3xl font-extrabold text-secondary">{projectCategories}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Noocyada Shirkadda</h4>
          <p className="text-3xl font-extrabold text-accent">{companyCategories}</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-8 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 animate-fade-in-up">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search categories by name or description..."
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Filter by Category Type */}
        <div className="relative w-full md:w-48">
          <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
          <select
            title="Filter by Category Type"
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            {categoryTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
            <ChevronRight className="transform rotate-90" size={20} />
          </div>
        </div>
      </div>

      {/* Expense Categories Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
            <thead className="bg-lightGray dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Magaca Nooca</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Nooca</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Sharaxaad</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Last Updated</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Ficillo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lightGray dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-mediumGray dark:text-gray-400">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    <div>Waa la soo saarayaa noocyada...</div>
                  </td>
                </tr>
              ) : filteredCategories.length > 0 ? (
                filteredCategories.map(category => (
                  <ExpenseCategoryRow 
                    key={category.id} 
                    category={category} 
                    onEdit={openEditModal} 
                    onDelete={handleDeleteCategory} 
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-mediumGray dark:text-gray-400">Ma jiraan noocyo kharash ah oo la helay.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Placeholder */}
        <div className="p-4 flex justify-between items-center border-t border-lightGray dark:border-gray-700">
            <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Hore</button>
            <span className="text-sm text-darkGray dark:text-gray-100">Bogga 1 ee {Math.ceil(filteredCategories.length / 10) || 1}</span>
            <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Xiga</button>
        </div>
      </div>

      {/* Add/Edit Category Modal */}
      {showAddEditModal && (
        <Modal title={editingCategory ? "Cusboonaysii Nooca Kharashka" : "Ku Dar Nooc Kharash Cusub"} onClose={() => { setShowAddEditModal(false); setEditingCategory(null); }}>
          <CategoryForm 
            onSubmit={editingCategory ? handleEditCategory : handleAddCategory} 
            onCancel={() => { setShowAddEditModal(false); setEditingCategory(null); }} 
            editingCategory={editingCategory}
          />
        </Modal>
      )}

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
