// app/page.tsx - Revlo Home Page (Left Aligned, 1000% Enhanced Design & Features)
import Link from 'next/link';
import React from 'react';
import {
  Briefcase, DollarSign, Warehouse, Users, Truck, LineChart, Zap, LayoutDashboard, Coins, ChevronRight, ShieldCheck,
  Award, RefreshCw, Smartphone, Cloud, Bell, Mail, MapPin, Phone, MessageSquare, Plus, CheckCircle,
  Code,  // New icon for API Access
  Palette, // New icon for Customization
  Globe, // New icon for Multi-language
  Cpu, // New icon for AI Assistant
  ReceiptText, // New icon for OCR/Receipt Scan
  Clock, // New icon for Time Tracking
  ClipboardCopy, // New icon for Bulk Entry
  CreditCard, // New icon for Payment Schedule
  FileText, // New icon for Debt Repayment
  HandPlatter, // New icon for Vendors/Suppliers
  CalendarCheck, // New icon for Recurring Expenses
  Activity, // New icon for User Access Logs
  Database, // New icon for Backup/Restore
  Factory, // New icon for Manufacturing
  Landmark, // New icon for Accounting
  MessageCircle, // New icon for Chat
  Package, // New icon for Package/Materials
  BarChart3, // New icon for Reports
  Download, // New icon for Download/Install
} from 'lucide-react'; // Imports all necessary icons from Lucide React

// --- Custom Components for Reusability and Cleanliness ---

// Feature Card Component (Enhanced with hover effect)
const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string; delay: number }> = ({ icon, title, description, delay }) => (
  <div
    className="relative bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl border border-lightGray dark:border-gray-700 
               flex flex-col items-center text-center transform hover:scale-105 transition-all duration-500 group 
               overflow-hidden animate-fade-in-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
    <div className={`relative text-6xl text-primary dark:text-secondary mb-6 group-hover:text-white transition-colors duration-300 z-10`}>
      {icon}
    </div>
    <h4 className="relative text-3xl font-extrabold text-darkGray dark:text-gray-100 mb-4 z-10">{title}</h4>
    <p className="relative text-lg text-mediumGray dark:text-gray-300 leading-relaxed z-10">{description}</p>
  </div>
);

// Step Card Component (Enhanced with subtle hover effect)
const StepCard: React.FC<{ step: number; title: string; description: string; bgColor: string; delay: number }> = ({ step, title, description, bgColor, delay }) => (
  <div 
    className="relative p-8 rounded-xl bg-white dark:bg-gray-800 shadow-2xl border border-lightGray dark:border-gray-700 
               transform hover:-translate-y-2 transition-transform duration-500 animate-fade-in-up" 
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className={`absolute -top-6 ${bgColor} text-white text-3xl font-bold w-16 h-16 rounded-full flex items-center justify-center border-4 border-lightGray dark:border-gray-700 shadow-lg`}>
      {step}
    </div>
    <h4 className="text-2xl font-bold text-darkGray dark:text-gray-100 mt-8 mb-4">{title}</h4>
    <p className="text-lg text-mediumGray dark:text-gray-300 leading-relaxed">{description}</p>
  </div>
);

// Testimonial Card Component (Enhanced with subtle hover effect)
const TestimonialCard: React.FC<{ text: string; name: string; role: string; delay: number }> = ({ text, name, role, delay }) => (
  <div 
    className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl border border-lightGray dark:border-gray-700 text-center 
               transform hover:scale-105 transition-all duration-500 animate-fade-in-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    <p className="text-xl italic text-mediumGray dark:text-gray-300 mb-6 leading-relaxed">
      "{text}"
    </p>
    <p className="text-lg font-bold text-darkGray dark:text-gray-100">{name}</p>
    <p className="text-md text-mediumGray dark:text-gray-300">{role}</p>
  </div>
);

