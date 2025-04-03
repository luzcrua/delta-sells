
// Armazena as URLs dos Google Sheets
// IMPORTANTE: Este arquivo deve ser incluído no .gitignore manualmente
// As URLs são lidas das variáveis de ambiente para maior segurança
export const GOOGLE_SHEETS_URL = {
  CLIENTE: import.meta.env.VITE_GOOGLE_SHEETS_URL_CLIENTE || "",
  LEAD: import.meta.env.VITE_GOOGLE_SHEETS_URL_LEAD || ""
};

// Novas URLs para visualização direta das planilhas
export const GOOGLE_SHEET_VIEW_URL = {
  CLIENTE: import.meta.env.VITE_GOOGLE_SHEET_VIEW_URL_CLIENTE || "",
  LEAD: import.meta.env.VITE_GOOGLE_SHEET_VIEW_URL_LEAD || ""
};

// Senha para acesso ao sistema - lida da variável de ambiente ou usa um valor padrão apenas para desenvolvimento
export const ACCESS_PASSWORD = import.meta.env.VITE_ACCESS_PASSWORD;

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
