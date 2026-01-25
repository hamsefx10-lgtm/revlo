import React from 'react';
import { ProjectReportsData } from './types';
import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, Wallet } from 'lucide-react';

interface ReportsSummaryStatsProps {
    summary: ProjectReportsData['summary'];
}

export const ReportsSummaryStats: React.FC<ReportsSummaryStatsProps> = ({ summary }) => {
    const cards = [
        {
            title: 'Wadarta Dakhliga',
            value: summary.totalRevenue,
            type: 'currency',
            icon: DollarSign,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            border: 'border-emerald-100 dark:border-emerald-800',
        },
        {
            title: 'Wadarta Kharashyada',
            value: summary.totalExpenses,
            type: 'currency',
            icon: Wallet,
            color: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-50 dark:bg-rose-900/20',
            border: 'border-rose-100 dark:border-rose-800',
        },
        {
            title: "Wadarta Faa'iidada",
            value: summary.totalProfit,
            type: 'currency',
            icon: TrendingUp,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-100 dark:border-blue-800',
        },
        {
            title: 'Faa\'iidada Dhexe',
            value: `${summary.averageProfitMargin.toFixed(2)}%`,
            type: 'text',
            icon: summary.averageProfitMargin >= 0 ? ArrowUpRight : ArrowDownRight,
            color: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-50 dark:bg-indigo-900/20',
            border: 'border-indigo-100 dark:border-indigo-800',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 print:grid-cols-4">
            {cards.map((card, index) => (
                <div
                    key={index}
                    className={`relative p-5 rounded-2xl border ${card.border} ${card.bg} transition-all duration-200 hover:shadow-sm`}
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className={`p-2.5 rounded-xl bg-white dark:bg-black/20 ${card.color}`}>
                            <card.icon size={20} className="" />
                        </div>
                        {/* Optional decorative element */}
                        <div className={`w-16 h-16 absolute -right-2 -top-2 rounded-full opacity-5 ${card.color.replace('text-', 'bg-')}`} />
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{card.title}</p>
                        <h3 className={`text-2xl font-bold tracking-tight ${card.color}`}>
                            {card.type === 'currency' && typeof card.value === 'number'
                                ? card.value.toLocaleString()
                                : card.value}
                            {card.type === 'currency' && <span className="text-xs font-semibold ml-1 opacity-70">ETB</span>}
                        </h3>
                    </div>
                </div>
            ))}
        </div>
    );
};
