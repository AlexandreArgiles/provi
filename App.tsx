import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom'; // <--- CORREÇÃO: useParams adicionado
import { DataService } from './services/dataService';
import { User, ServiceOrder, Company, ThemePreference } from './types';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import { LoadingScreen } from './components/ui/Loading';

// Eager imports
import { Login } from './components/Login';
import { CreateOrderModal } from './components/CreateOrderModal';
import { CustomerApprovalPage } from './components/CustomerApprovalPage';
import { VerificationPage } from './components/VerificationPage';
import { ForcePasswordChange } from './components/ForcePasswordChange';
import { ShieldAlert, Moon, Sun, Monitor, Shield, Lock, LayoutDashboard, ArrowLeft, LogOut } from 'lucide-react';

// Lazy imports
const Dashboard = React.lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const OrderList = React.lazy(() => import('./components/OrderList').then(module => ({ default: module.OrderList })));
const OrderDetail = React.lazy(() => import('./components/OrderDetail').then(module => ({ default: module.OrderDetail })));
const Catalog = React.lazy(() => import('./components/Catalog').then(module => ({ default: module.Catalog })));
const Settings = React.lazy(() => import('./components/Settings').then(module => ({ default: module.Settings })));
const SuperAdminDashboard = React.lazy(() => import('./components/SuperAdminDashboard').then(module => ({ default: module.SuperAdminDashboard })));
const UserManagement = React.lazy(() => import('./components/UserManagement').then(module => ({ default: module.UserManagement })));
const AuditLogView = React.lazy(() => import('./components/AuditLogView').then(module => ({ default: module.AuditLogView })));
const PrivacyDashboard = React.lazy(() => import('./components/PrivacyDashboard').then(module => ({ default: module.PrivacyDashboard })));
const InventoryList = React.lazy(() => import('./components/InventoryList').then(module => ({ default: module.InventoryList })));
const POS = React.lazy(() => import('./components/POS').then(module => ({ default: module.POS })));
const SalesList = React.lazy(() => import('./components/SalesList').then(module => ({ default: module.SalesList })));
const FinancialReports = React.lazy(() => import('./components/FinancialReports').then(module => ({ default: module.FinancialReports })));
const PlanManagement = React.lazy(() => import('./components/PlanManagement').then(module => ({ default: module.PlanManagement })));
const UpgradeGate = React.lazy(() => import('./components/UpgradeGate').then(module => ({ default: module.UpgradeGate })));
const AssistanceReports = React.lazy(() => import('./components/AssistanceReports').then(module => ({ default: module.AssistanceReports })));
const CustomerList = React.lazy(() => import('./components/CustomerList').then(module => ({ default: module.CustomerList })));

// --- SUPER ADMIN LAYOUT (Apenas Botões Flutuantes) ---
const SuperAdminLayout: React.FC<{ children: React.ReactNode, user: User, onLogout: () => void }> = ({ children, user, onLogout }) => {
    const { preference, setPreference } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const cycleTheme = () => {
        let newPref: ThemePreference = 'system';
        if (preference === 'system') newPref = 'light';
        else if (preference === 'light') newPref = 'dark';
        
        setPreference(newPref);
        const updatedUser = { ...user, themePreference: newPref };
        DataService.saveUser(updatedUser);
    };

    const isAudit = location.pathname === '/audit';
    const isPrivacy = location.pathname === '/privacy';
    const isHome = location.pathname === '/';

    return (
        <div className="relative min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors duration-300">
            {/* Conteúdo da Página */}
            {children}

            {/* Botão de Voltar (se não estiver na home) */}
            {!isHome && (
                 <div className="fixed top-6 left-6 z-50">
                    <button onClick={() => navigate('/')} className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 flex items-center gap-2 px-4 font-bold border dark:border-slate-700 transition-all hover:scale-105">
                        <ArrowLeft size={16} /> Voltar ao Painel
                    </button>
                </div>
            )}

            {/* BOTÕES FLUTUANTES (FABs) - Canto Inferior Direito */}
            <div className="fixed bottom-6 right-6 flex flex-row gap-3 z-50 animate-fade-in">
                 {/* Logout Button */}
                 <button 
                    onClick={onLogout}
                    className="p-3 rounded-full shadow-lg bg-red-600 text-white hover:bg-red-700 ring-2 ring-red-700/50 transition-transform hover:scale-110" 
                    title="Sair do Sistema"
                 >
                    <LogOut size={20} />
                 </button>

                 <div className="w-px h-10 bg-slate-300 dark:bg-slate-700 mx-1 self-center"></div>

                 {/* Theme Toggle */}
                 <button onClick={cycleTheme} className="p-3 rounded-full shadow-lg bg-slate-800 text-white hover:bg-slate-700 ring-2 ring-slate-700 transition-transform hover:scale-110" title="Mudar Tema">
                        {preference === 'dark' ? <Moon size={20} /> : preference === 'light' ? <Sun size={20} /> : <Monitor size={20} />}
                 </button>
                 
                 {/* Audit */}
                 <button onClick={() => navigate('/audit')} className={`p-3 rounded-full shadow-lg ${isAudit ? 'bg-slate-800 ring-2 ring-white scale-110' : 'bg-slate-700'} text-white hover:bg-slate-600 transition-all hover:scale-110`} title="Auditoria"><Shield size={20} /></button>
                 
                 {/* LGPD */}
                 <button onClick={() => navigate('/privacy')} className={`p-3 rounded-full shadow-lg ${isPrivacy ? 'bg-indigo-600 ring-2 ring-white scale-110' : 'bg-indigo-500'} text-white hover:bg-indigo-400 transition-all hover:scale-110`} title="LGPD"><Lock size={20} /></button>
                 
                 {/* Home */}
                 <button onClick={() => navigate('/')} className={`p-3 rounded-full shadow-lg ${isHome ? 'bg-blue-600 ring-2 ring-white scale-110' : 'bg-blue-500'} text-white hover:bg-blue-400 transition-all hover:scale-110`} title="Home"><LayoutDashboard size={20} /></button>
            </div>
        </div>
    );
};

