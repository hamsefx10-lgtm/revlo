'use client';

import React from 'react';
import LandingNavbar from '@/components/LandingNavbar';
import LandingFooter from '@/components/LandingFooter';

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-white dark:bg-gray-900 font-sans">
            <LandingNavbar />

            <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <h1 className="text-4xl font-extrabold text-darkGray dark:text-white mb-8">Shuruudaha Adeegga</h1>
                <p className="text-sm text-mediumGray dark:text-gray-500 mb-8">Last updated: December 17, 2025</p>

                <div className="prose dark:prose-invert max-w-none text-mediumGray dark:text-gray-300">
                    <p className="mb-4">
                        Fadlan si taxadar leh u aqri shuruudahan ka hor inta aadan isticmaalin nidaamka Revlo. Isticmaalkaaga adeegga wuxuu ka dhigan yahay inaad aqbashay shuruudahan.
                    </p>

                    <h2 className="text-2xl font-bold text-darkGray dark:text-white mt-8 mb-4">1. Ogolaanshaha Isticmaalka</h2>
                    <p className="mb-4">
                        Markaad iska diiwaangeliso Revlo, waxaad ogolaanaysaa inaad u hogaansanto dhamaan shuruucda iyo qawaaniinta khuseeya. Waa inaad bixisaa xog sax ah oo dhameystiran.
                    </p>

                    <h2 className="text-2xl font-bold text-darkGray dark:text-white mt-8 mb-4">2. Masuuliyadda Koontada</h2>
                    <p className="mb-4">
                        Adiga ayaa ka masuul ah ilaalinta sirta koontadaada (password). Dhamaan dhaqdhaqaaqa ka dhaca koontadaada adiga ayaa mas'uul ka ah. Revlo masuul kama aha khasaare ka dhasha dayacaad xaggaaga ah.
                    </p>

                    <h2 className="text-2xl font-bold text-darkGray dark:text-white mt-8 mb-4">3. Bixinta Lacagaha</h2>
                    <p className="mb-4">
                        Qaar ka mid ah adeegyada Revlo waa lacag. Waa inaad ogolaataa inaad bixiso kharashaadka ku xusan qorshaha (plan) aad dooratay. Lacagta lama celiyo (Non-refundable) marka laga reebo xaalado gaar ah.
                    </p>

                    <h2 className="text-2xl font-bold text-darkGray dark:text-white mt-8 mb-4">4. Joojinta Adeegga</h2>
                    <p className="mb-4">
                        Waxaan xaq u leenahay inaan joojino ama hakino koontadaada haddii aad jebiso shuruudahan, ama haddii aan ka shakino dhaqdhaqaaq sharci darro ah. Adiguna waad iska xiri kartaa koontadaada wakhti kasta.
                    </p>

                    <h2 className="text-2xl font-bold text-darkGray dark:text-white mt-8 mb-4">5. Xogta iyo Lahaanshaha</h2>
                    <p className="mb-4">
                        Xogtaada ganacsi adiga ayaa leh. Revlo ma laha xuquuq ay ku sheegato lahaanshaha xogtaada gaarka ah. Si kastaba ha ahaatee, waxaad na siinaysaa ogolaansho aan ku keydin karno una baaraandegi karno xogtaas si aan u bixino adeegga.
                    </p>

                    <h2 className="text-2xl font-bold text-darkGray dark:text-white mt-8 mb-4">6. Isbedelka Shuruudaha</h2>
                    <p className="mb-4">
                        Waan bedeli karnaa shuruudahan wakhti kasta. Isbedelada muhiimka ah waxaa lagugu soo wargelin doonaa email ama ogeysiis ku dhex jira nidaamka.
                    </p>

                    <h2 className="text-2xl font-bold text-darkGray dark:text-white mt-8 mb-4">7. Nala Xiriir</h2>
                    <p className="mb-4">
                        Haddii aad qabto wax su'aal ah oo ku saabsan shuruudahan, fadlan nagala soo xiriir support@revlo.com.
                    </p>
                </div>
            </div>

            <LandingFooter />
        </main>
    );
}
