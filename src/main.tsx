
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { LogService } from './services/LogService.ts'

// Inicializar serviço de log
LogService.info('📊 DELTA SELLS CLIENTS - Aplicação iniciando...');

// Monitorar erros não tratados
window.addEventListener('error', (event) => {
  LogService.error('Erro não tratado:', {
    message: event.message,
    source: event.filename,
    lineNo: event.lineno,
    colNo: event.colno,
    error: event.error
  });
});

// Inicializar aplicação
const root = createRoot(document.getElementById("root")!);
root.render(<App />);

LogService.info('📊 DELTA SELLS CLIENTS - Interface renderizada');
