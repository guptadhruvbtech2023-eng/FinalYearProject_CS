import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Database,
  Hash,
  Copy,
  Calendar,
  Layers,
  Wrench,
  FileSearch
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataApi } from '../services/api';
import DataTable from '../components/DataTable';
import LoadingState from '../components/LoadingState';

const Upload = () => {
  const { dataset, setDataset, refreshDataset } = useApp();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadError("Invalid file type. Please upload a standard comma-separated .csv file.");
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(null);

      const formData = new FormData();
      formData.append('file', file);

      const res = await dataApi.uploadDataset(formData);
      setDataset(res.data);
      setUploadSuccess(`Successfully validated and profiled ${file.name}!`);
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError(err.response?.data?.detail || "Failed to upload and validate CSV dataset.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const previewColumns = dataset?.columns?.slice(0, 10).map(c => ({
    header: c.column,
    accessor: c.column
  })) || [];

  return (
    <div className="space-y-8 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Dataset Ingestion & Validation
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Upload any business or retail CSV dataset. The engine automatically inspects schema, types, nulls, and duplicates.
        </p>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-10 text-center transition-all bg-white dark:bg-slate-900 ${
          dragActive 
            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 scale-[1.01]' 
            : 'border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Drag & Drop your CSV file here
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Supports superstore.csv or any standard tabular CSV (up to 100MB)
            </p>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            {uploading ? "Uploading & Profiling..." : "Choose CSV File"}
          </button>
        </div>
      </div>

      {/* Uploading indicator */}
      {uploading && (
        <LoadingState message="Validating schema, calculating distributions, and detecting duplicates..." />
      )}

      {/* Success Notification */}
      {uploadSuccess && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div className="flex-1">{uploadSuccess}</div>
          <div className="flex items-center gap-2">
            <Link
              to="/cleaning"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
            >
              Go to Data Cleaning
            </Link>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {uploadError && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-medium">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Current Dataset Overview */}
      {dataset && dataset.status === 'ready' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-brand-600" />
              <span>Active Dataset Profile Overview</span>
            </h2>
            <div className="flex items-center gap-3">
              <Link
                to="/cleaning"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Clean Dataset</span>
              </Link>
              <Link
                to="/profile"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 text-brand-700 dark:text-brand-300 text-xs font-semibold border border-brand-200 dark:border-brand-800 transition-colors"
              >
                <FileSearch className="w-3.5 h-3.5" />
                <span>Full Schema Profile</span>
              </Link>
            </div>
          </div>

          {/* Metrics Grid matching Prompt Spec */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Total Rows</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
                {dataset.total_rows.toLocaleString()}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Total Columns</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
                {dataset.total_columns}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Numerical Cols</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
                {dataset.numerical_columns_count}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Categorical Cols</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
                {dataset.categorical_columns_count}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Missing Values</span>
              <span className={`text-xl font-bold mt-1 block ${dataset.total_missing_values > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {dataset.total_missing_values.toLocaleString()}
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Duplicate Rows</span>
              <span className={`text-xl font-bold mt-1 block ${dataset.duplicate_rows > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {dataset.duplicate_rows.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Dataset Preview */}
          {dataset.preview && dataset.preview.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Dataset Raw Sample Preview (First 25 Rows)
                </h3>
                <span className="text-xs text-slate-400">
                  Showing first 10 attributes
                </span>
              </div>
              <DataTable
                columns={previewColumns}
                data={dataset.preview}
                pageSize={5}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Upload;
