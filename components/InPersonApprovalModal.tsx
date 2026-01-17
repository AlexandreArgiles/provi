import React, { useState, useRef } from 'react';
import { ServiceOrder } from '../types';
import { DataService } from '../services/dataService';
import { generateApprovalReceipt, generatePrintableTerm } from '../services/pdfService';
import { Button } from './ui/Button';
import { SignaturePad } from './ui/SignaturePad';
import { X, CheckCircle, ShieldCheck, PenTool, Loader2, Download, Printer, Upload, FileText, ScrollText } from 'lucide-react';

interface InPersonApprovalModalProps {
    order: ServiceOrder;
    onClose: () => void;
    onSuccess: () => void;
}

export const InPersonApprovalModal: React.FC<InPersonApprovalModalProps> = ({ order, onClose, onSuccess }) => {
    const [mode, setMode] = useState<'DIGITAL' | 'PHYSICAL'>('DIGITAL');
    const [step, setStep] = useState<'REVIEW' | 'SIGN' | 'UPLOAD' | 'SUCCESS'>('REVIEW');
    
    // Digital Flow State
    const [signedName, setSignedName] = useState(order.customerName);
    const [signerDocument, setSignerDocument] = useState('');
    const [signatureImage, setSignatureImage] = useState<string | null>(null);
    
    // Physical Flow State
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isProcessing, setIsProcessing] = useState(false);
    const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

    const totalValue = order.items.reduce((acc, i) => acc + i.price, 0);
    const settings = DataService.getSettings();
    const warrantyTerms = settings.warrantyTerms || "Garantia legal de 90 dias sobre os serviços prestados.";

    // --- SHARED HANDLERS ---

    const handleConfirmSignature = async () => {
        if (!signatureImage || !signedName) return;
        setIsProcessing(true);

        try {
            // Register Approval in DataService (Updates Status, Saves Signature)
            const approval = DataService.registerInPersonApproval(
                order.id,
                order.items, 
                {
                    signedName,
                    signatureImage,
                    confirmed: true,
                    document: signerDocument
                }
            );

            // Generate PDF with the real Hash
            const company = DataService.getCompanies().find(c => c.id === order.companyId);
            
            const sigObj = { 
                id: approval.digitalSignatureId!, 
                serviceApprovalId: approval.id, 
                signatureImage, 
                signedName, 
                signedAt: Date.now(),
                confirmationChecked: true
            };

            const url = await generateApprovalReceipt(
                order, 
                approval, 
                sigObj, 
                { ...company, ...settings } as any,
                settings.address
            );

            setReceiptUrl(url);
            setStep('SUCCESS');
            
        } catch (error) {
            console.error(error);
            alert("Erro ao registrar aprovação.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleGeneratePrintable = async () => {
        const company = DataService.getCompanies().find(c => c.id === order.companyId);
        
        const url = await generatePrintableTerm(
            order,
            { ...company, ...settings } as any,
            order.items,
            totalValue,
            settings.address
        );

        const link = document.createElement('a');
        link.href = url;
        link.download = `termo_aprovacao_${order.id}.pdf`;
        link.click();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleConfirmPhysical = () => {
        if (!uploadedFile || !previewUrl) return;
        setIsProcessing(true);

        try {
            DataService.registerPhysicalApproval(
                order.id,
                order.items,
                uploadedFile,
                previewUrl // In real app, upload first then pass URL
            );
            
            // For physical flow, we don't necessarily generate a new receipt PDF, 
            // as the uploaded file IS the receipt.
            setStep('SUCCESS');
        } catch (error) {
            console.error(error);
            alert("Erro ao registrar documento.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = () => {
        if (receiptUrl) {
            const link = document.createElement('a');
            link.href = receiptUrl;
            link.download = `comprovante_${order.id}.pdf`;
            link.click();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
                
                {/* Header */}
                <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <ShieldCheck className="text-green-400" /> Aprovação Presencial
                        </h2>
                        <p className="text-sm text-slate-400">Ordem de Serviço #{order.id.slice(-6)}</p>
                    </div>
                    {step !== 'SUCCESS' && (
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                    )}
                </div>

                {/* Tabs */}
                {step === 'REVIEW' && (
                    <div className="flex border-b border-slate-200">
                        <button 
                            onClick={() => setMode('DIGITAL')}
                            className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${mode === 'DIGITAL' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            Assinatura na Tela
                        </button>
                        <button 
                            onClick={() => setMode('PHYSICAL')}
                            className={`flex-1 py-3 text-sm font-bold text-center transition-colors ${mode === 'PHYSICAL' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            Documento Impresso
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
                    
                    {step === 'REVIEW' && (
                        <div className="space-y-6">
                            <div className="text-center mb-8">
                                <p className="text-slate-500 uppercase text-xs font-bold tracking-widest mb-2">Valor Total do Orçamento</p>
                                <p className="text-5xl font-bold text-slate-900">R$ {totalValue.toFixed(2)}</p>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100 text-slate-500 font-bold uppercase text-xs">
                                        <tr>
                                            <th className="p-3">Serviço / Peça</th>
                                            <th className="p-3 text-right">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {order.items.map(item => (
                                            <tr key={item.id}>
                                                <td className="p-3 font-medium text-slate-700">{item.name}</td>
                                                <td className="p-3 text-right text-slate-900 font-bold">R$ {item.price.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-800 text-sm">
                                <p><strong>Termo de Autorização:</strong></p>
                                <p className="mt-1">
                                    Autorizo a execução dos serviços acima listados no equipamento <strong>{order.device}</strong>. 
                                    Estou ciente dos valores e concordo com os termos de garantia da empresa.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 'SIGN' && mode === 'DIGITAL' && (
                        <div className="space-y-4">
                            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
                                <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center mb-2">
                                    <ScrollText size={14} className="mr-1" /> Termos de Garantia e Condições
                                </h4>
                                <div className="text-sm text-slate-600 max-h-32 overflow-y-auto pr-2 custom-scrollbar bg-slate-50 p-3 rounded-lg">
                                    {warrantyTerms}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Responsável</label>
                                    <input 
                                        className="w-full p-3 border border-slate-300 rounded-lg"
                                        value={signedName}
                                        onChange={e => setSignedName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CPF/RG (Opcional)</label>
                                    <input 
                                        className="w-full p-3 border border-slate-300 rounded-lg"
                                        value={signerDocument}
                                        onChange={e => setSignerDocument(e.target.value)}
                                        placeholder="Para nota fiscal"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                                    <PenTool size={14} /> Assinatura do Cliente
                                </label>
                                <SignaturePad onEnd={setSignatureImage} />
                            </div>
                        </div>
                    )}

                    {step === 'UPLOAD' && mode === 'PHYSICAL' && (
                        <div className="space-y-6">
                            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                                <h3 className="font-bold text-slate-800 mb-2">1. Gerar Documento</h3>
                                <p className="text-sm text-slate-500 mb-4">Imprima o termo para o cliente assinar fisicamente.</p>
                                <Button variant="secondary" onClick={handleGeneratePrintable}>
                                    <Printer className="w-4 h-4 mr-2" /> Gerar Termo de Aprovação
                                </Button>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-slate-200">
                                <h3 className="font-bold text-slate-800 mb-2 text-center">2. Upload do Documento Assinado</h3>
                                <p className="text-sm text-slate-500 mb-4 text-center">Tire uma foto ou escaneie o documento assinado.</p>
                                
                                {!previewUrl ? (
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-slate-300 rounded-lg h-40 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-colors"
                                    >
                                        <Upload className="w-10 h-10 text-slate-400 mb-2" />
                                        <span className="text-sm font-medium text-slate-600">Clique para selecionar arquivo</span>
                                        <input 
                                            ref={fileInputRef}
                                            type="file" 
                                            accept="image/*,application/pdf" 
                                            className="hidden" 
                                            onChange={handleFileUpload}
                                        />
                                    </div>
                                ) : (
                                    <div className="relative h-48 bg-slate-100 rounded-lg overflow-hidden border border-slate-300 flex items-center justify-center">
                                        <img src={previewUrl} className="max-h-full max-w-full object-contain" alt="Preview" />
                                        <button 
                                            onClick={() => { setUploadedFile(null); setPreviewUrl(null); }}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 'SUCCESS' && (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                                <CheckCircle className="w-12 h-12 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Aprovação Registrada!</h2>
                            <p className="text-slate-600 max-w-sm mb-8">
                                O serviço foi autorizado com sucesso. 
                                {mode === 'DIGITAL' ? ' O comprovante digital foi gerado.' : ' O documento físico foi anexado como evidência.'}
                            </p>
                            
                            {receiptUrl && (
                                <Button size="lg" onClick={handleDownload} className="mb-4">
                                    <Download className="w-5 h-5 mr-2" /> Baixar Comprovante (PDF)
                                </Button>
                            )}
                        </div>
                    )}

                </div>

                {step !== 'SUCCESS' && (
                    <div className="p-6 border-t border-slate-200 bg-white flex justify-between gap-4">
                        {step === 'REVIEW' ? (
                            <>
                                <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
                                <Button onClick={() => setStep(mode === 'DIGITAL' ? 'SIGN' : 'UPLOAD')} className="flex-[2] text-lg">
                                    Continuar
                                </Button>
                            </>
                        ) : mode === 'DIGITAL' ? (
                            <>
                                <Button variant="secondary" onClick={() => setStep('REVIEW')} className="flex-1">Voltar</Button>
                                <Button 
                                    onClick={handleConfirmSignature} 
                                    disabled={!signedName || !signatureImage || isProcessing}
                                    className="flex-[2] text-lg bg-green-600 hover:bg-green-700"
                                >
                                    {isProcessing ? <Loader2 className="animate-spin mr-2"/> : <CheckCircle className="mr-2"/>} 
                                    Confirmar Aprovação
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="secondary" onClick={() => setStep('REVIEW')} className="flex-1">Voltar</Button>
                                <Button 
                                    onClick={handleConfirmPhysical} 
                                    disabled={!uploadedFile || isProcessing}
                                    className="flex-[2] text-lg bg-green-600 hover:bg-green-700"
                                >
                                    {isProcessing ? <Loader2 className="animate-spin mr-2"/> : <FileText className="mr-2"/>} 
                                    Registrar Aprovação
                                </Button>
                            </>
                        )}
                    </div>
                )}
                
                {step === 'SUCCESS' && (
                    <div className="p-6 border-t border-slate-200 bg-white">
                        <Button onClick={onSuccess} className="w-full text-lg" variant="secondary">
                            Fechar e Voltar para OS
                        </Button>
                    </div>
                )}

            </div>
        </div>
    );
};