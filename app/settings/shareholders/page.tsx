// app/settings/shareholders/page.tsx - Shareholders Settings Page (10000% Design - Final Update)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import { 
  ArrowLeft, Scale, Plus, Search, Filter, Edit, Trash2, X, Loader2, Info, 
  User, Percent, DollarSign, CheckCircle, XCircle, ChevronRight, Calendar,
  Mail, Phone, List, LayoutGrid // Added List and LayoutGrid for view toggle
} from 'lucide-react';
import Toast from '../../../components/common/Toast'; // Reuse Toast component

// --- Types ---
interface Shareholder {
  id: string;
  name: string;
  email: string;
  sharePercentage: number;
  profitSplit: number;
  joinedDate: string;
  createdAt: string;
  updatedAt: string;
}

// --- Shareholder Table Row Component ---
const ShareholderRow: React.FC<{ shareholder: Shareholder; onEdit: (id: string) => void; onDelete: (id: string) => void }> = ({ shareholder, onEdit, onDelete }) => (
  <tr className="hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-150 border-b border-lightGray dark:border-gray-700 last:border-b-0">
    <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-medium flex items-center space-x-2">
        <User size={18} className="text-primary"/> <span>{shareholder.name}</span>
    </td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300 flex items-center space-x-2">
        <Mail size={16}/> <span>{shareholder.email}</span>
    </td>
    <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-semibold flex items-center justify-center"> {/* Centered for percentage */}
        <Percent size={16} className="text-secondary"/> <span>{shareholder.sharePercentage}%</span>
    </td>
    <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-semibold flex items-center justify-end"> {/* Right-aligned for currency */}
        <DollarSign size={16} className="text-accent"/> <span>${shareholder.profitSplit.toLocaleString()}</span>
    </td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300 flex items-center space-x-2"> {/* Added icon */}
        <Calendar size={16}/> <span>{new Date(shareholder.joinedDate).toLocaleDateString()}</span>
    </td>
    <td className="p-4 whitespace-nowrap text-right">
      <div className="flex items-center justify-end space-x-2">
        <button onClick={() => onEdit(shareholder.id)} className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Edit Shareholder">
          <Edit size={18} />
        </button>
        <button onClick={() => onDelete(shareholder.id)} className="p-2 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete Shareholder">
          <Trash2 size={18} />
        </button>
      </div>
    </td>
  </tr>
);

