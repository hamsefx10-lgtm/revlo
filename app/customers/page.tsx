// app/customers/page.tsx - Customers List Page (10000% Design - API Integration & Enhanced)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '../../components/layouts/Layout';
import { 
  Plus, Search, Filter, Calendar, List, LayoutGrid, DollarSign, Tag, User, ChevronRight, Briefcase, Mail, Phone, MapPin,
  Eye, Edit, Trash2, Loader2, Info as InfoIcon, CheckCircle, XCircle, RefreshCw, Building
} from 'lucide-react';
import Toast from '../../components/common/Toast'; // Import Toast component

// --- Customer Data Interface (Refined for API response) ---
interface Customer {
  id: string;
  name: string;
  type: 'Individual' | 'Company';
  companyName?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Customer Table Row Component ---
const CustomerRow: React.FC<{ customer: Customer; onEdit: (id: string) => void; onDelete: (id: string) => void }> = ({ customer, onEdit, onDelete }) => (
  <tr className="hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-150 border-b border-lightGray dark:border-gray-700 last:border-b-0">
    <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-medium flex items-center space-x-2">
        <User size={18} className="text-primary"/> <span>{customer.name}</span>
    </td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            customer.type === 'Individual' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
        }`}>
            {customer.type}
        </span>
    </td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{customer.companyName || 'N/A'}</td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300 flex items-center space-x-2">
        {customer.email ? <Mail size={16}/> : <XCircle size={16} className="text-redError"/>} <span>{customer.email || 'N/A'}</span>
    </td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300 flex items-center space-x-2">
        {customer.phone ? <Phone size={16}/> : <XCircle size={16} className="text-redError"/>} <span>{customer.phone || 'N/A'}</span>
    </td>
    <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{new Date(customer.createdAt).toLocaleDateString()}</td>
    <td className="p-4 whitespace-nowrap text-right">
      <div className="flex items-center justify-end space-x-2">
        <Link href={`/customers/${customer.id}`} className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200" title="View Details">
          <Eye size={18} />
        </Link>
        <Link href={`/customers/edit/${customer.id}`} className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Edit Customer">
          <Edit size={18} />
        </Link>
        <button onClick={() => onDelete(customer.id)} className="p-2 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete Customer">
          <Trash2 size={18} />
        </button>
      </div>
    </td>
  </tr>
);

// --- Customer Card Component (for Mobile View) ---
const CustomerCard: React.FC<{ customer: Customer; onEdit: (id: string) => void; onDelete: (id: string) => void }> = ({ customer, onEdit, onDelete }) => (
  <div className="bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-md animate-fade-in-up border-l-2 border-primary relative">
    <div className="flex justify-between items-start mb-1">
      <h4 className="font-semibold text-darkGray dark:text-gray-100 text-xs flex items-center space-x-1">
        <User size={12} className="text-primary"/> <span className="truncate">{customer.name}</span>
      </h4>
      <div className="flex space-x-0.5 flex-shrink-0">
        <button onClick={() => onEdit(customer.id)} className="p-1 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Edit">
          <Edit size={10} />
        </button>
        <button onClick={() => onDelete(customer.id)} className="p-1 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete">
          <Trash2 size={10} />
        </button>
      </div>
    </div>
    <p className="text-xs text-mediumGray dark:text-gray-400 mb-0.5 flex items-center space-x-1">
        <Tag size={8}/> <span>Nooca: {customer.type}</span>
    </p>
    {customer.companyName && (
        <p className="text-xs text-mediumGray dark:text-gray-400 mb-0.5 flex items-center space-x-1">
            <Building size={8}/> <span className="truncate">Shirkad: {customer.companyName}</span>
        </p>
    )}
    <p className="text-xs text-mediumGray dark:text-gray-400 mb-0.5 flex items-center space-x-1">
        {customer.email ? <Mail size={8}/> : <XCircle size={8} className="text-redError"/>} <span className="truncate">Email: {customer.email || 'N/A'}</span>
    </p>
    <p className="text-xs text-mediumGray dark:text-gray-400 mb-0.5 flex items-center space-x-1">
        {customer.phone ? <Phone size={8}/> : <XCircle size={8} className="text-redError"/>} <span className="truncate">Taleefan: {customer.phone || 'N/A'}</span>
    </p>
    <p className="text-xs text-mediumGray dark:text-gray-400 mb-0.5 flex items-center space-x-1">
        {customer.address ? <MapPin size={8}/> : <XCircle size={8} className="text-redError"/>} <span className="truncate">Cinwaan: {customer.address || 'N/A'}</span>
    </p>
    <p className="text-xs text-mediumGray dark:text-gray-400 mb-0.5 flex items-center space-x-1">
        <Calendar size={8}/> <span>Diiwaan Gashan: {new Date(customer.createdAt).toLocaleDateString()}</span>
    </p>
    <Link href={`/customers/${customer.id}`} className="mt-1 inline-block text-primary hover:underline text-xs font-medium">
        Fiiri Faahfaahin &rarr;
    </Link>
  </div>
);


export default function CustomersPage() {
  const router = useRouter(); 
  const [customers, setCustomers] = useState<Customer[]>([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All'); // 'Individual' or 'Company'
  const [filterDateRange, setFilterDateRange] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list'); // Default to list view
  const [pageLoading, setPageLoading] = useState(true); 
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);


  // --- API Functions ---
  const fetchCustomers = async () => {
    setPageLoading(true);
    try {
      const response = await fetch('/api/customers');
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      setCustomers(data.customers); 
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka macaamiisha la soo gelinayay.', type: 'error' });
      setCustomers([]);
    } finally {
      setPageLoading(false);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (window.confirm('Ma hubtaa inaad tirtirto macmiilkan? Tan lama soo celin karo!')) {
      try {
        const response = await fetch(`/api/customers/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete customer');
        
