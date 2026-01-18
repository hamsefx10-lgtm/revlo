'use client';

import React, { useState, useEffect } from 'react';
import {
    Search,
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    User,
    Smartphone,
    Banknote,
    ChevronDown,
    Loader2,
    PackageX,
    PauseCircle,
    Clock,
    PlayCircle,
    AlertCircle
} from 'lucide-react';

import { toast } from 'sonner';

// --- DATA TYPES ---
interface Product {
    id: string;
    name: string;
    sellingPrice: number;
    category: string;
    stock: number;
    sku: string;
    status: string;
}

interface Account {
    id: string;
    name: string;
    type: string;
    balance: number;
}

interface Customer {
    id: string;
    name: string;
    phone: string;
}

interface CartItem {
    productId: string;
    name: string;
    price: number;
    qty: number;
    stock: number;
}

interface HeldCart {
    id: string;
    timestamp: number;
    items: CartItem[];
    customerId: string;
    customerName: string;
    total: number;
}

const CategoryPill = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`
      px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap
      ${active
                ? 'bg-[#3498DB] text-white shadow-lg shadow-blue-500/30 transform scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700'}`}
    >
        {label}
    </button>
);

const CartItemRow = ({ item, onInc, onDec, onRemove }: { item: CartItem, onInc: () => void, onDec: () => void, onRemove: () => void }) => (
    <div className="flex items-center justify-between p-3 mb-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 group">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                {item.name.charAt(0)}
            </div>
            <div>
                <h5 className="font-bold text-sm text-gray-900 dark:text-white truncate w-24">{item.name}</h5>
                <p className="text-xs text-gray-500">ETB {item.price.toFixed(2)}</p>
            </div>
        </div>

        <div className="flex items-center gap-3">
            <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg p-1 border border-gray-200 dark:border-gray-600">
                <button onClick={onDec} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"><Minus size={14} /></button>
                <span className="w-8 text-center text-sm font-bold">{item.qty}</span>
                <button onClick={onInc} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"><Plus size={14} /></button>
            </div>
            <div className="text-right w-16">
                <p className="font-bold text-sm text-gray-900 dark:text-white">{(item.price * item.qty).toFixed(2)}</p>
            </div>
            <button onClick={onRemove} className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 size={16} />
            </button>
        </div>
    </div>
);

