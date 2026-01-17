import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="h-full w-full min-h-[50vh] flex flex-col items-center justify-center text-slate-400">
      <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
      <p className="text-sm font-medium animate-pulse">Carregando...</p>
    </div>
  );
};