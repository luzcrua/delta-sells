
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

// INSTRUÇÕES PARA CONFIGURAR O GOOGLE SHEETS:
// 1. Abra sua planilha do Google: https://docs.google.com/spreadsheets/d/13DHwYtX13t6CJ3Fg5mMmPpNHT8rZt7Cio3JwB04ipHY/edit?gid=0#gid=0
// 2. Vá para Extensões > Apps Script
// 3. Substitua o código pelo script fornecido pelo usuário
// 4. Salve o script e implemente-o como um aplicativo da Web:
//    a. Clique em "Implantar" > "Nova implantação"
//    b. Selecione o tipo: "Aplicativo da Web"
//    c. Configure para: "Execute como: Usuário que acessa o aplicativo da Web" (IMPORTANTE!)
//    d. Configure "Quem tem acesso:" para "Qualquer pessoa, mesmo anônimos"
//    e. Clique em "Implantar" e autorize o aplicativo
//    f. Copie a URL do aplicativo da Web e configure no arquivo env.ts

/**
 * Formata os dados para envio via WhatsApp
 */
function formatDataForWhatsApp(data: any): string {
  let message = "📋 *DADOS DO ";
  
  if (data.formType === 'lead') {
    message += "LEAD*\n\n";
    message += `👤 *Nome:* ${data.nome}\n`;
    message += `📱 *Telefone:* ${data.telefone}\n`;
    
    if (data.instagram) {
      message += `📸 *Instagram:* ${data.instagram}\n`;
    }
    
    message += `🎯 *Interesse:* ${data.interesse}\n`;
    message += `🚩 *Status:* ${data.statusLead}\n`;
    message += `📅 *Data Lembrete:* ${data.dataLembrete}\n`;
    message += `🔔 *Motivo Lembrete:* ${data.motivoLembrete}\n`;
    
    if (data.observacoes) {
      message += `📝 *Observações:* ${data.observacoes}\n`;
    }
  } else {
    message += "CLIENTE*\n\n";
    message += `👤 *Nome:* ${data.nome}\n`;
    
    if (data.cpf) {
      message += `🆔 *CPF:* ${data.cpf}\n`;
    }
    
    message += `📱 *Telefone:* ${data.telefone}\n`;
    message += `⚧ *Gênero:* ${data.genero}\n`;
    message += `📦 *Produto:* ${data.linha} ${data.tipo}\n`;
    message += `🎨 *Cor:* ${data.cor}\n`;
    message += `📏 *Tamanho:* ${data.tamanho}\n`;
    message += `💰 *Valor:* ${data.valor}\n`;
    message += `💳 *Forma Pagamento:* ${data.formaPagamento}\n`;
    
    if (data.parcelamento) {
      message += `🔄 *Parcelamento:* ${data.parcelamento}\n`;
      
      if (data.valorParcela) {
        message += `💵 *Valor da Parcela:* ${data.valorParcela}\n`;
      }
      
      if (data.datasPagamento) {
        message += `📅 *Datas de Pagamento:* ${data.datasPagamento}\n`;
      }
    }
    
    if (data.cupom) {
      message += `🏷️ *Cupom:* ${data.cupom}\n`;
    }
    
    if (data.localizacao) {
      message += `📍 *Localização:* ${data.localizacao}\n`;
    }
    
    message += `🚚 *Frete:* ${data.frete}\n`;
    message += `📅 *Data Pagamento:* ${data.dataPagamento}\n`;
    message += `📅 *Data Entrega:* ${data.dataEntrega}\n`;
    message += `💵 *Valor Total:* ${data.valorTotal}\n`;
    
    if (data.observacao) {
      message += `📝 *Observação:* ${data.observacao}\n`;
    }
  }
  
  message += "\n⚠️ *DADOS ENVIADOS AUTOMATICAMENTE COMO FALLBACK* ⚠️";
  
  return encodeURIComponent(message);
}

/**
 * Envia dados para o WhatsApp como fallback
 */
