// app/customers/payments/page.tsx - Customer Payment Management Page
'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../../../components/layouts/Layout';
import { 
  Plus, Search, Eye, Edit, Trash2, DollarSign, User, Calendar, 
  CheckCircle, Clock, AlertTriangle, Building, Briefcase
} from 'lucide-react';
import Toast from '../../../components/common/Toast';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface Project {
  id: string;
  name: string;
  agreementAmount: number;
  advancePaid: number;
  remainingAmount: number;
  status: string;
}

interface Payment {
  id: string;
  amount: number;
  transactionDate: string;
  description: string;
  account: { name: string };
  project?: { name: string };
  customer: { name: string };
  user: { fullName: string };
}

interface DebtSummary {
  totalDebt: number;
  totalPaid: number;
  remainingDebt: number;
  isFullyPaid: boolean;
}

export default function CustomerPaymentsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [debtSummary, setDebtSummary] = useState<DebtSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    customerId: '',
    projectId: '',
    amount: '',
    paymentMethod: 'Cash',
    accountId: '',
    notes: '',
    paymentDate: new Date().toISOString().split('T')[0]
  });

  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    fetchCustomers();
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerPayments();
      fetchProjectsForCustomer();
    }
  }, [selectedCustomer, selectedProject]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounting/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchProjectsForCustomer = async () => {
    if (!selectedCustomer) return;
    
    try {
      const res = await fetch(`/api/projects?customerId=${selectedCustomer}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchCustomerPayments = async () => {
    if (!selectedCustomer) return;
    
    setLoading(true);
    try {
      const url = `/api/customers/payments?customerId=${selectedCustomer}${selectedProject ? `&projectId=${selectedProject}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
        setDebtSummary(data.debtSummary || null);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentForm.customerId || !paymentForm.amount || !paymentForm.accountId) {
      setToastMessage({ message: 'Fadlan buuxi dhammaan beeraha waajibka ah.', type: 'error' });
      return;
    }

    try {
      const res = await fetch('/api/customers/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm)
      });

      const data = await res.json();
      
      if (res.ok) {
        setToastMessage({ message: data.message, type: 'success' });
        setShowPaymentForm(false);
        setPaymentForm({
          customerId: '',
          projectId: '',
          amount: '',
          paymentMethod: 'Cash',
          accountId: '',
          notes: '',
          paymentDate: new Date().toISOString().split('T')[0]
        });
        fetchCustomerPayments();
        
        // Notify customer pages about payment creation for real-time updates
        if (paymentForm.customerId) {
          localStorage.setItem('transactionCreated', JSON.stringify({
            customerId: paymentForm.customerId,
            type: 'DEBT_REPAID',
            amount: paymentForm.amount,
            timestamp: Date.now()
          }));
          // Trigger storage event for same-tab listeners
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'transactionCreated',
            newValue: JSON.stringify({
              customerId: paymentForm.customerId,
              type: 'DEBT_REPAID',
              amount: paymentForm.amount,
              timestamp: Date.now()
            })
          }));

          // Notify about project payment if it's related to a project
          if (paymentForm.projectId) {
            localStorage.setItem('projectPaymentMade', JSON.stringify({
              customerId: paymentForm.customerId,
              projectId: paymentForm.projectId,
              type: 'DEBT_REPAID',
              amount: paymentForm.amount,
              timestamp: Date.now()
            }));
            // Trigger storage event for same-tab listeners
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'projectPaymentMade',
              newValue: JSON.stringify({
                customerId: paymentForm.customerId,
                projectId: paymentForm.projectId,
                type: 'DEBT_REPAID',
                amount: paymentForm.amount,
                timestamp: Date.now()
              })
            }));
          }

          // Notify about debt repayment specifically
          localStorage.setItem('debtRepaymentMade', JSON.stringify({
            customerId: paymentForm.customerId,
            projectId: paymentForm.projectId,
            type: 'DEBT_REPAID',
            amount: paymentForm.amount,
            timestamp: Date.now()
          }));
          // Trigger storage event for same-tab listeners
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'debtRepaymentMade',
            newValue: JSON.stringify({
              customerId: paymentForm.customerId,
              projectId: paymentForm.projectId,
              type: 'DEBT_REPAID',
              amount: paymentForm.amount,
              timestamp: Date.now()
            })
          }));

          // Also notify about project payment creation for project pages
          if (paymentForm.projectId) {
            localStorage.setItem('projectPaymentCreated', JSON.stringify({
              customerId: paymentForm.customerId,
              projectId: paymentForm.projectId,
              type: 'DEBT_REPAID',
              amount: paymentForm.amount,
              timestamp: Date.now()
            }));
            // Trigger storage event for same-tab listeners
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'projectPaymentCreated',
              newValue: JSON.stringify({
                customerId: paymentForm.customerId,
                projectId: paymentForm.projectId,
                type: 'DEBT_REPAID',
                amount: paymentForm.amount,
                timestamp: Date.now()
              })
            }));
          }
        }
      } else {
        setToastMessage({ message: data.message, type: 'error' });
      }
    } catch (error) {
      setToastMessage({ message: 'Cilad ayaa dhacday marka lacagta la diiwaan gelinayay.', type: 'error' });
    }
  };

  const selectedCustomerData = customers.find(c => c.id === selectedCustomer);
  const selectedProjectData = projects.find(p => p.id === selectedProject);

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-darkGray dark:text-gray-100 mb-2">
            Lacagaha Macaamiisha
          </h1>
          <p className="text-mediumGray dark:text-gray-400">
            Maamul iyo eegid lacagaha laga helay macaamiisha
          </p>
        </div>
        <button
          onClick={() => setShowPaymentForm(true)}
          className="bg-primary text-white px-4 lg:px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 flex items-center justify-center w-full lg:w-auto"
        >
          <Plus size={20} className="mr-2" />
          Ku Dar Lacag Cusub
        </button>
      </div>

      {/* Customer & Project Selection */}
      <div className="bg-white dark:bg-gray-800 p-4 lg:p-6 rounded-xl shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-2">
              Dooro Macmiil
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => {
                setSelectedCustomer(e.target.value);
                setSelectedProject('');
              }}
              className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Dooro macmiil...</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          
          {selectedCustomer && (
            <div>
              <label className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-2">
                Dooro Mashruuc (Ikhtiyaari)
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Dhammaan mashaariicda</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name} - ${project.remainingAmount.toLocaleString()} remaining
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Debt Summary */}
      {debtSummary && selectedCustomer && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border-l-4 border-redError">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-mediumGray dark:text-gray-400">Wadarta Deynta</p>
                <p className="text-2xl font-bold text-darkGray dark:text-gray-100">
                  ${debtSummary.totalDebt.toLocaleString()}
                </p>
              </div>
              <AlertTriangle className="text-redError" size={24} />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border-l-4 border-secondary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-mediumGray dark:text-gray-400">Lacagta la Helay</p>
                <p className="text-2xl font-bold text-darkGray dark:text-gray-100">
                  ${debtSummary.totalPaid.toLocaleString()}
                </p>
              </div>
              <CheckCircle className="text-secondary" size={24} />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border-l-4 border-primary">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-mediumGray dark:text-gray-400">Deynta Hadhay</p>
                <p className="text-2xl font-bold text-darkGray dark:text-gray-100">
                  ${debtSummary.remainingDebt.toLocaleString()}
                </p>
              </div>
              <Clock className="text-primary" size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Payments List */}
      {selectedCustomer && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-lightGray dark:border-gray-700">
            <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100">
              Taariikhda Lacagaha - {selectedCustomerData?.name}
              {selectedProjectData && ` - ${selectedProjectData.name}`}
            </h3>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-mediumGray dark:text-gray-400">Soo raridda lacagaha...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center">
              <DollarSign size={48} className="mx-auto text-mediumGray dark:text-gray-500 mb-4" />
              <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-2">
                Lacag Lama Helin
              </h3>
              <p className="text-mediumGray dark:text-gray-400">
                Macmiilkan wali lacag lama diiwaan gelin.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-lightGray dark:bg-gray-700">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase">
                      Taariikh
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase">
                      Mashruuc
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase">
                      Sharaxaad
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-mediumGray dark:text-gray-400 uppercase">
                      Qiimaha
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase">
                      Akoon
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-mediumGray dark:text-gray-400 uppercase">
                      Diiwaan Geliye
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-lightGray/50 dark:hover:bg-gray-700/50">
                      <td className="px-4 lg:px-6 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-darkGray dark:text-gray-100">
                          {new Date(payment.transactionDate).toLocaleDateString('so-SO')}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          {payment.project ? (
                            <Briefcase size={16} className="text-primary mr-2" />
                          ) : (
                            <Building size={16} className="text-orange-500 mr-2" />
                          )}
                          <span className="text-sm text-darkGray dark:text-gray-100">
                            {payment.project?.name || 'Lacag Guud'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3">
                        <div className="text-sm text-darkGray dark:text-gray-100 max-w-xs truncate">
                          {payment.description}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 whitespace-nowrap text-right">
                        <span className="text-lg font-bold text-secondary">
                          +${payment.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-3 whitespace-nowrap">
                        <span className="text-sm text-darkGray dark:text-gray-100">
                          {payment.account.name}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-3 whitespace-nowrap">
                        <span className="text-sm text-mediumGray dark:text-gray-400">
                          {payment.user.fullName}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-4">
                Ku Dar Lacag Cusub
              </h3>
              
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-2">
                    Macmiil *
                  </label>
                  <select
                    value={paymentForm.customerId}
                    onChange={(e) => setPaymentForm({...paymentForm, customerId: e.target.value})}
                    required
                    className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Dooro macmiil...</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-2">
                    Mashruuc (Ikhtiyaari)
                  </label>
                  <select
                    value={paymentForm.projectId}
                    onChange={(e) => setPaymentForm({...paymentForm, projectId: e.target.value})}
                    className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Dooro mashruuc...</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name} - ${project.remainingAmount.toLocaleString()} remaining
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-2">
                    Qiimaha *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                    required
                    className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-2">
                    Akoon *
                  </label>
                  <select
                    value={paymentForm.accountId}
                    onChange={(e) => setPaymentForm({...paymentForm, accountId: e.target.value})}
                    required
                    className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Dooro akoon...</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name} - ${account.balance.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-2">
                    Taariikhda Lacagta
                  </label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({...paymentForm, paymentDate: e.target.value})}
                    className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-2">
                    Qoraal
                  </label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                    rows={3}
                    className="w-full p-3 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Qoraal dheeraad ah..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-primary text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition duration-200"
                  >
                    Ku Dar Lacagta
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(false)}
                    className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-600 transition duration-200"
                  >
                    Jooji
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <Toast 
          message={toastMessage.message} 
          type={toastMessage.type} 
          onClose={() => setToastMessage(null)} 
        />
      )}
    </Layout>
  );
}
