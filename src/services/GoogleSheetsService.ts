// This file provides helpers for Google Sheets integration
import { 
  GOOGLE_SHEETS_URL, 
  USE_FORM_FALLBACK, 
  MAX_RETRIES, 
  RETRY_DELAY, 
  SHEET_NAMES, 
  DEBUG_MODE, 
  SHEET_COLUMNS,
  GOOGLE_SHEET_VIEW_URL,
  WHATSAPP_FALLBACK_NUMBER
} from "../env";
import { LogService } from "@/services/LogService";

/**
 * Verifica se o webhook está configurado
 */
export const isWebhookConfigured = (): boolean => {
  const clienteConfigured = GOOGLE_SHEETS_URL.CLIENTE && GOOGLE_SHEETS_URL.CLIENTE.includes('script.google.com');
  const leadConfigured = GOOGLE_SHEETS_URL.LEAD && GOOGLE_SHEETS_URL.LEAD.includes('script.google.com');
  
  if (!clienteConfigured || !leadConfigured) {
    LogService.warn("URLs do Google Sheets não estão configuradas nas variáveis de ambiente");
  }
  
  return clienteConfigured && leadConfigured;
};

/**
 * Diagnostica problemas de configuração do Apps Script
 */
export const diagnoseAppsScriptSetup = (): string[] => {
  const issues: string[] = [];
  
  // Verifica URLs vazias
  if (!GOOGLE_SHEETS_URL.CLIENTE || GOOGLE_SHEETS_URL.CLIENTE === "") {
    issues.push("A URL do App Script para Cliente não está configurada.");
  }
  
  if (!GOOGLE_SHEETS_URL.LEAD || GOOGLE_SHEETS_URL.LEAD === "") {
    issues.push("A URL do App Script para Lead não está configurada.");
  }
  
  // Verifica formatação incorreta das URLs
  if (GOOGLE_SHEETS_URL.CLIENTE && !GOOGLE_SHEETS_URL.CLIENTE.endsWith("/exec")) {
    issues.push("A URL do App Script para Cliente deve terminar com '/exec'.");
  }
  
  if (GOOGLE_SHEETS_URL.LEAD && !GOOGLE_SHEETS_URL.LEAD.endsWith("/exec")) {
    issues.push("A URL do App Script para Lead deve terminar com '/exec'.");
  }
  
  // Verifica URLs corretas mas não acessíveis
  if (GOOGLE_SHEETS_URL.CLIENTE && 
      GOOGLE_SHEETS_URL.CLIENTE.includes('script.google.com') && 
      GOOGLE_SHEETS_URL.CLIENTE.endsWith("/exec")) {
    // Correto em formato, mas pode ter problemas de acesso
    LogService.info("URL do Cliente parece corretamente formatada");
  }
  
  if (GOOGLE_SHEETS_URL.LEAD && 
      GOOGLE_SHEETS_URL.LEAD.includes('script.google.com') && 
      GOOGLE_SHEETS_URL.LEAD.endsWith("/exec")) {
    // Correto em formato, mas pode ter problemas de acesso
    LogService.info("URL do Lead parece corretamente formatada");
  }
  
  return issues;
};

/**
 * Testa a conexão com o Google Sheets através de um GET
 */
export const testGoogleSheetConnection = async (type: 'cliente' | 'lead'): Promise<boolean> => {
  const url = type === 'cliente' ? GOOGLE_SHEETS_URL.CLIENTE : GOOGLE_SHEETS_URL.LEAD;
  
  if (!url) {
    LogService.warn(`URL para ${type} não configurada`);
    return false;
  }
  
  try {
    LogService.info(`Testando conexão com ${type}...`);
    
    // Usando o método GET que geralmente tem menos restrições de CORS
    const response = await fetch(url, {
      method: 'GET',
      mode: 'no-cors' // Importante para evitar erros de CORS
    });
    
    // Como estamos usando no-cors, não podemos verificar o status
    // Vamos considerar que a conexão foi bem-sucedida se não ocorreu uma exceção
    LogService.info(`Conexão com ${type} parece estar funcionando`);
    return true;
  } catch (error) {
    LogService.error(`Erro ao testar conexão com ${type}:`, error);
    return false;
  }
};

/**
 * Testa o método POST para o Google Sheets
 */
