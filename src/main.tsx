
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { Toaster } from "@/components/ui/toaster"
import { LogService } from './services/LogService'
import { DEBUG_MODE } from './env'
import { toast } from "@/components/ui/use-toast"

// Adicionar um listener para mensagens que podem vir do Google Apps Script
window.addEventListener('message', function(event) {
  // Verificar se a origem é confiável (Google Scripts)
  if (event.origin.includes('script.google.com') || event.origin.includes('google.com')) {
    LogService.info('Mensagem recebida do Google Apps Script:', event.data);
    
    if (DEBUG_MODE) {
      console.log('📨 Mensagem recebida do Google Apps Script:', event.data);
    }
    
    try {
      // Tentar analisar a resposta, se for uma string JSON
      if (typeof event.data === 'string') {
        const data = JSON.parse(event.data);
        LogService.info('Dados processados da mensagem:', data);
        
        // Se recebemos uma confirmação de sucesso, podemos notificar o usuário
        if (data.result === 'success' || data.success === true) {
          console.log('%c ✅ Dados salvos com sucesso na planilha!', 'color: #4CAF50; font-weight: bold');
          console.log('Resposta completa:', data);
          
          // Exibir toast de sucesso para o usuário
          toast({
            title: "Sucesso!",
            description: "Dados salvos com sucesso na planilha!",
            variant: "default",
          });
        } else if (data.result === 'error' || data.success === false) {
          console.error('%c ❌ Erro ao salvar dados na planilha!', 'color: #F44336; font-weight: bold');
          console.error('Erro:', data.message || data.error || 'Erro desconhecido');
          console.error('Resposta completa:', data);
          
          // Exibir toast de erro para o usuário
          toast({
            title: "Erro!",
            description: data.message || data.error || "Erro ao salvar dados na planilha!",
            variant: "destructive",
          });
        }
      } else if (typeof event.data === 'object' && event.data !== null) {
        // Se já for um objeto
        LogService.info('Objeto recebido do Google Apps Script:', event.data);
        console.log('Objeto recebido do Google Apps Script:', event.data);
        
        if (event.data.result === 'success' || event.data.success === true) {
          console.log('%c ✅ Dados salvos com sucesso na planilha!', 'color: #4CAF50; font-weight: bold');
          console.log('Resposta completa:', event.data);
          
          // Exibir toast de sucesso para o usuário
          toast({
            title: "Sucesso!",
            description: "Dados salvos com sucesso na planilha!",
            variant: "default",
          });
        } else if (event.data.result === 'error' || event.data.success === false) {
          console.error('%c ❌ Erro ao salvar dados na planilha!', 'color: #F44336; font-weight: bold');
          console.error('Erro:', event.data.message || event.data.error || 'Erro desconhecido');
          console.error('Resposta completa:', event.data);
          
          // Exibir toast de erro para o usuário
          toast({
            title: "Erro!",
            description: event.data.message || event.data.error || "Erro ao salvar dados na planilha!",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      LogService.info('Recebida mensagem não-JSON do iframe:', event.data);
      console.log('Recebida mensagem não-JSON do iframe:', event.data);
      
      // Se a mensagem contém 'success' ou 'sucesso', consideramos que o envio foi bem-sucedido
      if (typeof event.data === 'string') {
        if (event.data.includes('success') || event.data.includes('sucesso')) {
          console.log('%c ✅ Dados salvos com sucesso na planilha!', 'color: #4CAF50; font-weight: bold');
          
          // Exibir toast de sucesso para o usuário
          toast({
            title: "Sucesso!",
            description: "Dados salvos com sucesso na planilha!",
            variant: "default",
          });
        } else if (event.data.includes('error') || event.data.includes('erro')) {
          console.error('%c ❌ Erro ao salvar dados na planilha!', 'color: #F44336; font-weight: bold');
          
          // Exibir toast de erro para o usuário
          toast({
            title: "Erro!",
            description: "Erro ao salvar dados na planilha!",
            variant: "destructive",
          });
        }
      }
    }
  }
});

// Configurar monitoramento de CORS
LogService.monitorCORSErrors();

// Inicializar mensagem de log
LogService.info('📊 DELTA SELLS CLIENTS - Aplicação iniciando...', {});
console.log('%c 🚀 DELTA SELLS CLIENTS - Aplicação iniciando...', 'color: #2196F3; font-weight: bold');

// Verificar e exibir informações de configuração
console.log('%c 🔍 Verificando variáveis de ambiente...', 'color: #FF9800;');
console.group('📋 Variáveis de ambiente carregadas:');
console.log('VITE_ACCESS_PASSWORD:', import.meta.env.VITE_ACCESS_PASSWORD ? "✓ Definida" : "❌ Não definida");
console.log('VITE_GOOGLE_SHEETS_URL_CLIENTE:', import.meta.env.VITE_GOOGLE_SHEETS_URL_CLIENTE ? "✓ Definida" : "❌ Não definida");
console.log('VITE_GOOGLE_SHEETS_URL_LEAD:', import.meta.env.VITE_GOOGLE_SHEETS_URL_LEAD ? "✓ Definida" : "❌ Não definida");
console.log('VITE_GOOGLE_SHEET_VIEW_URL_CLIENTE:', import.meta.env.VITE_GOOGLE_SHEET_VIEW_URL_CLIENTE ? "✓ Definida" : "❌ Não definida");
console.log('VITE_GOOGLE_SHEET_VIEW_URL_LEAD:', import.meta.env.VITE_GOOGLE_SHEET_VIEW_URL_LEAD ? "✓ Definida" : "❌ Não definida");
console.groupEnd();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>,
)

LogService.info('📊 DELTA SELLS CLIENTS - Interface renderizada', {});
console.log('%c 🎨 Interface renderizada', 'color: #2196F3; font-weight: bold');

// Mensagem adicional sobre o envio de dados
if (DEBUG_MODE) {
  console.log('%c 📝 Sistema pronto para enviar dados para a planilha.', 'color: #2196F3; font-weight: bold');
  console.log('%c ℹ️ Verifique se a URL do Apps Script em env.ts está correta.', 'color: #2196F3;');
}
