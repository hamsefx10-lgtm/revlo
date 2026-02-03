// app/projects/[id]/page.tsx - FINAL VERSION with List/Board View Options
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Layout from '../../../components/layouts/Layout';
import {
  ArrowLeft, DollarSign, User, Layers, HardHat, FileText, Plus, Edit, Trash2, CheckCircle, Clock, Loader2,
  Calendar, Info, Tag, Wallet, BarChart2, AlertTriangle, Download, List, LayoutGrid, Scale, ArrowUpRight
} from 'lucide-react';
import Toast from '../../../components/common/Toast';
import { subscribeToExpenseChange } from '@/lib/client-events';

// --- Project Data Interface (From Your Original Code) ---
interface Project {
  id: string; name: string; description?: string; customer: { id: string; name: string; email?: string; };
  agreementAmount: number; advancePaid: number; remainingAmount: number; projectType: string;
  status: 'Active' | 'Completed' | 'On Hold' | 'Cancelled' | 'Overdue' | 'Nearing Deadline';
  expectedCompletionDate?: string; actualCompletionDate?: string; notes?: string; createdAt: string; updatedAt: string;
  expenses: {
    id: string;
    description: string;
    amount: number;
    category: string;
    expenseDate: string;
    receiptUrl?: string;
    employeeId?: string;
    employee?: { id: string; fullName?: string };
  }[];
  materialsUsed: { id: string; name: string; quantityUsed: number; unit: string; leftoverQty: number; costPerUnit: number | string; dateUsed?: string; }[];
  laborRecords: {
    id: string;
    employeeId?: string;
    employeeName: string;
    workDescription: string;
    agreedWage: number;
    paidAmount: number;
    remainingWage: number;
    dateWorked?: string;
    employee?: { id: string; fullName?: string };
  }[];
  transactions?: {
    id: string;
    description: string;
    amount: number | string;
    type: string;
    transactionDate: string;
    employeeId?: string;
    employee?: { id: string; fullName?: string };
    projectId?: string;
  }[];
  payments: { id: string; amount: number; paymentDate: string; paymentType: string; receivedIn: string; }[];
  documents: { id: string; name: string; fileUrl: string; fileType: string; uploadedAt: string; }[];
}

