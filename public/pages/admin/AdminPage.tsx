

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DataTable, { Column } from '../../components/DataTable';
import Modal from '../../components/Modal';
import { User, UserRole, CompanyInfo, RolePermissions, PermissionLevel, AppModuleKey } from '../../types';
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
const appModules: { key: AppModuleKey, name: string }[] = NAV_LINKS.map(link => ({
  key: (link.href.replace('#/', '').replace('/', '') || 'dashboard') as AppModuleKey,
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

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors focus:outline-none border-b-2 ${
            active ? 'border-green-600 text-green-700 dark:text-green-400 font-semibold' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
        }`}
    >
        {children}
    </button>
);

interface AdminPageProps {
    userProfile: User | null;
    companyInfo: CompanyInfo;
    setCompanyInfo: React.Dispatch<React.SetStateAction<CompanyInfo | null>>;
}

type AdminTab = 'organization' | 'users' | 'permissions';

const AdminPage: React.FC<AdminPageProps> = ({ userProfile, companyInfo, setCompanyInfo }) => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<AdminTab>('organization');
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

    const [isResetModalOpen, setResetModalOpen] = useState(false);
    const [resetConfirmText, setResetConfirmText] = useState('');
    const [isSubmittingReset, setIsSubmittingReset] = useState(false);

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
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            finalUserPayload.avatarUrl = publicUrl;
        }
        
        if (editingUser) {
            const { error } = await supabase.from('users').update(finalUserPayload).eq('id', editingUser.id);
            if (error) { toast("ไม่สามารถแก้ไขผู้ใช้ได้: " + error.message, 'error'); }
            else { toast("แก้ไขผู้ใช้สำเร็จ", 'success'); handleCloseUserModal(); fetchUsers(); }
        } else {
            // Because we cannot create a user in Supabase Auth from the client-side
            // for security reasons, we will only add them to our public 'users' table.
            // The administrator must then manually create the user in the Supabase dashboard
            // with the same email address.
            const { error: dbError } = await supabase.from('users').insert(finalUserPayload);
            if (dbError) { 
                toast("ไม่สามารถสร้างผู้ใช้ได้: " + dbError.message, 'error'); 
            }
            else { 
                toast("เพิ่มผู้ใช้ใหม่ในตารางสำเร็จ! กรุณาสร้างผู้ใช้ใน Supabase Authentication ด้วย", 'success'); 
                handleCloseUserModal(); 
                fetchUsers(); 
            }
        }

        setIsSubmittingUser(false);
    };
    
    const handlePermissionChange = (role: UserRole, module: AppModuleKey, permission: keyof PermissionLevel) => {
        setTempPermissions(prev => {
            const newPermissions = JSON.parse(JSON.stringify(prev));
            newPermissions[role][module][permission] = !newPermissions[role][module][permission];
            return newPermissions;
        });
    };
    
    const handleSavePermissions = () => {
        setPermissions(tempPermissions);
        setPermissionModalOpen(false);
        toast("บันทึกสิทธิ์การเข้าถึงสำเร็จ (ตัวอย่าง)", "success");
    }

    const handleResetData = async () => {
        if (!userProfile?.email) {
            toast('ไม่พบข้อมูลผู้ใช้แอดมิน', 'error');
            return;
        }
        setIsSubmittingReset(true);
        const { error } = await supabase.rpc('reset_all_data', { admin_email: userProfile.email });
        if (error) {
            toast('เกิดข้อผิดพลาดในการรีเซ็ตข้อมูล: ' + error.message, 'error');
            setIsSubmittingReset(false);
        } else {
            toast('รีเซ็ตข้อมูลทั้งหมดสำเร็จ! กำลังรีเฟรชแอปพลิเคชัน...', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    };

    const renderOrganizationTab = () => (
         <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">ข้อมูลองค์กร</h3>
                <button onClick={handleOpenCompanyModal} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">แก้ไขข้อมูล</button>
            </div>
            <div className="p-6">
                <dl>
                    <InfoRow label="ชื่อบริษัท/ฟาร์ม" value={companyInfo.name} />
                    <InfoRow label="ที่อยู่" value={companyInfo.address} />
                    <InfoRow label="เบอร์โทร" value={companyInfo.phone} />
                    <InfoRow label="อีเมล" value={companyInfo.email} />
                    <InfoRow label="เลขประจำตัวผู้เสียภาษี" value={companyInfo.taxId} />
                    <InfoRow label="โลโก้" value={<img src={companyInfo.logoUrl ?? ''} alt="Logo" className="h-16 w-16 object-contain" />} />
                </dl>
            </div>
        </div>
    );
    
    const renderUsersTab = () => {
        const columns: Column<User>[] = [
            { header: 'ชื่อ', accessor: (item) => <div className="flex items-center"><div className="flex-shrink-0 h-10 w-10">{item.avatarUrl ? <img className="h-10 w-10 rounded-full" src={item.avatarUrl} alt="" /> : <div className="h-10 w-10 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold">{item.name?.charAt(0)}</div>}</div><div className="ml-4"><div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</div><div className="text-sm text-gray-500 dark:text-gray-400">{item.email}</div></div></div> },
            { header: 'ตำแหน่ง', accessor: (item) => <RoleBadge role={item.role!} />},
            { header: 'สถานะ', accessor: (item) => <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>{item.status}</span> },
        ];
        const actions = (item: User) => (
            <div className="flex items-center justify-end gap-4"><button onClick={() => handleOpenEditUserModal(item)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">แก้ไข</button></div>
        );
        return (
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">จัดการผู้ใช้งาน</h3>
                    <button onClick={handleOpenAddUserModal} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700">เพิ่มผู้ใช้ใหม่</button>
                </div>
                <div className="p-6">
                    {loading ? <Spinner /> : <DataTable columns={columns} data={users} actions={actions} />}
                </div>
            </div>
        );
    };

    const renderPermissionsTab = () => (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">การจัดการสิทธิ์การเข้าถึง</h3>
                <button onClick={() => { setTempPermissions(permissions); setPermissionModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">แก้ไขสิทธิ์</button>
            </div>
            <div className="p-6 space-y-8">
                {ALL_USER_ROLES.map(role => (
                    <div key={role}>
                        <h4 className="text-lg font-bold flex items-center gap-2 text-gray-700 dark:text-gray-200"><RoleBadge role={role} /> <span>{role}</span></h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">{ROLES_DESCRIPTION[role]}</p>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">โมดูล</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ดู</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">สร้าง</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">แก้ไข</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ลบ</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {appModules.map(module => (
                                        <tr key={module.key}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{module.name}</td>
                                            {PERMISSION_KEYS.map(key => (
                                                <td key={key} className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${permissions[role][module.key][key] ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200'}`}>
                                                        {permissions[role][module.key][key] ? '✓' : '✗'}
                                                    </span>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
    
    return (
        <div className="space-y-6">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">ตั้งค่าฐานข้อมูล</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">สำหรับผู้ใช้ครั้งแรกหรือต้องการติดตั้งฐานข้อมูลใหม่, ให้ไปที่หน้านี้เพื่อรับ SQL script สำหรับการสร้างตารางทั้งหมด</p>
                <Link to="/setup" className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700">
                    {ICONS.DATABASE}
                    <span className="ml-2">ไปที่หน้าตั้งค่าฐานข้อมูล</span>
                </Link>
            </div>

            <div className="p-6 bg-red-50 dark:bg-gray-800/50 border-l-4 border-red-500 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-red-800 dark:text-red-300">โซนอันตราย (Danger Zone)</h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-400">การดำเนินการในส่วนนี้ไม่สามารถย้อนกลับได้ กรุณาใช้ความระมัดระวังสูงสุด</p>
                <div className="mt-4">
                    <button
                        onClick={() => setResetModalOpen(true)}
                        className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        รีเซ็ตข้อมูลทั้งหมดในแอปพลิเคชัน
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2">
                 <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
                    <TabButton active={activeTab === 'organization'} onClick={() => setActiveTab('organization')}>ข้อมูลองค์กร</TabButton>
                    <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')}>จัดการผู้ใช้งาน</TabButton>
                    <TabButton active={activeTab === 'permissions'} onClick={() => setActiveTab('permissions')}>สิทธิ์การเข้าถึง</TabButton>
                </div>
            </div>
            <div>
                 {activeTab === 'organization' && renderOrganizationTab()}
                 {activeTab === 'users' && renderUsersTab()}
                 {activeTab === 'permissions' && renderPermissionsTab()}
            </div>
            <Modal title="แก้ไขข้อมูลบริษัท/ฟาร์ม" isOpen={isCompanyModalOpen} onClose={() => setCompanyModalOpen(false)}>
                <form onSubmit={handleSaveCompanyInfo} className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อบริษัท</label><input type="text" value={companyFormData.name} onChange={e => setCompanyFormData({...companyFormData, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" required/></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ที่อยู่</label><input type="text" value={companyFormData.address ?? ''} onChange={e => setCompanyFormData({...companyFormData, address: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">เบอร์โทร</label><input type="text" value={companyFormData.phone ?? ''} onChange={e => setCompanyFormData({...companyFormData, phone: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">อีเมล</label><input type="email" value={companyFormData.email ?? ''} onChange={e => setCompanyFormData({...companyFormData, email: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" /></div>
                    </div>
                     <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">เลขประจำตัวผู้เสียภาษี</label><input type="text" value={companyFormData.taxId ?? ''} onChange={e => setCompanyFormData({...companyFormData, taxId: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">เปลี่ยนโลโก้</label><input type="file" onChange={handleLogoChange} accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"/></div>
                    <div className="pt-4 flex justify-end space-x-2"><button type="button" onClick={() => setCompanyModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">ยกเลิก</button><button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">บันทึกข้อมูล</button></div>
                </form>
            </Modal>
             <Modal title={editingUser ? "แก้ไขผู้ใช้งาน" : "เพิ่มผู้ใช้ใหม่"} isOpen={isUserModalOpen} onClose={handleCloseUserModal}>
                <form onSubmit={handleSaveUser} className="space-y-4">
                     <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อ-สกุล</label><input type="text" value={userFormData.name ?? ''} onChange={e => setUserFormData({...userFormData, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" required/></div>
                    <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">อีเมล</label><input type="email" value={userFormData.email ?? ''} onChange={e => setUserFormData({...userFormData, email: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" required/></div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ตำแหน่ง/บทบาท</label><select value={userFormData.role ?? ''} onChange={e => setUserFormData({...userFormData, role: e.target.value as UserRole})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm">{ALL_USER_ROLES.map(role => <option key={role} value={role}>{role}</option>)}</select></div>
                         <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">สถานะ</label><select value={userFormData.status ?? ''} onChange={e => setUserFormData({...userFormData, status: e.target.value as User['status']})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm">{ALL_USER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                     </div>
                     <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">รูปโปรไฟล์</label><input type="file" onChange={(e) => setAvatarFile(e.target.files ? e.target.files[0] : null)} accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"/></div>
                     <div className="pt-4 flex justify-end space-x-2"><button type="button" onClick={handleCloseUserModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">ยกเลิก</button><button type="submit" disabled={isSubmittingUser} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-800 flex items-center justify-center min-w-[120px]">{isSubmittingUser ? <Spinner/> : (editingUser ? 'บันทึกการแก้ไข' : 'บันทึกผู้ใช้')}</button></div>
                 </form>
             </Modal>
             <Modal title="แก้ไขสิทธิ์การเข้าถึง" isOpen={isPermissionModalOpen} onClose={() => setPermissionModalOpen(false)}>
                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                    {ALL_USER_ROLES.map(role => (
                        <div key={role}>
                            <h4 className="text-md font-bold text-gray-700 dark:text-gray-200"><RoleBadge role={role}/> {role}</h4>
                             <div className="grid grid-cols-5 gap-2 mt-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                                <div className="text-left">โมดูล</div><div>ดู</div><div>สร้าง</div><div>แก้ไข</div><div>ลบ</div>
                             </div>
                            {appModules.map(module => (
                                <div key={module.key} className="grid grid-cols-5 gap-2 items-center text-sm mt-1 py-1 border-b border-gray-100 dark:border-gray-700">
                                    <div className="text-left font-medium text-gray-800 dark:text-gray-200">{module.name}</div>
                                    {PERMISSION_KEYS.map(key => (
                                         <div key={key} className="text-center">
                                             <input type="checkbox" checked={tempPermissions[role][module.key]?.[key]} onChange={() => handlePermissionChange(role, module.key, key)} className="rounded text-green-500 focus:ring-green-500" />
                                         </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                 <div className="pt-6 flex justify-end space-x-2 border-t mt-4 border-gray-200 dark:border-gray-700">
                    <button type="button" onClick={() => setPermissionModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">ยกเลิก</button>
                    <button type="button" onClick={handleSavePermissions} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">บันทึกสิทธิ์</button>
                </div>
             </Modal>
             <Modal title="ยืนยันการรีเซ็ตข้อมูลทั้งหมด" isOpen={isResetModalOpen} onClose={() => setResetModalOpen(false)}>
                <div className="space-y-4">
                    <p className="text-red-600 dark:text-red-400 font-semibold">คำเตือน: การกระทำนี้จะลบข้อมูลธุรกรรมทั้งหมดอย่างถาวร!</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">ข้อมูลที่จะถูกลบได้แก่: พนักงาน, ลูกค้า, สินค้า, คำสั่งซื้อ, การเงิน, แปลง, กิจกรรม, อุปกรณ์ IoT, สินทรัพย์, และอื่นๆ ทั้งหมด ข้อมูลบริษัทและบัญชีผู้ใช้แอดมินของคุณจะยังคงอยู่</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">เพื่อยืนยัน โปรดพิมพ์ <strong className="text-red-700 dark:text-red-400 font-mono">RESET</strong> ลงในช่องด้านล่าง</p>
                    <div>
                        <input
                            type="text"
                            value={resetConfirmText}
                            onChange={(e) => setResetConfirmText(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-red-500 focus:ring-red-500 font-mono"
                        />
                    </div>
                    <div className="pt-4 flex justify-end space-x-2">
                        <button type="button" onClick={() => setResetModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">ยกเลิก</button>
                        <button
                            type="button"
                            onClick={handleResetData}
                            disabled={resetConfirmText !== 'RESET' || isSubmittingReset}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed flex items-center justify-center min-w-[150px]"
                        >
                            {isSubmittingReset ? <Spinner/> : 'ฉันเข้าใจและยืนยันการลบ'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminPage;