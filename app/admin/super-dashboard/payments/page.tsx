'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SuperAdminSidebar from '@/components/admin/SuperAdminSidebar';
import { 
  CreditCard, 
  Check, 
  X, 
  Search, 
  Filter, 
  Loader2, 
  Building2, 
  User, 
  Clock,
  ExternalLink,
  Wallet,
  AlertTriangle
} from 'lucide-react';

export default function PaymentRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');

  useEffect(() => {
    const SUPER_ADMIN_ID = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID;
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if ((session?.user as any)?.id !== SUPER_ADMIN_ID) {
        router.push('/shop/dashboard');
      } else {
        fetchRequests();
      }
    }
  }, [status]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payment-requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    if (!confirm(`Are you sure you want to ${action.toLowerCase()} this request?`)) return;
    
    setProcessingId(requestId);
    try {
      const res = await fetch('/api/admin/approve-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action })
      });
      
      if (res.ok) {
        fetchRequests(); // Refresh list
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error processing action:', error);
      alert('Internal server error');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.company.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          req.requestData.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (status === 'loading') return null;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0F1623]">
      <SuperAdminSidebar />
      
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-10 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Payment Verifications</h1>
              <p className="text-sm font-bold text-gray-500">Review and approve manual payment proofs submitted by shop owners.</p>
            </div>
            <div className="flex items-center gap-3">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search by Company or Ref..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#151C2C] text-xs font-bold focus:ring-2 focus:ring-red-500 outline-none w-64"
                  />
               </div>
               <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#151C2C] text-xs font-black uppercase focus:ring-2 focus:ring-red-500 outline-none"
               >
                 <option value="PENDING">Pending Only</option>
                 <option value="APPROVED">Approved</option>
                 <option value="REJECTED">Rejected</option>
                 <option value="ALL">All Status</option>
               </select>
            </div>
          </header>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-red-500" size={40} />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredRequests.map((req) => (
                <div key={req.id} className="bg-white dark:bg-[#151C2C] rounded-[24px] border border-gray-100 dark:border-gray-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    <div className={`p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 ${req.status === 'PENDING' ? 'text-orange-500' : req.status === 'APPROVED' ? 'text-emerald-500' : 'text-red-500'}`}>
                      <Wallet size={32} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-black text-lg tracking-tight">{req.company.name}</h3>
                        <StatusBadge status={req.status} />
                      </div>
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4">
                        <p className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          <User size={12} /> {req.requestedBy.fullName}
                        </p>
                        <p className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          <Clock size={12} /> {new Date(req.createdAt).toLocaleString()}
                        </p>
                        <p className="flex items-center gap-1.5 text-[10px] font-black text-red-500 uppercase tracking-widest">
                          <CreditCard size={12} /> {(req.requestData as any).packageName}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 px-6 py-4 bg-gray-50 dark:bg-[#0F1623] rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Amount</p>
                      <p className="text-sm font-black">ETB {(req.requestData as any).amount.toLocaleString()}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-800" />
                    <div className="text-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Credits</p>
                      <p className="text-sm font-black text-emerald-500">+{(req.requestData as any).credits}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-800" />
                    <div className="text-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Method</p>
                      <p className="text-xs font-black uppercase text-blue-500">{(req.requestData as any).paymentMethod}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="bg-white dark:bg-[#151C2C] border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl">
                      <p className="text-[8px] font-black text-gray-400 uppercase mb-0.5">Reference / TXN ID</p>
                      <p className="text-xs font-mono font-black tracking-widest select-all">{(req.requestData as any).reference}</p>
                    </div>
                    
                    {req.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAction(req.id, 'APPROVE')}
                          disabled={!!processingId}
                          className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                        >
                          {processingId === req.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                          Approve
                        </button>
                        <button 
                          onClick={() => handleAction(req.id, 'REJECT')}
                          disabled={!!processingId}
                          className="flex items-center justify-center p-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 text-red-500 rounded-xl transition-all"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {filteredRequests.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#151C2C] rounded-[32px] border border-dashed border-gray-200 dark:border-gray-800">
                  <AlertTriangle size={48} className="text-gray-300 mb-4" />
                  <p className="text-sm font-bold text-gray-400">No payment requests found for the selected filter.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'PENDING') return (
    <span className="px-2 py-0.5 rounded-lg bg-orange-100 dark:bg-orange-900/20 text-orange-600 text-[8px] font-black uppercase tracking-widest">Pending</span>
  );
  if (status === 'APPROVED') return (
    <span className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 text-[8px] font-black uppercase tracking-widest">Approved</span>
  );
  return (
    <span className="px-2 py-0.5 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 text-[8px] font-black uppercase tracking-widest">{status}</span>
  );
}
