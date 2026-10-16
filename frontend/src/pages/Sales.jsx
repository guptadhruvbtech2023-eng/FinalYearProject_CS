import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  PieChart as PieIcon, 
  BarChart2, 
  Layers 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
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
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const COLORS = ['#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

const Sales = () => {
  const { dataset, filters, darkMode } = useApp();
  const [data, setData] = useState(null);
  const [interval, setInterval] = useState("monthly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dataset || dataset.status !== 'ready') return;

    const fetchSales = async () => {
      try {
        setLoading(true);
        const res = await analyticsApi.getSales(filters, interval);
        setData(res.data);
      } catch (err) {
        console.error("Sales fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, [dataset, filters, interval]);

  if (!dataset || dataset.status !== 'ready') {
    return <EmptyState title="No Dataset" message="Please upload or load a dataset to view sales analytics." />;
  }

  const fmtCurrency = (val) => {
    if (val === undefined || val === null) return "$0";
    if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
    return `$${Number(val).toFixed(2)}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Sales Performance & Revenue Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Temporal progression, sub-category breakdown, and segment composition of gross revenue.
        </p>
      </div>

      <FilterBar />

      {loading && !data ? (
        <LoadingState message="Aggregating sales figures across selected dimensions..." />
      ) : (
        <div className="space-y-6">
          {/* 1. Sales Trend with Granularity Toggles */}
          <ChartCard
            title="Sales Revenue Progression"
            subtitle={`Granularity: ${interval.toUpperCase()} revenue aggregation`}
            actions={
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {['daily', 'monthly', 'quarterly', 'yearly'].map((intv) => (
                  <button
                    key={intv}
                    onClick={() => setInterval(intv)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                      interval === intv 
                        ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-xs' 
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {intv}
                  </button>
                ))}
              </div>
            }
          >
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.trend || []}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#e2e8f0"} />
                  <XAxis dataKey="period" stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} />
                  <YAxis stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} tickFormatter={fmtCurrency} />
                  <Tooltip 
                    formatter={(val) => [fmtCurrency(val), "Sales"]}
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                      borderColor: darkMode ? '#334155' : '#e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="sales" name="Sales" stroke="#0ea5e9" fillOpacity={1} fill="url(#salesGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* 2. Sub-Category Sales & Category Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales by Sub-Category (Horizontal Bar) */}
            <ChartCard
              title="Sales by Sub-Category"
              subtitle="Ranked revenue generation by detailed product lines"
            >
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.by_sub_category || []} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#e2e8f0"} />
                    <XAxis type="number" stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} tickFormatter={fmtCurrency} />
                    <YAxis type="category" dataKey="sub_category" stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} />
                    <Tooltip 
                      formatter={(val) => [fmtCurrency(val), "Sales"]}
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                        borderColor: darkMode ? '#334155' : '#e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="sales" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            {/* Sales by Region & Segment Grid */}
            <div className="space-y-6">
              {/* Sales by Region */}
              <ChartCard
                title="Sales by Geographic Region"
                subtitle="Regional revenue distribution"
              >
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.by_region || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#e2e8f0"} />
                      <XAxis dataKey="region" stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} />
                      <YAxis stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} tickFormatter={fmtCurrency} />
                      <Tooltip 
                        formatter={(val) => [fmtCurrency(val), "Sales"]}
                        contentStyle={{ 
                          backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                          borderColor: darkMode ? '#334155' : '#e2e8f0',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="sales" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {/* Sales by Segment */}
              <ChartCard
                title="Customer Segment Share"
                subtitle="Market breakdown by customer profile"
              >
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.by_segment || []}
                        dataKey="sales"
                        nameKey="segment"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                      >
                        {(data?.by_segment || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val) => [fmtCurrency(val), "Sales"]}
                        contentStyle={{ 
                          backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                          borderColor: darkMode ? '#334155' : '#e2e8f0',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
