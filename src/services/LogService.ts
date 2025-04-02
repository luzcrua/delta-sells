
/**
 * Serviço de log com funcionalidades de diagnóstico e monitoramento de erros
 */
import { LOG_ENABLED, LOG_LEVEL, DEBUG_MODE } from '../env';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogEntry = {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
};

class LogServiceClass {
  private logs: LogEntry[] = [];
  private corsErrors: number = 0;
  private networkErrors: number = 0;
  private originalConsoleError: typeof console.error;

  constructor() {
    this.originalConsoleError = console.error;
    this.setupErrorMonitoring();
  }

  /**
   * Configura monitoramento de erros para detectar problemas de CORS
   */
  public monitorCORSErrors(): void {
    if (typeof window !== 'undefined') {
      const self = this;
      
      // Observar eventos de erro na janela
      window.addEventListener('error', function(event) {
        if (event.message && (
          event.message.includes('CORS') || 
          event.message.includes('cross-origin') ||
          event.message.includes('Access-Control-Allow-Origin')
        )) {
          self.corsErrors++;
          self.error('CORS Error Detected', {
            message: event.message,
            source: event.filename,
            line: event.lineno,
            column: event.colno,
            count: self.corsErrors
          });
        } else if (event.message && (
          event.message.includes('network') ||
          event.message.includes('Network') ||
          event.message.includes('connection')
        )) {
          self.networkErrors++;
          self.error('Network Error Detected', {
            message: event.message,
            source: event.filename,
            line: event.lineno,
            column: event.colno,
            count: self.networkErrors
          });
        }
      });
      
      this.info('CORS Error Monitoring Activated');
    }
  }

  private setupErrorMonitoring(): void {
    if (typeof window !== 'undefined') {
      const self = this;
      
      // Sobrescrever console.error para capturar erros de CORS
      console.error = function(...args) {
        // Chamar o console.error original
        self.originalConsoleError.apply(console, args);
        
        // Verificar se é um erro de CORS
        const errorString = args.join(' ');
        if (errorString.includes('CORS') || 
            errorString.includes('cross-origin') || 
            errorString.includes('Access-Control-Allow-Origin')) {
          self.corsErrors++;
          self.error('CORS Error in console', {
            message: errorString,
            count: self.corsErrors
          });
        } else if (errorString.includes('network') ||
                 errorString.includes('Network') ||
                 errorString.includes('connection') ||
                 errorString.includes('Failed to fetch')) {
          self.networkErrors++;
          self.error('Network Error in console', {
            message: errorString,
            count: self.networkErrors
          });
        }
      };
    }
  }

  /**
   * Registra mensagem de log de nível debug
   */
  public debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  /**
   * Registra mensagem de log de nível info
   */
  public info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  /**
   * Registra mensagem de log de nível warn
   */
  public warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  /**
   * Registra mensagem de log de nível error
   */
  public error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  /**
   * Registra mensagem de log com o nível especificado
   */
  private log(level: LogLevel, message: string, data?: any): void {
    if (!LOG_ENABLED) return;
    
    // Verificar o nível mínimo de log configurado
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const configLevelIndex = levels.indexOf(LOG_LEVEL);
    const currentLevelIndex = levels.indexOf(level);
    
    // Só logar se o nível atual for maior ou igual ao configurado
    if (currentLevelIndex >= configLevelIndex) {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        data,
      };
      
      this.logs.push(entry);
      
      // Limitar o número de logs armazenados
      if (this.logs.length > 1000) {
        this.logs = this.logs.slice(-1000);
      }
      
      // Logar no console se DEBUG_MODE estiver ativado
      if (DEBUG_MODE) {
        const styles = {
          debug: 'color: #2196F3; font-weight: normal;',
          info: 'color: #4CAF50; font-weight: normal;',
          warn: 'color: #FF9800; font-weight: bold;',
          error: 'color: #F44336; font-weight: bold;'
        };
        
        console.log(
          `%c[${level.toUpperCase()}] ${message}`,
          styles[level],
          data || ''
        );
      }
    }
  }

  /**
   * Obtém todos os logs registrados
   */
  public getLogs(): LogEntry[] {
    return this.logs;
  }

  /**
   * Limpa todos os logs
   */
  public clearLogs(): void {
    this.logs = [];
  }

  /**
   * Retorna a contagem de erros de CORS detectados
   */
  public getCorsErrorCount(): number {
    return this.corsErrors;
  }

  /**
   * Retorna a contagem de erros de rede detectados
   */
  public getNetworkErrorCount(): number {
    return this.networkErrors;
  }
}

// Exporta uma instância única do serviço
export const LogService = new LogServiceClass();
