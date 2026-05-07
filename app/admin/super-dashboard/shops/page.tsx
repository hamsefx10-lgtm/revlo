'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SuperAdminSidebar from '@/components/admin/SuperAdminSidebar';
import { 
  Building2, 
  Search, 
  Loader2, 
  Calendar,
  CreditCard,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function ManageShopsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const SUPER_ADMIN_ID = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID;
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if ((session?.user as any)?.id !== SUPER_ADMIN_ID) {
        router.push('/shop/dashboard');
      } else {
        fetchShops();
      }
    }
  }, [status]);

  const fetchShops = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/shops');
      if (res.ok) {
        const data = await res.json();
        setShops(data.shops);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredShops = shops.filter(shop => 
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    shop.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === 'loading') return null;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0F1623]">
      <SuperAdminSidebar />
      
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-10 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Registered Shops</h1>
              <p className="text-sm font-bold text-gray-500">Monitor and manage all business accounts on the Revlo platform.</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search shops..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#151C2C] text-xs font-bold focus:ring-2 focus:ring-red-500 outline-none w-64"
              />
            </div>
          </header>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-red-500" size={40} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredShops.map((shop) => (
                <div key={shop.id} className="bg-white dark:bg-[#151C2C] rounded-[32px] border border-gray-100 dark:border-gray-800 p-6 hover:shadow-lg transition-all group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-red-500 transition-colors">
                      <Building2 size={28} />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                      {shop.scanPlan || 'FREE_TRIAL'}
                    </span>
                  </div>

                  <h3 className="text-lg font-black tracking-tight mb-1">{shop.name}</h3>
                  <p className="text-xs font-medium text-gray-500 mb-6">{shop.email || 'No email provided'}</p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 bg-gray-50 dark:bg-[#0F1623] rounded-2xl border border-gray-100 dark:border-gray-800">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Credits</p>
                      <p className="text-sm font-black text-red-500">{shop.scanCredits}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-[#0F1623] rounded-2xl border border-gray-100 dark:border-gray-800">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Used</p>
                      <p className="text-sm font-black text-gray-600 dark:text-gray-400">{shop.scanCreditsUsed}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                      <Calendar size={12} />
                      Joined {new Date(shop.createdAt).toLocaleDateString()}
                    </div>
                    <button className="text-gray-400 hover:text-red-500 transition-colors">
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
