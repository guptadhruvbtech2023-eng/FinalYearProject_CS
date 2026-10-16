import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Award, ArrowUpRight, BarChart2 } from 'lucide-react';
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

const Customers = () => {
  const { dataset, filters, darkMode } = useApp();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("sales"); // "sales" or "profit"
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dataset || dataset.status !== 'ready') return;

    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const res = await analyticsApi.getCustomers(filters);
        setData(res.data);
      } catch (err) {
        console.error("Customers error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [dataset, filters]);

  if (!dataset || dataset.status !== 'ready') {
    return <EmptyState title="No Dataset" message="Please upload or load a dataset to view customer analytics." />;
  }

  const fmtCurrency = (val) => {
    if (val === undefined || val === null) return "$0";
    if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
    return `$${Number(val).toFixed(2)}`;
  };

  const customerColumns = [
    { header: "Customer Name", accessor: "customer" },
    { 
      header: "Total Sales", 
      accessor: "sales", 
      render: (val) => <span className="font-mono font-medium">{fmtCurrency(val)}</span> 
    },
    { 
      header: "Total Profit", 
      accessor: "profit", 
      render: (val) => (
        <span className={`font-mono font-semibold ${val >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {fmtCurrency(val)}
        </span>
      ) 
    },
    { header: "Order Count", accessor: "orders" },
    { 
      header: "Avg Order Value", 
      accessor: "aov", 
      render: (val) => <span className="font-mono text-slate-500">{fmtCurrency(val)}</span> 
    },
    { 
      header: "Margin %", 
      accessor: "margin_pct", 
      render: (val) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          val >= 15 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
        }`}>
          {val}%
        </span>
      ) 
    }
  ];

  const activeCustomerList = tab === "sales" ? (data?.top_customers_sales || []) : (data?.top_customers_profit || []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Customer Lifetime Value & Segment Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Identify enterprise accounts, top revenue drivers, and segment profit margins.
        </p>
      </div>

      <FilterBar />

      {loading && !data ? (
        <LoadingState message="Aggregating customer purchasing history..." />
      ) : (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KPICard
              title="Total Active Accounts"
              value={data?.total_customers?.toLocaleString() || "0"}
              subtitle="Distinct purchasing entities"
              icon={Users}
              color="indigo"
            />
            <KPICard
              title="Top Customer Revenue"
              value={fmtCurrency(data?.top_customers_sales?.[0]?.sales)}
              subtitle={data?.top_customers_sales?.[0]?.customer || "N/A"}
              icon={Award}
              color="brand"
            />
            <KPICard
              title="Top Customer Profit"
              value={fmtCurrency(data?.top_customers_profit?.[0]?.profit)}
              subtitle={data?.top_customers_profit?.[0]?.customer || "N/A"}
              icon={DollarSign}
              color="emerald"
            />
          </div>

          {/* Segment Comparison Chart */}
          <ChartCard
            title="Customer Segment Performance"
            subtitle="Comparing Gross Revenue and Net Profit across customer tiers"
          >
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.segment_breakdown || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#e2e8f0"} />
                  <XAxis dataKey="segment" stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} />
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

          {/* Top 10 Customers Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Top 10 High-Impact Accounts
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Toggle ranking by gross sales or net operating profitability.
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setTab("sales")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    tab === 'sales' 
                      ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Rank by Sales
                </button>
                <button
                  onClick={() => setTab("profit")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    tab === 'profit' 
                      ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Rank by Profit
                </button>
              </div>
            </div>

            <DataTable
              columns={customerColumns}
              data={activeCustomerList}
              searchKey="customer"
              pageSize={10}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
