import React, { useState, useEffect } from 'react';
import { NavItem, User, Company, ThemePreference } from '../types';
import { DataService } from '../services/dataService';
import { useTheme } from '../contexts/ThemeContext';
import { NotificationCenter } from './NotificationCenter';
import { 
  LayoutDashboard, FileText, Settings as SettingsIcon, Menu, LogOut, 
  Package, Users, Shield, Lock, ShoppingCart, BarChart3, Archive, 
  CreditCard, PieChart, Moon, Sun, Monitor, Bell, AlertTriangle, UserSquare2,
  Building2 
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  activeCompany: Company | null;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, activeCompany, onLogout }) => {
  const { preference, setPreference } = useTheme();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();

  // --- NAVIGATION CONFIG ---
  const navItems: NavItem[] = [
    // --- ROTAS GERAIS ---
    { id: '/', label: 'Visão Geral', icon: <LayoutDashboard size={20} />, roles: ['ADMIN', 'FUNCIONARIO', 'TECHNICIAN'] },
    
    // --- ROTAS SUPER ADMIN (Adicionadas Agora) ---
    { id: '/', label: 'Painel Global', icon: <LayoutDashboard size={20} />, roles: ['SUPER_ADMIN'] },
    { id: '/audit', label: 'Auditoria Global', icon: <Shield size={20} />, roles: ['SUPER_ADMIN'] },
    { id: '/privacy', label: 'Centro LGPD', icon: <Lock size={20} />, roles: ['SUPER_ADMIN'] },
    
    // --- ROTAS MÓDULOS ---
    { id: '/orders', label: 'Ordens de Serviço', icon: <FileText size={20} />, roles: ['ADMIN', 'FUNCIONARIO', 'TECHNICIAN'], requiredModule: 'ASSISTANCE' },
    { id: '/pos', label: 'Vendas / PDV', icon: <ShoppingCart size={20} />, roles: ['ADMIN', 'FUNCIONARIO'], requiredModule: 'SALES' },
    { id: '/inventory', label: 'Estoque', icon: <Package size={20} />, roles: ['ADMIN', 'FUNCIONARIO', 'TECHNICIAN'], requiredModule: 'SALES' },
    { id: '/sales-history', label: 'Histórico Vendas', icon: <Archive size={20} />, roles: ['ADMIN', 'FUNCIONARIO'], requiredModule: 'SALES' },
    { id: '/customers', label: 'Clientes', icon: <UserSquare2 size={20} />, roles: ['ADMIN', 'FUNCIONARIO', 'TECHNICIAN'] },
    { id: '/reports', label: 'Relatórios Vendas', icon: <BarChart3 size={20} />, roles: ['ADMIN'], requiredModule: 'SALES' },
    { id: '/assistance-reports', label: 'Relatórios Técnicos', icon: <PieChart size={20} />, roles: ['ADMIN'], requiredModule: 'ASSISTANCE' }, 
    { id: '/catalog', label: 'Catálogo Serviços', icon: <Package size={20} />, roles: ['ADMIN'], requiredModule: 'ASSISTANCE' },
    { id: '/team', label: 'Equipe', icon: <Users size={20} />, roles: ['ADMIN'] }, 
    
    // --- CONFIGURAÇÕES ---
    { id: '/plan', label: 'Meu Plano', icon: <CreditCard size={20} />, roles: ['ADMIN'] },
    { id: '/settings', label: 'Configurações', icon: <SettingsIcon size={20} />, roles: ['ADMIN'] },
  ];

  const visibleNavItems = navItems.filter(item => {
      // 1. Role Check
      if (user && !item.roles.includes(user.role)) return false;
      // 2. Module Check
      if (item.requiredModule && !DataService.hasModule(item.requiredModule)) return false;
      return true;
  });

  // (O resto do componente permanece igual, apenas adicionei os itens acima)
  useEffect(() => {
      if (user && user.companyId) {
          const check = () => {
              const notes = DataService.getNotifications(user.companyId!);
              setUnreadCount(notes.filter(n => !n.read).length);
          };
          check();
          const interval = setInterval(check, 10000);
          return () => clearInterval(interval);
      }
  }, [user]);

  const cycleTheme = () => {
    let newPref: ThemePreference = 'system';
    if (preference === 'system') newPref = 'light';
    else if (preference === 'light') newPref = 'dark';
    setPreference(newPref);
    const updatedUser = { ...user, themePreference: newPref };
    DataService.saveUser(updatedUser);
  };

  const isCurrentRoute = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="h-screen w-full bg-slate-100 dark:bg-slate-950 flex font-sans transition-colors duration-300 overflow-hidden">
      
      {/* BANNER DE COBRANÇA */}
      {activeCompany?.subscriptionStatus === 'PAST_DUE' && user.role === 'ADMIN' && (
          <div className="fixed top-0 left-0 right-0 bg-red-600 text-white z-[60] px-4 py-2 flex justify-center items-center shadow-lg animate-fade-in">
              <AlertTriangle className="w-5 h-5 mr-3" />
              <span className="font-bold text-sm">Atenção: Sua fatura está em atraso. Regularize para evitar o bloqueio.</span>
              <button onClick={() => navigate('/plan')} className="ml-4 bg-white text-red-600 px-3 py-1 rounded text-xs font-bold hover:bg-red-50">
                  Ver Fatura
              </button>
          </div>
      )}

      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) lg:translate-x-0 lg:static lg:inset-auto flex flex-col shadow-2xl lg:shadow-none h-full
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${activeCompany?.subscriptionStatus === 'PAST_DUE' ? 'pt-10 lg:pt-0' : ''} 
      `}>
        <div className="h-16 flex-none flex items-center px-6 border-b border-slate-800">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3 font-bold text-lg shadow-lg shadow-primary/50 text-white">P</div>
          <div>
            <span className="font-bold text-lg tracking-tight block leading-none">Providencia</span>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
               {user.role === 'SUPER_ADMIN' ? 'Super Admin' : user.role === 'ADMIN' ? 'Gestão' : 'Técnico'}
            </span>
          </div>
        </div>

        <div className="p-6 border-b border-slate-800 flex-none">
            <div className="flex items-center gap-3">
                <img src={user.avatar || 'https://i.pravatar.cc/150'} className="w-10 h-10 rounded-full border-2 border-slate-700" alt="Avatar" />
                <div className="overflow-hidden">
                    <p className="text-sm font-bold text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 font-medium bg-slate-800 px-2 py-0.5 rounded inline-block mt-1">{user.role}</p>
                </div>
            </div>
        </div>

        <nav className="p-4 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
          {visibleNavItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                navigate(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                isCurrentRoute(item.id)
                  ? 'bg-primary text-white shadow-md shadow-primary/20 font-medium' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className={`mr-3 transition-colors ${isCurrentRoute(item.id) ? 'text-white' : 'text-slate-500 group-hover:text-white'}`}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-900 flex-none">
          <button 
            onClick={cycleTheme}
            className="flex items-center justify-between text-slate-400 hover:text-white hover:bg-slate-800 transition-colors w-full px-4 py-2 rounded-lg text-sm"
          >
            <span className="flex items-center">
                {preference === 'dark' ? <Moon size={18} className="mr-3" /> : preference === 'light' ? <Sun size={18} className="mr-3" /> : <Monitor size={18} className="mr-3" />}
                {preference === 'dark' ? 'Escuro' : preference === 'light' ? 'Claro' : 'Auto'}
            </span>
          </button>

          <button 
            onClick={onLogout}
            className="flex items-center text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors w-full px-4 py-2 rounded-lg text-sm"
          >
            <LogOut size={18} className="mr-3" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      <main className={`flex-1 flex flex-col h-full overflow-hidden ${activeCompany?.subscriptionStatus === 'PAST_DUE' ? 'pt-10' : ''}`}>
        <header className="h-16 flex-none bg-white dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 shadow-sm z-10">
          <div className="flex items-center lg:hidden">
              <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors mr-2">
                <Menu size={24} />
              </button>
              <span className="font-semibold text-slate-800 dark:text-white">Providencia</span>
          </div>
          
          <div className="hidden lg:block text-sm text-slate-500 dark:text-slate-400">
             {user.role === 'SUPER_ADMIN' ? <span className="text-primary font-bold">Modo Deus (Super Admin)</span> : (activeCompany ? `Empresa: ${activeCompany.name}` : '')}
          </div>

          <div className="flex items-center gap-4">
              <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative"
                  >
                      <Bell size={20} />
                      {unreadCount > 0 && (
                          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
                      )}
                  </button>
                  {showNotifications && activeCompany && (
                      <NotificationCenter 
                        companyId={activeCompany.id} 
                        onClose={() => setShowNotifications(false)}
                      />
                  )}
              </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative scroll-smooth">
           <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-b from-slate-200 to-transparent dark:from-slate-900/50 dark:to-transparent -z-10 pointer-events-none"></div>
           <div className="max-w-7xl mx-auto pb-10">
              {children}
           </div>
        </div>
      </main>
    </div>
  );
};