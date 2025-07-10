
import React, { useState, useMemo } from 'react';
import DataTable, { Column } from '../../components/DataTable';
import { SupplyItem, SupplyCategory, SupplyUnit } from '../../types';
import Modal from '../../components/Modal';
import { supabase } from '../../supabase';
import Spinner from '../../components/Spinner';
import { useSupabase } from '../../hooks/useSupabase';
import { useToast } from '../../contexts/ToastContext';
import StatCard from '../../components/StatCard';
import { ICONS } from '../../constants';

const ALL_CATEGORIES: SupplyCategory[] = ['ปุ๋ย', 'ยาฆ่าแมลง', 'เมล็ดพันธุ์', 'เครื่องมือ', 'อื่นๆ'];
const ALL_UNITS: SupplyUnit[] = ['กิโลกรัม', 'ลิตร', 'ถุง', 'ชิ้น', 'ขวด'];

const defaultFormState: Omit<SupplyItem, 'id' | 'last_updated'> = {
    name: '',
    category: 'ปุ๋ย',
    supplier: '',
    quantity: 0,
    unit: 'กิโลกรัม',
    unit_price: 0,
    reorder_level: 10,
};

const InventoryManagementPage: React.FC = () => {
    const { toast } = useToast();
    const { data: supplyItems, loading, refetch } = useSupabase<SupplyItem[]>(async () =>
        supabase.from('supply_items').select('*').order('name', { ascending: true })
    );

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Omit<SupplyItem, 'id' | 'last_updated'>>(defaultFormState);
    const [editingItem, setEditingItem] = useState<SupplyItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const stats = useMemo(() => {
        if (!supplyItems) return { totalValue: 0, lowStockCount: 0 };
        const totalValue = supplyItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0), 0);
        const lowStockCount = supplyItems.filter(item => (item.quantity || 0) <= (item.reorder_level || 0)).length;
        return { totalValue, lowStockCount };
    }, [supplyItems]);

    const handleOpenAddModal = () => {
        setEditingItem(null);
        setFormData(defaultFormState);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (item: SupplyItem) => {
        setEditingItem(item);
        const { id, last_updated, ...editableData } = item;
        setFormData(editableData);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            toast("กรุณากรอกชื่อปัจจัยการผลิต", 'error');
            return;
        }
        setIsSubmitting(true);

        const payload = {
            ...formData,
            last_updated: new Date().toISOString(),
        };

        let error;
        if (editingItem) {
            const { error: updateError } = await supabase.from('supply_items').update(payload).eq('id', editingItem.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase.from('supply_items').insert(payload);
            error = insertError;
        }

        if (error) {
            toast(`เกิดข้อผิดพลาด: ${error.message}`, 'error');
        } else {
            toast(editingItem ? 'แก้ไขข้อมูลสำเร็จ' : 'เพิ่มข้อมูลสำเร็จ', 'success');
            handleCloseModal();
            refetch();
        }
        setIsSubmitting(false);
    };
    
    const handleDeleteItem = async (id: string) => {
        if(window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
            const { error } = await supabase.from('supply_items').delete().eq('id', id);
            if (error) {
                toast(`เกิดข้อผิดพลาด: ${error.message}`, 'error');
            } else {
                toast('ลบข้อมูลสำเร็จ', 'success');
                refetch();
            }
        }
    }

    const columns: Column<SupplyItem>[] = [
        { header: 'ชื่อ', accessor: 'name', className: 'font-medium text-gray-900 dark:text-gray-100' },
        { header: 'หมวดหมู่', accessor: 'category' },
        { header: 'จำนวนคงเหลือ', accessor: (item) => (
            <div className={`flex items-center justify-end gap-2 ${(item.quantity || 0) <= (item.reorder_level || 0) ? 'text-red-500 font-bold' : ''}`}>
                {(item.quantity || 0).toLocaleString()} <span className="text-xs text-gray-500">{item.unit}</span>
            </div>
        ), className: 'text-right' },
        { header: 'ราคา/หน่วย (บาท)', accessor: (item) => (item.unit_price || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 }), className: 'text-right' },
        { header: 'ระดับที่ต้องสั่งซื้อใหม่', accessor: 'reorder_level', className: 'text-right' },
    ];
    
    const actions = (item: SupplyItem) => (
        <div className="flex items-center justify-end gap-4">
            <button onClick={() => handleOpenEditModal(item)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">แก้ไข</button>
            <button onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">ลบ</button>
        </div>
    );

    if (loading) return <Spinner />;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <StatCard title="จำนวนรายการ" value={`${(supplyItems || []).length} รายการ`} color="bg-blue-100 text-blue-600" darkColor="dark:bg-blue-900/50 dark:text-blue-300" icon={ICONS.INVENTORY} />
                 <StatCard title="มูลค่าคงคลังรวม" value={`฿${stats.totalValue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`} color="bg-green-100 text-green-600" darkColor="dark:bg-green-900/50 dark:text-green-300" icon={ICONS.ACCOUNTING} />
                 <StatCard title="รายการที่ต้องสั่งซื้อเพิ่ม" value={`${stats.lowStockCount} รายการ`} color="bg-yellow-100 text-yellow-600" darkColor="dark:bg-yellow-900/50 dark:text-yellow-300" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>} />
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">รายการปัจจัยการผลิตในคลัง</h2>
                    <button onClick={handleOpenAddModal} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">เพิ่มรายการใหม่</button>
                 </div>
                 <DataTable columns={columns} data={supplyItems || []} actions={actions} />
            </div>

            <Modal title={editingItem ? 'แก้ไขข้อมูลปัจจัยการผลิต' : 'เพิ่มปัจจัยการผลิตใหม่'} isOpen={isModalOpen} onClose={handleCloseModal}>
                <form onSubmit={handleSaveItem} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อ</label>
                            <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" required/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">หมวดหมู่</label>
                            <select value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value as SupplyCategory})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm">
                                {ALL_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ซัพพลายเออร์/ผู้ขาย</label>
                        <input type="text" value={formData.supplier || ''} onChange={e => setFormData({...formData, supplier: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm"/>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">จำนวน</label>
                            <input type="number" min="0" value={formData.quantity || ''} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">หน่วย</label>
                            <select value={formData.unit || ''} onChange={e => setFormData({...formData, unit: e.target.value as SupplyUnit})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm">
                                {ALL_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ราคา/หน่วย (บาท)</label>
                            <input type="number" min="0" step="0.01" value={formData.unit_price || ''} onChange={e => setFormData({...formData, unit_price: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ระดับที่ต้องสั่งซื้อใหม่</label>
                            <input type="number" min="0" value={formData.reorder_level || ''} onChange={e => setFormData({...formData, reorder_level: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm"/>
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end space-x-2">
                        <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">ยกเลิก</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-800 flex items-center justify-center min-w-[120px]">
                            {isSubmitting ? <Spinner/> : (editingItem ? 'บันทึกการแก้ไข' : 'บันทึกรายการ')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default InventoryManagementPage;
