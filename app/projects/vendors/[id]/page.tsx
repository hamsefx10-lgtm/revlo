// app/vendors/[id]/page.tsx - Vendor Details Page
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/layouts/Layout';
import {
  ArrowLeft, User as UserIcon, Building, Mail, Phone, MapPin, MessageSquare, Briefcase, DollarSign, Calendar,
  Eye, Edit, Trash2, Loader2, Info as InfoIcon, CheckCircle, CheckCircle2, XCircle, Plus, Tag as TagIcon, ShoppingCart, Package, Printer, Search
} from 'lucide-react';
import Toast from '@/components/common/Toast';
import VendorPaymentModal from '@/components/modals/VendorPaymentModal';

interface Vendor {
  id: string;
  name: string;
  type: string;
  contactPerson?: string;
  phone?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  productsServices?: string;
  notes?: string;
  status?: string;
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
  const [selectedExpenseForPayment, setSelectedExpenseForPayment] = useState<{ id: string; amount: number; description: string; projectId?: string } | undefined>(undefined);

  const fetchVendorDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/vendors/${id}`);
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
        const response = await fetch(`/api/projects/vendors/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete vendor');
        router.push('/projects/vendors');
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
            <Link href="/projects/vendors" className="text-mediumGray hover:text-primary mb-2 inline-flex items-center gap-1">
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
            <Link href={`/shop/purchases/add?vendorId=${vendor.id}`} className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
              <ShoppingCart size={18} /> Purchase Order
            </Link>
            <Link href={`/projects/vendors/edit/${vendor.id}`} className="bg-white border border-gray-300 text-darkGray py-2 px-4 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
              <Edit size={18} /> Edit
            </Link>
            <button onClick={handleDeleteVendor} className="bg-redError/10 text-redError py-2 px-4 rounded-lg hover:bg-redError hover:text-white transition flex items-center gap-2">
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Stats Grid - Premium Glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="relative overflow-hidden bg-white/40 dark:bg-gray-800/40 backdrop-blur-md p-5 rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-xl group transition-all duration-300 hover:translate-y-[-4px]">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShoppingCart size={40} className="text-primary" />
            </div>
            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Wadarta Iibsiga</p>
            <p className="text-2xl font-black text-darkGray dark:text-white">Br{(vendor.summary?.totalPurchases || 0).toLocaleString()}</p>
            <div className="mt-2 h-1 w-12 bg-primary/30 rounded-full"></div>
          </div>

          <div className="relative overflow-hidden bg-white/40 dark:bg-gray-800/40 backdrop-blur-md p-5 rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-xl group transition-all duration-300 hover:translate-y-[-4px]">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Wadarta la Bixiyay</p>
            <p className="text-2xl font-black text-green-600">Br{(vendor.summary?.totalPaid || 0).toLocaleString()}</p>
            <div className="mt-2 h-1 w-12 bg-green-500/30 rounded-full"></div>
          </div>

          <div className="relative overflow-hidden bg-white/40 dark:bg-gray-800/40 backdrop-blur-md p-5 rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-xl group transition-all duration-300 hover:translate-y-[-4px]">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign size={40} className="text-redError" />
            </div>
            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Baaki dhiman (Dayn)</p>
            <p className="text-2xl font-black text-redError">Br{(vendor.summary?.totalUnpaid || 0).toLocaleString()}</p>
            <div className="mt-2 h-1 w-12 bg-red-500/30 rounded-full"></div>
          </div>

          <div className="relative overflow-hidden bg-white/40 dark:bg-gray-800/40 backdrop-blur-md p-5 rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-xl group transition-all duration-300 hover:translate-y-[-4px]">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <InfoIcon size={40} className="text-blue-500" />
            </div>
            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Lacag aan ku leenahay</p>
            <p className="text-2xl font-black text-blue-600">Br{(vendor.summary?.vendorOwesUs || 0).toLocaleString()}</p>
            <div className="mt-2 h-1 w-12 bg-blue-500/30 rounded-full"></div>
          </div>

