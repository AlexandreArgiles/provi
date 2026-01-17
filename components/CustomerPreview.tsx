import React, { useState } from 'react';
import { ServiceOrder, ServiceItem, OrderStatus } from '../types';
import { Check, X, Smartphone, AlertTriangle, ShieldCheck, Info, ThumbsUp } from 'lucide-react';

interface CustomerPreviewProps {
  order: ServiceOrder;
  onSimulateApproval: (updatedItems: ServiceItem[], newStatus: OrderStatus) => void;
  onClose: () => void;
}

export const CustomerPreview: React.FC<CustomerPreviewProps> = ({ order, onSimulateApproval, onClose }) => {
  const [items, setItems] = useState<ServiceItem[]>(order.items);

  const toggleItem = (id: string) => {
    setItems(items.map(item => {
      // Critical items marked as required often cannot be unchecked in real apps, 
      // but here we allow it if not strictly 'required' by logic, 
      // however the UX pattern for 'recommended' is key.
      if (item.id === id && !item.required) {
        return { ...item, approved: !item.approved };
      }
      return item;
    }));
  };

  const totalApproved = items
    .filter(i => i.approved)
    .reduce((acc, i) => acc + i.price, 0);

  const handleFinish = (approved: boolean) => {
    onSimulateApproval(
      items, 
      approved ? OrderStatus.APROVADO : OrderStatus.RECUSADO
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md h-[85vh] rounded-[2rem] overflow-hidden shadow-2xl border-8 border-slate-800 flex flex-col relative">
        {/* Mobile Header Simulation */}
        <div className="bg-slate-800 text-white p-4 text-center text-sm font-medium pt-8">
          Providencia Web View
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          {/* Hero Section */}
          <div className="bg-white p-6 border-b border-slate-100 pb-8">
            <h1 className="text-xl font-bold text-slate-900 mb-1">Olá, {order.customerName.split(' ')[0]}</h1>
            <p className="text-slate-500 text-sm">Diagnóstico: {order.device}</p>
            
            <div className="mt-6 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {order.evidence.map(ev => (
                <div key={ev.id} className="flex-shrink-0 w-32 h-32 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden relative shadow-sm">
                  <img src={ev.url} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1 text-[10px] text-white truncate text-center">
                    {ev.description}
                  </div>
                </div>
              ))}
            </div>
            
            {order.aiSummary && (
               <div className="mt-4 p-4 bg-indigo-50 rounded-lg text-sm text-slate-700 leading-relaxed border border-indigo-100 relative">
                  <div className="absolute -top-3 left-3 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Resumo</div>
                  {order.aiSummary}
               </div>
            )}
          </div>

          {/* Interactive Items */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2 text-green-600" />
                Aprovação
              </h3>
              <span className="text-xs text-slate-400 font-medium">Toque para selecionar</span>
            </div>
            
            <div className="space-y-4">
              {items.map(item => (
                <div 
                  key={item.id}
                  onClick={() => !item.required && toggleItem(item.id)}
                  className={`
                    p-4 rounded-xl border-2 transition-all relative overflow-hidden
                    ${item.required ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}
                    ${item.approved 
                      ? (item.severity === 'critical' ? 'border-red-500 bg-white' : 'border-blue-500 bg-blue-50/30') 
                      : 'border-slate-200 bg-slate-50 opacity-75'
                    }
                  `}
                >
                  {/* Status Strip */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 
                    ${item.severity === 'critical' ? 'bg-red-500' : 'bg-blue-500'}
                  `}></div>

                  <div className="flex justify-between items-start pl-2">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center flex-wrap gap-2">
                         <h4 className={`font-bold text-base ${item.approved ? 'text-slate-900' : 'text-slate-500'}`}>{item.name}</h4>
                         {item.severity === 'critical' && (
                           <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold uppercase flex items-center">
                             <AlertTriangle size={10} className="mr-1"/> Crítico
                           </span>
                         )}
                         {item.severity === 'recommended' && (
                           <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold uppercase flex items-center">
                             <ThumbsUp size={10} className="mr-1"/> Sugerido
                           </span>
                         )}
                      </div>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">{item.description || "Item essencial para funcionamento."}</p>
                    </div>
                    
                    <div className="text-right flex flex-col items-end">
                       <span className={`font-bold text-lg ${item.approved ? 'text-slate-900' : 'text-slate-400'}`}>
                         R$ {item.price}
                       </span>
                       
                       <div className={`mt-3 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors
                          ${item.approved 
                            ? (item.severity === 'critical' ? 'bg-red-500 border-red-500' : 'bg-blue-500 border-blue-500') 
                            : 'border-slate-300 bg-white'}
                       `}>
                          {item.approved && <Check size={18} className="text-white" />}
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-slate-200 p-4 pb-8 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
          <div className="flex justify-between items-end mb-4">
            <div>
              <span className="text-slate-500 text-xs uppercase font-bold tracking-wider">Total Final</span>
            </div>
            <span className="text-3xl font-bold text-slate-900">R$ {totalApproved.toLocaleString('pt-BR')}</span>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
             <button 
                onClick={() => handleFinish(true)}
                className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold text-lg shadow-xl shadow-slate-300 hover:bg-slate-800 transition-transform active:scale-95 flex items-center justify-center"
             >
               Confirmar Aprovação
             </button>
             <button 
               onClick={() => handleFinish(false)}
               className="w-full py-3 text-red-500 font-medium text-sm hover:bg-red-50 rounded-lg transition-colors"
             >
               Não autorizo o serviço
             </button>
          </div>
        </div>

        {/* Simulation Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 bg-white/20 text-white hover:bg-white/40 rounded-full p-1"
          title="Fechar Simulação"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};