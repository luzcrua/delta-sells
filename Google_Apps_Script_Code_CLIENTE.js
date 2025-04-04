
/**
 * Script para receber dados da aplicação web e salvar na planilha Cliente.
 * 
 * Este script deve ser implementado no Apps Script da planilha Cliente
 * e depois publicado como aplicativo da web para receber dados de formulários.
 * 
 * IMPORTANTE: Cole este código no Apps Script da planilha:
 * 
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
    if (data.formType !== 'cliente') {
      return output.setContent(JSON.stringify({
        success: false,
        message: "Tipo de formulário incorreto. Este endpoint é apenas para dados de clientes."
      }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeaders(headers);
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
        
        // Configurar cabeçalhos na ordem especificada
        sheet.appendRow([
          "DIA/HORA", "NOME", "CPF", "TELEFONE", "GÊNERO", "LINHA", "PEÇA", 
          "COR", "TAMANHO", "VALOR", "FORMA DE PAGAMENTO", "PARCELADO?",
          "LOCALIZACAO", "DESCONTO?", "NOME DO CUPOM", "FRETE", "DATA DE PAGAMENTO", 
          "DATA DE ENTREGA", "VALOR TOTAL", "VALOR TOTAL NUMÉRICO", "OBSERVACOES"
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
    
    // Preparar a linha de dados para inserção na ordem correta
    const rowData = [
      formattedTimestamp,                // DIA/HORA
      data.nome || "",                   // NOME
      data.cpf || "",                    // CPF
      data.telefone || "",               // TELEFONE
      data.genero || "",                 // GÊNERO
      data.linha || "",                  // LINHA
      data.tipo || "",                   // PEÇA (tipo)
      data.cor || "",                    // COR
      data.tamanho || "",                // TAMANHO
      data.valor || "",                  // VALOR
      data.formaPagamento || "",         // FORMA DE PAGAMENTO
      data.parcelamento || "Não",        // PARCELADO?
      data.localizacao || "",            // LOCALIZACAO
      data.cupom || "Não",               // DESCONTO?
      data.nomeCupom || "",              // NOME DO CUPOM
      data.frete || "",                  // FRETE
      data.dataPagamento || "",          // DATA DE PAGAMENTO
      data.dataEntrega || "",            // DATA DE ENTREGA
      data.valorTotal || "",             // VALOR TOTAL (texto)
      data.valorTotalNumerico || 0,      // VALOR TOTAL NUMÉRICO
      data.observacao || ""              // OBSERVACOES
    ];
    
    // Log de dados antes de inserir
    Logger.log("Dados a serem inseridos: " + JSON.stringify(rowData));
    
    // Encontrar a próxima linha vazia na planilha
    const lastRow = sheet.getLastRow();
    const startRow = lastRow + 1;
    
    // Adicionar os dados à planilha em uma única linha
    sheet.getRange(startRow, 1, 1, rowData.length).setValues([rowData]);
    
    // Formatar célula do valor numérico como número
    if (data.valorTotalNumerico) {
      try {
        const valorTotalNumericoCell = sheet.getRange(startRow, 20); // Coluna 20 é VALOR TOTAL NUMÉRICO
        valorTotalNumericoCell.setNumberFormat("0.00");
      } catch (formatError) {
        Logger.log("Erro ao formatar célula de valor numérico: " + formatError.toString());
      }
    }
    
    // Log de confirmação após inserção
    Logger.log("Dados adicionados à planilha com sucesso na linha: " + startRow);
    
    // Retornar uma resposta de sucesso
    return output.setContent(JSON.stringify({
      success: true,
      message: "Dados do cliente salvos com sucesso na planilha!",
      sheetName: "Cliente",
      row: startRow
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
    message: "O serviço Cliente está online e pronto para receber dados via POST."
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
