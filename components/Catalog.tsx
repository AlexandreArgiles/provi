import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { CatalogItem, CatalogType } from '../types';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Plus, Search, Tag, Wrench, Edit2, Trash2, Package } from 'lucide-react';

export const Catalog: React.FC = () => {
    const [items, setItems] = useState<CatalogItem[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentItem, setCurrentItem] = useState<Partial<CatalogItem>>({});

    useEffect(() => {
        setItems(DataService.getCatalog());
    }, []);

    const handleSave = () => {
        if (!currentItem.name || !currentItem.defaultPrice) return;
        
        const item: CatalogItem = {
            id: currentItem.id || Date.now().toString(),
            name: currentItem.name,
            type: currentItem.type || 'PART',
            defaultPrice: Number(currentItem.defaultPrice),
            description: currentItem.description || '',
            active: true
        };

        DataService.saveCatalogItem(item);
        setItems(DataService.getCatalog());
        setIsEditing(false);
        setCurrentItem({});
    };

    const handleDelete = (id: string) => {
        if(window.confirm('Tem certeza? Isso não remove o item de ordens antigas.')) {
            DataService.deleteCatalogItem(id);
            setItems(DataService.getCatalog());
        }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Catálogo de Serviços e Peças</h2>
                    <p className="text-slate-500">Padronize preços e descrições para agilizar o atendimento.</p>
                </div>
                <Button onClick={() => { setCurrentItem({ type: 'PART' }); setIsEditing(true); }}>
                    <Plus className="w-4 h-4 mr-2" /> Novo Item
                </Button>
            </div>

            {isEditing && (
                <Card className="border-blue-200 shadow-lg ring-4 ring-blue-50/50">
                    <CardHeader title={currentItem.id ? "Editar Item" : "Novo Item de Catálogo"} />
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Item</label>
                                <input 
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={currentItem.name || ''}
                                    onChange={e => setCurrentItem({...currentItem, name: e.target.value})}
                                    placeholder="Ex: Tela iPhone 13 Pro"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                                <select 
                                    className="w-full p-2 border rounded-lg bg-white"
                                    value={currentItem.type}
                                    onChange={e => setCurrentItem({...currentItem, type: e.target.value as CatalogType})}
                                >
                                    <option value="PART">Peça / Produto</option>
                                    <option value="SERVICE">Serviço / Mão de Obra</option>
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Preço Padrão (R$)</label>
                                <input 
                                    type="number"
                                    className="w-full p-2 border rounded-lg"
                                    value={currentItem.defaultPrice || ''}
                                    onChange={e => setCurrentItem({...currentItem, defaultPrice: Number(e.target.value)})}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição Técnica (Padrão)</label>
                                <input 
                                    className="w-full p-2 border rounded-lg"
                                    value={currentItem.description || ''}
                                    onChange={e => setCurrentItem({...currentItem, description: e.target.value})}
                                    placeholder="Ex: Original retirada, garantia 90 dias"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancelar</Button>
                            <Button onClick={handleSave}>Salvar Item</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 gap-4">
                {items.map(item => (
                    <Card key={item.id} className="hover:border-slate-300 transition-colors">
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.type === 'PART' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {item.type === 'PART' ? <Package size={20} /> : <Wrench size={20} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{item.name}</h3>
                                    <p className="text-sm text-slate-500">{item.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <span className="block text-sm font-bold text-slate-900">R$ {item.defaultPrice.toFixed(2)}</span>
                                    <span className="text-xs text-slate-400 uppercase">{item.type === 'PART' ? 'Peça' : 'Serviço'}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { setCurrentItem(item); setIsEditing(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
                 {items.length === 0 && <p className="text-center text-slate-400 py-10">Nenhum item cadastrado.</p>}
            </div>
        </div>
    );
};