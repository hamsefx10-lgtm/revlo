'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SuperAdminSidebar from '@/components/admin/SuperAdminSidebar';
import { 
  Users, 
  Building2, 
  CreditCard, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const SUPER_ADMIN_ID = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID;
    
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if ((session?.user as any)?.id !== SUPER_ADMIN_ID) {
        router.push('/shop/dashboard'); // Redirect unauthorized users
      } else {
        fetchDashboardData();
      }
    }
  }, [status, session]);

  const fetchDashboardData = async () => {
    try {
      const SUPER_ADMIN_ID = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID;
      if ((session?.user as any)?.id !== SUPER_ADMIN_ID) return;

      const res = await fetch('/api/admin/super-stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRecentRequests(data.recentRequests);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-[#0F1623]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0F1623] text-gray-900 dark:text-gray-100">
      <SuperAdminSidebar />
      
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-10">
            <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Central Command</h1>
            <p className="text-sm font-bold text-gray-500">Welcome back, Super Admin. Here is what's happening across Revlo.</p>
          </header>

          {/* STATS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatCard 
              title="Total Shops" 
              value={stats?.totalCompanies || 0} 
              icon={Building2} 
              color="blue"
              trend="+12% this month"
              isUp={true}
            />
            <StatCard 
              title="Total Revenue" 
              value={`ETB ${(stats?.totalRevenue || 0).toLocaleString()}`} 
              icon={TrendingUp} 
              color="emerald"
              trend="+24% vs last month"
              isUp={true}
            />
            <StatCard 
              title="Pending Payments" 
              value={stats?.pendingRequests || 0} 
              icon={CreditCard} 
              color="orange"
              trend={`${stats?.pendingRequests || 0} needing review`}
              isUp={false}
            />
            <StatCard 
              title="Active Users" 
              value={stats?.totalUsers || 0} 
              icon={Users} 
              color="purple"
              trend="98% system uptime"
              isUp={true}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* PENDING REQUESTS TABLE */}
            <div className="lg:col-span-2 bg-white dark:bg-[#151C2C] rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <h3 className="font-black text-xs uppercase tracking-widest text-gray-400">Recent Payment Requests</h3>
                <button 
                  onClick={() => router.push('/admin/super-dashboard/payments')}
                  className="text-[10px] font-black uppercase text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                >
                  View All <ChevronRight size={12} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-[#0F1623]">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Company</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Package</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Amount</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {recentRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-xs font-black">{req.company.name}</p>
                          <p className="text-[10px] text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase tracking-widest">
                            {(req.requestData as any).packageName}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-black">ETB {(req.requestData as any).amount.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={req.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => router.push('/admin/super-dashboard/payments')}
                            className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-red-500 transition-colors"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {recentRequests.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-xs font-bold text-gray-400 italic">
                          No pending requests at the moment.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SIDEBAR: SYSTEM HEALTH */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-red-500 to-orange-600 rounded-[24px] p-6 text-white shadow-lg shadow-red-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle size={24} />
                  <h4 className="font-black uppercase tracking-tighter">System Alert</h4>
                </div>
                <p className="text-xs font-bold text-red-50 opacity-90 leading-relaxed">
                  There are {stats?.pendingRequests || 0} payment requests waiting for approval. Approve them to grant users their AI credits.
                </p>
                <button 
                  onClick={() => router.push('/admin/super-dashboard/payments')}
                  className="mt-6 w-full py-3 bg-white text-red-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-50 transition-colors shadow-lg"
                >
                  Process Now
                </button>
              </div>

              <div className="bg-white dark:bg-[#151C2C] rounded-[24px] border border-gray-100 dark:border-gray-800 p-6">
                <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-400 mb-6">Recent Activity</h4>
                <div className="space-y-6">
                  <ActivityItem 
                    icon={CheckCircle2} 
                    color="emerald" 
                    title="Payment Approved" 
                    desc="Business Package for Sahay Store"
                    time="2h ago"
                  />
                  <ActivityItem 
                    icon={Building2} 
                    color="blue" 
                    title="New Shop Joined" 
                    desc="Galkacyo Electronics"
                    time="5h ago"
                  />
                  <ActivityItem 
                    icon={Clock} 
                    color="orange" 
                    title="Pending Request" 
                    desc="Starter Package for Ahmed Cafe"
                    time="8h ago"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend, isUp }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-500 dark:bg-blue-900/20',
    emerald: 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20',
    orange: 'bg-orange-50 text-orange-500 dark:bg-orange-900/20',
    purple: 'bg-purple-50 text-purple-500 dark:bg-purple-900/20',
  };

  return (
    <div className="bg-white dark:bg-[#151C2C] p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm transition-transform hover:-translate-y-1 duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${colors[color]}`}>
          <Icon size={24} />
        </div>
        <div className={`flex items-center gap-0.5 text-[10px] font-black uppercase ${isUp ? 'text-emerald-500' : 'text-orange-500'}`}>
          {isUp ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
          {trend}
        </div>
      </div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-2xl font-black tracking-tighter">{value}</h3>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'PENDING') return (
    <span className="px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 text-[8px] font-black uppercase tracking-widest">Pending</span>
  );
  if (status === 'APPROVED') return (
    <span className="px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 text-[8px] font-black uppercase tracking-widest">Approved</span>
  );
  return (
    <span className="px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 text-[8px] font-black uppercase tracking-widest">{status}</span>
  );
}

function ActivityItem({ icon: Icon, color, title, desc, time }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-500 dark:bg-blue-900/20',
    emerald: 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20',
    orange: 'bg-orange-50 text-orange-500 dark:bg-orange-900/20',
  };

  return (
    <div className="flex gap-4">
      <div className={`p-2 rounded-xl shrink-0 ${colors[color]}`}>
        <Icon size={16} />
      </div>
      <div>
        <h5 className="text-xs font-black">{title}</h5>
        <p className="text-[10px] font-medium text-gray-500 mb-1">{desc}</p>
        <p className="text-[8px] font-black text-gray-400 uppercase">{time}</p>
      </div>
    </div>
  );
}
