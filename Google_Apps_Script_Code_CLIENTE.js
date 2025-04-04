
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
    // Log inicial para depuração
    Logger.log("Recebendo solicitação POST para CLIENTE: " + JSON.stringify(e.parameter));
    
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
    if (data.formType !== 'cliente') {
      Logger.log("Erro: Tipo de formulário incorreto: " + data.formType);
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Tipo de formulário incorreto. Este endpoint é apenas para dados de clientes."
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Obter a planilha ativa
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log("Acessando planilha: " + ss.getName());
    
    // Verificar se a aba existe, se não, criar uma nova
    let sheet;
    try {
      sheet = ss.getSheetByName("Cliente");
      if (!sheet) {
        // Criar nova aba se não existir
        Logger.log("Aba Cliente não encontrada. Criando nova aba...");
        sheet = ss.insertSheet("Cliente");
        
        // Configurar cabeçalhos na ordem especificada
        sheet.appendRow([
          "DIA/HORA", "NOME", "CPF", "TELEFONE", "GÊNERO", "LINHA", "PEÇA", 
          "COR", "TAMANHO", "VALOR", "FORMA DE PAGAMENTO", "PARCELADO?",
          "LOCALIZACAO", "DESCONTO?", "NOME DO CUPOM", "FRETE", "DATA DE PAGAMENTO", 
          "DATA DE ENTREGA", "VALOR TOTAL", "OBSERVACOES"
        ]);
        Logger.log("Cabeçalhos configurados na aba Cliente");
      } else {
        Logger.log("Aba Cliente encontrada");
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
      data.valorTotal || "",             // VALOR TOTAL
      data.observacao || ""              // OBSERVACOES
    ];
    
    Logger.log("Dados preparados para inserção: " + JSON.stringify(rowData));
    
    // Encontrar a próxima linha vazia na planilha
    const lastRow = sheet.getLastRow();
    const startRow = lastRow + 1;
    
    // Adicionar os dados à planilha em uma única linha
    sheet.getRange(startRow, 1, 1, rowData.length).setValues([rowData]);
    Logger.log("Dados inseridos na linha " + startRow);
    
    // Retornar uma resposta de sucesso
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Dados do cliente salvos com sucesso na planilha!",
      sheetName: "Cliente",
      row: startRow,
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
    message: "O serviço Cliente está online e pronto para receber dados via POST.",
    timestamp: new Date().toString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// Função para teste/depuração que pode ser executada manualmente no Apps Script
function testFunctionality() {
  const testData = {
    formType: 'cliente',
    nome: 'Teste Automático',
    telefone: '(82) 99999-9999',
    genero: 'Masculino',
    linha: 'Oversized',
    tipo: 'Camisa Normal',
    cor: 'PRETO(A)',
    tamanho: 'M',
    valor: 'R$ 150,00',
    formaPagamento: 'PIX',
    parcelamento: 'Sem parcelamento',
    valorTotal: 'R$ 165,00',
    frete: '15,00',
    dataPagamento: '04/04/25',
    dataEntrega: '10/04/25',
    observacao: 'Teste automático do sistema'
  };
  
  const mockEvent = {
    parameter: {
      data: JSON.stringify(testData)
    }
  };
  
  const result = doPost(mockEvent);
  Logger.log("Resultado do teste: " + result.getContent());
}