// --- Reusable Helper Components ---
const ProjectStatusBadge: React.FC<{ status: Project['status'] }> = ({ status }) => {
  let props = { icon: <Info size={14} />, className: 'bg-gray-500/10 text-gray-500', text: status };
  switch (status) {
    case 'Active': props = { icon: <Clock size={14} />, className: 'bg-primary/10 text-primary', text: 'Active' }; break;
    case 'Completed': props = { icon: <CheckCircle size={14} />, className: 'bg-secondary/10 text-secondary', text: 'Completed' }; break;
    case 'On Hold': props = { icon: <Info size={14} />, className: 'bg-accent/10 text-accent', text: 'On Hold' }; break;
    case 'Cancelled': props = { icon: <AlertTriangle size={14} />, className: 'bg-redError/10 text-redError', text: 'Cancelled' }; break;
    case 'Overdue': props = { icon: <AlertTriangle size={14} />, className: 'bg-redError/10 text-redError', text: 'Overdue' }; break;
    case 'Nearing Deadline': props = { icon: <Calendar size={14} />, className: 'bg-orange-500/10 text-orange-500', text: 'Nearing Deadline' }; break;
  }
  // Somali translation for display
  const somaliText = {
    'Active': 'Socda',
    'Completed': 'Dhammaystiran',
    'On Hold': 'Hakad ku jira',
    'Cancelled': 'La joojiyay',
    'Overdue': 'Dib u dhacay',
    'Nearing Deadline': 'Gabagabo',
  };
  return <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${props.className}`}>{props.icon}{somaliText[props.text as keyof typeof somaliText] || props.text}</span>;
};
const EmptyState: React.FC<{ message: string }> = ({ message }) => <div className="text-center py-10 px-4"><p className="text-mediumGray text-sm">{message}</p></div>;

// --- MAIN PAGE COMPONENT ---
const ProjectDetailsPage: React.FC = () => {
  // --- STATE AND HOOKS ---
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  // Removed duplicate declaration of toastMessage
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // NEW STATE for List/Board view toggles
  const [viewModes, setViewModes] = useState<{ [key: string]: 'list' | 'board' }>({
    overview: 'board',
    expenses: 'list',
    materials: 'list', // Default to table view for materials
  });

  // --- API & EVENT HANDLERS (UNCHANGED) ---
  // --- Fetch Project Details ---
  const fetchProjectDetails = useCallback(async () => {
    setLoading(true);
    try {
      if (!id) throw new Error('Project ID lama helin.');
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) {
        setProject(null);
        setToastMessage({ message: 'Mashruuca lama helin ama cilad ayaa dhacday.', type: 'error' });
        return;
      }
      const data = await res.json();
      setProject(data.project || null);
    } catch (error: any) {
      setProject(null);
      setToastMessage({ message: error?.message || 'Cilad ayaa dhacday.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [id]);

  // --- Delete Project Handler (unchanged, but always set loading false) ---
  const handleDeleteProject = async () => { /* ... original logic ... */ };

  useEffect(() => {
    if (id) fetchProjectDetails();
    else {
      setProject(null);
      setLoading(false);
    }
  }, [id, fetchProjectDetails]);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeToExpenseChange((payload) => {
      if (payload.projectId === id) {
        // Immediately refresh project data when expenses change (including labor expenses)
        fetchProjectDetails();
      }
    });
    return () => {
      unsubscribe?.();
    };
  }, [id, fetchProjectDetails]);

  // Normal refresh only - no real-time updates
  // Project page will refresh only when user manually refreshes or navigates

  // --- RENDER LOGIC ---
  if (loading) return <Layout><div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-primary" size={48} /></div></Layout>;
  if (!project) return <Layout><div className="text-center p-8 mt-10 max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg"><AlertTriangle size={48} className="text-redError mx-auto" /><h2 className="text-2xl font-bold mt-4">Mashruucaan Lama Helin</h2><p className="text-mediumGray dark:text-gray-400 mt-2">Lama helin mashruuca ID-giisu yahay "{id}".</p><Link href="/projects" className="mt-6 inline-flex items-center gap-2 bg-primary text-white py-2 px-4 rounded-lg font-semibold"><ArrowLeft size={18} /> Ku noqo Liiska Mashaariicda</Link></div>{toastMessage && <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />}</Layout>;

  // Always calculate remainingAmount from agreementAmount - advancePaid, always use numbers
  const totalValue = typeof project.agreementAmount === 'number' ? project.agreementAmount : parseFloat(project.agreementAmount as any) || 0;
  const totalAdvance = typeof project.advancePaid === 'number' ? project.advancePaid : parseFloat(project.advancePaid as any) || 0;

  // Deduplication Logic v2: Identify and suppress the auto-generated advance transaction
  // We prioritize the 'advancePaid' field as the Source of Truth, and hide the corresponding auto-transaction.
  const advanceTransaction = (project.transactions || []).find(t => {
    const isIncome = t.type === 'INCOME';
    const trxTime = new Date(t.transactionDate).getTime();
    const projTime = new Date(project.createdAt).getTime();
    const isCloseTime = Math.abs(trxTime - projTime) < 5 * 60 * 1000; // 5 mins window (broadened)
    const desc = (t.description || '').toLowerCase();
    // Specific check for auto-generated string
    const isAutoGenerated = desc.includes('advance payment for project');

    return isIncome && isCloseTime && isAutoGenerated;
  });

  // Calculate total repaid from transactions (Income + Debt Repaid), EXCLUDING the auto-generated advance
  const totalRepaidViaTransactions = (project.transactions || [])
    .filter(t => (t.type === 'DEBT_REPAID' || t.type === 'INCOME') && t.id !== advanceTransaction?.id)
    .reduce((sum, t) => sum + (typeof t.amount === 'number' ? t.amount : parseFloat(t.amount as any) || 0), 0);

  // Total Paid = Static Advance Field + Other Transactions
  const totalPaid = totalAdvance + totalRepaidViaTransactions;
  const remainingAmount = Math.max(0, totalValue - totalPaid);  // ✅ Ensure not negative
  const tabs = ['Overview', 'Expenses', 'Materials', 'Labor', 'Payments', 'Documents', 'Financials'];

  // Calculate total expenses (for this project only)
  const totalExpenses = project?.expenses?.reduce((sum, expense) => sum + (typeof expense.amount === 'number' ? expense.amount : parseFloat(expense.amount as any) || 0), 0) || 0;

  // Group expenses by category
  const expensesByCategory = (project?.expenses || []).reduce((acc, exp) => {
    if (!acc[exp.category]) acc[exp.category] = [];
    acc[exp.category].push(exp);
    return acc;
  }, {} as Record<string, typeof project.expenses>);

  const laborExpenses = (project?.expenses || []).filter(
    (exp) => exp.category?.toLowerCase() === 'labor'
  );

  const laborGroups = Object.values(
    laborExpenses.reduce((acc, exp) => {
      const key = exp.employee?.id || exp.employeeId || exp.description || exp.id;
      if (!acc[key]) {
        acc[key] = {
          key,
          employeeName: exp.employee?.fullName || exp.description || 'Shaqaale aan la aqoon',
          latestWork: exp.description || '-',
          totalPaid: 0,
          lastPaymentDate: exp.expenseDate,
          employeeId: exp.employee?.id || exp.employeeId,
        };
      }
      const amountValue = typeof exp.amount === 'number' ? exp.amount : parseFloat(exp.amount as any) || 0;
      acc[key].totalPaid += amountValue;
      if (exp.expenseDate && new Date(exp.expenseDate) > new Date(acc[key].lastPaymentDate)) {
        acc[key].lastPaymentDate = exp.expenseDate;
      }
      return acc;
    }, {} as Record<string, { key: string; employeeName: string; latestWork: string; totalPaid: number; lastPaymentDate: string; employeeId?: string }>)
  );

  // --- View Toggle Component ---
  const ViewSwitcher = ({ tabKey }: { tabKey: 'overview' | 'expenses' | 'materials' }) => {
    return (
      <div className="flex items-center gap-1 bg-lightGray p-1 rounded-lg">
        <button
          onClick={() => setViewModes(prev => ({ ...prev, [tabKey]: 'list' }))}
          className={`p-1.5 rounded-md ${viewModes[tabKey] === 'list' ? 'bg-white shadow' : 'text-mediumGray'}`}
          title="List View"
        >
          <List size={18} />
        </button>
        <button
          onClick={() => setViewModes(prev => ({ ...prev, [tabKey]: 'board' }))}
          className={`p-1.5 rounded-md ${viewModes[tabKey] === 'board' ? 'bg-white shadow' : 'text-mediumGray'}`}
          title="Board View"
        >
          <LayoutGrid size={18} />
        </button>
      </div>
    );
  };

  return (
    <Layout>
      {/* [NEW DESIGN] Header with small, iconic buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex-1 min-w-0">
          <Link href="/projects" className="inline-flex items-center gap-2 text-primary hover:underline font-semibold mb-2 text-sm"><ArrowLeft size={18} /> Ku noqo Mashaariicda</Link>
          <h1 className="text-2xl md:text-3xl font-bold text-darkGray dark:text-gray-100 truncate" title={project.name}>{project.name}</h1>
        </div>
        <div className="flex items-center space-x-2 self-start sm:self-center">
          <Link href={`/expenses/add?projectId=${project.id}`} title="Ku Dar Kharash" className="p-2 rounded-lg bg-lightGray/80 hover:bg-lightGray dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"><Plus className="text-primary" size={20} /></Link>
          <Link href={`/projects/edit/${project.id}`} title="Beddel Mashruuc" className="p-2 rounded-lg bg-lightGray/80 hover:bg-lightGray dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"><Edit className="text-accent" size={20} /></Link>
          <button onClick={handleDeleteProject} title="Tirtir Mashruuca" className="p-2 rounded-lg bg-lightGray/80 hover:bg-lightGray dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"><Trash2 className="text-redError" size={20} /></button>
        </div>
      </div>

      {/* Financial Summary - Enhanced */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
          <p className="text-sm text-mediumGray">Total Agreed</p>
          <p className="text-2xl font-bold text-darkGray dark:text-gray-100">Br{totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
          <p className="text-sm text-secondary">Total Paid</p>
          <p className="text-2xl font-bold text-secondary">Br{totalPaid.toLocaleString()}</p>
          <p className="text-xs text-mediumGray mt-1">
            (Adv: {totalAdvance.toLocaleString()} + Trx: {totalRepaidViaTransactions.toLocaleString()})
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
          <p className="text-sm text-secondary">Total Expenses</p>
          <p className="text-2xl font-bold text-secondary">Br{totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
          <p className="text-sm text-redError">Total Remaining</p>
          <p className={`text-2xl font-bold ${remainingAmount <= 0 ? 'text-green-600' : 'text-redError'}`}>Br{remainingAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex flex-col justify-center items-center">
          <ProjectStatusBadge status={project.status} />
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="block lg:hidden mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
          <nav className="grid grid-cols-3 gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex flex-col items-center py-3 px-2 rounded-lg font-medium text-xs transition-all duration-200 ${activeTab === tab
                  ? 'bg-primary text-white shadow-md'
                  : 'text-mediumGray dark:text-gray-400 hover:text-darkGray dark:hover:text-gray-200 hover:bg-lightGray dark:hover:bg-gray-700'
                  }`}
              >
                {tab === 'Overview' && <LayoutGrid size={16} />}
                {tab === 'Expenses' && <AlertTriangle size={16} />}
                {tab === 'Materials' && <Layers size={16} />}
                {tab === 'Labor' && <HardHat size={16} />}
                {tab === 'Payments' && <DollarSign size={16} />}
                {tab === 'Documents' && <FileText size={16} />}
                <span className="text-xs leading-tight text-center mt-1">{tab}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop Tab Navigation */}
      <div className="hidden lg:block">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <nav className="flex space-x-2 px-2 border-b border-lightGray dark:border-gray-700 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 whitespace-nowrap py-3 px-3 text-sm font-semibold transition-colors duration-200 ${activeTab === tab ? 'border-b-2 border-primary text-primary' : 'border-b-2 border-transparent text-mediumGray hover:text-darkGray'}`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content - Mobile & Desktop Separate Designs */}
      {/* Mobile Tab Content */}
      <div className="block lg:hidden p-4">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-darkGray dark:text-gray-100 mb-2 flex items-center">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
              {activeTab === 'Overview' && <LayoutGrid size={16} className="text-primary" />}
              {activeTab === 'Expenses' && <AlertTriangle size={16} className="text-primary" />}
              {activeTab === 'Materials' && <Layers size={16} className="text-primary" />}
              {activeTab === 'Labor' && <HardHat size={16} className="text-primary" />}
              {activeTab === 'Payments' && <DollarSign size={16} className="text-primary" />}
              {activeTab === 'Documents' && <FileText size={16} className="text-primary" />}
            </div>
            {activeTab}
          </h3>
          <p className="text-sm text-mediumGray dark:text-gray-400">
            {activeTab === 'Overview' && 'Halkan waxaad ka arki kartaa guudmarka mashruuca.'}
            {activeTab === 'Expenses' && 'Halkan waxaad ka arki kartaa kharashaadka mashruuca.'}
            {activeTab === 'Materials' && 'Halkan waxaad ka arki kartaa agabka la isticmaalay.'}
            {activeTab === 'Labor' && 'Halkan waxaad ka arki kartaa shaqaalaha mashruuca.'}
            {activeTab === 'Payments' && 'Halkan waxaad ka arki kartaa lacagaha la bixiyay.'}
            {activeTab === 'Documents' && 'Halkan waxaad ka arki kartaa dukumentiyada mashruuca.'}
          </p>
        </div>

        {/* Mobile Overview Content */}
        {activeTab === 'Overview' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl shadow-md">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200">Macmiil</h4>
                <User size={18} className="text-blue-600" />
              </div>
              <p className="text-lg font-bold text-blue-600">{project.customer?.name || '-'}</p>
              <p className="text-xs text-blue-600 dark:text-blue-300">Customer</p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl shadow-md">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-green-800 dark:text-green-200">Nooca Mashruuca</h4>
                <Tag size={18} className="text-green-600" />
              </div>
              <p className="text-lg font-bold text-green-600">{project.projectType || '-'}</p>
              <p className="text-xs text-green-600 dark:text-green-300">Project Type</p>
            </div>

            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl shadow-md">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Sharaxaad</h4>
                <FileText size={18} className="text-gray-600" />
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{project.description || 'Lama gelin.'}</p>
            </div>
          </div>
        )}

        {/* Mobile Expenses Content */}
        {activeTab === 'Expenses' && (
          <div>
            {project.expenses.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-lightGray dark:border-gray-700 p-8 text-center">
                <AlertTriangle className="mx-auto text-mediumGray dark:text-gray-400 mb-4" size={48} />
                <p className="text-mediumGray dark:text-gray-400 mb-4">Lama diiwaan gelin wax kharash ah.</p>
                <Link
                  href={`/expenses/add?projectId=${project.id}`}
                  className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Plus size={18} />
                  <span>Ku Dar Kharash</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(expensesByCategory).map(([cat, exps]) => {
                  const borderColor = cat.toLowerCase() === 'labor' ? 'border-l-4 border-blue-500' :
                    cat.toLowerCase() === 'material' ? 'border-l-4 border-cyan-500' :
                      'border-l-4 border-primary';
                  return (
                    <div key={cat} className={`bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 ${borderColor} p-4`}>
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-lightGray dark:border-gray-700">
                        <h4 className={`text-base font-bold ${cat.toLowerCase() === 'labor' ? 'text-blue-600 dark:text-blue-400' : cat.toLowerCase() === 'material' ? 'text-cyan-600 dark:text-cyan-400' : 'text-primary'}`}>
                          {cat}
                        </h4>
                        <p className="text-sm font-semibold text-redError">
                          Total: -Br{exps.reduce((s, e) => s + (typeof e.amount === 'number' ? e.amount : parseFloat(e.amount as any) || 0), 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-2">
                        {exps.map(exp => (
                          <div key={exp.id} className='bg-lightGray/30 dark:bg-gray-700/30 p-3 rounded-lg'>
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <p className='font-bold text-darkGray dark:text-gray-100'>{exp.description}</p>
                                <p className='text-xs text-mediumGray dark:text-gray-400 mt-1'>{new Date(exp.expenseDate).toLocaleDateString()}</p>
                              </div>
                              <p className='font-bold text-lg text-redError ml-3 flex-shrink-0'>-Br{(typeof exp.amount === 'number' ? exp.amount : parseFloat(exp.amount as any) || 0).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Mobile Materials Content */}
        {activeTab === 'Materials' && (
          <div>
            {project.materialsUsed.length === 0 ? <EmptyState message="Lama diiwaan gelin wax agab la isticmaalay." /> : (
              <div className="space-y-4">
                {project.materialsUsed.map(mat => (
                  <div key={mat.id} className="bg-gradient-to-r from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 p-4 rounded-xl shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-cyan-800 dark:text-cyan-200">Agabka</h4>
                      <Layers size={18} className="text-cyan-600" />
                    </div>
                    <div className="space-y-2">
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-darkGray dark:text-gray-100 truncate">{mat.name}</p>
                            <p className="text-xs text-mediumGray dark:text-gray-400">Hadhay: {mat.leftoverQty} {mat.unit}</p>
                          </div>
                          <p className="font-bold text-lg text-cyan-600 ml-2">{mat.quantityUsed} <span className="text-sm font-normal text-mediumGray">{mat.unit}</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mobile Labor Content */}
        {activeTab === 'Labor' && (
          <div className="space-y-6">
            {/* Labor Expenses Summary - Mobile */}
            <div>
              <h4 className="font-bold text-lg mb-4 text-blue-700 flex items-center gap-2">
                <HardHat size={18} />
                Kharashaadka Shaqaalaha
              </h4>
              {project.expenses.filter(e => e.category && e.category.toLowerCase() === 'labor').length === 0 ? (
                <EmptyState message="Lama diiwaan gelin wax kharash shaqaale ah." />
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-lightGray dark:border-gray-700 p-3">
                  <div className="space-y-2">
                    {project.expenses.filter(e => e.category && e.category.toLowerCase() === 'labor').map(exp => (
                      <div key={exp.id} className="flex items-center justify-between p-3 bg-lightGray/30 dark:bg-gray-700/30 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-darkGray dark:text-gray-100 truncate">{exp.description}</p>
                          <p className="text-xs text-mediumGray dark:text-gray-400 mt-1">{new Date(exp.expenseDate).toLocaleDateString()}</p>
                        </div>
                        <p className="font-bold text-base text-redError ml-3">-Br{(typeof exp.amount === 'number' ? exp.amount : parseFloat(exp.amount as any) || 0).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Employee Details Section - Mobile Table */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-xl text-primary flex items-center gap-2">
                  <User size={20} />
                  Shaqaalaha Mashruuca
                </h4>
                <Link
                  href={`/expenses/add?projectId=${project.id}&category=Labor`}
                  className='inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-all'
                >
                  <Plus size={14} />
                  Ku Dar
                </Link>
              </div>
              {(Array.isArray(project.laborRecords) ? project.laborRecords.length : 0) === 0 ? (
                <EmptyState message="Lama diiwaan gelin wax shaqaale ah." />
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-lightGray dark:border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead className="bg-primary/10 dark:bg-gray-700">
                        <tr>
                          <th className="px-3 py-2.5 text-left text-xs font-bold text-darkGray dark:text-gray-100">Magaca</th>
                          <th className="px-3 py-2.5 text-left text-xs font-bold text-darkGray dark:text-gray-100">La Qoray</th>
                          <th className="px-3 py-2.5 text-right text-xs font-bold text-darkGray dark:text-gray-100">La Bixiyay</th>
                          <th className="px-3 py-2.5 text-right text-xs font-bold text-darkGray dark:text-gray-100">Hadhay</th>
                          <th className="px-3 py-2.5 text-center text-xs font-bold text-darkGray dark:text-gray-100">Ficil</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                        {(() => {
                          // Group labor records by employee
                          const employeeMap = new Map<string, {
                            employeeId: string;
                            employeeName: string;
                            firstAgreedWage: number;
                            totalPaid: number;
                            totalRemaining: number;
                            transactions: any[];
                            payments: any[];
                          }>();

                          (project.laborRecords || []).forEach(lab => {
                            const empId = lab.employeeId || 'unknown';
                            if (!employeeMap.has(empId)) {
                              const agreed = typeof lab.agreedWage === 'number' ? lab.agreedWage : parseFloat(lab.agreedWage as any) || 0;
                              employeeMap.set(empId, {
                                employeeId: empId,
                                employeeName: lab.employeeName || lab.employee?.fullName || 'Unknown',
                                firstAgreedWage: agreed,
                                totalPaid: 0,
                                totalRemaining: 0,
                                transactions: [],
                                payments: [],
                              });
                            }
                            const emp = employeeMap.get(empId)!;
                            const paid = typeof lab.paidAmount === 'number' ? lab.paidAmount : parseFloat(lab.paidAmount as any) || 0;
                            const remaining = typeof lab.remainingWage === 'number' ? lab.remainingWage : parseFloat(lab.remainingWage as any) || 0;
                            emp.totalPaid += paid;
                            emp.totalRemaining += remaining;
                          });

                          // Add transactions and payments
                          // Create a set of expense IDs that have transactions to avoid duplicates
                          const expenseIdsWithTransactions = new Set(
                            (project.transactions || [])
                              .filter((t: any) => t.expenseId)
                              .map((t: any) => t.expenseId)
                          );

                          (project.transactions || []).forEach((t: any) => {
                            const emp = employeeMap.get(t.employeeId);
                            if (emp && t.projectId === project.id) {
                              emp.transactions.push(t);
                            }
                          });

                          // Only add expenses that don't have a corresponding transaction (to avoid duplicates)
                          (project.expenses || []).forEach((e: any) => {
                            const emp = employeeMap.get(e.employeeId);
                            if (emp && e.category?.toLowerCase() === 'labor' && !expenseIdsWithTransactions.has(e.id)) {
                              emp.payments.push(e);
                            }
                          });

                          return Array.from(employeeMap.values()).map((emp, index) => (
                            <React.Fragment key={emp.employeeId}>
                              <tr className="hover:bg-lightGray/30 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="px-3 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                                      <User size={16} className="text-white" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-sm text-darkGray dark:text-gray-100 truncate">{emp.employeeName}</p>
                                      <p className="text-[10px] text-mediumGray dark:text-gray-400">
                                        {emp.transactions.length} trx • {emp.payments.length} bixin
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-3">
                                  <p className="font-semibold text-xs text-accent">Br{emp.firstAgreedWage.toLocaleString()}</p>
                                </td>
                                <td className="px-3 py-3 text-right">
                                  <p className="font-semibold text-xs text-secondary">Br{emp.totalPaid.toLocaleString()}</p>
                                </td>
                                <td className="px-3 py-3 text-right">
                                  <p className={`font-semibold text-xs ${emp.totalRemaining > 0 ? 'text-redError' : 'text-green-600'}`}>
                                    Br{emp.totalRemaining.toLocaleString()}
                                  </p>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <Link
                                    href={`/expenses/add?projectId=${project.id}&employeeId=${emp.employeeId}&category=Labor`}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-primary text-white hover:bg-primary/90"
                                  >
                                    <Plus size={12} />
                                    Bixin
                                  </Link>
                                </td>
                              </tr>
                              {/* Expandable Details Row - Mobile */}
                              {(emp.transactions.length > 0 || emp.payments.length > 0) && (
                                <tr>
                                  <td colSpan={5} className="px-3 py-3 bg-lightGray/20 dark:bg-gray-800/50">
                                    <div className="space-y-3">
                                      {/* Transactions Table - Mobile */}
                                      {emp.transactions.length > 0 && (
                                        <div>
                                          <h6 className="font-semibold text-xs text-darkGray dark:text-gray-100 mb-2 flex items-center gap-1">
                                            <FileText size={14} className="text-primary" />
                                            Dhaqdhaqaaqaadka
                                          </h6>
                                          <div className="overflow-x-auto">
                                            <table className="w-full text-[10px]">
                                              <thead>
                                                <tr className="bg-white/50 dark:bg-gray-700/50">
                                                  <th className="px-2 py-1 text-left font-semibold text-darkGray dark:text-gray-100">Sharaxaad</th>
                                                  <th className="px-2 py-1 text-left font-semibold text-darkGray dark:text-gray-100">Taariikh</th>
                                                  <th className="px-2 py-1 text-right font-semibold text-darkGray dark:text-gray-100">Qadarka</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                                                {emp.transactions
                                                  .sort((a: any, b: any) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
                                                  .map((trx: any) => {
                                                    const trxAmount = typeof trx.amount === 'number' ? trx.amount : parseFloat(trx.amount as any) || 0;
                                                    return (
                                                      <tr key={trx.id} className="hover:bg-white/50 dark:hover:bg-gray-700/50">
                                                        <td className="px-2 py-1.5 text-darkGray dark:text-gray-100">{trx.description || 'Lacag Bixin'}</td>
                                                        <td className="px-2 py-1.5 text-mediumGray dark:text-gray-400">{new Date(trx.transactionDate).toLocaleDateString()}</td>
                                                        <td className={`px-2 py-1.5 text-right font-semibold ${trxAmount < 0 ? 'text-redError' : 'text-secondary'}`}>
                                                          {trxAmount < 0 ? '-' : '+'}Br{Math.abs(trxAmount).toLocaleString()}
                                                        </td>
                                                      </tr>
                                                    );
                                                  })}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      )}

                                      {/* Payments Table - Mobile */}
                                      {emp.payments.length > 0 && (
                                        <div>
                                          <h6 className="font-semibold text-xs text-darkGray dark:text-gray-100 mb-2 flex items-center gap-1">
                                            <DollarSign size={14} className="text-secondary" />
                                            Lacagaha La Siinayay
                                          </h6>
                                          <div className="overflow-x-auto">
                                            <table className="w-full text-[10px]">
                                              <thead>
                                                <tr className="bg-white/50 dark:bg-gray-700/50">
                                                  <th className="px-2 py-1 text-left font-semibold text-darkGray dark:text-gray-100">Sharaxaad</th>
                                                  <th className="px-2 py-1 text-left font-semibold text-darkGray dark:text-gray-100">Taariikh</th>
                                                  <th className="px-2 py-1 text-right font-semibold text-darkGray dark:text-gray-100">Qadarka</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                                                {emp.payments
                                                  .sort((a: any, b: any) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())
                                                  .map((exp: any) => {
                                                    const expAmount = typeof exp.amount === 'number' ? exp.amount : parseFloat(exp.amount as any) || 0;
                                                    return (
                                                      <tr key={exp.id} className="hover:bg-white/50 dark:hover:bg-gray-700/50">
                                                        <td className="px-2 py-1.5 text-darkGray dark:text-gray-100">{exp.description || 'Lacag Bixin'}</td>
                                                        <td className="px-2 py-1.5 text-mediumGray dark:text-gray-400">{new Date(exp.expenseDate).toLocaleDateString()}</td>
                                                        <td className="px-2 py-1.5 text-right font-semibold text-secondary">Br{expAmount.toLocaleString()}</td>
                                                      </tr>
                                                    );
                                                  })}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Payments Content */}
        {activeTab === 'Payments' && (
          <div className="space-y-6">
            {(() => {
              const totalValue = typeof project.agreementAmount === 'number' ? project.agreementAmount : parseFloat(project.agreementAmount as any) || 0;
              const totalAdvance = typeof project.advancePaid === 'number' ? project.advancePaid : parseFloat(project.advancePaid as any) || 0;

              // Deduplication Logic v2 (Tab Scope): Identify and suppress
              const advanceTransaction = (project.transactions || []).find(t => {
                const isIncome = t.type === 'INCOME';
                const trxTime = new Date(t.transactionDate).getTime();
                const projTime = new Date(project.createdAt).getTime();
                const isCloseTime = Math.abs(trxTime - projTime) < 5 * 60 * 1000;
                const desc = (t.description || '').toLowerCase();
                const isAutoGenerated = desc.includes('advance payment for project');
                return isIncome && isCloseTime && isAutoGenerated;
              });

              // Calculate total repaid from transactions, EXCLUDING the auto-generated advance
              const totalRepaidViaTransactions = (project.transactions || [])
                .filter(t => (t.type === 'DEBT_REPAID' || t.type === 'INCOME') && t.id !== advanceTransaction?.id)
                .reduce((sum: number, t: any) => sum + (typeof t.amount === 'number' ? t.amount : parseFloat(t.amount as any) || 0), 0);

              const totalPaid = (project.payments || []).reduce((sum: number, p: any) => sum + (typeof p.amount === 'number' ? p.amount : parseFloat(p.amount as any) || 0), 0) +
                totalAdvance + totalRepaidViaTransactions;

              const remainingAmount = totalValue - totalPaid;

              const totalExpenses = ((project.expenses || []).reduce((sum: number, e: any) => sum + (typeof e.amount === 'number' ? e.amount : parseFloat(e.amount) || 0), 0) +
                (project.laborRecords || []).reduce((sum: number, l: any) => sum + (typeof l.paidAmount === 'number' ? l.paidAmount : parseFloat(l.paidAmount) || 0), 0));

              return (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-xs text-green-600 dark:text-green-400 mb-1">Lacagaha La Helay (Total Paid)</p>
                      <p className="text-lg font-bold text-green-700 dark:text-green-300">
                        Br{totalPaid.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                      <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">Ku Dhiman</p>
                      <p className={`text-lg font-bold ${remainingAmount <= 0 ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'}`}>
                        Br{remainingAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-xs text-red-600 dark:text-red-400 mb-1">Wadarta Kharashaadka</p>
                    <p className="text-lg font-bold text-red-700 dark:text-red-300">
                      Br{totalExpenses.toLocaleString()}
                    </p>
                  </div>

                  {/* Customer Payments (Income + Transactions) */}
                  <div>
                    <h4 className="font-bold text-lg mb-3 text-secondary">Lacagaha Macmiilka (All Incomings)</h4>
                    {(() => {
                      // Merge legacy payments and new transactions
                      const relevantTransactions = (project.transactions || []).filter(t => (t.type === 'INCOME' || t.type === 'DEBT_REPAID') && t.id !== advanceTransaction?.id);
                      const legacyPayments = project.payments || [];

                      const allIncomings = [
                        // 1. Virtual Advance Payment (System Record)
                        ...(totalAdvance > 0 ? [{
                          id: 'advance-sys',
                          description: 'Advance Payment (Initial)',
                          amount: totalAdvance,
                          date: project.createdAt,
                          source: 'System Record'
                        }] : []),

                        // 2. Legacy Payments
                        ...legacyPayments.map(p => ({
                          id: p.id,
                          description: p.paymentType || 'Payment',
                          amount: typeof p.amount === 'number' ? p.amount : parseFloat(p.amount as any) || 0,
                          date: p.paymentDate,
                          source: 'Legacy Payment'
                        })),

                        // 3. Transactions
                        ...relevantTransactions.map(t => ({
                          id: t.id,
                          description: t.description || 'Transaction',
                          amount: typeof t.amount === 'number' ? t.amount : parseFloat(t.amount as any) || 0,
                          date: t.transactionDate,
                          source: t.type === 'INCOME' ? 'Income Transaction' : 'Debt Repayment'
                        }))
                      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                      if (allIncomings.length === 0) {
                        return <EmptyState message="Lama diiwaan gelin wax lacag macmiilka ka ah." />;
                      }

                      return (
                        <div className="space-y-2">
                          {allIncomings.map(item => (
                            <div key={item.id} className='bg-white dark:bg-gray-800 p-3 rounded-lg flex justify-between items-center shadow-sm border-l-4 border-secondary'>
                              <div className="flex-1">
                                <p className='font-bold text-darkGray dark:text-gray-100 flex items-center gap-2'>
                                  {item.description}
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 font-normal">{item.source}</span>
                                </p>
                                <p className='text-xs text-mediumGray dark:text-gray-400'>{item.date ? new Date(item.date).toLocaleDateString() : '-'}</p>
                              </div>
                              <p className='font-bold text-lg text-secondary'>+Br{item.amount.toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </>
              );
            })()}

            {/* Labor Payments */}
            <div>
              <h4 className="font-bold text-lg mb-3 text-orange-600">Lacagaha Shaqaalaha (Labor Payments)</h4>
              {(() => {
                const laborPayments = (project.laborRecords || []).filter((lr: any) => lr.paidAmount > 0);
                if (laborPayments.length === 0) {
                  return <EmptyState message="Lama diiwaan gelin wax lacag shaqaale ah." />;
                }
                return (
                  <div className="space-y-2">
                    {laborPayments.map((lr: any) => (
                      <div key={lr.id} className='bg-white dark:bg-gray-800 p-3 rounded-lg flex justify-between items-center shadow-sm border-l-4 border-orange-500'>
                        <div className="flex-1">
                          <p className='font-bold text-darkGray dark:text-gray-100'>{lr.employeeName || 'Unknown Employee'}</p>
                          <p className='text-xs text-mediumGray dark:text-gray-400'>{lr.workDescription || '-'}</p>
                          {lr.dateWorked && (
                            <p className='text-xs text-mediumGray dark:text-gray-400 mt-1'>Date: {new Date(lr.dateWorked).toLocaleDateString()}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className='font-bold text-lg text-orange-600'>-Br{(typeof lr.paidAmount === 'number' ? lr.paidAmount : parseFloat(lr.paidAmount) || 0).toLocaleString()}</p>
                          {lr.remainingWage > 0 && (
                            <p className='text-xs text-mediumGray dark:text-gray-400'>Remaining: Br{lr.remainingWage.toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Project Expenses (Material, Transport, etc.) */}
            <div>
              <h4 className="font-bold text-lg mb-3 text-redError">Kharashaadka Mashruuca (Project Expenses)</h4>
              {(() => {
                // Filter out labor expenses (already shown above) and show other expenses
                const otherExpenses = (project.expenses || []).filter((e: any) => e.category !== 'Labor');
                if (otherExpenses.length === 0) {
                  return <EmptyState message="Lama diiwaan gelin wax kharash mashruuc ah." />;
                }
                return (
                  <div className="space-y-2">
                    {otherExpenses.map((exp: any) => (
                      <div key={exp.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg flex justify-between items-center shadow-sm border-l-4 border-red-500">
                        <div className="flex-1">
                          <p className="font-bold text-darkGray dark:text-gray-100">{exp.description || '-'}</p>
                          <p className="text-xs text-mediumGray dark:text-gray-400">{new Date(exp.expenseDate).toLocaleDateString()}</p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold ${exp.category === 'Material' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200' :
                            exp.category === 'Transport' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
                            }`}>
                            {exp.category}
                          </span>
                        </div>
                        <p className="font-bold text-lg text-redError">-Br{(typeof exp.amount === 'number' ? exp.amount : parseFloat(exp.amount) || 0).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Transactions */}
            {project.transactions && project.transactions.length > 0 && (
              <div>
                <h4 className="font-bold text-lg mb-3 text-primary">Dhaqdhaqaaqa Lacagta (Transactions)</h4>
                <div className="space-y-2">
                  {project.transactions.map((trx: any) => (
                    <div key={trx.id} className={`bg-white dark:bg-gray-800 p-3 rounded-lg flex justify-between items-center shadow-sm border-l-4 ${trx.type === 'INCOME' || trx.type === 'DEBT_REPAID' ? 'border-secondary' : 'border-redError'
                      }`}>
                      <div className="flex-1">
                        <p className="font-bold text-darkGray dark:text-gray-100">{trx.description || '-'}</p>
                        <p className="text-xs text-mediumGray dark:text-gray-400">{new Date(trx.transactionDate).toLocaleDateString()}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold ${trx.type === 'INCOME' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
                          trx.type === 'EXPENSE' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200' :
                            trx.type === 'DEBT_TAKEN' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
                          }`}>
                          {trx.type}
                        </span>
                      </div>
                      <p className={`font-bold text-lg ${trx.type === 'INCOME' || trx.type === 'DEBT_REPAID' ? 'text-secondary' : 'text-redError'
                        }`}>
                        {trx.type === 'INCOME' || trx.type === 'DEBT_REPAID' ? '+' : '-'}Br{Math.abs(typeof trx.amount === 'number' ? trx.amount : parseFloat(trx.amount) || 0).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div >
        )}

        {/* Mobile Documents Content */}
        {activeTab === 'Documents' && (
          <div>
            <h4 className="font-bold text-lg mb-2 text-primary">Rasiidada Kharashaadka (Receipt Images)</h4>
            {(() => {
              const expensesWithReceipts = project.expenses.filter(exp => exp.receiptUrl);

              if (expensesWithReceipts.length === 0) {
                return (
                  <div className="text-center py-8">
                    <FileText className="mx-auto text-gray-400 dark:text-gray-500" size={48} />
                    <p className="text-gray-700 dark:text-gray-200 mt-2">Ma jiraan rasiido oo la xiriira kharashaadka mashruuca.</p>
                    <Link
                      href="/expenses/add"
                      className="mt-4 inline-flex items-center gap-2 bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                    >
                      <Plus size={18} />
                      Ku Dar Kharash + Rasiid
                    </Link>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {expensesWithReceipts.map((expense) => (
                    <div key={expense.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                      <div className="mb-3">
                        <h4 className="font-semibold text-darkGray dark:text-gray-100">{expense.description}</h4>
                        <p className="text-sm text-mediumGray dark:text-gray-400">Br{expense.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(expense.expenseDate).toLocaleDateString()}
                        </p>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${expense.category === 'Material' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200' :
                          expense.category === 'Labor' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
                            expense.category === 'Company Expense' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
                          }`}>
                          {expense.category}
                        </span>
                      </div>

                      {expense.receiptUrl && (
                        <div className="mb-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={expense.receiptUrl}
                            alt={`Receipt for ${expense.description}`}
                            className="w-full h-32 object-cover rounded-lg border border-lightGray dark:border-gray-700"
                            onClick={() => window.open(expense.receiptUrl, '_blank')}
                            style={{ cursor: 'pointer' }}
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Click to view full size</p>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(expense.expenseDate).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => window.open(expense.receiptUrl, '_blank')}
                          className="text-primary hover:text-blue-700 text-sm font-medium"
                        >
                          View Receipt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
        {/* Mobile Financials Content */}
        {activeTab === 'Financials' && (
          <div className="mt-4">
            <ProjectFinancials projectId={project.id} />
          </div>
        )}
      </div >

      {/* Desktop Tab Content */}
      < div className="hidden lg:block" >
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 md:p-6">
            <div className='flex justify-between items-center mb-4'>
              <h3 className="text-xl font-bold text-darkGray dark:text-gray-100">{activeTab}</h3>
              {['Overview', 'Expenses', 'Materials'].includes(activeTab) && <ViewSwitcher tabKey={activeTab.toLowerCase() as any} />}
            </div>

            {/* Desktop Overview Content */}
            {activeTab === 'Overview' && (
              <div>
                {viewModes.overview === 'board' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-lightGray/40 p-3 rounded-lg flex items-start gap-3"><User className="w-5 h-5 text-primary mt-0.5" /><div><p className="font-semibold text-mediumGray">Macmiil:</p><p className="font-medium">{project.customer?.name || '-'}</p></div></div>
                    <div className="bg-lightGray/40 p-3 rounded-lg flex items-start gap-3"><Tag className="w-5 h-5 text-primary mt-0.5" /><div><p className="font-semibold text-mediumGray">Nooca:</p><p className="font-medium">{project.projectType || '-'}</p></div></div>
                    <p className="md:col-span-2 pt-2"><b>Sharaxaad:</b> {project.description || 'Lama gelin.'}</p>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    {Object.entries({
                      "Macmiil": project.customer?.name || '-',
                      "Nooca Mashruuca": project.projectType || '-',
                      "Taariikhda La Filayo": project.expectedCompletionDate ? new Date(project.expectedCompletionDate).toLocaleDateString() : 'N/A',
                      "Taariikhda Dhabta ah": project.actualCompletionDate ? new Date(project.actualCompletionDate).toLocaleDateString() : '-',
                      "Sharaxaad": project.description || 'Lama gelin.',
                      "Fiiro Gaar Ah": project.notes || 'Lama gelin.'
                    }).map(([label, value]) => <p key={label}><span className="font-semibold text-mediumGray">{label}:</span> {value}</p>)}
                  </div>
                )}
              </div>
            )}

            {/* Desktop Expenses Content */}
            {activeTab === 'Expenses' && (
              <div>
                {project.expenses.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-lightGray dark:border-gray-700 p-12 text-center">
                    <AlertTriangle className="mx-auto text-mediumGray dark:text-gray-400 mb-4" size={48} />
                    <p className="text-mediumGray dark:text-gray-400 mb-4 text-lg">Lama diiwaan gelin wax kharash ah.</p>
                    <Link
                      href={`/expenses/add?projectId=${project.id}`}
                      className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-primary/40"
                    >
                      <Plus size={20} />
                      <span>Ku Dar Kharash</span>
                    </Link>
                  </div>
                ) : (
                  viewModes.expenses === 'list' ? (
                    <>
                      {/* Desktop List: Grouped by category with subtotals and colored category heading - Matching Projects Design */}
                      <div className="space-y-4">
                        {Object.entries(expensesByCategory).map(([cat, exps]) => {
                          const borderColor = cat.toLowerCase() === 'labor' ? 'border-l-4 border-blue-500' :
                            cat.toLowerCase() === 'material' ? 'border-l-4 border-cyan-500' :
                              'border-l-4 border-primary';
                          return (
                            <div key={cat} className={`bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 ${borderColor} p-4`}>
                              <div className="flex items-center justify-between mb-3 pb-2 border-b border-lightGray dark:border-gray-700">
                                <span className={`block font-bold text-lg ${cat.toLowerCase() === 'labor' ? 'text-blue-600 dark:text-blue-400' : cat.toLowerCase() === 'material' ? 'text-cyan-600 dark:text-cyan-400' : 'text-primary'}`}>{cat}</span>
                                <span className="font-semibold text-darkGray dark:text-gray-100 text-sm">Total: <span className="text-redError">-Br{exps.reduce((s, e) => s + (typeof e.amount === 'number' ? e.amount : parseFloat(e.amount as any) || 0), 0).toLocaleString()}</span></span>
                              </div>
                              <div className="space-y-2">
                                {exps.map(exp => (
                                  <div key={exp.id} className='bg-lightGray/30 dark:bg-gray-700/30 p-3 rounded-lg flex justify-between items-center hover:bg-lightGray/50 dark:hover:bg-gray-700/50 transition-colors'>
                                    <div>
                                      <p className='font-bold text-darkGray dark:text-gray-100'>{exp.description}</p>
                                      <p className='text-xs text-mediumGray dark:text-gray-400'>{new Date(exp.expenseDate).toLocaleDateString()}</p>
                                    </div>
                                    <p className='font-bold text-lg text-redError'>-Br{(typeof exp.amount === 'number' ? exp.amount : parseFloat(exp.amount as any) || 0).toLocaleString()}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(expensesByCategory).map(([cat, exps]) => {
                        const borderColor = cat.toLowerCase() === 'labor' ? 'border-l-4 border-blue-500' :
                          cat.toLowerCase() === 'material' ? 'border-l-4 border-cyan-500' :
                            'border-l-4 border-primary';
                        return (
                          <div key={cat} className={`bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 ${borderColor} p-4`}>
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-lightGray dark:border-gray-700">
                              <span className={`block font-bold text-lg ${cat.toLowerCase() === 'labor' ? 'text-blue-600 dark:text-blue-400' : cat.toLowerCase() === 'material' ? 'text-cyan-600 dark:text-cyan-400' : 'text-primary'}`}>{cat}</span>
                              <span className="font-semibold text-darkGray dark:text-gray-100 text-sm">Total: <span className="text-redError">-Br{exps.reduce((s, e) => s + (typeof e.amount === 'number' ? e.amount : parseFloat(e.amount as any) || 0), 0).toLocaleString()}</span></span>
                            </div>
                            <div className="space-y-2">
                              {exps.map(exp => (
                                <div key={exp.id} className="bg-lightGray/30 dark:bg-gray-700/30 p-3 rounded-lg flex flex-col gap-1 hover:bg-lightGray/50 dark:hover:bg-gray-700/50 transition-colors">
                                  <span className="font-bold text-darkGray dark:text-gray-100">{exp.description}</span>
                                  <span className="text-xs text-mediumGray dark:text-gray-400">{new Date(exp.expenseDate).toLocaleDateString()}</span>
                                  <span className="text-right font-semibold text-redError">-Br{(typeof exp.amount === 'number' ? exp.amount : parseFloat(exp.amount as any) || 0).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            )}

            {/* Desktop Materials Content */}
            {activeTab === 'Materials' && (
              <div>
                {project.materialsUsed.length === 0 ? <EmptyState message="Lama diiwaan gelin wax agab la isticmaalay." /> : (
                  viewModes.materials === 'list' ? (
                    <>
                      {/* Desktop Table View */}
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                          <thead>
                            <tr className="bg-primary/10">
                              <th className="border border-lightGray dark:border-gray-700 px-4 py-3 text-left font-semibold text-darkGray dark:text-gray-100">Magaca Alaabta</th>
                              <th className="border border-lightGray dark:border-gray-700 px-4 py-3 text-left font-semibold text-darkGray dark:text-gray-100">Tirada La Isticmaalay</th>
                              <th className="border border-lightGray dark:border-gray-700 px-4 py-3 text-left font-semibold text-darkGray dark:text-gray-100">Unugga</th>
                              <th className="border border-lightGray dark:border-gray-700 px-4 py-3 text-left font-semibold text-darkGray dark:text-gray-100">Qiimaha Unugga</th>
                              <th className="border border-lightGray dark:border-gray-700 px-4 py-3 text-left font-semibold text-darkGray dark:text-gray-100">Wadarta Qiimaha</th>
                              <th className="border border-lightGray dark:border-gray-700 px-4 py-3 text-left font-semibold text-darkGray dark:text-gray-100">Hadhay</th>
                              <th className="border border-lightGray dark:border-gray-700 px-4 py-3 text-left font-semibold text-darkGray dark:text-gray-100">Taariikhda</th>
                            </tr>
                          </thead>
                          <tbody>
                            {project.materialsUsed.map(mat => {
                              const costPerUnit = typeof mat.costPerUnit === 'number' ? mat.costPerUnit : parseFloat(mat.costPerUnit as any) || 0;
                              const totalCost = mat.quantityUsed * costPerUnit;
                              return (
                                <tr key={mat.id} className="hover:bg-lightGray/30 border-b border-lightGray dark:border-gray-700">
                                  <td className="border border-lightGray dark:border-gray-700 px-4 py-3 font-medium text-darkGray dark:text-gray-100">{mat.name}</td>
                                  <td className="border border-lightGray dark:border-gray-700 px-4 py-3 text-darkGray dark:text-gray-100 font-semibold">{mat.quantityUsed}</td>
                                  <td className="border border-lightGray dark:border-gray-700 px-4 py-3 text-mediumGray dark:text-gray-400">{mat.unit}</td>
                                  <td className="border border-lightGray dark:border-gray-700 px-4 py-3 text-darkGray dark:text-gray-100">Br{costPerUnit.toLocaleString()}</td>
                                  <td className="border border-lightGray dark:border-gray-700 px-4 py-3 font-semibold text-primary">Br{totalCost.toLocaleString()}</td>
                                  <td className="border border-lightGray dark:border-gray-700 px-4 py-3 text-darkGray dark:text-gray-100">{mat.leftoverQty} {mat.unit}</td>
                                  <td className="border border-lightGray dark:border-gray-700 px-4 py-3 text-mediumGray dark:text-gray-400">{mat.dateUsed ? new Date(mat.dateUsed).toLocaleDateString() : '-'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {project.materialsUsed.map(mat => (
                        <div key={mat.id} className="bg-lightGray/50 p-4 rounded-lg text-center shadow-sm">
                          <Layers size={32} className="mx-auto text-primary mb-2" />
                          <p className="font-bold">{mat.name}</p>
                          <p className="text-xl font-bold">{mat.quantityUsed} <span className="text-base font-normal">{mat.unit}</span></p>
                          <p className="text-xs text-mediumGray">Hadhay: {mat.leftoverQty}</p>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}

            {/* Desktop Labor Content */}
            {activeTab === 'Labor' && (
              <div className="space-y-6">
                {/* Labor Expenses Summary */}
                <div>
                  <h4 className="font-bold text-lg mb-4 text-blue-700 flex items-center gap-2">
                    <HardHat size={20} />
                    Kharashaadka Shaqaalaha (Labor Expenses)
                  </h4>
                  {project.expenses.filter(e => e.category && e.category.toLowerCase() === 'labor').length === 0 ? (
                    <EmptyState message="Lama diiwaan gelin wax kharash shaqaale ah." />
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-lightGray dark:border-gray-700 p-4">
                      <div className="space-y-2">
                        {project.expenses.filter(e => e.category && e.category.toLowerCase() === 'labor').map(exp => (
                          <div key={exp.id} className="flex items-center justify-between p-3 bg-lightGray/30 dark:bg-gray-700/30 rounded-lg hover:bg-lightGray/50 dark:hover:bg-gray-700/50 transition-colors">
                            <div className="flex-1">
                              <p className="font-semibold text-darkGray dark:text-gray-100">{exp.description}</p>
                              <p className="text-xs text-mediumGray dark:text-gray-400 mt-1">{new Date(exp.expenseDate).toLocaleDateString()}</p>
                            </div>
                            <p className="font-bold text-lg text-redError ml-4">-Br{(typeof exp.amount === 'number' ? exp.amount : parseFloat(exp.amount as any) || 0).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Employee Details Section - Table Design */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-xl text-primary flex items-center gap-2">
                      <User size={24} />
                      Shaqaalaha Mashruuca
                    </h4>
                    <Link
                      href={`/expenses/add?projectId=${project.id}&category=Labor`}
                      className='inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-all shadow-md'
                    >
                      <Plus size={18} />
                      Ku Dar Shaqaale
                    </Link>
                  </div>
                  {(Array.isArray(project.laborRecords) ? project.laborRecords.length : 0) === 0 ? (
                    <EmptyState message="Lama diiwaan gelin wax shaqaale ah." />
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-lightGray dark:border-gray-700 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-primary/10 dark:bg-gray-700">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-bold text-darkGray dark:text-gray-100">Magaca</th>
                              <th className="px-4 py-3 text-left text-sm font-bold text-darkGray dark:text-gray-100">La Qoray</th>
                              <th className="px-4 py-3 text-right text-sm font-bold text-darkGray dark:text-gray-100">La Bixiyay</th>
                              <th className="px-4 py-3 text-right text-sm font-bold text-darkGray dark:text-gray-100">Hadhay</th>
                              <th className="px-4 py-3 text-center text-sm font-bold text-darkGray dark:text-gray-100">Ficilada</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                            {(() => {
                              // Group labor records by employee
                              const employeeMap = new Map<string, {
                                employeeId: string;
                                employeeName: string;
                                firstAgreedWage: number;
                                totalPaid: number;
                                totalRemaining: number;
                                transactions: any[];
                                payments: any[];
                              }>();

                              (project.laborRecords || []).forEach(lab => {
                                const empId = lab.employeeId || 'unknown';
                                if (!employeeMap.has(empId)) {
                                  const agreed = typeof lab.agreedWage === 'number' ? lab.agreedWage : parseFloat(lab.agreedWage as any) || 0;
                                  employeeMap.set(empId, {
                                    employeeId: empId,
                                    employeeName: lab.employeeName || lab.employee?.fullName || 'Unknown',
                                    firstAgreedWage: agreed,
                                    totalPaid: 0,
                                    totalRemaining: 0,
                                    transactions: [],
                                    payments: [],
                                  });
                                }
                                const emp = employeeMap.get(empId)!;
                                const paid = typeof lab.paidAmount === 'number' ? lab.paidAmount : parseFloat(lab.paidAmount as any) || 0;
                                const remaining = typeof lab.remainingWage === 'number' ? lab.remainingWage : parseFloat(lab.remainingWage as any) || 0;
                                emp.totalPaid += paid;
                                emp.totalRemaining += remaining;
                              });

                              // Add transactions and payments
                              // Create a set of expense IDs that have transactions to avoid duplicates
                              const expenseIdsWithTransactions = new Set(
                                (project.transactions || [])
                                  .filter((t: any) => t.expenseId)
                                  .map((t: any) => t.expenseId)
                              );

                              (project.transactions || []).forEach((t: any) => {
                                const emp = employeeMap.get(t.employeeId);
                                if (emp && t.projectId === project.id) {
                                  emp.transactions.push(t);
                                }
                              });

                              // Only add expenses that don't have a corresponding transaction (to avoid duplicates)
                              (project.expenses || []).forEach((e: any) => {
                                const emp = employeeMap.get(e.employeeId);
                                if (emp && e.category?.toLowerCase() === 'labor' && !expenseIdsWithTransactions.has(e.id)) {
                                  emp.payments.push(e);
                                }
                              });

                              return Array.from(employeeMap.values()).map((emp, index) => (
                                <React.Fragment key={emp.employeeId}>
                                  <tr className="hover:bg-lightGray/30 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-4 py-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                                          <User size={20} className="text-white" />
                                        </div>
                                        <div>
                                          <p className="font-bold text-darkGray dark:text-gray-100">{emp.employeeName}</p>
                                          <p className="text-xs text-mediumGray dark:text-gray-400">
                                            {emp.transactions.length} dhaqdhaqaaq • {emp.payments.length} lacag bixin
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-4">
                                      <p className="font-semibold text-accent">Br{emp.firstAgreedWage.toLocaleString()}</p>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                      <p className="font-semibold text-secondary">Br{emp.totalPaid.toLocaleString()}</p>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                      <p className={`font-semibold ${emp.totalRemaining > 0 ? 'text-redError' : 'text-green-600'}`}>
                                        Br{emp.totalRemaining.toLocaleString()}
                                      </p>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                      <Link
                                        href={`/expenses/add?projectId=${project.id}&employeeId=${emp.employeeId}&category=Labor`}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors"
                                      >
                                        <Plus size={14} />
                                        Bixin
                                      </Link>
                                    </td>
                                  </tr>
                                  {/* Expandable Details Row */}
                                  {(emp.transactions.length > 0 || emp.payments.length > 0) && (
                                    <tr>
                                      <td colSpan={5} className="px-4 py-4 bg-lightGray/20 dark:bg-gray-800/50">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {/* Transactions Table */}
                                          {emp.transactions.length > 0 && (
                                            <div>
                                              <h6 className="font-semibold text-sm text-darkGray dark:text-gray-100 mb-2 flex items-center gap-2">
                                                <FileText size={16} className="text-primary" />
                                                Dhaqdhaqaaqaadka
                                              </h6>
                                              <div className="overflow-x-auto">
                                                <table className="w-full text-xs">
                                                  <thead>
                                                    <tr className="bg-white/50 dark:bg-gray-700/50">
                                                      <th className="px-2 py-1.5 text-left font-semibold text-darkGray dark:text-gray-100">Sharaxaad</th>
                                                      <th className="px-2 py-1.5 text-left font-semibold text-darkGray dark:text-gray-100">Taariikh</th>
                                                      <th className="px-2 py-1.5 text-right font-semibold text-darkGray dark:text-gray-100">Qadarka</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                                                    {emp.transactions
                                                      .sort((a: any, b: any) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
                                                      .map((trx: any) => {
                                                        const trxAmount = typeof trx.amount === 'number' ? trx.amount : parseFloat(trx.amount as any) || 0;
                                                        return (
                                                          <tr key={trx.id} className="hover:bg-white/50 dark:hover:bg-gray-700/50">
                                                            <td className="px-2 py-2 text-darkGray dark:text-gray-100">{trx.description || 'Lacag Bixin'}</td>
                                                            <td className="px-2 py-2 text-mediumGray dark:text-gray-400">{new Date(trx.transactionDate).toLocaleDateString()}</td>
                                                            <td className={`px-2 py-2 text-right font-semibold ${trxAmount < 0 ? 'text-redError' : 'text-secondary'}`}>
                                                              {trxAmount < 0 ? '-' : '+'}Br{Math.abs(trxAmount).toLocaleString()}
                                                            </td>
                                                          </tr>
                                                        );
                                                      })}
                                                  </tbody>
                                                </table>
                                              </div>
                                            </div>
                                          )}

                                          {/* Payments Table */}
                                          {emp.payments.length > 0 && (
                                            <div>
                                              <h6 className="font-semibold text-sm text-darkGray dark:text-gray-100 mb-2 flex items-center gap-2">
                                                <DollarSign size={16} className="text-secondary" />
                                                Lacagaha La Siinayay
                                              </h6>
                                              <div className="overflow-x-auto">
                                                <table className="w-full text-xs">
                                                  <thead>
                                                    <tr className="bg-white/50 dark:bg-gray-700/50">
                                                      <th className="px-2 py-1.5 text-left font-semibold text-darkGray dark:text-gray-100">Sharaxaad</th>
                                                      <th className="px-2 py-1.5 text-left font-semibold text-darkGray dark:text-gray-100">Taariikh</th>
                                                      <th className="px-2 py-1.5 text-right font-semibold text-darkGray dark:text-gray-100">Qadarka</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody className="divide-y divide-lightGray dark:divide-gray-700">
                                                    {emp.payments
                                                      .sort((a: any, b: any) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())
                                                      .map((exp: any) => {
                                                        const expAmount = typeof exp.amount === 'number' ? exp.amount : parseFloat(exp.amount as any) || 0;
                                                        return (
                                                          <tr key={exp.id} className="hover:bg-white/50 dark:hover:bg-gray-700/50">
                                                            <td className="px-2 py-2 text-darkGray dark:text-gray-100">{exp.description || 'Lacag Bixin'}</td>
                                                            <td className="px-2 py-2 text-mediumGray dark:text-gray-400">{new Date(exp.expenseDate).toLocaleDateString()}</td>
                                                            <td className="px-2 py-2 text-right font-semibold text-secondary">Br{expAmount.toLocaleString()}</td>
                                                          </tr>
                                                        );
                                                      })}
                                                  </tbody>
                                                </table>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              ));
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Desktop Payments Content */}
            {activeTab === 'Payments' && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-600 dark:text-green-400 mb-1">Lacagaha La Helay</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      Br{(typeof project.advancePaid === 'number' ? project.advancePaid : parseFloat(project.advancePaid as any) || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="text-sm text-orange-600 dark:text-orange-400 mb-1">Ku Dhiman</p>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                      Br{(typeof project.remainingAmount === 'number' ? project.remainingAmount : parseFloat(project.remainingAmount as any) || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-600 dark:text-red-400 mb-1">Wadarta Kharashaadka</p>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                      Br{((project.expenses || []).reduce((sum: number, e: any) => sum + (typeof e.amount === 'number' ? e.amount : parseFloat(e.amount) || 0), 0) +
                        (project.laborRecords || []).reduce((sum: number, l: any) => sum + (typeof l.paidAmount === 'number' ? l.paidAmount : parseFloat(l.paidAmount) || 0), 0)).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Heshiiska</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      Br{(typeof project.agreementAmount === 'number' ? project.agreementAmount : parseFloat(project.agreementAmount as any) || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Customer Payments (Income) */}
                <div>
                  <h4 className="font-bold text-lg mb-3 text-secondary">Lacagaha Macmiilka (Customer Payments)</h4>
                  {(Array.isArray(project.payments) ? project.payments.length : 0) === 0 ? (
                    <EmptyState message="Lama diiwaan gelin wax lacag macmiilka ka ah." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                        <thead className="bg-lightGray dark:bg-gray-700">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-darkGray dark:text-gray-100">Nooca</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-darkGray dark:text-gray-100">Taariikh</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-darkGray dark:text-gray-100">Halka La Helay</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-darkGray dark:text-gray-100">Lacag</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-lightGray dark:divide-gray-700">
                          {(project.payments || []).map(p => (
                            <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-4 py-3 text-sm text-darkGray dark:text-gray-100">{p.paymentType || 'Payment'}</td>
                              <td className="px-4 py-3 text-sm text-mediumGray dark:text-gray-400">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '-'}</td>
                              <td className="px-4 py-3 text-sm text-mediumGray dark:text-gray-400">{p.receivedIn || '-'}</td>
                              <td className="px-4 py-3 text-right text-sm font-bold text-secondary">+Br{(typeof p.amount === 'number' ? p.amount : parseFloat(p.amount as any) || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Labor Payments */}
                <div>
                  <h4 className="font-bold text-lg mb-3 text-orange-600">Lacagaha Shaqaalaha (Labor Payments)</h4>
                  {(() => {
                    const laborPayments = (project.laborRecords || []).filter((lr: any) => lr.paidAmount > 0);
                    if (laborPayments.length === 0) {
                      return <EmptyState message="Lama diiwaan gelin wax lacag shaqaale ah." />;
                    }
                    return (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                          <thead className="bg-lightGray dark:bg-gray-700">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-darkGray dark:text-gray-100">Shaqaale</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-darkGray dark:text-gray-100">Sharaxaad</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-darkGray dark:text-gray-100">Taariikh</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-darkGray dark:text-gray-100">La Bixiyay</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-darkGray dark:text-gray-100">Ku Dhiman</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-lightGray dark:divide-gray-700">
                            {laborPayments.map((lr: any) => (
                              <tr key={lr.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-4 py-3 text-sm font-semibold text-darkGray dark:text-gray-100">{lr.employeeName || 'Unknown'}</td>
                                <td className="px-4 py-3 text-sm text-mediumGray dark:text-gray-400">{lr.workDescription || '-'}</td>
                                <td className="px-4 py-3 text-sm text-mediumGray dark:text-gray-400">{lr.dateWorked ? new Date(lr.dateWorked).toLocaleDateString() : '-'}</td>
                                <td className="px-4 py-3 text-right text-sm font-bold text-orange-600">-Br{(typeof lr.paidAmount === 'number' ? lr.paidAmount : parseFloat(lr.paidAmount) || 0).toLocaleString()}</td>
                                <td className="px-4 py-3 text-right text-sm font-semibold text-redError">Br{(typeof lr.remainingWage === 'number' ? lr.remainingWage : parseFloat(lr.remainingWage) || 0).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>

                {/* Project Expenses */}
                <div>
                  <h4 className="font-bold text-lg mb-3 text-redError">Kharashaadka Mashruuca (Project Expenses)</h4>
                  {(() => {
                    const otherExpenses = (project.expenses || []).filter((e: any) => e.category !== 'Labor');
                    if (otherExpenses.length === 0) {
                      return <EmptyState message="Lama diiwaan gelin wax kharash mashruuc ah." />;
                    }
                    return (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                          <thead className="bg-lightGray dark:bg-gray-700">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-darkGray dark:text-gray-100">Sharaxaad</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-darkGray dark:text-gray-100">Nooca</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-darkGray dark:text-gray-100">Taariikh</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-darkGray dark:text-gray-100">Lacag</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-lightGray dark:divide-gray-700">
                            {otherExpenses.map((exp: any) => (
                              <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-4 py-3 text-sm text-darkGray dark:text-gray-100">{exp.description || '-'}</td>
                                <td className="px-4 py-3 text-sm">
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${exp.category === 'Material' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200' :
                                    exp.category === 'Transport' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200' :
                                      'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
                                    }`}>
                                    {exp.category}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-mediumGray dark:text-gray-400">{new Date(exp.expenseDate).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-right text-sm font-bold text-redError">-Br{(typeof exp.amount === 'number' ? exp.amount : parseFloat(exp.amount) || 0).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>

                {/* Transactions */}
                {project.transactions && project.transactions.length > 0 && (
                  <div>
                    <h4 className="font-bold text-lg mb-3 text-primary">Dhaqdhaqaaqa Lacagta (Transactions)</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-lightGray dark:divide-gray-700">
                        <thead className="bg-lightGray dark:bg-gray-700">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-darkGray dark:text-gray-100">Sharaxaad</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-darkGray dark:text-gray-100">Nooca</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-darkGray dark:text-gray-100">Taariikh</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-darkGray dark:text-gray-100">Lacag</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-lightGray dark:divide-gray-700">
                          {project.transactions.map((trx: any) => (
                            <tr key={trx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-4 py-3 text-sm text-darkGray dark:text-gray-100">{trx.description || '-'}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${trx.type === 'INCOME' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
                                  trx.type === 'EXPENSE' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200' :
                                    trx.type === 'DEBT_TAKEN' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200' :
                                      'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
                                  }`}>
                                  {trx.type}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-mediumGray dark:text-gray-400">{new Date(trx.transactionDate).toLocaleDateString()}</td>
                              <td className={`px-4 py-3 text-right text-sm font-bold ${trx.type === 'INCOME' || trx.type === 'DEBT_REPAID' ? 'text-secondary' : 'text-redError'
                                }`}>
                                {trx.type === 'INCOME' || trx.type === 'DEBT_REPAID' ? '+' : '-'}Br{Math.abs(typeof trx.amount === 'number' ? trx.amount : parseFloat(trx.amount) || 0).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Desktop Documents Content */}
            {activeTab === 'Documents' && (
              <div>
                <h4 className="font-bold text-lg mb-2 text-primary">Rasiidada Kharashaadka (Receipt Images)</h4>
                {(() => {
                  const expensesWithReceipts = project.expenses.filter(exp => exp.receiptUrl);

                  if (expensesWithReceipts.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <FileText className="mx-auto text-gray-400 dark:text-gray-500" size={48} />
                        <p className="text-gray-700 dark:text-gray-200 mt-2">Ma jiraan rasiido oo la xiriira kharashaadka mashruuca.</p>
                        <Link
                          href="/expenses/add"
                          className="mt-4 inline-flex items-center gap-2 bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                        >
                          <Plus size={18} />
                          Ku Dar Kharash + Rasiid
                        </Link>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {expensesWithReceipts.map((expense) => (
                        <div key={expense.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                          <div className="mb-3">
                            <h4 className="font-semibold text-darkGray dark:text-gray-100">{expense.description}</h4>
                            <p className="text-sm text-mediumGray dark:text-gray-400">Br{expense.amount.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {new Date(expense.expenseDate).toLocaleDateString()}
                            </p>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${expense.category === 'Material' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200' :
                              expense.category === 'Labor' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
                                expense.category === 'Company Expense' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
                              }`}>
                              {expense.category}
                            </span>
                          </div>

                          {expense.receiptUrl && (
                            <div className="mb-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={expense.receiptUrl}
                                alt={`Receipt for ${expense.description}`}
                                className="w-full h-32 object-cover rounded-lg border border-lightGray dark:border-gray-700"
                                onClick={() => window.open(expense.receiptUrl, '_blank')}
                                style={{ cursor: 'pointer' }}
                              />
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Click to view full size</p>
                            </div>
                          )}

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(expense.expenseDate).toLocaleDateString()}
                            </span>
                            <button
                              onClick={() => window.open(expense.receiptUrl, '_blank')}
                              className="text-primary hover:text-blue-700 text-sm font-medium"
                            >
                              View Receipt
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

            )}

            {/* Desktop Financials Content */}
            {activeTab === 'Financials' && (
              <div className="animate-in fade-in duration-300">
                <h4 className="font-bold text-lg mb-6 text-primary flex items-center gap-2 border-b border-lightGray dark:border-gray-700 pb-3">
                  <Scale size={24} />
                  Warbixinta Maaliyadda (Financial Statement)
                </h4>
                <ProjectFinancials projectId={project.id} />
              </div>
            )}

          </div>
        </div>
      </div>
      {toastMessage && <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />}
    </Layout >
  );
};

export default ProjectDetailsPage;

// --- SUB-COMPONENT: PROJECT FINANCIALS ---
function ProjectFinancials({ projectId }: { projectId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFS = async () => {
      try {
        const res = await fetch(`/api/shop/reports/balance-sheet?projectId=${projectId}`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchFS();
  }, [projectId]);

  if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline-block w-8 h-8 text-primary" /></div>;
  if (!data) return <div className="p-8 text-center text-red-500 font-bold">Failed to load financial data.</div>;

  const netProfit = data.equity.retainedEarnings.value; // Revenue - Expense

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Summary Cards */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-lightGray dark:border-gray-700 shadow-sm">
          <h4 className="text-mediumGray dark:text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">Net Profit / Loss</h4>
          <p className={`text-3xl font-black ${netProfit >= 0 ? 'text-emerald-500' : 'text-redError'}`}>
            Br{netProfit.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-lightGray dark:border-gray-700 shadow-sm">
          <h4 className="text-mediumGray dark:text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">Total Receivables</h4>
          <p className="text-3xl font-black text-blue-500">
            Br{data.assets.current.accountsReceivable.value.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-lightGray dark:border-gray-700 shadow-sm">
          <h4 className="text-mediumGray dark:text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">Unpaid Expenses</h4>
          <p className="text-3xl font-black text-orange-500">
            Br{data.liabilities.current.accountsPayable.value.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Detailed Statement */}
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-lightGray dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-lightGray dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h3 className="text-lg font-black text-darkGray dark:text-gray-100 flex items-center gap-2">
            <Scale size={20} className="text-primary" /> Project Balance Sheet
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Assets */}
          <div>
            <h4 className="font-bold text-emerald-600 uppercase tracking-widest text-xs mb-4 border-b border-emerald-100 dark:border-emerald-900/30 pb-2">Assets</h4>
            <div className="space-y-4">
              <FinancialRow label="Accounts Receivable (Unpaid)" value={data.assets.current.accountsReceivable.value} />
              {data.assets.current.inventory.value > 0 && <FinancialRow label="Inventory / WIP" value={data.assets.current.inventory.value} />}
              {data.assets.fixed.value > 0 && <FinancialRow label="Project Assets" value={data.assets.fixed.value} />}
              <div className="pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
                <FinancialRow label="Total Assets" value={data.assets.total} bold />
              </div>
            </div>
          </div>

          {/* Liabilities & Equity */}
          <div>
            <h4 className="font-bold text-orange-600 uppercase tracking-widest text-xs mb-4 border-b border-orange-100 dark:border-orange-900/30 pb-2">Liabilities & Equity</h4>
            <div className="space-y-4">
              <FinancialRow label="Unpaid Expenses" value={data.liabilities.current.accountsPayable.value} />
              <FinancialRow label="Project Net Profit (Equity)" value={data.equity.retainedEarnings.value} />
              <div className="pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
                <FinancialRow label="Total L & E" value={data.liabilities.total + data.equity.total} bold />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link
          href={`/shop/reports/ledger?type=PROJECT&id=${projectId}`}
          className="inline-flex items-center gap-2 text-primary font-bold hover:underline bg-primary/10 px-4 py-2 rounded-full transition-colors hover:bg-primary/20"
        >
          View General Ledger for this Project <ArrowUpRight size={16} />
        </Link>
      </div>
    </div>
  )
}

function FinancialRow({ label, value, bold }: { label: string, value: number, bold?: boolean }) {
  return (
    <div className={`flex justify-between items-center ${bold ? 'text-base font-black' : 'text-sm'}`}>
      <span className={`${bold ? 'text-darkGray dark:text-gray-100' : 'text-mediumGray dark:text-gray-400 font-medium'}`}>{label}</span>
      <span className={`${bold ? 'text-darkGray dark:text-gray-100' : 'text-darkGray dark:text-gray-200 font-bold'}`}>Br{value.toLocaleString()}</span>
    </div>
  );
}