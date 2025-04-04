
/**
 * Script para receber dados da aplicação web e salvar na planilha de Leads.
 * 
 * Este script deve ser implementado no Apps Script da planilha de Leads
 * e depois publicado como aplicativo da web para receber dados de formulários.
 * 
 * IMPORTANTE: Cole este código no Apps Script da planilha:
 * https://docs.google.com/spreadsheets/d/1NA-iPBQkAZ-ZG7IST9tUkTCZPHQkuHT1aazRdmcXu14/edit?usp=sharing
 */

// Função que será chamada quando o Apps Script receber uma solicitação
function doPost(e) {
  try {
    // Log inicial para depuração
    Logger.log("Recebendo solicitação POST para LEAD: " + JSON.stringify(e.parameter));
    
    // Verificar se há dados na solicitação
    if (!e || !e.parameter || !e.parameter.data) {
      Logger.log("Erro: Nenhum dado recebido na solicitação");
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Nenhum dado recebido."
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Analisar os dados JSON da solicitação
    const dataString = e.parameter.data;
    Logger.log("Dados recebidos (string): " + dataString);
    
    const data = JSON.parse(dataString);
    Logger.log("Dados parseados: " + JSON.stringify(data));
    
    // Verificar se é o tipo correto de formulário
    if (data.formType !== 'lead') {
      Logger.log("Erro: Tipo de formulário incorreto: " + data.formType);
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Tipo de formulário incorreto. Este endpoint é apenas para dados de leads."
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Obter a planilha ativa
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log("Acessando planilha: " + ss.getName());
    
    // Verificar se a aba existe, se não, criar uma nova
    let sheet;
    try {
      sheet = ss.getSheetByName("Lead");
      if (!sheet) {
        // Criar nova aba se não existir
        Logger.log("Aba Lead não encontrada. Criando nova aba...");
        sheet = ss.insertSheet("Lead");
        
        // Configurar cabeçalhos
        sheet.appendRow([
          "nome", "telefone", "instagram", "interesse", 
          "statusLead", "dataLembrete", "motivoLembrete", 
          "observacoes", "dataRegistro"
        ]);
        Logger.log("Cabeçalhos configurados na aba Lead");
      } else {
        Logger.log("Aba Lead encontrada");
      }
    } catch (err) {
      Logger.log("Erro ao acessar a planilha: " + err.toString());
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Erro ao acessar a planilha: " + err.toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Adicionar timestamp ao registro
    const timestamp = new Date();
    const formattedTimestamp = Utilities.formatDate(
      timestamp, 
      SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), 
      "dd/MM/yyyy HH:mm:ss"
    );
    
    // Preparar a linha de dados para inserção
    const rowData = [
      data.nome || "",
      data.telefone || "",
      data.instagram || "",
      data.interesse || "",
      data.statusLead || "",
      data.dataLembrete || "",
      data.motivoLembrete || "",
      data.observacoes || "",
      formattedTimestamp
    ];
    
    Logger.log("Dados preparados para inserção: " + JSON.stringify(rowData));
    
    // Adicionar os dados à planilha
    sheet.appendRow(rowData);
    Logger.log("Dados inseridos na linha " + (sheet.getLastRow()));
    
    // Retornar uma resposta de sucesso
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Dados do lead salvos com sucesso na planilha!",
      sheetName: "Lead",
      timestamp: formattedTimestamp
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Em caso de erro, registrar e retornar uma resposta de erro
    Logger.log("Erro crítico no processamento: " + error.toString());
    Logger.log("Stack trace: " + error.stack);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Erro ao processar dados: " + error.toString(),
      errorDetail: error.stack
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Função que será chamada quando o Apps Script receber uma solicitação GET
function doGet(e) {
  Logger.log("Recebendo solicitação GET: " + JSON.stringify(e));
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: "O serviço Lead está online e pronto para receber dados via POST.",
    timestamp: new Date().toString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// Função para teste/depuração que pode ser executada manualmente no Apps Script
function testFunctionality() {
  const testData = {
    formType: 'lead',
    nome: 'Teste Automático',
    telefone: '(82) 99999-9999',
    instagram: '@teste.automático',
    interesse: 'Lançamento de produtos',
    statusLead: 'Novo',
    dataLembrete: '10/04/25',
    motivoLembrete: 'Testar funcionamento automático',
    observacoes: 'Teste automático do sistema'
  };
  
  const mockEvent = {
    parameter: {
      data: JSON.stringify(testData)
    }
  };
  
  const result = doPost(mockEvent);
  Logger.log("Resultado do teste: " + result.getContent());
}
