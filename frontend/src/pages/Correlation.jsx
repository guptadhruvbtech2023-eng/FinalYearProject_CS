import React, { useState, useEffect } from 'react';
import { GitGraph, AlertCircle, Info, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { analyticsApi } from '../services/api';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const Correlation = () => {
  const { dataset } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dataset || dataset.status !== 'ready') return;

    const fetchCorrelation = async () => {
      try {
        setLoading(true);
        const res = await analyticsApi.getCorrelation();
        setData(res.data);
      } catch (err) {
        console.error("Correlation error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCorrelation();
  }, [dataset]);

  if (!dataset || dataset.status !== 'ready') {
    return <EmptyState title="No Dataset" message="Please upload or load a dataset to view correlation analysis." />;
  }

  // Get color for correlation value between -1.0 and 1.0
  const getCorrColor = (val) => {
    if (val === 1.0) return "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold";
    if (val > 0.6) return "bg-emerald-500 text-white font-bold";
    if (val > 0.3) return "bg-emerald-300 text-slate-900 font-semibold";
    if (val > 0.1) return "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300";
    if (val < -0.6) return "bg-rose-600 text-white font-bold";
    if (val < -0.3) return "bg-rose-400 text-white font-semibold";
    if (val < -0.1) return "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300";
    return "bg-slate-50 dark:bg-slate-800/60 text-slate-500";
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Numerical Correlation Matrix & Heatmap
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Evaluate linear co-dependencies between financial, operational, and fulfillment variables.
        </p>
      </div>

      {/* Causation Warning Banner */}
      <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold mb-0.5">Statistical Rigor Note: Correlation vs Causation</strong>
          Pearson correlation coefficients measure linear association, not direct causation. For instance, while high Discount correlates strongly with low Profit, external confounding variables (such as clearance sales on dead inventory) also influence the observed relationship.
        </div>
      </div>

      {loading && !data ? (
        <LoadingState message="Computing Pearson correlation coefficients across numerical attributes..." />
      ) : (
        <div className="space-y-6">
          {/* Heatmap Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Correlation Matrix
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs">
                <thead>
                  <tr>
                    <th className="p-2 text-left font-semibold text-slate-400">Attribute</th>
                    {data?.columns?.map((col, i) => (
                      <th key={i} className="p-2 font-semibold text-slate-700 dark:text-slate-300">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data?.columns?.map((rowCol, rIdx) => (
                    <tr key={rIdx}>
                      <td className="p-2 text-left font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {rowCol}
                      </td>
                      {data?.matrix?.[rIdx]?.map((val, cIdx) => (
                        <td key={cIdx} className="p-2">
                          <div className={`py-1.5 px-2 rounded-lg font-mono text-xs transition-colors ${getCorrColor(val)}`}>
                            {val > 0 ? `+${val}` : val}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Automated Statistical Interpretations */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Automated Analytical Interpretations
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data?.insights?.map((ins, idx) => (
                <div 
                  key={idx} 
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {ins.var1} ↔ {ins.var2}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ins.direction === 'positive' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}>
                      r = {ins.correlation} ({ins.strength} {ins.direction})
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {ins.interpretation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Correlation;
