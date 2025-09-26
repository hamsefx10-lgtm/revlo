// app/projects/add/page.tsx - Add New Project Page (Updated for Account & No Selling Price)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '../../../../components/layouts/Layout';
import {
  Plus, X, Loader2, Info, Briefcase, DollarSign, Calendar, Users, Tag, MessageSquare,
  ArrowLeft, ChevronRight, Banknote // Added Banknote for Account
} from 'lucide-react';
import Toast from '../../../../components/common/Toast';

// --- Type Definition for Customer ---
interface Customer {
  id: string;
  name: string;
}

// --- Type Definition for Account ---
interface Account {
    id: string;
    name: string;
}

const projectTypes = [
  'Furniture Manufacturing', 'Office Fit-out', 'Restaurant Design', 'Home Renovation', 'Shop Fit-out', 'Consulting Service', 'Other'
];

export default function AddProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [agreementAmount, setAgreementAmount] = useState<number | ''>('');
  const [advancePaid, setAdvancePaid] = useState<number | ''>('');
  const [projectType, setProjectType] = useState('');
  const [expectedCompletionDate, setExpectedCompletionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [customerId, setCustomerId] = useState(''); // Selected customer ID
  const [accountId, setAccountId] = useState(''); // Selected account ID for payment

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // --- State for fetched data ---
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]); // New state for accounts

  // --- Fetch Customers & Accounts ---
  useEffect(() => {
    const fetchRequiredData = async () => {
      try {
        // Fetch Customers
        const customerResponse = await fetch('/api/customers');
        if (!customerResponse.ok) {
          const errorData = await customerResponse.json();
          throw new Error(errorData.message || 'Failed to fetch customers');
        }
        const customerData = await customerResponse.json();
        setCustomers(customerData.customers || []);

        // Fetch Accounts (Assuming an API endpoint like /api/accounts)
        const accountResponse = await fetch('/api/accounts'); 
        if (!accountResponse.ok) {
          const errorData = await accountResponse.json();
          throw new Error(errorData.message || 'Failed to fetch accounts');
        }
        const accountData = await accountResponse.json();
        setAccounts(accountData.accounts || []); // Assuming API returns { accounts: [...] }

      } catch (error: any) {
        console.error('Error fetching data:', error);
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka xogta la soo gelinayay.', type: 'error' });
      }
    };
    fetchRequiredData();
  }, []);


  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Magaca Mashruuca waa waajib.';
    if (typeof agreementAmount !== 'number' || agreementAmount <= 0) newErrors.agreementAmount = 'Qiimaha Heshiiska waa inuu noqdaa nambar wanaagsan.';
    if (typeof advancePaid !== 'number' || advancePaid < 0) newErrors.advancePaid = 'Lacagta Hore Loo Bixiyay waa inuu noqdaa nambar wanaagsan.';
    if (advancePaid > agreementAmount) newErrors.advancePaid = 'Lacagta Hore Loo Bixiyay ma dhaafi karto Qiimaha Heshiiska.';
    if (!projectType) newErrors.projectType = 'Nooca Mashruuca waa waajib.';
    if (!expectedCompletionDate) newErrors.expectedCompletionDate = 'Taariikhda Dhammaystirka waa waajib.';
    if (!customerId) newErrors.customerId = 'Macmiilka waa waajib.';
    if (!accountId) newErrors.accountId = 'Akoonka Lacagta waa waajib.'; // New validation for account
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setToastMessage(null);

    if (!validateForm()) {
      setLoading(false);
      setToastMessage({ message: 'Fadlan sax khaladaadka foomka.', type: 'error' });
      return;
    }

    try {
      const response = await fetch('/api/projects', { // Your API endpoint for submitting projects
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          agreementAmount,
          advancePaid,
          projectType,
          expectedCompletionDate,
          notes: notes || null,
          customerId,
          accountId // Include accountId in the payload
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setToastMessage({ message: data.message || 'Mashruuca si guul leh ayaa loo daray!', type: 'success' });
        router.push('/projects');
      } else {
        setToastMessage({ message: data.message || 'Cilad ayaa dhacday marka mashruuca la darayay.', type: 'error' });
      }
    } catch (error: any) {
      console.error('Project Add API error:', error);
      setToastMessage({ message: 'Cilad shabakadeed ayaa dhacday. Fadlan isku day mar kale.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/projects" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Ku Dar Mashruuc Cusub
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md animate-fade-in-up">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <div>
            <label htmlFor="projectName" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Magaca Mashruuca <span className="text-redError">*</span></label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <input
                type="text"
                id="projectName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tusaale: Furniture Project A"
                className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${errors.name ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
              />
            </div>
            {errors.name && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.name}</p>}
          </div>

          {/* Customer Selection */}
          <div>
            <label htmlFor="customer" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Macmiil <span className="text-redError">*</span></label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <select
                id="customer"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${errors.customerId ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
              >
                <option value="">-- Dooro Macmiil --</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
              <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
            </div>
            {errors.customerId && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.customerId}</p>}
          </div>

          {/* Account Selection (New Field) */}
          <div>
            <label htmlFor="account" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Akoonka Lacagta Ka Go'ayso <span className="text-redError">*</span></label>
            <div className="relative">
              <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
              <select
                id="account"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${errors.accountId ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
              >
                <option value="">-- Dooro Akoon --</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>{account.name}</option>
                ))}
              </select>
              <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
            </div>
            {errors.accountId && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.accountId}</p>}
          </div>

          {/* Agreement Amount & Advance Paid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="agreementAmount" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Qiimaha Heshiiska ($) <span className="text-redError">*</span></label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <input
                  type="number"
                  id="agreementAmount"
                  value={agreementAmount}
                  onChange={(e) => setAgreementAmount(parseFloat(e.target.value) || '')}
                  placeholder="Tusaale: 15000.00"
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${errors.agreementAmount ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                />
              </div>
              {errors.agreementAmount && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.agreementAmount}</p>}
            </div>
            <div>
              <label htmlFor="advancePaid" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Lacagta Hore Loo Bixiyay ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <input
                  type="number"
                  id="advancePaid"
                  value={advancePaid}
                  onChange={(e) => setAdvancePaid(parseFloat(e.target.value) || '')}
                  placeholder="Tusaale: 5000.00"
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${errors.advancePaid ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                />
              </div>
              {errors.advancePaid && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.advancePaid}</p>}
            </div>
          </div>

          {/* Project Type & Expected Completion Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="projectType" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Nooca Mashruuca <span className="text-redError">*</span></label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <select
                  id="projectType"
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${errors.projectType ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                >
                  <option value="">-- Dooro Nooca Mashruuca --</option>
                  {projectTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
              </div>
              {errors.projectType && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.projectType}</p>}
            </div>
            <div>
              <label htmlFor="expectedCompletionDate" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Taariikhda Dhammaystirka La Filayo <span className="text-redError">*</span></label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                <input
                  type="date"
                  id="expectedCompletionDate"
                  value={expectedCompletionDate}
                  onChange={(e) => setExpectedCompletionDate(e.target.value)}
                  className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${errors.expectedCompletionDate ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                />
              </div>
              {errors.expectedCompletionDate && <p className="text-redError text-sm mt-1 flex items-center"><Info size={16} className="mr-1"/>{errors.expectedCompletionDate}</p>}
            </div>
          </div>

          {/* Description & Notes */}
          <div>
            <label htmlFor="description" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Sharaxaad (Optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Sharaxaad kooban oo ku saabsan mashruucan..."
              className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
            ></textarea>
          </div>
          <div>
            <label htmlFor="notes" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Fiiro Gaar Ah (Optional)</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Wixii faahfaahin dheeraad ah ee mashruuca..."
              className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
            ></textarea>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-primary text-white py-3 px-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md transform hover:scale-105 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin mr-2" size={20} />
            ) : (
              <Plus className="mr-2" size={20} />
            )}
            {loading ? 'Diiwaan Gelinaya Mashruuca...' : 'Diiwaan Geli Mashruuca'}
          </button>
        </form>
      </div>
      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}