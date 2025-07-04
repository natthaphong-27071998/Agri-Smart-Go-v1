

import React, { useMemo } from 'react';
import StatCard from '../components/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { supabase } from '../supabase';
import { FinancialTransaction, SalesOrderRecord } from '../types';
import Spinner from '../components/Spinner';
import { useSupabase } from '../hooks/useSupabase';

type DashboardData = {
    todayIncomeData: { amount: number }[];
    monthSalesData: { totalAmount: number }[];
    employeeCount: number;
    newOrdersCount: number;
    monthlyTxData: FinancialTransaction[];
};

const DashboardPage: React.FC = () => {

    const { data, loading } = useSupabase<DashboardData>(async () => {
        const today = new Date().toISOString().split('T')[0];
        const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        const sixMonthsAgo = new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0];

        const [
            todayIncomeRes,
            monthSalesRes,
            employeeCountRes,
            newOrdersCountRes,
            monthlyTxRes
        ] = await Promise.all([
            supabase.from('financial_transactions').select('amount').eq('type', 'Income').eq('date', today),
            supabase.from('sales_orders').select('totalAmount').gte('orderDate', firstDayOfMonth).in('status', ['Delivered', 'Shipped', 'Processing']),
            supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
            supabase.from('sales_orders').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
            supabase.from('financial_transactions').select('date, type, amount').gte('date', sixMonthsAgo)
        ]);
        
        const firstError = todayIncomeRes.error || monthSalesRes.error || employeeCountRes.error || newOrdersCountRes.error || monthlyTxRes.error;
        if(firstError) throw firstError;
        
        return { 
            data: {
                todayIncomeData: todayIncomeRes.data || [],
                monthSalesData: monthSalesRes.data || [],
                employeeCount: employeeCountRes.count || 0,
                newOrdersCount: newOrdersCountRes.count || 0,
                monthlyTxData: monthlyTxRes.data || []
            },
            error: null
        };
    });

    const { stats, revenueData } = useMemo(() => {
        if (!data) {
            return { stats: { todayIncome: 0, monthSales: 0, employeeCount: 0, newOrders: 0 }, revenueData: [] };
        }
        
        const newStats = {
            todayIncome: data.todayIncomeData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0,
            monthSales: data.monthSalesData?.reduce((sum, item) => sum + (item.totalAmount || 0), 0) || 0,
            employeeCount: data.employeeCount || 0,
            newOrders: data.newOrdersCount || 0
        };

        const monthlyRevenue = (data.monthlyTxData || []).reduce((acc, { date, type, amount }) => {
            if (!date || !amount) return acc;
            const month = new Date(date).toLocaleString('th-TH', { month: 'short' });
            if (!acc[month]) {
                acc[month] = { name: month, income: 0, expense: 0 };
            }
            if (type === 'Income') {
                acc[month].income += amount;
            } else {
                acc[month].expense += amount;
            }
            return acc;
        }, {} as Record<string, {name: string, income: number, expense: number}>);
        
        const newRevenueData = Object.values(monthlyRevenue).reverse();

        return { stats: newStats, revenueData: newRevenueData };

    }, [data]);
    

    const sensorData = [
        { time: '08:00', temperature: 28, humidity: 65 },
        { time: '10:00', temperature: 30, humidity: 62 },
        { time: '12:00', temperature: 32, humidity: 58 },
        { time: '14:00', temperature: 33, humidity: 55 },
        { time: '16:00', temperature: 31, humidity: 60 },
    ];

    if (loading) {
        return <Spinner />;
    }
    
    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard 
                    title="รายรับวันนี้" 
                    value={`฿${stats.todayIncome.toLocaleString()}`}
                    color="bg-green-100 text-green-600"
                    darkColor="dark:bg-green-900/50 dark:text-green-300"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>}
                />
                 <StatCard 
                    title="ยอดขายเดือนนี้" 
                    value={`฿${stats.monthSales.toLocaleString()}`}
                    color="bg-blue-100 text-blue-600"
                    darkColor="dark:bg-blue-900/50 dark:text-blue-300"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                />
                <StatCard 
                    title="พนักงานทั้งหมด" 
                    value={`${stats.employeeCount} คน`}
                    color="bg-yellow-100 text-yellow-600"
                    darkColor="dark:bg-yellow-900/50 dark:text-yellow-300"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                />
                 <StatCard 
                    title="ออเดอร์ใหม่" 
                    value={`${stats.newOrders} รายการ`}
                    color="bg-red-100 text-red-600"
                    darkColor="dark:bg-red-900/50 dark:text-red-300"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">ภาพรวมการเงิน (6 เดือนล่าสุด)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                            <XAxis dataKey="name" tick={{ fill: '#a0a0a0' }} />
                            <YAxis tick={{ fill: '#a0a0a0' }}/>
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none' }} itemStyle={{ color: '#e5e7eb' }} />
                            <Legend wrapperStyle={{ color: '#e5e7eb' }}/>
                            <Bar dataKey="income" name="รายรับ" fill="#4ade80" />
                            <Bar dataKey="expense" name="รายจ่าย" fill="#f87171" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">ข้อมูลจากเซ็นเซอร์ (วันนี้)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={sensorData}>
                             <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                             <XAxis dataKey="time" tick={{ fill: '#a0a0a0' }}/>
                             <YAxis tick={{ fill: '#a0a0a0' }} />
                             <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none' }} itemStyle={{ color: '#e5e7eb' }}/>
                             <Legend wrapperStyle={{ color: '#e5e7eb' }}/>
                             <Line type="monotone" dataKey="temperature" name="อุณหภูมิ (°C)" stroke="#3b82f6" activeDot={{ r: 8 }}/>
                             <Line type="monotone" dataKey="humidity" name="ความชื้น (%)" stroke="#f97316" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;