import React, { useState, useEffect } from 'react';
import { MapPin, TrendingUp, DollarSign, Award, Layers } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { useApp } from '../context/AppContext';
import { analyticsApi } from '../services/api';
import FilterBar from '../components/FilterBar';
import ChartCard from '../components/ChartCard';
import KPICard from '../components/KPICard';
import DataTable from '../components/DataTable';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const Regions = () => {
  const { dataset, filters, darkMode } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dataset || dataset.status !== 'ready') return;

    const fetchRegions = async () => {
      try {
        setLoading(true);
        const res = await analyticsApi.getRegions(filters);
        setData(res.data);
      } catch (err) {
        console.error("Regions error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRegions();
  }, [dataset, filters]);

  if (!dataset || dataset.status !== 'ready') {
    return <EmptyState title="No Dataset" message="Please upload or load a dataset to view regional analytics." />;
  }

  const fmtCurrency = (val) => {
    if (val === undefined || val === null) return "$0";
    if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
    return `$${Number(val).toFixed(2)}`;
  };

  const stateColumns = [
    { header: "State / Province", accessor: "state" },
    { 
      header: "Sales", 
      accessor: "sales", 
      render: (val) => <span className="font-mono font-medium">{fmtCurrency(val)}</span> 
    },
    { 
      header: "Profit", 
      accessor: "profit", 
      render: (val) => (
        <span className={`font-mono font-semibold ${val >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {fmtCurrency(val)}
        </span>
      ) 
    },
    { 
      header: "Profit Margin", 
      accessor: "margin_pct", 
      render: (val) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          val >= 10 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
        }`}>
          {val}%
        </span>
      ) 
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Geographic & Regional Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Benchmark territorial expansion, regional margins, and state-level profitability clusters.
        </p>
      </div>

      <FilterBar />

      {loading && !data ? (
        <LoadingState message="Aggregating geographic performance across territories..." />
      ) : (
        <div className="space-y-6">
          {/* Regional Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data?.regions?.map((reg, idx) => (
              <div 
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                    {reg.region}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    reg.margin_pct >= 12 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                  }`}>
                    {reg.margin_pct}% Margin
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-xs text-slate-400">Total Sales</span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {fmtCurrency(reg.sales)}
                  </h3>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                  <span>Profit: <strong className={reg.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{fmtCurrency(reg.profit)}</strong></span>
                  <span>Orders: <strong>{reg.orders?.toLocaleString()}</strong></span>
                </div>
              </div>
            ))}
          </div>

          {/* Regional Sales vs Profit Chart */}
          <ChartCard
            title="Regional Revenue vs Net Profit"
            subtitle="Comparing top-line gross revenue with bottom-line profitability"
          >
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.regions || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#e2e8f0"} />
                  <XAxis dataKey="region" stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} />
                  <YAxis stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} tickFormatter={fmtCurrency} />
                  <Tooltip 
                    formatter={(val) => [fmtCurrency(val), ""]}
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                      borderColor: darkMode ? '#334155' : '#e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="sales" name="Sales" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Top 15 States Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Top State-Level Operating Hubs
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Detailed geographic breakdown of top revenue and operating profit states.
            </p>

            <DataTable
              columns={stateColumns}
              data={data?.states || []}
              searchKey="state"
              pageSize={8}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Regions;
