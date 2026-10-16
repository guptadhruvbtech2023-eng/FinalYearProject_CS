import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingCart, 
  Percent, 
  Package, 
  Sparkles, 
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  CartesianGrid,
  Legend
} from 'recharts';
import { useApp } from '../context/AppContext';
import { analyticsApi, aiApi } from '../services/api';
import FilterBar from '../components/FilterBar';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const COLORS = ['#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981'];

const Dashboard = () => {
  const { dataset, filters, darkMode } = useApp();
  const [kpis, setKpis] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [profitData, setProfitData] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dataset || dataset.status !== 'ready') return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [kpiRes, salesRes, profitRes, aiRes] = await Promise.all([
          analyticsApi.getKPIs(filters),
          analyticsApi.getSales(filters, 'monthly'),
          analyticsApi.getProfit(filters),
          aiApi.getInsights()
        ]);

        setKpis(kpiRes.data);
        setSalesData(salesRes.data);
        setProfitData(profitRes.data);
        setInsights(aiRes.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [dataset, filters]);

  if (!dataset || dataset.status !== 'ready') {
    return <EmptyState title="No Dataset Loaded" message="Please upload a dataset or load the default superstore data." />;
  }

  if (loading && !kpis) {
    return <LoadingState message="Calculating business KPIs and generating dashboard analytics..." />;
  }

  // Format currency helpers
  const fmtCurrency = (val) => {
    if (val === undefined || val === null) return "$0";
    if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
    return `$${Number(val).toFixed(2)}`;
  };

  // Merge sales and profit trend for combined area chart
  const combinedTrend = salesData?.trend?.map((item) => {
    const pMatch = profitData?.trend?.find(p => p.period === item.period);
    return {
      period: item.period,
      sales: item.sales,
      profit: pMatch ? pMatch.profit : 0
    };
  }) || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Executive Analytics Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time business performance overview powered by calculated statistical aggregates.
          </p>
        </div>
      </div>

      {/* Global Filter Bar */}
      <FilterBar />

      {/* AI Quick Insight Banner */}
      {insights && (
        <div className="bg-gradient-to-r from-brand-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-brand-800/40 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3 text-brand-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 animate-pulse text-brand-400" />
            <span>AI Automated Insights (Verified from Actual Data)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
              <span className="text-slate-400 block font-semibold mb-1">Key Revenue Driver</span>
              <p className="text-slate-200">{insights.key_insight}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
              <span className="text-slate-400 block font-semibold mb-1">Profitability & Discounting</span>
              <p className="text-slate-200">{insights.profit_insight}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
              <span className="text-slate-400 block font-semibold mb-1">Regional Dynamics</span>
              <p className="text-slate-200">{insights.regional_insight}</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
              <span className="text-slate-400 block font-semibold mb-1">Temporal Expansion</span>
              <p className="text-slate-200">{insights.trend_insight}</p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KPICard
            title="Total Sales"
            value={fmtCurrency(kpis.total_sales)}
            subtitle="Gross Revenue"
            icon={DollarSign}
            color="brand"
          />
          <KPICard
            title="Total Profit"
            value={fmtCurrency(kpis.total_profit)}
            subtitle={`Margin: ${kpis.profit_margin_percent}%`}
            icon={TrendingUp}
            color={kpis.total_profit >= 0 ? "emerald" : "rose"}
          />
          <KPICard
            title="Total Orders"
            value={kpis.total_orders?.toLocaleString()}
            subtitle={`${kpis.filtered_rows?.toLocaleString()} transactions`}
            icon={ShoppingCart}
            color="indigo"
          />
          <KPICard
            title="Avg Order Value"
            value={fmtCurrency(kpis.average_order_value)}
            subtitle="Revenue / Order"
            icon={ArrowUpRight}
            color="purple"
          />
          <KPICard
            title="Profit Margin"
            value={`${kpis.profit_margin_percent}%`}
            subtitle={kpis.profit_margin_percent > 10 ? "Healthy Unit Economics" : "Margin Optimization Needed"}
            icon={Percent}
            color={kpis.profit_margin_percent > 10 ? "emerald" : "amber"}
          />
          <KPICard
            title="Units Sold"
            value={kpis.total_quantity?.toLocaleString()}
            subtitle="Fulfillment Volume"
            icon={Package}
            color="amber"
          />
        </div>
      )}

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Profit Revenue Trend */}
        <ChartCard
          title="Revenue & Profit Trajectory"
          subtitle="Monthly progression of gross sales vs net operating profit"
          className="lg:col-span-2"
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={combinedTrend}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#e2e8f0"} />
                <XAxis dataKey="period" stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} />
                <YAxis stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} tickFormatter={fmtCurrency} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                    borderColor: darkMode ? '#334155' : '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(val) => [fmtCurrency(val), ""]}
                />
                <Legend />
                <Area type="monotone" dataKey="sales" name="Sales" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Sales by Segment (Donut) */}
        <ChartCard
          title="Sales by Customer Segment"
          subtitle="Revenue distribution across consumer, corporate & home office"
        >
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesData?.by_segment || []}
                  dataKey="sales"
                  nameKey="segment"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                >
                  {(salesData?.by_segment || []).map((entry, index) => (
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
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Secondary Charts: Category and Region */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Category */}
        <ChartCard
          title="Sales by Product Category"
          subtitle="Gross volume contribution by major department"
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData?.by_category || []} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#e2e8f0"} />
                <XAxis type="number" stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} tickFormatter={fmtCurrency} />
                <YAxis type="category" dataKey="category" stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} />
                <Tooltip 
                  formatter={(val) => [fmtCurrency(val), "Sales"]}
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                    borderColor: darkMode ? '#334155' : '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="sales" name="Sales" fill="#6366f1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Profit by Region */}
        <ChartCard
          title="Profitability by Region"
          subtitle="Net operating earnings comparison across territories"
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitData?.by_region || []}>
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
                <Bar dataKey="profit" name="Profit" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default Dashboard;
