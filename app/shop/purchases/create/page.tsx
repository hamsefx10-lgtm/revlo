'use client';

import React, { useState, useEffect } from 'react';
import {
    Save,
    ArrowLeft,
    Truck,
    Package,
    Calendar,
    CheckCircle2,
    Plus,
    Trash2,
    ChevronDown,
    Globe,
    Loader2,
    DollarSign,
    Scale,
    CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface PurchaseItem {
    id: number;
    productId: string;
    productName: string;
    quantity: number;
    unitCost: number;
    sku?: string;
}

interface Vendor {
    id: string;
    name: string;
    companyName?: string;
}

interface Product {
    id: string;
    name: string;
    sku: string;
    sellingPrice: number;
}

export default function CreatePurchaseOrderPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [vendorId, setVendorId] = useState('');
    const [expectedDelivery, setExpectedDelivery] = useState('');
    const [notes, setNotes] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [exchangeRate, setExchangeRate] = useState<number>(1);
    
    // Landed Cost & Payment
    const [shippingCost, setShippingCost] = useState('0');
    const [customsFee, setCustomsFee] = useState('0');
    const [otherExpenses, setOtherExpenses] = useState('0');
    const [paidAmount, setPaidAmount] = useState('0');
    const [paymentMethod, setPaymentMethod] = useState('Check');

    // Data lists
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [items, setItems] = useState<PurchaseItem[]>([
        { id: Date.now(), productId: '', productName: '', quantity: 1, unitCost: 0 }
    ]);

    useEffect(() => {
        fetchVendors();
        fetchProducts();
        fetchExchangeRate();
    }, []);

    const fetchVendors = async () => {
        try {
            const res = await fetch('/api/shop/vendors');
            const data = await res.json();
            setVendors(data.vendors || []);
        } catch (e) {
            toast.error('Failed to load vendors');
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/shop/inventory');
            const data = await res.json();
            setProducts(data.products || []);
        } catch (e) {
            toast.error('Failed to load inventory');
        }
    };

    const fetchExchangeRate = async () => {
        try {
            const res = await fetch('/api/settings/exchange-rate');
            const data = await res.json();
            if (data.rate?.rate) {
                setExchangeRate(data.rate.rate);
            }
        } catch (e) {}
    };

    const addItem = () => {
        setItems([...items, { id: Date.now(), productId: '', productName: '', quantity: 1, unitCost: 0 }]);
    };

    const removeItem = (id: number) => {
        if (items.length === 1) return;
        setItems(items.filter(item => item.id !== id));
    };

    const handleProductSelect = (id: number, productId: string) => {
        const product = products.find(p => p.id === productId);
        if (product) {
            setItems(items.map(item =>
                item.id === id ? { ...item, productId, productName: product.name, sku: product.sku } : item
            ));
        }
    };

    const updateItem = (id: number, field: keyof PurchaseItem, value: any) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    // Calculations
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
    const shipping = parseFloat(shippingCost) || 0;
    const customs = parseFloat(customsFee) || 0;
    const other = parseFloat(otherExpenses) || 0;
    const additionalCosts = shipping + customs + other;
    const total = subtotal + additionalCosts;

    // ETB Equivalents for reference
    const totalETB = currency === 'USD' ? total * exchangeRate : total;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validItems = items.filter(i => i.productId && i.quantity > 0);
        
        if (!vendorId) return toast.error('Please select a vendor');
        if (validItems.length === 0) return toast.error('Please add at least one product');

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/shop/purchases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vendorId,
                    expectedDelivery: expectedDelivery || null,
                    notes,
                    items: validItems.map(i => ({
                        productId: i.productId,
                        productName: i.productName,
                        quantity: i.quantity,
                        unitCost: i.unitCost,
                        sku: i.sku
                    })),
                    currency,
                    exchangeRate,
                    shippingCost: shipping,
                    customsFee: customs,
                    otherExpenses: other,
                    paidAmount: parseFloat(paidAmount) || 0,
                    paymentMethod,
                    sendWhatsApp: true
                })
            });

            if (res.ok) {
                toast.success('Purchase Order created!');
                router.push('/shop/purchases');
            } else {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create PO');
            }
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <Link href="/shop/purchases" className="text-gray-400 hover:text-[#3498DB] transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider mb-2">
                        <ArrowLeft size={14} /> Back
                    </Link>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-blue-500 rounded-xl text-white shadow-lg shadow-blue-500/20">
                            <Truck size={24} />
                        </div>
                        New Purchase Order
                    </h1>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-8 py-3.5 rounded-2xl bg-[#2ECC71] hover:bg-[#27AE60] text-white font-black shadow-xl shadow-green-500/20 hover:shadow-green-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                        Confirm & Create Order
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
                {/* Main Form Section */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden">
                        <div className="p-6 md:p-8 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Supplier (Vendor)</label>
                                <select 
                                    value={vendorId} 
                                    onChange={e => setVendorId(e.target.value)}
                                    className="w-full p-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="">Select Vendor...</option>
                                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name || v.companyName}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Expected Delivery</label>
                                <input 
                                    type="date" 
                                    value={expectedDelivery} 
                                    onChange={e => setExpectedDelivery(e.target.value)}
                                    className="w-full p-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="p-6 md:p-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-black text-gray-400 text-xs uppercase tracking-widest">Order Items</h3>
                                <button onClick={addItem} className="flex items-center gap-1 text-blue-500 font-bold text-xs hover:underline"><Plus size={14}/> Add Row</button>
                            </div>
                            
                            <div className="space-y-3">
                                {items.map((item, idx) => (
                                    <div key={item.id} className="grid grid-cols-12 gap-3 items-center group">
                                        <div className="col-span-6">
                                            <select 
                                                value={item.productId} 
                                                onChange={e => handleProductSelect(item.id, e.target.value)}
                                                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold appearance-none"
                                            >
                                                <option value="">Select Product...</option>
                                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <input 
                                                type="number" 
                                                min="1" 
                                                value={item.quantity} 
                                                onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-center font-black"
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-black">{currency}</span>
                                                <input 
                                                    type="number" 
                                                    min="0" 
                                                    step="0.01"
                                                    value={item.unitCost} 
                                                    onChange={e => updateItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                                                    className="w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-right font-black text-blue-600"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-1 text-center">
                                            <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Notes Area */}
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Order Notes / Terms</label>
                        <textarea 
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Add specific instructions for the supplier..."
                            className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-[1.5rem] text-sm focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                </div>

                {/* Sidebar Details / Totals */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Currency & Exchange Rate */}
                    <div className="bg-blue-600 rounded-[2rem] p-6 text-white shadow-xl shadow-blue-500/20">
                        <h3 className="font-black text-xs uppercase tracking-widest opacity-70 mb-4 flex items-center gap-2">
                            <Globe size={14}/> Currency Settings
                        </h3>
                        <div className="flex bg-white/10 p-1 rounded-xl mb-4">
                            {['USD', 'ETB'].map(curr => (
                                <button
                                    key={curr}
                                    onClick={() => setCurrency(curr)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-black transition-all ${currency === curr ? 'bg-white text-blue-600 shadow-lg' : 'text-white/60 hover:text-white'}`}
                                >
                                    {curr}
                                </button>
                            ))}
                        </div>
                        {currency === 'USD' && (
                            <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Exchange Rate (ETB)</label>
                                <input 
                                    type="number"
                                    value={exchangeRate}
                                    onChange={e => setExchangeRate(parseFloat(e.target.value))}
                                    className="bg-transparent text-2xl font-black w-full outline-none"
                                />
                            </div>
                        )}
                    </div>

                    {/* Landed Cost & Payment */}
                    <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 p-6 shadow-xl space-y-4">
                        <h3 className="font-black text-xs text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Scale size={14}/> Costs & Payment
                        </h3>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Shipping Cost ({currency})</label>
                            <input type="number" value={shippingCost} onChange={e => setShippingCost(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Customs/Taxes ({currency})</label>
                            <input type="number" value={customsFee} onChange={e => setCustomsFee(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold" />
                        </div>
                        <div className="pt-4 border-t border-dashed border-gray-100">
                            <label className="block text-[10px] font-black text-gray-600 uppercase mb-1">Amount Paid Now ({currency})</label>
                            <input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} className="w-full p-3 bg-green-50 border border-green-100 rounded-xl text-sm font-black text-green-600" />
                        </div>
                    </div>

                    {/* Final Totals Card */}
                    <div className="bg-gray-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-all">
                            <DollarSign size={80} />
                        </div>
                        <div className="relative z-10 space-y-4">
                            <div className="flex justify-between items-center text-sm opacity-60">
                                <span>Subtotal</span>
                                <span className="font-bold">{currency} {subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm opacity-60">
                                <span>Additional Costs</span>
                                <span className="font-bold">{currency} {additionalCosts.toLocaleString()}</span>
                            </div>
                            <div className="pt-4 border-t border-white/10 mt-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Grand Total</p>
                                <div className="flex justify-between items-end">
                                    <h2 className="text-4xl font-black text-[#2ECC71] tracking-tighter">
                                        <span className="text-xl mr-1">{currency}</span>
                                        {total.toLocaleString()}
                                    </h2>
                                </div>
                                {currency === 'USD' && (
                                    <p className="mt-2 text-xs font-bold text-gray-400 italic">≈ ETB {totalETB.toLocaleString()}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