export const testPostMethod = async (type: 'cliente' | 'lead'): Promise<boolean> => {
  const url = type === 'cliente' ? GOOGLE_SHEETS_URL.CLIENTE : GOOGLE_SHEETS_URL.LEAD;
  
  if (!url) {
    LogService.warn(`URL para ${type} não configurada para teste POST`);
    return false;
  }
  
  try {
    LogService.info(`Testando método POST para ${type}...`);
    
    const testData = {
      formType: type,
      test: true,
      message: "Teste de conexão"
    };
    
    // Primeiro tentamos com fetch normal
    try {
      const fetchResponse = await fetch(url + "?test=true", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          data: JSON.stringify(testData)
        }),
      });
      
      if (fetchResponse.ok) {
        LogService.info(`POST para ${type} funcionou com fetch normal`);
        return true;
      }
    } catch (fetchError) {
      LogService.warn(`Fetch normal falhou, tentando alternativas:`, fetchError);
    }
    
    // Tentativa com no-cors
    await fetch(url + "?test=true", {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        data: JSON.stringify(testData)
      }),
    });
    
    LogService.info(`POST para ${type} com no-cors enviado (não é possível verificar status)`);
    return true;
  } catch (error) {
    LogService.error(`Erro ao testar POST para ${type}:`, error);
    return false;
  }
};

/**
 * Envia dados para o Google Sheets usando múltiplas estratégias
 */
export const submitToGoogleSheets = async (formData: any): Promise<{success: boolean; message: string}> => {
  const type = formData.formType;
  const url = type === 'cliente' ? GOOGLE_SHEETS_URL.CLIENTE : GOOGLE_SHEETS_URL.LEAD;
  
  if (LogService.detectDuplicateSubmission(type, formData)) {
    LogService.warn(`Possível envio duplicado detectado para ${type}`, { nome: formData.nome });
    return { 
      success: true, 
      message: `Dados já enviados recentemente. Verificando planilha...` 
    };
  }
  
  if (!url) {
    return { 
      success: false, 
      message: `URL para ${type} não configurada nas variáveis de ambiente. Configure a variável VITE_GOOGLE_SHEETS_URL_${type.toUpperCase()} no Netlify.` 
    };
  }
  
  LogService.info(`Tentando enviar dados para ${type} através de ${url}`);
  
  // Estratégia 1: Form Fallback com iframe oculto (contorna CORS)
  if (USE_FORM_FALLBACK) {
    try {
      LogService.info(`Usando iframe para enviar dados para ${type}`);
      return await submitViaHiddenIframe(url, formData);
    } catch (iframeError) {
      LogService.error(`Erro ao enviar via iframe:`, iframeError);
      // Continua para a próxima estratégia
    }
  }
  
  // Estratégia 2: Fetch com retry
  try {
    LogService.info(`Tentando enviar via fetch para ${type}`);
    return await submitViaFetch(url, formData);
  } catch (fetchError) {
    LogService.error(`Erro ao enviar via fetch:`, fetchError);
    // Continua para a próxima estratégia
  }

  // Estratégia 3: XMLHttpRequest (algumas vezes funciona quando fetch não funciona)
  try {
    LogService.info(`Tentando enviar via XMLHttpRequest para ${type}`);
    return await submitViaXHR(url, formData);
  } catch (xhrError) {
    LogService.error(`Erro ao enviar via XMLHttpRequest:`, xhrError);
    // Continua para a próxima estratégia
  }
  
  // Se nenhuma estratégia funcionou, sugerimos WhatsApp como alternativa
  return { 
    success: false, 
    message: `Não foi possível enviar dados para a planilha. Você pode usar o botão "Enviar via WhatsApp" como alternativa.` 
  };
};

/**
 * Submit via iframe oculto (contorna CORS)
 * Atualizado para evitar duplicações
 */
