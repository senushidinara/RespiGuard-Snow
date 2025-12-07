import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit: string;
  icon: LucideIcon;
  colorClass: string;
  trend?: 'up' | 'down' | 'stable';
  alert?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  label, 
  value, 
  unit, 
  icon: Icon, 
  colorClass,
  alert = false
}) => {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 ${alert ? 'bg-red-50 border-red-200 shadow-red-100' : 'bg-white border-slate-100 shadow-sm'}`}>
      <div className="flex justify-between items-start mb-2">
        <div className={`p-2 rounded-lg ${alert ? 'bg-red-100 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
          <Icon size={20} className={colorClass} />
        </div>
        {alert && (
           <span className="flex h-3 w-3 relative">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
           </span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-800 tracking-tight">{value}</span>
          <span className="text-sm font-medium text-slate-400">{unit}</span>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
