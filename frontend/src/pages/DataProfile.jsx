import React, { useState } from 'react';
import { 
  FileSearch, 
  Search, 
  Database, 
  Hash, 
  Tag, 
  Calendar, 
  HelpCircle,
  BarChart2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import EmptyState from '../components/EmptyState';

const DataProfile = () => {
  const { dataset } = useApp();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  if (!dataset || dataset.status !== 'ready') {
    return <EmptyState title="No Dataset Loaded" message="Please upload or load a dataset to view its profile." />;
  }

  const columns = dataset.columns || [];

  const filteredColumns = columns.filter(col => {
    const matchesSearch = col.column.toLowerCase().includes(search.toLowerCase()) || 
                          col.dtype.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filterType === "numeric") return col.mean !== undefined;
    if (filterType === "categorical") return col.mean === undefined && !col.dtype.includes('date');
    if (filterType === "missing") return col.missing_count > 0;
    return true;
  });

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Dataset Statistical Profiling
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Deep schema inspection, parametric distribution moments, unique cardinality, and null distributions.
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase">Total Instances</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
            {dataset.total_rows.toLocaleString()}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase">Total Dimensions</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
            {dataset.total_columns}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase">Numerical Attributes</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
            {dataset.numerical_columns_count}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase">Categorical Dimensions</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white mt-1 block">
            {dataset.categorical_columns_count}
          </span>
        </div>
      </div>

      {/* Profile Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search attributes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Filter:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="py-1 px-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Attributes ({columns.length})</option>
              <option value="numeric">Numerical Only</option>
              <option value="categorical">Categorical Only</option>
              <option value="missing">With Missing Values</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Attribute</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Missing</th>
                <th className="px-4 py-3">Distinct</th>
                <th className="px-4 py-3">Min</th>
                <th className="px-4 py-3">Mean</th>
                <th className="px-4 py-3">Median</th>
                <th className="px-4 py-3">Max</th>
                <th className="px-4 py-3">Std Dev</th>
                <th className="px-4 py-3">Sample Values</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
              {filteredColumns.map((col, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                    {col.column}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                      col.mean !== undefined 
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' 
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {col.dtype}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {col.missing_count > 0 ? (
                      <span className="text-rose-500 font-semibold">{col.missing_count} ({col.missing_pct}%)</span>
                    ) : (
                      <span className="text-slate-400">0 (0%)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                    {col.unique_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
                    {col.min !== undefined ? col.min.toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
                    {col.mean !== undefined ? col.mean.toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
                    {col.median !== undefined ? col.median.toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
                    {col.max !== undefined ? col.max.toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">
                    {col.std !== undefined ? col.std.toLocaleString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 truncate max-w-xs text-[11px]">
                    {col.sample_values?.slice(0, 3).join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataProfile;
