import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-white dark:bg-slate-900 
        border border-slate-200 dark:border-slate-800 
        rounded-xl shadow-sm 
        ${onClick ? 'cursor-pointer hover:shadow-md dark:hover:border-slate-700 transition-all' : ''} 
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({ title, subtitle, action }) => (
  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
    <div>
      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);