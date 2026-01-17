import { ServiceOrder, User, CatalogItem, CompanySettings, AuditLog, OrderStatus, UserRole, UserFunction, Company, SystemAuditLog, PrivacyRequest, Customer, OrderFilters, InventoryItem, Sale, SaleItem, InventoryMovement, PaymentMethod, AppModule, PlanType, ServiceApproval, ServiceItem, DigitalSignature, WhatsappMessage, PublicVerificationResult, ServicePayment, Plan, Subscription, SaasBillingStats, AppNotification, NotificationType, Evidence } from '../types';

// Initial Seed Data
const DEFAULT_SETTINGS: CompanySettings = {
  name: 'TechFix Pro',
  whatsapp: '11999990000',
  warrantyTerms: 'Garantia de 90 dias para peças e mão de obra. Aparelhos não retirados em 90 dias serão descartados.',
  aiTone: 'formal',
  // NOVO: Templates Padrão com variáveis
  whatsappTemplates: {
      approvalRequest: "Olá {nome_cliente}, seu orçamento para a OS #{id_os} está pronto.\nValor: R$ {valor}\n\nConfira detalhes e aprove aqui: {link}\n\nAtenciosamente,\n{nome_empresa}",
      readyForPickup: "Olá {nome_cliente}, ótima notícia! Seu equipamento (OS #{id_os}) está pronto para retirada.\n\nFicamos no aguardo.\n{nome_empresa}"
  }
};

const MOCK_USERS: User[] = [
  { 
    id: 'u0', 
    name: 'Dono do SaaS', 
    email: 'super@providencia.app', 
    role: 'SUPER_ADMIN', 
    functions: ['BALCAO', 'BANCADA'],
    companyId: null, 
    avatar: 'https://i.pravatar.cc/150?u=super',
    mustChangePassword: false,
    active: true,
    isAnonymized: false,
    themePreference: 'system'
  },
  { 
    id: 'u1', 
    name: 'Admin Master', 
    email: 'admin@providencia.app', 
    role: 'ADMIN', 
    functions: ['BALCAO', 'BANCADA'],
    companyId: 'c1', 
    avatar: 'https://i.pravatar.cc/150?u=admin',
    mustChangePassword: false,
    active: true,
    isAnonymized: false,
    themePreference: 'dark' // Example preference
  },
  { 
    id: 'u2', 
    name: 'João Técnico', 
    email: 'tec@providencia.app', 
    role: 'FUNCIONARIO', 
    functions: ['BANCADA'],
    companyId: 'c1', 
    avatar: 'https://i.pravatar.cc/150?u=tec',
    mustChangePassword: true, 
    active: true,
    isAnonymized: false,
    themePreference: 'light'
  },
  // User for Company 2 (Assistência Only)
  { 
    id: 'u3', 
    name: 'Admin Mega', 
    email: 'admin@mega.app', 
    role: 'ADMIN', 
    functions: ['BALCAO', 'BANCADA'],
    companyId: 'c2', 
    avatar: 'https://i.pravatar.cc/150?u=mega',
    mustChangePassword: false,
    active: true,
    isAnonymized: false,
    themePreference: 'system'
  }
];

const MOCK_COMPANIES: Company[] = [
    { 
      id: 'c1', 
      name: 'TechFix Solutions', 
      active: true, 
      createdAt: new Date().toISOString(), 
      userCount: 5, 
      isAnonymized: false,
      planType: 'PRO_FULL',
      activeModules: ['ASSISTANCE', 'SALES'] 
    },
    { 
      id: 'c2', 
      name: 'Mega Cell Repairs', 
      active: true, 
      createdAt: new Date().toISOString(), 
      userCount: 2, 
      isAnonymized: false,
      planType: 'BASIC_ASSISTANCE',
      activeModules: ['ASSISTANCE'] // NO SALES MODULE
    },
];

const MOCK_CUSTOMERS: Customer[] = [
    {
        id: 'cust1',
        companyId: 'c1',
        name: 'Cliente Exemplo',
        phone: '11999999999',
        active: true,
        createdAt: Date.now()
    }
];

const STORAGE_KEYS = {
  ORDERS: 'providencia_orders_v2',
  USERS: 'providencia_users_v2', 
  COMPANIES: 'providencia_companies_v2', 
  CATALOG: 'providencia_catalog',
  CUSTOMERS: 'providencia_customers',
  SETTINGS: 'providencia_settings',
  SESSION: 'providencia_session',
  SYSTEM_AUDIT: 'providencia_audit_logs',
  PRIVACY_REQUESTS: 'providencia_privacy_requests',
  INVENTORY: 'providencia_inventory',
  SALES: 'providencia_sales',
  MOVEMENTS: 'providencia_movements',
  APPROVALS: 'providencia_approvals',
  SIGNATURES: 'providencia_signatures',
  WHATSAPP_MESSAGES: 'providencia_whatsapp_messages',
  SERVICE_PAYMENTS: 'providencia_service_payments',
  PLANS: 'providencia_saas_plans',
  SUBSCRIPTIONS: 'providencia_saas_subscriptions',
  NOTIFICATIONS: 'providencia_saas_notifications'
};

// Helper to strip passwords from logs
const sanitizeLogData = (data: any) => {
  if (!data) return data;
  const sanitized = { ...data };
  if (sanitized.password) sanitized.password = '[REDACTED]';
  return sanitized;
};

// Simple SHA-256 Hash implementation for browser (Sync version for demo)
const simpleHash = (str: string) => {
    let hash = 0, i, chr;
    if (str.length === 0) return hash.toString(16);
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return (Math.abs(hash).toString(16) + Math.abs(hash * 31).toString(16)).substring(0, 32);
};

// RETENTION POLICY CONSTANTS (In a real app, these might be configurable)
const RETENTION_DAYS_DELETED_USER = 90;
const RETENTION_DAYS_DELETED_COMPANY = 90;

