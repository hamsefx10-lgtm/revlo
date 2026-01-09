'use client';

import React, { useState } from 'react';
import {
    Search,
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    User,
    Smartphone,
    Banknote,
    ChevronDown
} from 'lucide-react';
import ProductCard from '@/components/shop/ui/ProductCard';

// --- DATA TYPES ---
interface Product {
    id: number;
    name: string;
    price: number;
    category: string;
    stock: number;
    image?: string;
    color?: string; // For placeholder visuals
}

interface CartItem extends Product {
    qty: number;
}

// --- DUMMY DATA ---
const CATEGORIES = ['All', 'Food', 'Beverages', 'Electronics', 'Household', 'Care'];

const PRODUCTS: Product[] = [
    { id: 1, name: 'Bariis 25kg', price: 1200, category: 'Food', stock: 45, color: 'bg-orange-100' },
    { id: 2, name: 'Saliid 5L', price: 850, category: 'Food', stock: 20, color: 'bg-yellow-100' },
    { id: 3, name: 'Baasto Macaroni', price: 40, category: 'Food', stock: 150, color: 'bg-red-100' },
    { id: 4, name: 'Coca Cola 500ml', price: 35, category: 'Beverages', stock: 200, color: 'bg-gray-800 text-white' },
    { id: 5, name: 'Water 1L', price: 20, category: 'Beverages', stock: 80, color: 'bg-blue-100' },
    { id: 6, name: 'Omo Detergent', price: 150, category: 'Household', stock: 30, color: 'bg-blue-200' },
    { id: 7, name: 'Samsung Charger', price: 300, category: 'Electronics', stock: 15, color: 'bg-gray-200' },
    { id: 8, name: 'Body Lotion', price: 450, category: 'Care', stock: 25, color: 'bg-pink-100' },
    { id: 9, name: 'Biscuit Cream', price: 15, category: 'Food', stock: 500, color: 'bg-yellow-50' },
];

const CategoryPill = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={`
      px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap
      ${active
                ? 'bg-[#3498DB] text-white shadow-lg shadow-blue-500/30 transform scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700'}
    `}
    >
        {label}
    </button>
);

const CartItemRow = ({ item, onInc, onDec, onRemove }: { item: CartItem, onInc: () => void, onDec: () => void, onRemove: () => void }) => (
    <div className="flex items-center justify-between p-3 mb-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 group">
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${item.color || 'bg-gray-200'}`}>
                {item.name.charAt(0)}
            </div>
            <div>
                <h5 className="font-bold text-sm text-gray-900 dark:text-white truncate w-24">{item.name}</h5>
                <p className="text-xs text-gray-500">ETB {item.price}</p>
            </div>
        </div>

        <div className="flex items-center gap-3">
            <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg p-1 border border-gray-200 dark:border-gray-600">
                <button onClick={onDec} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"><Minus size={14} /></button>
                <span className="w-8 text-center text-sm font-bold">{item.qty}</span>
                <button onClick={onInc} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-colors"><Plus size={14} /></button>
            </div>
            <div className="text-right w-16">
                <p className="font-bold text-sm text-gray-900 dark:text-white">{item.price * item.qty}</p>
            </div>
            <button onClick={onRemove} className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 size={16} />
            </button>
        </div>
    </div>
);

export default function POSPage() {
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState('Walk-in Customer');

    // Filter Products
    const filteredProducts = PRODUCTS.filter(p =>
        (activeCategory === 'All' || p.category === activeCategory) &&
        (p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Cart Logic
    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const updateQty = (id: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) return { ...item, qty: Math.max(1, item.qty + delta) };
            return item;
        }));
    };

    const removeFromCart = (id: number) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const clearCart = () => setCart([]);

    // Calculations
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const tax = subtotal * 0.15; // 15% VAT
    const total = subtotal + tax;

    return (
        // Adjusted height to fit within layout without main scrolling
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
                        {CATEGORIES.map(cat => (
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
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map(product => (
                            <ProductCard key={product.id} product={product} onClick={() => addToCart(product)} />
                        ))}
                    </div>
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
                        <button onClick={clearCart} className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-900/10 px-3 py-1.5 rounded-lg transition-colors">
                            Clear All
                        </button>
                    </div>

                    {/* Customer Selector */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 flex items-center justify-between cursor-pointer hover:border-[#3498DB] transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#3498DB]/10 flex items-center justify-center text-[#3498DB]">
                                <User size={16} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-bold uppercase group-hover:text-[#3498DB] transition-colors">Customer</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedCustomer}</p>
                            </div>
                        </div>
                        <ChevronDown size={16} className="text-gray-400" />
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
                                key={item.id}
                                item={item}
                                onInc={() => updateQty(item.id, 1)}
                                onDec={() => updateQty(item.id, -1)}
                                onRemove={() => removeFromCart(item.id)}
                            />
                        ))
                    )}
                </div>

                {/* Cart Summary & Payment */}
                <div className="p-6 bg-gray-50 dark:bg-[#111827] border-t border-gray-100 dark:border-gray-800">
                    <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Subtotal</span>
                            <span className="font-medium text-gray-900 dark:text-white">{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Tax (15%)</span>
                            <span className="font-medium text-gray-900 dark:text-white">{tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                            <span>Total Payable</span>
                            <span className="text-[#3498DB] text-xl">ETB {total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-[#3498DB] hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-white font-bold transition-all shadow-sm">
                            <Banknote size={18} className="text-green-500" /> Cash
                        </button>
                        <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-[#3498DB] hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-white font-bold transition-all shadow-sm">
                            <Smartphone size={18} className="text-purple-500" /> E-Dahab
                        </button>
                    </div>

                    <button className="w-full py-4 rounded-xl bg-gradient-to-r from-[#3498DB] to-[#2980B9] text-white font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 text-lg">
                        Checkout (ETB {total.toFixed(2)})
                    </button>
                </div>
            </div>
        </div>
    );
}