export function sendToWhatsAppFallback(data: any): void {
  LogService.info("Iniciando fallback para WhatsApp", data);
  const formattedMessage = formatDataForWhatsApp(data);
  const whatsappUrl = `https://wa.me/${WHATSAPP_FALLBACK_NUMBER}?text=${formattedMessage}`;
  
  const confirmMessage = "Não foi possível enviar os dados para a planilha. Deseja enviar via WhatsApp?";
  
  if (window.confirm(confirmMessage)) {
    LogService.info("Abrindo WhatsApp como fallback", {});
    window.open(whatsappUrl, '_blank');
  } else {
    LogService.info("Usuário cancelou o envio para WhatsApp", {});
  }
}

/**
 * Verifica se os dados incluem todos os campos esperados
 */
function validateData(data: any): boolean {
  const sheetType = data.formType === 'lead' ? 'LEAD' : 'CLIENTE';
  const expectedColumns = SHEET_COLUMNS[sheetType];
  
  // Verificar se todos os campos necessários estão presentes
  const missingFields = expectedColumns.filter(column => 
    data[column] === undefined || data[column] === null || data[column] === ""
  ).filter(field => {
    // Filtrar campos opcionais que podem estar vazios
    if (data.formType === 'cliente') {
      if (['cpf', 'parcelamento', 'cupom', 'localizacao', 'observacao', 'valorParcela', 'datasPagamento'].includes(field)) {
        return false;
      }
    } else if (data.formType === 'lead') {
      if (['instagram', 'observacoes'].includes(field)) {
        return false;
      }
    }
    return true;
  });
  
  if (missingFields.length > 0) {
    LogService.warn(`Dados incompletos: faltando campos [${missingFields.join(', ')}]`, data);
    return false;
  }
  
  return true;
}

/**
 * Verifica se o webhook está configurado
 */
export function isWebhookConfigured(): boolean {
  const clienteUrl = GOOGLE_SHEETS_URL.CLIENTE;
  const leadUrl = GOOGLE_SHEETS_URL.LEAD;
  
  const isClientConfigured = clienteUrl && clienteUrl.includes('script.google.com');
  const isLeadConfigured = leadUrl && leadUrl.includes('script.google.com');
  
  return isClientConfigured && isLeadConfigured;
}

/**
 * Retorna a URL para visualização direta do Google Sheet
 */
export function getGoogleSheetViewUrl(type: 'cliente' | 'lead'): string {
  return type === 'cliente' ? GOOGLE_SHEET_VIEW_URL.CLIENTE : GOOGLE_SHEET_VIEW_URL.LEAD;
}

/**
 * Função para testar a conexão com o Google Sheet
 */
export async function testGoogleSheetConnection(type: 'cliente' | 'lead'): Promise<boolean> {
  const url = type === 'cliente' ? GOOGLE_SHEETS_URL.CLIENTE : GOOGLE_SHEETS_URL.LEAD;
  
  if (!url || !url.includes('script.google.com')) {
    LogService.error(`URL de ${type} não configurada ou inválida: ${url}`);
    return false;
  }
  
  try {
    LogService.info(`Testando conexão com Google Sheet (${type})...`);
    const response = await fetch(`${url}?test=true`, {
      method: 'GET',
      mode: 'no-cors', // Usar no-cors para evitar erros de CORS no teste
    });
    
    LogService.info(`Resposta do teste de conexão (${type})`, response);
    // Com modo no-cors, a resposta será sempre "opaque" e não podemos verificar o status
    // Mas se chegamos aqui, pelo menos a requisição foi enviada sem erros de rede
    return true;
  } catch (error) {
    LogService.error(`Erro ao testar conexão com Google Sheet (${type})`, error);
    return false;
  }
}

/**
 * Verifica se o servidor está aceitando requisições com método POST
 */
export async function testPostMethod(type: 'cliente' | 'lead'): Promise<boolean> {
  const url = type === 'cliente' ? GOOGLE_SHEETS_URL.CLIENTE : GOOGLE_SHEETS_URL.LEAD;
  
  try {
    LogService.info(`Testando método POST em ${url}...`);
    
    // Criar um formulário temporário
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    form.target = '_blank';
    form.style.display = 'none';
    
    // Adicionar dados mínimos
    const hiddenField = document.createElement('input');
    hiddenField.type = 'hidden';
    hiddenField.name = 'data';
    hiddenField.value = JSON.stringify({
      test: true,
      formType: type,
      timestamp: new Date().toISOString()
    });
    
    form.appendChild(hiddenField);
    document.body.appendChild(form);
    
    // Criar uma promessa que será resolvida quando o form for submetido
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          form.submit();
          LogService.info(`Teste de POST para ${type} enviado com sucesso`);
          document.body.removeChild(form);
          resolve(true);
        } catch (e) {
          LogService.error(`Erro ao submeter teste de POST para ${type}`, e);
          if (document.body.contains(form)) {
            document.body.removeChild(form);
          }
          resolve(false);
        }
      }, 100);
    });
  } catch (error) {
    LogService.error(`Erro no teste POST para ${type}`, error);
    return false;
  }
}

