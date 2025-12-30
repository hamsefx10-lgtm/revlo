'use client';

import React, { useState } from 'react';
import LandingNavbar from '@/components/LandingNavbar';
import LandingFooter from '@/components/LandingFooter';
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const { addNotification } = useNotifications();
    const [loading, setLoading] = useState(false);
    // Removed local success/error states as we use global notifications

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                addNotification({
                    type: 'success',
                    message: 'Fariintaada si guul leh ayaa loo diray! Waxaan ku soo jawaabi doonaa dhowaan.'
                });
                setFormData({ name: '', email: '', subject: '', message: '' });
            } else {
                addNotification({
                    type: 'error',
                    message: data.message || 'Cilad ayaa dhacday. Fadlan isku day mar kale.'
                });
            }
        } catch (err) {
            console.error('Error submitting form:', err);
            addNotification({
                type: 'error',
                message: 'Cilad shabakadeed ayaa dhacday. Fadlan isku day mar kale.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-white dark:bg-gray-900 font-sans">
            <LandingNavbar />

            <div className="pt-24 md:pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="text-center mb-12 md:mb-16">
                    <h1 className="text-3xl md:text-5xl font-extrabold text-darkGray dark:text-white mb-4 md:mb-6">Nala Soo Xiriir</h1>
                    <p className="text-lg md:text-xl text-mediumGray dark:text-gray-400 max-w-2xl mx-auto">
                        Waxaan diyaar u nahay inaan ka jawaabno su'aalahaaga oo dhan. Nala soo xiriir maanta.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-start">
                    {/* Contact Form */}
                    <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                        <h2 className="text-xl md:text-2xl font-bold text-darkGray dark:text-white mb-6">Fariin Noo Dir</h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-2">Magacaaga</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-darkGray dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                        placeholder="Magacaaga"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-2">Email-kaaga</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-darkGray dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="subject" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-2">Mowduuca</label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-darkGray dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    placeholder="Maxaan kaa caawin karnaa?"
                                />
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-darkGray dark:text-gray-300 mb-2">Fariinta</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows={4}
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-darkGray dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                                    placeholder="Qor fariintaada halkaan..."
                                ></textarea>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        <span>Waa la dirayaa...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send size={20} />
                                        <span>Dir Fariinta</span>
                                    </>
                                )}
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
                                        <p className="text-mediumGray dark:text-gray-400">+252 -- --- ----</p>
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
                                        <p className="text-mediumGray dark:text-gray-400">Jigjiga, Somali Region, Somali galbeed</p>
                                        <p className="text-mediumGray dark:text-gray-400"></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Map Placeholder -> Live Map */}
                        <div className="bg-gray-200 dark:bg-gray-800 rounded-2xl h-80 w-full overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 relative">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15748.81640232468!2d42.7844!3d9.3526!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x162e371764656605%3A0x704c328e1844059d!2sJigjiga%2C%20Ethiopia!5e0!3m2!1sen!2sus!4v1703778000000!5m2!1sen!2sus"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="filter dark:invert-[.9] dark:hue-rotate-180 dark:contrast-[.8]" // Dark mode map filter hack
                            ></iframe>
                        </div>
                    </div>
                </div>
            </div>

            <LandingFooter />
        </main>
    );
}
