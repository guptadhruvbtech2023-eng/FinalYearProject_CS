import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Cleaning from './pages/Cleaning';
import DataProfile from './pages/DataProfile';
import Sales from './pages/Sales';
import Profit from './pages/Profit';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Regions from './pages/Regions';
import EDA from './pages/EDA';
import Correlation from './pages/Correlation';
import Predictions from './pages/Predictions';
import Anomalies from './pages/Anomalies';
import Explainability from './pages/Explainability';
import WhatIf from './pages/WhatIf';
import AIChat from './pages/AIChat';
import AIInsights from './pages/AIInsights';
import Reports from './pages/Reports';

const App = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
          <Navbar />
          <div className="flex-1 flex">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/cleaning" element={<Cleaning />} />
                <Route path="/profile" element={<DataProfile />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/profit" element={<Profit />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/products" element={<Products />} />
                <Route path="/regions" element={<Regions />} />
                <Route path="/eda" element={<EDA />} />
                <Route path="/correlation" element={<Correlation />} />
                <Route path="/predictions" element={<Predictions />} />
                <Route path="/anomalies" element={<Anomalies />} />
                <Route path="/explainability" element={<Explainability />} />
                <Route path="/what-if" element={<WhatIf />} />
                <Route path="/ai-chat" element={<AIChat />} />
                <Route path="/ai-insights" element={<AIInsights />} />
                <Route path="/reports" element={<Reports />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
