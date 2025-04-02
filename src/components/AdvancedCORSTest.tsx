
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ChevronDown, 
  ChevronUp, 
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { LogService } from '@/services/LogService';
import { GOOGLE_SHEETS_URL } from '@/env';
import { 
  testGoogleSheetConnection, 
  testPostMethod 
} from '@/services/GoogleSheetsService';

const AdvancedCORSTest = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{
    fetchGet: boolean | null;
    fetchPostNormal: boolean | null;
    fetchPostNoCache: boolean | null;
    fetchPostNoCors: boolean | null;
    xhrPost: boolean | null;
    iframeMethod: boolean | null;
    lastRunTime: string | null;
  }>({
    fetchGet: null,
    fetchPostNormal: null,
    fetchPostNoCache: null,
    fetchPostNoCors: null,
    xhrPost: null,
    iframeMethod: null,
    lastRunTime: null
  });
  
  const runTests = async () => {
    setIsRunning(true);
    setResults({
      fetchGet: null,
      fetchPostNormal: null,
      fetchPostNoCache: null,
      fetchPostNoCors: null,
      xhrPost: null,
      iframeMethod: null,
      lastRunTime: new Date().toLocaleString()
    });
    
    try {
      // Teste de GET (mais básico)
      const fetchGet = await testFetchGet();
      setResults(prev => ({ ...prev, fetchGet }));
      
      // Testes POST com diferentes configurações
      const fetchPostNormal = await testFetchPostNormal();
      setResults(prev => ({ ...prev, fetchPostNormal }));
      
      const fetchPostNoCache = await testFetchPostNoCache();
      setResults(prev => ({ ...prev, fetchPostNoCache }));
      
      const fetchPostNoCors = await testFetchPostNoCors();
      setResults(prev => ({ ...prev, fetchPostNoCors }));
      
      // Teste XHR (alternativo ao fetch)
      const xhrPost = await testXhrPost();
      setResults(prev => ({ ...prev, xhrPost }));
      
      // Teste de iframe (geralmente contorna CORS)
      const iframeMethod = await testIframeMethod();
      setResults(prev => ({ ...prev, iframeMethod }));
    } catch (error) {
      LogService.error("Erro durante testes de CORS:", error);
    } finally {
      setIsRunning(false);
    }
  };
  
  const testFetchGet = async (): Promise<boolean> => {
    try {
      const result = await testGoogleSheetConnection('cliente');
      return result;
    } catch (error) {
      LogService.error("Teste fetchGet falhou:", error);
      return false;
    }
  };
  
  const testFetchPostNormal = async (): Promise<boolean> => {
    try {
      const url = GOOGLE_SHEETS_URL.CLIENTE;
      if (!url) return false;
      
      const testData = {
        formType: 'cliente',
        test: true,
        message: "Teste fetch POST normal"
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          data: JSON.stringify(testData)
        }),
      });
      
      return response.ok;
    } catch (error) {
      LogService.error("Teste fetchPostNormal falhou:", error);
      return false;
    }
  };
  
  const testFetchPostNoCache = async (): Promise<boolean> => {
    try {
      const url = GOOGLE_SHEETS_URL.CLIENTE;
      if (!url) return false;
      
      const testData = {
        formType: 'cliente',
        test: true,
        message: "Teste fetch POST no-cache"
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache, no-store, max-age=0'
        },
        body: new URLSearchParams({
          data: JSON.stringify(testData)
        }),
      });
      
      return response.ok;
    } catch (error) {
      LogService.error("Teste fetchPostNoCache falhou:", error);
      return false;
    }
  };
  
  const testFetchPostNoCors = async (): Promise<boolean> => {
    try {
      const url = GOOGLE_SHEETS_URL.CLIENTE;
      if (!url) return false;
      
      const testData = {
        formType: 'cliente',
        test: true,
        message: "Teste fetch POST no-cors"
      };
      
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          data: JSON.stringify(testData)
        }),
      });
      
      // Com no-cors não conseguimos verificar o status da resposta,
      // então assumimos que foi bem-sucedido se não lançou erro
      return true;
    } catch (error) {
      LogService.error("Teste fetchPostNoCors falhou:", error);
      return false;
    }
  };
  
  const testXhrPost = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        const url = GOOGLE_SHEETS_URL.CLIENTE;
        if (!url) {
          resolve(false);
          return;
        }
        
        const testData = {
          formType: 'cliente',
          test: true,
          message: "Teste XHR POST"
        };
        
        const xhr = new XMLHttpRequest();
        
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        
        xhr.onload = function() {
          resolve(xhr.status >= 200 && xhr.status < 400);
        };
        
        xhr.onerror = function() {
          LogService.error("XHR request failed");
          resolve(false);
        };
        
        const body = new URLSearchParams({
          data: JSON.stringify(testData)
        }).toString();
        
        xhr.send(body);
      } catch (error) {
        LogService.error("Teste XHR falhou:", error);
        resolve(false);
      }
    });
  };
  
  const testIframeMethod = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        const url = GOOGLE_SHEETS_URL.CLIENTE;
        if (!url) {
          resolve(false);
          return;
        }
        
        // Remover iframe anterior se existir
        const oldIframe = document.getElementById('testFrame');
        if (oldIframe) {
          oldIframe.remove();
        }
        
        // Criar novo iframe
        const iframe = document.createElement('iframe');
        iframe.id = 'testFrame';
        iframe.name = 'testFrame';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        // Criar formulário 
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = url;
        form.target = 'testFrame';
        form.style.display = 'none';
        
        const testData = {
          formType: 'cliente',
          test: true,
          message: "Teste iframe"
        };
        
        // Adicionar dados ao formulário
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'data';
        input.value = JSON.stringify(testData);
        form.appendChild(input);
        
        document.body.appendChild(form);
        
        // Monitorar resposta
        let isResolved = false;
        
        iframe.onload = () => {
          if (!isResolved) {
            isResolved = true;
            LogService.info("Iframe carregado com sucesso");
            resolve(true);
            
            // Limpeza após um tempo
            setTimeout(() => {
              form.remove();
            }, 1000);
          }
        };
        
        // Timeout para considerar erro
        setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            LogService.warn("Timeout do iframe");
            resolve(false);
          }
        }, 5000);
        
        // Submeter formulário
        form.submit();
        
      } catch (error) {
        LogService.error("Teste iframe falhou:", error);
        resolve(false);
      }
    });
  };
  
  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <RefreshCw size={16} className="text-gray-400" />;
    return status ? 
      <CheckCircle2 size={16} className="text-green-500" /> : 
      <AlertCircle size={16} className="text-red-500" />;
  };
  
  return (
    <Card className="mt-4">
      <CardHeader className="pb-3 pt-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium flex items-center">
            <Activity size={16} className="mr-2" />
            Diagnóstico Avançado de CORS
          </CardTitle>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground mb-3">
            Este teste executa diferentes métodos para tentar contornar as restrições de CORS.
            Execute-o para identificar o melhor método de envio de dados.
          </p>
          
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between border p-2 rounded">
                <span>GET Request</span>
                {getStatusIcon(results.fetchGet)}
              </div>
              <div className="flex items-center justify-between border p-2 rounded">
                <span>POST Normal</span>
                {getStatusIcon(results.fetchPostNormal)}
              </div>
              <div className="flex items-center justify-between border p-2 rounded">
                <span>POST No-Cache</span>
                {getStatusIcon(results.fetchPostNoCache)}
              </div>
              <div className="flex items-center justify-between border p-2 rounded">
                <span>POST No-CORS</span>
                {getStatusIcon(results.fetchPostNoCors)}
              </div>
              <div className="flex items-center justify-between border p-2 rounded">
                <span>XMLHttpRequest</span>
                {getStatusIcon(results.xhrPost)}
              </div>
              <div className="flex items-center justify-between border p-2 rounded">
                <span>Iframe Method</span>
                {getStatusIcon(results.iframeMethod)}
              </div>
            </div>
            
            {results.lastRunTime && (
              <p className="text-xs text-muted-foreground mt-2">
                Última execução: {results.lastRunTime}
              </p>
            )}
            
            <Button 
              onClick={runTests} 
              className="w-full mt-2" 
              size="sm"
              disabled={isRunning}
            >
              {isRunning ? "Executando testes..." : "Executar Testes de CORS"}
            </Button>
          </div>
          
          <div className="mt-4 border-t pt-3">
            <h4 className="text-xs font-medium mb-2">Método recomendado:</h4>
            <p className="text-xs">
              {getRecommendation(results)}
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

/**
 * Gera uma recomendação baseada nos resultados dos testes
 */
function getRecommendation(results: {
  fetchGet: boolean | null;
  fetchPostNormal: boolean | null;
  fetchPostNoCache: boolean | null;
  fetchPostNoCors: boolean | null;
  xhrPost: boolean | null;
  iframeMethod: boolean | null;
  lastRunTime: string | null;
}) {
  if (!results.lastRunTime) {
    return "Execute os testes para obter uma recomendação.";
  }
  
  // Se o método normal de POST funciona, é o melhor
  if (results.fetchPostNormal) {
    return "O método padrão de POST está funcionando corretamente. Use a configuração atual.";
  }
  
  // Se o iframe funciona, é a segunda melhor opção
  if (results.iframeMethod) {
    return "Use o método de iframe para contornar as restrições de CORS. Esta é uma solução confiável.";
  }
  
  // Se POST no-cors funciona
  if (results.fetchPostNoCors) {
    return "Use o modo 'no-cors' para enviar dados. Note que você não poderá verificar a resposta do servidor.";
  }
  
  // Se XHR funciona
  if (results.xhrPost) {
    return "Use XMLHttpRequest em vez de fetch para enviar dados.";
  }
  
  // Se apenas GET funciona
  if (results.fetchGet) {
    return "Apenas requisições GET estão funcionando. Verifique se o Apps Script está configurado para aceitar POST.";
  }
  
  // Se nada funciona
  return "Nenhum método funciona. Verifique a configuração do Apps Script e certifique-se que ele está publicado como 'Qualquer pessoa, mesmo anônimos'.";
}

export default AdvancedCORSTest;
