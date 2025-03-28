
import { LOG_ENABLED, LOG_LEVEL } from '../env';

// Níveis de log em ordem de prioridade
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Cores para console
const COLORS = {
  debug: '#6495ED', // Azul
  info: '#4CAF50',  // Verde
  warn: '#FF9800',  // Laranja
  error: '#F44336', // Vermelho
  reset: ''
};

// Flag para prevenir recursão infinita no monitoramento de CORS
let isMonitoringCORS = false;

export class LogService {
  static debug(message: string, data?: any): void {
    LogService.log('debug', message, data);
  }

  static info(message: string, data?: any): void {
    LogService.log('info', message, data);
  }

  static warn(message: string, data?: any): void {
    LogService.log('warn', message, data);
  }

  static error(message: string, data?: any): void {
    LogService.log('error', message, data);
  }

  static log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (!LOG_ENABLED) return;
    
    // Só loga se o nível atual for igual ou maior que o configurado
    if (LOG_LEVELS[level] < LOG_LEVELS[LOG_LEVEL]) return;
    
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    // Log colorido no console
    const color = COLORS[level];
    
    if (level === 'error') {
      console.error(`%c${prefix} ${message}`, `color: ${color}; font-weight: bold`);
      if (data instanceof Error) {
        console.error(data);
      } else if (data) {
        console.error(data);
      }
    } else {
      console.log(`%c${prefix} ${message}`, `color: ${color}; font-weight: bold`);
      if (data) {
        console.log(data);
      }
    }
    
    // Monitorar problemas de CORS sem causar recursão infinita
    if (!isMonitoringCORS && (message.includes('CORS') || (data && JSON.stringify(data).includes('CORS')))) {
      isMonitoringCORS = true;
      try {
        // Uma única mensagem de aviso sem criar loop
        console.warn(`%c[${timestamp}] [WARN] ⚠️ Possível problema de CORS detectado!`, `color: ${COLORS.warn}; font-weight: bold`);
      } finally {
        isMonitoringCORS = false;
      }
    }
  }
  
  // Método para inspecionar quando o navegador bloqueia o CORS
  static monitorCORSErrors(): void {
    const originalFetch = window.fetch;
    
    window.fetch = function(input, init) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      
      LogService.debug(`🌐 Fetch iniciado: ${url}`);
      
      return originalFetch.apply(this, arguments)
        .then(response => {
          if (!response.ok) {
            LogService.warn(`⚠️ Fetch retornou status: ${response.status} para ${url}`);
          } else {
            LogService.debug(`✅ Fetch bem-sucedido: ${url}`);
          }
          return response;
        })
        .catch(error => {
          // Verificar se é erro de CORS sem causar recursão
          if (error.message && (error.message.includes('CORS') || error.toString().includes('CORS'))) {
            LogService.error(`🚫 Erro de CORS detectado: ${url}`, error);
            LogService.info('Tente usar um dos métodos alternativos de envio de dados.');
          } else {
            LogService.error(`❌ Fetch falhou para: ${url}`, error);
          }
          throw error;
        });
    };
    
    LogService.info('🔍 Monitoramento de CORS ativado');
  }
}

// Iniciar monitoramento de CORS automaticamente
if (LOG_ENABLED && (LOG_LEVEL === 'debug' || LOG_LEVEL === 'info')) {
  LogService.monitorCORSErrors();
}
