import React, { useState, useEffect } from 'react';
import { Lightbulb, Info, Sparkles, BarChart2, ShieldCheck } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { useApp } from '../context/AppContext';
import { mlApi } from '../services/api';
import ChartCard from '../components/ChartCard';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const Explainability = () => {
  const { dataset, darkMode } = useApp();
  const [target, setTarget] = useState("Profit");
  const [trainData, setTrainData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dataset || dataset.status !== 'ready') return;

    const fetchExplainability = async () => {
      try {
        setLoading(true);
        const res = await mlApi.train(target, ["random_forest"], 0.2);
        setTrainData(res.data);
      } catch (err) {
        console.error("Explainability error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExplainability();
  }, [dataset, target]);

  if (!dataset || dataset.status !== 'ready') {
    return <EmptyState title="No Dataset" message="Please upload or load a dataset to view model explainability." />;
  }

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Explainable AI (XAI) & Feature Importance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Interpret predictive model decision trees and quantify the relative contribution of business drivers.
          </p>
        </div>

        {/* Target Selector */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setTarget("Profit")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              target === 'Profit' 
                ? 'bg-brand-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Profit Drivers
          </button>
          <button
            onClick={() => setTarget("Sales")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              target === 'Sales' 
                ? 'bg-brand-600 text-white shadow-xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sales Drivers
          </button>
        </div>
      </div>

      {/* Causation Notice */}
      <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold mb-0.5">Statistical Transparency: Importance vs Causation</strong>
          Feature importance indicates how heavily decision trees partition splits on a given variable to reduce MSE variance. It does not establish unilateral causation. Interpret these figures as predictive weight rather than guaranteed causal levers.
        </div>
      </div>

      {loading ? (
        <LoadingState message={`Computing Gini/Variance feature importance from Random Forest ensemble for ${target}...`} />
      ) : (
        <div className="space-y-6">
          {/* Main Feature Importance Chart */}
          <ChartCard
            title={`Primary Prediction Drivers for ${target}`}
            subtitle="Relative contribution percentage across tree estimators"
          >
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={trainData?.feature_importance || []} 
                  layout="vertical" 
                  margin={{ left: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#e2e8f0"} />
                  <XAxis type="number" stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="feature" stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} />
                  <Tooltip 
                    formatter={(val) => [`${val}%`, "Relative Importance"]}
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                      borderColor: darkMode ? '#334155' : '#e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="importance" fill="#6366f1" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Qualitative Driver Explanations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Positive Expansion Factors</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <span><strong>Order Volume (Quantity):</strong> Increased basket size lowers per-unit logistics friction and boosts cumulative margins.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <span><strong>High-Margin Categories:</strong> Technology and specific Office Supplies sub-categories carry robust pricing elasticity.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-500" />
                <span>Margin Erosion Levers</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                  <span><strong>Excessive Discounting:</strong> As discount approaches 20%+, tree nodes consistently branch into severe negative profit outcomes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                  <span><strong>Shipping Class Surcharges:</strong> Small-ticket orders fulfilled through expedited air express severely erode bottom lines.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Explainability;
