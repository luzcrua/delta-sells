import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Info, ExternalLink } from 'lucide-react';
import { LogService } from '@/services/LogService';
import { 
  isWebhookConfigured, 
  testGoogleSheetConnection,
  testPostMethod,
  diagnoseAppsScriptSetup
} from '@/services/GoogleSheetsService';
import { GOOGLE_SHEETS_URL, GOOGLE_SHEET_VIEW_URL } from '@/env';
import AdvancedCORSTest from './AdvancedCORSTest';

const DiagnosticsPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<{
    configured: boolean;
    clienteConnection: boolean | null;
    leadConnection: boolean | null;
    clientePost: boolean | null;
    leadPost: boolean | null;
    issues: string[];
    runDate: string;
    corsErrorCount: number;
    networkErrorCount: number;
  }>({
    configured: false,
    clienteConnection: null,
    leadConnection: null,
    clientePost: null,
    leadPost: null,
    issues: [],
    runDate: '',
    corsErrorCount: 0,
    networkErrorCount: 0
  });

  const runDiagnostics = async () => {
    LogService.info("Iniciando diagnóstico do sistema de envio para Google Sheets");
    
    const configured = isWebhookConfigured();
    const issues = diagnoseAppsScriptSetup();
    const corsErrorCount = LogService.getCorsErrorCount();
    const networkErrorCount = LogService.getNetworkErrorCount();
    
    if (!GOOGLE_SHEETS_URL.CLIENTE) {
      issues.push("A variável de ambiente VITE_GOOGLE_SHEETS_URL_CLIENTE não está configurada no Netlify.");
    }
    
    if (!GOOGLE_SHEETS_URL.LEAD) {
      issues.push("A variável de ambiente VITE_GOOGLE_SHEETS_URL_LEAD não está configurada no Netlify.");
    }
    
    if (!GOOGLE_SHEET_VIEW_URL.CLIENTE) {
      issues.push("A variável de ambiente VITE_GOOGLE_SHEET_VIEW_URL_CLIENTE não está configurada no Netlify.");
    }
    
    if (!GOOGLE_SHEET_VIEW_URL.LEAD) {
      issues.push("A variável de ambiente VITE_GOOGLE_SHEET_VIEW_URL_LEAD não está configurada no Netlify.");
    }
    
    setResults({
      ...results,
      configured,
      issues,
      runDate: new Date().toLocaleString(),
      corsErrorCount,
      networkErrorCount
    });
    
    if (configured) {
      const clienteConnection = await testGoogleSheetConnection('cliente');
      const leadConnection = await testGoogleSheetConnection('lead');
      
      setResults(prev => ({
        ...prev,
        clienteConnection,
        leadConnection,
      }));
      
      const clientePost = await testPostMethod('cliente');
      const leadPost = await testPostMethod('lead');
      
      setResults(prev => ({
        ...prev,
        clientePost,
        leadPost,
      }));
    }
  };
  
  const openGoogleSheet = (type: 'cliente' | 'lead') => {
    const url = type === 'cliente' ? GOOGLE_SHEET_VIEW_URL.CLIENTE : GOOGLE_SHEET_VIEW_URL.LEAD;
    window.open(url, '_blank');
  };
  
  const openAppsScript = (type: 'cliente' | 'lead') => {
    const url = type === 'cliente' ? GOOGLE_SHEETS_URL.CLIENTE : GOOGLE_SHEETS_URL.LEAD;
    
    const scriptIdMatch = url.match(/\/s\/([^\/]+)\/exec/);
    const scriptId = scriptIdMatch ? scriptIdMatch[1] : null;
    
    if (scriptId) {
      const scriptEditorUrl = `https://script.google.com/d/${scriptId}/edit`;
      window.open(scriptEditorUrl, '_blank');
    } else {
      LogService.warn(`Não foi possível extrair ID do script da URL: ${url}`);
      alert(`Não foi possível extrair ID do script da URL. Abra manualmente o Google Sheets e acesse Extensões > Apps Script.`);
    }
  };

  useEffect(() => {
    if (!results.runDate) {
      runDiagnostics();
    }
  }, []);

  return (
    <div className="mb-6">
      {!isOpen ? (
        <Button 
          onClick={() => setIsOpen(true)} 
          variant="outline" 
          className={`w-full ${results.corsErrorCount > 0 ? 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100' : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'}`}
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          {results.corsErrorCount > 0 
            ? `Detectados ${results.corsErrorCount} erros de CORS - Clique para resolver` 
            : "Verificar problemas de conexão com Google Sheets"}
        </Button>
      ) : (
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Diagnóstico de Conexão</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                Fechar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  {results.runDate ? (
                    <p className="text-sm text-gray-500">Última execução: {results.runDate}</p>
                  ) : (
                    <p className="text-sm text-gray-500">Nenhum diagnóstico executado</p>
                  )}
                </div>
                <Button onClick={runDiagnostics} size="sm">
                  <Info className="w-4 h-4 mr-1" />
                  Executar Diagnóstico
                </Button>
              </div>
              
              {results.runDate && (
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="font-medium">Configuração de URLs</span>
                    <Badge variant={results.configured ? "success" : "destructive"}>
                      {results.configured ? "Configurado" : "Não Configurado"}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="font-medium">Erros de CORS Detectados</span>
                    <Badge variant={results.corsErrorCount > 0 ? "destructive" : "success"}>
                      {results.corsErrorCount}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center py-1 border-b">
                    <span className="font-medium">Erros de Rede Detectados</span>
                    <Badge variant={results.networkErrorCount > 0 ? "destructive" : "success"}>
                      {results.networkErrorCount}
                    </Badge>
                  </div>
                  
                  {results.configured && (
                    <>
                      <div className="flex justify-between items-center py-1 border-b">
                        <span className="font-medium">Conexão Cliente</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={results.clienteConnection === null ? "outline" : results.clienteConnection ? "success" : "destructive"}>
                            {results.clienteConnection === null ? "Pendente" : results.clienteConnection ? "OK" : "Falha"}
                          </Badge>
                          <button 
                            onClick={() => openGoogleSheet('cliente')}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center py-1 border-b">
                        <span className="font-medium">Conexão Lead</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={results.leadConnection === null ? "outline" : results.leadConnection ? "success" : "destructive"}>
                            {results.leadConnection === null ? "Pendente" : results.leadConnection ? "OK" : "Falha"}
                          </Badge>
                          <button 
                            onClick={() => openGoogleSheet('lead')}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center py-1 border-b">
                        <span className="font-medium">POST Cliente</span>
                        <Badge variant={results.clientePost === null ? "outline" : results.clientePost ? "success" : "destructive"}>
                          {results.clientePost === null ? "Pendente" : results.clientePost ? "OK" : "Falha"}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center py-1 border-b">
                        <span className="font-medium">POST Lead</span>
                        <Badge variant={results.leadPost === null ? "outline" : results.leadPost ? "success" : "destructive"}>
                          {results.leadPost === null ? "Pendente" : results.leadPost ? "OK" : "Falha"}
                        </Badge>
                      </div>
                    </>
                  )}
                  
                  <AdvancedCORSTest />
                  
                  {results.issues.length > 0 && (
                    <div className="mt-3 pt-2 border-t">
                      <h4 className="font-medium mb-2">Problemas identificados:</h4>
                      <ul className="text-sm space-y-1">
                        {results.issues.map((issue, index) => (
                          <li key={index} className="flex items-start">
                            <AlertCircle className="w-4 h-4 text-amber-600 mr-1 mt-0.5 flex-shrink-0" />
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="mt-3 pt-2 border-t">
                    <h4 className="font-medium mb-2">Solução de problemas de CORS:</h4>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>Verifique se o Apps Script está implantado corretamente como um aplicativo da web.</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>Nas configurações de implantação, certifique-se que "Quem tem acesso" está definido como "Qualquer pessoa, mesmo anônimos".</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>Certifique-se que você está incluindo o código correto em <code>Google_Apps_Script_Code_CLIENTE.js</code> e <code>Google_Apps_Script_Code_LEAD.js</code>.</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>Os códigos Apps Script devem incluir <code>ContentService.setMimeType(ContentService.MimeType.JSON)</code> e os cabeçalhos CORS corretos.</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>Após modificar o código do Apps Script, reimplante-o através de Implantar &gt; Novo implantação.</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-1 mt-0.5 flex-shrink-0" />
                        <span>As URLs em env.ts devem usar o formato correto (terminando com /exec).</span>
                      </li>
                      <li className="flex justify-between items-center pt-2">
                        <span className="text-blue-600">Editar script do Cliente:</span>
                        <Button variant="outline" size="sm" onClick={() => openAppsScript('cliente')}>
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Abrir Editor
                        </Button>
                      </li>
                      <li className="flex justify-between items-center">
                        <span className="text-blue-600">Editar script do Lead:</span>
                        <Button variant="outline" size="sm" onClick={() => openAppsScript('lead')}>
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Abrir Editor
                        </Button>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DiagnosticsPanel;
