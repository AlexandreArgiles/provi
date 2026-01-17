import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Sale } from '../types';
import { Card } from './ui/Card';
import { Search, ShoppingBag, Calendar } from 'lucide-react';

export const SalesList: React.FC = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setSales(DataService.getSales());
    }, []);

    const filteredSales = sales.filter(s => 
        s.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.includes(searchTerm)
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-900">Histórico de Vendas</h2>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
                        placeholder="Buscar por cliente ou número da venda..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredSales.map(sale => (
                    <Card key={sale.id}>
                        <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                                    <ShoppingBag size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Venda #{sale.id.slice(-6)}</h3>
                                    <p className="text-sm text-slate-500">
                                        Cliente: <span className="font-medium text-slate-700">{sale.customerName || 'Não identificado'}</span>
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1 flex items-center">
                                        <Calendar size={10} className="mr-1" />
                                        {new Date(sale.createdAt).toLocaleDateString()} às {new Date(sale.createdAt).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex-1 md:text-center px-4">
                                <p className="text-xs text-slate-400">Itens</p>
                                <p className="text-sm font-medium text-slate-700">{sale.items.length} produtos</p>
                                <p className="text-xs text-slate-400 truncate max-w-[200px]">{sale.items.map(i => i.name).join(', ')}</p>
                            </div>

                            <div className="text-right min-w-[120px]">
                                <p className="text-xs text-slate-400 uppercase">{sale.paymentMethod}</p>
                                <p className="text-xl font-bold text-slate-900">R$ {sale.totalValue.toFixed(2)}</p>
                            </div>
                        </div>
                    </Card>
                ))}
                 {filteredSales.length === 0 && <p className="text-center text-slate-400 py-10">Nenhuma venda encontrada.</p>}
            </div>
        </div>
    );
};