// app/vendors/[id]/page.tsx - Vendor Details Page
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Layout from '../../../components/layouts/Layout';
import {
  ArrowLeft, User as UserIcon, Building, Mail, Phone, MapPin, MessageSquare, Briefcase, DollarSign, Calendar,
  Eye, Edit, Trash2, Loader2, Info as InfoIcon, CheckCircle, XCircle, Plus, Tag as TagIcon, ShoppingCart, Package, Printer
} from 'lucide-react';
import Toast from '@/components/common/Toast';
import VendorPaymentModal from '@/components/modals/VendorPaymentModal';

interface Vendor {
  id: string;
  name: string;
  type: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  productsServices?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  purchaseOrders: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    project?: { id: string; name: string };
    expenses?: {
      project?: { id: string; name: string };
    }[];
  }[];
  materialPurchases: {
    id: string;
    materialName: string;
    quantity: number;
    unit: string;
    totalPrice: number;
    purchaseDate: string;
  }[];
  expenses: {
    id: string;
    description: string;
    amount: number;
    category: string;
    expenseDate: string;
    paymentStatus: string;
    paidAmount?: number;
    paidFrom: string;
    project?: { id: string; name: string };
  }[];
  transactions: {
    id: string;
    type: string;
    amount: number;
    description: string;
    transactionDate: string;
    account?: { id: string; name: string; type: string };
    fromAccount?: { id: string; name: string; type: string };
    toAccount?: { id: string; name: string; type: string };
    expense?: {
      id: string;
      description: string;
      paymentStatus: string;
      amount?: number;
      paidAmount?: number;
    };
  }[];
  summary?: {
    totalPurchases: number;
    totalPaid: number;
    totalUnpaid: number;
    vendorOwesUs: number;
    netBalance: number;
    lastPurchaseDate?: string | null;
    lastPaymentDate?: string | null;
    oldestUnpaidDate?: string | null;
    unpaidCount: number;
    projects: string[];
  };
}

