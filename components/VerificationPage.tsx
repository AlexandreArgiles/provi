import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { PublicVerificationResult } from '../types';
import { CheckCircle, XCircle, ShieldCheck, Search, Clock, Hash, AlertTriangle, ArrowLeft } from 'lucide-react';

interface VerificationPageProps {
    hash: string;
    onClose?: () => void;
}

// Common container with optional Back button
const Wrapper: React.FC<{ children: React.ReactNode; onClose?: () => void }> = ({ children, onClose }) => (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:py-10">
        {onClose && (
            <button 
                onClick={onClose} 
                className="fixed top-4 left-4 z-50 bg-white p-2 rounded-full shadow-md text-slate-600 hover:text-slate-900 flex items-center gap-2 px-4 font-bold text-sm"
            >
                <ArrowLeft size={16} /> Voltar ao Sistema
            </button>
        )}
        {children}
    </div>
);

export const VerificationPage: React.FC<VerificationPageProps> = ({ hash, onClose }) => {
    const [result, setResult] = useState<PublicVerificationResult | { isValid: false } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        // Simulate Network Delay for realism
        setTimeout(() => {
            const data = DataService.verifyDocument(hash);
            setResult(data);
            setIsLoading(false);
        }, 1000);
    }, [hash]);

    if (isLoading) {
        return (
            <Wrapper onClose={onClose}>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mb-4"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Verificando integridade na blockchain...</p>
                </div>
            </Wrapper>
        );
    }

    if (!result || !result.isValid) {
        return (
            <Wrapper onClose={onClose}>
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 text-center border-t-8 border-red-500">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-10 h-10 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Documento Inválido</h1>
                        <p className="text-slate-600 mb-6">
                            O código de verificação informado não corresponde a nenhum registro autêntico em nossa base de dados.
                        </p>
                        <div className="bg-slate-100 p-3 rounded-lg font-mono text-xs break-all text-slate-500">
                            HASH: {hash}
                        </div>
                        <p className="text-xs text-slate-400 mt-4">
                            Se você acredita que isso é um erro, contate a empresa emissora.
                        </p>
                    </div>
                </div>
            </Wrapper>
        );
    }

    // SUCCESS VIEW
    const validData = result as PublicVerificationResult;

    return (
        <Wrapper onClose={onClose}>
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                {/* Header */}
                <div className="bg-green-600 p-6 text-center text-white">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-xl font-bold">Documento Autêntico</h1>
                    <p className="text-green-100 text-sm mt-1">Verificação realizada com sucesso.</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    
                    {/* Issuer Info */}
                    <div className="flex items-start gap-4">
                        <div className="bg-blue-50 p-2 rounded-lg">
                            <ShieldCheck className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Emissor</p>
                            <h3 className="font-bold text-slate-900">{validData.companyName}</h3>
                            {validData.companyCnpj && <p className="text-xs text-slate-500">CNPJ: {validData.companyCnpj}</p>}
                        </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Document Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Protocolo OS</p>
                            <p className="font-mono text-sm bg-slate-100 px-2 py-1 rounded inline-block">{validData.osProtocol}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Valor Aprovado</p>
                            <p className="font-bold text-slate-900">R$ {validData.totalValue.toFixed(2)}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Data da Assinatura</p>
                            <div className="flex items-center text-sm text-slate-700">
                                <Clock className="w-4 h-4 mr-2 text-slate-400" />
                                {new Date(validData.approvedAt).toLocaleDateString()} às {new Date(validData.approvedAt).toLocaleTimeString()}
                            </div>
                        </div>
                        <div className="col-span-2">
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Cliente (Parcial)</p>
                            <p className="text-sm text-slate-700">{validData.customerFirstName} *** (Ocultado por Privacidade)</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center text-slate-500 text-xs font-mono break-all">
                            <Hash className="w-4 h-4 mr-2 flex-shrink-0" />
                            {validData.hash}
                        </div>
                    </div>

                    <div className="flex items-start gap-2 text-[10px] text-slate-400 leading-relaxed bg-amber-50 p-3 rounded text-amber-800/70 border border-amber-100">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <p>
                            Este sistema confirma apenas que o documento foi emitido pela plataforma Providencia e não sofreu alterações desde a assinatura. A responsabilidade pelo serviço é da empresa emissora.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                    <p className="text-xs text-slate-400 font-bold tracking-wider">PROVIDENCIA SECURITY</p>
                </div>
            </div>
        </Wrapper>
    );
};