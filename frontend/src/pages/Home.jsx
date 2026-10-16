import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  BarChart3, 
  BrainCircuit, 
  Sparkles, 
  Database, 
  ShieldCheck, 
  TrendingUp, 
  Bot, 
  Layers, 
  FileText,
  Sliders,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const Home = () => {
  const { dataset } = useApp();

  const features = [
    {
      icon: Database,
      title: "Data Profiling & Cleaning",
      desc: "Automated missing value imputation, duplicate removal, dynamic schema detection, and IQR/Z-Score outlier handling."
    },
    {
      icon: BarChart3,
      title: "Interactive BI Analytics",
      desc: "Comprehensive sales, profit, customer, product, and regional intelligence with multi-dimensional global filters."
    },
    {
      icon: BrainCircuit,
      title: "Machine Learning Regressors",
      desc: "Linear Regression, Random Forest, and Gradient Boosting predicting sales & profit with strict train/test data leakage prevention."
    },
    {
      icon: AlertTriangle,
      title: "Multi-Method Anomaly Detection",
      desc: "Unsupervised Isolation Forest and statistical IQR/Z-score outlier detection identifying revenue and profit risks."
    },
    {
      icon: Sliders,
      title: "What-If Scenario Simulation",
      desc: "Interactive parameter simulator projecting the financial impact of changing discount, quantity, and pricing strategies."
    },
    {
      icon: Bot,
      title: "Grounded AI Business Analyst",
      desc: "Conversational intelligence answering complex executive queries grounded strictly in calculated dataset metrics with zero hallucinations."
    }
  ];

  const pipelineSteps = [
    "Raw CSV", "Validation", "Data Cleaning", "Profiling", "EDA", "BI Analytics", 
    "ML Regressors", "Anomaly Detection", "Explainable AI", "Grounded AI", "What-If", "Automated Report"
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-6 lg:px-12 rounded-3xl bg-gradient-to-b from-brand-50/50 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 border border-slate-200/80 dark:border-slate-800 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-100/60 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>B.Tech Final Year Capstone Project</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-tight">
          Intelligent Business Analytics <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-indigo-600">
            Powered by Data + AI
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Transform raw business data into actionable insights, predictions and intelligent decisions. 
          A production-grade pipeline bridging Exploratory Data Analysis, Machine Learning, and Grounded Generative AI.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md shadow-brand-500/25 transition-all hover:scale-105"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Explore Dashboard</span>
          </Link>

          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm border border-slate-200 dark:border-slate-700 shadow-xs transition-all hover:scale-105"
          >
            <Database className="w-4 h-4" />
            <span>Upload Dataset</span>
          </Link>

          <Link
            to="/ai-chat"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white font-semibold text-sm shadow-md shadow-indigo-500/20 transition-all hover:scale-105"
          >
            <Bot className="w-4 h-4" />
            <span>AI Business Analyst</span>
          </Link>
        </div>

        {/* Dataset Quick Indicator */}
        {dataset && dataset.status === 'ready' && (
          <div className="mt-8 inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Loaded Dataset: <strong>{dataset.filename}</strong> ({dataset.total_rows.toLocaleString()} rows, {dataset.total_columns} columns)</span>
          </div>
        )}
      </section>

      {/* Analytics Pipeline Visualization */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            End-to-End Analytics & AI Pipeline
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete transformation lifecycle from raw unstructured tabular data to automated executive reports.
          </p>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="flex items-center justify-between min-w-[900px] gap-2 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            {pipelineSteps.map((step, idx) => (
              <React.Fragment key={idx}>
                <div className="flex flex-col items-center text-center px-2">
                  <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-950/70 border border-brand-300 dark:border-brand-700 flex items-center justify-center text-brand-700 dark:text-brand-300 text-[11px] font-bold">
                    {idx + 1}
                  </div>
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mt-1 whitespace-nowrap">
                    {step}
                  </span>
                </div>
                {idx < pipelineSteps.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Comprehensive System Modules
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Built for enterprise-grade analytics, machine learning explainability, and executive decision support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all hover:border-brand-300 dark:hover:border-brand-800 group"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {feat.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Viva / Demonstration Talking Points */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 lg:p-12 relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Viva Examination Guide</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Key Concepts to Demonstrate in Viva
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-xs text-slate-300">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
              <strong className="text-white block mb-1">1. Preventing Data Leakage</strong>
              Strict separation of training and test sets; scikit-learn pipelines fit transformers (StandardScaler, OneHotEncoder) strictly on training partitions.
            </div>
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
              <strong className="text-white block mb-1">2. Grounded AI Architecture</strong>
              User query passes to question intent analyzer, fetches calculated SQL/pandas metrics first, and feeds verified facts to AI—preventing numerical hallucination.
            </div>
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
              <strong className="text-white block mb-1">3. Multi-Model Regression Comparison</strong>
              Evaluation across MAE, MSE, RMSE, and R² comparing Linear Regression, Random Forest, and Gradient Boosting.
            </div>
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
              <strong className="text-white block mb-1">4. Unsupervised Anomaly Detection</strong>
              Isolation Forest multidimensional tree isolation paired with IQR and Z-Score outlier detection for revenue & margin defense.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