// --- Shareholder Card Component (for Mobile View) ---
const ShareholderCard: React.FC<{ shareholder: Shareholder; onEdit: (id: string) => void; onDelete: (id: string) => void }> = ({ shareholder, onEdit, onDelete }) => (
  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border-l-4 border-primary animate-fade-in-up">
    <div className="flex justify-between items-start mb-3">
      <h4 className="font-semibold text-darkGray dark:text-gray-100 text-lg flex items-center space-x-2">
        <User size={20} className="text-primary"/> <span>{shareholder.name}</span>
      </h4>
      <div className="flex space-x-2">
        <button onClick={() => onEdit(shareholder.id)} className="p-1 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Edit">
          <Edit size={16} />
        </button>
        <button onClick={() => onDelete(shareholder.id)} className="p-1 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
    <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
      <Mail size={14}/> <span>{shareholder.email}</span>
    </p>
    <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
      <Percent size={14} className="text-secondary"/> <span>Saamiga: {shareholder.sharePercentage}%</span>
    </p>
    <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
      <DollarSign size={14} className="text-accent"/> <span>Faa'iidada: ${shareholder.profitSplit.toLocaleString()}</span>
    </p>
    <p className="text-sm text-mediumGray dark:text-gray-400 flex items-center space-x-2">
      <Calendar size={14}/> <span>Ku Biiray: {new Date(shareholder.joinedDate).toLocaleDateString()}</span>
    </p>
  </div>
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

// --- Add/Edit Shareholder Form (Inside Modal) ---
interface ShareholderFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  editingShareholder?: Shareholder | null; // Optional for editing
}
const ShareholderForm: React.FC<ShareholderFormProps> = ({ onSubmit, onCancel, editingShareholder }) => {
  const [name, setName] = useState(editingShareholder?.name || '');
  const [email, setEmail] = useState(editingShareholder?.email || '');
  const [sharePercentage, setSharePercentage] = useState<number | ''>(editingShareholder?.sharePercentage || '');
  const [joinedDate, setJoinedDate] = useState(editingShareholder?.joinedDate || new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Magaca saamileyda waa waajib.';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Email sax ah waa waajib.';
    if (typeof sharePercentage !== 'number' || sharePercentage <= 0 || sharePercentage > 100) newErrors.sharePercentage = 'Boqolleyda saamiga waa inuu u dhaxeeyaa 1-100.';
    if (!joinedDate) newErrors.joinedDate = 'Taariikhda ku biirista waa waajib.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    
    try {
      const url = editingShareholder 
        ? `/api/settings/shareholders/${editingShareholder.id}`
        : '/api/settings/shareholders';
      
      const method = editingShareholder ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, sharePercentage, joinedDate }),
      });
      
      if (!response.ok) throw new Error('Failed to save shareholder');
      
      const data = await response.json();
      onSubmit(data.shareholder);
    } catch (error) {
      console.error('Error saving shareholder:', error);
      // Handle error - could show toast here
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div>
        <label htmlFor="shareholderName" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Magaca Samileyda <span className="text-redError">*</span></label>
        <input type="text" id="shareholderName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tusaale: Axmed Cali" className={`w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary ${errors.name ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}/>
        {errors.name && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.name}</p>}
      </div>
      <div>
        <label htmlFor="shareholderEmail" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Email <span className="text-redError">*</span></label>
        <input type="email" id="shareholderEmail" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tusaale@ganacsi.com" className={`w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary ${errors.email ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}/>
        {errors.email && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.email}</p>}
      </div>
      <div>
        <label htmlFor="sharePercentage" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Boqolleyda Saamiga (%) <span className="text-redError">*</span></label>
        <input type="number" id="sharePercentage" value={sharePercentage} onChange={(e) => setSharePercentage(parseFloat(e.target.value) || '')} placeholder="Tusaale: 50" min="1" max="100" className={`w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary ${errors.sharePercentage ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}/>
        {errors.sharePercentage && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.sharePercentage}</p>}
      </div>
      <div>
        <label htmlFor="joinedDate" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Taariikhda Ku Biirista <span className="text-redError">*</span></label>
        <input type="date" id="joinedDate" value={joinedDate} onChange={(e) => setJoinedDate(e.target.value)} className={`w-full p-3 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-primary ${errors.joinedDate ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}/>
        {errors.joinedDate && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.joinedDate}</p>}
      </div>
      <div className="flex justify-end space-x-3 mt-6">
        <button type="button" onClick={onCancel} className="bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 py-2 px-4 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition">Jooji</button>
        <button type="submit" className="bg-primary text-white py-2 px-4 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center" disabled={loading}>
          {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : <Plus size={20} className="mr-2"/>} {editingShareholder ? 'Cusboonaysii Saamileyda' : 'Ku Dar Saamileyda'}
        </button>
      </div>
    </form>
  );
};


