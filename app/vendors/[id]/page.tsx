// app/vendors/[id]/page.tsx - Vendor Details Page (10000% Design - API Integration)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation'; // To get vendor ID from URL and for navigation
import Layout from '../../../components/layouts/Layout';
import { 
  ArrowLeft, User as UserIcon, Building, Mail, Phone, MapPin, MessageSquare, Briefcase, DollarSign, Calendar,
  Eye, Edit, Trash2, Loader2, Info as InfoIcon, CheckCircle, XCircle, Plus, Tag as TagIcon, Truck // Icons for various details and actions
} from 'lucide-react';
import Toast from '../../../components/common/Toast'; // Import Toast component

// --- Vendor Data Interface (Refined for API response) ---
interface Vendor {
  id: string;
  name: string;
  type: string; // e.g., "Material", "Labor", "Transport", "Other"
  phone?: string;
  email?: string;
  address?: string;
  productsServices?: string; // Description of products/services provided
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Nested data from API includes (as per API /api/vendors/[id]/route.ts)
  expenses: { id: string; description: string; amount: number; expenseDate: string; category: string; }[];
  transactions: { id: string; description: string; amount: number; type: string; transactionDate: string; }[];
}

export default function Page() {
  const { id } = useParams(); // Get vendor ID from URL
  const router = useRouter(); // For redirection after delete
  const [vendor, setVendor] = useState<Vendor | null>(null); // State for vendor data
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview'); // For tab navigation
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const fetchVendorDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/vendors/${id}`);
      if (!response.ok) throw new Error('Failed to fetch vendor details');
      const data = await response.json();
      setVendor(data.vendor); 
    } catch (error: any) {
      console.error('Error fetching vendor details:', error);
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka faahfaahinta iibiyaha la soo gelinayay.', type: 'error' });
      setVendor(null); // Set vendor to null on error
      // Redirect if vendor not found or error
      router.push('/vendors'); 
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVendor = async () => {
    if (window.confirm('Ma hubtaa inaad tirtirto iibiyahan? Tan lama soo celin karo!')) {
      try {
        const response = await fetch(`/api/vendors/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete vendor');
        
        setToastMessage({ message: data.message || 'Iibiyaha si guul leh ayaa loo tirtiray!', type: 'success' });
        router.push('/vendors'); // Redirect to vendors list after successful delete
      } catch (error: any) {
        console.error('Error deleting vendor:', error);
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka iibiyaha la tirtirayay.', type: 'error' });
      }
    }
  };

  useEffect(() => {
    if (id) {
      fetchVendorDetails(); // Fetch vendor details when ID is available
    }
  }, [id, router]); // Re-fetch if ID changes or router updates

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px] text-darkGray dark:text-gray-100">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} /> Loading Vendor Details...
        </div>
      </Layout>
    );
  }

  if (!vendor) {
    return (
      <Layout>
        <div className="text-center p-8 text-redError bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <InfoIcon size={32} className="inline-block mb-4 text-redError"/>
          <p className="text-xl font-bold">Iibiyaha ID "{id}" lama helin.</p>
          <Link href="/vendors" className="mt-4 inline-block text-primary hover:underline">Ku Noqo Iibiyayaasha &rarr;</Link>
        </div>
        {toastMessage && (
          <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
        )}
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/vendors" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          {vendor.name}
        </h1>
        <div className="flex space-x-3">
          {/* Link to add expense related to this vendor (if applicable) */}
          <Link href={`/expenses/add?vendorId=${vendor.id}`} className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center">
            <Plus size={20} className="mr-2" /> Ku Dar Kharash
          </Link>
          <Link href={`/vendors/edit/${vendor.id}`} className="bg-accent text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-orange-600 transition duration-200 shadow-md flex items-center">
            <Edit size={20} className="mr-2" /> Edit Iibiye
          </Link>
          <button onClick={handleDeleteVendor} className="bg-redError text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-red-700 transition duration-200 shadow-md flex items-center">
            <Trash2 size={20} className="mr-2" /> Delete
          </button>
        </div>
      </div>

      {/* Vendor Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Nooca Iibiyaha</h4>
          <p className="text-3xl font-extrabold text-primary">{vendor.type}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Adeegyada/Alaabta</h4>
          <p className="text-3xl font-extrabold text-secondary">{vendor.productsServices ? 'Provided' : 'N/A'}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Wadarta Kharashyada La Bixiyay</h4>
          <p className="text-3xl font-extrabold text-accent">${vendor.expenses.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Diiwaan Gashan</h4>
          <p className="text-3xl font-extrabold text-darkGray dark:text-gray-100">{new Date(vendor.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Tabs for Vendor Details */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-fade-in-up">
        <div className="border-b border-lightGray dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6 md:px-8" aria-label="Tabs">
            {['Overview', 'Expenses', 'Transactions', 'Notes'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg focus:outline-none transition-colors duration-200
                            ${activeTab === tab 
                              ? 'border-primary text-primary dark:text-gray-100' 
                              : 'border-transparent text-mediumGray dark:text-gray-400 hover:text-darkGray dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 md:p-8">
          {activeTab === 'Overview' && (
            <div>
              <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-4">Macluumaadka Guud</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-darkGray dark:text-gray-100">
                <p><span className="font-semibold text-mediumGray dark:text-gray-400">Magaca:</span> {vendor.name}</p>
                <p><span className="font-semibold text-mediumGray dark:text-gray-400">Nooca:</span> {vendor.type}</p>
                <p><span className="font-semibold text-mediumGray dark:text-gray-400">Email:</span> {vendor.email || 'N/A'}</p>
                <p><span className="font-semibold text-mediumGray dark:text-gray-400">Taleefan:</span> {vendor.phone || 'N/A'}</p>
                <p className="md:col-span-2"><span className="font-semibold text-mediumGray dark:text-gray-400">Cinwaan:</span> {vendor.address || 'N/A'}</p>
                <p className="md:col-span-2"><span className="font-semibold text-mediumGray dark:text-gray-400">Adeegyada/Alaabta Ay Bixiyaan:</span> {vendor.productsServices || 'N/A'}</p>
              </div>
            </div>
          )}

          {activeTab === 'Expenses' && (
            <div>
              <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-4">Kharashyada Iibiyaha</h3>
              {vendor.expenses.length === 0 ? (
                <p className="text-mediumGray dark:text-gray-400">Ma jiraan kharashyo loo diiwaan geliyay iibiyahan.</p>
              ) : (
                <ul className="space-y-3">
                  {vendor.expenses.map((exp: any) => (
                    <li key={exp.id} className="flex justify-between items-center bg-lightGray dark:bg-gray-700 p-3 rounded-lg shadow-sm">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="text-redError" size={20} />
                        <span className="font-semibold text-darkGray dark:text-gray-100">{exp.description}</span>
                      </div>
                      <div>
                        <span className="text-mediumGray dark:text-gray-400 mr-2">Category: {exp.category}</span>
                        <span className="text-redError font-bold">-${exp.amount.toLocaleString()}</span>
                      </div>
                      <span className="text-sm text-mediumGray dark:text-gray-400">{new Date(exp.expenseDate).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link href={`/expenses/add?vendorId=${vendor.id}`} className="mt-4 bg-secondary text-white py-2 px-4 rounded-lg flex items-center hover:bg-green-600 transition duration-200 w-fit">
                  <Plus size={18} className="mr-2"/> Ku Dar Kharash
              </Link>
            </div>
          )}

          {activeTab === 'Transactions' && (
            <div>
              <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-4">Dhaqdhaqaaqa Lacagta</h3>
              {vendor.transactions.length === 0 ? (
                <p className="text-mediumGray dark:text-gray-400">Ma jiraan dhaqdhaqaaq lacag ah oo la xiriira iibiyahan.</p>
              ) : (
                <ul className="space-y-3">
                  {vendor.transactions.map((trx: any) => (
                    <li key={trx.id} className="flex justify-between items-center bg-lightGray dark:bg-gray-700 p-3 rounded-lg shadow-sm">
                      <div className="flex items-center space-x-3">
                        {trx.type === 'EXPENSE' || trx.type === 'DEBT_REPAID' || trx.type === 'TRANSFER_OUT' ? <DollarSign className="text-redError" size={20}/> : <CheckCircle className="text-secondary" size={20}/>}
                        <span className="font-semibold text-darkGray dark:text-gray-100">{trx.description}</span>
                      </div>
                      <span className={`${trx.amount >= 0 ? 'text-secondary' : 'text-redError'} font-bold`}>
                        {trx.amount >= 0 ? '+' : '-'}${Math.abs(trx.amount).toLocaleString()}
                      </span>
                      <span className="text-sm text-mediumGray dark:text-gray-400">{new Date(trx.transactionDate).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeTab === 'Notes' && (
            <div>
              <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-4">Fiiro Gaar Ah</h3>
              {vendor.notes ? (
                <p className="text-mediumGray dark:text-gray-400 p-3 bg-lightGray dark:bg-gray-700 rounded-lg">{vendor.notes}</p>
              ) : (
                <p className="text-mediumGray dark:text-gray-400">Ma jiraan fiiro gaar ah oo loo diiwaan geliyay iibiyahan.</p>
              )}
              {/* Button to edit notes directly or add new note */}
              <button className="mt-4 bg-accent text-white py-2 px-4 rounded-lg flex items-center hover:bg-orange-600 transition duration-200 w-fit">
                  <Edit size={18} className="mr-2"/> Wax ka Beddel Fiiro Gaar Ah
              </button>
            </div>
          )}

        </div>
      </div>
      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
