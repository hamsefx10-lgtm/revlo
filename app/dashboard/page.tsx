// app/dashboard/page.tsx - Dashboard Page (10000% Design - Ultimate Enhancement)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/layouts/Layout';
import RevloLoader from '@/components/ui/RevloLoader';
import { useCurrency } from '@/contexts/CurrencyContext';
import {
  DollarSign, Briefcase, Banknote, ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown,
  CheckCircle, Clock, XCircle, Plus, Info, MessageSquare, User, Package, Bell, CalendarCheck,
  LineChart as LineChartIcon, BarChart as BarChartIcon, PieChart as PieChartIcon,
  Eye, Edit, Trash2,
  Activity, Zap, Target, Award, // General icons
  Coins, // For potential profit
  CheckSquare, // For completed projects profit
  Sun, Cloud, CloudRain, CloudSnow, // Weather icons
  Calendar, // Calendar icon
  Search, // Search icon
  Factory, // Manufacturing icon
  Scale, // Debt icon
  FileText, ClipboardList, // Quick actions icons
  Trophy // Trophy icon for good profit
} from 'lucide-react';

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';

// Add CSS animations
const styles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .animate-fade-in-up {
    animation: fadeInUp 0.6s ease-out;
  }
  
  .animate-pulse-subtle {
    animation: pulse 2s infinite;
  }
  
  .animate-fade-in {
    animation: slideIn 0.4s ease-out;
  }
  
  .hover-scale:hover {
    transform: scale(1.05);
    transition: transform 0.2s ease;
  }
  
  .gradient-bg {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  
  .glass-effect {
    backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}


// --- Weather Widget Component ---
function WeatherWidget() {
  const [weather, setWeather] = useState({
    temperature: 0,
    location: 'Loading...',
    condition: 'Loading...',
    icon: 'Sun'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user's location and fetch weather
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Use OpenWeatherMap API (free tier)
            const response = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=demo&units=metric`
            );
            if (response.ok) {
              const data = await response.json();
              setWeather({
                temperature: Math.round(data.main.temp),
                location: data.name + ', ' + data.sys.country,
                condition: data.weather[0].description,
                icon: getWeatherIcon(data.weather[0].main)
              });
            } else {
              // Fallback to Jigjiga, Ethiopia weather
              setWeather({
                temperature: 22,
                location: 'Jigjiga, Ethiopia',
                condition: 'Partly Cloudy',
                icon: 'Cloud'
              });
            }
          } catch (error) {
            // Fallback to Jigjiga, Ethiopia weather
            setWeather({
              temperature: 22,
              location: 'Jigjiga, Ethiopia',
              condition: 'Partly Cloudy',
              icon: 'Cloud'
            });
          }
          setLoading(false);
        },
        (error) => {
          // Fallback to Jigjiga, Ethiopia weather
          setWeather({
            temperature: 22,
            location: 'Jigjiga, Ethiopia',
            condition: 'Partly Cloudy',
            icon: 'Cloud'
          });
          setLoading(false);
        }
      );
    } else {
      // Fallback to Jigjiga, Ethiopia weather
      setWeather({
        temperature: 22,
        location: 'Jigjiga, Ethiopia',
        condition: 'Partly Cloudy',
        icon: 'Cloud'
      });
      setLoading(false);
    }
  }, []);

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear': return 'Sun';
      case 'clouds': return 'Cloud';
      case 'rain': return 'CloudRain';
      case 'snow': return 'CloudSnow';
      default: return 'Sun';
    }
  };

  const WeatherIcon = weather.icon === 'Sun' ? Sun :
    weather.icon === 'Cloud' ? Cloud :
      weather.icon === 'CloudRain' ? CloudRain :
        weather.icon === 'CloudSnow' ? CloudSnow : Sun;

  return (
    <div className="bg-gradient-to-r from-sky-400 to-blue-500 p-6 rounded-xl text-white animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Cimilo</h3>
        <WeatherIcon size={24} className="opacity-80" />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold">
            {loading ? '...' : `${weather.temperature}°C`}
          </p>
          <p className="text-sm opacity-80">{weather.location}</p>
        </div>
        <div className="text-right">
          <p className="text-sm opacity-80">Maanta</p>
          <p className="text-sm opacity-80 capitalize">{weather.condition}</p>
        </div>
      </div>
    </div>
  );
}

// --- Dashboard Data Interfaces ---
interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  totalBankBalance: number;
  totalMobileMoneyBalance: number;
  totalCashBalance: number;
  lowStockItems: number;
  overdueProjects: number;
  realizedProfitFromCompletedProjects: number;
  potentialProfitFromActiveProjects: number;
  monthlyFinancialData: { month: string; income: number; expenses: number; profit: number }[];
  projectStatusBreakdown: { name: string; value: number; color: string }[];
  recentActivities: { id: string; type: string; description: string; amount?: number; date: string; user: string }[];
  // New fields
  accountBreakdown?: { name: string; value: number; type: string }[];
  outstandingDebts?: number;
  totalReceivables?: number;
  totalPayables?: number;
  topCustomers?: { name: string; value: number }[];
  topVendors?: { name: string; value: number }[];
  thisMonthIncome?: number;
  thisMonthExpenses?: number;
  lastMonthIncome?: number;
  lastMonthExpenses?: number;
  topExpenseCategories?: { name: string; amount: number }[];
  fixedAssetsValue?: number;
  fixedAssetsCount?: number;
}

interface DashboardCardProps {
  title: string;
  value: string;
  trend?: 'up' | 'down';
  colorClass: string;
  icon: React.ReactNode;
  description?: string; // Optional detailed description
}

interface ActivityItemProps {
  activity: {
    id: string;
    type: string;
    description: string;
    amount?: number;
    date: string;
    user: string;
  };
  formatCurrency: (amount: number) => string;
}

// ... (Helper functions remain the same) ... 
// Helper for chart colors
const CHART_COLORS = ['#3498DB', '#2ECC71', '#F39C12', '#E74C3C', '#9B59B6', '#1ABC9C', '#34495E', '#A0A0A0'];

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-sm font-semibold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


// Dashboard Card Component
// ... (DashboardCard component remains the same) ...
const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, trend, colorClass, icon, description }) => {
  // Determine border color and background based on colorClass
  const getColorClasses = (colorClass: string) => {
    if (colorClass.includes('primary')) return { border: 'border-primary', bg: 'bg-primary/10' };
    if (colorClass.includes('secondary')) return { border: 'border-secondary', bg: 'bg-secondary/10' };
    if (colorClass.includes('accent')) return { border: 'border-accent', bg: 'bg-accent/10' };
    if (colorClass.includes('redError')) return { border: 'border-redError', bg: 'bg-redError/10' };
    return { border: 'border-primary', bg: 'bg-primary/10' };
  };
  const colors = getColorClasses(colorClass);

  return (
    <div className={`bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md border-l-4 ${colors.border} hover:shadow-xl transition-all duration-300 animate-fade-in-up transform hover:-translate-y-1`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${colors.bg} ${colorClass}`}>
            {React.cloneElement(icon as React.ReactElement, { size: 22 })}
          </div>
          <div>
            <h3 className="text-sm font-medium text-mediumGray dark:text-gray-400">{title}</h3>
            {description && !trend && (
              <p className="text-xs text-mediumGray dark:text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className={`text-2xl font-extrabold ${colorClass}`}>{value}</p>
        {trend && (
          <span className={`flex items-center text-sm font-medium ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {trend === 'up' ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
          </span>
        )}
      </div>
    </div>
  );
};

// Recent Activity Item
// ... (ActivityItem component remains the same) ...
const ActivityItem: React.FC<ActivityItemProps> = ({ activity, formatCurrency }) => {
  let icon: React.ReactNode;
  let iconBgClass = '';
  let iconColorClass = '';
  let amountDisplay = null;

  switch (activity.type) {
    case 'expense':
      icon = <DollarSign size={18} />;
      iconBgClass = 'bg-redError/10';
      iconColorClass = 'text-redError';
      amountDisplay = <span className="font-semibold text-redError">-{formatCurrency(Math.abs(activity.amount || 0))}</span>;
      break;
    case 'project':
      icon = <Briefcase size={18} />;
      iconBgClass = 'bg-primary/10';
      iconColorClass = 'text-primary';
      amountDisplay = activity.amount ? <span className="font-semibold text-secondary">+{formatCurrency(activity.amount)}</span> : null;
      break;
    case 'income':
      icon = <Banknote size={18} />;
      iconBgClass = 'bg-secondary/10';
      iconColorClass = 'text-secondary';
      amountDisplay = <span className="font-semibold text-secondary">+{formatCurrency(Math.abs(activity.amount || 0))}</span>;
      break;
    case 'system':
      icon = <Bell size={18} />;
      iconBgClass = 'bg-accent/10';
      iconColorClass = 'text-accent';
      break;
    default:
      icon = <Info size={18} />;
      iconBgClass = 'bg-mediumGray/10';
      iconColorClass = 'text-mediumGray';
  }

  return (
    <li className="flex items-center justify-between py-3 border-b border-lightGray dark:border-gray-700 last:border-b-0 group">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-full ${iconBgClass} ${iconColorClass} transition-all duration-200 group-hover:scale-110`}>
          {icon}
        </div>
        <div>
          <p className="text-darkGray dark:text-gray-100 font-medium">{activity.description}</p>
          <p className="text-sm text-mediumGray dark:text-gray-400">
            {activity.user && <span>by {activity.user} &bull; </span>}
            {new Date(activity.date).toLocaleString()}
          </p>
        </div>
      </div>
      {amountDisplay}
    </li>
  );
};



export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date Filtering State
  const [dateFilter, setDateFilter] = useState('ALL'); // ALL, TODAY, WEEK, MONTH, YEAR
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const { user } = require('@/components/providers/UserProvider').useUser();
  const { formatCurrency, currency } = useCurrency();

  useEffect(() => {
    async function fetchStats() {
      // Only show full page loading on first load
      if (!stats) setLoading(true);

      setError(null);
      try {
        // Check Plan Type first
        const planRes = await fetch('/api/company/plan-type');
        const planData = await planRes.json();
        if (planData.planType === 'FACTORIES_ONLY') {
          window.location.href = '/manufacturing';
          return;
        }

        // Build Query URL
        let url = `/api/dashboard/stats`;
        const params = new URLSearchParams();

        if (dateFilter !== 'ALL') {
          const now = new Date();
          let start = new Date();
          let end = new Date();

          if (dateFilter === 'TODAY') {
            start = new Date(now.setHours(0, 0, 0, 0));
            end = new Date(now.setHours(23, 59, 59, 999));
          } else if (dateFilter === 'WEEK') {
            const day = now.getDay() || 7;
            if (day !== 1) start.setHours(-24 * (day - 1));
            else start.setHours(0, 0, 0, 0);
            end = new Date(now.setHours(23, 59, 59, 999)); // End is today (or end of week if preferred)
          } else if (dateFilter === 'MONTH') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
          } else if (dateFilter === 'YEAR') {
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
          }

          params.append('startDate', start.toISOString());
          params.append('endDate', end.toISOString());
        }

        const res = await fetch(`${url}?${params.toString()}`);
        if (!res.ok) throw new Error("Server error");
        const json = await res.json();

        // Ensure new fields have defaults strictly for UI safety
        json.topCustomers = json.topCustomers || [];
        json.topVendors = json.topVendors || [];
        json.totalReceivables = json.totalReceivables || 0;
        json.totalPayables = json.totalPayables || 0;

        setStats(json);
      } catch (err) {
        setError((err as any).message || "Error fetching dashboard stats");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [dateFilter]); // Re-fetch on filter change

  // Initial loading only (Full Screen with Blur & Logo)
  if (loading && !stats) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-md">
      <RevloLoader />
    </div>
  );
  if (error) return <div className="text-red-500 text-center p-6">{error}</div>;
  if (!stats) return null;

  const {
    totalIncome, totalExpenses, netProfit, totalProjects, activeProjects, completedProjects, onHoldProjects,
    totalBankBalance, totalMobileMoneyBalance, totalCashBalance, lowStockItems, overdueProjects,
    monthlyFinancialData, projectStatusBreakdown, recentActivities,
    realizedProfitFromCompletedProjects, potentialProfitFromActiveProjects,
    accountBreakdown = [], outstandingDebts = 0, thisMonthIncome = 0, thisMonthExpenses = 0,
    lastMonthIncome = 0, lastMonthExpenses = 0, topExpenseCategories = [],
    fixedAssetsValue = 0, fixedAssetsCount = 0,
    // New fields
    totalReceivables = 0, totalPayables = 0, topCustomers = [], topVendors = []
  } = stats;

  const currentTotalBalance = totalBankBalance + totalMobileMoneyBalance + totalCashBalance;

  // Calculate monthly comparison percentages
  const incomeChange = lastMonthIncome > 0
    ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome * 100).toFixed(1)
    : thisMonthIncome > 0 ? '100' : '0';
  const expenseChange = lastMonthExpenses > 0
    ? ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses * 100).toFixed(1)
    : thisMonthExpenses > 0 ? '100' : '0';

  return (
    <Layout>
      <div className="relative">
        {/* Blur Overlay Loader for Updates */}
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/30 dark:bg-black/30 backdrop-blur-sm transition-all duration-300 rounded-xl">
            <RevloLoader />
          </div>
        )}

        <div className={`transition-opacity duration-300 ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
          {/* Mobile-Responsive Header with Date Filter */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
            <h1 className="text-2xl lg:text-4xl font-bold text-darkGray dark:text-gray-100">Dashboard Overview</h1>

            {/* Date Filter Controls */}
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg shadow p-1">
              <button
                onClick={() => setDateFilter('TODAY')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${dateFilter === 'TODAY' ? 'bg-primary text-white' : 'text-mediumGray hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                Maanta
              </button>
              <button
                onClick={() => setDateFilter('WEEK')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${dateFilter === 'WEEK' ? 'bg-primary text-white' : 'text-mediumGray hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                Todobaadkan
              </button>
              <button
                onClick={() => setDateFilter('MONTH')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${dateFilter === 'MONTH' ? 'bg-primary text-white' : 'text-mediumGray hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                Bishan
              </button>
              <button
                onClick={() => setDateFilter('ALL')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${dateFilter === 'ALL' ? 'bg-primary text-white' : 'text-mediumGray hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                Kulligood
              </button>
            </div>
          </div>

          {/* Financial Overview Cards Section - Modern Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8 animate-fade-in-up">
            {/* Card 1: Lacagaha la helay (Money Received) */}
            <div className="relative p-4 md:p-6 rounded-xl bg-white dark:bg-gray-800 shadow-md text-center border-l-4 border-secondary">
              <h4 className="text-sm md:text-lg font-semibold text-mediumGray dark:text-gray-400 mb-2">Lacagaha la helay</h4>
              <p className="text-xl md:text-3xl font-extrabold text-secondary">{formatCurrency(totalIncome)}</p>
              <p className="text-xs md:text-sm text-mediumGray dark:text-gray-400 mt-1">Lacagta guud ee soo gashay</p>
            </div>

            {/* Card 2: Kharashyada (Expenses) */}
            <div className="relative p-4 md:p-6 rounded-xl bg-white dark:bg-gray-800 shadow-md text-center border-l-4 border-redError">
              <h4 className="text-sm md:text-lg font-semibold text-mediumGray dark:text-gray-400 mb-2">Kharashyada</h4>
              <p className="text-xl md:text-3xl font-extrabold text-redError">{formatCurrency(totalExpenses)}</p>
              <p className="text-xs md:text-sm text-mediumGray dark:text-gray-400 mt-1">Kharashyada guud</p>
            </div>

            {/* Card 3: Faa'iidada Dhabta Ah (Realized Profit) */}
            <div className={`relative p-4 md:p-6 rounded-xl bg-white dark:bg-gray-800 shadow-md text-center border-l-4 ${netProfit >= 0 ? 'border-secondary' : 'border-redError'}`}>
              <h4 className="text-sm md:text-lg font-semibold text-mediumGray dark:text-gray-400 mb-2">Faa'iidada Dhabta Ah</h4>
              <p className={`text-xl md:text-3xl font-extrabold ${netProfit >= 0 ? 'text-secondary' : 'text-redError'}`}>
                {formatCurrency(netProfit)}
              </p>
              <p className="text-xs md:text-sm text-mediumGray dark:text-gray-400 mt-1">Dakhliga - Kharashka</p>
            </div>

            {/* Card 4: Mashaariicda Firfircoon (Active Projects) */}
            <div className="relative p-4 md:p-6 rounded-xl bg-white dark:bg-gray-800 shadow-md text-center border-l-4 border-primary">
              <h4 className="text-sm md:text-lg font-semibold text-mediumGray dark:text-gray-400 mb-2">Mashaariicda Firfircoon</h4>
              <p className="text-xl md:text-3xl font-extrabold text-primary">{activeProjects}</p>
              <p className="text-xs md:text-sm text-mediumGray dark:text-gray-400 mt-1">Mashaariic socota</p>
            </div>
          </div>

          {/* Debt Overview Split (Receivables vs Payables) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 animate-fade-in-up">
            {/* Receivables (Money IN) */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-green-500">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-darkGray dark:text-gray-100 flex items-center">
                  <ArrowDownLeft size={24} className="mr-2 text-green-500" />
                  Lacagaha Kuu Maqan (Receivables)
                </h3>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Lacag Soo Galaysa</span>
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">{formatCurrency(outstandingDebts || 0)}</div> {/* Using outstandingDebts as proxy based on current API logic till refined */}
              <p className="text-sm text-gray-500">Macaamiisha iyo Mashaariicda deynta lagu leeyahay</p>
              <Link href="/accounting?tab=Debts" className="text-primary text-sm font-medium hover:underline mt-3 block">Fiiri Liiska &rarr;</Link>
            </div>

            {/* Payables (Money OUT) */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-orange-500">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-darkGray dark:text-gray-100 flex items-center">
                  <ArrowUpRight size={24} className="mr-2 text-orange-500" />
                  Daymaha Lagugu Leeyahay (Payables)
                </h3>
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">Lacag Baxaysa</span>
              </div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">{formatCurrency(0)}</div> {/* Logic for Payables is pending in API, defaulting to 0 or manual calc */}
              <p className="text-sm text-gray-500">Iibiyayaasha iyo Kharashyada aan la bixin</p>
              <Link href="/accounting?tab=Debts" className="text-primary text-sm font-medium hover:underline mt-3 block">Bixi Hadda &rarr;</Link>
            </div>
          </div>

          {/* New Widgets Section: Top Customers & Vendors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 lg:mb-8 animate-fade-in-up">
            {/* Top Customers Widget */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-4 flex items-center">
                <User size={20} className="mr-2 text-blue-500" />
                Macaamiisha Ugu Sarreeya (Top Customers)
              </h3>
              <div className="space-y-4">
                {stats.topCustomers && stats.topCustomers.length > 0 ? (
                  stats.topCustomers.map((cust, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-lightGray dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full text-blue-600 dark:text-blue-400 font-bold text-xs">{idx + 1}</div>
                        <p className="text-sm font-medium text-darkGray dark:text-gray-100">{cust.name}</p>
                      </div>
                      <p className="text-sm font-bold text-secondary">{formatCurrency(cust.value)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">Ma jirto xog macaamiil ah.</p>
                )}
              </div>
            </div>

            {/* Top Vendors Widget */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-purple-500">
              <h3 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-4 flex items-center">
                <Factory size={20} className="mr-2 text-purple-500" />
                Iibiyayaasha Ugu Sarreeya (Top Vendors)
              </h3>
              <div className="space-y-4">
                {stats.topVendors && stats.topVendors.length > 0 ? (
                  stats.topVendors.map((vend, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-lightGray dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full text-purple-600 dark:text-purple-400 font-bold text-xs">{idx + 1}</div>
                        <p className="text-sm font-medium text-darkGray dark:text-gray-100">{vend.name}</p>
                      </div>
                      <p className="text-sm font-bold text-redError">{formatCurrency(vend.value)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">Ma jirto xog iibiye ah.</p>
                )}
              </div>
            </div>
          </div>


          {/* Middle Section Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 lg:mb-8 animate-fade-in-up">
            {/* Account Breakdown Widget */}
            {accountBreakdown.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-indigo-500">
                <h3 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-4 flex items-center">
                  <Banknote size={20} className="mr-2 text-indigo-500" />
                  Qaybinta Accounts-ka
                </h3>
                <div className="space-y-3">
                  {accountBreakdown.slice(0, 5).map((acc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-lightGray dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${acc.type === 'BANK' ? 'bg-blue-500' :
                          acc.type === 'MOBILE_MONEY' ? 'bg-green-500' :
                            'bg-orange-500'
                          }`}></div>
                        <div>
                          <p className="text-sm font-medium text-darkGray dark:text-gray-100">{acc.name}</p>
                          <p className="text-xs text-mediumGray dark:text-gray-400">{acc.type}</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-primary">{formatCurrency(acc.value)}</p>
                    </div>
                  ))}
                </div>
                <Link href="/accounting/accounts" className="mt-4 block text-sm text-primary hover:underline text-center">
                  Fiiri Dhammaan Accounts-ka →
                </Link>
              </div>
            )}

            {/* Monthly Comparison Widget */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-pink-500">
              <h3 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-4 flex items-center">
                <Calendar size={20} className="mr-2 text-pink-500" />
                Isku Dhig Bishiiba
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-mediumGray dark:text-gray-400">Dakhliga Bishan</span>
                    <span className={`text-sm font-bold ${parseFloat(incomeChange) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {parseFloat(incomeChange) >= 0 ? '+' : ''}{incomeChange}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-secondary">{formatCurrency(thisMonthIncome)}</p>
                    <p className="text-xs text-mediumGray dark:text-gray-400">Hore: {formatCurrency(lastMonthIncome)}</p>
                  </div>
                </div>
                <div className="border-t border-lightGray dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-mediumGray dark:text-gray-400">Kharashyada Bishan</span>
                    <span className={`text-sm font-bold ${parseFloat(expenseChange) >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {parseFloat(expenseChange) >= 0 ? '+' : ''}{expenseChange}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-redError">{formatCurrency(thisMonthExpenses)}</p>
                    <p className="text-xs text-mediumGray dark:text-gray-400">Hore: {formatCurrency(lastMonthExpenses)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Assets Summary Widget */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-teal-500">
              <h3 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-4 flex items-center">
                <Factory size={20} className="mr-2 text-teal-500" />
                Hantida Ma guurtada Ah
              </h3>
              <div className="flex flex-col items-center justify-center h-48">
                <Factory size={48} className="text-teal-500/50 mb-4" />
                <p className="text-3xl font-bold text-darkGray dark:text-gray-100">{formatCurrency(fixedAssetsValue)}</p>
                <p className="text-sm text-gray-500 mt-2">{fixedAssetsCount} Hanti Diiwaan Gashan</p>
                <Link href="/settings/assets" className="mt-4 text-sm text-teal-600 hover:scale-105 transition-transform font-medium">
                  Maaree Hantida &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Top Expense Categories Widget */}
          {topExpenseCategories.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-redError mb-6 lg:mb-8 animate-fade-in-up">
              <h3 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-4 flex items-center">
                <BarChartIcon size={20} className="mr-2 text-redError" />
                Kharashyada Ugu Waaweyn
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {topExpenseCategories.map((cat, idx) => {
                  const maxAmount = Math.max(...topExpenseCategories.map(c => c.amount));
                  const percentage = maxAmount > 0 ? (cat.amount / maxAmount) * 100 : 0;
                  return (
                    <div key={idx} className="p-4 bg-lightGray dark:bg-gray-700 rounded-lg">
                      <p className="text-sm font-medium text-darkGray dark:text-gray-100 mb-2 truncate">{cat.name}</p>
                      <p className="text-lg font-bold text-redError mb-2">{formatCurrency(cat.amount)}</p>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-redError h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions Section - Enhanced Design */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-6 lg:mb-8 animate-fade-in-up border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg lg:text-xl font-semibold text-darkGray dark:text-gray-100 mb-6 flex items-center gap-2">
              <Zap size={24} className="text-orange-500 dark:text-orange-400" />
              Ficillo Dhaqso leh
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Link
                href="/expenses/add"
                className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-800/30 p-4 rounded-lg border border-green-200 dark:border-green-700 hover:shadow-lg transition-all duration-300 hover:scale-105 group"
              >
                <div className="bg-green-500/20 dark:bg-green-500/30 p-3 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                  <Coins size={24} className="text-green-600 dark:text-green-400" />
                </div>
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Lacag Dhexdhexaad</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">Ku dar lacag dhexdhexaad</p>
              </Link>

              <Link
                href="/projects/add"
                className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-800/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700 hover:shadow-lg transition-all duration-300 hover:scale-105 group"
              >
                <div className="bg-blue-500/20 dark:bg-blue-500/30 p-3 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                  <ClipboardList size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Mashruuc Cusub</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">Abuur mashruuc cusub</p>
              </Link>

              <Link
                href="/inventory/store"
                className="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/30 dark:to-amber-800/30 p-4 rounded-lg border border-orange-200 dark:border-orange-700 hover:shadow-lg transition-all duration-300 hover:scale-105 group"
              >
                <div className="bg-orange-500/20 dark:bg-orange-500/30 p-3 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                  <Package size={24} className="text-orange-600 dark:text-orange-400" />
                </div>
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Alaab Dhexdhexaad</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">Maaree alaab</p>
              </Link>

              <Link
                href="/reports"
                className="bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-800/30 p-4 rounded-lg border border-purple-200 dark:border-purple-700 hover:shadow-lg transition-all duration-300 hover:scale-105 group"
              >
                <div className="bg-purple-500/20 dark:bg-purple-500/30 p-3 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
                  <BarChartIcon size={24} className="text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">Warbixin</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">Eeg warbixino</p>
              </Link>
            </div>
          </div>

          {/* Smart Notifications Section - Enhanced Design */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/30 dark:to-amber-800/30 p-6 rounded-xl shadow-lg mb-6 lg:mb-8 animate-fade-in-up border border-orange-200 dark:border-orange-700">
            <h3 className="text-lg lg:text-xl font-semibold text-darkGray dark:text-gray-100 mb-6 flex items-center gap-2">
              <Bell size={24} className="text-orange-600 dark:text-orange-400" />
              Digniino Smart ah
            </h3>
            <div className="space-y-4">
              {/* Good Profit Notification */}
              {netProfit > 0 && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-l-4 border-yellow-500 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="bg-yellow-500/20 dark:bg-yellow-500/30 p-3 rounded-lg">
                      <Trophy size={24} className="text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">Faa'iido Wanaagsan!</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Waxaad heshay <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(netProfit)}</span> faa'iido dhab ah
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* No Warnings Notification */}
              {lowStockItems === 0 && overdueProjects === 0 && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-l-4 border-green-500 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-500/20 dark:bg-green-500/30 p-3 rounded-lg">
                      <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">Wax Digniin Ah Ma Jiraan</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Ganacsigaagu wuxuu ku jiraa xaalad wanaagsan
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Low Stock Warning */}
              {lowStockItems > 0 && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border-l-4 border-red-500 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="bg-red-500/20 dark:bg-red-500/30 p-3 rounded-lg">
                      <Package size={24} className="text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">Digniin: Alaab Yar!</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-bold">{lowStockItems} Alaab</span> ayaa stock-geedu hooseeyaa. Fadlan dib u buuxi.
                      </p>
                      <Link href="/inventory/store?status=Low Stock" className="text-primary text-xs font-medium hover:underline mt-2 block">Fiiri &rarr;</Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>





          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Monthly Financial Trend Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md animate-fade-in-up">
              <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-4 flex items-center">
                <LineChartIcon className="mr-2 text-primary" size={24} />
                Dhaqdhaqaaqa Lacagta Bishiiba
              </h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyFinancialData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-700" vertical={false} />
                    <XAxis dataKey="month" stroke="#7F8C8D" className="dark:text-gray-400 text-sm" />
                    <YAxis stroke="#7F8C8D" className="dark:text-gray-400 text-sm" />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px' }} labelStyle={{ color: '#2C3E50', fontWeight: 'bold' }} itemStyle={{ color: '#2C3E50' }} />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#10B981" name="Dakhliga" strokeWidth={3} />
                    <Line type="monotone" dataKey="expenses" stroke="#EF4444" name="Kharashyada" strokeWidth={3} />
                    <Line type="monotone" dataKey="profit" stroke="#3B82F6" name="Faa'iidada" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Project Status Breakdown Pie Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md animate-fade-in-up">
              <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-4 flex items-center">
                <PieChartIcon className="mr-2 text-primary" size={24} />
                Qaybinta Xaaladda Mashruuca
              </h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={projectStatusBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={120}
                      dataKey="value"
                    >
                      {projectStatusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px' }}
                      labelStyle={{ color: '#2C3E50', fontWeight: 'bold' }}
                      itemStyle={{ color: '#2C3E50' }}
                    />
                    <Legend align="right" verticalAlign="middle" layout="vertical" wrapperStyle={{ paddingLeft: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md animate-fade-in-up">
            <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-4 flex items-center">
              <MessageSquare className="mr-2 text-primary" size={24} />
              Dhaqdhaqaaqa Dhawaan
            </h3>
            <ul className="space-y-3">
              {recentActivities.length > 0 ? (
                recentActivities.map(activity => (
                  <ActivityItem key={activity.id} activity={activity} formatCurrency={formatCurrency} />
                ))
              ) : (
                <li className="text-mediumGray dark:text-gray-400">Ma jiraan dhaqdhaqaaq dhawaan ah.</li>
              )}
            </ul>
            <Link href="/accounting" className="mt-4 block text-primary hover:underline text-sm font-medium">Fiiri Dhammaan Dhaqdhaqaaqa &rarr;</Link>
          </div>

          {/* Summary Cards Section - Matching Reports Design */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8 animate-fade-in-up">
            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-md text-center border-l-4 border-secondary">
              <h4 className="text-sm md:text-lg font-semibold text-mediumGray dark:text-gray-400 mb-2">Mashaariic Guud</h4>
              <p className="text-xl md:text-3xl font-extrabold text-secondary">{totalProjects}</p>
              <p className="text-xs md:text-sm text-mediumGray dark:text-gray-400 mt-1">Dhammaan mashaariicda</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-md text-center border-l-4 border-primary">
              <h4 className="text-sm md:text-lg font-semibold text-mediumGray dark:text-gray-400 mb-2">Dhammaystiran</h4>
              <p className="text-xl md:text-3xl font-extrabold text-primary">{completedProjects}</p>
              <p className="text-xs md:text-sm text-mediumGray dark:text-gray-400 mt-1">Mashaariic la dhammaystiray</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-md text-center border-l-4 border-accent">
              <h4 className="text-sm md:text-lg font-semibold text-mediumGray dark:text-gray-400 mb-2">Hantida Guud</h4>
              <p className="text-xl md:text-3xl font-extrabold text-accent">{formatCurrency(currentTotalBalance)}</p>
              <p className="text-xs md:text-sm text-mediumGray dark:text-gray-400 mt-1">Bank + Mobile + Cash</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-md text-center border-l-4 border-redError">
              <h4 className="text-sm md:text-lg font-semibold text-mediumGray dark:text-gray-400 mb-2">Dib u Dhacay</h4>
              <p className="text-xl md:text-3xl font-extrabold text-redError">{overdueProjects}</p>
              <p className="text-xs md:text-sm text-mediumGray dark:text-gray-400 mt-1">Mashaariic dib u dhacay</p>
            </div>
          </div>









          {/* Quick Add Floating Button (already in Layout.tsx) */}
        </div>
      </div>
    </Layout>
  );
  // ...existing code...
}
