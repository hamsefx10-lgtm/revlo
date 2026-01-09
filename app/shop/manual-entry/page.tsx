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

export default function ManualEntryPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [customerId, setCustomerId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now()}`);
    const [isLoading, setIsLoading] = useState(false);

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    const [items, setItems] = useState<LineItem[]>([
        { id: 1, productId: '', description: '', qty: 1, price: 0 }
    ]);

    // Fetch customers and products on mount
    useEffect(() => {
        fetchCustomers();
        fetchProducts();
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

        // Validation
        if (!customerId) {
            toast({
                title: 'Validation Error',
                description: 'Please select a customer',
                variant: 'destructive'
            });
            return;
        }

        const validItems = items.filter(item => item.productId && item.qty > 0);
        if (validItems.length === 0) {
            toast({
                title: 'Validation Error',
                description: 'Please add at least one product',
                variant: 'destructive'
            });
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/shop/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: customerId === 'walk-in' ? null : customerId,
                    items: validItems.map(item => ({
                        productId: item.productId,
                        quantity: item.qty
                    })),
                    paymentMethod: 'Cash',
                    notes: ''
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create sale');
            }

            const data = await response.json();

            toast({
                title: 'Success!',
                description: `Sale ${data.sale.invoiceNumber} created successfully.`,
            });

            router.push(`/shop/sales/${data.sale.id}`);
        } catch (error: any) {
            console.error('Error creating sale:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to create sale. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/shop/dashboard" className="text-gray-400 hover:text-[#3498DB] transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider">
                            <ArrowLeft size={14} /> Back to Dashboard
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-[#2ECC71] to-[#27AE60] rounded-xl shadow-lg shadow-green-500/20 text-white">
                            <FileText size={28} />
                        </div>
                        Manual Entry
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-1 text-sm">Create a new sale invoice manually.</p>
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
            </div>

            {/* MAIN FORM */}
            <div className="bg-white dark:bg-[#1f2937] border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-xl overflow-hidden max-w-5xl mx-auto">

                {/* Top Section */}
                <div className="p-8 border-b border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20 grid grid-cols-1 md:grid-cols-3 gap-6">

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

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Date</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar size={18} className="text-gray-400" />
                            </div>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB] transition-all font-medium text-gray-700 dark:text-gray-200"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Invoice #</label>
                        <input
                            type="text"
                            value={invoiceNumber}
                            readOnly
                            className="block w-full px-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-100 dark:bg-gray-800 font-mono font-bold text-gray-500 cursor-not-allowed"
                        />
                    </div>
                </div>

                {/* Items Section */}
                <div className="p-8">
                    <div className="grid grid-cols-12 gap-4 mb-4 px-2">
                        <div className="col-span-6 text-xs font-bold text-gray-400 uppercase">Product</div>
                        <div className="col-span-2 text-xs font-bold text-gray-400 uppercase text-center">Quantity</div>
                        <div className="col-span-2 text-xs font-bold text-gray-400 uppercase text-right">Unit Price</div>
                        <div className="col-span-2 text-xs font-bold text-gray-400 uppercase text-right">Total</div>
                    </div>

                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <div key={item.id} className="grid grid-cols-12 gap-4 items-center group">
                                <div className="col-span-6 relative">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Package size={16} className="text-gray-400" />
                                        </div>
                                        <select
                                            value={item.productId}
                                            onChange={(e) => handleProductSelect(item.id, e.target.value)}
                                            className="w-full pl-9 pr-8 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-[#3498DB] transition-all font-medium appearance-none cursor-pointer"
                                        >
                                            <option value="" disabled>Select Product...</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} (Stock: {p.stock})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                                            <ChevronDown size={14} />
                                        </div>
                                    </div>
                                    <span className="absolute left-[-24px] top-1/2 -translate-y-1/2 text-xs font-bold text-gray-300">{index + 1}</span>
                                </div>

                                <div className="col-span-2">
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.qty}
                                        onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-[#3498DB] transition-all font-bold text-center"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <div className="text-right font-bold text-gray-900 dark:text-white px-4 py-3">
                                        {item.price.toLocaleString()}
                                    </div>
                                </div>

                                <div className="col-span-2 flex items-center justify-end gap-3">
                                    <div className="font-bold text-gray-900 dark:text-white w-20 text-right">
                                        {(item.qty * item.price).toLocaleString()}
                                    </div>
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addItem}
                        className="mt-6 flex items-center gap-2 text-[#3498DB] font-bold text-sm hover:underline transition-all px-2"
                    >
                        <Plus size={16} /> Add Item
                    </button>
                </div>

                {/* Totals */}
                <div className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 p-8">
                    <div className="flex justify-end">
                        <div className="w-full md:w-1/3 space-y-3">
                            <div className="flex justify-between text-sm text-gray-500 font-medium">
                                <span>Subtotal</span>
                                <span>ETB {subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500 font-medium">
                                <span>Tax (15%)</span>
                                <span>ETB {tax.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                                <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                                <span className="text-2xl font-black text-[#2ECC71]">ETB {total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
