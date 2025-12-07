import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { SystemSnapshot } from '../types';

interface DashboardChartsProps {
  history: SystemSnapshot[];
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ history }) => {
  // Take last 20 data points for performance and readability
  const data = history.slice(-20).map((h) => ({
    time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    hr: h.health.heartRate,
    spO2: h.health.spO2,
    temp: h.env.temperature,
    pm25: h.env.pm25
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Health Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500" />
          Vitals Trend (Heart Rate & SpO2)
        </h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" hide />
              <YAxis yAxisId="left" domain={['dataMin - 5', 'dataMax + 5']} hide />
              <YAxis yAxisId="right" orientation="right" domain={[90, 100]} hide />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ color: '#64748b' }}
              />
              <Area 
                yAxisId="left" 
                type="monotone" 
                dataKey="hr" 
                stroke="#f43f5e" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorHr)" 
                name="Heart Rate"
              />
              <Area 
                yAxisId="right" 
                type="monotone" 
                dataKey="spO2" 
                stroke="#0ea5e9" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorSp)" 
                name="SpO2"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Environmental Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-500" />
          Environment (Temp & PM2.5)
        </h3>
        <div className="h-[250px] w-full">
           <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" hide />
              <YAxis yAxisId="left" domain={['auto', 'auto']} hide />
              <YAxis yAxisId="right" orientation="right" domain={[0, 'dataMax + 10']} hide />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="temp" 
                stroke="#64748b" 
                strokeWidth={2}
                dot={false}
                name="Temp (°C)"
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="pm25" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={false}
                name="PM2.5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
