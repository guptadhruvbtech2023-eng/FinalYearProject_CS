import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';

const FilterBar = () => {
  const { dataset, filters, updateFilter, resetFilters, activeFilterCount } = useApp();

  if (!dataset || !dataset.filter_options) {
    return null;
  }

  const options = dataset.filter_options;

  const handleSelectChange = (key, e) => {
    const val = e.target.value;
    if (!val) {
      updateFilter(key, []);
    } else {
      updateFilter(key, [val]);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 mb-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Filter label & active count */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Global Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 text-[10px] font-bold">
              {activeFilterCount} Active
            </span>
          )}
        </div>

        {/* Reset button */}
        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Filter Select Controls */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 mt-3">
        {/* Year */}
        {options.years && options.years.length > 0 && (
          <div>
            <label className="block text-[10px] font-medium text-slate-400 mb-1">Year</label>
            <select
              value={filters.year?.[0] || ""}
              onChange={(e) => handleSelectChange('year', e)}
              className="w-full text-xs py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Years</option>
              {options.years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}

        {/* Region */}
        {options.regions && options.regions.length > 0 && (
          <div>
            <label className="block text-[10px] font-medium text-slate-400 mb-1">Region</label>
            <select
              value={filters.region?.[0] || ""}
              onChange={(e) => handleSelectChange('region', e)}
              className="w-full text-xs py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Regions</option>
              {options.regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        )}

        {/* State */}
        {options.states && options.states.length > 0 && (
          <div>
            <label className="block text-[10px] font-medium text-slate-400 mb-1">State</label>
            <select
              value={filters.state?.[0] || ""}
              onChange={(e) => handleSelectChange('state', e)}
              className="w-full text-xs py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All States</option>
              {options.states.slice(0, 50).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        {/* Category */}
        {options.categories && options.categories.length > 0 && (
          <div>
            <label className="block text-[10px] font-medium text-slate-400 mb-1">Category</label>
            <select
              value={filters.category?.[0] || ""}
              onChange={(e) => handleSelectChange('category', e)}
              className="w-full text-xs py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Categories</option>
              {options.categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        {/* Sub-Category */}
        {options.sub_categories && options.sub_categories.length > 0 && (
          <div>
            <label className="block text-[10px] font-medium text-slate-400 mb-1">Sub-Category</label>
            <select
              value={filters.sub_category?.[0] || ""}
              onChange={(e) => handleSelectChange('sub_category', e)}
              className="w-full text-xs py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Sub-Categories</option>
              {options.sub_categories.map((sc) => (
                <option key={sc} value={sc}>{sc}</option>
              ))}
            </select>
          </div>
        )}

        {/* Segment */}
        {options.segments && options.segments.length > 0 && (
          <div>
            <label className="block text-[10px] font-medium text-slate-400 mb-1">Segment</label>
            <select
              value={filters.segment?.[0] || ""}
              onChange={(e) => handleSelectChange('segment', e)}
              className="w-full text-xs py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Segments</option>
              {options.segments.map((sg) => (
                <option key={sg} value={sg}>{sg}</option>
              ))}
            </select>
          </div>
        )}

        {/* Ship Mode */}
        {options.ship_modes && options.ship_modes.length > 0 && (
          <div>
            <label className="block text-[10px] font-medium text-slate-400 mb-1">Ship Mode</label>
            <select
              value={filters.ship_mode?.[0] || ""}
              onChange={(e) => handleSelectChange('ship_mode', e)}
              className="w-full text-xs py-1.5 px-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Ship Modes</option>
              {options.ship_modes.map((sm) => (
                <option key={sm} value={sm}>{sm}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