        setToastMessage({ message: data.message || 'Macmiilka si guul leh ayaa loo tirtiray!', type: 'success' });
        fetchCustomers(); // Re-fetch customers after deleting
      } catch (error: any) {
        console.error('Error deleting customer:', error);
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka macmiilka la tirtirayay.', type: 'error' });
      }
    }
  };

  const handleEditCustomer = (id: string) => {
    router.push(`/customers/edit/${id}`); // Navigate to edit page
  };


  useEffect(() => {
    fetchCustomers(); // Fetch customers on component mount
  }, []); 


  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (customer.phone && customer.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (customer.companyName && customer.companyName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'All' || customer.type === filterType;
    const matchesDate = filterDateRange === 'All' ? true : true; 

    return matchesSearch && matchesType && matchesDate;
  });

  // Filter options
  const customerTypes = ['All', 'Individual', 'Company'];
  const dateRanges = ['All', 'Last 30 Days', 'This Quarter', 'This Year'];

  // Statistics
  const totalCustomersCount = filteredCustomers.length;
  const individualCustomersCount = filteredCustomers.filter(c => c.type === 'Individual').length;
  const companyCustomersCount = filteredCustomers.filter(c => c.type === 'Company').length;

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">Customers</h1>
        <div className="flex space-x-3">
          <Link href="/customers/add" className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center">
            <Plus size={20} className="mr-2" /> Ku Dar Macmiil
          </Link>
          <button onClick={fetchCustomers} className="bg-secondary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-green-600 transition duration-200 shadow-md flex items-center">
            <RefreshCw size={20} className="mr-2" /> Cusboonaysii
          </button>
        </div>
      </div>

      {/* Customer Statistics Cards - Ultra Compact Mobile Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6 animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-md text-center border-l-4 border-primary flex flex-col items-center justify-center min-h-[90px]">
          <User className="text-primary mb-1" size={18} />
          <h4 className="text-xs font-semibold text-primary mb-1">Wadarta Macaamiisha</h4>
          <span className="text-2xl font-bold text-primary">{totalCustomersCount}</span>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-md text-center border-l-4 border-secondary flex flex-col items-center justify-center min-h-[90px]">
          <User className="text-secondary mb-1" size={18} />
          <h4 className="text-xs font-semibold text-secondary mb-1">Macaamiisha Shakhsiga ah</h4>
          <span className="text-2xl font-bold text-secondary">{individualCustomersCount}</span>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-md text-center border-l-4 border-accent flex flex-col items-center justify-center min-h-[90px]">
          <Briefcase className="text-accent mb-1" size={18} />
          <h4 className="text-xs font-semibold text-accent mb-1">Macaamiisha Shirkadaha</h4>
          <span className="text-2xl font-bold text-accent">{companyCustomersCount}</span>
        </div>
      </div>

      {/* Search and Filter Bar - Ultra Compact Mobile Design */}
      <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md mb-3 flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2 animate-fade-in-up">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search customers by name, email, or phone..."
            className="w-full p-2 pl-8 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Filter by Type */}
        <div className="relative w-full md:w-32">
          <Filter size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
          <select
            title="Filter by customer type"
            className="w-full p-2 pl-8 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none text-xs"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            {customerTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-mediumGray dark:text-gray-400">
            <ChevronRight className="transform rotate-90" size={16} />
          </div>
        </div>
        {/* Filter by Date Range */}
        <div className="relative w-full md:w-32">
          <Calendar size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
          <select
            title="Filter by date range"
            className="w-full p-2 pl-8 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none text-xs"
            value={filterDateRange}
            onChange={(e) => setFilterDateRange(e.target.value)}
          >
            {dateRanges.map(range => <option key={range} value={range}>{range}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-mediumGray dark:text-gray-400">
            <ChevronRight className="transform rotate-90" size={16} />
          </div>
        </div>
        {/* View Mode Toggle */}
        <div className="flex space-x-1 w-full md:w-auto justify-center">
            <button title="List view" onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-lightGray dark:bg-gray-700 text-mediumGray dark:text-gray-400'} hover:bg-primary/80 dark:hover:bg-gray-600 transition-colors duration-200`}>
                <List size={16} />
            </button>
            <button title="Cards view" onClick={() => setViewMode('cards')} className={`p-1.5 rounded-lg ${viewMode === 'cards' ? 'bg-primary text-white' : 'bg-lightGray dark:bg-gray-700 text-mediumGray dark:text-gray-400'} hover:bg-primary/80 dark:hover:bg-gray-600 transition-colors duration-200`}>
                <LayoutGrid size={16} />
            </button>
        </div>
      </div>


      {/* Customers View - Responsive */}
      {pageLoading ? (
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} /> Loading Customers...
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center text-mediumGray dark:text-gray-400 animate-fade-in">
          Ma jiraan macaamiil la helay.
        </div>
      ) : (
        <>
          {/* Mobile: Ultra Compact Cards View */}
          <div className="block md:hidden">
            <div className="grid grid-cols-1 gap-1 animate-fade-in">
              {filteredCustomers.map(customer => (
                <CustomerCard key={customer.id} customer={customer} onEdit={handleEditCustomer} onDelete={handleDeleteCustomer} />
              ))}
            </div>
          </div>
          {/* Desktop: Table View */}
          <div className="hidden md:block">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-fade-in">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                  <thead className="bg-lightGray dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Magaca</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Nooca</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Magaca Shirkadda</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Email</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Taleefan</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Diiwaan Gashan</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                    {filteredCustomers.map(customer => (
                      <CustomerRow key={customer.id} customer={customer} onEdit={handleEditCustomer} onDelete={handleDeleteCustomer} />
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination Placeholder */}
              <div className="p-4 flex justify-between items-center border-t border-lightGray dark:border-gray-700">
                  <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Hore</button>
                  <span className="text-sm text-darkGray dark:text-gray-100">Page 1 of {Math.ceil(filteredCustomers.length / 10) || 1}</span>
                  <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Next</button>
              </div>
            </div>
          </div>
        </>
      )}

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
