

import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_LINKS, ICONS } from '../constants';
import { CompanyInfo, User } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface SidebarProps {
    companyInfo: CompanyInfo;
    userProfile: User | null;
    onLogout: () => Promise<void>;
}

const ThemeToggleButton: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    return (
        <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-400 rounded-md hover:bg-gray-700 hover:text-white transition-colors duration-200"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {theme === 'light' ? ICONS.MOON : ICONS.SUN}
            <span className="ml-2">{theme === 'light' ? 'โหมดกลางคืน' : 'โหมดกลางวัน'}</span>
        </button>
    )
}

const Sidebar: React.FC<SidebarProps> = ({ companyInfo, userProfile, onLogout }) => {
    return (
        <div className="hidden md:flex flex-col w-64 bg-gray-800 text-white no-print">
            <div className="flex items-center justify-center h-20 border-b border-gray-700 px-4">
                <div className="flex items-center">
                    {companyInfo.logoUrl ? (
                        <img src={companyInfo.logoUrl} alt="Company Logo" className="h-10 w-10 rounded-md object-cover" />
                    ) : (
                        ICONS.LEAF
                    )}
                    <h1 className="text-xl font-bold ml-2 truncate">{companyInfo.name}</h1>
                </div>
            </div>
            <nav className="flex-1 overflow-y-auto mt-4">
                {NAV_LINKS.map((link) => (
                    <NavLink
                        key={link.name}
                        to={link.href.substring(1)}
                        end={link.href === '#/'}
                        className={({ isActive }) =>
                            `flex items-center px-6 py-3 mt-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200 ${
                                isActive ? 'bg-gray-900 text-white' : ''
                            }`
                        }
                    >
                        {link.icon}
                        <span className="mx-4">{link.name}</span>
                    </NavLink>
                ))}
            </nav>
             <div className="p-4 border-t border-gray-700">
                <div className="flex items-center mb-4">
                    {userProfile?.avatarUrl ? (
                        <img className="h-10 w-10 rounded-full object-cover" src={userProfile.avatarUrl} alt={userProfile.name || 'User Avatar'} />
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-lg">
                            {userProfile?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                    )}
                    <div className="ml-4">
                        <p className="font-semibold text-sm">{userProfile?.name || 'กำลังโหลด...'}</p>
                        <p className="text-xs text-gray-400">{userProfile?.role || '...'}</p>
                    </div>
                </div>
                <ThemeToggleButton />
                 <button
                    onClick={async () => await onLogout()}
                    className="w-full mt-2 flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-red-600 hover:text-white transition-colors duration-200"
                >
                    {ICONS.LOGOUT}
                    <span className="ml-2">ออกจากระบบ</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;