
import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { supabase } from './supabase';
import { Session } from '@supabase/supabase-js';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import EmployeeManagementPage from './pages/hr/EmployeeManagementPage';
import FarmAccountingPage from './pages/accounting/FarmAccountingPage';
import SalesManagementPage from './pages/sales/SalesManagementPage';
import ProductionManagementPage from './pages/production/ProductionManagementPage';
import InvestmentRiskPage from './pages/investment/InvestmentRiskPage';
import ReportsPage from './pages/reports/ReportsPage';
import AdminPage from './pages/admin/AdminPage';
import SmartAssistant from './components/SmartAssistant';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import HowToUsePage from './pages/HowToUsePage';
import { NAV_LINKS } from './constants';
import { CompanyInfo, User } from './types';
import Spinner from './components/Spinner';
import DatabaseSetupPage from './pages/admin/DatabaseSetupPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider, useToast } from './contexts/ToastContext';

const HeaderWrapper: React.FC<{ onMenuClick?: () => void }> = ({ onMenuClick }) => {
    const location = ReactRouterDOM.useLocation();
    const currentPath = location.pathname;

    const currentLink = [...NAV_LINKS]
        .sort((a, b) => b.href.length - a.href.length)
        .find(link => {
            const linkPath = link.href.substring(1); 
            if (linkPath === '/') {
                return currentPath === '/';
            }
            return currentPath.startsWith(linkPath);
        });
        
    const pageTitle = currentLink ? currentLink.name : 'แดชบอร์ด';
    return <Header title={pageTitle} onMenuClick={onMenuClick} />;
};

const ProtectedLayout: React.FC = () => {
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
    const [userProfile, setUserProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const toast = useToast();

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };
    
    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
             if (!session?.user?.email) {
                setLoading(false);
                return;
            }

            const [
                companyRes,
                userRes
            ] = await Promise.all([
                supabase.from('company_info').select('*').limit(1).single(),
                supabase.from('users').select('*').eq('email', session.user.email).limit(1).single()
            ]);
            
            if (companyRes.error) {
                console.error('Error fetching company info:', companyRes.error.message);
                if (companyRes.error.message.includes('relation "public.company_info" does not exist')) {
                    toast.toast('ฐานข้อมูลยังไม่ถูกตั้งค่า กรุณาไปที่หน้า Setup', 'error');
                }
            } else {
                setCompanyInfo(companyRes.data);
            }

            if (userRes.error) {
                console.error('Error fetching user profile:', userRes.error.message);
            } else {
                setUserProfile(userRes.data);
            }

            setLoading(false);
        };
        fetchInitialData();
    }, [toast]);

    if (loading) {
        return <div className="h-screen w-screen flex justify-center items-center bg-gray-100 dark:bg-gray-900"><Spinner /></div>;
    }

    if (!companyInfo) {
        return <ReactRouterDOM.Navigate to="/setup" replace />;
    }
    
    return (
        <div id="app-container" className="flex h-screen bg-gray-200 dark:bg-black">
            <Sidebar
                companyInfo={companyInfo}
                userProfile={userProfile}
                onLogout={handleLogout}
                isMobileOpen={isMobileSidebarOpen}
                onClose={() => setMobileSidebarOpen(false)}
            />
            <div id="content-wrapper" className="flex-1 flex flex-col overflow-hidden">
                <HeaderWrapper onMenuClick={() => setMobileSidebarOpen(true)} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 md:p-6">
                    <ReactRouterDOM.Routes>
                        <ReactRouterDOM.Route path="/" element={<DashboardPage />} />
                        <ReactRouterDOM.Route path="/production" element={<ProductionManagementPage />} />
                        <ReactRouterDOM.Route path="/hr" element={<EmployeeManagementPage />} />
                        <ReactRouterDOM.Route path="/accounting" element={<FarmAccountingPage />} />
                        <ReactRouterDOM.Route path="/sales" element={<SalesManagementPage companyInfo={companyInfo} />} />
                        <ReactRouterDOM.Route path="/investment" element={<InvestmentRiskPage />} />
                        <ReactRouterDOM.Route path="/reports" element={<ReportsPage />} />
                        <ReactRouterDOM.Route path="/admin" element={<AdminPage companyInfo={companyInfo} setCompanyInfo={setCompanyInfo} />} />
                        <ReactRouterDOM.Route path="*" element={<ReactRouterDOM.Navigate to="/" replace />} />
                    </ReactRouterDOM.Routes>
                </main>
            </div>
            <SmartAssistant />
        </div>
    );
};

const AppCore: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);
  
  if (loading) {
      return <div className="h-screen w-screen flex justify-center items-center bg-gray-100 dark:bg-gray-900"><Spinner/></div>
  }

  return (
    <ReactRouterDOM.Routes>
        <ReactRouterDOM.Route path="/setup" element={<DatabaseSetupPage />} />
        { !session ? (
            <>
                <ReactRouterDOM.Route path="/" element={<LandingPage />} />
                <ReactRouterDOM.Route path="/login" element={<LoginPage />} />
                <ReactRouterDOM.Route path="/how-to-use" element={<HowToUsePage />} />
                <ReactRouterDOM.Route path="*" element={<ReactRouterDOM.Navigate to="/" replace />} />
            </>
        ) : (
            <>
                <ReactRouterDOM.Route path="/*" element={<ProtectedLayout />} />
            </>
        )}
    </ReactRouterDOM.Routes>
  );
};


const App: React.FC = () => (
    <ThemeProvider>
        <ToastProvider>
            <ReactRouterDOM.HashRouter>
                <AppCore />
            </ReactRouterDOM.HashRouter>
        </ToastProvider>
    </ThemeProvider>
);


export default App;
