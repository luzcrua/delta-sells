
/**
 * Script para receber dados da aplicação web e salvar na planilha Cliente.
 * 
 * Este script deve ser implementado no Apps Script da planilha Cliente
 * e depois publicado como aplicativo da web para receber dados de formulários.
 * 
 * IMPORTANTE: Cole este código no Apps Script da planilha:
 * https://docs.google.com/spreadsheets/d/13DHwYtX13t6CJ3Fg5mMmPpNHT8rZt7Cio3JwB04ipHY/edit?gid=0#gid=0
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
    if (data.formType !== 'cliente') {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Tipo de formulário incorreto. Este endpoint é apenas para dados de clientes."
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Obter a planilha ativa
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Verificar se a aba existe, se não, criar uma nova
    let sheet;
    try {
      sheet = ss.getSheetByName("Cliente");
      if (!sheet) {
        // Criar nova aba se não existir
        sheet = ss.insertSheet("Cliente");
        
        // Configurar cabeçalhos
        sheet.appendRow([
          "nome", "cpf", "telefone", "genero", "linha", "tipo", 
          "cor", "tamanho", "valor", "formaPagamento", "parcelamento", 
          "cupom", "nomeCupom", "localizacao", "frete", "dataPagamento", 
          "dataEntrega", "valorTotal", "valorParcela", "datasPagamento", "observacao", "dataRegistro"
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
      data.cpf || "",
      data.telefone || "",
      data.genero || "",
      data.linha || "",
      data.tipo || "",
      data.cor || "",
      data.tamanho || "",
      data.valor || "",
      data.formaPagamento || "",
      data.parcelamento || "Sem parcelamento",
      data.cupom || "Sem desconto",
      data.nomeCupom || "",
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
    
    // Encontrar a próxima linha vazia na planilha
    const lastRow = sheet.getLastRow();
    const startRow = lastRow + 1;
    
    // Adicionar os dados à planilha em uma única linha
    sheet.getRange(startRow, 1, 1, rowData.length).setValues([rowData]);
    
    // Retornar uma resposta de sucesso
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Dados do cliente salvos com sucesso na planilha!",
      sheetName: "Cliente",
      row: startRow
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
    message: "O serviço Cliente está online e pronto para receber dados via POST."
  })).setMimeType(ContentService.MimeType.JSON);
}
