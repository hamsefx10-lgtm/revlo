import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { ProjectReport } from './types';
import { AnimatePresence, motion } from 'framer-motion';

interface ProjectsListProps {
    projects: ProjectReport[];
    visibleProjects: ProjectReport[];
    showDetails: boolean;
    expandedProjects: Set<string>;
    toggleProjectExpansion: (id: string) => void;
    loading: boolean;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Completed': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
        case 'Active': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
        default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    }
};

const cleanDescription = (desc: string) => {
    // Remove " - YYYY-MM-DD" from description if present
    return desc.replace(/\s-\s\d{4}-\d{2}-\d{2}$/, '');
};

const ProjectRow: React.FC<{
    project: ProjectReport;
    isExpanded: boolean;
    onToggle: () => void;
    showDetails: boolean;
}> = ({ project, isExpanded, onToggle, showDetails }) => {
    const [activeTab, setActiveTab] = useState<'expenses' | 'transactions' | 'payments'>('expenses');

    return (
        <div className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30">
            <div
                className="grid grid-cols-12 gap-4 p-4 items-center cursor-pointer"
                onClick={onToggle}
            >
                {/* Project Name & Date */}
                <div className="col-span-3">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{project.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <Clock size={10} />
                        {project.startDate ? new Date(project.startDate).toLocaleDateString('so-SO') : '-'}
                    </div>
                </div>

                {/* Customer */}
                <div className="col-span-2 text-sm text-gray-600 dark:text-gray-300 font-medium truncate">
                    {project.customer}
                </div>

                {/* Status */}
                <div className="col-span-1">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(project.status)}`}>
                        {project.status}
                    </span>
                </div>

                {/* Value */}
                <div className="col-span-2 text-right">
                    <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {project.projectValue.toLocaleString()} <span className="text-[10px] text-gray-500 font-normal">ETB</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                        Rev: {project.totalRevenue.toLocaleString()}
                    </div>
                </div>

                {/* Profit */}
                <div className="col-span-2 text-right text-sm font-bold">
                    <span className={project.grossProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                        {project.grossProfit.toLocaleString()}
                    </span>
                </div>

                {/* Margin */}
                <div className="col-span-1 text-right text-sm text-gray-500 font-medium">
                    {project.profitMargin.toFixed(1)}%
                </div>

                {/* Existing Action */}
                <div className="col-span-1 flex justify-center">
                    <button className={`p-2 rounded-full transition-colors ${isExpanded
                            ? 'bg-primary/10 text-primary'
                            : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                        }`}>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
                {showDetails && isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 overflow-hidden"
                    >
                        <div className="p-4 sm:p-6">
                            {/* Custom Tabs */}
                            <div className="flex space-x-1 rounded-xl bg-white dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700 w-fit mb-4">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setActiveTab('expenses'); }}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'expenses'
                                            ? 'bg-primary/10 text-primary shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                        }`}
                                >
                                    Kharashyada ({project.expenses.length})
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setActiveTab('transactions'); }}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'transactions'
                                            ? 'bg-primary/10 text-primary shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                        }`}
                                >
                                    Dhaqdhaqaaqa ({project.transactions.length})
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setActiveTab('payments'); }}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'payments'
                                            ? 'bg-primary/10 text-primary shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                        }`}
                                >
                                    Lacagaha ({project.payments.length})
                                </button>
                            </div>

                            {/* Expenses Tab */}
                            {activeTab === 'expenses' && (
                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in duration-200">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 uppercase font-semibold">
                                            <tr>
                                                <th className="px-4 py-3 w-32">Taariikh</th>
                                                <th className="px-4 py-3">Nooca</th>
                                                <th className="px-4 py-3">Sharaxaad</th>
                                                <th className="px-4 py-3">Faahfaahin</th>
                                                <th className="px-4 py-3 text-right">Qiimaha</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {project.expenses.map(expense => (
                                                <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                                        {expense.date}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                                            {expense.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                                                        {cleanDescription(expense.description)}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-500">
                                                        <div className="flex flex-wrap gap-1">
                                                            {expense.subCategory && <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">{expense.subCategory}</span>}
                                                            {expense.employeeName && <span className="bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100">Shaqaale: {expense.employeeName}</span>}
                                                            {expense.supplierName && <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded border border-orange-100">Supplier: {expense.supplierName}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                                                        {expense.amount.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                            {project.expenses.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                                                        Wax kharash ah lagama diiwaangelin mashruucan
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Transactions Tab */}
                            {activeTab === 'transactions' && (
                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in duration-200">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 uppercase font-semibold">
                                            <tr>
                                                <th className="px-4 py-3 w-32">Taariikh</th>
                                                <th className="px-4 py-3">Nooca</th>
                                                <th className="px-4 py-3">Sharaxaad</th>
                                                <th className="px-4 py-3 text-right">Qiimaha</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {project.transactions.map(tx => (
                                                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                                        {tx.date}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                                            {tx.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                                                        {cleanDescription(tx.description)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                                                        {tx.amount.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                            {project.transactions.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                                                        Wax dhaqdhaqaaq ah lagama diiwaangelin
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Payments Tab */}
                            {activeTab === 'payments' && (
                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in duration-200">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 uppercase font-semibold">
                                            <tr>
                                                <th className="px-4 py-3 w-32">Taariikh</th>
                                                <th className="px-4 py-3">Sharaxaad</th>
                                                <th className="px-4 py-3 text-right">Qiimaha</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {project.payments.map(pay => (
                                                <tr key={pay.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                                        {pay.date}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                                                        {cleanDescription(pay.description || '-')}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                                                        {pay.amount.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                            {project.payments.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                                                        Wax lacag bixin ah lagama diiwaangelin
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const ProjectsList: React.FC<ProjectsListProps> = ({
    visibleProjects,
    showDetails,
    expandedProjects,
    toggleProjectExpansion,
}) => {

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="col-span-3">Mashruuc</div>
                <div className="col-span-2">Macmiil</div>
                <div className="col-span-1">Xaalad</div>
                <div className="col-span-2 text-right">Qiimaha</div>
                <div className="col-span-2 text-right">Faa'iidada</div>
                <div className="col-span-1 text-right">%</div>
                <div className="col-span-1 text-center"></div>
            </div>

            {/* Project Rows */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {visibleProjects.map((project) => (
                    <ProjectRow
                        key={project.id}
                        project={project}
                        isExpanded={expandedProjects.has(project.id)}
                        onToggle={() => toggleProjectExpansion(project.id)}
                        showDetails={showDetails}
                    />
                ))}

                {/* Summary Footer */}
                {visibleProjects.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800/80 p-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-6 font-bold text-gray-700 dark:text-gray-200 uppercase text-xs tracking-wider">
                                Wadarta Guud
                            </div>
                            <div className="col-span-2 text-right font-bold text-gray-900 dark:text-white text-sm">
                                {visibleProjects.reduce((sum, p) => sum + p.projectValue, 0).toLocaleString()} <span className="text-[10px] text-gray-500 font-normal">ETB</span>
                            </div>
                            <div className="col-span-2 text-right font-bold text-gray-900 dark:text-white text-sm">
                                <span className={visibleProjects.reduce((sum, p) => sum + p.grossProfit, 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                                    {visibleProjects.reduce((sum, p) => sum + p.grossProfit, 0).toLocaleString()}
                                </span>
                            </div>
                            <div className="col-span-2"></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
