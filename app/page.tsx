'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Briefcase, DollarSign, Warehouse, Users, Truck, LineChart, Zap, LayoutDashboard, Coins, ChevronRight, ShieldCheck,
  Award, RefreshCw, Smartphone, Cloud, Bell, Mail, MapPin, Phone, MessageSquare, Plus, CheckCircle,
  Menu, X, Factory, Landmark, MessageCircle, Package, BarChart3, Download, Play, Star, ArrowRight, Check,
  CreditCard, Globe, Lock, TrendingUp, HelpCircle, ChevronDown, Clock, Building
} from 'lucide-react';
import LiveReviews from '@/components/LiveReviews';
import { ScrollReveal } from '@/components/ScrollReveal';
import ScrollProgressBar from '@/components/ScrollProgressBar';
import ParallaxBackground from '@/components/ParallaxBackground';
import { useNotifications } from '@/contexts/NotificationContext';
import dynamic from 'next/dynamic';

const Hero3DCube = dynamic(() => import('@/components/Hero3DCube'), { ssr: false });

// --- Components ---

/** 
 * Navbar Component 
 * Solid, authoritative, and branded.
 */
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Astaamaha', href: '#features' },
    { name: 'Xalka', href: '#solutions' },
    { name: 'Qiimaha', href: '#pricing' },
    { name: 'FAQ', href: '#faq' },
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-3 dark:bg-gray-900/95' : 'bg-transparent py-4 md:py-6 dark:bg-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2 group z-50">
            <div className={`text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-1 ${scrolled ? 'text-darkGray dark:text-white' : 'text-darkGray dark:text-white'}`}>
              Rev<span className="text-secondary">lo</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-bold hover:text-primary transition-colors hover:scale-105 transform duration-200 ${scrolled ? 'text-mediumGray dark:text-gray-300' : 'text-darkGray dark:text-gray-300'}`}
              >
                {link.name}
              </Link>
            ))}
            <Link href="/download" className="text-sm font-bold hover:text-primary transition-colors text-mediumGray dark:text-gray-300">
              App-ka
            </Link>
          </div>

          {/* CTA Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold hover:text-primary transition-colors text-darkGray dark:text-gray-200">
              Log In
            </Link>
            <Link href="/signup" className="relative overflow-hidden bg-primary text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 transition-all group">
              <span className="relative z-10 flex items-center gap-2 text-nowrap">Bilaaw Hadda <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></span>
              <div className="absolute inset-0 bg-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center z-50">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-darkGray dark:text-white p-2.5 -mr-2 rounded-xl focus:bg-gray-100 dark:focus:bg-gray-800 transition-all active:scale-95"
              aria-label="Menu"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-white dark:bg-gray-900 z-40 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} md:hidden flex flex-col pt-24 px-6`}>
        <div className="space-y-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="block text-2xl font-bold text-darkGray dark:text-white hover:text-primary border-b border-gray-100 dark:border-gray-800 pb-4"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <Link href="/download" className="block text-2xl font-bold text-darkGray dark:text-white hover:text-primary pb-4">App-ka</Link>

          <div className="pt-8 flex flex-col gap-4">
            <Link href="/login" className="w-full text-center text-lg font-bold py-4 bg-gray-100 dark:bg-gray-800 text-darkGray dark:text-white rounded-2xl active:scale-95 transition-transform" onClick={() => setIsOpen(false)}>
              Log In
            </Link>
            <Link href="/signup" className="w-full text-center text-lg bg-primary text-white py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-transform" onClick={() => setIsOpen(false)}>
              Bilaaw Hadda
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

