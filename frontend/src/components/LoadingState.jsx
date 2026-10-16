import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingState = ({ message = "Processing data..." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-brand-600 animate-spin" />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-tight">
        {message}
      </p>
      <p className="text-xs text-slate-400 mt-1">
        Analyzing dataset and calculating metrics...
      </p>
    </div>
  );
};

export default LoadingState;
