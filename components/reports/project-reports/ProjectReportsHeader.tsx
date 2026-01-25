import React from 'react';
import { Calendar, Download, Printer } from 'lucide-react';
import { ProjectReportsData } from './types';

interface ProjectReportsHeaderProps {
    data: ProjectReportsData;
    dateRangeText: string;
    loading: boolean;
    onExportPDF: () => void;
    onPrint: () => void;
}

export const ProjectReportsHeader: React.FC<ProjectReportsHeaderProps> = ({
    data,
    dateRangeText,
    loading,
    onExportPDF,
    onPrint,
}) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6 print:shadow-none print:border-none">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
                        {data.companyName}
                    </h1>
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-lg text-primary">Warbixinta Mashaariicda</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                        <div className="flex items-center gap-1.5 text-sm">
                            <Calendar size={14} />
                            <span>{dateRangeText}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 print:hidden">
                    <button
                        onClick={onExportPDF}
                        disabled={loading}
                        className="group flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl transition-all duration-200 border border-gray-200 dark:border-gray-600 font-medium text-sm disabled:opacity-50"
                    >
                        <Download size={18} className="text-gray-500 dark:text-gray-400 group-hover:text-primary transition-colors" />
                        PDF
                    </button>
                    <button
                        onClick={onPrint}
                        disabled={loading}
                        className="group flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl transition-all duration-200 border border-gray-200 dark:border-gray-600 font-medium text-sm disabled:opacity-50"
                    >
                        <Printer size={18} className="text-gray-500 dark:text-gray-400 group-hover:text-primary transition-colors" />
                        Print
                    </button>
                </div>
            </div>
        </div>
    );
};
