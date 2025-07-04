

import React, { useState, useMemo, useEffect } from 'react';
import { InvestmentProject, RiskItem, InvestmentStatus, RiskLevel, RiskCategory, RiskStatus } from '../../types';
import DataTable, { Column } from '../../components/DataTable';
import StatCard from '../../components/StatCard';
import Modal from '../../components/Modal';
import { supabase } from '../../supabase';
import Spinner from '../../components/Spinner';

const ALL_INVESTMENT_STATUSES: InvestmentStatus[] = ['วางแผน', 'อนุมัติแล้ว', 'กำลังดำเนินการ', 'เสร็จสิ้น'];
const ALL_RISK_CATEGORIES: RiskCategory[] = ['ภัยธรรมชาติ', 'โรคระบาด', 'ราคาตลาด', 'การดำเนินงาน'];
const ALL_RISK_LEVELS: RiskLevel[] = ['ต่ำ', 'ปานกลาง', 'สูง'];
const ALL_RISK_STATUSES: RiskStatus[] = ['ระบุแล้ว', 'กำลังจัดการ', 'จัดการแล้ว', 'เกิดขึ้นจริง'];


const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors focus:outline-none border-b-2 ${
            active ? 'border-green-600 text-green-700 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
    >
        {children}
    </button>
);