export default function VendorDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedExpenseForPayment, setSelectedExpenseForPayment] = useState<{ id: string; amount: number; description: string } | undefined>(undefined);

  const fetchVendorDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/vendors/${id}`);
      if (!response.ok) throw new Error('Failed to fetch vendor details');
      const data = await response.json();
      setVendor(data.vendor);
    } catch (error: any) {
      console.error('Error fetching vendor details:', error);
      setToastMessage({ message: error.message || 'Cilad ayaa dhacday.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVendor = async () => {
    if (window.confirm('Ma hubtaa inaad tirtirto iibiyahan?')) {
      try {
        const response = await fetch(`/api/vendors/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete vendor');
        router.push('/vendors');
      } catch (error: any) {
        setToastMessage({ message: 'Cilad ayaa dhacday.', type: 'error' });
      }
    }
  };

  useEffect(() => {
    if (id) fetchVendorDetails();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="animate-spin mr-3 text-primary" size={32} />
        </div>
      </Layout>
    );
  }

  if (!vendor) return null;

  return (
    <Layout>
      <div className="pb-20 md:pb-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <Link href="/vendors" className="text-mediumGray hover:text-primary mb-2 inline-flex items-center gap-1">
              <ArrowLeft size={16} /> Dib u noqo
            </Link>
            <h1 className="text-3xl font-bold text-darkGray dark:text-white flex items-center gap-3">
              {vendor.name}
              <span className="text-sm font-normal px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                {vendor.type}
              </span>
            </h1>
          </div>
          <div className="flex gap-3">
            <Link href={`/purchases/add?vendorId=${vendor.id}`} className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
              <ShoppingCart size={18} /> Purchase Order
            </Link>
            <Link href={`/vendors/edit/${vendor.id}`} className="bg-white border border-gray-300 text-darkGray py-2 px-4 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
              <Edit size={18} /> Edit
            </Link>
            <button onClick={handleDeleteVendor} className="bg-redError/10 text-redError py-2 px-4 rounded-lg hover:bg-redError hover:text-white transition flex items-center gap-2">
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 mb-1">Total Purchases</p>
            <p className="text-2xl font-bold text-darkGray dark:text-white">Br{(vendor.summary?.totalPurchases || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 mb-1">Total Paid</p>
            <p className="text-2xl font-bold text-green-600">Br{(vendor.summary?.totalPaid || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 mb-1">Balance We Owe</p>
            <p className="text-2xl font-bold text-redError">Br{(vendor.summary?.totalUnpaid || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 mb-1">Vendor Owes Us</p>
            <p className="text-2xl font-bold text-green-600">Br{(vendor.summary?.vendorOwesUs || 0).toLocaleString()}</p>
          </div>
          <div className={`bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border-2 ${(vendor.summary?.netBalance || 0) > 0 ? 'border-red-300' : 'border-green-300'}`}>
            <p className="text-sm text-gray-500 mb-1">Net Balance</p>
            <p className={`text-2xl font-bold ${(vendor.summary?.netBalance || 0) > 0 ? 'text-redError' : 'text-green-600'}`}>
              Br{Math.abs(vendor.summary?.netBalance || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {(vendor.summary?.netBalance || 0) > 0 ? 'We owe vendor' : 'Vendor owes us'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden min-h-[500px]">
          <div className="border-b border-lightGray dark:border-gray-700 px-6">
            <nav className="flex space-x-8">
              {['Overview', 'Transactions', 'Expenses', 'Purchase Orders', 'Material History', 'Projects'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'Overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Building size={20} className="text-gray-400" /> Contact Info
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                      <span className="text-gray-500">Contact Person</span>
                      <span className="font-medium text-darkGray dark:text-white">{vendor.contactPerson || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                      <span className="text-gray-500">Phone</span>
                      <span className="font-medium text-darkGray dark:text-white">{vendor.phone || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                      <span className="text-gray-500">Email</span>
                      <span className="font-medium text-darkGray dark:text-white">{vendor.email || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                      <span className="text-gray-500">Address</span>
                      <span className="font-medium text-darkGray dark:text-white">{vendor.address || '-'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <InfoIcon size={20} className="text-gray-400" /> Additional Info
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-sm text-gray-600 dark:text-gray-300">
                    <p className="font-semibold mb-1">Products/Services:</p>
                    <p className="mb-4">{vendor.productsServices || 'No details provided.'}</p>
                    <p className="font-semibold mb-1">Notes:</p>
                    <p>{vendor.notes || 'No notes.'}</p>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'Transactions' && (
              <div>
                {!vendor.transactions || vendor.transactions.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">No transactions found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 font-medium">
                        <tr>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Description</th>
                          <th className="px-4 py-3">Account</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                          <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {vendor.transactions.map(trans => {
                          const isMoneyOut = ['EXPENSE', 'DEBT_REPAID', 'MONEY_OUT', 'TRANSFER_OUT'].includes(trans.type);
                          const isMoneyIn = ['INCOME', 'DEBT_TAKEN', 'MONEY_IN', 'TRANSFER_IN'].includes(trans.type); // DEBT_TAKEN is money given to customer (out) BUT for vendor it implies we owe them? Wait. 
                          // Vendor context:
                          // DEBT_TAKEN = "Credit Purchase" / "Unpaid Bill". We owe vendor. No money moved yet.
                          // EXPENSE / DEBT_REPAID = We paid vendor. Money moved OUT.

                          // Correct visual logic:
                          // EXPENSE/DEBT_REPAID: Red (Money Out)
                          // DEBT_TAKEN (Credit): Gray/Neutral (Amount matches Expense, but no cash flow). 
                          // But wait, the standard transaction table treats DEBT_TAKEN as 'money in' or 'money out' depending on context?
                          // In app/api/expenses/route.ts:
                          // DEBT_TAKEN for Vendor = "Unpaid". transaction amount is positive.
                          // Let's stick to simple:
                          // If it's a payment (EXPENSE, DEBT_REPAID) -> Red -, "Paid"
                          // If it's accrual (DEBT_TAKEN) -> Blue/Gray, "Credit"

                          return (
                            <tr key={trans.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                {new Date(trans.transactionDate).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isMoneyOut ? 'bg-red-100 text-red-700' :
                                  trans.type === 'DEBT_TAKEN' ? 'bg-blue-100 text-blue-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                  {trans.type === 'EXPENSE' ? 'Expense' :
                                    trans.type === 'DEBT_REPAID' ? 'Payment' :
                                      trans.type === 'DEBT_TAKEN' ? 'Credit/Bill' :
                                        trans.type}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                {trans.description}
                                {trans.expense && (
                                  <Link href={`/expenses/${trans.expense.id}`} className="block text-xs text-primary hover:underline mt-1 flex items-center gap-1">
                                    <Eye size={10} /> View details
                                  </Link>
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                {trans.account?.name || trans.fromAccount?.name || '-'}
                              </td>
                              <td className={`px-4 py-3 text-right font-medium ${isMoneyOut ? 'text-red-600' : 'text-gray-800 dark:text-gray-200'}`}>
                                {isMoneyOut ? '-' : ''}Br{Math.abs(Number(trans.amount)).toLocaleString()}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {trans.expense ? (
                                  trans.expense.paymentStatus === 'PAID' ? (
                                    <span className="inline-flex items-center gap-1 text-green-600 font-medium text-xs bg-green-50 px-2 py-1 rounded-full border border-green-200">
                                      <CheckCircle size={12} /> Paid
                                    </span>
                                  ) : (
                                    <div className="flex flex-col items-center gap-1">
                                      {trans.expense.paymentStatus === 'PARTIAL' && (
                                        <span className="inline-flex items-center gap-1 text-yellow-600 font-medium text-xs bg-yellow-50 px-2 py-1 rounded-full border border-yellow-200">
                                          Partial
                                        </span>
                                      )}
                                      {trans.expense.paymentStatus === 'UNPAID' && (
                                        <span className="inline-flex items-center gap-1 text-red-600 font-medium text-xs bg-red-50 px-2 py-1 rounded-full border border-red-200">
                                          Unpaid
                                        </span>
                                      )}
                                      <div className="flex justify-center gap-2 mt-1">
                                        {/* Show PAY button for Debt Records (DEBT_TAKEN) OR if it's a PARTIAL payment (to pay the remainder) */}
                                        {(trans.type === 'DEBT_TAKEN' || trans.expense?.paymentStatus === 'PARTIAL') && (
                                          <button
                                            onClick={() => {
                                              const expenseAmount = Number(trans.expense?.amount || 0);
                                              const paidAmount = Number(trans.expense?.paidAmount || 0);
                                              const currentRemaining = expenseAmount > 0 ? Math.max(0, expenseAmount - paidAmount) : Math.abs(trans.amount);

                                              setSelectedExpenseForPayment({
                                                id: trans.expense!.id,
                                                amount: currentRemaining,
                                                description: trans.expense!.description
                                              });
                                              setIsPaymentModalOpen(true);
                                            }}
                                            className="text-white bg-primary hover:bg-blue-700 px-3 py-1 rounded text-xs font-medium transition-colors shadow-sm"
                                          >
                                            Pay
                                          </button>
                                        )}
                                        <Link
                                          href={`/expenses/${trans.expense.id}`}
                                          className="text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-xs font-medium transition-colors border border-gray-200"
                                        >
                                          View
                                        </Link>
                                      </div>
                                      {/* Receipt Button for Payments */}
                                      {['EXPENSE', 'DEBT_REPAID'].includes(trans.type) && (
                                        <div className="mt-1 flex justify-center">
                                          <Link
                                            href={`/transactions/${trans.id}/receipt`}
                                            className="text-gray-500 hover:text-primary text-xs flex items-center gap-1"
                                          >
                                            <Printer size={12} /> Receipt
                                          </Link>
                                        </div>
                                      )}
                                    </div>
                                  )
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Expenses' && (
              <div>
                {!vendor.expenses || vendor.expenses.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">No expenses found.</div>
                ) : (
                  <div className="space-y-3">
                    {vendor.expenses.map(expense => (
                      <div key={expense.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-medium text-darkGray dark:text-white">{expense.description}</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${expense.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' :
                              expense.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                              {expense.paymentStatus || 'UNPAID'}
                            </span>
                          </div>
                          <div className="flex gap-4 text-xs text-gray-500">
                            <span>📅 {new Date(expense.expenseDate).toLocaleDateString()}</span>
                            <span>📂 {expense.category}</span>
                            <span>💳 {expense.paidFrom}</span>
                            {expense.project && <span>🎯 {expense.project.name}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-darkGray dark:text-white">Br{Number(expense.amount).toLocaleString()}</p>
                          {(expense.paymentStatus === 'PARTIAL' || expense.paymentStatus === 'UNPAID') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const paidVal = typeof expense.paidAmount === 'number' ? expense.paidAmount : 0;
                                const remaining = Math.max(0, Number(expense.amount) - paidVal);
                                setSelectedExpenseForPayment({
                                  id: expense.id,
                                  amount: remaining,
                                  description: expense.description
                                });
                                setIsPaymentModalOpen(true);
                              }}
                              className="mt-2 text-xs bg-primary text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                            >
                              Pay Remaining
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Purchase Orders' && (
              <div>
                {vendor.purchaseOrders.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">No purchase orders found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 font-medium">
                        <tr>
                          <th className="px-4 py-3">Order #</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Project</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {vendor.purchaseOrders.map(po => (
                          <tr key={po.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-4 py-3 font-medium text-primary">
                              <Link href={`/purchases/${po.id}`}>{po.orderNumber}</Link>
                            </td>
                            <td className="px-4 py-3">{new Date(po.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                              {po.project
                                ? <Link href={`/projects/${po.project.id}`} className="hover:underline">{po.project.name}</Link>
                                : po.expenses?.[0]?.project
                                  ? <Link href={`/projects/${po.expenses[0].project.id}`} className="hover:underline">{po.expenses[0].project.name}</Link>
                                  : '-'
                              }
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${po.status === 'Received' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                {po.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-darkGray dark:text-white">
                              Br{Number(po.totalAmount).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Material History' && (
              <div>
                {vendor.materialPurchases.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">No material purchases found.</div>
                ) : (
                  <ul className="space-y-3">
                    {vendor.materialPurchases.map(mat => (
                      <li key={mat.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                            <Package size={18} />
                          </div>
                          <div>
                            <p className="font-medium text-darkGray dark:text-white">{mat.materialName}</p>
                            <p className="text-xs text-gray-500">{new Date(mat.purchaseDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-darkGray dark:text-white">Br{Number(mat.totalPrice).toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{mat.quantity} {mat.unit}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {activeTab === 'Projects' && (
              <div>
                {vendor.summary?.projects && vendor.summary.projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vendor.summary.projects.map((projName, idx) => (
                      <div key={idx} className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm flex items-center justify-between">
                        <span className="font-medium text-darkGray">{projName}</span>
                        <Briefcase size={16} className="text-gray-400" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400">Currently not associated with any active projects.</div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
      {toastMessage && (
        <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
      )}

      {/* Payment Modal */}
      {vendor && (
        <VendorPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={() => {
            fetchVendorDetails();
            setToastMessage({ message: 'Payment recorded successfully!', type: 'success' });
          }}
          vendorId={vendor.id}
          vendorName={vendor.name}
          expenseId={selectedExpenseForPayment?.id}
          expenseAmount={selectedExpenseForPayment?.amount}
          expenseDescription={selectedExpenseForPayment?.description}
        />
      )}
    </Layout>
  );
}
