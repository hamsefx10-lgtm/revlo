'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Briefcase, DollarSign, Warehouse, Users, Truck, LineChart, Zap, LayoutDashboard, Coins, ChevronRight, ShieldCheck,
  Award, RefreshCw, Smartphone, Cloud, Bell, Mail, MapPin, Phone, MessageSquare, Plus, CheckCircle,
  Menu, X, Factory, Landmark, MessageCircle, Package, BarChart3, Download, Play, Star, ArrowRight, Check,
  CreditCard, Globe, Lock
} from 'lucide-react';
import LiveReviews from '@/components/LiveReviews';

// --- Components ---

/** 
 * Navbar Component 
 * Solid, authoritative, and branded. Not floating glass.
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
    { name: 'Sida uu u Shaqeeyo', href: '#how-it-works' },
    { name: 'Xalka', href: '#solutions' },
    { name: 'Qiimaha', href: '#pricing' },
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm py-3 dark:bg-gray-900/95' : 'bg-transparent py-5 dark:bg-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className={`text-2xl font-extrabold tracking-tight flex items-center gap-1 ${scrolled ? 'text-darkGray dark:text-white' : 'text-darkGray dark:text-white'}`}>
              Rev<span className="text-secondary">lo</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
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
              Desktop App
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className={`text-sm font-bold hover:text-primary transition-colors ${scrolled ? 'text-darkGray dark:text-white' : 'text-darkGray dark:text-white'}`}>
              Log In
            </Link>
            <Link href="/signup" className="relative overflow-hidden bg-primary text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg hover:shadow-primary/40 hover:-translate-y-0.5 transition-all group">
              <span className="relative z-10 flex items-center gap-2">Bilaaw Hadda <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></span>
              <div className="absolute inset-0 bg-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-darkGray dark:text-white hover:text-primary focus:outline-none p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 absolute w-full shadow-xl animate-fade-in-up">
          <div className="px-4 py-6 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="block text-lg font-bold text-darkGray dark:text-gray-200 hover:text-primary px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Link href="/download" className="block text-lg font-bold text-darkGray dark:text-gray-200 hover:text-primary px-4 py-2">Desktop App</Link>
            <hr className="border-gray-100 dark:border-gray-800 my-2" />
            <div className="flex flex-col gap-3 px-2">
              <Link href="/login" className="w-full text-center text-darkGray font-bold py-3 bg-gray-100 rounded-xl">Log In</Link>
              <Link href="/signup" className="w-full text-center bg-primary text-white py-3 rounded-xl font-bold shadow-lg">Bilaaw Hadda</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

const Interactive3DBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    // Shape definitions
    const numShapes = 20;
    const connectionDistance = 200;
    const mouseDistance = 300;

    // Colors
    const colors = ['#3498DB', '#2ECC71']; // Primary, Secondary

    class Shape3D {
      x: number;
      y: number;
      z: number;
      size: number;
      type: 'cube' | 'pyramid';
      color: string;
      dx: number;
      dy: number;
      rotX: number;
      rotY: number;
      rotSpeed: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.z = Math.random() * 2 + 1; // Depth scale
        this.size = Math.random() * 20 + 15;
        this.type = Math.random() > 0.5 ? 'cube' : 'pyramid';
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.dx = (Math.random() - 0.5) * 0.5;
        this.dy = (Math.random() - 0.5) * 0.5;
        this.rotX = Math.random() * Math.PI * 2;
        this.rotY = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.02;
      }

      update(mouseX: number, mouseY: number) {
        // Auto move
        this.x += this.dx;
        this.y += this.dy;
        this.rotX += this.rotSpeed;
        this.rotY += this.rotSpeed;

        // Bounce off edges
        if (this.x < 0 || this.x > width) this.dx *= -1;
        if (this.y < 0 || this.y > height) this.dy *= -1;

        // Mouse Interaction (Magnetic Pull / Repel)
        const dx = this.x - mouseX;
        const dy = this.y - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouseDistance) {
          const force = (mouseDistance - distance) / mouseDistance;
          // Gentle push away for "activity"
          this.x += (dx / distance) * force * 2;
          this.y += (dy / distance) * force * 2;
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        // Simple 3D Projection Calculation
        const project = (x: number, y: number, z: number) => {
          // Rotate
          const cosX = Math.cos(this.rotX), sinX = Math.sin(this.rotX);
          const cosY = Math.cos(this.rotY), sinY = Math.sin(this.rotY);

          let ry = y * cosX - z * sinX;
          let rz = y * sinX + z * cosX;
          let rx = x * cosY + rz * sinY;
          let rz2 = z * cosY - x * sinY;

          const scale = 300 / (300 + rz2 + 100); // Perspective
          return {
            x: this.x + rx * scale,
            y: this.y + ry * scale
          };
        };

        const s = this.size;

        if (this.type === 'cube') {
          const nodes = [
            [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
            [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s]
          ];
          const p = nodes.map(n => project(n[0], n[1], n[2]));

          // Draw edges
          const edges = [
            [0, 1], [1, 2], [2, 3], [3, 0], // Front face
            [4, 5], [5, 6], [6, 7], [7, 4], // Back face
            [0, 4], [1, 5], [2, 6], [3, 7]  // Connecting lines
          ];
          edges.forEach(e => {
            ctx.moveTo(p[e[0]].x, p[e[0]].y);
            ctx.lineTo(p[e[1]].x, p[e[1]].y);
          });

        } else if (this.type === 'pyramid') {
          const nodes = [
            [0, -s, 0],   // Top
            [-s, s, -s], [s, s, -s], [s, s, s], [-s, s, s] // Base
          ];
          const p = nodes.map(n => project(n[0], n[1], n[2]));

          // Base
          ctx.moveTo(p[1].x, p[1].y); ctx.lineTo(p[2].x, p[2].y);
          ctx.lineTo(p[3].x, p[3].y); ctx.lineTo(p[4].x, p[4].y);
          ctx.lineTo(p[1].x, p[1].y);
          // Sides
          [1, 2, 3, 4].forEach(i => {
            ctx.moveTo(p[0].x, p[0].y);
            ctx.lineTo(p[i].x, p[i].y);
          });
        }

        ctx.stroke();
      }
    }

    // Initialize shapes
    const shapes: Shape3D[] = [];
    for (let i = 0; i < numShapes; i++) {
      shapes.push(new Shape3D());
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const mouseObj = { x: 0, y: 0 };
    const onMove = (e: MouseEvent) => { mouseObj.x = e.clientX; mouseObj.y = e.clientY; };
    window.addEventListener('mousemove', onMove);

    const animateWithMouse = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw faint grid first
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.1)';
      ctx.lineWidth = 1;
      // Draw shapes
      shapes.forEach(shape => {
        shape.update(mouseObj.x, mouseObj.y);
        shape.draw(ctx);
      });

      // Draw Connections
      ctx.lineWidth = 0.5;
      for (let i = 0; i < shapes.length; i++) {
        for (let j = i + 1; j < shapes.length; j++) {
          const dx = shapes[i].x - shapes[j].x;
          const dy = shapes[i].y - shapes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDistance) {
            const opacity = 1 - (dist / connectionDistance);
            ctx.strokeStyle = `rgba(52, 152, 219, ${opacity * 0.4})`;
            ctx.beginPath();
            ctx.moveTo(shapes[i].x, shapes[i].y);
            ctx.lineTo(shapes[j].x, shapes[j].y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animateWithMouse);
    }
    const animId = requestAnimationFrame(animateWithMouse);

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 bg-gradient-to-b from-white via-blue-50/30 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />;
};

/**
 * Hero Section
 * Uses Interactive3DBackground
 */
