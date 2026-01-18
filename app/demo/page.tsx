'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Play, CheckCircle, ArrowRight, X, Menu, Calendar, BarChart3, Users, Settings,
    Factory, ShoppingCart, Briefcase, ChevronRight, Clock, Star, Phone
} from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';

// --- Improved Navbar ---
const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="fixed w-full z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    <Link href="/" className="text-2xl font-extrabold tracking-tight flex items-center gap-1 text-darkGray dark:text-white">
                        Rev<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">lo</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/" className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">Home</Link>
                        <Link href="/#features" className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">Astaamaha</Link>
                        <Link href="/pricing" className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-primary transition-colors">Qiimaha</Link>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/signup" className="bg-primary hover:bg-blue-600 text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-lg shadow-blue-500/20">
                            Bilaaw Hadda
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-darkGray dark:text-white p-2">
                        {isOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 absolute w-full p-4 shadow-xl animate-fade-in-down">
                    <div className="flex flex-col space-y-4">
                        <Link href="/" className="font-bold text-darkGray dark:text-white py-2">Home</Link>
                        <Link href="/#features" className="font-bold text-darkGray dark:text-white py-2">Astaamaha</Link>
                        <Link href="/pricing" className="font-bold text-darkGray dark:text-white py-2">Qiimaha</Link>
                        <Link href="/signup" className="bg-primary text-white py-3 text-center rounded-xl font-bold">Bilaaw Hadda</Link>
                    </div>
                </div>
            )}
        </nav>
    );
};

