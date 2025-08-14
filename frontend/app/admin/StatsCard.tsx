import React from 'react';
import { CURRENCY_SYMBOL } from '../../lib/constants';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  bg: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, bg }) => (
  <div className={`rounded-2xl p-5 shadow-md border hover:shadow-lg transition-all duration-300 ${bg}`}>
    <div className="flex items-center justify-between">
      <div className="p-3 rounded-xl bg-white/10 shadow-sm">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="text-right">
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="text-xs text-white/80 mt-1">{title}</p>
      </div>
    </div>
  </div>
);

export default StatsCard; 