import React from 'react';
import { Card } from './ui/Card';
import { DataService } from '../services/dataService';
import { OrderStatus } from '../types';
import { useTheme } from '../contexts/ThemeContext'; // Importar o contexto
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Users, Wrench, AlertCircle, DollarSign, CheckCircle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { preference } = useTheme();
  
  // Lógica para detectar se está escuro (para pintar os gráficos)
  const isDark = preference === 'dark' || (preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const chartTextColor = isDark ? '#94a3b8' : '#64748b'; // Slate 400 (escuro) ou Slate 500 (claro)
  const tooltipStyle = {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      color: isDark ? '#f8fafc' : '#0f172a',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
  };

  const orders = DataService.getOrders();
  const customers = DataService.getCustomers('c1'); // Exemplo fixo, ideal pegar do user
  const financials = DataService.getFinancialStats();

  // Stats Calculations
  const activeOrders = orders.filter(o => ![OrderStatus.CONCLUIDO, OrderStatus.CANCELADO, OrderStatus.RETIRADO].includes(o.status)).length;
  const pendingApprovals = orders.filter(o => o.status === OrderStatus.AGUARDANDO_APROVACAO).length;
  const revenueMonth = financials.monthly.revenue;
  const completedMonth = orders.filter(o => o.status === OrderStatus.CONCLUIDO && new Date(o.createdAt).getMonth() === new Date().getMonth()).length;

  // Chart Data Preparation
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.keys(statusCounts).map(status => ({
    name: status.replace(/_/g, ' '),
    value: statusCounts[status]
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('pt-BR').slice(0, 5);
    const count = orders.filter(o => new Date(o.createdAt).toLocaleDateString('pt-BR').slice(0, 5) === dateStr).length;
    return { date: dateStr, count };
  }).reverse();

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Visão Geral</h2>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none">
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 text-xs font-medium uppercase">Ordens Ativas</p>
                <h3 className="text-3xl font-bold mt-1">{activeOrders}</h3>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <Wrench className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-none">
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-amber-100 text-xs font-medium uppercase">Aprovações Pendentes</p>
                <h3 className="text-3xl font-bold mt-1">{pendingApprovals}</h3>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-none">
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-100 text-xs font-medium uppercase">Faturamento (Mês)</p>
                <h3 className="text-2xl font-bold mt-1">R$ {revenueMonth.toLocaleString('pt-BR', { notation: "compact" })}</h3>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
           <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Clientes Totais</p>
                <h3 className="text-3xl font-bold mt-1 text-slate-900 dark:text-slate-100">{customers.length}</h3>
              </div>
              <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <Users className="w-6 h-6 text-slate-500 dark:text-slate-300" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card className="min-h-[300px] flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" /> Volume Semanal
                </h3>
            </div>
            <div className="flex-1 p-4 w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={last7Days}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
                        <XAxis 
                            dataKey="date" 
                            stroke={chartTextColor} 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                        />
                        <YAxis 
                            stroke={chartTextColor} 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                        />
                        <RechartsTooltip 
                            contentStyle={tooltipStyle}
                            cursor={{fill: isDark ? '#334155' : '#f1f5f9', opacity: 0.4}}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>

        {/* Pie Chart */}
        <Card className="min-h-[300px] flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" /> Distribuição por Status
                </h3>
            </div>
            <div className="flex-1 p-4 w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={isDark ? '#1e293b' : '#fff'} strokeWidth={2} />
                            ))}
                        </Pie>
                        <RechartsTooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{fontSize: '12px', color: chartTextColor}} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>
      </div>
    </div>
  );
};