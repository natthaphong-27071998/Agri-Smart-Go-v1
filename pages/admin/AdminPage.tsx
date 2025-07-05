

import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import DataTable, { Column } from '../../components/DataTable';
import Modal from '../../components/Modal';
import { User, UserRole, CompanyInfo, RolePermissions, PermissionLevel } from '../../types';
import { initialPermissions } from '../../data/permissionData';
import { NAV_LINKS, ICONS } from '../../constants';
import { supabase } from '../../supabase';
import Spinner from '../../components/Spinner';
import { useToast } from '../../contexts/ToastContext';


const ROLES_DESCRIPTION: Record<UserRole, string> = {
    'Admin': 'เข้าถึงได้ทุกส่วนของระบบ สามารถจัดการผู้ใช้และตั้งค่าระบบได้ทั้งหมด',
    'Farm Manager': 'ดูข้อมูลภาพรวมฟาร์ม จัดการการผลิตและพนักงาน แต่ไม่สามารถเข้าถึงข้อมูลเงินเดือนเชิงลึกได้',
    'Accountant': 'จัดการข้อมูลบัญชีและการเงินทั้งหมด สามารถสร้างและดูรายงานทางการเงินได้',
    'Sales': 'เข้าถึงโมดูลการขาย จัดการคำสั่งซื้อและข้อมูลลูกค้า',
    'Worker': 'ดูเฉพาะงานที่ได้รับมอบหมายและบันทึกการทำงานของตนเอง',
};

const ALL_USER_ROLES: UserRole[] = ['Admin', 'Farm Manager', 'Accountant', 'Sales', 'Worker'];
const ALL_USER_STATUSES: User['status'][] = ['Active', 'Inactive'];
const PERMISSION_KEYS: Array<keyof PermissionLevel> = ['view', 'create', 'edit', 'delete'];
const PERMISSION_LABELS: Record<keyof PermissionLevel, string> = { view: 'V', create: 'C', edit: 'E', 'delete': 'D' };
const appModules = NAV_LINKS.map(link => ({
  key: link.href.replace('#/', '').replace('/', '') || 'dashboard',
  name: link.name
}));

const defaultUserForm: Omit<User, 'id'> = {
    name: '',
    email: '',
    role: 'Worker',
    status: 'Active',
    avatarUrl: null,
};


const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
    const roleColors: Record<UserRole, string> = {
        'Admin': 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        'Farm Manager': 'bg-purple-200 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        'Accountant': 'bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        'Sales': 'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        'Worker': 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    };
    return <span className={`px-3 py-1 text-xs font-medium rounded-full ${roleColors[role]}`}>{role}</span>;
}

const InfoRow: React.FC<{ label: string, value?: string | React.ReactNode }> = ({ label, value }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">{value || '-'}</dd>
    </div>
);

interface AdminPageProps {
    companyInfo: CompanyInfo;
    setCompanyInfo: React.Dispatch<React.SetStateAction<CompanyInfo | null>>;
}

