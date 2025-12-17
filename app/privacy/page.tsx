'use client';

import React from 'react';
import LandingNavbar from '@/components/LandingNavbar';
import LandingFooter from '@/components/LandingFooter';

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-white dark:bg-gray-900 font-sans">
            <LandingNavbar />

            <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <h1 className="text-4xl font-extrabold text-darkGray dark:text-white mb-8">Qaanuunka Arrimaha gaarka ah</h1>
                <p className="text-sm text-mediumGray dark:text-gray-500 mb-8">Last updated: December 17, 2025</p>

                <div className="prose dark:prose-invert max-w-none text-mediumGray dark:text-gray-300">
                    <p className="mb-4">
                        Shirkadda Revlo ("anaga", "annaga", ama "kayaga") waxay tixgelisaa sirtaada. Qaanuunkan wuxuu sharxayaa sida aan u ururino, u isticmaalno, una ilaalino xogtaada markaad isticmaalayso adeegyadayada.
                    </p>

                    <h2 className="text-2xl font-bold text-darkGray dark:text-white mt-8 mb-4">1. Xogta aan ururino</h2>
                    <p className="mb-4">
                        Waxaan ururin karnaa noocyada xogta soo socota:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li><strong>Xogta Shakhsiga ah:</strong> Magaca, ciwaanka emailka, lambarka taleefanka, iyo xogta ganacsiga markaad isdiiwaangelineyso.</li>
                        <li><strong>Xogta Maaliyadeed:</strong> Xogta la xiriirta lacag-bixinta iyo qaansheegyada (in kastoo aynaan keydin macluumaadka xasaasiga ah ee credit card-kaaga si toos ah).</li>
                        <li><strong>Xogta Isticmaalka:</strong> Sida aad u isticmaasho barnaamijka, wakhtiga aad gasho, iyo qalabka aad isticmaasho.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-darkGray dark:text-white mt-8 mb-4">2. Sida aan u isticmaalno xogtaada</h2>
                    <p className="mb-4">
                        Ujeedada ugu weyn ee aan xogta ugu baahanahay waa inaan bixino oo horumarino adeeggeena. Waxaan u isticmaalnaa:
                    </p>
                    <ul className="list-disc pl-6 mb-4 space-y-2">
                        <li>Si aan u maamulno koontadaada iyo diiwaangelintaada.</li>
                        <li>Si aan u bixino taageero farsamo (customer support).</li>
                        <li>Si aan kuugu soo dirno ogeysiisyada muhiimka ah ee ku saabsan nidaamka.</li>
                        <li>Si aan u falanqeyno habka isticmaalka si aan u horumarino khibrada isticmaalaha.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-darkGray dark:text-white mt-8 mb-4">3. Ilaalinta Xogta</h2>
                    <p className="mb-4">
                        Waxaan isticmaalnaa habab farsamo oo casri ah si aan u ilaalino xogtaada, oo ay ku jiraan encryption (sir-qarinta) iyo firewall-ada. Si kastaba ha ahaatee, waxaan ku xusuusinaynaa in internet-ka uusan ahayn 100% ammaan, laakiin waxaan sameynaa dadaalkayaga ugu fiican.
                    </p>

                    <h2 className="text-2xl font-bold text-darkGray dark:text-white mt-8 mb-4">4. La wadaagida dhinac saddexaad</h2>
                    <p className="mb-4">
                        Revlo ma iibiso xogtaada. Waxaan kaliya la wadaagi karnaa dhinac saddexaad marka ay lagama maarmaan tahay bixinta adeegga (tusaale, bixiyeyaasha adeegga server-ka ama lacag-bixinta).
                    </p>

                    <h2 className="text-2xl font-bold text-darkGray dark:text-white mt-8 mb-4">5. Xuquuqdaada</h2>
                    <p className="mb-4">
                        Waxaad xaq u leedahay inaad dalbato inaan tirtirno xogtaada ama aan ogaato xogta aan kaa hayno wakhti kasta. Fadlan nagala soo xiriir: info@revlo.com.
                    </p>
                </div>
            </div>

            <LandingFooter />
        </main>
    );
}
