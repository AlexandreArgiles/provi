import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { ServiceOrder, ServiceApproval } from '../types';
import { Button } from './ui/Button';
import { X, Send, Copy, Smartphone, MessageSquare, CheckCircle } from 'lucide-react';

interface WhatsAppModalProps {
    order: ServiceOrder;
    approval?: ServiceApproval;
    mode?: 'APPROVAL_REQUEST' | 'READY_FOR_PICKUP';
    onClose: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ order, approval, mode = 'APPROVAL_REQUEST', onClose }) => {
    const [phone, setPhone] = useState(order.customerPhone);
    const [message, setMessage] = useState('');
    
    // Helper para substituir variáveis
    const formatMessage = (template: string, vars: Record<string, string>) => {
        let msg = template;
        Object.entries(vars).forEach(([key, val]) => {
            msg = msg.replace(new RegExp(`{${key}}`, 'g'), val);
        });
        return msg;
    };

    useEffect(() => {
        const settings = DataService.getSettings();
        const templates = settings.whatsappTemplates || {
            approvalRequest: "Olá {nome_cliente}, orçamento #{id_os} pronto. Valor: R$ {valor}. Link: {link}",
            readyForPickup: "Olá {nome_cliente}, OS #{id_os} pronta para retirada."
        };

        const baseUrl = window.location.origin;
        const link = approval ? `${baseUrl}/?approval_token=${approval.token}` : '';
        const valor = approval ? approval.totalValue.toFixed(2) : order.totalValue.toFixed(2);
        
        const variables = {
            nome_cliente: order.customerName.split(' ')[0],
            id_os: order.id.slice(-6),
            valor: valor,
            link: link,
            nome_empresa: settings.name
        };

        if (mode === 'APPROVAL_REQUEST') {
            setMessage(formatMessage(templates.approvalRequest, variables));
        } else if (mode === 'READY_FOR_PICKUP') {
            setMessage(formatMessage(templates.readyForPickup, variables));
        }
    }, [order, approval, mode]);

    const handleSend = () => {
        if(!phone || !message) return;

        DataService.createWhatsappMessage({
            serviceOrderId: order.id,
            customerPhone: phone,
            messageBody: message,
            status: 'SENT_VIA_LINK',
            provider: 'LINK'
        });

        const link = DataService.generateWhatsAppLink(phone, message);
        window.open(link, '_blank');
        onClose();
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(message);
        alert("Mensagem copiada!");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
                <div className="bg-green-600 p-4 flex justify-between items-center text-white shadow-sm">
                    <h3 className="font-bold flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2" /> Enviar WhatsApp
                    </h3>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full"><X size={20} /></button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone</label>
                        <input 
                            className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mensagem (Editável)</label>
                        <textarea 
                            className="w-full h-40 p-3 border rounded-lg text-sm font-mono bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-green-500"
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                    <Button variant="secondary" onClick={handleCopy}>
                        <Copy className="w-4 h-4 mr-2" /> Copiar
                    </Button>
                    <Button onClick={handleSend} className="bg-green-600 hover:bg-green-700 text-white border-transparent">
                        <Send className="w-4 h-4 mr-2" /> Abrir WhatsApp
                    </Button>
                </div>
            </div>
        </div>
    );
};