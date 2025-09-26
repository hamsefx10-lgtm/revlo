// app/accounting/transactions/[id]/page.tsx - Transaction Details Page (10000% Design - API Integration)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation'; // To get transaction ID from URL and for navigation
import Layout from '../../../../components/layouts/Layout';
import { 
  ArrowLeft, DollarSign, Tag as TagIcon, Calendar, MessageSquare, Banknote, Briefcase as BriefcaseIcon,
  Eye, Edit, Trash2, Loader2, Info as InfoIcon, CheckCircle, XCircle, Plus,
  User as UserIcon, Building, Package, Scale, Truck, ReceiptText // Icons for related entities
} from 'lucide-react';
import Toast from '../../../../components/common/Toast'; // Import Toast component

// --- Transaction Data Interface (Refined for API response) ---
interface Transaction {
  id: string;
  description: string;
  amount: number; // Converted from Decimal
  type: string; // e.g., "INCOME", "EXPENSE", "TRANSFER_IN", "TRANSFER_OUT", "DEBT_TAKEN", "DEBT_REPAID"
  transactionDate: string;
  note?: string;
  account?: { id: string; name: string; }; // Primary account details
  fromAccount?: { id: string; name: string; }; // For transfers
  toAccount?: { id: string; name: string; };   // For transfers
  project?: { id: string; name: string; };     // If linked to project
  expense?: { id: string; description: string; }; // If linked to expense
  customer?: { id: string; name: string; };    // If linked to customer
  vendor?: { id: string; name: string; };      // If linked to vendor
  user?: { id: string; fullName: string; };    // Who recorded
  employee?: { id: string; fullName: string; }; // If linked to employee
  createdAt: string;
  updatedAt: string;
}

