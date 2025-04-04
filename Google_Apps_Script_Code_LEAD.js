
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
    // Ativar CORS - permite acesso de qualquer origem
    var output = ContentService.createTextOutput();
    var headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };
    
    // Para solicitações OPTIONS (pré-voo)
    if (e && e.parameter && e.parameter.method === 'OPTIONS') {
      return output.setContent(JSON.stringify({"status": "ok"}))
                   .setMimeType(ContentService.MimeType.JSON)
                   .setHeaders(headers);
    }
    
    // Verificar se há dados na solicitação
    if (!e || !e.parameter || !e.parameter.data) {
      return output.setContent(JSON.stringify({
        success: false,
        message: "Nenhum dado recebido."
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
    }
    
    // Analisar os dados JSON da solicitação
    const data = JSON.parse(e.parameter.data);
    
    // Log para debug
    Logger.log("Dados recebidos: " + JSON.stringify(data));
    
    // Verificar se é o tipo correto de formulário
    if (data.formType !== 'lead') {
      return output.setContent(JSON.stringify({
        success: false,
        message: "Tipo de formulário incorreto. Este endpoint é apenas para dados de leads."
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
    }
    
    // Obter a planilha ativa
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Verificar se a aba existe, se não, criar uma nova
    let sheet;
    try {
      sheet = ss.getSheetByName("Lead");
      if (!sheet) {
        // Criar nova aba se não existir
        sheet = ss.insertSheet("Lead");
        
        // Configurar cabeçalhos
        sheet.appendRow([
          "nome", "telefone", "instagram", "interesse", 
          "statusLead", "dataLembrete", "motivoLembrete", 
          "observacoes", "dataRegistro"
        ]);
      }
    } catch (err) {
      Logger.log("Erro ao acessar a planilha: " + err.toString());
      return output.setContent(JSON.stringify({
        success: false,
        message: "Erro ao acessar a planilha: " + err.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
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
    
    // Adicionar os dados à planilha
    sheet.appendRow(rowData);
    
    // Log para confirmar que os dados foram adicionados
    Logger.log("Dados adicionados à planilha com sucesso!");
    
    // Retornar uma resposta de sucesso
    return output.setContent(JSON.stringify({
      success: true,
      message: "Dados do lead salvos com sucesso na planilha!",
      sheetName: "Lead"
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders(headers);
    
  } catch (error) {
    // Log do erro
    Logger.log("Erro ao processar dados: " + error.toString());
    
    // Em caso de erro, retornar uma resposta de erro
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Erro ao processar dados: " + error.toString()
    }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    });
  }
}

// Função que será chamada quando o Apps Script receber uma solicitação GET
// Também serve para lidar com requisições OPTIONS de pré-voo CORS
function doGet(e) {
  var output = ContentService.createTextOutput();
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  return output.setContent(JSON.stringify({
    success: true,
    message: "O serviço Lead está online e pronto para receber dados via POST."
  }))
  .setMimeType(ContentService.MimeType.JSON)
  .setHeaders(headers);
}

// Função para lidar com requisições OPTIONS (pré-voo)
function doOptions(e) {
  var output = ContentService.createTextOutput();
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };
  
  return output.setContent(JSON.stringify({"status": "ok"}))
               .setMimeType(ContentService.MimeType.JSON)
               .setHeaders(headers);
}
