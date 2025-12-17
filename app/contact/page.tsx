'use client';

import React from 'react';
import LandingNavbar from '@/components/LandingNavbar';
import LandingFooter from '@/components/LandingFooter';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function ContactPage() {
    return (
        <main className="min-h-screen bg-white dark:bg-gray-900 font-sans">
            <LandingNavbar />

            <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-darkGray dark:text-white mb-6">Nala Soo Xiriir</h1>
                    <p className="text-xl text-mediumGray dark:text-gray-400 max-w-2xl mx-auto">
                        Waxaan diyaar u nahay inaan ka jawaabno su'aalahaaga oo dhan. Nala soo xiriir maanta.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    {/* Contact Form */}
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                        <h2 className="text-2xl font-bold text-darkGray dark:text-white mb-6">Fariin Noo Dir</h2>
                        <form className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-2">Magacaaga</label>
                                    <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-darkGray dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="Magacaaga" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-2">Email-kaaga</label>
                                    <input type="email" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-darkGray dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="email@example.com" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-2">Mowduuca</label>
                                <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-darkGray dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="Maxaan kaa caawin karnaa?" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-2">Fariinta</label>
                                <textarea rows={4} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-darkGray dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" placeholder="Qor fariintaada halkaan..."></textarea>
                            </div>
                            <button type="button" className="w-full bg-primary text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                                <Send size={20} /> Dir Fariinta
                            </button>
                        </form>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-8">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-8 rounded-2xl border border-blue-100 dark:border-blue-800">
                            <h3 className="text-xl font-bold text-darkGray dark:text-white mb-6">Xogta Xiriirka</h3>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-primary shadow-sm shrink-0">
                                        <Phone size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-darkGray dark:text-white">Wac Hadda</h4>
                                        <p className="text-mediumGray dark:text-gray-400">+251 929 475 332</p>
                                        <p className="text-mediumGray dark:text-gray-400">+252 63 445 6789</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-primary shadow-sm shrink-0">
                                        <Mail size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-darkGray dark:text-white">Email</h4>
                                        <p className="text-mediumGray dark:text-gray-400">info@revlo.com</p>
                                        <p className="text-mediumGray dark:text-gray-400">support@revlo.com</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-primary shadow-sm shrink-0">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-darkGray dark:text-white">Joogitaanka</h4>
                                        <p className="text-mediumGray dark:text-gray-400">Jigjiga, Somali Region, Ethiopia</p>
                                        <p className="text-mediumGray dark:text-gray-400">Hargeisa, Somaliland</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Map Placeholder */}
                        <div className="bg-gray-200 dark:bg-gray-800 rounded-2xl h-64 w-full flex items-center justify-center text-mediumGray dark:text-gray-500 font-medium">
                            Google Maps Embed Here
                        </div>
                    </div>
                </div>
            </div>

            <LandingFooter />
        </main>
    );
}
