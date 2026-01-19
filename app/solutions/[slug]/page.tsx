import { Metadata } from 'next';
import Link from 'next/link';
import {
    ArrowRight, CheckCircle, Smartphone, Globe, Shield, Zap,
    BarChart3, Users, Layout, ShoppingCart, Truck, Factory,
    Calculator, ClipboardList, Clock, Layers, Database, Lock
} from 'lucide-react';
import { notFound } from 'next/navigation';

// --- Data Content Dictionary (The "Brain" of these pages) ---
// This contains 90% of the project details tailored for each specific URL.

const SOLUTIONS_DATA: Record<string, {
    title: string;
    subtitle: string;
    description: string;
    heroGradient: string;
    heroIcon: any;
    features: { title: string; desc: string; icon: any }[];
    deepDive: {
        title: string;
        content: string;
        points: string[];
    }[];
    faq: { q: string; a: string }[];
}> = {
    'erp-software': {
        title: 'Enterprise Resource Planning (ERP)',
        subtitle: 'Nidaamka Isku-xirka Ganacsiga Casriga ah',
        description: 'Revlo ERP waa wadnaha ganacsigaaga. Waxa uu isku xiraa maamulka keydka (Inventory), maaliyadda (Accounting), shaqaalaha (HR), iyo macaamiisha (CRM) hal meel oo kaliya.',
        heroGradient: 'from-blue-600 to-indigo-700',
        heroIcon: Layout,
        features: [
            { title: 'Centralized Data', desc: 'Xogta oo dhan hal meel. Jooji isticmaalka 10 software oo kala duwan.', icon: Database },
            { title: 'Real-time Analytics', desc: 'Warbixino toos ah oo ku saabsan faa\'iidada, kharashka, heersare.', icon: BarChart3 },
            { title: 'Multi-Branch Support', desc: 'Maamul dhowr xarumood (branches) adigoo jooga gurigaaga ama xafiiskaaga.', icon: Globe },
            { title: 'Automated Workflows', desc: 'Shaqooyinka soo noqnoqda (sida biilasha) si toos ah ha u qabsoomeen.', icon: Zap },
        ],
        deepDive: [
            {
                title: 'Maaliyadda & Xisaabaadka (Core Accounting)',
                content: 'Nidaam xisaabeed dhamaystiran oo aan u baahnayn aqoon qoto dheer. Revlo waxay si toos ah u diiwaangelisaa dhaqdhaqaaq kasta.',
                points: ['Balance Sheet & Profit/Loss toos ah.', 'Maamulka Deymaha (Accounts Payable/Receivable).', 'Canshuurta & Expenses tracking oo faahfaahsan.']
            },
            {
                title: 'HR & Payroll (Maamulka Shaqaalaha)',
                content: 'Shaqaaluhu waa hantida ugu weyn. Maamul mushaharka, gunada, fasaxyada, iyo imaanshaha (Attendance).',
                points: ['Mushahar bixin toos ah (Automated Payroll).', 'User Roles & Permissions (Xaniin cida geli karta).', 'Performance Tracking soo jiidasho leh.']
            }
        ],
        faq: [
            { q: 'ERP-gan ma ku shaqeeyaa Soomaali?', a: 'Haa, 100%. Revlo waa nidaamka kaliya ee ERP ee si buuxda ugu qoran Af-Soomaali iyo English.' },
            { q: 'Ma u baahanahay server qaali ah?', a: 'Maya. Revlo waa Cloud-based. Waxaan kuu haynaa server-ka, amniga, iyo backup-ka.' }
        ]
    },
    'pos-system': {
        title: 'Point of Sale (POS)',
        subtitle: 'Nidaamka Iibka ee Dukaanada & Farmashiyaha',
        description: 'Iibi alaabta ilbiriqsiyo gudahood.POS-ka Revlo wuxuu shaqeeyaa internet la\'aan (Offline), wuxuu taageeraa Barcode Scanners, Receipt Printers, iyo maamulka deynta macaamiisha.',
        heroGradient: 'from-green-600 to-emerald-700',
        heroIcon: ShoppingCart,
        features: [
            { title: 'Offline Mode', desc: 'Internet ma lihi? Dhib malahan. Iibku wuu soconayaa, xogtuna way keydsan tahay.', icon: Database },
            { title: 'Fast Checkout', desc: 'Scan garee barcode-ka, riix "Pay". Wax ka yar 3 ilbiriqsi.', icon: Zap },
            { title: 'Hardware Support', desc: 'Wuxuu la shaqeeyaa Printer kasta, Scanner kasta, iyo Cash Drawer kasta.', icon: Layers },
            { title: 'Stock Alerts', desc: 'Digniin toos ah markii alaabtu sii dhamaanayso (Low Stock).', icon: ClipboardList },
        ],
        deepDive: [
            {
                title: 'Iibka & Rasiidhada (Sales & Receipts)',
                content: 'Naqshadeyso rasiidhadaada (add logo). U dir macaamiisha rasiid SMS ama WhatsApp ah, ama daabac mid waraaq ah.',
                points: ['Customizable Receipts (Logo & Info).', 'Split Payments (Qaar kaash, qaar EVC/Zaad).', 'Returns & Refunds management fudud.']
            },
            {
                title: 'Maamulka Macaamiisha (CRM)',
                content: 'Ogow macaamiishaada ugu fiican. Diiwaangeli deynta, oo u dir fariin xasuusin ah (Payment Reminders).',
                points: ['Customer Profiles & History.', 'Debt Management & Credit Limits.', 'Loyalty Programs (dhibco urursi).']
            }
        ],
        faq: [
            { q: 'Haddii internetku go\'o ma istaagayaa?', a: 'Maya! Revlo POS wuxuu u shaqeeyaa si caadi ah internet la\'aan. Markuu soo laabto ayuu xogta dirayaa (Sync).' },
            { q: 'Ma ku isticmaali karaa Tablet ama Telefoon?', a: 'Haa. Waa nidaam Responsive ah oo ka shaqeeya Desktop, Laptop, Tablet, iyo Mobile.' }
        ]
    },
    'project-management-software': {
        title: 'Maamulka Mashaariicda (Project Management)',
        subtitle: 'Qorshee, Fulin, oo Guuleyso',
        description: 'Ku maamul mashaariicda dhismaha, adeegyada, iyo qandaraasyada si hufan. La soco miisaaniyadda mashruuca (Project Budgeting) iyo horumarka shaqada (Milestones).',
        heroGradient: 'from-purple-600 to-violet-700',
        heroIcon: ClipboardList,
        features: [
            { title: 'Budget vs Actual', desc: 'Is barbar dhig kharashka qorsheysan iyo kan dhabta ah waqti kasta.', icon: Calculator },
            { title: 'Task & Milestones', desc: 'U qeybi mashruuca shaqooyin yaryar. U dir shaqaalaha fariin shaqo.', icon: CheckCircle },
            { title: 'Client Portal', desc: 'Macmiilkaagu haka la socdo horumarka mashruuca si toos ah.', icon: Users },
            { title: 'Document Storage', desc: 'Keydi heshiisyada, naqshadaha, iyo rasiidhada mashruuc kasta.', icon: Layers },
        ],
        deepDive: [
            {
                title: 'Dhismaha & Qandaraasyada',
                content: 'Ku haboonaanta shirkadaha dhismaha (Construction). La soco isticmaalka qalabka dhismaha iyo saacadaha shaqaalaha goobta.',
                points: ['Daily Logs & Site Reports.', 'Material Usage Tracking per Project.', 'Sub-contractor Management.']
            }
        ],
        faq: [
            { q: 'Ma arki karaa faa\'iidada mashruuc walba gaarkiisa?', a: 'Haa. Warbixintu waxay ku siinaysaa Profit/Loss-ka mashruuc kasta si gaar ah.' }
        ]
    },
    'manufacturing-erp': {
        title: 'Manufacturing & Warshadaha',
        subtitle: 'Laga bilaabo Alaabta Ceeriin ilaa Badeecada Dhamaatay',
        description: 'Nidaam gaar u ah Warshadaha. Maamul "Bill of Materials" (BOM), khadadka wax soo saarka (Production Lines), iyo qiimeynta kharashka dhabta ah ee badeecada (Cost Per Unit).',
        heroGradient: 'from-orange-600 to-red-600',
        heroIcon: Factory,
        features: [
            { title: 'Bill of Materials (BOM)', desc: 'Qeex waxa galaya badeecad kasta (Ingredients/Components).', icon: Layers },
            { title: 'Production Scheduling', desc: 'Qorshee wax soo saarka maalinta ama isbuuca.', icon: Clock },
            { title: 'Wastage Tracking', desc: 'Ogow inta khasaartay intii shaqadu socotay si loo yareeyo.', icon: Zap },
            { title: 'Cost Analysis', desc: 'Xisaabi korontada, shaqaalaha, iyo alaabta si aad u ogaato macaashka dhabta ah.', icon: Calculator },
        ],
        deepDive: [
            {
                title: 'Work Orders & Planning',
                content: 'Amarka shaqada u dir warshada. La soco marxalad kasta oo baco, qasaacad, ama badeecad ay marayso.',
                points: ['Raw Material Reservation.', 'Finished Goods Auto-Stocking.', 'Batch & Expiry Date Management.']
            }
        ],
        faq: [
            { q: 'Ma ku haboon yahay warshadaha yar yar?', a: 'Haa, iyo kuwa waaweynba. Waanu habeyn karnaa (Customize) hadba baahidaada.' }
        ]
    },
    'somali-business-software': {
        title: 'Xalka Ganacsiga Soomaaliyeed',
        subtitle: 'Nidaam Fahmaya Dhaqanka Ganacsigaaga',
        description: 'Revlo laguma soo dejin dibadda oo kaliya; waxaa loo dhisay inuu xaliyo caqabadaha ganacsiga Soomaalida. Luqadda, Lacagaha (Zaad/EVC/USD), iyo Dhaqanka.',
        heroGradient: 'from-cyan-600 to-blue-600',
        heroIcon: Globe,
        features: [
            { title: 'Af-Soomaali Buuxa', desc: 'Qof kasta oo shaqaalahaaga ah wuu fahmi karaa.', icon: CheckCircle },
            { title: 'Local Currency', desc: 'Isku isticmaal Shillin iyo Dollar. Nidaamka ayaa kuu xisaabinaya sarifka.', icon: Calculator },
            { title: 'WhatsApp Integration', desc: 'Rasiidhada iyo warbixinada toos ugu dir WhatsApp.', icon: Smartphone },
            { title: 'Local Support', desc: 'Taageero (Support) aad toos u wici karto, afkaagana kula hadlaysa.', icon: Users },
        ],
        deepDive: [
            {
                title: 'Sababta Revlo?',
                content: 'Software-yada kale (sida QuickBooks ama Odoo) way adag yihiin, luqad qalaad ayay ku qoran yihiin, mana garanayaan qaabka aan u shaqeyno. Revlo waa jawaabta.',
                points: ['Waa fududahay in la barto.', 'Waa ka jaban yahay kuwa caalamiga ah.', 'Xogtaadu waa mid amaan ah.']
            }
        ],
        faq: [
            { q: 'Xafiis ma ku leedihiin Muqdisho?', a: 'Haa, waanu joognaa. Sidoo kale khadka ayaan kugu caawin karnaa meel kasta.' }
        ]
    },
};