const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center pt-32 pb-20 overflow-hidden">

      {/* The New Canvas Background */}
      <Interactive3DBackground />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center pointer-events-none">
        {/* Pointer events none on container so mouse touches canvas, but re-enable on buttons */}

        {/* Badge - Solid Secondary Color */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20 border border-secondary/30 text-secondary text-xs font-bold uppercase tracking-wider mb-8 animate-fade-in-up pointer-events-auto">
          <CheckCircle size={14} className="text-secondary fill-current" />
          ERP System Casri Ah
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-darkGray dark:text-white tracking-tight mb-8 leading-tight animate-fade-in-up select-none" style={{ animationDelay: '100ms' }}>
          Maamul Ganacsigaaga, <br />
          <span className="text-primary pb-2 inline-block relative">
            Si Hufan.
            <div className="absolute bottom-2 left-0 w-full h-3 bg-primary/10 -z-10 -skew-x-12"></div>
          </span>
        </h1>

        <p className="max-w-3xl mx-auto text-xl text-mediumGray dark:text-gray-400 mb-10 leading-relaxed animate-fade-in-up select-none" style={{ animationDelay: '200ms' }}>
          Revlo waa nidaam dhamaystiran oo isku xiraya Mashaariicda, Iibka, Maaliyadda, iyo Shaqaalahaaga. Ka dhig ganacsigaaga mid la jaan-qaada tiknoolajiyadda casriga ah.
        </p>

        {/* Buttons - Interactive */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up pointer-events-auto" style={{ animationDelay: '300ms' }}>
          <Link href="/signup" className="flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-600 hover:-translate-y-1 transition-all shadow-xl shadow-blue-500/20">
            Bilaaw Bilaash <ChevronRight size={20} />
          </Link>
          <Link href="/demo" className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-darkGray dark:text-white border-2 border-gray-100 dark:border-gray-700 px-8 py-4 rounded-xl font-bold text-lg hover:border-secondary hover:text-secondary hover:-translate-y-1 transition-all shadow-sm">
            <Play size={20} className="fill-current" /> Daawo Demo
          </Link>
        </div>

        {/* Dashboard Preview */}
        <div
          className="mt-16 sm:mt-24 relative max-w-6xl mx-auto animate-fade-in-up pointer-events-auto transform hover:scale-[1.01] transition-transform duration-500"
          style={{ animationDelay: '500ms' }}
        >
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-200 dark:border-gray-700 overflow-hidden ring-1 ring-black/5">
            {/* Header Bar */}
            <div className="h-8 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600 flex items-center gap-2 px-4">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div className="aspect-[16/9] bg-white dark:bg-gray-900 flex items-center justify-center group overflow-hidden relative">
              {/* Abstract Representation of Dashboard for Preview */}
              <div className="grid grid-cols-4 gap-4 p-8 w-full h-full opacity-60">
                <div className="col-span-1 bg-blue-50 h-32 rounded-xl"></div>
                <div className="col-span-1 bg-green-50 h-32 rounded-xl"></div>
                <div className="col-span-2 bg-gray-50 h-32 rounded-xl"></div>
                <div className="col-span-3 bg-gray-50 h-64 rounded-xl"></div>
                <div className="col-span-1 bg-blue-50 h-64 rounded-xl"></div>
              </div>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-24 h-24 bg-white shadow-xl rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-500">
                  <LayoutDashboard size={48} className="text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-darkGray dark:text-white">Dashboard Preview</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Trusted By Ticker */}
        <TrustedBy />
      </div>
    </section>
  );
};