// --- APP CONTENT ---
const AppContent: React.FC = () => {
  const { setPreference } = useTheme();
  
  // --- AUTH STATE ---
  const [user, setUser] = useState<User | null>(null);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // --- APP STATE ---
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // --- PUBLIC ROUTE STATE ---
  const [publicApprovalToken, setPublicApprovalToken] = useState<string | null>(null);
  const [verificationHash, setVerificationHash] = useState<string | null>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    DataService.runDailyBillingJob();

    const urlParams = new URLSearchParams(window.location.search);
    const approvalToken = urlParams.get('approval_token');
    const verifyHash = urlParams.get('verify');
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

    const currentUser = DataService.getCurrentUser();
    if (currentUser) {
      handleUserSession(currentUser);
    } else {
        setIsLoadingAuth(false);
    }
  }, []);

  const handleUserSession = (currentUser: User) => {
      setUser(currentUser);
      if (currentUser.themePreference) {
          setPreference(currentUser.themePreference);
      }
      if (currentUser.companyId) {
          const companies = DataService.getCompanies();
          const comp = companies.find(c => c.id === currentUser.companyId);
          if (comp) setActiveCompany(comp);
      }
      if (currentUser.role !== 'SUPER_ADMIN' && !currentUser.mustChangePassword) {
          loadData();
      }
      setIsLoadingAuth(false);
  };

  const loadData = () => {
    if (DataService.hasModule('ASSISTANCE')) {
        setOrders(DataService.getOrders());
    } else {
        setOrders([]);
    }
  };

  const handleLogin = (loggedInUser: User) => {
    handleUserSession(loggedInUser);
  };

  const handleLogout = () => {
    DataService.logout();
    setUser(null);
    setActiveCompany(null);
  };

  const handleOrderCreated = (newOrder: ServiceOrder) => {
      const updatedOrders = [newOrder, ...orders];
      setOrders(updatedOrders);
      DataService.saveOrder(newOrder); 
      setIsCreateModalOpen(false);
  };

  const handleUpdateOrder = (updatedOrder: ServiceOrder) => {
    const newOrders = orders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
    setOrders(newOrders);
    DataService.saveOrder(updatedOrder); 
  };

  if (isLoadingAuth) return <LoadingScreen />;

  // PUBLIC ROUTES
  if (publicApprovalToken) {
      return <CustomerApprovalPage token={publicApprovalToken} onClose={() => { setPublicApprovalToken(null); window.history.pushState({}, '', '/'); }} />;
  }
  if (verificationHash) {
      return <VerificationPage hash={verificationHash} onClose={() => { setVerificationHash(null); const url = new URL(window.location.href); if (url.searchParams.has('verify')) { url.searchParams.delete('verify'); window.history.pushState({}, '', url.toString()); } }} />;
  }

  // UNAUTHENTICATED
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // BLOCKED STATE (Exceto Super Admin)
  if (activeCompany && activeCompany.subscriptionStatus === 'BLOCKED' && user.role !== 'SUPER_ADMIN') {
      return (
          <div className="h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 p-6 text-center">
              <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <ShieldAlert className="w-12 h-12 text-red-600 dark:text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Acesso Suspenso</h1>
              <div className="flex gap-4 mt-6">
                  <button onClick={handleLogout} className="text-slate-500 hover:text-slate-800 dark:text-slate-400">Sair</button>
              </div>
          </div>
      );
  }

  // PASSWORD CHANGE
  if (user.mustChangePassword) {
    return <ForcePasswordChange user={user} onSuccess={(updatedUser) => { setUser(updatedUser); loadData(); }} />;
  }

  // --- SEPARAÇÃO DE LAYOUTS ---
  
  // 1. LAYOUT SUPER ADMIN (Botões Flutuantes)
  if (user.role === 'SUPER_ADMIN') {
      return (
          <SuperAdminLayout user={user} onLogout={handleLogout}>
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                    {/* Agora SuperAdminDashboard é apenas o conteúdo, sem sidebar */}
                    <Route path="/" element={<SuperAdminDashboard user={user} onLogout={handleLogout} />} />
                    <Route path="/audit" element={<div className="p-8 pt-20 max-w-7xl mx-auto"><AuditLogView currentUser={user} /></div>} />
                    <Route path="/privacy" element={<div className="p-8 pt-20 max-w-7xl mx-auto"><PrivacyDashboard currentUser={user} /></div>} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
          </SuperAdminLayout>
      );
  }

  // 2. LAYOUT PADRÃO (Sidebar) - Para Admin, Funcionário, Técnico
  return (
    <Layout user={user} activeCompany={activeCompany} onLogout={handleLogout}>
      {isCreateModalOpen && (
          <CreateOrderModal 
            currentUser={user}
            onClose={() => setIsCreateModalOpen(false)}
            onCreate={handleOrderCreated}
          />
      )}

      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Dashboard orders={orders} />} />
          
          {/* MÓDULOS */}
          <Route path="/orders" element={
            DataService.hasModule('ASSISTANCE') 
            ? <OrderList orders={orders} onCreateOrder={() => setIsCreateModalOpen(true)} />
            : <UpgradeGate title="Módulo Assistência" description="Acesse ordens de serviço." />
          } />
          
          {/* ROTA DE DETALHES (Onde dava o erro) */}
          <Route path="/orders/:id" element={<OrderDetailWrapper orders={orders} user={user} onUpdate={handleUpdateOrder} />} />

          <Route path="/pos" element={DataService.hasModule('SALES') ? <POS currentUser={user} /> : <UpgradeGate title="PDV" description="Vendas." />} />
          <Route path="/inventory" element={DataService.hasModule('SALES') ? <InventoryList currentUser={user} /> : <UpgradeGate title="Estoque" description="Gestão." />} />
          <Route path="/sales-history" element={DataService.hasModule('SALES') ? <SalesList /> : <UpgradeGate title="Histórico" description="Vendas." />} />
          
          {/* GERAIS */}
          <Route path="/customers" element={<CustomerList currentUser={user} />} />
          <Route path="/reports" element={user.role === 'ADMIN' && DataService.hasModule('SALES') ? <FinancialReports /> : <Navigate to="/" replace />} />
          <Route path="/assistance-reports" element={user.role === 'ADMIN' && DataService.hasModule('ASSISTANCE') ? <AssistanceReports currentUser={user} /> : <Navigate to="/" replace />} />
          <Route path="/catalog" element={user.role === 'ADMIN' ? <Catalog /> : <Navigate to="/" replace />} />
          <Route path="/team" element={user.role === 'ADMIN' ? <UserManagement currentUser={user} /> : <Navigate to="/" />} />
          
          <Route path="/settings" element={user.role === 'ADMIN' ? <Settings /> : <Navigate to="/" />} />
          <Route path="/plan" element={user.role === 'ADMIN' && activeCompany ? <div className="max-w-4xl mx-auto"><PlanManagement company={activeCompany} isSuperAdmin={false} /></div> : <Navigate to="/" />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
};

// Wrapper auxiliar - Agora com useParams funcionando
const OrderDetailWrapper: React.FC<{ orders: ServiceOrder[], user: User, onUpdate: (o: ServiceOrder) => void }> = ({ orders, user, onUpdate }) => {
    const { id } = useParams<{ id: string }>(); // <--- Agora não vai dar erro
    const navigate = useNavigate();
    const order = orders.find(o => o.id === id);

    if (!order) return <div className="p-8 text-center text-slate-500">Ordem não encontrada.</div>;

    return (
        <OrderDetail 
            order={order} 
            currentUser={user}
            onUpdateOrder={onUpdate} 
            onBack={() => navigate('/orders')} 
        />
    );
}

const App: React.FC = () => (
  <ThemeProvider>
    <Router>
       <AppContent />
    </Router>
  </ThemeProvider>
);

export default App;