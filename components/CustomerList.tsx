import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataService } from '../services/dataService';
import { Customer, ServiceOrder, User, OrderStatus, ORDER_STATUS_LABELS } from '../types';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { 
    Search, UserPlus, Phone, Edit2, Trash2, History, X, Save, 
    User as UserIcon, Calendar, ArrowRight, Package, ArrowLeft, 
    DollarSign, CheckCircle, Clock 
} from 'lucide-react';
import { StatusBadge } from './ui/StatusBadge';

interface CustomerListProps {
    currentUser: User;
}

export const CustomerList: React.FC<CustomerListProps> = ({ currentUser }) => {
    const navigate = useNavigate();
    
    // Main View State
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', document: '', notes: '' });

    // History View State (Full Page Mode)
    const [viewMode, setViewMode] = useState<'LIST' | 'HISTORY'>('LIST');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerOrders, setCustomerOrders] = useState<ServiceOrder[]>([]);
    
    // History Filters
    const [historySearch, setHistorySearch] = useState('');
    const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('ALL');

    useEffect(() => {
        loadCustomers();
    }, [currentUser]);

    const loadCustomers = () => {
        if (currentUser.companyId) {
            setCustomers(DataService.getCustomers(currentUser.companyId));
        }
    };

    // --- ACTIONS ---

    const openHistory = (customer: Customer) => {
        const orders = DataService.getCustomerHistory(customer.id);
        setCustomerOrders(orders);
        setSelectedCustomer(customer);
        setViewMode('HISTORY');
        // Reset filters
        setHistorySearch('');
        setHistoryStatusFilter('ALL');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const backToList = () => {
        setViewMode('LIST');
        setSelectedCustomer(null);
        setCustomerOrders([]);
    };

    const handleNavigateToOrder = (orderId: string) => {
        navigate(`/orders/${orderId}`);
    };

    const handleDelete = (id: string) => {
        if(confirm("Deseja inativar este cliente? O histórico será mantido.")) {
            DataService.deleteCustomer(id);
            loadCustomers();
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.name || !formData.phone) {
            alert("Nome e telefone são obrigatórios.");
            return;
        }

        const customer: Customer = {
            id: editingCustomer ? editingCustomer.id : Date.now().toString(),
            companyId: currentUser.companyId || '',
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            document: formData.document,
            notes: formData.notes,
            active: true,
            createdAt: editingCustomer ? editingCustomer.createdAt : Date.now(),
            updatedAt: Date.now()
        };

        DataService.saveCustomer(customer);
        setIsFormOpen(false);
        loadCustomers();
    };

    const openEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setFormData({
            name: customer.name,
            phone: customer.phone,
            email: customer.email || '',
            document: customer.document || '',
            notes: customer.notes || ''
        });
        setIsFormOpen(true);
    };

    const openNew = () => {
        setEditingCustomer(null);
        setFormData({ name: '', phone: '', email: '', document: '', notes: '' });
        setIsFormOpen(true);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // --- HISTORY FILTERS & STATS ---

    const filteredHistory = useMemo(() => {
        return customerOrders.filter(order => {
            const matchesSearch = 
                order.device.toLowerCase().includes(historySearch.toLowerCase()) || 
                order.id.includes(historySearch);
            
            const matchesStatus = historyStatusFilter === 'ALL' || order.status === historyStatusFilter;

            return matchesSearch && matchesStatus;
        }).sort((a,b) => b.createdAt - a.createdAt);
    }, [customerOrders, historySearch, historyStatusFilter]);

    const customerStats = useMemo(() => {
        const totalSpent = customerOrders.reduce((acc, o) => acc + o.totalValue, 0);
        const completedCount = customerOrders.filter(o => o.status === OrderStatus.CONCLUIDO || o.status === OrderStatus.RETIRADO).length;
        return { totalSpent, completedCount, totalOrders: customerOrders.length };
    }, [customerOrders]);

    const filteredCustomers = useMemo(() => {
        return customers.filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm) ||
            (c.document && c.document.includes(searchTerm))
        );
    }, [customers, searchTerm]);


    // --- VIEW: HISTORY DETAIL ---
    if (viewMode === 'HISTORY' && selectedCustomer) {
        return (
            <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-20">
                {/* Header Navigation */}
                <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                    <Button variant="ghost" onClick={backToList} className="pl-0 hover:bg-transparent hover:text-blue-600">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Voltar para Lista
                    </Button>
                    <div className="h-6 w-px bg-slate-300 dark:bg-slate-700"></div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                            <UserIcon className="w-5 h-5 mr-2 text-slate-500" />
                            {selectedCustomer.name}
                        </h2>
                        <p className="text-xs text-slate-500 flex items-center mt-1">
                            <Phone size={10} className="mr-1"/> {selectedCustomer.phone}
                            <span className="mx-2">•</span>
                            Cadastrado em {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Total Gasto</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">R$ {customerStats.totalSpent.toFixed(2)}</p>
                            </div>
                            <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-lg text-blue-600 dark:text-blue-300">
                                <DollarSign size={20} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase">Serviços Concluídos</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{customerStats.completedCount}</p>
                            </div>
                            <div className="bg-green-100 dark:bg-green-800 p-2 rounded-lg text-green-600 dark:text-green-300">
                                <CheckCircle size={20} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase">Total de Ordens</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{customerStats.totalOrders}</p>
                            </div>
                            <div className="bg-slate-200 dark:bg-slate-700 p-2 rounded-lg text-slate-600 dark:text-slate-300">
                                <History size={20} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters & Content */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50 dark:bg-slate-950">
                        <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center">
                            <History className="w-4 h-4 mr-2" /> Histórico de Ordens
                        </h3>
                        
                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input 
                                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Buscar aparelho ou protocolo..."
                                    value={historySearch}
                                    onChange={e => setHistorySearch(e.target.value)}
                                />
                            </div>
                            <select 
                                className="p-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
                                value={historyStatusFilter}
                                onChange={e => setHistoryStatusFilter(e.target.value)}
                            >
                                <option value="ALL">Todos os Status</option>
                                {Object.values(OrderStatus).map(s => (
                                    <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase text-xs font-bold">
                                <tr>
                                    <th className="px-6 py-3">Protocolo / Data</th>
                                    <th className="px-6 py-3">Aparelho</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Valor</th>
                                    <th className="px-6 py-3 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredHistory.map(order => (
                                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-mono font-bold text-slate-700 dark:text-slate-300">#{order.id.slice(-6)}</div>
                                            <div className="text-xs text-slate-400 flex items-center mt-1">
                                                <Calendar size={10} className="mr-1" />
                                                {new Date(order.createdAt).toLocaleDateString()}
                                                <span className="mx-1"></span>
                                                <Clock size={10} className="mr-1" />
                                                {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900 dark:text-slate-100">{order.device}</div>
                                            <div className="text-xs text-slate-500 flex items-center mt-1">
                                                <Package size={10} className="mr-1" />
                                                {order.items.length} itens
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={order.status} size="sm" />
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">
                                            R$ {order.totalValue.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button 
                                                size="sm" 
                                                variant="secondary" 
                                                onClick={() => handleNavigateToOrder(order.id)}
                                                className="group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-900/30 dark:group-hover:text-blue-400 border-slate-200 dark:border-slate-700"
                                            >
                                                Ver Detalhes <ArrowRight size={14} className="ml-1" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {filteredHistory.length === 0 && (
                            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                    <Search className="w-8 h-8 text-slate-300" />
                                </div>
                                <p>Nenhuma ordem encontrada com os filtros atuais.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW: CUSTOMER LIST (DEFAULT) ---
    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Gestão de Clientes</h2>
                    <p className="text-slate-500 dark:text-slate-400">Base unificada de contatos da empresa.</p>
                </div>
                <Button onClick={openNew}>
                    <UserPlus className="w-4 h-4 mr-2" /> Novo Cliente
                </Button>
            </div>

            {/* SEARCH */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Buscar por nome, telefone ou CPF/CNPJ..."
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </div>
            </div>

            {/* LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCustomers.map(customer => (
                    <Card key={customer.id} className="hover:border-blue-300 dark:hover:border-blue-700 transition-colors group">
                        <div className="p-5 relative">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                                        <UserIcon size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[150px] sm:max-w-[200px]" title={customer.name}>{customer.name}</h3>
                                        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            <Phone size={12} className="mr-1" /> {customer.phone}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity absolute top-4 right-4 bg-white dark:bg-slate-900 shadow-sm rounded-lg border border-slate-100 dark:border-slate-800 p-1">
                                    <button onClick={() => openEdit(customer)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-50 dark:hover:bg-slate-800" title="Editar">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => openHistory(customer)} className="p-1.5 text-slate-400 hover:text-purple-600 rounded hover:bg-slate-50 dark:hover:bg-slate-800" title="Histórico">
                                        <History size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(customer.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-50 dark:hover:bg-slate-800" title="Inativar">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                                {customer.email && <p className="truncate" title={customer.email}>Email: {customer.email}</p>}
                                {customer.document && <p>Doc: {customer.document}</p>}
                                <p className="text-slate-400 mt-2 italic">
                                    Cliente desde {new Date(customer.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </Card>
                ))}
                {filteredCustomers.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        Nenhum cliente encontrado.
                    </div>
                )}
            </div>

            {/* FORM MODAL */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fade-in">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                            <h2 className="font-bold text-slate-900 dark:text-slate-100">{editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}</h2>
                            <button onClick={() => setIsFormOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo *</label>
                                <input className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone / WhatsApp *</label>
                                    <input className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CPF / CNPJ</label>
                                    <input className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" value={formData.document} onChange={e => setFormData({...formData, document: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail</label>
                                <input type="email" className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observações Internas</label>
                                <textarea className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg h-24 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button type="submit"><Save className="w-4 h-4 mr-2" /> Salvar Cliente</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};