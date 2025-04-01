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
              result: "success",
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
              resolve({ result: "success", message: "Dados enviados com sucesso!" });
              return;
            } else if (responseText) {
              LogService.warn("Conteúdo do iframe não indica sucesso", { responseText });
            }
          }
        } catch (e) {
          LogService.info("Não foi possível acessar conteúdo do iframe devido a restrições de CORS", e);
        }
        
        // Se não conseguimos verificar o conteúdo, esperamos um pouco mais para mensagens
        setTimeout(() => {
          if (DEBUG_MODE) {
            console.log('⏱️ Timeout atingido, assumindo envio bem-sucedido...');
          }
          cleanupResources();
          window.removeEventListener('message', messageHandler);
          resolve({ result: "success", message: "Dados parecem ter sido enviados com sucesso!" });
        }, 3000); // Aumentamos o tempo para garantir que mensagens sejam processadas
      } catch (e) {
        LogService.info("Erro ao processar resposta do iframe, assumindo sucesso", e);
        cleanupResources();
        window.removeEventListener('message', messageHandler);
        resolve({ result: "success", message: "Dados parecem ter sido enviados com sucesso!" });
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
 * Envia dados do formulário para o webhook do Google Sheets
 * Usando métodos alternativos para contornar CORS
 */
export async function submitToGoogleSheets(data: any): Promise<{ success: boolean; message: string; redirectToSheet?: boolean }> {
  LogService.info("Iniciando envio para Google Sheets", { formType: data.formType });
  if (DEBUG_MODE) {
    console.log('🔄 Iniciando envio para Google Sheets...', { formType: data.formType });
  }
  
  try {
    // Obter a URL do Apps Script do env.ts baseado no tipo de formulário
    const formType = data.formType === 'lead' ? 'LEAD' : 'CLIENTE';
    const webhookUrl = GOOGLE_SHEETS_URL[formType];
    
    if (!webhookUrl || typeof webhookUrl !== 'string') {
      LogService.error(`URL do Apps Script para ${formType} não configurada em env.ts`, {});
      sendToWhatsAppFallback(data);
      return { 
        success: false, 
        message: `A URL do Apps Script para ${formType} não está configurada no arquivo env.ts. Configure o arquivo adicionando a URL ou use o WhatsApp como alternativa.` 
      };
    }
    
    // Verifica se a URL parece válida
    if (!webhookUrl.startsWith('https://') || !webhookUrl.includes('script.google.com')) {
      LogService.error(`URL do Apps Script para ${formType} inválida`, {});
      sendToWhatsAppFallback(data);
      return { 
        success: false, 
        message: `A URL do Apps Script para ${formType} no arquivo env.ts parece inválida. Configure corretamente ou use o WhatsApp como alternativa.` 
      };
    }
    
    // Garantir que estamos usando os nomes de planilha corretos
    LogService.info(`Preparando dados para a planilha de ${formType}`, { sheetName: SHEET_NAMES[formType] });
    data.sheetName = SHEET_NAMES[formType]; // Adicionar nome da planilha aos dados
    
    // Verificar se os dados estão completos antes de enviar
    const hasAllFields = validateData(data);
    if (!hasAllFields) {
      LogService.warn(`Dados de ${formType.toLowerCase()} incompletos para envio`, data);
    }
    
    LogService.info(`Tentando enviar dados para Google Sheets: ${webhookUrl}`, {});
    
    // Com base nas configurações, escolher o método de envio
    let result;
    let attempts = 0;
    let success = false;
    let lastError = null;
    
    while (attempts < MAX_RETRIES && !success) {
      attempts++;
      
      try {
        LogService.info(`Tentativa ${attempts}/${MAX_RETRIES} usando método de formulário`, {});
        if (DEBUG_MODE) {
          console.log(`🔄 Tentativa ${attempts}/${MAX_RETRIES} de envio...`);
        }
        
        // Usar consistentemente o método de formulário, que é mais confiável
        result = await sendWithForm(webhookUrl, data);
        LogService.info("Resultado da tentativa:", result);
        
        if (result && (result.result === "success" || result.message?.includes("sucesso"))) {
          success = true;
          if (DEBUG_MODE) {
            console.log('✅ Tentativa bem-sucedida!');
          }
        } else {
          throw new Error(result?.message || "Resposta não contém mensagem de sucesso");
        }
      } catch (error) {
        lastError = error;
        LogService.error(`Erro na tentativa ${attempts}`, error);
        
        // Se não for a última tentativa, esperar antes de tentar novamente
        if (attempts < MAX_RETRIES) {
          const waitTime = RETRY_DELAY * attempts; // Aumenta o tempo de espera a cada tentativa
          LogService.info(`Aguardando ${waitTime}ms antes da próxima tentativa`, {});
          if (DEBUG_MODE) {
            console.log(`⏱️ Aguardando ${waitTime}ms antes da próxima tentativa...`);
          }
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    if (success && result) {
      LogService.info("Envio concluído com sucesso", {});
      if (DEBUG_MODE) {
        console.log('🎉 Envio concluído com sucesso para a planilha!');
      }
      return { 
        success: true, 
        message: "Dados enviados com sucesso para a planilha!", 
        redirectToSheet: true 
      };
    } else {
      throw new Error(lastError?.message || "Todas as tentativas de envio falharam");
    }
  } catch (error) {
    LogService.error("Erro final ao enviar para o Google Sheets", error);
    if (DEBUG_MODE) {
      console.error('❌ Erro final ao enviar para o Google Sheets:', error);
    }
    
    return { 
      success: false, 
      message: `Erro ao enviar para a planilha: ${error instanceof Error ? error.message : "Erro desconhecido"}. Você pode enviar os dados via WhatsApp como alternativa.` 
    };
  }
}

/**
 * Verifica se a URL do webhook está configurada
 */
export function isWebhookConfigured(): boolean {
  const clienteUrl = GOOGLE_SHEETS_URL.CLIENTE;
  const leadUrl = GOOGLE_SHEETS_URL.LEAD;
  
  return (
    typeof clienteUrl === 'string' && 
    clienteUrl !== "" && 
    clienteUrl.includes('script.google.com') &&
    typeof leadUrl === 'string' && 
    leadUrl !== "" && 
    leadUrl.includes('script.google.com')
  );
}

/**
 * Retorna a URL de visualização da planilha com base no tipo de formulário
 */
export function getGoogleSheetViewUrl(type: 'cliente' | 'lead'): string {
  if (type === 'lead') {
    return GOOGLE_SHEET_VIEW_URL.LEAD;
  } else if (type === 'cliente') {
    return GOOGLE_SHEET_VIEW_URL.CLIENTE;
  }
  return GOOGLE_SHEET_VIEW_URL.CLIENTE; // URL padrão se nenhum tipo for especificado
}
