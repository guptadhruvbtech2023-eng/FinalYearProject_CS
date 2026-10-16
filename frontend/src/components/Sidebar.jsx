import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  Wrench,
  FileSearch,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  MapPin,
  GitGraph,
  Sparkles,
  Bot,
  BrainCircuit,
  AlertTriangle,
  Lightbulb,
  Sliders,
  FileText,
  Home,
  FlaskConical
} from 'lucide-react';

const Sidebar = () => {
  const navSections = [
    {
      title: "Core",
      items: [
        { name: "Home", path: "/", icon: Home },
        { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard }
      ]
    },
    {
      title: "Data Management",
      items: [
        { name: "Upload Dataset", path: "/upload", icon: UploadCloud },
        { name: "Data Cleaning", path: "/cleaning", icon: Wrench },
        { name: "Data Profile", path: "/profile", icon: FileSearch }
      ]
    },
    {
      title: "Analytics",
      items: [
        { name: "Sales Analytics", path: "/sales", icon: TrendingUp },
        { name: "Profit Analytics", path: "/profit", icon: DollarSign },
        { name: "Customer Analytics", path: "/customers", icon: Users },
        { name: "Product Analytics", path: "/products", icon: Package },
        { name: "Regional Analytics", path: "/regions", icon: MapPin },
        { name: "EDA & Distributions", path: "/eda", icon: GitGraph }
      ]
    },
    {
      title: "AI & Machine Learning",
      items: [
        { name: "AI Insights", path: "/ai-insights", icon: Sparkles },
        { name: "AI Business Analyst", path: "/ai-chat", icon: Bot },
        { name: "ML Predictions", path: "/predictions", icon: BrainCircuit },
        { name: "Research Experiments", path: "/experiments", icon: FlaskConical },
        { name: "Anomaly Detection", path: "/anomalies", icon: AlertTriangle },
        { name: "Explainable AI", path: "/explainability", icon: Lightbulb },
        { name: "What-If Analysis", path: "/what-if", icon: Sliders }
      ]
    },
    {
      title: "Reporting",
      items: [
        { name: "AI Business Report", path: "/reports", icon: FileText }
      ]
    }
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
      <div className="p-4 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {section.title}
            </h3>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/"}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all
                      ${isActive 
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300 font-semibold shadow-xs' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'}
                    `}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Viva Tag */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
        <p className="font-semibold text-slate-700 dark:text-slate-300">B.Tech Final Year Project</p>
        <p className="text-[10px] text-slate-500 dark:text-slate-500">Data Analytics & AI Integration</p>
      </div>
    </aside>
  );
};

export default Sidebar;