const TransactionDetailsPage: React.FC = () => {
  const { id } = useParams(); // Get transaction ID from URL
  const router = useRouter(); // For redirection after delete
  const [transaction, setTransaction] = useState<Transaction | null>(null); // State for transaction data
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview'); // For tab navigation
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);


  // --- API Functions ---
  const fetchTransactionDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/accounting/transactions/${id}`);
      if (!response.ok) throw new Error('Failed to fetch transaction details');
      const data = await response.json();
      
      // Convert Decimal fields to Number for frontend display
      const processedTransaction = {
        ...data.transaction,
        amount: parseFloat(data.transaction.amount),
      };
      setTransaction(processedTransaction); 
    } catch (error: any) {
      console.error('Error fetching transaction details:', error);
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka faahfaahinta dhaqdhaqaaqa la soo gelinayay.', type: 'error' });
      setTransaction(null); // Set transaction to null on error
      router.push('/accounting/transactions'); // Redirect if not found or error
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (window.confirm('Ma hubtaa inaad tirtirto dhaqdhaqaaqan lacagta ah? Tan lama soo celin karo!')) {
      try {
        const response = await fetch(`/api/accounting/transactions/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete transaction');
        
        setToastMessage({ message: data.message || 'Dhaqdhaqaaqa lacagta si guul leh ayaa loo tirtiray!', type: 'success' });
        router.push('/accounting/transactions'); // Redirect to transactions list after successful delete
      } catch (error: any) {
        console.error('Error deleting transaction:', error);
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka dhaqdhaqaaqa lacagta la tirtirayay.', type: 'error' });
      }
    }
  };

  useEffect(() => {
    if (id) {
      fetchTransactionDetails(); // Fetch transaction details when ID is available
    }
  }, [id, router]); // Re-fetch if ID changes or router updates

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px] text-darkGray dark:text-gray-100">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} /> Loading Transaction Details...
        </div>
      </Layout>
    );
  }

  if (!transaction) {
    return (
      <Layout>
        <div className="text-center p-8 text-redError bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <InfoIcon size={32} className="inline-block mb-4 text-redError"/>
          <p className="text-xl font-bold">Dhaqdhaqaaqa ID "{id}" lama helin.</p>
          <Link href="/accounting/transactions" className="mt-4 inline-block text-primary hover:underline">Ku Noqo Dhaqdhaqaaqa Lacagta &rarr;</Link>
        </div>
        {toastMessage && (
          <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
        )}
      </Layout>
    );
  }

  const isIncome = transaction.amount >= 0;
  const amountColorClass = isIncome ? 'text-secondary' : 'text-redError';

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/accounting/transactions" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Dhaqdhaqaaqa: {transaction.description}
        </h1>
        <div className="flex space-x-3">
          {/* Link to add similar transaction (if applicable) */}
          <Link href="/accounting/transactions/add" className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center">
            <Plus size={20} className="mr-2" /> Diiwaan Geli Dhaqdhaqaaq
          </Link>
          <Link href={`/accounting/transactions/edit/${transaction.id}`} className="bg-accent text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-orange-600 transition duration-200 shadow-md flex items-center">
            <Edit size={20} className="mr-2" /> Edit Dhaqdhaqaaq
          </Link>
          <button onClick={handleDeleteTransaction} className="bg-redError text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-red-700 transition duration-200 shadow-md flex items-center">
            <Trash2 size={20} className="mr-2" /> Delete
          </button>
        </div>
      </div>

      {/* Transaction Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Nooca Dhaqdhaqaaqa</h4>
          <p className="text-3xl font-extrabold text-primary">{transaction.type}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Qiimaha</h4>
          <p className={`text-3xl font-extrabold ${amountColorClass}`}>{isIncome ? '+' : '-'}${Math.abs(transaction.amount).toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Account-ka</h4>
          <p className="text-3xl font-extrabold text-accent">{transaction.account?.name || 'N/A'}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Taariikhda</h4>
          <p className="text-3xl font-extrabold text-darkGray dark:text-gray-100">{new Date(transaction.transactionDate).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Transaction Details Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-fade-in-up">
        <div className="border-b border-lightGray dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6 md:px-8" aria-label="Tabs">
            {['Overview', 'Related Entities', 'Notes'].map((tab) => (
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
                <p><span className="font-semibold text-mediumGray dark:text-gray-400">Sharaxaad:</span> {transaction.description}</p>
                <p><span className="font-semibold text-mediumGray dark:text-gray-400">Nooca Dhaqdhaqaaqa:</span> {transaction.type}</p>
                <p><span className="font-semibold text-mediumGray dark:text-gray-400">Account-ka Aasaasiga ah:</span> {transaction.account?.name || 'N/A'}</p>
                {transaction.type === 'TRANSFER_IN' || transaction.type === 'TRANSFER_OUT' ? (
                  <>
                    <p><span className="font-semibold text-mediumGray dark:text-gray-400">Laga Wareejiyay:</span> {transaction.fromAccount?.name || 'N/A'}</p>
                    <p><span className="font-semibold text-mediumGray dark:text-gray-400">Loo Wareejiyay:</span> {transaction.toAccount?.name || 'N/A'}</p>
                  </>
                ) : null}
                <p><span className="font-semibold text-mediumGray dark:text-gray-400">Diiwaan Galiyay:</span> {transaction.user?.fullName || 'N/A'}</p>
                <p><span className="font-semibold text-mediumGray dark:text-gray-400">Taariikhda Abuurista:</span> {new Date(transaction.createdAt).toLocaleDateString()}</p>
                <p><span className="font-semibold text-mediumGray dark:text-gray-400">Taariikhda Cusboonaysiinta:</span> {new Date(transaction.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}

          {activeTab === 'Related Entities' && (
            <div>
              <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-4">La Xiriira (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-darkGray dark:text-gray-100">
                <p><span className="font-semibold text-mediumGray dark:text-gray-400">Mashruuc:</span> {transaction.project?.name ? <Link href={`/projects/${transaction.project.id}`} className="text-primary hover:underline">{transaction.project.name}</Link> : 'N/A'}</p>
                <p><span className="font-semibold text-mediumGray dark:text-gray-400">Kharash:</span> {transaction.expense?.description ? <Link href={`/expenses/${transaction.expense.id}`} className="text-primary hover:underline">{transaction.expense.description}</Link> : 'N/A'}</p>
                <p><span className="font-semibold text-mediumGray dark:text-gray-400">Macmiil:</span> {transaction.customer?.name ? <Link href={`/customers/${transaction.customer.id}`} className="text-primary hover:underline">{transaction.customer.name}</Link> : 'N/A'}</p>
                <p><span className="font-semibold text-mediumGray dark:text-gray-400">Iibiye:</span> {transaction.vendor?.name ? <Link href={`/vendors/${transaction.vendor.id}`} className="text-primary hover:underline">{transaction.vendor.name}</Link> : 'N/A'}</p>
                <p><span className="font-semibold text-mediumGray dark:text-gray-400">Shaqaale:</span> {transaction.employee?.fullName ? <Link href={`/employees/${transaction.employee.id}`} className="text-primary hover:underline">{transaction.employee.fullName}</Link> : 'N/A'}</p>
              </div>
            </div>
          )}

          {activeTab === 'Notes' && (
            <div>
              <h3 className="text-2xl font-bold text-darkGray dark:text-gray-100 mb-4">Fiiro Gaar Ah</h3>
              {transaction.note ? (
                <p className="text-mediumGray dark:text-gray-400 p-3 bg-lightGray dark:bg-gray-700 rounded-lg">{transaction.note}</p>
              ) : (
                <p className="text-mediumGray dark:text-gray-400">Ma jiraan fiiro gaar ah oo loo diiwaan geliyay dhaqdhaqaaqan.</p>
              )}
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

export default TransactionDetailsPage;