const Hero = () => {
  return (
    <section className="relative min-h-[92vh] flex flex-col justify-center pt-32 pb-12 lg:pb-20 overflow-hidden bg-white dark:bg-gray-900/50">

      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-[300px] lg:w-[500px] h-[300px] lg:h-[500px] bg-primary/5 rounded-full blur-[80px] lg:blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[300px] lg:w-[500px] h-[300px] lg:h-[500px] bg-secondary/5 rounded-full blur-[80px] lg:blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-left w-full h-full">

        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-10 lg:gap-8 items-center">

          {/* Left Column: Content */}
          <div className="flex flex-col items-start animate-fade-in-up w-full">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 text-primary text-xs font-bold uppercase tracking-wider mb-6 lg:mb-8 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              ERP System-ka Ugu Casrisan
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-darkGray dark:text-white tracking-tight mb-6 lg:mb-8 leading-[1.15]">
              Hormari <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Ganacsigaaga</span>,<br />
              Maamul Mashaariicdaada.
            </h1>

            {/* Subtext */}
            <p className="max-w-2xl text-lg sm:text-xl text-mediumGray dark:text-gray-400 mb-8 lg:mb-10 leading-relaxed">
              Revlo ma aha kaliya software; waa lamaanahaaga guusha. Waxaanu kuu fududaynaynaa kakanaanta maamulka warshadaha iyo mashaariicda, si aad waqtigaaga ugu bixiso **Koboca** iyo **Tayada**.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href="/signup" className="flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-600 active:scale-95 transition-all shadow-xl shadow-primary/25 w-full sm:w-auto">
                Bilaaw Bilaash <ChevronRight size={20} />
              </Link>
              <Link href="/demo" className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-darkGray dark:text-white border-2 border-gray-100 dark:border-gray-700 px-8 py-4 rounded-2xl font-bold text-lg hover:border-secondary hover:text-secondary active:scale-95 transition-all shadow-sm w-full sm:w-auto">
                <Play size={20} className="fill-current" /> Daawo Demo
              </Link>
            </div>

            {/* Trust Indicator */}
            <div className="mt-8 flex items-center gap-4 text-sm text-mediumGray dark:text-gray-500 font-medium bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 w-full sm:w-auto">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`w-8 h-8 rounded-full border-2 border-white dark:border-gray-700 bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-[10px] overflow-hidden`}>
                    <Users size={16} className="text-gray-400" />
                  </div>
                ))}
              </div>
              <p>Waxaa aaminay <strong>500+ Shirkadood</strong> oo Bariga Afrika ah</p>
            </div>
          </div>

          {/* Right Column: 3D Cube */}
          <div className="relative h-[400px] w-full flex items-center justify-center lg:justify-end animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <Hero3DCube />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-radial from-blue-50/50 to-transparent dark:from-blue-900/10 -z-10 blur-3xl pointer-events-none"></div>
          </div>

        </div>

        {/* Dashboard Preview */}
        <ScrollReveal width="100%" direction="up" delay={0.4} distance={60} duration={0.8}>
          <div
            className="mt-16 sm:mt-24 relative max-w-6xl mx-auto group"
          >
            <div className="relative rounded-2xl md:rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-gray-200 dark:border-gray-700 overflow-hidden lg:group-hover:rotate-x-2 transition-transform duration-700 ease-out bg-gray-900 ring-1 ring-white/10 aspect-[16/9] flex items-center justify-center">
              <div className="absolute inset-0 overflow-hidden rounded-2xl md:rounded-3xl">
                <Image
                  src="/dashboard-preview.png"
                  alt="Revlo Dashboard Interface"
                  width={3840}
                  height={2160}
                  className="w-[118%] max-w-none h-auto object-cover -ml-[18%] -mt-[6%]"
                  priority
                  quality={100}
                />
              </div>

              {/* Overlay Reflection Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-white/5 to-transparent pointer-events-none mix-blend-overlay"></div>
            </div>

            {/* Background Glow */}
            <div className="absolute -inset-4 bg-primary/20 blur-3xl -z-10 rounded-[3rem] opacity-40"></div>
          </div>
        </ScrollReveal>

      </div>
    </section>
  );
};

