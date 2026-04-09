'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layouts/Layout';
import { ArrowLeft, Save, Hammer, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateWorkshopJob() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    customerId: '',
    projectId: ''
  });

  useEffect(() => {
    // Fetch customers and projects for dropdowns
    fetch('/api/projects/customers').then(res => res.json()).then(data => setCustomers(data.customers || []));
    fetch('/api/projects').then(res => res.json()).then(data => setProjects(data.projects || []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Job Name is required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/workshop/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success('Workshop Job created successfully!');
      router.push(`/workshop/${data.job.id}`); // Transition directly to detailed tracking view
    } catch (error: any) {
      toast.error(error.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/workshop" className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 dark:border-gray-700">
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Start New Workshop Job</h1>
            <p className="text-mediumGray text-sm">Create a new manufacturing or assembly task.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden">
          <div className="p-8 space-y-6">
            
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Job Name (Maxaa la samaynayaa?) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hammer className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  placeholder="e.g. Ganjeelo 4x4m, Miis Kinsi..."
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description / Details</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none h-32"
                placeholder="Include dimensions, materials needed, color specs..."
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Link to Project (Optional)</label>
                <select 
                  value={formData.projectId}
                  onChange={(e) => setFormData({...formData, projectId: e.target.value})}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                >
                  <option value="">-- No Project (Stock Item) --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Link to Customer (Optional)</label>
                <select 
                  value={formData.customerId}
                  onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                >
                  <option value="">-- Walk-in / Stock --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900/50 p-6 flex justify-end items-center border-t border-gray-100 dark:border-gray-700">
            <Link href="/workshop" className="px-6 py-2.5 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors mr-3">
              Cancel
            </Link>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2.5 rounded-xl font-bold flex items-center shadow-lg transition-colors disable:opacity-50 tracking-wide"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
              {loading ? 'Starting...' : 'Start Job'}
            </button>
          </div>
        </form>

      </div>
    </Layout>
  );
}
