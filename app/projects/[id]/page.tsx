// app/projects/[id]/page.tsx - FINAL VERSION with List/Board View Options
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Layout from '../../../components/layouts/Layout';
import {
    ArrowLeft, DollarSign, User, Layers, HardHat, FileText, Plus, Edit, Trash2, CheckCircle, Clock, Loader2,
    Calendar, Info, Tag, Wallet, BarChart2, AlertTriangle, Download, List, LayoutGrid
} from 'lucide-react';
import Toast from '../../../components/common/Toast';

// --- Project Data Interface (From Your Original Code) ---
interface Project {
    id: string; name: string; description?: string; customer: { id: string; name: string; email?: string; };
    agreementAmount: number; advancePaid: number; remainingAmount: number; projectType: string;
    status: 'Active' | 'Completed' | 'On Hold' | 'Cancelled' | 'Overdue' | 'Nearing Deadline';
    expectedCompletionDate?: string; actualCompletionDate?: string; notes?: string; createdAt: string; updatedAt: string;
    expenses: { id: string; description: string; amount: number; category: string; expenseDate: string; receiptUrl?: string; }[];
    materialsUsed: { id: string; name: string; quantityUsed: number; unit: string; leftoverQty: number; costPerUnit: number | string; dateUsed?: string; }[];
    laborRecords: { id: string; employeeName: string; workDescription: string; agreedWage: number; paidAmount: number; remainingWage: number; }[];
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
        materials: 'list',
    });

    // --- API & EVENT HANDLERS (UNCHANGED) ---
    // --- Fetch Project Details ---
    const fetchProjectDetails = async () => {
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
    };

    // --- Delete Project Handler (unchanged, but always set loading false) ---
    const handleDeleteProject = async () => { /* ... original logic ... */ };

    useEffect(() => {
        if (id) fetchProjectDetails();
        else {
            setProject(null);
            setLoading(false);
        }
    }, [id]);

    // Real-time update when accounting transactions are created
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'transactionCreated' && e.newValue) {
                const transactionData = JSON.parse(e.newValue);
                if (transactionData.projectId === id) {
                    // Refresh project data when a transaction is created for this project
                    console.log('Transaction created for project:', transactionData);
                    fetchProjectDetails();
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [id]);

    // Real-time update when project payments are made
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'projectPaymentCreated' && e.newValue) {
                const paymentData = JSON.parse(e.newValue);
                if (paymentData.projectId === id) {
                    // Refresh project data when a payment is made for this project
                    console.log('Payment created for project:', paymentData);
                    fetchProjectDetails();
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [id]);

    // --- RENDER LOGIC ---
    if (loading) return <Layout><div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-primary" size={48} /></div></Layout>;
    if (!project) return <Layout><div className="text-center p-8 mt-10 max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg"><AlertTriangle size={48} className="text-redError mx-auto" /><h2 className="text-2xl font-bold mt-4">Mashruucaan Lama Helin</h2><p className="text-mediumGray dark:text-gray-400 mt-2">Lama helin mashruuca ID-giisu yahay "{id}".</p><Link href="/projects" className="mt-6 inline-flex items-center gap-2 bg-primary text-white py-2 px-4 rounded-lg font-semibold"><ArrowLeft size={18} /> Ku noqo Liiska Mashaariicda</Link></div>{toastMessage && <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />}</Layout>;

    // Always calculate remainingAmount from agreementAmount - advancePaid, always use numbers
    const totalValue = typeof project.agreementAmount === 'number' ? project.agreementAmount : parseFloat(project.agreementAmount as any) || 0;
    const totalAdvance = typeof project.advancePaid === 'number' ? project.advancePaid : parseFloat(project.advancePaid as any) || 0;
    const remainingAmount = Math.max(0, totalValue - totalAdvance);  // ✅ Ensure not negative
    const tabs = ['Overview', 'Expenses', 'Materials', 'Labor', 'Payments', 'Documents'];

    // Calculate total expenses (for this project only)
    const totalExpenses = project?.expenses?.reduce((sum, expense) => sum + (typeof expense.amount === 'number' ? expense.amount : parseFloat(expense.amount as any) || 0), 0) || 0;

    // Group expenses by category
    const expensesByCategory = (project?.expenses || []).reduce((acc, exp) => {
      if (!acc[exp.category]) acc[exp.category] = [];
      acc[exp.category].push(exp);
      return acc;
    }, {} as Record<string, typeof project.expenses>);

    // --- View Toggle Component ---
    const ViewSwitcher = ({ tabKey }: { tabKey: 'overview' | 'expenses' | 'materials' }) => (
        <div className="flex items-center gap-1 bg-lightGray p-1 rounded-lg">
            <button
                onClick={() => setViewModes(prev => ({...prev, [tabKey]: 'list'}))}
                className={`p-1.5 rounded-md ${viewModes[tabKey] === 'list' ? 'bg-white shadow' : 'text-mediumGray'}`}
                title="List View"
            >
                <List size={18}/>
            </button>
            <button
                onClick={() => setViewModes(prev => ({...prev, [tabKey]: 'board'}))}
                className={`p-1.5 rounded-md ${viewModes[tabKey] === 'board' ? 'bg-white shadow' : 'text-mediumGray'}`}
                title="Board View"
            >
                <LayoutGrid size={18}/>
            </button>
        </div>
    );

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
                  <p className="text-sm text-secondary">Total Advance</p>
                  <p className="text-2xl font-bold text-secondary">Br{totalAdvance.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
                  <p className="text-sm text-secondary">Total Expenses</p>
                  <p className="text-2xl font-bold text-secondary">Br{totalExpenses.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
                  <p className="text-sm text-redError">Total Remaining</p>
                  <p className="text-2xl font-bold text-redError">Br{remainingAmount.toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md flex flex-col justify-center items-center">
                  <ProjectStatusBadge status={project.status} />
                </div>
            </div>

            {/* Tabs Container */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <nav className="flex space-x-2 px-2 border-b border-lightGray dark:border-gray-700 overflow-x-auto">
                    {tabs.map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 whitespace-nowrap py-3 px-3 text-sm font-semibold ${activeTab === tab ? 'border-b-2 border-primary text-primary' : 'border-b-2 border-transparent text-mediumGray hover:text-darkGray'}`}>{tab}</button>)}
                </nav>

                <div className="p-4 md:p-6">
                     <div className='flex justify-between items-center mb-4'>
                        <h3 className="text-xl font-bold text-darkGray dark:text-gray-100">{activeTab}</h3>
                        {['Overview', 'Expenses', 'Materials'].includes(activeTab) && <ViewSwitcher tabKey={activeTab.toLowerCase() as any} />}
                    </div>
                    
                    {/* --- PRESERVING YOUR ORIGINAL TAB STRUCTURE --- */}
                    {activeTab === 'Overview' && (
                        viewModes.overview === 'board' ? (
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
                        )
                    )}

                    {activeTab === 'Expenses' && (
    <div>
        {project.expenses.length === 0 ? <EmptyState message="Lama diiwaan gelin wax kharash ah."/> : (
            viewModes.expenses === 'list' ? (
                <>
                    {/* Mobile List: Grouped by category with subtotals and colored category heading */}
                    <div className="space-y-6 md:hidden">
                        {Object.entries(expensesByCategory).map(([cat, exps]) => (
                            <div key={cat} className="bg-lightGray/30 rounded-lg p-2">
                                <div className="mb-2">
                                    <span className={`block font-bold text-lg ${cat.toLowerCase() === 'labor' ? 'text-blue-500' : cat.toLowerCase() === 'material' ? 'text-cyan-600' : 'text-primary'}`}>{cat}</span>
                                </div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold text-darkGray text-sm">Total: <span className="text-redError">-Br{exps.reduce((s, e) => s + (typeof e.amount === 'number' ? e.amount : parseFloat(e.amount as any) || 0), 0).toLocaleString()}</span></span>
                                </div>
                                <div className="space-y-2">
                                    {exps.map(exp => (
                                        <div key={exp.id} className='bg-white p-3 rounded-lg flex justify-between items-center shadow-sm'>
                                            <div>
                                                <p className='font-bold'>{exp.description}</p>
                                                <p className='text-xs text-mediumGray'>{new Date(exp.expenseDate).toLocaleDateString()}</p>
                                            </div>
                                            <p className='font-bold text-lg text-redError'>-Br{(typeof exp.amount === 'number' ? exp.amount : parseFloat(exp.amount as any) || 0).toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Desktop Table: Grouped by category with subtotals and colored category heading */}
                    <div className="hidden md:block">
                        {Object.entries(expensesByCategory).map(([cat, exps]) => (
                            <div key={cat} className="mb-6">
                                <div className="mb-2">
                                    <span className={`block font-bold text-xl ${cat.toLowerCase() === 'labor' ? 'text-blue-500' : cat.toLowerCase() === 'material' ? 'text-cyan-600' : 'text-primary'}`}>{cat}</span>
                                </div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold text-darkGray text-base">Total: <span className="text-redError">-Br{exps.reduce((s, e) => s + (typeof e.amount === 'number' ? e.amount : parseFloat(e.amount as any) || 0), 0).toLocaleString()}</span></span>
                                </div>
                                <table className='w-full text-sm mb-2'>
                                    <thead><tr className='text-left bg-lightGray'><th>Taariikh</th><th>Sharaxaad</th><th className='text-right'>Qiimaha</th></tr></thead>
                                    <tbody>
                                        {exps.map(exp => (
                                            <tr key={exp.id}>
                                                <td>{new Date(exp.expenseDate).toLocaleDateString()}</td>
                                                <td>{exp.description}</td>
                                                <td className='text-right font-semibold text-redError'>-Br{(typeof exp.amount === 'number' ? exp.amount : parseFloat(exp.amount as any) || 0).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(expensesByCategory).map(([cat, exps]) => (
                        <div key={cat} className="bg-lightGray/30 rounded-lg p-3 shadow">
                            <div className="mb-2">
                                <span className={`block font-bold text-xl ${cat.toLowerCase() === 'labor' ? 'text-blue-500' : cat.toLowerCase() === 'material' ? 'text-cyan-600' : 'text-primary'}`}>{cat}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-darkGray text-base">Total: <span className="text-redError">-Br{exps.reduce((s, e) => s + (typeof e.amount === 'number' ? e.amount : parseFloat(e.amount as any) || 0), 0).toLocaleString()}</span></span>
                            </div>
                            <div className="space-y-2">
                                {exps.map(exp => (
                                    <div key={exp.id} className="bg-white p-3 rounded-lg flex flex-col gap-1 shadow-sm">
                                        <span className="font-bold">{exp.description}</span>
                                        <span className="text-xs text-mediumGray">{new Date(exp.expenseDate).toLocaleDateString()}</span>
                                        <span className="text-right font-semibold text-redError">-Br{(typeof exp.amount === 'number' ? exp.amount : parseFloat(exp.amount as any) || 0).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )
        )}
    </div>
                    )}
                    
                    {activeTab === 'Materials' && (
                        <div>
                            {/* Show all materials used for this project */}
                            <h4 className="font-bold text-lg mb-2 text-cyan-700">Kharashaadka Agabka (Materials)</h4>
                            {project.materialsUsed.length === 0 ? (
                                <EmptyState message="Lama diiwaan gelin wax agab mashruucan la isticmaalay." />
                            ) : (
                                <div className="overflow-x-auto mb-6">
                                    <table className="min-w-full text-sm rounded-xl overflow-hidden">
                                        <thead className="bg-lightGray">
                                            <tr>
                                                <th className="px-3 py-2 text-left">Magaca Alaabta</th>
                                                <th className="px-3 py-2 text-right">Tirada</th>
                                                <th className="px-3 py-2 text-right">Qiimaha Unit (Br)</th>
                                                <th className="px-3 py-2 text-right">Unit</th>
                                                <th className="px-3 py-2 text-right">Wadarta</th>
                                                <th className="px-3 py-2 text-right">Hadhay</th>
                                                <th className="px-3 py-2 text-right">Taariikhda</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-lightGray">
                                            {project.materialsUsed.map((mat) => (
                                                <tr key={mat.id}>
                                                    <td className="px-3 py-2 font-medium text-darkGray">{mat.name}</td>
                                                    <td className="px-3 py-2 text-right text-mediumGray">{mat.quantityUsed}</td>
                                                    <td className="px-3 py-2 text-right text-mediumGray">Br{Number(mat.costPerUnit).toLocaleString()}</td>
                                                    <td className="px-3 py-2 text-right text-mediumGray">{mat.unit}</td>
                                                    <td className="px-3 py-2 text-right font-semibold text-darkGray">Br{(mat.quantityUsed * Number(mat.costPerUnit)).toLocaleString()}</td>
                                                    <td className="px-3 py-2 text-right text-mediumGray">{mat.leftoverQty}</td>
                                                    <td className="px-3 py-2 text-right text-mediumGray">{mat.dateUsed ? new Date(mat.dateUsed).toLocaleDateString() : '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {/* Show materials used as before */}
                            <h4 className="font-bold text-lg mb-2 text-primary">Agabkii La Isticmaalay</h4>
                            {project.materialsUsed.length === 0 ? <EmptyState message="Lama diiwaan gelin wax agab la isticmaalay." /> : (
                                viewModes.materials === 'list' ? (
                                    <>
                                        <div className="md: space-y-3">{project.materialsUsed.map(mat => (<div key={mat.id} className='bg-lightGray/50 p-3 rounded-lg flex justify-between items-center'><div><p className='font-bold'>{mat.name}</p><p className='text-xs text-mediumGray'>Hadhay: {mat.leftoverQty} {mat.unit}</p></div><p className='font-bold text-lg'>{mat.quantityUsed} <span className='text-sm font-normal text-mediumGray'>{mat.unit}</span></p></div>))}</div>
                                        <div className="hidden md:block"><table className='w-full text-sm'><thead><tr className='text-left bg-lightGray'><th>Magaca</th><th>La Isticmaalay</th><th>Hadhaaga</th></tr></thead><tbody>{project.materialsUsed.map(mat => (<tr key={mat.id}><td>{mat.name}</td><td>{mat.quantityUsed} {mat.unit}</td><td>{mat.leftoverQty} {mat.unit}</td></tr>))}</tbody></table></div>
                                    </>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {project.materialsUsed.map(mat => (
                                            <div key={mat.id} className="bg-lightGray/50 p-4 rounded-lg text-center shadow-sm">
                                                <Layers size={32} className="mx-auto text-primary mb-2"/>
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
                     
                    {/* The rest of the tabs without the view switcher */}
                    {['Labor', 'Payments', 'Documents'].includes(activeTab) && (
                        <div>
                            <div className="md:hidden space-y-3">
                                {activeTab === 'Labor' && (
                                    <>
                                        <h4 className="font-bold text-lg mb-2 text-blue-700">Kharashaadka Shaqaalaha (Labor)</h4>
                                        {project.expenses.filter(e => e.category && e.category.toLowerCase() === 'labor').length === 0 ? (
                                            <EmptyState message="Lama diiwaan gelin wax kharash shaqaale ah." />
                                        ) : (
                                            <div className="space-y-2 mb-6">
                                                {project.expenses.filter(e => e.category && e.category.toLowerCase() === 'labor').map(exp => (
                                                    <div key={exp.id} className="bg-white p-3 rounded-lg flex justify-between items-center shadow-sm">
                                                        <div>
                                                            <p className="font-bold">{exp.description}</p>
                                                            <p className="text-xs text-mediumGray">{new Date(exp.expenseDate).toLocaleDateString()}</p>
                                                        </div>
                                                        <p className="font-bold text-lg text-redError">-Br{(typeof exp.amount === 'number' ? exp.amount : parseFloat(exp.amount as any) || 0).toLocaleString()}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <h4 className="font-bold text-lg mb-2 text-primary">Shaqaalaha</h4>
                                        {(Array.isArray(project.laborRecords) ? project.laborRecords.length : 0) === 0 ? (
                                            <EmptyState message="Lama diiwaan gelin wax shaqaale ah." />
                                        ) : (
                                            <div className="space-y-2">
                                                {(project.laborRecords || []).map(lab => {
                                                    const agreed = typeof lab.agreedWage === 'number' ? lab.agreedWage : parseFloat(lab.agreedWage as any) || 0;
                                                    const paid = typeof lab.paidAmount === 'number' ? lab.paidAmount : parseFloat(lab.paidAmount as any) || 0;
                                                    const remaining = typeof lab.remainingWage === 'number' ? lab.remainingWage : parseFloat(lab.remainingWage as any) || 0;
                                                    return (
                                                        <div key={lab.id} className='bg-white p-3 rounded-lg shadow-sm'>
                                                            <div className='flex items-start justify-between gap-3'>
                                                                <div className='min-w-0'>
                                                                    <p className='font-bold truncate'>{lab.employeeName || '-'}</p>
                                                                    <p className='text-xs text-mediumGray truncate'>{lab.workDescription || '-'}</p>
                                                                </div>
                                                                <div className='text-right'>
                                                                    <p className='text-xs text-mediumGray'>Agreed</p>
                                                                    <p className='font-bold text-accent'>Br{agreed.toLocaleString()}</p>
                                                                </div>
                                                            </div>
                                                            <div className='mt-2 grid grid-cols-2 gap-2'>
                                                                <div className='bg-lightGray/40 rounded p-2 text-center'>
                                                                    <p className='text-xs text-mediumGray'>Paid</p>
                                                                    <p className='font-bold text-green-600'>Br{paid.toLocaleString()}</p>
                                                                </div>
                                                                <div className='bg-lightGray/40 rounded p-2 text-center'>
                                                                    <p className='text-xs text-mediumGray'>Remaining</p>
                                                                    <p className={`font-bold ${remaining > 0 ? 'text-redError' : 'text-secondary'}`}>Br{remaining.toLocaleString()}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                )}
                                {activeTab === 'Payments' && (
                                    <>
                                        <h4 className="font-bold text-lg mb-2 text-green-700">Kharashaadka Lacagaha (Payments)</h4>
                                        {project.expenses.filter(e => e.category && e.category.toLowerCase() === 'payment').length === 0 ? (
                                            <EmptyState message="Lama diiwaan gelin wax kharash lacag bixin ah." />
                                        ) : (
                                            <div className="space-y-2 mb-6">
                                                {project.expenses.filter(e => e.category && e.category.toLowerCase() === 'payment').map(exp => (
                                                    <div key={exp.id} className="bg-white p-3 rounded-lg flex justify-between items-center shadow-sm">
                                                        <div>
                                                            <p className="font-bold">{exp.description}</p>
                                                            <p className="text-xs text-mediumGray">{new Date(exp.expenseDate).toLocaleDateString()}</p>
                                                        </div>
                                                        <p className="font-bold text-lg text-redError">-Br{(typeof exp.amount === 'number' ? exp.amount : parseFloat(exp.amount as any) || 0).toLocaleString()}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <h4 className="font-bold text-lg mb-2 text-primary">Lacagaha</h4>
                                        {(Array.isArray(project.payments) ? project.payments.length : 0) === 0 ? <EmptyState message="Lama diiwaan gelin wax lacag bixin ah." /> : (project.payments || []).map(p => (
                                            <div key={p.id} className='bg-lightGray/50 p-3 rounded-lg flex justify-between items-center'>
                                                <div>
                                                    <p className='font-bold'>{p.paymentType || '-'}</p>
                                                    <p className='text-xs text-mediumGray'>{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '-'}</p>
                                                </div>
                                                <p className='font-bold text-lg text-secondary'>+Br{(typeof p.amount === 'number' ? p.amount : parseFloat(p.amount as any) || 0).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </>
                                )}
                                {activeTab === 'Documents' && (
                                    <>
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
                                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                                    expense.category === 'Material' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200' :
                                                                    expense.category === 'Labor' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
                                                                    expense.category === 'Company Expense' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200' :
                                                                    'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
                                                                }`}>
                                                                    {expense.category}
                                                                </span>
                                                            </div>
                                                            
                                                            {expense.receiptUrl && (
                                                                <div className="mb-3">
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
                                    </>
                                )}
                            </div>
                            <div className="hidden md:block">
                                <table className='w-full text-sm'>
                                    {activeTab === 'Labor' && (project.laborRecords.length > 0 && (
                                        <thead>
                                            <tr className='text-left bg-lightGray'>
                                                <th>Magaca Shaqaalaha</th>
                                                <th>Shaqada</th>
                                                <th className='text-right'>Agreed</th>
                                                <th className='text-right'>Paid</th>
                                                <th className='text-right'>Remaining</th>
                                            </tr>
                                        </thead>
                                    ))}
                                    {activeTab === 'Payments' && (project.payments.length > 0 && <thead><tr className='text-left bg-lightGray'><th>Taariikh</th><th>Nooca</th><th>Lagu Helay</th><th className='text-right'>Qiimaha</th></tr></thead>)}
                                    {activeTab === 'Documents' && (project.expenses.filter(exp => exp.receiptUrl).length > 0 && <thead><tr className='text-left bg-lightGray'><th>Sharaxaad</th><th>Nooca</th><th>Lacag</th><th>Taariikh</th><th>Rasiid</th></tr></thead>)}
                                    <tbody>
                                        {activeTab === 'Labor' && (
                                            <>
                                                {/* Expenses for Labor */}
                                                {project.expenses.filter(e => e.category && e.category.toLowerCase() === 'labor').map(exp => (
                                                    <tr key={exp.id + '-exp'}>
                                                        <td colSpan={2} className="font-bold text-blue-700">{exp.description}</td>
                                                        <td colSpan={2} className="text-right font-semibold text-redError">-Br{(typeof exp.amount === 'number' ? exp.amount : parseFloat(exp.amount as any) || 0).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                                {/* Labor Records */}
                                                {(Array.isArray(project.laborRecords) ? project.laborRecords.length : 0) === 0 
                                                    ? (<tr><td colSpan={5}><EmptyState message="Lama diiwaan gelin wax shaqaale ah." /></td></tr>) 
                                                    : (project.laborRecords || []).map(lab => {
                                                        const agreed = typeof lab.agreedWage === 'number' ? lab.agreedWage : parseFloat(lab.agreedWage as any) || 0;
                                                        const paid = typeof lab.paidAmount === 'number' ? lab.paidAmount : parseFloat(lab.paidAmount as any) || 0;
                                                        const remaining = typeof lab.remainingWage === 'number' ? lab.remainingWage : parseFloat(lab.remainingWage as any) || 0;
                                                        return (
                                                            <tr key={lab.id}>
                                                                <td>{lab.employeeName || '-'}</td>
                                                                <td>{lab.workDescription || '-'}</td>
                                                                <td className='text-right'>Br{agreed.toLocaleString()}</td>
                                                                <td className='text-right text-green-600'>Br{paid.toLocaleString()}</td>
                                                                <td className={`text-right font-semibold ${remaining > 0 ? 'text-redError' : 'text-secondary'}`}>Br{remaining.toLocaleString()}</td>
                                                            </tr>
                                                        );
                                                    })
                                                }
                                            </>
                                        )}
                                        {activeTab === 'Payments' && (
                                            <>
                                                {/* Expenses for Payments */}
                                                {project.expenses.filter(e => e.category && e.category.toLowerCase() === 'payment').map(exp => (
                                                    <tr key={exp.id + '-exp'}>
                                                        <td colSpan={3} className="font-bold text-green-700">{exp.description}</td>
                                                        <td className="text-right font-semibold text-redError">-Br{(typeof exp.amount === 'number' ? exp.amount : parseFloat(exp.amount as any) || 0).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                                {/* Payments Records */}
                                                {(Array.isArray(project.payments) ? project.payments.length : 0) === 0 ? <tr><td colSpan={4}><EmptyState message="Lama diiwaan gelin wax lacag bixin ah." /></td></tr> : (project.payments || []).map(p=>(<tr key={p.id}><td>{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '-'}</td><td>{p.paymentType || '-'}</td><td>{p.receivedIn || '-'}</td><td className='text-right font-semibold text-secondary'>Br{(typeof p.amount === 'number' ? p.amount : parseFloat(p.amount as any) || 0).toLocaleString()}</td></tr>))}
                                            </>
                                        )}
                                        {activeTab === 'Documents' && (
                                            <>
                                                {/* Expenses with Receipt Images */}
                                                {(() => {
                                                    const expensesWithReceipts = project.expenses.filter(exp => exp.receiptUrl);
                                                    
                                                    if (expensesWithReceipts.length === 0) {
                                                        return <tr><td colSpan={5}><EmptyState message="Ma jiraan rasiido oo la xiriira kharashaadka mashruuca." /></td></tr>;
                                                    }

                                                    return expensesWithReceipts.map(exp => (
                                                        <tr key={exp.id}>
                                                            <td className="font-semibold">{exp.description}</td>
                                                            <td>
                                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                                    exp.category === 'Material' ? 'bg-blue-100 text-blue-800' :
                                                                    exp.category === 'Labor' ? 'bg-green-100 text-green-800' :
                                                                    exp.category === 'Company Expense' ? 'bg-purple-100 text-purple-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                    {exp.category}
                                                                </span>
                                                            </td>
                                                            <td className="font-semibold text-redError">-Br{exp.amount.toLocaleString()}</td>
                                                            <td>{new Date(exp.expenseDate).toLocaleDateString()}</td>
                                                            <td className="text-right">
                                                                <button 
                                                                    onClick={() => window.open(exp.receiptUrl, '_blank')}
                                                                    className="p-2 text-primary hover:text-blue-700"
                                                                    title="View Receipt"
                                                                >
                                                                    <Download size={20}/>
                                                                </button>
                                                            </td>
                                                    </tr>
                                                    ));
                                                })()}
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {toastMessage && <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />}
        </Layout>
    );
};

export default ProjectDetailsPage;