/**
 * Método alternativo que envia dados usando um formulário temporário
 * Isso contorna problemas de CORS para métodos POST
 */
function sendWithForm(url: string, data: any): Promise<any> {
  LogService.info("Tentando envio com técnica de formulário", { url, formType: data.formType });
  
  return new Promise((resolve, reject) => {
    // Verificar dados antes de enviar
    if (!validateData(data)) {
      LogService.warn("Dados inválidos ou incompletos para envio", data);
    }
    
    // Criar um identificador único para este envio
    const formId = `form-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const iframeId = `iframe-${formId}`;
    
    // Criar um iframe invisível para a resposta
    const iframe = document.createElement('iframe');
    iframe.name = iframeId;
    iframe.id = iframeId;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    // Criar um formulário
    const form = document.createElement('form');
    form.id = formId;
    form.method = 'POST';
    form.action = url;
    form.target = iframe.name;
    form.style.display = 'none';
    
    // Adicionar campo de dados
    const hiddenField = document.createElement('input');
    hiddenField.type = 'hidden';
    hiddenField.name = 'data';
    
    // Garantir que os dados incluam o nome correto da planilha
    const dataWithSheet = { ...data };
    if (!dataWithSheet.sheetName) {
      dataWithSheet.sheetName = data.formType === 'lead' ? SHEET_NAMES.LEAD : SHEET_NAMES.CLIENTE;
    }
    
    // Adicionar timestamp para identificar os dados
    dataWithSheet.timestamp = new Date().toISOString();
    
    hiddenField.value = JSON.stringify(dataWithSheet);
    if (DEBUG_MODE) {
      console.log('📤 Enviando dados para a planilha:', dataWithSheet);
    }
    
    form.appendChild(hiddenField);
    
    // Adicionar ao DOM e enviar
    document.body.appendChild(form);
    
    // Definir timeout
    const timeoutId = setTimeout(() => {
      LogService.warn("Tempo esgotado ao tentar enviar dados", { formId });
      cleanupResources();
      reject(new Error("Tempo esgotado ao tentar enviar dados"));
    }, 90000); // 90 segundos (tempo maior para garantir processamento)
    
    // Função para limpar recursos
    const cleanupResources = () => {
      clearTimeout(timeoutId);
      try {
        if (document.getElementById(formId)) {
          document.body.removeChild(form);
        }
        if (document.getElementById(iframeId)) {
          document.body.removeChild(iframe);
        }
      } catch (e) {
        LogService.error("Erro ao limpar recursos do formulário", e);
      }
    };
    
    // Salvar referência para debug global
    if (DEBUG_MODE) {
      // @ts-ignore
      window.__debug_form = form;
      // @ts-ignore
      window.__debug_iframe = iframe;
    }
    
    // Ouvir mensagens do iframe
    const messageHandler = function(event: MessageEvent) {
      try {
        // Verificar se a mensagem veio do Google Apps Script
        if (event.origin.includes('script.google.com') || event.origin.includes('google.com')) {
          LogService.info("Recebida resposta do Google Apps Script via mensagem", event.data);
          if (DEBUG_MODE) {
            console.log('📩 Resposta recebida do Google Apps Script:', event.data);
          }
          
          // Verificar se a resposta indica sucesso
          let isSuccess = false;
          
          // Se a resposta é um objeto
          if (typeof event.data === 'object' && event.data !== null) {
            isSuccess = event.data.success === true || event.data.result === 'success';
          } 
          // Se a resposta é uma string
          else if (typeof event.data === 'string') {
            isSuccess = event.data.includes('success') || event.data.includes('sucesso');
            
            // Tentar parse JSON se for uma string JSON
            try {
              const parsedData = JSON.parse(event.data);
              isSuccess = parsedData.success === true || parsedData.result === 'success';
            } catch (e) {
              // Não é JSON, continua usando o resultado da verificação de string
            }
          }
          
          window.removeEventListener('message', messageHandler);
          cleanupResources();
          
          if (isSuccess) {
            if (DEBUG_MODE) {
              console.log('✅ Dados enviados com sucesso para a planilha!');
            }
            resolve({
              success: true,
              message: "Dados enviados com sucesso!"
            });
          } else {
            LogService.warn("Resposta do Google Apps Script não indica sucesso", event.data);
            reject(new Error("Resposta do servidor não indica sucesso"));
          }
        }
      } catch (e) {
        LogService.error("Erro ao processar mensagem do iframe", e);
      }
    };
    
    window.addEventListener('message', messageHandler, false);
    
    // Ouvir resposta do iframe via load
    iframe.onload = () => {
      try {
        LogService.info("Iframe carregado, verificando resposta...", {});
        // Tentamos acessar o conteúdo do iframe (pode falhar devido a CORS)
        try {
          const iframeContent = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeContent) {
            const responseText = iframeContent.body.innerText || iframeContent.body.textContent;
            LogService.info("Conteúdo do iframe:", { responseText });
            
            if (responseText && (responseText.includes("success") || responseText.includes("sucesso"))) {
              if (DEBUG_MODE) {
                console.log('✅ Dados enviados com sucesso para a planilha!');
              }
              cleanupResources();
              window.removeEventListener('message', messageHandler);
              resolve({ success: true, message: "Dados enviados com sucesso!" });
              return;
            } else if (responseText) {
              LogService.warn("Conteúdo do iframe não indica sucesso", { responseText });
            }
          }
        } catch (e) {
          LogService.info("Não foi possível acessar conteúdo do iframe devido a restrições de CORS", e);
        }
        
        // Se não conseguimos verificar o conteúdo, verificamos visualmente
        const formaPagamento = data.formaPagamento || "N/A";
        const valor = data.valor || data.valorTotal || "N/A";
        const nome = data.nome || "N/A";
        
        // Mensagem para conferência manual
        if (DEBUG_MODE) {
          console.log(`⚠️ VERIFICAÇÃO MANUAL: Por favor, abra a planilha e verifique se o registro para ${nome} com pagamento ${formaPagamento} de ${valor} foi adicionado.`);
        }
        
        // Assumimos sucesso, já que não temos como verificar devido a CORS
        LogService.info("Não foi possível verificar a resposta, assumindo sucesso...");
        
        // Se não conseguimos verificar o conteúdo, esperamos um pouco mais para mensagens
        setTimeout(() => {
          if (DEBUG_MODE) {
            console.log('⏱️ Timeout atingido, assumindo envio bem-sucedido...');
          }
          cleanupResources();
          window.removeEventListener('message', messageHandler);
          resolve({ success: true, message: "Dados parecem ter sido enviados com sucesso!" });
        }, 3000); // Aumentamos o tempo para garantir que mensagens sejam processadas
      } catch (e) {
        LogService.info("Erro ao processar resposta do iframe, assumindo sucesso", e);
        cleanupResources();
        window.removeEventListener('message', messageHandler);
        resolve({ success: true, message: "Dados parecem ter sido enviados com sucesso!" });
      }
    };
    
    iframe.onerror = (error) => {
      LogService.error("Erro no iframe ao enviar formulário", error);
      window.removeEventListener('message', messageHandler);
      cleanupResources();
      reject(new Error("Erro ao enviar dados"));
    };
    
    try {
      LogService.info(`Enviando formulário ${formId} para ${url}`, {});
      if (DEBUG_MODE) {
        console.log(`🚀 Enviando formulário para ${url}...`);
      }
      form.submit();
      LogService.info("Formulário enviado, aguardando resposta...", {});
    } catch (e) {
      LogService.error("Erro ao enviar formulário", e);
      window.removeEventListener('message', messageHandler);
      cleanupResources();
      reject(e);
    }
  });
}

/**
 * Função principal para enviar dados para o Google Sheets
 */
export async function submitToGoogleSheets(data: any): Promise<any> {
  const sheetType = data.formType === 'lead' ? 'LEAD' : 'CLIENTE';
  const url = GOOGLE_SHEETS_URL[sheetType];
  
  if (!url || !url.includes('script.google.com')) {
    LogService.error(`URL de ${sheetType} não configurada ou inválida: ${url}`);
    return { 
      success: false, 
      message: `URL do Google Sheets para ${sheetType} não está configurada corretamente` 
    };
  }
  
  LogService.info(`Iniciando envio de dados para ${sheetType}`, {
    url,
    dataSize: JSON.stringify(data).length,
    formType: data.formType
  });
  
  // Instruções detalhadas para usuários quando em modo debug
  if (DEBUG_MODE) {
    console.log(`📋 Enviando dados para planilha ${sheetType}`);
    console.log(`🌐 URL: ${url}`);
    console.log(`📊 Dados: ${JSON.stringify(data).substring(0, 100)}...`);
  }
  
  try {
    // Usar o método de formulário para evitar problemas de CORS
    if (USE_FORM_FALLBACK) {
      LogService.info("Usando método de formulário para envio", { formType: data.formType });
      return await sendWithForm(url, data);
    }
    
    // Método fetch tradicional (com problemas de CORS em produção)
    LogService.info("Usando método fetch para envio", { formType: data.formType });
    
    // Preparar os dados para envio
    const postData = new URLSearchParams();
    postData.append('data', JSON.stringify(data));
    
    // Enviar a requisição
    const response = await fetch(url, {
      method: 'POST',
      body: postData,
      mode: 'cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    // Processar a resposta
    if (response.ok) {
      const responseData = await response.json();
      LogService.info("Resposta bem-sucedida do Google Sheets", responseData);
      return responseData;
    } else {
      const errorText = await response.text();
      LogService.error("Resposta de erro do Google Sheets", {
        status: response.status, 
        statusText: response.statusText,
        body: errorText
      });
      return { 
        success: false, 
        message: `Erro do servidor: ${response.status} ${response.statusText}` 
      };
    }
  } catch (error) {
    LogService.error("Erro ao enviar dados para o Google Sheets", error);
    
    // Verificar se é um erro de CORS e recomendar soluções
    if (error instanceof Error && (
      error.message.includes('CORS') || 
      error.message.includes('Failed to fetch') || 
      error.message.includes('Network error')
    )) {
      LogService.warn("Detectado problema de CORS. Verificando uso do fallback...");
      
      if (!USE_FORM_FALLBACK) {
        LogService.info("Tentando usar método de formulário após falha de fetch");
        try {
          return await sendWithForm(url, data);
        } catch (formError) {
          LogService.error("Erro também no método de formulário", formError);
          return { 
            success: false, 
            message: "Erro de CORS: O navegador bloqueou a comunicação com o Google Sheets. Verifique as configurações de CORS no Apps Script." 
          };
        }
      }
    }
    
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Erro desconhecido ao enviar dados" 
    };
  }
}

// Função para diagnosticar a configuração do Apps Script
export function diagnoseAppsScriptSetup(): string[] {
  const issues: string[] = [];
  
  const clienteUrl = GOOGLE_SHEETS_URL.CLIENTE;
  const leadUrl = GOOGLE_SHEETS_URL.LEAD;
  
  if (!clienteUrl || !clienteUrl.includes('script.google.com')) {
    issues.push("URL do Apps Script para Cliente está vazia ou inválida");
  }
  
  if (!leadUrl || !leadUrl.includes('script.google.com')) {
    issues.push("URL do Apps Script para Lead está vazia ou inválida");
  }
  
  // Verificar se as URLs usam 'exec' no final (formato correto)
  if (clienteUrl && !clienteUrl.endsWith('/exec')) {
    issues.push("URL do Apps Script para Cliente deve terminar com '/exec'");
  }
  
  if (leadUrl && !leadUrl.endsWith('/exec')) {
    issues.push("URL do Apps Script para Lead deve terminar com '/exec'");
  }
  
  if (issues.length === 0) {
    issues.push("Nenhum problema encontrado nas configurações de URL. Verifique as configurações de CORS e permissões no Apps Script.");
  }
  
  return issues;
}
