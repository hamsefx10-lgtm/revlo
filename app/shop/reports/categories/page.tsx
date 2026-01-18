'use client';

import React, { useState, useEffect } from 'react';
import {
    ArrowLeft,
    PieChart as PieChartIcon,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { subDays, startOfMonth, startOfYear } from 'date-fns';

interface CategoryData {
    name: string;
    value: number;
    count: number;
    [key: string]: any;
}

export default function SalesByCategoryPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<CategoryData[]>([]);
    const [dateRange, setDateRange] = useState('This Month');

    const COLORS = ['#3498DB', '#2ECC71', '#F1C40F', '#E74C3C', '#9B59B6', '#34495E', '#1ABC9C', '#E67E22'];

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let from = new Date();
            const to = new Date();

            if (dateRange === 'Last 7 Days') {
                from = subDays(new Date(), 7);
            } else if (dateRange === 'This Month') {
                from = startOfMonth(new Date());
            } else if (dateRange === 'This Year') {
                from = startOfYear(new Date());
            }

            const query = `?from=${from.toISOString()}&to=${to.toISOString()}`;
            const response = await fetch(`/api/shop/reports/categories${query}`);
            const result = await response.json();
            setData(result.categories || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen animate-fade-in pb-20 font-sans w-full max-w-7xl mx-auto md:p-8">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-4 md:px-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/shop/reports" className="text-mediumGray hover:text-darkGray dark:hover:text-white transition-colors flex items-center gap-1 text-xs font-black uppercase tracking-wider">
                            <ArrowLeft size={14} /> Back to Reports
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black text-darkGray dark:text-white tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-lightGray dark:border-gray-700 text-primary">
                            <PieChartIcon size={28} />
                        </div>
                        Sales by Category
                    </h1>
                    <p className="text-mediumGray font-medium mt-2 ml-1 text-sm">Revenue distribution across different product categories.</p>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-1.5 rounded-xl border border-lightGray dark:border-gray-800 shadow-sm self-start md:self-auto">
                    {['Last 7 Days', 'This Month', 'This Year'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${dateRange === range
                                ? 'bg-primary text-white shadow-md shadow-primary/30'
                                : 'text-mediumGray hover:text-darkGray dark:hover:text-white hover:bg-lightGray dark:hover:bg-gray-800'
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="h-96 flex items-center justify-center bg-white dark:bg-gray-900 rounded-[2rem] border border-lightGray dark:border-gray-800 mx-4 md:mx-0">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                </div>
            ) : data.length === 0 ? (
                <div className="h-96 flex flex-col items-center justify-center bg-white dark:bg-gray-900 rounded-[2rem] border border-lightGray dark:border-gray-800 mx-4 md:mx-0">
                    <div className="p-4 bg-gray-50 rounded-full mb-4">
                        <Database className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-mediumGray font-medium text-sm">No sales data found for this period.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 md:px-0">

                    {/* CHART SECTION */}
                    <div className="bg-white dark:bg-gray-900 border border-lightGray dark:border-gray-800 rounded-[2rem] p-8 shadow-sm flex flex-col h-[500px] animate-fade-in-up">
                        <h3 className="font-black text-lg text-darkGray dark:text-white mb-8 text-center uppercase tracking-tight">Revenue Share</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={140}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => `ETB ${value.toLocaleString()}`}
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                                        padding: '12px 16px',
                                        backgroundColor: '#fff',
                                        fontWeight: 'bold'
                                    }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* LIST SECTION */}
                    <div className="bg-white dark:bg-gray-900 border border-lightGray dark:border-gray-800 rounded-[2rem] p-8 shadow-sm h-[500px] overflow-y-auto animate-fade-in-up delay-100">
                        <h3 className="font-black text-lg text-darkGray dark:text-white mb-6 uppercase tracking-tight">Category Breakdown</h3>
                        <div className="space-y-4">
                            {data.map((item, index) => (
                                <div key={item.name} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl group hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-4 h-4 rounded-full ring-2 ring-white dark:ring-gray-900 shadow-sm"
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        />
                                        <div>
                                            <p className="font-bold text-darkGray dark:text-white text-sm">{item.name}</p>
                                            <p className="text-xs text-mediumGray font-bold">{item.count} items sold</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-darkGray dark:text-white">ETB {item.value.toLocaleString()}</p>
                                        <p className="text-xs text-mediumGray font-bold">
                                            {((item.value / data.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}

// Simple icon for empty state
function Database(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
    )
}
