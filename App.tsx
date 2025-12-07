import React, { useState, useEffect, useRef } from 'react';
import { Activity, Thermometer, Wind, CloudSnow, Heart, User, Droplets, Mountain } from 'lucide-react';
import { SystemSnapshot, HealthMetrics, EnvironmentalMetrics, RiskLevel } from './types';
import MetricCard from './components/MetricCard';
import { DashboardCharts } from './components/DashboardCharts';
import AIAdvisor from './components/AIAdvisor';

// Initial state
const INITIAL_ENV: EnvironmentalMetrics = {
  temperature: -2.5,
  humidity: 78,
  pm25: 12,
  snowDepth: 15,
  coLevel: 0.5
};

const INITIAL_HEALTH: HealthMetrics = {
  heartRate: 75,
  spO2: 98,
  respiratoryRate: 16,
  bodyTemp: 36.8
};

const App: React.FC = () => {
  const [currentSnapshot, setCurrentSnapshot] = useState<SystemSnapshot>({
    timestamp: Date.now(),
    env: INITIAL_ENV,
    health: INITIAL_HEALTH
  });
  
  const [history, setHistory] = useState<SystemSnapshot[]>([]);

  // Simulation logic ref to avoid dependency loops in useEffect
  const dataRef = useRef(currentSnapshot);

  useEffect(() => {
    const interval = setInterval(() => {
      const prev = dataRef.current;
      
      // Simulate environment changes (Random Walk)
      // Snow makes humidity high, temp low.
      const newTemp = Math.max(-15, Math.min(5, prev.env.temperature + (Math.random() - 0.5) * 0.2));
      const newPm25 = Math.max(0, prev.env.pm25 + (Math.random() - 0.5) * 2); // Pollutants can spike
      const newSnow = Math.max(0, prev.env.snowDepth + (Math.random() > 0.8 ? 0.1 : 0)); // Snow accumulation
      
      // Simulate physiology
      // Cold/PM25 stress increases HR slightly, might drop SpO2
      const stressFactor = (newPm25 > 35 || newTemp < -10) ? 1.05 : 1.0;
      const newHr = Math.max(60, Math.min(130, prev.health.heartRate + (Math.random() - 0.5) * 4 * stressFactor));
      const newSpO2 = Math.max(90, Math.min(100, prev.health.spO2 + (Math.random() - 0.4) * 0.5)); // Tendency to drop slightly in bad conditions
      
      const newSnapshot: SystemSnapshot = {
        timestamp: Date.now(),
        env: {
            ...prev.env,
            temperature: newTemp,
            pm25: newPm25,
            snowDepth: newSnow,
            humidity: Math.max(40, Math.min(100, prev.env.humidity + (Math.random() - 0.5))),
        },
        health: {
            ...prev.health,
            heartRate: newHr,
            spO2: newSpO2,
            respiratoryRate: Math.max(12, Math.min(30, prev.health.respiratoryRate + (Math.random() - 0.5))),
        }
      };

      dataRef.current = newSnapshot;
      setCurrentSnapshot(newSnapshot);
      setHistory(prevHist => [...prevHist, newSnapshot].slice(-50)); // Keep last 50 points
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  // Derived alert states
  const isHypoxic = currentSnapshot.health.spO2 < 94;
  const isHighPollution = currentSnapshot.env.pm25 > 35;
  const isFreezing = currentSnapshot.env.temperature < -10;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
               <Mountain size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">RespiGuard Snow</h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                <User size={14} />
                <span>John Doe (Asthma Profile)</span>
             </div>
             <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="System Active"></div>
          </div>
        </div>
      </header>

      {/* Critical Alert Banner */}
      {(isHypoxic || isHighPollution) && (
        <div className="bg-red-600 text-white px-4 py-3 shadow-md sticky top-16 z-20 animate-slide-in">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              <Activity className="animate-pulse" />
              <span>Warning: {isHypoxic ? 'Low Oxygen Saturation Detected.' : 'High Particulate Matter detected.'}</span>
            </div>
            <span className="text-sm bg-red-700 px-2 py-1 rounded">Seek Shelter</span>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Intro / Status */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Health Dashboard</h2>
                <p className="text-slate-500">Real-time monitoring in snowy conditions.</p>
            </div>
            <div className="text-right">
                <div className="text-sm text-slate-400">Current Temperature</div>
                <div className="text-3xl font-light text-slate-700">{currentSnapshot.env.temperature.toFixed(1)}°C</div>
            </div>
        </div>

        {/* AI Section */}
        <section>
            <AIAdvisor currentData={currentSnapshot} />
        </section>

        {/* Live Metrics Grid */}
        <section>
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Live Sensors</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Environmental */}
            <MetricCard 
              label="PM2.5 Level" 
              value={currentSnapshot.env.pm25.toFixed(1)} 
              unit="µg/m³" 
              icon={Wind}
              colorClass="text-slate-600"
              alert={currentSnapshot.env.pm25 > 25}
            />
            <MetricCard 
              label="Snow Depth" 
              value={currentSnapshot.env.snowDepth.toFixed(1)} 
              unit="cm" 
              icon={CloudSnow}
              colorClass="text-sky-500"
            />
             {/* Health */}
            <MetricCard 
              label="Heart Rate" 
              value={Math.round(currentSnapshot.health.heartRate)} 
              unit="bpm" 
              icon={Heart}
              colorClass="text-rose-500"
              alert={currentSnapshot.health.heartRate > 110}
            />
            <MetricCard 
              label="SpO2" 
              value={currentSnapshot.health.spO2.toFixed(1)} 
              unit="%" 
              icon={Droplets}
              colorClass="text-blue-500"
              alert={currentSnapshot.health.spO2 < 95}
            />
          </div>
        </section>

        {/* Secondary Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
                label="Humidity"
                value={Math.round(currentSnapshot.env.humidity)}
                unit="%"
                icon={Droplets}
                colorClass="text-indigo-400"
            />
             <MetricCard 
                label="Body Temp"
                value={currentSnapshot.health.bodyTemp.toFixed(1)}
                unit="°C"
                icon={Thermometer}
                colorClass="text-orange-400"
            />
             <MetricCard 
                label="Resp. Rate"
                value={Math.round(currentSnapshot.health.respiratoryRate)}
                unit="rpm"
                icon={Wind}
                colorClass="text-teal-500"
            />
             <div className="bg-slate-100 rounded-2xl p-5 border border-slate-200 flex flex-col justify-center items-center text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">System Status</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1 mt-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    Sensors Online
                </span>
             </div>
        </section>

        {/* Charts */}
        <section>
          <DashboardCharts history={history} />
        </section>

      </main>
    </div>
  );
};

export default App;
