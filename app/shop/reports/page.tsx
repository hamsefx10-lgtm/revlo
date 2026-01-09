'use client';

import React from 'react';
import {
    BarChart3,
    PieChart,
    LineChart,
    TrendingUp,
    Package,
    Users,
    Wallet,
    Calendar,
    FileText,
    ChevronRight,
    ArrowUpRight
} from 'lucide-react';
import UltraIcon from '@/components/shop/ui/UltraIcon';

const ReportCard = ({ title, desc, icon: Icon, color }: { title: string, desc: string, icon: any, color: 'blue' | 'green' | 'orange' | 'purple' | 'red' }) => {

    // Convert generic colors to project-specific specific colors if needed
    const colorMap = {
        blue: "#3498DB",
        green: "#2ECC71",
        orange: "#F39C12",
        purple: "#9B59B6",
        red: "#E74C3C"
    };

    const activeColor = colorMap[color];

    return (
        <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer relative overflow-hidden h-full flex flex-col">

            <div className="mb-6">
                <UltraIcon icon={Icon} color={activeColor} />
            </div>

            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 line-clamp-1">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 flex-1">{desc}</p>

            <div className="flex items-center text-sm font-bold text-gray-400 group-hover:text-[#3498DB] transition-colors mt-auto">
                Generate Report <ChevronRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
            </div>

            {/* Hover Glow Effect */}
            <div className="absolute top-0 right-0 p-20 bg-gradient-to-br from-white/0 to-gray-50/0 group-hover:from-white/0 group-hover:to-gray-50/50 dark:group-hover:to-white/5 transition-all duration-500 rounded-bl-full pointer-events-none" />
        </div>
    );
};

export default function ReportsPage() {
    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-[#3498DB]">
                            <BarChart3 size={28} />
                        </div>
                        Business Reports
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">Gain insights into your business performance.</p>
                </div>
            </div>

            {/* SALES REPORTS */}
            <div className="mb-10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <div className="w-1 h-6 bg-[#3498DB] rounded-full"></div>
                    Sales & Revenue
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <ReportCard
                        title="Daily Sales Report"
                        desc="Detailed breakdown of sales by day, payment method, and cashier performance."
                        icon={Calendar}
                        color="blue"
                    />
                    <ReportCard
                        title="Top Selling Products"
                        desc="Identify your best performers and slow-moving items to optimize stock."
                        icon={TrendingUp}
                        color="green"

                    />
                    <ReportCard
                        title="Sales by Category"
                        desc="Understand which product categories drive the most revenue for your shop."
                        icon={PieChart}
                        color="purple"
                    />
                    <ReportCard
                        title="Customer Insights"
                        desc="Analyze customer spending habits, frequency, and retention rates."
                        icon={Users}
                        color="orange"
                    />
                </div>
            </div>

            {/* INVENTORY & FINANCE */}
            <div className="mb-10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <div className="w-1 h-6 bg-[#F39C12] rounded-full"></div>
                    Inventory & Finance
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <ReportCard
                        title="Inventory Valuation"
                        desc="Current value of stock on hand based on cost price vs retail price."
                        icon={Package}
                        color="orange"
                    />
                    <ReportCard
                        title="Low Stock Report"
                        desc="List of items below minimum threshold needing immediate reorder."
                        icon={FileText}
                        color="blue"
                    />
                    <ReportCard
                        title="Profit & Loss"
                        desc="Comprehensive financial statement of income vs expenses for any period."
                        icon={LineChart}
                        color="green"
                    />
                    <ReportCard
                        title="Expense Breakdown"
                        desc="Detailed analysis of operational costs, overheads, and miscellaneous expenses."
                        icon={Wallet}
                        color="purple"
                    />
                </div>
            </div>

            {/* ACTIONS */}
            <div className="bg-gradient-to-br from-[#3498DB]/10 to-[#2980B9]/5 border border-[#3498DB]/10 rounded-3xl p-10 text-center relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-2xl font-black text-[#3498DB] mb-3">Need a Custom Report?</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-lg mx-auto font-medium">We can generate specific reports tailored to your business needs using our advanced data engine.</p>
                    <button className="px-8 py-3.5 bg-[#3498DB] hover:bg-[#2980B9] text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 mx-auto">
                        Open Report Builder <ArrowUpRight size={18} />
                    </button>
                </div>

                {/* Background pattern */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-[-50%] left-[-10%] w-[500px] h-[500px] bg-[#3498DB] rounded-full blur-[120px]"></div>
                </div>
            </div>

        </div>
    );
}
