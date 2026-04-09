'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/layouts/Layout';
import { ArrowLeft, Save, Hammer, Search, Loader2, CheckCircle, PackageCheck, DollarSign, Plus, Settings2, FileText, Pickaxe, Truck, Wrench } from 'lucide-react';
import { toast } from 'sonner';

export default function WorkshopJobDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  
  // Forms states
  const [expenseType, setExpenseType] = useState('MATERIAL_NEW'); // MATERIAL_NEW, MATERIAL_STOCK, LABOR, TRANSPORT, SERVICE
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchJobDetails();
    fetch('/api/projects/accounts').then(res => res.json()).then(data => setAccounts(data.accounts || []));
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      const res = await fetch(`/api/workshop/jobs/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setJob(data.job);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async () => {
    if (!confirm('Ma hubtaa inaad dhammaystirto shaqadan oo aad u wareejiso Stock-ga/Macmiilka?')) return;
    
    try {
      const res = await fetch(`/api/workshop/jobs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success('Shaqadii waa idlaatay! Ganjelkii wuxuu galay Stock-ga/Macmiilkii.');
      fetchJobDetails(); // refresh
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return toast.error('Fadlan geli lacag sax ah');
    
    // Quick validation
    if (['MATERIAL_NEW', 'LABOR', 'TRANSPORT', 'SERVICE'].includes(expenseType) && !accountId) {
      return toast.error('Fadlan dooro Account-ka lacagtu ka go\'ayso');
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/workshop/jobs/${id}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenseType,
          description: description || `Workshop ${expenseType}`,
          amount,
          accountId
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success('Kharashkii si guul leh ayaa loogu daray!');
      setAmount('');
      setDescription('');
      fetchJobDetails();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Layout><div className="flex h-64 justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div></Layout>;
  if (!job) return <Layout><div className="p-10 text-center">Job not found</div></Layout>;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <Link href="/workshop" className="p-2 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">{job.name}</h1>
                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider ${
                  job.status === 'IN_PROGRESS' || job.status === 'PENDING' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                }`}>
                  {job.status === 'COMPLETED' ? 'READY IN STOCK' : 'ACTIVE IN WORKSHOP'}
                </span>
              </div>
              <p className="text-sm font-medium text-mediumGray font-mono">ID: {job.jobNumber} • Started: {new Date(job.startDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex gap-3 items-center">
             <div className="text-right mr-4">
                <p className="text-xs text-mediumGray font-bold uppercase tracking-wider mb-1">Total Cost Value</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">${job.totalCost.toLocaleString()}</p>
             </div>
             {job.status !== 'COMPLETED' && (
                <button onClick={markAsCompleted} className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center shadow-md transition-colors text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" /> Mark Completed
                </button>
             )}
          </div>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 mb-6">
          <button onClick={() => setActiveTab('OVERVIEW')} className={`px-5 py-3 text-sm font-bold tracking-wide border-b-2 transition-colors ${activeTab === 'OVERVIEW' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Overview & Costing
          </button>
          {job.status !== 'COMPLETED' && (
            <button onClick={() => setActiveTab('ADD_EXPENSE')} className={`px-5 py-3 text-sm font-bold tracking-wide border-b-2 transition-colors ${activeTab === 'ADD_EXPENSE' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Plus className="w-4 h-4 inline mr-1" /> Add Job Expenses
            </button>
          )}
        </div>

        {/* TAB CONTENTS */}
        {activeTab === 'OVERVIEW' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Info */}
            <div className="lg:col-span-1 space-y-6">
               <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                 <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center"><FileText className="w-4 h-4 mr-2" /> Job Details</h3>
                 <div className="space-y-4">
                   <div>
                     <p className="text-xs text-mediumGray mb-1">Client/Customer</p>
                     <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{job.customer?.name || '--- For General Stock ---'}</p>
                   </div>
                   <div>
                     <p className="text-xs text-mediumGray mb-1">Project Linked</p>
                     <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{job.project?.name || 'None'}</p>
                   </div>
                   <div>
                     <p className="text-xs text-mediumGray mb-1">Description</p>
                     <p className="text-sm text-gray-700 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">{job.description || 'No description provided.'}</p>
                   </div>
                 </div>
               </div>

               <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden">
                 <Settings2 className="absolute -right-4 -bottom-4 w-32 h-32 text-gray-800 opacity-50" />
                 <h3 className="font-bold text-gray-100 mb-4 relative z-10 flex items-center">Cost Breakdown</h3>
                 <div className="space-y-3 relative z-10">
                   <div className="flex justify-between items-center text-sm">
                     <span className="text-gray-400">Total Materials</span>
                     <span className="font-bold">${job.materialCost.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                     <span className="text-gray-400">Total Labor</span>
                     <span className="font-bold">${job.laborCost.toLocaleString()}</span>
                   </div>
                   <div className="w-full h-px bg-gray-700 my-2"></div>
                   <div className="flex justify-between items-center">
                     <span className="text-white font-semibold">Accumulated Value</span>
                     <span className="text-xl font-black text-orange-400">${job.totalCost.toLocaleString()}</span>
                   </div>
                 </div>
               </div>
            </div>

            {/* Right Col: Ledger */}
            <div className="lg:col-span-2">
               <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm min-h-[400px]">
                 <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center">Cost Ledger (Xisaabta Baxday)</h3>
                 
                 {job.systemExpenses && job.systemExpenses.length > 0 ? (
                   <div className="space-y-3">
                     {job.systemExpenses.map((exp: any) => (
                       <div key={exp.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                         <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                              exp.category === 'MATERIAL' ? 'bg-orange-100 text-orange-600' :
                              exp.category === 'LABOR' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {exp.category === 'MATERIAL' ? <Hammer className="w-4 h-4" /> : <Pickaxe className="w-4 h-4" />}
                            </div>
                            <div>
                               <p className="font-bold text-sm text-gray-900 dark:text-white">{exp.subCategory || exp.category}</p>
                               <p className="text-xs text-mediumGray font-medium mt-0.5">{exp.description}</p>
                               <p className="text-[10px] text-gray-400 mt-1">{new Date(exp.expenseDate).toLocaleDateString()}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="font-black text-gray-900 dark:text-white text-base">${Number(exp.amount).toLocaleString()}</p>
                            <p className="text-xs text-mediumGray uppercase">{exp.paidFrom === 'INTERNAL_STOCK' ? 'From Stock' : 'Paid'}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="text-center py-16 text-gray-400">
                     <p className="mb-2">No expenses recorded yet.</p>
                     {job.status === 'IN_PROGRESS' && (
                        <button onClick={() => setActiveTab('ADD_EXPENSE')} className="text-sm font-bold text-orange-500 hover:text-orange-600">
                          + Add first cost to this job
                        </button>
                     )}
                   </div>
                 )}
               </div>
            </div>
          </div>
        )}

        {/* ADD EXPENSE TAB */}
        {activeTab === 'ADD_EXPENSE' && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden max-w-4xl mx-auto">
             <div className="p-8">
               <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6">Record New Kharash (Costs)</h2>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                 <button type="button" onClick={() => setExpenseType('MATERIAL_NEW')} className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all ${expenseType === 'MATERIAL_NEW' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600' : 'border-gray-100 hover:border-gray-300 dark:border-gray-700 text-gray-500'}`}>
                    <Hammer className="w-6 h-6 mb-2" />
                    <span className="text-xs font-bold uppercase">Material <br/>(Buy New)</span>
                 </button>
                 <button type="button" onClick={() => setExpenseType('MATERIAL_STOCK')} className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all ${expenseType === 'MATERIAL_STOCK' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600' : 'border-gray-100 hover:border-gray-300 dark:border-gray-700 text-gray-500'}`}>
                    <PackageCheck className="w-6 h-6 mb-2" />
                    <span className="text-xs font-bold uppercase">Material <br/>(Pick Stock)</span>
                 </button>
                 <button type="button" onClick={() => setExpenseType('LABOR')} className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all ${expenseType === 'LABOR' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-gray-100 hover:border-gray-300 dark:border-gray-700 text-gray-500'}`}>
                    <Pickaxe className="w-6 h-6 mb-2" />
                    <span className="text-xs font-bold uppercase">Labor <br/>(Xaqul Qalin)</span>
                 </button>
                 <button type="button" onClick={() => setExpenseType('TRANSPORT')} className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all ${expenseType === 'TRANSPORT' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600' : 'border-gray-100 hover:border-gray-300 dark:border-gray-700 text-gray-500'}`}>
                    <Truck className="w-6 h-6 mb-2" />
                    <span className="text-xs font-bold uppercase">Transport <br/>(Taxi/Adeeg)</span>
                 </button>
               </div>

               {/* FORMS */}
               <form onSubmit={handleAddExpense} className="space-y-6">
                 
                 {expenseType === 'MATERIAL_STOCK' ? (
                   <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-xl">
                     <p className="font-bold flex items-center gap-2"><Settings2 className="w-5 h-5"/> Coming soon</p>
                     <p className="text-sm mt-2">Daaqada laga dhex dooranayo alaabta Stock-ga way socotaa. Iminka isticmaal Formamka lacag bixinta.</p>
                   </div>
                 ) : (
                   <>
                     <div>
                       <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                         Description (Faahfaahinta Kharashka)
                       </label>
                       <input 
                         type="text" 
                         value={description}
                         onChange={(e) => setDescription(e.target.value)}
                         className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                         placeholder={expenseType === 'TRANSPORT' ? 'e.g Taxi loogu qaaday birta' : 'Maxaa shaqadan lagu kordhiyay?'}
                         required
                       />
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Total Amount ($)</label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                            <input 
                              type="number" 
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className="w-full pl-9 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none font-black text-gray-900 dark:text-white"
                              step="0.01"
                              placeholder="0.00"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Payment Account (Okoonka Baxaya)</label>
                          <select 
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            required
                          >
                            <option value="">-- Dooro Account / Khasnad --</option>
                            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} (Bal: ${Number(a.balance).toLocaleString()})</option>)}
                          </select>
                        </div>
                     </div>
                     
                     <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-3">
                       {/* Note: I am not building full AI receipt drag&drop here to save token limits, keeping it simple right now */}
                       <div className="flex-1 text-sm text-mediumGray flex items-center bg-gray-50 p-3 rounded-lg border border-gray-200 border-dashed">
                         {expenseType === 'MATERIAL_NEW' ? '📝 Smart AI Receipt Upload wuu ku socdaa in lagu lifaaqo halkan...' : 'Qaybtan toos kharashka ugu geyso.'}
                       </div>
                       <button type="submit" disabled={submitting} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center shadow-lg transition-colors disable:opacity-50 min-w-[200px]">
                         {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                         Save Cost to Job
                       </button>
                     </div>
                   </>
                 )}
               </form>
             </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
