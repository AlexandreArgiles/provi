import React, { useState, useEffect } from 'react';
import { Company, User } from '../types';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Button } from './ui/Button';
import { Building, Users, Lock, Unlock, Plus, Activity, LogOut, ArrowLeft, Trash2, Edit2, CreditCard, Layers, PieChart } from 'lucide-react';
import { DataService } from '../services/dataService'; 
import { UserManagement } from './UserManagement'; 
import { PlanManagement } from './PlanManagement';
import { SaasPlans } from './SaasPlans';
import { SaasBilling } from './SaasBilling';

interface SuperAdminDashboardProps {
    user: User;
    onLogout: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ user, onLogout }) => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [showNewCompanyForm, setShowNewCompanyForm] = useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);
    const [managingPlanId, setManagingPlanId] = useState<string | null>(null);
    const [currentTab, setCurrentTab] = useState<'OVERVIEW' | 'PLANS' | 'BILLING'>('OVERVIEW');

    // Form State
    const [compName, setCompName] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');

    useEffect(() => {
        // Load companies from DataService
        setCompanies(DataService.getCompanies().filter(c => !c.deletedAt));
    }, []);

    const activeCompanies = companies.filter(c => c.active).length;
    const totalUsers = companies.reduce((acc, c) => acc + (c.userCount || 0), 0);

    const handleCreateOrUpdateCompany = () => {
        if (editingCompany) {
            // Edit
            const updated = { ...editingCompany, name: compName };
            DataService.saveCompany(updated);
            setCompanies(companies.map(c => c.id === updated.id ? updated : c));
            setEditingCompany(null);
        } else {
            // Create
            const newCompany: Company = {
                id: Date.now().toString(),
                name: compName,
                active: true,
                createdAt: new Date().toISOString(),
                userCount: 1,
                planType: 'BASIC_ASSISTANCE',
                activeModules: ['ASSISTANCE']
            };
            DataService.saveCompany(newCompany);
            setCompanies([newCompany, ...companies]);
            
            // Create Admin User Mock
            const newAdmin: User = {
                id: Date.now().toString() + 'u',
                name: adminName,
                email: adminEmail,
                role: 'ADMIN',
                functions: ['BALCAO', 'BANCADA'],
                companyId: newCompany.id,
                active: true,
                mustChangePassword: true // RULE: Force change
            };
            DataService.saveUser(newAdmin);
        }

        setShowNewCompanyForm(false);
        setCompName('');
        setAdminName('');
        setAdminEmail('');
    };

    const handleDelete = (id: string) => {
        if(window.confirm('ATENÇÃO: Isso excluirá a empresa e TODOS os seus usuários. Continuar?')) {
            DataService.deleteCompany(id);
            setCompanies(companies.filter(c => c.id !== id));
        }
    };

    const toggleStatus = (id: string) => {
        const target = companies.find(c => c.id === id);
        if (target) {
            const updated = { ...target, active: !target.active };
            DataService.saveCompany(updated);
            setCompanies(companies.map(c => c.id === id ? updated : c));
        }
    };

    const startEdit = (company: Company) => {
        setEditingCompany(company);
        setCompName(company.name);
        setShowNewCompanyForm(true);
    };

    // --- DRILL DOWN VIEWS ---
    if (selectedCompanyId) {
        const company = companies.find(c => c.id === selectedCompanyId);
        return (
            <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
                 <header className="bg-slate-900 text-white h-16 flex items-center justify-between px-8 shadow-md">
                    <div className="flex items-center gap-3">
                        <Button onClick={() => setSelectedCompanyId(null)} variant="ghost" className="text-white hover:bg-slate-800">
                             <ArrowLeft className="mr-2" /> Voltar
                        </Button>
                        <div className="border-l border-slate-700 pl-4 ml-2">
                             <h1 className="font-bold text-lg leading-tight">Equipe: {company?.name}</h1>
                             <p className="text-[10px] text-slate-400">ID: {selectedCompanyId}</p>
                        </div>
                    </div>
                </header>
                
                <div className="flex-1 p-8 overflow-y-auto">
                    <UserManagement currentUser={user} targetCompanyId={selectedCompanyId} />
                </div>
            </div>
        );
    }

    if (managingPlanId) {
        const company = companies.find(c => c.id === managingPlanId);
        if(!company) return null;
        return (
            <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
                 <header className="bg-slate-900 text-white h-16 flex items-center justify-between px-8 shadow-md">
                    <div className="flex items-center gap-3">
                        <Button onClick={() => setManagingPlanId(null)} variant="ghost" className="text-white hover:bg-slate-800">
                             <ArrowLeft className="mr-2" /> Voltar
                        </Button>
                        <div className="border-l border-slate-700 pl-4 ml-2">
                             <h1 className="font-bold text-lg leading-tight">Plano: {company?.name}</h1>
                        </div>
                    </div>
                </header>
                
                <div className="flex-1 p-8 overflow-y-auto max-w-5xl mx-auto w-full">
                    <PlanManagement 
                        company={company} 
                        isSuperAdmin={true} 
                        onUpdate={() => {
                            setCompanies(DataService.getCompanies().filter(c => !c.deletedAt));
                            setManagingPlanId(null);
                        }} 
                    />
                </div>
            </div>
        );
    }

    // --- MAIN DASHBOARD VIEW ---
    return (
        <div className="min-h-screen bg-slate-100 font-sans flex">
            {/* Sidebar Navigation */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800">
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <Activity size={24} className="text-blue-500 mr-2" />
                    <div>
                        <h1 className="font-bold text-lg leading-tight">Providencia</h1>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Super Admin</p>
                    </div>
                </div>
                
                <nav className="flex-1 p-4 space-y-2">
                    <button 
                        onClick={() => setCurrentTab('OVERVIEW')}
                        className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${currentTab === 'OVERVIEW' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <Building size={18} className="mr-3" /> Gestão de Tenants
                    </button>
                    <button 
                        onClick={() => setCurrentTab('PLANS')}
                        className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${currentTab === 'PLANS' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <Layers size={18} className="mr-3" /> Planos & Preços
                    </button>
                    <button 
                        onClick={() => setCurrentTab('BILLING')}
                        className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${currentTab === 'BILLING' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <PieChart size={18} className="mr-3" /> Faturamento
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-sm">SA</div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold truncate">{user.name}</p>
                            <p className="text-xs text-slate-500">Root Access</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onLogout} className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-white/10">
                        <LogOut size={16} className="mr-2" /> Sair
                    </Button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto">
                {currentTab === 'PLANS' && (
                    <div className="p-8">
                        <SaasPlans />
                    </div>
                )}

                {currentTab === 'BILLING' && (
                    <div className="p-8">
                        <SaasBilling />
                    </div>
                )}

                {currentTab === 'OVERVIEW' && (
                    <div className="p-8 space-y-8">
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-white border-l-4 border-l-blue-500">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-slate-500 font-medium">Empresas Ativas</p>
                                            <h3 className="text-3xl font-bold text-slate-900 mt-2">{activeCompanies} <span className="text-lg text-slate-400 font-normal">/ {companies.length}</span></h3>
                                        </div>
                                        <Building className="text-blue-500 opacity-20 w-12 h-12" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-white border-l-4 border-l-purple-500">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-slate-500 font-medium">Total de Usuários</p>
                                            <h3 className="text-3xl font-bold text-slate-900 mt-2">{totalUsers}</h3>
                                        </div>
                                        <Users className="text-purple-500 opacity-20 w-12 h-12" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-white border-l-4 border-l-green-500">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-slate-500 font-medium">Status do Sistema</p>
                                            <h3 className="text-3xl font-bold text-green-600 mt-2">100%</h3>
                                            <p className="text-xs text-green-600 mt-1">Uptime</p>
                                        </div>
                                        <Activity className="text-green-500 opacity-20 w-12 h-12" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Companies List */}
                        <Card>
                            <CardHeader 
                                title="Gestão de Empresas (Tenants)" 
                                subtitle="Gerencie o acesso das empresas ao sistema"
                                action={
                                    <Button onClick={() => { setEditingCompany(null); setCompName(''); setShowNewCompanyForm(!showNewCompanyForm); }}>
                                        <Plus size={16} className="mr-2" /> Nova Empresa
                                    </Button>
                                }
                            />
                            
                            {showNewCompanyForm && (
                                <div className="bg-slate-50 border-b border-slate-200 p-6 animate-fade-in">
                                    <h4 className="font-bold text-slate-800 mb-4">{editingCompany ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <input 
                                            placeholder="Nome da Empresa" 
                                            className="p-2 border rounded"
                                            value={compName}
                                            onChange={e => setCompName(e.target.value)}
                                        />
                                        {!editingCompany && (
                                            <>
                                                <input 
                                                    placeholder="Nome do Admin" 
                                                    className="p-2 border rounded"
                                                    value={adminName}
                                                    onChange={e => setAdminName(e.target.value)}
                                                />
                                                <input 
                                                    placeholder="Email do Admin" 
                                                    className="p-2 border rounded"
                                                    value={adminEmail}
                                                    onChange={e => setAdminEmail(e.target.value)}
                                                />
                                            </>
                                        )}
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button variant="secondary" onClick={() => setShowNewCompanyForm(false)}>Cancelar</Button>
                                        <Button onClick={handleCreateOrUpdateCompany}>
                                            {editingCompany ? 'Salvar Alterações' : 'Criar Empresa e Admin'}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <CardContent className="p-0">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                        <tr>
                                            <th className="px-6 py-4">Empresa</th>
                                            <th className="px-6 py-4">Plano Atual</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Usuários</th>
                                            <th className="px-6 py-4 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {companies.map(company => (
                                            <tr key={company.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-slate-800">{company.name}</p>
                                                    <p className="text-xs text-slate-400">ID: {company.id}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-mono bg-slate-200 px-2 py-1 rounded">
                                                        {company.planType || 'BASIC'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {company.active ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            Ativo
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                            Bloqueado
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {company.userCount} usuários
                                                </td>
                                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                    <Button 
                                                        size="sm" 
                                                        variant="secondary"
                                                        onClick={() => setManagingPlanId(company.id)}
                                                        className="text-xs h-8"
                                                        title="Gerenciar Plano"
                                                    >
                                                        <CreditCard size={14} className="mr-2" /> Plano
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="secondary"
                                                        onClick={() => setSelectedCompanyId(company.id)}
                                                        className="text-xs h-8"
                                                    >
                                                        <Users size={14} className="mr-2" /> Equipe
                                                    </Button>
                                                     <button 
                                                        onClick={() => startEdit(company)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 rounded bg-slate-100 hover:bg-blue-50"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => toggleStatus(company.id)}
                                                        className={`p-2 rounded hover:bg-slate-200 transition-colors ${company.active ? 'text-slate-400 hover:text-amber-600' : 'text-green-600 hover:text-green-700 bg-green-50'}`}
                                                        title={company.active ? "Bloquear Empresa" : "Desbloquear Empresa"}
                                                    >
                                                        {company.active ? <Lock size={16} /> : <Unlock size={16} />}
                                                    </button>
                                                     <button 
                                                        onClick={() => handleDelete(company.id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 rounded bg-slate-100 hover:bg-red-50"
                                                        title="Excluir Definitivamente"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>
        </div>
    );
};