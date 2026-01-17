import React, { useState } from 'react';
import { ServiceOrder, ServiceItem, OrderStatus } from '../types';
import { DataService } from '../services/dataService';
import { Button } from './ui/Button';
import { X, Send, CheckCircle, Smartphone, AlertTriangle, FileText } from 'lucide-react';

interface RequestApprovalModalProps {
    order: ServiceOrder;
    onClose: () => void;
    onSuccess: () => void;
}

export const RequestApprovalModal: React.FC<RequestApprovalModalProps> = ({ order, onClose, onSuccess }) => {
    const [step, setStep] = useState<'REVIEW' | 'DETAILS' | 'READY'>('REVIEW');
    const [selectedItems, setSelectedItems] = useState<string[]>(order.items.map(i => i.id));
    const [manualDescription, setManualDescription] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');
    const [token, setToken] = useState('');

    const totalValue = order.items
        .filter(i => selectedItems.includes(i.id))
        .reduce((acc, i) => acc + i.price, 0);

    const handleNext = () => {
        setStep('DETAILS');
    };

    const handleGenerate = async () => {
        if(!manualDescription.trim()) return;

        // 1. Filter Items
        const activeItems = order.items.filter(i => selectedItems.includes(i.id));

        // 2. Create Approval Record with Manual Description
        const approval = DataService.createApprovalRequest(order.id, activeItems, manualDescription);
        
        // 3. Update Order Status
        const updatedOrder: ServiceOrder = { 
            ...order, 
            status: OrderStatus.AGUARDANDO_APROVACAO, 
            statusHistory: [
                {
                    from: order.status,
                    to: OrderStatus.AGUARDANDO_APROVACAO,
                    timestamp: Date.now(),
                    changedBy: 'SYSTEM',
                    changedByName: 'Sistema (Solicitação Manual)',
                    reason: 'Link gerado com descrição técnica'
                },
                ...(order.statusHistory || [])
            ]
        };
        DataService.saveOrder(updatedOrder);

        setToken(approval.token);
        setGeneratedLink(`https://providencia.app/approval/${approval.token}`);
        setStep('READY');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Solicitar Aprovação</h2>
                        <p className="text-xs text-slate-500">Enviar link seguro para {order.customerName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {step === 'REVIEW' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start">
                                <Smartphone className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-blue-900">1. Revisão do Orçamento</p>
                                    <p className="text-xs text-blue-700 mt-1">Confirme os itens que farão parte desta solicitação.</p>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {order.items.map(item => (
                                    <label key={item.id} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                                        <div className="flex items-center">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedItems.includes(item.id)}
                                                onChange={() => {
                                                    if(selectedItems.includes(item.id)) setSelectedItems(selectedItems.filter(id => id !== item.id));
                                                    else setSelectedItems([...selectedItems, item.id]);
                                                }}
                                                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                            />
                                            <span className="ml-3 text-sm font-medium text-slate-700">{item.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-slate-900">R$ {item.price.toFixed(2)}</span>
                                    </label>
                                ))}
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                                <span className="text-sm text-slate-500 font-bold uppercase">Total da Solicitação</span>
                                <span className="text-2xl font-bold text-slate-900">R$ {totalValue.toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    {step === 'DETAILS' && (
                        <div className="space-y-6">
                            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex items-start">
                                <FileText className="w-5 h-5 text-indigo-600 mr-3 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-indigo-900">2. Justificativa Técnica</p>
                                    <p className="text-xs text-indigo-700 mt-1">Escreva uma explicação clara para o cliente.</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Descrição do Serviço / Problema</label>
                                <textarea 
                                    className="w-full p-3 border border-slate-300 rounded-lg h-40 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    placeholder="Ex: O aparelho apresenta falha na placa principal devido à oxidação. É necessária a desoxidação química e troca do conector de carga para restabelecer o funcionamento."
                                    value={manualDescription}
                                    onChange={(e) => setManualDescription(e.target.value)}
                                    autoFocus
                                />
                                <p className="text-xs text-slate-500 mt-2 text-right">
                                    {manualDescription.length} caracteres
                                </p>
                            </div>

                            <div className="bg-amber-50 p-3 rounded text-xs text-amber-800 border border-amber-100 flex items-center">
                                <AlertTriangle size={14} className="mr-2" />
                                O cliente verá exatamente este texto no link de aprovação.
                            </div>
                        </div>
                    )}

                    {step === 'READY' && (
                        <div className="space-y-6">
                            <div className="text-center py-4">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">Solicitação Criada!</h3>
                                <p className="text-sm text-slate-500">A OS mudou para "Aguardando Aprovação".</p>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Link Seguro</label>
                                <div className="flex gap-2">
                                    <input 
                                        readOnly 
                                        value={generatedLink} 
                                        className="flex-1 p-2 text-xs border rounded bg-slate-100 font-mono text-slate-600 select-all"
                                    />
                                    <Button size="sm" onClick={() => navigator.clipboard.writeText(generatedLink)}>Copiar</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between">
                    {step === 'REVIEW' && (
                        <>
                            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                            <Button onClick={handleNext} disabled={selectedItems.length === 0}>
                                Continuar
                            </Button>
                        </>
                    )}
                    {step === 'DETAILS' && (
                        <>
                            <Button variant="secondary" onClick={() => setStep('REVIEW')}>Voltar</Button>
                            <Button onClick={handleGenerate} disabled={!manualDescription.trim()}>
                                <Send className="w-4 h-4 mr-2" /> Gerar Link
                            </Button>
                        </>
                    )}
                    {step === 'READY' && (
                        <Button className="w-full" onClick={onSuccess}>Concluir</Button>
                    )}
                </div>
            </div>
        </div>
    );
};