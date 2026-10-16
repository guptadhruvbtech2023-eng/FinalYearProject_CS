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
  Sparkles,
  Undo2,
  RotateCcw,
  Download,
  History,
  FileSpreadsheet,
  FileText,
  Search,
  Check,
  ShieldCheck,
  ExternalLink,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataApi } from '../services/api';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const Cleaning = () => {
  const { dataset, refreshDataset } = useApp();
  const [activeTab, setActiveTab] = useState('operations'); // 'operations' | 'audit_trail' | 'change_log' | 'exports'
  const [summary, setSummary] = useState(null);
  const [auditHistory, setAuditHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [resultMsg, setResultMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Operations state
  const [dropDuplicates, setDropDuplicates] = useState(true);
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [missingTreatments, setMissingTreatments] = useState({});
  const [outlierAction, setOutlierAction] = useState({});
  const [outlierMethod, setOutlierMethod] = useState("iqr");

  // Outlier inspection state
  const [inspectModal, setInspectModal] = useState(null);

  // Preview modal state
  const [previewModal, setPreviewModal] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Change log search state
  const [changeLogSearch, setChangeLogSearch] = useState('');
  const [selectedColFilter, setSelectedColFilter] = useState('');

  const fetchCleaningSummary = async () => {
    try {
      const res = await dataApi.getCleaningSummary();
      setSummary(res.data);
    } catch (err) {
      console.error("Cleaning summary error:", err);
    }
  };

  const fetchCleaningHistory = async () => {
    try {
      const res = await dataApi.getCleaningHistory(200);
      setAuditHistory(res.data);
    } catch (err) {
      console.error("Cleaning history error:", err);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await Promise.all([fetchCleaningSummary(), fetchCleaningHistory()]);
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dataset && dataset.status === 'ready') {
      loadAllData();
    }
  }, [dataset]);

  const handleInspectOutliers = async (col) => {
    try {
      setProcessing(true);
      const res = await dataApi.inspectOutliers(col, outlierMethod, 1.5);
      setInspectModal(res.data);
    } catch (err) {
      console.error("Inspect error:", err);
      setErrorMsg("Failed to inspect outliers for " + col);
    } finally {
      setProcessing(false);
    }
  };

  const handlePreviewCleaning = async () => {
    try {
      setPreviewLoading(true);
      setErrorMsg(null);
      const payload = {
        drop_duplicates: dropDuplicates,
        trim_whitespace: trimWhitespace,
        missing_treatment: missingTreatments,
        outlier_treatment: outlierAction,
        outlier_method: outlierMethod
      };
      const res = await dataApi.previewCleaning(payload);
      setPreviewModal(res.data);
    } catch (err) {
      console.error("Preview error:", err);
      setErrorMsg("Failed to generate cleaning preview.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleApplyCleaning = async (dropDuplicatesOnly = false) => {
    try {
      setProcessing(true);
      setResultMsg(null);
      setErrorMsg(null);

      const payload = {
        drop_duplicates: dropDuplicatesOnly ? true : dropDuplicates,
        trim_whitespace: dropDuplicatesOnly ? false : trimWhitespace,
        missing_treatment: dropDuplicatesOnly ? null : missingTreatments,
        outlier_treatment: dropDuplicatesOnly ? null : outlierAction,
        outlier_method: outlierMethod
      };

      const res = await dataApi.cleanDataset(payload);
      setResultMsg(res.data);
      setPreviewModal(null);
      await refreshDataset();
      await Promise.all([fetchCleaningSummary(), fetchCleaningHistory()]);
    } catch (err) {
      console.error("Clean error:", err);
      setErrorMsg(err.response?.data?.detail || "Error occurred while executing cleaning.");
    } finally {
      setProcessing(false);
    }
  };

  const handleUndo = async () => {
    if (!window.confirm("Undo the last cleaning transformation and restore previous dataset state?")) return;
    try {
      setProcessing(true);
      setErrorMsg(null);
      const res = await dataApi.undoCleaning();
      setResultMsg({
        initial_rows: res.data.current_rows,
        final_rows: res.data.current_rows,
        rows_removed: 0,
        actions_taken: [res.data.message]
      });
      await refreshDataset();
      await Promise.all([fetchCleaningSummary(), fetchCleaningHistory()]);
    } catch (err) {
      console.error("Undo error:", err);
      setErrorMsg(err.response?.data?.detail || "Cannot undo: No previous states available in history.");
    } finally {
      setProcessing(false);
    }
  };

  const handleResetToOriginal = async () => {
    if (!window.confirm("Reset dataset back to original uploaded state? All cleaning modifications will be reverted to the pristine raw data.")) return;
    try {
      setProcessing(true);
      setErrorMsg(null);
      const res = await dataApi.resetCleaning();
      setResultMsg({
        initial_rows: res.data.current_rows,
        final_rows: res.data.current_rows,
        rows_removed: 0,
        actions_taken: [res.data.message]
      });
      setMissingTreatments({});
      setOutlierAction({});
      await refreshDataset();
      await Promise.all([fetchCleaningSummary(), fetchCleaningHistory()]);
    } catch (err) {
      console.error("Reset error:", err);
      setErrorMsg(err.response?.data?.detail || "Failed to reset to original dataset.");
    } finally {
      setProcessing(false);
    }
  };

  if (!dataset || dataset.status !== 'ready') {
    return <EmptyState title="No Dataset Loaded" message="Please upload or load a dataset to use the Data Cleaning & Quality Pipeline." />;
  }

  if (loading && !summary) {
    return <LoadingState message="Analyzing data quality, null distributions, duplicate instances, and outliers..." />;
  }

  const historyEntries = auditHistory?.history || [];
  const cellChanges = auditHistory?.cell_changes || [];

  // Filter change log
  const filteredChanges = cellChanges.filter(item => {
    const matchesSearch = !changeLogSearch || 
      String(item.row_index).includes(changeLogSearch) ||
      String(item.column).toLowerCase().includes(changeLogSearch.toLowerCase()) ||
      String(item.original_value).toLowerCase().includes(changeLogSearch.toLowerCase()) ||
      String(item.cleaned_value).toLowerCase().includes(changeLogSearch.toLowerCase()) ||
      String(item.transformation_rule).toLowerCase().includes(changeLogSearch.toLowerCase());
    const matchesCol = !selectedColFilter || item.column === selectedColFilter;
    return matchesSearch && matchesCol;
  });

  const uniqueChangedColumns = Array.from(new Set(cellChanges.map(c => c.column)));

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Header and Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300 text-[10px] font-bold uppercase tracking-wider">
              Quality Assurance & Reproducibility
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 text-[10px] font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Original Dataset Protected
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Data Quality & Cleaning Pipeline
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Clean missing values, duplicates, whitespace, and outliers with persistent audit logging, cell-level before/after verification, and multi-format exports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Undo Button */}
          <button
            onClick={handleUndo}
            disabled={processing || !auditHistory?.can_undo}
            title={auditHistory?.can_undo ? "Revert to previous dataset snapshot" : "No previous snapshots available to undo"}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Undo2 className="w-3.5 h-3.5 text-amber-500" />
            <span>Undo Last Action</span>
          </button>

          {/* Reset to Original Button */}
          <button
            onClick={handleResetToOriginal}
            disabled={processing}
            title="Restore the raw, pristine uploaded dataset"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 hover:bg-rose-100/70 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-colors disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
            <span>Reset to Original</span>
          </button>

          {/* Preview Button */}
          <button
            onClick={handlePreviewCleaning}
            disabled={processing || previewLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
          >
            <Eye className="w-3.5 h-3.5 text-brand-500" />
            <span>{previewLoading ? "Simulating..." : "Preview Cleaning"}</span>
          </button>

          {/* Execute Cleaning Button */}
          <button
            onClick={() => handleApplyCleaning(false)}
            disabled={processing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            <Wrench className="w-4 h-4" />
            <span>{processing ? "Applying Pipeline..." : "Execute Cleaning Actions"}</span>
          </button>
        </div>
      </div>

      {/* Dataset Version & Status Badge Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Current Records</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            {dataset.rows?.toLocaleString() || summary?.total_rows?.toLocaleString() || 0}
          </p>
          <span className="text-[10px] text-slate-500">Across {dataset.columns?.length || 0} columns</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Duplicate Rows</span>
          <p className={`text-lg font-bold mt-0.5 ${summary?.total_duplicates > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {summary?.total_duplicates || 0}
          </p>
          <span className="text-[10px] text-slate-500">{summary?.total_duplicates > 0 ? 'Pending removal' : 'Clean & distinct'}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Missing Values</span>
          <p className={`text-lg font-bold mt-0.5 ${summary?.missing_columns?.length > 0 ? 'text-amber-500' : 'text-emerald-600'}`}>
            {summary?.missing_columns?.length || 0} cols
          </p>
          <span className="text-[10px] text-slate-500">{summary?.missing_columns?.length > 0 ? 'Requires imputation' : 'Complete data'}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Audit History</span>
          <p className="text-lg font-bold text-brand-600 dark:text-brand-400 mt-0.5">
            {historyEntries.length} ops ({cellChanges.length} cells)
          </p>
          <span className="text-[10px] text-slate-500">Snapshots active: {auditHistory?.snapshots_count || 0}</span>
        </div>
      </div>

      {/* Notifications */}
      {resultMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs">
          <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-200 mb-1">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Cleaning Operation Completed Successfully!</span>
          </div>
          <p className="text-emerald-700 dark:text-emerald-300">
            Initial Rows: {resultMsg.initial_rows?.toLocaleString()} → Final Rows: {resultMsg.final_rows?.toLocaleString()} ({resultMsg.rows_removed} removed).
          </p>
          <ul className="mt-2 space-y-1 list-disc list-inside text-emerald-600 dark:text-emerald-400">
            {resultMsg.actions_taken?.map((act, i) => (
              <li key={i}>{act}</li>
            ))}
          </ul>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs">
          <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-200 mb-1">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Operation Notice</span>
          </div>
          <p className="text-rose-700 dark:text-rose-300">{errorMsg}</p>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-1">
        <button
          onClick={() => setActiveTab('operations')}
          className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'operations'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Cleaning Operations</span>
        </button>

        <button
          onClick={() => setActiveTab('audit_trail')}
          className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'audit_trail'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Trail ({historyEntries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('change_log')}
          className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'change_log'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Before & After Log ({cellChanges.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('exports')}
          className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'exports'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Export Cleaned Data</span>
          <span className="px-1.5 py-0.2 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-[9px] font-bold">
            4 Formats
          </span>
        </button>
      </div>

      {/* TAB 1: OPERATIONS */}
      {activeTab === 'operations' && (
        <div className="space-y-6">
          {/* Quick Preprocessing Options */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-500" />
              <span>Standard Data Sanitization</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Automated hygiene rules applied prior to statistical treatments.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trimWhitespace}
                  onChange={(e) => setTrimWhitespace(e.target.checked)}
                  className="mt-0.5 rounded text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    Trim Whitespace & Clean Inconsistent Casing
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Removes leading/trailing spaces and converts empty strings to standard nulls for consistent joins.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dropDuplicates}
                  onChange={(e) => setDropDuplicates(e.target.checked)}
                  className="mt-0.5 rounded text-brand-600 focus:ring-brand-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    Deduplicate Identical Rows
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Purges fully identical records across all columns ({summary?.total_duplicates || 0} currently identified).
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Duplicate Row Detection */}
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
                <span>Remove Duplicates Now</span>
              </button>
            </div>
          </div>

          {/* Missing Value Imputation Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Missing Value Imputation & Treatment
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Select statistical strategies for incomplete attributes (Mean/Median for continuous, Mode for categorical).
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

          {/* Statistical Outlier Detection Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Statistical Outlier Detection (IQR & Z-Score)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Values beyond statistical bounds. Inspect before capping (Winsorization) or removing to preserve genuine high-ticket orders.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Method:</span>
                <select
                  value={outlierMethod}
                  onChange={(e) => setOutlierMethod(e.target.value)}
                  className="py-1 px-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="iqr">IQR (1.5 × IQR Rule)</option>
                  <option value="zscore">Z-Score (|z| &gt; 3.0 Rule)</option>
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
        </div>
      )}

      {/* TAB 2: AUDIT TRAIL */}
      {activeTab === 'audit_trail' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-brand-500" />
                <span>Persistent Data Cleaning Audit Trail</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Every transformation is sequentially recorded with timestamp, applied parameters, and affected dimensions.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
              {historyEntries.length} Operations Logged
            </span>
          </div>

          {historyEntries.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No cleaning operations have been performed yet. Apply duplicate removal or missing value imputation to begin recording the audit trail.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-3.5 py-2.5">Step #</th>
                    <th className="px-3.5 py-2.5">Timestamp</th>
                    <th className="px-3.5 py-2.5">Operation</th>
                    <th className="px-3.5 py-2.5">Parameters / Strategy</th>
                    <th className="px-3.5 py-2.5">Rows Affected</th>
                    <th className="px-3.5 py-2.5">Columns Affected</th>
                    <th className="px-3.5 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {historyEntries.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-3.5 py-2.5 font-mono text-[11px] font-bold text-slate-400">
                        #{entry.step_index || idx + 1}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-3.5 py-2.5 font-semibold text-slate-900 dark:text-white capitalize">
                        {entry.operation_type?.replace(/_/g, ' ') || 'Cleaning Step'}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={JSON.stringify(entry.parameters || {})}>
                        {entry.parameters ? Object.entries(entry.parameters).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(', ') : 'Default'}
                      </td>
                      <td className="px-3.5 py-2.5 font-bold text-brand-600 dark:text-brand-400">
                        {entry.affected_rows_count !== undefined ? entry.affected_rows_count : '—'}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-500">
                        {Array.isArray(entry.affected_columns) ? entry.affected_columns.join(', ') || 'All' : entry.affected_columns || 'All'}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1 w-fit">
                          <Check className="w-2.5 h-2.5" />
                          <span>{entry.status || 'Success'}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GRANULAR CHANGE LOG */}
      {activeTab === 'change_log' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-500" />
                <span>Cell-Level Before-and-After Change Log</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Exact tracking of every modified value, original state, new value, and transformation rule.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
              {filteredChanges.length} of {cellChanges.length} Cells Shown
            </span>
          </div>

          {/* Search and Column Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by row ID, value, rule, or column..."
                value={changeLogSearch}
                onChange={(e) => setChangeLogSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>
            {uniqueChangedColumns.length > 0 && (
              <select
                value={selectedColFilter}
                onChange={(e) => setSelectedColFilter(e.target.value)}
                className="w-full sm:w-48 py-1.5 px-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="">All Columns ({uniqueChangedColumns.length})</option>
                {uniqueChangedColumns.map((col, idx) => (
                  <option key={idx} value={col}>{col}</option>
                ))}
              </select>
            )}
          </div>

          {cellChanges.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No cell-level modifications recorded yet. Any missing value imputations, whitespace trims, or outlier caps will be logged here.
            </div>
          ) : filteredChanges.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No cell changes match the current filter or search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                  <tr>
                    <th className="px-3.5 py-2.5">Row Index</th>
                    <th className="px-3.5 py-2.5">Column Name</th>
                    <th className="px-3.5 py-2.5">Original Value (Before)</th>
                    <th className="px-3.5 py-2.5">Cleaned Value (After)</th>
                    <th className="px-3.5 py-2.5">Transformation Rule</th>
                    <th className="px-3.5 py-2.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredChanges.slice(0, 150).map((change, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-3.5 py-2 font-mono text-[11px] font-bold text-slate-500">
                        Row #{change.row_index !== undefined ? change.row_index : idx}
                      </td>
                      <td className="px-3.5 py-2 font-medium text-slate-900 dark:text-white">
                        {change.column}
                      </td>
                      <td className="px-3.5 py-2">
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-mono text-[11px]">
                          {change.original_value === null || change.original_value === undefined ? '<NULL>' : String(change.original_value)}
                        </span>
                      </td>
                      <td className="px-3.5 py-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-mono text-[11px]">
                          {change.cleaned_value === null || change.cleaned_value === undefined ? '<NULL>' : String(change.cleaned_value)}
                        </span>
                      </td>
                      <td className="px-3.5 py-2 text-slate-600 dark:text-slate-400 font-medium">
                        {change.transformation_rule || 'Cleaned'}
                      </td>
                      <td className="px-3.5 py-2 text-slate-400 text-[10px] whitespace-nowrap">
                        {change.timestamp ? new Date(change.timestamp).toLocaleTimeString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EXPORT CLEANED DATA */}
      {activeTab === 'exports' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-brand-500" />
              <span>Multi-Format Research & Production Exports</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Download your cleaned dataset and complete quality audit documentation in multiple standardized formats.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {/* Card 1: Cleaned CSV */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 bg-slate-50/50 dark:bg-slate-800/30 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 text-[10px] font-bold uppercase tracking-wider">
                      Format: CSV
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">RFC 4180</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Cleaned Dataset (CSV)</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Standard comma-separated format with UTF-8 BOM encoding for seamless instant loading in Microsoft Excel, Python, R, SPSS, and Stata.
                  </p>
                  <ul className="mt-3 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{dataset.rows?.toLocaleString() || 0} cleaned rows ready for model training</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Original raw file remains untouched in storage</span>
                    </li>
                  </ul>
                </div>

                <a
                  href={dataApi.exportCsvUrl}
                  download="cleaned_dataset.csv"
                  className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold transition-all shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Cleaned CSV</span>
                </a>
              </div>

              {/* Card 2: 4-Sheet Excel */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 bg-slate-50/50 dark:bg-slate-800/30 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                      Format: XLSX (4 Sheets)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">OpenPyXL</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Research Excel Dossier (.xlsx)</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Multi-tab workbook containing Cleaned Data, Cleaning Summary, Granular Change Log, and Data Quality Metrics with styled headers.
                  </p>
                  <ul className="mt-3 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Sheet 1: Cleaned Data ({dataset.rows?.toLocaleString() || 0} rows)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Sheet 2: Transformation Summary & Metadata</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Sheet 3: Cell Modifications Audit Log</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Sheet 4: Column Profiling & Missing Stats</span>
                    </li>
                  </ul>
                </div>

                <a
                  href={dataApi.exportExcelUrl}
                  download="cleaned_dataset.xlsx"
                  className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-xs"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Download 4-Sheet Excel (.xlsx)</span>
                </a>
              </div>

              {/* Card 3: Paginated PDF Table */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 bg-slate-50/50 dark:bg-slate-800/30 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                      Format: PDF Document
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">ReportLab Landscape</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Cleaned Dataset PDF</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Landscape paginated PDF representation of the cleaned data sample with alternating table row colors, headers, and page numbering.
                  </p>
                  <ul className="mt-3 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>A4 Landscape orientation with high-clarity typography</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Page numbers and generation metadata included</span>
                    </li>
                  </ul>
                </div>

                <a
                  href={dataApi.exportCleanedPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-all shadow-xs"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download Cleaned Dataset PDF</span>
                </a>
              </div>

              {/* Card 4: Cleaning Audit Report PDF */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 bg-slate-50/50 dark:bg-slate-800/30 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-[10px] font-bold uppercase tracking-wider">
                      Format: Executive PDF
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Audit Dossier</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Data Cleaning Audit Report (PDF)</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Formal audit dossier documenting before/after data quality metrics, missing value treatments, outlier boundaries, and chronological changes.
                  </p>
                  <ul className="mt-3 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Ideal for B.Tech thesis appendix and viva examination</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Chronological operation table and quality score uplift</span>
                    </li>
                  </ul>
                </div>

                <a
                  href={dataApi.exportCleaningReportPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-all shadow-xs"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download Cleaning Audit Report PDF</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW CLEANING MODAL */}
      {previewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Dry-Run Cleaning Preview
                </h3>
              </div>
              <button
                onClick={() => setPreviewModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block uppercase">Current Rows</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">{previewModal.initial_rows}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block uppercase">Estimated Final Rows</span>
                  <span className="text-base font-bold text-emerald-600">{previewModal.estimated_final_rows}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block uppercase">Rows to Remove</span>
                  <span className="text-base font-bold text-rose-500">{previewModal.estimated_rows_removed}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Planned Cleaning Actions:
                </h4>
                <ul className="space-y-1 list-disc list-inside text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                  {previewModal.planned_actions?.map((act, idx) => (
                    <li key={idx}>{act}</li>
                  ))}
                </ul>
              </div>

              {previewModal.preview_cell_changes?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Sample Cell Modifications ({previewModal.preview_cell_changes.length} simulated):
                  </h4>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 sticky top-0">
                        <tr>
                          <th className="px-3 py-1.5">Col</th>
                          <th className="px-3 py-1.5">Original</th>
                          <th className="px-3 py-1.5">Cleaned</th>
                          <th className="px-3 py-1.5">Rule</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {previewModal.preview_cell_changes.slice(0, 10).map((ch, i) => (
                          <tr key={i}>
                            <td className="px-3 py-1.5 font-medium">{ch.column}</td>
                            <td className="px-3 py-1.5 text-rose-500">{ch.original_value || '<NULL>'}</td>
                            <td className="px-3 py-1.5 text-emerald-500">{ch.cleaned_value}</td>
                            <td className="px-3 py-1.5 text-slate-400">{ch.transformation_rule}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setPreviewModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Close Preview
              </button>
              <button
                onClick={() => handleApplyCleaning(false)}
                disabled={processing}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-xs font-semibold text-white shadow-xs"
              >
                Confirm & Execute Cleaning
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OUTLIER INSPECTION MODAL */}
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
