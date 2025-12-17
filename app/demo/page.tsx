'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Play, CheckCircle, ArrowRight, X, Menu, Calendar, BarChart3, Users, Settings } from 'lucide-react';

// --- Navbar Component (Simplified for Demo Page) ---
const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="fixed w-full z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    <Link href="/" className="text-2xl font-extrabold tracking-tight flex items-center gap-1 text-darkGray dark:text-white">
                        Rev<span className="text-secondary">lo</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/" className="text-sm font-bold text-mediumGray hover:text-primary transition-colors">Home</Link>
                        <Link href="/#features" className="text-sm font-bold text-mediumGray hover:text-primary transition-colors">Astaamaha</Link>
                        <Link href="/#pricing" className="text-sm font-bold text-mediumGray hover:text-primary transition-colors">Qiimaha</Link>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/signup" className="bg-primary text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-600 transition-colors">
                            Bilaaw Hadda
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-darkGray dark:text-white">
                        {isOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 absolute w-full p-4 shadow-xl">
                    <div className="flex flex-col space-y-4">
                        <Link href="/" className="font-bold text-darkGray">Home</Link>
                        <Link href="/signup" className="bg-primary text-white py-2 text-center rounded-lg font-bold">Bilaaw Hadda</Link>
                    </div>
                </div>
            )}
        </nav>
    );
};

// --- Demo Video Section ---
const DemoHero = () => {
    return (
        <section className="pt-32 pb-16 bg-gradient-to-b from-blue-50/50 to-white dark:from-gray-900 dark:to-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
                    <Play size={14} className="fill-current" /> Daawo Demo
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold text-darkGray dark:text-white mb-6">
                    Arag Sida Uu U <span className="text-primary">Shaqeeyo</span>
                </h1>
                <p className="max-w-2xl mx-auto text-xl text-mediumGray dark:text-gray-400 mb-10 leading-relaxed">
                    Daawo muuqaalkan gaaban si aad u fahanto sida Revlo u bedeli karo ganacsigaaga. Fudud, Degdeg ah, oo Casri ah.
                </p>

                {/* Video Player Placeholder */}
                <div className="relative max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 aspect-video group cursor-pointer bg-darkGray">
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <div className="w-16 h-16 bg-white text-primary rounded-full flex items-center justify-center shadow-lg">
                                <Play size={32} className="fill-current ml-1" />
                            </div>
                        </div>
                    </div>
                    {/* Faux Interface Background */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 to-gray-800 opacity-90"></div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                        <div className="text-white text-9xl font-black tracking-tighter">REVLO</div>
                    </div>

                    {/* Overlay Text */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-left">
                        <h3 className="text-white text-lg font-bold">Revlo Platform Walkthrough</h3>
                        <p className="text-gray-300 text-sm">2:30 • Full Overview</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

// --- Key Features Highlight in Demo ---
const DemoFeatures = () => {
    const features = [
        {
            icon: <BarChart3 className="text-blue-500" />,
            title: "Dashboard-ka",
            desc: "Arag guudmaridda ganacsigaaga hal meel."
        },
        {
            icon: <Users className="text-green-500" />,
            title: "Maamulka Shaqaalaha",
            desc: "Sida loo diiwaangaliyo oo loo maamulo kooxdaada."
        },
        {
            icon: <Calendar className="text-purple-500" />,
            title: "Jadwalka & Hawlaha",
            desc: "Qorsheynta mashaariicda iyo la socodka waqtiga."
        },
        {
            icon: <Settings className="text-orange-500" />,
            title: "Habeynta Nidaamka",
            desc: "Sida loogu habeeyo nidaamka baahidaada gaarka ah."
        }
    ];

    return (
        <section className="py-20 bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:shadow-lg transition-shadow">
                            <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center mb-4">
                                {React.cloneElement(item.icon, { size: 24 })}
                            </div>
                            <h3 className="font-bold text-lg text-darkGray dark:text-white mb-2">{item.title}</h3>
                            <p className="text-sm text-mediumGray dark:text-gray-400">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// --- CTA Section ---
const CTA = () => {
    return (
        <section className="py-24 bg-darkGray text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-20 bg-primary/20 blur-[100px] rounded-full"></div>
            <div className="absolute bottom-0 left-0 p-20 bg-secondary/20 blur-[100px] rounded-full"></div>

            <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                <h2 className="text-4xl font-bold mb-6">Diyaar ma u tahay inaad bilaabato?</h2>
                <p className="text-xl text-gray-300 mb-10">
                    Ku biir boqolaal ganacsi oo Revlo u isticmaala inay ku hormariyaan shaqadooda.
                    Waxaad helaysaa 14-maalmood oo tijaabo bilaash ah.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/signup" className="flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-600 hover:-translate-y-1 transition-all shadow-xl shadow-blue-500/20">
                        Bilaaw Tijaabo Bilaash Ah <ArrowRight size={20} />
                    </Link>
                    <Link href="/contact" className="flex items-center justify-center gap-2 bg-transparent border border-gray-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all">
                        Nala Soo Xiriir
                    </Link>
                </div>
            </div>
        </section>
    );
};

const Footer = () => (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-12 text-center text-mediumGray text-sm">
        <p>&copy; {new Date().getFullYear()} Revlo Inc. All rights reserved.</p>
    </footer>
)

export default function DemoPage() {
    return (
        <main className="min-h-screen bg-white dark:bg-gray-900 font-sans selection:bg-primary/30 selection:text-primary">
            <Navbar />
            <DemoHero />
            <DemoFeatures />
            <CTA />
            <Footer />
        </main>
    );
}
