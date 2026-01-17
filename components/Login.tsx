import React, { useState } from 'react';
import { DataService } from '../services/dataService';
import { User } from '../types';
import { Lock, Mail, ArrowRight, ShieldCheck, Database, LayoutDashboard } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@providencia.app');
  const [password, setPassword] = useState('123456'); // Fake password for demo
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API delay
    setTimeout(() => {
      const user = DataService.login(email);
      if (user) {
        onLogin(user);
      } else {
        setError('E-mail ou senha inválidos, ou acesso bloqueado.');
        setIsLoading(false);
      }
    }, 800);
  };

  const setDemoCreds = (type: 'super' | 'admin' | 'tech') => {
      if (type === 'super') setEmail('super@providencia.app');
      if (type === 'admin') setEmail('admin@providencia.app');
      if (type === 'tech') setEmail('tec@providencia.app');
      setPassword('123456');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 dark:bg-slate-950 p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col border dark:border-slate-800">
        
        <div className="bg-blue-600 p-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <ShieldCheck className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Providencia B2B</h1>
            <p className="text-blue-100 text-sm mt-2">Sistema de Gestão de Evidências</p>
        </div>

        <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail Corporativo</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                            type="email" 
                            className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                            type="password" 
                            className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm rounded-lg flex items-center">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                        {error}
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-slate-900 dark:bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Autenticando...' : (
                        <>Entrar no Sistema <ArrowRight className="ml-2 w-4 h-4" /></>
                    )}
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-center text-slate-400 mb-3">Teste rápido de perfis:</p>
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => setDemoCreds('super')} className="p-2 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-400 rounded text-xs font-medium flex flex-col items-center gap-1 transition-colors">
                        <Database size={14} />
                        SaaS Admin
                    </button>
                    <button onClick={() => setDemoCreds('admin')} className="p-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 rounded text-xs font-medium flex flex-col items-center gap-1 transition-colors">
                        <LayoutDashboard size={14} />
                        Empresa
                    </button>
                     <button onClick={() => setDemoCreds('tech')} className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-medium flex flex-col items-center gap-1 transition-colors">
                        <ShieldCheck size={14} />
                        Técnico
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};