const AdminPage: React.FC<AdminPageProps> = ({ companyInfo, setCompanyInfo }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    
    const [isCompanyModalOpen, setCompanyModalOpen] = useState(false);
    const [companyFormData, setCompanyFormData] = useState<CompanyInfo>(companyInfo);
    
    const [isUserModalOpen, setUserModalOpen] = useState(false);
    const [isSubmittingUser, setIsSubmittingUser] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userFormData, setUserFormData] = useState<Omit<User, 'id'>>(defaultUserForm);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    
    const [permissions, setPermissions] = useState<RolePermissions>(initialPermissions);
    const [isPermissionModalOpen, setPermissionModalOpen] = useState(false);
    const [tempPermissions, setTempPermissions] = useState<RolePermissions>(initialPermissions);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('users').select('*');
        if (error) {
            toast("ไม่สามารถโหลดข้อมูลผู้ใช้ได้: " + error.message, 'error');
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenCompanyModal = () => {
        setCompanyFormData(companyInfo);
        setCompanyModalOpen(true);
    };

    const handleSaveCompanyInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        const { id, ...updatePayload } = companyFormData;
        const { data, error } = await supabase.from('company_info').update(updatePayload).eq('id', companyInfo.id).select().single();
        if (error) {
            toast('ไม่สามารถบันทึกข้อมูลบริษัทได้', 'error');
        } else {
            setCompanyInfo(data);
            toast('บันทึกข้อมูลบริษัทสำเร็จ', 'success');
            setCompanyModalOpen(false);
        }
    }
    
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setCompanyFormData({ ...companyFormData, logoUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCloseUserModal = () => { setUserModalOpen(false); setEditingUser(null); setAvatarFile(null); };
    const handleOpenAddUserModal = () => { setEditingUser(null); setUserFormData(defaultUserForm); setAvatarFile(null); setUserModalOpen(true); };
    const handleOpenEditUserModal = (user: User) => { setEditingUser(user); const { id, ...formData } = user; setUserFormData(formData); setAvatarFile(null); setUserModalOpen(true); };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userFormData.name || !userFormData.email) {
            toast("กรุณากรอกชื่อและอีเมล", 'error');
            return;
        }
        setIsSubmittingUser(true);
        let finalUserPayload = { ...userFormData };

        if (avatarFile) {
            const filePath = `public/${editingUser?.id || crypto.randomUUID()}-${avatarFile.name}`;
            
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, avatarFile, { upsert: true });

            if (uploadError) {
                toast('ไม่สามารถอัปโหลดรูปภาพได้: ' + uploadError.message, 'error');
                setIsSubmittingUser(false);
                return;
            }

            if (editingUser?.avatarUrl && editingUser.avatarUrl.includes(filePath) === false) {
                 try {
                    const oldPath = new URL(editingUser.avatarUrl).pathname.split('/avatars/')[1];
                    if (oldPath) await supabase.storage.from('avatars').remove([oldPath]);
                } catch (e) { console.warn("Could not delete old avatar", e); }
            }

            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
            finalUserPayload.avatarUrl = urlData.publicUrl;
        }

        let error;
        if (editingUser) {
            const { error: updateError } = await supabase.from('users').update(finalUserPayload).eq('id', editingUser.id);
            error = updateError;
        } else {
            // NOTE: This adds a user to the public table, but doesn't create an auth user.
            // This is for demonstration. Real apps should use Supabase Auth to create users.
            const { error: insertError } = await supabase.from('users').insert(finalUserPayload);
            error = insertError;
        }
        
        if (error) {
            toast('เกิดข้อผิดพลาด: ' + error.message, 'error');
        } else {
            toast(editingUser ? 'แก้ไขข้อมูลผู้ใช้สำเร็จ' : 'เพิ่มผู้ใช้สำเร็จ', 'success');
            fetchUsers();
            handleCloseUserModal();
        }
        setIsSubmittingUser(false);
    };

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ "${userName}" ? การกระทำนี้ไม่สามารถย้อนกลับได้`)) {
            const { error } = await supabase.from('users').delete().eq('id', userId);
            if (error) {
                toast("เกิดข้อผิดพลาดในการลบผู้ใช้", 'error');
            } else {
                toast('ลบผู้ใช้สำเร็จ', 'success');
                fetchUsers();
            }
        }
    };


    const handleOpenPermissionModal = () => { setTempPermissions(JSON.parse(JSON.stringify(permissions))); setPermissionModalOpen(true); };
    const handlePermissionChange = (role: UserRole, moduleKey: string, permission: keyof PermissionLevel) => {
        setTempPermissions(prev => {
            const newPermissions = { ...prev };
            newPermissions[role][moduleKey][permission] = !newPermissions[role][moduleKey][permission];
            return newPermissions;
        });
    };
    const handleSavePermissions = () => { setPermissions(tempPermissions); toast('บันทึกสิทธิ์การเข้าถึงสำเร็จ', 'success'); setPermissionModalOpen(false); };


    const userColumns: Column<User>[] = [
        { header: 'ชื่อผู้ใช้', accessor: (item) => (
            <div className="flex items-center">
                {item.avatarUrl ? 
                    <img src={item.avatarUrl} alt={item.name || 'avatar'} className="h-10 w-10 rounded-full object-cover mr-3"/> :
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        <svg className="h-6 w-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                }
                <span className="font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
            </div>
        )},
        { header: 'Email', accessor: 'email' },
        { header: 'บทบาท', accessor: (item) => <RoleBadge role={item.role as UserRole} /> },
        { header: 'สถานะ', accessor: (item) => (<span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>{item.status === 'Active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}</span>)},
    ];

    const userActions = (item: User) => (
        <div className="space-x-4">
            <button onClick={() => handleOpenEditUserModal(item)} className="text-indigo-600 hover:text-indigo-900 font-medium dark:text-indigo-400 dark:hover:text-indigo-300">แก้ไข</button>
            <button onClick={() => handleDeleteUser(item.id, item.name ?? 'ผู้ใช้')} className="text-red-600 hover:text-red-900 font-medium dark:text-red-400 dark:hover:text-red-300">ลบ</button>
        </div>
    );
    
    if (loading) return <Spinner />;

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex items-center">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full text-blue-600 dark:text-blue-300 mr-4">
                        {ICONS.DATABASE}
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">ตั้งค่าฐานข้อมูลอัตโนมัติ</h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">ใช้สคริปต์เพื่อสร้างตารางและโครงสร้างข้อมูลทั้งหมดสำหรับโปรเจกต์ Supabase ของคุณ</p>
                    </div>
                    <div className="ml-auto">
                        <ReactRouterDOM.Link to="/setup" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 whitespace-nowrap">
                            ดูสคริปต์
                        </ReactRouterDOM.Link>
                    </div>
                </div>
            </div>

             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4 border-b pb-4 dark:border-gray-700"><h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">ข้อมูลบริษัท/กิจการ</h2><button onClick={handleOpenCompanyModal} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">แก้ไขข้อมูล</button></div>
                 <dl className="divide-y divide-gray-200 dark:divide-gray-700">
                    <InfoRow label="โลโก้" value={companyInfo.logoUrl ? <img src={companyInfo.logoUrl} alt="Company Logo" className="h-16 w-16 rounded-md object-cover shadow-sm" /> : undefined} />
                    <InfoRow label="ชื่อกิจการ" value={companyInfo.name} />
                    <InfoRow label="ที่อยู่" value={companyInfo.address} />
                    <InfoRow label="เบอร์โทรศัพท์" value={companyInfo.phone} />
                    <InfoRow label="อีเมล" value={companyInfo.email} />
                    <InfoRow label="เลขประจำตัวผู้เสียภาษี" value={companyInfo.taxId} />
                    <InfoRow label="ธนาคาร" value={companyInfo.bankAccount ? `${companyInfo.bankAccount.bankName} (${companyInfo.bankAccount.accountNumber})` : '-'} />
                 </dl>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">การจัดการผู้ใช้งาน</h2><button onClick={handleOpenAddUserModal} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">เพิ่มผู้ใช้ใหม่</button></div>
                <DataTable columns={userColumns} data={users} actions={userActions} />
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                 <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">การจัดการบทบาทและสิทธิ์</h2>
                 <p className="text-gray-600 dark:text-gray-400 mb-6">กำหนดบทบาทและระดับการเข้าถึงข้อมูลของผู้ใช้งานแต่ละกลุ่ม เพื่อความปลอดภัยของข้อมูล</p>
                 <div className="space-y-4">{(Object.keys(ROLES_DESCRIPTION) as UserRole[]).map((role) => (<div key={role} className="flex items-start p-4 border border-gray-200 dark:border-gray-700 rounded-lg transition hover:bg-gray-50 dark:hover:bg-gray-700/50"><div className="w-1/3 md:w-1/4"><RoleBadge role={role} /></div><div className="w-2/3 md:w-3/4"><p className="text-sm text-gray-700 dark:text-gray-300">{ROLES_DESCRIPTION[role]}</p></div></div>))}</div>
                 <div className="mt-6 text-right"><button onClick={handleOpenPermissionModal} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">แก้ไขสิทธิ์การเข้าถึง</button></div>
            </div>

            <Modal title="แก้ไขข้อมูลบริษัท/กิจการ" isOpen={isCompanyModalOpen} onClose={() => setCompanyModalOpen(false)}>
                <form onSubmit={handleSaveCompanyInfo} className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อกิจการ</label><input type="text" value={companyFormData.name} onChange={e => setCompanyFormData({...companyFormData, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" required/></div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">โลโก้</label>
                        <div className="mt-1 flex items-center space-x-4">
                            <span className="inline-block h-20 w-20 rounded-md overflow-hidden bg-gray-100 shadow-sm">{companyFormData.logoUrl ? <img src={companyFormData.logoUrl} alt="Logo Preview" className="h-full w-full object-cover" /> : <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}</span>
                            <label htmlFor="logo-upload" className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"><span>อัปโหลดไฟล์</span><input id="logo-upload" name="logo-upload" type="file" className="sr-only" accept="image/*" onChange={handleLogoChange} /></label>
                        </div>
                    </div>
                     <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ที่อยู่</label><textarea rows={3} value={companyFormData.address ?? ''} onChange={e => setCompanyFormData({...companyFormData, address: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" required></textarea></div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">เบอร์โทรศัพท์</label><input type="text" value={companyFormData.phone ?? ''} onChange={e => setCompanyFormData({...companyFormData, phone: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" required/></div>
                         <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">อีเมล</label><input type="email" value={companyFormData.email ?? ''} onChange={e => setCompanyFormData({...companyFormData, email: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" required/></div>
                    </div>
                     <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">เลขประจำตัวผู้เสียภาษี</label><input type="text" value={companyFormData.taxId ?? ''} onChange={e => setCompanyFormData({...companyFormData, taxId: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" required/></div>
                    <div className="border-t pt-4 dark:border-gray-700">
                        <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">ข้อมูลบัญชีธนาคาร</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ธนาคาร</label><input type="text" value={companyFormData.bankAccount?.bankName ?? ''} onChange={e => setCompanyFormData({...companyFormData, bankAccount: {...companyFormData.bankAccount!, bankName: e.target.value}})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อบัญชี</label><input type="text" value={companyFormData.bankAccount?.accountName ?? ''} onChange={e => setCompanyFormData({...companyFormData, bankAccount: {...companyFormData.bankAccount!, accountName: e.target.value}})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" /></div>
                        </div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">เลขที่บัญชี</label><input type="text" value={companyFormData.bankAccount?.accountNumber ?? ''} onChange={e => setCompanyFormData({...companyFormData, bankAccount: {...companyFormData.bankAccount!, accountNumber: e.target.value}})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" /></div>
                    </div>
                    <div className="pt-4 flex justify-end space-x-2"><button type="button" onClick={() => setCompanyModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">ยกเลิก</button><button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">บันทึกข้อมูล</button></div>
                </form>
            </Modal>
            
            <Modal title={editingUser ? "แก้ไขข้อมูลผู้ใช้" : "เพิ่มผู้ใช้งานใหม่"} isOpen={isUserModalOpen} onClose={handleCloseUserModal}>
                <form onSubmit={handleSaveUser} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">รูปภาพโปรไฟล์</label>
                        <div className="mt-1 flex items-center space-x-4">
                            <span className="inline-block h-20 w-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 shadow-sm">
                                {avatarFile ? (
                                    <img src={URL.createObjectURL(avatarFile)} alt="Avatar Preview" className="h-full w-full object-cover" />
                                ) : userFormData.avatarUrl ? (
                                    <img src={userFormData.avatarUrl} alt="Current Avatar" className="h-full w-full object-cover" />
                                ) : (
                                    <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                )}
                            </span>
                            <label htmlFor="avatar-upload" className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                <span>เปลี่ยนรูป</span>
                                <input id="avatar-upload" name="avatar-upload" type="file" className="sr-only" accept="image/*" onChange={(e) => { if (e.target.files) setAvatarFile(e.target.files[0]) }} />
                            </label>
                        </div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อ-สกุล</label><input type="text" value={userFormData.name ?? ''} onChange={e => setUserFormData({...userFormData, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" required/></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">อีเมล</label><input type="email" value={userFormData.email ?? ''} onChange={e => setUserFormData({...userFormData, email: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" required/></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">บทบาท</label><select value={userFormData.role ?? 'Worker'} onChange={e => setUserFormData({...userFormData, role: e.target.value as UserRole})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm">{ALL_USER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}</select></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">สถานะ</label><select value={userFormData.status ?? 'Active'} onChange={e => setUserFormData({...userFormData, status: e.target.value as User['status']})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm">{ALL_USER_STATUSES.map(status => <option key={status} value={status}>{status === 'Active' ? 'ใช้งาน' : 'ไม่ใช้งาน'}</option>)}</select></div>
                    </div>
                    <div className="pt-4 flex justify-end space-x-2"><button type="button" onClick={handleCloseUserModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">ยกเลิก</button><button type="submit" disabled={isSubmittingUser} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex justify-center items-center min-w-[120px]">{isSubmittingUser ? <Spinner/> : (editingUser ? "บันทึกการแก้ไข" : "บันทึกผู้ใช้")}</button></div>
                </form>
            </Modal>
            
             <Modal title="แก้ไขสิทธิ์การเข้าถึง" isOpen={isPermissionModalOpen} onClose={() => setPermissionModalOpen(false)}>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border dark:divide-gray-700 dark:border-gray-600"><thead className="bg-gray-100 dark:bg-gray-700"><tr><th className="px-6 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider sticky left-0 bg-gray-100 dark:bg-gray-700 z-10 border-r dark:border-gray-600">บทบาท</th>{appModules.map(module => (<th key={module.key} className="px-6 py-3 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider text-center" style={{minWidth: '150px'}}>{module.name}</th>))}</tr></thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">{ALL_USER_ROLES.map(role => (<tr key={role} className="hover:bg-gray-50 dark:hover:bg-gray-700/50"><td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-100 sticky left-0 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-r dark:border-gray-600">{role}</td>{appModules.map(module => (<td key={module.key} className="px-6 py-4 whitespace-nowrap"><div className="flex justify-center items-center space-x-4">{PERMISSION_KEYS.map(permKey => (<label key={permKey} className="flex items-center space-x-1 cursor-pointer text-sm text-gray-700 dark:text-gray-300"><input type="checkbox" className="rounded text-indigo-600 dark:bg-gray-900 dark:border-gray-600 focus:ring-indigo-500" checked={tempPermissions[role]?.[module.key]?.[permKey] || false} onChange={() => handlePermissionChange(role, module.key, permKey)} /><span>{PERMISSION_LABELS[permKey]}</span></label>))}</div></td>))}</tr>))}</tbody>
                    </table>
                </div>
                <div className="pt-6 flex justify-end space-x-2 border-t dark:border-gray-700 mt-4"><button type="button" onClick={() => setPermissionModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">ยกเลิก</button><button type="button" onClick={handleSavePermissions} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">บันทึกการเปลี่ยนแปลง</button></div>
            </Modal>
        </div>
    );
};

export default AdminPage;
