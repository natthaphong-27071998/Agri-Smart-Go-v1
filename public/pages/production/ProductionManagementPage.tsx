

import React, { useState, useMemo, useEffect } from 'react';
import { Plot, FarmActivity, IoTDevice, PlotStatus, ActivityStatus, ActivityType, Employee, DeviceStatus } from '../../types';
import DataTable, { Column } from '../../components/DataTable';
import StatCard from '../../components/StatCard';
import Modal from '../../components/Modal';
import { supabase } from '../../supabase';
import Spinner from '../../components/Spinner';
import { useToast } from '../../contexts/ToastContext';
import { ICONS } from '../../constants';

const ALL_ACTIVITY_TYPES: ActivityType[] = ['เตรียมดิน', 'ปลูก', 'ใส่ปุ๋ย', 'รดน้ำ', 'กำจัดวัชพืช', 'เก็บเกี่ยว'];
const ALL_ACTIVITY_STATUSES: ActivityStatus[] = ['วางแผน', 'กำลังดำเนินการ', 'เสร็จสิ้น'];
const ALL_PLOT_STATUSES: PlotStatus[] = ['ว่าง', 'เตรียมดิน', 'กำลังเติบโต', 'พร้อมเก็บเกี่ยว', 'เก็บเกี่ยวแล้ว'];
const ALL_DEVICE_STATUSES: DeviceStatus[] = ['Online', 'Offline', 'Needs Setup'];

const CROP_DURATIONS: Record<string, number> = {
    'กะหล่ำปลี': 90,
    'ข้าวโพด': 75,
    'มะม่วง': 150,
    'ผักกาด': 45,
    'แตงกวา': 60
};

const calculateExpectedHarvestDate = (plantingDate: string | null, crop: string | null): string => {
    if (!plantingDate || !crop || !CROP_DURATIONS[crop]) {
        return 'N/A';
    }
    const startDate = new Date(plantingDate);
    startDate.setDate(startDate.getDate() + CROP_DURATIONS[crop]);
    return startDate.toISOString().split('T')[0];
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            active ? 'bg-green-600 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
    >
        {children}
    </button>
);

