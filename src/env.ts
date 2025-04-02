
// Armazena as URLs dos Google Sheets
// IMPORTANTE: Este arquivo deve ser incluído no .gitignore manualmente
// Insira abaixo as URLs dos seus Google Apps Script Web Apps entre as aspas
export const GOOGLE_SHEETS_URL = {
  CLIENTE: "https://script.google.com/macros/s/AKfycbyRNkHPtBFzTn3Eo6QENL87DzoR1rFg3A4tUX6ftowmBsSNPLEvb-X6peUPkqo2kdUe/exec",
  LEAD: "https://script.google.com/macros/s/AKfycby6rIx3nwB6Viv0HSGub4c4cTcPjsA3pR8u2skdK8YMrf9OEvwxH5hVJcU0IkqTJDZS/exec"
};

// Novas URLs para visualização direta das planilhas
export const GOOGLE_SHEET_VIEW_URL = {
  CLIENTE: "https://docs.google.com/spreadsheets/d/13DHwYtX13t6CJ3Fg5mMmPpNHT8rZt7Cio3JwB04ipHY/edit?gid=0#gid=0",
  LEAD: "https://docs.google.com/spreadsheets/d/1NA-iPBQkAZ-ZG7IST9tUkTCZPHQkuHT1aazRdmcXu14/edit?gid=0#gid=0"
};

// Senha para acesso ao sistema
export const ACCESS_PASSWORD = "JHONALVES";

// Configuração de log
export const LOG_ENABLED: boolean = true;
export const LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error' = 'debug';

// Configurações adicionais para contornar problemas de CORS
export const USE_FORM_FALLBACK: boolean = true; // Usar método de formulário em vez de fetch
export const MAX_RETRIES: number = 30; // Número máximo de tentativas aumentado para 30
export const RETRY_DELAY: number = 1000; // Tempo entre tentativas (ms)

// Configurações para as abas da planilha
export const SHEET_NAMES = {
  CLIENTE: "Cliente",
  LEAD: "Lead"
};

// Defina como true para usar depuração extendida
export const DEBUG_MODE: boolean = true;

// Nome das colunas esperadas na planilha (usado para debug)
export const SHEET_COLUMNS = {
  CLIENTE: ["nome", "cpf", "telefone", "genero", "linha", "tipo", "cor", "tamanho", 
    "valor", "formaPagamento", "parcelamento", "jurosAplicado", "cupom", "localizacao", "frete", "dataPagamento", "dataEntrega", 
    "valorTotal", "valorParcela", "datasPagamento", "observacao"],
  LEAD: ["nome", "telefone", "instagram", "interesse", "statusLead", "dataLembrete", 
    "motivoLembrete", "observacoes"]
};

// Número do WhatsApp para fallback (com código do país)
export const WHATSAPP_FALLBACK_NUMBER = "558293460460";
