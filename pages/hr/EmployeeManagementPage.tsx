
import React, { useState } from 'react';
import DataTable, { Column } from '../../components/DataTable';
import { Employee } from '../../types';
import Modal from '../../components/Modal';
import { supabase } from '../../supabase';
import Spinner from '../../components/Spinner';
import { useSupabase } from '../../hooks/useSupabase';
import { useToast } from '../../contexts/ToastContext';

const defaultEmployeeForm: Omit<Employee, 'id' | 'age'> = {
    name: '',
    nickname: '',
    dob: '',
    idCard: '',
    address: '',
    phone: '',
    startDate: new Date().toISOString().split('T')[0],
    position: 'คนงาน',
    salary: 12000,
    status: 'Active',
};

const EmployeeManagementPage: React.FC = () => {
    const { toast } = useToast();
    const { data: employees, loading, refetch, error } = useSupabase<Employee[]>(async () =>
        supabase.from('employees').select('*').order('startDate', { ascending: false })
    );

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [employeeFormData, setEmployeeFormData] = useState(defaultEmployeeForm);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const calculateAge = (dob: string | null): number | null => {
        if (!dob) return null;
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingEmployee(null);
    }

    const handleOpenAddModal = () => {
        setEditingEmployee(null);
        setEmployeeFormData(defaultEmployeeForm);
        setIsModalOpen(true);
    };
    
    const handleOpenEditModal = (employee: Employee) => {
        setEditingEmployee(employee);
        const { id, age, ...formData } = employee;
        setEmployeeFormData(formData);
        setIsModalOpen(true);
    };

    const handleSaveEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employeeFormData.name || !employeeFormData.dob) {
            toast("กรุณากรอกชื่อและวันเกิด", 'error');
            return;
        }
        setIsSubmitting(true);
        
        const payload = {
            ...employeeFormData,
            age: calculateAge(employeeFormData.dob),
        };

        let error;

        if(editingEmployee) {
             const { error: updateError } = await supabase
                .from('employees')
                .update(payload)
                .eq('id', editingEmployee.id);
             error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('employees')
                .insert(payload);
            error = insertError;
        }

        if (error) {
            toast('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message, 'error');
        } else {
            toast(editingEmployee ? 'แก้ไขข้อมูลพนักงานสำเร็จ' : 'เพิ่มพนักงานใหม่สำเร็จ', 'success');
            handleCloseModal();
            refetch();
        }
        setIsSubmitting(false);
    };

    const toggleEmployeeStatus = async (employee: Employee) => {
        const newStatus = employee.status === 'Active' ? 'Inactive' : 'Active';
        const { error } = await supabase
            .from('employees')
            .update({ status: newStatus })
            .eq('id', employee.id);
        
        if (error) {
            toast('ไม่สามารถอัปเดตสถานะได้: ' + error.message, 'error');
        } else {
            toast('อัปเดตสถานะสำเร็จ', 'success');
            refetch();
        }
    };

    const columns: Column<Employee>[] = [
        { header: 'รหัส', accessor: 'id', className: 'font-mono'},
        { header: 'ชื่อ-สกุล', accessor: 'name', className: 'font-medium text-gray-900 dark:text-gray-100' },
        { header: 'ตำแหน่ง', accessor: 'position' },
        { header: 'เบอร์โทร', accessor: 'phone' },
        { header: 'สถานะ', accessor: (item: Employee) => (
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                item.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
                {item.status === 'Active' ? 'ทำงาน' : 'ลาออก'}
            </span>
        )},
    ];

    const actions = (item: Employee) => (
        <div className="flex flex-wrap justify-end gap-4">
            <button onClick={() => handleOpenEditModal(item)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">แก้ไข</button>
            <button onClick={() => toggleEmployeeStatus(item)} className={item.status === 'Active' ? "text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" : "text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"}>
                {item.status === 'Active' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
            </button>
        </div>
    );
    
    if (loading) return <Spinner />;
    if (error) return <p className="text-red-500">Error: {error.message}</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">ทะเบียนประวัติพนักงาน</h2>
                <button 
                    onClick={handleOpenAddModal}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    เพิ่มพนักงานใหม่
                </button>
            </div>
            <DataTable columns={columns} data={employees || []} actions={actions} />

            <Modal title={editingEmployee ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มข้อมูลพนักงานใหม่"} isOpen={isModalOpen} onClose={handleCloseModal}>
                <form onSubmit={handleSaveEmployee} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อ-สกุล</label>
                            <input type="text" placeholder="นายสมศักดิ์ รักดี" value={employeeFormData.name || ''} onChange={e => setEmployeeFormData({...employeeFormData, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อเล่น</label>
                            <input type="text" placeholder="ศักดิ์" value={employeeFormData.nickname || ''} onChange={e => setEmployeeFormData({...employeeFormData, nickname: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500" />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">วัน/เดือน/ปีเกิด</label>
                            <input type="date" value={employeeFormData.dob || ''} onChange={e => setEmployeeFormData({...employeeFormData, dob: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500" required />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">เลขบัตรประชาชน</label>
                            <input type="text" placeholder="1234567890123" value={employeeFormData.idCard || ''} onChange={e => setEmployeeFormData({...employeeFormData, idCard: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500" />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ที่อยู่</label>
                        <input type="text" placeholder="123 หมู่ 4 ต.บางรัก อ.เมือง จ.กรุงเทพฯ" value={employeeFormData.address || ''} onChange={e => setEmployeeFormData({...employeeFormData, address: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500" />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">เบอร์โทร</label>
                            <input type="tel" placeholder="081-234-5678" value={employeeFormData.phone || ''} onChange={e => setEmployeeFormData({...employeeFormData, phone: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">วันที่เริ่มงาน</label>
                            <input type="date" value={employeeFormData.startDate || ''} onChange={e => setEmployeeFormData({...employeeFormData, startDate: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500" />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ตำแหน่ง</label>
                            <input type="text" placeholder="คนงาน" value={employeeFormData.position || ''} onChange={e => setEmployeeFormData({...employeeFormData, position: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">อัตราค่าจ้าง (บาท)</label>
                            <input type="number" placeholder="12000" value={employeeFormData.salary || ''} onChange={e => setEmployeeFormData({...employeeFormData, salary: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">สถานะ</label>
                             <select value={employeeFormData.status || 'Active'} onChange={e => setEmployeeFormData({...employeeFormData, status: e.target.value as 'Active' | 'Inactive'})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-green-500 focus:ring-green-500">
                                <option value="Active">ทำงาน</option>
                                <option value="Inactive">ลาออก</option>
                            </select>
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end space-x-2">
                        <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">ยกเลิก</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-800 flex items-center justify-center min-w-[120px]">
                           {isSubmitting ? <Spinner/> : (editingEmployee ? 'บันทึกการแก้ไข' : 'บันทึกพนักงาน')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default EmployeeManagementPage;
