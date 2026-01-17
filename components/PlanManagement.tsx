import React, { useState } from 'react';
import { Company, PlanType, AppModule } from '../types';
import { DataService } from '../services/dataService';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Button } from './ui/Button';
import { Check, Shield, ShoppingCart, Zap } from 'lucide-react';

interface PlanManagementProps {
    company: Company;
    isSuperAdmin: boolean;
    onUpdate?: () => void;
}

const PLAN_DEFINITIONS: Record<PlanType, { label: string, modules: AppModule[], price: string, features: string[] }> = {
    'BASIC_ASSISTANCE': {
        label: 'Básico Assistência',
        modules: ['ASSISTANCE'],
        price: 'R$ 99/mês',
        features: ['Ordens de Serviço', 'Gestão de Clientes', 'Checklists Simples']
    },
    'BASIC_SALES': {
        label: 'Básico Vendas',
        modules: ['SALES'],
        price: 'R$ 129/mês',
        features: ['PDV', 'Controle de Estoque', 'Relatórios Financeiros']
    },
    'PRO_FULL': {
        label: 'Providencia PRO',
        modules: ['ASSISTANCE', 'SALES'],
        price: 'R$ 199/mês',
        features: ['Tudo do Básico', 'Múltiplos Técnicos', 'Auditoria Completa']
    },
    'ENTERPRISE': {
        label: 'Enterprise',
        modules: ['ASSISTANCE', 'SALES'],
        price: 'Sob Consulta',
        features: ['API Access', 'SSO', 'SLA Garantido']
    }
};

export const PlanManagement: React.FC<PlanManagementProps> = ({ company, isSuperAdmin, onUpdate }) => {
    const [selectedPlan, setSelectedPlan] = useState<PlanType>(company.planType);
    const [isLoading, setIsLoading] = useState(false);

    const handleSavePlan = () => {
        setIsLoading(true);
        const def = PLAN_DEFINITIONS[selectedPlan];
        
        try {
            DataService.updateCompanyPlan(company.id, selectedPlan, def.modules);
            alert("Plano atualizado com sucesso!");
            if (onUpdate) onUpdate();
        } catch (e) {
            alert("Erro ao atualizar plano.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isSuperAdmin) {
        // Read-only view for Company Admin
        const currentDef = PLAN_DEFINITIONS[company.planType];
        return (
            <Card className="bg-slate-50 border-slate-200">
                <CardHeader title="Seu Plano Atual" />
                <CardContent>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">{currentDef.label}</h2>
                            <p className="text-slate-500">Renova em {company.planExpiresAt ? new Date(company.planExpiresAt).toLocaleDateString() : '30 dias'}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-xl font-bold text-blue-600">{currentDef.price}</span>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <h4 className="font-bold text-sm text-slate-700 uppercase">Módulos Ativos</h4>
                        <div className="flex gap-2">
                            {company.activeModules.includes('ASSISTANCE') && (
                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold flex items-center">
                                    <Shield size={12} className="mr-1"/> Assistência
                                </span>
                            )}
                            {company.activeModules.includes('SALES') && (
                                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold flex items-center">
                                    <ShoppingCart size={12} className="mr-1"/> Vendas
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 border-t border-slate-200 pt-4 text-center">
                        <p className="text-sm text-slate-500 mb-2">Precisa de mais recursos?</p>
                        <Button className="w-full">Fazer Upgrade</Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Super Admin View (Editor)
    return (
        <Card>
            <CardHeader title={`Gerenciar Plano: ${company.name}`} subtitle="Selecione o novo nível de assinatura" />
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {(Object.entries(PLAN_DEFINITIONS) as [PlanType, typeof PLAN_DEFINITIONS[PlanType]][]).map(([key, def]) => (
                        <div 
                            key={key}
                            onClick={() => setSelectedPlan(key)}
                            className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                                selectedPlan === key 
                                ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200' 
                                : 'border-slate-200 hover:border-blue-300'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-sm">{def.label}</span>
                                {selectedPlan === key && <Check size={16} className="text-blue-600" />}
                            </div>
                            <p className="text-xs text-slate-500 mb-3">{def.price}</p>
                            <ul className="space-y-1">
                                {def.features.map((feat, i) => (
                                    <li key={i} className="text-[10px] text-slate-600 flex items-center">
                                        <div className="w-1 h-1 bg-slate-400 rounded-full mr-1.5" />
                                        {feat}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end bg-slate-50 p-4 -m-6 mt-0 border-t border-slate-100 rounded-b-xl">
                    <Button onClick={handleSavePlan} disabled={isLoading || selectedPlan === company.planType}>
                        {isLoading ? 'Salvando...' : 'Atualizar Assinatura'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};