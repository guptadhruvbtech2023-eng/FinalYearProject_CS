import React, { useState, useEffect } from 'react';
import { 
  GitGraph, 
  BarChart2, 
  ScatterChart as ScatterIcon, 
  SlidersHorizontal,
  Info 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { useApp } from '../context/AppContext';
import { analyticsApi } from '../services/api';
import ChartCard from '../components/ChartCard';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const EDA = () => {
  const { dataset, darkMode } = useApp();
  const [xCol, setXCol] = useState("");
  const [yCol, setYCol] = useState("");
  const [chartType, setChartType] = useState("histogram");
  const [edaData, setEdaData] = useState(null);
  const [loading, setLoading] = useState(false);

  const displayCols = dataset?.columns?.map(c => c.column) || [];
  const numCols = dataset?.columns?.filter(c => c.mean !== undefined).map(c => c.column) || [];

  // Set initial default columns
  useEffect(() => {
    if (numCols.length > 0 && !xCol) {
      setXCol(numCols[0]);
      if (numCols.length > 1) {
        setYCol(numCols[1]);
      }
    }
  }, [dataset]);

  useEffect(() => {
    if (!xCol) return;

    const fetchEDA = async () => {
      try {
        setLoading(true);
        const res = await analyticsApi.getEDA(xCol, yCol || null, chartType);
        setEdaData(res.data);
      } catch (err) {
        console.error("EDA error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEDA();
  }, [xCol, yCol, chartType]);

  if (!dataset || dataset.status !== 'ready') {
    return <EmptyState title="No Dataset" message="Please upload or load a dataset to use Exploratory Data Analysis." />;
  }

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Exploratory Data Analysis (EDA)
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Interactive univariate frequency distributions, parametric box plot summaries, and bivariate scatter plots.
        </p>
      </div>

      {/* Axis & Chart Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          <SlidersHorizontal className="w-4 h-4 text-brand-600" />
          <span>EDA Visualization Controls</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Chart Type */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Visualization Type</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="histogram">Univariate Histogram</option>
              <option value="boxplot">Box Plot Five-Number Summary</option>
              <option value="scatter">Bivariate Scatter Plot</option>
              <option value="bar">Categorical Bar Aggregation</option>
            </select>
          </div>

          {/* X Axis */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">X-Axis Variable</label>
            <select
              value={xCol}
              onChange={(e) => setXCol(e.target.value)}
              className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              {(chartType === 'histogram' || chartType === 'boxplot' || chartType === 'scatter' ? numCols : displayCols).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Y Axis (for bivariate) */}
          {(chartType === 'scatter' || chartType === 'bar') && (
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Y-Axis Variable</label>
              <select
                value={yCol}
                onChange={(e) => setYCol(e.target.value)}
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="">Select Y Variable</option>
                {numCols.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingState message="Generating distribution curves and plotting coordinates..." />
      ) : (
        <div className="space-y-6">
          {/* Main Visualizer */}
          <ChartCard
            title={`${chartType.toUpperCase()} Visualizer: ${xCol} ${yCol ? `vs ${yCol}` : ''}`}
            subtitle="Custom dynamic exploratory plotting"
          >
            {/* 1. Histogram */}
            {chartType === 'histogram' && edaData?.distribution && (
              <div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={edaData.distribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#e2e8f0"} />
                      <XAxis dataKey="range" stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={10} angle={-25} textAnchor="end" height={50} />
                      <YAxis stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                          borderColor: darkMode ? '#334155' : '#e2e8f0',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="count" name="Frequency" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {edaData.stats && (
                  <div className="mt-4 grid grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Mean</span>
                      <strong className="text-sm text-slate-800 dark:text-slate-200">{edaData.stats.mean}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Median</span>
                      <strong className="text-sm text-slate-800 dark:text-slate-200">{edaData.stats.median}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Std Dev</span>
                      <strong className="text-sm text-slate-800 dark:text-slate-200">{edaData.stats.std}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Skewness</span>
                      <strong className="text-sm text-slate-800 dark:text-slate-200">{edaData.stats.skew}</strong>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. Box Plot Summary */}
            {chartType === 'boxplot' && edaData?.boxplot_stats && (
              <div className="p-6 text-center">
                <div className="max-w-md mx-auto p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Five-Number Summary for {xCol}
                  </h4>
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="block text-[10px] text-slate-400">Min</span>
                      <strong className="font-mono">{edaData.boxplot_stats.min}</strong>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="block text-[10px] text-slate-400">Q1 (25%)</span>
                      <strong className="font-mono">{edaData.boxplot_stats.q1}</strong>
                    </div>
                    <div className="p-2 rounded bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-600">
                      <span className="block text-[10px] text-brand-500">Median</span>
                      <strong className="font-mono">{edaData.boxplot_stats.median}</strong>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="block text-[10px] text-slate-400">Q3 (75%)</span>
                      <strong className="font-mono">{edaData.boxplot_stats.q3}</strong>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="block text-[10px] text-slate-400">Max</span>
                      <strong className="font-mono">{edaData.boxplot_stats.max}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Scatter Plot */}
            {chartType === 'scatter' && edaData?.points && (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#e2e8f0"} />
                    <XAxis type="number" dataKey="x" name={xCol} stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} />
                    <YAxis type="number" dataKey="y" name={yCol} stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                        borderColor: darkMode ? '#334155' : '#e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Scatter name={`${xCol} vs ${yCol}`} data={edaData.points} fill="#6366f1" opacity={0.6} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* 4. Categorical Bar */}
            {chartType === 'bar' && edaData?.bar_data && (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={edaData.bar_data}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#e2e8f0"} />
                    <XAxis dataKey="category" stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={10} angle={-25} textAnchor="end" height={60} />
                    <YAxis stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                        borderColor: darkMode ? '#334155' : '#e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="value" name={yCol || "Count"} fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </div>
      )}
    </div>
  );
};

export default EDA;
