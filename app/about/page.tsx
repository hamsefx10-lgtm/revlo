'use client';

import React from 'react';
import LandingNavbar from '@/components/LandingNavbar';
import LandingFooter from '@/components/LandingFooter';
import { Target, ShieldCheck, Users, Globe } from 'lucide-react';
import Image from 'next/image';

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-white dark:bg-gray-900 font-sans">
            <LandingNavbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-32 md:pb-48 flex items-center justify-center overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/about-hero.png"
                        alt="Revlo Team"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-[2px]"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-3xl md:text-6xl font-extrabold text-white mb-6">
                        Hadafkayagu waa <span className="text-primary">Horumarinta</span> Ganacsiga Afrika
                    </h1>
                    <p className="max-w-3xl mx-auto text-xl text-gray-200 leading-relaxed font-medium">
                        Revlo ma ahan kaliya software; waa lamaanahaaga ganacsiga. Waxaan u taaganahay inaan casriyeeyno habka ganacsiga Soomaalidu u shaqeeyo.
                    </p>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border-t-4 border-primary">
                            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-primary mb-6">
                                <Target size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-darkGray dark:text-white mb-4"> Hadafkayaga (Mission)</h2>
                            <p className="text-mediumGray dark:text-gray-400 leading-relaxed">
                                Inaan bixino xalal teknoolojiyad casri ah oo fududeeya maamulka ganacsiga, kordhiya wax-soo-saarka, isla markaana yareeya kharashka iyo waqtiga lumaya.
                            </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border-t-4 border-secondary">
                            <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center text-secondary mb-6">
                                <Globe size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-darkGray dark:text-white mb-4">Aragtidayada (Vision)</h2>
                            <p className="text-mediumGray dark:text-gray-400 leading-relaxed">
                                Inaan noqono nidaamka ERP ee ugu awoodda badan uguna isticmaalka badan Bariga Afrika marka la gaaro 2030, anagoo dhisayna dhaqaale ku dhisan xog iyo hufnaan.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-20 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-darkGray dark:text-white mb-4">Qiimooyinka Aasaasiga Ah</h2>
                        <p className="text-mediumGray dark:text-gray-400">Waxa aan aaminsanahay iyo sida aan u shaqeyno.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: <ShieldCheck />, title: 'Aaminaad & Hufnaan', desc: 'Xogtaadu waa amaano. Waxaan ku dadaaleynaa nabadgelyada iyo sirta ganacsigaaga.' },
                            { icon: <Users />, title: 'Macaamiisha', desc: 'Guusha macmiilku waa guushayada. Waxaan u shaqeynaa si aan u xalino caqabadaha dhabta ah.' },
                            { icon: <Target />, title: 'Tayada', desc: 'Ma aqbalno "wax iska-celis". Wax walba oo aan samayno waa inay noqdaan heer caalami.' }
                        ].map((val, idx) => (
                            <div key={idx} className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                                <div className="w-12 h-12 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-darkGray dark:text-white mb-4">
                                    {React.cloneElement(val.icon, { size: 24 })}
                                </div>
                                <h3 className="font-bold text-lg mb-2 text-darkGray dark:text-white">{val.title}</h3>
                                <p className="text-sm text-mediumGray dark:text-gray-400">{val.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <LandingFooter />
        </main>
    );
}
