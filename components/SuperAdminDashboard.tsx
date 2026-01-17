import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { User, Company } from '../types';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Button } from './ui/Button';
import { 
  Building2, Users, Activity, Server, 
  AlertTriangle, CheckCircle2, Search, ArrowUpRight, 
  Plus, CreditCard, Edit2, Lock, Unlock, Trash2, ArrowLeft, Layers, Shield
} from 'lucide-react';
import { PlanManagement } from './PlanManagement';
import { UserManagement } from './UserManagement';
import { SaasPlans } from './SaasPlans';

interface SuperAdminDashboardProps {
  user: User;
  onLogout: () => void;
  onNavigate?: (view: any) => void;
}

type DashboardView = 'DASHBOARD' | 'MANAGE_USERS' | 'MANAGE_SUB_PLAN' | 'MANAGE_GLOBAL_PLANS';

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ user, onLogout }) => {
  // Estado de Visualização (Navegação Interna)
  const [currentView, setCurrentView] = useState<DashboardView>('DASHBOARD');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  
  // Dados
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState({ totalCompanies: 0, activeCompanies: 0, blockedCompanies: 0, totalUsers: 0, mrr: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Formulário de Empresa
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [compName, setCompName] = useState('');
  const [compDoc, setCompDoc] = useState(''); // CNPJ
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    const allCompanies = DataService.getCompanies().filter(c => !c.deletedAt);
    const active = allCompanies.filter(c => c.active && c.subscriptionStatus !== 'BLOCKED').length;
    const blocked = allCompanies.filter(c => !c.active || c.subscriptionStatus === 'BLOCKED').length;
    const mrr = allCompanies.reduce((acc, curr) => {
        const price = curr.planType === 'ENTERPRISE' ? 499 : curr.planType?.includes('PRO') ? 199 : 99;
        return acc + price;
    }, 0);

    setCompanies(allCompanies);
    setStats({
      totalCompanies: allCompanies.length,
      activeCompanies: active,
      blockedCompanies: blocked,
      totalUsers: allCompanies.reduce((acc, c) => acc + (c.userCount || 0), 0),
      mrr: mrr
    });
  };

  const handleCreateOrUpdateCompany = () => {
        if (!compName) return alert("Nome da empresa é obrigatório");

        if (editingCompany) {
            const updated = { ...editingCompany, name: compName, document: compDoc };
            DataService.saveCompany(updated);
            alert("Empresa atualizada!");
        } else {
            if (!adminName || !adminEmail) return alert("Dados do admin obrigatórios");
            
            const newCompany: Company = {
                id: Date.now().toString(),
                name: compName,
                document: compDoc, // CNPJ Salvo
                active: true,
                createdAt: new Date().toISOString(),
                userCount: 1,
                planType: 'BASIC_ASSISTANCE',
                activeModules: ['ASSISTANCE'],
                subscriptionStatus: 'ACTIVE'
            };
            DataService.saveCompany(newCompany);
            
            const newAdmin: User = {
                id: Date.now().toString() + 'u',
                name: adminName,
                email: adminEmail,
                role: 'ADMIN',
                functions: ['BALCAO', 'BANCADA'],
                companyId: newCompany.id,
                active: true,
                mustChangePassword: true
            };
            DataService.saveUser(newAdmin);
            alert("Empresa e Admin criados com sucesso!");
        }

        loadDashboardData();
        setShowNewCompanyForm(false);
        setEditingCompany(null);
        setCompName(''); setCompDoc(''); setAdminName(''); setAdminEmail('');
  };

  const handleDelete = (id: string) => {
      if(window.confirm('Tem certeza? Isso inativará o acesso desta empresa.')) {
          DataService.deleteCompany(id);
          loadDashboardData();
      }
  };

  const toggleStatus = (company: Company) => {
      const updated = { ...company, active: !company.active, subscriptionStatus: company.active ? 'BLOCKED' : 'ACTIVE' };
      DataService.saveCompany(updated as Company);
      loadDashboardData();
  };

  const startEdit = (c: Company) => {
      setEditingCompany(c);
      setCompName(c.name);
      setCompDoc(c.document || '');
      setShowNewCompanyForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- ACTIONS DE NAVEGAÇÃO ---
  const openUserManagement = (companyId: string) => {
      setSelectedCompanyId(companyId);
      setCurrentView('MANAGE_USERS');
  };

  const openPlanSubscription = (companyId: string) => {
      setSelectedCompanyId(companyId);
      setCurrentView('MANAGE_SUB_PLAN');
  };

  const backToDashboard = () => {
      setCurrentView('DASHBOARD');
      setSelectedCompanyId(null);
      loadDashboardData(); // Recarrega dados ao voltar
  };

  // --- RENDERIZADORES DE SUB-TELAS ---

  if (currentView === 'MANAGE_USERS' && selectedCompanyId) {
      const company = companies.find(c => c.id === selectedCompanyId);
      return (
          <div className="p-6 md:p-8 max-w-7xl mx-auto pb-32 animate-fade-in">
              <div className="flex items-center gap-4 mb-6">
                <Button onClick={backToDashboard} variant="ghost">
                    <ArrowLeft className="mr-2" size={20} /> Voltar
                </Button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Gerenciar Equipe</h2>
                    <p className="text-slate-500">Empresa: {company?.name} (ID: {selectedCompanyId})</p>
                </div>
              </div>
              <UserManagement currentUser={user} targetCompanyId={selectedCompanyId} />
          </div>
      );
  }

  if (currentView === 'MANAGE_SUB_PLAN' && selectedCompanyId) {
      const company = companies.find(c => c.id === selectedCompanyId);
      if (!company) return null;
      return (
          <div className="p-6 md:p-8 max-w-5xl mx-auto pb-32 animate-fade-in">
              <Button onClick={backToDashboard} variant="ghost" className="mb-4">
                  <ArrowLeft className="mr-2" size={20} /> Voltar ao Dashboard
              </Button>
              <PlanManagement 
                company={company} 
                isSuperAdmin={true} 
                onUpdate={() => {
                    alert("Plano atualizado!");
                    backToDashboard();
                }} 
              />
          </div>
      );
  }

  if (currentView === 'MANAGE_GLOBAL_PLANS') {
      return (
          <div className="p-6 md:p-8 max-w-6xl mx-auto pb-32 animate-fade-in">
              <Button onClick={backToDashboard} variant="ghost" className="mb-4">
                  <ArrowLeft className="mr-2" size={20} /> Voltar ao Dashboard
              </Button>
              <SaasPlans />
          </div>
      );
  }

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.document && c.document.includes(searchTerm))
  );

  // --- DASHBOARD PRINCIPAL ---
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 pb-32 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Painel Mestre
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Controle total do ecossistema SaaS.
          </p>
        </div>
        <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => setCurrentView('MANAGE_GLOBAL_PLANS')}>
                <Layers size={16} className="mr-2"/> Editar Preços/Planos
            </Button>
            <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold flex items-center border border-emerald-500/20">
                <Activity size={14} className="mr-2" /> Online
            </div>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 bg-white dark:bg-slate-900">
          <CardContent className="p-6">
            <p className="text-xs font-bold text-slate-500 uppercase">MRR Estimado</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">R$ {stats.mrr}</h3>
            <div className="mt-2 text-xs text-emerald-600 flex items-center"><ArrowUpRight size={14} className="mr-1"/> +5% esse mês</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-indigo-500 bg-white dark:bg-slate-900">
          <CardContent className="p-6">
            <p className="text-xs font-bold text-slate-500 uppercase">Total Empresas</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalCompanies}</h3>
            <div className="mt-2 text-xs text-slate-400">{stats.activeCompanies} Ativas / {stats.blockedCompanies} Bloq.</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500 bg-white dark:bg-slate-900">
            <CardContent className="p-6">
                <p className="text-xs font-bold text-slate-500 uppercase">Total Usuários</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.totalUsers}</h3>
            </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500 bg-white dark:bg-slate-900">
            <CardContent className="p-6">
                <p className="text-xs font-bold text-slate-500 uppercase">Saúde do Server</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">99.9%</h3>
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* TABELA DE EMPRESAS */}
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader 
                    title="Empresas (Tenants)" 
                    action={
                        <Button onClick={() => { setEditingCompany(null); setCompName(''); setCompDoc(''); setShowNewCompanyForm(!showNewCompanyForm); }}>
                            <Plus size={16} className="mr-2" /> Nova Empresa
                        </Button>
                    }
                />
                
                {/* FORM DE NOVA EMPRESA */}
                {showNewCompanyForm && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-6 animate-fade-in">
                        <h4 className="font-bold text-slate-800 dark:text-white mb-4">{editingCompany ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}</h4>
                        <div className="grid grid-cols-1 gap-4 mb-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input 
                                    placeholder="Nome da Empresa" 
                                    className="p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                    value={compName}
                                    onChange={e => setCompName(e.target.value)}
                                />
                                <input 
                                    placeholder="CNPJ (Documento)" 
                                    className="p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                    value={compDoc}
                                    onChange={e => setCompDoc(e.target.value)}
                                />
                            </div>
                            {!editingCompany && (
                                <div className="grid grid-cols-2 gap-4">
                                    <input 
                                        placeholder="Nome do Admin" 
                                        className="p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                        value={adminName}
                                        onChange={e => setAdminName(e.target.value)}
                                    />
                                    <input 
                                        placeholder="Email do Admin" 
                                        className="p-2 border rounded dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                                        value={adminEmail}
                                        onChange={e => setAdminEmail(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setShowNewCompanyForm(false)}>Cancelar</Button>
                            <Button onClick={handleCreateOrUpdateCompany}>
                                {editingCompany ? 'Salvar Alterações' : 'Criar Empresa'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* FILTRO */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Buscar empresa por nome ou CNPJ..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Empresa</th>
                                <th className="px-6 py-4">Plano</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredCompanies.map((company) => (
                                <tr key={company.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900 dark:text-white">{company.name}</div>
                                        <div className="text-xs text-slate-400 font-mono">{company.document || 'Sem CNPJ'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs px-2 py-1 rounded">
                                            {company.planType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {company.active ? 
                                            <span className="text-emerald-600 flex items-center text-xs font-bold"><CheckCircle2 size={12} className="mr-1"/> Ativo</span> : 
                                            <span className="text-red-500 flex items-center text-xs font-bold"><AlertTriangle size={12} className="mr-1"/> Bloqueado</span>
                                        }
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openPlanSubscription(company.id)} className="p-2 text-slate-400 hover:text-blue-600 bg-slate-100 dark:bg-slate-800 rounded" title="Alterar Plano">
                                            <CreditCard size={16} />
                                        </button>
                                        <button onClick={() => openUserManagement(company.id)} className="p-2 text-slate-400 hover:text-purple-600 bg-slate-100 dark:bg-slate-800 rounded" title="Gerenciar Equipe/Usuários">
                                            <Users size={16} />
                                        </button>
                                        <button onClick={() => startEdit(company)} className="p-2 text-slate-400 hover:text-amber-600 bg-slate-100 dark:bg-slate-800 rounded" title="Editar Dados">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => toggleStatus(company)} className={`p-2 rounded ${company.active ? 'text-slate-400 hover:text-red-600' : 'text-emerald-600 bg-emerald-100'}`} title={company.active ? "Bloquear" : "Ativar"}>
                                            {company.active ? <Lock size={16} /> : <Unlock size={16} />}
                                        </button>
                                        <button onClick={() => handleDelete(company.id)} className="p-2 text-slate-400 hover:text-red-600 bg-slate-100 dark:bg-slate-800 rounded" title="Excluir">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>

        {/* COLUNA DIREITA (Atalhos e Status) */}
        <div className="space-y-6">
            <Card className="bg-slate-900 text-white border-slate-800">
                <CardHeader title="Atalhos Administrativos" className="border-slate-800" />
                <CardContent className="space-y-3">
                   <Button 
                        variant="secondary" 
                        className="w-full justify-start hover:bg-slate-700 border-slate-700 text-slate-200"
                        onClick={() => { setShowNewCompanyForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                   >
                        <Building2 size={16} className="mr-2" /> Cadastrar Nova Empresa
                   </Button>
                   <Button 
                        variant="secondary" 
                        className="w-full justify-start hover:bg-slate-700 border-slate-700 text-slate-200"
                        onClick={() => setCurrentView('MANAGE_GLOBAL_PLANS')}
                   >
                        <Layers size={16} className="mr-2" /> Gerenciar Planos (Preços)
                   </Button>
                   <Button 
                        variant="secondary" 
                        className="w-full justify-start hover:bg-slate-700 border-slate-700 text-slate-200"
                        onClick={() => alert("Use o botão 'Equipe' na tabela ao lado para gerenciar usuários de uma empresa específica.")}
                   >
                        <Users size={16} className="mr-2" /> Usuários (Via Tabela)
                   </Button>
                </CardContent>
            </Card>

            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2">Modo Super Admin</h4>
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    Você tem permissão total. Use o botão <strong><Users size={10} className="inline"/> Equipe</strong> na tabela para resetar senhas ou adicionar usuários a uma empresa específica.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};