import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { Card, CardContent, CardHeader } from './ui/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Package, Activity, Wrench } from 'lucide-react';

export const FinancialReports: React.FC = () => {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        setStats(DataService.getFinancialStats());
    }, []);

    if (!stats) return <div>Carregando...</div>;

    const kpiData = [
        { label: 'Faturamento Total (Vendas + Serviços)', value: stats.allTime.totalRevenue, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Receita Serviços', value: stats.allTime.serviceRevenue, icon: Wrench, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Lucro Vendas (PDV)', value: stats.allTime.profit, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Margem Média (PDV)', value: ((stats.allTime.profit / stats.allTime.revenue) * 100) || 0, isPercent: true, icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50' },
    ];

    const chartData = [
        { name: 'Este Mês', ReceitaVendas: stats.monthly.revenue, ReceitaServicos: stats.monthly.serviceRevenue },
        { name: 'Esta Semana', ReceitaVendas: stats.weekly.revenue, ReceitaServicos: stats.weekly.serviceRevenue },
    ];

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900">Relatórios Financeiros</h2>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiData.map((kpi, idx) => (
                    <Card key={idx}>
                        <div className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
                                <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>
                                    {kpi.isPercent ? `${kpi.value.toFixed(1)}%` : `R$ ${kpi.value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`}
                                </p>
                            </div>
                            <div className={`p-3 rounded-full ${kpi.bg}`}>
                                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader title="Receita: Vendas vs Serviços" subtitle="Comparativo de origem de faturamento" />
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="ReceitaVendas" name="Vendas (PDV)" fill="#3b82f6" radius={[4,4,0,0]} />
                                    <Bar dataKey="ReceitaServicos" name="Serviços (OS)" fill="#9333ea" radius={[4,4,0,0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader title="Produtos Mais Vendidos" subtitle="Top 5 por volume" />
                    <CardContent>
                        <div className="space-y-4">
                            {stats.topItems.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm">
                                            {idx + 1}
                                        </div>
                                        <span className="font-medium text-slate-800">{item.name}</span>
                                    </div>
                                    <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs">{item.count} un</span>
                                </div>
                            ))}
                            {stats.topItems.length === 0 && <p className="text-center text-slate-400 py-10">Sem vendas registradas</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};