const TrustedBy = () => (
  <div className="pt-20 pb-10 border-b border-gray-100 dark:border-gray-800/50 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
    <p className="text-sm font-semibold text-mediumGray dark:text-gray-500 uppercase tracking-widest mb-8">Waxaa ku kalsoon shirkadaha ugu waaweyn</p>
    <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
      {['Construction Co', 'Manufacturing Inc', 'Global Trade', 'BuildRight Ltd', 'TechFlow'].map((name, i) => (
        <div key={i} className="flex items-center gap-2 font-bold text-xl text-darkGray dark:text-white">
          <div className="w-8 h-8 rounded bg-darkGray dark:bg-gray-700"></div>
          {name}
        </div>
      ))}
    </div>
  </div>
);

/**
 * How It Works Section - New Addition
 */
const HowItWorks = () => {
  const steps = [
    { id: 1, title: 'Is-diiwaangeli', desc: 'Koonto sameyso daqiiqado gudahood. Waa bilaash in la bilaabo.', icon: <Users /> },
    { id: 2, title: 'Habee Ganacsigaaga', desc: 'Geli xogta shirkaddaada, sida shaqaalaha iyo mashaariicda.', icon: <Briefcase /> },
    { id: 3, title: 'Bilow Maamulka', desc: 'La soco dhaqdhaqaaqa, iibka, iyo wax-soo-saarka si toos ah.', icon: <LineChart /> },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-gray-50 dark:bg-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-2">Habsami u Socodka</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-darkGray dark:text-white">Sida uu u Shaqeeyo</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.id} className="relative bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center group hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary group-hover:scale-110 transition-transform">
                {React.cloneElement(step.icon, { size: 32 })}
              </div>
              <div className="absolute top-8 right-8 text-6xl font-black text-gray-100 dark:text-gray-700 -z-0 select-none opacity-50">{step.id}</div>
              <h4 className="text-xl font-bold text-darkGray dark:text-white mb-3 relative z-10">{step.title}</h4>
              <p className="text-mediumGray dark:text-gray-400 relative z-10">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Features Grid
 * Clean cards, clear iconography.
 */
const Features = () => {

  return (
    <section id="features" className="py-24 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-primary font-bold tracking-wide uppercase text-sm mb-2">Awoodaha Nidaamka</h2>
          <h3 className="text-3xl md:text-5xl font-bold text-darkGray dark:text-white mb-6">Wax Walba Hal Meel.</h3>
          <p className="text-xl text-mediumGray dark:text-gray-400">
            Looma baahna software kala duwan. Revlo wuxuu isugu keenay wax walba oo ganacsigaagu u baahan yahay.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Briefcase />}
            title="Maamulka Mashruuca"
            desc="La soco horumarka mashaariicda, qorshee hawlaha (Tasks), oo maamul miisaaniyadda mashruuc kasta si gaar ah."
            delay={0}
          />
          <FeatureCard
            icon={<Factory />}
            title="Warshadaha & Soo-saarka"
            desc="Maamul 'Production Orders', xisaabi kharashka alaabta ceeriin (Raw Materials), oo hel warbixin faahfaahsan."
            delay={100}
          />
          <FeatureCard
            icon={<Landmark />}
            title="Maamulka Maaliyadda"
            desc="Diiwaan geli dakhliga iyo kharashka. Isku xir Bankiyada iyo Mobile Money. Hel 'Profit & Loss' degdeg ah."
            delay={200}
          />
          <FeatureCard
            icon={<Users />}
            title="HR & Shaqaalaha"
            desc="Maamul xogta shaqaalaha, xaadirinta, mushaharka, iyo gunooyinka si fudud oo otomaatig ah."
            delay={300}
          />
          <FeatureCard
            icon={<Truck />}
            title="Silsiladda Sahayda"
            desc="Maamul iibiyayaasha (Vendors), dalabaadka (Purchase Orders), iyo keenista alaabta."
            delay={400}
          />
          <FeatureCard
            icon={<MessageCircle />}
            title="Wada-shaqeynta Kooxda"
            desc="Nidaam Chat oo gudaha ah. Wadaag faylasha, sawirada, iyo warbixinada adiga oo aan ka bixin nidaamka."
            delay={500}
          />
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: number }) => (
  <div className="p-8 bg-lightGray/30 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-primary/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl transition-all duration-300 group" style={{ animationDelay: `${delay}ms` }}>
    <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-xl flex items-center justify-center text-primary shadow-sm mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
      {React.cloneElement(icon, { size: 24 })}
    </div>
    <h4 className="text-xl font-bold text-darkGray dark:text-white mb-3">{title}</h4>
    <p className="text-mediumGray dark:text-gray-400 leading-relaxed">{desc}</p>
  </div>
);