const PlotStatusBadge: React.FC<{ status: PlotStatus | null }> = ({ status }) => {
    if (!status) return null;
    const colors: Record<PlotStatus, string> = {
        'ว่าง': 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
        'เตรียมดิน': 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
        'กำลังเติบโต': 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100',
        'พร้อมเก็บเกี่ยว': 'bg-teal-200 text-teal-800 dark:bg-teal-800 dark:text-teal-100',
        'เก็บเกี่ยวแล้ว': 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status]}`}>{status}</span>;
}

const DeviceStatusBadge: React.FC<{ status: DeviceStatus | null }> = ({ status }) => {
    if (!status) return null;
    const colors: Record<DeviceStatus, string> = {
        'Online': 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100',
        'Offline': 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-100',
        'Needs Setup': 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100',
    };
    return (
        <div className="flex items-center">
            <span className={`h-2 w-2 rounded-full mr-2 ${status === 'Online' ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${colors[status]}`}>{status}</span>
        </div>
    );
};


const todayString = new Date().toISOString().split('T')[0];
const defaultDeviceForm: Omit<IoTDevice, 'id' | 'last_heartbeat'> = { device_id: '', name: '', plot_id: '', sensor_type: 'Temperature', status: 'Needs Setup' };


const ProductionManagementPage: React.FC = () => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'overview' | 'plots' | 'activities' | 'iot'>('overview');
    const [loading, setLoading] = useState(true);

    const [plots, setPlots] = useState<Plot[]>([]);
    const [activities, setActivities] = useState<FarmActivity[]>([]);
    const [employees, setEmployees] = useState<Pick<Employee, 'name'>[]>([]);
    const [iotDevices, setIotDevices] = useState<IoTDevice[]>([]);

    const [isPlotModalOpen, setPlotModalOpen] = useState(false);
    const [isActivityModalOpen, setActivityModalOpen] = useState(false);
    const [isDeviceModalOpen, setDeviceModalOpen] = useState(false);
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [editingPlot, setEditingPlot] = useState<Plot | null>(null);
    const [plotFormData, setPlotFormData] = useState<Omit<Plot, 'id' | 'expectedHarvestDate'>>({
        name: '', crop: '', plantingDate: todayString, status: 'ว่าง', size: 1
    });

    const [editingActivity, setEditingActivity] = useState<FarmActivity | null>(null);
    const [activityFormData, setActivityFormData] = useState<Omit<FarmActivity, 'id' | 'plotName'>>({
        date: todayString, activityType: 'รดน้ำ', plotId: '', assignedTo: '', status: 'วางแผน'
    });
    
    const [editingDevice, setEditingDevice] = useState<IoTDevice | null>(null);
    const [deviceFormData, setDeviceFormData] = useState(defaultDeviceForm);


    const fetchData = async () => {
        setLoading(true);
        try {
            const [
                plotsRes,
                activitiesRes,
                employeesRes,
                devicesRes
            ] = await Promise.all([
                supabase.from('plots').select('*').order('name', { ascending: true }),
                supabase.from('farm_activities').select('*').order('date', { ascending: false }),
                supabase.from('employees').select('name').eq('status', 'Active'),
                supabase.from('iot_devices').select('*').order('name', { ascending: true })
            ]);
            if (plotsRes.error) throw plotsRes.error;
            if (activitiesRes.error) throw activitiesRes.error;
            if (employeesRes.error) throw employeesRes.error;
            if (devicesRes.error) throw devicesRes.error;

            setPlots(plotsRes.data || []);
            setActivities(activitiesRes.data || []);
            setEmployees(employeesRes.data || []);
            setIotDevices(devicesRes.data || []);

        } catch (error: any) {
            console.error('Error fetching production data:', error);
            toast('ไม่สามารถดึงข้อมูลการผลิตได้: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [toast]);
    
    const stats = useMemo(() => {
        const growingPlots = plots.filter(p => p.status === 'กำลังเติบโต').length;
        const harvestReadyPlots = plots.filter(p => p.status === 'พร้อมเก็บเกี่ยว').length;
        const todayActivities = activities.filter(a => a.date === todayString).length;
        return { plots, growingPlots, harvestReadyPlots, todayActivities };
    }, [plots, activities]);

    const handleClosePlotModal = () => { setPlotModalOpen(false); setEditingPlot(null); };
    const handleOpenAddPlotModal = () => {
        setEditingPlot(null);
        setPlotFormData({ name: '', crop: '', plantingDate: todayString, status: 'ว่าง', size: 1 });
        setPlotModalOpen(true);
    };
    const handleOpenEditPlotModal = (plot: Plot) => {
        setEditingPlot(plot);
        const { id, expectedHarvestDate, ...formData } = plot;
        setPlotFormData(formData);
        setPlotModalOpen(true);
    };
    const handleSavePlot = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const expectedHarvestDate = calculateExpectedHarvestDate(plotFormData.plantingDate, plotFormData.crop);
        const payload = { ...plotFormData, expectedHarvestDate };
        let error;
        if (editingPlot) {
            const { error: updateError } = await supabase.from('plots').update(payload).eq('id', editingPlot.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase.from('plots').insert(payload);
            error = insertError;
        }
        if (error) {
            toast('ไม่สามารถบันทึกข้อมูลแปลงได้: ' + error.message, 'error');
        } else {
            toast(editingPlot ? 'แก้ไขข้อมูลแปลงสำเร็จ' : 'เพิ่มแปลงใหม่สำเร็จ', 'success');
            fetchData();
            handleClosePlotModal();
        }
        setIsSubmitting(false);
    };

    const handleCloseActivityModal = () => { setActivityModalOpen(false); setEditingActivity(null); };
    const handleOpenAddActivityModal = () => {
        setEditingActivity(null);
        setActivityFormData({ date: todayString, activityType: 'รดน้ำ', plotId: plots[0]?.id || '', assignedTo: employees[0]?.name || '', status: 'วางแผน' });
        setActivityModalOpen(true);
    };
    const handleOpenEditActivityModal = (activity: FarmActivity) => {
        setEditingActivity(activity);
        const { id, plotName, ...formData } = activity;
        setActivityFormData(formData);
        setActivityModalOpen(true);
    };
    const handleSaveActivity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activityFormData.plotId || !activityFormData.assignedTo) {
            toast('กรุณาเลือกแปลงและผู้รับผิดชอบ', 'error');
            return;
        }
        setIsSubmitting(true);
        const plot = plots.find(p => p.id === activityFormData.plotId);
        const payload = { ...activityFormData, plotName: plot?.name || 'N/A' };
        let error;
        if (editingActivity) {
            const { error: updateError } = await supabase.from('farm_activities').update(payload).eq('id', editingActivity.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase.from('farm_activities').insert(payload);
            error = insertError;
        }
        if (error) {
            toast('ไม่สามารถบันทึกกิจกรรมได้: ' + error.message, 'error');
        } else {
            toast(editingActivity ? 'แก้ไขกิจกรรมสำเร็จ' : 'เพิ่มกิจกรรมใหม่สำเร็จ', 'success');
            fetchData();
            handleCloseActivityModal();
        }
        setIsSubmitting(false);
    };
    const handleActivityStatusChange = async (id: string, newStatus: ActivityStatus) => {
        const { error } = await supabase.from('farm_activities').update({ status: newStatus }).eq('id', id);
        if (error) {
            toast('ไม่สามารถอัปเดตสถานะได้: ' + error.message, 'error');
        } else {
            setActivities(prev => prev.map(act => act.id === id ? { ...act, status: newStatus } : act));
        }
    };
    
    // IoT Device Handlers
    const handleCloseDeviceModal = () => { setDeviceModalOpen(false); setEditingDevice(null); };
    const handleOpenAddDeviceModal = () => {
        setEditingDevice(null);
        setDeviceFormData({ ...defaultDeviceForm, plot_id: plots[0]?.id || '' });
        setDeviceModalOpen(true);
    };
    const handleOpenEditDeviceModal = (device: IoTDevice) => {
        setEditingDevice(device);
        setDeviceFormData(device);
        setDeviceModalOpen(true);
    };

    const handleSaveDevice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!deviceFormData.device_id || !deviceFormData.name) {
            toast('กรุณากรอก Device ID และชื่ออุปกรณ์', 'error');
            return;
        }
        setIsSubmitting(true);
        const payload = { ...deviceFormData, last_heartbeat: new Date().toISOString() };
        let error;
        if (editingDevice) {
            const { error: updateError } = await supabase.from('iot_devices').update(payload).eq('id', editingDevice.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase.from('iot_devices').insert(payload);
            error = insertError;
        }
        if (error) {
            toast('ไม่สามารถบันทึกอุปกรณ์ได้: ' + error.message, 'error');
        } else {
            toast(editingDevice ? 'แก้ไขข้อมูลอุปกรณ์สำเร็จ' : 'ลงทะเบียนอุปกรณ์ใหม่สำเร็จ', 'success');
            fetchData();
            handleCloseDeviceModal();
        }
        setIsSubmitting(false);
    };
    
     const handleDeleteDevice = async (deviceId: string) => {
        if(window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบอุปกรณ์นี้?')) {
            const { error } = await supabase.from('iot_devices').delete().eq('id', deviceId);
            if(error) {
                toast('ไม่สามารถลบอุปกรณ์ได้: ' + error.message, 'error');
            } else {
                toast('ลบอุปกรณ์สำเร็จ', 'success');
                fetchData();
            }
        }
    }


    const activityColumns: Column<FarmActivity>[] = [
        { header: 'วันที่', accessor: 'date' },
        { header: 'กิจกรรม', accessor: 'activityType', className: 'font-medium text-gray-800 dark:text-gray-100' },
        { header: 'แปลง', accessor: 'plotName' },
        { header: 'ผู้รับผิดชอบ', accessor: 'assignedTo' },
        { header: 'สถานะ', accessor: (item) => {
             const colors: Record<ActivityStatus, string> = { 'วางแผน': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', 'กำลังดำเนินการ': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', 'เสร็จสิ้น': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
             return (<select value={item.status ?? 'วางแผน'} onChange={(e) => handleActivityStatusChange(item.id, e.target.value as ActivityStatus)} onClick={(e) => e.stopPropagation()} className={`px-2 py-1 text-xs font-semibold rounded-full border-transparent focus:ring-2 focus:ring-offset-1 appearance-none ${colors[item.status ?? 'วางแผน']}`}>{ALL_ACTIVITY_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}</select>)
        }},
    ];

    const renderContent = () => {
        if (loading) return <div className="flex justify-center p-10"><Spinner /></div>;
        switch (activeTab) {
            case 'overview': return (<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-inner"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"><StatCard title="แปลงเพาะปลูกทั้งหมด" value={`${stats.plots.length} แปลง`} color="bg-blue-100 text-blue-600" darkColor="dark:bg-blue-900/50 dark:text-blue-300" icon={<span className="text-2xl">🌳</span>} /><StatCard title="กำลังเติบโต" value={`${stats.growingPlots} แปลง`} color="bg-green-100 text-green-600" darkColor="dark:bg-green-900/50 dark:text-green-300" icon={<span className="text-2xl">🌿</span>} /><StatCard title="พร้อมเก็บเกี่ยว" value={`${stats.harvestReadyPlots} แปลง`} color="bg-teal-100 text-teal-600" darkColor="dark:bg-teal-900/50 dark:text-teal-300" icon={<span className="text-2xl">🌾</span>} /><StatCard title="กิจกรรมวันนี้" value={`${stats.todayActivities} รายการ`} color="bg-yellow-100 text-yellow-600" darkColor="dark:bg-yellow-900/50 dark:text-yellow-300" icon={<span className="text-2xl">📅</span>} /></div></div>);
            case 'plots': return (<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-inner"><div className="flex justify-end mb-4"><button onClick={handleOpenAddPlotModal} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">เพิ่มแปลงใหม่</button></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{plots.map(plot => (<div key={plot.id} className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"><div className="flex justify-between items-start"><h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{plot.name}</h3><PlotStatusBadge status={plot.status} /></div><div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300"><p><span className="font-semibold text-gray-700 dark:text-gray-200">พืชที่ปลูก:</span> {plot.crop}</p><p><span className="font-semibold text-gray-700 dark:text-gray-200">วันที่ปลูก:</span> {plot.plantingDate}</p><p><span className="font-semibold text-gray-700 dark:text-gray-200">คาดว่าจะเก็บเกี่ยว:</span> {plot.expectedHarvestDate}</p><p><span className="font-semibold text-gray-700 dark:text-gray-200">ขนาด:</span> {plot.size} ไร่</p></div><div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-600 text-right"><button onClick={() => handleOpenEditPlotModal(plot)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">แก้ไข</button></div></div>))}</div></div>);
            case 'activities': const activityActions = (item: FarmActivity) => (<div className="text-right"><button onClick={() => handleOpenEditActivityModal(item)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">แก้ไข</button></div>); return (<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-inner"><div className="flex justify-end mb-4"><button onClick={handleOpenAddActivityModal} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">เพิ่มกิจกรรมใหม่</button></div><DataTable columns={activityColumns} data={activities} actions={activityActions} /></div>);
            case 'iot': return (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-inner">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">การจัดการอุปกรณ์ IoT</h3>
                        <button onClick={handleOpenAddDeviceModal} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
                           {ICONS.CHIP} <span>ลงทะเบียนอุปกรณ์ใหม่</span>
                        </button>
                    </div>
                    {iotDevices.length === 0 ? (
                         <div className="text-center py-10 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.556a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a10 10 0 0114.142 0M1.393 8.111a15.5 15.5 0 0121.214 0" /></svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">ไม่พบอุปกรณ์ IoT</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">เริ่มต้นด้วยการลงทะเบียนอุปกรณ์ใหม่</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {iotDevices.map(device => {
                            const plot = plots.find(p => p.id === device.plot_id);
                             // Mock sensor data for display purposes
                            const mockData = { temp: (Math.random() * 5 + 28).toFixed(1), humidity: (Math.random() * 10 + 65).toFixed(1) };
                            return (
                                <div key={device.id} className="bg-gray-50 dark:bg-gray-700/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">{ICONS.CHIP} {device.name}</h4>
                                        <DeviceStatusBadge status={device.status} />
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mb-4">{device.device_id}</p>
                                    <div className="space-y-3 text-sm">
                                        <p><span className="font-semibold text-gray-700 dark:text-gray-200">ติดตั้งที่แปลง:</span> {plot?.name || 'ยังไม่ได้กำหนด'}</p>
                                        <p><span className="font-semibold text-gray-700 dark:text-gray-200">ประเภทเซ็นเซอร์:</span> {device.sensor_type}</p>
                                        <div className="pt-2 border-t dark:border-gray-600 flex items-center justify-around">
                                            <div><span className="font-semibold">🌡️ Temp:</span> {mockData.temp}°C</div>
                                            <div><span className="font-semibold">💧 Humid:</span> {mockData.humidity}%</div>
                                        </div>
                                    </div>
                                    <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-600 flex justify-end space-x-4">
                                        <button onClick={() => handleOpenEditDeviceModal(device)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">แก้ไข</button>
                                        <button onClick={() => handleDeleteDevice(device.id)} className="text-sm font-semibold text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">ลบ</button>
                                    </div>
                                </div>
                            )
                        })}
                        </div>
                    )}
                </div>
            );
            default: return null;
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700 pb-3"><TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>ภาพรวม</TabButton><TabButton active={activeTab === 'plots'} onClick={() => setActiveTab('plots')}>จัดการแปลงปลูก</TabButton><TabButton active={activeTab === 'activities'} onClick={() => setActiveTab('activities')}>ปฏิทินกิจกรรม</TabButton><TabButton active={activeTab === 'iot'} onClick={() => setActiveTab('iot')}>การจัดการ IoT</TabButton></div>
            <div>{renderContent()}</div>

            <Modal title={editingDevice ? "แก้ไขอุปกรณ์ IoT" : "ลงทะเบียนอุปกรณ์ใหม่"} isOpen={isDeviceModalOpen} onClose={handleCloseDeviceModal}>
                <form onSubmit={handleSaveDevice} className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 border-b pb-2">ข้อมูลอุปกรณ์</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium">ชื่ออุปกรณ์</label><input type="text" value={deviceFormData.name ?? ''} onChange={e => setDeviceFormData({...deviceFormData, name: e.target.value})} placeholder="เช่น เซ็นเซอร์แปลงมะม่วง 1" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" required /></div>
                        <div><label className="block text-sm font-medium">Device ID (e.g., MAC Address)</label><input type="text" value={deviceFormData.device_id} onChange={e => setDeviceFormData({...deviceFormData, device_id: e.target.value})} placeholder="XX:XX:XX:XX:XX:XX" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm font-mono" required /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium">ติดตั้งที่แปลง</label><select value={deviceFormData.plot_id ?? ''} onChange={e => setDeviceFormData({...deviceFormData, plot_id: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" required><option value="">-- เลือกแปลง --</option>{plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                         <div><label className="block text-sm font-medium">ประเภทเซ็นเซอร์หลัก</label><select value={deviceFormData.sensor_type ?? 'Temperature'} onChange={e => setDeviceFormData({...deviceFormData, sensor_type: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm"><option>Temperature</option><option>Humidity</option><option>Soil Moisture</option><option>Multi-sensor</option></select></div>
                    </div>
                    {!editingDevice && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg mt-4">
                             <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 border-b pb-2 mb-4 flex items-center gap-2">{ICONS.WIFI}จำลองการตั้งค่าเครือข่าย</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="block text-sm font-medium">เลือกเครือข่าย Wi-Fi</label><select className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm"><option>MyFarm_WiFi</option><option>Greenhouse_Net</option><option>IoT_Network_5G</option></select></div>
                                <div><label className="block text-sm font-medium">รหัสผ่าน</label><input type="password" placeholder="••••••••" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm"/></div>
                            </div>
                        </div>
                    )}
                    <div className="pt-4 flex justify-end space-x-2"><button type="button" onClick={handleCloseDeviceModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">ยกเลิก</button><button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-800 flex justify-center items-center min-w-[140px]">{isSubmitting ? <Spinner/> : (editingDevice ? 'บันทึกการแก้ไข' : 'บันทึกอุปกรณ์')}</button></div>
                </form>
            </Modal>

            <Modal title={editingPlot ? "แก้ไขข้อมูลแปลง" : "เพิ่มแปลงใหม่"} isOpen={isPlotModalOpen} onClose={handleClosePlotModal}><form onSubmit={handleSavePlot} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ชื่อแปลง</label><input type="text" value={plotFormData.name ?? ''} onChange={e => setPlotFormData({...plotFormData, name: e.target.value})} placeholder="เช่น แปลง A-03" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" required /></div><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">พืชที่ปลูก</label><input type="text" value={plotFormData.crop ?? ''} onChange={e => setPlotFormData({...plotFormData, crop: e.target.value})} placeholder="เช่น กะหล่ำปลี" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" required /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ขนาด (ไร่)</label><input type="number" min="0.1" step="0.1" value={plotFormData.size ?? ''} onChange={e => setPlotFormData({...plotFormData, size: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" required /></div><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">สถานะ</label><select value={plotFormData.status ?? 'ว่าง'} onChange={e => setPlotFormData({...plotFormData, status: e.target.value as PlotStatus})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm">{ALL_PLOT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div></div><div className="grid grid-cols-1"><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">วันที่ปลูก</label><input type="date" value={plotFormData.plantingDate ?? ''} onChange={e => setPlotFormData({...plotFormData, plantingDate: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" /></div></div><div className="pt-4 flex justify-end space-x-2"><button type="button" onClick={handleClosePlotModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">ยกเลิก</button><button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-800 flex justify-center items-center min-w-[120px]">{isSubmitting ? <Spinner/> : 'บันทึกข้อมูล'}</button></div></form></Modal>
            <Modal title={editingActivity ? "แก้ไขกิจกรรม" : "เพิ่มกิจกรรมใหม่"} isOpen={isActivityModalOpen} onClose={handleCloseActivityModal}><form onSubmit={handleSaveActivity} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">วันที่</label><input type="date" value={activityFormData.date ?? ''} onChange={e => setActivityFormData({...activityFormData, date: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" required /></div><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">แปลง</label><select value={activityFormData.plotId ?? ''} onChange={e => setActivityFormData({...activityFormData, plotId: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" required><option value="">-- เลือกแปลง --</option>{plots.map(p => <option key={p.id} value={p.id}>{p.name} ({p.crop})</option>)}</select></div><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ประเภทกิจกรรม</label><select value={activityFormData.activityType ?? 'รดน้ำ'} onChange={e => setActivityFormData({...activityFormData, activityType: e.target.value as ActivityType})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm">{ALL_ACTIVITY_TYPES.map(type => <option key={type} value={type}>{type}</option>)}</select></div><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ผู้รับผิดชอบ</label><select value={activityFormData.assignedTo ?? ''} onChange={e => setActivityFormData({...activityFormData, assignedTo: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" required><option value="">-- เลือกผู้รับผิดชอบ --</option>{employees.map(emp => <option key={emp.name} value={emp.name ?? ''}>{emp.name}</option>)}</select></div><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">สถานะ</label><select value={activityFormData.status ?? 'วางแผน'} onChange={e => setActivityFormData({...activityFormData, status: e.target.value as ActivityStatus})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm">{ALL_ACTIVITY_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}</select></div><div className="pt-4 flex justify-end space-x-2"><button type="button" onClick={handleCloseActivityModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">ยกเลิก</button><button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-800 flex justify-center items-center min-w-[140px]">{isSubmitting ? <Spinner/> : (editingActivity ? 'บันทึกการแก้ไข' : 'บันทึกกิจกรรม')}</button></div></form></Modal>
        </div>
    );
};

export default ProductionManagementPage;