


import React, { useState, useMemo } from 'react';
import DataTable, { Column } from '../../components/DataTable';
import Modal from '../../components/Modal';
import { FinancialTransaction, Asset, Receivable, Payable } from '../../types';
import { supabase } from '../../supabase';
import Spinner from '../../components/Spinner';
import { useSupabase } from '../../hooks/useSupabase';
import { useToast } from '../../contexts/ToastContext';

// ... (mockChartOfAccounts can remain the same)

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors focus:outline-none ${
            active ? 'bg-white dark:bg-gray-800 border-green-600 border-b-2 text-green-700 dark:text-green-400 font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
    >
        {children}
    </button>
);

const defaultTransactionData: Omit<FinancialTransaction, 'id'> = {
    date: new Date().toISOString().substring(0, 10),
    type: 'Expense',
    description: '',
    category: '',
    amount: null,
};

const defaultAssetData: Omit<Asset, 'id'> = {
    name: '',
    purchaseDate: new Date().toISOString().substring(0, 10),
    purchaseCost: null,
    usefulLife: 10,
    salvageValue: 0,
    depreciationMethod: 'Straight-line',
    status: 'ใช้งาน',
};

const FarmAccountingPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'accounts' | 'ap_ar' | 'assets' | 'statements'>('overview');
    const { toast } = useToast();
    
    // Data states with useSupabase
    const { data, loading, refetch } = useSupabase(async () => {
        const [
            transactionsRes,
            assetsRes,
            receivablesRes,
            payablesRes
        ] = await Promise.all([
            supabase.from('financial_transactions').select('*').order('date', { ascending: false }),
            supabase.from('assets').select('*').order('purchaseDate', { ascending: false }),
            supabase.from('receivables').select('*').order('dueDate', { ascending: true }),
            supabase.from('payables').select('*').order('dueDate', { ascending: true })
        ]);

        const firstError = transactionsRes.error || assetsRes.error || receivablesRes.error || payablesRes.error;
        if(firstError) throw firstError;
        
        return { data: {
            transactions: transactionsRes.data || [],
            assets: assetsRes.data || [],
            receivables: receivablesRes.data || [],
            payables: payablesRes.data || [],
        }, error: null };
    });
    
    const { transactions, assets, receivables, payables } = data || { transactions: [], assets: [], receivables: [], payables: [] };

    // Modal states
    const [isTransactionModalOpen, setTransactionModalOpen] = useState(false);
    const [isAssetModalOpen, setAssetModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [newTransactionData, setNewTransactionData] = useState(defaultTransactionData);
    const [newAssetData, setNewAssetData] = useState(defaultAssetData);

    const { totalIncome, totalExpense, netProfit, totalReceivable, totalPayable } = useMemo(() => {
        if(!data) return { totalIncome: 0, totalExpense: 0, netProfit: 0, totalReceivable: 0, totalPayable: 0};
        const totalIncome = data.transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalExpense = data.transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + (t.amount || 0), 0);
        const netProfit = totalIncome - totalExpense;
        const totalReceivable = data.receivables.filter(r => r.status === 'ค้างชำระ').reduce((sum, r) => sum + (r.amount || 0), 0);
        const totalPayable = data.payables.filter(p => p.status === 'ค้างจ่าย').reduce((sum, p) => sum + (p.amount || 0), 0);
        return { totalIncome, totalExpense, netProfit, totalReceivable, totalPayable };
    }, [data]);
    
    const handleSaveTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const { error } = await supabase.from('financial_transactions').insert(newTransactionData);
        if (error) {
            toast('ไม่สามารถบันทึกรายการได้: ' + error.message, 'error');
        } else {
            toast('บันทึกรายการสำเร็จ', 'success');
            setTransactionModalOpen(false);
            refetch();
        }
        setIsSubmitting(false);
    };

    const handleSaveAsset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const { error } = await supabase.from('assets').insert(newAssetData);
        if (error) {
            toast('ไม่สามารถบันทึกสินทรัพย์ได้: ' + error.message, 'error');
        } else {
            toast('บันทึกสินทรัพย์สำเร็จ', 'success');
            setAssetModalOpen(false);
            refetch();
        }
        setIsSubmitting(false);
    };


    const transactionColumns: Column<FinancialTransaction>[] = [
        { header: 'วันที่', accessor: 'date' },
        { header: 'รายการ', accessor: 'description', className: 'font-medium text-gray-900 dark:text-gray-100' },
        { header: 'ประเภท', accessor: (item) => <span className={`font-semibold ${item.type === 'Income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{item.type === 'Income' ? 'รายรับ' : 'รายจ่าย'}</span> },
        { header: 'จำนวนเงิน (บาท)', accessor: (item) => item.amount?.toLocaleString('th-TH', { minimumFractionDigits: 2 }), className: 'text-right' },
    ];
    
    const assetColumns: Column<Asset>[] = [
        { header: 'ชื่อสินทรัพย์', accessor: 'name' },
        { header: 'วันที่ซื้อ', accessor: 'purchaseDate' },
        { header: 'ราคาทุน', accessor: item => item.purchaseCost?.toLocaleString('th-TH'), className: 'text-right' },
        { header: 'ค่าเสื่อม/ปี', accessor: item => item.purchaseCost && item.salvageValue != null && item.usefulLife ? ((item.purchaseCost - item.salvageValue) / item.usefulLife).toLocaleString('th-TH') : 'N/A', className: 'text-right' },
        { header: 'สถานะ', accessor: 'status' },
    ];
    
    const receivableColumns: Column<Receivable>[] = [
        { header: 'ลูกค้า', accessor: 'customerName' },
        { header: 'เลขที่ใบแจ้งหนี้', accessor: 'invoiceId' },
        { header: 'วันครบกำหนด', accessor: 'dueDate' },
        { header: 'จำนวนเงิน', accessor: item => item.amount?.toLocaleString('th-TH'), className: 'text-right' },
        { header: 'สถานะ', accessor: item => <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'ชำระแล้ว' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}`}>{item.status}</span> },
    ];
    
    const payableColumns: Column<Payable>[] = [
        { header: 'เจ้าหนี้', accessor: 'vendorName' },
        { header: 'เลขที่ใบแจ้งหนี้', accessor: 'invoiceId' },
        { header: 'วันครบกำหนด', accessor: 'dueDate' },
        { header: 'จำนวนเงิน', accessor: item => item.amount?.toLocaleString('th-TH'), className: 'text-right' },
        { header: 'สถานะ', accessor: item => <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'จ่ายแล้ว' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>{item.status}</span> },
    ];

    const openTransactionModal = () => { setNewTransactionData(defaultTransactionData); setTransactionModalOpen(true); }
    const openAssetModal = () => { setNewAssetData(defaultAssetData); setAssetModalOpen(true); }

    const renderContent = () => {
        if (loading) {
            return <div className="flex justify-center p-10"><Spinner /></div>;
        }

        switch(activeTab) {
            case 'overview':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center"><h3 className="text-lg text-gray-500 dark:text-gray-400">รายรับรวม</h3><p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">฿{totalIncome.toLocaleString()}</p></div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center"><h3 className="text-lg text-gray-500 dark:text-gray-400">รายจ่ายรวม</h3><p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">฿{totalExpense.toLocaleString()}</p></div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center"><h3 className="text-lg text-gray-500 dark:text-gray-400">กำไรสุทธิ</h3><p className={`text-3xl font-bold mt-2 ${netProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-yellow-600 dark:text-yellow-400'}`}>฿{netProfit.toLocaleString()}</p></div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center"><h3 className="text-lg text-gray-500 dark:text-gray-400">ลูกหนี้คงค้าง</h3><p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">฿{totalReceivable.toLocaleString()}</p></div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center"><h3 className="text-lg text-gray-500 dark:text-gray-400">เจ้าหนี้คงค้าง</h3><p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">฿{totalPayable.toLocaleString()}</p></div>
                    </div>
                );
            case 'transactions':
                return (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">บันทึกรายรับ-รายจ่าย</h2><button onClick={openTransactionModal} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">เพิ่มรายการใหม่</button></div>
                        <DataTable columns={transactionColumns} data={transactions} />
                    </div>
                );
            case 'ap_ar':
                 return (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"><h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">บัญชีลูกหนี้ (Accounts Receivable)</h2><DataTable columns={receivableColumns} data={receivables} /></div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"><h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">บัญชีเจ้าหนี้ (Accounts Payable)</h2><DataTable columns={payableColumns} data={payables} /></div>
                    </div>
                );
            case 'assets':
                return (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">การจัดการสินทรัพย์</h2><button onClick={openAssetModal} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">เพิ่มสินทรัพย์</button></div>
                        <DataTable columns={assetColumns} data={assets} />
                    </div>
                );
            case 'statements':
                return (
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-gray-200">งบการเงิน (Financial Statements)</h2>
                         <div className="border border-gray-200 dark:border-gray-700 p-6 rounded-lg">
                            <h3 className="text-xl font-semibold text-center text-gray-800 dark:text-gray-200">งบกำไรขาดทุน</h3>
                            <p className="text-center text-gray-500 dark:text-gray-400 text-sm">สำหรับงวดสิ้นสุด 31 ธันวาคม 2567</p>
                            <div className="mt-4 flow-root">
                                <dl className="-my-4 divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                                    <div className="flex items-center justify-between py-4"><dt className="font-medium text-green-600 dark:text-green-400">รายได้จากการขาย</dt><dd className="font-medium text-green-600 dark:text-green-400">฿{totalIncome.toLocaleString()}</dd></div>
                                    <div className="flex items-center justify-between py-4"><dt className="text-gray-600 dark:text-gray-300">ค่าใช้จ่าย</dt><dd className="text-gray-900 dark:text-gray-100">- ฿{totalExpense.toLocaleString()}</dd></div>
                                    <div className="flex items-center justify-between py-4"><dt className="font-bold text-gray-900 dark:text-gray-100">กำไรสุทธิ</dt><dd className="font-bold text-gray-900 dark:text-gray-100">฿{netProfit.toLocaleString()}</dd></div>
                                </dl>
                            </div>
                         </div>
                         <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">หมายเหตุ: งบดุลและงบกระแสเงินสดจะถูกสร้างขึ้นจากข้อมูลในระบบโดยอัตโนมัติ</p>
                    </div>
                );
            default: return null;
        }
    }

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2">
                <div className="flex space-x-2 border-b-2 border-gray-100 dark:border-gray-700">
                    <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>ภาพรวม</TabButton>
                    <TabButton active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')}>บันทึกบัญชี</TabButton>
                    <TabButton active={activeTab === 'ap_ar'} onClick={() => setActiveTab('ap_ar')}>เจ้าหนี้/ลูกหนี้</TabButton>
                    <TabButton active={activeTab === 'assets'} onClick={() => setActiveTab('assets')}>การจัดการสินทรัพย์</TabButton>
                    <TabButton active={activeTab === 'statements'} onClick={() => setActiveTab('statements')}>งบการเงิน</TabButton>
                </div>
            </div>

            <div className="p-1">
                {renderContent()}
            </div>
            
            <Modal title="เพิ่มรายการบัญชีใหม่" isOpen={isTransactionModalOpen} onClose={() => setTransactionModalOpen(false)}>
                <form onSubmit={handleSaveTransaction} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">วันที่</label>
                        <input type="date" value={newTransactionData.date || ''} onChange={e => setNewTransactionData({...newTransactionData, date: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ประเภทรายการ</label>
                        <select value={newTransactionData.type || 'Expense'} onChange={e => setNewTransactionData({...newTransactionData, type: e.target.value as 'Income' | 'Expense'})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                            <option value="Expense">รายจ่าย (Expense)</option>
                            <option value="Income">รายรับ (Income)</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">รายการ</label>
                        <input type="text" placeholder="เช่น ขายมะม่วง, ซื้อปุ๋ย" value={newTransactionData.description || ''} onChange={e => setNewTransactionData({...newTransactionData, description: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">จำนวนเงิน</label>
                        <input type="number" placeholder="0.00" value={newTransactionData.amount || ''} onChange={e => setNewTransactionData({...newTransactionData, amount: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
                    </div>
                    <div className="pt-4 flex justify-end space-x-2">
                        <button type="button" onClick={() => setTransactionModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">ยกเลิก</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-800 flex justify-center items-center min-w-[100px]">{isSubmitting ? <Spinner/> : 'บันทึก'}</button>
                    </div>
                </form>
            </Modal>
            
            <Modal title="เพิ่มสินทรัพย์ใหม่" isOpen={isAssetModalOpen} onClose={() => setAssetModalOpen(false)}>
                <form onSubmit={handleSaveAsset} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อสินทรัพย์</label>
                        <input type="text" value={newAssetData.name || ''} onChange={e => setNewAssetData({...newAssetData, name: e.target.value})} placeholder="เช่น รถไถนา" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">วันที่ซื้อ</label>
                            <input type="date" value={newAssetData.purchaseDate || ''} onChange={e => setNewAssetData({...newAssetData, purchaseDate: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ราคาทุน (บาท)</label>
                            <input type="number" min="0" value={newAssetData.purchaseCost || ''} onChange={e => setNewAssetData({...newAssetData, purchaseCost: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" required />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">อายุการใช้งาน (ปี)</label>
                            <input type="number" min="1" value={newAssetData.usefulLife || ''} onChange={e => setNewAssetData({...newAssetData, usefulLife: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">สถานะ</label>
                            <select value={newAssetData.status || 'ใช้งาน'} onChange={e => setNewAssetData({...newAssetData, status: e.target.value as Asset['status']})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm">
                                <option value="ใช้งาน">ใช้งาน</option>
                                <option value="ซ่อมบำรุง">ซ่อมบำรุง</option>
                                <option value="จำหน่ายแล้ว">จำหน่ายแล้ว</option>
                            </select>
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end space-x-2">
                        <button type="button" onClick={() => setAssetModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">ยกเลิก</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-800 flex justify-center items-center min-w-[140px]">{isSubmitting ? <Spinner/> : 'บันทึกสินทรัพย์'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default FarmAccountingPage;