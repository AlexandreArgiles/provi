import React, { useState, useEffect } from 'react';
import { ServiceOrder, OrderStatus, Evidence, ServiceItem, ItemSeverity, AuditLog, CatalogItem, User, VALID_TRANSITIONS, ORDER_STATUS_LABELS, ChecklistItem, ServiceApproval, DigitalSignature, ServicePayment } from '../types';
import { DataService } from '../services/dataService';
import { generateApprovalReceipt } from '../services/pdfService';
import { Card, CardContent, CardHeader } from './ui/Card';
import { Button } from './ui/Button';
import { CustomerPreview } from './CustomerPreview';
import { EvidenceUpload } from './EvidenceUpload';
import { EvidenceTimeline } from './EvidenceTimeline';
import { StatusBadge } from './ui/StatusBadge';
import { StatusTimeline } from './StatusTimeline';
import { RequestApprovalModal } from './RequestApprovalModal';
import { WhatsAppModal } from './WhatsAppModal';
import { PaymentModal } from './PaymentModal';
import { InPersonApprovalModal } from './InPersonApprovalModal';
import { Check, Plus, Trash2, Smartphone, ShieldAlert, History, AlertTriangle, Package, Lock, XCircle, ClipboardList, CheckCircle, FileCheck, ExternalLink, ShieldCheck, BellRing, DollarSign, LogOut, PenTool, MessageCircle, Loader2, X } from 'lucide-react';

interface OrderDetailProps {
  order: ServiceOrder;
  currentUser: User;
  onUpdateOrder: (updatedOrder: ServiceOrder) => void;
  onBack: () => void;
}

