// app/accounting/transactions/edit/[id]/page.tsx - Edit Transaction Page
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layouts/Layout'; // Adjusted import path
import {
    ArrowLeft, Save, Calendar, MessageSquare, DollarSign, Banknote,
    Info as InfoIcon, Loader2, ChevronRight, Tag as TagIcon,
    Briefcase as BriefcaseIcon, ReceiptText, Users, Truck, User as UserIcon, Scale
} from 'lucide-react';
import Toast from '@/components/common/Toast'; // Adjusted import path

export default function EditTransactionPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { id } = params;

    const [transactionType, setTransactionType] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
    const [transactionDate, setTransactionDate] = useState('');
    const [note, setNote] = useState('');

    // Account fields
    const [selectedAccount, setSelectedAccount] = useState(''); // Primary account

    // Related entity fields
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
    const [pageLoading, setPageLoading] = useState(true);
    const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
    const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // --- API-driven Data States ---
    const [accounts, setAccounts] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    // const [expenses, setExpenses] = useState<any[]>([]); 
    const [customers, setCustomers] = useState<any[]>([]);
    const [vendors, setVendors] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [debts, setDebts] = useState<any[]>([]);

    // --- Fetch Initial Data & Transaction Data ---
    useEffect(() => {
        const fetchData = async () => {
            setPageLoading(true);
            try {
                // Fetch dropdown options and transaction data in parallel
                const [
                    transactionRes,
                    accountsRes,
                    projectsRes,
                    customersRes,
                    vendorsRes,
                    employeesRes,
                    debtsRes
                ] = await Promise.all([
                    fetch(`/api/accounting/transactions/${id}`),
                    fetch('/api/accounting/accounts'),
                    fetch('/api/projects'),
                    fetch('/api/customers'),
                    fetch('/api/vendors'),
                    fetch('/api/employees'),
                    fetch('/api/reports/debts'),
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
                setDebts(debtsData.debts || []);

                // Populate Form with Transaction Data
                const tx = transactionData.transaction;
                if (tx) {
                    setTransactionType(tx.type);
                    setDescription(tx.description);
                    setAmount(tx.amount);
                    setTransactionDate(tx.transactionDate ? new Date(tx.transactionDate).toISOString().split('T')[0] : '');
                    setNote(tx.note || '');
                    setSelectedAccount(tx.accountId || '');

                    setRelatedProject(tx.projectId || '');
                    setRelatedExpense(tx.expenseId || '');
                    setRelatedCustomer(tx.customerId || '');
                    setRelatedVendor(tx.vendorId || '');
                    setRelatedEmployee(tx.employeeId || '');

                    // Handle debt fields if applicable (Currently basic mapping, logic might need adjustment based on how debt data is stored)
                    if (tx.type === 'DEBT_REPAID' && tx.customerId) {
                        // Assuming customerId links to the debt for repayment context in this simple logic
                        setSelectedDebtToRepay(tx.customerId); // Or however debt repayment linkage is defined
                    }
                }

            } catch (error: any) {
                setToastMessage({ message: error.message || 'Cilad ayaa dhacday marka xogta la soo gelinayay.', type: 'error' });
            } finally {
                setPageLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    // --- Validation Logic ---
    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!transactionType) newErrors.transactionType = 'Nooca dhaqdhaqaaqa waa waajib.';
        if (!description.trim()) newErrors.description = 'Sharaxaadda waa waajib.';
        if (typeof amount !== 'number' || amount <= 0) newErrors.amount = 'Qiimaha waa waajib oo waa inuu noqdaa nambar wanaagsan.';
        if (!transactionDate) newErrors.transactionDate = 'Taariikhda dhaqdhaqaaqa waa waajib.';
        if (!selectedAccount) newErrors.selectedAccount = 'Account-ka waa waajib.';

        if (transactionType === 'DEBT_TAKEN') {
            if (!lenderName.trim() && !relatedCustomer) newErrors.lenderName = 'Magaca deyn bixiyaha waa waajib.';
            // Note: simplistic check, usually strict logic needed
        }

        setValidationErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // --- Handlers ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setValidationErrors({});
        setToastMessage(null);

        if (!validateForm()) {
            setLoading(false);
            setToastMessage({ message: 'Fadlan sax khaladaadka foomka.', type: 'error' });
            return;
        }

        const transactionData: any = {
            description,
            amount: Math.abs(amount as number),
            type: transactionType,
            transactionDate,
            note: note || null,
            accountId: selectedAccount,
            projectId: relatedProject || null,
            expenseId: relatedExpense || null,
            customerId: relatedCustomer || (transactionType === 'DEBT_REPAID' ? selectedDebtToRepay : null),
            vendorId: relatedVendor || null,
            employeeId: relatedEmployee || null,
        };

        try {
            const response = await fetch(`/api/accounting/transactions/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update transaction');
            }

            setToastMessage({ message: 'Dhaqdhaqaaqa lacagta si guul leh ayaa loo cusboonaysiiyay!', type: 'success' });

            // Notify update
            if (data.transaction) {
                // Dispatch events similar to Create
                const transactionEvent = { ...data.transaction, action: 'updated', timestamp: Date.now() };
                localStorage.setItem('transactionUpdated', JSON.stringify(transactionEvent));
                window.dispatchEvent(new CustomEvent('transaction_updated', { detail: transactionEvent }));
            }

            // Short delay then redirect
            setTimeout(() => {
                router.push('/accounting/transactions');
            }, 1500);

        } catch (error: any) {
            console.error('Transaction Update API error:', error);
            setToastMessage({ message: error.message || 'Cilad shabakadeed ayaa dhacday.', type: 'error' });
        } finally {
            setLoading(false);
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
                    <Link href="/accounting/transactions" className="text-mediumGray dark:text-gray-400 hover:text-primary transition-colors duration-200 mr-4">
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
                                <option value="DEBT_TAKEN">Deyn (La Qaatay)</option>
                                <option value="DEBT_REPAID">Deyn (La Bixiyay)</option>
                                <option value="OTHER">Kale</option>
                            </select>
                            <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
                        </div>
                        {validationErrors.transactionType && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1" />{validationErrors.transactionType}</p>}
                    </div>

                    {/* Description & Amount */}
                    {transactionType && (
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
                                        placeholder="Tusaale: Mushahar Shaqaale"
                                        className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.description ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                                    />
                                </div>
                                {validationErrors.description && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1" />{validationErrors.description}</p>}
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
                                        className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.amount ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                                    />
                                </div>
                                {validationErrors.amount && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1" />{validationErrors.amount}</p>}
                            </div>
                        </div>
                    )}

                    {/* Account Selection */}
                    {transactionType && (
                        <div className="animate-fade-in">
                            <label htmlFor="selectedAccount" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Account-ka <span className="text-redError">*</span></label>
                            <div className="relative">
                                <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                                <select
                                    id="selectedAccount"
                                    value={selectedAccount}
                                    onChange={(e) => setSelectedAccount(e.target.value)}
                                    className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.selectedAccount ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                                >
                                    <option value="">-- Dooro Account --</option>
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance?.toLocaleString?.() ?? acc.balance})</option>)}
                                </select>
                                <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
                            </div>
                            {validationErrors.selectedAccount && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1" />{validationErrors.selectedAccount}</p>}
                        </div>
                    )}

                    {/* Debt Repaid Specific Fields (Simplified for Edit) */}
                    {transactionType === 'DEBT_REPAID' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-green-500/20 rounded-lg bg-green-500/5 animate-fade-in">
                            <h3 className="col-span-full text-lg font-bold text-green-500 dark:text-green-300 mb-2">Faahfaahinta Dib U Bixinta Deynta</h3>
                            <div>
                                <label htmlFor="selectedDebtToRepay" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Deynta La Bixinayo</label>
                                <div className="relative">
                                    <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                                    <select
                                        id="selectedDebtToRepay"
                                        value={selectedDebtToRepay}
                                        onChange={(e) => setSelectedDebtToRepay(e.target.value)}
                                        className="w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
                                    >
                                        <option value="">-- Dooro Deynta --</option>
                                        {debts.map(debt => (
                                            <option key={debt.id} value={debt.id}>
                                                {debt.lender || debt.customer || 'N/A'} - Dayn dhan: ${debt.amount?.toLocaleString() || 0}
                                            </option>
                                        ))}
                                        {/* Fallback if current debt not in list */}
                                        {selectedDebtToRepay && !debts.find(d => d.id === selectedDebtToRepay) && (
                                            <option value={selectedDebtToRepay}>Deynta Hadda (ID: {selectedDebtToRepay})</option>
                                        )}
                                    </select>
                                    <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Transaction Date & Note */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="transactionDate" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Taariikhda Dhaqdhaqaaqa <span className="text-redError">*</span></label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                                <input
                                    type="date"
                                    id="transactionDate"
                                    value={transactionDate}
                                    onChange={(e) => setTransactionDate(e.target.value)}
                                    className={`w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 placeholder-mediumGray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 ${validationErrors.transactionDate ? 'border-redError' : 'border-lightGray dark:border-gray-700'}`}
                                />
                            </div>
                            {validationErrors.transactionDate && <p className="text-redError text-sm mt-1 flex items-center"><InfoIcon size={16} className="mr-1" />{validationErrors.transactionDate}</p>}
                        </div>
                        <div>
                            <label htmlFor="note" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Fiiro Gaar Ah (Optional)</label>
                            <div className="relative">
                                <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                                <textarea
                                    id="note"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={2}
                                    className="w-full p-3 pl-10 border border-lightGray dark:border-gray-700 rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200"
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Related Entities */}
                    {transactionType && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 border border-gray-400/20 rounded-lg bg-gray-400/5 animate-fade-in">
                            <h3 className="col-span-full text-lg font-bold text-darkGray dark:text-gray-100 mb-2">La Xiriira (Optional)</h3>

                            <div>
                                <label htmlFor="relatedProject" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Mashruuc</label>
                                <div className="relative">
                                    <BriefcaseIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                                    <select id="relatedProject" value={relatedProject} onChange={(e) => setRelatedProject(e.target.value)} className="w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200">
                                        <option value="">-- Dooro Mashruuc --</option>
                                        {projects.map(proj => <option key={proj.id} value={proj.id}>{proj.name}</option>)}
                                    </select>
                                    <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="relatedCustomer" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Macmiil</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                                    <select id="relatedCustomer" value={relatedCustomer} onChange={(e) => setRelatedCustomer(e.target.value)} className="w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200">
                                        <option value="">-- Dooro Macmiil --</option>
                                        {customers.map(cust => <option key={cust.id} value={cust.id}>{cust.name}</option>)}
                                    </select>
                                    <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="relatedVendor" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Iibiye</label>
                                <div className="relative">
                                    <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                                    <select id="relatedVendor" value={relatedVendor} onChange={(e) => setRelatedVendor(e.target.value)} className="w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200">
                                        <option value="">-- Dooro Iibiye --</option>
                                        {vendors.map(ven => <option key={ven.id} value={ven.id}>{ven.name}</option>)}
                                    </select>
                                    <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="relatedEmployee" className="block text-md font-medium text-darkGray dark:text-gray-300 mb-2">Shaqaale</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGray dark:text-gray-400" size={20} />
                                    <select id="relatedEmployee" value={relatedEmployee} onChange={(e) => setRelatedEmployee(e.target.value)} className="w-full p-3 pl-10 border rounded-lg bg-lightGray dark:bg-gray-700 text-darkGray dark:text-gray-100 appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200">
                                        <option value="">-- Dooro Shaqaale --</option>
                                        {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
                                    </select>
                                    <ChevronRight className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-mediumGray dark:text-gray-400 transform rotate-90" size={20} />
                                </div>
                            </div>

                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full bg-primary text-white py-3 px-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md transform hover:scale-105 flex items-center justify-center"
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="animate-spin mr-2" size={20} />
                        ) : (
                            <Save className="mr-2" size={20} />
                        )}
                        {loading ? 'Cusboonaysiinaya...' : 'Cusboonaysii Dhaqdhaqaaqa'}
                    </button>
                </form>
            </div>

            {toastMessage && (
                <Toast message={toastMessage.message} type={toastMessage.type} onClose={() => setToastMessage(null)} />
            )}
        </Layout>
    );
}