// Main Shareholders Page Component
export default function ShareholdersSettingsPage() {
  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingShareholder, setEditingShareholder] = useState<Shareholder | null>(null);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list'); // New state for view mode

  // Fetch shareholders on component mount
  useEffect(() => {
    fetchShareholders();
  }, []);

  const fetchShareholders = async () => {
    try {
      const response = await fetch('/api/settings/shareholders');
      if (!response.ok) throw new Error('Failed to fetch shareholders');
      const data = await response.json();
      setShareholders(data.shareholders || []);
    } catch (error) {
      console.error('Error fetching shareholders:', error);
      setToastMessage({ message: 'Qalad ayaa dhacay markii la soo saarayay saamileyda', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Statistics
  const totalSharePercentage = shareholders.reduce((sum, sh) => sum + sh.sharePercentage, 0);
  const totalShareholders = shareholders.length;
  const totalCompanyProfitSplit = shareholders.reduce((sum, sh) => sum + sh.profitSplit, 0);

  const filteredShareholders = shareholders.filter(sh => {
    const matchesSearch = sh.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sh.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleAddShareholder = (newShareholderData: Shareholder) => {
    setShareholders(prev => [...prev, newShareholderData]);
    setToastMessage({ message: 'Saamileyda si guul leh ayaa loo daray!', type: 'success' });
    setShowAddEditModal(false);
  };

  const handleEditShareholder = (updatedShareholderData: Shareholder) => {
    setShareholders(prev => prev.map(sh => sh.id === updatedShareholderData.id ? updatedShareholderData : sh));
    setToastMessage({ message: 'Saamileyda si guul leh ayaa loo cusboonaysiiyay!', type: 'success' });
    setShowAddEditModal(false);
    setEditingShareholder(null);
  };

  const handleDeleteShareholder = async (id: string) => {
    if (window.confirm('Ma hubtaa inaad doonayso inaad tirtirto saamileyda?')) {
      try {
        const response = await fetch(`/api/settings/shareholders/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) throw new Error('Failed to delete shareholder');
        
        setShareholders(prev => prev.filter(sh => sh.id !== id));
        setToastMessage({ message: 'Saamileyda si guul leh ayaa loo tirtiray!', type: 'success' });
      } catch (error) {
        console.error('Error deleting shareholder:', error);
        setToastMessage({ message: 'Qalad ayaa dhacay markii la tirtirayay saamileyda', type: 'error' });
      }
    }
  };

  const openEditModal = (id: string) => {
    const shareholderToEdit = shareholders.find(sh => sh.id === id);
    if (shareholderToEdit) {
      setEditingShareholder(shareholderToEdit);
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
          Shareholders
        </h1>
        <button onClick={() => { setShowAddEditModal(true); setEditingShareholder(null); }} className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center">
          <Plus size={20} className="mr-2" /> Ku Dar Saamiley
        </button>
      </div>

      {/* Shareholder Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Wadarta Saamileyda</h4>
          <p className="text-3xl font-extrabold text-primary">{totalShareholders}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Wadarta Boqolleyda Saamiga</h4>
          <p className="text-3xl font-extrabold text-secondary">{totalSharePercentage}%</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Wadarta Qaybsiga Faa'iidada</h4>
          <p className="text-3xl font-extrabold text-accent">${totalCompanyProfitSplit.toLocaleString()}</p>
        </div>
      </div>

      {/* Search Bar & View Toggle */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-8 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 animate-fade-in-up">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search shareholders by name or email..."
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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

      {/* Shareholders View */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md text-center text-mediumGray dark:text-gray-400 animate-fade-in">
          <Loader2 className="animate-spin mx-auto mb-2" size={24} />
          <div>Waa la soo saarayaa saamileyda...</div>
        </div>
      ) : filteredShareholders.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center text-mediumGray dark:text-gray-400 animate-fade-in">
          Ma jiraan saamiley la helay.
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
              <thead className="bg-lightGray dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Magaca Samileyda</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Email</th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Boqolleyda Saamiga</th> {/* Centered header */}
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Qaybsiga Faa'iidada</th> {/* Right-aligned header */}
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Taariikhda Ku Biirista</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Ficillo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                {filteredShareholders.map(shareholder => (
                  <ShareholderRow 
                    key={shareholder.id} 
                    shareholder={shareholder} 
                    onEdit={openEditModal} 
                    onDelete={handleDeleteShareholder} 
                  />
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination Placeholder */}
          <div className="p-4 flex justify-between items-center border-t border-lightGray dark:border-gray-700">
              <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Hore</button>
              <span className="text-sm text-darkGray dark:text-gray-100">Bogga 1 ee {Math.ceil(filteredShareholders.length / 10) || 1}</span>
              <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Xiga</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {filteredShareholders.map(shareholder => (
                <ShareholderCard 
                    key={shareholder.id} 
                    shareholder={shareholder} 
                    onEdit={openEditModal} 
                    onDelete={handleDeleteShareholder} 
                />
            ))}
        </div>
      )}

      {/* Add/Edit Shareholder Modal */}
      {showAddEditModal && (
        <Modal title={editingShareholder ? "Cusboonaysii Saamileyda" : "Ku Dar Saamileyda Cusub"} onClose={() => { setShowAddEditModal(false); setEditingShareholder(null); }}>
          <ShareholderForm 
            onSubmit={editingShareholder ? handleEditShareholder : handleAddShareholder} 
            onCancel={() => { setShowAddEditModal(false); setEditingShareholder(null); }} 
            editingShareholder={editingShareholder}
          />
        </Modal>
      )}

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