export const OrderDetail: React.FC<OrderDetailProps> = ({ order, currentUser, onUpdateOrder, onBack }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  
  // Approval Flow
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showInPersonApproval, setShowInPersonApproval] = useState(false);
  const [activeApproval, setActiveApproval] = useState<ServiceApproval | undefined>(undefined);
  const [signature, setSignature] = useState<DigitalSignature | undefined>(undefined);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // WhatsApp Flow
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppMode, setWhatsAppMode] = useState<'APPROVAL_REQUEST' | 'READY_FOR_PICKUP'>('APPROVAL_REQUEST');
  
  // Payment Flow
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payments, setPayments] = useState<ServicePayment[]>([]);
  
  // Audit Log View
  const [showFullHistory, setShowFullHistory] = useState(false);

  // New Item State
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemSeverity, setNewItemSeverity] = useState<ItemSeverity>('critical');

  // Checklist State
  const [newChecklistInput, setNewChecklistInput] = useState('');

  // PERMISSIONS & STATE CHECKS
  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';
  const hasBancada = isAdmin || currentUser.functions?.includes('BANCADA');
  const hasBalcao = isAdmin || currentUser.functions?.includes('BALCAO');
  
  // READ ONLY: Terminal States
  const isReadOnly = order.status === OrderStatus.RETIRADO || order.status === OrderStatus.CANCELADO;

  // LOCKED ITEMS: Prevents changing financial items after approval
  const isLockedForItems = isReadOnly || [OrderStatus.APROVADO, OrderStatus.EM_ANDAMENTO, OrderStatus.CONCLUIDO, OrderStatus.AGUARDANDO_PAGAMENTO, OrderStatus.PAGO, OrderStatus.AGUARDANDO_RETIRADA].includes(order.status);

  useEffect(() => {
    setCatalog(DataService.getCatalog());
    loadApprovalStatus();
    loadPayments();
  }, [order.id]); // Reload when order changes

  const loadApprovalStatus = () => {
      const approval = DataService.getApprovalByOrderId(order.id);
      setActiveApproval(approval);
      if (approval && approval.digitalSignatureId) {
          const sig = DataService.getSignature(approval.digitalSignatureId);
          setSignature(sig);
      } else {
          setSignature(undefined);
      }
  };

  const loadPayments = () => {
      setPayments(DataService.getServicePayments(order.id));
  };

  useEffect(() => {
    if (selectedCatalogId) {
        const item = catalog.find(c => c.id === selectedCatalogId);
        if (item) {
            setNewItemName(item.name);
            setNewItemPrice(item.defaultPrice.toString());
            setNewItemDesc(item.description);
        }
    }
  }, [selectedCatalogId]);

  const calculateTotal = (items: ServiceItem[]): number => {
    return items.reduce((acc, item) => item.approved ? acc + item.price : acc, 0);
  };

  const calculatePaidTotal = (): number => {
      return payments.reduce((acc, p) => acc + p.amount, 0);
  };

  const addToLog = (action: string, actor: 'Technician' | 'Customer' | 'System' = 'Technician', currentOrder = order) => {
    const newLog: AuditLog = {
      id: Date.now().toString(),
      action,
      timestamp: Date.now(),
      actorName: actor === 'Technician' ? currentUser.name : actor,
      details: actor === 'Technician' ? `ID: ${currentUser.id}` : undefined
    };
    return [newLog, ...(currentOrder.auditLog || [])];
  };

  const handleUpdate = (updates: Partial<ServiceOrder>, logAction?: string) => {
    if (isReadOnly) return;

    let updatedOrder = { ...order, ...updates };
    
    if (updates.items) {
      updatedOrder.totalValue = calculateTotal(updates.items);
    }

    if (logAction) {
      updatedOrder.auditLog = addToLog(logAction, 'Technician', updatedOrder);
    }

    onUpdateOrder(updatedOrder);
  };

  // --- STATUS MACHINE LOGIC ---

  const handleChangeStatus = (newStatus: OrderStatus) => {
      if (isReadOnly) return;

      if (!VALID_TRANSITIONS[order.status]?.includes(newStatus)) {
          alert("Transição de status inválida.");
          return;
      }

      if (newStatus === OrderStatus.CANCELADO || newStatus === OrderStatus.RECUSADO) {
          const reason = prompt("Por favor, informe o motivo:");
          if (!reason) return;
          performStatusChange(newStatus, reason);
      } else {
          performStatusChange(newStatus);
      }
  };

  const performStatusChange = (newStatus: OrderStatus, reason?: string) => {
      const historyEntry = {
          from: order.status,
          to: newStatus,
          timestamp: Date.now(),
          changedBy: currentUser.id,
          changedByName: currentUser.name,
          reason: reason
      };

      const newHistory = [historyEntry, ...(order.statusHistory || [])];

      handleUpdate({
          status: newStatus,
          statusHistory: newHistory
      }, `Status alterado: ${ORDER_STATUS_LABELS[order.status]} -> ${ORDER_STATUS_LABELS[newStatus]}`);

      DataService.addAuditLog('ORDER_STATUS_CHANGE', 'ORDER', order.id, 
        `Mudança de fase para ${ORDER_STATUS_LABELS[newStatus]} por ${currentUser.name}`
      );
  };

  // --- ACTIONS ---

  const handleSecureUpload = (newEvidence: Evidence) => {
      const updatedEvidenceList = [...(order.evidence || []), newEvidence];
      if (isReadOnly) { alert("OS Encerrada. Não é possível anexar novas evidências."); return; }

      handleUpdate(
          { evidence: updatedEvidenceList }, 
          `Evidência Forense Adicionada: ${newEvidence.type}`
      );
      DataService.addAuditLog('EVIDENCE_UPLOAD', 'EVIDENCE', newEvidence.id, `Upload por ${currentUser.name}. Hash: ${newEvidence.fileHash}`);
  };

  const handleDeleteEvidence = (id: string) => {
      if (isReadOnly) return;
      const evidence = order.evidence?.find(e => e.id === id);
      if (!evidence) return;
      const updatedEvidenceList = order.evidence.map(e => 
          e.id === id ? { ...e, active: false, deletedAt: Date.now(), deletedBy: currentUser.id } : e
      );
      handleUpdate({ evidence: updatedEvidenceList }, `Evidência Removida (Soft): ${evidence.type}`);
      DataService.addAuditLog('EVIDENCE_DELETE', 'EVIDENCE', id, `Exclusão lógica por ${currentUser.name}`);
  };

  const handleAddItem = () => {
    if (isLockedForItems) return;
    if (!newItemName.trim()) { alert("Nome obrigatório"); return; }
    const price = parseFloat(newItemPrice);
    if (isNaN(price) || price < 0) { alert("Preço inválido"); return; }

    const item: ServiceItem = {
      id: Date.now().toString(),
      catalogItemId: selectedCatalogId || undefined,
      name: newItemName,
      price: price,
      description: newItemDesc,
      approved: true, 
      required: newItemSeverity === 'critical',
      severity: newItemSeverity
    };
    
    const newItems = [...order.items, item];
    handleUpdate({ items: newItems }, `Adicionou item: ${newItemName}`);
    setSelectedCatalogId(''); setNewItemName(''); setNewItemPrice(''); setNewItemDesc('');
  };

  const handleRemoveItem = (id: string) => {
    if (isLockedForItems) return;
    const itemToRemove = order.items.find(i => i.id === id);
    if(itemToRemove) {
        const newItems = order.items.filter(i => i.id !== id);
        handleUpdate({ items: newItems }, `Removeu item: ${itemToRemove.name}`);
    }
  };

  const handleAddChecklist = () => {
    if (isReadOnly) return;
    if(!newChecklistInput.trim()) return;
    
    const newItem: ChecklistItem = {
        id: Date.now().toString(),
        label: newChecklistInput,
        checked: true 
    };

    const newChecklist = [...(order.checklist || []), newItem];
    handleUpdate({ checklist: newChecklist }, `Vistoria: Adicionou "${newChecklistInput}"`);
    setNewChecklistInput('');
  };

  const handleRemoveChecklist = (id: string) => {
      if (isReadOnly) return;
      const newChecklist = order.checklist?.filter(c => c.id !== id) || [];
      handleUpdate({ checklist: newChecklist }, 'Vistoria: Removeu item');
  };

  const handleSimulationResult = (updatedItems: ServiceItem[], newStatus: OrderStatus) => {
    if (isReadOnly) return;
    const newTotal = calculateTotal(updatedItems);
    
    const historyEntry = {
        from: order.status,
        to: newStatus,
        timestamp: Date.now(),
        changedBy: 'CUSTOMER',
        changedByName: 'Cliente (Via Link)',
        reason: 'Aprovação Digital'
    };
    const newHistory = [historyEntry, ...(order.statusHistory || [])];

    onUpdateOrder({
      ...order,
      items: updatedItems,
      status: newStatus,
      statusHistory: newHistory,
      totalValue: newTotal
    });
    setShowPreview(false);
  };

  const handleDownloadReceipt = async () => {
      if (!activeApproval) return;
      
      setIsGeneratingPdf(true);
      let url = activeApproval.receiptUrl;

      // Se não tiver URL salva mas tiver assinatura, gera na hora
      if (!url && signature) {
          try {
              const companies = DataService.getCompanies();
              const company = companies.find(c => c.id === order.companyId) || DataService.getSettings();
              const settings = DataService.getSettings();

              url = await generateApprovalReceipt(
                  order,
                  activeApproval,
                  signature,
                  company,
                  settings.address || 'Endereço não cadastrado'
              );
          } catch (e) {
              console.error("Erro ao gerar PDF:", e);
              alert("Não foi possível gerar o PDF.");
              setIsGeneratingPdf(false);
              return;
          }
      }

      setIsGeneratingPdf(false);

      if(url) {
          const link = document.createElement('a');
          link.href = url;
          link.download = `comprovante_${order.id}.pdf`;
          link.click();
      } else {
          alert("Documento não disponível (Ainda não foi assinado).");
      }
  };

  const openVerificationPage = () => {
      if(activeApproval?.verificationHash) {
          const baseUrl = window.location.origin;
          const url = `${baseUrl}/?verify=${activeApproval.verificationHash}`;
          window.open(url, '_blank');
      }
  };

  const handleNotifyReady = () => {
      setWhatsAppMode('READY_FOR_PICKUP');
      setShowWhatsAppModal(true);
  };

  const handleRegisterPayment = (amount: number, method: any, notes: string) => {
      DataService.saveServicePayment({
          serviceOrderId: order.id,
          amount,
          paymentMethod: method,
          notes
      });
      loadPayments();
      setShowPaymentModal(false);
      
      if (order.status === OrderStatus.AGUARDANDO_PAGAMENTO) {
          const totalPaid = calculatePaidTotal() + amount;
          if (totalPaid >= order.totalValue) {
              performStatusChange(OrderStatus.PAGO, "Pagamento integral registrado");
          }
      }
  };

  const handleWithdrawal = () => {
      const paidTotal = calculatePaidTotal();
      if (order.totalValue > paidTotal) {
          if (!confirm(`Atenção: O valor pago (R$ ${paidTotal.toFixed(2)}) é menor que o total (R$ ${order.totalValue.toFixed(2)}). Confirmar retirada mesmo assim?`)) {
              return;
          }
      } else {
          if (!confirm("Confirmar a retirada do equipamento pelo cliente? Esta ação encerrará a OS e bloqueará edições.")) {
              return;
          }
      }

      performStatusChange(OrderStatus.RETIRADO, "Retirado pelo cliente. OS Encerrada.");
  };

  const availableTransitions = VALID_TRANSITIONS[order.status] || [];

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-10">
      
      {showApprovalModal && (
          <RequestApprovalModal 
            order={order}
            onClose={() => setShowApprovalModal(false)}
            onSuccess={() => {
                setShowApprovalModal(false);
                loadApprovalStatus();
                onUpdateOrder({...order, status: OrderStatus.AGUARDANDO_APROVACAO});
            }}
          />
      )}

      {showInPersonApproval && (
          <InPersonApprovalModal 
            order={order}
            onClose={() => setShowInPersonApproval(false)}
            onSuccess={() => {
                setShowInPersonApproval(false);
                loadApprovalStatus();
                const refreshedOrder = DataService.getOrderById(order.id);
                if(refreshedOrder) onUpdateOrder(refreshedOrder);
            }}
          />
      )}

      {showWhatsAppModal && (
          <WhatsAppModal 
            order={order}
            approval={activeApproval}
            mode={whatsAppMode}
            onClose={() => {
                setShowWhatsAppModal(false);
                setWhatsAppMode('APPROVAL_REQUEST');
            }}
          />
      )}

      {showPaymentModal && (
          <PaymentModal 
            orderId={order.id}
            totalAmount={order.totalValue - calculatePaidTotal()}
            onClose={() => setShowPaymentModal(false)}
            onConfirm={handleRegisterPayment}
          />
      )}

      {showPreview && (
        <CustomerPreview 
          order={order} 
          onSimulateApproval={handleSimulationResult}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button onClick={onBack} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-sm flex items-center font-medium">
          ← Voltar para lista
        </button>
        
        {isReadOnly ? (
            <div className="bg-slate-800 dark:bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center shadow-lg border border-slate-700">
                <Lock className="w-4 h-4 mr-2 text-amber-400" />
                <span className="font-bold text-sm">OS Encerrada e Bloqueada</span>
            </div>
        ) : (
            <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => { setShowPreview(true); }}>
                    <Smartphone className="w-4 h-4 mr-2" /> Simular Link
                </Button>
                
                {/* Approval Flow Buttons */}
                {activeApproval?.status === 'PENDING' ? (
                    <Button size="sm" disabled className="bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                        <History className="w-4 h-4 mr-2 animate-spin-slow" /> Aguardando Cliente
                    </Button>
                ) : !activeApproval || activeApproval.status !== 'APPROVED' ? (
                    <>
                        <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => setShowInPersonApproval(true)} 
                            className="border-green-600 text-green-700 hover:bg-green-50"
                        >
                            <PenTool className="w-4 h-4 mr-2" /> Aprovação Presencial
                        </Button>
                        <Button size="sm" onClick={() => setShowApprovalModal(true)} className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700">
                            <ShieldAlert className="w-4 h-4 mr-2" /> Solicitar Remota
                        </Button>
                    </>
                ) : null}
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Main Order Data */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* STATE MACHINE CARD */}
          <Card className={`border-l-4 shadow-md ${isReadOnly ? 'border-l-slate-600 bg-slate-50 dark:bg-slate-900' : 'border-l-blue-600'}`}>
              <CardContent>
                  <div className="flex justify-between items-start mb-6">
                      <div>
                          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Status Atual</p>
                          <StatusBadge status={order.status} size="lg" />
                      </div>
                      <div className="text-right">
                          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Protocolo</p>
                          <span className="font-mono text-slate-600 dark:text-slate-300">{order.id}</span>
                      </div>
                  </div>

                  {/* ACTIVE APPROVAL ALERT + WHATSAPP BUTTON */}
                  {activeApproval && activeApproval.status === 'PENDING' && (
                      <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-start">
                              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 mr-3 mt-0.5" />
                              <div>
                                  <p className="text-sm font-bold text-amber-900 dark:text-amber-400">Solicitação Aberta</p>
                                  <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">O cliente ainda não respondeu.</p>
                              </div>
                          </div>
                          {hasBalcao && (
                              <div className="flex gap-2">
                                <Button 
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setShowInPersonApproval(true)}
                                >
                                    <PenTool className="w-4 h-4 mr-2" /> Aprovar Agora
                                </Button>
                                {/* CORREÇÃO AQUI: Mudança do texto do botão */}
                                <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700 text-white border-transparent shadow-sm"
                                    onClick={() => {
                                        setWhatsAppMode('APPROVAL_REQUEST');
                                        setShowWhatsAppModal(true);
                                    }}
                                >
                                    <MessageCircle className="w-4 h-4 mr-2" /> Enviar via WhatsApp
                                </Button>
                              </div>
                          )}
                      </div>
                  )}

                  {/* NOTIFICATION & PAYMENT ACTIONS */}
                  {!isReadOnly && (
                      <div className="space-y-4 mb-6">
                          {/* Ready for Pickup Logic */}
                          {order.status === OrderStatus.CONCLUIDO && hasBalcao && (
                              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-between animate-fade-in">
                                  <div className="flex items-center">
                                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 mr-3" />
                                      <div>
                                          <p className="text-sm font-bold text-green-900 dark:text-green-300">Equipamento Pronto</p>
                                          <p className="text-xs text-green-700 dark:text-green-400">Serviço concluído. Notifique o cliente e libere para pagamento.</p>
                                      </div>
                                  </div>
                                  <div className="flex gap-2">
                                      <Button 
                                          onClick={handleNotifyReady}
                                          variant="secondary"
                                          className="text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50"
                                      >
                                          <BellRing className="w-4 h-4 mr-2" /> Avisar
                                      </Button>
                                      <Button 
                                          onClick={() => handleChangeStatus(OrderStatus.AGUARDANDO_PAGAMENTO)}
                                          className="bg-green-600 hover:bg-green-700 text-white border-transparent"
                                      >
                                          <DollarSign className="w-4 h-4 mr-2" /> Liberar Pagamento
                                      </Button>
                                  </div>
                              </div>
                          )}

                          {/* Payment Logic */}
                          {(order.status === OrderStatus.AGUARDANDO_PAGAMENTO || order.status === OrderStatus.PAGO) && hasBalcao && (
                              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex flex-col gap-3 animate-fade-in">
                                  <div className="flex justify-between items-center">
                                      <div className="flex items-center">
                                          <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3" />
                                          <div>
                                              <p className="text-sm font-bold text-blue-900 dark:text-blue-300">Pagamento & Retirada</p>
                                              <p className="text-xs text-blue-700 dark:text-blue-400">Recebido: <strong>R$ {calculatePaidTotal().toFixed(2)}</strong> de R$ {order.totalValue.toFixed(2)}</p>
                                          </div>
                                      </div>
                                      <Button onClick={() => setShowPaymentModal(true)} size="sm">
                                          Registrar Pagamento
                                      </Button>
                                  </div>
                                  
                                  <div className="border-t border-blue-200 dark:border-blue-800 pt-3 flex justify-end">
                                      <Button 
                                          onClick={handleWithdrawal}
                                          className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white"
                                      >
                                          <LogOut className="w-4 h-4 mr-2" /> Confirmar Retirada
                                      </Button>
                                  </div>
                              </div>
                          )}
                      </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {availableTransitions.map(target => (
                          <button
                              key={target}
                              onClick={() => handleChangeStatus(target)}
                              className="flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 shadow-sm"
                          >
                              <span className="mb-1">{ORDER_STATUS_LABELS[target]}</span>
                          </button>
                      ))}
                  </div>
              </CardContent>
          </Card>

          {/* CHECKLIST (Moved to First Position) */}
          <Card>
              <CardHeader title="Checklist de Entrada" action={<ClipboardList className="text-slate-400" />} />
              <CardContent>
                  <div className="space-y-2">
                      {order.checklist.map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                              <button 
                                  onClick={() => {
                                      if(isReadOnly) return;
                                      const newChecklist = order.checklist.map(c => c.id === item.id ? { ...c, checked: !c.checked } : c);
                                      handleUpdate({ checklist: newChecklist });
                                  }}
                                  disabled={isReadOnly}
                                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${item.checked ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}
                              >
                                  {item.checked && <Check size={14} />}
                              </button>
                              <span className={`text-sm ${item.checked ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-500 line-through'}`}>{item.label}</span>
                              {!isReadOnly && hasBalcao && (
                                  <button onClick={() => handleRemoveChecklist(item.id)} className="ml-auto text-slate-300 hover:text-red-400">
                                      <XCircle size={14} />
                                  </button>
                              )}
                          </div>
                      ))}
                      
                      {!isReadOnly && hasBalcao && (
                          <div className="flex gap-2 mt-3">
                              <input 
                                  className="flex-1 p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                                  placeholder="Novo item..."
                                  value={newChecklistInput}
                                  onChange={e => setNewChecklistInput(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleAddChecklist()}
                              />
                              <Button size="sm" variant="secondary" onClick={handleAddChecklist}>Add</Button>
                          </div>
                      )}
                  </div>
              </CardContent>
          </Card>

          {/* DIAGNOSIS & ITEMS */}
          <Card>
              <CardHeader title="Diagnóstico e Serviços" action={<Package className="text-slate-400" />} />
              <CardContent className="space-y-6">
                  {/* Technical Notes */}
                  <div>
                      <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Parecer Técnico</label>
                      </div>
                      <textarea 
                          className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 disabled:opacity-70 disabled:bg-slate-50 dark:disabled:bg-slate-800"
                          rows={4}
                          placeholder="Descreva o problema e a solução técnica..."
                          value={order.technicalNotes}
                          onChange={e => handleUpdate({ technicalNotes: e.target.value })}
                          disabled={isReadOnly || !hasBancada}
                      />
                  </div>

                  {/* Items List */}
                  <div>
                      <div className="flex justify-between items-center mb-4">
                          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase">Itens do Orçamento</h4>
                      </div>
                      
                      <div className="space-y-3">
                          {order.items.map((item) => (
                              <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border ${item.approved ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800' : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 opacity-75'}`}>
                                  <div className="flex-1">
                                      <p className={`font-medium text-sm ${item.approved ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 line-through'}`}>{item.name}</p>
                                      {item.description && <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>}
                                      <div className="flex gap-2 mt-1">
                                          {item.severity === 'critical' && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">CRÍTICO</span>}
                                          {!item.approved && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">RECUSADO PELO CLIENTE</span>}
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <p className="font-bold text-slate-900 dark:text-slate-100">R$ {item.price.toFixed(2)}</p>
                                      {!isLockedForItems && hasBalcao && (
                                          <button 
                                              onClick={() => handleRemoveItem(item.id)}
                                              className="text-red-400 hover:text-red-600 p-1 mt-1"
                                          >
                                              <Trash2 size={14} />
                                          </button>
                                      )}
                                  </div>
                              </div>
                          ))}
                          
                          {/* Add Item Form */}
                          {!isLockedForItems && hasBalcao && (
                              <div className="flex gap-2 items-start mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
                                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                                      <div className="relative">
                                          <select 
                                              className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 mb-2"
                                              value={selectedCatalogId}
                                              onChange={e => setSelectedCatalogId(e.target.value)}
                                          >
                                              <option value="">Selecione do Catálogo...</option>
                                              {catalog.map(c => (
                                                  <option key={c.id} value={c.id}>{c.name} - R$ {c.defaultPrice}</option>
                                              ))}
                                          </select>
                                          <input 
                                              placeholder="Nome do Item / Serviço" 
                                              className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                                              value={newItemName}
                                              onChange={e => { setNewItemName(e.target.value); setSelectedCatalogId(''); }}
                                          />
                                      </div>
                                      <div className="flex gap-2">
                                          <input 
                                              type="number" 
                                              placeholder="Preço" 
                                              className="w-24 p-2 border border-slate-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                                              value={newItemPrice}
                                              onChange={e => setNewItemPrice(e.target.value)}
                                          />
                                          <select
                                              className="flex-1 p-2 border border-slate-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                                              value={newItemSeverity}
                                              onChange={e => setNewItemSeverity(e.target.value as ItemSeverity)}
                                          >
                                              <option value="critical">Crítico (Obrigatório)</option>
                                              <option value="recommended">Sugerido (Opcional)</option>
                                          </select>
                                      </div>
                                  </div>
                                  <Button onClick={handleAddItem} size="sm" className="h-full">
                                      <Plus size={16} />
                                  </Button>
                              </div>
                          )}
                          {isLockedForItems && (
                              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-center text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2">
                                  <Lock size={12} /> Edição de itens bloqueada nesta etapa.
                              </div>
                          )}
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Total do Orçamento</span>
                          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">R$ {order.totalValue.toFixed(2)}</span>
                      </div>
                  </div>
              </CardContent>
          </Card>

          {/* AUDIT LOG (Bottom) */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center">
                      <History size={12} className="mr-1" /> Histórico de Alterações
                  </h4>
                  <button 
                    onClick={() => setShowFullHistory(true)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Ver Tudo ({order.auditLog.length})
                  </button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 text-xs">
                  {order.auditLog.slice(0, 5).map(log => (
                      <div key={log.id} className="flex justify-between text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1 last:border-0">
                          <span>{log.action} <span className="text-slate-400 dark:text-slate-600">({log.actorName})</span></span>
                          <span className="font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                  ))}
              </div>
          </div>

          {/* MODAL DE HISTÓRICO COMPLETO */}
          {showFullHistory && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                  <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-2xl max-h-[80vh] flex flex-col">
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Histórico Completo da OS #{order.id}</h3>
                          <button onClick={() => setShowFullHistory(false)}><X className="w-5 h-5 text-slate-500 hover:text-slate-900" /></button>
                      </div>
                      <div className="p-4 overflow-y-auto flex-1 space-y-4">
                          {order.auditLog.map(log => (
                              <div key={log.id} className="flex gap-4 items-start">
                                  <div className="w-2 h-2 mt-2 rounded-full bg-slate-300 dark:bg-slate-700 flex-shrink-0"></div>
                                  <div className="flex-1">
                                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{log.action}</p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">{log.details || 'Sem detalhes.'}</p>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{log.actorName}</p>
                                      <p className="text-[10px] text-slate-400 font-mono">{new Date(log.timestamp).toLocaleString()}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

        </div>

        {/* RIGHT COLUMN: Sidebar Info & Actions */}
        <div className="lg:col-span-4 space-y-6">
            
            {/* EVIDENCE TIMELINE (Visual Importance) */}
            <Card>
                <CardHeader title="Linha do Tempo Visual" subtitle="Evidências do processo" />
                <div className="p-4 pt-0">
                    <EvidenceUpload orderId={order.id} currentUser={currentUser} onUpload={handleSecureUpload} />
                    <div className="mt-4 border-t border-slate-100 pt-4">
                        <EvidenceTimeline evidences={order.evidence} currentUser={currentUser} onDelete={handleDeleteEvidence} />
                    </div>
                </div>
            </Card>

            {/* STATUS HISTORY */}
            <Card>
                <CardHeader title="Histórico de Status" />
                <CardContent className="pt-2">
                    <StatusTimeline history={order.statusHistory || []} />
                </CardContent>
            </Card>

            {/* APPROVED DOCUMENT BADGE */}
            {activeApproval && activeApproval.status === 'APPROVED' && (
                <div className="bg-white dark:bg-slate-900 border border-green-200 dark:border-green-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">
                        AUTENTICADO
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                        <ShieldCheck className="text-green-600 w-8 h-8" />
                        <div>
                            <h4 className="font-bold text-green-900 dark:text-green-400 text-sm">Aprovação Verificada</h4>
                            <p className="text-[10px] text-green-700 dark:text-green-500">Hash: {activeApproval.verificationHash?.substring(0, 12)}...</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <button 
                            onClick={handleDownloadReceipt}
                            disabled={isGeneratingPdf}
                            className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-2 rounded-lg flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
                        >
                            {isGeneratingPdf ? <Loader2 size={14} className="animate-spin mr-1" /> : <FileCheck size={14} className="mr-1" />}
                            PDF
                        </button>
                        <button 
                            onClick={openVerificationPage}
                            className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 p-2 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            <ExternalLink size={14} className="mr-1" /> Validar
                        </button>
                    </div>

                    {signature && (
                        <div className="mt-3 pt-3 border-t border-green-100 dark:border-green-900/30">
                            <p className="text-[10px] text-slate-400 mb-1 uppercase font-bold">Assinado por</p>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{signature.signedName}</span>
                                {signature.signatureImage && (
                                    <img src={signature.signatureImage} className="h-6 opacity-80" alt="Signature" />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
      </div>
    </div>
  );
};