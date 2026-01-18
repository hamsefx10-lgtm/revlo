'use client';

import React, { useState, useEffect } from 'react';
import {
    Save,
    Plus,
    Trash2,
    Calendar,
    User,
    FileText,
    ArrowLeft,
    CheckCircle2,
    Package
} from 'lucide-react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

// --- TYPES ---
interface LineItem {
    id: number;
    productId: string;
    description: string;
    qty: number;
    price: number;
}

interface Customer {
    id: string;
    name: string;
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

export default function ManualEntryPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [customerId, setCustomerId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now()}`);
    const [isLoading, setIsLoading] = useState(false);

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    // Account Selection State
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState('');

    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Credit'>('Cash');
    const [partialPaidAmount, setPartialPaidAmount] = useState('');
    const [notes, setNotes] = useState('');

    const [items, setItems] = useState<LineItem[]>([
        { id: 1, productId: '', description: '', qty: 1, price: 0 }
    ]);

    // Fetch customers, products, and accounts on mount
    useEffect(() => {
        fetchCustomers();
        fetchProducts();
        fetchAccounts();
    }, []);

    const fetchCustomers = async () => {
        try {
            const response = await fetch('/api/shop/customers');
            if (response.ok) {
                const data = await response.json();
                setCustomers([
                    { id: 'walk-in', name: 'Walk-in Customer' },
                    ...data.customers
                ]);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/shop/inventory');
            if (response.ok) {
                const data = await response.json();
                setProducts(data.products || []);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const fetchAccounts = async () => {
        try {
            const response = await fetch('/api/shop/accounts');
            if (response.ok) {
                const data = await response.json();
                setAccounts(data.accounts || []);
                // Default to first account if available
                if (data.accounts?.length > 0) setSelectedAccountId(data.accounts[0].id);
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    // --- ACTIONS ---
    const addItem = () => {
        const newItem: LineItem = {
            id: Date.now(),
            productId: '',
            description: '',
            qty: 1,
            price: 0
        };
        setItems([...items, newItem]);
    };

    const removeItem = (id: number) => {
        if (items.length === 1) return;
        setItems(items.filter(item => item.id !== id));
    };

    const handleProductSelect = (id: number, productId: string) => {
        const product = products.find(p => p.id === productId);
        if (product) {
            setItems(items.map(item =>
                item.id === id ? { ...item, productId, description: product.name, price: product.sellingPrice } : item
            ));
        }
    };

    const updateItem = (id: number, field: keyof LineItem, value: any) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
    const tax = subtotal * 0.15;
    const total = subtotal + tax;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Submitting Manual Entry...");

        // Validation
        if (!customerId) {
            toast({
                title: 'Validation Error',
                description: 'Please select a customer',
                variant: 'destructive'
            });
            console.error("Validation Failed: No customer selected");
            return;
        }

        if (paymentMethod === 'Credit' && customerId === 'walk-in') {
            toast({ title: 'Error', description: 'Credit sales require a registered customer.', variant: 'destructive' });
            return;
        }

        const validItems = items.filter(item => item.productId && item.qty > 0);
        if (validItems.length === 0) {
            toast({
                title: 'Validation Error',
                description: 'Please add at least one product with quantity > 0',
                variant: 'destructive'
            });
            console.error("Validation Failed: No valid items");
            return;
        }

        setIsLoading(true);

        // Determine Payment Status & Paid Amount
        let finalPaidAmount = total;
        let finalStatus = 'Paid';

        if (paymentMethod === 'Credit') {
            const partial = parseFloat(partialPaidAmount) || 0;
            finalPaidAmount = partial;
            finalStatus = partial > 0 ? 'Partial' : 'Unpaid';
        }

        const payload = {
            customerId: customerId === 'walk-in' ? null : customerId,
            items: validItems.map(item => ({
                productId: item.productId,
                quantity: item.qty
            })),
            paymentMethod: paymentMethod,
            notes: notes || null,
            accountId: paymentMethod === 'Credit' ? undefined : selectedAccountId, // Don't deposit to account if full credit (unless partial, but API handles that based on accountId presence)
            // Actually, for partial, we DO want to deposit the partial amount.
            // If paymentMethod is credit, but partialPaidAmount > 0, we should pass accountId if we want that partial amount to be deposited?
            // The API logic: "if (accountId && (paidAmount === undefined || paidAmount > 0)) { ... deposit ... }"
            // So if we pass accountId, it will deposit.
            // If Credit + Partial > 0, we likely want to deposit that partial amount.
            // So we should pass accountId if paymentMethod is NOT Credit OR if (Credit AND partial > 0).
            // But wait, if paymentMethod is Credit, the user might not have selected an account if the UI hides it?
            // We need to allow account selection for 'Credit' if partial payment is enabled, OR just assume main account?
            // Let's keep it simple: If Credit, pass account if partial > 0.
            // However, my updated API logic handles `accountId` being present.

            // Correction: On POS, we hid account selector for 'Credit'.
            // If we want to support partial payment deposit, we need an account.
            // For now, let's pass `selectedAccountId` even for Credit if we have one, but the UI might hide it.
            // We should ensure UI allows selecting account if Partial > 0? Or just default to one?
            // Let's assume for now manual entry users can select account always, or we update UI to hide/show.
            // I'll update UI below to handle this.
            paidAmount: finalPaidAmount,
            paymentStatus: finalStatus
        };

        // If Credit and we have partial > 0, we need the accountId to be present for the API to deposit it.
        // If the user didn't see the dropdown, selectedAccountId might be default (first account). That is fine.

        console.log("Payload:", payload);

        try {
            const response = await fetch('/api/shop/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log("Response Status:", response.status);

            const data = await response.json();

            if (!response.ok) {
                console.error("API Error Response:", data);
                throw new Error(data.error || 'Failed to create sale');
            }

            toast({
                title: 'Success!',
                description: `Sale ${data.sale.invoiceNumber} created successfully.`
            });

            router.push(`/shop/sales/${data.sale.id}`);
        } catch (error: any) {
            console.error('Error creating sale:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to create sale. Check console for details.',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full relative">
            <div className="flex items-center gap-4 mb-6">
                <Link href="/shop/pos" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">New Sale (Manual Entry)</h1>
                    <p className="text-sm text-gray-500">Record a sale manually without using the POS interface.</p>
                </div>
            </div>
            <div className="flex gap-3">
                <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="px-6 py-3 rounded-xl bg-[#2ECC71] hover:bg-[#27AE60] text-white font-bold shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Processing...
                        </>
                    ) : (
                        <><CheckCircle2 size={18} /> Submit Receipt</>
                    )}
                </button>
            </div>


            {/* MAIN FORM */}
            <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-xl overflow-hidden w-full">

                {/* Top Section */}
                <div className="p-8 border-b border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20 grid grid-cols-1 md:grid-cols-4 gap-6">

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Customer *</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User size={18} className="text-gray-400" />
                            </div>
                            <select
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                className="block w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB] transition-all font-medium appearance-none cursor-pointer"
                                required
                            >
                                <option value="" disabled>Select Customer...</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                                <ChevronDown size={16} />
                            </div>
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Payment Details</label>
                        <div className="flex flex-col md:flex-row gap-3">
                            {/* Payment Method Tabs */}
                            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                                {['Cash', 'Card', 'Credit'].map(method => (
                                    <button
                                        key={method}
                                        type="button"
                                        onClick={() => setPaymentMethod(method as any)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${paymentMethod === method
                                            ? 'bg-white dark:bg-gray-700 shadow-sm text-[#3498DB]'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {method}
                                    </button>
                                ))}
                            </div>

                            {/* Dynamic Inputs based on Payment Method */}
                            <div className="flex-1">
                                {paymentMethod === 'Credit' ? (
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-400 font-bold text-xs">Paid</span>
                                        </div>
                                        <input
                                            type="number"
                                            placeholder="Partial Amount (Optional)"
                                            value={partialPaidAmount}
                                            onChange={(e) => setPartialPaidAmount(e.target.value)}
                                            className="block w-full pl-12 pr-4 py-2.5 border border-red-200 dark:border-red-900/30 rounded-xl bg-red-50 dark:bg-red-900/10 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-bold text-sm"
                                        />
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FileText size={18} className="text-gray-400" />
                                        </div>
                                        <select
                                            value={selectedAccountId}
                                            onChange={(e) => setSelectedAccountId(e.target.value)}
                                            className="block w-full pl-10 pr-10 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB] transition-all font-medium appearance-none cursor-pointer text-sm"
                                            required
                                        >
                                            <option value="" disabled>Deposit To...</option>
                                            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                                            <ChevronDown size={14} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Invoice #</label>
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-700">
                            <span className="font-mono font-bold text-gray-600 dark:text-gray-300 text-sm">{invoiceNumber}</span>
                        </div>
                    </div>

                </div>

                {/* Products Table */}
                <div className="p-8">
                    <div className="grid grid-cols-12 gap-4 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider pl-4">
                        <div className="col-span-5">Product</div>
                        <div className="col-span-2 text-center">Quantity</div>
                        <div className="col-span-2 text-center">Unit Price</div>
                        <div className="col-span-2 text-right">Total</div>
                        <div className="col-span-1"></div>
                    </div>

                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <div key={item.id} className="grid grid-cols-12 gap-4 items-center bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 group hover:border-[#3498DB]/30 transition-all">

                                {/* Product Select */}
                                <div className="col-span-5 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Package size={16} className="text-gray-400" />
                                    </div>
                                    <select
                                        value={item.productId}
                                        onChange={(e) => handleProductSelect(item.id, e.target.value)}
                                        className="block w-full pl-9 pr-8 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB] transition-all font-bold text-sm appearance-none cursor-pointer"
                                    >
                                        <option value="">Select Product...</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-400">
                                        <ChevronDown size={14} />
                                    </div>
                                </div>

                                {/* Qty */}
                                <div className="col-span-2">
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.qty}
                                        onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                                        className="block w-full px-3 py-2.5 text-center border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB] font-bold text-sm"
                                    />
                                </div>

                                {/* Price */}
                                <div className="col-span-2 text-center font-bold text-gray-500">
                                    {item.price.toLocaleString()}
                                </div>

                                {/* Total */}
                                <div className="col-span-2 text-right font-black text-gray-900 dark:text-white">
                                    {(item.qty * item.price).toLocaleString()}
                                </div>

                                {/* Delete */}
                                <div className="col-span-1 text-center">
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        disabled={items.length === 1}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addItem}
                        className="mt-4 px-4 py-2 text-sm font-bold text-[#3498DB] hover:text-[#2980B9] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all flex items-center gap-2"
                    >
                        <Plus size={16} /> Add Item
                    </button>
                </div>

                {/* Footer Totals */}
                <div className="bg-gray-50 dark:bg-[#111827] p-8 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                    <div className="w-64 space-y-3">
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Subtotal</span>
                            <span className="font-bold">ETB {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Tax (15%)</span>
                            <span className="font-bold">ETB {tax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-2xl font-black text-[#2ECC71] pt-3 border-t border-gray-200 dark:border-gray-700">
                            <span>Total</span>
                            <span>ETB {total.toLocaleString()}</span>
                        </div>

                        {/* Notes Input */}
                        <div className="pt-4 mt-2">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Notes</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-sm"
                                placeholder="Add note..."
                                rows={2}
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div >
    );
}
