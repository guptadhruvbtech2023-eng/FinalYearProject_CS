import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Filter, 
  SlidersHorizontal,
  ArrowRight,
  Eye,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataApi } from '../services/api';
import DataTable from '../components/DataTable';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const Cleaning = () => {
  const { dataset, refreshDataset } = useApp();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [resultMsg, setResultMsg] = useState(null);

  // Missing treatments selection { colName: "mean" | "median" | "mode" | "drop" | "ffill" }
  const [missingTreatments, setMissingTreatments] = useState({});

  // Outlier inspection state
  const [inspectModal, setInspectModal] = useState(null);
  const [outlierAction, setOutlierAction] = useState({}); // { colName: "cap" | "remove" }
  const [outlierMethod, setOutlierMethod] = useState("iqr");

  const fetchCleaningSummary = async () => {
    try {
      setLoading(true);
      const res = await dataApi.getCleaningSummary();
      setSummary(res.data);
    } catch (err) {
      console.error("Cleaning summary error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dataset && dataset.status === 'ready') {
      fetchCleaningSummary();
    }
  }, [dataset]);

  const handleInspectOutliers = async (col) => {
    try {
      setProcessing(true);
      const res = await dataApi.inspectOutliers(col, outlierMethod, 1.5);
      setInspectModal(res.data);
    } catch (err) {
      console.error("Inspect error:", err);
    } finally {
      setProcessing(false);
    }
  };

  const handleApplyCleaning = async (dropDuplicatesOnly = false) => {
    try {
      setProcessing(true);
      setResultMsg(null);

      const payload = {
        drop_duplicates: dropDuplicatesOnly || (summary?.total_duplicates > 0),
        missing_treatment: dropDuplicatesOnly ? null : missingTreatments,
        outlier_treatment: dropDuplicatesOnly ? null : outlierAction,
        outlier_method: outlierMethod
      };

      const res = await dataApi.cleanDataset(payload);
      setResultMsg(res.data);
      await refreshDataset();
      await fetchCleaningSummary();
    } catch (err) {
      console.error("Clean error:", err);
    } finally {
      setProcessing(false);
    }
  };

  if (!dataset || dataset.status !== 'ready') {
    return <EmptyState title="No Dataset" message="Please upload or load a dataset to use the Data Cleaning module." />;
  }

  if (loading && !summary) {
    return <LoadingState message="Analyzing data quality, nulls, duplicates, and outliers..." />;
  }

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Data Quality & Cleaning Pipeline
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Interactive treatment of missing values, duplicate records, data types, and statistical outliers.
          </p>
        </div>

        <button
          onClick={() => handleApplyCleaning(false)}
          disabled={processing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
        >
          <Wrench className="w-4 h-4" />
          <span>{processing ? "Applying Pipeline..." : "Execute Cleaning Actions"}</span>
        </button>
      </div>

      {/* Result Notification */}
      {resultMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs">
          <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-200 mb-1">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Cleaning Applied Successfully!</span>
          </div>
          <p className="text-emerald-700 dark:text-emerald-300">
            Initial Rows: {resultMsg.initial_rows.toLocaleString()} → Final Rows: {resultMsg.final_rows.toLocaleString()} ({resultMsg.rows_removed} removed).
          </p>
          <ul className="mt-2 space-y-1 list-disc list-inside text-emerald-600 dark:text-emerald-400">
            {resultMsg.actions_taken?.map((act, i) => (
              <li key={i}>{act}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 1. Duplicate Records Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Duplicate Row Detection</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                summary?.total_duplicates > 0 
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' 
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}>
                {summary?.total_duplicates} Duplicates
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Identifies identical rows across all attribute dimensions.
            </p>
          </div>

          <button
            onClick={() => handleApplyCleaning(true)}
            disabled={processing || summary?.total_duplicates === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Remove Duplicates</span>
          </button>
        </div>
      </div>

      {/* 2. Missing Value Imputation Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Missing Value Imputation & Treatment
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select statistical strategies for incomplete attributes.
          </p>
        </div>

        {summary?.missing_columns?.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center text-xs text-slate-500">
            <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <span>Zero missing values detected across all columns. The dataset is fully complete!</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">Column</th>
                  <th className="px-4 py-2.5">Missing Count</th>
                  <th className="px-4 py-2.5">Missing %</th>
                  <th className="px-4 py-2.5">Suggested Treatment</th>
                  <th className="px-4 py-2.5">Select Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {summary?.missing_columns?.map((m, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">{m.column}</td>
                    <td className="px-4 py-2.5 text-rose-500 font-semibold">{m.missing_count}</td>
                    <td className="px-4 py-2.5">{m.missing_percentage}%</td>
                    <td className="px-4 py-2.5 text-slate-500">{m.suggested_treatment}</td>
                    <td className="px-4 py-2.5">
                      <select
                        value={missingTreatments[m.column] || ""}
                        onChange={(e) => setMissingTreatments(prev => ({ ...prev, [m.column]: e.target.value }))}
                        className="py-1 px-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      >
                        <option value="">No action</option>
                        <option value="mean">Fill with Mean</option>
                        <option value="median">Fill with Median</option>
                        <option value="mode">Fill with Mode</option>
                        <option value="ffill">Forward Fill</option>
                        <option value="drop">Remove Rows</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Statistical Outlier Detection Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Statistical Outlier Detection (IQR & Z-Score)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Identifies values beyond statistical thresholds. Inspect before capping or removing to prevent deleting valid high-ticket orders.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Method:</span>
            <select
              value={outlierMethod}
              onChange={(e) => setOutlierMethod(e.target.value)}
              className="py-1 px-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="iqr">IQR (1.5 × IQR)</option>
              <option value="zscore">Z-Score (|z| &gt; 3.0)</option>
            </select>
          </div>
        </div>

        {summary?.outlier_summary?.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center text-xs text-slate-500">
            No extreme numerical outliers found with the selected method.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">Attribute</th>
                  <th className="px-4 py-2.5">Outlier Count</th>
                  <th className="px-4 py-2.5">Outlier %</th>
                  <th className="px-4 py-2.5">Normal Bounds</th>
                  <th className="px-4 py-2.5">Inspect</th>
                  <th className="px-4 py-2.5">Treatment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {summary?.outlier_summary?.map((out, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">{out.column}</td>
                    <td className="px-4 py-2.5 font-semibold text-amber-500">
                      {outlierMethod === 'iqr' ? out.iqr_count : out.zscore_count}
                    </td>
                    <td className="px-4 py-2.5">
                      {outlierMethod === 'iqr' ? out.iqr_percentage : out.zscore_percentage}%
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">
                      [{out.iqr_lower}, {out.iqr_upper}]
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => handleInspectOutliers(out.column)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={outlierAction[out.column] || ""}
                        onChange={(e) => setOutlierAction(prev => ({ ...prev, [out.column]: e.target.value }))}
                        className="py-1 px-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                      >
                        <option value="">Keep Original (Recommended)</option>
                        <option value="cap">Cap to Bounds (Winsorize)</option>
                        <option value="remove">Remove Outlier Rows</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Outlier Inspection Modal */}
      {inspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Inspecting Outliers for: <span className="text-brand-600">{inspectModal.column}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Identified {inspectModal.outlier_count} outliers ({inspectModal.outlier_percentage}% of data). Expected range: [{inspectModal.lower_bound}, {inspectModal.upper_bound}].
                </p>
              </div>
              <button
                onClick={() => setInspectModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Sample Outlier Observations
              </h4>
              <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Outlier Value</th>
                      <th className="px-3 py-2">Deviation</th>
                      <th className="px-3 py-2">Context</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {inspectModal.sample_records?.slice(0, 15).map((rec, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="px-3 py-2 font-bold text-rose-600">{rec[inspectModal.column]}</td>
                        <td className="px-3 py-2 text-slate-500">
                          {rec[inspectModal.column] > inspectModal.upper_bound ? "Above upper bound" : "Below lower bound"}
                        </td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400 truncate max-w-xs">
                          {rec['Product.Name'] || rec['Product Name'] || rec['Category'] || 'Observation'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setInspectModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cleaning;
