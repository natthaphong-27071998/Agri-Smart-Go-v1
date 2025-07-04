
import React from 'react';

interface HeaderProps {
    title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10 no-print">
            <div className="px-6 py-4">
                <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">{title}</h1>
            </div>
        </header>
    );
};

export default Header;