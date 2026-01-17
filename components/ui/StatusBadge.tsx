import React from 'react';
import { OrderStatus, ORDER_STATUS_LABELS } from '../../types';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let colorClass = '';

  switch (status) {
    case OrderStatus.DRAFT:
      colorClass = 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      break;
    case OrderStatus.AGUARDANDO_ANALISE:
    case OrderStatus.EM_ANALISE:
      colorClass = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      break;
    case OrderStatus.AGUARDANDO_APROVACAO:
      colorClass = 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
      break;
    case OrderStatus.APROVADO:
      colorClass = 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      break;
    case OrderStatus.EM_ANDAMENTO:
      colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800';
      break;
    case OrderStatus.CONCLUIDO:
      colorClass = 'bg-teal-50 text-teal-700 border-teal-200 font-bold dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800';
      break;
    case OrderStatus.AGUARDANDO_PAGAMENTO:
      colorClass = 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800';
      break;
    case OrderStatus.PAGO:
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
      break;
    case OrderStatus.AGUARDANDO_RETIRADA:
      colorClass = 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
      break;
    case OrderStatus.RETIRADO:
      colorClass = 'bg-slate-800 text-white border-slate-800 dark:bg-slate-700 dark:border-slate-600';
      break;
    case OrderStatus.RECUSADO:
    case OrderStatus.CANCELADO:
      colorClass = 'bg-red-50 text-red-700 border-red-200 line-through decoration-red-400 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      break;
    default:
      colorClass = 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-400';
  }

  const sizeClass = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-4 py-1.5'
  };

  return (
    <span className={`inline-flex items-center justify-center rounded-full font-medium border ${colorClass} ${sizeClass[size]}`}>
      {ORDER_STATUS_LABELS[status] || status}
    </span>
  );
};