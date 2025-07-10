
import React from 'react';

interface HeaderProps {
    title: string;
    onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onMenuClick }) => {
    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10 no-print flex items-center justify-between">
            <div className="px-4 md:px-6 py-4">
                <h1 className="text-xl md:text-2xl font-semibold text-gray-700 dark:text-gray-200">{title}</h1>
            </div>
            {onMenuClick && (
                 <button 
                    onClick={onMenuClick} 
                    className="md:hidden p-4 text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
                    aria-label="Open menu"
                >
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            )}
        </header>
    );
};

export default Header;