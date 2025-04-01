
/**
 * Script para receber dados da aplicação web e salvar em uma planilha Google.
 * 
 * Este script deve ser implementado no Apps Script da sua planilha Google
 * e depois publicado como aplicativo da web para receber dados de formulários.
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
    
    // Determinar qual aba/planilha usar com base nos dados recebidos
    let sheetName = "Cliente"; // Padrão
    
    if (data.formType === "lead") {
      sheetName = "Lead";
    } else if (data.formType === "cliente") {
      sheetName = "Cliente";
    }
    
    // Obter a planilha ativa
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Verificar se a aba existe, se não, criar uma nova
    let sheet;
    try {
      sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        // Criar nova aba se não existir
        sheet = ss.insertSheet(sheetName);
        
        // Configurar cabeçalhos com base no tipo de formulário
        if (sheetName === "Lead") {
          sheet.appendRow([
            "nome", "telefone", "instagram", "interesse", 
            "statusLead", "dataLembrete", "motivoLembrete", 
            "observacoes", "dataRegistro"
          ]);
        } else {
          sheet.appendRow([
            "nome", "cpf", "telefone", "genero", "linha", "tipo", 
            "cor", "tamanho", "valor", "formaPagamento", "parcelamento", 
            "jurosAplicado", "cupom", "localizacao", "frete", "dataPagamento", 
            "dataEntrega", "valorTotal", "valorParcela", "datasPagamento", "observacao", "dataRegistro"
          ]);
        }
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
    
    // Preparar a linha de dados para inserção com base no tipo de formulário
    let rowData = [];
    
    if (sheetName === "Lead") {
      rowData = [
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
    } else {
      rowData = [
        data.nome || "",
        data.cpf || "",
        data.telefone || "",
        data.genero || "",
        data.linha || "",
        data.tipo || "",
        data.cor || "",
        data.tamanho || "",
        data.valor || "",
        data.formaPagamento || "",
        data.parcelamento || "",
        data.jurosAplicado || "",
        data.cupom || "",
        data.localizacao || "",
        data.frete || "",
        data.dataPagamento || "",
        data.dataEntrega || "",
        data.valorTotal || "",
        data.valorParcela || "",
        data.datasPagamento || "",
        data.observacao || "",
        formattedTimestamp
      ];
    }
    
    // Adicionar os dados à planilha
    sheet.appendRow(rowData);
    
    // Retornar uma resposta de sucesso
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Dados salvos com sucesso na planilha!",
      sheetName: sheetName
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
    message: "O serviço está online e pronto para receber dados via POST."
  })).setMimeType(ContentService.MimeType.JSON);
}
