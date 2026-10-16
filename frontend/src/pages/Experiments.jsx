import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Award, 
  TrendingUp, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  ShieldCheck, 
  Sparkles, 
  BarChart3,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { experimentApi, mlApi } from '../services/api';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const Experiments = () => {
  const { dataset } = useApp();
  const [selectedTarget, setSelectedTarget] = useState('Profit');
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [retraining, setRetraining] = useState(false);

  const fetchExperimentSummary = async (target) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await experimentApi.getSummary(target);
      setSummaryData(res.data);
    } catch (err) {
      console.error("Experiment summary error:", err);
      setErrorMsg("Failed to load research experiment summary. Ensure ML models have been trained.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetrainAll = async () => {
    try {
      setRetraining(true);
      setErrorMsg(null);
      await mlApi.train(selectedTarget, ['linear_regression', 'random_forest', 'gradient_boosting'], 0.2);
      await fetchExperimentSummary(selectedTarget);
    } catch (err) {
      console.error("Retrain error:", err);
      setErrorMsg("Failed to execute ML training pipeline.");
    } finally {
      setRetraining(false);
    }
  };

  useEffect(() => {
    if (dataset && dataset.status === 'ready') {
      fetchExperimentSummary(selectedTarget);
    }
  }, [dataset, selectedTarget]);

  if (!dataset || dataset.status !== 'ready') {
    return <EmptyState title="No Dataset" message="Please upload or load a dataset to view Research Experiments & Benchmarks." />;
  }

  if (loading && !summaryData) {
    return <LoadingState message="Compiling research benchmark metrics, baseline comparisons, and thesis defense notes..." />;
  }

  const modelComparisons = summaryData?.ml_benchmark?.model_comparisons || [];
  const bestModel = summaryData?.ml_benchmark?.best_model;
  const targetCol = summaryData?.target_variable || selectedTarget;

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <FlaskConical className="w-3 h-3" />
              Academic Research Track
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 text-[10px] font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Seed 42 Reproducible
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Machine Learning Benchmarks & Research Experiments
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Empirical validation of predictive algorithms against a standardized naive baseline (Historical Mean), with statistical uplift metrics and viva defense notes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Target Variable Selector */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-500">Target:</span>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="Profit">Profit ($)</option>
              <option value="Sales">Sales ($)</option>
            </select>
          </div>

          {/* Retrain Button */}
          <button
            onClick={handleRetrainAll}
            disabled={retraining}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin text-brand-600' : ''}`} />
            <span>{retraining ? "Evaluating..." : "Re-evaluate"}</span>
          </button>

          {/* Export Markdown */}
          <a
            href={experimentApi.exportMarkdownUrl(selectedTarget)}
            download={`experiment_results_${selectedTarget.toLowerCase()}.md`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Markdown Report</span>
          </a>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-200 mb-1">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Notice</span>
          </div>
          <p className="text-amber-700 dark:text-amber-300">{errorMsg}</p>
        </div>
      )}

      {/* Research Framework Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Research Hypothesis (H1)
          </span>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
            Ensemble Non-Linear Superiority
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Gradient Boosting and Random Forests will achieve statistically significant R² uplift over ordinary linear regression due to complex interactions between discounts and regional margins.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Evaluation Protocol
          </span>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
            Standard Naive Baseline Benchmarking
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            In accordance with IEEE/ACM guidelines, every ML model is benchmarked against a zero-parameter Historical Mean predictor (`DummyRegressor`) to guarantee genuine predictive value.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Best Candidate Model
          </span>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
            {bestModel ? bestModel.replace(/_/g, ' ').toUpperCase() : 'Awaiting Benchmark'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            Optimal balance of bias-variance trade-off on out-of-sample holdout test partition (80/20 train-test split, seed=42).
          </p>
        </div>
      </div>

      {/* Model Benchmark Comparison Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Comparative Performance Matrix: Baseline vs ML Models</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Target variable: <span className="font-semibold text-brand-600">{targetCol}</span> across 80% train / 20% test partition.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
            Metric: MAE, RMSE, R², MAPE
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Model Architecture</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">MAE (Error $)</th>
                <th className="px-4 py-3">RMSE</th>
                <th className="px-4 py-3">R² Score</th>
                <th className="px-4 py-3">MAPE (%)</th>
                <th className="px-4 py-3">Uplift vs Baseline</th>
                <th className="px-4 py-3">Evaluation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {modelComparisons.map((item, idx) => {
                const isBaseline = item.is_baseline;
                const isTop = item.model_name === bestModel || item.model_key === bestModel;
                return (
                  <tr 
                    key={idx} 
                    className={`transition-colors ${
                      isTop 
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 font-medium' 
                        : isBaseline 
                          ? 'bg-slate-50/70 dark:bg-slate-800/40 text-slate-500' 
                          : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isTop && <Award className="w-4 h-4 text-amber-500" />}
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.model_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        isBaseline 
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300' 
                          : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                      }`}>
                        {isBaseline ? 'Baseline Reference' : 'Trained Estimator'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      ${Number(item.mae).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                      {Number(item.rmse).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        item.r2 > 0.7 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                          : item.r2 > 0.3
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {Number(item.r2).toFixed(4)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                      {item.mape !== undefined ? `${Number(item.mape).toFixed(2)}%` : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold">
                      {isBaseline ? (
                        <span className="text-slate-400">0.0% (Ref)</span>
                      ) : (
                        <span className={item.improvement_over_baseline_pct >= 0 ? 'text-emerald-600' : 'text-rose-500'}>
                          {item.improvement_over_baseline_pct >= 0 ? '+' : ''}
                          {Number(item.improvement_over_baseline_pct).toFixed(1)}%
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isTop ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 text-[10px] font-bold">
                          Best Performing
                        </span>
                      ) : isBaseline ? (
                        <span className="text-[11px] text-slate-400">Reference Benchmark</span>
                      ) : (
                        <span className="text-[11px] text-slate-500">Candidate</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Cleaning & Preprocessing Uplift Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-600" />
          <span>Data Sanitization & Quality Uplift Protocol</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Documented statistical hygiene improvements achieved between raw ingestion and model consumption.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-semibold uppercase text-slate-400">Data Preservation</span>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">100% Non-Destructive</p>
            <p className="text-[11px] text-slate-500 mt-1">Original raw CSV is immutably archived; transformations execute in working memory.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-semibold uppercase text-slate-400">Audit Traceability</span>
            <p className="text-xl font-bold text-brand-600 mt-1">Granular Logging</p>
            <p className="text-[11px] text-slate-500 mt-1">Row IDs, prior values, new values, and mathematical rules stored sequentially.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-semibold uppercase text-slate-400">Missing Imputation</span>
            <p className="text-xl font-bold text-emerald-600 mt-1">Zero Data Loss</p>
            <p className="text-[11px] text-slate-500 mt-1">Statistical imputation preserves sample size and degrees of freedom for regression.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-semibold uppercase text-slate-400">Outlier Strategy</span>
            <p className="text-xl font-bold text-indigo-600 mt-1">Winsorization</p>
            <p className="text-[11px] text-slate-500 mt-1">IQR/Z-Score bounds capping mitigates leverage points without dropping extreme sales.</p>
          </div>
        </div>
      </div>

      {/* Viva Defense Examination Guide & Scientific Disclaimers */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-indigo-400">
          <HelpCircle className="w-5 h-5" />
          <h2 className="text-sm font-bold uppercase tracking-wider">
            B.Tech Final Examination & Viva Defense FAQ
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
          <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/10">
            <h4 className="font-bold text-white text-sm">
              Q1: Why did you compare against a Naive Baseline (Historical Mean)?
            </h4>
            <p className="leading-relaxed text-slate-300">
              A high R² alone does not prove intelligence. In retail data with low variance, even trivial guesses can seem acceptable. Using `DummyRegressor` establishes the empirical lower bound and proves that machine learning captures genuine explanatory signal beyond the sample mean.
            </p>
          </div>

          <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/10">
            <h4 className="font-bold text-white text-sm">
              Q2: How is MAPE calculated safely when actual values approach zero?
            </h4>
            <p className="leading-relaxed text-slate-300">
              In retail transactions, profit values can be exactly $0.00 or negative, causing standard MAPE (\(|y - \hat{y}| / |y|\)) to divide by zero and diverge to infinity. Our platform uses an epsilon-stabilized denominator (\(|y| + \epsilon\) where \(\epsilon=10^{-6}\)) with clipping to guarantee mathematical stability.
            </p>
          </div>

          <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/10">
            <h4 className="font-bold text-white text-sm">
              Q3: Do these models establish business causality?
            </h4>
            <p className="leading-relaxed text-slate-300">
              No. Our models capture conditional expectation \(E[Y | X]\) and empirical statistical correlations. As stated in our research disclaimer, feature importance does not imply causal mechanisms, preventing management from confusing association with actionable cause.
            </p>
          </div>

          <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/10">
            <h4 className="font-bold text-white text-sm">
              Q4: How did you ensure experimental reproducibility?
            </h4>
            <p className="leading-relaxed text-slate-300">
              Every experiment specifies a deterministic pseudo-random seed (`random_state=42`), stratified feature standard scaling, deterministic train/test splits (80/20), and parameter snapshotting in the research tracker.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <span>Department of Computer Science & Engineering • B.Tech Capstone Thesis</span>
          <a
            href={experimentApi.exportMarkdownUrl(selectedTarget)}
            className="text-indigo-300 hover:text-white underline font-semibold flex items-center gap-1"
          >
            <span>Download Formatted Markdown Appendix for Thesis</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Experiments;
