'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/layouts/Layout';
import { Hammer, PackageCheck, DollarSign, Plus, Clock, Search, Loader2 } from 'lucide-react';
import type { WorkshopJob } from '@prisma/client';

export default function WorkshopDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ACTIVE');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/workshop/jobs');
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeJobs = jobs.filter(j => j.status === 'IN_PROGRESS' || j.status === 'PENDING');
  const finishedJobs = jobs.filter(j => j.status === 'COMPLETED');
  const totalValueInProduction = activeJobs.reduce((sum, j) => sum + (j.totalCost || 0), 0);

  const renderJobCard = (job: any) => {
    return (
      <Link href={`/workshop/${job.id}`} key={job.id} className="block group">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden h-full flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                <Hammer className="text-orange-500 w-5 h-5" />
              </div>
              <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                job.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' : 
                job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {job.status.replace('_', ' ')}
              </span>
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight mb-1">{job.name}</h3>
            <p className="text-xs text-gray-500 font-medium font-mono flex items-center">
              <Clock className="w-3 h-3 mr-1" /> Started: {new Date(job.startDate).toISOString().split('T')[0]}
            </p>

            <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700/50 flex justify-between items-center">
              <span className="text-xs text-mediumGray">Client</span>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                {job.customer?.name || job.project?.name || 'Internal Stock'}
              </span>
            </div>
          </div>
          
          <div className="mt-2">
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-xs font-medium text-mediumGray">Current Cost</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">${(job.totalCost || 0).toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
              <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Hammer className="text-orange-500 w-8 h-8" />
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Workshop</h1>
            </div>
            <p className="text-mediumGray dark:text-gray-400 font-medium">Manage production, track costs, & stock items.</p>
          </div>
          <Link href="/workshop/create" className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2.5 rounded-xl font-bold flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
            <Plus className="mr-2 w-5 h-5" /> New Job
          </Link>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-orange-50 dark:bg-orange-900/10 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-2 mb-3 text-orange-600 dark:text-orange-400">
              <Clock className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">In Progress</h3>
            </div>
            <p className="text-4xl font-black text-gray-900 dark:text-white mb-1">{activeJobs.length}</p>
            <p className="text-sm text-mediumGray font-medium">Active jobs in workshop</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-green-50 dark:bg-green-900/10 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-2 mb-3 text-green-600 dark:text-green-400">
              <PackageCheck className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Ready / Stock</h3>
            </div>
            <p className="text-4xl font-black text-gray-900 dark:text-white mb-1">{finishedJobs.length}</p>
            <p className="text-sm text-mediumGray font-medium">Completed items ready for sale</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400">
              <DollarSign className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Value in Production</h3>
            </div>
            <p className="text-4xl font-black text-gray-900 dark:text-white mb-1">${totalValueInProduction.toLocaleString()}</p>
            <p className="text-sm text-mediumGray font-medium">Total accumulated cost</p>
          </div>
        </div>

        {/* Tabs & Content */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-lg overflow-hidden min-h-[500px]">
          
          <div className="flex items-center border-b border-gray-100 dark:border-gray-700 px-6 pt-2">
            <button 
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-4 py-4 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'ACTIVE' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              Active Jobs
            </button>
            <button 
              onClick={() => setActiveTab('STOCK')}
              className={`px-4 py-4 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'STOCK' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              In Stock (Ready)
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-mediumGray" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                
                {/* Always show "Create New Job" as the first card in Active tab */}
                {activeTab === 'ACTIVE' && (
                   <Link href="/workshop/create" className="block group">
                    <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-orange-400 bg-gray-50/50 dark:bg-gray-800/10 transition-all h-full min-h-[220px] flex flex-col items-center justify-center p-6 cursor-pointer">
                      <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Plus className="text-gray-400 group-hover:text-orange-500 w-6 h-6" />
                      </div>
                      <span className="text-sm font-bold text-gray-500 uppercase tracking-wider group-hover:text-orange-600">Create New Job</span>
                    </div>
                  </Link>
                )}

                {/* Render the appropriate jobs */}
                {activeTab === 'ACTIVE' 
                  ? activeJobs.map(renderJobCard)
                  : finishedJobs.map(renderJobCard)
                }

                {/* Empty State for Finished tab */}
                {activeTab === 'STOCK' && finishedJobs.length === 0 && (
                  <div className="col-span-full py-20 text-center text-mediumGray">
                    <PackageCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <h3 className="font-bold text-gray-400">No Items Ready Yet</h3>
                    <p className="text-sm mt-1">Finish a job to move it to stock.</p>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}
