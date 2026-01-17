import React from 'react';

// 1. STATE MACHINE DEFINITION
export enum OrderStatus {
  DRAFT = 'RASCUNHO',
  AGUARDANDO_ANALISE = 'AGUARDANDO_ANALISE',
  EM_ANALISE = 'EM_ANALISE',
  AGUARDANDO_APROVACAO = 'AGUARDANDO_APROVACAO', // Customer Action Required
  APROVADO = 'APROVADO',
  RECUSADO = 'RECUSADO',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDO = 'CONCLUIDO',
  AGUARDANDO_PAGAMENTO = 'AGUARDANDO_PAGAMENTO', // New State
  PAGO = 'PAGO', // New State
  AGUARDANDO_RETIRADA = 'AGUARDANDO_RETIRADA', // Legacy support (can treat same as PAGO or separate step)
  RETIRADO = 'RETIRADO', // FINAL STATE
  CANCELADO = 'CANCELADO'
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.DRAFT]: 'Rascunho',
  [OrderStatus.AGUARDANDO_ANALISE]: 'Aguardando Análise',
  [OrderStatus.EM_ANALISE]: 'Em Análise',
  [OrderStatus.AGUARDANDO_APROVACAO]: 'Aguardando Aprovação',
  [OrderStatus.APROVADO]: 'Aprovado pelo Cliente',
  [OrderStatus.RECUSADO]: 'Recusado pelo Cliente',
  [OrderStatus.EM_ANDAMENTO]: 'Em Execução',
  [OrderStatus.CONCLUIDO]: 'Serviço Concluído',
  [OrderStatus.AGUARDANDO_PAGAMENTO]: 'Aguardando Pagamento',
  [OrderStatus.PAGO]: 'Pago / Pronto para Saída',
  [OrderStatus.AGUARDANDO_RETIRADA]: 'Aguardando Retirada',
  [OrderStatus.RETIRADO]: 'Finalizado e Retirado',
  [OrderStatus.CANCELADO]: 'Cancelado'
};

// Valid Transitions (The State Machine Rules)
export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.DRAFT]: [OrderStatus.AGUARDANDO_ANALISE, OrderStatus.CANCELADO],
  [OrderStatus.AGUARDANDO_ANALISE]: [OrderStatus.EM_ANALISE, OrderStatus.CANCELADO],
  [OrderStatus.EM_ANALISE]: [OrderStatus.AGUARDANDO_APROVACAO, OrderStatus.CANCELADO],
  [OrderStatus.AGUARDANDO_APROVACAO]: [OrderStatus.APROVADO, OrderStatus.RECUSADO, OrderStatus.CANCELADO],
  [OrderStatus.APROVADO]: [OrderStatus.EM_ANDAMENTO, OrderStatus.CONCLUIDO, OrderStatus.CANCELADO],
  [OrderStatus.RECUSADO]: [OrderStatus.AGUARDANDO_RETIRADA, OrderStatus.CANCELADO, OrderStatus.AGUARDANDO_APROVACAO], 
  [OrderStatus.EM_ANDAMENTO]: [OrderStatus.CONCLUIDO, OrderStatus.AGUARDANDO_APROVACAO, OrderStatus.CANCELADO], 
  [OrderStatus.CONCLUIDO]: [OrderStatus.AGUARDANDO_PAGAMENTO, OrderStatus.RETIRADO, OrderStatus.EM_ANDAMENTO], // Can go direct to withdrawn if warranty/free
  [OrderStatus.AGUARDANDO_PAGAMENTO]: [OrderStatus.PAGO, OrderStatus.RETIRADO],
  [OrderStatus.PAGO]: [OrderStatus.RETIRADO],
  [OrderStatus.AGUARDANDO_RETIRADA]: [OrderStatus.RETIRADO], // Legacy path
  [OrderStatus.RETIRADO]: [], // Terminal State
  [OrderStatus.CANCELADO]: [] // Terminal State
};

// Evidence Requirements for Transitions
export const EVIDENCE_REQUIREMENTS: Partial<Record<OrderStatus, EvidenceType>> = {
  [OrderStatus.EM_ANALISE]: 'ENTRADA', // Must have entry photo to start analysis
  [OrderStatus.CONCLUIDO]: 'FINALIZACAO', // Must have finish photo to complete
  [OrderStatus.RETIRADO]: 'ENTREGA' // Must have delivery photo/signature to close
};

// NEW: Friendly Labels for Evidence Types
export const EVIDENCE_LABELS: Record<EvidenceType, string> = {
  'ENTRADA': 'Foto de Entrada/Vistoria',
  'DIAGNOSTICO': 'Foto do Diagnóstico',
  'PROCESSO': 'Foto do Processo',
  'FINALIZACAO': 'Foto da Finalização',
  'ENTREGA': 'Comprovante de Entrega',
  'APROVACAO_DOCUMENTAL': 'Termo de Aprovação Assinado'
};

