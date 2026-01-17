import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { User, UserRole, UserFunction } from '../types';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Users, Plus, Shield, Wrench, Lock, Unlock, Mail, User as UserIcon, Store, Trash2, Edit2, Key, X, CheckCircle, Copy } from 'lucide-react';

interface UserManagementProps {
    currentUser: User;
    targetCompanyId?: string; 
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser, targetCompanyId }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [resetModalData, setResetModalData] = useState<{name: string, tempPass: string} | null>(null);
    
    // Determine context
    const activeCompanyId = targetCompanyId || currentUser.companyId;
    const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'FUNCIONARIO' as UserRole,
        functions: ['BALCAO'] as UserFunction[],
        password: '' 
    });

    useEffect(() => {
        loadTeam();
    }, [currentUser, activeCompanyId]);

    const loadTeam = () => {
        const allUsers = DataService.getUsers();
        // Filter users by the active company scope
        const activeTeam = allUsers.filter(u => 
            u.companyId === activeCompanyId && !u.deletedAt
        );
        setUsers(activeTeam);
    };

    const toggleFunction = (fn: UserFunction) => {
        const current = formData.functions;
        if (current.includes(fn)) {
            setFormData({ ...formData, functions: current.filter(f => f !== fn) });
        } else {
            setFormData({ ...formData, functions: [...current, fn] });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name || !formData.email) return;

        if (formData.functions.length === 0 && formData.role === 'FUNCIONARIO') {
            alert("Selecione pelo menos uma função operacional (Balcão ou Bancada).");
            return;
        }

        if (editingUser) {
            // Update logic
            const updatedUser: User = {
                ...editingUser,
                name: formData.name,
                email: formData.email,
                role: formData.role, 
                functions: formData.functions,
            };
            DataService.saveUser(updatedUser);
        } else {
            // Create logic
            if (!formData.password) {
                alert("Senha é obrigatória para novos usuários");
                return;
            }
            
            const finalFunctions = formData.role === 'ADMIN' && formData.functions.length === 0 
                ? ['BALCAO', 'BANCADA'] as UserFunction[] 
                : formData.functions;

            const newUser: User = {
                id: Date.now().toString(),
                name: formData.name,
                email: formData.email,
                role: formData.role,
                functions: finalFunctions,
                companyId: activeCompanyId,
                active: true,
                avatar: `https://i.pravatar.cc/150?u=${Date.now()}`,
                mustChangePassword: true // FORCE ON CREATION
            };
            DataService.saveUser(newUser);
        }
        
        resetForm();
        loadTeam();
    };

    const handleDelete = (id: string) => {
        if (window.confirm("ATENÇÃO: Isso removerá o acesso do usuário. Continuar?")) {
            DataService.deleteUser(id);
            loadTeam();
        }
    };

    const handleResetPassword = (user: User) => {
        const tempPass = Math.random().toString(36).slice(-8).toUpperCase();
        
        // Mock backend update
        const updated = { ...user, mustChangePassword: true }; 
        DataService.saveUser(updated);

        // Show Modal
        setResetModalData({ name: user.name, tempPass: tempPass });
    };

    const startEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            role: user.role,
            functions: user.functions,
            password: '' 
        });
        setIsFormOpen(true);
    };

    const resetForm = () => {
        setIsFormOpen(false);
        setEditingUser(null);
        setFormData({
            name: '',
            email: '',
            role: 'FUNCIONARIO',
            functions: ['BALCAO'],
            password: ''
        });
    };

    const toggleStatus = (id: string) => {
        DataService.toggleUserStatus(id);
        loadTeam();
    };

    const canManage = (targetUser: User) => {
        if (targetUser.id === currentUser.id) return false;
        if (isSuperAdmin) return true;
        if (targetUser.role === 'ADMIN') return false;
        return true;
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto relative">
             
             {/* PASSWORD RESET MODAL */}
             {resetModalData && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                     <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border-t-8 border-purple-600">
                         <div className="text-center mb-6">
                            <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                                <Key className="text-purple-600 w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Senha Resetada com Sucesso!</h3>
                            <p className="text-sm text-slate-500 mt-1">Para o usuário <span className="font-semibold text-slate-800">{resetModalData.name}</span></p>
                         </div>
                         
                         <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center mb-6">
                             <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-2">Senha Temporária</p>
                             <div className="flex items-center justify-center gap-2">
                                <span className="text-2xl font-mono font-bold text-slate-900 tracking-wider select-all">{resetModalData.tempPass}</span>
                             </div>
                             <p className="text-xs text-amber-600 mt-2 flex items-center justify-center">
                                 <Shield size={12} className="mr-1" /> O usuário deverá trocar no próximo login.
                             </p>
                         </div>

                         <Button className="w-full" onClick={() => setResetModalData(null)}>
                             <CheckCircle className="w-4 h-4 mr-2" /> Entendido
                         </Button>
                     </div>
                 </div>
             )}

             <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Gestão de Equipe</h2>
                    <p className="text-slate-500">
                        {isSuperAdmin && targetCompanyId 
                            ? "Administrando usuários da empresa selecionada." 
                            : "Administre o acesso e funções dos colaboradores."}
                    </p>
                </div>
                {!isFormOpen && (
                    <Button onClick={() => setIsFormOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Novo Usuário
                    </Button>
                )}
            </div>

            {isFormOpen && (
                <Card className="border-blue-200 shadow-lg ring-4 ring-blue-50/50">
                    <CardHeader 
                        title={editingUser ? "Editar Usuário" : "Cadastrar Novo Usuário"} 
                        subtitle="Defina o acesso e as permissões"
                        action={<button onClick={resetForm}><X className="text-slate-400" /></button>}
                    />
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input 
                                        className="w-full pl-9 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail de Acesso</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                    <input 
                                        type="email"
                                        className="w-full pl-9 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>

                             {!editingUser && (
                                 <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Senha Inicial</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <input 
                                            type="text"
                                            className="w-full pl-9 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            value={formData.password}
                                            onChange={e => setFormData({...formData, password: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-amber-600 mt-1">* O usuário será obrigado a trocar no primeiro login.</p>
                                </div>
                             )}

                            {/* ROLE SELECTOR - ONLY FOR SUPER ADMIN */}
                            {isSuperAdmin && (
                                <div className="md:col-span-2 bg-purple-50 p-3 rounded-lg border border-purple-100">
                                    <label className="block text-sm font-bold text-purple-900 mb-2 flex items-center">
                                        <Shield size={14} className="mr-1"/> Nível de Acesso (Super Admin)
                                    </label>
                                    <div className="flex gap-6">
                                        <label className="flex items-center cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="role" 
                                                value="FUNCIONARIO"
                                                checked={formData.role === 'FUNCIONARIO'}
                                                onChange={() => setFormData({...formData, role: 'FUNCIONARIO'})}
                                                className="mr-2"
                                            />
                                            <span className="text-sm font-medium text-slate-700">Funcionário</span>
                                        </label>
                                        <label className="flex items-center cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="role" 
                                                value="ADMIN"
                                                checked={formData.role === 'ADMIN'}
                                                onChange={() => setFormData({...formData, role: 'ADMIN'})}
                                                className="mr-2"
                                            />
                                            <span className="text-sm font-bold text-purple-700">Admin da Empresa</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            <div className="md:col-span-2 mt-2">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Funções Operacionais</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div 
                                        className={`p-4 border rounded-lg cursor-pointer transition-colors flex items-center gap-3 ${formData.functions.includes('BALCAO') ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'hover:bg-slate-50'}`}
                                        onClick={() => toggleFunction('BALCAO')}
                                    >
                                        <div className={`p-2 rounded-full border shadow-sm ${formData.functions.includes('BALCAO') ? 'bg-blue-100 text-blue-700' : 'bg-white text-slate-600'}`}>
                                            <Store size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-900">Atendimento (Balcão)</p>
                                            <p className="text-xs text-slate-500">Orçamentos, vendas e atendimento.</p>
                                        </div>
                                        <div className="ml-auto">
                                            {formData.functions.includes('BALCAO') && <div className="w-4 h-4 bg-blue-500 rounded-full"></div>}
                                        </div>
                                    </div>

                                    <div 
                                        className={`p-4 border rounded-lg cursor-pointer transition-colors flex items-center gap-3 ${formData.functions.includes('BANCADA') ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'hover:bg-slate-50'}`}
                                        onClick={() => toggleFunction('BANCADA')}
                                    >
                                        <div className={`p-2 rounded-full border shadow-sm ${formData.functions.includes('BANCADA') ? 'bg-orange-100 text-orange-700' : 'bg-white text-slate-600'}`}>
                                            <Wrench size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-900">Técnico (Bancada)</p>
                                            <p className="text-xs text-slate-500">Execução técnica e diagnósticos.</p>
                                        </div>
                                        <div className="ml-auto">
                                            {formData.functions.includes('BANCADA') && <div className="w-4 h-4 bg-orange-500 rounded-full"></div>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2 flex justify-end gap-2 mt-2 pt-4 border-t border-slate-100">
                                <Button type="button" variant="secondary" onClick={resetForm}>Cancelar</Button>
                                <Button type="submit">{editingUser ? 'Salvar Alterações' : 'Criar Usuário'}</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map(user => (
                    <Card key={user.id} className={`group ${!user.active ? 'opacity-60 grayscale' : ''}`}>
                        <div className="p-5 relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <img src={user.avatar || 'https://i.pravatar.cc/150'} className="w-12 h-12 rounded-full border-2 border-slate-100" />
                                    <div>
                                        <h3 className="font-bold text-slate-800">{user.name}</h3>
                                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                            {user.role === 'ADMIN' ? (
                                                <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold flex items-center">
                                                    <Shield size={10} className="mr-1" /> GESTOR
                                                </span>
                                            ) : (
                                                 <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold flex items-center">
                                                    <Users size={10} className="mr-1" /> COLABORADOR
                                                </span>
                                            )}
                                            {user.functions?.includes('BALCAO') && <span title="Atendimento" className="text-[10px] border border-blue-200 text-blue-600 px-1.5 py-0.5 rounded font-medium">BALCÃO</span>}
                                            {user.functions?.includes('BANCADA') && <span title="Técnico" className="text-[10px] border border-orange-200 text-orange-600 px-1.5 py-0.5 rounded font-medium">BANCADA</span>}
                                        </div>
                                    </div>
                                </div>
                                {/* Action Buttons with Permission Check - Updated Positioning and Visibility */}
                                {canManage(user) && (
                                    <div className="absolute right-4 top-4 hidden group-hover:flex gap-1 bg-white shadow-sm p-1 rounded border border-slate-100">
                                        <button 
                                            onClick={() => startEdit(user)}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                            title="Editar"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => toggleStatus(user.id)}
                                            className={`p-1.5 rounded transition-colors ${user.active ? 'text-slate-400 hover:text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'}`}
                                            title={user.active ? "Bloquear" : "Ativar"}
                                        >
                                            {user.active ? <Lock size={16} /> : <Unlock size={16} />}
                                        </button>
                                        <button 
                                            onClick={() => handleResetPassword(user)}
                                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                                            title="Resetar Senha"
                                        >
                                            <Key size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(user.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                            title="Excluir (Soft Delete)"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center text-sm text-slate-500">
                                    <Mail size={14} className="mr-2" />
                                    {user.email}
                                </div>
                                <div className="flex items-center text-sm text-slate-500">
                                    <div className={`w-2 h-2 rounded-full mr-2 ${user.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    {user.active ? 'Acesso Ativo' : 'Acesso Bloqueado'}
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};