// New: Value Proposition Card (for Solutions Section)
const ValuePropCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="flex items-start space-x-4 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-md transform hover:shadow-lg transition-shadow duration-300">
    <div className="text-primary dark:text-secondary flex-shrink-0 mt-1">{icon}</div>
    <div>
      <h4 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-1">{title}</h4>
      <p className="text-mediumGray dark:text-gray-300">{description}</p>
    </div>
  </div>
);

// --- Main Page Component ---
export default function HomePage() {
  return (
    <div className="min-h-screen bg-lightGray dark:bg-gray-900 text-darkGray dark:text-gray-200 flex flex-col">
      {/* Header/Navbar */}
      <header className="bg-white dark:bg-gray-800 shadow-lg py-4 px-4 lg:px-8 flex justify-between items-center sticky top-0 z-20">
        <h1 className="text-2xl lg:text-4xl font-extrabold tracking-wide text-darkGray dark:text-gray-100">
          Revl<span className="text-secondary">o</span>
        </h1>
        <nav className="hidden md:flex space-x-6 items-center justify-center flex-1"> {/* Hidden on mobile, centered */}
          {['Astaamaha', 'Sida uu u Shaqeeyo', 'Xalka', 'Install App', 'Qiimaha', 'Aragtiyada', 'Nala Soo Xiriir'].map((text, i) => (
            <a key={i} href={`#${['features', 'how-it-works', 'solutions', 'pwa-install', 'pricing', 'testimonials', 'contact'][i]}`} className="text-darkGray dark:text-gray-200 hover:text-primary transition-colors duration-200 font-medium text-lg">
              {text}
            </a>
          ))}
        </nav>
        <div className="hidden md:flex space-x-4 items-center">
          <Link href="/login" className="bg-primary text-white py-2.5 px-6 rounded-full font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md">
            Login
          </Link>
          <Link href="/signup" className="bg-primary text-white py-2.5 px-6 rounded-full font-bold text-lg hover:bg-blue-700 transition duration-200 shadow-md">
            Sign Up
          </Link>
        </div>
        {/* Mobile Menu Icon (Hamburger) - Responsive */}
        <div className="md:hidden">
          <button className="text-darkGray dark:text-gray-100 text-2xl lg:text-3xl hover:text-primary transition-colors duration-200">
            ☰
          </button>
        </div>
      </header>

      {/* Hero Section - CENTERED */}
      <section className="relative flex items-center py-16 lg:py-32 px-4 lg:px-6 md:px-16 bg-gradient-to-br from-primary to-blue-500 text-white overflow-hidden shadow-2xl">
        <div className="max-w-7xl mx-auto z-10 flex flex-col items-center text-center">
          {/* Text Content - Centered */}
          <div className="text-center animate-fade-in-left">
            <h2 className="text-3xl lg:text-5xl md:text-7xl font-extrabold leading-tight mb-4 lg:mb-7 drop-shadow-xl">
              Maamul Ganacsigaaga,<br />
              <span className="text-secondary">Revlo waa nidaam ERP casri ah</span>
            </h2>
            <p className="text-base lg:text-xl md:text-2xl mb-8 lg:mb-12 opacity-90 leading-relaxed max-w-xl">
               oo dhamaystiran, kaas oo ganacsigaaga ka dhigaya mid hufan oo isku xirnaan leh. Ku maamul mashaariicda, Production Orders, Material Purchases, Company Chat, kharashaadka, kaydka, iyo macaamiishaada si fudud, adigoo ka faa'iidaysanaya otomaatig awood leh iyo xog dhab ah oo kugu hagta go'aanka saxda ah.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 lg:gap-6">
              <Link href="/signup" className="bg-secondary text-white py-3 lg:py-4 px-6 lg:px-10 rounded-full text-lg lg:text-xl font-extrabold hover:bg-green-600 transition-all duration-300 shadow-xl transform hover:scale-105 flex items-center justify-center">
                Bilaaw Bilaash <ChevronRight className="ml-2 w-4 h-4 lg:w-5 lg:h-5" />
              </Link>
              <Link href="/login" className="border-2 border-white text-white py-3 lg:py-4 px-6 lg:px-10 rounded-full text-lg lg:text-xl font-extrabold hover:bg-white hover:text-primary transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
                Gal
              </Link>
            </div>
          </div>
          
        </div>
        {/* Animated Background Shapes */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-white rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-bounce-slow"></div>
          <div className="absolute bottom-1/3 right-1/3 w-60 h-60 bg-secondary rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-bounce-fast"></div>
          <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-accent rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-bounce-slowest"></div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="py-24 px-6 md:px-16 bg-lightGray dark:bg-gray-900">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h3 className="text-4xl md:text-5xl font-bold mb-4 text-darkGray dark:text-gray-100">Qiimaha Revlo Kuu Siiyo</h3>
          <p className="text-lg md:text-xl text-mediumGray dark:text-gray-400 max-w-3xl mx-auto">
            Qalabka muhiimka ah ee aad u baahan tahay hal meel, si aad ganacsigaaga u kobciso una qaado heerka xiga. Production Orders, Material Purchases, Company Chat, iyo dhammaan qalabka casri ah.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12">
          <FeatureCard
            icon={<Briefcase />}
            title="Maamulka Mashruuca"
            description="Qorshee oo la soco mashaariicda Kanban & timeline muuqda. Maamul hawlaha, ilaha, iyo jadwalka si hufan."
            delay={0}
          />
          <FeatureCard
            icon={<Factory />}
            title="Warshadaha & Samaynta"
            description="Maamul Production Orders, Bill of Materials, Work Orders, iyo Material Purchases. La soco samaynta alaabta si hufan."
            delay={100}
          />
          <FeatureCard
            icon={<DollarSign />}
            title="Maamulka Kharashaadka"
            description="Diiwaan geli kharashaadka, isticmaal OCR rasiidka, xisaabi otomaatig. Hel aragti ku saabsan lacagtaada iyo miisaaniyadda."
            delay={200}
          />
          <FeatureCard
            icon={<Landmark />}
            title="Maamulka Xisaabaadka"
            description="Maamul koobabka lacagta, dhaqdhaqaaqa lacagta, iyo warbixino dhaqaale. La soco lacagtaada si toos ah."
            delay={300}
          />
          <FeatureCard
            icon={<Warehouse />}
            title="Maamulka Bakhaarka"
            description="Si hufan ula socod alaabtaada, isticmaalkeeda mashruuca, iyo heerarka stock-ga. Hel digniino markay alaabtu dhammaato."
            delay={400}
          />
          <FeatureCard
            icon={<Users />}
            title="Maamulka Macaamiisha"
            description="Diiwaan geli macaamiishaada, la socod taariikhdooda, iyo mashaariicda ay kula leeyihiin. Dib u eeg lacag-bixinta iyo xiriirka."
            delay={500}
          />
          <FeatureCard
            icon={<Truck />}
            title="Maamulka Iibiyayaasha"
            description="Maamulka qandaraasleyaasha iyo waxyaabaha aad ka iibsatay. La soco waxqabadkooda iyo taariikhda lacag-bixinta."
            delay={600}
          />
          <FeatureCard
            icon={<MessageCircle />}
            title="Company Chat"
            description="Nidaamka warbixinta dhexdhexaadka ah ee shirkadda. La soco warbixinta, wadaag faylasha, iyo iskaashiga kooxda."
            delay={700}
          />
          <FeatureCard
            icon={<LineChart />}
            title="Warbixino & Falanqayn"
            description="Warbixino faahfaahsan oo ku saleysan xogtaada, oo ay ku jiraan shaxanyo muuqaal ah iyo filter-yo horumarsan. Ka gaar go'aano xog ku salaysan."
            delay={800}
          />
        </div>
      </section>

      {/* Solutions Section - NEW */}
      <section id="solutions" className="py-24 px-6 md:px-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h3 className="text-4xl md:text-5xl font-bold mb-4 text-darkGray dark:text-gray-100">Xalka Gaarka ah ee Revlo Bixiyo</h3>
          <p className="text-lg md:text-xl text-mediumGray dark:text-gray-400 max-w-3xl mx-auto">
            Revlo wuxuu bixiyaa qalab casri ah oo u sahlaya ganacsigaaga inuu noqdo mid hufan oo toosan. Production Orders, Material Purchases, Company Chat, iyo dhammaan qalabka casri ah.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <ValuePropCard 
            icon={<Factory className="w-8 h-8" />} 
            title="Production Orders & BOM" 
            description="Maamul Production Orders, Bill of Materials, iyo Work Orders. La soco samaynta alaabta si hufan oo toosan." 
          />
          <ValuePropCard 
            icon={<Package className="w-8 h-8" />} 
            title="Material Purchases" 
            description="Iibso alaabta warshadaha, la soco qandaraasleyaasha, oo hubi in alaabtaadu ay timaado waqti kasta." 
          />
          <ValuePropCard 
            icon={<Landmark className="w-8 h-8" />} 
            title="Multi-Account Management" 
            description="Maamul koobabka lacagta (Bank, Cash, Mobile Money), dhaqdhaqaaqa lacagta, iyo warbixino dhaqaale." 
          />
          <ValuePropCard 
            icon={<ReceiptText className="w-8 h-8" />} 
            title="Expense Approval System" 
            description="Maamul kharashyada u baahan ansixinta maamulaha, oo hubi in xisaabaadkaagu ay sax yihiin." 
          />
          <ValuePropCard 
            icon={<MessageCircle className="w-8 h-8" />} 
            title="Real-time Company Chat" 
            description="Nidaamka warbixinta dhexdhexaadka ah ee shirkadda. La soco warbixinta, wadaag faylasha, iyo iskaashiga kooxda." 
          />
          <ValuePropCard 
            icon={<Users className="w-8 h-8" />} 
            title="Role-based Access Control" 
            description="Maamul istcmaaleyaal, dooro xilalka (Admin, Manager, Member), oo hubi in xogtaada ay amniga ku jirto." 
          />
          <ValuePropCard 
            icon={<BarChart3 className="w-8 h-8" />} 
            title="Advanced Reporting" 
            description="Warbixino faahfaahsan oo ku saleysan xogtaada, oo ay ku jiraan shaxanyo muuqaal ah iyo filter-yo horumarsan." 
          />
          <ValuePropCard 
            icon={<Warehouse className="w-8 h-8" />} 
            title="Smart Inventory Tracking" 
            description="La soco alaabtaada, isticmaalkeeda mashruuca, iyo heerarka stock-ga. Hel digniino markay alaabtu dhammaato." 
          />
          <ValuePropCard 
            icon={<Truck className="w-8 h-8" />} 
            title="Vendor Management" 
            description="Maamulka qandaraasleyaasha iyo waxyaabaha aad ka iibsatay. La soco waxqabadkooda iyo taariikhda lacag-bixinta." 
          />
        </div>
      </section>


      {/* PWA Install Section */}
      <section id="pwa-install" className="py-24 px-6 md:px-16 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-4xl md:text-5xl font-bold mb-6 text-darkGray dark:text-gray-100">Install Revlo App</h3>
          <p className="text-lg md:text-xl text-mediumGray dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            Install Revlo as a Progressive Web App (PWA) on your device for the best experience. Works offline, loads fast, and feels like a native app. No need for App Store or Play Store - install directly from your browser!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="bg-primary/10 p-3 rounded-lg w-fit mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-2">Mobile Install</h4>
              <p className="text-mediumGray dark:text-gray-400">
                Install on your phone for quick access. Works on iOS Safari and Android Chrome.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="bg-secondary/10 p-3 rounded-lg w-fit mx-auto mb-4">
                <Cloud className="w-8 h-8 text-secondary" />
              </div>
              <h4 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-2">Offline Access</h4>
              <p className="text-mediumGray dark:text-gray-400">
                Use Revlo even without internet. Your data syncs when you're back online.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="bg-accent/10 p-3 rounded-lg w-fit mx-auto mb-4">
                <Zap className="w-8 h-8 text-accent" />
              </div>
              <h4 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-2">Fast Loading</h4>
              <p className="text-mediumGray dark:text-gray-400">
                Cached resources make Revlo load instantly, even on slow connections.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              id="pwa-install-button-main"
              className="bg-primary text-white py-4 px-8 rounded-full text-xl font-bold hover:bg-primary/80 transition-all duration-300 shadow-xl transform hover:scale-105 flex items-center justify-center"
              style={{ display: 'none' }}
            >
              <svg className="mr-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Install Revlo App
            </button>
            
            <div className="text-center">
              <p className="text-sm text-mediumGray dark:text-gray-400 mb-2">Installation Instructions:</p>
              <div className="flex flex-col sm:flex-row gap-4 text-sm text-mediumGray dark:text-gray-400">
                <div className="flex items-center justify-center space-x-2">
                  <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                  <span>Open in browser</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                  <span>Tap "Install" or "Add to Home Screen"</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                  <span>Enjoy the app experience!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section id="mobile-app" className="py-24 px-6 md:px-16 bg-lightGray dark:bg-gray-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-left">
            <h3 className="text-4xl md:text-5xl font-bold mb-6 text-darkGray dark:text-gray-100">Revlo Mobile: Maamul Goobta Kasta</h3>
            <p className="text-lg md:text-xl text-mediumGray dark:text-gray-400 mb-8 leading-relaxed">
              Qaado Revlo jeebkaaga! App-ka moobilka ee sahlan wuxuu kuu oggolaanayaa inaad geliso kharashyada, la socoto mashaariicda, Production Orders, Material Purchases, Company Chat, oo aad gasho macluumaadka muhiimka ah meel kasta oo aad joogto, xitaa marka aysan jirin internet.
            </p>
            <ul className="space-y-4 text-lg text-darkGray dark:text-gray-200 mb-8">
              <li className="flex items-center space-x-3"><CheckCircle className="w-6 h-6 text-secondary" /><span>Gelinta Kharashyada Degdeg ah (Scan Receipt)</span></li>
              <li className="flex items-center space-x-3"><CheckCircle className="w-6 h-6 text-secondary" /><span>La Socodka Horumarka Mashruuca</span></li>
              <li className="flex items-center space-x-3"><CheckCircle className="w-6 h-6 text-secondary" /><span>Maamulka Production Orders</span></li>
              <li className="flex items-center space-x-3"><CheckCircle className="w-6 h-6 text-secondary" /><span>Company Chat & Communication</span></li>
              <li className="flex items-center space-x-3"><CheckCircle className="w-6 h-6 text-secondary" /><span>La Socodka Lacagta & Xisaabaadka</span></li>
              <li className="flex items-center space-x-3"><CheckCircle className="w-6 h-6 text-secondary" /><span>Galitaanka Xogta Offline</span></li>
            </ul>
            <div className="flex flex-wrap gap-4">
              <Link href="#" className="bg-darkGray dark:bg-gray-700 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200 shadow-md flex items-center">
                <Smartphone className="mr-2" /> App Store
              </Link>
              <Link href="#" className="bg-darkGray dark:bg-gray-700 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors duration-200 shadow-md flex items-center">
                <Award className="mr-2" /> Google Play
              </Link>
            </div>
          </div>
          <div className="flex justify-center md:justify-end animate-fade-in-right"> {/* Adjusted for right alignment on desktop */}
            {/* Placeholder for mobile app screenshot */}
            <img src="/images/mobile-app-preview.png" alt="Revlo Mobile App" className="w-80 md:w-96 rounded-xl shadow-2xl border-4 border-white dark:border-gray-700 transform rotate-3 hover:rotate-0 transition-transform duration-500" />
          </div>
        </div>
      </section>

      {/* Pricing Section (Consider moving to a dedicated page later) */}
      <section id="pricing" className="py-24 px-6 md:px-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h3 className="text-4xl md:text-5xl font-bold mb-4 text-darkGray dark:text-gray-100">Qiimaha Xubinimada</h3>
          <p className="text-lg md:text-xl text-mediumGray dark:text-gray-400 max-w-3xl mx-auto">Dooro qorshaha ku habboon baahida ganacsigaaga. Bilaw bilaash, oo mar walba kor u qaad. Production Orders, Material Purchases, Company Chat, iyo dhammaan qalabka casri ah.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            { name: 'Basic', price: 'Bilaash', features: ['1 Isticmaale', '10 Mashruuc', '50 Kharash', 'Maamulka Bakhaarka (50 shay)', 'Basic Reports'], featured: false, delay: 0 },
            { name: 'Business', price: '$29/bil', features: ['5 Isticmaale', 'Mashaariic Aan Xadidnayn', 'Kharash Aan Xadidnayn', 'Maamulka Bakhaarka (Aan Xadidnayn)', 'Production Orders & BOM', 'Material Purchases', 'Multi-Account Management', 'Company Chat', 'Warbixino horumarsan', 'Expense Approval System'], featured: true, delay: 100 },
            { name: 'Enterprise', price: 'Gaarka ah', features: ['Isticmaale Aan Xadidnayn', 'Dhammaan features-ka Business', 'Advanced Manufacturing', 'Role-based Access Control', 'Maamule u gaar ah', 'Isku-dhexgalka API', 'Talo bixin shakhsi ah'], featured: false, delay: 200 },
          ].map((plan, i) => (
                <div key={i} className={`p-8 rounded-xl shadow-2xl border text-center transform hover:scale-105 transition duration-300 animate-fade-in-up ${plan.featured ? 'border-primary bg-primary/10' : 'border-lightGray dark:border-gray-700'}`} style={{ animationDelay: `${plan.delay}ms` }}>
                  <h4 className="text-2xl font-bold mb-4 text-darkGray dark:text-gray-100">{plan.name}</h4>
                  <p className="text-4xl font-extrabold mb-6 text-darkGray dark:text-gray-100">{plan.price}</p>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f, idx) => <li key={idx} className="text-mediumGray dark:text-gray-300">{f}</li>)}
                  </ul>
                  <Link href="/signup" className={`inline-block py-3 px-8 rounded-full font-semibold ${plan.featured ? 'bg-secondary text-white hover:bg-green-600' : 'border-2 border-primary text-primary hover:bg-primary hover:text-white'}`}>
                    {plan.featured ? 'Bilaaw Tijaabada Bilaashka' : 'Dooro Qorshaha'}
                  </Link>
                </div>
              ))}
        </div>
      </section>

      

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6 md:px-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h3 className="text-4xl md:text-5xl font-bold mb-4 text-darkGray dark:text-gray-100">Waxa Ay Dadku Ka Dhahaan Revlo</h3>
          <p className="text-lg md:text-xl text-mediumGray dark:text-gray-400 max-w-3xl mx-auto">
            Halkaan ka ogoow sababta Revlo uu u yahay doorashada koowaad ee ganacsato badan. Production Orders, Material Purchases, Company Chat, iyo dhammaan qalabka casri ah.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12">
          <TestimonialCard text="Revlo wuxuu si buuxda u bedelay sida aan u maamulo mashruucyadayda furniture-ka. Production Orders iyo BOM waa qalab aan laga maarmin!" name="Axmed Maxamed" role="Maamulaha, X‑Furniture" delay={0} />
          <TestimonialCard text="Maamulka kharashaadku waligiis ma ahayn mid sidan u fudud. Expense Approval System wuxuu ii sahlay inaan hubiyo kharashyada." name="Faadumo Cali" role="Qandiraasle, Y‑Construction" delay={100} />
          <TestimonialCard text="Company Chat iyo Material Purchases waa qalab aan laga maarmin. Waxaan hadda ka warqabaa wax kasta oo ku jira shirkadayda." name="Nuur Xassan" role="Ganacsade, Z‑Hardware" delay={200} />
        </div>
      </section>

      {/* Call to Action */}
      <section id="contact" className="py-24 px-6 md:px-16 bg-gradient-to-tr from-blue-700 to-primary text-white text-center">
        <div className="max-w-6xl mx-auto animate-fade-in-up">
          <h3 className="text-4xl md:text-5xl font-bold mb-6 drop-shadow-lg">Diyaar Ma U Tahay inaad Ganacsigaaga Kobciso?</h3>
          <p className="text-lg md:text-2xl mb-10 opacity-90 max-w-4xl mx-auto">
            Ku soo biir Revlo si aad maamulatid hawlahaaga maalinlaha ah. Isticmaal Production Orders, Material Purchases, Company Chat, iyo dhammaan qalabka casri ah ee ganacsigaaga u baahan yahay.
          </p>
          <Link href="/signup" className="bg-white text-primary py-4 px-12 rounded-full text-xl font-bold hover:bg-gray-100 transition-all duration-300 shadow-xl transform hover:scale-105">
            Bilaaw Bilaashkaaga
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-darkGray dark:bg-gray-900 text-white py-12 px-6 md:px-16 text-center border-t border-gray-700">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          <div>
            <h4 className="text-3xl font-bold mb-4">Revlo<span className="text-secondary">.</span></h4>
            <p className="text-mediumGray dark:text-gray-400 leading-relaxed">Maamulka Ganacsigaaga oo Fudud, hufan, oo casri ah. Production Orders, Material Purchases, Company Chat, iyo dhammaan qalabka casri ah.</p>
          </div>
          <div>
            <h4 className="text-xl font-bold mb-4">Links Degdeg ah</h4>
            <ul className="space-y-2 text-mediumGray dark:text-gray-400">
              <li><Link href="#features" className="hover:text-primary transition">Astaamaha</Link></li>
              <li><Link href="#how-it-works" className="hover:text-primary transition">Sida uu u Shaqeeyo</Link></li>
              <li><Link href="#solutions" className="hover:text-primary transition">Xalka</Link></li>
              <li><Link href="#pwa-install" className="hover:text-primary transition">Install App</Link></li>
              <li><Link href="#pricing" className="hover:text-primary transition">Qiimaha</Link></li>
              <li><Link href="#testimonials" className="hover:text-primary transition">Aragtiyada</Link></li>
              <li><Link href="/login" className="hover:text-primary transition">Gal</Link></li>
              <li><Link href="/signup" className="hover:text-primary transition">Isdiiwaangeli</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xl font-bold mb-4">Nala Soo Xiriir</h4>
            <ul className="space-y-2 text-mediumGray dark:text-gray-400">
                <li className="flex items-center justify-center md:justify-start space-x-2">
                    <Mail className="w-5 h-5 text-primary" /><span>info@revlo.com</span>
                </li>
                <li className="flex items-center justify-center md:justify-start space-x-2">
                    <Phone className="w-5 h-5 text-primary" /><span>+251 929 475 332</span>
                </li>
                <li className="flex items-center justify-center md:justify-start space-x-2">
                    <MapPin className="w-5 h-5 text-primary" /><span>Jigjiga, Somali galbeed</span>
                </li>
            </ul>
          </div>
        </div>
        <div className="text-mediumGray dark:text-gray-500 text-sm mt-12 pt-8 border-t border-gray-700">
          &copy; {new Date().getFullYear()} Revlo. Xuquuqda oo dhan waa ay xifdisan tahay.
        </div>
      </footer>
    </div>
  );
}