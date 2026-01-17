import React, { useState, useEffect } from 'react';
import { DataService } from './services/dataService';
import { User, ServiceOrder, NavItem, Company, ThemePreference } from './types';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { OrderList } from './components/OrderList';
import { OrderDetail } from './components/OrderDetail';
import { CreateOrderModal } from './components/CreateOrderModal'; 
import { Catalog } from './components/Catalog';
import { Settings } from './components/Settings';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { UserManagement } from './components/UserManagement'; 
import { AuditLogView } from './components/AuditLogView'; 
import { PrivacyDashboard } from './components/PrivacyDashboard';
import { ForcePasswordChange } from './components/ForcePasswordChange';
import { InventoryList } from './components/InventoryList';
import { POS } from './components/POS';
import { SalesList } from './components/SalesList';
import { FinancialReports } from './components/FinancialReports';
import { PlanManagement } from './components/PlanManagement';
import { UpgradeGate } from './components/UpgradeGate';
import { CustomerApprovalPage } from './components/CustomerApprovalPage';
import { VerificationPage } from './components/VerificationPage';
import { AssistanceReports } from './components/AssistanceReports';
import { NotificationCenter } from './components/NotificationCenter';
import { CustomerList } from './components/CustomerList';
import { LayoutDashboard, FileText, Settings as SettingsIcon, Menu, LogOut, Package, Users, Shield, Lock, ArrowLeft, ShoppingCart, BarChart3, Archive, CreditCard, PieChart, Moon, Sun, Monitor, Bell, AlertTriangle, ShieldAlert, UserSquare2 } from 'lucide-react';

