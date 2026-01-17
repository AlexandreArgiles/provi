import React, { useState } from 'react';
import { DataService } from '../services/dataService';
import { User } from '../types';
import { Lock, ShieldAlert, ArrowRight } from 'lucide-react';

interface ForcePasswordChangeProps {
  user: User;
  onSuccess: (updatedUser: User) => void;
}

export const ForcePasswordChange: React.FC<ForcePasswordChangeProps> = ({ user, onSuccess }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    // In a real app, call API POST /auth/change-password
    const updatedUser: User = { ...user, mustChangePassword: false };
    DataService.saveUser(updatedUser);
    DataService.updateCurrentUserSession(updatedUser);
    
    onSuccess(updatedUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-amber-500 p-6 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <ShieldAlert className="text-white w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Troca de Senha Obrigatória</h1>
            <p className="text-amber-50 text-sm mt-2">Por segurança, você deve definir uma nova senha antes de continuar.</p>
        </div>

        <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                            type="password" 
                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Senha</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                            type="password" 
                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Repita a nova senha"
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                        {error}
                    </div>
                )}

                <button 
                    type="submit"
                    className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-all flex items-center justify-center"
                >
                    Atualizar e Acessar <ArrowRight className="ml-2 w-4 h-4" />
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};