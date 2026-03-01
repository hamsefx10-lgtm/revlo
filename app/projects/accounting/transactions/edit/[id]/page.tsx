// app/accounting/transactions/edit/[id]/page.tsx - Edit Transaction Page (10000% Design - Parity with Add Page)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layouts/Layout';
import {
    ArrowLeft, Save, Plus, Search, Filter, Calendar, List, LayoutGrid,
    DollarSign, CreditCard, Banknote, RefreshCw, Eye, Edit, Trash2,
    TrendingUp, TrendingDown, Info as InfoIcon, CheckCircle, XCircle, Clock as ClockIcon,
    User as UserIcon, Briefcase as BriefcaseIcon, Tag as TagIcon,
    Send, Repeat, ReceiptText, Users, Building, Package, Scale, HardHat, Mail, Phone, Loader2, ChevronRight, MessageSquare, Truck
} from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function EditTransactionPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { id } = params;

    const [transactionType, setTransactionType] = useState(''); // INCOME, EXPENSE, TRANSFER_IN, TRANSFER_OUT, DEBT_TAKEN, DEBT_REPAID, OTHER
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
    const [transactionDate, setTransactionDate] = useState('');
    const [note, setNote] = useState('');

    // Account fields
    const [selectedAccount, setSelectedAccount] = useState(''); // Primary account

    // Related entity fields (optional)
    const [relatedProject, setRelatedProject] = useState('');
    const [relatedExpense, setRelatedExpense] = useState('');
    const [relatedCustomer, setRelatedCustomer] = useState('');
    const [relatedVendor, setRelatedVendor] = useState('');
    const [relatedEmployee, setRelatedEmployee] = useState('');

    // Debt-specific fields
    const [lenderName, setLenderName] = useState(''); // For DEBT_TAKEN
    const [loanDate, setLoanDate] = useState('');     // For DEBT_TAKEN
    const [selectedDebtToRepay, setSelectedDebtToRepay] = useState(''); // For DEBT_REPAID

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true); // For initial data fetch
    const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
    const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // Quick Add Customer States
    const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false);
    const [quickCustomerName, setQuickCustomerName] = useState('');
    const [quickCustomerType, setQuickCustomerType] = useState('Individual');
    const [quickAddLoading, setQuickAddLoading] = useState(false);

    // Quick Add Vendor States
    const [showQuickAddVendor, setShowQuickAddVendor] = useState(false);
    const [quickVendorName, setQuickVendorName] = useState('');
    const [quickVendorType, setQuickVendorType] = useState('Supplier');
    const [quickAddVendorLoading, setQuickAddVendorLoading] = useState(false);

    // --- API-driven Data States ---
    const [accounts, setAccounts] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [debts, setDebts] = useState<any[]>([]); // All debt records

    // --- Fetch Initial Data & Existing Transaction ---
    useEffect(() => {
        const fetchData = async () => {
            setPageLoading(true);
            try {
                const [
                    transactionRes,
                    accountsRes,
                    projectsRes,
                    customersRes,
                    vendorsRes,
                    employeesRes,
                    debtsRes
                ] = await Promise.all([
                    fetch(`/api/projects/accounting/transactions/${id}`),
                    fetch('/api/projects/accounting/accounts'),
                    fetch('/api/projects'),
                    fetch('/api/projects/customers'),
                    fetch('/api/projects/vendors'),
                    fetch('/api/projects/employees'),
                    fetch('/api/projects/accounting/reports/debts'),
                ]);

                if (!transactionRes.ok) throw new Error('Failed to fetch transaction details');
                if (!accountsRes.ok) throw new Error('Accounts fetch failed');

                const transactionData = await transactionRes.json();
                const accountsData = await accountsRes.json();
                const projectsData = await projectsRes.json();
                const customersData = await customersRes.json();
                const vendorsData = await vendorsRes.json();
                const employeesData = await employeesRes.json();
                const debtsData = await debtsRes.json();

                setAccounts(accountsData.accounts || []);
                setProjects(projectsData.projects || []);
                setCustomers(customersData.customers || []);
                setVendors(vendorsData.vendors || []);
                setEmployees(employeesData.employees || []);

                const allDebts = [
                    ...(debtsData.debts || []),
                    ...(debtsData.receivables || [])
                ];
                setDebts(allDebts);

                // Populate Form with Transaction Data
                const tx = transactionData.transaction;
                if (tx) {
                    // Note: In some cases, we split DEBT_REPAID in UI for better UX
                    // Here we try to map back to the UI's specific split types if possible
                    let mappedType = tx.type;
                    if (tx.type === 'DEBT_REPAID') {
                        if (tx.vendorId) mappedType = 'PAY_VENDOR_DEBT';
                        else if (tx.customerId) mappedType = 'COLLECT_CUSTOMER_DEBT';
                        else if (tx.projectId) mappedType = 'REPAY_PROJECT_DEBT';
                    }

                    setTransactionType(mappedType);
                    setDescription(tx.description || '');
                    setAmount(tx.amount || '');
                    setTransactionDate(tx.transactionDate ? new Date(tx.transactionDate).toISOString().split('T')[0] : '');
                    setNote(tx.note || '');
                    setSelectedAccount(tx.accountId || '');
                    setRelatedProject(tx.projectId || '');
                    setRelatedCustomer(tx.customerId || '');
                    setRelatedVendor(tx.vendorId || '');
                    setRelatedEmployee(tx.employeeId || '');

                    // Logical mapping for repayment context
                    if (tx.type === 'DEBT_REPAID') {
                        setSelectedDebtToRepay(tx.customerId || tx.vendorId || tx.projectId || '');
                    }
                }
            } catch (error: any) {
                setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka xogta la soo gelinayay.', type: 'error' });
            } finally {
                setPageLoading(false);
            }
        };

        if (id) fetchData();
    }, [id]);

    // --- Validation Logic ---
    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!transactionType) newErrors.transactionType = 'Nooca dhaqdhaqaaqa waa waajib.';
        if (!description.trim()) newErrors.description = 'Sharaxaadda waa waajib.';
        if (typeof amount !== 'number' || amount <= 0) newErrors.amount = 'Qiimaha waa waajib.';
        if (!transactionDate) newErrors.transactionDate = 'Taariikhda waa waajib.';
        if (!selectedAccount) newErrors.selectedAccount = 'Account-ka waa waajib.';

        setValidationErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // --- Handlers ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setValidationErrors({});

        if (!validateForm()) {
            setLoading(false);
            setToastMessage({ message: 'Fadlan sax khaladaadka foomka.', type: 'error' });
            return;
        }

        // Determine API type (flatten UI types back to DB types)
        let apiTransactionType = transactionType;
        if (['PAY_VENDOR_DEBT', 'COLLECT_CUSTOMER_DEBT', 'REPAY_PROJECT_DEBT'].includes(transactionType)) {
            apiTransactionType = 'DEBT_REPAID';
        }

        const transactionData: any = {
            description,
            amount: Math.abs(amount as number),
            type: apiTransactionType,
            transactionDate,
            note: note || null,
            accountId: selectedAccount,
            projectId: relatedProject || null,
            customerId: relatedCustomer || null,
            vendorId: relatedVendor || null,
            employeeId: relatedEmployee || null,
        };

        try {
            const response = await fetch(`/api/projects/accounting/transactions/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to update transaction');

            setToastMessage({ message: 'Dhaqdhaqaaqa waa la cusboonaysiiyay!', type: 'success' });

            // Trigger update event
            const updateEvent = { id, type: apiTransactionType, amount, timestamp: Date.now() };
            localStorage.setItem('transactionUpdated', JSON.stringify(updateEvent));
            window.dispatchEvent(new StorageEvent('storage', { key: 'transactionUpdated', newValue: JSON.stringify(updateEvent) }));

            setTimeout(() => router.push('/projects/accounting/transactions'), 1500);
        } catch (error: any) {
            setToastMessage({ message: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAddCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickCustomerName.trim()) return;
        setQuickAddLoading(true);
        try {
            const res = await fetch('/api/projects/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: quickCustomerName, type: quickCustomerType }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setCustomers(prev => [...prev, data.customer]);
            setRelatedCustomer(data.customer.id);
            setShowQuickAddCustomer(false);
            setQuickCustomerName('');
            setToastMessage({ message: 'Macmiilka waa la daray!', type: 'success' });
        } catch (error: any) {
            setToastMessage({ message: error.message, type: 'error' });
        } finally {
            setQuickAddLoading(false);
        }
    };

    const handleQuickAddVendor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quickVendorName.trim()) return;
        setQuickAddVendorLoading(true);
        try {
            const res = await fetch('/api/projects/vendors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: quickVendorName, type: quickVendorType }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setVendors(prev => [...prev, data.vendor]);
            setRelatedVendor(data.vendor.id);
            setShowQuickAddVendor(false);
            setQuickVendorName('');
            setToastMessage({ message: 'Iibiyaha waa la daray!', type: 'success' });
        } catch (error: any) {
            setToastMessage({ message: error.message, type: 'error' });
        } finally {
            setQuickAddVendorLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <Layout>
                <div className="min-h-[400px] flex items-center justify-center">
                    <Loader2 className="animate-spin mr-3 text-primary" size={32} /> Loading Transaction...
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-darkGray dark:text-gray-100">
                    <Link href="/projects/accounting/transactions" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
                        <ArrowLeft size={28} className="inline-block" />
                    </Link>
                    Wax Ka Beddel Dhaqdhaqaaqa
                </h1>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md animate-fade-in-up">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Transaction Type */}
                    <div>
                        <label htmlFor="transactionType" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Nooca Dhaqdhaqaaqa <span className="text-redError">*</span></label>
                        <div className="relative">
                            <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                            <select
                                id="transactionType"
                                value={transactionType}
                                onChange={(e) => setTransactionType(e.target.value)}
                                className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.transactionType ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                            >
                                <option value="">-- Dooro Nooca Dhaqdhaqaaqa --</option>
                                <option value="INCOME">Dakhli (Soo Gal)</option>
                                <option value="EXPENSE">Kharash (Baxay)</option>
                                <option value="DEBT_TAKEN">Amaah La Siiyay — Lacag baxday oo dayn ahaan</option>
                                <option value="DEBT_RECEIVED">Payables / Dayn la Qaatay — Lacag soo galay</option>
                                <option value="PAY_VENDOR_DEBT">Bixi Deyn (Vendor/Iibiye)</option>
                                <option value="COLLECT_CUSTOMER_DEBT">Soo Xaree Deyn (Macmiil)</option>
                                <option value="REPAY_PROJECT_DEBT">Soo Xaree Deyn (Mashruuc)</option>
                                <option value="OTHER">Kale</option>
                            </select>
                            <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
                        </div>
                    </div>

                    {transactionType && (
                        <>
                            {/* Common Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                                <div>
                                    <label htmlFor="description" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Sharaxaad <span className="text-redError">*</span></label>
                                    <div className="relative">
                                        <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                                        <input
                                            type="text"
                                            id="description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="amount" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Qiimaha ($) <span className="text-redError">*</span></label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                                        <input
                                            type="number"
                                            id="amount"
                                            value={amount}
                                            onChange={(e) => setAmount(parseFloat(e.target.value) || '')}
                                            className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Account Selection */}
                            <div>
                                <label htmlFor="selectedAccount" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Account-ka <span className="text-redError">*</span></label>
                                <div className="relative">
                                    <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                                    <select
                                        id="selectedAccount"
                                        value={selectedAccount}
                                        onChange={(e) => setSelectedAccount(e.target.value)}
                                        className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary transition"
                                    >
                                        <option value="">-- Dooro Account --</option>
                                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance?.toLocaleString()})</option>)}
                                    </select>
                                    <ChevronRight className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-mediumGray transform rotate-90" size={20} />
                                </div>
                            </div>

                            {/* Dynamic Sections Based on Type */}
                            {transactionType === 'DEBT_TAKEN' && (
                                <div className="p-4 border border-redError/20 rounded-lg bg-redError/5 animate-fade-in space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-bold text-redError">Faahfaahinta Daynta (La Siiyay)</h3>
                                        <button type="button" onClick={() => setShowQuickAddCustomer(!showQuickAddCustomer)} className="text-xs bg-redError text-white px-2 py-1 rounded flex items-center"><Plus size={14} className="mr-1" /> Macmiil Cusub</button>
                                    </div>
                                    {showQuickAddCustomer && (
                                        <div className="bg-white dark:bg-gray-700 p-4 rounded shadow-inner grid grid-cols-1 md:grid-cols-3 gap-4 border border-redError/30">
                                            <input type="text" value={quickCustomerName} onChange={(e) => setQuickCustomerName(e.target.value)} placeholder="Magaca Macmiilka" className="p-2 border rounded bg-lightGray dark:bg-gray-600 text-sm" />
                                            <select value={quickCustomerType} onChange={(e) => setQuickCustomerType(e.target.value)} className="p-2 border rounded bg-lightGray dark:bg-gray-600 text-sm">
                                                <option value="Individual">Qof</option>
                                                <option value="Company">Shirkad</option>
                                            </select>
                                            <button onClick={handleQuickAddCustomer} disabled={quickAddLoading} className="bg-primary text-white p-2 rounded text-sm font-bold">Keydi</button>
                                        </div>
                                    )}
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray" size={20} />
                                        <select value={relatedCustomer} onChange={(e) => setRelatedCustomer(e.target.value)} className="w-full p-3 pl-10 border rounded bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100">
                                            <option value="">-- Dooro Macmiilka --</option>
                                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Payables/Debt Received */}
                            {transactionType === 'DEBT_RECEIVED' && (
                                <div className="p-4 border border-blue-500/20 rounded-lg bg-blue-500/5 animate-fade-in space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-bold text-blue-600">Faahfaahinta Payables (Dayn la Qaatay)</h3>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => setShowQuickAddVendor(!showQuickAddVendor)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded flex items-center"><Plus size={14} className="mr-1" /> Iibiye Cusub</button>
                                        </div>
                                    </div>
                                    {showQuickAddVendor && (
                                        <div className="bg-white dark:bg-gray-700 p-4 rounded shadow-inner grid grid-cols-1 md:grid-cols-3 gap-4 border border-blue-500/30">
                                            <input type="text" value={quickVendorName} onChange={(e) => setQuickVendorName(e.target.value)} placeholder="Magaca Iibiyaha" className="p-2 border rounded bg-lightGray dark:bg-gray-600 text-sm" />
                                            <button onClick={handleQuickAddVendor} disabled={quickAddVendorLoading} className="bg-primary text-white p-2 rounded text-sm font-bold">Keydi</button>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        <select value={relatedVendor} onChange={(e) => setRelatedVendor(e.target.value)} className="w-full p-3 border rounded bg-lightGray dark:bg-gray-700">
                                            <option value="">-- Dooro Iibiye --</option>
                                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                        </select>
                                        <select value={relatedCustomer} onChange={(e) => setRelatedCustomer(e.target.value)} className="w-full p-3 border rounded bg-lightGray dark:bg-gray-700">
                                            <option value="">-- Ama Macmiil --</option>
                                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Repayments */}
                            {['PAY_VENDOR_DEBT', 'COLLECT_CUSTOMER_DEBT', 'REPAY_PROJECT_DEBT'].includes(transactionType) && (
                                <div className="p-4 border border-orange-500/20 rounded-lg bg-orange-500/5 animate-fade-in space-y-4">
                                    <h3 className="text-lg font-bold text-orange-600">Bixi/Soo Xaree Deyn</h3>
                                    <div className="relative">
                                        <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray" size={20} />
                                        <select
                                            value={selectedDebtToRepay}
                                            onChange={(e) => {
                                                setSelectedDebtToRepay(e.target.value);
                                                const d = debts.find(x => x.id === e.target.value);
                                                if (d) {
                                                    setRelatedCustomer(d.customerId || d.clientId || '');
                                                    setRelatedVendor(d.lenderId || '');
                                                    setRelatedProject(d.projectId || '');
                                                }
                                            }}
                                            className="w-full p-3 pl-10 border rounded bg-lightGray dark:bg-gray-700"
                                        >
                                            <option value="">-- Dooro Deynta La Bixinayo --</option>
                                            {debts.map(d => (
                                                <option key={d.id} value={d.id}>{d.lender || d.customer || 'Deyn'} - ${d.remaining?.toLocaleString() || d.amount?.toLocaleString()}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Date & Note */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="transactionDate" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Taariikhda <span className="text-redError">*</span></label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray" size={20} />
                                        <input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700" />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="note" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Fiiro Gaar Ah (Optional)</label>
                                    <div className="relative">
                                        <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray" size={20} />
                                        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={1} className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700" />
                                    </div>
                                </div>
                            </div>

                            {/* Related Entities (Grouped) */}
                            <div className="p-4 border border-gray-400/20 rounded-lg bg-gray-400/5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <h3 className="col-span-full text-sm font-bold text-mediumGray">La Xiriira (Xulasho)</h3>
                                <select value={relatedProject} onChange={(e) => setRelatedProject(e.target.value)} className="p-2 border rounded bg-white dark:bg-gray-800 text-xs">
                                    <option value="">Mashruuc</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <select value={relatedCustomer} onChange={(e) => setRelatedCustomer(e.target.value)} className="p-2 border rounded bg-white dark:bg-gray-800 text-xs text-darkGray dark:text-gray-100">
                                    <option value="">Macmiil</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <select value={relatedVendor} onChange={(e) => setRelatedVendor(e.target.value)} className="p-2 border rounded bg-white dark:bg-gray-800 text-xs text-darkGray dark:text-gray-100">
                                    <option value="">Iibiye</option>
                                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                                <select value={relatedEmployee} onChange={(e) => setRelatedEmployee(e.target.value)} className="p-2 border rounded bg-white dark:bg-gray-800 text-xs text-darkGray dark:text-gray-100">
                                    <option value="">Shaqaale</option>
                                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
                                </select>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary text-white py-4 rounded-xl font-bold text-xl hover:bg-blue-700 transition shadow-lg flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                                Cusboonaysii Dhaqdhaqaaqa
                            </button>
                        </>
                    )}
                </form>
            </div>

            {toastMessage && (
                <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
            )}
        </Layout>
    );
}
