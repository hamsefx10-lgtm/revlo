'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Truck,
    Save,
    Trash2,
    Search,
    Loader2,
    Box,
    Plus,
    Calendar,
    FileText,
    ChevronDown,
    CreditCard,
    Globe,
    ScanLine,
    UploadCloud,
    X,
    Info,
    PlusCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Vendor {
    id: string;
    companyName: string;
}

interface Product {
    id: string;
    name: string;
    sku: string;
    costPrice: number;
}

interface POItem {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    unitCost: number;
    specificTransport?: number; // New: Item-specific transport cost
    sellingPrice: number;
    total: number;
    isNew?: boolean;
    originalAiName?: string;
    prevCost?: number; // Added to track price changes
}

interface Employee {
    id: string;
    fullName: string;
    phone: string;
    role: string;
}

export default function AddPurchaseOrderPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    // Data Sources
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    // Form State
    const [selectedVendorId, setSelectedVendorId] = useState('');
    const [expectedDate, setExpectedDate] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<POItem[]>([]);
    const [currency, setCurrency] = useState('USD');
    const [exchangeRate, setExchangeRate] = useState<number>(1);

    // Landed Cost State
    const [shippingCost, setShippingCost] = useState<number>(0);
    const [customsTax, setCustomsTax] = useState<number>(0);
    const [localTransport, setLocalTransport] = useState<number>(0);
    const [otherDirectCosts, setOtherDirectCosts] = useState<number>(0);

    // WhatsApp Notification State
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
    const [sendWhatsApp, setSendWhatsApp] = useState(false);

    // AI Receipt Scanner State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Quick Add State (The Draft Row)
    const [searchProduct, setSearchProduct] = useState('');
    const [blurTimeout, setBlurTimeout] = useState<NodeJS.Timeout | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProductData, setNewProductData] = useState({
        name: '',
        category: 'General',
        sku: '',
        costPrice: '',
        sellingPrice: '',
        stock: '0',
        minStock: '5'
    });
    const [isCreatingProduct, setIsCreatingProduct] = useState(false);

    // Vendor Modal State
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [newVendorData, setNewVendorData] = useState({
        companyName: '',
        contactPerson: '',
        phone: ''
    });
    const [isCreatingVendor, setIsCreatingVendor] = useState(false);

    const handleCreateVendor = async () => {
        setIsCreatingVendor(true);
        try {
            const response = await fetch('/api/shop/vendors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyName: newVendorData.companyName,
                    contactPerson: newVendorData.contactPerson,
                    phone: newVendorData.phone
                })
            });

            if (!response.ok) throw new Error('Failed to create vendor');

            const data = await response.json();
            const newVendor = data.vendor || data;

            setVendors(prev => [...prev, { id: newVendor.id, companyName: newVendor.companyName }]);
            setSelectedVendorId(newVendor.id);
            toast.success('Vendor registered successfully');
            setIsVendorModalOpen(false);
            setNewVendorData({ companyName: '', contactPerson: '', phone: '' });

        } catch (error) {
            console.error('Error creating vendor:', error);
            toast.error('Failed to register vendor');
        } finally {
            setIsCreatingVendor(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [vRes, pRes] = await Promise.all([
                    fetch('/api/shop/vendors'),
                    fetch('/api/shop/inventory')
                ]);

                const vData = await vRes.json();
                const pData = await pRes.json();

                if (vData.vendors) setVendors(vData.vendors);
                if (pData.products) setProducts(pData.products);

                // Fetch Daily Exchange Rate
                const rateRes = await fetch('/api/settings/exchange-rate');
                const rateData = await rateRes.json();
                if (rateData.rate) {
                    setExchangeRate(rateData.rate.rate);
                }

            } catch (error) {
                console.error('Error loading data:', error);
                toast.error('Failed to load data');
            } finally {
                setPageLoading(false);
            }
        };
        fetchData();
    }, []);

    // -----------------------------------------------
    // AI RECEIPT SCANNER & FUZZY MATCHING
    // -----------------------------------------------
    const fuzzyMatchProduct = (aiName: string): Product | null => {
        const normalized = aiName.toLowerCase().trim();
        // 1. Exact match
        let match = products.find(p => p.name.toLowerCase() === normalized);
        if (match) return match;
        // 2. Contains match
        match = products.find(p => p.name.toLowerCase().includes(normalized) || normalized.includes(p.name.toLowerCase()));
        if (match) return match;
        // 3. SKU match
        match = products.find(p => p.sku.toLowerCase() === normalized);
        if (match) return match;
        return null;
    };

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
                const newItems: POItem[] = data.items.map((aiItem: any) => {
                    const matched = fuzzyMatchProduct(aiItem.name || '');
                    return {
                        productId: matched?.id || '',
                        productName: matched?.name || aiItem.name || '',
                        sku: matched?.sku || '',
                        quantity: parseInt(String(aiItem.qty)) || 1,
                        unitCost: matched?.costPrice || parseFloat(String(aiItem.price)) || 0,
                        sellingPrice: (matched as any)?.sellingPrice || 0,
                        total: (parseInt(String(aiItem.qty)) || 1) * (matched?.costPrice || parseFloat(String(aiItem.price)) || 0),
                        isNew: !matched,
                        originalAiName: aiItem.name
                    };
                });
                setItems(prev => [...prev.filter(item => item.productId !== ''), ...newItems]);
                toast.success(`Receipt scanned! ${newItems.filter(i => !i.isNew).length}/${newItems.length} items matched.`);
            }

            if (data.vendorName && !selectedVendorId) {
                const matchedVendor = vendors.find(v => v.companyName.toLowerCase().includes(data.vendorName.toLowerCase()));
                if (matchedVendor) setSelectedVendorId(matchedVendor.id);
            }
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

    // Paste image (Ctrl+V) support
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
    }, [products, vendors]);

    // Add item logic
    const addItem = (productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        // Check if exists, just increment qty
        const existingIndex = items.findIndex(i => i.productId === productId);
        if (existingIndex >= 0) {
            const newItems = [...items];
            newItems[existingIndex].quantity += 1;
            newItems[existingIndex].total = newItems[existingIndex].quantity * newItems[existingIndex].unitCost;
            setItems(newItems);
        } else {
            const newItem: POItem = {
                productId: product.id,
                productName: product.name,
                sku: product.sku,
                quantity: 1,
                unitCost: product.costPrice || 0,
                sellingPrice: (product as any).sellingPrice || 0,
                total: product.costPrice || 0
            };
            setItems([...items, newItem]);
        }
    };

    const updateItem = (index: number, field: keyof POItem, value: number) => {
        const newItems = [...items];
        const item = newItems[index];
        (item as any)[field] = value;
        item.total = item.quantity * item.unitCost;
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const subTotal = items.reduce((sum, item) => sum + item.total, 0);
    const totalAdditionalCosts = shippingCost + customsTax + localTransport + otherDirectCosts;
    const finalTotal = subTotal + totalAdditionalCosts;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedVendorId) {
            toast.error('Please select a vendor');
            return;
        }
        if (items.length === 0) {
            toast.error('Please add at least one item');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/shop/purchases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vendorId: selectedVendorId,
                    items,
                    notes,
                    expectedDelivery: expectedDate,
                    currency,
                    exchangeRate,
                    shippingCost,
                    customsTax,
                    localTransport,
                    otherDirectCosts,
                    // WhatsApp Notification
                    notifyEmployeeIds: sendWhatsApp ? selectedEmployeeIds : [],
                    sendWhatsApp,
                    // Payment info removed - will be handled separately
                    paidAmount: 0,
                    paymentMethod: null
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create purchase order');
            }

            toast.success('Purchase Order created successfully.');

            setTimeout(() => {
                router.push('/shop/purchases');
            }, 1000);

        } catch (error) {
            console.error('Submit error:', error);
            toast.error('Failed to submit order');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Quick Create Product
    const handleCreateProduct = async () => {
        setIsCreatingProduct(true);
        try {
            const response = await fetch('/api/shop/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newProductData.name,
                    sku: newProductData.sku || `SKU-${Date.now()}`,
                    category: newProductData.category,
                    costPrice: parseFloat(newProductData.costPrice) || 0,
                    sellingPrice: parseFloat(newProductData.sellingPrice) || 0,
                    stock: 0,
                    minStock: 5
                })
            });

            if (!response.ok) throw new Error('Failed to create product');

            const data = await response.json();
            const newProduct = data.product || data;

            const formattedProduct: Product = {
                id: newProduct.id,
                name: newProduct.name,
                sku: newProduct.sku,
                costPrice: newProduct.costPrice || 0
            };

            setProducts(prev => [...prev, formattedProduct]);

            // Add immediately
            const newItem: POItem = {
                productId: formattedProduct.id,
                productName: formattedProduct.name,
                sku: formattedProduct.sku,
                quantity: 1,
                unitCost: formattedProduct.costPrice,
                sellingPrice: parseFloat(newProductData.sellingPrice) || 0,
                total: formattedProduct.costPrice
            };
            setItems([...items, newItem]);

            toast.success(`${newProductData.name} created and added to order`);
            setIsCreateModalOpen(false);
            setSearchProduct('');

            setNewProductData({
                name: '',
                category: 'General',
                sku: '',
                costPrice: '',
                sellingPrice: '',
                stock: '0',
                minStock: '5'
            });

        } catch (error) {
            console.error(error);
            toast.error('Failed to create product');
        } finally {
            setIsCreatingProduct(false);
        }
    };

    // Filter products
    const filteredProducts = searchProduct
        ? products.filter(p =>
            p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchProduct.toLowerCase())
        ).slice(0, 20)
        : products.slice(0, 20);

    const toggleProductSelection = (id: string) => {
        setSelectedProductIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const addSelectedItems = () => {
        const itemsToAdd: POItem[] = [];
        selectedProductIds.forEach(id => {
            const product = products.find(p => p.id === id);
            if (product && !items.find(i => i.productId === id)) {
                itemsToAdd.push({
                    productId: product.id,
                    productName: product.name,
                    sku: product.sku,
                    quantity: 1,
                    unitCost: product.costPrice || 0,
                    prevCost: product.costPrice || 0,
                    specificTransport: 0,
                    sellingPrice: (product as any).sellingPrice || 0,
                    total: product.costPrice || 0
                });
            }
        });

        if (itemsToAdd.length > 0) {
            setItems(prev => [...prev.filter(item => item.productId !== ''), ...itemsToAdd]);
            toast.success(`${itemsToAdd.length} items added to order`);
        }
        setSelectedProductIds([]);
        setIsDropdownOpen(false);
        setSearchProduct('');
    };

    if (pageLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B1120]">
                <Loader2 className="animate-spin text-[#3498DB]" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] font-sans pb-32">

            {/* Header Section */}
            <div className="bg-white dark:bg-[#151C2C] border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30 shadow-sm/50 backdrop-blur-xl bg-white/80 dark:bg-[#151C2C]/90 supports-[backdrop-filter]:bg-white/50">
                <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/shop/purchases" className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all text-gray-500 hover:text-gray-900 dark:hover:text-white">
                            <ArrowLeft size={22} strokeWidth={2} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-none mb-1.5">New Purchase Order</h1>
                            <p className="text-sm text-gray-500 font-medium">Create order & manage items</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:block text-right">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Estimated Total (BIRR)</p>
                            <p className="text-2xl font-black text-[#2ECC71] tracking-tight">ETB {(currency === 'USD' ? finalTotal * exchangeRate : finalTotal).toLocaleString()}</p>
                            {currency === 'USD' && (
                                <p className="text-[10px] font-bold text-blue-500 mt-0.5">USD {finalTotal.toLocaleString()} (+ Costs)</p>
                            )}
                        </div>
                        <div className="flex bg-gray-100 dark:bg-[#0F1623] p-1 rounded-xl">
                            <button
                                onClick={() => {
                                    if (currency === 'USD') {
                                        setItems(items.map(item => ({
                                            ...item,
                                            unitCost: item.unitCost * exchangeRate,
                                            total: item.quantity * (item.unitCost * exchangeRate)
                                        })));
                                    }
                                    setCurrency('ETB');
                                }}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${currency === 'ETB' ? 'bg-white dark:bg-[#151C2C] text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                ETB
                            </button>
                            <button
                                onClick={() => {
                                    if (currency === 'ETB') {
                                        setItems(items.map(item => ({
                                            ...item,
                                            unitCost: item.unitCost / exchangeRate,
                                            total: item.quantity * (item.unitCost / exchangeRate)
                                        })));
                                    }
                                    setCurrency('USD');
                                }}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${currency === 'USD' ? 'bg-white dark:bg-[#151C2C] text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                USD
                            </button>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="px-6 py-3 bg-[#3498DB] hover:bg-[#2980B9] text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-95 transition-all flex items-center gap-2.5 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} strokeWidth={2.5} />}
                            <span className="hidden sm:inline">Create Order</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-6 mt-4">
                {/* ─── AI RECEIPT SCANNER BANNER (Compact Version) ─── */}
                <div
                    className={`rounded-[20px] border transition-all duration-300 ${isDragging
                        ? 'border-[#3498DB] bg-blue-50/50 dark:bg-blue-900/10'
                        : 'border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-[#151C2C]/50'
                        }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) processReceiptFile(file);
                    }}
                >
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-3.5">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#3498DB]/10 flex items-center justify-center text-[#3498DB] shadow-inner">
                                <ScanLine size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                                    Smart Receipt Scan
                                    <span className="px-1.5 py-0.5 rounded-full bg-[#3498DB] text-white text-[9px] uppercase font-black tracking-widest">AI v2.0</span>
                                </h3>
                                <p className="text-[12px] text-gray-500 font-medium">
                                    {isDragging ? '🎯 Drop it here!' : 'Upload or paste image to auto-fill.'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileInput}
                                disabled={isAnalyzing}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isAnalyzing}
                                className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-[#3498DB] text-gray-900 dark:text-white rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95 flex items-center gap-2 disabled:opacity-50"
                            >
                                {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                                {isAnalyzing ? 'Analyzing...' : 'Select File'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT COLUMN: Items Table */}
                <div className="lg:col-span-8">
                    <div className="bg-white dark:bg-[#151C2C] rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-800 min-h-[600px] flex flex-col">

                        {/* Table Header */}
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a2333]/50 flex justify-between items-center">
                            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Box size={20} className="text-[#3498DB]" />
                                Order Items
                            </h2>
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                                {items.length} Items
                            </span>
                        </div>

                        {/* Scrolling Table Area */}
                        <div className="flex-1 overflow-visible">
                            <table className="w-full">
                                <thead className="bg-[#F8FAFC] dark:bg-[#121826] border-b border-gray-100 dark:border-gray-800 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Product Info</th>
                                        <th className="px-6 py-4 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider w-24">Qty</th>
                                        <th className="px-6 py-4 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider w-32">Unit Cost ({currency})</th>
                                        <th className="px-6 py-4 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider w-24">Specific Tr.</th>
                                        <th className="px-6 py-4 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider w-32">True Landed</th>
                                        <th className="px-6 py-4 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider w-32">New Sell Price</th>
                                        <th className="px-6 py-4 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider w-32">Total</th>
                                        <th className="px-6 py-4 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                                    {items.map((item, index) => (
                                        <React.Fragment key={index}>
                                            <tr className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-gray-900 dark:text-white text-sm mb-0.5">{item.productName}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-gray-100 dark:bg-gray-800 text-gray-500">
                                                            {item.sku}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                                            className="w-full bg-white dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 rounded-xl py-2 px-2 text-center font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-[#3498DB] outline-none transition-all text-gray-900 dark:text-white text-sm shadow-sm"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.unitCost}
                                                            onChange={(e) => updateItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                                                            className="w-full bg-white dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 rounded-xl py-2 px-2 text-right font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-[#3498DB] outline-none transition-all text-gray-900 dark:text-white text-sm shadow-sm"
                                                        />
                                                        {currency === 'USD' && (
                                                            <div className="text-[9px] text-blue-500 font-bold mt-1 text-right">
                                                                ≈ {(item.unitCost * exchangeRate).toLocaleString()} B
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            placeholder="0"
                                                            value={item.specificTransport || ''}
                                                            onChange={(e) => updateItem(index, 'specificTransport', parseFloat(e.target.value) || 0)}
                                                            className="w-full bg-white dark:bg-[#0F1623] border border-gray-100 dark:border-gray-800 rounded-xl py-2 px-2 text-right font-medium focus:ring-2 focus:ring-blue-500/10 focus:border-[#3498DB] outline-none transition-all text-gray-600 dark:text-gray-400 text-[12px] shadow-sm"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right group/landed relative">
                                                    {(() => {
                                                        const baseUnitCostETB = currency === 'USD' ? item.unitCost * exchangeRate : item.unitCost;
                                                        const proportion = subTotal > 0 ? (item.quantity * item.unitCost) / subTotal : 0;
                                                        const landedAllocation = totalAdditionalCosts * proportion;
                                                        const sharedLandedPerUnit = item.quantity > 0 ? (landedAllocation / item.quantity) : 0;
                                                        const specificTransportPerUnit = item.specificTransport || 0;
                                                        const landedCostPerUnit = baseUnitCostETB + sharedLandedPerUnit + specificTransportPerUnit;

                                                        return (
                                                            <>
                                                                <div>
                                                                    <div className="text-sm font-black text-gray-900 dark:text-white flex items-center justify-end gap-1.5">
                                                                        {landedCostPerUnit.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                                                        <Info size={12} className="text-gray-300 dark:text-gray-600 cursor-help" />
                                                                    </div>
                                                                    <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">ETB / UNIT</div>
                                                                </div>
                                                                
                                                                {/* Math Tooltip */}
                                                                <div className="absolute right-0 bottom-full mb-2 w-48 bg-[#0F1623] text-white p-3 rounded-2xl shadow-2xl border border-gray-800 z-[110] opacity-0 group-hover/landed:opacity-100 pointer-events-none transition-all scale-95 group-hover/landed:scale-100">
                                                                    <p className="text-[10px] font-black uppercase text-gray-500 mb-2 border-b border-gray-800 pb-1.5 tracking-widest">Landed Breakdown</p>
                                                                    <div className="space-y-1.5">
                                                                        <div className="flex justify-between items-center text-[11px]">
                                                                            <span className="text-gray-400">Base Cost:</span>
                                                                            <span className="font-mono">{baseUnitCostETB.toFixed(1)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center text-[11px]">
                                                                            <span className="text-gray-400">Shared Share:</span>
                                                                            <span className="font-mono text-blue-400">+{sharedLandedPerUnit.toFixed(1)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center text-[11px]">
                                                                            <span className="text-gray-400">Specific Tr.:</span>
                                                                            <span className="font-mono text-orange-400">+{specificTransportPerUnit.toFixed(1)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-gray-800 mt-1.5 font-black">
                                                                            <span>Total ETB:</span>
                                                                            <span className="text-[#3498DB]">{landedCostPerUnit.toFixed(1)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.sellingPrice}
                                                            onChange={(e) => updateItem(index, 'sellingPrice', parseFloat(e.target.value) || 0)}
                                                            className="w-full bg-white dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 rounded-xl py-2 px-2 text-right font-bold focus:ring-2 focus:ring-green-500/20 focus:border-[#2ECC71] outline-none transition-all text-green-600 dark:text-green-400 text-sm shadow-sm"
                                                        />
                                                        <div className="text-[9px] text-gray-400 font-bold mt-1 text-right">ETB SET</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-black text-gray-900 dark:text-white text-sm">
                                                    <span className="text-gray-400 text-[10px] font-normal mr-1">{currency}</span>
                                                    {item.total.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => removeItem(index)}
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                            {/* AI Match Info Row (Optional) */}
                                            {item.isNew && (
                                                <tr className="bg-orange-50/30 dark:bg-orange-900/5">
                                                    <td colSpan={5} className="px-6 py-2">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                                                                <ScanLine size={12} />
                                                                SCANNED ITEM: "{item.productName}" — NO MATCH FOUND IN INVENTORY
                                                            </p>
                                                            <button
                                                                onClick={() => {
                                                                    setNewProductData(prev => ({ ...prev, name: item.productName, costPrice: String(item.unitCost) }));
                                                                    setIsCreateModalOpen(true);
                                                                }}
                                                                className="text-[10px] font-black text-white bg-orange-500 px-3 py-1 rounded-full hover:bg-orange-600 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
                                                            >
                                                                CREATE PRODUCT & LINK
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}

                                    {/* DRAFT ROW (Always Visible) */}
                                    <tr className="bg-blue-50/20 dark:bg-blue-900/5 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors">
                                        <td className="px-6 py-5 relative">
                                            <div className="relative">
                                                <Search className="absolute left-3.5 top-3.5 text-gray-400 pointer-events-none" size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="Type product name to add..."
                                                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-[#0F1623] border border-blue-200 dark:border-blue-800/50 focus:border-[#3498DB] focus:ring-4 focus:ring-blue-500/10 outline-none font-medium text-sm text-gray-900 dark:text-white shadow-sm transition-all placeholder:text-gray-400"
                                                    value={searchProduct}
                                                    onChange={(e) => setSearchProduct(e.target.value)}
                                                    onFocus={() => {
                                                        if (blurTimeout) clearTimeout(blurTimeout);
                                                        setIsDropdownOpen(true);
                                                    }}
                                                    onBlur={() => {
                                                        const tm = setTimeout(() => {
                                                            setIsDropdownOpen(false);
                                                            // Auto-trigger creation modal if no match found on exit
                                                            if (searchProduct.trim()) {
                                                                const exactMatch = products.find(p => p.name.toLowerCase() === searchProduct.toLowerCase());
                                                                if (!exactMatch) {
                                                                    setNewProductData(prev => ({ ...prev, name: searchProduct }));
                                                                    setIsCreateModalOpen(true);
                                                                }
                                                            }
                                                        }, 200);
                                                        setBlurTimeout(tm);
                                                    }}
                                                />
                                                {/* Autocomplete Dropdown */}
                                                {isDropdownOpen && (
                                                    <div 
                                                        className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-[#1a2333]/95 rounded-[20px] shadow-2xl shadow-gray-900/40 border border-gray-100 dark:border-gray-700 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200 max-h-[480px] flex flex-col translate-y-1 backdrop-blur-xl"
                                                        onMouseDown={(e) => e.preventDefault()} // Prevent blur when clicking inside
                                                    >
                                                        {selectedProductIds.length > 0 && (
                                                            <div className="p-3 border-b border-gray-50 dark:border-gray-800 bg-blue-50/40 dark:bg-blue-900/10 flex items-center justify-between">
                                                                <div className="flex items-center gap-1.5 pl-1">
                                                                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-[10px]">
                                                                        {selectedProductIds.length}
                                                                    </div>
                                                                    <span className="text-[10px] font-bold text-blue-900 dark:text-blue-300 uppercase tracking-widest pl-1">Selected</span>
                                                                </div>
                                                                <button 
                                                                    onClick={addSelectedItems}
                                                                    className="px-4 py-1.5 bg-gradient-to-r from-[#3498DB] to-[#2980B9] hover:from-[#2980B9] hover:to-[#2574A9] text-white text-[9px] font-black rounded-lg shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-1.5"
                                                                >
                                                                    <Plus size={12} /> ADD ITEMS
                                                                </button>
                                                            </div>
                                                        )}
                                                        <div className="p-1 overflow-y-auto custom-scrollbar">
                                                            {filteredProducts.length > 0 ? (
                                                                filteredProducts.map(p => (
                                                                    <div
                                                                        key={p.id}
                                                                        className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 rounded-xl group transition-colors cursor-pointer ${selectedProductIds.includes(p.id) ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                                                                        onClick={() => toggleProductSelection(p.id)}
                                                                    >
                                                                        <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-all ${selectedProductIds.includes(p.id) ? 'bg-[#3498DB] border-[#3498DB]' : 'border-gray-200 dark:border-gray-700'}`}>
                                                                            {selectedProductIds.includes(p.id) && <Plus size={12} className="text-white" />}
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <p className="font-bold text-gray-900 dark:text-white text-[13px] group-hover:text-[#3498DB] transition-colors line-clamp-1">{p.name}</p>
                                                                            <p className="text-[10px] text-gray-500 font-mono mt-0.5">{p.sku}</p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-[11px] font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md border border-gray-200 dark:border-gray-700">ETB {p.costPrice.toLocaleString()}</p>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="p-8 text-center">
                                                                    <p className="text-sm text-gray-400 font-medium italic">No products found.</p>
                                                                </div>
                                                            )}
                                                            
                                                            {/* CREATE NEW OPTION */}
                                                            {searchProduct && !products.find(p => p.name.toLowerCase() === searchProduct.toLowerCase()) && (
                                                                <button
                                                                    onClick={() => {
                                                                        setNewProductData(prev => ({ ...prev, name: searchProduct }));
                                                                        setIsCreateModalOpen(true);
                                                                        setIsDropdownOpen(false);
                                                                    }}
                                                                    className="w-full text-left px-4 py-4 mt-2 border-t border-dashed border-gray-100 dark:border-gray-800 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all flex items-center gap-3 group"
                                                                >
                                                                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                                                                        <Plus size={20} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-black text-gray-900 dark:text-white text-sm">Create "{searchProduct}"</p>
                                                                        <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest">Register as new product</p>
                                                                    </div>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 opacity-40">
                                            <div className="w-full h-11 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-xs font-medium text-gray-400">
                                                Qty
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 opacity-40">
                                            <div className="w-full h-11 bg-gray-100/50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-xs font-medium text-gray-400">
                                                Cost
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right opacity-30 font-bold text-gray-400">---</td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Settings NO PAYMENT */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Currency & Exchange Rate Card */}
                    {currency === 'USD' && (
                        <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-[24px] shadow-sm border border-blue-100 dark:border-blue-900/30 p-6">
                            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-400 mb-5 uppercase tracking-wide flex items-center gap-2.5 pb-4 border-b border-blue-200/30 dark:border-blue-800/30">
                                <Globe size={18} />
                                Exchange Settings
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[11px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-2 block">USD TO ETB RATE</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={exchangeRate}
                                            onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)}
                                            className="w-full pl-5 py-4 rounded-xl bg-white dark:bg-[#0F1623] border border-blue-200 dark:border-blue-800 outline-none font-black text-xl text-blue-600 dark:text-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all text-center"
                                        />
                                        <div className="absolute top-1/2 -translate-y-1/2 right-4 text-xs font-bold text-blue-400">BIRR</div>
                                    </div>
                                    <p className="text-[10px] text-blue-400/80 mt-2 italic flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                        Rate used for items cost conversion.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Additional Costs (Landed Cost) Card */}
                    <div className="bg-white dark:bg-[#151C2C] rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-5 uppercase tracking-wide flex items-center gap-2.5 pb-4 border-b border-gray-50 dark:border-gray-800">
                            <Box size={18} className="text-[#F39C12]" />
                            Landed Costs
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Shipping Cost ({currency})</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={shippingCost || ''}
                                    onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 outline-none font-medium text-gray-900 dark:text-white text-sm focus:border-[#3498DB] focus:ring-2 focus:ring-blue-500/20 transition-all text-right"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Customs & Tax ({currency})</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={customsTax || ''}
                                    onChange={(e) => setCustomsTax(parseFloat(e.target.value) || 0)}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 outline-none font-medium text-gray-900 dark:text-white text-sm focus:border-[#3498DB] focus:ring-2 focus:ring-blue-500/20 transition-all text-right"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Local Transport (ETB)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={localTransport || ''}
                                    onChange={(e) => setLocalTransport(parseFloat(e.target.value) || 0)}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 outline-none font-medium text-gray-900 dark:text-white text-sm focus:border-[#3498DB] focus:ring-2 focus:ring-blue-500/20 transition-all text-right"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Other Direct Costs (ETB)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={otherDirectCosts || ''}
                                    onChange={(e) => setOtherDirectCosts(parseFloat(e.target.value) || 0)}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 outline-none font-medium text-gray-900 dark:text-white text-sm focus:border-[#3498DB] focus:ring-2 focus:ring-blue-500/20 transition-all text-right"
                                    placeholder="0.00"
                                />
                            </div>

                            {/* Summary Box */}
                            <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-800">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-gray-500">Subtotal:</span>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{currency === 'USD' ? '$' : 'ETB'} {subTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-gray-500">Total Extra Costs:</span>
                                    <span className="text-sm font-bold text-[#F39C12]">{currency === 'USD' ? '$' : 'ETB'} {totalAdditionalCosts.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-gray-50 dark:border-gray-800">
                                    <span className="text-sm font-black text-gray-900 dark:text-white">Grand Total:</span>
                                    <span className="text-lg font-black text-[#2ECC71]">{currency === 'USD' ? '$' : 'ETB'} {finalTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Supplier Card */}
                    <div className="bg-white dark:bg-[#151C2C] rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-5 uppercase tracking-wide flex items-center gap-2.5 pb-4 border-b border-gray-50 dark:border-gray-800">
                            <Truck size={18} className="text-[#3498DB]" />
                            Supplier Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex justify-between items-center px-1">
                                    <span>Select Vendor *</span>
                                    <button
                                        onClick={() => setIsVendorModalOpen(true)}
                                        className="text-[#3498DB] hover:underline flex items-center gap-1 text-[10px]"
                                    >
                                        <Plus size={12} /> New
                                    </button>
                                </label>
                                <div className="relative">
                                    <select
                                        className="w-full pl-4 pr-10 py-3.5 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 outline-none font-medium text-gray-900 dark:text-white text-sm focus:border-[#3498DB] focus:ring-2 focus:ring-blue-500/20 appearance-none transition-all"
                                        value={selectedVendorId}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === 'NEW_VENDOR') {
                                                setIsVendorModalOpen(true);
                                            } else {
                                                setSelectedVendorId(val);
                                            }
                                        }}
                                    >
                                        <option value="">Choose Supplier...</option>
                                        {vendors.map(v => <option key={v.id} value={v.id}>{v.companyName}</option>)}
                                        <option value="NEW_VENDOR" className="font-bold text-blue-600">+ Add New Supplier...</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-4 text-gray-400 pointer-events-none" size={16} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Expected Delivery</label>
                                <div className="relative">
                                    <Calendar className="absolute left-4 top-3.5 text-gray-400 pointer-events-none" size={16} />
                                    <input
                                        type="date"
                                        className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 outline-none font-medium text-gray-900 dark:text-white text-sm focus:border-[#3498DB] focus:ring-2 focus:ring-blue-500/20 transition-all dark:[color-scheme:dark]"
                                        value={expectedDate}
                                        onChange={(e) => setExpectedDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Order Notes</label>
                                <div className="relative">
                                    <FileText className="absolute left-4 top-3.5 text-gray-400 pointer-events-none" size={16} />
                                    <textarea
                                        rows={3}
                                        className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 outline-none font-medium text-gray-900 dark:text-white text-sm focus:border-[#3498DB] focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                                        placeholder="Internal notes..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* WhatsApp Notification Card */}
                    <div className="bg-white dark:bg-[#151C2C] rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                        <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-50 dark:border-gray-800">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2.5">
                                <Globe size={18} className="text-[#25D366]" />
                                Notify Team
                            </h3>
                            <button 
                                onClick={() => setSendWhatsApp(!sendWhatsApp)}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${sendWhatsApp ? 'bg-[#25D366]' : 'bg-gray-200 dark:bg-gray-700'}`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${sendWhatsApp ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {sendWhatsApp && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <p className="text-[11px] text-gray-500 font-medium">Select employees to receive price updates via WhatsApp.</p>
                                <div className="max-h-[200px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                                    {employees.length > 0 ? (
                                        employees.map(emp => (
                                            <div 
                                                key={emp.id}
                                                onClick={() => {
                                                    setSelectedEmployeeIds(prev => 
                                                        prev.includes(emp.id) ? prev.filter(id => id !== emp.id) : [...prev, emp.id]
                                                    );
                                                }}
                                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                                    selectedEmployeeIds.includes(emp.id) 
                                                        ? 'bg-green-50/50 dark:bg-green-900/10 border-[#25D366]' 
                                                        : 'bg-gray-50/30 dark:bg-gray-800/20 border-gray-100 dark:border-gray-800 hover:border-gray-200'
                                                }`}
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                                    selectedEmployeeIds.includes(emp.id) ? 'bg-[#25D366] border-[#25D366]' : 'border-gray-300'
                                                }`}>
                                                    {selectedEmployeeIds.includes(emp.id) && <Plus size={12} className="text-white" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{emp.fullName}</p>
                                                    <p className="text-[10px] text-gray-500 font-mono">{emp.phone}</p>
                                                </div>
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 uppercase">{emp.role}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center border border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                                            <p className="text-[10px] text-gray-400">No employees with phone numbers found.</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 bg-blue-50/30 dark:bg-blue-900/10 rounded-xl border border-blue-100/50 dark:border-blue-900/10 flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100/50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 shrink-0">
                                        <Info size={14} />
                                    </div>
                                    <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                                        They will receive a summary of new product costs and price changes compared to previous records.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* PAYMENT INFO NOTE */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/30">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                <CreditCard size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">Payment Process</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                    Payment can be processed from the dashboard after creating the order. This allows you to select the funding account and verify details.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Quick Create Product Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0B1120]/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-[#151C2C] rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                        <div className="p-8 border-b border-gray-50 dark:border-gray-800 bg-gray-50/30 dark:bg-[#1a2333]/30 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white">New Product</h3>
                                <p className="text-sm text-gray-500 font-medium mt-1">Add details for "{newProductData.name}"</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400">
                                <ArrowLeft size={20} className="rotate-180" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Product Name</label>
                                <input
                                    type="text"
                                    value={newProductData.name}
                                    onChange={e => setNewProductData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-2 focus:ring-blue-500/10 outline-none font-bold text-gray-900 dark:text-white transition-all"
                                    placeholder="Product Name"
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Cost Price (Buy)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-4 text-gray-400 font-bold text-xs">{currency}</span>
                                        <input
                                            type="number"
                                            value={newProductData.costPrice}
                                            onChange={e => setNewProductData(prev => ({ ...prev, costPrice: e.target.value }))}
                                            className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-2 focus:ring-blue-500/10 outline-none font-bold text-gray-900 dark:text-white transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    {currency === 'USD' && (
                                        <p className="text-[10px] text-blue-500 mt-1.5 font-bold italic">≈ ETB {(parseFloat(newProductData.costPrice || '0') * exchangeRate).toLocaleString()}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Selling Price (Sell)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-4 text-gray-400 font-bold text-xs">ETB</span>
                                        <input
                                            type="number"
                                            value={newProductData.sellingPrice}
                                            onChange={e => setNewProductData(prev => ({ ...prev, sellingPrice: e.target.value }))}
                                            className="w-full pl-12 pr-4 py-4 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-2 focus:ring-blue-500/10 outline-none font-bold text-gray-900 dark:text-white transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1.5 font-medium italic">Selling price is always in ETB.</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Category</label>
                                <div className="relative">
                                    <select
                                        value={newProductData.category}
                                        onChange={e => setNewProductData(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-2 focus:ring-blue-500/10 outline-none font-medium text-gray-900 dark:text-white appearance-none transition-all"
                                    >
                                        {['General', 'Electronics', 'Food', 'Clothing', 'Materials', 'Furniture'].map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-5 top-5 text-gray-400 pointer-events-none" size={16} />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a2333]/50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateProduct}
                                disabled={isCreatingProduct || !newProductData.name || !newProductData.costPrice}
                                className="px-8 py-3 rounded-xl bg-[#3498DB] text-white font-bold hover:bg-[#2980B9] shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
                            >
                                {isCreatingProduct ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                                Create Product
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Create Vendor Modal */}
            {isVendorModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0B1120]/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-[#151C2C] rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                        <div className="p-8 border-b border-gray-50 dark:border-gray-800 bg-gray-50/30 dark:bg-[#1a2333]/30 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white">New Supplier</h3>
                                <p className="text-sm text-gray-500 font-medium mt-1">Register a new vendor</p>
                            </div>
                            <button onClick={() => setIsVendorModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400">
                                <ArrowLeft size={20} className="rotate-180" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Company Name</label>
                                <input
                                    type="text"
                                    value={newVendorData.companyName}
                                    onChange={e => setNewVendorData(prev => ({ ...prev, companyName: e.target.value }))}
                                    className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-2 focus:ring-blue-500/10 outline-none font-bold text-gray-900 dark:text-white transition-all"
                                    placeholder="e.g. Al-Nur Wholesalers"
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Contact Person</label>
                                    <input
                                        type="text"
                                        value={newVendorData.contactPerson}
                                        onChange={e => setNewVendorData(prev => ({ ...prev, contactPerson: e.target.value }))}
                                        className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-2 focus:ring-blue-500/10 outline-none font-medium text-gray-900 dark:text-white transition-all"
                                        placeholder="Name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Phone</label>
                                    <input
                                        type="tel"
                                        value={newVendorData.phone}
                                        onChange={e => setNewVendorData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-2 focus:ring-blue-500/10 outline-none font-medium text-gray-900 dark:text-white transition-all"
                                        placeholder="+251..."
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a2333]/50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsVendorModalOpen(false)}
                                className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateVendor}
                                disabled={isCreatingVendor || !newVendorData.companyName}
                                className="px-8 py-3 rounded-xl bg-[#3498DB] text-white font-bold hover:bg-[#2980B9] shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
                            >
                                {isCreatingVendor ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                                Add Vendor
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

