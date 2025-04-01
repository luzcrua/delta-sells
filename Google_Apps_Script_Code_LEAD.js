
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
    // Verificar se há dados na solicitação
    if (!e || !e.parameter || !e.parameter.data) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Nenhum dado recebido."
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Analisar os dados JSON da solicitação
    const data = JSON.parse(e.parameter.data);
    
    // Verificar se é o tipo correto de formulário
    if (data.formType !== 'lead') {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Tipo de formulário incorreto. Este endpoint é apenas para dados de leads."
      })).setMimeType(ContentService.MimeType.JSON);
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
    
    // Adicionar os dados à planilha
    sheet.appendRow(rowData);
    
    // Retornar uma resposta de sucesso
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Dados do lead salvos com sucesso na planilha!",
      sheetName: "Lead"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Em caso de erro, retornar uma resposta de erro
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Erro ao processar dados: " + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Função que será chamada quando o Apps Script receber uma solicitação GET
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: "O serviço Lead está online e pronto para receber dados via POST."
  })).setMimeType(ContentService.MimeType.JSON);
}
