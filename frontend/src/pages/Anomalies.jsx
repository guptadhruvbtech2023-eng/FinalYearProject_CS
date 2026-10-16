import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, SlidersHorizontal, Eye, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { anomalyApi } from '../services/api';
import DataTable from '../components/DataTable';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const Anomalies = () => {
  const { dataset } = useApp();
  const [data, setData] = useState(null);
  const [method, setMethod] = useState("isolation_forest");
  const [contamination, setContamination] = useState(0.02);
  const [loading, setLoading] = useState(true);

  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      const res = await anomalyApi.detect(method, contamination);
      setData(res.data);
    } catch (err) {
      console.error("Anomaly fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dataset && dataset.status === 'ready') {
      fetchAnomalies();
    }
  }, [dataset, method, contamination]);

  if (!dataset || dataset.status !== 'ready') {
    return <EmptyState title="No Dataset" message="Please upload or load a dataset to run anomaly detection." />;
  }

  const columns = [
    { header: "Order Date", accessor: "date" },
    { header: "Region", accessor: "region" },
    { header: "Product Description", accessor: "product" },
    { 
      header: "Anomalous Metric", 
      accessor: "metric",
      render: (val) => <span className="font-semibold text-brand-600 dark:text-brand-400">{val}</span>
    },
    { 
      header: "Observed Value", 
      accessor: "value",
      render: (val) => <span className="font-mono font-bold">{val?.toLocaleString()}</span>
    },
    { 
      header: "Expected Range", 
      accessor: "expected_range",
      render: (val) => <span className="font-mono text-slate-500 text-[11px]">{val}</span>
    },
    { 
      header: "Severity", 
      accessor: "severity",
      render: (val) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          val === 'Critical' 
            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300' 
            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
        }`}>
          {val}
        </span>
      )
    },
    { 
      header: "Anomaly Score", 
      accessor: "anomaly_score",
      render: (val) => <span className="font-mono text-xs text-slate-500">{val}</span>
    }
  ];

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Unsupervised Anomaly & Outlier Detection
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Detect fraudulent transactions, operational misconfigurations, and severe margin outliers using Isolation Forest and Statistical Bounds.
        </p>
      </div>

      {/* Method & Parameter Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Algorithm</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="isolation_forest">Isolation Forest (Multidimensional Ensembles)</option>
              <option value="iqr">Interquartile Range (IQR 1.5x)</option>
              <option value="zscore">Z-Score Standard Normal (|z| &gt; 3.0)</option>
            </select>
          </div>

          {method === 'isolation_forest' && (
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Contamination Rate: {(contamination * 100).toFixed(1)}%
              </label>
              <input
                type="range"
                min="0.005"
                max="0.05"
                step="0.005"
                value={contamination}
                onChange={(e) => setContamination(parseFloat(e.target.value))}
                className="w-36 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer accent-brand-600"
              />
            </div>
          )}
        </div>

        <button
          onClick={fetchAnomalies}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Rerun Detection</span>
        </button>
      </div>

      {loading ? (
        <LoadingState message="Fitting Isolation Forest trees and identifying anomalous feature deviations..." />
      ) : (
        <div className="space-y-6">
          {/* Summary Alert */}
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              <div>
                <strong>{data?.total_anomalies_detected || 0} Anomalous Records Flagged</strong> using {method === 'isolation_forest' ? 'Multivariate Isolation Forest' : method.toUpperCase()}.
              </div>
            </div>
          </div>

          {/* Anomaly Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Identified Anomalous Transactions
            </h3>
            <DataTable
              columns={columns}
              data={data?.anomalies || []}
              searchKey="product"
              pageSize={10}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Anomalies;
