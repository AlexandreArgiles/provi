import { GoogleGenAI } from "@google/genai";
import { ServiceOrder, ServiceItem } from "../types";

// NOTE: In a production React App (Vite/CRA), env vars should be accessed via import.meta.env or process.env.REACT_APP_
// For this MVP demo environment, we use process.env directly, but we add a fallback check.
const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateCustomerMessage = async (order: ServiceOrder): Promise<string> => {
  if (!API_KEY) {
    console.warn("Gemini API Key is missing. Check your .env file or environment configuration.");
    return "⚠️ Erro: Chave de API não configurada. O sistema não pode gerar a mensagem.";
  }

  try {
    const prompt = `
      Você é o assistente virtual da "Providencia Tech" (Especialista em Celulares). 
      Escreva uma mensagem curta e objetiva de WhatsApp para o cliente.
      
      Objetivo: Enviar o ORÇAMENTO DIGITAL para aprovação.
      
      Dados:
      Cliente: ${order.customerName}
      Aparelho: ${order.device}
      Total do Orçamento: R$ ${order.items.reduce((acc, item) => item.approved ? acc + item.price : acc, 0).toFixed(2)}
      
      Instruções:
      1. Cumprimente pelo nome.
      2. Informe que a análise do ${order.device} foi concluída.
      3. Mencione que anexamos fotos dos problemas encontrados (ex: oxidação, tela, etc).
      4. Informe o valor total.
      5. ESSENCIAL: Peça para clicar no link seguro abaixo para Ver as Fotos e APROVAR o serviço.
      6. Use esta URL simulada no final: https://providencia.app/v/${order.id}
      
      Tom de voz: Técnico, mas acessível e confiável.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar a mensagem. A IA retornou vazio.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Erro de conexão com a IA. Por favor, tente novamente em instantes.";
  }
};

export const analyzeTechnicalNotes = async (notes: string): Promise<string> => {
   if (!API_KEY) return notes;
   
   try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Melhore este diagnóstico técnico de celular para ser enviado ao cliente. 
      Torne a linguagem profissional, clara e explicativa, sem perder a precisão técnica.
      Texto original: "${notes}"`,
    });
    return response.text || notes;
   } catch (error) {
     console.error("Gemini API Error (Notes):", error);
     return notes; // Fallback to original notes on error
   }
};

// NEW: Generates the friendly "Why" for the approval page
export const generateApprovalSummary = async (items: ServiceItem[], deviceName: string): Promise<string> => {
    if (!API_KEY) {
        return "Resumo do serviço: " + items.map(i => i.name).join(', ');
    }

    try {
        const prompt = `
            Você é um consultor técnico explicando um orçamento para um cliente leigo.
            
            Aparelho: ${deviceName}
            Serviços propostos:
            ${items.map(i => `- ${i.name} (R$ ${i.price})`).join('\n')}
            
            TAREFA: Escreva um parágrafo curto (máx 3 frases) explicando POR QUE esses serviços são necessários e o benefício de fazê-los.
            Use linguagem simples, empática e transparente. Evite "tecniquês" pesado. Foque na solução do problema.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });

        return response.text || "Não foi possível gerar a explicação.";
    } catch (error) {
        return "Realização dos serviços técnicos listados abaixo para restabelecimento das funções do aparelho.";
    }
};