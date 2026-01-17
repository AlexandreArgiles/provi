import React, { useState } from 'react';
import { PaymentMethod } from '../types';
import { Button } from './ui/Button';
import { X, DollarSign, CreditCard, Banknote, Landmark, Wallet } from 'lucide-react';

interface PaymentModalProps {
    orderId: string;
    totalAmount: number;
    onConfirm: (amount: number, method: PaymentMethod, notes: string) => void;
    onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ orderId, totalAmount, onConfirm, onClose }) => {
    const [amount, setAmount] = useState(totalAmount.toString());
    const [method, setMethod] = useState<PaymentMethod>('PIX');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            alert("Valor inválido.");
            return;
        }
        onConfirm(numAmount, method, notes);
    };

    const paymentMethods: { id: PaymentMethod, label: string, icon: React.ReactNode }[] = [
        { id: 'PIX', label: 'Pix', icon: <Landmark size={20} /> },
        { id: 'CASH', label: 'Dinheiro', icon: <Banknote size={20} /> },
        { id: 'CREDIT_CARD', label: 'Crédito', icon: <CreditCard size={20} /> },
        { id: 'DEBIT_CARD', label: 'Débito', icon: <CreditCard size={20} /> },
        { id: 'TRANSFER', label: 'TED/DOC', icon: <Landmark size={20} /> },
        { id: 'OTHER', label: 'Outro', icon: <Wallet size={20} /> },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                    <h3 className="font-bold flex items-center">
                        <DollarSign className="w-5 h-5 mr-2" /> Registrar Pagamento
                    </h3>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Valor do Pagamento (R$)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                            <input 
                                type="number"
                                step="0.01"
                                className="w-full pl-10 p-3 border-2 border-blue-100 rounded-xl text-2xl font-bold text-slate-800 bg-white focus:border-blue-500 outline-none"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Forma de Pagamento</label>
                        <div className="grid grid-cols-2 gap-2">
                            {paymentMethods.map(pm => (
                                <div 
                                    key={pm.id}
                                    onClick={() => setMethod(pm.id)}
                                    className={`
                                        cursor-pointer flex items-center p-3 rounded-lg border-2 transition-all
                                        ${method === pm.id 
                                            ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                            : 'border-slate-100 hover:border-slate-300 text-slate-600'}
                                    `}
                                >
                                    <div className="mr-3">{pm.icon}</div>
                                    <span className="text-sm font-medium">{pm.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observações (Opcional)</label>
                        <input 
                            className="w-full p-2 border rounded-lg text-sm"
                            placeholder="Ex: Cliente pediu nota fiscal..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="pt-2">
                        <Button type="submit" className="w-full h-12 text-lg bg-green-600 hover:bg-green-700">
                            Confirmar Recebimento
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};