export type ItemSeverity = 'critical' | 'recommended';
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'FUNCIONARIO' | 'TECHNICIAN'; 
export type UserFunction = 'BALCAO' | 'BANCADA'; 
export type ThemePreference = 'light' | 'dark' | 'system';

// === MODULAR ARCHITECTURE TYPES ===
export type AppModule = 'ASSISTANCE' | 'SALES';

export type PlanType = 'BASIC_ASSISTANCE' | 'BASIC_SALES' | 'PRO_FULL' | 'ENTERPRISE';

// === SAAS BILLING & PLANS ===

export interface PlanLimit {
  users: number; // -1 for unlimited
  storageGB: number;
  features: string[];
}

export interface Plan {
  id: string;
  name: string;
  planType: PlanType; // Mapping to old enum for compatibility
  monthlyPrice: number;
  limits: PlanLimit;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'BLOCKED';

export interface Subscription {
  id: string;
  companyId: string;
  planId: string;
  planNameSnapshot: string; // Historic data
  contractedPrice: number; // Price grandfathering
  status: SubscriptionStatus;
  startDate: number;
  nextBillingDate: number;
  lastCheckDate?: number; // To avoid duplicate daily checks
}

export interface SaasBillingStats {
  mrr: number; // Monthly Recurring Revenue
  totalCustomers: number;
  activeSubscriptions: number;
  revenueByPlan: { name: string; value: number }[];
  customersByPlan: { name: string; value: number }[];
  recentSubscriptions: Subscription[];
  delinquentCount: number;
}

export interface Company {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  userCount?: number;
  deletedAt?: string | null; 
  isAnonymized?: boolean;
  
  // Subscription Info
  planType: PlanType;
  activeModules: AppModule[];
  planExpiresAt?: number;
  subscriptionStatus?: SubscriptionStatus; // Derived from subscription
}

// === NOTIFICATIONS SYSTEM ===
export type NotificationType = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'BILLING';

export interface AppNotification {
    id: string;
    companyId: string;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    createdAt: number;
    actionLink?: string;
}
// ===================================

// === CUSTOMER APPROVAL TYPES ===

export interface DigitalSignature {
  id: string;
  serviceApprovalId: string;
  signatureImage: string; // Base64 string of the PNG
  signedName: string; // Typed name
  signedAt: number;
  ipAddress?: string;
  userAgent?: string;
  confirmationChecked: boolean;
}

export interface ServiceApproval {
  id: string;
  serviceOrderId: string;
  companyId: string;
  token: string; // Secure UUID
  type: 'ORCAMENTO' | 'EXTRA';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvalMethod?: 'PRESENCIAL' | 'REMOTO' | 'PRESENCIAL_DOCUMENTO'; // Enhanced
  signerDocument?: string; // CPF/RG Optional for In-Person
  
  // Content Snapshot (Frozen at creation)
  itemsSnapshot: ServiceItem[];
  totalValue: number;
  
  description: string; // Manual description provided by technician
  descriptionAi?: string; // Optional for future use
  aiUsed: boolean; // Flag to indicate if AI was used

  // Audit Trail
  createdAt: number;
  createdBy: string; // User ID
  respondedAt?: number;
  ipAddress?: string;
  userAgent?: string;
  rejectionReason?: string;
  
  // Digital Signature Link
  digitalSignatureId?: string;
  
  // Receipt & Verification
  receiptUrl?: string; // Base64 Data URI or S3 URL of the PDF
  verificationHash?: string; // SHA-256 string for public validation
  
  // For Physical Document
  evidenceId?: string;
}

// === PUBLIC VERIFICATION DATA (LGPD SAFE) ===
export interface PublicVerificationResult {
    isValid: boolean;
    hash: string;
    companyName: string;
    companyCnpj?: string;
    osProtocol: string;
    approvedAt: number;
    totalValue: number;
    customerFirstName: string; // Only first name
}

// === WHATSAPP INTEGRATION (PHASE 1 & 2 PREP) ===
export type WhatsAppStatus = 'DRAFT' | 'SENT_VIA_LINK' | 'API_SENT' | 'API_DELIVERED' | 'API_READ';

export interface WhatsappMessage {
  id: string;
  serviceOrderId: string;
  companyId: string;
  customerPhone: string;
  messageBody: string;
  status: WhatsAppStatus;
  provider: 'LINK' | 'META_API'; // Phase 1 is always LINK
  sentBy: string; // User ID
  sentAt: number;
}
// ===============================================

// === SERVICE PAYMENTS ===
export interface ServicePayment {
    id: string;
    serviceOrderId: string;
    companyId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    notes?: string;
    paidAt: number;
    receivedBy: string; // User Name
    receivedById: string; // User ID
}
// ========================

export type CatalogType = 'SERVICE' | 'PART';

// Forensic Evidence Types - ADDED APROVACAO_DOCUMENTAL
export type EvidenceType = 'ENTRADA' | 'DIAGNOSTICO' | 'PROCESSO' | 'FINALIZACAO' | 'ENTREGA' | 'APROVACAO_DOCUMENTAL';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  functions: UserFunction[]; 
  companyId?: string | null;
  avatar?: string | null;
  active?: boolean;
  deletedAt?: string | null; 
  mustChangePassword?: boolean; 
  isAnonymized?: boolean; 
  themePreference?: ThemePreference; // NEW: User Preference
}

