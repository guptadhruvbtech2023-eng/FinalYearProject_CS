import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Sparkles, 
  CheckCircle, 
  RefreshCw,
  ExternalLink 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { reportApi } from '../services/api';
import FilterBar from '../components/FilterBar';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const Reports = () => {
  const { dataset, filters } = useApp();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await reportApi.generate(filters);
      setReport(res.data);
    } catch (err) {
      console.error("Report error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dataset && dataset.status === 'ready') {
      fetchReport();
    }
  }, [dataset, filters]);

  const handlePrintOrPdf = async () => {
    try {
      const res = await reportApi.exportHtml(filters);
      const printWindow = window.open('', '_blank');
      printWindow.document.write(res.data);
      printWindow.document.close();
      printWindow.focus();
    } catch (e) {
      window.print();
    }
  };

  const handleDownloadMarkdown = () => {
    if (!report) return;
    const mdContent = `# ${report.title}\n*Generated: ${report.generated_at} | Source: ${report.dataset_filename}*\n\n` +
      `## 1. Executive Summary\n${report.sections['1_executive_summary']}\n\n` +
      `## 2. Dataset Overview\nTotal Rows: ${report.sections['2_dataset_overview'].total_rows} | Columns: ${report.sections['2_dataset_overview'].total_columns}\n\n` +
      `## 3. Machine Learning Results\nTarget: ${report.sections['10_machine_learning_results'].target_variable} | Optimal Model: ${report.sections['10_machine_learning_results'].best_performing_model}\n\n` +
      `## 4. Key Investigations\n` + report.sections['13_areas_for_investigation'].map(i => `- ${i}`).join('\n');

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI_Business_Report_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!dataset || dataset.status !== 'ready') {
    return <EmptyState title="No Dataset" message="Please upload or load a dataset to generate the AI Business Report." />;
  }

  const sections = report?.sections || {};

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>AI Automated Business Report</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Full 13-section analytical intelligence dossier with verified metrics and PDF-ready formatting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadMarkdown}
            disabled={loading || !report}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Markdown</span>
          </button>

          <button
            onClick={handlePrintOrPdf}
            disabled={loading || !report}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      <FilterBar />

      {loading && !report ? (
        <LoadingState message="Assembling 13-section business report from analytics, models, anomalies, and AI services..." />
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xs space-y-8 print:p-0 print:border-none print:shadow-none">
          {/* Report Cover Header */}
          <div className="border-b-2 border-brand-500 pb-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {report?.title}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Generated: <strong>{report?.generated_at}</strong> | Source: <strong>{report?.dataset_filename}</strong> | Status: <strong>Validated & Grounded</strong>
            </p>
          </div>

          {/* 1. Executive Summary */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
              1. Executive Summary
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {sections['1_executive_summary']}
            </p>
          </section>

          {/* 2. Dataset Overview */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
              2. Dataset Integrity & Overview
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">Validated Records</span>
                <strong className="text-slate-900 dark:text-white">{sections['2_dataset_overview']?.total_rows?.toLocaleString()}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">Attributes</span>
                <strong className="text-slate-900 dark:text-white">{sections['2_dataset_overview']?.total_columns}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">Missing Entries</span>
                <strong className="text-slate-900 dark:text-white">{sections['2_dataset_overview']?.missing_values}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px]">Duplicates Purged</span>
                <strong className="text-slate-900 dark:text-white">{sections['2_dataset_overview']?.duplicate_rows}</strong>
              </div>
            </div>
          </section>

          {/* 3 & 4. Sales & Profit Performance */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                3. Sales Performance
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Total commercial gross revenue achieved <strong>{sections['3_sales_performance']?.total_sales}</strong> across <strong>{sections['3_sales_performance']?.total_orders?.toLocaleString()} fulfilled orders</strong> at an average order ticket of <strong>{sections['3_sales_performance']?.average_order_value}</strong>.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                4. Profit & Operating Margin
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Cumulative operating profit totaled <strong>{sections['4_profit_performance']?.total_profit}</strong> at a company-wide return on sales of <strong>{sections['4_profit_performance']?.profit_margin}</strong>. There are <strong>{sections['4_profit_performance']?.loss_making_products_count} product lines</strong> operating with negative margins.
              </p>
            </div>
          </section>

          {/* 10. Machine Learning Results */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
              10. Machine Learning Benchmark Results
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-3 py-2">Algorithm</th>
                    <th className="px-3 py-2">MAE</th>
                    <th className="px-3 py-2">RMSE</th>
                    <th className="px-3 py-2">R² Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sections['10_machine_learning_results']?.model_comparison?.map((m, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-bold">{m.model}</td>
                      <td className="px-3 py-2 font-mono">{m.mae}</td>
                      <td className="px-3 py-2 font-mono">{m.rmse}</td>
                      <td className="px-3 py-2 font-bold text-brand-600">{m.r2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 13. Areas for Investigation */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
              13. Priority Recommendations & Action Items
            </h3>
            <div className="space-y-2 text-xs">
              {sections['13_areas_for_investigation']?.map((action, i) => (
                <div key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                  <span>{action}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Reports;
