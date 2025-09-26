// app/accounting/reports/payment-schedule/page.tsx - Payment Schedule Report Page (10000% Design - API Integration)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '../../../../components/layouts/Layout';
import { 
  ArrowLeft, Plus, Search, Filter, Calendar, List, LayoutGrid, 
  DollarSign, CreditCard, Banknote, RefreshCw, Eye, Edit, Trash2,
  TrendingUp, TrendingDown, Info as InfoIcon, CheckCircle, XCircle, Clock as ClockIcon,
  User as UserIcon, Briefcase as BriefcaseIcon, Tag as TagIcon,
  Download, Upload, Mail, MessageSquare, Send, Coins, ChevronRight, Loader2 // For export/share options
} from 'lucide-react';
import Toast from '../../../../components/common/Toast';

// --- Payment Schedule Item Data Interface (Refined for API response) ---
interface PaymentScheduleItem {
  id: string;
  description: string; // e.g., "Client Payment - Project A", "Loan Repayment - Bank X"
  amount: number; // Converted from Decimal
  dueDate: string;
  status: 'Upcoming' | 'Overdue' | 'Paid';
  relatedEntity: { type: 'Project' | 'Customer' | 'Vendor' | 'Loan'; name: string; id: string; }; // e.g., Project A, Client X, Bank X
  lastPaymentDate?: string; // For tracking partial payments or last payment
  paidAmount?: number; // Amount paid so far for this item
  remainingAmount?: number; // Remaining balance for this item
}

