import React from 'react';
import { SeasonalTheme } from '../types';

interface StatCardProps {
    icon: React.ReactNode; title: string; value: string; color: string;
    subtitle?: string; theme: SeasonalTheme; action?: React.ReactNode; isMobile?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, color, subtitle, theme, action, isMobile }) => (
    <div className={`${theme.cardBg} ${isMobile ? 'p-3' : 'p-4'} rounded-lg shadow-md flex items-center justify-between transition-all`}>
        <div className="flex items-center">
            <div className={`mr-4 ${isMobile ? 'text-2xl' : 'text-3xl'} ${color}`}>{icon}</div>
            <div>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} ${theme.secondaryTextColor}`}>{title}</p>
                <p className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold ${theme.primaryTextColor}`}>{value}</p>
                {subtitle && <p className={`text-[10px] ${theme.secondaryTextColor}`}>{subtitle}</p>}
            </div>
        </div>
        {action && <div>{action}</div>}
    </div>
);
export default StatCard;
