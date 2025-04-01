
// Serviço de log para monitorar o funcionamento da aplicação
import { LOG_ENABLED, LOG_LEVEL, DEBUG_MODE } from "../env";

export class LogService {
  static debug(message: string, data?: any): void {
    if (LOG_ENABLED && (LOG_LEVEL === 'debug' || DEBUG_MODE)) {
      this.log(message, data, 'DEBUG', '#6495ED');
    }
  }

  static info(message: string, data?: any): void {
    if (LOG_ENABLED && ['debug', 'info'].includes(LOG_LEVEL)) {
      this.log(message, data, 'INFO', '#4CAF50');
    }
  }

  static warn(message: string, data?: any): void {
    if (LOG_ENABLED && ['debug', 'info', 'warn'].includes(LOG_LEVEL)) {
      this.log(message, data, 'WARN', '#FF9800');
    }
  }

  static error(message: string, data?: any): void {
    if (LOG_ENABLED) {
      this.log(message, data, 'ERROR', '#F44336');
      console.error(`[${new Date().toISOString()}] [ERROR] ${message}`, data);
    }
  }

  static log(message: string, data: any, level: string, color: string): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level}] ${message}`;
    
    console.info(`%c${formattedMessage}`, `color: ${color}; font-weight: bold`);
    
    if (data !== undefined) {
      if (typeof data === 'object' && data !== null) {
        console.info(data);
      } else {
        console.info(`Data: ${data}`);
      }
    }
  }

  // Monitorar problemas específicos de CORS com o Google Sheets
  static monitorCORSErrors(): void {
    this.info("🔍 Monitoramento de CORS ativado");
    
    // Monitorar erros de rede que podem ser causados por CORS
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const request = args[0];
      const url = typeof request === 'string' ? request : request.url;
      
      // Verificar se é uma solicitação para o Google Apps Script
      if (url && url.includes('script.google.com')) {
        LogService.debug(`📤 Tentativa de fetch para Google Apps Script: ${url}`);
      }
      
      return originalFetch.apply(this, args)
        .catch(error => {
          if (error.message && (
              error.message.includes('CORS') || 
              error.message.includes('Failed to fetch') || 
              error.message.includes('Network error')
            )) {
            LogService.warn("⚠️ Possível problema de CORS detectado!", error);
          }
          throw error;
        });
    };
    
    // Capturar erros não tratados que podem ser causados por CORS
    window.addEventListener('error', function(event) {
      if (event.message && (
        event.message.includes('CORS') || 
        event.message.includes('Failed to fetch') || 
        event.message.includes('Network error')
      )) {
        LogService.warn("⚠️ Erro de CORS detectado em evento global!", event);
      }
    });
    
    // Monitorar rejeições de promessas não tratadas
    window.addEventListener('unhandledrejection', function(event) {
      const reason = event.reason;
      if (reason && reason.message && (
        reason.message.includes('CORS') || 
        reason.message.includes('Failed to fetch') || 
        reason.message.includes('Network error')
      )) {
        LogService.warn("⚠️ Problema de CORS em promessa não tratada!", reason);
      }
    });
  }
  
  // Função para validar resposta da submissão ao Google Sheets
  static validateGoogleSheetsResponse(response: any): boolean {
    this.debug("🔍 Validando resposta do Google Sheets", response);
    
    if (!response) {
      this.error("❌ Resposta nula do Google Sheets");
      return false;
    }
    
    if (typeof response === 'object') {
      if (response.success === true) {
        this.info("✅ Resposta válida com sucesso=true");
        return true;
      } else {
        this.warn("⚠️ Resposta com sucesso=false", response);
        return false;
      }
    } else if (typeof response === 'string') {
      try {
        const parsed = JSON.parse(response);
        if (parsed.success === true) {
          this.info("✅ String JSON parseada com sucesso=true");
          return true;
        } else {
          this.warn("⚠️ String JSON parseada com sucesso=false", parsed);
          return false;
        }
      } catch (e) {
        // Não é JSON, verificar se contém palavras-chave
        if (response.includes('success') || response.includes('sucesso')) {
          this.info("✅ String contém indicação de sucesso");
          return true;
        } else {
          this.warn("⚠️ String não contém indicação de sucesso", response);
          return false;
        }
      }
    }
    
    this.error("❌ Formato de resposta desconhecido", response);
    return false;
  }
}
