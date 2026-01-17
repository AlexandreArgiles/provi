import React, { useState, useEffect, useRef } from 'react';
import { Customer, ServiceOrder, OrderStatus, User } from '../types';
import { DataService } from '../services/dataService';
import { Button } from './ui/Button';
import { X, Search, UserPlus, Phone, Smartphone, User as UserIcon, AlertCircle, Loader2 } from 'lucide-react';

interface CreateOrderModalProps {
    currentUser: User;
    onClose: () => void;
    onCreate: (newOrder: ServiceOrder) => void;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ currentUser, onClose, onCreate }) => {
    // Form State
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [device, setDevice] = useState('');
    
    // Autocomplete State
    const [suggestions, setSuggestions] = useState<Customer[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close suggestions on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setCustomerName(val);
        setSelectedCustomerId(null); // Reset selection if typing

        if (val.length >= 2 && currentUser.companyId) {
            const results = DataService.searchCustomers(val, currentUser.companyId);
            setSuggestions(results);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSelectCustomer = (customer: Customer) => {
        setCustomerName(customer.name);
        setCustomerPhone(customer.phone);
        setSelectedCustomerId(customer.id);
        setShowSuggestions(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerName || !customerPhone || !device) return;

        setIsCreating(true);

        try {
            let finalCustomerId = selectedCustomerId;
            const companyId = currentUser.companyId || 'c1'; // Fallback for SAAS Admin testing

            // 1. Check if customer exists by phone if not selected from list
            if (!finalCustomerId) {
                const existingByPhone = DataService.findCustomerByPhone(customerPhone, companyId);
                
                if (existingByPhone) {
                    finalCustomerId = existingByPhone.id;
                    // Optional: Update name if changed? For now, we respect the record.
                } else {
                    // 2. Create New Customer
                    const newCustomer: Customer = {
                        id: Date.now().toString() + 'c',
                        companyId: companyId,
                        name: customerName,
                        phone: customerPhone,
                        active: true,
                        createdAt: Date.now()
                    };
                    DataService.saveCustomer(newCustomer);
                    finalCustomerId = newCustomer.id;
                }
            }

            // 3. Create Order
            const newOrder: ServiceOrder = {
                id: Date.now().toString(),
                companyId: companyId, // SECURITY: Tenant Isolation
                customerId: finalCustomerId,
                customerName: customerName,
                customerPhone: customerPhone,
                device: device,
                status: OrderStatus.DRAFT,
                items: [],
                evidence: [],
                checklist: [],
                auditLog: [
                    { id: Date.now().toString(), action: 'Ordem criada', timestamp: Date.now(), actorName: currentUser.name }
                ],
                technicalNotes: '',
                totalValue: 0,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                technicianId: currentUser.id
            };

            // Simulate slight delay for UX
            setTimeout(() => {
                onCreate(newOrder); // Parent handles saving and navigation
                setIsCreating(false);
            }, 600);

        } catch (error) {
            console.error(error);
            setIsCreating(false);
            alert("Erro ao criar ordem.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Nova Ordem de Serviço</h2>
                        <p className="text-xs text-slate-500">Fluxo rápido de balcão</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Customer Name with Autocomplete */}
                        <div className="relative" ref={wrapperRef}>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Cliente <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input 
                                    type="text"
                                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                    placeholder="Digite para buscar ou criar..."
                                    value={customerName}
                                    onChange={handleNameChange}
                                    autoFocus
                                    required
                                />
                                {selectedCustomerId && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs font-bold flex items-center">
                                        Existente
                                    </div>
                                )}
                            </div>

                            {/* Autocomplete Dropdown */}
                            {showSuggestions && suggestions.length > 0 && (
                                <ul className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto">
                                    {suggestions.map(customer => (
                                        <li 
                                            key={customer.id}
                                            onClick={() => handleSelectCustomer(customer)}
                                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0"
                                        >
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{customer.name}</p>
                                                <p className="text-xs text-slate-400">{customer.phone}</p>
                                            </div>
                                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">Selecionar</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            
                            {/* "New Customer" Hint */}
                            {!selectedCustomerId && customerName.length > 2 && !showSuggestions && (
                                <div className="absolute right-0 -bottom-5 text-[10px] text-slate-400 flex items-center">
                                    <UserPlus size={10} className="mr-1" /> Novo cliente será criado automaticamente
                                </div>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp / Telefone <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input 
                                    type="tel"
                                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="(11) 99999-9999"
                                    value={customerPhone}
                                    onChange={e => setCustomerPhone(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Device */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Equipamento / Modelo <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input 
                                    type="text"
                                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ex: iPhone 13 Pro, Notebook Dell..."
                                    value={device}
                                    onChange={e => setDevice(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button 
                                type="submit" 
                                className="w-full h-12 text-lg shadow-lg shadow-blue-200"
                                disabled={isCreating}
                            >
                                {isCreating ? (
                                    <><Loader2 className="animate-spin mr-2" /> Criando Ordem...</>
                                ) : (
                                    'Iniciar Atendimento'
                                )}
                            </Button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};