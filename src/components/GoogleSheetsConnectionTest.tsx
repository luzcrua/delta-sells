
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader, Check, AlertCircle, RefreshCw, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { GOOGLE_SHEETS_URL, GOOGLE_SHEET_VIEW_URL } from "@/env";
import { 
  testGoogleSheetConnection, 
  testPostMethod, 
  diagnoseAppsScriptSetup
} from "@/services/GoogleSheetsService";

const GoogleSheetsConnectionTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [clienteConnected, setClienteConnected] = useState<boolean | null>(null);
  const [leadConnected, setLeadConnected] = useState<boolean | null>(null);
  const [clientePostWorking, setClientePostWorking] = useState<boolean | null>(null);
  const [leadPostWorking, setLeadPostWorking] = useState<boolean | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);

  // Função para testar todas as conexões
  const runDiagnostics = async () => {
    setIsLoading(true);
    setClienteConnected(null);
    setLeadConnected(null);
    setClientePostWorking(null);
    setLeadPostWorking(null);
    
    try {
      // Verificar configuração básica
      const setupIssues = diagnoseAppsScriptSetup();
      setIssues(setupIssues);
      
      if (setupIssues.length > 0) {
        toast({
          title: "Problemas de configuração encontrados",
          description: "Verifique as variáveis de ambiente no Netlify.",
          variant: "destructive",
        });
      }
      
      // Testar conexão GET Cliente
      const clienteGet = await testGoogleSheetConnection('cliente');
      setClienteConnected(clienteGet);
      
      // Testar conexão GET Lead
      const leadGet = await testGoogleSheetConnection('lead');
      setLeadConnected(leadGet);
      
      // Se a conexão GET for bem-sucedida, testar POST
      if (clienteGet) {
        const clientePost = await testPostMethod('cliente');
        setClientePostWorking(clientePost);
      }
      
      if (leadGet) {
        const leadPost = await testPostMethod('lead');
        setLeadPostWorking(leadPost);
      }
      
      toast({
        title: "Diagnóstico concluído",
        description: clienteGet && leadGet ? 
          "Conexão com as planilhas parece OK." : 
          "Problemas encontrados na conexão com as planilhas.",
        variant: clienteGet && leadGet ? "default" : "destructive",
      });
      
    } catch (error) {
      console.error("Erro ao executar diagnóstico:", error);
      toast({
        title: "Erro ao executar diagnóstico",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Verificar URLs configuradas
  const clienteUrlConfigured = Boolean(GOOGLE_SHEETS_URL.CLIENTE);
  const leadUrlConfigured = Boolean(GOOGLE_SHEETS_URL.LEAD);
  const clienteViewUrlConfigured = Boolean(GOOGLE_SHEET_VIEW_URL.CLIENTE);
  const leadViewUrlConfigured = Boolean(GOOGLE_SHEET_VIEW_URL.LEAD);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Diagnóstico de Conexão com Google Sheets</span>
          <Badge variant={isLoading ? "outline" : expanded ? "secondary" : "outline"} className="ml-2">
            {isLoading ? "Testando..." : "Diagnóstico"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Verifique se a conexão com as planilhas do Google está funcionando corretamente.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {issues.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium">Problemas de configuração encontrados:</p>
              <ul className="list-disc pl-5 mt-1 text-sm">
                {issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-md p-4">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              Planilha Cliente
              {clienteConnected === true && <Check className="h-4 w-4 text-green-500" />}
              {clienteConnected === false && <AlertCircle className="h-4 w-4 text-red-500" />}
            </h3>
            
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">URL do App Script:</span>{" "}
                {clienteUrlConfigured ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Configurado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700">
                    Não configurado
                  </Badge>
                )}
              </p>
              
              <p>
                <span className="font-medium">URL de Visualização:</span>{" "}
                {clienteViewUrlConfigured ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Configurado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700">
                    Não configurado
                  </Badge>
                )}
              </p>
              
              <p>
                <span className="font-medium">Conexão GET:</span>{" "}
                {clienteConnected === null ? (
                  <Badge variant="outline">Não testado</Badge>
                ) : clienteConnected ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Funcionando
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700">
                    Falha
                  </Badge>
                )}
              </p>
              
              <p>
                <span className="font-medium">Método POST:</span>{" "}
                {clientePostWorking === null ? (
                  <Badge variant="outline">Não testado</Badge>
                ) : clientePostWorking ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Funcionando
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700">
                    Falha
                  </Badge>
                )}
              </p>
            </div>
          </div>
          
          <div className="border rounded-md p-4">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              Planilha Lead
              {leadConnected === true && <Check className="h-4 w-4 text-green-500" />}
              {leadConnected === false && <AlertCircle className="h-4 w-4 text-red-500" />}
            </h3>
            
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">URL do App Script:</span>{" "}
                {leadUrlConfigured ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Configurado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700">
                    Não configurado
                  </Badge>
                )}
              </p>
              
              <p>
                <span className="font-medium">URL de Visualização:</span>{" "}
                {leadViewUrlConfigured ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Configurado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700">
                    Não configurado
                  </Badge>
                )}
              </p>
              
              <p>
                <span className="font-medium">Conexão GET:</span>{" "}
                {leadConnected === null ? (
                  <Badge variant="outline">Não testado</Badge>
                ) : leadConnected ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Funcionando
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700">
                    Falha
                  </Badge>
                )}
              </p>
              
              <p>
                <span className="font-medium">Método POST:</span>{" "}
                {leadPostWorking === null ? (
                  <Badge variant="outline">Não testado</Badge>
                ) : leadPostWorking ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Funcionando
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700">
                    Falha
                  </Badge>
                )}
              </p>
            </div>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <Accordion type="single" collapsible className="w-full" value={expanded ? "item-1" : undefined} onValueChange={(val) => setExpanded(val === "item-1")}>
          <AccordionItem value="item-1">
            <AccordionTrigger>Mais informações e soluções</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium">Configurações de Variáveis de Ambiente</h4>
                  <p className="text-muted-foreground mt-1">
                    As seguintes variáveis de ambiente devem estar configuradas no Netlify:
                  </p>
                  <ul className="list-disc pl-5 mt-1">
                    <li>VITE_GOOGLE_SHEETS_URL_CLIENTE</li>
                    <li>VITE_GOOGLE_SHEETS_URL_LEAD</li>
                    <li>VITE_GOOGLE_SHEET_VIEW_URL_CLIENTE</li>
                    <li>VITE_GOOGLE_SHEET_VIEW_URL_LEAD</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium">Resolução de Problemas Comuns</h4>
                  <ul className="list-disc pl-5 mt-1">
                    <li>Verifique se o App Script está publicado como aplicativo da web.</li>
                    <li>Verifique se as permissões do App Script estão definidas para "Qualquer pessoa, mesmo anônima".</li>
                    <li>Certifique-se de que a URL termina com "/exec".</li>
                    <li>Se a planilha estiver sendo visualizada corretamente, mas os dados não são enviados, copie e cole novamente o código do App Script.</li>
                  </ul>
                </div>
                
                <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                  <div className="flex gap-2">
                    <Info className="h-5 w-5 text-amber-700 flex-shrink-0" />
                    <p className="text-amber-800">
                      Se você continuar tendo problemas com o envio de dados, pode usar a opção "Enviar via WhatsApp" como alternativa temporária.
                    </p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          disabled={isLoading}
          onClick={() => {
            window.location.reload();
          }}
        >
          Recarregar Página
        </Button>
        
        <Button 
          onClick={runDiagnostics} 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              Testando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Testar Conexão
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default GoogleSheetsConnectionTest;
