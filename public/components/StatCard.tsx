
import React from 'react';

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string;
    color: string;
    darkColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color, darkColor }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center">
            <div className={`p-3 rounded-full ${color} ${darkColor}`}>
                {icon}
            </div>
            <div className="ml-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
            </div>
        </div>
    );
};

export default StatCard;