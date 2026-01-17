import React, { useState, useRef } from 'react';
import { DataService } from '../services/dataService';
import { InventoryItem } from '../types';
import { Button } from './ui/Button';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle, X, Download } from 'lucide-react';

interface InventoryImportProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const InventoryImport: React.FC<InventoryImportProps> = ({ onClose, onSuccess }) => {
    const [step, setStep] = useState<'UPLOAD' | 'PREVIEW'>('UPLOAD');
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [conflictMode, setConflictMode] = useState<'SKIP' | 'UPDATE'>('SKIP');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const text = await file.text();
        const rows = text.split('\n').map(row => row.trim()).filter(row => row);
        
        // Basic CSV Parse (Assumption: Header row, comma separated)
        if (rows.length < 2) {
            alert("Arquivo vazio ou inválido.");
            return;
        }

        // Expected Header: Name, Category, Barcode, Cost, Price, Qty, MinQty
        const headers = rows[0].split(',').map(h => h.toLowerCase().trim());
        const dataRows = rows.slice(1);
        
        const preview: any[] = [];
        const parseErrors: string[] = [];

        dataRows.forEach((rowStr, idx) => {
            const cols = rowStr.split(',').map(c => c.trim());
            // Map columns simply by index for this MVP (User must follow template)
            // 0: Name, 1: Category, 2: Barcode, 3: Cost, 4: Price, 5: Qty, 6: MinQty
            
            if (cols.length < 5) {
                parseErrors.push(`Linha ${idx + 2}: Colunas insuficientes.`);
                return;
            }

            const item = {
                name: cols[0],
                category: cols[1] || 'Geral',
                barcode: cols[2],
                purchasePrice: parseFloat(cols[3]) || 0,
                salePrice: parseFloat(cols[4]) || 0,
                quantity: parseInt(cols[5]) || 0,
                minQuantity: parseInt(cols[6]) || 5,
                isValid: true,
                error: ''
            };

            if (!item.name) {
                item.isValid = false;
                item.error = 'Nome obrigatório';
            }
            if (isNaN(item.salePrice)) {
                item.isValid = false;
                item.error = 'Preço inválido';
            }

            preview.push(item);
        });

        setParsedData(preview);
        setStep('PREVIEW');
    };

    const handleImport = () => {
        const validItems = parsedData.filter(i => i.isValid).map(i => ({
            name: i.name,
            category: i.category,
            barcode: i.barcode,
            purchasePrice: i.purchasePrice,
            salePrice: i.salePrice,
            quantity: i.quantity,
            minQuantity: i.minQuantity
        }));

        try {
            const result = DataService.bulkImportInventory(validItems, conflictMode);
            alert(`Importação concluída!\n${result.createdCount} criados.\n${result.updatedCount} atualizados.`);
            onSuccess();
            onClose();
        } catch (e: any) {
            alert("Erro: " + e.message);
        }
    };

    const downloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,Nome,Categoria,CodigoBarras,PrecoCusto,PrecoVenda,Quantidade,EstoqueMinimo\nProduto Exemplo,Geral,123456789,10.00,20.00,100,5";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "modelo_importacao.csv");
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <CardHeader 
                    title="Importação em Lote (CSV)" 
                    subtitle="Adicione ou atualize produtos massivamente."
                    action={<button onClick={onClose}><X className="text-slate-400" /></button>}
                />
                
                <CardContent className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    {step === 'UPLOAD' ? (
                        <div className="flex flex-col items-center justify-center space-y-6 py-10">
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full max-w-md h-48 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-white hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
                            >
                                <Upload className="w-12 h-12 text-slate-400 mb-2" />
                                <p className="font-bold text-slate-700">Clique para selecionar arquivo CSV</p>
                                <p className="text-xs text-slate-500 mt-1">Formato: Nome, Categoria, Barcode, Custo, Venda, Qtd, Min</p>
                                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                            </div>
                            
                            <Button variant="secondary" onClick={downloadTemplate}>
                                <Download className="w-4 h-4 mr-2" /> Baixar Modelo CSV
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
                                <div>
                                    <p className="text-sm font-bold text-slate-700">Resumo da Leitura</p>
                                    <p className="text-xs text-slate-500">
                                        Total: {parsedData.length} | Válidos: <span className="text-green-600">{parsedData.filter(i => i.isValid).length}</span> | Inválidos: <span className="text-red-600">{parsedData.filter(i => !i.isValid).length}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase mr-2">Se duplicado:</label>
                                    <select 
                                        className="p-2 border rounded text-sm bg-slate-50"
                                        value={conflictMode}
                                        onChange={e => setConflictMode(e.target.value as any)}
                                    >
                                        <option value="SKIP">Ignorar (Manter atual)</option>
                                        <option value="UPDATE">Atualizar dados</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-white border rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100 text-xs uppercase font-bold text-slate-600">
                                        <tr>
                                            <th className="p-3">Status</th>
                                            <th className="p-3">Nome</th>
                                            <th className="p-3">Código</th>
                                            <th className="p-3">Preço</th>
                                            <th className="p-3">Qtd</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {parsedData.map((row, idx) => (
                                            <tr key={idx} className={row.isValid ? '' : 'bg-red-50'}>
                                                <td className="p-3">
                                                    {row.isValid ? (
                                                        <CheckCircle size={16} className="text-green-500"/>
                                                    ) : (
                                                        <span title={row.error}>
                                                            <AlertTriangle size={16} className="text-red-500" />
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3">{row.name}</td>
                                                <td className="p-3 font-mono text-xs">{row.barcode}</td>
                                                <td className="p-3">R$ {row.salePrice}</td>
                                                <td className="p-3">{row.quantity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </CardContent>

                {step === 'PREVIEW' && (
                    <div className="p-4 border-t bg-white flex justify-between">
                        <Button variant="secondary" onClick={() => setStep('UPLOAD')}>Voltar</Button>
                        <Button onClick={handleImport} disabled={parsedData.filter(i => i.isValid).length === 0}>
                            Confirmar Importação
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
};