const RiskLevelBadge: React.FC<{ level: RiskLevel | null }> = ({ level }) => {
    if (!level) return null;
    const colors: Record<RiskLevel, string> = {
        'ต่ำ': 'bg-green-100 text-green-800',
        'ปานกลาง': 'bg-yellow-100 text-yellow-800',
        'สูง': 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[level]}`}>{level}</span>;
}

const defaultNewProject: Omit<InvestmentProject, 'id'> = { name: '', description: '', investmentCost: 0, expectedRevenue: 0, status: 'วางแผน' };
const defaultNewRisk: Omit<RiskItem, 'id'> = { riskName: '', category: 'การดำเนินงาน', likelihood: 'ต่ำ', impact: 'ต่ำ', mitigationPlan: '', status: 'ระบุแล้ว' };

const InvestmentRiskPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'investment' | 'risk'>('investment');
    const [loading, setLoading] = useState(true);

    const [investments, setInvestments] = useState<InvestmentProject[]>([]);
    const [risks, setRisks] = useState<RiskItem[]>([]);
    
    const [isInvestmentModalOpen, setInvestmentModalOpen] = useState(false);
    const [isRiskModalOpen, setRiskModalOpen] = useState(false);

    const [newProjectData, setNewProjectData] = useState(defaultNewProject);
    const [newRiskData, setNewRiskData] = useState(defaultNewRisk);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [
                investmentsRes,
                risksRes
            ] = await Promise.all([
                supabase.from('investment_projects').select('*').order('name'),
                supabase.from('risk_items').select('*').order('riskName')
            ]);
            if (investmentsRes.error) throw investmentsRes.error;
            if (risksRes.error) throw risksRes.error;
            setInvestments(investmentsRes.data || []);
            setRisks(risksRes.data || []);
        } catch (error) {
            console.error('Error fetching investment/risk data:', error);
            alert('ไม่สามารถดึงข้อมูลได้');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    const handleInvestmentStatusChange = async (id: string, newStatus: InvestmentStatus) => {
        const { error } = await supabase.from('investment_projects').update({ status: newStatus }).eq('id', id);
        if (error) {
            alert('ไม่สามารถอัปเดตสถานะได้');
        } else {
            setInvestments(current => current.map(proj => proj.id === id ? { ...proj, status: newStatus } : proj));
        }
    };

    const handleRiskStatusChange = async (id: string, newStatus: RiskStatus) => {
        const { error } = await supabase.from('risk_items').update({ status: newStatus }).eq('id', id);
        if (error) {
            alert('ไม่สามารถอัปเดตสถานะได้');
        } else {
            setRisks(current => current.map(risk => risk.id === id ? { ...risk, status: newStatus } : risk));
        }
    };

    const investmentColumns: Column<InvestmentProject>[] = [
        { header: 'โครงการ', accessor: 'name', className: 'font-bold' },
        { header: 'ต้นทุน (บาท)', accessor: item => (item.investmentCost ?? 0).toLocaleString(), className: 'text-right' },
        { header: 'รายได้คาดหวัง (บาท)', accessor: item => (item.expectedRevenue ?? 0).toLocaleString(), className: 'text-right' },
        { header: 'ROI (%)', accessor: item => {
            const cost = item.investmentCost ?? 0;
            const revenue = item.expectedRevenue ?? 0;
            const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;
            return <span className={roi >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{roi.toFixed(2)}%</span>
        }, className: 'text-right' },
        { header: 'สถานะ', accessor: item => (
            <select
              value={item.status ?? 'วางแผน'}
              onChange={(e) => handleInvestmentStatusChange(item.id, e.target.value as InvestmentStatus)}
              onClick={e => e.stopPropagation()}
              className="p-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              {ALL_INVESTMENT_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
        )}
    ];

    const riskColumns: Column<RiskItem>[] = [
        { header: 'ความเสี่ยง', accessor: 'riskName', className: 'font-bold' },
        { header: 'หมวดหมู่', accessor: 'category' },
        { header: 'โอกาสเกิด', accessor: item => <RiskLevelBadge level={item.likelihood} /> },
        { header: 'ผลกระทบ', accessor: item => <RiskLevelBadge level={item.impact} /> },
        { header: 'สถานะ', accessor: item => (
                <select value={item.status ?? 'ระบุแล้ว'} onChange={(e) => handleRiskStatusChange(item.id, e.target.value as RiskStatus)} onClick={e => e.stopPropagation()} className="p-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                    {ALL_RISK_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
            )
        }
    ];
    
    const totalInvestment = useMemo(() => investments.reduce((sum, item) => sum + (item.investmentCost ?? 0), 0), [investments]);
    const averageROI = useMemo(() => {
        const profitableInvestments = investments.filter(item => (item.investmentCost ?? 0) > 0);
        if (profitableInvestments.length === 0) return 0;
        const totalROI = profitableInvestments.reduce((sum, item) => sum + (((item.expectedRevenue ?? 0) - (item.investmentCost ?? 0)) / (item.investmentCost ?? 1)) * 100, 0);
        return totalROI / profitableInvestments.length;
    }, [investments]);
    
    const calculatedROI = useMemo(() => {
        const { investmentCost, expectedRevenue } = newProjectData;
        if ((investmentCost ?? 0) <= 0) return 0;
        return (((expectedRevenue ?? 0) - (investmentCost ?? 0)) / (investmentCost ?? 1)) * 100;
    }, [newProjectData]);
    
    const handleSaveProject = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from('investment_projects').insert(newProjectData);
        if (error) {
            alert('ไม่สามารถบันทึกโครงการได้');
            console.error(error);
        } else {
            setInvestmentModalOpen(false);
            setNewProjectData(defaultNewProject);
            fetchData();
        }
    };
    
    const handleSaveRisk = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from('risk_items').insert(newRiskData);
        if (error) {
            alert('ไม่สามารถบันทึกความเสี่ยงได้');
            console.error(error);
        } else {
            setRiskModalOpen(false);
            setNewRiskData(defaultNewRisk);
            fetchData();
        }
    }

    const renderInvestmentTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="มูลค่าการลงทุนรวม" value={`฿${totalInvestment.toLocaleString()}`} color="bg-blue-100 text-blue-600" darkColor="dark:bg-blue-900/50 dark:text-blue-300" icon={<span className="text-2xl">💰</span>} />
                <StatCard title="ROI เฉลี่ย" value={`${averageROI.toFixed(2)}%`} color="bg-green-100 text-green-600" darkColor="dark:bg-green-900/50 dark:text-green-300" icon={<span className="text-2xl">📈</span>} />
                <StatCard title="โครงการที่กำลังดำเนินการ" value={`${investments.filter(i => i.status === 'กำลังดำเนินการ').length} โครงการ`} color="bg-yellow-100 text-yellow-600" darkColor="dark:bg-yellow-900/50 dark:text-yellow-300" icon={<span className="text-2xl">🏗️</span>} />
            </div>
             <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">รายการโครงการลงทุน</h3><button onClick={() => setInvestmentModalOpen(true)} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">เพิ่มโครงการใหม่</button></div>
                <DataTable columns={investmentColumns} data={investments} />
            </div>
        </div>
    );

    const renderRiskTab = () => (
         <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">รายการความเสี่ยง</h3><button onClick={() => setRiskModalOpen(true)} className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700">บันทึกความเสี่ยงใหม่</button></div>
            <DataTable columns={riskColumns} data={risks} />
        </div>
    );


    return (
        <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-2">
                 <div className="flex space-x-2">
                    <TabButton active={activeTab === 'investment'} onClick={() => setActiveTab('investment')}>การวางแผนการลงทุน</TabButton>
                    <TabButton active={activeTab === 'risk'} onClick={() => setActiveTab('risk')}>การจัดการความเสี่ยง</TabButton>
                </div>
            </div>
            <div>
                {loading ? <div className="flex justify-center p-10"><Spinner/></div> : (activeTab === 'investment' ? renderInvestmentTab() : renderRiskTab())}
            </div>
            
            <Modal title="เพิ่มโครงการลงทุนใหม่" isOpen={isInvestmentModalOpen} onClose={() => setInvestmentModalOpen(false)}>
                 <form onSubmit={handleSaveProject} className="space-y-4">
                     <div><label className="block text-sm font-medium text-gray-700">ชื่อโครงการ</label><input type="text" value={newProjectData.name ?? ''} onChange={e => setNewProjectData({...newProjectData, name: e.target.value})} placeholder="เช่น ซื้อโดรนเพื่อการเกษตร" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required/></div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div><label className="block text-sm font-medium text-gray-700">ต้นทุนการลงทุน (บาท)</label><input type="number" value={newProjectData.investmentCost ?? ''} onChange={e => setNewProjectData({...newProjectData, investmentCost: Number(e.target.value)})} placeholder="750000" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
                        <div><label className="block text-sm font-medium text-gray-700">รายได้ที่คาดหวัง (บาท)</label><input type="number" value={newProjectData.expectedRevenue ?? ''} onChange={e => setNewProjectData({...newProjectData, expectedRevenue: Number(e.target.value)})} placeholder="1200000" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" /></div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center"><p className="text-sm font-medium text-gray-600">ผลตอบแทนจากการลงทุน (ROI)</p><p className={`text-3xl font-bold ${calculatedROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>{calculatedROI.toFixed(2)}%</p></div>
                    <div className="pt-4 flex justify-end space-x-2"><button type="button" onClick={() => setInvestmentModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">ยกเลิก</button><button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">บันทึกโครงการ</button></div>
                </form>
            </Modal>

            <Modal title="บันทึกความเสี่ยงใหม่" isOpen={isRiskModalOpen} onClose={() => setRiskModalOpen(false)}>
                 <form onSubmit={handleSaveRisk} className="space-y-4">
                     <div><label className="block text-sm font-medium text-gray-700">ชื่อความเสี่ยง</label><input type="text" value={newRiskData.riskName ?? ''} onChange={e => setNewRiskData({...newRiskData, riskName: e.target.value})} placeholder="เช่น ราคาผลผลิตตกต่ำ" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required/></div>
                     <div><label className="block text-sm font-medium text-gray-700">หมวดหมู่</label><select value={newRiskData.category ?? 'การดำเนินงาน'} onChange={e => setNewRiskData({...newRiskData, category: e.target.value as RiskCategory})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">{ALL_RISK_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700">โอกาสเกิด</label><select value={newRiskData.likelihood ?? 'ต่ำ'} onChange={e => setNewRiskData({...newRiskData, likelihood: e.target.value as RiskLevel})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">{ALL_RISK_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}</select></div>
                         <div><label className="block text-sm font-medium text-gray-700">ผลกระทบ</label><select value={newRiskData.impact ?? 'ต่ำ'} onChange={e => setNewRiskData({...newRiskData, impact: e.target.value as RiskLevel})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">{ALL_RISK_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}</select></div>
                    </div>
                     <div><label className="block text-sm font-medium text-gray-700">แผนการรับมือ / ลดความเสี่ยง</label><textarea rows={3} value={newRiskData.mitigationPlan ?? ''} onChange={e => setNewRiskData({...newRiskData, mitigationPlan: e.target.value})} placeholder="เช่น เตรียมแหล่งน้ำสำรอง, หาตลาดใหม่" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea></div>
                    <div className="pt-4 flex justify-end space-x-2"><button type="button" onClick={() => setRiskModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">ยกเลิก</button><button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700">บันทึกความเสี่ยง</button></div>
                </form>
            </Modal>
        </div>
    );
};

export default InvestmentRiskPage;