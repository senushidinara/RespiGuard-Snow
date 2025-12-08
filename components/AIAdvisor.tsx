import React, { useState } from 'react';
import { SystemSnapshot, AIAnalysisResult, RiskLevel } from '../types';
import { analyzeRespiratoryRisk } from '../services/geminiService';
import { Brain, RefreshCw, AlertTriangle, CheckCircle, ThermometerSnowflake, Wind } from 'lucide-react';

interface AIAdvisorProps {
  currentData: SystemSnapshot;
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ currentData }) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await analyzeRespiratoryRisk(currentData);
      setAnalysis(result);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.LOW: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case RiskLevel.MODERATE: return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case RiskLevel.HIGH: return 'bg-orange-50 text-orange-700 border-orange-200';
      case RiskLevel.CRITICAL: return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  const hasApiKey = !!process.env.VITE_GEMINI_API_KEY || !!process.env.API_KEY;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Brain className="text-indigo-600" />
            AI Respiratory Advisor
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {hasApiKey ? "Powered by Gemini 2.5 Flash" : "Using intelligent mock analysis"}
            </p>
        </div>
        
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all ${
            loading 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200'
          }`}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Analyzing...' : analysis ? 'Update Analysis' : 'Run Analysis'}
        </button>
      </div>

      {!analysis && !loading && (
        <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <ThermometerSnowflake size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">Ready to analyze snow conditions and vitals.</p>
          <p className="text-xs text-slate-400">Click "Run Analysis" to get real-time insights.</p>
        </div>
      )}

      {analysis && (
        <div className="animate-fade-in space-y-4">
          {/* Risk Level Header */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${getRiskColor(analysis.riskLevel)}`}>
            <AlertTriangle size={24} className="shrink-0 mt-0.5" />
            <div>
              <div className="font-bold uppercase tracking-wide text-xs mb-1 opacity-80">Assessed Risk Level</div>
              <div className="text-2xl font-bold">{analysis.riskLevel}</div>
              <div className="mt-1 text-sm opacity-90">{analysis.summary}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Context */}
             <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 mb-2 text-slate-700 font-semibold">
                    <Wind size={18} />
                    <span>Weather Context</span>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">{analysis.weatherContext}</p>
             </div>

             {/* Recommendations */}
             <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <div className="flex items-center gap-2 mb-3 text-indigo-900 font-semibold">
                    <CheckCircle size={18} />
                    <span>Recommendations</span>
                </div>
                <ul className="space-y-2">
                    {analysis.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                            {rec}
                        </li>
                    ))}
                </ul>
             </div>
          </div>
          
          {lastUpdated && (
            <div className="text-right text-xs text-slate-400 mt-2">
                Last analyzed: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAdvisor;
