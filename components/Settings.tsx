import React, { useState, useRef } from 'react';
import { DataService } from '../services/dataService';
import { CompanySettings, User, ThemePreference } from '../types';
import { generateApprovalReceipt } from '../services/pdfService';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Save, Building, Shield, User as UserIcon, Lock, Upload, X, Image as ImageIcon, Eye, Wand2, ShieldCheck, Sun, Moon, Monitor, MessageSquare, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const Settings: React.FC = () => {
    const { preference, setPreference } = useTheme();
    const [settings, setSettings] = useState<CompanySettings>(DataService.getSettings());
    const [currentUser, setCurrentUser] = useState<User | null>(DataService.getCurrentUser());
    const [activeTab, setActiveTab] = useState<'company' | 'profile' | 'whatsapp'>('company');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [profileForm, setProfileForm] = useState({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        currentPassword: '',
        newPassword: '',
        themePreference: currentUser?.themePreference || preference
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleSaveSettings = () => {
        setIsSaving(true);
        DataService.saveSettings(settings);
        setTimeout(() => setIsSaving(false), 500);
    };

    // CNPJ Mask
    const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 14) value = value.slice(0, 14);
        value = value.replace(/^(\d{2})(\d)/, '$1.$2');
        value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
        value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
        value = value.replace(/(\d{4})(\d)/, '$1-$2');
        setSettings({ ...settings, cnpj: value });
    };

    // Logo Upload Handler
    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert("A imagem deve ter no máximo 2MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setSettings({ ...settings, logoUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const removeLogo = () => {
        setSettings({ ...settings, logoUrl: undefined });
        if(fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFillDemoData = () => {
        setSettings({
            ...settings,
            cnpj: '12.345.678/0001-90',
            address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
            logoUrl: 'https://cdn-icons-png.flaticon.com/512/2920/2920329.png' 
        });
    };

    const handlePreviewPDF = async () => {
        const mockOrder: any = {
            id: 'PREVIEW-123',
            customerName: 'Cliente Exemplo da Silva',
            customerPhone: '11999999999',
            device: 'iPhone 13 Pro (Teste)',
        };
        const mockApproval: any = {
            token: 'test-token',
            respondedAt: Date.now(),
            description: 'Este é um teste de layout para verificar a posição da logo e do CNPJ no cabeçalho do documento.\n\nO serviço inclui troca de tela e bateria.',
            itemsSnapshot: [
                { name: 'Troca de Tela OLED', price: 1200, approved: true, severity: 'critical' },
                { name: 'Bateria Original', price: 450, approved: true, severity: 'recommended' }
            ],
            totalValue: 1650,
            verificationHash: 'DEMO-HASH-PREVIEW-MODE-ONLY-123456789'
        };
        const mockSignature: any = {
            signedName: 'Cliente Exemplo',
            ipAddress: '127.0.0.1',
            signatureImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' 
        };
        const companyContext: any = { name: settings.name, ...settings };

        const url = await generateApprovalReceipt(mockOrder, mockApproval, mockSignature, companyContext, settings.address);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'teste_layout_comprovante.pdf';
        link.click();
    };

    const handleTestVerification = () => {
        const hash = DataService.createTestVerificationRecord();
        const event = new CustomEvent('providencia:navigate', { 
            detail: { type: 'VERIFY', hash } 
        });
        window.dispatchEvent(event);
    };

    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        if (currentUser) {
            const updatedUser: User = { 
                ...currentUser, 
                name: profileForm.name, 
                email: profileForm.email,
                themePreference: profileForm.themePreference
            };
            DataService.saveUser(updatedUser);
            setPreference(profileForm.themePreference);
            if(profileForm.newPassword) alert("Senha atualizada com sucesso (Simulação)");
            alert("Perfil atualizado!");
        }
        setIsSaving(false);
    };

    const handleThemeSelect = (theme: ThemePreference) => {
        setProfileForm({ ...profileForm, themePreference: theme });
    };

    // Helper to safely update template
    const updateTemplate = (key: 'approvalRequest' | 'readyForPickup', val: string) => {
        setSettings({
            ...settings,
            whatsappTemplates: {
                approvalRequest: settings.whatsappTemplates?.approvalRequest || '',
                readyForPickup: settings.whatsappTemplates?.readyForPickup || '',
                [key]: val
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-10">
            <div className="flex space-x-4 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('company')}
                    className={`pb-2 px-4 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'company' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    Dados da Empresa
                </button>
                <button 
                    onClick={() => setActiveTab('whatsapp')}
                    className={`pb-2 px-4 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'whatsapp' ? 'border-b-2 border-green-600 text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400 hover:text-green-700 dark:hover:text-green-200'}`}
                >
                    Mensagens WhatsApp
                </button>
                <button 
                    onClick={() => setActiveTab('profile')}
                    className={`pb-2 px-4 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'profile' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    Meu Perfil
                </button>
            </div>

            {activeTab === 'company' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Configurações da Empresa</h2>
                            <p className="text-slate-500 dark:text-slate-400">Personalize a identidade visual e dados fiscais.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={handleFillDemoData}>
                                <Wand2 className="w-4 h-4 mr-2 text-purple-600" /> Demo
                            </Button>
                            <Button variant="secondary" size="sm" onClick={handlePreviewPDF}>
                                <Eye className="w-4 h-4 mr-2" /> PDF
                            </Button>
                        </div>
                    </div>

                    <Card>
                        <CardHeader title="Identidade Visual & Dados" action={<Building className="text-slate-400" />} />
                        <CardContent className="space-y-6">
                            <div className="flex items-start gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                                <div className="w-32 h-32 flex-shrink-0 bg-slate-100 dark:bg-slate-800 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center relative overflow-hidden group">
                                    {settings.logoUrl ? (
                                        <>
                                            <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={removeLogo} className="text-white bg-red-500 p-1 rounded-full"><X size={16} /></button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center p-2">
                                            <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-1" />
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500">Sem Logo</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Logo da Empresa</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                                        Exibida no topo dos comprovantes. Formatos: PNG ou JPG (Max 2MB).
                                    </p>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center"
                                        >
                                            <Upload className="w-4 h-4 mr-2" /> Carregar Imagem
                                        </button>
                                        <input ref={fileInputRef} type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleLogoUpload} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Fantasia <span className="text-red-500">*</span></label>
                                    <input 
                                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                                        value={settings.name}
                                        onChange={e => setSettings({...settings, name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CNPJ</label>
                                    <input 
                                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono"
                                        value={settings.cnpj || ''}
                                        onChange={handleCnpjChange}
                                        placeholder="00.000.000/0000-00"
                                        maxLength={18}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Endereço</label>
                                    <input 
                                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                                        value={settings.address || ''}
                                        onChange={e => setSettings({...settings, address: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">WhatsApp Contato</label>
                                    <input 
                                        className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                                        value={settings.whatsapp}
                                        onChange={e => setSettings({...settings, whatsapp: e.target.value})}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader title="Termos de Garantia" action={<Shield className="text-slate-400" />} />
                        <CardContent>
                            <textarea 
                                className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg h-32 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                                value={settings.warrantyTerms}
                                onChange={e => setSettings({...settings, warrantyTerms: e.target.value})}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={handleSaveSettings} size="lg" isLoading={isSaving}>
                            <Save className="w-5 h-5 mr-2" /> Salvar Configurações
                        </Button>
                    </div>
                </div>
            )}

            {activeTab === 'whatsapp' && (
                <div className="space-y-6 animate-fade-in">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Modelos de Mensagem</h2>
                        <p className="text-slate-500 dark:text-slate-400">Configure os textos padrão enviados para o cliente.</p>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div className="text-sm text-blue-800 dark:text-blue-300">
                            <strong>Variáveis Disponíveis:</strong>
                            <ul className="mt-1 list-disc list-inside space-y-1">
                                <li><code>{`{nome_cliente}`}</code> - Primeiro nome do cliente</li>
                                <li><code>{`{id_os}`}</code> - Número do protocolo (últimos 6 dígitos)</li>
                                <li><code>{`{valor}`}</code> - Valor total formatado (R$)</li>
                                <li><code>{`{link}`}</code> - Link seguro de aprovação (Apenas Orçamento)</li>
                                <li><code>{`{nome_empresa}`}</code> - Nome configurado na empresa</li>
                            </ul>
                        </div>
                    </div>

                    <Card>
                        <CardHeader title="Solicitação de Orçamento" action={<MessageSquare className="text-slate-400" />} />
                        <CardContent>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Texto da Mensagem</label>
                            <textarea 
                                className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg h-40 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-sm"
                                value={settings.whatsappTemplates?.approvalRequest || ''}
                                onChange={e => updateTemplate('approvalRequest', e.target.value)}
                                placeholder="Digite o modelo..."
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader title="Aviso de Retirada (Pronto)" action={<ShieldCheck className="text-slate-400" />} />
                        <CardContent>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Texto da Mensagem</label>
                            <textarea 
                                className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg h-40 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono text-sm"
                                value={settings.whatsappTemplates?.readyForPickup || ''}
                                onChange={e => updateTemplate('readyForPickup', e.target.value)}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={handleSaveSettings} size="lg" isLoading={isSaving}>
                            <Save className="w-5 h-5 mr-2" /> Salvar Modelos
                        </Button>
                    </div>
                </div>
            )}

            {activeTab === 'profile' && (
                <div className="space-y-6 animate-fade-in">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Meu Perfil</h2>
                        <p className="text-slate-500 dark:text-slate-400">Preferências e segurança.</p>
                    </div>

                    <Card>
                        <CardHeader title="Tema" action={<Monitor className="text-slate-400" />} />
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                                {['light', 'dark', 'system'].map((theme) => (
                                    <div 
                                        key={theme}
                                        onClick={() => handleThemeSelect(theme as ThemePreference)}
                                        className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-2 transition-all ${
                                            profileForm.themePreference === theme 
                                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                                            : 'border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        {theme === 'light' ? <Sun size={24} /> : theme === 'dark' ? <Moon size={24} /> : <Monitor size={24} />}
                                        <span className="text-xs font-bold uppercase">{theme}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader title="Dados de Acesso" action={<UserIcon className="text-slate-400" />} />
                        <CardContent>
                             <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <input className="p-2 border rounded" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} placeholder="Nome" />
                                    <input className="p-2 border rounded bg-slate-100" value={profileForm.email} disabled />
                                </div>
                                <div className="pt-4 border-t">
                                    <input className="w-full p-2 border rounded mb-2" type="password" placeholder="Nova Senha" value={profileForm.newPassword} onChange={e => setProfileForm({...profileForm, newPassword: e.target.value})} />
                                    <Button type="submit" isLoading={isSaving} className="w-full">Atualizar Perfil</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};