// Also map generic keywords to closest relevant content
SOLUTIONS_DATA['accounting-software'] = SOLUTIONS_DATA['erp-software'];
SOLUTIONS_DATA['inventory-management'] = SOLUTIONS_DATA['erp-software'];


type Props = {
    params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const data = SOLUTIONS_DATA[params.slug];
    if (!data) return { title: 'Revlo Solutions' };

    return {
        title: `${data.title} - Revlo Business Solutions`,
        description: data.description,
        alternates: {
            canonical: `https://revlo.me/solutions/${params.slug}`,
        },
        openGraph: {
            title: data.title,
            description: data.description,
        }
    };
}

export default function SolutionPage({ params }: Props) {
    const data = SOLUTIONS_DATA[params.slug];

    if (!data) {
        notFound();
    }

    const HeroIcon = data.heroIcon;

    return (
        <div className="min-h-screen bg-white dark:bg-black font-sans selection:bg-primary/30">

            {/* 1. HERO SECTION */}
            <section className={`relative pt-32 pb-24 overflow-hidden`}>
                {/* Background Mesh Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${data.heroGradient} opacity-5 dark:opacity-10`}></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-white/20 to-transparent blur-[120px] rounded-full mix-blend-overlay"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white dark:bg-white/10 shadow-xl mb-8 animate-fade-in-up">
                        <HeroIcon size={48} className="text-secondary dark:text-white" strokeWidth={1.5} />
                    </div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-darkGray dark:text-white mb-6 tracking-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        {data.title}
                    </h1>

                    <h2 className="text-xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        {data.subtitle}
                    </h2>

                    <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        {data.description}
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                        <Link href="/signup" className="flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-600 transition-all shadow-xl hover:shadow-primary/40 hover:-translate-y-1">
                            Bilaaw Maanta Bilaash <ArrowRight size={20} />
                        </Link>
                        <Link href="/demo" className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-darkGray dark:text-white border border-gray-200 dark:border-gray-700 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:-translate-y-1">
                            La Hadal Sales-ka
                        </Link>
                    </div>
                </div>
            </section>

            {/* 2. KEY FEATURES GRID */}
            <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-3">Awoodaha Muhiimka Ah</h3>
                        <h2 className="text-3xl md:text-5xl font-black text-darkGray dark:text-white">Wax Walba Oo Aad U Baahantahay</h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {data.features.map((feature, idx) => {
                            const Icon = feature.icon;
                            return (
                                <div key={idx} className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 group hover:-translate-y-2">
                                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                        <Icon size={28} />
                                    </div>
                                    <h4 className="text-xl font-bold text-darkGray dark:text-white mb-3">{feature.title}</h4>
                                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">{feature.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 3. DEEP DIVE SECTIONS (Alternating Layout) */}
            <section className="py-24 bg-white dark:bg-black overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 space-y-24">
                    {data.deepDive.map((section, idx) => (
                        <div key={idx} className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-20 ${idx % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>

                            {/* Text Content */}
                            <div className="flex-1">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-darkGray dark:text-white text-xs font-bold rounded-full mb-6">
                                    <Zap size={14} className="text-secondary" /> Feature Focus
                                </div>
                                <h2 className="text-3xl md:text-5xl font-black text-darkGray dark:text-white mb-6 leading-tight">
                                    {section.title}
                                </h2>
                                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed border-l-4 border-primary/20 pl-6">
                                    {section.content}
                                </p>
                                <ul className="space-y-4">
                                    {section.points.map((point, pIdx) => (
                                        <li key={pIdx} className="flex items-start gap-3">
                                            <CheckCircle className="text-green-500 shrink-0 mt-1" size={20} />
                                            <span className="text-gray-700 dark:text-gray-200 font-medium">{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Visual Placeholder / Glass Card */}
                            <div className="flex-1 w-full">
                                <div className={`relative aspect-square md:aspect-video rounded-[3rem] bg-gradient-to-br ${data.heroGradient} p-1 shadow-2xl transform hover:scale-[1.02] transition-transform duration-500`}>
                                    <div className="absolute inset-0 bg-white dark:bg-gray-900 rounded-[2.8rem] m-0.5 flex items-center justify-center overflow-hidden">
                                        {/* Abstract UI Representation */}
                                        <div className="text-center p-10 opacity-10 dark:opacity-20 scale-150">
                                            <HeroIcon size={200} />
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-gray-900"></div>
                                        <div className="absolute bottom-10 left-10 right-10">
                                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/20">
                                                <div className="flex items-center gap-4 mb-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary"><Shield size={20} /></div>
                                                    <div>
                                                        <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                                                        <div className="h-2 w-16 bg-gray-100 dark:bg-gray-800 rounded"></div>
                                                    </div>
                                                </div>
                                                <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded mb-2"></div>
                                                <div className="h-2 w-3/4 bg-gray-100 dark:bg-gray-700 rounded"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            </section>

            {/* 4. FAQ / TRUST */}
            <section className="py-24 bg-darkGray text-white">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-12">Su'aalaha Lagu Badan Yahay</h2>
                    <div className="grid gap-6 text-left">
                        {data.faq.map((item, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors">
                                <h4 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                                    <span className="text-primary">Q.</span> {item.q}
                                </h4>
                                <p className="text-gray-400 pl-8">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. FINAL CTA */}
            <section className="py-20 bg-primary text-white text-center">
                <div className="max-w-3xl mx-auto px-6">
                    <h2 className="text-4xl md:text-5xl font-black mb-6">Diyaar Ma U Tahay Isbadal?</h2>
                    <p className="text-xl text-blue-100 mb-10">
                        Ku biir boqolaal ganacsi oo isticmaala {data.title}.
                        Tijaabi 14 maalmood oo bilaash ah.
                    </p>
                    <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-primary px-10 py-5 rounded-full font-bold text-xl hover:bg-gray-100 transition-all shadow-xl hover:-translate-y-1">
                        <Rocket size={24} /> Bilaaw Hadda
                    </Link>
                </div>
            </section>

        </div>
    );
}

// Simple Rocket Icon Component for CTA
function Rocket({ size, className }: { size: number, className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.1 4 0 4 0" />
            <path d="M12 15v5s3.03-.55 4-2c1.1-1.62 0-4 0-4" />
        </svg>
    )
}
