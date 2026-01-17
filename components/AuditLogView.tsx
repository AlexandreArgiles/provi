import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { SystemAuditLog, User } from '../types';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Shield, Search, Eye, Filter, Calendar, User as UserIcon, Building, Activity, X } from 'lucide-react';

interface AuditLogViewProps {
    currentUser: User;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ currentUser }) => {
    const [logs, setLogs] = useState<SystemAuditLog[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<SystemAuditLog[]>([]);
    const [selectedLog, setSelectedLog] = useState<SystemAuditLog | null>(null);

    // Filters
    const [filterAction, setFilterAction] = useState('');
    const [filterUser, setFilterUser] = useState('');
    const [filterEntity, setFilterEntity] = useState('ALL');

    useEffect(() => {
        loadLogs();
    }, [currentUser]);

    useEffect(() => {
        applyFilters();
    }, [filterAction, filterUser, filterEntity, logs]);

    const loadLogs = () => {
        const allLogs = DataService.getSystemAuditLogs();
        
        // RBAC: Security Filtering
        let visibleLogs = allLogs;
        if (currentUser.role === 'SUPER_ADMIN') {
            // Sees all
            visibleLogs = allLogs;
        } else if (currentUser.role === 'ADMIN') {
            // Sees only logs related to their company OR performed by users of their company
            // Since we store companyId on the log, it makes it easier.
            visibleLogs = allLogs.filter(l => l.companyId === currentUser.companyId);
        } else {
            // Employees shouldn't see this view, but if they do, show nothing or only own actions
            visibleLogs = []; 
        }

        setLogs(visibleLogs);
    };

    const applyFilters = () => {
        let result = logs;

        if (filterAction) {
            result = result.filter(l => l.action.toLowerCase().includes(filterAction.toLowerCase()));
        }
        if (filterUser) {
            result = result.filter(l => l.performedBy.toLowerCase().includes(filterUser.toLowerCase()));
        }
        if (filterEntity !== 'ALL') {
            result = result.filter(l => l.entityType === filterEntity);
        }

        setFilteredLogs(result);
    };

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleString('pt-BR', { 
            day: '2-digit', month: '2-digit', year: 'numeric', 
            hour: '2-digit', minute: '2-digit', second: '2-digit' 
        });
    };

    const getActionColor = (action: string) => {
        if (action.includes('DELETE') || action.includes('BLOCK')) return 'text-red-600 bg-red-50';
        if (action.includes('CREATE')) return 'text-green-600 bg-green-50';
        if (action.includes('LOGIN')) return 'text-blue-600 bg-blue-50';
        return 'text-slate-600 bg-slate-50';
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center">
                        <Shield className="mr-2 text-slate-900" /> Auditoria do Sistema
                    </h2>
                    <p className="text-slate-500">Rastreamento completo de ações para conformidade e segurança.</p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input 
                                placeholder="Filtrar por Ação..." 
                                className="w-full pl-9 p-2 border rounded-lg text-sm"
                                value={filterAction}
                                onChange={e => setFilterAction(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input 
                                placeholder="Quem realizou..." 
                                className="w-full pl-9 p-2 border rounded-lg text-sm"
                                value={filterUser}
                                onChange={e => setFilterUser(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <select 
                                className="w-full pl-9 p-2 border rounded-lg text-sm bg-white"
                                value={filterEntity}
                                onChange={e => setFilterEntity(e.target.value)}
                            >
                                <option value="ALL">Todas Entidades</option>
                                <option value="USER">Usuários</option>
                                <option value="AUTH">Autenticação</option>
                                <option value="COMPANY">Empresas</option>
                                <option value="ORDER">Ordens</option>
                                <option value="SETTINGS">Configurações</option>
                            </select>
                        </div>
                        <div className="flex items-center justify-end text-sm text-slate-500">
                           <span className="font-bold mr-1">{filteredLogs.length}</span> registros encontrados
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                            <tr>
                                <th className="px-6 py-4">Data/Hora</th>
                                <th className="px-6 py-4">Ação</th>
                                <th className="px-6 py-4">Usuário</th>
                                <th className="px-6 py-4">Detalhes</th>
                                <th className="px-6 py-4 text-right">Dados</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLogs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap font-mono text-xs">
                                        {formatDate(log.timestamp)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-900">{log.performedBy}</span>
                                            <span className="text-[10px] text-slate-400">{log.performedByRole}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={log.details}>
                                        {log.details}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {log.changes && (
                                            <Button size="sm" variant="ghost" onClick={() => setSelectedLog(log)}>
                                                <Eye className="w-4 h-4 mr-1" /> Ver Diff
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        Nenhum registro de auditoria encontrado com os filtros atuais.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Diff Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <Activity size={18} /> Detalhes do Registro
                                </h3>
                                <p className="text-xs text-slate-400 font-mono mt-1">ID: {selectedLog.id} • IP: {selectedLog.ipAddress || 'N/A'}</p>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                            <div className="mb-6 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                                <h4 className="text-sm font-bold text-slate-500 uppercase mb-2">Resumo da Ação</h4>
                                <p className="text-lg text-slate-900">{selectedLog.details}</p>
                                <div className="mt-2 flex gap-4 text-sm text-slate-600">
                                    <span><strong>Entidade:</strong> {selectedLog.entityType}</span>
                                    <span><strong>ID Entidade:</strong> {selectedLog.entityId}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                                    <h4 className="text-sm font-bold text-red-700 mb-3 flex items-center">
                                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                                        DADOS ANTERIORES (BEFORE)
                                    </h4>
                                    <pre className="text-xs font-mono text-red-900 overflow-auto whitespace-pre-wrap">
                                        {selectedLog.changes?.before ? JSON.stringify(selectedLog.changes.before, null, 2) : 'N/A (Criação ou sem dados prévios)'}
                                    </pre>
                                </div>
                                <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                                    <h4 className="text-sm font-bold text-green-700 mb-3 flex items-center">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                        DADOS NOVOS (AFTER)
                                    </h4>
                                    <pre className="text-xs font-mono text-green-900 overflow-auto whitespace-pre-wrap">
                                        {selectedLog.changes?.after ? JSON.stringify(selectedLog.changes.after, null, 2) : 'N/A (Exclusão)'}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
                            <Button onClick={() => setSelectedLog(null)}>Fechar Visualização</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};