// app/manufacturing/page.tsx - Factory OS Dashboard
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Factory,
  Settings,
  Package,
  ClipboardList,
  Users,
  BarChart3,
  TrendingUp,
  Wrench,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  Play,
  RotateCw,
  MoreVertical,
  Search,
  Plus as PlusIcon,
  Filter,
  LayoutGrid,
  List,
  Calendar,
  Zap,
  Box,
  ArrowRight,
  Loader2
} from 'lucide-react';

const KPICard = ({ title, value, subtext, trend, icon: Icon, color }: any) => (
  <div className="bg-white dark:bg-[#1f2937] p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all duration-300">
    <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500 rotate-12 ${color.text}`}>
      <Icon size={120} />
    </div>

    <div className="relative z-10">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-2xl ${color.bg} ${color.text}`}>
          <Icon size={24} />
        </div>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{title}</h3>
      </div>

      <div className="flex items-end gap-3 mb-2">
        <span className="text-4xl font-black text-gray-900 dark:text-white">{value}</span>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded-lg mb-1 flex items-center gap-1 ${trend > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
            {trend > 0 ? <TrendingUp size={12} /> : <TrendingUp size={12} className="rotate-180" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{subtext}</p>
    </div>
  </div>
);

const ProductionStage = ({ title, count, orders, type }: any) => {
  const styles = {
    'heating': 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/10',
    'blowing': 'border-l-[#3498DB] bg-blue-50/50 dark:bg-blue-900/10',
    'qc': 'border-l-purple-500 bg-purple-50/50 dark:bg-purple-900/10',
    'packaging': 'border-l-green-500 bg-green-50/50 dark:bg-green-900/10',
  } as any;

  // Fallback for unknown types (or dynamic ones)
  const styleClass = styles[type?.toLowerCase()] || 'border-l-gray-500 bg-gray-50/50 dark:bg-gray-900/10';

  return (
    <div className={`min-w-[280px] w-full md:w-[320px] shrink-0 flex flex-col h-full rounded-2xl border-l-[6px] ${styleClass} border-y border-r border-gray-100 dark:border-gray-800`}>
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-tr-2xl">
        <h4 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
          {title}
          <span className="text-xs font-bold bg-white dark:bg-gray-700 px-2 py-0.5 rounded-md border border-gray-200 dark:border-gray-600 text-gray-500">
            {count}
          </span>
        </h4>
        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <MoreVertical size={18} />
        </button>
      </div>

      <div className="p-3 space-y-3 overflow-y-auto max-h-[600px] scrollbar-hide">
        {orders.map((order: any) => (
          <div key={order.id} className="bg-white dark:bg-[#1f2937] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md hover:-translate-y-1 transition-all cursor-move group">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#3498DB] mb-1 block">
                  PO-{order.productionOrder?.orderNumber}
                </span>
                <h5 className="font-bold text-gray-900 dark:text-white leading-tight">{order.productionOrder?.productName || order.description}</h5>
              </div>
              <div className={`w-2 h-2 rounded-full ${order.productionOrder?.priority === 'HIGH' ? 'bg-red-500' : 'bg-green-500'}`}></div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
              <Clock size={14} />
              <span className="font-medium">{order.estimatedHours}h Est.</span>
              {order.actualHours && <span className="text-green-600">({order.actualHours}h Act.)</span>}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-50 dark:border-gray-800">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">OP</div>
              </div>
              <Link href={`/manufacturing/production-orders/${order.productionOrderId}`} className="text-xs font-bold text-gray-400 hover:text-[#3498DB] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Details <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <div className="h-24 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-gray-400 text-sm font-medium">
            No Active Tasks
          </div>
        )}
      </div>
    </div>
  );
};

export default function FactoryDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/manufacturing/dashboard')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const totalOrders = data?.totalOrders || 0;
  const activeOrders = data?.activeOrders || 0;
  const lowStock = data?.lowStockCount || 0;

  // Group Work Orders by Stage
  const stages = [
    { title: 'Heating', type: 'heating', orders: [] as any[] },
    { title: 'Blowing', type: 'blowing', orders: [] as any[] },
    { title: 'Quality Check', type: 'qc', orders: [] as any[] },
    { title: 'Packaging', type: 'packaging', orders: [] as any[] }
  ];

  if (data?.activeWorkOrders) {
    data.activeWorkOrders.forEach((wo: any) => {
      const stageName = wo.stage.toLowerCase();
      // Find stage or push to fallback
      const target = stages.find(s => stageName.includes(s.type));
      if (target) {
        target.orders.push(wo);
      } else {
        // Add dynamic stage if not found? Or group into 'Other'?
        // For now, let's assume standard stages or map them.
        if (stageName.includes('heating')) stages[0].orders.push(wo);
        else if (stageName.includes('blow')) stages[1].orders.push(wo);
        else if (stageName.includes('qc') || stageName.includes('quality')) stages[2].orders.push(wo);
        else if (stageName.includes('pack')) stages[3].orders.push(wo);
        // Else ignore or add "Other"
      }
    });
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] font-sans pb-20">
      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-[#3498DB]" size={48} />
          </div>
        ) : (
          <>
            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
              <KPICard
                title="Active Orders"
                value={activeOrders}
                subtext="Currently Running"
                trend={0}
                icon={Factory}
                color={{ bg: 'bg-[#3498DB]/10 dark:bg-blue-900/30', text: 'text-[#3498DB]' }}
              />
              <KPICard
                title="Total Produced"
                value={totalOrders} // Simplification
                subtext="Lifetime Orders"
                trend={0}
                icon={CheckCircle}
                color={{ bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600' }}
              />
              <KPICard
                title="Low Stock Alerts"
                value={lowStock}
                subtext="Materials below min level"
                trend={lowStock > 0 ? -10 : 0} // Negative trend is bad
                icon={AlertTriangle}
                color={{ bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600' }}
              />
              <KPICard
                title="Efficiency"
                value="100%"
                subtext="System Uptime"
                trend={0}
                icon={Zap}
                color={{ bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600' }}
              />
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <Link href="/manufacturing/production-orders" className="whitespace-nowrap px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-200 hover:border-[#3498DB] hover:text-[#3498DB] transition-all flex items-center gap-2">
                  <ClipboardList size={18} /> Manage Production
                </Link>
                <Link href="/manufacturing/inventory" className="whitespace-nowrap px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-200 hover:border-[#3498DB] hover:text-[#3498DB] transition-all flex items-center gap-2">
                  <Package size={18} /> Stock Levels
                </Link>
              </div>

              <div className="flex gap-3">
                <Link href="/manufacturing/production-orders/add" className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
                  <PlusIcon size={18} /> Start New Run
                </Link>
              </div>
            </div>

            {/* Live Production Board (Kanban) */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <RotateCw className="text-[#3498DB] animate-spin-slow" size={24} /> Live Factory Floor
                </h2>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-[#3498DB] rounded-lg text-xs font-bold text-white shadow-lg shadow-blue-500/30">Botlle Lines</button>
                </div>
              </div>

              <div className="flex overflow-x-auto gap-6 pb-6 -mx-6 px-6 scrollbar-hide md:scrollbar-thin">
                {stages.map((stage) => (
                  <ProductionStage
                    key={stage.title}
                    title={stage.title}
                    count={stage.orders.length}
                    orders={stage.orders}
                    type={stage.type}
                  />
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
