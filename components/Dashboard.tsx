import React from 'react';
import { Card, CardContent, CardHeader } from './ui/Card';
import { ServiceOrder, OrderStatus } from '../types';
import { StatusBadge } from './ui/StatusBadge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, Clock, CheckCircle, AlertCircle, LucideIcon } from 'lucide-react';

interface DashboardProps {
  orders: ServiceOrder[];
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  textColor: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ orders }) => {
  
  const totalRevenue = orders.reduce((acc, order) => acc + order.totalValue, 0);
  const pendingApprovals = orders.filter(o => o.status === OrderStatus.AGUARDANDO_APROVACAO).length;
  const inProgress = orders.filter(o => o.status === OrderStatus.EM_ANDAMENTO).length;
  const completed = orders.filter(o => o.status === OrderStatus.CONCLUIDO || o.status === OrderStatus.RETIRADO).length;

  // Simple aggregation for chart (mock distribution for MVP visual)
  const data = [
    { name: 'Jan', value: 4000 },
    { name: 'Fev', value: 3000 },
    { name: 'Mar', value: 5500 },
    { name: 'Abr', value: 4500 },
    { name: 'Mai', value: totalRevenue > 0 ? totalRevenue : 6000 },
  ];

  const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, textColor }) => (
    <Card className="flex items-center p-4">
      <div className={`p-3 rounded-full ${color} bg-opacity-10 dark:bg-opacity-20 mr-4`}>
        <Icon className={`w-6 h-6 ${textColor}`} />
      </div>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Faturamento (Mês)" 
          value={`R$ ${totalRevenue.toLocaleString('pt-BR')}`} 
          icon={DollarSign} 
          color="bg-green-100 dark:bg-green-900"
          textColor="text-green-600 dark:text-green-400"
        />
        <StatCard 
          title="Aguardando Aprovação" 
          value={pendingApprovals} 
          icon={Clock} 
          color="bg-amber-100 dark:bg-amber-900"
          textColor="text-amber-600 dark:text-amber-400"
        />
        <StatCard 
          title="Em Bancada" 
          value={inProgress} 
          icon={AlertCircle} 
          color="bg-blue-100 dark:bg-blue-900"
          textColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard 
          title="Concluídos" 
          value={completed} 
          icon={CheckCircle} 
          color="bg-teal-100 dark:bg-teal-900"
          textColor="text-teal-600 dark:text-teal-400" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader title="Receita Recente" subtitle="Visão geral dos últimos 5 meses" />
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#94a3b8" />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val/1000}k`} stroke="#94a3b8" />
                  <Tooltip 
                    cursor={{fill: 'var(--tw-slate-100)'}} // Not ideal for dark, but okay
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#f8fafc' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 4 ? '#3b82f6' : '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Atividades Recentes" />
          <CardContent>
            <div className="space-y-4">
              {orders.length > 0 ? (
                orders.slice(0, 5).map(order => (
                  <div key={order.id} className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{order.customerName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{order.device}</p>
                    </div>
                    <StatusBadge status={order.status} size="sm" />
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 text-center py-4">Sem atividades recentes</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};