const ProductCard = ({ product, onClick }: { product: Product, onClick: () => void }) => (
    <button
        onClick={onClick}
        disabled={product.stock === 0}
        className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-[#3498DB] hover:shadow-lg transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
    >
        <div className="w-full h-20 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 flex items-center justify-center mb-3">
            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{product.name.charAt(0)}</span>
        </div>
        <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-1 truncate">{product.name}</h3>
        <p className="text-xs text-gray-500 mb-2">{product.category}</p>
        <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-[#3498DB]">ETB {product.sellingPrice.toFixed(2)}</span>
            <span className={`text-xs px-2 py-1 rounded ${product.stock > 10 ? 'bg-green-100 text-green-700' : product.stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                {product.stock} left
            </span>
        </div>
    </button>
);

export default function POSPage() {
    // ... (existing states)
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [notes, setNotes] = useState('');

    // Payment Logic State
    const [paymentTab, setPaymentTab] = useState('Cash'); // 'Cash', 'Card', 'Credit'
    const [partialPaidAmount, setPartialPaidAmount] = useState('');

    // Held Carts State
    const [heldCarts, setHeldCarts] = useState<HeldCart[]>([]);
    const [isHeldCartsModalOpen, setIsHeldCartsModalOpen] = useState(false);

    // Load held carts from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('revlo_pos_held_carts');
        if (saved) {
            try {
                setHeldCarts(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse held carts", e);
            }
        }
    }, []);

    // Save held carts to local storage whenever they change
    useEffect(() => {
        localStorage.setItem('revlo_pos_held_carts', JSON.stringify(heldCarts));
    }, [heldCarts]);

    const handleHoldCart = () => {
        if (cart.length === 0) return;

        const customerName = customers.find(c => c.id === selectedCustomerId)?.name || 'Walk-in Customer';
        const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

        const newHeldCart: HeldCart = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            items: cart,
            customerId: selectedCustomerId,
            customerName,
            total
        };

        setHeldCarts(prev => [newHeldCart, ...prev]);
        setCart([]);
        setSelectedCustomerId('');
        toast.success("Order put on hold");
    };

    const handleRestoreCart = (heldCart: HeldCart) => {
        if (cart.length > 0) {
            if (!confirm("Current cart will be cleared. Continue?")) return;
        }

        setCart(heldCart.items);
        setSelectedCustomerId(heldCart.customerId || '');
        setHeldCarts(prev => prev.filter(c => c.id !== heldCart.id));
        setIsHeldCartsModalOpen(false);
        toast.success("Order restored");
    };

    const handleDeleteHeldCart = (id: string) => {
        setHeldCarts(prev => prev.filter(c => c.id !== id));
    };

    // Live data states
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>(['All']);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState(false);

    // Customer Modal State
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '' });
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

    const handleCreateCustomer = async () => {
        setIsCreatingCustomer(true);
        try {
            const response = await fetch('/api/shop/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newCustomerData.name,
                    phone: newCustomerData.phone
                })
            });

            if (!response.ok) throw new Error('Failed to create customer');

            const data = await response.json();
            const newCustomer = data.customer || data;

            setCustomers(prev => [...prev, newCustomer]);
            setSelectedCustomerId(newCustomer.id);
            toast.success('Customer registered successfully');
            setIsCustomerModalOpen(false);
            setNewCustomerData({ name: '', phone: '' });
        } catch (error) {
            console.error('Error creating customer:', error);
            toast.error('Failed to register customer');
        } finally {
            setIsCreatingCustomer(false);
        }
    };

    // --- BARCODE SCANNING LOGIC ---
    const lastKeyTime = React.useRef<number>(0);
    const barcodeBuffer = React.useRef<string>('');

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            // Ignore if user is manually typing in an input field (search query, notes, etc.)
            // Exception: We could allow scanning into search, but for "Quick Add to Cart", generally we listen globally.
            const isTypingInInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';

            const currentTime = Date.now();
            const gap = currentTime - lastKeyTime.current;
            lastKeyTime.current = currentTime;

            // Scanner Logic: Detect bursts of fast input (< 60ms)
            if (gap > 60) {
                // Too slow, likely manual typing. Reset buffer.
                if (barcodeBuffer.current.length > 0) {
                    barcodeBuffer.current = '';
                }
            }

            if (e.key === 'Enter') {
                // If we have a valid buffer from a scan
                if (barcodeBuffer.current.length > 2) {
                    e.preventDefault();
                    e.stopPropagation();

                    if (isTypingInInput) {
                        // If they were typing in a field, we generally ignore or let the field handle it.
                        // But if it was a FAST scan, we *could* hijack it. 
                        // For safety in POS: if focused on search, let search handle it (or clear buffer).
                        console.log("Ignored scan while focused on input");
                        barcodeBuffer.current = '';
                        return;
                    }

                    const code = barcodeBuffer.current;
                    handleScan(code);
                    barcodeBuffer.current = '';
                    return false;
                }
                barcodeBuffer.current = '';
            } else if (e.key.length === 1) {
                barcodeBuffer.current += e.key;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [products]); // Products dependency needed for handleScan lookup inside effect closure? 
    // Actually handleScan uses 'products' which changes.
    // Better pattern: Use a ref for products or just keep products in dependency.
    // Since handleCreate uses current state, we need to ensure handleScan has access to latest products.
    // The previous code had [barcodeBuffer, products], re-binding on every key press is bad.
    // We'll move handleScan inside or use a ref for products to avoid re-binding listener constantly.

    // Better: Helper to find product without stale closure
    const findProduct = (code: string) => {
        return products.find(p => p.sku === code || p.id === code);
    };
    // But 'products' is state. We have to be careful.
    // Let's use a ref for products to read inside the listener without re-binding.
    const productsRef = React.useRef(products);
    useEffect(() => { productsRef.current = products; }, [products]);

    useEffect(() => {
        const handleKeyDownWrapper = (e: KeyboardEvent) => {
            // ... duplicate logic from above ...
            // Copied here to ensure correct scope if we want to be fully self-contained
            // But let's just use the outer one with the productsRef to be clean.
        }
    }, [])

    // RETHINKING: Let's stick to the cleaner implementation:
    // We will use the 'products' from the outer scope, but we must ignore the lint warning or accept that
    // re-binding on products change (which is rare, only on mount/fetch) is fine.

    // --- UPDATED LOGIC START ---     
    const handleScan = (code: string) => {
        // We use productsRef to ensure we always have latest list without re-binding listener on every render
        const product = productsRef.current.find(p => p.sku === code || p.id === code);

        if (product) {
            addToCart(product); // addToCart is stable or will be called from latest closure? 
            // addToCart updates state, so it's a function.
            // calling it from here might be an issue if it depends on stale state.
            // SAFEST: Pass the product to a function that uses setQueue or setState functional updates.
            // addToCart implementation: setOrderItems(prev => ...) -> This is safe!
            toast.success(`Scanned: ${product.name}`);
        } else {
            toast.error(`Product not found: ${code}`);
        }
    };
    // ------------------------------
    // ------------------------------

    // Company Settings
    const [companySettings, setCompanySettings] = useState<any>(null);

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catRes, accRes, custRes, compRes] = await Promise.all([
                    fetch('/api/shop/categories'),
                    fetch('/api/shop/accounts'),
                    fetch('/api/shop/customers'),
                    fetch('/api/shop/company')
                ]);

                if (catRes.ok) setCategories(await catRes.json());
                if (accRes.ok) {
                    const accData = await accRes.json();
                    setAccounts(accData.accounts || []);
                    // Default to first account if available
                    if (accData.accounts?.length > 0) setSelectedAccountId(accData.accounts[0].id);
                }
                if (custRes.ok) {
                    const custData = await custRes.json();
                    setCustomers(custData.customers || []);
                }
                if (compRes.ok) {
                    const compData = await compRes.json();
                    setCompanySettings(compData.company);
                }
            } catch (e) {
                console.error("Error fetching POS data", e);
            }
        };
        fetchData();
    }, []);

    // Fetch products
    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (activeCategory !== 'All') params.append('category', activeCategory);
        if (searchQuery) params.append('search', searchQuery);

        fetch(`/api/shop/products?${params}`)
            .then(res => res.json())
            .then(data => {
                setProducts(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching products:', err);
                setLoading(false);
            });
    }, [activeCategory, searchQuery]);

    // Print Receipt
    const printReceipt = (sale: any, items: CartItem[], customerName: string) => {
        const printWindow = window.open('', '', 'width=300,height=600');
        if (!printWindow) return;

        const taxRate = companySettings?.taxRate || 0;
        const taxAmount = (sale.subtotal * (taxRate / 100)).toFixed(2);

        const html = `
            <html>
                <head>
                    <title>Receipt</title>
                    <style>
                        body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 10px; width: 300px; }
                        .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
                        .footer { text-align: center; margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; font-size: 10px; }
                        .item { display: flex; justify-content: space-between; margin-bottom: 3px; }
                        .totals { border-top: 1px dashed #000; margin-top: 5px; padding-top: 5px; }
                        .row { display: flex; justify-content: space-between; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h3 style="margin:0">${companySettings?.name || 'My Shop'}</h3>
                        <p style="margin:2px 0">${companySettings?.address || ''}</p>
                        <p style="margin:2px 0">${companySettings?.phone || ''}</p>
                        ${companySettings?.taxId ? `<p style="margin:2px 0">TIN: ${companySettings.taxId}</p>` : ''}
                        <p style="margin-top:5px; font-weight:bold">${companySettings?.receiptHeader || ''}</p>
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                        <div>Date: ${new Date().toLocaleString()}</div>
                        <div>Invoice: ${sale.invoiceNumber}</div>
                        <div>Customer: ${customerName}</div>
                    </div>

                    <div class="items">
                        ${items.map(item => `
                            <div class="item">
                                <span>${item.qty}x ${item.name}</span>
                                <span>${(item.price * item.qty).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>

                    <div class="totals">
                        <div class="row">
                            <span>Subtotal:</span>
                            <span>${sale.subtotal.toFixed(2)}</span>
                        </div>
                        <div class="row">
                            <span>Tax (${taxRate}%):</span>
                            <span>${taxAmount}</span>
                        </div>
                        <div class="row" style="font-size: 14px; margin-top: 5px;">
                            <span>TOTAL:</span>
                            <span>${sale.total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div class="footer">
                        <p>${companySettings?.receiptFooter || 'Thank you!'}</p>
                    </div>
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    // Cart Logic
    const addToCart = (product: Product) => {
        if (product.stock === 0) {
            toast.error('Product out of stock');
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id);
            if (existing) {
                if (existing.qty >= product.stock) {
                    toast.error('Not enough stock');
                    return prev;
                }
                return prev.map(item => item.productId === product.id ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { productId: product.id, name: product.name, price: product.sellingPrice, qty: 1, stock: product.stock }];
        });
        toast.success(`${product.name} added to cart`);
    };

    const updateQty = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.productId === productId) {
                const newQty = Math.max(1, Math.min(item.stock, item.qty + delta));
                if (newQty === item.stock && delta > 0) {
                    toast.error('Not enough stock');
                }
                return { ...item, qty: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
    };

    const clearCart = () => setCart([]);

    // Checkout
    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error('Cart is empty');
            return;
        }

        setCheckoutLoading(true);
        try {
            const response = await fetch('/api/shop/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: selectedCustomerId || null,
                    items: cart.map(item => ({ productId: item.productId, quantity: item.qty })),
                    accountId: paymentTab === 'Credit' ? null : selectedAccountId, // Accounts receivable logic handles credit
                    paymentMethod: paymentTab,
                    notes: notes || null,
                    // New fields for credit/partial
                    paidAmount: paymentTab === 'Credit' ? parseFloat(partialPaidAmount || '0') : undefined,
                    paymentStatus: paymentTab === 'Credit' ? (parseFloat(partialPaidAmount || '0') > 0 ? 'Partial' : 'Unpaid') : 'Paid'
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Checkout failed');
            }

            toast.success(`Sale completed! Invoice: ${data.sale.invoiceNumber}`);

            // PRINT RECEIPT
            const customerName = customers.find(c => c.id === selectedCustomerId)?.name || 'Walk-in Customer';
            printReceipt(data.sale, cart, customerName);

            clearCart();
            // Refresh products to update stock
            const params = new URLSearchParams();
            if (activeCategory !== 'All') params.append('category', activeCategory);
            if (searchQuery) params.append('search', searchQuery);
            const productsRes = await fetch(`/api/shop/products?${params}`);
            const productsData = await productsRes.json();
            setProducts(productsData);
        } catch (error: any) {
            toast.error(error.message || 'Checkout failed');
        } finally {
            setCheckoutLoading(false);
        }
    };

    // Calculations
    const taxRate = companySettings?.taxRate || 0;
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-4 font-sans overflow-hidden">
            {/* --- LEFT SIDE: PRODUCTS AREA --- */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
                {/* Headers & Filters */}
                <div className="p-6 pb-2">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Revlo<span className="text-[#3498DB]">POS</span></h1>
                            <p className="text-sm text-gray-500">Choose items to add to cart</p>
                        </div>
                        <div className="relative group w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#3498DB] transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-[#3498DB]/20 focus:border-[#3498DB] transition duration-200 sm:text-sm shadow-sm"
                                placeholder="Search products..."
                            />
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="flex gap-2 mb-2 overflow-x-auto pb-2 scrollbar-hide">
                        {categories.map(cat => (
                            <CategoryPill
                                key={cat}
                                label={cat}
                                active={activeCategory === cat}
                                onClick={() => setActiveCategory(cat)}
                            />
                        ))}
                    </div>
                </div>

                {/* Products Grid */}
                <div className="flex-1 overflow-y-auto p-6 pt-0 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 animate-spin text-[#3498DB]" />
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                            <PackageX size={64} className="text-gray-300 mb-4" />
                            <p className="text-gray-500 font-medium">No products found</p>
                            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or add products to inventory</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {products.map(product => (
                                <ProductCard key={product.id} product={product} onClick={() => addToCart(product)} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* --- RIGHT SIDE: CART & CHECKOUT --- */}
            <div className="w-full md:w-[400px] flex flex-col bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden relative ring-1 ring-black/5 dark:ring-white/5">
                {/* Cart Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                            <ShoppingCart className="text-[#3498DB]" size={20} /> Current Order
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleHoldCart}
                                disabled={cart.length === 0}
                                title="Hold Cart"
                                className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors disabled:opacity-50"
                            >
                                <PauseCircle size={18} />
                            </button>
                            <button
                                onClick={() => setIsHeldCartsModalOpen(true)}
                                title="View Held Carts"
                                className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors relative"
                            >
                                <Clock size={18} />
                                {heldCarts.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                                        {heldCarts.length}
                                    </span>
                                )}
                            </button>
                            <button onClick={clearCart} className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors" title="Clear Cart">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Customer Selector */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 flex flex-col gap-2 mb-4">
                        <label className="text-xs font-bold text-gray-500 uppercase flex justify-between items-center">
                            Customer
                            <button
                                onClick={() => setIsCustomerModalOpen(true)}
                                className="text-[#3498DB] hover:text-[#2980B9] text-[10px] flex items-center gap-1"
                            >
                                <Plus size={10} /> New
                            </button>
                        </label>
                        <div className="relative">
                            <select
                                value={selectedCustomerId}
                                onChange={(e) => setSelectedCustomerId(e.target.value)}
                                className="w-full p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 font-bold text-sm outline-none appearance-none cursor-pointer"
                            >
                                <option value="">Walk-in Customer</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                            <ShoppingCart size={48} className="text-gray-300 mb-4" />
                            <p className="text-gray-500 font-medium">Cart is empty</p>
                            <p className="text-xs text-gray-400 mt-1">Select items from the left to start selling</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <CartItemRow
                                key={item.productId}
                                item={item}
                                onInc={() => updateQty(item.productId, 1)}
                                onDec={() => updateQty(item.productId, -1)}
                                onRemove={() => removeFromCart(item.productId)}
                            />
                        ))
                    )}
                </div>

                {/* Cart Summary & Payment */}
                <div className="p-6 bg-gray-50 dark:bg-[#111827] border-t border-gray-100 dark:border-gray-800">
                    <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Subtotal</span>
                            <span className="font-medium text-gray-900 dark:text-white">ETB {subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Tax (15%)</span>
                            <span className="font-medium text-gray-900 dark:text-white">ETB {tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                            <span>Total Payable</span>
                            <span className="text-[#3498DB] text-xl">ETB {total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* PAYMENT METHOD TABS */}
                    <div className="mb-4">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Payment Method</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['Cash', 'Card', 'Credit'].map((method) => {
                                const isSelected = paymentTab === method;
                                return (
                                    <button
                                        key={method}
                                        onClick={() => setPaymentTab(method)}
                                        className={`py-2 rounded-lg text-xs font-bold border transition-all ${isSelected
                                                ? 'bg-[#3498DB] text-white border-[#3498DB] shadow-md shadow-blue-500/20'
                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                                            }`}
                                    >
                                        {method === 'Credit' ? 'Credit/Debt' : method}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* DYNAMIC FIELDS BASED ON PAYMENT TYPE */}
                    {paymentTab === 'Credit' ? (
                        <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20 mb-4 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-red-800 dark:text-red-400 uppercase">Paid Now (Optional)</label>
                                <span className="text-[10px] text-red-500 font-bold">Remaining balance will be Debt</span>
                            </div>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-400">ETB</span>
                                <input
                                    type="number"
                                    value={partialPaidAmount}
                                    onChange={(e) => setPartialPaidAmount(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-gray-900 focus:border-red-500 outline-none text-sm font-bold text-gray-800 dark:text-gray-200"
                                    placeholder="0.00"
                                />
                            </div>
                            {!selectedCustomerId && (
                                <p className="text-[10px] text-red-600 mt-2 font-bold flex items-center gap-1 animate-pulse">
                                    <AlertCircle size={12} /> Specific Customer is required for credit sales
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3 mb-4">
                            <label className="text-xs font-bold text-gray-500 uppercase">Deposit To (Revenue Account)</label>
                            <div className="grid grid-cols-2 gap-3 max-h-32 overflow-y-auto custom-scrollbar">
                                {accounts.map(acc => (
                                    <button
                                        key={acc.id}
                                        onClick={() => setSelectedAccountId(acc.id)}
                                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all shadow-sm ${selectedAccountId === acc.id ? 'bg-[#3498DB] text-white border-[#3498DB]' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-[#3498DB] text-gray-700 dark:text-white'}`}
                                    >
                                        <span className="font-bold text-xs">{acc.name}</span>
                                        <span className="text-[9px] opacity-80">{acc.type}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="text-xs font-bold text-gray-500 uppercase">Notes</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Optional notes..."
                            className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 text-sm outline-none resize-none"
                            rows={1}
                        />
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || checkoutLoading || (paymentTab === 'Credit' && !selectedCustomerId)}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-[#3498DB] to-[#2980B9] text-white font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {checkoutLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm">Processing...</span>
                            </>
                        ) : (
                            `Checkout (ETB ${total.toFixed(2)})`
                        )}
                    </button>
                </div>
            </div>

            {/* QUICK CREATE MODALS */}
            {isHeldCartsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0B1120]/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-[#151C2C] rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
                        <div className="p-6 border-b border-gray-50 dark:border-gray-800 bg-gray-50/30 dark:bg-[#1a2333]/30 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white">Held Orders</h3>
                                <p className="text-sm text-gray-500 font-medium mt-1">Orders put on hold to be completed later</p>
                            </div>
                            <button onClick={() => setIsHeldCartsModalOpen(false)} className="px-4 py-2 rounded-xl text-gray-500 hover:bg-white dark:hover:bg-gray-800 font-bold text-sm transition-all">
                                Close
                            </button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {heldCarts.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <Clock size={48} className="mx-auto mb-4 opacity-50" />
                                    <p className="font-bold">No held orders</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {heldCarts.map(cart => (
                                        <div key={cart.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-[#0F1623] border border-gray-100 dark:border-gray-800 flex justify-between items-center group">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-gray-900 dark:text-white">{cart.customerName}</span>
                                                    <span className="text-xs px-2 py-0.5 rounded-md bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                                                        {new Date(cart.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500">{cart.items.length} items • Total: <span className="text-[#3498DB] font-bold">ETB {cart.total.toFixed(2)}</span></p>
                                                <p className="text-xs text-gray-400 mt-1 truncate w-64">
                                                    {cart.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleRestoreCart(cart)}
                                                    className="px-4 py-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/50 font-bold text-xs flex items-center gap-1 transition-colors"
                                                >
                                                    <PlayCircle size={14} /> Resume
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteHeldCart(cart.id)}
                                                    className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Create Customer Modal */}
            {isCustomerModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0B1120]/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-[#151C2C] rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                        <div className="p-8 border-b border-gray-50 dark:border-gray-800 bg-gray-50/30 dark:bg-[#1a2333]/30 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white">New Customer</h3>
                                <p className="text-sm text-gray-500 font-medium mt-1">Register a new customer</p>
                            </div>
                            <button onClick={() => setIsCustomerModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400">
                                <Plus size={20} className="rotate-45" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={newCustomerData.name}
                                    onChange={e => setNewCustomerData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-2 focus:ring-blue-500/10 outline-none font-bold text-gray-900 dark:text-white transition-all"
                                    placeholder="Customer Name"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    value={newCustomerData.phone}
                                    onChange={e => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full px-5 py-4 rounded-xl bg-gray-50 dark:bg-[#0F1623] border border-gray-200 dark:border-gray-700 focus:border-[#3498DB] focus:ring-2 focus:ring-blue-500/10 outline-none font-medium text-gray-900 dark:text-white transition-all"
                                    placeholder="+251..."
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a2333]/50 flex justify-end gap-3">
                            <button
                                onClick={() => setIsCustomerModalOpen(false)}
                                className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateCustomer}
                                disabled={isCreatingCustomer || !newCustomerData.name}
                                className="px-8 py-3 rounded-xl bg-[#3498DB] text-white font-bold hover:bg-[#2980B9] shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
                            >
                                {isCreatingCustomer ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                                Add Customer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
