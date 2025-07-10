
import React, { useState } from 'react';
import { ICONS } from '../constants';
import { supabase } from '../supabase';
import { Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import Modal from '../components/Modal';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    
    const [isForgotModalOpen, setForgotModalOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            toast('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 'error');
            console.error('Login error:', error.message);
        }
        setLoading(false);
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingForgot(true);
        const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
            redirectTo: `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}#`,
        });
        if (error) {
            toast('เกิดข้อผิดพลาด: ' + error.message, 'error');
        } else {
            toast('กรุณาตรวจสอบอีเมลของคุณสำหรับลิงก์รีเซ็ตรหัสผ่าน', 'success');
            setForgotModalOpen(false);
            setForgotEmail('');
        }
        setIsSubmittingForgot(false);
    }

    return (
        <>
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
                    <div className="text-center">
                        <div className="inline-block p-3 bg-green-100 dark:bg-green-900/50 rounded-full">
                           {React.cloneElement(ICONS.LEAF as React.ReactElement<any>, { className: "h-12 w-12 text-green-500 dark:text-green-400" })}
                        </div>
                        <h1 className="mt-4 text-3xl font-bold text-gray-800 dark:text-gray-100">Agri-Smart Go</h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">ยินดีต้อนรับ! กรุณาเข้าสู่ระบบ</p>
                    </div>
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                อีเมล
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                                placeholder="you@example.com"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="password"className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    รหัสผ่าน
                                </label>
                                <div className="text-sm">
                                    <button type="button" onClick={() => setForgotModalOpen(true)} className="font-medium text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300">
                                        ลืมรหัสผ่าน?
                                    </button>
                                </div>
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                                placeholder="••••••••"
                                 disabled={loading}
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600"
                            >
                                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                            </button>
                        </div>
                    </form>

                    <div className="text-center mt-4">
                        <Link to="/" className="text-sm font-medium text-gray-600 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-300">
                            &larr; กลับสู่หน้าหลัก
                        </Link>
                    </div>
                </div>
            </div>
            
            <Modal title="รีเซ็ตรหัสผ่าน" isOpen={isForgotModalOpen} onClose={() => setForgotModalOpen(false)}>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">กรุณากรอกอีเมลที่ลงทะเบียนไว้ เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้</p>
                    <div>
                        <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">อีเมล</label>
                        <input type="email" id="forgot-email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm" required />
                    </div>
                    <div className="pt-4 flex justify-end space-x-2">
                        <button type="button" onClick={() => setForgotModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">ยกเลิก</button>
                        <button type="submit" disabled={isSubmittingForgot} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-800">
                            {isSubmittingForgot ? 'กำลังส่ง...' : 'ส่งลิงก์รีเซ็ต'}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
};

export default LoginPage;