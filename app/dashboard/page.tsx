// app/dashboard/page.tsx - Dashboard Page (10000% Design - Ultimate Enhancement)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/layouts/Layout';
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
// ...existing code...


// Dashboard Card Component

interface DashboardCardProps {
  title: string;
  value: string;
  trend?: 'up' | 'down'; 
  colorClass: string; 
  icon: React.ReactNode;
  description?: string; // Optional detailed description
}

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
interface ActivityItemProps {
  activity: {
    id: string;
    type: string;
    description: string;
    amount?: number;
    date: string;
    user: string;
  };
}

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
  const { user } = require('@/components/providers/UserProvider').useUser();
  const { formatCurrency, currency } = useCurrency();

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/dashboard/stats`);
        if (!res.ok) throw new Error("Server error");
        const json = await res.json();
        setStats(json);
      } catch (err) {
        setError((err as any).message || "Error fetching dashboard stats");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><span className="text-primary text-lg">Dashboard loading...</span></div>;
  if (error) return <div className="text-red-500 text-center p-6">{error}</div>;
  if (!stats) return null;

  const {
    totalIncome, totalExpenses, netProfit, totalProjects, activeProjects, completedProjects, onHoldProjects,
    totalBankBalance, totalMobileMoneyBalance, totalCashBalance, lowStockItems, overdueProjects,
    monthlyFinancialData, projectStatusBreakdown, recentActivities,
    realizedProfitFromCompletedProjects, potentialProfitFromActiveProjects,
    accountBreakdown = [], outstandingDebts = 0, thisMonthIncome = 0, thisMonthExpenses = 0,
    lastMonthIncome = 0, lastMonthExpenses = 0, topExpenseCategories = [],
    fixedAssetsValue = 0, fixedAssetsCount = 0
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
      {/* Mobile-Responsive Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
        <h1 className="text-2xl lg:text-4xl font-bold text-darkGray dark:text-gray-100">Dashboard Overview</h1>
      </div>
      
      {/* Financial Overview Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8 animate-fade-in-up">
        <DashboardCard 
          title="Faa'iidada Dhabta Ah"
          value={formatCurrency(realizedProfitFromCompletedProjects)}
          trend={realizedProfitFromCompletedProjects >= 0 ? 'up' : 'down'}
          description="Faa'iidada dhabta ah ee laga helay mashaariicda la dhammaystiraay"
          colorClass={realizedProfitFromCompletedProjects >= 0 ? 'text-secondary' : 'text-redError'} 
          icon={<Banknote />} 
        />
        <DashboardCard 
          title="Wadarta Kharashyada" 
          value={formatCurrency(totalExpenses)} 
          trend="down"
          description="Kharashyada guud"
          colorClass="text-redError" 
          icon={<DollarSign />} 
        />
        <DashboardCard 
          title="Wadarta Lacagta" 
          value={formatCurrency(currentTotalBalance)} 
          trend={currentTotalBalance >= 0 ? 'up' : 'down'}
          description="Accounts-ka oo dhan"
          colorClass="text-primary" 
          icon={<Banknote />} 
        />
        <DashboardCard 
          title="Mashaariicda Firfircoon" 
          value={activeProjects.toLocaleString()} 
          description="Mashaariic socota"
          colorClass="text-accent" 
          icon={<Briefcase />} 
        />
      </div>

      {/* New Widgets Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 lg:mb-8 animate-fade-in-up">
        {/* Account Breakdown Widget */}
        {accountBreakdown.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-primary">
            <h3 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-4 flex items-center">
              <Banknote size={20} className="mr-2 text-primary" />
              Qaybinta Accounts-ka
            </h3>
            <div className="space-y-3">
              {accountBreakdown.slice(0, 5).map((acc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-lightGray dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      acc.type === 'BANK' ? 'bg-blue-500' : 
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
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-secondary">
          <h3 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-4 flex items-center">
            <Calendar size={20} className="mr-2 text-secondary" />
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

        {/* Debt & Fixed Assets Summary Widget */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-accent">
          <h3 className="text-lg font-semibold text-darkGray dark:text-gray-100 mb-4 flex items-center">
            <Package size={20} className="mr-2 text-accent" />
            Daymaha & Hantida
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-mediumGray dark:text-gray-400 mb-1">Daymo La Qaatay</p>
                  <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                    {formatCurrency(Math.abs(outstandingDebts))}
                  </p>
                </div>
                <Scale size={24} className="text-orange-600 dark:text-orange-400" />
              </div>
              <Link href="/accounting?tab=Debts" className="text-xs text-orange-600 dark:text-orange-400 hover:underline mt-2 block">
                Fiiri Dhammaan →
              </Link>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-mediumGray dark:text-gray-400 mb-1">Hantida Go'an</p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {formatCurrency(fixedAssetsValue)}
                  </p>
                  <p className="text-xs text-mediumGray dark:text-gray-400 mt-1">{fixedAssetsCount} Hanti</p>
                </div>
                <Factory size={24} className="text-purple-600 dark:text-purple-400" />
              </div>
              <Link href="/settings/assets" className="text-xs text-purple-600 dark:text-purple-400 hover:underline mt-2 block">
                Fiiri Dhammaan →
              </Link>
            </div>
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

      {/* Alerts and Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8 animate-fade-in-up">
        {lowStockItems > 0 && (
          <div className="bg-redError/10 p-4 lg:p-6 rounded-xl shadow-md border border-redError flex items-center space-x-3 lg:space-x-4 animate-pulse-subtle group">
            <Package size={24} className="text-redError flex-shrink-0 group-hover:scale-110 transition-transform duration-200"/>
            <div>
              <h4 className="text-base lg:text-lg font-semibold text-darkGray dark:text-gray-100">Digniin: Alaab Yar!</h4>
              <p className="text-xs lg:text-sm text-mediumGray dark:text-gray-400">
                <span className="font-bold">{lowStockItems} Alaab</span> ayaa stock-geedu hooseeyaa. Fadlan dib u buuxi.
              </p>
              <Link href="/inventory/store?status=Low Stock" className="text-primary text-xs lg:text-sm font-medium hover:underline mt-2 block">Fiiri &rarr;</Link>
            </div>
          </div>
        )}
        {overdueProjects > 0 && (
          <div className="bg-redError/10 p-4 lg:p-6 rounded-xl shadow-md border border-redError flex items-center space-x-3 lg:space-x-4 animate-pulse-subtle group">
            <XCircle size={24} className="text-redError flex-shrink-0 group-hover:scale-110 transition-transform duration-200"/>
            <div>
              <h4 className="text-base lg:text-lg font-semibold text-darkGray dark:text-gray-100">Digniin: Mashaariic Dib U Dhacday!</h4>
              <p className="text-xs lg:text-sm text-mediumGray dark:text-gray-400">
                <span className="font-bold">{overdueProjects} Mashruuc</span> ayaa deadline-kiisa dhaafay.
              </p>
              <Link href="/projects?status=Overdue" className="text-primary text-xs lg:text-sm font-medium hover:underline mt-2 block">Fiiri &rarr;</Link>
            </div>
          </div>
        )}
        {/* New Insight: Healthy Profit Margin */}
        {realizedProfitFromCompletedProjects > totalExpenses * 0.1 && (
            <div className="bg-secondary/10 p-4 lg:p-6 rounded-xl shadow-md border border-secondary flex items-center space-x-3 lg:space-x-4 animate-fade-in group">
                <Zap size={24} className="text-secondary flex-shrink-0 group-hover:scale-110 transition-transform duration-200"/>
                <div>
                    <h4 className="text-base lg:text-lg font-semibold text-darkGray dark:text-gray-100">Faa'iido Wanaagsan!</h4>
                    <p className="text-xs lg:text-sm text-mediumGray dark:text-gray-400">
                        Ganacsigaagu wuxuu ku socdaa waddo sax ah. Sii wad shaqada wanaagsan!
                    </p>
                    <Link href="/reports/profit-loss" className="text-primary text-xs lg:text-sm font-medium hover:underline mt-2 block">Fiiri Warbixinta Faa'iidada &rarr;</Link>
                </div>
            </div>
        )}
        {/* New Insight: Upcoming Payments */}
        {(projectStatusBreakdown.find(s => s.name === 'Upcoming')?.value ?? 0) > 0 && (
            <div className="bg-primary/10 p-4 lg:p-6 rounded-xl shadow-md border border-primary flex items-center space-x-3 lg:space-x-4 animate-fade-in group">
                <Clock size={24} className="text-primary flex-shrink-0 group-hover:scale-110 transition-transform duration-200"/>
                <div>
                    <h4 className="text-base lg:text-lg font-semibold text-darkGray dark:text-gray-100">Lacago Soo Socda!</h4>
                    <p className="text-xs lg:text-sm text-mediumGray dark:text-gray-400">
                        Waxaa jira <span className="font-bold">{projectStatusBreakdown.find(s => s.name === 'Upcoming')?.value} Lacag</span> oo la sugayo.
                    </p>
                    <Link href="/reports/payment-schedule" className="text-primary text-xs lg:text-sm font-medium hover:underline mt-2 block">Fiiri Jadwalka Lacagaha &rarr;</Link>
                </div>
            </div>
        )}
      </div>



      {/* Business Health Monitor */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md animate-fade-in-up mb-8">
        <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-4 flex items-center">
          <Activity className="mr-2 text-primary" size={24} />
          Xaaladda Ganacsiga
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20 hover:bg-primary/20 transition-colors duration-300">
            <Banknote className="mx-auto mb-2 text-primary" size={24} />
            <h4 className="font-semibold text-darkGray dark:text-gray-100">Cash Flow</h4>
            <p className="text-sm text-mediumGray dark:text-gray-400">
              {currentTotalBalance > 0 ? 'Wanaagsan' : 'Khatar'}
            </p>
          </div>
          <div className="text-center p-4 bg-accent/10 rounded-lg border border-accent/20 hover:bg-accent/20 transition-colors duration-300">
            <TrendingUp className="mx-auto mb-2 text-accent" size={24} />
            <h4 className="font-semibold text-darkGray dark:text-gray-100">Growth</h4>
            <p className="text-sm text-mediumGray dark:text-gray-400">
              {completedProjects > 0 ? 'Socota' : 'Bilaaw'}
            </p>
          </div>
          <div className="text-center p-4 bg-secondary/10 rounded-lg border border-secondary/20 hover:bg-secondary/20 transition-colors duration-300">
            <Zap className="mx-auto mb-2 text-secondary" size={24} />
            <h4 className="font-semibold text-darkGray dark:text-gray-100">Efficiency</h4>
            <p className="text-sm text-mediumGray dark:text-gray-400">
              {totalProjects > 0 ? ((completedProjects / totalProjects) * 100).toFixed(0) + '%' : '0%'}
            </p>
          </div>
          <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20 hover:bg-green-500/20 transition-colors duration-300">
            <Target className="mx-auto mb-2 text-green-500" size={24} />
            <h4 className="font-semibold text-darkGray dark:text-gray-100">Performance</h4>
            <p className="text-sm text-mediumGray dark:text-gray-400">
              {overdueProjects === 0 ? 'Wanaagsan' : 'Waa la saxay'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats Widget */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md animate-fade-in-up mb-8">
        <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-4 flex items-center">
          <BarChartIcon className="mr-2 text-primary" size={24} />
          Tirakoob Dhaqso leh
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20 hover:bg-primary/20 transition-colors duration-300">
            <Briefcase className="mx-auto mb-2 text-primary" size={24} />
            <div className="text-2xl font-bold text-darkGray dark:text-gray-100">{totalProjects}</div>
            <div className="text-sm text-mediumGray dark:text-gray-400">Mashaariic Guud</div>
          </div>
          <div className="text-center p-4 bg-secondary/10 rounded-lg border border-secondary/20 hover:bg-secondary/20 transition-colors duration-300">
            <CheckCircle className="mx-auto mb-2 text-secondary" size={24} />
            <div className="text-2xl font-bold text-darkGray dark:text-gray-100">{completedProjects}</div>
            <div className="text-sm text-mediumGray dark:text-gray-400">Dhammaystiran</div>
          </div>
          <div className="text-center p-4 bg-accent/10 rounded-lg border border-accent/20 hover:bg-accent/20 transition-colors duration-300">
            <Factory className="mx-auto mb-2 text-accent" size={24} />
            <div className="text-2xl font-bold text-darkGray dark:text-gray-100">0</div>
            <div className="text-sm text-mediumGray dark:text-gray-400">Amarka Warshadaha</div>
          </div>
          <div className="text-center p-4 bg-accent/10 rounded-lg border border-accent/20 hover:bg-accent/20 transition-colors duration-300">
            <Activity className="mx-auto mb-2 text-accent" size={24} />
            <div className="text-2xl font-bold text-darkGray dark:text-gray-100">{activeProjects}</div>
            <div className="text-sm text-mediumGray dark:text-gray-400">Firfircoon</div>
          </div>
          <div className="text-center p-4 bg-redError/10 rounded-lg border border-redError/20 hover:bg-redError/20 transition-colors duration-300">
            <XCircle className="mx-auto mb-2 text-redError" size={24} />
            <div className="text-2xl font-bold text-darkGray dark:text-gray-100">{overdueProjects}</div>
            <div className="text-sm text-mediumGray dark:text-gray-400">Dib u Dhacay</div>
          </div>
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

      {/* Transaction Links Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md animate-fade-in-up mb-8">
        <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-4 flex items-center">
          <DollarSign className="mr-2 text-primary" size={24} />
          Xiriirka Lacagaha
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">Lacagaha Dhexdhexaad</h4>
            <div className="space-y-3">
              <Link href="/accounting/transactions?type=INCOME" className="block p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <ArrowUpRight className="text-green-600 dark:text-green-400" size={20} />
                    <div>
                      <p className="font-semibold text-green-800 dark:text-green-200">Dakhliga</p>
                      <p className="text-sm text-green-600 dark:text-green-400">Lacagaha la helay</p>
                    </div>
                  </div>
                  <span className="text-green-600 dark:text-green-400 font-bold">{formatCurrency(totalIncome)}</span>
                </div>
              </Link>
              <Link href="/accounting/transactions?type=EXPENSE" className="block p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <ArrowDownLeft className="text-red-600 dark:text-red-400" size={20} />
                    <div>
                      <p className="font-semibold text-red-800 dark:text-red-200">Kharashyada</p>
                      <p className="text-sm text-red-600 dark:text-red-400">Lacagaha la bixiyay</p>
                    </div>
                  </div>
                  <span className="text-red-600 dark:text-red-400 font-bold">{formatCurrency(totalExpenses)}</span>
                </div>
              </Link>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-darkGray dark:text-gray-100">Mashaariicda</h4>
            <div className="space-y-3">
              <Link href="/projects?status=Completed" className="block p-4 bg-secondary/10 rounded-lg border border-secondary/20 hover:bg-secondary/20 transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="text-secondary" size={20} />
                    <div>
                      <p className="font-semibold text-darkGray dark:text-gray-100">Mashaariic Dhammaystiran</p>
                      <p className="text-sm text-mediumGray dark:text-gray-400">Faa'iidada dhabta ah</p>
                    </div>
                  </div>
                  <span className="text-secondary font-bold">{formatCurrency(realizedProfitFromCompletedProjects)}</span>
                </div>
              </Link>
              <Link href="/projects?status=Active" className="block p-4 bg-accent/10 rounded-lg border border-accent/20 hover:bg-accent/20 transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Activity className="text-accent" size={20} />
                    <div>
                      <p className="font-semibold text-darkGray dark:text-gray-100">Mashaariic Firfircoon</p>
                      <p className="text-sm text-mediumGray dark:text-gray-400">Faa'iidada suurtagal ah</p>
                    </div>
                  </div>
                  <span className="text-accent font-bold">{formatCurrency(potentialProfitFromActiveProjects)}</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>








      {/* Smart Quick Actions */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md animate-fade-in-up mb-8">
        <h3 className="text-xl font-semibold text-darkGray dark:text-gray-100 mb-4">⚡ Ficillo Dhaqso leh</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/accounting/transactions/add" className="group flex flex-col items-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">💰</div>
            <span className="text-sm font-medium text-green-800 dark:text-green-200">Lacag Dhexdhexaad</span>
          </Link>
          <Link href="/projects/add" className="group flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📋</div>
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Mashruuc Cusub</span>
          </Link>
          <Link href="/inventory/store/add" className="group flex flex-col items-center p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg border border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📦</div>
            <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Alaab Dhexdhexaad</span>
          </Link>
          <Link href="/reports" className="group flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300 hover:scale-105">
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📊</div>
            <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Warbixin</span>
          </Link>
        </div>
      </div>

      {/* Smart Notifications Panel */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 rounded-xl text-white animate-fade-in-up mb-8">
        <h3 className="text-xl font-semibold mb-4">🔔 Digniino Smart ah</h3>
        <div className="space-y-3">
          {lowStockItems > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center space-x-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <p className="font-semibold">Alaab Yar!</p>
                <p className="text-sm opacity-90">{lowStockItems} alaab ayaa stock-geedu hooseeyaa</p>
              </div>
            </div>
          )}
          {overdueProjects > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center space-x-3">
              <div className="text-2xl">🚨</div>
              <div>
                <p className="font-semibold">Mashaariic Dib u Dhacay!</p>
                <p className="text-sm opacity-90">{overdueProjects} mashruuc ayaa deadline-kiisa dhaafay</p>
              </div>
            </div>
          )}
          {realizedProfitFromCompletedProjects > 100000 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center space-x-3">
              <div className="text-2xl">🎉</div>
              <div>
                <p className="font-semibold">Faa'iido Wanaagsan!</p>
                <p className="text-sm opacity-90">Waxaad heshay {formatCurrency(realizedProfitFromCompletedProjects)} faa'iido dhab ah</p>
              </div>
            </div>
          )}
          {lowStockItems === 0 && overdueProjects === 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center space-x-3">
              <div className="text-2xl">✅</div>
              <div>
                <p className="font-semibold">Wax Digniin Ah Ma Jiraan</p>
                <p className="text-sm opacity-90">Ganacsigaagu wuxuu ku jiraa xaalad wanaagsan</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Add Floating Button (already in Layout.tsx) */}
    </Layout>
  );
// ...existing code...
}