export const DataService = {
  
  // === AUTH & SESSION ===
  login: (email: string): User | null => {
    const users = DataService.getUsers();
    // Simulate active check
    const user = users.find(u => u.email === email && !u.deletedAt && u.active);
    
    if (user) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
        DataService.addAuditLog('LOGIN', 'AUTH', user.id, `Login bem-sucedido: ${user.email}`);
        return user;
    }
    return null;
  },

  logout: () => {
    const user = DataService.getCurrentUser();
    if (user) {
        DataService.addAuditLog('LOGOUT', 'AUTH', user.id, `Logout: ${user.email}`);
    }
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },

  getCurrentUser: (): User | null => {
    const sessionStr = localStorage.getItem(STORAGE_KEYS.SESSION);
    return sessionStr ? JSON.parse(sessionStr) : null;
  },

  updateCurrentUserSession: (updatedUser: User) => {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(updatedUser));
  },

  // === SAAS NOTIFICATIONS ===
  getNotifications: (companyId: string): AppNotification[] => {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      const notifications: AppNotification[] = saved ? JSON.parse(saved) : [];
      return notifications
        .filter(n => n.companyId === companyId)
        .sort((a,b) => b.createdAt - a.createdAt);
  },

  markNotificationRead: (id: string) => {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (!saved) return;
      
      const notifications: AppNotification[] = JSON.parse(saved);
      const index = notifications.findIndex(n => n.id === id);
      
      if (index >= 0) {
          notifications[index].read = true;
          localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
      }
  },

  createNotification: (note: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      const notifications: AppNotification[] = saved ? JSON.parse(saved) : [];
      
      const newNote: AppNotification = {
          ...note,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          createdAt: Date.now(),
          read: false
      };
      
      notifications.unshift(newNote);
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  },

  // === AUTOMATIC BILLING CHECK ===
  runDailyBillingJob: () => {
      const subscriptions = DataService.getSubscriptions();
      const now = new Date();
      let hasUpdates = false;

      subscriptions.forEach(sub => {
          // Check if already processed today to avoid spamming on reload
          if (sub.lastCheckDate) {
              const lastCheck = new Date(sub.lastCheckDate);
              if (lastCheck.getDate() === now.getDate() && 
                  lastCheck.getMonth() === now.getMonth() && 
                  lastCheck.getFullYear() === now.getFullYear()) {
                  return; // Skip this sub
              }
          }

          const dueDate = new Date(sub.nextBillingDate);
          const diffTime = dueDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          // diffDays > 0 : Future
          // diffDays = 0 : Today
          // diffDays < 0 : Overdue

          // Logic for Warnings & Blocks
          // 5 days before
          if (diffDays === 5) {
              DataService.createNotification({
                  companyId: sub.companyId,
                  type: 'WARNING',
                  title: 'Fatura Vencendo em Breve',
                  message: `Sua assinatura renova em 5 dias. Valor: R$ ${sub.contractedPrice.toFixed(2)}.`
              });
          }
          // 1 day before
          if (diffDays === 1) {
              DataService.createNotification({
                  companyId: sub.companyId,
                  type: 'WARNING',
                  title: 'Fatura Vence Amanhã',
                  message: `Não perca o acesso. Sua fatura vence amanhã.`
              });
          }
          // Due Day
          if (diffDays === 0) {
              DataService.createNotification({
                  companyId: sub.companyId,
                  type: 'INFO',
                  title: 'Fatura Vence Hoje',
                  message: `O pagamento da sua assinatura está agendado para hoje.`
              });
          }
          // 3 Days Overdue
          if (diffDays === -3) {
              sub.status = 'PAST_DUE';
              DataService.createNotification({
                  companyId: sub.companyId,
                  type: 'ERROR',
                  title: 'Fatura em Atraso',
                  message: `Sua fatura venceu há 3 dias. Regularize para evitar bloqueio.`
              });
          }
          // 7 Days Overdue (Pre-Block)
          if (diffDays === -7) {
              sub.status = 'PAST_DUE';
              DataService.createNotification({
                  companyId: sub.companyId,
                  type: 'ERROR',
                  title: 'Aviso de Bloqueio',
                  message: `Sua conta será bloqueada em 3 dias caso o pagamento não seja identificado.`
              });
          }
          // 10 Days Overdue (BLOCK)
          if (diffDays <= -10 && sub.status !== 'BLOCKED') {
              sub.status = 'BLOCKED';
              DataService.createNotification({
                  companyId: sub.companyId,
                  type: 'ERROR',
                  title: 'Acesso Bloqueado',
                  message: `Sua conta está bloqueada por falta de pagamento. Contate o suporte.`
              });
              // Also update company status effectively?
              // The backend auth usually checks subscription status. We simulate this.
          }

          sub.lastCheckDate = Date.now();
          hasUpdates = true;
      });

      if (hasUpdates) {
          localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));
          // Sync changes to company objects if needed for faster lookup
          const companies = DataService.getCompanies();
          let companiesUpdated = false;
          companies.forEach(c => {
              const sub = subscriptions.find(s => s.companyId === c.id);
              if (sub && sub.status !== c.subscriptionStatus) {
                  c.subscriptionStatus = sub.status;
                  companiesUpdated = true;
              }
          });
          if (companiesUpdated) localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
      }
  },

  // === SAAS PLANS & BILLING ===

  getPlans: (): Plan[] => {
    const saved = localStorage.getItem(STORAGE_KEYS.PLANS);
    if (!saved) {
      // Seed default plans
      const defaultPlans: Plan[] = [
        {
          id: 'p_basic',
          name: 'Básico Assistência',
          planType: 'BASIC_ASSISTANCE',
          monthlyPrice: 99.00,
          active: true,
          limits: { users: 3, storageGB: 10, features: ['OS', 'Clientes'] },
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: 'p_sales',
          name: 'Básico Vendas',
          planType: 'BASIC_SALES',
          monthlyPrice: 129.00,
          active: true,
          limits: { users: 5, storageGB: 15, features: ['PDV', 'Estoque', 'Relatórios'] },
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: 'p_pro',
          name: 'Providencia PRO',
          planType: 'PRO_FULL',
          monthlyPrice: 199.00,
          active: true,
          limits: { users: -1, storageGB: 50, features: ['Tudo', 'API'] },
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ];
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(defaultPlans));
      return defaultPlans;
    }
    return JSON.parse(saved);
  },

  savePlan: (plan: Plan) => {
    const plans = DataService.getPlans();
    const index = plans.findIndex(p => p.id === plan.id);
    if (index >= 0) {
      plans[index] = { ...plan, updatedAt: Date.now() };
    } else {
      plans.push({ ...plan, createdAt: Date.now(), updatedAt: Date.now() });
    }
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(plans));
    DataService.addAuditLog('PLAN_UPDATE', 'PLAN', plan.id, `Plano ${plan.name} atualizado. Preço: R$${plan.monthlyPrice}`);
  },

  getSubscriptions: (): Subscription[] => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
    let subs: Subscription[] = saved ? JSON.parse(saved) : [];
    
    // Auto-generate subscriptions for mock companies if missing
    const companies = DataService.getCompanies();
    const plans = DataService.getPlans();
    let hasChanges = false;

    companies.forEach(company => {
      const existing = subs.find(s => s.companyId === company.id);
      if (!existing && !company.deletedAt) {
        // Create active subscription
        const plan = plans.find(p => p.planType === company.planType) || plans[0];
        const newSub: Subscription = {
          id: `sub_${company.id}`,
          companyId: company.id,
          planId: plan.id,
          planNameSnapshot: plan.name,
          contractedPrice: plan.monthlyPrice, // Lock in current price
          status: 'ACTIVE',
          startDate: new Date(company.createdAt).getTime(),
          nextBillingDate: Date.now() + (30 * 24 * 60 * 60 * 1000)
        };
        subs.push(newSub);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subs));
    }

    return subs;
  },

  updateSubscription: (sub: Subscription) => {
    const subs = DataService.getSubscriptions();
    const index = subs.findIndex(s => s.id === sub.id);
    if (index >= 0) {
      subs[index] = sub;
      localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subs));
      
      // Update company denormalized status
      const companies = DataService.getCompanies();
      const compIndex = companies.findIndex(c => c.id === sub.companyId);
      if (compIndex >= 0) {
          companies[compIndex].subscriptionStatus = sub.status;
          localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
      }
    }
  },

  getSaaSBillingStats: (): SaasBillingStats => {
    const subs = DataService.getSubscriptions();
    const activeSubs = subs.filter(s => s.status === 'ACTIVE' || s.status === 'PAST_DUE');
    const delinquent = subs.filter(s => s.status === 'PAST_DUE' || s.status === 'BLOCKED').length;
    
    // MRR = Sum of contracted prices
    const mrr = activeSubs.reduce((acc, sub) => acc + sub.contractedPrice, 0);
    
    // Distros
    const revenueByPlanMap: Record<string, number> = {};
    const customersByPlanMap: Record<string, number> = {};

    activeSubs.forEach(sub => {
      const name = sub.planNameSnapshot;
      revenueByPlanMap[name] = (revenueByPlanMap[name] || 0) + sub.contractedPrice;
      customersByPlanMap[name] = (customersByPlanMap[name] || 0) + 1;
    });

    const revenueByPlan = Object.entries(revenueByPlanMap).map(([name, value]) => ({ name, value }));
    const customersByPlan = Object.entries(customersByPlanMap).map(([name, value]) => ({ name, value }));

    return {
      mrr,
      totalCustomers: activeSubs.length,
      activeSubscriptions: activeSubs.length,
      delinquentCount: delinquent,
      revenueByPlan,
      customersByPlan,
      recentSubscriptions: subs.sort((a,b) => b.startDate - a.startDate).slice(0, 5)
    };
  },

  // === USERS & COMPANIES ===
  getUsers: (): User[] => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!saved) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(MOCK_USERS));
        return MOCK_USERS;
    }
    return JSON.parse(saved);
  },

  saveUser: (user: User) => {
    const users = DataService.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
        users[index] = user;
    } else {
        users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    // Update session if it's the current user
    const current = DataService.getCurrentUser();
    if (current && current.id === user.id) {
        DataService.updateCurrentUserSession(user);
    }
  },

  // NEW: Robust User Deletion (Soft)
  deleteUser: (id: string) => {
      const users = DataService.getUsers();
      const index = users.findIndex(u => u.id === id);
      if (index >= 0) {
          users[index].active = false;
          users[index].deletedAt = new Date().toISOString();
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
          
          DataService.addAuditLog('USER_DELETE', 'USER', id, 'Usuário excluído (Soft Delete)');
      }
  },

  toggleUserStatus: (userId: string) => {
      const users = DataService.getUsers();
      const user = users.find(u => u.id === userId);
      if (user) {
          user.active = !user.active;
          DataService.saveUser(user);
          DataService.addAuditLog('USER_STATUS_CHANGE', 'USER', userId, `Status alterado para ${user.active ? 'Ativo' : 'Inativo'}`);
      }
  },

  getCompanies: (): Company[] => {
    const saved = localStorage.getItem(STORAGE_KEYS.COMPANIES);
    if (!saved) {
        // Seed default with active status
        const seeded = MOCK_COMPANIES.map(c => ({...c, subscriptionStatus: 'ACTIVE' as const}));
        localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(seeded));
        return seeded;
    }
    return JSON.parse(saved);
  },

  saveCompany: (company: Company) => {
      const companies = DataService.getCompanies();
      const index = companies.findIndex(c => c.id === company.id);
      
      // Handle subscription logic when company plan changes
      if (index >= 0) {
          const oldPlan = companies[index].planType;
          if (oldPlan !== company.planType) {
             // Logic to update subscription
             const subs = DataService.getSubscriptions();
             const subIndex = subs.findIndex(s => s.companyId === company.id);
             const plans = DataService.getPlans();
             const newPlan = plans.find(p => p.planType === company.planType);
             
             if (subIndex >= 0 && newPlan) {
                 subs[subIndex] = {
                     ...subs[subIndex],
                     planId: newPlan.id,
                     planNameSnapshot: newPlan.name,
                     contractedPrice: newPlan.monthlyPrice // Update price on plan change
                 };
                 localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subs));
             }
          }
          companies[index] = company;
      } else {
          companies.push(company);
          // Subscription creation handled in getSubscriptions auto-seed or could be explicit here
      }
      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
  },

  // FIX: Robust Company Deletion (Cascade to users)
  deleteCompany: (id: string) => {
      // 1. Update Company
      const companies = DataService.getCompanies();
      const compIndex = companies.findIndex(c => c.id === id);
      if (compIndex >= 0) {
          companies[compIndex].active = false;
          companies[compIndex].deletedAt = new Date().toISOString();
          localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
          DataService.addAuditLog('COMPANY_DELETE', 'COMPANY', id, 'Empresa excluída (Soft Delete)');
      }

      // 2. Update Users (Batch) to avoid loop race conditions
      const users = DataService.getUsers();
      let usersUpdated = false;
      
      users.forEach(u => {
          if (u.companyId === id && !u.deletedAt) {
              u.active = false;
              u.deletedAt = new Date().toISOString();
              usersUpdated = true;
          }
      });

      if (usersUpdated) {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }

      // 3. Subscription Cancel
      const subs = DataService.getSubscriptions();
      const subIndex = subs.findIndex(s => s.companyId === id);
      if (subIndex >= 0) {
          subs[subIndex].status = 'CANCELLED';
          localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subs));
      }
  },

  // === SETTINGS ===
  getSettings: (): CompanySettings => {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  },

  saveSettings: (settings: CompanySettings) => {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      DataService.addAuditLog('SETTINGS_UPDATE', 'SETTINGS', 'global', 'Configurações da empresa atualizadas');
  },

  // === ORDERS ===
  getOrders: (includeDeleted = true): ServiceOrder[] => {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      let orders: ServiceOrder[] = saved ? JSON.parse(saved) : [];
      
      // Tenant Filtering
      const user = DataService.getCurrentUser();
      if (user && user.role !== 'SUPER_ADMIN') {
          orders = orders.filter(o => o.companyId === user.companyId);
      }

      return orders.sort((a,b) => b.createdAt - a.createdAt);
  },

  getOrderById: (id: string): ServiceOrder | undefined => {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      const orders: ServiceOrder[] = saved ? JSON.parse(saved) : [];
      return orders.find(o => o.id === id);
  },

  saveOrder: (order: ServiceOrder) => {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      const allOrders: ServiceOrder[] = saved ? JSON.parse(saved) : [];
      
      const index = allOrders.findIndex(o => o.id === order.id);
      
      // We must preserve companyId integrity if not provided in update
      if (index >= 0) {
          allOrders[index] = { ...allOrders[index], ...order, updatedAt: Date.now() };
      } else {
          allOrders.unshift({ ...order, updatedAt: Date.now() });
      }
      
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(allOrders));
  },

  searchOrders: (filters: OrderFilters): ServiceOrder[] => {
      let orders = DataService.getOrders();
      
      if (filters.query) {
          const q = filters.query.toLowerCase();
          orders = orders.filter(o => 
              o.customerName.toLowerCase().includes(q) || 
              o.customerPhone.includes(q) || 
              o.id.toLowerCase().includes(q)
          );
      }
      if (filters.status && filters.status.length > 0) {
          orders = orders.filter(o => filters.status?.includes(o.status));
      }
      if (filters.device) {
          orders = orders.filter(o => o.device.toLowerCase().includes(filters.device!.toLowerCase()));
      }
      if (filters.protocol) {
          orders = orders.filter(o => o.id.includes(filters.protocol!));
      }
      if (filters.startDate) {
          const start = new Date(filters.startDate).getTime();
          orders = orders.filter(o => o.createdAt >= start);
      }
      if (filters.endDate) {
          const end = new Date(filters.endDate).setHours(23, 59, 59, 999);
          orders = orders.filter(o => o.createdAt <= end);
      }
      
      return orders;
  },

  // === CUSTOMERS ===
  getCustomers: (companyId: string): Customer[] => {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      const allCustomers: Customer[] = saved ? JSON.parse(saved) : MOCK_CUSTOMERS;
      return allCustomers.filter(c => c.companyId === companyId && c.active).sort((a,b) => b.createdAt - a.createdAt);
  },

  searchCustomers: (query: string, companyId: string): Customer[] => {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      const customers: Customer[] = saved ? JSON.parse(saved) : MOCK_CUSTOMERS;
      
      const q = query.toLowerCase();
      return customers.filter(c => 
          c.companyId === companyId && 
          c.active &&
          (c.name.toLowerCase().includes(q) || c.phone.includes(q))
      );
  },

  findCustomerByPhone: (phone: string, companyId: string): Customer | undefined => {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      const customers: Customer[] = saved ? JSON.parse(saved) : MOCK_CUSTOMERS;
      return customers.find(c => c.companyId === companyId && c.phone.replace(/\D/g,'') === phone.replace(/\D/g,''));
  },

  saveCustomer: (customer: Customer) => {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      const customers: Customer[] = saved ? JSON.parse(saved) : MOCK_CUSTOMERS;
      
      const index = customers.findIndex(c => c.id === customer.id);
      if (index >= 0) {
          customers[index] = { ...customer, updatedAt: Date.now() };
      } else {
          customers.push(customer);
      }
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  },

  deleteCustomer: (id: string) => {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      const customers: Customer[] = saved ? JSON.parse(saved) : MOCK_CUSTOMERS;
      const index = customers.findIndex(c => c.id === id);
      
      if (index >= 0) {
          customers[index] = { ...customers[index], active: false, updatedAt: Date.now() };
          localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
          DataService.addAuditLog('CUSTOMER_DELETE', 'CUSTOMER', id, 'Cliente inativado');
      }
  },

  getCustomerHistory: (customerId: string): ServiceOrder[] => {
      // getOrders automatically handles company filtering if current user is set,
      // but to be safe and specific, we filter strictly by customerId here.
      // We pass true to include deleted orders in history if desired, or false for active only.
      // Usually history includes everything.
      const allOrders = DataService.getOrders(true);
      return allOrders.filter(o => o.customerId === customerId).sort((a,b) => b.createdAt - a.createdAt);
  },

  // === CATALOG ===
  getCatalog: (): CatalogItem[] => {
      const saved = localStorage.getItem(STORAGE_KEYS.CATALOG);
      return saved ? JSON.parse(saved) : [];
  },

  saveCatalogItem: (item: CatalogItem) => {
      const items = DataService.getCatalog();
      const index = items.findIndex(i => i.id === item.id);
      if (index >= 0) {
          items[index] = item;
      } else {
          items.push(item);
      }
      localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(items));
  },

  deleteCatalogItem: (id: string) => {
      const items = DataService.getCatalog();
      const newItems = items.filter(i => i.id !== id);
      localStorage.setItem(STORAGE_KEYS.CATALOG, JSON.stringify(newItems));
  },

  // === INVENTORY ===
  getInventory: (): InventoryItem[] => {
      const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      let items: InventoryItem[] = saved ? JSON.parse(saved) : [];
      
      // Filter by company
      const user = DataService.getCurrentUser();
      if (user && user.role !== 'SUPER_ADMIN') {
          items = items.filter(i => i.companyId === user.companyId);
      }
      return items;
  },

  findInventoryItemByBarcode: (barcode: string): InventoryItem | undefined => {
      const items = DataService.getInventory();
      return items.find(i => i.barcode === barcode);
  },

  saveInventoryItem: (item: InventoryItem) => {
      const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      const items: InventoryItem[] = saved ? JSON.parse(saved) : [];
      
      const index = items.findIndex(i => i.id === item.id);
      if (index >= 0) {
          items[index] = item;
      } else {
          items.push(item);
      }
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(items));
  },

  adjustStock: (itemId: string, qty: number, type: 'IN' | 'OUT', reason: string) => {
      const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      const items: InventoryItem[] = saved ? JSON.parse(saved) : [];
      const user = DataService.getCurrentUser();

      const item = items.find(i => i.id === itemId);
      if (!item) throw new Error("Item not found");

      if (type === 'OUT' && item.quantity < qty) {
          throw new Error("Estoque insuficiente");
      }

      item.quantity = type === 'IN' ? item.quantity + qty : item.quantity - qty;
      item.updatedAt = Date.now();

      // Record Movement
      const movement: InventoryMovement = {
          id: Date.now().toString(),
          inventoryItemId: itemId,
          companyId: item.companyId,
          type,
          quantity: qty,
          reason,
          performedBy: user?.name || 'System',
          createdAt: Date.now()
      };
      
      const moves = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
      const movements = moves ? JSON.parse(moves) : [];
      movements.push(movement);

      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(items));
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
  },

  bulkImportInventory: (items: Partial<InventoryItem>[], conflictMode: 'SKIP' | 'UPDATE') => {
      const user = DataService.getCurrentUser();
      if (!user) throw new Error("User required");
      
      const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      const inventory: InventoryItem[] = saved ? JSON.parse(saved) : [];
      
      let createdCount = 0;
      let updatedCount = 0;

      items.forEach(newItem => {
          // Identify by Barcode or Name (within company)
          const existingIndex = inventory.findIndex(i => 
              i.companyId === user.companyId &&
              ((newItem.barcode && i.barcode === newItem.barcode) || 
              (i.name.toLowerCase() === newItem.name?.toLowerCase()))
          );

          if (existingIndex >= 0) {
              if (conflictMode === 'UPDATE') {
                  inventory[existingIndex] = { ...inventory[existingIndex], ...newItem, updatedAt: Date.now() } as InventoryItem;
                  updatedCount++;
              }
          } else {
              const item: InventoryItem = {
                  ...newItem,
                  id: Date.now().toString() + Math.random().toString().slice(2,5),
                  companyId: user.companyId || '',
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                  active: true
              } as InventoryItem;
              inventory.push(item);
              createdCount++;
          }
      });

      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
      return { createdCount, updatedCount };
  },

  // === SALES ===
  getSales: (): Sale[] => {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      let sales: Sale[] = saved ? JSON.parse(saved) : [];
      
      const user = DataService.getCurrentUser();
      if (user && user.role !== 'SUPER_ADMIN') {
          sales = sales.filter(s => s.companyId === user.companyId);
      }
      return sales.sort((a,b) => b.createdAt - a.createdAt);
  },

  createSale: (saleData: Omit<Sale, 'id' | 'createdAt'>) => {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      const sales: Sale[] = saved ? JSON.parse(saved) : [];
      
      // 1. Calculate Total
      const total = saleData.items.reduce((acc, item) => acc + item.subtotal, 0);
      
      const newSale: Sale = {
          ...saleData,
          id: Date.now().toString(),
          totalValue: total,
          createdAt: Date.now()
      };

      // 2. Decrement Stock
      saleData.items.forEach(item => {
          DataService.adjustStock(item.inventoryItemId, item.quantity, 'OUT', `Venda #${newSale.id}`);
      });

      // 3. Save Sale
      sales.push(newSale);
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
      return newSale;
  },

  getFinancialStats: () => {
      const sales = DataService.getSales();
      const orders = DataService.getOrders();
      
      // Helper for sum
      const sum = (arr: any[], key: string) => arr.reduce((acc, i) => acc + (i[key] || 0), 0);

      // Period stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const startOfWeek = now.getTime() - (7 * 24 * 60 * 60 * 1000);

      const monthlySales = sales.filter(s => s.createdAt >= startOfMonth);
      const weeklySales = sales.filter(s => s.createdAt >= startOfWeek);
      
      // Service Revenue (Completed/Paid orders)
      const serviceOrders = orders.filter(o => [OrderStatus.CONCLUIDO, OrderStatus.RETIRADO, OrderStatus.PAGO].includes(o.status));
      const monthlyServices = serviceOrders.filter(o => o.createdAt >= startOfMonth); // Using createdAt as proxy for revenue date for simplicity
      const weeklyServices = serviceOrders.filter(o => o.createdAt >= startOfWeek);

      // Profit Calculation (Sales only for now)
      const allTimeProfit = sales.reduce((acc, sale) => {
          const saleCost = sale.items.reduce((c, item) => c + (item.costPriceSnapshot * item.quantity), 0);
          return acc + (sale.totalValue - saleCost);
      }, 0);

      // Top Items
      const itemCounts: Record<string, number> = {};
      sales.forEach(s => s.items.forEach(i => {
          itemCounts[i.name] = (itemCounts[i.name] || 0) + i.quantity;
      }));
      const topItems = Object.entries(itemCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a,b) => b.count - a.count)
          .slice(0, 5);

      return {
          allTime: {
              revenue: sum(sales, 'totalValue'),
              serviceRevenue: sum(serviceOrders, 'totalValue'),
              totalRevenue: sum(sales, 'totalValue') + sum(serviceOrders, 'totalValue'),
              profit: allTimeProfit
          },
          monthly: {
              revenue: sum(monthlySales, 'totalValue'),
              serviceRevenue: sum(monthlyServices, 'totalValue')
          },
          weekly: {
              revenue: sum(weeklySales, 'totalValue'),
              serviceRevenue: sum(weeklyServices, 'totalValue')
          },
          topItems
      };
  },

  // --- SERVICE PAYMENTS (NEW) ---
  saveServicePayment: (paymentData: Omit<ServicePayment, 'id' | 'paidAt' | 'receivedBy' | 'receivedById' | 'companyId'>) => {
      const currentUser = DataService.getCurrentUser();
      if (!currentUser) throw new Error("Usuário não autenticado");

      const saved = localStorage.getItem(STORAGE_KEYS.SERVICE_PAYMENTS);
      const payments: ServicePayment[] = saved ? JSON.parse(saved) : [];

      const newPayment: ServicePayment = {
          ...paymentData,
          id: Date.now().toString() + 'pay',
          companyId: currentUser.companyId || 'c1',
          paidAt: Date.now(),
          receivedBy: currentUser.name,
          receivedById: currentUser.id
      };

      localStorage.setItem(STORAGE_KEYS.SERVICE_PAYMENTS, JSON.stringify([...payments, newPayment]));

      DataService.addAuditLog(
          'PAYMENT_RECEIVED',
          'PAYMENT',
          newPayment.id,
          `Pagamento de R$ ${newPayment.amount.toFixed(2)} registrado para OS ${newPayment.serviceOrderId} (${newPayment.paymentMethod})`
      );

      return newPayment;
  },

  deleteServicePayment: (id: string) => {
      const currentUser = DataService.getCurrentUser();
      const saved = localStorage.getItem(STORAGE_KEYS.SERVICE_PAYMENTS);
      const payments: ServicePayment[] = saved ? JSON.parse(saved) : [];
      
      const paymentToDelete = payments.find(p => p.id === id);
      if (!paymentToDelete) return;

      const newPayments = payments.filter(p => p.id !== id);
      localStorage.setItem(STORAGE_KEYS.SERVICE_PAYMENTS, JSON.stringify(newPayments));

      DataService.addAuditLog(
          'PAYMENT_DELETED',
          'PAYMENT',
          id,
          `Pagamento de R$ ${paymentToDelete.amount.toFixed(2)} estornado/removido por ${currentUser?.name}`
      );
  },

  getServicePayments: (orderId?: string): ServicePayment[] => {
      const saved = localStorage.getItem(STORAGE_KEYS.SERVICE_PAYMENTS);
      let payments: ServicePayment[] = saved ? JSON.parse(saved) : [];
      
      const currentUser = DataService.getCurrentUser();
      if (currentUser && currentUser.role !== 'SUPER_ADMIN') {
          payments = payments.filter(p => p.companyId === currentUser.companyId);
      }

      if (orderId) {
          payments = payments.filter(p => p.serviceOrderId === orderId);
      }

      return payments.sort((a,b) => b.paidAt - a.paidAt);
  },

  // --- WHATSAPP INTEGRATION ---
  
  getWhatsappMessages: (orderId: string): WhatsappMessage[] => {
      const saved = localStorage.getItem(STORAGE_KEYS.WHATSAPP_MESSAGES);
      const messages: WhatsappMessage[] = saved ? JSON.parse(saved) : [];
      return messages.filter(m => m.serviceOrderId === orderId).sort((a,b) => b.sentAt - a.sentAt);
  },

  createWhatsappMessage: (msg: Omit<WhatsappMessage, 'id' | 'sentAt' | 'sentBy' | 'companyId'>) => {
      const currentUser = DataService.getCurrentUser();
      // Allow if system generated (no user logged in scenario, e.g. customer page)
      const senderName = currentUser ? currentUser.name : 'Sistema Automático';
      const companyId = currentUser ? (currentUser.companyId || 'c1') : 'c1'; // Fallback

      const saved = localStorage.getItem(STORAGE_KEYS.WHATSAPP_MESSAGES);
      const messages: WhatsappMessage[] = saved ? JSON.parse(saved) : [];

      const newMessage: WhatsappMessage = {
          ...msg,
          id: Date.now().toString() + 'wa',
          sentAt: Date.now(),
          sentBy: senderName,
          companyId: companyId
      };

      localStorage.setItem(STORAGE_KEYS.WHATSAPP_MESSAGES, JSON.stringify([...messages, newMessage]));
      
      DataService.addAuditLog(
          'WHATSAPP_SENT',
          'WHATSAPP',
          newMessage.id,
          `Mensagem enviada (Link) para ${newMessage.customerPhone}`
      );

      return newMessage;
  },

  sanitizePhone: (phone: string): string => {
      // Remove all non-numeric chars
      const num = phone.replace(/\D/g, '');
      if (num.length >= 10 && num.length <= 11) {
          return `55${num}`;
      }
      return num;
  },

  generateWhatsAppLink: (phone: string, text: string): string => {
      const cleanPhone = DataService.sanitizePhone(phone);
      const encodedText = encodeURIComponent(text);
      return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  },

  // --- APPROVAL SYSTEM ---
  
  createApprovalRequest: (orderId: string, items: ServiceItem[], description: string): ServiceApproval => {
      const currentUser = DataService.getCurrentUser();
      if (!currentUser) throw new Error("User not authenticated");

      const approvals = DataService.getApprovals();
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15); // Simple UUID Sim
      
      const newApproval: ServiceApproval = {
          id: Date.now().toString(),
          serviceOrderId: orderId,
          companyId: currentUser.companyId || 'c1',
          token,
          type: 'ORCAMENTO',
          status: 'PENDING',
          itemsSnapshot: items,
          totalValue: items.reduce((acc, i) => acc + i.price, 0),
          description: description, // Manual description
          aiUsed: false,
          createdAt: Date.now(),
          createdBy: currentUser.id
      };

      localStorage.setItem(STORAGE_KEYS.APPROVALS, JSON.stringify([...approvals, newApproval]));
      
      DataService.addAuditLog(
          'APPROVAL_REQUESTED', 
          'APPROVAL', 
          newApproval.id, 
          `Solicitação manual gerada para OS ${orderId}`
      );

      return newApproval;
  },

  registerInPersonApproval: (
      orderId: string, 
      items: ServiceItem[], 
      approvalData: { signedName: string, signatureImage: string, confirmed: boolean, document?: string },
      receiptUrl?: string // Optional pre-generated URL, though usually generated after hash
  ) => {
      const currentUser = DataService.getCurrentUser();
      if (!currentUser) throw new Error("User not authenticated");

      const approvals = DataService.getApprovals();
      const token = Math.random().toString(36).substring(2, 15); // Dummy token for consistency

      // Fetch Order to get the real technical notes
      const orders = DataService.getOrders(true);
      const orderIndex = orders.findIndex(o => o.id === orderId);
      
      let description = 'Aprovação presencial realizada em loja.';
      if (orderIndex >= 0) {
          description = orders[orderIndex].technicalNotes || description;
      }

      // 1. Create Approval Record (Already APPROVED)
      const newApproval: ServiceApproval = {
          id: Date.now().toString(),
          serviceOrderId: orderId,
          companyId: currentUser.companyId || 'c1',
          token,
          type: 'ORCAMENTO',
          approvalMethod: 'PRESENCIAL',
          status: 'APPROVED', // Immediate approval
          itemsSnapshot: items,
          totalValue: items.reduce((acc, i) => acc + i.price, 0),
          description: description,
          aiUsed: false,
          createdAt: Date.now(),
          createdBy: currentUser.id,
          respondedAt: Date.now(),
          ipAddress: 'LOCAL_DEVICE',
          userAgent: navigator.userAgent,
          signerDocument: approvalData.document
      };

      // 2. Save Signature
      const signature = DataService.saveSignature({
          serviceApprovalId: newApproval.id,
          signatureImage: approvalData.signatureImage,
          signedName: approvalData.signedName,
          confirmationChecked: approvalData.confirmed
      });

      // 3. Generate Verification Hash (Secure link between approval and signature)
      const verificationHash = DataService.generateVerificationHash(newApproval, signature.id);
      newApproval.verificationHash = verificationHash;
      newApproval.digitalSignatureId = signature.id;
      if (receiptUrl) newApproval.receiptUrl = receiptUrl;

      // Save Approval
      localStorage.setItem(STORAGE_KEYS.APPROVALS, JSON.stringify([...approvals, newApproval]));

      // 4. Update Order Status
      // We already fetched orders above
      
      if (orderIndex >= 0) {
          const order = orders[orderIndex];
          const newStatus = OrderStatus.APROVADO;
          
          const historyEntry = {
              from: order.status,
              to: newStatus,
              timestamp: Date.now(),
              changedBy: currentUser.id,
              changedByName: `${currentUser.name} (Presencial)`,
              reason: 'Cliente aprovou na loja'
          };

          const updatedItems = order.items.map(i => ({ ...i, approved: true }));

          const updatedOrder = {
              ...order,
              status: newStatus,
              items: updatedItems,
              statusHistory: [historyEntry, ...(order.statusHistory || [])],
              totalValue: newApproval.totalValue
          };

          const allOrders = [...orders];
          allOrders[orderIndex] = updatedOrder;
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(allOrders));

          DataService.addAuditLog(
              'APPROVAL_IN_PERSON',
              'ORDER',
              order.id,
              `Aprovação presencial registrada por ${currentUser.name}. Assinado por: ${approvalData.signedName}`
          );
      }

      return newApproval;
  },

  registerPhysicalApproval: (
      orderId: string, 
      items: ServiceItem[],
      file: File,
      fileUrl: string
  ) => {
      const currentUser = DataService.getCurrentUser();
      if (!currentUser) throw new Error("Usuário não autenticado");

      // 1. Create Evidence for the document
      const evidenceId = Date.now().toString();
      const newEvidence: Evidence = {
          id: evidenceId,
          orderId,
          type: 'APROVACAO_DOCUMENTAL',
          url: fileUrl,
          description: 'Termo de Aprovação Assinado (Físico)',
          fileHash: 'PENDING_HASH', // Simplified
          uploadedBy: currentUser.id,
          uploadedByName: currentUser.name,
          timestamp: Date.now(),
          active: true
      };

      const orders = DataService.getOrders(true);
      const orderIndex = orders.findIndex(o => o.id === orderId);
      
      if (orderIndex === -1) throw new Error("Ordem não encontrada");
      const order = orders[orderIndex];
      const description = order.technicalNotes || 'Aprovação via documento físico assinado.';
      
      // Update Order Evidence List
      const updatedEvidence = [...order.evidence, newEvidence];

      // 2. Create Approval Record
      const approvals = DataService.getApprovals();
      const token = Math.random().toString(36).substring(2, 15);
      
      const newApproval: ServiceApproval = {
          id: Date.now().toString(),
          serviceOrderId: orderId,
          companyId: currentUser.companyId || 'c1',
          token,
          type: 'ORCAMENTO',
          approvalMethod: 'PRESENCIAL_DOCUMENTO',
          status: 'APPROVED',
          itemsSnapshot: items,
          totalValue: items.reduce((acc, i) => acc + i.price, 0),
          description: description,
          aiUsed: false,
          createdAt: Date.now(),
          createdBy: currentUser.id,
          respondedAt: Date.now(),
          evidenceId: evidenceId
      };

      localStorage.setItem(STORAGE_KEYS.APPROVALS, JSON.stringify([...approvals, newApproval]));

      // 3. Update Order Status
      const newStatus = OrderStatus.APROVADO;
      const historyEntry = {
          from: order.status,
          to: newStatus,
          timestamp: Date.now(),
          changedBy: currentUser.id,
          changedByName: `${currentUser.name} (Documento Físico)`,
          reason: 'Aprovação via upload de termo assinado'
      };

      const updatedItems = order.items.map(i => ({ ...i, approved: true }));

      const updatedOrder = {
          ...order,
          status: newStatus,
          items: updatedItems,
          evidence: updatedEvidence,
          statusHistory: [historyEntry, ...(order.statusHistory || [])],
          totalValue: newApproval.totalValue
      };

      const allOrders = [...orders];
      allOrders[orderIndex] = updatedOrder;
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(allOrders));

      DataService.addAuditLog(
          'APPROVAL_PHYSICAL_DOC',
          'ORDER',
          order.id,
          `Aprovação documental registrada por ${currentUser.name}.`
      );

      return newApproval;
  },

  getApprovals: (): ServiceApproval[] => {
      const saved = localStorage.getItem(STORAGE_KEYS.APPROVALS);
      return saved ? JSON.parse(saved) : [];
  },

  getApprovalByToken: (token: string): ServiceApproval | undefined => {
      const approvals = DataService.getApprovals();
      return approvals.find(a => a.token === token);
  },

  getApprovalByOrderId: (orderId: string): ServiceApproval | undefined => {
      const approvals = DataService.getApprovals();
      // Returns the most recent one
      return approvals.filter(a => a.serviceOrderId === orderId).sort((a,b) => b.createdAt - a.createdAt)[0];
  },

  // NEW: Save Digital Signature
  saveSignature: (signatureData: Omit<DigitalSignature, 'id' | 'signedAt'>) => {
      const saved = localStorage.getItem(STORAGE_KEYS.SIGNATURES);
      const signatures: DigitalSignature[] = saved ? JSON.parse(saved) : [];
      
      const newSignature: DigitalSignature = {
          ...signatureData,
          id: Date.now().toString() + 'sig',
          signedAt: Date.now()
      };

      localStorage.setItem(STORAGE_KEYS.SIGNATURES, JSON.stringify([...signatures, newSignature]));
      
      DataService.addAuditLog(
          'SIGNATURE_CREATED',
          'SIGNATURE',
          newSignature.id,
          `Assinatura capturada de ${newSignature.signedName}`
      );

      return newSignature;
  },

  getSignature: (id: string): DigitalSignature | undefined => {
      const saved = localStorage.getItem(STORAGE_KEYS.SIGNATURES);
      const signatures: DigitalSignature[] = saved ? JSON.parse(saved) : [];
      return signatures.find(s => s.id === id);
  },

  // NEW: Generate Secure Verification Hash
  generateVerificationHash: (approval: ServiceApproval, signatureId: string): string => {
      // Create a deterministic string based on immutable facts
      const rawData = [
          approval.id,
          approval.serviceOrderId,
          approval.totalValue.toFixed(2),
          approval.companyId,
          signatureId,
          'PROVIDENCIA_SECURE_SALT_V1' 
      ].join('|');
      
      return simpleHash(rawData);
  },

  // NEW: Verify Document Publicly
  verifyDocument: (hash: string): PublicVerificationResult | { isValid: false } => {
      const approvals = DataService.getApprovals();
      // In a real DB, this would be an indexed lookup
      const match = approvals.find(a => a.verificationHash === hash);

      DataService.addAuditLog(
          'VERIFICATION_ATTEMPT',
          'VERIFICATION',
          hash,
          match ? 'Sucesso: Documento válido encontrado' : 'Falha: Hash inválido',
          { before: { hash } }
      );

      if (!match || !match.verificationHash) {
          return { isValid: false };
      }

      // Fetch related data for display (safe fields only)
      const settings = DataService.getSettings(); // Assuming this fetches context settings in demo
      const orders = DataService.getOrders(true);
      const order = orders.find(o => o.id === match.serviceOrderId);
      
      if (!order) return { isValid: false }; // Consistency check

      return {
          isValid: true,
          hash: match.verificationHash,
          companyName: settings.name, // In real multi-tenant, fetch company by ID
          companyCnpj: settings.cnpj,
          osProtocol: match.serviceOrderId,
          approvedAt: match.respondedAt || 0,
          totalValue: match.totalValue,
          customerFirstName: order.customerName.split(' ')[0] // Privacy
      };
  },

  createTestVerificationRecord: () => {
      const hash = 'TEST-HASH-' + Date.now().toString(16).toUpperCase();
      const mockApproval: ServiceApproval = {
          id: 'test-approval-' + Date.now(),
          serviceOrderId: 'PREVIEW-123',
          companyId: 'c1',
          token: 'test-token-' + Date.now(),
          type: 'ORCAMENTO',
          status: 'APPROVED',
          itemsSnapshot: [
              { id: '1', name: 'Troca de Tela', price: 1200, approved: true, severity: 'critical', description: '', required: true },
              { id: '2', name: 'Bateria Premium', price: 450, approved: true, severity: 'recommended', description: '', required: false }
          ],
          totalValue: 1650,
          description: 'Teste de Verificação de Autenticidade (Demonstração)',
          aiUsed: false,
          createdAt: Date.now(),
          createdBy: 'u1',
          respondedAt: Date.now(),
          verificationHash: hash,
          ipAddress: '127.0.0.1',
          digitalSignatureId: 'sig-test'
      };

      const approvals = DataService.getApprovals();
      approvals.push(mockApproval);
      localStorage.setItem(STORAGE_KEYS.APPROVALS, JSON.stringify(approvals));
      
      const orders = DataService.getOrders(true);
      if (!orders.find(o => o.id === 'PREVIEW-123')) {
          const mockOrder: ServiceOrder = {
            id: 'PREVIEW-123',
            customerName: 'Cliente Teste da Silva',
            customerPhone: '11999999999',
            device: 'iPhone de Teste',
            status: OrderStatus.APROVADO,
            items: [],
            evidence: [],
            checklist: [],
            auditLog: [],
            technicalNotes: '',
            totalValue: 1650,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            technicianId: 'u1',
            companyId: 'c1'
          };
          orders.push(mockOrder);
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      }

      return hash;
  },

  processApprovalDecision: (token: string, decision: 'APPROVED' | 'REJECTED', reason?: string, signatureId?: string, receiptUrl?: string) => {
      const approvals = DataService.getApprovals();
      const index = approvals.findIndex(a => a.token === token);
      
      if (index === -1) throw new Error("Solicitação não encontrada.");
      if (approvals[index].status !== 'PENDING') throw new Error("Esta solicitação já foi processada.");

      let verificationHash = undefined;
      
      if (decision === 'APPROVED' && signatureId) {
          verificationHash = DataService.generateVerificationHash(approvals[index], signatureId);
      }

      const updatedApproval = {
          ...approvals[index],
          status: decision,
          approvalMethod: 'REMOTO' as const, // Explicitly remote for link-based flow
          respondedAt: Date.now(),
          rejectionReason: reason,
          digitalSignatureId: signatureId,
          receiptUrl: receiptUrl,
          verificationHash: verificationHash,
          ipAddress: '192.168.1.1',
          userAgent: navigator.userAgent
      };
      
      const newApprovals = [...approvals];
      newApprovals[index] = updatedApproval;
      localStorage.setItem(STORAGE_KEYS.APPROVALS, JSON.stringify(newApprovals));

      const orders = DataService.getOrders(true);
      const orderIndex = orders.findIndex(o => o.id === updatedApproval.serviceOrderId);
      
      if (orderIndex >= 0) {
          const order = orders[orderIndex];
          const newStatus = decision === 'APPROVED' ? OrderStatus.APROVADO : OrderStatus.RECUSADO;
          
          const historyEntry = {
              from: order.status,
              to: newStatus,
              timestamp: Date.now(),
              changedBy: 'CUSTOMER',
              changedByName: 'Cliente (Via Web)',
              reason: decision === 'APPROVED' 
                ? (signatureId ? 'Aprovação c/ Assinatura Digital' : 'Aprovação Digital') 
                : `Recusado: ${reason || 'Sem motivo'}`
          };

          const updatedItems = order.items.map(i => ({
              ...i,
              approved: decision === 'APPROVED' ? true : false
          }));

          const updatedOrder = {
              ...order,
              status: newStatus,
              items: updatedItems,
              statusHistory: [historyEntry, ...(order.statusHistory || [])],
              totalValue: decision === 'APPROVED' ? updatedApproval.totalValue : 0
          };

          const allOrders = [...orders];
          allOrders[orderIndex] = updatedOrder;
          localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(allOrders));

          DataService.addAuditLog(
              decision === 'APPROVED' ? 'CUSTOMER_APPROVED' : 'CUSTOMER_REJECTED',
              'ORDER',
              order.id,
              `Cliente decidiu: ${decision}. Token: ${token.substring(0,8)}. ${verificationHash ? 'Hash Gerado.' : ''}`
          );
      }
      
      return updatedApproval;
  },

  // --- MODULE & PLAN MANAGEMENT ---
  
  getCompanyModules: (companyId?: string | null): AppModule[] => {
      if (!companyId) return ['ASSISTANCE', 'SALES'];
      const companies = DataService.getCompanies();
      const company = companies.find(c => c.id === companyId);
      return company ? company.activeModules : [];
  },

  hasModule: (module: AppModule): boolean => {
      const user = DataService.getCurrentUser();
      if (!user) return false;
      if (!user.companyId) return true;
      
      const modules = DataService.getCompanyModules(user.companyId);
      return modules.includes(module);
  },

  updateCompanyPlan: (companyId: string, planType: PlanType, modules: AppModule[]) => {
      const companies = DataService.getCompanies();
      const index = companies.findIndex(c => c.id === companyId);
      if (index === -1) throw new Error("Company not found");

      const oldPlan = companies[index].planType;
      const newCompanies = [...companies];
      newCompanies[index] = {
          ...newCompanies[index],
          planType: planType,
          activeModules: modules,
          planExpiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
      };

      // UPDATE SUBSCRIPTION RECORD
      const plans = DataService.getPlans();
      const targetPlan = plans.find(p => p.planType === planType) || plans[0];
      const subs = DataService.getSubscriptions();
      const subIndex = subs.findIndex(s => s.companyId === companyId);
      
      if (subIndex >= 0) {
          subs[subIndex] = {
              ...subs[subIndex],
              planId: targetPlan.id,
              planNameSnapshot: targetPlan.name,
              contractedPrice: targetPlan.monthlyPrice // Update to new price
          };
      } else {
          // New Sub
          subs.push({
              id: `sub_${companyId}`,
              companyId,
              planId: targetPlan.id,
              planNameSnapshot: targetPlan.name,
              contractedPrice: targetPlan.monthlyPrice,
              status: 'ACTIVE',
              startDate: Date.now(),
              nextBillingDate: Date.now() + (30 * 24 * 60 * 60 * 1000)
          });
      }
      localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subs));

      localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(newCompanies));
      DataService.addAuditLog('PLAN_CHANGE', 'COMPANY', companyId, `Plano alterado: ${oldPlan} -> ${planType}`, {
          before: { plan: oldPlan },
          after: { plan: planType }
      });
  },

  // --- PRIVACY & LGPD ---
  
  getPrivacyRequests: (): PrivacyRequest[] => {
      const saved = localStorage.getItem(STORAGE_KEYS.PRIVACY_REQUESTS);
      return saved ? JSON.parse(saved) : [];
  },

  createPrivacyRequest: (req: Omit<PrivacyRequest, 'id' | 'createdAt' | 'status'>) => {
      const requests = DataService.getPrivacyRequests();
      const newRequest: PrivacyRequest = {
          ...req,
          id: Date.now().toString(),
          createdAt: Date.now(),
          status: 'PENDING'
      };
      localStorage.setItem(STORAGE_KEYS.PRIVACY_REQUESTS, JSON.stringify([newRequest, ...requests]));
      
      DataService.addAuditLog('DSR_CREATED', 'PRIVACY', newRequest.id, `Solicitação LGPD criada: ${newRequest.requestType} por ${newRequest.requesterName}`);
  },

  runComplianceJob: () => {
    const users = DataService.getUsers();
    const now = new Date();
    let anonymizedCount = 0;

    const newUsers = users.map(user => {
        if (user.deletedAt && !user.isAnonymized) {
            const deletedDate = new Date(user.deletedAt);
            const diffTime = Math.abs(now.getTime() - deletedDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= RETENTION_DAYS_DELETED_USER) {
                anonymizedCount++;
                return {
                    ...user,
                    name: `Anonimizado LGPD ${user.id.slice(-4)}`,
                    email: `deleted_${user.id}@privacy.anonymized`,
                    avatar: null,
                    isAnonymized: true,
                    mustChangePassword: false, 
                    functions: [], 
                };
            }
        }
        return user;
    });

    if (anonymizedCount > 0) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(newUsers));
        DataService.addAuditLog('COMPLIANCE_JOB', 'PRIVACY', 'batch', `Job de Retenção executado. ${anonymizedCount} usuários anonimizados.`);
    }

    return { anonymizedCount };
  },

  // --- AUDIT SYSTEM ---
  addAuditLog: (
    action: string, 
    entityType: SystemAuditLog['entityType'], 
    entityId: string, 
    details: string,
    changes?: { before?: any, after?: any }
  ) => {
    const currentUser = DataService.getCurrentUser();
    const actor = currentUser || { name: 'System/Job', role: 'SYSTEM', companyId: null };

    const newLog: SystemAuditLog = {
      id: Date.now().toString() + Math.random().toString().slice(2,5),
      action,
      entityType,
      entityId,
      companyId: actor.companyId || (entityType === 'COMPANY' ? entityId : null), 
      performedBy: actor.name,
      performedByRole: actor.role,
      details,
      changes: changes ? {
        before: sanitizeLogData(changes.before),
        after: sanitizeLogData(changes.after)
      } : undefined,
      timestamp: Date.now(),
      ipAddress: '127.0.0.1', // Mock
      userAgent: navigator.userAgent
    };

    const logs = DataService.getSystemAuditLogs();
    const updatedLogs = [newLog, ...logs];
    localStorage.setItem(STORAGE_KEYS.SYSTEM_AUDIT, JSON.stringify(updatedLogs));
  },

  getSystemAuditLogs: (): SystemAuditLog[] => {
    const saved = localStorage.getItem(STORAGE_KEYS.SYSTEM_AUDIT);
    return saved ? JSON.parse(saved) : [];
  }
};