// --- Payment Schedule Table Row Component ---
const PaymentScheduleRow: React.FC<{ item: PaymentScheduleItem; onRecordPayment: (id: string) => void; onEdit: (id: string) => void; onDelete: (id: string) => void }> = ({ item, onRecordPayment, onEdit, onDelete }) => {
  let statusClass = '';
  let statusBgClass = '';
  let statusIcon: React.ReactNode;

  switch (item.status) {
    case 'Overdue':
      statusClass = 'text-redError';
      statusBgClass = 'bg-redError/10';
      statusIcon = <XCircle size={16} />;
      break;
    case 'Upcoming':
      statusClass = 'text-primary';
      statusBgClass = 'bg-primary/10';
      statusIcon = <ClockIcon size={16} />;
      break;
    case 'Paid':
      statusClass = 'text-secondary';
      statusBgClass = 'bg-secondary/10';
      statusIcon = <CheckCircle size={16} />;
      break;
    default:
      statusClass = 'text-mediumGray';
      statusBgClass = 'bg-mediumGray/10';
      statusIcon = <InfoIcon size={16} />;
  }

  return (
    <tr className="hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-150 border-b border-lightGray dark:border-gray-700 last:border-b-0">
      <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100">{new Date(item.dueDate).toLocaleDateString()}</td>
      <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{item.description}</td>
      <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300 flex items-center space-x-2">
          {item.relatedEntity.type === 'Project' ? <BriefcaseIcon size={16}/> : item.relatedEntity.type === 'Customer' ? <UserIcon size={16}/> : <TagIcon size={16}/>}
          <Link href={`/${item.relatedEntity.type.toLowerCase()}s/${item.relatedEntity.id}`} className="text-primary hover:underline">
            {item.relatedEntity.name}
          </Link>
      </td>
      <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-semibold text-right">${item.amount.toLocaleString()}</td>
      <td className={`p-4 whitespace-nowrap font-semibold text-right ${item.remainingAmount && item.remainingAmount > 0 ? 'text-redError' : 'text-secondary'}`}>
        {item.remainingAmount ? `$${item.remainingAmount.toLocaleString()}` : 'N/A'}
      </td>
      <td className="p-4 whitespace-nowrap text-center">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center justify-center space-x-1 ${statusClass} ${statusBgClass}`}>
          {statusIcon} <span>{item.status}</span>
        </span>
      </td>
      <td className="p-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end space-x-2">
          {item.status !== 'Paid' && (
            <button onClick={() => onRecordPayment(item.id)} className="p-2 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-colors duration-200" title="Record Payment">
              <Coins size={18} />
            </button>
          )}
          <button onClick={() => onEdit(item.id)} className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Edit Item">
            <Edit size={18} />
          </button>
          <button onClick={() => onDelete(item.id)} className="p-2 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete Item">
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};

// --- Payment Schedule Card Component (for Mobile View) ---
const PaymentScheduleCard: React.FC<{ item: PaymentScheduleItem; onRecordPayment: (id: string) => void; onEdit: (id: string) => void; onDelete: (id: string) => void }> = ({ item, onRecordPayment, onEdit, onDelete }) => {
    let borderColor = 'border-lightGray dark:border-gray-700';
    let statusIcon: React.ReactNode;
    let statusBgClass = ''; // Add this line

    if (item.status === 'Overdue') {
        borderColor = 'border-redError';
        statusIcon = <XCircle size={16} />;
        statusBgClass = 'bg-redError/10'; // Define background class
    } else if (item.status === 'Upcoming') {
        borderColor = 'border-primary';
        statusIcon = <ClockIcon size={16} />;
        statusBgClass = 'bg-primary/10'; // Define background class
    } else if (item.status === 'Paid') {
        borderColor = 'border-secondary';
        statusIcon = <CheckCircle size={16} />;
        statusBgClass = 'bg-secondary/10'; // Define background class
    } else {
        statusIcon = <InfoIcon size={16} />;
        statusBgClass = 'bg-mediumGray/10'; // Define background class
    }

    if (item.status === 'Overdue') {
        borderColor = 'border-redError';
        statusIcon = <XCircle size={16} />;
    } else if (item.status === 'Upcoming') {
        borderColor = 'border-primary';
        statusIcon = <ClockIcon size={16} />;
    } else if (item.status === 'Paid') {
        borderColor = 'border-secondary';
        statusIcon = <CheckCircle size={16} />;
    } else {
        statusIcon = <InfoIcon size={16} />;
    }

    return (
        <div className={`bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md animate-fade-in-up border-l-4 ${borderColor} relative`}>
            <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-darkGray dark:text-gray-100 text-lg flex items-center space-x-2">
                    <DollarSign size={20} className="text-primary"/> <span>{item.description}</span>
                </h4>
                <div className="flex space-x-2 flex-shrink-0">
                    {item.status !== 'Paid' && (
                        <button onClick={() => onRecordPayment(item.id)} className="p-1 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white transition-colors duration-200" title="Record Payment">
                            <Coins size={16} />
                        </button>
                    )}
                    <button onClick={() => onEdit(item.id)} className="p-1 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Edit">
                        <Edit size={16} />
                    </button>
                    <button onClick={() => onDelete(item.id)} className="p-1 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
            <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
                <Calendar size={14}/> <span>Due Date: {new Date(item.dueDate).toLocaleDateString()}</span>
            </p>
            <p className="text-sm text-mediumGray dark:text-gray-400 mb-1 flex items-center space-x-2">
                {item.relatedEntity.type === 'Project' ? <BriefcaseIcon size={14}/> : item.relatedEntity.type === 'Customer' ? <UserIcon size={14}/> : <TagIcon size={14}/>}
                <span>La Xiriira: 
                    <Link href={`/${item.relatedEntity.type.toLowerCase()}s/${item.relatedEntity.id}`} className="text-primary hover:underline ml-1">
                        {item.relatedEntity.name}
                    </Link>
                </span>
            </p>
            <div className={`mt-3 text-2xl font-bold ${item.status === 'Overdue' ? 'text-redError' : 'text-primary'}`}>
                ${item.amount.toLocaleString()}
            </div>
            {item.remainingAmount && item.remainingAmount > 0 && (
                <p className="text-sm text-redError mt-1">Hadhay: ${item.remainingAmount.toLocaleString()}</p>
            )}
            <span className={`mt-2 px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center space-x-1 ${statusBgClass}`}>
                {statusIcon} <span>{item.status}</span>
            </span>
        </div>
    );
};


export default function PaymentSchedulePage() {
  const currency = 'USD';
  const format = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const router = useRouter();
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); // 'Upcoming', 'Overdue', 'Paid'
  const [filterType, setFilterType] = useState('All'); // e.g., 'Project', 'Loan'
  const [filterDateRange, setFilterDateRange] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [pageLoading, setPageLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Dummy filter options (will be fetched from API in real app)
  const paymentStatuses = ['All', 'Upcoming', 'Overdue', 'Paid'];
  // Use entity types for filter (Project, Customer, Vendor, Loan)
  const paymentTypes = ['All', 'Project', 'Customer', 'Vendor', 'Loan'];
  const dateRanges = ['All', 'Today', 'This Week', 'Next 7 Days', 'Last 30 Days', 'This Month', 'This Quarter', 'This Year'];

  // --- API Functions ---
  const fetchPaymentSchedule = async () => {
    setPageLoading(true);
    try {
      const response = await fetch('/api/accounting/reports/payment-schedule'); // Assuming this API exists
      if (!response.ok) throw new Error('Failed to fetch payment schedule');
      const data = await response.json();
      setPaymentSchedule(data.schedule.map((item: any) => ({ ...item, amount: parseFloat(item.amount), paidAmount: parseFloat(item.paidAmount || 0), remainingAmount: parseFloat(item.remainingAmount || 0) })));
    } catch (error: any) {
      console.error('Error fetching payment schedule:', error);
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka jadwalka lacagaha la soo gelinayay.', type: 'error' });
      setPaymentSchedule([]);
    } finally {
      setPageLoading(false);
    }
  };

  const handleRecordPayment = (id: string) => {
    router.push(`/accounting/transactions/add?type=INCOME&relatedPaymentId=${id}`); // Navigate to add transaction for payment
    setToastMessage({ message: `Simulating record payment for ID: ${id}.`, type: 'info' });
  };

  const handleEditItem = (id: string) => {
    // This would depend on the type of payment schedule item (e.g., project payment, loan repayment)
    // For simplicity, we'll navigate to a generic edit page or show a toast.
    setToastMessage({ message: `Simulating edit for payment schedule item ID: ${id}.`, type: 'info' });
    router.push(`/accounting/transactions/edit/${id}`); // Example: edit the transaction itself
  };

  const handleDeleteItem = async (id: string) => {
    if (window.confirm('Ma hubtaa inaad tirtirto diiwaankan? Tan lama soo celin karo!')) {
      try {
        // This would require a DELETE /api/accounting/reports/payment-schedule/[id] or related API
        // For now, simulate deletion
        setPaymentSchedule(prev => prev.filter(item => item.id !== id));
        setToastMessage({ message: 'Diiwaanka si guul leh ayaa loo tirtiray!', type: 'success' });
      } catch (error: any) {
        console.error('Error deleting item:', error);
        setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka diiwaanka la tirtirayay.', type: 'error' });
      }
    }
  };

  useEffect(() => {
    fetchPaymentSchedule();
  }, []);

  const filteredSchedule = paymentSchedule.filter(item => {
    const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.relatedEntity?.name?.toLowerCase?.().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
    const matchesType = filterType === 'All' || item.relatedEntity?.type === filterType;
    const matchesDate = filterDateRange === 'All' ? true : true;
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  // Statistics
  const totalScheduledAmount = filteredSchedule.reduce((sum, item) => sum + item.amount, 0);
  const totalOverdueAmount = filteredSchedule.filter(item => item.status === 'Overdue').reduce((sum, item) => sum + (item.remainingAmount || item.amount), 0);
  const totalUpcomingAmount = filteredSchedule.filter(item => item.status === 'Upcoming').reduce((sum, item) => sum + (item.remainingAmount || item.amount), 0);
  const paidItemsCount = filteredSchedule.filter(item => item.status === 'Paid').length;

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 md:gap-0">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100 flex items-center">
          <Link href="/accounting" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Payment Schedule
        </h1>
        <div className="flex space-x-3">
          <Link href="/accounting/transactions/add?type=INCOME" className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center" title="Diiwaan Geli Lacag">
            <Plus size={20} className="mr-2" /> Diiwaan Geli Lacag
          </Link>
          <button onClick={fetchPaymentSchedule} className="bg-secondary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-green-600 transition duration-200 shadow-md flex items-center" title="Cusboonaysii Jadwalka">
            <RefreshCw size={20} className="mr-2" /> Cusboonaysii
          </button>
        </div>
      </div>

      {/* Payment Schedule Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center flex flex-col items-center">
          <Banknote size={32} className="mb-2 text-primary" />
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Wadarta Jadwalka</h4>
          <p className="text-3xl font-extrabold text-primary">{format(totalScheduledAmount)} <span className="text-gray-500">{currency}</span></p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center flex flex-col items-center">
          <TrendingDown size={32} className="mb-2 text-redError" />
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Deynaha Dib U Dhacay</h4>
          <p className="text-3xl font-extrabold text-redError">{format(totalOverdueAmount)} <span className="text-gray-500">{currency}</span></p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center flex flex-col items-center">
          <TrendingUp size={32} className="mb-2 text-accent" />
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Lacagaha Soo Socda</h4>
          <p className="text-3xl font-extrabold text-accent">{format(totalUpcomingAmount)} <span className="text-gray-500">{currency}</span></p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center flex flex-col items-center">
          <CheckCircle size={32} className="mb-2 text-secondary" />
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Diiwaanada La Bixiyay</h4>
          <p className="text-3xl font-extrabold text-secondary">{paidItemsCount}</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-8 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 animate-fade-in-up">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by description or related entity..."
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Filter by Status */}
        <div className="relative w-full md:w-48">
          <Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
          <select
            title="Filter by Status"
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {paymentStatuses.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
            <ChevronRight className="transform rotate-90" size={20} />
          </div>
        </div>
        {/* Filter by Type */}
        <div className="relative w-full md:w-48">
          <TagIcon size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
          <select
            title="Filter by Type"
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            {paymentTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
            <ChevronRight className="transform rotate-90" size={20} />
          </div>
        </div>
        {/* Filter by Date Range */}
        <div className="relative w-full md:w-48">
          <Calendar size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
          <select
            title="Filter by Date Range"
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none"
            value={filterDateRange}
            onChange={(e) => setFilterDateRange(e.target.value)}
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

      {/* Payment Schedule View */}
      {pageLoading ? (
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} /> Loading Payment Schedule...
        </div>
      ) : filteredSchedule.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center text-mediumGray dark:text-gray-400 animate-fade-in">
          Ma jiraan diiwaan jadwal lacag ah oo la helay.
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
              <thead className="bg-lightGray dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Due Date</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Sharaxaad</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">La Xiriira</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Qiimaha</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Hadhay</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Xaaladda</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                {filteredSchedule.map(item => (
                  <PaymentScheduleRow key={item.id} item={item} onRecordPayment={handleRecordPayment} onEdit={handleEditItem} onDelete={handleDeleteItem} />
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination Placeholder */}
          <div className="p-4 flex justify-between items-center border-t border-lightGray dark:border-gray-700">
              <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Hore</button>
              <span className="text-sm text-darkGray dark:text-gray-100">Page 1 of {Math.ceil(filteredSchedule.length / 10) || 1}</span>
              <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Next</button>
          </div>
        </div>
      ) : ( /* Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {filteredSchedule.map(item => (
                <PaymentScheduleCard key={item.id} item={item} onRecordPayment={handleRecordPayment} onEdit={handleEditItem} onDelete={handleDeleteItem} />
            ))}
        </div>
      )}

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
