import React, { useState, useEffect, useMemo } from 'react';
import { DataService } from '../services/dataService';
import { ServiceOrder, ServicePayment, User, OrderStatus, ORDER_STATUS_LABELS } from '../types';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { FileText, Download, Filter, Calendar, TrendingUp, AlertTriangle, Users, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { jsPDF } from "jspdf";

interface AssistanceReportsProps {
    currentUser: User;
}

type TabType = 'DASHBOARD' | 'FINANCIAL' | 'STATUS' | 'PRODUCTIVITY' | 'CUSTOMERS';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

export const AssistanceReports: React.FC<AssistanceReportsProps> = ({ currentUser }) => {
    const [activeTab, setActiveTab] = useState<TabType>('DASHBOARD');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // 1st of month
        end: new Date().toISOString().split('T')[0] // Today
    });
    
    // Data State
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [payments, setPayments] = useState<ServicePayment[]>([]);
    const [technicians, setTechnicians] = useState<User[]>([]);

    useEffect(() => {
        // Audit Access
        DataService.addAuditLog('REPORT_ACCESS', 'AUTH', 'ASSISTANCE_REPORTS', 'Acesso aos relatórios gerenciais de assistência');
        loadData();
    }, [currentUser]);

    const loadData = () => {
        // Fetch all orders/payments for calculation (filtering happens in memory for interactivity)
        // In a real API this would be server-side filtered
        const allOrders = DataService.getOrders();
        const allPayments = DataService.getServicePayments();
        const allUsers = DataService.getUsers();

        // Filter by Company (Tenant Isolation)
        const companyOrders = currentUser.role === 'SUPER_ADMIN' ? allOrders : allOrders.filter(o => o.companyId === currentUser.companyId);
        const companyPayments = currentUser.role === 'SUPER_ADMIN' ? allPayments : allPayments.filter(p => p.companyId === currentUser.companyId);
        const companyTechs = currentUser.role === 'SUPER_ADMIN' 
            ? allUsers 
            : allUsers.filter(u => u.companyId === currentUser.companyId && (u.role === 'TECHNICIAN' || u.functions?.includes('BANCADA')));

        setOrders(companyOrders);
        setPayments(companyPayments);
        setTechnicians(companyTechs);
    };

    // --- FILTERS & AGGREGATIONS ---

    const filteredOrders = useMemo(() => {
        const start = new Date(dateRange.start).getTime();
        const end = new Date(dateRange.end).setHours(23, 59, 59, 999);
        return orders.filter(o => o.createdAt >= start && o.createdAt <= end);
    }, [orders, dateRange]);

    const filteredPayments = useMemo(() => {
        const start = new Date(dateRange.start).getTime();
        const end = new Date(dateRange.end).setHours(23, 59, 59, 999);
        return payments.filter(p => p.paidAt >= start && p.paidAt <= end);
    }, [payments, dateRange]);

    // --- DASHBOARD METRICS (Mês Atual vs Geral) ---
    const dashboardMetrics = useMemo(() => {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        
        const monthlyOrders = orders.filter(o => o.createdAt >= firstDayOfMonth);
        const monthlyCompleted = monthlyOrders.filter(o => o.status === OrderStatus.CONCLUIDO).length;
        const monthlyWithdrawn = monthlyOrders.filter(o => o.status === OrderStatus.RETIRADO).length;
        
        // Revenue based on Invoiced (Completed/Withdrawn Orders Total Value)
        const monthlyRevenue = monthlyOrders
            .filter(o => [OrderStatus.CONCLUIDO, OrderStatus.RETIRADO, OrderStatus.PAGO, OrderStatus.AGUARDANDO_PAGAMENTO].includes(o.status))
            .reduce((acc, o) => acc + o.totalValue, 0);

        const activeOrders = orders.filter(o => ![OrderStatus.RETIRADO, OrderStatus.CANCELADO, OrderStatus.RECUSADO].includes(o.status));
        const avgTicket = monthlyRevenue / (monthlyCompleted + monthlyWithdrawn || 1);

        return {
            open: activeOrders.length,
            inProgress: activeOrders.filter(o => o.status === OrderStatus.EM_ANDAMENTO).length,
            waitingClient: activeOrders.filter(o => o.status === OrderStatus.AGUARDANDO_APROVACAO).length,
            completedMonth: monthlyCompleted,
            withdrawnMonth: monthlyWithdrawn,
            revenueMonth: monthlyRevenue,
            avgTicket
        };
    }, [orders]);

    // --- CHARTS DATA ---
    const dailyChartData = useMemo(() => {
        const days = 30;
        const data = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0,0,0,0);
            const ts = d.getTime();
            const nextTs = ts + 86400000;

            const dayOrders = orders.filter(o => o.createdAt >= ts && o.createdAt < nextTs);
            const dayRevenue = dayOrders.reduce((acc, o) => acc + o.totalValue, 0); // Approx: Value created that day

            data.push({
                name: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                qtd: dayOrders.length,
                valor: dayRevenue
            });
        }
        return data;
    }, [orders]);

    const statusChartData = useMemo(() => {
        const counts: Record<string, number> = {};
        orders.forEach(o => {
            // Only active or recently closed
            if (o.status === OrderStatus.CANCELADO) return;
            counts[ORDER_STATUS_LABELS[o.status]] = (counts[ORDER_STATUS_LABELS[o.status]] || 0) + 1;
        });
        return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
    }, [orders]);

    // --- HELPERS ---
    const calculateDaysInStatus = (order: ServiceOrder) => {
        if (!order.statusHistory || order.statusHistory.length === 0) {
            // Fallback to updated at
            const diff = Date.now() - order.updatedAt;
            return Math.floor(diff / (1000 * 60 * 60 * 24));
        }
        // Assuming history is sorted desc
        const lastEntry = order.statusHistory[0]; 
        const diff = Date.now() - lastEntry.timestamp;
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    };

    const handleExportCSV = (filename: string, headers: string[], rows: any[]) => {
        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    const handleExportFinancialPDF = () => {
        const doc = new jsPDF();
        doc.text("Relatório Financeiro de Assistência", 14, 15);
        doc.setFontSize(10);
        doc.text(`Período: ${new Date(dateRange.start).toLocaleDateString()} a ${new Date(dateRange.end).toLocaleDateString()}`, 14, 22);
        
        // Total
        const total = filteredPayments.reduce((acc, p) => acc + p.amount, 0);
        doc.text(`Total Recebido: R$ ${total.toFixed(2)}`, 14, 30);

        let y = 40;
        filteredPayments.forEach((p, i) => {
            if (y > 280) { doc.addPage(); y = 20; }
            const order = orders.find(o => o.id === p.serviceOrderId);
            const line = `${new Date(p.paidAt).toLocaleDateString()} | OS #${p.serviceOrderId.slice(-4)} | ${order?.customerName.slice(0, 20)} | ${p.paymentMethod} | R$ ${p.amount.toFixed(2)}`;
            doc.text(line, 14, y);
            y += 7;
        });

        doc.save("financeiro_assistencia.pdf");
    };

    // --- RENDER CONTENT ---

    const renderDashboard = () => (
        <div className="space-y-6 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4 flex justify-between items-center">
                        <div>
                            <p className="text-sm font-medium text-blue-600">OS Abertas / Ativas</p>
                            <h3 className="text-2xl font-bold text-blue-900">{dashboardMetrics.open}</h3>
                        </div>
                        <FileText className="text-blue-400 w-8 h-8" />
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="p-4 flex justify-between items-center">
                        <div>
                            <p className="text-sm font-medium text-amber-600">Aguardando Cliente</p>
                            <h3 className="text-2xl font-bold text-amber-900">{dashboardMetrics.waitingClient}</h3>
                        </div>
                        <Clock className="text-amber-400 w-8 h-8" />
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4 flex justify-between items-center">
                        <div>
                            <p className="text-sm font-medium text-green-600">Concluídas (Mês)</p>
                            <h3 className="text-2xl font-bold text-green-900">{dashboardMetrics.completedMonth}</h3>
                        </div>
                        <CheckCircle className="text-green-400 w-8 h-8" />
                    </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4 flex justify-between items-center">
                        <div>
                            <p className="text-sm font-medium text-purple-600">Faturamento Est. (Mês)</p>
                            <h3 className="text-2xl font-bold text-purple-900">R$ {dashboardMetrics.revenueMonth.toLocaleString('pt-BR')}</h3>
                        </div>
                        <DollarSign className="text-purple-400 w-8 h-8" />
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader title="Evolução de Entradas (30 dias)" />
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dailyChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Line type="monotone" dataKey="qtd" stroke="#3b82f6" strokeWidth={3} dot={{r: 4}} name="Qtd OS" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader title="Valor Gerado Diário (30 dias)" />
                    <CardContent className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} />
                                <YAxis tickFormatter={(v) => `R$${v}`} />
                                <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                                <Bar dataKey="valor" fill="#10b981" radius={[4, 4, 0, 0]} name="Valor (R$)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    const renderFinancial = () => {
        const totalReceived = filteredPayments.reduce((acc, p) => acc + p.amount, 0);
        const uniqueOS = new Set(filteredPayments.map(p => p.serviceOrderId)).size;
        
        const exportCsv = () => {
            const headers = ['Data', 'OS ID', 'Cliente', 'Forma Pagto', 'Valor', 'Recebido Por'];
            const rows = filteredPayments.map(p => {
                const order = orders.find(o => o.id === p.serviceOrderId);
                return [
                    new Date(p.paidAt).toLocaleDateString(),
                    p.serviceOrderId,
                    order?.customerName || 'N/A',
                    p.paymentMethod,
                    p.amount.toFixed(2),
                    p.receivedBy
                ];
            });
            handleExportCSV('relatorio_financeiro', headers, rows);
        };

        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex gap-4 items-center">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Início</label>
                            <input type="date" className="p-2 border rounded text-sm" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fim</label>
                            <input type="date" className="p-2 border rounded text-sm" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                        </div>
                        <div className="h-10 w-px bg-slate-200 mx-2"></div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold">Total Recebido</p>
                            <p className="text-xl font-bold text-green-600">R$ {totalReceived.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={handleExportFinancialPDF}>
                            <FileText className="w-4 h-4 mr-2" /> PDF
                        </Button>
                        <Button variant="secondary" size="sm" onClick={exportCsv}>
                            <Download className="w-4 h-4 mr-2" /> CSV
                        </Button>
                    </div>
                </div>

                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                                <tr>
                                    <th className="p-4">Data Pagamento</th>
                                    <th className="p-4">Nº OS</th>
                                    <th className="p-4">Cliente</th>
                                    <th className="p-4">Forma</th>
                                    <th className="p-4">Responsável</th>
                                    <th className="p-4 text-right">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredPayments.map(payment => {
                                    const order = orders.find(o => o.id === payment.serviceOrderId);
                                    return (
                                        <tr key={payment.id} className="hover:bg-slate-50">
                                            <td className="p-4 text-slate-600">{new Date(payment.paidAt).toLocaleDateString()} {new Date(payment.paidAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                            <td className="p-4 font-mono text-xs">{payment.serviceOrderId.slice(-6)}</td>
                                            <td className="p-4 font-medium text-slate-900">{order?.customerName || 'Cliente Removido'}</td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600">{payment.paymentMethod}</span>
                                            </td>
                                            <td className="p-4 text-slate-500">{payment.receivedBy}</td>
                                            <td className="p-4 text-right font-bold text-green-700">R$ {payment.amount.toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                                {filteredPayments.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-400">Nenhum pagamento no período selecionado.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        );
    };

    const renderStatus = () => {
        const stalledLimit = 3; // Days
        const stalledOrders = orders.filter(o => {
            const days = calculateDaysInStatus(o);
            return days >= stalledLimit && ![OrderStatus.CONCLUIDO, OrderStatus.RETIRADO, OrderStatus.CANCELADO, OrderStatus.RECUSADO].includes(o.status);
        }).sort((a,b) => calculateDaysInStatus(b) - calculateDaysInStatus(a));

        return (
            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader title="Distribuição por Status" />
                        <CardContent className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statusChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-red-500">
                        <CardHeader 
                            title={`OS Paradas (+${stalledLimit} dias)`} 
                            subtitle="Atenção para gargalos no fluxo"
                            action={<AlertTriangle className="text-red-500" />}
                        />
                        <CardContent className="overflow-y-auto max-h-64 p-0">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-red-50 text-red-700 font-bold text-xs sticky top-0">
                                    <tr>
                                        <th className="p-3">OS</th>
                                        <th className="p-3">Status Atual</th>
                                        <th className="p-3 text-right">Dias Parado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-red-100">
                                    {stalledOrders.map(o => (
                                        <tr key={o.id}>
                                            <td className="p-3">
                                                <div className="font-bold">{o.customerName}</div>
                                                <div className="text-xs text-slate-500">#{o.id.slice(-6)}</div>
                                            </td>
                                            <td className="p-3 text-xs">
                                                <span className="bg-slate-100 px-2 py-1 rounded">{ORDER_STATUS_LABELS[o.status]}</span>
                                            </td>
                                            <td className="p-3 text-right font-bold text-red-600">
                                                {calculateDaysInStatus(o)} dias
                                            </td>
                                        </tr>
                                    ))}
                                    {stalledOrders.length === 0 && (
                                        <tr><td colSpan={3} className="p-4 text-center text-slate-400">Nenhuma OS parada.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    };

    const renderProductivity = () => {
        // Calculate metrics per technician
        const metrics = technicians.map(tech => {
            const techOrders = filteredOrders.filter(o => o.technicianId === tech.id);
            const completed = techOrders.filter(o => o.status === OrderStatus.CONCLUIDO || o.status === OrderStatus.RETIRADO).length;
            const revenue = techOrders.reduce((acc, o) => acc + o.totalValue, 0);
            
            // Avg Time (Creation to Completion) - approximate
            let totalTimeMs = 0;
            let timedCount = 0;
            techOrders.forEach(o => {
                if (o.status === OrderStatus.CONCLUIDO || o.status === OrderStatus.RETIRADO) {
                    // Find completion log? Or just use updatedAt if current status is done
                    totalTimeMs += (o.updatedAt - o.createdAt);
                    timedCount++;
                }
            });
            const avgTimeHours = timedCount > 0 ? (totalTimeMs / timedCount / (1000 * 60 * 60)).toFixed(1) : '-';

            return {
                name: tech.name,
                assigned: techOrders.length,
                completed,
                revenue,
                avgTime: avgTimeHours
            };
        }).sort((a,b) => b.completed - a.completed);

        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Período de Análise</label>
                    <input type="date" className="p-2 border rounded text-sm" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                    <span className="text-slate-400">-</span>
                    <input type="date" className="p-2 border rounded text-sm" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                </div>

                <Card>
                    <CardHeader title="Ranking de Produtividade Técnica" />
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                                <tr>
                                    <th className="p-4">Técnico</th>
                                    <th className="p-4 text-center">OS Atribuídas</th>
                                    <th className="p-4 text-center">Concluídas</th>
                                    <th className="p-4 text-center">Tempo Médio (h)</th>
                                    <th className="p-4 text-right">Valor Gerado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {metrics.map((m, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="p-4 font-bold text-slate-800 flex items-center">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mr-3 ${idx < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {idx + 1}
                                            </div>
                                            {m.name}
                                        </td>
                                        <td className="p-4 text-center">{m.assigned}</td>
                                        <td className="p-4 text-center">
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-bold">{m.completed}</span>
                                        </td>
                                        <td className="p-4 text-center text-slate-600">{m.avgTime}h</td>
                                        <td className="p-4 text-right font-bold text-slate-900">R$ {m.revenue.toFixed(2)}</td>
                                    </tr>
                                ))}
                                {metrics.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhum técnico com atividade no período.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        );
    };

    const renderCustomers = () => {
        // Aggregate by Customer Phone (unique ID)
        const customerStats: Record<string, { name: string, count: number, total: number, lastDate: number }> = {};
        
        filteredOrders.forEach(o => {
            if (!customerStats[o.customerPhone]) {
                customerStats[o.customerPhone] = { name: o.customerName, count: 0, total: 0, lastDate: 0 };
            }
            customerStats[o.customerPhone].count++;
            customerStats[o.customerPhone].total += o.totalValue;
            if (o.createdAt > customerStats[o.customerPhone].lastDate) {
                customerStats[o.customerPhone].lastDate = o.createdAt;
            }
        });

        const topClients = Object.values(customerStats)
            .sort((a,b) => b.total - a.total)
            .slice(0, 10);

        return (
            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-indigo-50 border-indigo-200">
                        <CardContent className="p-4">
                            <p className="text-sm font-medium text-indigo-600">Clientes Ativos (Período)</p>
                            <h3 className="text-2xl font-bold text-indigo-900">{Object.keys(customerStats).length}</h3>
                        </CardContent>
                    </Card>
                    <Card className="bg-pink-50 border-pink-200">
                        <CardContent className="p-4">
                            <p className="text-sm font-medium text-pink-600">Ticket Médio por Cliente</p>
                            <h3 className="text-2xl font-bold text-pink-900">
                                R$ {(Object.values(customerStats).reduce((a,b) => a + b.total, 0) / (Object.keys(customerStats).length || 1)).toFixed(2)}
                            </h3>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader title="Top 10 Clientes (Por Faturamento)" />
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                                <tr>
                                    <th className="p-4">Cliente</th>
                                    <th className="p-4 text-center">Qtd OS</th>
                                    <th className="p-4 text-center">Última OS</th>
                                    <th className="p-4 text-right">Total Gasto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {topClients.map((c, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="p-4 font-bold text-slate-800">{c.name}</td>
                                        <td className="p-4 text-center">{c.count}</td>
                                        <td className="p-4 text-center text-slate-500">{new Date(c.lastDate).toLocaleDateString()}</td>
                                        <td className="p-4 text-right font-bold text-green-700">R$ {c.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Relatórios Gerenciais</h2>
                    <p className="text-slate-500">Módulo Assistência Técnica</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap border-b border-slate-200">
                <button onClick={() => setActiveTab('DASHBOARD')} className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'DASHBOARD' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Visão Geral</button>
                <button onClick={() => setActiveTab('FINANCIAL')} className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'FINANCIAL' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Financeiro</button>
                <button onClick={() => setActiveTab('STATUS')} className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'STATUS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Status & Prazos</button>
                <button onClick={() => setActiveTab('PRODUCTIVITY')} className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'PRODUCTIVITY' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Produtividade</button>
                <button onClick={() => setActiveTab('CUSTOMERS')} className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'CUSTOMERS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Clientes</button>
            </div>

            <div className="mt-6">
                {activeTab === 'DASHBOARD' && renderDashboard()}
                {activeTab === 'FINANCIAL' && renderFinancial()}
                {activeTab === 'STATUS' && renderStatus()}
                {activeTab === 'PRODUCTIVITY' && renderProductivity()}
                {activeTab === 'CUSTOMERS' && renderCustomers()}
            </div>
        </div>
    );
};
