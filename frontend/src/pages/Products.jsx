import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertTriangle, HelpCircle, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { analyticsApi } from '../services/api';
import FilterBar from '../components/FilterBar';
import DataTable from '../components/DataTable';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const Products = () => {
  const { dataset, filters } = useApp();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("high_low"); // "high_low", "top_sales", "top_profit", "bottom_profit"
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!dataset || dataset.status !== 'ready') return;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await analyticsApi.getProducts(filters);
        setData(res.data);
      } catch (err) {
        console.error("Products error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [dataset, filters]);

  if (!dataset || dataset.status !== 'ready') {
    return <EmptyState title="No Dataset" message="Please upload or load a dataset to view product analytics." />;
  }

  const fmtCurrency = (val) => {
    if (val === undefined || val === null) return "$0";
    if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
    return `$${Number(val).toFixed(2)}`;
  };

  const productColumns = [
    { header: "Product Name", accessor: "product_name" },
    { 
      header: "Sales", 
      accessor: "sales", 
      render: (val) => <span className="font-mono">{fmtCurrency(val)}</span> 
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
      header: "Margin %", 
      accessor: "margin_pct", 
      render: (val) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          val < 5 
            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300' 
            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
        }`}>
          {val}%
        </span>
      ) 
    }
  ];

  const getActiveList = () => {
    if (tab === "high_low") return data?.high_sales_low_profit || [];
    if (tab === "top_sales") return data?.top_products_sales || [];
    if (tab === "top_profit") return data?.top_products_profit || [];
    return data?.bottom_products_profit || [];
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Product Catalog & Profitability Matrix
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Detect high-volume SKUs suffering from negative margins, and audit top profit contributors.
        </p>
      </div>

      <FilterBar />

      {/* Strategic Callout Banner for High Sales / Low Profit */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold mb-0.5">High Sales / Low Profit Anomaly Analysis</strong>
          These products generate massive gross revenue but yield near-zero or negative margins due to excessive promotional discounting, freight expenses, or low wholesale markups. Management should prioritize these for SKU rationalization.
        </div>
      </div>

      {loading && !data ? (
        <LoadingState message="Auditing product catalog revenues and margin spreads..." />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              <button
                onClick={() => setTab("high_low")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tab === 'high_low' 
                    ? 'bg-amber-500 text-white shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                High Sales / Low Profit ({data?.high_sales_low_profit?.length || 0})
              </button>
              <button
                onClick={() => setTab("top_sales")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tab === 'top_sales' 
                    ? 'bg-brand-600 text-white shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Top Sales SKUs
              </button>
              <button
                onClick={() => setTab("top_profit")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tab === 'top_profit' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Top Profit SKUs
              </button>
              <button
                onClick={() => setTab("bottom_profit")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tab === 'bottom_profit' 
                    ? 'bg-rose-600 text-white shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Bottom Profit (Deepest Losses)
              </button>
            </div>
          </div>

          <DataTable
            columns={productColumns}
            data={getActiveList()}
            searchKey="product_name"
            pageSize={10}
          />
        </div>
      )}
    </div>
  );
};

export default Products;
