'use client';

import React from 'react';
import { ArrowLeft, CheckCircle2, FileText, Scale } from 'lucide-react';
import Link from 'next/link';

export default function BankReconciliationPage() {
    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/shop/accounting" className="text-gray-400 hover:text-[#3498DB] transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                            <ArrowLeft size={14} /> Back to Accounting
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl text-teal-600">
                            <Scale size={28} />
                        </div>
                        Bank Reconciliation
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">Match system records with bank statements.</p>
                </div>
            </div>

            <div className="flex items-center justify-center py-20 bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-sm">
                <div className="text-center max-w-md px-6">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                        <FileText size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Upload Statement</h2>
                    <p className="text-gray-500 mb-8">Import your CSV or PDF bank statement to start reconciling your accounts automatically.</p>

                    <button className="px-8 py-4 bg-[#3498DB] hover:bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 transition-all w-full flex items-center justify-center gap-2">
                        Upload Bank Statement
                    </button>
                </div>
            </div>
        </div>
    );
}
