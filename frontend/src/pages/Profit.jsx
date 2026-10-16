import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  Percent, 
  AlertTriangle,
  Layers 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
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
import DataTable from '../components/DataTable';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const Profit = () => {
  const { dataset, filters, darkMode } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dataset || dataset.status !== 'ready') return;

    const fetchProfit = async () => {
      try {
        setLoading(true);
        const res = await analyticsApi.getProfit(filters);
        setData(res.data);
      } catch (err) {
        console.error("Profit fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfit();
  }, [dataset, filters]);

  if (!dataset || dataset.status !== 'ready') {
    return <EmptyState title="No Dataset" message="Please upload or load a dataset to view profit analytics." />;
  }

  const fmtCurrency = (val) => {
    if (val === undefined || val === null) return "$0";
    if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
    return `$${Number(val).toFixed(2)}`;
  };

  const lossColumns = [
    { header: "Product Line", accessor: "product_name" },
    { 
      header: "Sales", 
      accessor: "sales", 
      render: (val) => <span className="font-mono">{fmtCurrency(val)}</span> 
    },
    { 
      header: "Profit", 
      accessor: "profit", 
      render: (val) => (
        <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
          {fmtCurrency(val)}
        </span>
      )
    },
    { 
      header: "Profit Margin", 
      accessor: "margin_pct", 
      render: (val) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300">
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
          Profitability & Margin Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Evaluate operating income, margin compression drivers, and catalog loss-makers.
        </p>
      </div>

      <FilterBar />

      {loading && !data ? (
        <LoadingState message="Calculating net operating margins and auditing catalog losses..." />
      ) : (
        <div className="space-y-6">
          {/* Profit & Margin Trend */}
          <ChartCard
            title="Monthly Profit Progression & Margin Percentage"
            subtitle="Evaluating operating profit and return-on-sales over time"
          >
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.trend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#e2e8f0"} />
                  <XAxis dataKey="period" stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} />
                  <YAxis yAxisId="left" stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} tickFormatter={fmtCurrency} />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={11} tickFormatter={(v) => `${v}%`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                      borderColor: darkMode ? '#334155' : '#e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(val, name) => [name === 'margin_pct' ? `${val}%` : fmtCurrency(val), name]}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="profit" name="Net Profit" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="margin_pct" name="Margin %" stroke="#10b981" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Profit by Category & Region */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Profit Contribution by Category"
              subtitle="Comparing bottom-line returns across departments"
            >
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.by_category || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#e2e8f0"} />
                    <XAxis dataKey="category" stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} />
                    <YAxis stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} tickFormatter={fmtCurrency} />
                    <Tooltip 
                      formatter={(val) => [fmtCurrency(val), "Profit"]}
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                        borderColor: darkMode ? '#334155' : '#e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard
              title="Profit Contribution by Region"
              subtitle="Regional net income benchmarks"
            >
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.by_region || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#e2e8f0"} />
                    <XAxis dataKey="region" stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} />
                    <YAxis stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} tickFormatter={fmtCurrency} />
                    <Tooltip 
                      formatter={(val) => [fmtCurrency(val), "Profit"]}
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                        borderColor: darkMode ? '#334155' : '#e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="profit" name="Profit" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          {/* Loss-Making Products Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>Top Loss-Making Products (Margin Drain SKUs)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Products generating negative net profits, ordered by largest cumulative loss.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-bold">
                {data?.loss_making_products?.length || 0} Critical SKUs
              </span>
            </div>

            <DataTable
              columns={lossColumns}
              data={data?.loss_making_products || []}
              searchKey="product_name"
              pageSize={8}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Profit;
