
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut, Users, Contact, AlertCircle, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import CustomerForm from "@/components/CustomerForm";
import LeadForm from "@/components/LeadForm";
import DiagnosticsPanel from "@/components/DiagnosticsPanel";
import AdvancedCORSTest from "@/components/AdvancedCORSTest";
import GoogleSheetsConnectionTest from "@/components/GoogleSheetsConnectionTest";
import { isWebhookConfigured } from "@/services/GoogleSheetsService";
import { GOOGLE_SHEETS_URL, DEBUG_MODE } from "@/env";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showConnectionTest, setShowConnectionTest] = useState(false);
  const isConfigured = isWebhookConfigured();

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("lastAuthTime");
    localStorage.removeItem("lastAuthExpiry");
    toast({
      title: "Desconectado",
      description: "Você saiu do sistema com sucesso."
    });
    navigate("/");
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-delta-800">DELTA SELLS CLIENTS</h1>
          <p className="text-delta-600">Gerencie clientes e leads em um só lugar</p>
        </div>
        
        <div className="flex space-x-2">
          {DEBUG_MODE && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConnectionTest(!showConnectionTest)}
              className="hidden md:flex items-center gap-1.5"
            >
              {showConnectionTest ? "Ocultar Teste" : "Teste de Conexão"}
              {!isConfigured && <AlertCircle className="h-4 w-4 text-amber-500" />}
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="hidden md:flex items-center gap-1.5"
          >
            {showDiagnostics ? "Ocultar Diagnóstico" : "Diagnóstico"}
            {!isConfigured && <AlertCircle className="h-4 w-4 text-amber-500" />}
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-1.5"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
      
      {!isConfigured && (
        <Card className="mb-6 bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex gap-3 items-start">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-amber-800">Aviso: Configuração Incompleta</h3>
                <p className="text-sm text-amber-700 mt-1">
                  As URLs do Google Sheets não estão configuradas nas variáveis de ambiente. 
                  {DEBUG_MODE ? (
                    <span> Configure as variáveis <strong>VITE_GOOGLE_SHEETS_URL_CLIENTE</strong> e <strong>VITE_GOOGLE_SHEETS_URL_LEAD</strong> no arquivo .env ou nas variáveis de ambiente do Netlify.</span>
                  ) : (
                    <span> Entre em contato com o administrador do sistema.</span>
                  )}
                </p>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDiagnostics(true)}
                  className="mt-2 bg-white"
                >
                  Ver Diagnóstico
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {showConnectionTest && (
        <div className="mb-6">
          <GoogleSheetsConnectionTest />
          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConnectionTest(false)}
              className="flex items-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Ocultar Teste de Conexão
            </Button>
          </div>
        </div>
      )}
      
      {showDiagnostics && (
        <div className="mb-6">
          <DiagnosticsPanel />
          {DEBUG_MODE && <AdvancedCORSTest />}
          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDiagnostics(false)}
              className="flex items-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Ocultar Diagnóstico
            </Button>
          </div>
        </div>
      )}

      <Tabs defaultValue="cliente" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cliente" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Registro de Cliente
          </TabsTrigger>
          <TabsTrigger value="lead" className="flex items-center gap-2">
            <Contact className="h-4 w-4" />
            Registro de Lead
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cliente" className="space-y-4">
          <div className="grid gap-4">
            <CustomerForm />
          </div>
        </TabsContent>

        <TabsContent value="lead" className="space-y-4">
          <div className="grid gap-4">
            <LeadForm />
          </div>
        </TabsContent>
      </Tabs>

      <Separator className="my-6" />

      <footer className="text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} DELTA SELLS CLIENTS. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default Dashboard;
