import React, { useState, useRef } from 'react';
import { EvidenceType, Evidence, User } from '../types';
import { Button } from './ui/Button';
import { Camera, Upload, X, FileText, ShieldCheck, Loader2 } from 'lucide-react';

interface EvidenceUploadProps {
  orderId: string;
  currentUser: User;
  onUpload: (evidence: Evidence) => void;
}

export const EvidenceUpload: React.FC<EvidenceUploadProps> = ({ orderId, currentUser, onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [type, setType] = useState<EvidenceType>('ENTRADA');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const calculateHash = async (file: File): Promise<string> => {
    // Simulating a client-side SHA-256 hash generation for the file content
    // In a real app, use crypto.subtle.digest with arrayBuffer
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleUpload = async () => {
    if (!file || !description) return;

    setIsUploading(true);
    
    try {
        // 1. Calculate Hash (Immutability Proof)
        const hash = await calculateHash(file);

        // 2. Simulate Upload (In real app, upload to S3/Storage here)
        // We use the object URL for the mock, but in prod this would be the S3 URL
        const secureUrl = preview!; 

        const newEvidence: Evidence = {
            id: Date.now().toString(),
            orderId,
            type,
            url: secureUrl,
            description,
            fileHash: hash,
            uploadedBy: currentUser.id,
            uploadedByName: currentUser.name,
            timestamp: Date.now(),
            active: true
        };

        // Simulate network delay
        setTimeout(() => {
            onUpload(newEvidence);
            resetForm();
            setIsUploading(false);
        }, 1000);

    } catch (error) {
        console.error("Upload failed", error);
        alert("Erro ao processar evidência.");
        setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setDescription('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
      <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
        <Camera className="w-4 h-4 mr-2 text-blue-600" />
        Nova Evidência Digital
      </h3>

      {!preview ? (
        <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-blue-400 transition-colors"
        >
            <Upload className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-sm text-slate-500 font-medium">Clique ou arraste foto aqui</span>
            <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
            />
        </div>
      ) : (
        <div className="space-y-4">
            <div className="relative h-48 w-full bg-black rounded-lg overflow-hidden group">
                <img src={preview} className="w-full h-full object-contain" alt="Preview" />
                <button 
                    onClick={resetForm}
                    className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Etapa do Processo</label>
                    <select 
                        className="w-full p-2 text-sm border rounded-lg bg-white"
                        value={type}
                        onChange={(e) => setType(e.target.value as EvidenceType)}
                    >
                        <option value="ENTRADA">1. Entrada / Vistoria</option>
                        <option value="DIAGNOSTICO">2. Diagnóstico</option>
                        <option value="PROCESSO">3. Em Processo</option>
                        <option value="FINALIZACAO">4. Finalização</option>
                        <option value="ENTREGA">5. Entrega</option>
                    </select>
                </div>
                <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição</label>
                     <input 
                        className="w-full p-2 text-sm border rounded-lg"
                        placeholder="O que esta foto prova?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                     />
                </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start">
                <ShieldCheck className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-800">
                    <strong>Atenção:</strong> Ao enviar, um <em>Hash SHA-256</em> será gerado. Esta imagem se tornará uma prova digital imutável e não poderá ser editada.
                </p>
            </div>

            <Button onClick={handleUpload} disabled={!description || isUploading} className="w-full">
                {isUploading ? <><Loader2 className="animate-spin w-4 h-4 mr-2"/> Processando Hash...</> : 'Registrar Evidência'}
            </Button>
        </div>
      )}
    </div>
  );
};
