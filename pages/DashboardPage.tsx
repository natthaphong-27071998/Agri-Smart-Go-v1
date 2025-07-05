

import React, { useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import StatCard from '../components/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../supabase';
import { FinancialTransaction, SalesOrderRecord, Plot, InvestmentProject, RiskItem, IoTDevice, FarmActivity, PlotStatus } from '../types';
import Spinner from '../components/Spinner';
import { useSupabase } from '../hooks/useSupabase';
import { ICONS } from '../constants';

type DashboardData = {
    todayIncomeData: { amount: number }[];
    monthSalesData: { totalAmount: number }[];
    employeeCount: number;
    newOrdersCount: number;
    monthlyTxData: FinancialTransaction[];
    plotsData: Pick<Plot, 'status'>[];
    investmentsData: Pick<InvestmentProject, 'investmentCost'>[];
    risksData: { count: number };
    devicesData: Pick<IoTDevice, 'status'>[];
    recentActivitiesData: FarmActivity[];
};

const PLOT_STATUS_COLORS: Record<string, string> = {
    'ว่าง': '#9ca3af', // gray-400
    'เตรียมดิน': '#facc15', // yellow-400
    'กำลังเติบโต': '#4ade80', // green-400
    'พร้อมเก็บเกี่ยว': '#2dd4bf', // teal-400
    'เก็บเกี่ยวแล้ว': '#60a5fa', // blue-400
};

const QuickActionButton: React.FC<{ icon: React.ReactNode; title: string; to: string; color: string; darkColor: string; }> = ({ icon, title, to, color, darkColor }) => (
    <ReactRouterDOM.Link to={to} className={`flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors shadow-sm border dark:border-gray-700`}>
        <div className={`p-3 rounded-full ${color} ${darkColor}`}>
            {icon}
        </div>
        <span className="ml-4 font-semibold text-gray-700 dark:text-gray-200">{title}</span>
        <svg className="w-5 h-5 ml-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
    </ReactRouterDOM.Link>
);

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
            monthlyTxRes,
            plotsRes,
            investmentsRes,
            risksRes,
            devicesRes,
            recentActivitiesRes
        ] = await Promise.all([
            supabase.from('financial_transactions').select('amount').eq('type', 'Income').eq('date', today),
            supabase.from('sales_orders').select('totalAmount').gte('orderDate', firstDayOfMonth).in('status', ['Delivered', 'Shipped', 'Processing']),
            supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
            supabase.from('sales_orders').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
            supabase.from('financial_transactions').select('date, type, amount').gte('date', sixMonthsAgo),
            supabase.from('plots').select('status'),
            supabase.from('investment_projects').select('investmentCost').eq('status', 'กำลังดำเนินการ'),
            supabase.from('risk_items').select('*', { count: 'exact', head: true }).in('status', ['ระบุแล้ว', 'กำลังจัดการ']).eq('impact', 'สูง'),
            supabase.from('iot_devices').select('status'),
            supabase.from('farm_activities').select('id, activityType, plotName, date').order('date', { ascending: false }).limit(5)
        ]);
        
        const firstError = [todayIncomeRes, monthSalesRes, employeeCountRes, newOrdersCountRes, monthlyTxRes, plotsRes, investmentsRes, risksRes, devicesRes, recentActivitiesRes].find(res => res.error)?.error;
        if(firstError) throw firstError;
        
        return { 
            data: {
                todayIncomeData: todayIncomeRes.data || [],
                monthSalesData: monthSalesRes.data || [],
                employeeCount: employeeCountRes.count || 0,
                newOrdersCount: newOrdersCountRes.count || 0,
                monthlyTxData: monthlyTxRes.data || [],
                plotsData: plotsRes.data || [],
                investmentsData: investmentsRes.data || [],
                risksData: { count: risksRes.count || 0 },
                devicesData: devicesRes.data || [],
                recentActivitiesData: recentActivitiesRes.data || []
            },
            error: null
        };
    });

    const { stats, revenueData, plotStatusData, recentActivities } = useMemo(() => {
        if (!data) {
            return { 
                stats: { todayIncome: 0, monthSales: 0, newOrders: 0, activeEmployees: 0, harvestReadyPlots: 0, ongoingInvestment: 0, highRisks: 0, onlineDevices: 0 }, 
                revenueData: [], 
                plotStatusData: [],
                recentActivities: []
            };
        }
        
        const newStats = {
            todayIncome: data.todayIncomeData.reduce((sum, item) => sum + (item.amount || 0), 0),
            monthSales: data.monthSalesData.reduce((sum, item) => sum + (item.totalAmount || 0), 0),
            newOrders: data.newOrdersCount,
            activeEmployees: data.employeeCount,
            harvestReadyPlots: data.plotsData.filter(p => p.status === 'พร้อมเก็บเกี่ยว').length,
            ongoingInvestment: data.investmentsData.reduce((sum, item) => sum + (item.investmentCost || 0), 0),
            highRisks: data.risksData.count,
            onlineDevices: data.devicesData.filter(d => d.status === 'Online').length,
        };

        const monthlyRevenue = (data.monthlyTxData || []).reduce((acc, { date, type, amount }) => {
            if (!date || !amount) return acc;
            const month = new Date(date).toLocaleString('th-TH', { month: 'short' });
            if (!acc[month]) {
                acc[month] = { name: month, income: 0, expense: 0 };
            }
            if (type === 'Income') acc[month].income += amount;
            else acc[month].expense += amount;
            return acc;
        }, {} as Record<string, {name: string, income: number, expense: number}>);
        
        const newRevenueData = Object.values(monthlyRevenue).reverse();
        
        const plotStatusCounts = data.plotsData.reduce((acc, plot) => {
            if (plot.status) {
                acc[plot.status] = (acc[plot.status] || 0) + 1;
            }
            return acc;
        }, {} as Record<PlotStatus, number>);

        const newPlotStatusData = Object.entries(plotStatusCounts).map(([name, value]) => ({ name, value }));

        return { stats: newStats, revenueData: newRevenueData, plotStatusData: newPlotStatusData, recentActivities: data.recentActivitiesData };

    }, [data]);
    

    if (loading) {
        return <Spinner />;
    }
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ReactRouterDOM.Link to="/accounting"><StatCard title="รายรับวันนี้" value={`฿${stats.todayIncome.toLocaleString()}`} color="bg-green-100 text-green-600" darkColor="dark:bg-green-900/50 dark:text-green-300" icon={ICONS.ACCOUNTING}/></ReactRouterDOM.Link>
                <ReactRouterDOM.Link to="/sales"><StatCard title="ยอดขายเดือนนี้" value={`฿${stats.monthSales.toLocaleString()}`} color="bg-blue-100 text-blue-600" darkColor="dark:bg-blue-900/50 dark:text-blue-300" icon={ICONS.SALES}/></ReactRouterDOM.Link>
                <ReactRouterDOM.Link to="/sales"><StatCard title="ออเดอร์ใหม่" value={`${stats.newOrders} รายการ`} color="bg-red-100 text-red-600" darkColor="dark:bg-red-900/50 dark:text-red-300" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} /></ReactRouterDOM.Link>
                <ReactRouterDOM.Link to="/hr"><StatCard title="พนักงานที่ทำงานอยู่" value={`${stats.activeEmployees} คน`} color="bg-yellow-100 text-yellow-600" darkColor="dark:bg-yellow-900/50 dark:text-yellow-300" icon={ICONS.HR}/></ReactRouterDOM.Link>
                <ReactRouterDOM.Link to="/production"><StatCard title="แปลงพร้อมเก็บเกี่ยว" value={`${stats.harvestReadyPlots} แปลง`} color="bg-teal-100 text-teal-600" darkColor="dark:bg-teal-900/50 dark:text-teal-300" icon={ICONS.PRODUCTION}/></ReactRouterDOM.Link>
                <ReactRouterDOM.Link to="/investment"><StatCard title="กำลังลงทุน" value={`฿${stats.ongoingInvestment.toLocaleString()}`} color="bg-purple-100 text-purple-600" darkColor="dark:bg-purple-900/50 dark:text-purple-300" icon={ICONS.INVESTMENT}/></ReactRouterDOM.Link>
                <ReactRouterDOM.Link to="/investment"><StatCard title="ความเสี่ยงสูง" value={`${stats.highRisks} รายการ`} color="bg-orange-100 text-orange-600" darkColor="dark:bg-orange-900/50 dark:text-orange-300" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}/></ReactRouterDOM.Link>
                <ReactRouterDOM.Link to="/production"><StatCard title="อุปกรณ์ออนไลน์" value={`${stats.onlineDevices} เครื่อง`} color="bg-indigo-100 text-indigo-600" darkColor="dark:bg-indigo-900/50 dark:text-indigo-300" icon={ICONS.WIFI}/></ReactRouterDOM.Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">ภาพรวมการเงิน (6 เดือนล่าสุด)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
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
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">ภาพรวมสถานะแปลงปลูก</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={plotStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {plotStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={PLOT_STATUS_COLORS[entry.name] || '#8884d8'} />)}
                            </Pie>
                             <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none' }} itemStyle={{ color: '#e5e7eb' }}/>
                             <Legend wrapperStyle={{ color: '#e5e7eb' }}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                     <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">ทางลัด (Quick Actions)</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <QuickActionButton to="/sales" title="สร้างใบเสนอราคา" icon={ICONS.SALES} color="bg-green-100" darkColor="dark:bg-green-900/50" />
                        <QuickActionButton to="/accounting" title="บันทึกรายจ่าย" icon={ICONS.ACCOUNTING} color="bg-red-100" darkColor="dark:bg-red-900/50" />
                        <QuickActionButton to="/production" title="เพิ่มกิจกรรมในแปลง" icon={ICONS.PRODUCTION} color="bg-blue-100" darkColor="dark:bg-blue-900/50" />
                        <QuickActionButton to="/hr" title="เพิ่มพนักงานใหม่" icon={ICONS.HR} color="bg-yellow-100" darkColor="dark:bg-yellow-900/50" />
                     </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">กิจกรรมล่าสุด</h3>
                    <div className="space-y-3">
                        {recentActivities.length > 0 ? recentActivities.map(activity => (
                             <div key={activity.id} className="flex items-center text-sm">
                                <span className="text-gray-400 mr-2">{new Date(activity.date ?? '').toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })}:</span>
                                <span className="font-medium text-gray-800 dark:text-gray-200">{activity.activityType}</span>
                                <span className="text-gray-600 dark:text-gray-400 mx-1">ที่</span>
                                <span className="font-medium text-gray-800 dark:text-gray-200">{activity.plotName}</span>
                            </div>
                        )) : (
                            <p className="text-sm text-center text-gray-500 py-4">ไม่มีกิจกรรมล่าสุด</p>
                        )}
                         <div className="text-center pt-2">
                             <ReactRouterDOM.Link to="/production" className="text-sm font-semibold text-green-600 hover:text-green-500">ดูกิจกรรมทั้งหมด &rarr;</ReactRouterDOM.Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;