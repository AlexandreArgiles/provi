import React, { useState, useEffect } from 'react';
import { DataService } from '../services/dataService';
import { AppNotification } from '../types';
import { Bell, Check, X, Info, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

interface NotificationCenterProps {
    companyId: string;
    onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ companyId, onClose }) => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    useEffect(() => {
        setNotifications(DataService.getNotifications(companyId));
    }, [companyId]);

    const handleMarkAsRead = (id: string) => {
        DataService.markNotificationRead(id);
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const handleMarkAllRead = () => {
        notifications.forEach(n => {
            if (!n.read) DataService.markNotificationRead(n.id);
        });
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const getIcon = (type: string) => {
        switch(type) {
            case 'WARNING': return <AlertTriangle className="text-amber-500 w-5 h-5" />;
            case 'ERROR': return <XCircle className="text-red-500 w-5 h-5" />;
            case 'SUCCESS': return <CheckCircle className="text-green-500 w-5 h-5" />;
            case 'INFO': default: return <Info className="text-blue-500 w-5 h-5" />;
        }
    };

    return (
        <div className="absolute right-0 top-16 w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in mr-4">
            <div className="bg-slate-50 dark:bg-slate-950 p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center">
                    <Bell className="w-4 h-4 mr-2" /> Notificações
                </h3>
                <div className="flex gap-2">
                    <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline">Marcar todas</button>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                </div>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto p-2">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        <p className="text-sm">Nenhuma notificação.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {notifications.map(note => (
                            <div 
                                key={note.id} 
                                className={`p-3 rounded-lg flex gap-3 transition-colors relative group
                                    ${note.read ? 'bg-white dark:bg-slate-900 opacity-70' : 'bg-blue-50 dark:bg-slate-800/50 border border-blue-100 dark:border-slate-700'}
                                `}
                            >
                                <div className="mt-1 flex-shrink-0">
                                    {getIcon(note.type)}
                                </div>
                                <div className="flex-1">
                                    <p className={`text-sm font-semibold ${note.read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-slate-200'}`}>
                                        {note.title}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        {note.message}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-2">
                                        {new Date(note.createdAt).toLocaleDateString()} às {new Date(note.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                                {!note.read && (
                                    <button 
                                        onClick={() => handleMarkAsRead(note.id)}
                                        className="absolute top-2 right-2 p-1 text-blue-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Marcar como lida"
                                    >
                                        <Check size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};