export interface WhatsAppTemplates {
  approvalRequest: string;
  readyForPickup: string;
}

export interface CompanySettings {
  name: string;
  cnpj?: string;
  whatsapp: string;
  logoUrl?: string;
  address?: string;
  warrantyTerms: string;
  aiTone: 'formal' | 'friendly' | 'urgent';
  // NOVO: Templates de mensagem
  whatsappTemplates?: WhatsAppTemplates; 
}

export interface CatalogItem {
  id: string;
  name: string;
  type: CatalogType;
  defaultPrice: number;
  description: string;
  active: boolean;
}

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  phone: string; // Used for deduplication within company
  email?: string;
  document?: string; // CPF or CNPJ
  notes?: string;
  createdAt: number;
  updatedAt?: number;
  active: boolean;
}

export interface AuditLog {
  id: string;
  action: string;
  timestamp: number;
  actorName: string;
  details?: string;
}

// Immutable Status History
export interface StatusHistoryEntry {
  from: OrderStatus;
  to: OrderStatus;
  timestamp: number;
  changedBy: string; // User ID
  changedByName: string;
  reason?: string; // Optional reasoning
}

export interface SystemAuditLog {
  id: string;
  action: string; 
  entityType: 'USER' | 'COMPANY' | 'ORDER' | 'AUTH' | 'SETTINGS' | 'PRIVACY' | 'EVIDENCE' | 'CUSTOMER' | 'INVENTORY' | 'SALE' | 'PLAN' | 'APPROVAL' | 'SIGNATURE' | 'WHATSAPP' | 'VERIFICATION' | 'PAYMENT' | 'SUBSCRIPTION' | 'NOTIFICATION';
  entityId: string;
  companyId: string | null; 
  performedBy: string; 
  performedByRole: string;
  details: string;
  changes?: {
    before?: any;
    after?: any;
  };
  ipAddress?: string;
  userAgent?: string;
  timestamp: number;
}

export interface PrivacyRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  companyId: string;
  requestType: 'DELETE_ACCOUNT' | 'EXPORT_DATA';
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  justification?: string;
  createdAt: number;
  completedAt?: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  notes?: string;
}

export interface Evidence {
  id: string;
  orderId: string;
  type: EvidenceType; 
  url: string; 
  description: string;
  fileHash: string; 
  uploadedBy: string; 
  uploadedByName: string; 
  timestamp: number;
  active: boolean; 
  deletedAt?: number;
  deletedBy?: string;
}

export interface ServiceItem {
  id: string;
  catalogItemId?: string; 
  name: string;
  price: number;
  description: string;
  approved: boolean;
  required: boolean; 
  severity: ItemSeverity;
}

export interface ServiceOrder {
  id: string;
  companyId?: string; // Tenant Isolation
  customerId?: string; // Link to the customer entity
  customerName: string; // Denormalized for display
  customerPhone: string; // Denormalized for display
  device: string; // Renamed from vehicleOrDevice
  status: OrderStatus;
  statusHistory?: StatusHistoryEntry[]; // NEW: History tracking
  items: ServiceItem[];
  evidence: Evidence[];
  checklist: ChecklistItem[];
  auditLog: AuditLog[];
  technicalNotes: string; 
  aiSummary?: string; 
  createdAt: number;
  updatedAt: number;
  technicianId: string;
  totalValue: number;
}

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles: UserRole[]; 
  requiredModule?: AppModule; // Feature Flag
}

// NEW: Search Filters Interface
export interface OrderFilters {
  query?: string; // Matches Name, Phone, Protocol
  startDate?: string;
  endDate?: string;
  device?: string;
  protocol?: string;
  status?: OrderStatus[];
}

// === NEW MODULES: INVENTORY & SALES ===

export interface InventoryItem {
  id: string;
  companyId: string;
  name: string;
  category: string;
  description?: string;
  barcode?: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  minQuantity: number;
  createdAt: number;
  updatedAt: number;
  active: boolean;
}

export type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'TRANSFER' | 'OTHER';

export interface SaleItem {
  id: string;
  inventoryItemId: string;
  name: string; // Snapshot of name
  quantity: number;
  unitPrice: number;
  subtotal: number;
  costPriceSnapshot: number; // For profit calculation later
}

export interface Sale {
  id: string;
  companyId: string;
  userId: string;
  userName: string;
  customerId?: string;
  customerName?: string;
  totalValue: number;
  paymentMethod: PaymentMethod;
  items: SaleItem[];
  createdAt: number;
  status: 'COMPLETED' | 'CANCELLED';
}

export interface InventoryMovement {
  id: string;
  inventoryItemId: string;
  companyId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: string;
  performedBy: string;
  createdAt: number;
}