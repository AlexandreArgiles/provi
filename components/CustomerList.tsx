import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Customer, ServiceOrder, User } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Search, UserPlus, Phone, Edit2, Trash2, History, X, Save, FileText, User as UserIcon } from 'lucide-react';
import { StatusBadge } from './ui/StatusBadge';

interface CustomerListProps {
    currentUser: User;
}

export const CustomerList: React.FC<CustomerListProps> = ({ currentUser }) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [selectedHistoryCustomer, setSelectedHistoryCustomer] = useState<Customer | null>(null);
    const [historyOrders, setHistoryOrders] = useState<ServiceOrder[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        document: '',
        notes: ''
    });

    useEffect(() => {
        loadCustomers();
    }, [currentUser]);

    const loadCustomers = () => {
        if (currentUser.companyId) {
            setCustomers(DataService.getCustomers(currentUser.companyId));
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const filteredCustomers = customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        c.document?.includes(searchTerm)
    );

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

    const openHistory = (customer: Customer) => {
        const orders = DataService.getCustomerHistory(customer.id);
        setHistoryOrders(orders);
        setSelectedHistoryCustomer(customer);
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
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
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100">{customer.name}</h3>
                                        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            <Phone size={12} className="mr-1" /> {customer.phone}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 bg-white dark:bg-slate-900 shadow-sm rounded-lg border border-slate-100 dark:border-slate-800 p-1">
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
                            
                            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                                {customer.email && <p className="truncate">Email: {customer.email}</p>}
                                {customer.document && <p>Doc: {customer.document}</p>}
                                <p className="text-xs text-slate-400 mt-2">
                                    Cadastrado em {new Date(customer.createdAt).toLocaleDateString()}
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
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                            <h2 className="font-bold text-slate-900 dark:text-slate-100">{editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}</h2>
                            <button onClick={() => setIsFormOpen(false)}><X className="text-slate-400" /></button>
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

            {/* HISTORY MODAL */}
            {selectedHistoryCustomer && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedHistoryCustomer(null)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-fade-in border-l border-slate-200 dark:border-slate-800">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
                            <div>
                                <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">Histórico de Serviços</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{selectedHistoryCustomer.name}</p>
                            </div>
                            <button onClick={() => setSelectedHistoryCustomer(null)}><X className="text-slate-400" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {historyOrders.length > 0 ? historyOrders.map(order => (
                                <div key={order.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">#{order.id.slice(-6)}</span>
                                        <span className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">{order.device}</h4>
                                    <div className="flex justify-between items-end mt-3">
                                        <StatusBadge status={order.status} size="sm" />
                                        <span className="font-bold text-slate-900 dark:text-slate-100">R$ {order.totalValue.toFixed(2)}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-10 text-slate-400">Nenhum serviço registrado.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};