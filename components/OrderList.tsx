import React, { useState, useEffect, useMemo } from 'react';
import { Card } from './ui/Card';
import { ServiceOrder, OrderStatus, ORDER_STATUS_LABELS } from '../types';
import { DataService } from '../services/dataService';
import { StatusBadge } from './ui/StatusBadge';
import { Smartphone, Laptop, ArrowRight, Lock, Search, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';

interface OrderListProps {
  orders: ServiceOrder[];
  onSelectOrder: (id: string) => void;
  onCreateOrder: () => void;
}

const ITEMS_PER_PAGE = 10; // Defina quantos itens por página

export const OrderList: React.FC<OrderListProps> = ({ orders: initialOrders, onSelectOrder, onCreateOrder }) => {
  const currentUser = DataService.getCurrentUser();
  const canCreate = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN' || currentUser?.functions?.includes('BALCAO');

  // Filtros
  const [quickSearch, setQuickSearch] = useState('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterDevice, setFilterDevice] = useState('');
  const [filterProtocol, setFilterProtocol] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>([]);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredOrders, setFilteredOrders] = useState<ServiceOrder[]>(initialOrders);

  // Efeito de Busca (Debounce)
  useEffect(() => {
      const timer = setTimeout(() => {
          const results = DataService.searchOrders({
              query: quickSearch,
              startDate: startDate || undefined,
              endDate: endDate || undefined,
              device: filterDevice || undefined,
              protocol: filterProtocol || undefined,
              status: selectedStatuses.length > 0 ? selectedStatuses : undefined
          });
          setFilteredOrders(results);
          setCurrentPage(1); // Resetar para a primeira página ao filtrar
      }, 300);
      return () => clearTimeout(timer);
  }, [quickSearch, startDate, endDate, filterDevice, filterProtocol, selectedStatuses, initialOrders]);

  const toggleStatus = (status: OrderStatus) => {
      if (selectedStatuses.includes(status)) {
          setSelectedStatuses(selectedStatuses.filter(s => s !== status));
      } else {
          setSelectedStatuses([...selectedStatuses, status]);
      }
  };

  const clearFilters = () => {
      setQuickSearch('');
      setStartDate('');
      setEndDate('');
      setFilterDevice('');
      setFilterProtocol('');
      setSelectedStatuses([]);
  };

  // Lógica de Paginação (Slice)
  const paginatedOrders = useMemo(() => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      return filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Ordens de Serviço</h2>
        {canCreate ? (
            <button 
              onClick={onCreateOrder}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center"
            >
              + Nova Ordem
            </button>
        ) : (
             <div className="flex items-center text-slate-400 dark:text-slate-500 text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                <Lock size={12} className="mr-1" />
                <span>Apenas Balcão</span>
             </div>
        )}
      </div>

      {/* SEARCH BAR & FILTERS */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex gap-2">
              <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                      type="text"
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                      placeholder="Busca rápida: Cliente, Telefone ou Protocolo..."
                      value={quickSearch}
                      onChange={(e) => setQuickSearch(e.target.value)}
                  />
              </div>
              <Button 
                variant={isAdvancedOpen ? 'primary' : 'secondary'} 
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                className="hidden md:flex whitespace-nowrap"
              >
                  <SlidersHorizontal className="w-4 h-4 mr-2" /> Filtros
              </Button>
          </div>
          
          {isAdvancedOpen && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-fade-in space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-4">
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Período</label>
                          <div className="grid grid-cols-2 gap-2">
                              <input type="date" className="w-full p-2 border rounded text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" value={startDate} onChange={e => setStartDate(e.target.value)} />
                              <input type="date" className="w-full p-2 border rounded text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" value={endDate} onChange={e => setEndDate(e.target.value)} />
                          </div>
                      </div>
                      <div className="md:col-span-3">
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Protocolo</label>
                          <input placeholder="ID Exato" className="w-full p-2 border rounded text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" value={filterProtocol} onChange={e => setFilterProtocol(e.target.value)} />
                      </div>
                      <div className="md:col-span-5">
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Aparelho</label>
                          <input placeholder="Ex: iPhone 12..." className="w-full p-2 border rounded text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" value={filterDevice} onChange={e => setFilterDevice(e.target.value)} />
                      </div>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Status</label>
                      <div className="flex flex-wrap gap-2">
                          {Object.values(OrderStatus).map(status => (
                              <button
                                key={status}
                                onClick={() => toggleStatus(status)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${selectedStatuses.includes(status) ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
                              >
                                  {ORDER_STATUS_LABELS[status]}
                              </button>
                          ))}
                      </div>
                  </div>
                  <div className="flex justify-end">
                      <Button variant="ghost" onClick={clearFilters} size="sm">Limpar Filtros</Button>
                  </div>
              </div>
          )}
      </div>

      {/* LISTA PAGINADA */}
      <div className="grid grid-cols-1 gap-4">
        {paginatedOrders.map(order => (
          <Card key={order.id} className={`group hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer ${order.status === OrderStatus.CANCELADO ? 'opacity-70' : ''}`} onClick={() => onSelectOrder(order.id)}>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${order.status === OrderStatus.CANCELADO ? 'bg-red-50 text-red-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  {order.device && (order.device.toLowerCase().includes('celular') || order.device.toLowerCase().includes('iphone')) ? <Smartphone size={24} /> : <Laptop size={24} />}
                </div>
                <div>
                  <h3 className={`font-semibold ${order.status === OrderStatus.CANCELADO ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-slate-100'}`}>{order.customerName}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{order.device} • <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">#{order.id.slice(-6)}</span></p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <StatusBadge status={order.status} />
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">R$ {order.totalValue.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <ArrowRight className="text-slate-300 group-hover:text-blue-500" size={20} />
              </div>
            </div>
          </Card>
        ))}
        
        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-slate-500">Nenhuma ordem encontrada.</div>
        )}
      </div>

      {/* CONTROLE DE PAGINAÇÃO */}
      {filteredOrders.length > ITEMS_PER_PAGE && (
          <div className="flex justify-center items-center gap-4 pt-4">
              <Button 
                variant="secondary" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
              </Button>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Página {currentPage} de {totalPages}
              </span>
              <Button 
                variant="secondary" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                  Próxima <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
          </div>
      )}
    </div>
  );
};