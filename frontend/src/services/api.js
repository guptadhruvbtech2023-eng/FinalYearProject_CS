import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 45000,
});

export const dataApi = {
  getProfile: () => api.get('/data/profile'),
  uploadDataset: (formData) => api.post('/data/upload', formData, {
    headers: { 'Content-Type': undefined }
  }),
  getCleaningSummary: () => api.get('/data/cleaning-summary'),
  getCleaningHistory: (limit = 100, column = null) => 
    api.get(`/data/cleaning/history?limit=${limit}${column ? `&column=${column}` : ''}`),
  previewCleaning: (data) => api.post('/data/cleaning/preview', data),
  undoCleaning: () => api.post('/data/cleaning/undo'),
  resetCleaning: () => api.post('/data/cleaning/reset'),
  inspectOutliers: (column, method = 'iqr', threshold = 1.5) => 
    api.post('/data/outliers/inspect', { column, method, threshold }),
  cleanDataset: (data) => api.post('/data/clean', data),
  resetDemo: () => api.post('/data/reset-demo'),
  exportCsvUrl: '/api/data/export/csv',
  exportExcelUrl: '/api/data/export/excel',
  exportCleanedPdfUrl: '/api/data/export/cleaned-pdf',
  exportCleaningReportPdfUrl: '/api/data/export/cleaning-report-pdf',
};

export const analyticsApi = {
  getKPIs: (filters = {}) => api.post('/analytics/kpis', filters),
  getSales: (filters = {}, interval = 'monthly') => 
    api.post(`/analytics/sales?interval=${interval}`, filters),
  getProfit: (filters = {}) => api.post('/analytics/profit', filters),
  getCustomers: (filters = {}) => api.post('/analytics/customers', filters),
  getProducts: (filters = {}) => api.post('/analytics/products', filters),
  getRegions: (filters = {}) => api.post('/analytics/regions', filters),
  getCorrelation: () => api.get('/analytics/correlation'),
  getEDA: (x_col, y_col = null, chart_type = 'histogram') => 
    api.post('/analytics/eda', { x_col, y_col, chart_type }),
};

export const mlApi = {
  train: (target_variable = 'Profit', model_types = ['linear_regression', 'random_forest', 'gradient_boosting'], test_size = 0.2) => 
    api.post('/ml/train', { target_variable, model_types, test_size }),
  predict: (target_variable, features) => 
    api.post('/ml/predict', { target_variable, features }),
  getMetrics: () => api.get('/ml/metrics'),
};

export const anomalyApi = {
  detect: (method = 'isolation_forest', contamination = 0.02, selected_metric = null) => 
    api.post(`/anomaly/detect?method=${method}&contamination=${contamination}${selected_metric ? `&selected_metric=${selected_metric}` : ''}`),
};

export const aiApi = {
  getInsights: () => api.get('/ai/insights'),
  getSummary: () => api.get('/ai/summary'),
  chat: (query) => api.post('/ai/chat', { query }),
};

export const whatifApi = {
  simulate: (target_variable, base_features, scenario_changes) => 
    api.post('/whatif/simulate', { target_variable, base_features, scenario_changes }),
};

export const reportApi = {
  generate: (filters = {}) => api.post('/report/generate', filters),
  exportHtml: (filters = {}) => api.post('/report/export-html', filters, { responseType: 'text' }),
};

export const experimentApi = {
  getSummary: (target = 'Profit') => api.get(`/experiments/summary?target=${target}`),
  exportMarkdownUrl: (target = 'Profit') => `/api/experiments/export-markdown?target=${target}`,
};

export default api;