const submitViaHiddenIframe = (url: string, formData: any): Promise<{success: boolean; message: string}> => {
  return new Promise((resolve, reject) => {
    try {
      // Remover iframe anterior se existir
      const oldIframe = document.getElementById('sheetSubmitFrame');
      if (oldIframe) {
        oldIframe.remove();
      }
      
      // Criar novo iframe com ID único para evitar cache
      const uniqueId = `sheetSubmitFrame_${Date.now()}`;
      const iframe = document.createElement('iframe');
      iframe.id = uniqueId;
      iframe.name = uniqueId;
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      // Criar formulário com ID único
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = url;
      form.target = uniqueId;
      form.style.display = 'none';
      form.id = `form_${uniqueId}`;
      
      // Adicionar dados ao formulário
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'data';
      input.value = JSON.stringify(formData);
      form.appendChild(input);
      
      // Adicionar parâmetro para evitar cache
      const cacheInput = document.createElement('input');
      cacheInput.type = 'hidden';
      cacheInput.name = 'nocache';
      cacheInput.value = Date.now().toString();
      form.appendChild(cacheInput);
      
      document.body.appendChild(form);
      
      // Flag para controlar se já resolvemos esta promise
      let isResolved = false;
      
      // Monitorar resposta
      iframe.onload = () => {
        try {
          if (isResolved) return;
          
          LogService.info("Iframe carregado, tentando obter resposta");
          setTimeout(() => {
            if (isResolved) return;
            
            isResolved = true;
            resolve({
              success: true,
              message: "Dados enviados para a planilha via iframe"
            });
            
            // Limpeza após um intervalo
            setTimeout(() => {
              if (document.body.contains(form)) form.remove();
              // Deixa o iframe para debug
            }, 5000);
          }, 1000);
        } catch (err) {
          if (isResolved) return;
          
          LogService.warn("Não foi possível acessar o conteúdo do iframe (CORS)", err);
          isResolved = true;
          resolve({
            success: true,
            message: "Dados enviados para a planilha via iframe (não foi possível verificar resposta)"
          });
        }
      };
      
      // Timeout para considerar erro
      setTimeout(() => {
        if (isResolved) return;
        if (document.body.contains(form)) {
          isResolved = true;
          reject(new Error("Timeout ao enviar dados via iframe"));
        }
      }, 10000);
      
      // Submeter formulário
      LogService.info(`Submetendo formulário via iframe (ID: ${uniqueId})`);
      form.submit();
      
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Submit via fetch com retry
 */
const submitViaFetch = async (url: string, formData: any): Promise<{success: boolean; message: string}> => {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      // Adicionar parâmetro para evitar cache
      const urlWithNoCache = `${url}?nocache=${Date.now()}`;
      
      const response = await fetch(urlWithNoCache, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          data: JSON.stringify(formData),
          nocache: Date.now().toString(),
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: data.success, message: data.message || "Dados enviados com sucesso" };
      }
      
      LogService.warn(`Tentativa ${retries + 1} falhou, status: ${response.status}`);
    } catch (error) {
      LogService.warn(`Erro na tentativa ${retries + 1} de fetch:`, error);
    }
    
    retries++;
    if (retries < MAX_RETRIES) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
  
  throw new Error(`Falha após ${MAX_RETRIES} tentativas`);
};

/**
 * Submit via XMLHttpRequest (alternativa ao fetch)
 */
const submitViaXHR = (url: string, formData: any): Promise<{success: boolean; message: string}> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Adicionar parâmetro para evitar cache
    const urlWithNoCache = `${url}?nocache=${Date.now()}`;
    xhr.open('POST', urlWithNoCache, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 400) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({ success: data.success, message: data.message || "Dados enviados com sucesso" });
        } catch (error) {
          resolve({ success: true, message: "Dados enviados, mas a resposta não pôde ser interpretada" });
        }
      } else {
        reject(new Error(`XHR falhou com status ${xhr.status}`));
      }
    };
    
    xhr.onerror = function() {
      reject(new Error('Erro de rede na requisição XHR'));
    };
    
    const body = new URLSearchParams({
      data: JSON.stringify(formData),
      nocache: Date.now().toString()
    }).toString();
    
    xhr.send(body);
  });
};

/**
 * Método de fallback para enviar dados via WhatsApp
 */
export const sendToWhatsAppFallback = (formData: any): void => {
  try {
    const type = formData.formType;
    const phone = WHATSAPP_FALLBACK_NUMBER;
    
    if (!phone) {
      alert("Número de WhatsApp para fallback não configurado");
      return;
    }
    
    // Formatar os dados como texto
    let message = `📋 *DADOS ${type.toUpperCase()}*\n\n`;
    
    // Remover campos não relevantes
    const { formType, datasPagamento, ...relevantData } = formData;
    
    // Adicionar cada campo ao texto
    Object.entries(relevantData).forEach(([key, value]) => {
      if (value && String(value).trim() !== '') {
        // Formatar datas corretamente
        if (value instanceof Date) {
          const formattedDate = new Intl.DateTimeFormat('pt-BR').format(value);
          message += `*${key}:* ${formattedDate}\n`;
        } else {
          message += `*${key}:* ${value}\n`;
        }
      }
    });
    
    // Se tivermos datasPagamento, formatamos separadamente
    if (datasPagamento && datasPagamento.length > 0) {
      message += `\n*Datas de Pagamento:* ${datasPagamento.join(', ')}\n`;
    }
    
    // Adicionar metadados
    message += `\n📅 *Enviado em:* ${new Date().toLocaleString('pt-BR')}\n`;
    message += `📱 *Origem:* Sistema Web DELTA SELLS`;
    
    // Codificar a mensagem para URL
    const encodedMessage = encodeURIComponent(message);
    
    // Criar URL do WhatsApp
    const whatsappURL = `https://wa.me/${phone}?text=${encodedMessage}`;
    
    // Abrir WhatsApp em nova aba
    window.open(whatsappURL, '_blank');
    
  } catch (error) {
    LogService.error("Erro ao enviar para WhatsApp:", error);
    alert("Erro ao preparar mensagem para WhatsApp. Tente copiar os dados manualmente.");
  }
};

/**
 * Obter URL para visualizar a planilha
 */
export const getGoogleSheetViewUrl = (type: 'cliente' | 'lead'): string => {
  const url = type === 'cliente' ? GOOGLE_SHEET_VIEW_URL.CLIENTE : GOOGLE_SHEET_VIEW_URL.LEAD;
  
  if (!url) {
    LogService.warn(`URL de visualização para ${type} não configurada nas variáveis de ambiente`);
    return '#';
  }
  
  return url;
};
