import React, { useState } from 'react';
import { Evidence, User, EvidenceType } from '../types';
import { Lock, Trash2, Maximize2, Hash, Calendar, User as UserIcon, Shield } from 'lucide-react';
import { Button } from './ui/Button';

interface EvidenceTimelineProps {
    evidences: Evidence[];
    currentUser: User;
    onDelete: (id: string) => void;
}

const STAGE_COLORS: Record<EvidenceType, string> = {
    ENTRADA: 'bg-slate-100 text-slate-700 border-slate-200',
    DIAGNOSTICO: 'bg-amber-50 text-amber-700 border-amber-200',
    PROCESSO: 'bg-blue-50 text-blue-700 border-blue-200',
    FINALIZACAO: 'bg-green-50 text-green-700 border-green-200',
    ENTREGA: 'bg-purple-50 text-purple-700 border-purple-200',
    APROVACAO_DOCUMENTAL: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

export const EvidenceTimeline: React.FC<EvidenceTimelineProps> = ({ evidences, currentUser, onDelete }) => {
    const [selectedImage, setSelectedImage] = useState<Evidence | null>(null);

    // Filter out deleted evidences (unless we want a "show deleted" toggle feature in future)
    const activeEvidences = evidences.filter(e => e.active);

    const groupedEvidences = activeEvidences.reduce((groups, evidence) => {
        const group = groups[evidence.type] || [];
        group.push(evidence);
        groups[evidence.type] = group;
        return groups;
    }, {} as Record<EvidenceType, Evidence[]>);

    const stages: EvidenceType[] = ['ENTRADA', 'DIAGNOSTICO', 'PROCESSO', 'FINALIZACAO', 'ENTREGA', 'APROVACAO_DOCUMENTAL'];

    const handleDelete = (id: string) => {
        if (confirm("ATENÇÃO: A exclusão de evidência é registrada em auditoria. Confirmar?")) {
            onDelete(id);
        }
    };

    return (
        <div className="space-y-6">
            {activeEvidences.length === 0 && (
                <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                    <Shield className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>Nenhuma evidência registrada neste processo.</p>
                </div>
            )}

            {stages.map(stage => {
                const items = groupedEvidences[stage];
                if (!items || items.length === 0) return null;

                return (
                    <div key={stage} className="relative">
                        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur py-2 border-b border-slate-100 mb-4 flex items-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STAGE_COLORS[stage]}`}>
                                {stage}
                            </span>
                            <div className="h-px bg-slate-100 flex-1 ml-4"></div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {items.map(evidence => (
                                <div key={evidence.id} className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    {/* Image Thumbnail */}
                                    <div 
                                        className="h-32 bg-slate-100 cursor-pointer relative overflow-hidden"
                                        onClick={() => setSelectedImage(evidence)}
                                    >
                                        <img src={evidence.url} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Evidência" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <Maximize2 className="text-white drop-shadow-lg" size={24} />
                                        </div>
                                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-mono flex items-center">
                                            <Lock size={10} className="mr-1" /> Imutável
                                        </div>
                                    </div>

                                    {/* Metadata */}
                                    <div className="p-3">
                                        <p className="text-sm font-medium text-slate-900 truncate" title={evidence.description}>
                                            {evidence.description}
                                        </p>
                                        
                                        <div className="mt-2 space-y-1">
                                            <div className="flex items-center text-[10px] text-slate-500">
                                                <UserIcon size={10} className="mr-1.5" />
                                                <span className="truncate">{evidence.uploadedByName}</span>
                                            </div>
                                            <div className="flex items-center text-[10px] text-slate-500">
                                                <Calendar size={10} className="mr-1.5" />
                                                <span>{new Date(evidence.timestamp).toLocaleDateString()} {new Date(evidence.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                            </div>
                                            <div className="flex items-center text-[10px] text-slate-400 font-mono bg-slate-50 p-1 rounded" title={evidence.fileHash}>
                                                <Hash size={10} className="mr-1.5 flex-shrink-0" />
                                                <span className="truncate">{evidence.fileHash?.substring(0, 16)}...</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {(currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') && (
                                            <button 
                                                onClick={() => handleDelete(evidence.id)}
                                                className="absolute top-2 right-2 p-1.5 bg-white text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                                                title="Exclusão Lógica"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {/* Modal Viewer */}
            {selectedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setSelectedImage(null)}>
                    <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center text-white mb-2 px-2">
                             <div>
                                <h3 className="font-bold text-lg">{selectedImage.description}</h3>
                                <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
                                    <Shield size={12} /> Hash: {selectedImage.fileHash}
                                </p>
                             </div>
                             <button onClick={() => setSelectedImage(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                 <Lock size={24} className="text-green-400" />
                             </button>
                        </div>
                        <div className="bg-black flex items-center justify-center rounded-lg overflow-hidden border border-slate-700">
                            <img src={selectedImage.url} className="max-w-full max-h-[80vh] object-contain" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};