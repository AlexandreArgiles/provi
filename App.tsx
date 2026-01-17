import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DataService } from './services/dataService';
import { User, ServiceOrder, Company } from './types';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Layout } from './components/Layout';
import { LoadingScreen } from './components/ui/Loading';

// Eager imports (componentes leves ou críticos)
import { Login } from './components/Login';
import { CreateOrderModal } from './components/CreateOrderModal';
import { CustomerApprovalPage } from './components/CustomerApprovalPage';
import { VerificationPage } from './components/VerificationPage';
import { ForcePasswordChange } from './components/ForcePasswordChange';
import { ShieldAlert } from 'lucide-react';

// Lazy imports (carregam só quando necessário)
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

    // Check URL params for public routes
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

    // Check Session
    const currentUser = DataService.getCurrentUser();
    if (currentUser) {
      handleUserSession(currentUser);
    }
    setIsLoadingAuth(false);
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
      // O redirecionamento agora deve ser feito pelo componente CreateOrderModal ou via callback que chame navigate
      // Mas como estamos no App, podemos deixar o modal fechar e a lista atualizar.
  };

  const handleUpdateOrder = (updatedOrder: ServiceOrder) => {
    const newOrders = orders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
    setOrders(newOrders);
    DataService.saveOrder(updatedOrder); 
  };

  // --- RENDER LOGIC ---

  if (isLoadingAuth) return <LoadingScreen />;

  // 1. PUBLIC ROUTES
  if (publicApprovalToken) {
      return <CustomerApprovalPage token={publicApprovalToken} onClose={() => { setPublicApprovalToken(null); window.history.pushState({}, '', '/'); }} />;
  }

  if (verificationHash) {
      return <VerificationPage hash={verificationHash} onClose={() => { setVerificationHash(null); const url = new URL(window.location.href); if (url.searchParams.has('verify')) { url.searchParams.delete('verify'); window.history.pushState({}, '', url.toString()); } }} />;
  }

  // 2. UNAUTHENTICATED
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // 3. BLOCKED STATE
  if (activeCompany && activeCompany.subscriptionStatus === 'BLOCKED' && user.role !== 'SUPER_ADMIN') {
      return (
          <div className="h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 p-6 text-center">
              <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <ShieldAlert className="w-12 h-12 text-red-600 dark:text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Acesso Suspenso</h1>
              <p className="text-slate-600 dark:text-slate-400 max-w-md mb-8">
                  Detectamos uma pendência financeira. O acesso foi bloqueado.
                  Contate o suporte.
              </p>
              <div className="flex gap-4">
                  <button onClick={handleLogout} className="text-slate-500 hover:text-slate-800 dark:text-slate-400">Sair</button>
                  <button className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 shadow-lg">Regularizar</button>
              </div>
          </div>
      );
  }

  // 4. PASSWORD CHANGE
  if (user.mustChangePassword) {
    return <ForcePasswordChange user={user} onSuccess={(updatedUser) => { setUser(updatedUser); loadData(); }} />;
  }

  // 5. SUPER ADMIN
  if (user.role === 'SUPER_ADMIN') {
      return (
          <Suspense fallback={<LoadingScreen />}>
              <Routes>
                  <Route path="/audit" element={<AuditLogView currentUser={user} />} />
                  <Route path="/privacy" element={<PrivacyDashboard currentUser={user} />} />
                  <Route path="*" element={<SuperAdminDashboard user={user} onLogout={handleLogout} />} />
              </Routes>
          </Suspense>
      );
  }

  // 6. MAIN APP ROUTES
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
          
          {/* ASSISTANCE MODULE */}
          <Route path="/orders" element={
            DataService.hasModule('ASSISTANCE') 
            ? <OrderList orders={orders} onSelectOrder={() => {}} onCreateOrder={() => setIsCreateModalOpen(true)} />
            : <UpgradeGate title="Módulo Assistência" description="Acesse ordens de serviço." />
          } />
          
          <Route path="/orders/:id" element={
             <OrderDetailWrapper orders={orders} user={user} onUpdate={handleUpdateOrder} />
          } />

          <Route path="/catalog" element={
            user.role === 'ADMIN' 
            ? <Catalog /> 
            : <Navigate to="/" replace />
          } />

           <Route path="/assistance-reports" element={
            user.role === 'ADMIN' 
            ? <AssistanceReports currentUser={user} />
            : <Navigate to="/" replace />
          } />

          {/* SALES MODULE */}
          <Route path="/pos" element={
             DataService.hasModule('SALES') ? <POS currentUser={user} /> : <UpgradeGate title="PDV" description="Vendas e Caixa." />
          } />
          <Route path="/inventory" element={
             DataService.hasModule('SALES') ? <InventoryList currentUser={user} /> : <UpgradeGate title="Estoque" description="Gestão de Produtos." />
          } />
          <Route path="/sales-history" element={
             DataService.hasModule('SALES') ? <SalesList /> : <UpgradeGate title="Histórico" description="Vendas passadas." />
          } />
          <Route path="/reports" element={
             user.role === 'ADMIN' && DataService.hasModule('SALES') ? <FinancialReports /> : <Navigate to="/" replace />
          } />

          {/* SHARED */}
          <Route path="/customers" element={<CustomerList currentUser={user} />} />
          
          {/* ADMIN */}
          <Route path="/team" element={user.role === 'ADMIN' ? <UserManagement currentUser={user} /> : <Navigate to="/" />} />
          <Route path="/audit" element={user.role === 'ADMIN' ? <AuditLogView currentUser={user} /> : <Navigate to="/" />} />
          <Route path="/privacy" element={user.role === 'ADMIN' ? <PrivacyDashboard currentUser={user} /> : <Navigate to="/" />} />
          <Route path="/settings" element={user.role === 'ADMIN' ? <Settings /> : <Navigate to="/" />} />
          <Route path="/plan" element={user.role === 'ADMIN' && activeCompany ? <div className="max-w-4xl mx-auto"><PlanManagement company={activeCompany} isSuperAdmin={false} /></div> : <Navigate to="/" />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
};

// Wrapper auxiliar para pegar o ID da URL e passar para o OrderDetail
import { useParams, useNavigate } from 'react-router-dom';

const OrderDetailWrapper: React.FC<{ orders: ServiceOrder[], user: User, onUpdate: (o: ServiceOrder) => void }> = ({ orders, user, onUpdate }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const order = orders.find(o => o.id === id);

    if (!order) return <div>Ordem não encontrada</div>;

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