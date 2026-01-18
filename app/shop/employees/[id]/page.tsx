'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    Briefcase,
    Calendar,
    DollarSign,
    CreditCard,
    CheckCircle,
    Clock,
    MoreVertical,
    Edit2,
    Trash2,
    Save,
    X,
    Plus,
    Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

interface Employee {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    position: string;
    department: string;
    monthlySalary: number;
    salaryPaidThisMonth: number;
    lastPaymentDate: string;
    startDate: string;
    isActive: boolean;
    expenses: any[]; // Payment history
    attendance: any[];
}

interface Account {
    id: string;
    name: string;
    balance: number;
    type: string;
}

export default function EmployeeDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { toast } = useToast();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);

    // Edit Form State
    const [formData, setFormData] = useState<Partial<Employee>>({});

    // Pay Salary Modal
    const [payModalOpen, setPayModalOpen] = useState(false);
    const [payAmount, setPayAmount] = useState('');
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
    const [payNote, setPayNote] = useState('');
    const [processingPay, setProcessingPay] = useState(false);

    useEffect(() => {
        fetchEmployee();
        fetchAccounts();
    }, [params.id]);

    const fetchEmployee = async () => {
        try {
            const res = await fetch(`/api/shop/employees/${params.id}`);
            if (!res.ok) throw new Error('Failed to load employee');
            const data = await res.json();
            setEmployee(data.employee);
            setFormData(data.employee);
            // Default pay amount to monthly salary
            if (data.employee.monthlySalary) setPayAmount(data.employee.monthlySalary.toString());
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Could not load employee details', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const fetchAccounts = async () => {
        try {
            const response = await fetch('/api/shop/accounts');
            if (response.ok) {
                const data = await response.json();
                setAccounts(data.accounts || []);
            }
        } catch (error) {
            console.error('Error fetching accounts', error);
        }
    }

    const handleUpdate = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/shop/employees/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to update');

            toast({ title: 'Success', description: 'Employee updated successfully' });
            setEditing(false);
            fetchEmployee();
        } catch (error) {
            toast({ title: 'Error', description: 'Update failed', variant: 'destructive' });
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to remove this employee? This action cannot be undone.")) return;
        try {
            const res = await fetch(`/api/shop/employees/${params.id}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error('Failed to delete');

            toast({ title: 'Success', description: 'Employee removed' });
            router.push('/shop/employees');
        } catch (error) {
            toast({ title: 'Error', description: 'Delete failed', variant: 'destructive' });
        }
    }

    const handlePaySalary = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessingPay(true);
        try {
            // We'll create an expense of type Salary
            const res = await fetch('/api/shop/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description: `Salary Payment - ${employee?.fullName}`,
                    amount: parseFloat(payAmount),
                    category: 'Salary', // Ensure this category exists or backend handles it
                    paidFrom: accounts.find(a => a.id === selectedAccountId)?.name || 'Cash',
                    accountId: selectedAccountId,
                    employeeId: employee?.id,
                    expenseDate: payDate,
                    note: payNote
                })
            });

            if (!res.ok) throw new Error('Payment failed');

            toast({ title: 'Success', description: 'Salary recorded successfully' });
            setPayModalOpen(false);
            fetchEmployee(); // Refresh to see updated paid stats
        } catch (error) {
            toast({ title: 'Error', description: 'Could not record payment', variant: 'destructive' });
        } finally {
            setProcessingPay(false);
        }
    }

    if (loading && !employee) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F8FAFC] dark:bg-[#0B1120]">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!employee) return <div>Employee not found</div>;

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 pb-20 font-sans w-full selection:bg-primary/30 selection:text-primary">
            {/* Header */}
            <div className="sticky top-0 z-20 border-b border-lightGray dark:border-gray-800 bg-white/80 px-4 md:px-8 py-4 backdrop-blur-md dark:bg-gray-900/80">
                <div className="w-full flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 rounded-xl py-2 pr-4 text-sm font-bold text-mediumGray hover:text-darkGray transition-colors dark:hover:text-white"
                    >
                        <ArrowLeft size={18} /> Back
                    </button>
                    <div className="flex gap-2">
                        {editing ? (
                            <>
                                <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm font-bold text-mediumGray hover:text-darkGray">Cancel</button>
                                <button onClick={handleUpdate} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-secondary to-green-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-secondary/20 hover:shadow-secondary/30 transition-all transform hover:-translate-y-0.5">
                                    <Save size={16} /> Save Changes
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={handleDelete} className="p-2.5 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                    <Trash2 size={20} />
                                </button>
                                <button onClick={() => setEditing(true)} className="flex items-center gap-2 rounded-xl bg-lightGray/50 px-4 py-2 text-sm font-bold text-darkGray hover:bg-lightGray dark:bg-gray-800 dark:text-gray-200 transition-all">
                                    <Edit2 size={16} /> Edit Profile
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="w-full px-4 md:px-8 mt-6 space-y-6">

                {/* Profile Card */}
                <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 border border-lightGray dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-8 animate-fade-in-up">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-4xl font-black text-white shadow-xl shadow-primary/30">
                        {employee.fullName.charAt(0)}
                    </div>
                    <div className="flex-1 space-y-2">
                        {editing ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                <div className="group">
                                    <label className="text-xs font-bold text-mediumGray uppercase tracking-wider mb-1 block">Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-darkGray focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                                <div className="group">
                                    <label className="text-xs font-bold text-mediumGray uppercase tracking-wider mb-1 block">Role / Position</label>
                                    <input
                                        type="text"
                                        value={formData.position}
                                        onChange={e => setFormData({ ...formData, position: e.target.value })}
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-darkGray focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 className="text-4xl font-black text-darkGray dark:text-white tracking-tight">{employee.fullName}</h1>
                                <div className="flex items-center gap-4 text-mediumGray font-medium text-sm">
                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 border border-lightGray dark:border-gray-700"><Briefcase size={14} className="text-primary" /> {employee.position || 'No Position'}</span>
                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 border border-lightGray dark:border-gray-700"><FolderIcon size={14} className="text-secondary" /> {employee.department || 'No Dept'}</span>
                                </div>
                            </>
                        )}
                    </div>
                    <div>
                        <span className={`px-5 py-2 rounded-xl text-sm font-black tracking-wide ${employee.isActive ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'bg-red-100 text-red-700'}`}>
                            {employee.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                    {/* Left Col: Info & Contact */}
                    <div className="xl:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-lightGray dark:border-gray-800 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                            <h3 className="text-xs font-black text-primary uppercase tracking-wider mb-6 flex items-center gap-2">
                                <User size={16} /> Contact & Personal
                            </h3>
                            <div className="space-y-6">
                                {editing ? (
                                    <>
                                        <div>
                                            <label className="text-xs font-bold text-mediumGray uppercase tracking-wider block mb-1">Email</label>
                                            <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 font-medium text-darkGray focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-mediumGray uppercase tracking-wider block mb-1">Phone</label>
                                            <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 font-medium text-darkGray focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-mediumGray uppercase tracking-wider block mb-1">Join Date</label>
                                            <input type="date" value={formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : ''} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 font-medium text-darkGray focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-4 group">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-800 text-mediumGray group-hover:text-primary group-hover:bg-primary/10 transition-all flex items-center justify-center border border-lightGray dark:border-gray-700"><Mail size={22} /></div>
                                            <div>
                                                <p className="text-[10px] font-bold text-mediumGray uppercase tracking-wider">Email Address</p>
                                                <p className="font-bold text-darkGray dark:text-white break-all">{employee.email || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 group">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-800 text-mediumGray group-hover:text-primary group-hover:bg-primary/10 transition-all flex items-center justify-center border border-lightGray dark:border-gray-700"><Phone size={22} /></div>
                                            <div>
                                                <p className="text-[10px] font-bold text-mediumGray uppercase tracking-wider">Phone Number</p>
                                                <p className="font-bold text-darkGray dark:text-white">{employee.phone || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 group">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-800 text-mediumGray group-hover:text-primary group-hover:bg-primary/10 transition-all flex items-center justify-center border border-lightGray dark:border-gray-700"><Calendar size={22} /></div>
                                            <div>
                                                <p className="text-[10px] font-bold text-mediumGray uppercase tracking-wider">Joined Date</p>
                                                <p className="font-bold text-darkGray dark:text-white">{employee.startDate ? format(new Date(employee.startDate), 'MMM dd, yyyy') : 'N/A'}</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-lightGray dark:border-gray-800 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-black text-secondary uppercase tracking-wider flex items-center gap-2">
                                    <DollarSign size={16} /> Compensation
                                </h3>
                                <button onClick={() => setPayModalOpen(true)} className="px-4 py-2 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all transform hover:-translate-y-0.5 flex items-center gap-1.5">
                                    <CreditCard size={14} /> Pay Salary
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="p-5 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-lightGray dark:border-gray-700">
                                    <p className="text-[10px] font-bold text-mediumGray uppercase mb-1">Monthly Salary</p>
                                    {editing ? (
                                        <input
                                            type="number"
                                            value={formData.monthlySalary}
                                            onChange={e => setFormData({ ...formData, monthlySalary: parseFloat(e.target.value) })}
                                            className="w-full p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 font-black text-xl text-darkGray focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    ) : (
                                        <p className="text-3xl font-black text-darkGray dark:text-white">ETB {employee.monthlySalary?.toLocaleString() || '0'}</p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                        <p className="text-[10px] font-bold text-primary uppercase mb-1">Paid This Month</p>
                                        <p className="text-lg font-black text-darkGray dark:text-white">ETB {employee.expenses?.filter(e => new Date(e.expenseDate).getMonth() === new Date().getMonth()).reduce((sum, e) => sum + parseFloat(e.amount), 0).toLocaleString()}</p>
                                    </div>
                                    <div className="p-4 bg-secondary/5 rounded-2xl border border-secondary/10">
                                        <p className="text-[10px] font-bold text-secondary uppercase mb-1">Last Payment</p>
                                        <p className="text-sm font-bold text-darkGray dark:text-white">
                                            {employee.expenses?.[0] ? format(new Date(employee.expenses[0].expenseDate), 'MMM dd') : 'Never'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Col: History */}
                    <div className="xl:col-span-3 space-y-6">
                        <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 border border-lightGray dark:border-gray-800 shadow-sm min-h-[600px] animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                            <h3 className="text-xs font-black text-mediumGray uppercase tracking-wider mb-8 flex items-center gap-2">
                                <Clock size={16} /> Payment History
                            </h3>

                            <div className="overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-gray-800 text-[10px] font-bold text-mediumGray uppercase tracking-wider">
                                            <th className="pb-4 pl-4">Date</th>
                                            <th className="pb-4">Description</th>
                                            <th className="pb-4 text-right">Amount</th>
                                            <th className="pb-4 text-right pr-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {employee.expenses?.length === 0 ? (
                                            <tr><td colSpan={4} className="py-12 text-center text-mediumGray text-sm font-medium italic">No payment history found.</td></tr>
                                        ) : (
                                            employee.expenses?.map((exp: any) => (
                                                <tr key={exp.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors group">
                                                    <td className="py-5 pl-4 text-sm font-bold text-darkGray dark:text-gray-300">
                                                        {format(new Date(exp.expenseDate), 'MMM dd, yyyy')}
                                                    </td>
                                                    <td className="py-5 text-sm font-medium text-gray-600 dark:text-gray-400">
                                                        {exp.description} <br /> <span className="text-[10px] text-mediumGray group-hover:text-primary transition-colors">{exp.note}</span>
                                                    </td>
                                                    <td className="py-5 text-sm font-black text-darkGray dark:text-white text-right">
                                                        ETB {parseFloat(exp.amount).toLocaleString()}
                                                    </td>
                                                    <td className="py-5 text-right pr-4">
                                                        <span className="px-2.5 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-lg text-[10px] font-black uppercase tracking-wide">PAID</span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* PAY SALARY MODAL */}
            {payModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-darkGray/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up border border-lightGray dark:border-gray-800">
                        <div className="p-8 bg-gradient-to-br from-primary to-blue-600 text-white flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-black tracking-tight">Pay Salary</h3>
                                <p className="text-white/80 font-medium text-sm mt-1">Recording payment for {employee.fullName}</p>
                            </div>
                            <button onClick={() => setPayModalOpen(false)} className="bg-white/20 p-2 rounded-xl text-white hover:bg-white/30 transition-colors backdrop-blur-sm"><X size={20} /></button>
                        </div>

                        <form onSubmit={handlePaySalary} className="p-8 space-y-6">
                            <div className="group">
                                <label className="text-xs font-bold text-mediumGray uppercase tracking-wider mb-2 block">Payment Amount</label>
                                <div className="relative group-focus-within:transform group-focus-within:scale-[1.02] transition-transform duration-200">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <DollarSign className="text-primary" size={20} />
                                    </div>
                                    <input
                                        type="number"
                                        value={payAmount}
                                        onChange={e => setPayAmount(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary focus:bg-white dark:focus:bg-gray-900 outline-none font-black text-xl text-darkGray transition-all shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label className="text-xs font-bold text-mediumGray uppercase tracking-wider mb-2 block">Payment Date</label>
                                <input
                                    type="date"
                                    value={payDate}
                                    onChange={e => setPayDate(e.target.value)}
                                    className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary outline-none font-medium text-darkGray dark:text-white transition-all focus:bg-white"
                                />
                            </div>

                            <div className="group">
                                <label className="text-xs font-bold text-mediumGray uppercase tracking-wider mb-2 block">Funding Account</label>
                                <select
                                    className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary outline-none font-medium text-darkGray dark:text-white transition-all focus:bg-white appearance-none"
                                    value={selectedAccountId}
                                    onChange={(e) => setSelectedAccountId(e.target.value)}
                                    required
                                >
                                    <option value="">Select Account...</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.type}) - ETB {acc.balance.toLocaleString()}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="group">
                                <label className="text-xs font-bold text-mediumGray uppercase tracking-wider mb-2 block">Notes (Optional)</label>
                                <textarea
                                    value={payNote}
                                    onChange={e => setPayNote(e.target.value)}
                                    className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary outline-none font-medium text-sm h-24 resize-none transition-all focus:bg-white text-darkGray"
                                    placeholder="e.g. October Salary, Bonus included..."
                                />
                            </div>

                            <div className="pt-2 flex gap-4">
                                <button type="button" onClick={() => setPayModalOpen(false)} className="flex-1 py-3.5 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                                <button type="submit" disabled={processingPay} className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white font-bold shadow-xl shadow-primary/30 transform hover:-translate-y-1 transition-all">
                                    {processingPay ? 'Processing...' : 'Confirm Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

// Simple Icon Component for specific use if not in lucide
const FolderIcon = ({ size, className }: { size: number, className?: string }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 2H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" /></svg>
)