// --- Interactive Walkthrough Component ---
const InteractiveWalkthrough = () => {
    const [activeTab, setActiveTab] = useState<'FACTORY' | 'SHOP' | 'PROJECT'>('FACTORY');

    const content = {
        FACTORY: {
            title: "Maamulka Warshadda",
            description: "La soco habsami u socodka wax-soo-saarkaaga min bilow ilaa dhammaad.",
            image: "/factory-preview.png",
            features: [
                { title: "Production Orders", desc: "Abuur amarrada wax-soo-saarka oo la soco heerka ay marayaan." },
                { title: "Inventory Tracking", desc: "Ogow agabka cayriin (Raw Materials) ee kuu haray." },
                { title: "Cost Analysis", desc: "Xisaabi kharashka ku baxaya halkii xabbo (Cost Per Unit)." }
            ],
            color: "blue"
        },
        SHOP: {
            title: "Maamulka Dukaanka (POS)",
            description: "Nidaam iib oo degdeg ah, looguna talagalay dukaamada iyo holsaylka.",
            image: "/shop-preview.png",
            features: [
                { title: "Quick Sales", desc: "Iibi alaabta adigoo isticmaalaya Barcode ama Search." },
                { title: "Stock Alerts", desc: "Hel digniin markii alaabtu ay sii dhammaanayso." },
                { title: "Invoice & Receipts", desc: "Daabac rasiidhyada macaamiisha isla markiiba." }
            ],
            color: "cyan"
        },
        PROJECT: {
            title: "Maamulka Mashaariicda",
            description: "Xakamee miisaaniyadda iyo horumarka mashaariicda dhismaha.",
            image: "/project-preview.png",
            features: [
                { title: "Budget vs Actual", desc: "Isbarbardhig kharashka qorsheysan iyo kan dhabta ah." },
                { title: "Labor Management", desc: "Diiwaangeli saacadaha shaqaalaha iyo mushaarka." },
                { title: "Material Usage", desc: "La soco agabka galaya mashruuc kasta." }
            ],
            color: "green"
        }
    };

    const activeData = content[activeTab];

    return (
        <section className="py-24 bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-darkGray dark:text-white mb-6">
                        Khibrad U Yeelo <span className="text-primary">Nidaamka</span>
                    </h2>
                    <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                        Dooro nooca ganacsigaaga si aad u aragto sida Revlo u xalliyo baahiyahaaga gaarka ah.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center flex-wrap gap-4 mb-12">
                    {[
                        { id: 'FACTORY', label: 'Warshad', icon: Factory },
                        { id: 'SHOP', label: 'Dukaan', icon: ShoppingCart },
                        { id: 'PROJECT', label: 'Mashruuc', icon: Briefcase }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'FACTORY' | 'SHOP' | 'PROJECT')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all duration-300 ${activeTab === tab.id
                                    ? 'bg-darkGray text-white shadow-lg scale-105 ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            <tab.icon size={18} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-8 lg:p-12 border border-gray-100 dark:border-gray-700 transition-all">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Text Side */}
                        <div className="order-2 lg:order-1 space-y-8">
                            <div>
                                <h3 className="text-3xl font-bold text-darkGray dark:text-white mb-4">
                                    {activeData.title}
                                </h3>
                                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {activeData.description}
                                </p>
                            </div>

                            <div className="space-y-6">
                                {activeData.features.map((feature, idx) => (
                                    <div key={idx} className="flex gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                        <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activeTab === 'FACTORY' ? 'bg-blue-100 text-blue-600' :
                                                activeTab === 'SHOP' ? 'bg-cyan-100 text-cyan-600' : 'bg-green-100 text-green-600'
                                            }`}>
                                            <CheckCircle size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-darkGray dark:text-white">{feature.title}</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{feature.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4">
                                <Link href="/signup" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
                                    Iska diiwaangeli qaybtan <ArrowRight size={18} />
                                </Link>
                            </div>
                        </div>

                        {/* Image Side */}
                        <div className="order-1 lg:order-2 relative">
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 aspect-[4/3] group">
                                <Image
                                    src={activeData.image}
                                    alt={activeData.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent opacity-60"></div>
                                <div className="absolute bottom-6 left-6 text-white">
                                    <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold mb-2">
                                        Live Preview
                                    </div>
                                    <p className="font-medium opacity-90">Revlo Dashboard Interface</p>
                                </div>
                            </div>
                            {/* Decorative Elements */}
                            <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl -z-10 ${activeTab === 'FACTORY' ? 'bg-blue-500/30' :
                                    activeTab === 'SHOP' ? 'bg-cyan-500/30' : 'bg-green-500/30'
                                }`}></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// --- Booking Form Component ---
const BookingForm = () => {
    return (
        <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                    <div className="grid md:grid-cols-2">
                        <div className="p-10 bg-darkGray text-white flex flex-col justify-between relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold mb-4">Ballan Sameyso</h3>
                                <p className="text-gray-300 mb-8">
                                    La hadal khabiirkayaga si aad u hesho demo toos ah oo ku saabsan ganacsigaaga.
                                </p>
                                <ul className="space-y-4 text-sm text-gray-300">
                                    <li className="flex items-center gap-3"><Clock size={16} className="text-primary" /> 15 Daqiiqo oo sharaxaad ah</li>
                                    <li className="flex items-center gap-3"><Star size={16} className="text-primary" /> Jawaabo gaar kuu ah</li>
                                    <li className="flex items-center gap-3"><Phone size={16} className="text-primary" /> Telefoon ama Google Meet</li>
                                </ul>
                            </div>
                            <div className="absolute bottom-0 right-0 p-12 bg-primary/20 blur-[60px] rounded-full"></div>
                        </div>

                        <div className="p-10">
                            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Magacaaga</label>
                                    <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Gali magacaaga" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Telefoonka</label>
                                    <input type="tel" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Ex: 061xxxxxxx" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Nooca Ganacsiga</label>
                                    <select className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all">
                                        <option>Warshad</option>
                                        <option>Dukaan/Holsayl</option>
                                        <option>Shirkad Dhisme</option>
                                        <option>Kale</option>
                                    </select>
                                </div>
                                <button className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all mt-4">
                                    Dir Codsiga
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// --- Main Page Component ---
export default function DemoPage() {
    return (
        <main className="min-h-screen bg-white dark:bg-gray-900 font-sans selection:bg-primary/30 selection:text-primary">
            <Navbar />

            {/* Hero Section */}
            <section className="pt-40 pb-20 text-center px-4 bg-gradient-to-b from-blue-50/50 to-white dark:from-gray-900 dark:to-gray-900">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-8">
                    <Play size={12} className="fill-current" /> Demo Center
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-darkGray dark:text-white mb-8 tracking-tight">
                    Arag Awoodda <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Revlo</span>
                </h1>
                <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-12">
                    Daawo sida ay Revlo kuugu fududayso maamulka ganacsigaaga.
                    Ka dooro hoos qaybta ku habboon ganacsigaaga.
                </p>

                {/* Video Placeholder */}
                <div className="max-w-5xl mx-auto relative group cursor-pointer">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-800 flex items-center justify-center">
                        <div className="absolute inset-0 bg-[url('/dashboard-preview.png')] bg-cover bg-center opacity-40"></div>
                        <div className="absolute inset-0 bg-black/50"></div>
                        <div className="relative z-10 w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <div className="w-20 h-20 bg-white text-primary rounded-full flex items-center justify-center shadow-lg">
                                <Play size={40} className="fill-current ml-2" />
                            </div>
                        </div>
                        <div className="absolute bottom-8 left-8 text-left">
                            <p className="text-white font-bold text-2xl">Overview Video</p>
                            <p className="text-gray-300">2 Daqiiqo • Soomaali</p>
                        </div>
                    </div>
                </div>
            </section>

            <InteractiveWalkthrough />
            <BookingForm />

            <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 py-12 text-center">
                <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} Revlo Inc. All rights reserved.</p>
            </footer>
        </main>
    );
}