/**
 * PWA Install Section - Restored
 * Critical feature for the user.
 */
const PWAInstall = () => {
  return (
    <section id="download" className="py-24 bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider mb-6">
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

          {/* Visual representation of Cross-platform */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary to-secondary rounded-full filter blur-[100px] opacity-20"></div>
            <div className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-4 transform rotate-2 hover:rotate-0 transition-all duration-500">
              <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-900 rounded-xl flex items-center justify-center">
                <span className="text-gray-400">App Interface Preview</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Reviews Section - Wrapper for LiveReviews
 */
const Reviews = () => {
  return (
    <section className="py-24 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-darkGray dark:text-white mb-4">Waxa Ay Macaamiishu Dhahaan</h3>
          <p className="text-mediumGray dark:text-gray-400">Ku biir boqolaal shirkadood oo ku horumaray isticmaalka Revlo.</p>
        </div>
        {/* Re-integrated the original component logic here or import it if compatible */}
        <div className="bg-lightGray/20 dark:bg-gray-800 p-8 rounded-3xl">
          <LiveReviews />
        </div>
      </div>
    </section>
  );
};

/**
 * Footer Component
 * Clean and professional.
 */
const Footer = () => (
  <footer className="bg-darkGray text-white py-16 border-t border-gray-800">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
      <div className="col-span-1 md:col-span-2">
        <Link href="/" className="text-3xl font-bold mb-6 block">Revlo<span className="text-secondary">.</span></Link>
        <p className="text-gray-400 max-w-sm mb-6 leading-relaxed">
          Nidaamka koowaad ee ERP ee loogu talagalay horumarinta ganacsiga Bariga Afrika.
          Tayada, Hufnaanta, iyo Tiknoolajiyadda.
        </p>
        <div className="flex gap-4">
          {/* Social Icons */}
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
          <li className="flex items-center gap-3"><Mail size={18} className="text-primary" /> info@revlo.com</li>
          <li className="flex items-center gap-3"><Phone size={18} className="text-primary" /> +251 929 475 332</li>
          <li className="flex items-center gap-3"><MapPin size={18} className="text-primary" /> Jigjiga, Somali Region</li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
      &copy; {new Date().getFullYear()} Revlo. Xuquuqda oo dhan waa ay xifdisan tahay.
    </div>
  </footer>
);


export default function HomePage() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 font-sans selection:bg-primary/30 selection:text-primary">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <PWAInstall />
      <Reviews />
      <Footer />
    </main>
  );
}