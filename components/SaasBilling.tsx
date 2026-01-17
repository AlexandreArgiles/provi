import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { SaasBillingStats } from '../types';
import { Card, CardHeader, CardContent } from './ui/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { DollarSign, Users, TrendingUp, CreditCard, AlertTriangle, ShieldAlert } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const SaasBilling: React.FC = () => {
    const [stats, setStats] = useState<SaasBillingStats | null>(null);

    useEffect(() => {
        // Load data on mount
        const data = DataService.getSaaSBillingStats();
        setStats(data);
    }, []);

    if (!stats) return <div className="p-10 text-center">Carregando dados financeiros...</div>;

    const arpu = stats.activeSubscriptions > 0 ? stats.mrr / stats.activeSubscriptions : 0;

    return (
        <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900">Faturamento & Assinaturas</h2>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-blue-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">MRR (Receita Recorrente)</p>
                                <h3 className="text-3xl font-bold mt-2">R$ {stats.mrr.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</h3>
                            </div>
                            <DollarSign className="w-10 h-10 text-blue-300 opacity-50" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 text-sm font-medium">Assinaturas Ativas</p>
                                <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.activeSubscriptions}</h3>
                            </div>
                            <CreditCard className="w-10 h-10 text-slate-200" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 text-sm font-medium">Inadimplentes</p>
                                <h3 className={`text-3xl font-bold mt-2 ${stats.delinquentCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{stats.delinquentCount}</h3>
                            </div>
                            <AlertTriangle className={`w-10 h-10 ${stats.delinquentCount > 0 ? 'text-red-300' : 'text-slate-200'}`} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 text-sm font-medium">Total de Clientes</p>
                                <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.totalCustomers}</h3>
                            </div>
                            <Users className="w-10 h-10 text-purple-500 opacity-20" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader title="Receita por Plano" />
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.revenueByPlan} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} fontSize={12} tickLine={false} />
                                <Tooltip formatter={(val: number) => `R$ ${val.toFixed(2)}`} />
                                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                                    {stats.revenueByPlan.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader title="Distribuição de Clientes" />
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.customersByPlan}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.customersByPlan.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Subscriptions Table */}
            <Card>
                <CardHeader title="Status das Assinaturas" />
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                            <tr>
                                <th className="p-4">Empresa (ID)</th>
                                <th className="p-4">Plano Contratado</th>
                                <th className="p-4">Preço (Recorrente)</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Próx. Vencimento</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {stats.recentSubscriptions.map(sub => {
                                const companies = DataService.getCompanies();
                                const companyName = companies.find(c => c.id === sub.companyId)?.name || 'Empresa Desconhecida';
                                let statusColor = 'bg-green-100 text-green-800';
                                if (sub.status === 'PAST_DUE') statusColor = 'bg-red-100 text-red-800';
                                if (sub.status === 'BLOCKED') statusColor = 'bg-slate-800 text-white';
                                if (sub.status === 'CANCELLED') statusColor = 'bg-slate-100 text-slate-500';

                                return (
                                    <tr key={sub.id} className="hover:bg-slate-50">
                                        <td className="p-4">
                                            <div className="font-medium text-slate-900">{companyName}</div>
                                            <div className="text-xs text-slate-400 font-mono">{sub.companyId}</div>
                                        </td>
                                        <td className="p-4 text-slate-600">{sub.planNameSnapshot}</td>
                                        <td className="p-4 font-bold text-slate-900">R$ {sub.contractedPrice.toFixed(2)}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${statusColor}`}>
                                                {sub.status === 'ACTIVE' ? 'ATIVA' : sub.status === 'PAST_DUE' ? 'EM ATRASO' : sub.status === 'BLOCKED' ? 'BLOQUEADA' : 'CANCELADA'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-500">{new Date(sub.nextBillingDate).toLocaleDateString()}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};