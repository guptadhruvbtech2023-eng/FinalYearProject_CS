import React from 'react';
import { Database, UploadCloud } from 'lucide-react';
import { Link } from 'react-router-dom';

const EmptyState = ({ 
  title = "No Dataset Active", 
  message = "Please upload a CSV dataset or load the default Superstore data to explore analytics and ML models.",
  actionText = "Upload Dataset",
  actionLink = "/upload"
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl max-w-lg mx-auto mt-8">
      <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4">
        <Database className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
        {message}
      </p>
      {actionLink && (
        <Link
          to={actionLink}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold shadow-sm hover:bg-brand-700 transition-colors"
        >
          <UploadCloud className="w-4 h-4" />
          <span>{actionText}</span>
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
