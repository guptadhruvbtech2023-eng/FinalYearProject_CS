import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle, 
  Compass, 
  RefreshCw,
  FileText 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { aiApi } from '../services/api';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const AIInsights = () => {
  const { dataset } = useApp();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await aiApi.getSummary();
      setSummary(res.data);
    } catch (err) {
      console.error("AI Summary error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dataset && dataset.status === 'ready') {
      fetchSummary();
    }
  }, [dataset]);

  if (!dataset || dataset.status !== 'ready') {
    return <EmptyState title="No Dataset" message="Please upload or load a dataset to view automated AI insights." />;
  }

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>Automated AI Executive Summary</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dynamically synthesized diagnostic narrative, risk radar, and executive advisory grounded in data.
          </p>
        </div>

        <button
          onClick={fetchSummary}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Regenerate Summary</span>
        </button>
      </div>

      {loading && !summary ? (
        <LoadingState message="Auditing operational margins, temporal trajectories, and formulating executive synthesis..." />
      ) : (
        <div className="space-y-6">
          {/* Executive Overview Narrative */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              <span>1. Executive Summary & Core Diagnosis</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
              {summary?.executive_summary}
            </p>
          </div>

          {/* Key Findings */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>2. Core Verified Findings</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {summary?.key_findings?.map((find, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                  <span>{find}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Positive Trends vs Risk Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Positive Trends */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>3. Positive Growth Vectors</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                {summary?.positive_trends?.map((pos, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <span>{pos}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Risk Areas */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>4. Operational & Margin Risks</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                {summary?.risk_areas?.map((risk, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Anomalies & Predictive Outlook */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Important Anomalies */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>5. Outlier & Anomaly Patterns</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                {summary?.important_anomalies?.map((anom, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                    <span>{anom}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Predictive Outlook */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>6. Predictive Machine Learning Outlook</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {summary?.predictive_outlook}
              </p>
            </div>
          </div>

          {/* Suggested Areas for Investigation */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-brand-600" />
              <span>7. Suggested Executive Actions & Investigations</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {summary?.suggested_investigations?.map((inv, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-brand-50/50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/60 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-brand-200 dark:bg-brand-800 text-brand-800 dark:text-brand-200 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{inv}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
