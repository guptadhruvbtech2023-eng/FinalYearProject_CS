import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Sun, 
  Moon, 
  Database, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { dataApi } from '../services/api';

const Navbar = () => {
  const { dataset, darkMode, toggleDarkMode, refreshDataset, loading } = useApp();

  const handleResetDemo = async () => {
    try {
      await dataApi.resetDemo();
      await refreshDataset();
    } catch (e) {
      console.error("Failed to reset demo dataset:", e);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">NexusAnalytics</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                AI + ML
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Intelligent Business Analytics Platform</p>
          </div>
        </Link>
      </div>

      {/* Dataset Status & Actions */}
      <div className="flex items-center gap-3">
        {dataset && dataset.status === 'ready' ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[140px] sm:max-w-[200px]">
              {dataset.filename}
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500 dark:text-slate-400">
              {dataset.total_rows.toLocaleString()} rows
            </span>
            {dataset.is_demo && (
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                DEMO
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
            <Database className="w-3.5 h-3.5" />
            <span>No Dataset</span>
          </div>
        )}

        {/* Reload / Reset Demo Dataset */}
        <button
          onClick={handleResetDemo}
          title="Reload Default Dataset"
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleDarkMode}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Viva Guide / Quick Link */}
        <Link
          to="/ai-chat"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 text-white text-xs font-semibold shadow-sm hover:opacity-95 transition-opacity"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask AI Analyst</span>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
