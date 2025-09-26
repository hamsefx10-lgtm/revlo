// app/customers/[id]/page.tsx - Customer Details Page (10000% Design - API Integration)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation'; // To get customer ID from URL and for navigation
import Layout from '../../../components/layouts/Layout';
import { 
  ArrowLeft, User as UserIcon, Building, Mail, Phone, MapPin, MessageSquare, Briefcase, DollarSign, Calendar,
  Eye, Edit, Trash2, Loader2, Info as InfoIcon, CheckCircle, XCircle, Plus, Search, Filter, ChevronRight, Clock, FileX2
} from 'lucide-react';
import Toast from '../../../components/common/Toast'; // Import Toast component

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
  projects: { id: string; name: string; status: string; agreementAmount: number; advancePaid: number; remainingAmount?: number; }[];
  payments: { id: string; amount: number; paymentDate: string; paymentType: string; receivedIn: string; projectId?: string }[];
  transactions: { id: string; description: string; amount: number; type: string; transactionDate: string; note?: string; project?: { name: string } }[];
  expenses: { id: string; amount: number; category: string; subCategory?: string; paidFrom?: string; accountName?: string; expenseDate: string; note?: string; projectId?: string; project?: { name: string }; accountId?: string; receiptUrl?: string }[];
  outstandingDebt?: number;
  projectDebts?: { id: string; name: string; status: string; agreementAmount: number; advancePaid: number; remainingAmount: number }[];
}

