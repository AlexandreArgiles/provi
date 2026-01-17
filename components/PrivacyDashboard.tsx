import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { User, PrivacyRequest, SystemAuditLog } from '../types';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Shield, Clock, Trash2, FileText, CheckCircle, AlertTriangle, Play, Lock } from 'lucide-react';

interface PrivacyDashboardProps {
    currentUser: User;
}

export const PrivacyDashboard: React.FC<PrivacyDashboardProps> = ({ currentUser }) => {
    const [stats, setStats] = useState({
        pendingAnonymization: 0,
        totalAnonymized: 0,
        requestsPending: 0
    });
    const [requests, setRequests] = useState<PrivacyRequest[]>([]);
    const [lastJobResult, setLastJobResult] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'overview' | 'requests'>('overview');

    useEffect(() => {
        loadData();
    }, [currentUser]);

    const loadData = () => {
        let users = DataService.getUsers();
        let reqs = DataService.getPrivacyRequests();

        // RBAC: Data Isolation
        if (currentUser.role !== 'SUPER_ADMIN') {
            users = users.filter(u => u.companyId === currentUser.companyId);
            reqs = reqs.filter(r => r.companyId === currentUser.companyId);
        }
        
        // Calculate Stats
        const pending = users.filter(u => u.deletedAt && !u.isAnonymized).length;
        const anonymized = users.filter(u => u.isAnonymized).length;
        const reqPending = reqs.filter(r => r.status === 'PENDING').length;

        setStats({
            pendingAnonymization: pending,
            totalAnonymized: anonymized,
            requestsPending: reqPending
        });
        setRequests(reqs);
    };

    const handleRunComplianceJob = () => {
        const result = DataService.runComplianceJob();
        setLastJobResult(`Job executado. ${result.anonymizedCount} registros anonimizados.`);
        loadData();
    };

    const handleRequestDeletion = () => {
        if(window.confirm("Isso cria uma solicitação formal de exclusão de dados. Confirmar?")) {
            DataService.createPrivacyRequest({
                requesterId: currentUser.id,
                requesterName: currentUser.name,
                companyId: currentUser.companyId || 'SAAS',
                requestType: 'DELETE_ACCOUNT',
                justification: 'Solicitação administrativa manual'
            });
            loadData();
            alert("Solicitação registrada.");
        }
    };

    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
        return <div className="p-8 text-center text-red-500">Acesso restrito ao DPO ou Admin.</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center">
                        <Lock className="mr-2 text-slate-900" /> Privacidade e LGPD
                    </h2>
                    <p className="text-slate-500">Gestão de retenção de dados e direitos dos titulares.</p>
                </div>
                {currentUser.role === 'SUPER_ADMIN' && (
                    <Button onClick={handleRunComplianceJob} className="bg-indigo-600 hover:bg-indigo-700">
                        <Play className="w-4 h-4 mr-2" /> Executar Job de Retenção
                    </Button>
                )}
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white border-l-4 border-l-amber-500">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Aguardando Exclusão</p>
                                <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.pendingAnonymization}</h3>
                                <p className="text-xs text-amber-600 mt-1">Registros em quarentena (90 dias)</p>
                            </div>
                            <Clock className="text-amber-500 opacity-20 w-12 h-12" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-l-green-500">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Total Anonimizado</p>
                                <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.totalAnonymized}</h3>
                                <p className="text-xs text-green-600 mt-1">Conformidade LGPD</p>
                            </div>
                            <Shield className="text-green-500 opacity-20 w-12 h-12" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Solicitações (DSR)</p>
                                <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.requestsPending}</h3>
                                <p className="text-xs text-blue-600 mt-1">Pendentes de análise</p>
                            </div>
                            <FileText className="text-blue-500 opacity-20 w-12 h-12" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {lastJobResult && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {lastJobResult}
                </div>
            )}

            {/* Tabs */}
            <div className="flex space-x-4 border-b border-slate-200">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`pb-2 px-4 font-medium text-sm transition-colors ${activeTab === 'overview' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}
                >
                    Política de Retenção
                </button>
                <button 
                    onClick={() => setActiveTab('requests')}
                    className={`pb-2 px-4 font-medium text-sm transition-colors ${activeTab === 'requests' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}
                >
                    Solicitações de Titulares
                </button>
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader title="Ciclo de Vida dos Dados" subtitle="Regras aplicadas automaticamente pelo sistema" />
                        <CardContent>
                            <ul className="space-y-4">
                                <li className="flex items-start">
                                    <div className="bg-slate-100 p-2 rounded-lg mr-3">
                                        <Trash2 className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">Exclusão Lógica (Soft Delete)</h4>
                                        <p className="text-sm text-slate-500">Dados permanecem ocultos mas recuperáveis por 90 dias após a exclusão.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="bg-slate-100 p-2 rounded-lg mr-3">
                                        <Shield className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">Anonimização Irreversível</h4>
                                        <p className="text-sm text-slate-500">Após 90 dias, dados pessoais (Nome, Email, Avatar) são substituídos por hashes.</p>
                                    </div>
                                </li>
                                <li className="flex items-start">
                                    <div className="bg-slate-100 p-2 rounded-lg mr-3">
                                        <Clock className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">Retenção Legal</h4>
                                        <p className="text-sm text-slate-500">Logs de auditoria e Ordens de Serviço são mantidos por 5 anos para fins fiscais e legais.</p>
                                    </div>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                         <CardHeader title="Ações Manuais" />
                         <CardContent>
                             <p className="text-sm text-slate-500 mb-4">
                                 O sistema executa verificações diárias automaticamente. Use as ações abaixo apenas em casos excepcionais.
                             </p>
                             <div className="space-y-3">
                                 {currentUser.role === 'ADMIN' && (
                                     <Button variant="secondary" className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50" onClick={handleRequestDeletion}>
                                         <AlertTriangle className="w-4 h-4 mr-2" /> Solicitar Exclusão da Minha Conta/Empresa
                                     </Button>
                                 )}
                                 <div className="p-3 bg-slate-50 rounded text-xs text-slate-400">
                                     Todas as ações manuais são auditadas e irreversíveis após o processamento.
                                 </div>
                             </div>
                         </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === 'requests' && (
                <Card>
                    <CardContent className="p-0">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="px-6 py-4">Data</th>
                                    <th className="px-6 py-4">Solicitante</th>
                                    <th className="px-6 py-4">Tipo</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {requests.length > 0 ? requests.map(req => (
                                    <tr key={req.id}>
                                        <td className="px-6 py-4 text-slate-500">
                                            {new Date(req.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {req.requesterName}
                                        </td>
                                        <td className="px-6 py-4">
                                            {req.requestType === 'DELETE_ACCOUNT' ? 'Exclusão de Conta' : 'Exportação'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold 
                                                ${req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 
                                                  req.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-slate-400">
                                            {req.id}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-400">Nenhuma solicitação encontrada.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
