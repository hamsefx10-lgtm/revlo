'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Save,
    Plus,
    Trash2,
    User,
    FileText,
    ArrowLeft,
    CheckCircle2,
    Package,
    ChevronDown,
    ScanLine,
    UploadCloud,
    Loader2,
    X,
    UserPlus,
    Receipt,
    Percent,
    CreditCard,
    Wallet,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// --- TYPES ---
interface LineItem {
    id: number;
    productId: string;
    description: string;
    qty: number;
    price: number;
    stock?: number;
    matched?: boolean; // did AI receipt match this to a product?
}

interface Customer {
    id: string;
    name: string;
    phone?: string;
}

interface Product {
    id: string;
    name: string;
    sellingPrice: number;
    stock: number;
}

interface Account {
    id: string;
    name: string;
    type: string;
}

const defaultItems = (): LineItem[] => [
    { id: Date.now(), productId: '', description: '', qty: 1, price: 0 },
    { id: Date.now() + 1, productId: '', description: '', qty: 1, price: 0 },
    { id: Date.now() + 2, productId: '', description: '', qty: 1, price: 0 },
];

export default function ManualEntryPage() {
    const router = useRouter();

    // Core form state
    const [customerId, setCustomerId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now()}`);
    const [supplierReceiptNumber, setSupplierReceiptNumber] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [saveMode, setSaveMode] = useState<'submit' | 'again'>('submit');
    const [discountAmount, setDiscountAmount] = useState('0');

    // Data
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState('');

    // Payment
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Credit'>('Cash');
    const [partialPaidAmount, setPartialPaidAmount] = useState('');
    const [dueDate, setDueDate] = useState('');

    // VAT
    const [applyVAT, setApplyVAT] = useState(false);
    const [companyTaxRate, setCompanyTaxRate] = useState(15);
    const [requireReceiptNumber, setRequireReceiptNumber] = useState(false);
    const [currency, setCurrency] = useState<'ETB' | 'USD'>('ETB');
    const [exchangeRate, setExchangeRate] = useState('1');
    const [autoConvertDebt, setAutoConvertDebt] = useState(true);
    const [convertDebtAfterDays, setConvertDebtAfterDays] = useState('7');

    // Line items
    const [items, setItems] = useState<LineItem[]>(defaultItems());

    // Quick-add customer modal
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [quickAddName, setQuickAddName] = useState('');
    const [quickAddPhone, setQuickAddPhone] = useState('');
    const [isAddingCustomer, setIsAddingCustomer] = useState(false);

    // Receipt AI scanner
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // -----------------------------------------------
    // FETCH DATA
    // -----------------------------------------------
    useEffect(() => {
        fetchCustomers();
        fetchProducts();
        fetchAccounts();
        fetchCompany();
    }, []);

    // Paste image (Ctrl+V)
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.startsWith('image/')) {
                    const file = items[i].getAsFile();
                    if (file) { processReceiptFile(file); e.preventDefault(); break; }
                }
            }
        };
        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [products]); // products in dep so fuzzy match has fresh list

    const fetchCustomers = async () => {
        try {
            const res = await fetch('/api/shop/customers');
            if (res.ok) {
                const data = await res.json();
                setCustomers([{ id: 'walk-in', name: 'Walk-in Customer' }, ...(data.customers || [])]);
            }
        } catch { }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/shop/inventory');
            if (res.ok) {
                const data = await res.json();
                setProducts(data.products || []);
            }
        } catch { }
    };

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/shop/accounts');
            if (res.ok) {
                const data = await res.json();
                setAccounts(data.accounts || []);
                if (data.accounts?.length > 0) setSelectedAccountId(data.accounts[0].id);
            }
        } catch { }
    };

    const fetchCompany = async () => {
        try {
            const res = await fetch('/api/shop/company');
            if (res.ok) {
                const data = await res.json();
                if (data.company?.taxRate) setCompanyTaxRate(Number(data.company.taxRate));
                if (data.company?.requireReceiptNumber !== undefined) setRequireReceiptNumber(Boolean(data.company.requireReceiptNumber));

                // Fetch daily exchange rate
                const rateRes = await fetch('/api/settings/exchange-rate');
                if (rateRes.ok) {
                    const rateData = await rateRes.json();
                    if (rateData.rate) setExchangeRate(String(rateData.rate));
                }
            }
        } catch { }
    };

    // -----------------------------------------------
    // QUICK-ADD CUSTOMER
    // -----------------------------------------------
    const handleQuickAddCustomer = async () => {
        if (!quickAddName.trim()) return;
        setIsAddingCustomer(true);
        try {
            const res = await fetch('/api/shop/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: quickAddName.trim(), phone: quickAddPhone.trim() || undefined })
            });
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            const newCustomer = data.customer;
            setCustomers(prev => [...prev, { id: newCustomer.id, name: newCustomer.name, phone: newCustomer.phone }]);
            setCustomerId(newCustomer.id);
            setIsQuickAddOpen(false);
            setQuickAddName('');
            setQuickAddPhone('');
            toast.success(`Customer "${newCustomer.name}" added!`);
        } catch {
            toast.error('Failed to add customer. Try again.');
        } finally {
            setIsAddingCustomer(false);
        }
    };

    // -----------------------------------------------
    // LINE ITEM ACTIONS
    // -----------------------------------------------
    const addItem = () => {
        setItems(prev => [...prev, { id: Date.now(), productId: '', description: '', qty: 1, price: 0 }]);
    };

    const removeItem = (id: number) => {
        if (items.length === 1) return;
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const handleProductSelect = (id: number, productId: string) => {
        const product = products.find(p => p.id === productId);
        setItems(prev => prev.map(item =>
            item.id === id
                ? { ...item, productId, description: product?.name || '', price: product?.sellingPrice || 0, stock: product?.stock, matched: true }
                : item
        ));
    };

    const updateItem = (id: number, field: keyof LineItem, value: any) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    // -----------------------------------------------
    // CALCULATIONS
    // -----------------------------------------------
    const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
    const discount = parseFloat(discountAmount) || 0;
    const discountedSubtotal = Math.max(0, subtotal - discount);
    const taxAmount = applyVAT ? discountedSubtotal * (companyTaxRate / 100) : 0;
    const total = discountedSubtotal + taxAmount;

    const partialAmount = parseFloat(partialPaidAmount) || 0;
    const balance = total - partialAmount;

    // -----------------------------------------------
    // AI RECEIPT SCANNER
    // -----------------------------------------------
    const fuzzyMatch = useCallback((aiName: string): Product | null => {
        const normalized = aiName.toLowerCase().trim();
        // Exact match first
        let match = products.find(p => p.name.toLowerCase() === normalized);
        if (match) return match;
        // Contains match
        match = products.find(p =>
            p.name.toLowerCase().includes(normalized) || normalized.includes(p.name.toLowerCase())
        );
        if (match) return match;
        // Word-level match (any word in common)
        const aiWords = normalized.split(/\s+/).filter(w => w.length > 2);
        match = products.find(p => {
            const pWords = p.name.toLowerCase().split(/\s+/);
            return aiWords.some(w => pWords.some(pw => pw.includes(w) || w.includes(pw)));
        });
        return match || null;
    }, [products]);

    const processReceiptFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Fadlan sawir kaliya soo geli!');
            return;
        }
        setIsAnalyzing(true);
        const formData = new FormData();
        formData.append('image', file);
        try {
            const res = await fetch('/api/analyze-receipt', { method: 'POST', body: formData });
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();

            if (data.items && Array.isArray(data.items) && data.items.length > 0) {
                const newItems: LineItem[] = data.items.map((aiItem: any, idx: number) => {
                    const matched = fuzzyMatch(aiItem.name || '');
                    return {
                        id: Date.now() + idx,
                        productId: matched?.id || '',
                        description: matched?.name || aiItem.name || '',
                        qty: parseInt(String(aiItem.qty)) || 1,
                        price: matched?.sellingPrice || parseFloat(String(aiItem.price)) || 0,
                        matched: !!matched,
                    };
                });
                setItems(newItems);
            }

            // Auto-fill supplier receipt number if available
            if (data.invoiceNumber || data.receiptNumber) {
                setSupplierReceiptNumber(data.invoiceNumber || data.receiptNumber || '');
            }

            const matchedCount = (data.items || []).filter((_: any, i: number) => {
                const ai = data.items[i];
                return !!fuzzyMatch(ai?.name || '');
            }).length;

            toast.success(`Receipt scanned! ${matchedCount}/${(data.items || []).length} items matched to inventory.`);
        } catch (err: any) {
            toast.error(`Scan failed: ${err.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) await processReceiptFile(file);
        e.target.value = '';
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file?.type.startsWith('image/')) processReceiptFile(file);
        else toast.error('Fadlan sawir kaliya soo geli!');
    };

    // -----------------------------------------------
    // SUBMIT
    // -----------------------------------------------
    const buildPayload = () => {
        const validItems = items.filter(item => item.productId && item.qty > 0);
        if (!customerId) { toast.error('Please select a customer'); return null; }
        if (paymentMethod === 'Credit' && customerId === 'walk-in') {
            toast.error('Credit sales require a registered customer.'); return null;
        }
        if (validItems.length === 0) { toast.error('Add at least one product'); return null; }
        if (requireReceiptNumber && !supplierReceiptNumber.trim()) {
            toast.error('Supplier Receipt # is required. Please enter the receipt number.');
            return null;
        }

        let finalPaidAmount = total;
        let finalStatus = 'Paid';

        if (paymentMethod === 'Credit') {
            finalPaidAmount = partialAmount;
            finalStatus = partialAmount > 0 ? 'Partial' : 'Unpaid';
        }

        const needsAccount = paymentMethod !== 'Credit' || partialAmount > 0;

        return {
            customerId: customerId === 'walk-in' ? null : customerId,
            items: validItems.map(item => ({ productId: item.productId, quantity: item.qty, unitPrice: item.price })),
            paymentMethod,
            notes: notes || null,
            accountId: needsAccount ? selectedAccountId : undefined,
            paidAmount: finalPaidAmount,
            paymentStatus: finalStatus,
            supplierReceiptNumber: supplierReceiptNumber || undefined,
            taxAmount: applyVAT ? taxAmount : 0,
            invoiceNumber: invoiceNumber || undefined,
            dueDate: paymentMethod === 'Credit' && dueDate ? dueDate : undefined,
            currency,
            exchangeRate: parseFloat(exchangeRate) || 1,
            autoConvertDebt,
            convertDebtAfterDays: parseInt(convertDebtAfterDays) || 7,
        };
    };

    const submitSale = async () => {
        const payload = buildPayload();
        if (!payload) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/shop/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create sale');
            return data.sale;
        } catch (err: any) {
            toast.error(err.message || 'Failed to create sale');
            return null;
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitReceipt = async () => {
        setSaveMode('submit');
        const sale = await submitSale();
        if (sale) {
            toast.success(`Sale ${sale.invoiceNumber} saved!`);
            router.push(`/shop/sales/${sale.id}`);
        }
    };

    const handleSaveAndAddAnother = async () => {
        setSaveMode('again');
        const sale = await submitSale();
        if (sale) {
            toast.success(`Sale ${sale.invoiceNumber} saved! Ready for next entry.`);
            // Reset form
            setCustomerId('');
            setInvoiceNumber(`INV-${Date.now()}`);
            setSupplierReceiptNumber('');
            setNotes('');
            setPaymentMethod('Cash');
            setPartialPaidAmount('');
            setApplyVAT(false);
            setDiscountAmount('0');
            setCurrency('ETB');
            setAutoConvertDebt(true);
            setConvertDebtAfterDays('7');
            setItems(defaultItems());
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // -----------------------------------------------
    // RENDER
    // -----------------------------------------------
    return (
        <div className="min-h-screen animate-fade-in pb-24 font-sans w-full relative">

            {/* HEADER */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/shop/pos" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">New Sale (Manual Entry)</h1>
                    <p className="text-sm text-gray-500">Record a sale manually. Scan a receipt to auto-fill.</p>
                </div>
            </div>

            {/* ─── AI RECEIPT SCANNER BANNER ─── */}
            <div
                className={`mb-6 rounded-2xl border-2 transition-all duration-200 ${isDragging
                    ? 'border-[#3498DB] bg-blue-50 dark:bg-blue-900/20'
                    : 'border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/30'
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 md:p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#3498DB]/10 flex items-center justify-center">
                            <ScanLine size={20} className="text-[#3498DB]" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-800 dark:text-white text-sm">Smart Receipt Scan (AI)</p>
                            <p className="text-xs text-gray-500">
                                {isDragging ? '🎯 Sii daa — ha yimaaddo!' : 'Upload, drag & drop, or Ctrl+V to paste a receipt image'}
                            </p>
                        </div>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} disabled={isAnalyzing} />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isAnalyzing}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#3498DB] hover:bg-[#2980B9] text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        {isAnalyzing ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</> : <><UploadCloud size={16} /> Upload Receipt</>}
                    </button>
                </div>
            </div>

            {/* ─── MAIN FORM CARD ─── */}
            <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-xl overflow-hidden">

                {/* ── TOP SECTION ── */}
                <div className="p-6 md:p-8 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

                        {/* Customer */}
                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Customer *</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User size={16} className="text-gray-400" />
                                </div>
                                <select
                                    value={customerId}
                                    onChange={(e) => setCustomerId(e.target.value)}
                                    className="block w-full pl-9 pr-8 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB] transition-all font-medium text-sm appearance-none"
                                    required
                                >
                                    <option value="" disabled>Select Customer...</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-400">
                                    <ChevronDown size={14} />
                                </div>
                            </div>
                            {/* Quick-add link */}
                            <button
                                type="button"
                                onClick={() => setIsQuickAddOpen(true)}
                                className="mt-1.5 text-xs text-[#3498DB] hover:underline font-bold flex items-center gap-1"
                            >
                                <UserPlus size={12} /> New Customer
                            </button>
                        </div>

                        {/* Payment Method */}
                        <div className="md:col-span-4">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Payment Method</label>
                            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                                {(['Cash', 'Card', 'Credit'] as const).map(method => (
                                    <button
                                        key={method}
                                        type="button"
                                        onClick={() => { setPaymentMethod(method); setPartialPaidAmount(''); }}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${paymentMethod === method
                                            ? 'bg-white dark:bg-gray-700 shadow text-[#3498DB]'
                                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                    >
                                        {method}
                                    </button>
                                ))}
                            </div>

                            {/* Credit Due Date */}
                            {paymentMethod === 'Credit' && (
                                <div className="mt-3 relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Due Date</span>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="block w-full pl-20 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB]"
                                    />
                                </div>
                            )}

                            {/* Credit: partial + account */}
                            {paymentMethod === 'Credit' && (
                                <div className="mt-3 space-y-2">
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Paid</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max={total}
                                            placeholder="Partial Amount (optional)"
                                            value={partialPaidAmount}
                                            onChange={(e) => setPartialPaidAmount(e.target.value)}
                                            className="block w-full pl-12 pr-4 py-2.5 border border-red-200 dark:border-red-800 rounded-xl bg-red-50 dark:bg-red-900/10 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-400/20 focus:border-red-400"
                                        />
                                    </div>
                                    {partialAmount > 0 && (
                                        <p className="text-xs font-bold text-red-500 flex items-center gap-1">
                                            <AlertCircle size={12} /> Balance remaining: ETB {balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                        </p>
                                    )}
                                    {/* Account selector (needed to deposit partial) */}
                                    {partialAmount > 0 && accounts.length > 0 && (
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Wallet size={14} className="text-gray-400" />
                                            </div>
                                            <select
                                                value={selectedAccountId}
                                                onChange={(e) => setSelectedAccountId(e.target.value)}
                                                className="block w-full pl-9 pr-8 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB] appearance-none"
                                            >
                                                <option value="">Deposit partial to...</option>
                                                {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-400">
                                                <ChevronDown size={12} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Cash/Card: account selector */}
                            {paymentMethod !== 'Credit' && accounts.length > 0 && (
                                <div className="relative mt-3">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Wallet size={14} className="text-gray-400" />
                                    </div>
                                    <select
                                        value={selectedAccountId}
                                        onChange={(e) => setSelectedAccountId(e.target.value)}
                                        className="block w-full pl-9 pr-8 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB] appearance-none"
                                        required
                                    >
                                        <option value="">Deposit to account...</option>
                                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-400">
                                        <ChevronDown size={12} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Invoice # + Receipt # */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Invoice #</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FileText size={14} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={invoiceNumber}
                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                    className="block w-full pl-9 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB]"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                Supplier Receipt #
                                {requireReceiptNumber
                                    ? <span className="ml-1 text-red-500">*</span>
                                    : <span className="ml-1 normal-case font-normal text-gray-400">(optional)</span>
                                }
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Receipt size={14} className="text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={supplierReceiptNumber}
                                    onChange={(e) => setSupplierReceiptNumber(e.target.value)}
                                    placeholder="e.g. REC-001"
                                    required={requireReceiptNumber}
                                    className={`block w-full pl-9 pr-3 py-3 border rounded-xl bg-white dark:bg-gray-900 text-sm font-mono focus:outline-none focus:ring-2 transition-all ${requireReceiptNumber && !supplierReceiptNumber.trim()
                                        ? 'border-red-300 dark:border-red-700 focus:ring-red-400/20 focus:border-red-400'
                                        : 'border-gray-200 dark:border-gray-700 focus:ring-[#3498DB]/20 focus:border-[#3498DB]'
                                        }`}
                                />
                            </div>
                            {requireReceiptNumber && !supplierReceiptNumber.trim() && (
                                <p className="mt-1 text-xs text-red-500 font-medium">Receipt # is required by your company settings</p>
                            )}
                        </div>

                        {/* Date */}
                        <div className="md:col-span-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="block w-full px-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB]"
                            />
                        </div>

                        {/* ── NEW: Currency & Rate ── */}
                        <div className="md:col-span-12 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                            <div className="w-full md:w-auto">
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Sale Currency</label>
                                <div className="flex bg-blue-50 dark:bg-blue-900/10 p-1 rounded-xl border border-blue-100 dark:border-blue-800/50">
                                    {(['ETB', 'USD'] as const).map(curr => (
                                        <button
                                            key={curr}
                                            type="button"
                                            onClick={() => setCurrency(curr)}
                                            className={`px-8 py-2 rounded-lg text-xs font-black transition-all ${currency === curr
                                                ? 'bg-[#3498DB] text-white shadow-lg shadow-blue-500/25'
                                                : 'text-blue-600/60 hover:text-blue-600'
                                                }`}
                                        >
                                            {curr}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="w-full md:w-48 relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-500/50 uppercase">Rate</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={exchangeRate}
                                    onChange={e => setExchangeRate(e.target.value)}
                                    className="w-full pl-14 pr-3 py-3 border border-blue-100 dark:border-blue-800/50 rounded-xl bg-blue-50/30 dark:bg-blue-900/5 text-sm font-black text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="1.00"
                                />
                            </div>

                            <div className="flex-1 md:text-right">
                                <p className="text-[10px] font-bold text-gray-400 italic">
                                    {currency === 'USD'
                                        ? `Pricing in USD. Normalized to ETB @ ${exchangeRate} for accounting.`
                                        : `Standard ETB sale. Exchange rate used for debt calculation if needed.`
                                    }
                                </p>
                            </div>
                        </div>

                        {/* ── NEW: Debt Conversion Rules ── */}
                        {paymentMethod === 'Credit' && (
                            <div className="md:col-span-12 p-5 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 rounded-[1.5rem] mt-2">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div
                                            onClick={() => setAutoConvertDebt(!autoConvertDebt)}
                                            className={`relative w-12 h-6 rounded-full transition-all cursor-pointer shadow-inner flex items-center px-1 ${autoConvertDebt ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${autoConvertDebt ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider">Amaanada Maamul (Auto-convert to USD)</p>
                                            <p className="text-[10px] font-bold text-amber-700/60 dark:text-amber-500/60 italic">Hadii lacag bixintu dhafto mudada loo qabtay, nidaamku USD ayuu u badalaya.</p>
                                        </div>
                                    </div>

                                    {autoConvertDebt && (
                                        <div className="flex items-center gap-3 bg-white dark:bg-gray-900/50 p-2 px-4 rounded-xl border border-amber-200 dark:border-amber-800/50">
                                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Badal kadib (Maalmood):</span>
                                            <input
                                                type="number"
                                                min="1"
                                                value={convertDebtAfterDays}
                                                onChange={e => setConvertDebtAfterDays(e.target.value)}
                                                className="w-14 bg-transparent text-sm font-black text-center text-amber-600 focus:outline-none"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── PRODUCT ROWS ── */}
                <div className="p-6 md:p-8">
                    {/* Column headers */}
                    <div className="grid grid-cols-12 gap-3 mb-3 text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
                        <div className="col-span-5">Product</div>
                        <div className="col-span-2 text-center">Qty</div>
                        <div className="col-span-2 text-center">Unit Price</div>
                        <div className="col-span-2 text-right">Total</div>
                        <div className="col-span-1"></div>
                    </div>

                    <div className="space-y-2.5">
                        {items.map((item) => {
                            const isOverStocked = item.stock !== undefined && item.qty > item.stock;

                            return (
                                <div
                                    key={item.id}
                                    className={`grid grid-cols-12 gap-3 items-center p-3 rounded-xl border transition-all ${item.productId && !item.matched
                                        ? 'border-orange-200 dark:border-orange-700/40 bg-orange-50/50 dark:bg-orange-900/5'
                                        : item.matched
                                            ? 'border-green-200 dark:border-green-700/40 bg-green-50/50 dark:bg-green-900/5'
                                            : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30'
                                        } hover:border-[#3498DB]/30`}
                                >
                                    {/* Product selector */}
                                    <div className="col-span-5 relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Package size={14} className="text-gray-400" />
                                        </div>
                                        <select
                                            value={item.productId}
                                            onChange={(e) => handleProductSelect(item.id, e.target.value)}
                                            className={`block w-full pl-9 pr-6 py-2.5 border rounded-lg bg-white dark:bg-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB] appearance-none ${isOverStocked ? 'border-red-400 ring-1 ring-red-400/20' : 'border-gray-200 dark:border-gray-700'}`}
                                        >
                                            <option value="">Select product...</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} {p.stock <= 5 ? `(Stock: ${p.stock})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-400">
                                            <ChevronDown size={12} />
                                        </div>
                                        {item.stock !== undefined && (
                                            <div className={`absolute -bottom-4 left-2 text-[10px] font-bold ${isOverStocked ? 'text-red-500' : 'text-gray-400'}`}>
                                                {isOverStocked ? 'Not enough stock!' : `${item.stock} in stock`}
                                            </div>
                                        )}
                                    </div>

                                    {/* Qty */}
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.qty || ''}
                                            onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                                            className={`block w-full px-3 py-2.5 text-center border rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB] ${isOverStocked ? 'bg-red-50 text-red-600 border-red-400' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'}`}
                                        />
                                    </div>

                                    {/* Price (Editable) */}
                                    <div className="col-span-2 relative">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.price || ''}
                                            onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                            className="block w-full px-3 py-2.5 text-center border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm font-bold text-[#3498DB] focus:outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB]"
                                        />
                                    </div>

                                    {/* Row total */}
                                    <div className="col-span-2 text-right text-sm font-black text-gray-900 dark:text-white">
                                        {item.price > 0 && item.qty > 0 ? (item.qty * item.price).toLocaleString() : <span className="text-gray-300">—</span>}
                                    </div>

                                    {/* Delete */}
                                    <div className="col-span-1 flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => removeItem(item.id)}
                                            disabled={items.length === 1}
                                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={addItem}
                        className="mt-3 px-4 py-2 text-sm font-bold text-[#3498DB] hover:text-[#2980B9] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all flex items-center gap-2"
                    >
                        <Plus size={15} /> Add Item
                    </button>
                </div>

                {/* ── FOOTER : TOTALS + NOTES + VAT ── */}
                <div className="bg-gray-50 dark:bg-[#111827] px-6 md:px-8 py-6 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col md:flex-row gap-6 justify-between">

                        {/* Notes */}
                        <div className="flex-1 max-w-md">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Notes (Optional)</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={3}
                                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB]"
                                placeholder="Add a note for this sale..."
                            />
                        </div>

                        {/* Totals */}
                        <div className="w-64 shrink-0 space-y-2.5">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Subtotal</span>
                                <span className="font-bold text-gray-900 dark:text-white">ETB {subtotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                            </div>

                            {/* VAT Toggle */}
                            <div className="flex items-center justify-between py-1">
                                <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
                                    <div
                                        onClick={() => setApplyVAT(!applyVAT)}
                                        className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${applyVAT ? 'bg-[#3498DB]' : 'bg-gray-300 dark:bg-gray-700'}`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${applyVAT ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                    <Percent size={12} /> VAT ({companyTaxRate}%)
                                </label>
                                {applyVAT && (
                                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                                        ETB {taxAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </span>
                                )}
                            </div>

                            {/* Discount Field */}
                            <div className="flex items-center justify-between py-1 border-t border-dashed border-gray-200 dark:border-gray-700 mt-1 pt-1">
                                <span className="text-sm text-gray-500 font-bold">Discount (ETB)</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={discountAmount === '0' ? '' : discountAmount}
                                    placeholder="0.00"
                                    onChange={(e) => setDiscountAmount(e.target.value)}
                                    className="w-24 px-2 py-1 text-right border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm font-bold text-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/20 focus:border-orange-500"
                                />
                            </div>

                            <div className="flex justify-between text-xl font-black text-[#2ECC71] pt-2.5 border-t border-gray-200 dark:border-gray-700">
                                <span>Total</span>
                                <span>ETB {total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                            </div>

                            {paymentMethod === 'Credit' && partialAmount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Paid now</span>
                                    <span className="font-bold text-gray-700 dark:text-gray-300">ETB {partialAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            {paymentMethod === 'Credit' && balance > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-red-500 font-bold">Balance (Deyn)</span>
                                    <span className="font-black text-red-500">ETB {balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── ACTION BUTTONS ─── */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                    type="button"
                    onClick={handleSaveAndAddAnother}
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none sm:w-auto px-6 py-3.5 rounded-xl border-2 border-[#3498DB] text-[#3498DB] font-bold transition-all flex items-center justify-center gap-2 hover:bg-[#3498DB]/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting && saveMode === 'again' ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save & Add Another
                </button>
                <button
                    type="button"
                    onClick={handleSubmitReceipt}
                    disabled={isSubmitting}
                    className="flex-1 px-8 py-3.5 rounded-xl bg-[#2ECC71] hover:bg-[#27AE60] text-white font-bold shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting && saveMode === 'submit' ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                    Submit Receipt
                </button>
            </div>

            {/* ─── QUICK-ADD CUSTOMER MODAL ─── */}
            {isQuickAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-[#1f2937] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                                <UserPlus size={18} className="text-[#3498DB]" /> New Customer
                            </h3>
                            <button onClick={() => setIsQuickAddOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5 space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Name *</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={quickAddName}
                                    onChange={e => setQuickAddName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleQuickAddCustomer()}
                                    placeholder="Customer name"
                                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Phone (optional)</label>
                                <input
                                    type="tel"
                                    value={quickAddPhone}
                                    onChange={e => setQuickAddPhone(e.target.value)}
                                    placeholder="Phone number"
                                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB]"
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsQuickAddOpen(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-500 text-sm hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleQuickAddCustomer}
                                    disabled={!quickAddName.trim() || isAddingCustomer}
                                    className="flex-1 py-2.5 rounded-xl bg-[#3498DB] hover:bg-[#2980B9] text-white font-bold text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isAddingCustomer ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Add Customer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
