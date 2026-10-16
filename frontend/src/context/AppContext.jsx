import React, { createContext, useContext, useState, useEffect } from 'react';
import { dataApi } from '../services/api';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    year: [],
    region: [],
    state: [],
    category: [],
    sub_category: [],
    segment: [],
    ship_mode: []
  });

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Load dataset profile on launch
  const loadDatasetProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await dataApi.getProfile();
      setDataset(res.data);
    } catch (err) {
      console.error("Dataset load error:", err);
      setError("No dataset loaded or backend offline. You can upload a CSV to get started.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatasetProfile();
  }, []);

  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      year: [],
      region: [],
      state: [],
      category: [],
      sub_category: [],
      segment: [],
      ship_mode: []
    });
  };

  const activeFilterCount = Object.values(filters).reduce((acc, curr) => acc + (curr ? curr.length : 0), 0);

  return (
    <AppContext.Provider value={{
      dataset,
      setDataset,
      loading,
      setLoading,
      error,
      setError,
      filters,
      updateFilter,
      resetFilters,
      activeFilterCount,
      darkMode,
      toggleDarkMode,
      refreshDataset: loadDatasetProfile
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
