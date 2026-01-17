import React from 'react';
import { Lock, Crown } from 'lucide-react';
import { Button } from './ui/Button';

interface UpgradeGateProps {
    title?: string;
    description?: string;
}

export const UpgradeGate: React.FC<UpgradeGateProps> = ({ 
    title = "Funcionalidade Premium", 
    description = "Este módulo não está incluso no seu plano atual. Faça um upgrade para acessar." 
}) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center animate-fade-in">
            <div className="bg-amber-100 p-4 rounded-full mb-6 relative">
                <Lock className="w-12 h-12 text-amber-600" />
                <div className="absolute -top-2 -right-2 bg-gradient-to-br from-yellow-400 to-amber-600 text-white p-1.5 rounded-full shadow-lg">
                    <Crown size={16} />
                </div>
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
            <p className="text-slate-500 max-w-md mb-8">{description}</p>
            
            <div className="grid gap-3 w-full max-w-xs">
                <Button className="w-full bg-gradient-to-r from-slate-900 to-slate-800 shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                    Falar com Consultor
                </Button>
                <Button variant="secondary" className="w-full">
                    Comparar Planos
                </Button>
            </div>
            
            <p className="mt-6 text-xs text-slate-400 uppercase tracking-widest font-semibold">Providencia Enterprise</p>
        </div>
    );
};