// --- Statistics Section (NEW) ---
const Statistics = () => {
  const stats = [
    { label: 'Shirkadood', value: '500+', icon: Building },
    { label: 'Mashruuc La Maamulay', value: '1.2k+', icon: Briefcase },
    { label: 'Lacag La Badbaadiyay', value: '$2M+', icon: DollarSign },
    { label: 'Waqti La Tejeeyay', value: '99.9%', icon: Clock }
  ];

  return (
    <section className="py-12 md:py-20 bg-darkGray dark:bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/10 opacity-30"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal width="100%" direction="up" delay={0.2} distance={40}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="text-center group">
                  <div className="inline-flex p-3 rounded-2xl bg-white/10 mb-4 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                    <Icon className="text-white" size={24} />
                  </div>
                  <div className="text-4xl md:text-5xl font-black mb-2 tracking-tight">{stat.value}</div>
                  <div className="text-gray-400 font-medium text-sm uppercase tracking-wider">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

const TrustedBy = () => (
  <div className="py-12 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800/50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <ScrollReveal direction="up" delay={0.2} distance={20}>
        <p className="text-xs font-bold text-mediumGray dark:text-gray-500 uppercase tracking-widest mb-8">Waxaa ku kalsoon shirkadaha ugu waaweyn</p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 hover:opacity-100 transition-opacity duration-500 grayscale hover:grayscale-0">
          {['Dahabshiil', 'Hass Petroleum', 'Somtel', 'Red Sea Construction', 'Jigjiga Export'].map((name, i) => (
            <div key={i} className="flex items-center gap-2 font-bold text-lg md:text-xl text-darkGray dark:text-white">
              <div className="w-8 h-8 rounded bg-darkGray dark:bg-gray-700 flex items-center justify-center text-white text-xs">{name[0]}</div>
              {name}
            </div>
          ))}
        </div>
      </ScrollReveal>
    </div>
  </div>
);

const HowItWorks = () => {
  const steps = [
    { id: 1, title: 'Is-diiwaangeli', desc: 'Koonto sameyso daqiiqado gudahood. Waa bilaash in la bilaabo.', icon: Users },
    { id: 2, title: 'Habee Ganacsigaaga', desc: 'Geli xogta shirkaddaada, socodka shaqada, iyo mashaariicda aad hadda wado.', icon: Briefcase },
    { id: 3, title: 'Bilow Maamulka', desc: 'La soco dhaqdhaqaaqa, iibka, iyo wax-soo-saarka si toos ah dashboard-kaaga.', icon: LineChart },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-gray-50 dark:bg-gray-800/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Sticky Header */}
        <div className="sticky top-[80px] z-30 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-md py-4 rounded-xl mb-12 shadow-sm">
          <ScrollReveal width="100%" direction="up" delay={0.1}>
            <div className="text-center">
              <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-1">Habsami u Socodka</h2>
              <h3 className="text-3xl md:text-4xl font-extrabold text-darkGray dark:text-white">Saddex Tallaabo</h3>
            </div>
          </ScrollReveal>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative mt-16">
          <div className="hidden md:block absolute top-24 left-[16%] right-[16%] h-0.5 bg-gray-200 dark:bg-gray-700 -z-10"></div>

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <ScrollReveal key={step.id} width="100%" direction="up" delay={0.2 + (index * 0.1)} className="h-full">
                <div className="relative flex flex-col items-center text-center group h-full">
                  <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center mb-6 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300 relative z-10">
                    <Icon size={32} />
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white font-bold text-sm border-4 border-gray-50 dark:border-gray-800">
                      {step.id}
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-darkGray dark:text-white mb-3">{step.title}</h4>
                  <p className="text-mediumGray dark:text-gray-400 max-w-xs leading-relaxed">{step.desc}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const Features = () => {
  return (
    <section id="features" className="py-24 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-20">
          {/* Left Header with Sticky Effect */}
          <div className="lg:col-span-2">
            <div className="sticky top-32">
              <ScrollReveal width="100%" direction="right" delay={0.2}>
                <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-4">Awoodaha Nidaamka</h2>
                <h3 className="text-4xl md:text-5xl font-extrabold text-darkGray dark:text-white mb-6 leading-tight">
                  Wax Walba <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Hal Meel.</span>
                </h3>
                <p className="text-xl text-mediumGray dark:text-gray-400 mb-8 leading-relaxed">
                  Ka guuro waraaqaha iyo Excel-ka. Revlo wuxuu isugu keenay wax walba oo ganacsigaagu u baahan yahay, laga bilaabo mashaariicda ilaa HR.
                </p>
                <Link href="/signup" className="hidden lg:inline-flex items-center gap-2 text-primary font-bold text-lg hover:gap-3 transition-all">
                  Arag Dhammaan Astaamaha <ArrowRight size={20} />
                </Link>
              </ScrollReveal>
            </div>
          </div>

          {/* Right Grid */}
          <div className="lg:col-span-3 grid sm:grid-cols-2 gap-6">
            <FeatureCard icon={<Briefcase />} title="Maamulka Mashruuca" desc="Jadwalka, Miisaaniyadda, iyo Hawlaha." delay={0} />
            <FeatureCard icon={<Factory />} title="Warshadaha" desc="Production, Raw Materials, iyo Costing." delay={0.1} />
            <FeatureCard icon={<Landmark />} title="Xisaabaadka" desc="Invoicing, Payroll, iyo Warbixino Maaliyadeed." delay={0.2} />
            <FeatureCard icon={<Users />} title="HR & Shaqaalaha" desc="Mushaharka, Gunnada, iyo Fasaxyada." delay={0.3} />
            <FeatureCard icon={<Truck />} title="Supply Chain" desc="Iibiyayaasha iyo Kaydka (Inventory)." delay={0.4} />
            <FeatureCard icon={<Globe />} title="Cloud & Mobile" desc="Ka shaqee meel kasta, waqti kasta." delay={0.5} />
          </div>

          <div className="lg:hidden text-center mt-8">
            <Link href="/signup" className="inline-flex items-center gap-2 text-primary font-bold text-lg">
              Arag Dhammaan Astaamaha <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: number }) => (
  <ScrollReveal width="100%" direction="up" delay={delay} className="h-full">
    <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-transparent hover:border-primary/20 hover:bg-white dark:hover:bg-gray-750 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group h-full">
      <div className="w-12 h-12 bg-white dark:bg-gray-700/50 rounded-xl flex items-center justify-center text-primary shadow-sm mb-4 group-hover:bg-primary group-hover:text-white transition-all">
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <h4 className="text-lg font-bold text-darkGray dark:text-white mb-2">{title}</h4>
      <p className="text-mediumGray dark:text-gray-400 text-sm leading-relaxed">{desc}</p>
    </div>
  </ScrollReveal>
);

const Solutions = () => {
  const items = [
    {
      title: 'Warshado',
      desc: 'Xisaabi qiimaha dhabta ah (Cost Per Unit) oo yaree khasaaraha alaabta.',
      icon: <Factory />,
    },
    {
      title: 'Dhismaha',
      desc: 'Maamul boqolaalka shaqaale, qalabka, iyo kharashka goobta shaqada.',
      icon: <Warehouse />,
    },
    {
      title: 'Adeeg Bixinta',
      desc: 'Qandaraasyada iyo biilasha macaamiisha hal meel ku maamul.',
      icon: <Briefcase />,
    },
  ];

  return (
    <section id="solutions" className="py-24 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 text-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Sticky Header */}
        <div className="sticky top-[80px] z-30 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-md py-4 rounded-xl mb-12 shadow-sm inline-block px-8 w-full max-w-4xl">
          <ScrollReveal width="100%" direction="up" delay={0.1}>
            <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-3">Xalka Revlo</h2>
            <h3 className="text-3xl md:text-4xl font-extrabold text-darkGray dark:text-white">Ganacsi Kasta Waa Qaabili Karnaa</h3>
          </ScrollReveal>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-12">
          {items.map((item, idx) => (
            <ScrollReveal key={item.title} width="100%" direction="up" delay={0.2 + (idx * 0.1)} className="h-full">
              <div
                className="p-8 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-2xl transition-all duration-300 group text-left h-full"
              >
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  {React.cloneElement(item.icon as any, { size: 28 })}
                </div>
                <h4 className="text-2xl font-bold text-darkGray dark:text-white mb-3">{item.title}</h4>
                <p className="text-mediumGray dark:text-gray-400 leading-relaxed font-medium">{item.desc}</p>
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center text-primary font-bold text-sm cursor-pointer hover:underline">
                  Baro Sida <ChevronRight size={16} />
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

const Pricing = () => {
  const plans = [
    {
      name: 'Starter',
      description: 'Shirkado yaryar',
      price: 'Free',
      icon: Zap,
      features: ['1 User', 'Basic Projects', 'Expenses'],
      popular: false,
      gradient: 'from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900',
    },
    {
      name: 'Professional',
      description: 'Warshadaha',
      price: '$49',
      icon: TrendingUp,
      features: ['5 Users', 'Manufacturing', 'HR & Payroll', 'Priority Support'],
      popular: true,
      gradient: 'from-primary via-blue-500 to-primary',
    },
    {
      name: 'Enterprise',
      description: 'Shirkado Waaweyn',
      price: 'Talk to Sales',
      icon: Award,
      features: ['Unlimited Users', 'API Access', 'Custom Training', 'Dedicated Manager'],
      popular: false,
      gradient: 'from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20',
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">

        {/* Sticky Header */}
        <div className="sticky top-[80px] z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md py-4 rounded-xl mb-16 shadow-none flex justify-center w-full">
          <ScrollReveal width="fit-content" direction="up" delay={0.1}>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-extrabold text-darkGray dark:text-white mb-2">Qiimaha oo Fudud</h2>
              <p className="text-xl text-mediumGray dark:text-gray-400">Ka bilaab bilaash. U koro sidaad u baahato.</p>
            </div>
          </ScrollReveal>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-12 text-left">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <ScrollReveal key={plan.name} width="100%" direction="up" delay={0.2 + (index * 0.1)} className={`h-full ${plan.popular ? 'md:-mt-4 md:mb-4 z-10' : ''}`}>
                <div className={`relative group h-full`}>
                  <div className={`relative h-full bg-gradient-to-br ${plan.gradient} rounded-3xl border ${plan.popular ? 'border-primary' : 'border-gray-200 dark:border-gray-700'} p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col`}>
                    <div className={`mb-6 inline-flex items-center justify-center w-14 h-14 rounded-xl bg-white dark:bg-gray-800 shadow-md ${plan.popular ? 'text-primary' : 'text-darkGray'}`}>
                      <Icon size={28} />
                    </div>
                    <h3 className={`text-2xl font-bold ${plan.popular ? 'text-white' : 'text-darkGray dark:text-white'} mb-2`}>{plan.name}</h3>
                    <p className={`text-sm mb-6 ${plan.popular ? 'text-white/90' : 'text-mediumGray dark:text-gray-400'}`}>{plan.description}</p>
                    <div className={`text-3xl font-black mb-8 ${plan.popular ? 'text-white' : 'text-darkGray dark:text-white'}`}>{plan.price}</div>

                    <ul className="space-y-4 mb-8 flex-1">
                      {plan.features.map((f, i) => (
                        <li key={i} className={`flex items-center gap-3 text-sm font-medium ${plan.popular ? 'text-white' : 'text-darkGray dark:text-gray-300'}`}>
                          <CheckCircle size={18} className={plan.popular ? 'text-white' : 'text-green-500'} /> {f}
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/signup"
                      className={`block w-full text-center py-4 rounded-xl font-bold transition-all ${plan.popular ? 'bg-white text-primary hover:bg-gray-50' : 'bg-darkGray text-white hover:bg-black'}`}
                    >
                      Dooro Qorshaha
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  );
};

// --- FAQ Section (NEW) ---
const FAQ = () => {
  const faqs = [
    { q: "Ma u baahanahay internet joogto ah?", a: "Maya. Revlo wuxuu leeyahay 'Offline Mode'. Waad shaqayn kartaa internet la'aan, markaad hesho internet-na xogta ayaa synchronise samaynaysa." },
    { q: "Ma isticmaali karaa Mobile?", a: "Haa. Revlo waa PWA (Progressive Web App). Waxaad ku shuban kartaa mobile-kaaga (Android & iOS) adigoo ka heleya khibrad liidata." },
    { q: "Xogtaydu ma ammaan baa?", a: "Haa. Xogtaada waxaa lagu keydiyaa Cloud Servers oo aad u ammaan ah (Encrypted). Adiga kaliya ayaa geli kara." },
    { q: "Ma jiraan kharashyo qarsoon?", a: "Maya. Qiimaha aad aragto waa kaas. Ma jiraan wax qarsoon. Support-kuna waa bilaash." }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-gray-50 dark:bg-gray-800/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Sticky Header */}
        <div className="sticky top-[80px] z-30 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-md py-4 rounded-xl mb-12 shadow-sm text-center">
          <ScrollReveal width="100%" direction="up" delay={0.1}>
            <h3 className="text-3xl font-bold text-darkGray dark:text-white">Su'aalaha Badanaa La Iswaydiiyo</h3>
          </ScrollReveal>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <ScrollReveal key={i} width="100%" direction="up" delay={0.2 + (i * 0.1)}>
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-bold text-lg text-darkGray dark:text-white">{faq.q}</span>
                  <ChevronDown size={20} className={`text-mediumGray transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`} />
                </button>
                <div className={`transition-all duration-300 ease-in-out ${openIndex === i ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="px-6 pb-6 text-mediumGray dark:text-gray-400 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Final CTA Section (NEW) ---
const FinalCTA = () => (
  <section className="py-24 bg-primary text-white relative overflow-hidden">
    {/* Abstract Backgrounds */}
    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
      <ScrollReveal width="100%" direction="up" delay={0.1}>
        <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">Diyaar Ma U Tahay Inaad Kobciso Ganacsigaaga?</h2>
        <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto">Ku biir 500+ shirkadood oo maanta isticmaala nidaamka Revlo. Waa bilaash in la tijaabiyo.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/signup" className="bg-white text-primary px-10 py-4 rounded-2xl font-bold text-xl hover:bg-gray-100 shadow-xl transition-transform hover:-translate-y-1">
            Bilaaw Hadda
          </Link>
          <Link href="/contact" className="bg-transparent border-2 border-white text-white px-10 py-4 rounded-2xl font-bold text-xl hover:bg-white/10 transition-colors">
            Nala Soo Xiriir
          </Link>
        </div>
      </ScrollReveal>
    </div>
  </section>
);

const PWAInstall = () => {
  return (
    <section id="download" className="py-24 bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <ScrollReveal width="100%" direction="left" delay={0.2}>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-primary text-xs font-bold uppercase tracking-wider mb-6">
                <Smartphone size={14} /> Mobile & Desktop
              </div>
              <h3 className="text-3xl md:text-5xl font-bold text-darkGray dark:text-white mb-6">
                Ku shubo Revlo <br />
                <span className="text-secondary">Qalab Kasta.</span>
              </h3>
              <p className="text-lg text-mediumGray dark:text-gray-400 mb-8 leading-relaxed">
                Revlo waa **Progressive Web App (PWA)**. Taas macnaheedu waa inaad ku isticmaali karto Computer-kaaga, Tablet-kaaga, ama Smart Phone-kaaga adiga oo aan u baahnayn App Store.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-md text-primary">
                    <Cloud size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-darkGray dark:text-white text-lg">Wuxuu Shaqeeyaa Offline</h4>
                    <p className="text-mediumGray dark:text-gray-400">Xitaa haddii internet-ku go'o, shaqadaadu ma istaagayso. Xogtu way synchronise-gareysaa marka aad online noqoto.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-md text-secondary">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-darkGray dark:text-white text-lg">Xawaare Sare</h4>
                    <p className="text-mediumGray dark:text-gray-400">Waxaa loo dhisay inuu ahaado mid fudud oo degdeg ah, iyadoo aan culeys saarayn qalabkaaga.</p>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button className="bg-darkGray text-white px-6 py-3 rounded-lg font-bold hover:bg-black transition-colors flex items-center gap-2">
                  <Download size={20} /> Install App
                </button>
              </div>
            </div>
          </ScrollReveal>

          {/* Visual representation of Cross-platform */}
          <ScrollReveal width="100%" direction="right" delay={0.4}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary to-secondary rounded-full filter blur-[100px] opacity-20"></div>
              <div className="relative bg-black border border-gray-800 rounded-[2.5rem] shadow-2xl p-2 transform rotate-2 hover:rotate-0 transition-all duration-500 max-w-sm mx-auto">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-black rounded-b-2xl z-20"></div>
                <div className="relative aspect-[9/19.5] bg-gray-900 rounded-[2rem] overflow-hidden border border-gray-800">
                  <Image
                    src="/pwa-preview.png"
                    alt="Revlo Mobile App Interface"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
// Forced update for PWA image

const Reviews = () => {
  return (
    <section className="py-24 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal width="100%" direction="up" delay={0.1}>
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-darkGray dark:text-white mb-4">Waxa Ay Macaamiishu Dhahaan</h3>
            <p className="text-mediumGray dark:text-gray-400">Ku biir boqolaal shirkadood oo ku horumaray isticmaalka Revlo.</p>
          </div>
        </ScrollReveal>

        {/* Re-integrated the original component logic here or import it if compatible */}
        <ScrollReveal width="100%" direction="up" delay={0.2}>
          <div className="bg-lightGray/20 dark:bg-gray-800 p-8 rounded-3xl">
            <LiveReviews />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

const Footer = () => {
  const { addNotification } = useNotifications();

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    addNotification({
      type: 'success',
      message: `${type} copied to clipboard!`
    });
  };

  return (
    <footer className="bg-darkGray text-white py-16 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2">
          <Link href="/" className="text-3xl font-bold mb-6 block">Revlo<span className="text-secondary">.</span></Link>
          <p className="text-gray-400 max-w-sm mb-6 leading-relaxed">
            Nidaamka koowaad ee ERP ee loogu talagalay horumarinta ganacsiga Bariga Afrika.
            Tayada, Hufnaanta, iyo Tiknoolajiyadda.
          </p>
          <div className="flex gap-4">
            {/* Socials placeholder */}
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary transition-colors cursor-pointer"><Globe size={20} /></div>
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary transition-colors cursor-pointer"><Mail size={20} /></div>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-lg mb-6 text-white border-b border-gray-700 pb-2 inline-block">Bogagga</h4>
          <ul className="space-y-3 text-gray-400">
            <li><Link href="#features" className="hover:text-primary transition-colors">Astaamaha</Link></li>
            <li><Link href="#pricing" className="hover:text-primary transition-colors">Qiimaha</Link></li>
            <li><Link href="/login" className="hover:text-primary transition-colors">Gal (Login)</Link></li>
            <li><Link href="/signup" className="hover:text-primary transition-colors">Isdiiwaangeli</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-lg mb-6 text-white border-b border-gray-700 pb-2 inline-block">Nala Xiriir</h4>
          <ul className="space-y-3 text-gray-400">
            <li
              onClick={() => handleCopy('info@revlo.com', 'Email')}
              className="flex items-center gap-3 cursor-pointer hover:text-white transition-colors"
            >
              <Mail size={18} className="text-primary" /> info@revlo.com
            </li>
            <li
              onClick={() => handleCopy('+251 929 475 332', 'Phone number')}
              className="flex items-center gap-3 cursor-pointer hover:text-white transition-colors"
            >
              <Phone size={18} className="text-primary" /> +251 929 475 332
            </li>
            <li className="flex items-center gap-3"><MapPin size={18} className="text-primary" /> Jigjiga, Somali Region</li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <p>&copy; {new Date().getFullYear()} Revlo. Xuquuqda oo dhan waa ay xifdisan tahay.</p>
        <div className="flex gap-6">
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
        </div>
      </div>
    </footer>
  );
};


export default function HomePage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 font-sans selection:bg-primary/30 selection:text-primary overflow-x-hidden">
      <ScrollProgressBar />
      {/* Navbar moved inside specific relative container if needing sticky? No, Navbar is fixed. */}
      <Navbar />

      {/* Background Elements */}
      <ParallaxBackground />

      <Hero />
      <Statistics />
      <TrustedBy />
      <div className="relative z-10 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <HowItWorks />
        <Features />
        <Solutions />
        <Pricing />
        <FAQ />
      </div>
      <PWAInstall />
      <Reviews />
      <FinalCTA />
      <Footer />
    </main>
  );
}