// Wrapper component to use the hook
const AppContent: React.FC = () => {
  const { theme, preference, setPreference } = useTheme();
  // --- AUTH STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // --- APP STATE ---
  const [currentView, setCurrentView] = useState<'dashboard' | 'orders' | 'detail' | 'catalog' | 'team' | 'settings' | 'audit' | 'privacy' | 'inventory' | 'pos' | 'sales_history' | 'reports' | 'plan' | 'assistance_reports' | 'customers'>('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); 
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // --- PUBLIC ROUTE SIMULATION ---
  const [publicApprovalToken, setPublicApprovalToken] = useState<string | null>(null);
  const [verificationHash, setVerificationHash] = useState<string | null>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    // 0. Run Billing Job (Simulated Cron)
    DataService.runDailyBillingJob();

    // 1. Check for Public Route Query Params (Simulated Routing)
    const urlParams = new URLSearchParams(window.location.search);
    const approvalToken = urlParams.get('approval_token');
    const verifyHash = urlParams.get('verify'); // New Param
    
    // Legacy Hash Check (Quick Testing)
    const hashToken = window.location.hash.includes('approval/') ? window.location.hash.split('approval/')[1] : null;

    if (approvalToken || hashToken) {
        setPublicApprovalToken(approvalToken || hashToken);
        setIsLoadingAuth(false);
        return;
    }

    if (verifyHash) {
        setVerificationHash(verifyHash);
        setIsLoadingAuth(false);
        return;
    }

    // 2. Check session
    const currentUser = DataService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      if (currentUser.companyId) {
          const companies = DataService.getCompanies();
          const comp = companies.find(c => c.id === currentUser.companyId);
          if (comp) setActiveCompany(comp);
      }
      if (currentUser.role !== 'SUPER_ADMIN' && !currentUser.mustChangePassword) {
          loadData();
      }
    }
    setIsLoadingAuth(false);
  }, []);

  // Update notification count periodically
  useEffect(() => {
      if (user && user.companyId) {
          const check = () => {
              const notes = DataService.getNotifications(user.companyId!);
              setUnreadCount(notes.filter(n => !n.read).length);
          };
          check();
          const interval = setInterval(check, 10000); // Poll every 10s
          return () => clearInterval(interval);
      }
  }, [user]);

  // Theme Sync Effect: Apply user preference on login
  useEffect(() => {
    if (user && user.themePreference) {
      setPreference(user.themePreference);
    }
  }, [user]);

  // Listener for internal navigation events (fixes Blob URL security issues with window.open)
  useEffect(() => {
      const handleInternalNav = (e: Event) => {
          const customEvent = e as CustomEvent;
          if (customEvent.detail?.type === 'VERIFY') {
              setVerificationHash(customEvent.detail.hash);
          }
      };
      window.addEventListener('providencia:navigate', handleInternalNav);
      return () => window.removeEventListener('providencia:navigate', handleInternalNav);
  }, []);

  const loadData = () => {
    // Only load orders if the module is active, otherwise empty to prevent errors or unauthorized access
    if (DataService.hasModule('ASSISTANCE')) {
        setOrders(DataService.getOrders());
    } else {
        setOrders([]);
    }
  };

  const cycleTheme = () => {
    let newPref: ThemePreference = 'system';
    if (preference === 'system') newPref = 'light';
    else if (preference === 'light') newPref = 'dark';
    
    setPreference(newPref);

    // Persist to user profile to avoid revert on reload/login
    if (user) {
        const updatedUser = { ...user, themePreference: newPref };
        DataService.saveUser(updatedUser);
        setUser(updatedUser);
    }
  };

  // --- HANDLERS ---
  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    if (loggedInUser.companyId) {
        const companies = DataService.getCompanies();
        const comp = companies.find(c => c.id === loggedInUser.companyId);
        if (comp) setActiveCompany(comp);
    }
    if (loggedInUser.role !== 'SUPER_ADMIN' && !loggedInUser.mustChangePassword) {
        loadData();
    }
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    DataService.logout();
    setUser(null);
    setActiveCompany(null);
  };

  const handleOpenCreateModal = () => {
      setIsCreateModalOpen(true);
  };

  const handleOrderCreated = (newOrder: ServiceOrder) => {
      setOrders([newOrder, ...orders]);
      DataService.saveOrder(newOrder); 
      setSelectedOrderId(newOrder.id);
      setIsCreateModalOpen(false);
      setCurrentView('detail');
  };

  const handleUpdateOrder = (updatedOrder: ServiceOrder) => {
    const newOrders = orders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
    setOrders(newOrders);
    DataService.saveOrder(updatedOrder); 
  };

  if (isLoadingAuth) return <div className="h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400">Carregando...</div>;

  // --- PUBLIC VIEW RENDER: APPROVAL ---
  if (publicApprovalToken) {
      return <CustomerApprovalPage token={publicApprovalToken} onClose={() => {
          setPublicApprovalToken(null);
          window.history.pushState({}, '', '/'); // Clear URL
      }} />;
  }

  // --- PUBLIC VIEW RENDER: VERIFICATION ---
  if (verificationHash) {
      return (
        <VerificationPage 
            hash={verificationHash} 
            onClose={() => {
                setVerificationHash(null);
                // Clean URL if it was set via query param
                const url = new URL(window.location.href);
                if (url.searchParams.has('verify')) {
                    url.searchParams.delete('verify');
                    window.history.pushState({}, '', url.toString());
                }
            }} 
        />
      );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // --- BILLING BLOCK CHECK ---
  if (activeCompany && activeCompany.subscriptionStatus === 'BLOCKED' && user.role !== 'SUPER_ADMIN') {
      return (
          <div className="h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 p-6 text-center">
              <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <ShieldAlert className="w-12 h-12 text-red-600 dark:text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Acesso Suspenso</h1>
              <p className="text-slate-600 dark:text-slate-400 max-w-md mb-8">
                  Detectamos uma pendência financeira com sua assinatura. O acesso ao sistema foi temporariamente bloqueado.
                  Para regularizar e desbloquear imediatamente, entre em contato com o suporte.
              </p>
              <div className="flex gap-4">
                  <button onClick={handleLogout} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
                      Sair do Sistema
                  </button>
                  <button className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 shadow-lg">
                      Regularizar Agora
                  </button>
              </div>
          </div>
      );
  }

  // --- FORCE PASSWORD CHANGE ---
  if (user.mustChangePassword) {
    return <ForcePasswordChange user={user} onSuccess={(updatedUser) => {
        setUser(updatedUser);
        loadData();
    }} />;
  }

  // --- SUPER ADMIN VIEW ---
  if (user.role === 'SUPER_ADMIN') {
       let content;
       switch(currentView) {
           case 'privacy':
               content = <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-8 pt-20"><PrivacyDashboard currentUser={user} /></div>;
               break;
           case 'audit':
               content = <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-8 pt-20"><AuditLogView currentUser={user} /></div>;
               break;
           default:
               content = <SuperAdminDashboard user={user} onLogout={handleLogout} />;
               break;
       }

       return (
           <div className="relative min-h-screen bg-slate-100 dark:bg-slate-950">
               {content}
               
               <div className="fixed bottom-6 right-6 flex flex-row gap-3 z-50">
                   <button onClick={cycleTheme} className="p-3 rounded-full shadow-lg bg-slate-800 text-white hover:bg-slate-700 ring-2 ring-slate-700" title="Mudar Tema">
                        {preference === 'dark' ? <Moon size={20} /> : preference === 'light' ? <Sun size={20} /> : <Monitor size={20} />}
                   </button>
                   <button onClick={() => setCurrentView('audit')} className={`p-3 rounded-full shadow-lg ${currentView === 'audit' ? 'bg-slate-800 ring-2 ring-white' : 'bg-slate-700'} text-white hover:bg-slate-600`} title="Auditoria"><Shield size={20} /></button>
                   <button onClick={() => setCurrentView('privacy')} className={`p-3 rounded-full shadow-lg ${currentView === 'privacy' ? 'bg-indigo-600 ring-2 ring-white' : 'bg-indigo-500'} text-white hover:bg-indigo-400`} title="LGPD"><Lock size={20} /></button>
                   <button onClick={() => setCurrentView('dashboard')} className={`p-3 rounded-full shadow-lg ${currentView === 'dashboard' ? 'bg-blue-600 ring-2 ring-white' : 'bg-blue-500'} text-white hover:bg-blue-400`} title="Home"><LayoutDashboard size={20} /></button>
               </div>
               
               {currentView !== 'dashboard' && (
                    <div className="fixed top-6 left-6 z-50">
                        <button onClick={() => setCurrentView('dashboard')} className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 flex items-center gap-2 px-4 font-bold border dark:border-slate-700">
                            <ArrowLeft size={16} /> Voltar ao Painel
                        </button>
                    </div>
               )}
           </div>
       );
  }

  // --- NAVIGATION CONFIG (RBAC + MODULES) ---
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Visão Geral', icon: <LayoutDashboard size={20} />, roles: ['ADMIN', 'FUNCIONARIO', 'TECHNICIAN'] },
    
    // ASSISTANCE MODULE
    { id: 'orders', label: 'Ordens de Serviço', icon: <FileText size={20} />, roles: ['ADMIN', 'FUNCIONARIO', 'TECHNICIAN'], requiredModule: 'ASSISTANCE' },
    
    // SALES MODULE
    { id: 'pos', label: 'Vendas / PDV', icon: <ShoppingCart size={20} />, roles: ['ADMIN', 'FUNCIONARIO'], requiredModule: 'SALES' },
    { id: 'inventory', label: 'Estoque', icon: <Package size={20} />, roles: ['ADMIN', 'FUNCIONARIO', 'TECHNICIAN'], requiredModule: 'SALES' },
    { id: 'sales_history', label: 'Histórico Vendas', icon: <Archive size={20} />, roles: ['ADMIN', 'FUNCIONARIO'], requiredModule: 'SALES' },
    
    // ADMIN
    { id: 'customers', label: 'Clientes', icon: <UserSquare2 size={20} />, roles: ['ADMIN', 'FUNCIONARIO', 'TECHNICIAN'] }, // New Item
    { id: 'reports', label: 'Relatórios Vendas', icon: <BarChart3 size={20} />, roles: ['ADMIN'], requiredModule: 'SALES' },
    { id: 'assistance_reports', label: 'Relatórios Técnicos', icon: <PieChart size={20} />, roles: ['ADMIN'], requiredModule: 'ASSISTANCE' }, 
    { id: 'catalog', label: 'Catálogo Serviços', icon: <Package size={20} />, roles: ['ADMIN'], requiredModule: 'ASSISTANCE' },
    { id: 'team', label: 'Equipe', icon: <Users size={20} />, roles: ['ADMIN'] }, 
    { id: 'audit', label: 'Auditoria', icon: <Shield size={20} />, roles: ['ADMIN'] },
    { id: 'plan', label: 'Meu Plano', icon: <CreditCard size={20} />, roles: ['ADMIN'] },
    { id: 'privacy', label: 'LGPD', icon: <Lock size={20} />, roles: ['ADMIN'] }, 
    { id: 'settings', label: 'Configurações', icon: <SettingsIcon size={20} />, roles: ['ADMIN'] },
  ];

  const visibleNavItems = navItems.filter(item => {
      // 1. Role Check
      if (user && !item.roles.includes(user.role)) return false;
      
      // 2. Module Check
      if (item.requiredModule && !DataService.hasModule(item.requiredModule)) return false;
      
      return true;
  });

  const renderContent = () => {
    // --- MODULE GUARDS ---
    if (['orders', 'catalog', 'assistance_reports'].includes(currentView) && !DataService.hasModule('ASSISTANCE')) {
        return <UpgradeGate title="Módulo de Assistência" description="Gerencie ordens de serviço, checklists e equipe técnica." />;
    }
    
    if (['pos', 'inventory', 'sales_history', 'reports'].includes(currentView) && !DataService.hasModule('SALES')) {
        return <UpgradeGate title="Módulo de Vendas & Estoque" description="Acesse o PDV, controle de estoque comercial e relatórios financeiros." />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard orders={orders} />;
      case 'orders':
        return <OrderList orders={orders} onSelectOrder={(id) => { setSelectedOrderId(id); setCurrentView('detail'); }} onCreateOrder={handleOpenCreateModal} />;
      case 'detail':
        const order = orders.find(o => o.id === selectedOrderId);
        return order && user ? (
          <OrderDetail 
            order={order} 
            currentUser={user}
            onUpdateOrder={handleUpdateOrder} 
            onBack={() => setCurrentView('orders')} 
          />
        ) : <div>Order not found</div>;
      case 'pos':
          return <POS currentUser={user} />;
      case 'inventory':
          return <InventoryList currentUser={user} />;
      case 'sales_history':
          return <SalesList />;
      case 'reports':
          return <FinancialReports />;
      case 'assistance_reports':
          return user?.role === 'ADMIN' ? <AssistanceReports currentUser={user} /> : <div className="p-4 text-red-500">Acesso Negado</div>;
      case 'customers':
          return <CustomerList currentUser={user} />;
      case 'catalog':
         return user?.role === 'ADMIN' ? <Catalog /> : <div className="p-4 text-red-500">Acesso Negado</div>;
      case 'team':
         return user?.role === 'ADMIN' ? <UserManagement currentUser={user} /> : <div className="p-4 text-red-500">Acesso Negado</div>;
      case 'audit':
         return (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') ? <AuditLogView currentUser={user} /> : <div className="p-4 text-red-500">Acesso Negado</div>;
      case 'privacy':
         return (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') ? <PrivacyDashboard currentUser={user} /> : <div className="p-4 text-red-500">Acesso Negado</div>;
      case 'settings':
         return user?.role === 'ADMIN' ? <Settings /> : <div className="p-4 text-red-500">Acesso Negado</div>;
      case 'plan':
         return user?.role === 'ADMIN' && activeCompany ? <div className="max-w-4xl mx-auto"><PlanManagement company={activeCompany} isSuperAdmin={false} /></div> : <div className="p-4 text-red-500">Acesso Negado</div>;
      default:
        return <Dashboard orders={orders} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex font-sans transition-colors duration-300">
      
      {/* GLOBAL BILLING WARNING BANNER */}
      {activeCompany?.subscriptionStatus === 'PAST_DUE' && user.role === 'ADMIN' && (
          <div className="fixed top-0 left-0 right-0 bg-red-600 text-white z-[60] px-4 py-2 flex justify-center items-center shadow-lg animate-fade-in">
              <AlertTriangle className="w-5 h-5 mr-3" />
              <span className="font-bold text-sm">Atenção: Sua fatura está em atraso. Regularize para evitar o bloqueio do sistema.</span>
              <button onClick={() => setCurrentView('plan')} className="ml-4 bg-white text-red-600 px-3 py-1 rounded text-xs font-bold hover:bg-red-50">
                  Ver Fatura
              </button>
          </div>
      )}

      {isCreateModalOpen && user && (
          <CreateOrderModal 
            currentUser={user}
            onClose={() => setIsCreateModalOpen(false)}
            onCreate={handleOrderCreated}
          />
      )}

      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 dark:bg-slate-900 dark:border-r dark:border-slate-800 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col
        ${activeCompany?.subscriptionStatus === 'PAST_DUE' ? 'pt-10 lg:pt-0' : ''} 
      `}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800 dark:border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 font-bold text-lg shadow-lg shadow-blue-900/50">P</div>
          <div>
            <span className="font-bold text-lg tracking-tight block leading-none">Providencia</span>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
               {user.role === 'ADMIN' ? 'Admin Empresa' : 'Técnico'}
            </span>
          </div>
        </div>

        <div className="p-6 border-b border-slate-800 dark:border-slate-800">
            <div className="flex items-center gap-3">
                <img src={user.avatar || 'https://i.pravatar.cc/150'} className="w-10 h-10 rounded-full border-2 border-slate-700" alt="Avatar" />
                <div>
                    <p className="text-sm font-bold text-white">{user.name}</p>
                    <p className="text-xs text-slate-400 font-medium bg-slate-800 px-2 py-0.5 rounded inline-block mt-1">{user.role}</p>
                </div>
            </div>
            {activeCompany && (
                <div className="mt-3 bg-slate-800 p-2 rounded text-xs text-center border border-slate-700">
                    <span className="text-slate-400 block mb-1">Empresa</span>
                    <span className="font-bold text-white">{activeCompany.name}</span>
                </div>
            )}
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {visibleNavItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id as any);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
                currentView === item.id 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 dark:border-slate-800 space-y-2">
          {/* Theme Toggle */}
          <button 
            onClick={cycleTheme}
            className="flex items-center justify-between text-slate-400 hover:text-white hover:bg-slate-800 transition-colors w-full px-4 py-2 rounded-lg text-sm"
          >
            <span className="flex items-center">
                {preference === 'dark' ? <Moon size={18} className="mr-3" /> : preference === 'light' ? <Sun size={18} className="mr-3" /> : <Monitor size={18} className="mr-3" />}
                {preference === 'dark' ? 'Modo Escuro' : preference === 'light' ? 'Modo Claro' : 'Auto (Sistema)'}
            </span>
          </button>

          <button 
            onClick={handleLogout}
            className="flex items-center text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors w-full px-4 py-2 rounded-lg text-sm"
          >
            <LogOut size={18} className="mr-3" />
            <span className="font-medium">Sair do Sistema</span>
          </button>
        </div>
      </aside>

      <main className={`flex-1 flex flex-col h-screen overflow-hidden ${activeCompany?.subscriptionStatus === 'PAST_DUE' ? 'pt-10' : ''}`}>
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 shadow-sm z-10 relative">
          <div className="flex items-center lg:hidden">
              <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-600 dark:text-slate-300 mr-4">
                <Menu size={24} />
              </button>
              <span className="font-semibold text-slate-800 dark:text-white">Providencia</span>
          </div>
          <div className="hidden lg:block"></div> {/* Spacer */}

          {/* Right Header Actions */}
          <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 relative"
                  >
                      <Bell size={20} />
                      {unreadCount > 0 && (
                          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
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

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
           {/* Header Background Strip */}
           <div className="fixed top-0 left-0 w-full h-64 bg-slate-100 dark:bg-slate-950 -z-10"></div>
           <div className="max-w-7xl mx-auto">
              {renderContent()}
           </div>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <ThemeProvider>
    <AppContent />
  </ThemeProvider>
);

export default App;