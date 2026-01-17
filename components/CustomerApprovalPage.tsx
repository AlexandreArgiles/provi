import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { generateApprovalReceipt } from '../services/pdfService';
import { ServiceApproval, OrderStatus, Company } from '../types';
import { ShieldCheck, Check, X, Lock, FileText, PenTool, Download, MessageSquare, ScrollText } from 'lucide-react';
import { SignaturePad } from './ui/SignaturePad';

interface CustomerApprovalPageProps {
    token: string;
    onClose: () => void; // Used to simulate "closing" the public view in this demo
}

export const CustomerApprovalPage: React.FC<CustomerApprovalPageProps> = ({ token, onClose }) => {
    const [approval, setApproval] = useState<ServiceApproval | null>(null);
    const [orderData, setOrderData] = useState<any>(null); // Simplified order data
    const [company, setCompany] = useState<Company | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Step Control
    const [isSigning, setIsSigning] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    
    // Form State
    const [signedName, setSignedName] = useState('');
    const [signatureImage, setSignatureImage] = useState<string | null>(null);
    const [agreedTerms, setAgreedTerms] = useState(false);

    useEffect(() => {
        // Simulate Network Fetch
        setTimeout(() => {
            const app = DataService.getApprovalByToken(token);
            if (app) {
                setApproval(app);
                // Fetch context data (in real app, this would be a join in backend)
                const order = DataService.getOrderById(app.serviceOrderId);
                const companies = DataService.getCompanies();
                const comp = companies.find(c => c.id === app.companyId);
                
                setOrderData(order);
                setCompany(comp || null);
            }
            setIsLoading(false);
        }, 800);
    }, [token]);

    const handleReject = () => {
        if (!approval) return;
        const reason = prompt("Gostaria de informar o motivo da recusa? (Opcional)") || '';
        DataService.processApprovalDecision(approval.token, 'REJECTED', reason);
        setApproval({ ...approval, status: 'REJECTED' });
    };

    const handleConfirmSignature = async () => {
        if (!approval || !signatureImage || !signedName.trim() || !agreedTerms || !company || !orderData) return;

        setIsLoading(true);

        // 1. Save Signature first to get ID
        const signature = DataService.saveSignature({
            serviceApprovalId: approval.id,
            signatureImage: signatureImage,
            signedName: signedName,
            confirmationChecked: agreedTerms,
            ipAddress: '192.168.1.1', // Mock IP
            userAgent: navigator.userAgent
        });

        // 2. Pre-calculate Hash for PDF (Critical for QR Code)
        // We generate it here so we can put it in the PDF before saving the approval decision
        const verificationHash = DataService.generateVerificationHash(approval, signature.id);

        // 3. Generate Receipt PDF with the Hash
        // Important: Get the Full Settings (including Logo/CNPJ)
        const settings = DataService.getSettings(); 
        
        const companyContext = {
            ...company,
            ...settings 
        };

        const receiptUrl = await generateApprovalReceipt(
            orderData, 
            {
                ...approval, 
                respondedAt: Date.now(),
                verificationHash: verificationHash // INJECT HASH HERE
            }, 
            signature, 
            companyContext,
            settings.address
        );

        // 4. Process Approval with Signature Link & Receipt
        // The service will recalculate/verify the hash internally or we could pass it, 
        // but since logic is deterministic, it matches.
        DataService.processApprovalDecision(approval.token, 'APPROVED', undefined, signature.id, receiptUrl);
        
        // 5. Create WhatsApp Notification (Sent to Customer via DataService)
        const link = `https://providencia.app/receipt/${approval.id}`;
        DataService.createWhatsappMessage({
            serviceOrderId: orderData.id,
            customerPhone: orderData.customerPhone,
            messageBody: `Olá ${orderData.customerName.split(' ')[0]}, sua autorização foi registrada. Baixe seu comprovante: ${link}`,
            status: 'SENT_VIA_LINK',
            provider: 'LINK'
        });

        // 6. Update UI
        setApproval({ ...approval, status: 'APPROVED', receiptUrl: receiptUrl, verificationHash: verificationHash });
        setIsSigning(false);
        setIsSuccess(true);
        setIsLoading(false);
    };

    const handleDownloadReceipt = () => {
        if (approval?.receiptUrl) {
            const link = document.createElement('a');
            link.href = approval.receiptUrl;
            link.download = `comprovante_aprovacao_${orderData.id}.pdf`;
            link.click();
        }
    };

    const getWarrantyTerms = () => {
        const settings = DataService.getSettings();
        return settings.warrantyTerms || "Garantia legal de 90 dias sobre os serviços prestados.";
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-slate-500 text-sm">Processando...</p>
            </div>
        );
    }

    if (!approval || !orderData) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
                <div>
                    <Lock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-800">Link Inválido ou Expirado</h2>
                    <p className="text-slate-500 mt-2">Por favor, entre em contato com a assistência.</p>
                    <button onClick={onClose} className="mt-6 text-blue-600 underline">Voltar (Demo)</button>
                </div>
            </div>
        );
    }

    // SUCCESS SCREEN
    if (isSuccess) {
        return (
            <div className="min-h-screen bg-slate-100 font-sans flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 text-center animate-fade-in">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Tudo Certo!</h1>
                    <p className="text-slate-600 mb-8">
                        Sua autorização foi registrada com sucesso. A equipe técnica já foi notificada.
                    </p>

                    <div className="space-y-3">
                        <button 
                            onClick={handleDownloadReceipt}
                            className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold shadow-lg hover:bg-slate-800 transition-colors flex items-center justify-center"
                        >
                            <Download className="w-5 h-5 mr-3" /> Baixar Comprovante
                        </button>
                        
                        <p className="text-xs text-slate-400 mt-4">
                            Uma cópia do comprovante também está disponível via link seguro.
                        </p>
                    </div>
                    
                    <button onClick={onClose} className="mt-8 text-sm text-slate-500 hover:text-slate-800">
                        Voltar ao início
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 font-sans pb-20">
            {/* Trust Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-green-100 p-1.5 rounded-full">
                            <Lock className="w-3 h-3 text-green-700" />
                        </div>
                        <span className="text-xs font-bold text-green-700 uppercase tracking-wider">Ambiente Seguro</span>
                    </div>
                    {/* Demo Close Button */}
                    <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600">Fechar Demo</button>
                </div>
            </div>

            <div className="max-w-md mx-auto p-4 space-y-6">
                
                {/* Hero / Company Info */}
                <div className="text-center py-4">
                    {/* Show Logo in the approval page header if available (Getting from DataService for consistent preview) */}
                    {DataService.getSettings().logoUrl ? (
                        <img src={DataService.getSettings().logoUrl} className="h-16 mx-auto mb-2 object-contain" alt="Logo" />
                    ) : null}
                    
                    <h1 className="text-2xl font-bold text-slate-900">{company?.name || 'Assistência Técnica'}</h1>
                    <p className="text-slate-500 text-sm mt-1">Ordem de Serviço #{orderData.id.slice(-6)}</p>
                </div>

                {/* Status Banner */}
                {approval.status !== 'PENDING' && (
                    <div className={`p-4 rounded-xl border-2 text-center ${approval.status === 'APPROVED' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                        {approval.status === 'APPROVED' ? (
                            <>
                                <Check className="w-8 h-8 mx-auto mb-2" />
                                <h3 className="font-bold text-lg">Serviço Aprovado!</h3>
                                <p className="text-sm opacity-80">Aceite registrado com sucesso.</p>
                                {approval.receiptUrl && (
                                    <button 
                                        onClick={() => { const link = document.createElement('a'); link.href = approval.receiptUrl!; link.download='comprovante.pdf'; link.click(); }}
                                        className="mt-3 text-xs bg-white border border-green-200 px-3 py-1.5 rounded-lg font-bold hover:bg-green-50 inline-flex items-center"
                                    >
                                        <Download className="w-3 h-3 mr-1"/> Baixar Comprovante
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <X className="w-8 h-8 mx-auto mb-2" />
                                <h3 className="font-bold text-lg">Orçamento Recusado</h3>
                                <p className="text-sm opacity-80">Entendido. Aguarde nosso contato.</p>
                            </>
                        )}
                    </div>
                )}

                {/* SIGNATURE FLOW STEP */}
                {isSigning && approval.status === 'PENDING' ? (
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 animate-fade-in">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <PenTool className="w-6 h-6 text-blue-600" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900">Assinatura Digital</h2>
                            <p className="text-sm text-slate-500">Confirme seu aceite desenhando abaixo.</p>
                        </div>

                        <div className="space-y-4">
                            
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center mb-2">
                                    <FileText size={14} className="mr-1" /> Parecer Técnico
                                </h4>
                                <div className="text-sm text-slate-700 leading-relaxed mb-4 border-b border-slate-200 pb-4">
                                    {approval.description}
                                </div>

                                <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center mb-2">
                                    <ScrollText size={14} className="mr-1" /> Termos de Garantia
                                </h4>
                                <div className="text-xs text-slate-600 max-h-24 overflow-y-auto pr-2 custom-scrollbar">
                                    {getWarrantyTerms()}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                                <input 
                                    className="w-full p-3 border border-slate-300 rounded-lg text-sm"
                                    placeholder="Digite seu nome"
                                    value={signedName}
                                    onChange={(e) => setSignedName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Desenhe sua assinatura</label>
                                <SignaturePad onEnd={setSignatureImage} />
                            </div>

                            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="mt-1 w-4 h-4 text-blue-600 rounded"
                                    checked={agreedTerms}
                                    onChange={(e) => setAgreedTerms(e.target.checked)}
                                />
                                <span className="text-xs text-slate-600 leading-relaxed">
                                    Declaro que li e concordo com os termos de garantia, autorizo a execução do serviço no valor de <strong>R$ {approval.totalValue.toFixed(2)}</strong>.
                                </span>
                            </label>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button 
                                    onClick={() => setIsSigning(false)}
                                    className="py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm"
                                >
                                    Voltar
                                </button>
                                <button 
                                    onClick={handleConfirmSignature}
                                    disabled={!signedName || !signatureImage || !agreedTerms}
                                    className="py-3 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    // STANDARD VIEW
                    <>
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="bg-blue-600 p-4 text-white">
                                <h2 className="font-bold flex items-center">
                                    <FileText className="w-5 h-5 mr-2" /> Laudo Técnico
                                </h2>
                            </div>
                            <div className="p-5">
                                <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap">
                                    {approval.description}
                                </p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 ml-2">Evidências</h3>
                            <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
                                {orderData.evidence.length > 0 ? orderData.evidence.map((ev: any) => (
                                    <div key={ev.id} className="snap-center shrink-0 w-48 h-48 bg-slate-200 rounded-xl overflow-hidden relative shadow-md">
                                        <img src={ev.url} className="w-full h-full object-cover" />
                                        <div className="absolute bottom-0 w-full bg-black/60 p-2 text-white text-[10px] text-center">
                                            {ev.description}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="w-full p-4 text-center text-slate-400 bg-slate-200 rounded-xl border border-slate-300 border-dashed">
                                        Sem fotos anexadas.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                            <h3 className="text-sm font-bold text-slate-900 mb-4">Custos</h3>
                            <div className="space-y-3">
                                {approval.itemsSnapshot.map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-start py-2 border-b border-slate-50 last:border-0">
                                        <div>
                                            <p className="font-medium text-slate-800 text-sm">{item.name}</p>
                                            <p className="text-xs text-slate-500">{item.severity === 'critical' ? 'Item Crítico' : 'Sugerido'}</p>
                                        </div>
                                        <span className="font-bold text-slate-900 text-sm">R$ {item.price.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-end">
                                <span className="text-slate-500 text-sm">Total Geral</span>
                                <span className="text-3xl font-bold text-slate-900">R$ {approval.totalValue.toFixed(2)}</span>
                            </div>
                        </div>
                    </>
                )}

                {/* Legal Disclaimer */}
                {!isSigning && (
                    <p className="text-[10px] text-slate-400 text-center px-4 leading-relaxed">
                        Ao aprovar, você concorda com os termos de serviço da {company?.name}. 
                        Endereço IP e dados do dispositivo serão registrados.
                    </p>
                )}

            </div>

            {/* Sticky Action Footer */}
            {!isSigning && approval.status === 'PENDING' && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
                    <div className="max-w-md mx-auto grid grid-cols-2 gap-3">
                        <button 
                            onClick={handleReject}
                            className="w-full py-3.5 rounded-xl border border-red-200 text-red-600 font-bold text-sm active:bg-red-50 transition-colors"
                        >
                            Recusar
                        </button>
                        <button 
                            onClick={() => setIsSigning(true)}
                            className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-lg shadow-slate-300 active:scale-95 transition-transform flex items-center justify-center"
                        >
                            <ShieldCheck className="w-4 h-4 mr-2" /> Aprovar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};