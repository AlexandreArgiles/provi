import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { ServiceOrder, ServiceApproval, Company, DigitalSignature, ServiceItem, CompanySettings } from "../types";

export const generateApprovalReceipt = async (
    order: ServiceOrder,
    approval: ServiceApproval,
    signature: DigitalSignature,
    company: Company | CompanySettings, // Support both for flexibility
    address?: string
): Promise<string> => {
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // --- HELPER FUNCTIONS ---
    const centerText = (text: string, y: number, fontSize: number = 10, fontStyle: string = 'normal') => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', fontStyle);
        const textWidth = doc.getStringUnitWidth(text) * fontSize / doc.internal.scaleFactor;
        const x = (pageWidth - textWidth) / 2;
        doc.text(text, x, y);
    };

    const addLine = (y: number) => {
        doc.setLineWidth(0.2);
        doc.setDrawColor(200, 200, 200);
        doc.line(10, y, pageWidth - 10, y);
    };

    // HEADER SECTION
    const headerHeight = 45;
    doc.setFillColor(30, 41, 59); // Slate 800
    doc.rect(0, 0, pageWidth, headerHeight, 'F');
    doc.setTextColor(255, 255, 255);

    // Cast to settings to check for logo/cnpj safely
    const compSettings = company as CompanySettings;
    const logoUrl = compSettings.logoUrl;
    const cnpj = compSettings.cnpj;
    const compName = company.name.toUpperCase();
    const compAddress = address || 'Endereço não cadastrado';
    const warrantyTerms = compSettings.warrantyTerms || "Garantia legal de 90 dias sobre os serviços prestados.";

    if (logoUrl) {
        // --- LAYOUT WITH LOGO ---
        try {
            // Add Logo (Left aligned)
            doc.addImage(logoUrl, 'PNG', 10, 5, 35, 35); // x, y, w, h
            
            // Text to the right of logo
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(compName, 55, 18);
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            
            let metaY = 26;
            if (cnpj) {
                doc.text(`CNPJ: ${cnpj}`, 55, metaY);
                metaY += 6;
            }
            doc.text(compAddress, 55, metaY);

        } catch (e) {
            console.error("Error adding logo to PDF", e);
            // Fallback to text-only if logo fails
            centerText(compName, 18, 16, 'bold');
            centerText(compAddress, 26, 9);
        }
    } else {
        // --- LAYOUT WITHOUT LOGO (CENTERED) ---
        centerText(compName, 15, 18, 'bold');
        
        let metaY = 24;
        if (cnpj) {
            centerText(`CNPJ: ${cnpj}`, metaY, 10);
            metaY += 6;
        }
        centerText(compAddress, metaY, 9);
    }
    
    let currentY = headerHeight + 15;

    // 2. TITLE & META
    doc.setTextColor(0, 0, 0);
    centerText('COMPROVANTE DE AUTORIZAÇÃO DE SERVIÇO', currentY, 14, 'bold');
    currentY += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Protocolo OS: #${order.id}`, 15, currentY);
    doc.text(`Data: ${new Date(approval.respondedAt || Date.now()).toLocaleDateString()}`, pageWidth - 50, currentY);
    currentY += 8;
    doc.text(`Cliente: ${order.customerName}`, 15, currentY);
    doc.text(`Hora: ${new Date(approval.respondedAt || Date.now()).toLocaleTimeString()}`, pageWidth - 50, currentY);
    
    currentY += 10;
    addLine(currentY);
    currentY += 10;

    // 3. SERVICE DESCRIPTION
    doc.setFont('helvetica', 'bold');
    doc.text("Descrição do Problema / Diagnóstico:", 15, currentY);
    currentY += 7;
    doc.setFont('helvetica', 'normal');
    
    const splitDescription = doc.splitTextToSize(approval.description, pageWidth - 30);
    doc.text(splitDescription, 15, currentY);
    currentY += (splitDescription.length * 5) + 10;

    // 4. ITEMS TABLE
    doc.setFont('helvetica', 'bold');
    doc.text("Serviços e Peças Aprovados:", 15, currentY);
    currentY += 8;

    // Table Header
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.rect(15, currentY - 5, pageWidth - 30, 8, 'F');
    doc.setFontSize(9);
    doc.text("Item", 20, currentY);
    doc.text("Tipo", pageWidth - 70, currentY);
    doc.text("Valor", pageWidth - 30, currentY);
    currentY += 8;

    // Items
    approval.itemsSnapshot.forEach((item: ServiceItem) => {
        // If Approved only (though snapshot implies approval scope usually, check flag)
        if(item.approved) {
            doc.text(item.name, 20, currentY);
            doc.text(item.severity === 'critical' ? 'Crítico' : 'Sugerido', pageWidth - 70, currentY);
            doc.text(`R$ ${item.price.toFixed(2)}`, pageWidth - 30, currentY);
            currentY += 6;
        }
    });

    currentY += 5;
    addLine(currentY);
    currentY += 10;

    // 5. TOTAL
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Autorizado: R$ ${approval.totalValue.toFixed(2)}`, pageWidth - 80, currentY);
    currentY += 15;

    // 6. WARRANTY TERMS (Explicit)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("Termos de Garantia:", 15, currentY);
    currentY += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    
    const splitWarranty = doc.splitTextToSize(warrantyTerms, pageWidth - 30);
    doc.text(splitWarranty, 15, currentY);
    currentY += (splitWarranty.length * 4) + 10;

    // 7. LEGAL TEXT
    doc.setTextColor(100, 100, 100);
    const legalText = "Declaro que li e concordo com os termos de garantia acima. Autorizo a execução dos serviços descritos. Compreendo que serviços adicionais não listados aqui deverão ser objeto de nova aprovação.";
    const splitLegal = doc.splitTextToSize(legalText, pageWidth - 30);
    doc.text(splitLegal, 15, currentY);
    currentY += (splitLegal.length * 4) + 10;

    // 8. SIGNATURE
    if (signature && signature.signatureImage) {
        // Ensure enough space for signature
        if (currentY + 40 > pageHeight - 40) {
            doc.addPage();
            currentY = 40;
        }

        doc.setTextColor(0, 0, 0);
        doc.addImage(signature.signatureImage, 'PNG', (pageWidth - 60) / 2, currentY, 60, 30);
        currentY += 32;
        centerText('____________________________________', currentY);
        currentY += 5;
        centerText(signature.signedName, currentY, 10, 'bold');
        currentY += 5;
        centerText(`IP: ${signature.ipAddress || 'Não registrado'}`, currentY, 8);
    }

    // 9. SECURITY FOOTER (QR CODE & HASH)
    if (approval.verificationHash) {
        const qrSize = 25;
        const footerY = pageHeight - 35;
        
        // Generate QR
        try {
    // Usa a origem atual (ex: http://localhost:5173) e o formato de query param que o App.tsx espera
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
            const verificationUrl = `${baseUrl}/?verify=${approval.verificationHash}`;
            const qrDataUrl = await QRCode.toDataURL(verificationUrl, { width: 100, margin: 1 });
            
            doc.addImage(qrDataUrl, 'PNG', pageWidth - 35, footerY, qrSize, qrSize);
            
            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            
            // Left Side Text
            doc.text("VERIFICAÇÃO DE AUTENTICIDADE", 15, footerY + 5);
            doc.text("Este documento foi assinado digitalmente e sua integridade pode", 15, footerY + 9);
            doc.text("ser verificada acessando o link via QR Code.", 15, footerY + 13);
            
            doc.setFont('courier', 'normal');
            doc.text(`HASH: ${approval.verificationHash}`, 15, footerY + 18);
            
        } catch (e) {
            console.error("QR Generation failed", e);
        }
    }

    // 10. FOOTER
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text("Documento gerado digitalmente pela plataforma Providencia.", 10, pageHeight - 5);

    // Return Data URI
    return doc.output('datauristring');
};

export const generatePrintableTerm = async (
    order: ServiceOrder,
    company: Company | CompanySettings,
    items: ServiceItem[],
    totalValue: number,
    address?: string
): Promise<string> => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // --- HELPER FUNCTIONS ---
    const centerText = (text: string, y: number, fontSize: number = 10, fontStyle: string = 'normal') => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', fontStyle);
        const textWidth = doc.getStringUnitWidth(text) * fontSize / doc.internal.scaleFactor;
        const x = (pageWidth - textWidth) / 2;
        doc.text(text, x, y);
    };

    const addLine = (y: number) => {
        doc.setLineWidth(0.2);
        doc.setDrawColor(200, 200, 200);
        doc.line(10, y, pageWidth - 10, y);
    };

    // HEADER
    const headerHeight = 40;
    doc.setFillColor(240, 240, 240);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');
    doc.setTextColor(0, 0, 0);

    const compSettings = company as CompanySettings;
    const logoUrl = compSettings.logoUrl;
    const cnpj = compSettings.cnpj || 'CNPJ não informado';
    const compName = company.name.toUpperCase();
    const compAddress = address || 'Endereço não cadastrado';
    const warrantyTerms = compSettings.warrantyTerms || "Garantia legal de 90 dias sobre os serviços prestados.";

    if (logoUrl) {
        try {
            doc.addImage(logoUrl, 'PNG', 10, 5, 30, 30);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(compName, 45, 15);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`CNPJ: ${cnpj}`, 45, 22);
            doc.text(compAddress, 45, 27);
        } catch (e) {
            centerText(compName, 15, 16, 'bold');
            centerText(`CNPJ: ${cnpj}`, 22, 10);
        }
    } else {
        centerText(compName, 15, 16, 'bold');
        centerText(`CNPJ: ${cnpj}`, 22, 10);
        centerText(compAddress, 28, 9);
    }

    let currentY = headerHeight + 15;

    // TITLE
    centerText('TERMO DE APROVAÇÃO DE ORÇAMENTO', currentY, 14, 'bold');
    currentY += 10;

    // ORDER INFO
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ordem de Serviço: #${order.id}`, 15, currentY);
    doc.text(`Data de Emissão: ${new Date().toLocaleDateString()}`, pageWidth - 60, currentY);
    currentY += 7;
    doc.text(`Cliente: ${order.customerName}`, 15, currentY);
    doc.text(`Equipamento: ${order.device}`, pageWidth - 60, currentY);
    
    currentY += 10;
    addLine(currentY);
    currentY += 10;

    // DIAGNOSTIC / TECHNICAL NOTES
    doc.setFont('helvetica', 'bold');
    doc.text("Diagnóstico / Parecer Técnico:", 15, currentY);
    currentY += 7;
    
    doc.setFont('helvetica', 'normal');
    const technicalReport = order.technicalNotes || "Não informado.";
    const splitReport = doc.splitTextToSize(technicalReport, pageWidth - 30);
    doc.text(splitReport, 15, currentY);
    currentY += (splitReport.length * 5) + 10;

    addLine(currentY);
    currentY += 10;

    // ITEMS TABLE
    doc.setFont('helvetica', 'bold');
    doc.text("Itens do Orçamento:", 15, currentY);
    currentY += 8;

    doc.setFillColor(245, 245, 245);
    doc.rect(15, currentY - 5, pageWidth - 30, 8, 'F');
    doc.setFontSize(9);
    doc.text("Descrição", 20, currentY);
    doc.text("Valor", pageWidth - 30, currentY);
    currentY += 8;

    items.forEach(item => {
        doc.setFont('helvetica', 'normal');
        doc.text(item.name, 20, currentY);
        doc.text(`R$ ${item.price.toFixed(2)}`, pageWidth - 30, currentY);
        currentY += 6;
    });

    currentY += 5;
    addLine(currentY);
    currentY += 10;

    // TOTAL
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`VALOR TOTAL: R$ ${totalValue.toFixed(2)}`, pageWidth - 80, currentY);
    currentY += 20;

    // WARRANTY TERMS (Explicit in Printable)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("Termos de Garantia:", 15, currentY);
    currentY += 5;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const splitWarranty = doc.splitTextToSize(warrantyTerms, pageWidth - 30);
    doc.text(splitWarranty, 15, currentY);
    currentY += (splitWarranty.length * 5) + 15;

    // Check if we need new page for signature
    if (currentY + 50 > pageHeight) {
        doc.addPage();
        currentY = 40;
    }

    // AUTHORIZATION TEXT
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const authText = `Eu, ${order.customerName}, autorizo a execução dos serviços acima listados no equipamento identificado. Declaro que li e estou de acordo com os termos de garantia descritos neste documento.`;
    const splitAuth = doc.splitTextToSize(authText, pageWidth - 30);
    doc.text(splitAuth, 15, currentY);
    currentY += (splitAuth.length * 6) + 30; // More space for signature

    // SIGNATURE AREA
    addLine(currentY);
    currentY += 5;
    centerText("Assinatura do Cliente", currentY, 10, 'bold');
    
    // Add date/place line
    currentY += 15;
    doc.text(`Local e Data: ${address ? address.split('-')[1]?.trim() || '__________________' : '__________________'}, _____ de _____________ de ______`, 15, currentY);

    // FOOTER
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Documento para uso interno e aprovação presencial.", 10, pageHeight - 5);

    return doc.output('datauristring');
};