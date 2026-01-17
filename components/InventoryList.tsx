import React, { useState, useEffect, useRef } from 'react';
import { DataService } from '../services/dataService';
import { InventoryItem, User } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Plus, Search, AlertTriangle, Package, Edit2, History, ArrowDown, ArrowUp, Barcode, FileSpreadsheet, Loader2 } from 'lucide-react';
import { InventoryImport } from './InventoryImport';

interface InventoryListProps {
    currentUser: User;
}

export const InventoryList: React.FC<InventoryListProps> = ({ currentUser }) => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isMovementOpen, setIsMovementOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    
    // Form States
    const [editingItem, setEditingItem] = useState<Partial<InventoryItem>>({});
    const [movementData, setMovementData] = useState({ itemId: '', qty: 0, type: 'IN' as 'IN'|'OUT', reason: '' });
    const [isScanning, setIsScanning] = useState(false);

    const barcodeInputRef = useRef<HTMLInputElement>(null);

    const canEdit = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';

    useEffect(() => {
        loadInventory();
    }, [currentUser]);

    // Auto-focus barcode input when modal opens
    useEffect(() => {
        if (isFormOpen && !editingItem.id) {
            setTimeout(() => barcodeInputRef.current?.focus(), 100);
        }
    }, [isFormOpen]);

    const loadInventory = () => {
        setItems(DataService.getInventory());
    };

    const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const code = (e.target as HTMLInputElement).value;
            if (!code) return;

            setIsScanning(true);
            // Simulate slight delay for "lookup" feeling
            setTimeout(() => {
                const found = DataService.findInventoryItemByBarcode(code);
                if (found) {
                    // Pre-fill existing data for editing
                    setEditingItem(found);
                    alert("Produto encontrado! Modo de edição ativado.");
                } else {
                    // New item
                    // Keep the barcode, clear other fields if they were dirty? 
                    // Usually we just keep the barcode set.
                }
                setIsScanning(false);
            }, 300);
        }
    };

    const handleSaveItem = (e: React.FormEvent) => {
        e.preventDefault();
        const newItem: InventoryItem = {
            id: editingItem.id || Date.now().toString(),
            companyId: currentUser.companyId || '',
            name: editingItem.name!,
            category: editingItem.category || 'Geral',
            description: editingItem.description || '',
            barcode: editingItem.barcode || '',
            purchasePrice: Number(editingItem.purchasePrice) || 0,
            salePrice: Number(editingItem.salePrice) || 0,
            quantity: Number(editingItem.quantity) || 0,
            minQuantity: Number(editingItem.minQuantity) || 5,
            active: true,
            createdAt: editingItem.createdAt || Date.now(),
            updatedAt: Date.now()
        };

        DataService.saveInventoryItem(newItem);
        setIsFormOpen(false);
        setEditingItem({});
        loadInventory();
    };

    const handleMovement = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            DataService.adjustStock(movementData.itemId, Number(movementData.qty), movementData.type, movementData.reason);
            setIsMovementOpen(false);
            setMovementData({ itemId: '', qty: 0, type: 'IN', reason: '' });
            loadInventory();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const openEdit = (item: InventoryItem) => {
        setEditingItem(item);
        setIsFormOpen(true);
    };

    const openMovement = (item: InventoryItem, type: 'IN' | 'OUT') => {
        setMovementData({ itemId: item.id, qty: 1, type, reason: '' });
        setIsMovementOpen(true);
    };

    const filteredItems = items.filter(i => 
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        i.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.barcode?.includes(searchTerm)
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {isImportOpen && (
                <InventoryImport 
                    onClose={() => setIsImportOpen(false)} 
                    onSuccess={loadInventory} 
                />
            )}

            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Controle de Estoque</h2>
                    <p className="text-slate-500">Gerencie produtos, peças e movimentações.</p>
                </div>
                {canEdit && (
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setIsImportOpen(true)}>
                            <FileSpreadsheet className="w-4 h-4 mr-2" /> Importar CSV
                        </Button>
                        <Button onClick={() => { setEditingItem({}); setIsFormOpen(true); }}>
                            <Plus className="w-4 h-4 mr-2" /> Novo Produto
                        </Button>
                    </div>
                )}
            </div>

            {/* MODAL: ADD/EDIT ITEM */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg">{editingItem.id ? 'Editar Produto' : 'Cadastrar Produto'}</h3>
                            <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-red-500">×</button>
                        </div>
                        <form onSubmit={handleSaveItem} className="p-6 grid grid-cols-2 gap-4">
                            <div className="col-span-2 bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center gap-3">
                                <Barcode className="text-blue-600" />
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Código de Barras (Scan)</label>
                                    <input 
                                        ref={barcodeInputRef}
                                        className="w-full p-1 bg-white border border-blue-200 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                                        value={editingItem.barcode || ''} 
                                        onChange={e => setEditingItem({...editingItem, barcode: e.target.value})}
                                        onKeyDown={handleBarcodeScan}
                                        placeholder="Passe o leitor aqui..."
                                    />
                                </div>
                                {isScanning && <Loader2 className="animate-spin text-blue-600" />}
                            </div>

                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Produto</label>
                                <input className="w-full p-2 border rounded" value={editingItem.name || ''} onChange={e => setEditingItem({...editingItem, name: e.target.value})} required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria</label>
                                <input className="w-full p-2 border rounded" value={editingItem.category || ''} onChange={e => setEditingItem({...editingItem, category: e.target.value})} placeholder="Ex: Telas, Baterias" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Preço de Custo (R$)</label>
                                <input type="number" step="0.01" className="w-full p-2 border rounded" value={editingItem.purchasePrice || ''} onChange={e => setEditingItem({...editingItem, purchasePrice: Number(e.target.value)})} required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Preço de Venda (R$)</label>
                                <input type="number" step="0.01" className="w-full p-2 border rounded" value={editingItem.salePrice || ''} onChange={e => setEditingItem({...editingItem, salePrice: Number(e.target.value)})} required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estoque Inicial</label>
                                <input type="number" className="w-full p-2 border rounded" value={editingItem.quantity || ''} onChange={e => setEditingItem({...editingItem, quantity: Number(e.target.value)})} disabled={!!editingItem.id} required />
                                {editingItem.id && <p className="text-[10px] text-slate-400">Use movimentação para alterar</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estoque Mínimo (Alerta)</label>
                                <input type="number" className="w-full p-2 border rounded" value={editingItem.minQuantity || ''} onChange={e => setEditingItem({...editingItem, minQuantity: Number(e.target.value)})} required />
                            </div>
                            <div className="col-span-2 pt-4 flex justify-end gap-2">
                                <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                                <Button type="submit">Salvar Produto</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: MOVIMENTAÇÃO */}
            {isMovementOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-lg">{movementData.type === 'IN' ? 'Entrada de Estoque' : 'Baixa Manual'}</h3>
                        </div>
                        <form onSubmit={handleMovement} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantidade</label>
                                <input type="number" min="1" className="w-full p-2 border rounded" value={movementData.qty} onChange={e => setMovementData({...movementData, qty: Number(e.target.value)})} required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Motivo / Observação</label>
                                <input className="w-full p-2 border rounded" value={movementData.reason} onChange={e => setMovementData({...movementData, reason: e.target.value})} required placeholder={movementData.type === 'IN' ? 'Compra NF 123' : 'Avaria, Uso interno...'} />
                            </div>
                            <Button type="submit" className={`w-full ${movementData.type === 'IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                                Confirmar {movementData.type === 'IN' ? 'Entrada' : 'Baixa'}
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
                        placeholder="Buscar por nome, categoria ou código..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredItems.map(item => (
                    <Card key={item.id} className="hover:border-slate-300 transition-colors">
                        <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${item.quantity <= item.minQuantity ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                    <Package size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                        {item.name}
                                        {item.quantity <= item.minQuantity && (
                                            <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center">
                                                <AlertTriangle size={10} className="mr-1" /> Baixo Estoque
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-sm text-slate-500 flex items-center gap-2">
                                        {item.category} 
                                        {item.barcode && <span className="flex items-center bg-slate-100 px-1.5 rounded text-[10px]"><Barcode size={10} className="mr-1"/> {item.barcode}</span>}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 md:justify-end flex-1">
                                <div className="text-right">
                                    <p className="text-xs text-slate-400 uppercase">Preço Venda</p>
                                    <p className="font-bold text-slate-900">R$ {item.salePrice.toFixed(2)}</p>
                                </div>
                                <div className="text-right px-4 border-l border-slate-100">
                                    <p className="text-xs text-slate-400 uppercase">Em Estoque</p>
                                    <p className={`font-bold text-xl ${item.quantity <= item.minQuantity ? 'text-red-600' : 'text-slate-900'}`}>{item.quantity}</p>
                                </div>
                                {canEdit && (
                                    <div className="flex gap-2">
                                        <button onClick={() => openMovement(item, 'IN')} className="p-2 bg-green-50 text-green-700 rounded hover:bg-green-100" title="Entrada">
                                            <ArrowUp size={16} />
                                        </button>
                                        <button onClick={() => openMovement(item, 'OUT')} className="p-2 bg-red-50 text-red-700 rounded hover:bg-red-100" title="Baixa Manual">
                                            <ArrowDown size={16} />
                                        </button>
                                        <button onClick={() => openEdit(item)} className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200" title="Editar">
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
                {filteredItems.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
                        Nenhum item encontrado.
                    </div>
                )}
            </div>
        </div>
    );
};