'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/layouts/Layout';
import Link from 'next/link';
import { 
  ArrowLeft, Users, MousePointerClick, Smartphone, Monitor, Globe, 
  Activity, Calendar, Clock, MapPin, Eye, RefreshCw
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

interface AnalyticsData {
  totalVisitors: number;
  totalPageVisits: number;
  activeUsers: number;
  deviceStats: Record<string, number>;
  countryStats: Record<string, number>;
  osStats: Record<string, number>;
  browserStats: Record<string, number>;
  recentVisits: any[];
}

const COLORS = ['#3498DB', '#9B59B6', '#E74C3C', '#2ECC71', '#F1C40F', '#34495E'];

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatChartData = (obj: Record<string, number>) => {
    return Object.entries(obj).map(([name, value]) => ({ name, value }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center text-primary flex-col gap-4">
           <RefreshCw className="animate-spin" size={48} />
           <p className="text-xl font-semibold">Uruurinta xogta dadka...</p>
        </div>
      </Layout>
    );
  }

  if (!data) return <Layout><div>Error loading analytics</div></Layout>;

  const deviceData = formatChartData(data.deviceStats);
  const osData = formatChartData(data.osStats);
  const countryData = formatChartData(data.countryStats);

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold text-darkGray dark:text-gray-100 flex items-center">
          <Link href="/admin" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
            <ArrowLeft size={32} />
          </Link>
          <Activity className="mr-3 text-primary" size={40} />
          Audience & Traffic
        </h1>
        <button onClick={fetchAnalytics} className="bg-primary/10 text-primary p-3 rounded-lg hover:bg-primary hover:text-white transition group flex items-center gap-2 font-semibold">
          <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
          Refresh Data
        </button>
      </div>

      {/* Top Value Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 flex flex-col justify-between to-blue-600 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 font-medium">Booqdayaasha (Unique)</p>
              <h3 className="text-4xl font-extrabold mt-1">{data.totalVisitors.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Users size={28} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 flex flex-col justify-between to-purple-600 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-purple-100 font-medium">Page Views</p>
              <h3 className="text-4xl font-extrabold mt-1">{data.totalPageVisits.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Eye size={28} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 flex flex-col justify-between to-green-600 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-green-100 font-medium">Active Accounts</p>
              <h3 className="text-4xl font-extrabold mt-1">{data.activeUsers.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <UserCheck size={28} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 flex flex-col justify-between to-orange-600 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-orange-100 font-medium">Top Country</p>
              <h3 className="text-3xl font-extrabold mt-1 truncate">
                {countryData.sort((a,b)=>b.value-a.value)[0]?.name || 'N/A'}
              </h3>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Globe size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Device Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
           <h3 className="text-xl font-bold text-darkGray dark:text-gray-100 mb-6 flex items-center gap-2">
             <Smartphone className="text-primary"/> Devices & Computers
           </h3>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={deviceData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                   {deviceData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip formatter={(value) => [`${value} Users`, 'Tirada']} />
                 <Legend />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* OS Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
           <h3 className="text-xl font-bold text-darkGray dark:text-gray-100 mb-6 flex items-center gap-2">
             <Monitor className="text-purple-500"/> Operating Systems
           </h3>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={osData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} />
                 <YAxis axisLine={false} tickLine={false} />
                 <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}} />
                 <Bar dataKey="value" fill="#9B59B6" radius={[4, 4, 0, 0]} barSize={40} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Recent Visits Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
           <h3 className="text-xl font-bold text-darkGray dark:text-gray-100 flex items-center gap-2">
             <MousePointerClick className="text-success" /> Live Actions / Recent Pages
           </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50 text-mediumGray dark:text-gray-400 text-sm">
                <th className="p-4 font-semibold uppercase">Dadka (User/Guest)</th>
                <th className="p-4 font-semibold uppercase">Bogga (Page)</th>
                <th className="p-4 font-semibold uppercase">Goobta (Location)</th>
                <th className="p-4 font-semibold uppercase">Waqtiga (Time)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {data.recentVisits.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">Weli wax xog ah lama diiwaangelin.</td>
                </tr>
              )}
              {data.recentVisits.map((visit: any) => (
                <tr key={visit.id} className="hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${visit.user ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                        {visit.user ? <Users size={16}/> : <Eye size={16}/>}
                      </div>
                      <div>
                        <p className="font-semibold text-darkGray dark:text-gray-100">{visit.user ? visit.user.fullName : 'Guest Visitor'}</p>
                        {visit.user && <p className="text-xs text-mediumGray">{visit.user.email}</p>}
                        {!visit.user && <p className="text-xs text-mediumGray font-mono">{visit.visitor?.fingerprint.substring(0,8)}...</p>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-sm text-primary max-w-[200px] truncate" title={visit.path}>
                    {visit.path}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-mediumGray dark:text-gray-300">
                      <MapPin size={14} /> 
                      {visit.visitor?.city && visit.visitor?.country ? `${visit.visitor.city}, ${visit.visitor.country}` : 'Unknown'}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-mediumGray dark:text-gray-400">
                    {new Date(visit.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

// Ensure UserCheck is imported if needed, reusing lucide.
import { UserCheck } from 'lucide-react';
