import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Plan } from '../types';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Edit2, CheckCircle, XCircle, Plus, Save } from 'lucide-react';

export const SaasPlans: React.FC = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Plan>>({});

    useEffect(() => {
        setPlans(DataService.getPlans());
    }, []);

    const handleEdit = (plan: Plan) => {
        setEditForm(plan);
        setIsEditing(plan.id);
    };

    const handleSave = () => {
        if (!editForm.id || !editForm.name) return;
        
        const updatedPlan: Plan = {
            ...editForm as Plan,
            updatedAt: Date.now()
        };

        DataService.savePlan(updatedPlan);
        setPlans(DataService.getPlans());
        setIsEditing(null);
    };

    const toggleStatus = (plan: Plan) => {
        const updated = { ...plan, active: !plan.active };
        DataService.savePlan(updated);
        setPlans(DataService.getPlans());
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Planos de Assinatura</h2>
                    <p className="text-slate-500">Defina preços e limites. Alterações de preço não afetam assinantes antigos.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <Card key={plan.id} className={`border-t-4 ${plan.active ? 'border-t-blue-500' : 'border-t-slate-300 opacity-80'}`}>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                                {plan.active ? (
                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold flex items-center">
                                        <CheckCircle size={12} className="mr-1"/> Ativo
                                    </span>
                                ) : (
                                    <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-full text-xs font-bold flex items-center">
                                        <XCircle size={12} className="mr-1"/> Inativo
                                    </span>
                                )}
                            </div>

                            {isEditing === plan.id ? (
                                <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Preço Mensal (R$)</label>
                                        <input 
                                            type="number" 
                                            className="w-full p-2 border rounded"
                                            value={editForm.monthlyPrice}
                                            onChange={e => setEditForm({...editForm, monthlyPrice: Number(e.target.value)})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Nome</label>
                                        <input 
                                            className="w-full p-2 border rounded"
                                            value={editForm.name}
                                            onChange={e => setEditForm({...editForm, name: e.target.value})}
                                        />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <Button size="sm" onClick={handleSave} className="w-full"><Save size={14} className="mr-1"/> Salvar</Button>
                                        <Button size="sm" variant="secondary" onClick={() => setIsEditing(null)}>Cancelar</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-6">
                                    <span className="text-3xl font-bold text-slate-900">R$ {plan.monthlyPrice.toFixed(2)}</span>
                                    <span className="text-slate-500 text-sm"> / mês</span>
                                </div>
                            )}

                            <div className="space-y-2 mb-6">
                                <p className="text-xs font-bold text-slate-400 uppercase">Limites</p>
                                <ul className="text-sm text-slate-600 space-y-1">
                                    <li>Usuários: <strong>{plan.limits.users === -1 ? 'Ilimitado' : plan.limits.users}</strong></li>
                                    <li>Armazenamento: <strong>{plan.limits.storageGB} GB</strong></li>
                                    <li className="text-xs text-slate-500 italic">{plan.limits.features.join(', ')}</li>
                                </ul>
                            </div>

                            <div className="flex gap-2 border-t border-slate-100 pt-4">
                                <Button 
                                    size="sm" 
                                    variant="secondary" 
                                    className="flex-1"
                                    onClick={() => handleEdit(plan)}
                                >
                                    <Edit2 size={14} className="mr-2" /> Editar Preço
                                </Button>
                                <button 
                                    onClick={() => toggleStatus(plan)}
                                    className={`p-2 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600`}
                                    title={plan.active ? "Desativar" : "Ativar"}
                                >
                                    {plan.active ? <XCircle size={20} /> : <CheckCircle size={20} />}
                                </button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};