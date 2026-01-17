import React, { useState, useEffect, useRef } from 'react';
import { DataService } from '../services/dataService';
import { InventoryItem, User, SaleItem, Customer, PaymentMethod } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, User as UserIcon, CheckCircle, Loader2, Barcode, Scan } from 'lucide-react';

interface POSProps {
    currentUser: User;
}

export const POS: React.FC<POSProps> = ({ currentUser }) => {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<SaleItem[]>([]);
    const [lastScanned, setLastScanned] = useState<string | null>(null);
    
    // Checkout State
    const [selectedCustomer, setSelectedCustomer] = useState<Partial<Customer>>({ name: 'Consumidor Final', id: '' });
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Customer Search
    const [customerQuery, setCustomerQuery] = useState('');
    const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);

    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setInventory(DataService.getInventory().filter(i => i.quantity > 0)); // Only show available items
    }, []);

    // Keep focus on search input for rapid scanning
    useEffect(() => {
        const interval = setInterval(() => {
            if (!document.activeElement || document.activeElement.tagName !== 'INPUT') {
               // Optional: aggressive focus, but might be annoying. Let's rely on user click for now or initial focus.
            }
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const addToCart = (item: InventoryItem) => {
        const existing = cart.find(i => i.inventoryItemId === item.id);
        if (existing) {
            if (existing.quantity >= item.quantity) {
                alert("Estoque máximo atingido para este item.");
                return;
            }
            setCart(cart.map(i => i.inventoryItemId === item.id 
                ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice } 
                : i));
        } else {
            const newItem: SaleItem = {
                id: Date.now().toString(),
                inventoryItemId: item.id,
                name: item.name,
                quantity: 1,
                unitPrice: item.salePrice,
                subtotal: item.salePrice,
                costPriceSnapshot: item.purchasePrice
            };
            setCart([...cart, newItem]);
        }
        setLastScanned(item.name);
        setTimeout(() => setLastScanned(null), 2000);
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = searchTerm.trim();
            if (!query) return;

            // 1. Try Exact Barcode Match
            const exactMatch = inventory.find(i => i.barcode === query);
            
            if (exactMatch) {
                addToCart(exactMatch);
                setSearchTerm(''); // Clear for next scan
            } else {
                // If not barcode, maybe it's a quick select if only 1 result?
                const partialMatches = inventory.filter(i => i.name.toLowerCase().includes(query.toLowerCase()));
                if (partialMatches.length === 1) {
                    addToCart(partialMatches[0]);
                    setSearchTerm('');
                }
            }
        }
    };

    const updateQty = (id: string, delta: number) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                // Check stock limit
                const stockItem = inventory.find(i => i.id === item.inventoryItemId);
                if (stockItem && newQty > stockItem.quantity) {
                    return item; // Max reached
                }
                return { ...item, quantity: newQty, subtotal: newQty * item.unitPrice };
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(cart.filter(i => i.id !== id));
    };

    const handleCustomerSearch = (query: string) => {
        setCustomerQuery(query);
        if (query.length > 2 && currentUser.companyId) {
            setCustomerSuggestions(DataService.searchCustomers(query, currentUser.companyId));
        } else {
            setCustomerSuggestions([]);
        }
    };

    const selectCustomer = (c: Customer) => {
        setSelectedCustomer(c);
        setCustomerQuery('');
        setCustomerSuggestions([]);
    };

    const handleFinalize = () => {
        if (cart.length === 0) return;
        setIsProcessing(true);

        try {
            // Auto-create customer if typed but not selected and has enough info
            let finalCustomerName = selectedCustomer.name || 'Consumidor';
            let finalCustomerId = selectedCustomer.id;

            if (!finalCustomerId && customerQuery.length > 2) {
                finalCustomerName = customerQuery;
            }

            DataService.createSale({
                companyId: currentUser.companyId || '',
                userId: currentUser.id,
                userName: currentUser.name,
                customerId: finalCustomerId,
                customerName: finalCustomerName,
                totalValue: 0, // Calculated in backend
                paymentMethod,
                items: cart,
                status: 'COMPLETED'
            });

            alert("Venda realizada com sucesso!");
            setCart([]);
            setSelectedCustomer({ name: 'Consumidor Final', id: '' });
            setInventory(DataService.getInventory().filter(i => i.quantity > 0)); // Refresh stock
        } catch (error: any) {
            alert("Erro ao finalizar: " + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const cartTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
    
    // Filter display list based on search (but don't filter if empty to show all popular/recent)
    const filteredInventory = searchTerm 
        ? inventory.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.barcode === searchTerm)
        : inventory;

    return (
        <div className="h-[calc(100vh-100px)] grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* LEFT: PRODUCTS */}
            <div className="lg:col-span-2 flex flex-col gap-4">
                <div className={`bg-white p-4 rounded-xl border-2 shadow-sm flex gap-4 transition-colors ${lastScanned ? 'border-green-400 ring-2 ring-green-100' : 'border-slate-200'}`}>
                    <div className="relative flex-1">
                        <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
                        <input 
                            ref={searchInputRef}
                            className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Escaneie o código ou digite o nome..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            autoFocus
                        />
                        {searchTerm && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                                Enter para adicionar
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-4 pb-20 content-start">
                    {filteredInventory.map(item => (
                        <div 
                            key={item.id} 
                            onClick={() => addToCart(item)}
                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between h-40"
                        >
                            <div>
                                <h4 className="font-bold text-slate-800 line-clamp-2 text-sm">{item.name}</h4>
                                <p className="text-xs text-slate-500 mt-1">{item.category}</p>
                                {item.barcode && <p className="text-[10px] text-slate-400 font-mono mt-1 flex items-center"><Scan size={8} className="mr-1"/> {item.barcode}</p>}
                            </div>
                            <div className="flex justify-between items-end mt-2">
                                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">Est: {item.quantity}</span>
                                <span className="font-bold text-lg text-blue-600">R$ {item.salePrice.toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                    {filteredInventory.length === 0 && (
                        <div className="col-span-3 text-center py-10 text-slate-400">Nenhum produto encontrado</div>
                    )}
                </div>
            </div>

            {/* RIGHT: CART & CHECKOUT */}
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 flex flex-col h-full overflow-hidden">
                <div className={`p-4 transition-colors text-white flex justify-between items-center ${lastScanned ? 'bg-green-600' : 'bg-slate-900'}`}>
                    <h3 className="font-bold flex items-center gap-2">
                        {lastScanned ? <CheckCircle size={20} /> : <ShoppingCart size={20} />} 
                        {lastScanned ? `Adicionado: ${lastScanned}` : 'Carrinho'}
                    </h3>
                    <span className="text-sm bg-white/20 px-2 py-0.5 rounded">{cart.reduce((a,b)=>a+b.quantity,0)} un</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.map(item => (
                        <div key={item.id} className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div className="flex-1">
                                <p className="font-medium text-slate-800 text-sm line-clamp-1">{item.name}</p>
                                <p className="text-xs text-slate-500">R$ {item.unitPrice.toFixed(2)} un</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center border rounded-lg bg-slate-50">
                                    <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-slate-200 rounded-l-lg"><Minus size={14}/></button>
                                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                                    <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-slate-200 rounded-r-lg"><Plus size={14}/></button>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                            </div>
                            <div className="w-20 text-right font-bold text-slate-800">
                                R$ {item.subtotal.toFixed(2)}
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && <div className="text-center py-10 text-slate-400">Carrinho vazio (F2)</div>}
                </div>

                {/* CHECKOUT AREA */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-4">
                    {/* CUSTOMER SELECTOR */}
                    <div className="relative">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cliente</label>
                        <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg p-2">
                            <UserIcon size={16} className="text-slate-400" />
                            {selectedCustomer.id ? (
                                <div className="flex-1 flex justify-between items-center">
                                    <span className="text-sm font-bold text-blue-700">{selectedCustomer.name}</span>
                                    <button onClick={() => setSelectedCustomer({ name: 'Consumidor Final', id: '' })} className="text-xs text-red-500 hover:underline">Remover</button>
                                </div>
                            ) : (
                                <input 
                                    className="flex-1 outline-none text-sm" 
                                    placeholder="Buscar ou Digitar Nome..."
                                    value={customerQuery}
                                    onChange={e => handleCustomerSearch(e.target.value)}
                                />
                            )}
                        </div>
                        {customerSuggestions.length > 0 && (
                            <ul className="absolute bottom-full mb-1 left-0 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                                {customerSuggestions.map(c => (
                                    <li key={c.id} onClick={() => selectCustomer(c)} className="p-2 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-0">
                                        <p className="font-bold">{c.name}</p>
                                        <p className="text-xs text-slate-500">{c.phone}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* PAYMENT METHOD */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pagamento</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['PIX', 'CREDIT_CARD', 'CASH'].map(method => (
                                <button 
                                    key={method}
                                    onClick={() => setPaymentMethod(method as PaymentMethod)}
                                    className={`text-xs py-2 rounded border font-medium transition-colors ${paymentMethod === method ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300'}`}
                                >
                                    {method === 'CREDIT_CARD' ? 'Cartão' : method}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        <span className="text-slate-500 font-medium">Total a Pagar</span>
                        <span className="text-3xl font-bold text-slate-900">R$ {cartTotal.toFixed(2)}</span>
                    </div>

                    <Button 
                        onClick={handleFinalize} 
                        className="w-full h-12 text-lg shadow-lg shadow-green-200 bg-green-600 hover:bg-green-700"
                        disabled={cart.length === 0 || isProcessing}
                    >
                        {isProcessing ? <Loader2 className="animate-spin" /> : <><CheckCircle className="mr-2" /> Finalizar Venda</>}
                    </Button>
                </div>
            </div>
        </div>
    );
};