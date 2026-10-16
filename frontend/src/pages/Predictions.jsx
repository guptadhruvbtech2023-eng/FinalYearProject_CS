import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Play, 
  Award, 
  CheckCircle, 
  TrendingUp, 
  DollarSign, 
  Layers,
  Sparkles,
  BarChart2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ScatterChart, 
  Scatter, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend,
  Line 
} from 'recharts';
import { useApp } from '../context/AppContext';
import { mlApi } from '../services/api';
import ChartCard from '../components/ChartCard';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

const Predictions = () => {
  const { dataset, darkMode } = useApp();
  const [target, setTarget] = useState("Profit"); // "Profit" or "Sales"
  const [trainData, setTrainData] = useState(null);
  const [training, setTraining] = useState(false);

  // Live prediction state
  const [predictInputs, setPredictInputs] = useState({
    Sales: 250,
    Quantity: 4,
    Discount: 0.1,
    Category: "Technology",
    Region: "West"
  });
  const [predictionResult, setPredictionResult] = useState(null);
  const [predicting, setPredicting] = useState(false);

  // Auto-train on mount or target change
  const handleTrain = async (targetVar = target) => {
    try {
      setTraining(true);
      const res = await mlApi.train(
        targetVar,
        ["linear_regression", "random_forest", "gradient_boosting"],
        0.2
      );
      setTrainData(res.data);
      // Auto-populate default categories if available
      if (dataset?.filter_options?.categories?.length > 0) {
        setPredictInputs(prev => ({
          ...prev,
          Category: dataset.filter_options.categories[0],
          Region: dataset.filter_options.regions[0] || "West"
        }));
      }
    } catch (err) {
      console.error("Training error:", err);
    } finally {
      setTraining(false);
    }
  };

  useEffect(() => {
    if (dataset && dataset.status === 'ready') {
      handleTrain(target);
    }
  }, [dataset, target]);

  const handleRunPrediction = async (e) => {
    e.preventDefault();
    try {
      setPredicting(true);
      const res = await mlApi.predict(target, predictInputs);
      setPredictionResult(res.data);
    } catch (err) {
      console.error("Predict error:", err);
    } finally {
      setPredicting(false);
    }
  };

  if (!dataset || dataset.status !== 'ready') {
    return <EmptyState title="No Dataset" message="Please upload or load a dataset to train ML predictive models." />;
  }

  const fmtCurrency = (val) => {
    if (val === undefined || val === null) return "$0";
    return `$${Number(val).toFixed(2)}`;
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Machine Learning Predictive Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Train and evaluate Scikit-learn regressors with strict train/test data leakage prevention.
          </p>
        </div>

        {/* Target Selector & Retrain Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setTarget("Profit")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                target === 'Profit' 
                  ? 'bg-brand-600 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Predict Profit
            </button>
            <button
              onClick={() => setTarget("Sales")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                target === 'Sales' 
                  ? 'bg-brand-600 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Predict Sales
            </button>
          </div>

          <button
            onClick={() => handleTrain(target)}
            disabled={training}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${training ? 'animate-spin' : ''}`} />
            <span>{training ? "Training..." : "Retrain Models"}</span>
          </button>
        </div>
      </div>

      {training && !trainData ? (
        <LoadingState message={`Preprocessing pipeline, splitting chronologically, and training Linear Regression, Random Forest & Gradient Boosting for ${target}...`} />
      ) : (
        <div className="space-y-6">
          {/* Best Model Banner */}
          {trainData && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-brand-900 via-indigo-950 to-slate-900 text-white border border-brand-800/40 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center text-brand-300">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-brand-400 font-bold uppercase tracking-wider block">
                    Top Performing Regressor
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {trainData.best_model} (R² Score: {(trainData.best_r2 * 100).toFixed(2)}%)
                  </h3>
                </div>
              </div>

              <div className="mt-3 sm:mt-0 text-xs text-slate-300 text-right">
                <span>Evaluated on <strong>{trainData.testing_samples?.toLocaleString()} holdout test samples</strong></span>
                <span className="block text-[11px] text-slate-400">Zero data leakage across test partition</span>
              </div>
            </div>
          )}

          {/* Model Comparison Table & Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Metrics Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Regression Model Benchmark Comparison
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Comparative error metrics evaluated on strictly separated test partitions.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-3 py-2.5">Model Architecture</th>
                      <th className="px-3 py-2.5">MAE</th>
                      <th className="px-3 py-2.5">RMSE</th>
                      <th className="px-3 py-2.5">R² Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {trainData?.metrics?.map((m, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white">
                          {m.model}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-600 dark:text-slate-400">
                          {m.mae}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-600 dark:text-slate-400">
                          {m.rmse}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            m.r2 >= 0.7 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                              : 'bg-brand-100 text-brand-800 dark:bg-brand-950/60 dark:text-brand-300'
                          }`}>
                            {m.r2}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* R2 Score Comparison Bar Chart */}
            <ChartCard
              title="R² Variance Explained (Coefficient of Determination)"
              subtitle="Higher R² represents superior explanatory capacity"
            >
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trainData?.metrics || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#e2e8f0"} />
                    <XAxis dataKey="model" stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={10} />
                    <YAxis stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} domain={[0, 1]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                        borderColor: darkMode ? '#334155' : '#e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="r2" name="R² Score" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          {/* Actual vs Predicted Visual Validation Plot */}
          <ChartCard
            title="Validation: Ground Truth Actual vs Model Predicted"
            subtitle="Evaluating holdout test set residuals (points closer to the diagonal represent near-perfect inference)"
          >
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#334155" : "#e2e8f0"} />
                  <XAxis type="number" dataKey="actual" name="Actual Test Value" stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} tickFormatter={fmtCurrency} />
                  <YAxis type="number" dataKey="predicted" name="Predicted Value" stroke={darkMode ? "#94a3b8" : "#64748b"} fontSize={11} tickFormatter={fmtCurrency} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                      borderColor: darkMode ? '#334155' : '#e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Scatter name="Test Instances" data={trainData?.actual_vs_predicted || []} fill="#6366f1" opacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Interactive Prediction Sandbox */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-1">
              <BrainCircuit className="w-5 h-5 text-brand-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Interactive Model Inference Sandbox
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Input custom transaction parameters to generate real-time {target} predictions using the trained ensemble.
            </p>

            <form onSubmit={handleRunPrediction} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Sales (if predicting profit) */}
              {target === "Profit" && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Sales Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={predictInputs.Sales}
                    onChange={(e) => setPredictInputs({ ...predictInputs, Sales: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Order Quantity</label>
                <input
                  type="number"
                  value={predictInputs.Quantity}
                  onChange={(e) => setPredictInputs({ ...predictInputs, Quantity: parseInt(e.target.value) || 1 })}
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Discount */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Discount Rate (0.0 - 0.8)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="0.9"
                  value={predictInputs.Discount}
                  onChange={(e) => setPredictInputs({ ...predictInputs, Discount: parseFloat(e.target.value) || 0 })}
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Product Category</label>
                <select
                  value={predictInputs.Category}
                  onChange={(e) => setPredictInputs({ ...predictInputs, Category: e.target.value })}
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  {(dataset?.filter_options?.categories || ["Technology", "Furniture", "Office Supplies"]).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Region */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Region</label>
                <select
                  value={predictInputs.Region}
                  onChange={(e) => setPredictInputs({ ...predictInputs, Region: e.target.value })}
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  {(dataset?.filter_options?.regions || ["West", "East", "Central", "South"]).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 md:col-span-3 lg:col-span-5 pt-2">
                <button
                  type="submit"
                  disabled={predicting}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  {predicting ? "Running Inference..." : `Predict Expected ${target}`}
                </button>
              </div>
            </form>

            {/* Inference Outcome Banner */}
            {predictionResult && (
              <div className="mt-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                    Predicted Model Output
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                      {fmtCurrency(predictionResult.predicted_value)}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      Expected {target}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  Model evaluated using the optimal {trainData?.best_model} pipeline with one-hot encoded categorization.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Predictions;
