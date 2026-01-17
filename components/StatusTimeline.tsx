import React from 'react';
import { StatusHistoryEntry, ORDER_STATUS_LABELS } from '../types';
import { Circle, CheckCircle, Clock } from 'lucide-react';

interface StatusTimelineProps {
  history: StatusHistoryEntry[];
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ history = [] }) => {
  // Sort by date descending for the view
  const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);

  if (sortedHistory.length === 0) {
    return <div className="text-xs text-slate-400 italic">Sem histórico de status.</div>;
  }

  return (
    <div className="relative border-l-2 border-slate-200 ml-2 space-y-6 py-2">
      {sortedHistory.map((entry, index) => {
        const isLatest = index === 0;
        return (
          <div key={index} className="ml-6 relative">
            <span 
                className={`absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${isLatest ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              {isLatest ? <Clock size={12} className="text-white" /> : <CheckCircle size={12} className="text-white" />}
            </span>
            <div className="flex flex-col">
              <span className={`text-sm font-semibold ${isLatest ? 'text-slate-900' : 'text-slate-500'}`}>
                {ORDER_STATUS_LABELS[entry.to]}
              </span>
              <div className="flex flex-col sm:flex-row sm:gap-2 text-xs text-slate-400 mt-0.5">
                <span>por {entry.changedByName}</span>
                <span className="hidden sm:inline">•</span>
                <span>{new Date(entry.timestamp).toLocaleDateString()} às {new Date(entry.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
              </div>
              {entry.reason && (
                  <p className="text-xs text-slate-500 mt-1 bg-slate-50 p-2 rounded border border-slate-100 italic">
                      "{entry.reason}"
                  </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};