'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Save, Plus, Minus, Trash2, User, FileText, ArrowLeft, CheckCircle2, Package,
    ChevronDown, ScanLine, Loader2, X, UserPlus, Receipt, Wallet, PauseCircle,
    Library, ShoppingCart, Clock, AlertCircle, Calendar, Smartphone, Banknote,
    Globe, Briefcase, UploadCloud, Search, Sparkles, Printer, ArrowLeftCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

// --- TYPES ---
interface LineItem { id: number; productId: string; description: string; qty: number; price: number; discount: number; stock?: number; matched?: boolean; }
interface Customer { id: string; name: string; phone?: string; }
interface Product { id: string; name: string; sellingPrice: number; stock: number; sku: string; }
interface Account { id: string; name: string; type: string; currency: string; }
interface Employee { id: string; fullName: string; }
interface PaymentRow { id: number; accountId: string; amount: string; method: string; }

const defaultItems = (): LineItem[] => [{ id: Date.now(), productId: '', description: '', qty: 1, price: 0, discount: 0 }];

export default function ManualEntryPage() {
    const router = useRouter();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now()}`);
    const [supplierReceiptNumber, setSupplierReceiptNumber] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [discountAmount, setDiscountAmount] = useState('0');
    const [currency, setCurrency] = useState<'ETB' | 'USD'>('ETB');
    const [exchangeRate, setExchangeRate] = useState('1');
    const [applyVAT, setApplyVAT] = useState(false);
    const [companyTaxRate, setCompanyTaxRate] = useState(15);
    const [autoConvertDebt, setAutoConvertDebt] = useState(true);
    const [convertDebtAfterDays, setConvertDebtAfterDays] = useState('7');
    const [isScanning, setIsScanning] = useState(false);
    const [items, setItems] = useState<LineItem[]>(defaultItems());
    const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([{ id: Date.now(), accountId: '', amount: '', method: 'Cash' }]);
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Credit'>('Cash');
    const [dueDate, setDueDate] = useState('');
    const [sendWhatsApp, setSendWhatsApp] = useState(true);
    const [shouldPrint, setShouldPrint] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [heldSales, setHeldSales] = useState<any[]>([]);
    const [isHeldModalOpen, setIsHeldModalOpen] = useState(false);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [quickAddName, setQuickAddName] = useState('');
    const [quickAddPhone, setQuickAddPhone] = useState('');
    const [companySettings, setCompanySettings] = useState<any>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const productsRef = useRef<Product[]>([]);
    const barcodeBuffer = useRef<string>('');
    const lastKeyTime = useRef<number>(0);

    useEffect(() => {
        const saved = localStorage.getItem('revlo_manual_held_sales');
        if (saved) setHeldSales(JSON.parse(saved));
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [custRes, prodRes, accRes, empRes, compRes] = await Promise.all([
                fetch('/api/shop/customers'), fetch('/api/shop/inventory'), fetch('/api/shop/accounts'), fetch('/api/shop/employees'), fetch('/api/shop/company')
            ]);
            if (custRes.ok) setCustomers([{ id: 'walk-in', name: 'Walk-in Customer' }, ...( (await custRes.json()).customers || [] )]);
            if (prodRes.ok) { const p = (await prodRes.json()).products || []; setProducts(p); productsRef.current = p; }
            if (accRes.ok) {
                const a = (await accRes.json()).accounts || []; setAccounts(a);
                if (a.length > 0) setPaymentRows([{ id: Date.now(), accountId: a[0].id, amount: '', method: 'Cash' }]);
            }
            if (empRes.ok) setEmployees((await empRes.json()).employees || []);
            if (compRes.ok) {
                const c = (await compRes.json()).company; setCompanySettings(c);
                if (c?.taxRate) setCompanyTaxRate(Number(c.taxRate));
                const rateRes = await fetch('/api/settings/exchange-rate');
                if (rateRes.ok) { const r = await rateRes.json(); setExchangeRate(String(r.rate?.rate || 1)); }
            }
        } catch { }
    };

    // --- BARCODE ENGINE ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
            const now = Date.now();
            if (now - lastKeyTime.current > 60) barcodeBuffer.current = '';
            lastKeyTime.current = now;
            if (e.key === 'Enter') {
                if (barcodeBuffer.current.length > 2) {
                    const product = productsRef.current.find(p => p.sku === barcodeBuffer.current || p.id === barcodeBuffer.current);
                    if (product) {
                        addItemFromProduct(product);
                        toast.success(`Scanned: ${product.name}`);
                    } else toast.error(`Not found: ${barcodeBuffer.current}`);
                }
                barcodeBuffer.current = '';
            } else if (e.key.length === 1) barcodeBuffer.current += e.key;
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const addItemFromProduct = (p: Product) => {
        setItems(prev => {
            const last = prev[prev.length - 1];
            if (!last?.productId && !last?.description) {
                return prev.map((item, i) => i === prev.length - 1 ? { ...item, productId: p.id, description: p.name, price: p.sellingPrice, matched: true, qty: 1 } : item);
            }
            return [...prev, { id: Date.now(), productId: p.id, description: p.name, price: p.sellingPrice, matched: true, qty: 1, discount: 0 }];
        });
    };

    // --- AI SMART SCAN ---
    const handleScan = async (file: File) => {
        if (!file) return;
        setIsScanning(true);
        const toastId = toast.loading('AI analyzing receipt...');
        const fd = new FormData(); fd.append('image', file);
        try {
            const res = await fetch('/api/analyze-receipt', { method: 'POST', body: fd });
            if (!res.ok) throw new Error('Scan failed');
            const data = await res.json();
            if (data.date) setDate(data.date);
            if (data.receiptNumber) setSupplierReceiptNumber(data.receiptNumber);
            const scannedItems = (data.items || []).map((si: any) => {
                const match = productsRef.current.find(p => p.name.toLowerCase().includes(si.name.toLowerCase()) || si.name.toLowerCase().includes(p.name.toLowerCase()));
                return { id: Date.now() + Math.random(), productId: match?.id || '', description: si.name, qty: si.qty || 1, price: si.price || 0, discount: 0, matched: !!match };
            });
            setItems(prev => [...prev.filter(p => p.productId || p.description), ...scannedItems]);
            toast.success('Smart scan complete!', { id: toastId });
        } catch (e: any) { toast.error(e.message, { id: toastId }); }
        finally { setIsScanning(false); }
    };

    const addItem = () => setItems(prev => [...prev, { id: Date.now(), productId: '', description: '', qty: 1, price: 0, discount: 0 }]);
    const removeItem = (id: number) => items.length === 1 ? setItems(defaultItems()) : setItems(prev => prev.filter(i => i.id !== id));
    const handleProductSelect = (id: number, pid: string) => {
        const p = products.find(prod => prod.id === pid);
        setItems(prev => prev.map(i => i.id === id ? { ...i, productId: pid, description: p?.name || '', price: p?.sellingPrice || 0, stock: p?.stock, matched: true } : i));
    };
    const updateItem = (id: number, f: keyof LineItem, v: any) => setItems(prev => prev.map(i => i.id === id ? { ...i, [f]: v } : i));

    const subtotal = items.reduce((sum, i) => sum + (i.qty * i.price) - ((i.qty * i.price) * (i.discount / 100)), 0);
    const globalDisc = parseFloat(discountAmount) || 0;
    const discounted = Math.max(0, subtotal - globalDisc);
    const tax = applyVAT ? discounted * (companyTaxRate / 100) : 0;
    const totalETB = discounted + tax;
    const rateVal = parseFloat(exchangeRate) || 1;
    const totalDisp = currency === 'USD' ? (totalETB / rateVal) : totalETB;
    const subtotalDisp = currency === 'USD' ? (subtotal / rateVal) : subtotal;
    const discountDisp = currency === 'USD' ? (globalDisc / rateVal) : globalDisc;
    const taxDisp = currency === 'USD' ? (tax / rateVal) : tax;
    const balanceDisp = Math.max(0, totalDisp - paymentRows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0));

    const handleFinalize = async () => {
        if (!customerId) return toast.error('Select customer');
        const vItems = items.filter(i => i.productId && i.qty > 0);
        if (vItems.length === 0) return toast.error('No items selected');
        setIsSubmitting(true);
        const payload = {
            customerId: customerId === 'walk-in' ? null : customerId,
            items: vItems, paymentMethod, notes, paidAmount: totalDisp - balanceDisp,
            taxAmount: tax / rateVal, discountAmount: globalDisc / rateVal, invoiceNumber, supplierReceiptNumber,
            date, currency, exchangeRate: rateVal, autoConvertDebt, convertDebtAfterDays, employeeId,
            payments: paymentRows.filter(p => p.accountId && p.amount).map(p => ({ ...p, amount: parseFloat(p.amount) }))
        };
        try {
            const res = await fetch('/api/shop/sales', { method: 'POST', body: JSON.stringify(payload) });
            if (res.ok) {
                 toast.success('Sale Finalized');
                 router.push(`/shop/sales`);
            } else {
                 const d = await res.json();
                 throw new Error(d.error);
            }
        } catch (e: any) { toast.error(e.message); }
        finally { setIsSubmitting(false); }
    };

    const saveHeldSales = (l: any[]) => { setHeldSales(l); localStorage.setItem('revlo_manual_held_sales', JSON.stringify(l)); };
    const handleHoldSale = () => {
        saveHeldSales([...heldSales, { id: Date.now(), invoiceNumber, customerId, items, paymentRows, notes, date, supplierReceiptNumber, timestamp: new Date().toISOString() }]);
        toast.success('Draft Saved'); setItems(defaultItems()); setCustomerId('');
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans text-gray-900 overflow-y-auto">
            {isScanning && (
                <div className="fixed inset-0 z-[200] bg-white/60 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in">
                    <Loader2 className="w-10 h-10 animate-spin text-[#3498DB]" />
                    <h2 className="mt-4 text-sm font-black uppercase tracking-widest text-gray-600">AI Reading Receipt...</h2>
                </div>
            )}

            <div className="w-full mx-auto p-4 md:p-6 space-y-4">
                
                {/* --- COMPACT HEADER --- */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/shop/pos" className="p-1.5 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 transition-all text-gray-400">
                            <ArrowLeft size={18}/>
                        </Link>
                        <div>
                            <h1 className="text-lg font-black tracking-tight text-gray-900 leading-none">New Sale (Manual Entry)</h1>
                            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">Enter details manually or scan image</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                         <button onClick={handleHoldSale} className="px-4 py-2 bg-white border border-gray-100 rounded-lg text-[10px] font-black text-orange-500 hover:bg-orange-50 transition-all flex items-center gap-2 uppercase tracking-widest"><PauseCircle size={14}/> Pause</button>
                         <button onClick={()=>setIsHeldModalOpen(true)} className="px-4 py-2 bg-white border border-gray-100 rounded-lg text-[10px] font-black text-[#3498DB] hover:bg-blue-50 transition-all flex items-center gap-2 relative uppercase tracking-widest"><Clock size={14}/> Drafts {heldSales.length > 0 && <span className="ml-1 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px]">{heldSales.length}</span>}</button>
                    </div>
                </div>

                {/* --- SLIM AI SCAN BANNER --- */}
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between shadow-sm hover:border-[#3498DB]/30 transition-all cursor-pointer group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#3498DB]">
                             <ScanLine size={20}/>
                        </div>
                        <div>
                            <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Smart Receipt Scan (AI)</h4>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Auto-fill form from image</p>
                        </div>
                    </div>
                    <button className="px-5 py-2 bg-[#3498DB] text-white rounded-lg text-[10px] font-black shadow-sm active:scale-95 transition-all flex items-center gap-2 uppercase tracking-widest">
                         <UploadCloud size={14}/> Upload Receipt
                    </button>
                    <input type="file" ref={fileInputRef} onChange={e=>e.target.files?.[0]&&handleScan(e.target.files[0])} className="hidden" accept="image/*" />
                </div>

                {/* --- MAIN FORM (FULL WIDTH) --- */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-6">
                    
                    {/* ENTITIES GRID */}
                    <div className="grid grid-cols-12 gap-5">
                        <div className="col-span-12 lg:col-span-3 space-y-1.5">
                             <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Customer *</label>
                             <div className="relative">
                                 <select value={customerId} onChange={e=>setCustomerId(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs outline-none appearance-none">
                                     <option value="">Select Customer...</option>
                                     {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                 </select>
                                 <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                             </div>
                             <button onClick={()=>setIsQuickAddOpen(true)} className="text-[9px] font-black text-[#3498DB] hover:underline flex items-center gap-1 uppercase tracking-tighter"><Plus size={8}/> New Customer</button>
                        </div>

                        <div className="col-span-12 lg:col-span-3 space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Payment Method</label>
                            <div className="flex p-1 bg-gray-50 rounded-xl border border-gray-100 h-10">
                                {['Cash', 'Card', 'Credit'].map(m => (
                                    <button key={m} onClick={() => setPaymentMethod(m as any)} className={`flex-1 rounded-lg text-[9px] font-black transition-all ${paymentMethod === m ? 'bg-white text-[#3498DB] shadow-sm' : 'text-gray-400'}`}>
                                        {m.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Standard Account Select for Cash/Card */}
                            {paymentMethod !== 'Credit' && (
                                <div className="relative mt-1 animate-in fade-in slide-in-from-top-1">
                                    <select value={paymentRows[0].accountId} onChange={e => setPaymentRows(paymentRows.map((r,idx) => idx === 0 ? {...r, accountId: e.target.value} : r))} className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs outline-none appearance-none">
                                        <option value="">Select Account...</option>
                                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                                </div>
                            )}
                        </div>

                        {/* CREDIT DETAILS SECTION */}
                        {paymentMethod === 'Credit' && (
                            <div className="col-span-12 lg:col-span-9 grid grid-cols-12 gap-5 p-4 bg-red-50/30 rounded-2xl border border-red-100/50 animate-in zoom-in-95">
                                <div className="col-span-4 space-y-1.5">
                                    <label className="text-[9px] font-black text-red-400 uppercase tracking-widest pl-1">Paid Upfront</label>
                                    <div className="relative">
                                        <input type="number" placeholder="0.00" value={paymentRows[0].amount} onChange={e => setPaymentRows(paymentRows.map((r,idx) => idx === 0 ? {...r, amount: e.target.value} : r))} className="w-full p-2.5 bg-white border border-red-100 rounded-xl font-black text-xs text-red-600 outline-none" />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-red-300 uppercase">{currency}</div>
                                    </div>
                                </div>
                                <div className="col-span-4 space-y-1.5">
                                    <label className="text-[9px] font-black text-red-400 uppercase tracking-widest pl-1">Deposit Account</label>
                                    <div className="relative">
                                        <select value={paymentRows[0].accountId} onChange={e => setPaymentRows(paymentRows.map((r,idx) => idx === 0 ? {...r, accountId: e.target.value} : r))} className="w-full p-2.5 bg-white border border-red-100 rounded-xl font-bold text-xs text-red-600 outline-none appearance-none">
                                            <option value="">Select Account...</option>
                                            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                        </select>
                                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-200 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-[9px] font-black text-red-400 uppercase tracking-widest pl-1">Due Date</label>
                                    <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} className="w-full p-2.5 bg-white border border-red-100 rounded-xl font-black text-xs text-red-600 outline-none" />
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-[9px] font-black text-red-400 uppercase tracking-widest pl-1">Auto-Conv</label>
                                    <div onClick={() => setAutoConvertDebt(!autoConvertDebt)} className={`h-10 flex items-center justify-center rounded-xl border transition-all cursor-pointer ${autoConvertDebt?'bg-red-500 border-red-500 text-white':'bg-white border-red-100 text-red-300'}`}>
                                        <Globe size={16} className={autoConvertDebt?'animate-pulse':''}/>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="col-span-6 lg:col-span-2 space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Invoice #</label>
                            <input value={invoiceNumber} onChange={e=>setInvoiceNumber(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs outline-none" />
                        </div>

                        <div className="col-span-6 lg:col-span-2 space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Supplier Ref</label>
                            <input placeholder="e.g. REC-001" value={supplierReceiptNumber} onChange={e=>setSupplierReceiptNumber(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs outline-none" />
                        </div>

                        <div className="col-span-12 lg:col-span-2 space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Date</label>
                            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl font-black text-xs outline-none" />
                        </div>
                    </div>

                    {/* CURRENCY SELECTOR (COMPACT) */}
                    <div className="flex items-center justify-between border-t border-gray-50 pt-5">
                         <div className="flex items-center gap-6">
                            <div className="flex p-1 bg-gray-50 rounded-lg border border-gray-100">
                                {['ETB', 'USD'].map(c => (
                                    <button key={c} onClick={() => setCurrency(c as any)} className={`px-5 py-1.5 rounded-md text-[10px] font-black transition-all ${currency === c ? 'bg-[#3498DB] text-white shadow-sm' : 'text-gray-400'}`}>
                                        {c}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100">
                                 <span className="text-[9px] font-black text-blue-400 uppercase">Rate:</span>
                                 <input type="number" step="0.01" value={exchangeRate} onChange={e=>setExchangeRate(e.target.value)} className="w-14 bg-transparent text-xs font-black text-[#3498DB] outline-none" />
                            </div>
                         </div>
                         <p className="text-[9px] font-bold text-gray-300 italic uppercase tracking-tighter">Rate applies to debt conversion</p>
                    </div>

                    {/* --- DENSE PRODUCT TABLE --- */}
                    <div className="overflow-x-auto min-h-[300px]">
                        <div className="grid grid-cols-12 px-4 py-2 bg-gray-50 rounded-lg mb-2 border border-gray-50 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            <div className="col-span-6">Product Item</div>
                            <div className="col-span-2 text-center">Qty</div>
                            <div className="col-span-2 text-center">Unit Price</div>
                            <div className="col-span-2 text-right">Line Total</div>
                        </div>

                        <div className="space-y-1">
                            {items.map((item) => (
                                <div key={item.id} className="grid grid-cols-12 items-center px-4 py-2 bg-white hover:bg-gray-50/50 rounded-xl border border-transparent hover:border-gray-100 group transition-all">
                                    <div className="col-span-6 relative pr-8">
                                         <select value={item.productId} onChange={e=>handleProductSelect(item.id, e.target.value)} className="w-full bg-transparent font-black text-xs text-gray-900 outline-none appearance-none truncate">
                                             <option value="">Search product...</option>
                                             {products.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()} (STK: {p.stock})</option>)}
                                         </select>
                                         <ChevronDown size={10} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                                         {!item.matched && item.description && <p className="text-[8px] text-orange-500 font-bold mt-0.5 uppercase flex items-center gap-1"><Sparkles size={8}/> AI: {item.description}</p>}
                                    </div>
                                    <div className="col-span-2 px-6">
                                         <input type="number" value={item.qty} onChange={e=>updateItem(item.id, 'qty', parseInt(e.target.value)||0)} className="w-full bg-transparent font-black text-xs text-center outline-none" />
                                    </div>
                                    <div className="col-span-2 px-6">
                                         <input type="number" value={item.price} onChange={e=>updateItem(item.id, 'price', parseFloat(e.target.value)||0)} className="w-full bg-gray-50/80 p-1.5 rounded-lg font-black text-xs text-center outline-none border border-transparent focus:border-blue-100" />
                                    </div>
                                    <div className="col-span-2 flex items-center justify-between pl-6">
                                         <span className="text-[10px] font-black text-gray-300">ETB</span>
                                         <span className="flex-1 text-right font-black text-xs text-gray-900">{(item.qty * item.price).toLocaleString()}</span>
                                         <button onClick={() => removeItem(item.id)} className="ml-4 p-1.5 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                             <Trash2 size={14}/>
                                         </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button onClick={addItem} className="mt-4 text-[10px] font-black text-[#3498DB] hover:underline flex items-center gap-1 px-4 py-2 uppercase tracking-widest">
                            <Plus size={12}/> Add Item row
                        </button>
                    </div>

                    {/* --- SUMMARY SECTION --- */}
                    <div className="grid grid-cols-12 gap-10 border-t border-gray-50 pt-6">
                        <div className="col-span-5 space-y-2">
                             <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Remarks</label>
                             <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Entry details..." className="w-full h-24 p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none resize-none placeholder:text-gray-200 shadow-inner" />
                        </div>

                        <div className="col-span-7 space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Subtotal</span>
                                    <span className="text-xs font-black text-gray-900">ETB {subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center px-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <div onClick={() => setApplyVAT(!applyVAT)} className={`relative w-7 h-4 rounded-full transition-all ${applyVAT ? 'bg-green-500' : 'bg-gray-200'}`}>
                                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-all ${applyVAT ? 'translate-x-3' : ''}`}/>
                                        </div>
                                        <span className="text-[9px] font-black text-gray-400 uppercase">VAT (15%)</span>
                                    </label>
                                    <span className="text-xs font-bold text-gray-400">+{tax.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center px-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Discount</span>
                                    <input type="number" value={discountAmount} onChange={e=>setDiscountAmount(e.target.value)} className="w-20 bg-gray-50 p-1.5 rounded-lg font-black text-xs text-right outline-none" placeholder="0.00" />
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-5 bg-gray-50/50 rounded-2xl border border-gray-100">
                                 <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Total Payable</h3>
                                 <div className="text-right">
                                     <span className="text-3xl font-black text-green-500 tabular-nums">ETB {totalETB.toLocaleString()}</span>
                                     {currency === 'USD' && <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-0.5">≈ USD {totalDisp.toLocaleString()}</p>}
                                 </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- FLUID BOTTOM BAR --- */}
            <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-100 flex items-center justify-between gap-4 z-[100] shadow-2xl">
                 <div className="flex gap-2">
                    <button onClick={() => setShouldPrint(!shouldPrint)} className={`px-4 py-2 rounded-lg font-black text-[9px] uppercase flex items-center gap-2 transition-all ${shouldPrint ? 'bg-[#3498DB]/10 text-[#3498DB] border-[#3498DB]' : 'bg-gray-50 text-gray-400 border-transparent'} border`}>
                        <Printer size={16}/> {shouldPrint ? 'Print' : 'No Print'}
                    </button>
                    <div onClick={() => setSendWhatsApp(!sendWhatsApp)} className={`px-4 py-2 rounded-lg font-black text-[9px] uppercase flex items-center gap-2 transition-all cursor-pointer ${sendWhatsApp ? 'bg-green-50 text-green-600 border-green-500' : 'bg-gray-50 text-gray-400 border-transparent'} border`}>
                        <Smartphone size={16}/> WhatsApp
                    </div>
                 </div>

                 <div className="flex gap-3 flex-1 max-w-[600px]">
                     <button onClick={handleHoldSale} className="flex-1 py-3 border border-[#3498DB] text-[#3498DB] rounded-xl font-black text-[10px] uppercase hover:bg-blue-50 transition-all">
                         Save & Draft
                     </button>
                     <button disabled={isSubmitting||isScanning} onClick={handleFinalize} className="flex-[2] py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-black text-sm uppercase shadow-lg shadow-green-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-3">
                         {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18}/>} Submit Receipt
                     </button>
                 </div>
            </div>

            {/* DRAFT MODAL */}
            {isHeldModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"><div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative"><button onClick={()=>setIsHeldModalOpen(false)} className="absolute right-6 top-6 text-gray-300"><X size={20}/></button><h3 className="text-sm font-black mb-6 text-[#3498DB] uppercase tracking-widest">Active Drafts</h3><div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">{heldSales.map(h=>(<div key={h.id} className="p-4 bg-gray-50 rounded-2xl border flex justify-between items-center"><div className="flex-1"><p className="font-black text-sm text-gray-800">{h.invoiceNumber}</p><p className="text-[8px] text-gray-400 uppercase font-black">{new Date(h.timestamp).toLocaleString()}</p></div><div className="flex gap-2"><button onClick={()=>{setItems(h.items);setCustomerId(h.customerId);setHeldSales(heldSales.filter(x=>x.id!==h.id));setIsHeldModalOpen(false);}} className="px-4 py-2 bg-[#3498DB] text-white rounded-lg font-black text-[9px] uppercase">Restore</button></div></div>))}</div></div></div>
            )}
        </div>
    );
}
