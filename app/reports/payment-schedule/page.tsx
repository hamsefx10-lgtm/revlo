// app/reports/payment-schedule/page.tsx - Payment Schedule Report Page (10000% Design)
'use client';

import React from 'react';
import Link from 'next/link';
import Layout from '../../../components/layouts/Layout';
import { 
  ArrowLeft, CreditCard, Plus, Search, Filter, Calendar, List, LayoutGrid, 
  DollarSign, Briefcase, Users, CheckCircle, XCircle, ChevronRight, 
  TrendingUp, TrendingDown, Eye, Edit, Send, MessageSquare, Clock as ClockIcon, Info, Bell, Trash2, Download
} from 'lucide-react';
import Toast from '../../../components/common/Toast'; // Reuse Toast component


import { useEffect, useState } from 'react';

interface Payment {
  id: string;
  dateDue: string;
  project: string;
  client: string;
  amount: number;
  paid: number;
  status: string;
  lastUpdated: string;
}

// --- Payment Row Component ---
const PaymentRow: React.FC<{ payment: Payment; onRecordPayment: (id: string) => void; onSendReminder: (id: string) => void; onDelete: (id: string) => void }> = ({ payment, onRecordPayment, onSendReminder, onDelete }) => {
  const remaining = payment.amount - payment.paid;
  let statusClass = '';
  let statusBgClass = '';
  let statusIcon: React.ReactNode;

  switch (payment.status) {
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
    case 'Partial Paid':
      statusClass = 'text-accent';
      statusBgClass = 'bg-accent/10';
      statusIcon = <CheckCircle size={16} />; // Can be partial check icon
      break;
    case 'Paid':
      statusClass = 'text-secondary';
      statusBgClass = 'bg-secondary/10';
      statusIcon = <CheckCircle size={16} />;
      break;
    default:
      statusClass = 'text-mediumGray';
      statusBgClass = 'bg-mediumGray/10';
      statusIcon = <Info size={16} />;
  }

  return (
    <tr className="hover:bg-lightGray dark:hover:bg-gray-700 transition-colors duration-150 border-b border-lightGray dark:border-gray-700 last:border-b-0">
      <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-medium">{new Date(payment.dateDue).toLocaleDateString()}</td>
      <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{payment.project}</td>
      <td className="p-4 whitespace-nowrap text-mediumGray dark:text-gray-300">{payment.client}</td>
      <td className="p-4 whitespace-nowrap text-darkGray dark:text-gray-100 font-semibold">${payment.amount.toLocaleString()}</td>
      <td className="p-4 whitespace-nowrap text-secondary font-semibold">${payment.paid.toLocaleString()}</td>
      <td className={`p-4 whitespace-nowrap font-semibold ${remaining > 0 ? 'text-redError' : 'text-secondary'}`}>${remaining.toLocaleString()}</td>
      <td className="p-4 whitespace-nowrap">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center justify-center space-x-1 ${statusClass} ${statusBgClass}`}>
          {statusIcon} <span>{payment.status}</span>
        </span>
      </td>
      <td className="p-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end space-x-2">
          {payment.status !== 'Paid' && (
            <button onClick={() => onRecordPayment(payment.id)} className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors duration-200" title="Record Payment">
              <CreditCard size={18} />
            </button>
          )}
          {remaining > 0 && (
            <button onClick={() => onSendReminder(payment.id)} className="p-2 rounded-full bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors duration-200" title="Send Reminder">
              <Bell size={18} />
            </button>
          )}
          <button onClick={() => onDelete(payment.id)} className="p-2 rounded-full bg-redError/10 text-redError hover:bg-redError hover:text-white transition-colors duration-200" title="Delete Payment Record">
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};

// --- Main Payment Schedule Page Component ---

export default function PaymentScheduleReportPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('All');
  const [filterClient, setFilterClient] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDateRange, setFilterDateRange] = useState('All');
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPayments() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/accounting/reports/payment-schedule');
        if (!res.ok) throw new Error('Failed to fetch payment schedule');
        const data = await res.json();
        setPayments(data.payments || data);
      } catch (err: any) {
        setError(err.message || 'Error fetching payment schedule');
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, []);

  // Statistics
  const totalReceivable = payments.filter(p => p.status !== 'Paid').reduce((sum, p) => sum + (p.amount - p.paid), 0);
  const totalOverdue = payments.filter(p => p.status === 'Overdue').reduce((sum, p) => sum + (p.amount - p.paid), 0);
  const upcomingPaymentsCount = payments.filter(p => p.status === 'Upcoming').length;

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          payment.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = filterProject === 'All' || payment.project === filterProject;
    const matchesClient = filterClient === 'All' || payment.client === filterClient;
    const matchesStatus = filterStatus === 'All' || payment.status === filterStatus;
    const matchesDate = filterDateRange === 'All' ? true : true; // Placeholder for date logic
    return matchesSearch && matchesProject && matchesClient && matchesStatus && matchesDate;
  });

  // Filter options
  const projects = ['All', ...payments.map(p => p.project).filter((v, i, a) => a.indexOf(v) === i)];
  const clients = ['All', ...payments.map(p => p.client).filter((v, i, a) => a.indexOf(v) === i)];
  const statuses = ['All', 'Overdue', 'Upcoming', 'Partial Paid', 'Paid'];
  const dateRanges = ['All', 'Today', 'This Week', 'This Month', 'This Quarter', 'This Year'];

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center min-h-[400px] text-darkGray dark:text-gray-100">
        <span className="animate-spin mr-3"><CreditCard size={32} className="text-primary" /></span> Jadwalka lacag-bixinta ayaa soo dhacaya...
      </div>
    </Layout>
  );
  if (error) return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <XCircle size={32} className="mb-2 text-redError" />
        <div className="text-redError text-lg font-bold mb-2">{error}</div>
        <button onClick={() => window.location.reload()} className="bg-primary text-white px-4 py-2 rounded-lg font-semibold mt-2">Reload</button>
      </div>
    </Layout>
  );

  const handleRecordPayment = (id: string) => {
    const paymentToUpdate = payments.find(p => p.id === id);
    if (paymentToUpdate) {
      if (paymentToUpdate.status === 'Paid') {
        setToastMessage({ message: 'Lacagtan horey ayaa loo bixiyay!', type: 'info' }); // Use info type
        return;
      }
      // Simulate recording full payment for simplicity
      setPayments(prev => prev.map(p => p.id === id ? { ...p, paid: p.amount, status: 'Paid' } : p));
      setToastMessage({ message: `Lacagta mashruuca "${paymentToUpdate.project}" si guul leh ayaa loo diiwaan geliyay!`, type: 'success' });
    }
  };

  const handleSendReminder = (id: string) => {
    const payment = payments.find(p => p.id === id);
    if (payment) {
      console.log(`Sending reminder for payment ID: ${id} to client ${payment.client}`);
      setToastMessage({ message: `Xasuusin ayaa loo diray macmiilka "${payment.client}"!`, type: 'success' });
    }
  };

  const handleDeletePayment = (id: string) => {
    if (window.confirm('Ma hubtaa inaad tirtirto diiwaanka lacagtan?')) {
      setPayments(prev => prev.filter(p => p.id !== id));
      setToastMessage({ message: 'Diiwaanka lacagta waa la tirtiray!', type: 'success' });
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
          <Link href="/reports" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={28} className="inline-block" />
          </Link>
          Payment Schedule
        </h1>
        <div className="flex space-x-3">
          <button className="bg-primary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md flex items-center">
            <Plus size={20} className="mr-2" /> Diiwaan Geli Lacag
          </button>
          <button className="bg-secondary text-white py-2.5 px-6 rounded-lg font-bold text-lg hover:bg-green-600 transition duration-200 shadow-md flex items-center">
            <Download size={20} className="mr-2" /> Soo Deji PDF
          </button>
        </div>
      </div>

      {/* Payment Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-fade-in-up">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Wadarta La Sugayo</h4>
          <p className="text-3xl font-extrabold text-primary">${totalReceivable.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Wadarta Dib U Dhacday</h4>
          <p className="text-3xl font-extrabold text-redError">${totalOverdue.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md text-center">
          <h4 className="text-lg font-semibold text-mediumGray dark:text-gray-400">Lacagaha Soo Socda</h4>
          <p className="text-3xl font-extrabold text-secondary">{upcomingPaymentsCount}</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md mb-8 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 animate-fade-in-up">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by project or client..."
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Filter by Project */}
        <div className="relative w-full md:w-48">
          <Briefcase size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
          <select
            title="Filter by Project"
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
          >
            {projects.map(proj => <option key={proj} value={proj}>{proj}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
            <ChevronRight className="transform rotate-90" size={20} />
          </div>
        </div>
        {/* Filter by Client */}
        <div className="relative w-full md:w-48">
          <Users size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" />
          <select
            title="Filter by Client"
            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none"
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
          >
            {clients.map(client => <option key={client} value={client}>{client}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400">
            <ChevronRight className="transform rotate-90" size={20} />
          </div>
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
            {statuses.map(status => <option key={status} value={status}>{status}</option>)}
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
      </div>

      {/* Payment Schedule Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
            <thead className="bg-lightGray dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Taariikhda La Sugayo</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Mashruuc</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Macmiil</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Qiimaha</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">La Bixiyay</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Hadhay</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Xaaladda</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase tracking-wider">Ficillo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lightGray dark:divide-gray-700">
              {filteredPayments.length > 0 ? (
                filteredPayments.map(payment => (
                  <PaymentRow 
                    key={payment.id} 
                    payment={payment} 
                    onRecordPayment={handleRecordPayment} 
                    onSendReminder={handleSendReminder} 
                    onDelete={handleDeletePayment}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-mediumGray dark:text-gray-400">Ma jiraan lacago la sugayo.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Placeholder */}
        <div className="p-4 flex justify-between items-center border-t border-lightGray dark:border-gray-700">
            <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Hore</button>
            <span className="text-sm text-darkGray dark:text-gray-100">Bogga 1 ee {Math.ceil(filteredPayments.length / 10) || 1}</span>
            <button className="text-sm text-mediumGray dark:text-gray-400 hover:text-primary transition">Xiga</button>
        </div>
      </div>

      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}
    </Layout>
  );
}