          <div className={`relative overflow-hidden backdrop-blur-lg p-5 rounded-2xl border-2 shadow-2xl transition-all duration-500 hover:scale-[1.02] ${
            (vendor.status === 'Active' || (vendor.summary?.netBalance || 0) <= 0) 
            ? 'bg-green-50/50 border-green-200/50 dark:bg-green-900/10 dark:border-green-800/20' 
            : 'bg-red-50/50 border-red-200/50 dark:bg-red-900/10 dark:border-red-800/20'
          }`}>
            <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Xaaladda Guud</p>
            <p className={`text-2xl font-black ${(vendor.summary?.netBalance || 0) > 0 ? 'text-redError' : 'text-green-600'}`}>
              Br{Math.abs(vendor.summary?.netBalance || 0).toLocaleString()}
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                (vendor.summary?.netBalance || 0) > 0 ? 'bg-red-500' : 'bg-green-500'
              }`}></div>
              <p className="text-xs font-bold uppercase tracking-tight opacity-70">
                {(vendor.summary?.netBalance || 0) > 0 ? 'Dayn ayaa nagu maqan' : 'Xisaabtu waa nadiif'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs & Content */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/30 overflow-hidden min-h-[600px]">
          <div className="border-b border-gray-100 dark:border-gray-700 px-6 pt-2">
            <nav className="flex space-x-1">
              {[
                { id: 'Overview', label: 'Guud ahaan' },
                { id: 'Transactions', label: 'Dhaqdhaqaaqa' },
                { id: 'Material History', label: 'Alaabta' },
                { id: 'Projects', label: 'Mashaariicda' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 relative font-bold text-sm transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'text-primary'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-4px_10px_rgba(30,64,175,0.3)]"></div>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-8">
            {activeTab === 'Overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                  <div>
                    <h3 className="text-lg font-black text-darkGray dark:text-white mb-6 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Building size={18} />
                      </div>
                      Vendor Profile
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                      {[
                        { label: 'Contact Person', value: vendor.contactPerson, icon: <UserIcon size={14} /> },
                        { label: 'Phone Number', value: vendor.phone || vendor.phoneNumber, icon: <Phone size={14} /> },
                        { label: 'Email Address', value: vendor.email, icon: <Mail size={14} /> },
                        { label: 'Office Address', value: vendor.address, icon: <MapPin size={14} /> }
                      ].map((item, i) => (
                        <div key={i} className="group transition-all">
                          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1 flex items-center gap-1.5">
                            {item.icon} {item.label}
                          </p>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors">
                            {item.value || 'N/A'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4">
                    <h3 className="text-lg font-black text-darkGray dark:text-white mb-6 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                        <MessageSquare size={18} />
                      </div>
                      Business Details
                    </h3>
                    <div className="bg-gray-50/50 dark:bg-gray-900/30 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Core Products & Services</p>
                        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{vendor.productsServices || 'No services listed.'}</p>
                      </div>
                      <div className="pt-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Internal Notes</p>
                        <p className="text-sm italic text-gray-500 dark:text-gray-500">{vendor.notes || 'No private notes.'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-primary/5 dark:bg-primary/10 rounded-3xl p-6 border border-primary/10">
                    <h4 className="font-black text-primary text-sm uppercase tracking-tighter mb-4">Financial Velocity</h4>
                    <div className="space-y-4">
                      {[
                        { label: 'Last Purchase', value: vendor.summary?.lastPurchaseDate ? new Date(vendor.summary.lastPurchaseDate).toLocaleDateString() : 'Never', color: 'text-blue-600' },
                        { label: 'Last Payment', value: vendor.summary?.lastPaymentDate ? new Date(vendor.summary.lastPaymentDate).toLocaleDateString() : 'Never', color: 'text-green-600' },
                        { label: 'Unpaid Items', value: `${vendor.summary?.unpaidCount || 0} Records`, color: 'text-red-500' }
                      ].map((stat, i) => (
                        <div key={i} className="flex justify-between items-center text-xs">
                          <span className="text-gray-400 font-bold uppercase">{stat.label}</span>
                          <span className={`font-black ${stat.color}`}>{stat.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <h4 className="font-black text-gray-400 text-[10px] uppercase tracking-widest mb-4">Quick Analysis</h4>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500" 
                            style={{ width: `${Math.min(100, (vendor.summary?.totalPaid || 0) / (vendor.summary?.totalPurchases || 1) * 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">Payback Progress: {Math.round((vendor.summary?.totalPaid || 0) / (vendor.summary?.totalPurchases || 1) * 100)}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Transactions' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                      <Search size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-darkGray dark:text-white uppercase tracking-tight">Transaction Ledger</h4>
                      <p className="text-[10px] text-gray-400 font-bold">Comprehensive history of all financial activities</p>
                    </div>
                  </div>
                </div>

                {!vendor.transactions || vendor.transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Loader2 size={40} className="mb-4 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-xs">No activity found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-[10px] uppercase tracking-widest text-gray-400 font-black">
                        <tr>
                          <th className="px-6 py-4">Transaction Date</th>
                          <th className="px-4 py-4">Category</th>
                          <th className="px-6 py-4">Description</th>
                          <th className="px-4 py-4">Source Account</th>
                          <th className="px-6 py-4 text-right">Raw Amount</th>
                          <th className="px-6 py-4 text-center">Settlement Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {vendor.transactions.map(trans => {
                          const isMoneyOut = ['EXPENSE', 'DEBT_REPAID', 'MONEY_OUT', 'TRANSFER_OUT'].includes(trans.type);
                          const isDebt = trans.type === 'DEBT_TAKEN';
                          
                          // Clean description: remove the hardcoded dates that look ugly
                          const cleanDescription = (trans.description || '').replace(/\s*-\s*\d{4}-\d{2}-\d{2}/, '');

                          return (
                            <tr key={trans.id} className="hover:bg-primary/[0.02] dark:hover:bg-primary/[0.05] transition-colors group">
                              <td className="px-6 py-5">
                                <p className="font-bold text-gray-700 dark:text-gray-300">{new Date(trans.transactionDate).toLocaleDateString()}</p>
                                <p className="text-[10px] text-gray-400 font-medium">{new Date(trans.transactionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              </td>
                              <td className="px-4 py-5">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                  isMoneyOut ? 'bg-red-50 text-red-600 border border-red-100' :
                                  isDebt ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                                  'bg-green-50 text-green-600 border border-green-100'
                                }`}>
                                  {trans.type === 'EXPENSE' ? 'Direct Purchase' :
                                    trans.type === 'DEBT_REPAID' ? 'Payment' :
                                      trans.type === 'DEBT_TAKEN' ? 'Credit Bill' :
                                        trans.type}
                                </span>
                              </td>
                              <td className="px-6 py-5">
                                <p className="font-semibold text-gray-800 dark:text-gray-200 capitalize">{cleanDescription || 'Alaab aan la magacaabin'}</p>
                                {trans.expense && (
                                  <Link href={`/projects/expenses/${trans.expense.id}`} className="text-[10px] text-primary hover:underline font-bold uppercase inline-flex items-center gap-1 mt-1">
                                    <Eye size={10} /> Track Detail
                                  </Link>
                                )}
                              </td>
                              <td className="px-4 py-5">
                                {trans.account || trans.fromAccount ? (
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${['Bank', 'Investment'].includes(trans.account?.type || '') ? 'bg-blue-500' : 'bg-orange-400'}`}></div>
                                    <p className="font-bold text-xs text-gray-600 dark:text-gray-400">{trans.account?.name || trans.fromAccount?.name}</p>
                                  </div>
                                ) : (
                                  <span className="text-[10px] font-black text-gray-300 uppercase italic">Non-Cash (Credit)</span>
                                )}
                              </td>
                              <td className={`px-6 py-5 text-right font-black ${isMoneyOut ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}>
                                <div className="flex flex-col items-end">
                                  <span>{isMoneyOut ? '↓' : isDebt ? '•' : '↑'} Br{Math.abs(Number(trans.amount)).toLocaleString()}</span>
                                  {trans.expense ? (
                                    <div className="flex flex-col items-end mt-1 space-y-0.5 opacity-90">
                                       <div className="flex gap-2 text-[10px] uppercase font-bold tracking-tighter">
                                          <span className="text-gray-400">Totalka: Br{(trans.expense.amount || 0).toLocaleString()}</span>
                                          <span className="text-green-600">Bixiyay: Br{(trans.expense.paidAmount || 0).toLocaleString()}</span>
                                       </div>
                                       <div className="text-[11px] text-indigo-600 font-black bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-md mt-1 border border-indigo-100 dark:border-indigo-800/30">
                                          Baqi: Br{Math.max(0, (trans.expense.amount || 0) - (trans.expense.paidAmount || 0)).toLocaleString()}
                                       </div>
                                    </div>
                                  ) : (
                                    isDebt && <span className="text-[10px] text-indigo-400/70 font-bold uppercase tracking-tighter">Accountable Debt</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex flex-col items-center justify-center gap-2">
                                  {trans.expense ? (
                                    <>
                                      {trans.expense.paymentStatus === 'PAID' ? (
                                        <div className="flex items-center gap-1.5 text-green-600 font-black text-[10px] uppercase bg-green-50/50 px-2 py-1 rounded-md border border-green-100">
                                          <CheckCircle2 size={12} /> Settled
                                        </div>
                                      ) : (
                                        <div className="flex flex-col items-center gap-2">
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                            trans.expense.paymentStatus === 'PARTIAL' ? 'text-orange-500 bg-orange-50' : 'text-red-500 bg-red-50'
                                          }`}>
                                            {trans.expense.paymentStatus}
                                          </span>
                                          <button
                                              onClick={() => {
                                                const expenseAmount = Number(trans.expense?.amount || 0);
                                                const paidAmount = Number(trans.expense?.paidAmount || 0);
                                                const currentRemaining = expenseAmount > 0 ? Math.max(0, expenseAmount - paidAmount) : Math.abs(trans.amount);

                                                setSelectedExpenseForPayment({
                                                  id: trans.expense!.id,
                                                  amount: currentRemaining,
                                                  description: trans.expense!.description,
                                                  projectId: (trans.expense as any)?.projectId || undefined
                                                });
                                                setIsPaymentModalOpen(true);
                                              }}
                                              className="w-full bg-primary text-white text-[10px] font-black py-1 px-3 rounded-lg hover:bg-blue-700 transition shadow-sm hover:shadow-md active:scale-95"
                                            >
                                              CONFIRM PAY
                                          </button>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-gray-300 italic">-</span>
                                  )}
                                  
                                  {/* WhatsApp Quick Link */}
                                  {['EXPENSE', 'DEBT_REPAID'].includes(trans.type) && (
                                    <div className="flex flex-col items-center gap-1.5 border-t border-gray-50 dark:border-gray-800/50 pt-2 w-full">
                                      <Link
                                        href={`/projects/accounting/transactions/${trans.id}/receipt`}
                                        className="text-[9px] font-bold text-gray-400 hover:text-primary transition-colors flex items-center gap-1 group/wa"
                                      >
                                        <Printer size={10} className="group-hover/wa:scale-110 transition-transform" /> E-Receipt
                                      </Link>
                                      
                                      <button
                                        onClick={async () => {
                                          try {
                                            const res = await fetch(`/api/projects/accounting/transactions/${trans.id}/whatsapp`, { method: 'POST' });
                                            const data = await res.json();
                                            if (data.success) {
                                              setToastMessage({ message: 'Rasidka waxaa loo diray WhatsApp!', type: 'success' });
                                            } else {
                                              setToastMessage({ message: data.error || 'Waa la soo diri waayay', type: 'error' });
                                            }
                                          } catch (error) {
                                            setToastMessage({ message: 'Cilad ayaa dhacday', type: 'error' });
                                          }
                                        }}
                                        className="text-[9px] font-black text-green-500 hover:text-green-700 transition-colors flex items-center gap-1 bg-green-50/30 px-2 py-0.5 rounded-full"
                                      >
                                        <MessageSquare size={10} /> Dir WhatsApp
                                      </button>
                                      
                                      <button
                                        onClick={async () => {
                                          if (!confirm('Ma hubtaa inaad tirtirto dhaqdhaqaaqan? Xisaabtu dib ayay isku xisaabin doontaa.')) return;
                                          try {
                                            const res = await fetch(`/api/projects/accounting/transactions/${trans.id}`, { method: 'DELETE' });
                                            const data = await res.json();
                                            if (res.ok) {
                                              setToastMessage({ message: 'Dhaqdhaqaaqa waa la tirtiray!', type: 'success' });
                                              window.location.reload();
                                            } else {
                                              setToastMessage({ message: data.message || 'Waa la tirtiri waayay', type: 'error' });
                                            }
                                          } catch (error) {
                                            setToastMessage({ message: 'Cilad ayaa dhacday', type: 'error' });
                                          }
                                        }}
                                        className="text-[9px] font-black text-red-400 hover:text-red-600 transition-colors flex items-center gap-1 bg-red-50/10 px-2 py-0.5 rounded-full"
                                      >
                                        <Trash2 size={10} /> Tirtir
                                      </button>
                                    </div>
                                  )}
                                </div>
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

            {activeTab === 'Material History' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-3xl border border-blue-100 dark:border-blue-800/30">
                   <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                     <Package size={24} />
                   </div>
                   <div>
                     <h3 className="text-lg font-black text-darkGray dark:text-white uppercase tracking-tighter">Material Supply Chain</h3>
                     <p className="text-xs text-gray-500 font-bold">List of all items supplied by {vendor.name}</p>
                   </div>
                </div>

                {vendor.materialPurchases.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 font-bold uppercase tracking-widest text-xs">No supply records</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vendor.materialPurchases.map(mat => (
                      <div key={mat.id} className="relative group bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Package size={40} />
                        </div>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-xs font-black text-primary uppercase tracking-widest mb-1">{mat.unit || 'Items'}</p>
                            <h4 className="text-lg font-black text-darkGray dark:text-white">{mat.materialName}</h4>
                          </div>
                          <p className="text-xl font-black text-darkGray dark:text-white">Br{Number(mat.totalPrice).toLocaleString()}</p>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-gray-50 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-xs">
                               {mat.quantity}
                             </div>
                             <span className="text-xs text-gray-400 font-bold uppercase">Volume supplied</span>
                          </div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {new Date(mat.purchaseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Projects' && (
              <div className="space-y-8">
                <div className="max-w-md">
                   <h3 className="text-lg font-black text-darkGray dark:text-white mb-2 flex items-center gap-2 uppercase tracking-tighter">
                     <Briefcase className="text-primary" /> Supported Projects
                   </h3>
                   <p className="text-sm text-gray-400 mb-8">Visualization of projects that rely on this vendor's supplies.</p>
                </div>

                {vendor.summary?.projects && vendor.summary.projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vendor.summary.projects.map((projName, idx) => (
                      <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border-l-4 border-primary shadow-sm hover:translate-x-2 transition-transform cursor-default">
                        <div className="flex justify-between items-center">
                          <div className="space-y-1">
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Active Partner</p>
                            <h4 className="text-md font-black text-darkGray dark:text-white">{projName}</h4>
                          </div>
                          <div className="p-3 bg-primary/10 text-primary rounded-xl">
                            <Briefcase size={20} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 dark:bg-gray-900/30 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800">
                    <Briefcase size={40} className="text-gray-300 mb-4" />
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No project associations found</p>
                  </div>
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
          projectId={selectedExpenseForPayment?.projectId}
        />
      )}
    </Layout>
  );
}