const CustomerDetailsPage: React.FC = () => {
  const { id } = useParams(); // Get customer ID from URL
  const router = useRouter(); // For redirection after delete
  const [customer, setCustomer] = useState<Customer | null>(null); // State for customer data
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview'); // For tab navigation
  const [searchTerm, setSearchTerm] = useState(''); // For search functionality
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);


  // --- API Functions ---
  const fetchCustomerDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/customers/${id}`);
      if (!response.ok) throw new Error('Failed to fetch customer details');
      const data = await response.json();
      setCustomer(data.customer); 
    } catch (error: any) {
      console.error('Error fetching customer details:', error);
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka faahfaahinta macmiilka la soo gelinayay.', type: 'error' });
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  // Real-time update when accounting transactions are created
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'transactionCreated' && e.newValue) {
        const transactionData = JSON.parse(e.newValue);
        if (transactionData.customerId === id) {
          // Refresh customer data when a transaction is created for this customer
          console.log('Transaction created for customer:', transactionData);
          fetchCustomerDetails();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [id]);

  // Real-time update when project payments are made
  useEffect(() => {
    const handleProjectPayment = (e: StorageEvent) => {
      if (e.key === 'projectPaymentMade' && e.newValue) {
        const paymentData = JSON.parse(e.newValue);
        if (paymentData.customerId === id) {
          // Refresh customer data when a project payment is made
          console.log('Project payment made for customer:', paymentData);
          fetchCustomerDetails();
        }
      }
    };

    window.addEventListener('storage', handleProjectPayment);
    return () => window.removeEventListener('storage', handleProjectPayment);
  }, [id]);

  // Real-time update when debt repayment is made
  useEffect(() => {
    const handleDebtRepayment = (e: StorageEvent) => {
      if (e.key === 'debtRepaymentMade' && e.newValue) {
        const repaymentData = JSON.parse(e.newValue);
        if (repaymentData.customerId === id) {
          // Refresh customer data when a debt repayment is made
          console.log('Debt repayment made for customer:', repaymentData);
          console.log('Refreshing customer data for real-time update...');
          fetchCustomerDetails();
        }
      }
    };

    window.addEventListener('storage', handleDebtRepayment);
    return () => window.removeEventListener('storage', handleDebtRepayment);
  }, [id]);

  const handleDeleteCustomer = async () => {
    if (window.confirm('Ma hubtaa inaad tirtirto macmiilkan? Tan lama soo celin karo!')) {
      try {
        const response = await fetch(`/api/customers/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete customer');
        
        setToastMessage({ message: data.message || 'Macmiilka si guul leh ayaa loo tirtiray!', type: 'success' });
        router.push('/customers'); // Redirect to customers list after successful delete
      } catch (error: any) {
        console.error('Error deleting customer:', error);
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka macmiilka la tirtirayay.', type: 'error' });
      }
    }
  };

  useEffect(() => {
    if (id) {
      fetchCustomerDetails(); // Fetch customer details when ID is available
    }
  }, [id]); // Re-fetch if ID changes

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px] text-darkGray dark:text-gray-100">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} /> Loading Customer Details...
        </div>
      </Layout>
    );
  }

  if (!customer) {
    return (
      <Layout>
        <div className="text-center p-8 text-redError bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <InfoIcon size={32} className="inline-block mb-4 text-redError"/>
          <p className="text-xl font-bold">Macmiilka ID "{id}" lama helin.</p>
          <Link href="/customers" className="mt-4 inline-block text-primary hover:underline">Ku Noqo Macaamiisha &rarr;</Link>
        </div>
        {toastMessage && (
          <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
        )}
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 md:mb-8 gap-3 sm:gap-4 md:gap-0">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-darkGray dark:text-gray-100 flex items-center">
          <Link href="/customers" className="text-gray-700 dark:text-gray-200 hover:text-primary transition-colors duration-200 mr-2 sm:mr-4">
            <ArrowLeft size={20} className="inline-block sm:w-7 sm:h-7" />
          </Link>
          {customer.name}
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Link href={`/projects/add?customerId=${customer.id}`} className="bg-primary text-white py-2 sm:py-2.5 px-3 sm:px-4 md:px-6 rounded-lg font-bold text-sm sm:text-base md:text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center justify-center">
            <Plus size={16} className="mr-1 sm:mr-2" /> Ku Dar Mashruuc
          </Link>
          <Link href={`/customers/edit/${customer.id}`} className="bg-accent text-white py-2 sm:py-2.5 px-3 sm:px-4 md:px-6 rounded-lg font-bold text-sm sm:text-base md:text-lg hover:bg-orange-600 transition duration-200 shadow-md flex items-center justify-center">
            <Edit size={16} className="mr-1 sm:mr-2" /> Edit Macmiil
          </Link>
          <button onClick={handleDeleteCustomer} className="bg-redError text-white py-2 sm:py-2.5 px-3 sm:px-4 md:px-6 rounded-lg font-bold text-sm sm:text-base md:text-lg hover:bg-red-700 transition duration-200 shadow-md flex items-center justify-center">
            <Trash2 size={16} className="mr-1 sm:mr-2" /> Delete
          </button>
        </div>
      </div>

      {/* Summary Cards - Project Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8 animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 w-full text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Nooca Macmiilka</h4>
          <p className="text-4xl font-extrabold text-primary">{customer.type}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 w-full text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Wadarta Mashaariicda</h4>
          <p className="text-4xl font-extrabold text-secondary">{customer.projects.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 w-full text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Wadarta Lacagaha La Helay</h4>
          <p className="text-4xl font-extrabold text-accent">${(() => {
            const totalPayments = customer.payments.reduce((sum, p) => sum + p.amount, 0);
            const totalAdvances = (customer.projectDebts || []).reduce((sum, proj) => sum + Number(proj.advancePaid), 0);
            return (totalPayments + totalAdvances).toLocaleString();
          })()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 w-full text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Project Debts</h4>
          <p className="text-4xl font-extrabold text-orange-600">${(customer.projectDebts || []).reduce((sum, proj) => sum + Number(proj.remainingAmount), 0).toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 w-full text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Company Debts</h4>
          <p className="text-4xl font-extrabold text-redError">${(() => {
            // Use transactions table like the Company Debts tab for consistency
            const companyDebtTransactions = (customer.transactions || []).filter(trx =>
              (trx.type === 'DEBT_TAKEN' || trx.type === 'DEBT_REPAID') && !trx.project
            );
            const nonProjectIncomeTransactions = (customer.transactions || []).filter(trx =>
              trx.type === 'INCOME' && !trx.project
            );

            const debtGiven = companyDebtTransactions.filter(trx => trx.type === 'DEBT_TAKEN').reduce((sum, trx) => sum + Number(trx.amount), 0);
            const debtRepaid = companyDebtTransactions.filter(trx => trx.type === 'DEBT_REPAID').reduce((sum, trx) => sum + Number(trx.amount), 0);
            const incomeRepayments = nonProjectIncomeTransactions.reduce((sum, trx) => sum + Number(trx.amount), 0);
            const totalRepaid = debtRepaid + incomeRepayments;
            const netDebt = Math.max(0, debtGiven - totalRepaid);

            console.log('Top Summary Company Debt Debug:', {
              debtGiven,
              debtRepaid,
              incomeRepayments,
              totalRepaid,
              netDebt,
              companyDebtTransactions: companyDebtTransactions.length,
              nonProjectIncomeTransactions: nonProjectIncomeTransactions.length
            });

            return netDebt.toLocaleString();
          })()}</p>
        </div>
      </div>

      {/* Search & Filter Bar - Project Style */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md mb-8 flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-4 animate-fade-in-up">
        <div className="relative w-full lg:flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
          <input type="text" placeholder="Search by project or expense..."
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700/50 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-4">
          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
            <select
              title="Filter by tab"
              className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700/50 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition appearance-none"
              value={activeTab} onChange={(e) => setActiveTab(e.target.value as any)}
            >
              <option value="Overview">Overview</option>
              <option value="Projects">Projects</option>
              <option value="Project Debts">Project Debts</option>
              <option value="Payments">Payments</option>
              <option value="Transactions">Transactions</option>
              <option value="Expenses">Expenses</option>
              <option value="Company Debts">Company Debts</option>
              <option value="Documents">Documents</option>
              <option value="Notes">Notes</option>
            </select>
            <ChevronRight className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 text-mediumGray dark:text-gray-400" size={20} />
          </div>
        </div>
      </div>

      {/* Tabs for Customer Details */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-fade-in-up">
        <div className="border-b border-lightGray dark:border-gray-700 overflow-x-auto">
          <nav className="-mb-px flex space-x-2 sm:space-x-4 md:space-x-6 lg:space-x-8 px-2 sm:px-4 md:px-8" aria-label="Tabs">
            {['Overview', 'Projects', 'Project Debts', 'Payments', 'Transactions', 'Expenses', 'Company Debts', 'Documents', 'Notes'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap py-2 sm:py-3 md:py-4 px-1 sm:px-2 md:px-3 border-b-2 font-medium text-xs sm:text-sm md:text-base lg:text-lg focus:outline-none transition-colors duration-200
                            ${activeTab === tab 
                              ? 'border-primary text-primary dark:text-white' 
                              : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-500'
                            }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-2 sm:p-4 md:p-6 lg:p-8">
          {activeTab === 'Overview' && (
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-darkGray dark:text-gray-100 mb-4">Macluumaadka Guud</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-darkGray dark:text-gray-100">
                <p><span className="font-semibold text-gray-700 dark:text-gray-200">Magaca:</span> {customer.name}</p>
                <p><span className="font-semibold text-gray-700 dark:text-gray-200">Nooca:</span> {customer.type}</p>
                {customer.companyName && <p><span className="font-semibold text-gray-700 dark:text-gray-200">Magaca Shirkadda:</span> {customer.companyName}</p>}
                <p><span className="font-semibold text-gray-700 dark:text-gray-200">Email:</span> {customer.email || 'N/A'}</p>
                <p><span className="font-semibold text-gray-700 dark:text-gray-200">Taleefan:</span> {customer.phone || 'N/A'}</p>
                <p className="md:col-span-2"><span className="font-semibold text-gray-700 dark:text-gray-200">Cinwaan:</span> {customer.address || 'N/A'}</p>
              </div>
            </div>
          )}

          {activeTab === 'Project Debts' && (() => {
            // Calculate totals for Project Debts - use customer.projects as source of truth
            const projectDebts = (customer.projects || []).map(proj => {
              const agreement = Number(proj.agreementAmount || 0);
              const advance = Number(proj.advancePaid || 0);
              const remaining = Math.max(0, agreement - advance);
              
              return {
                id: proj.id,
                name: proj.name,
                status: proj.status,
                agreementAmount: agreement,
                advancePaid: advance,
                remainingAmount: remaining,
              };
            });
            
            const totalAgreement = projectDebts.reduce((sum, proj) => sum + proj.agreementAmount, 0);
            const totalAdvancePaid = projectDebts.reduce((sum, proj) => sum + proj.advancePaid, 0);
            const totalRemaining = projectDebts.reduce((sum, proj) => sum + proj.remainingAmount, 0);
            
            return (
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-darkGray dark:text-gray-100 mb-4">Lacagaha Ku Dhiman Mashaariicda</h3>
                
                {/* Summary Cards - Project Style */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 w-full text-center">
                    <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Heshiiska Guud</h4>
                    <p className="text-4xl font-extrabold text-blue-600">${totalAgreement.toLocaleString()}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 w-full text-center">
                    <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Hore Loo Bixiyay</h4>
                    <p className="text-4xl font-extrabold text-green-600">${totalAdvancePaid.toLocaleString()}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 w-full text-center">
                    <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Ku Dhiman</h4>
                    <p className="text-4xl font-extrabold text-redError">${Math.abs(totalRemaining).toLocaleString()}</p>
                  </div>
                </div>
                
                {projectDebts.length === 0 ? (
                  <p className="text-gray-700 dark:text-gray-200">Ma jiraan mashaariic lacag ku dhiman tahay.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                      <thead>
                        <tr>
                        <th className="px-2 sm:px-3 md:px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Mashruuc</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider hidden sm:table-cell">Status</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider hidden md:table-cell">Heshiis</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Hore Loo Bixiyay</th>
                        <th className="px-2 sm:px-3 md:px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Ku Dhiman</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-lightGray dark:divide-gray-700">
                        {projectDebts.map(proj => (
                          <tr key={proj.id}>
                            <td className="px-2 sm:px-3 md:px-4 py-2"><Link href={`/projects/${proj.id}`} className="text-primary hover:underline text-sm sm:text-base">{proj.name}</Link></td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 text-gray-900 dark:text-gray-100 text-sm sm:text-base hidden sm:table-cell">{proj.status}</td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 text-gray-900 dark:text-gray-100 text-sm sm:text-base hidden md:table-cell">${proj.agreementAmount.toLocaleString()}</td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 text-gray-900 dark:text-gray-100 text-sm sm:text-base">${proj.advancePaid.toLocaleString()}</td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 font-bold text-redError text-sm sm:text-base">${proj.remainingAmount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

          {activeTab === 'Company Debts' && (() => {
            // Get company debt transactions (DEBT_TAKEN and DEBT_REPAID)
            const companyDebtTransactions = (customer.transactions || []).filter(trx => 
              (trx.type === 'DEBT_TAKEN' || trx.type === 'DEBT_REPAID') && !trx.project
            );
            
            // Also get non-project INCOME transactions as they might be debt repayments
            const nonProjectIncomeTransactions = (customer.transactions || []).filter(trx => 
              trx.type === 'INCOME' && !trx.project
            );
            
            // Calculate totals properly from transactions
            const debtGiven = companyDebtTransactions.filter(trx => trx.type === 'DEBT_TAKEN').reduce((sum, trx) => sum + Number(trx.amount), 0);
            const debtRepaid = companyDebtTransactions.filter(trx => trx.type === 'DEBT_REPAID').reduce((sum, trx) => sum + Number(trx.amount), 0);
            const incomeRepayments = nonProjectIncomeTransactions.reduce((sum, trx) => sum + Number(trx.amount), 0);
            const totalRepaid = debtRepaid + incomeRepayments;
            const netDebt = Math.max(0, debtGiven - totalRepaid); // Ensure debt is not negative
            
            // Debug information
            console.log('Company Debt Debug:', {
              totalTransactions: companyDebtTransactions.length,
              debtGiven,
              debtRepaid,
              incomeRepayments,
              totalRepaid,
              netDebt,
              debtTransactions: companyDebtTransactions.map(trx => ({
                type: trx.type,
                amount: trx.amount,
                description: trx.description
              })),
              incomeTransactions: nonProjectIncomeTransactions.map(trx => ({
                type: trx.type,
                amount: trx.amount,
                description: trx.description
              }))
            });
            
            return (
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-darkGray dark:text-gray-100 mb-4">Daymaha Shirkadda ee Macmiilkan</h3>
                
                {/* Summary Cards - Project Style */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 w-full text-center">
                    <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Lacagta La Siiyay</h4>
                    <p className="text-4xl font-extrabold text-red-600">${debtGiven.toLocaleString()}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 w-full text-center">
                    <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Lacagta Laso Celiyay</h4>
                    <p className="text-4xl font-extrabold text-green-600">${totalRepaid.toLocaleString()}</p>
                    {incomeRepayments > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        (DEBT_REPAID: ${debtRepaid.toLocaleString()}, INCOME: ${incomeRepayments.toLocaleString()})
                      </p>
                    )}
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 w-full text-center">
                    <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">
                      {netDebt > 0 ? 'Dayn Hadhay' : debtRepaid > debtGiven ? 'Lacagta Ka Badan' : 'Ma Jiro Dayn'}
                    </h4>
                    <p className={`text-4xl font-extrabold ${netDebt > 0 ? 'text-redError' : debtRepaid > debtGiven ? 'text-blue-600' : 'text-green-600'}`}>
                      ${netDebt.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {(companyDebtTransactions.length === 0 && nonProjectIncomeTransactions.length === 0) ? (
                  <p className="text-gray-700 dark:text-gray-200">Ma jiro dayn shirkadeed oo la diiwaangeliyay.</p>
                ) : (
                  <div className="overflow-x-auto -mx-2 sm:-mx-4 md:-mx-6 lg:-mx-8">
                    <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                      <thead>
                        <tr>
                          <th className="px-2 sm:px-3 md:px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">NOOCA</th>
                          <th className="px-2 sm:px-3 md:px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">LACAG</th>
                          <th className="px-2 sm:px-3 md:px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider hidden sm:table-cell">TAARIIKH</th>
                          <th className="px-2 sm:px-3 md:px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider hidden md:table-cell">FIIRO</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-lightGray dark:divide-gray-700">
                        {[...companyDebtTransactions, ...nonProjectIncomeTransactions].map((debt) => (
                          <tr key={debt.id}>
                            <td className="px-2 sm:px-3 md:px-4 py-2 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                debt.type === 'DEBT_TAKEN' 
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200' 
                                  : debt.type === 'DEBT_REPAID'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
                              }`}>
                                {debt.type === 'DEBT_TAKEN' ? 'Dayn La Siiyay' : 
                                 debt.type === 'DEBT_REPAID' ? 'Dayn La Soo Celiyay' : 
                                 'Lacag La Helay'}
                              </span>
                            </td>
                            <td className={`px-2 sm:px-3 md:px-4 py-2 whitespace-nowrap font-bold text-sm sm:text-base ${
                              debt.type === 'DEBT_TAKEN' ? 'text-red-600' : 
                              debt.type === 'DEBT_REPAID' ? 'text-green-600' : 'text-blue-600'
                            }`}>
                              {debt.type === 'DEBT_TAKEN' ? '-' : '+'}${Math.abs(Number(debt.amount)).toLocaleString()}
                            </td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100 text-sm sm:text-base hidden sm:table-cell">{debt.transactionDate ? new Date(debt.transactionDate).toLocaleDateString() : ''}</td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100 text-sm sm:text-base hidden md:table-cell">{debt.note || debt.description || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

          {activeTab === 'Projects' && (
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-darkGray dark:text-gray-100 mb-4">Mashaariicda Macmiilka</h3>
              {customer.projects.length === 0 ? (
                <p className="text-gray-700 dark:text-gray-200">Macmiilkan ma laha mashaariic loo diiwaan geliyay.</p>
              ) : (
                <div className="overflow-x-auto -mx-2 sm:-mx-4 md:-mx-6 lg:-mx-8">
                  <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Mashruuc</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Status</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Heshiis</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Hore Loo Bixiyay</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-lightGray dark:divide-gray-700">
                      {customer.projects.map(proj => (
                        <tr key={proj.id}>
                          <td className="px-2 py-2"><Link href={`/projects/${proj.id}`} className="text-primary hover:underline">{proj.name}</Link></td>
                          <td className="px-2 py-2 text-gray-900 dark:text-gray-100">{proj.status}</td>
                          <td className="px-2 py-2 text-gray-900 dark:text-gray-100">${proj.agreementAmount?.toLocaleString?.() ?? '0'}</td>
                          <td className="px-2 py-2 text-gray-900 dark:text-gray-100">${proj.advancePaid?.toLocaleString?.() ?? '0'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Link href={`/projects/add?customerId=${customer.id}`} className="mt-4 bg-secondary text-white py-2 px-4 rounded-lg flex items-center hover:bg-green-600 transition duration-200 w-fit">
                  <Plus size={18} className="mr-2"/> Ku Dar Mashruuc
              </Link>
            </div>
          )}

          {activeTab === 'Payments' && (
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-darkGray dark:text-gray-100 mb-4">Lacagaha La Helay</h3>
              {customer.payments.length === 0 ? (
                <p className="text-gray-700 dark:text-gray-200">Ma jiraan lacago laga helay macmiilkan.</p>
              ) : (
                <div className="overflow-x-auto -mx-2 sm:-mx-4 md:-mx-6 lg:-mx-8">
                  <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Nooca</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Lacag</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Taariikh</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Mashruuc</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-lightGray dark:divide-gray-700">
                      {customer.payments.map(pay => (
                        <tr key={pay.id}>
                          <td className="px-2 py-2">{pay.paymentType}</td>
                          <td className="px-2 py-2 text-green-600 font-bold">+${pay.amount.toLocaleString()}</td>
                          <td className="px-2 py-2">{new Date(pay.paymentDate).toLocaleDateString()}</td>
                          <td className="px-2 py-2">{pay.projectId ? <Link href={`/projects/${pay.projectId}`} className="text-primary hover:underline">Eeg Mashruuc</Link> : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <button className="mt-4 bg-primary text-white py-2 px-4 rounded-lg flex items-center hover:bg-blue-700 transition duration-200 w-fit">
                  <Plus size={18} className="mr-2"/> Diiwaan Geli Lacag
              </button>
            </div>
          )}

          {activeTab === 'Transactions' && (
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-darkGray dark:text-gray-100 mb-4">Dhaqdhaqaaqa Lacagta</h3>
              
              {/* Summary Cards for Transactions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-400">Total Income</p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                        ${(customer.transactions || [])
                          .filter(t => t.type === 'INCOME' || t.type === 'DEBT_REPAID')
                          .reduce((sum, t) => sum + Math.abs(t.amount), 0)
                          .toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="text-green-600 dark:text-green-400" size={24} />
                  </div>
                </div>
                
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 dark:text-red-400">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                        ${(customer.transactions || [])
                          .filter(t => t.type === 'EXPENSE')
                          .reduce((sum, t) => sum + Math.abs(t.amount), 0)
                          .toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="text-red-600 dark:text-red-400" size={24} />
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 dark:text-blue-400">Net Balance</p>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        ${(customer.transactions || [])
                          .reduce((sum, t) => {
                            if (t.type === 'INCOME' || t.type === 'DEBT_REPAID') {
                              return sum + Math.abs(t.amount);
                            } else if (t.type === 'EXPENSE') {
                              return sum - Math.abs(t.amount);
                            }
                            return sum;
                          }, 0)
                          .toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="text-blue-600 dark:text-blue-400" size={24} />
                  </div>
                </div>
              </div>

              {customer.transactions.length === 0 ? (
                <div className="text-center py-8">
                  <FileX2 className="mx-auto text-gray-400 dark:text-gray-500" size={48} />
                  <p className="text-gray-700 dark:text-gray-200 mt-2">Ma jiraan dhaqdhaqaaq lacag ah oo la xiriira macmiilkan.</p>
                  <Link 
                    href="/accounting/transactions/add" 
                    className="mt-4 inline-flex items-center gap-2 bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <Plus size={18} />
                    Ku Dar Dhaqdhaqaaq Lacagta
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-2 sm:-mx-4 md:-mx-6 lg:-mx-8">
                  <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                    <thead className="bg-lightGray dark:bg-gray-700">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Sharaxaad</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Nooca</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Lacag</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Taariikh</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Mashruuc</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Fiiro</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-lightGray dark:divide-gray-700">
                      {customer.transactions.map(trx => (
                        <tr key={trx.id} className="hover:bg-lightGray/50 dark:hover:bg-gray-700/50">
                            <td className="px-2 py-2 text-gray-900 dark:text-gray-100">{trx.description}</td>
                            <td className="px-2 py-2 text-gray-900 dark:text-gray-100">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                trx.type === 'INCOME' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                                trx.type === 'EXPENSE' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                                trx.type === 'DEBT_REPAID' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                              }`}>
                                {trx.type}
                              </span>
                            </td>
                            <td className={`px-2 py-2 font-bold ${
                              trx.type === 'DEBT_REPAID' || trx.type === 'INCOME' ? 'text-secondary' : 'text-redError'
                            }`}>
                              {trx.type === 'DEBT_REPAID' || trx.type === 'INCOME' ? '+' : '-'}${Math.abs(trx.amount).toLocaleString()}
                            </td>
                            <td className="px-2 py-2 text-gray-900 dark:text-gray-100">{new Date(trx.transactionDate).toLocaleDateString()}</td>
                            <td className="px-2 py-2 text-gray-900 dark:text-gray-100">{trx.project?.name || '-'}</td>
                            <td className="px-2 py-2 text-gray-900 dark:text-gray-100">{trx.note || '-'}</td>
                            <td className="px-2 py-2 text-gray-900 dark:text-gray-100">
                              <div className="flex items-center gap-2">
                                <Link 
                                  href={`/accounting/transactions/${trx.id}`}
                                  className="text-primary hover:text-primary/80 transition-colors"
                                  title="View Transaction"
                                >
                                  <Eye size={16} />
                                </Link>
                                <Link 
                                  href={`/accounting/transactions/edit/${trx.id}`}
                                  className="text-accent hover:text-accent/80 transition-colors"
                                  title="Edit Transaction"
                                >
                                  <Edit size={16} />
                                </Link>
                              </div>
                            </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Expenses' && (
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-darkGray dark:text-gray-100 mb-4">Kharashaadka Macmiilka</h3>
              {(() => {
                // Ka saar company debts
                const filteredExpenses = (customer.expenses || []).filter(exp => {
                  // Waa in aanan ahayn company debt
                  if (
                    exp.category === 'Company Expense' &&
                    ['Debt', 'Debt Repayment'].includes(exp.subCategory || '') &&
                    !exp.projectId
                  ) {
                    return false;
                  }
                  return true;
                });
                if (filteredExpenses.length === 0) {
                  return <p className="text-gray-700 dark:text-gray-200">Ma jiraan kharashaad la xiriira macmiilkan.</p>;
                }
                return (
                  <div className="overflow-x-auto -mx-2 sm:-mx-4 md:-mx-6 lg:-mx-8">
                    <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                      <thead>
                        <tr>
                          <th className="px-2 sm:px-3 md:px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Sharaxaad</th>
                          <th className="px-2 sm:px-3 md:px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider hidden sm:table-cell">Account</th>
                          <th className="px-2 sm:px-3 md:px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">Lacag</th>
                          <th className="px-2 sm:px-3 md:px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider hidden md:table-cell">Taariikh</th>
                          <th className="px-2 sm:px-3 md:px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider hidden lg:table-cell">Mashruuc</th>
                          <th className="px-2 sm:px-3 md:px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider hidden lg:table-cell">Fiiro</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-lightGray dark:divide-gray-700">
                        {filteredExpenses.map(exp => (
                          <tr key={exp.id}>
                            <td className="px-2 sm:px-3 md:px-4 py-2 text-gray-900 dark:text-gray-100 text-sm sm:text-base">{exp.category}{exp.subCategory ? ` / ${exp.subCategory}` : ''}</td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 text-gray-900 dark:text-gray-100 text-sm sm:text-base hidden sm:table-cell">{exp.accountName || exp.paidFrom || '-'}</td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 font-bold text-redError text-sm sm:text-base">-${exp.amount.toLocaleString()}</td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 text-gray-900 dark:text-gray-100 text-sm sm:text-base hidden md:table-cell">{new Date(exp.expenseDate).toLocaleDateString()}</td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 text-gray-900 dark:text-gray-100 text-sm sm:text-base hidden lg:table-cell">{exp.project?.name || '-'}</td>
                            <td className="px-2 sm:px-3 md:px-4 py-2 text-gray-900 dark:text-gray-100 text-sm sm:text-base hidden lg:table-cell">{exp.note || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'Notes' && (
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-darkGray dark:text-gray-100 mb-4">Fiiro Gaar Ah</h3>
              {customer.notes ? (
                <p className="text-gray-700 dark:text-gray-200 p-3 bg-lightGray dark:bg-gray-700 rounded-lg">{customer.notes}</p>
              ) : (
                <p className="text-gray-700 dark:text-gray-200">Ma jiraan fiiro gaar ah oo loo diiwaan geliyay macmiilkan.</p>
              )}
              <button className="mt-4 bg-accent text-white py-2 px-4 rounded-lg flex items-center hover:bg-orange-600 transition duration-200 w-fit">
                  <Edit size={18} className="mr-2"/> Wax ka Beddel Fiiro Gaar Ah
              </button>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'Documents' && (
            <div className="p-4 sm:p-6 md:p-8">
              <h3 className="text-xl md:text-2xl font-bold text-darkGray dark:text-gray-100 mb-4">Dukumentiyada Macmiilkan</h3>
              
              {/* Filter expenses with receipt images */}
              {(() => {
                const expensesWithReceipts = (customer.expenses || []).filter(exp => exp.receiptUrl);
                
                if (expensesWithReceipts.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <FileX2 className="mx-auto text-gray-400 dark:text-gray-500" size={48} />
                      <p className="text-gray-700 dark:text-gray-200 mt-2">Ma jiraan dukumentiyo oo la xiriira macmiilkan.</p>
                      <Link 
                        href="/expenses/add" 
                        className="mt-4 inline-flex items-center gap-2 bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                      >
                        <Plus size={18} />
                        Ku Dar Kharash + Rasiid
                      </Link>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {expensesWithReceipts.map((expense) => (
                      <div key={expense.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                        <div className="mb-3">
                          <h4 className="font-semibold text-darkGray dark:text-gray-100">{expense.note || '-'}</h4>
                          <p className="text-sm text-mediumGray dark:text-gray-400">${expense.amount.toLocaleString()}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {new Date(expense.expenseDate).toLocaleDateString()}
                          </p>
                          {expense.project && (
                            <p className="text-xs text-blue-600 dark:text-blue-400">Project: {expense.project.name}</p>
                          )}
                        </div>
                        
                        {expense.receiptUrl && (
                          <div className="mb-3">
                            <img 
                              src={expense.receiptUrl} 
                              alt={`Receipt for ${expense.note || '-'}`}
                              className="w-full h-32 object-cover rounded-lg border border-lightGray dark:border-gray-700"
                              onClick={() => window.open(expense.receiptUrl, '_blank')}
                              style={{ cursor: 'pointer' }}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Click to view full size</p>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            expense.category === 'Material' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200' :
                            expense.category === 'Labor' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
                            expense.category === 'Company Expense' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
                          }`}>
                            {expense.category}
                          </span>
                          <button 
                            onClick={() => window.open(expense.receiptUrl, '_blank')}
                            className="text-primary hover:text-blue-700 text-sm font-medium"
                          >
                            View Receipt
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

        </div>
      </div>
      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
};

export default CustomerDetailsPage;