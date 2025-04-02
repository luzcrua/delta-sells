
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogService } from "@/services/LogService";
import { isWebhookConfigured } from "@/services/GoogleSheetsService";
import LeadForm from "@/components/LeadForm";
import CustomerForm from "@/components/CustomerForm";
import DiagnosticsPanel from "@/components/DiagnosticsPanel";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("cliente");
  const [isConfigured, setIsConfigured] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Verificar se está autenticado
    const auth = localStorage.getItem("deltaAuthenticated");
    if (auth !== "true") {
      LogService.warn("Tentativa de acesso não autorizado ao Dashboard");
      navigate("/");
      return;
    }
    
    // Verificar se a URL do webhook está configurada
    const configured = isWebhookConfigured();
    setIsConfigured(configured);
    LogService.info(`Dashboard - Webhook configurado: ${configured}`);
    
    // Log de inicialização da página
    LogService.info("Página Dashboard carregada com sucesso");
  }, [navigate]);

  const handleLogout = () => {
    LogService.info("Usuário realizou logout");
    localStorage.removeItem("deltaAuthenticated");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-delta-50 to-delta-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8 relative">
          <div className="absolute top-0 right-0">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-delta-700 hover:text-delta-900"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-delta-950 mb-2">
            DELTA SELLS CLIENTS
          </h1>
          <p className="text-delta-700 text-lg">
            Cadastro de clientes e registro de vendas
          </p>
          
          {!isConfigured && (
            <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md">
              <p className="text-sm">
                ⚠️ A URL do App Script não está configurada no arquivo env.ts. Configure o arquivo para habilitar o envio direto para o Google Sheets.
              </p>
            </div>
          )}
          
          {/* Painel de diagnóstico */}
          <div className="mt-4">
            <DiagnosticsPanel />
          </div>
        </header>

        <div className="flex justify-center mb-6 border-b border-delta-200">
          <button
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "cliente"
                ? "text-delta-800 border-b-2 border-delta-600"
                : "text-delta-500 hover:text-delta-700"
            }`}
            onClick={() => {
              setActiveTab("cliente");
              LogService.info("Mudança de aba: Cliente");
            }}
          >
            CLIENTE
          </button>
          <button
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === "lead"
                ? "text-delta-800 border-b-2 border-delta-600"
                : "text-delta-500 hover:text-delta-700"
            }`}
            onClick={() => {
              setActiveTab("lead");
              LogService.info("Mudança de aba: Lead");
            }}
          >
            LEAD
          </button>
        </div>

        <div className={activeTab === "cliente" ? "block" : "hidden"}>
          <CustomerForm />
        </div>

        <div className={activeTab === "lead" ? "block" : "hidden"}>
          <LeadForm />
        </div>

        <footer className="mt-8 text-center text-delta-700 text-sm">
          <p>© 2025 DELTA SELLS. Todos os direitos reservados. Idealizado por Arinelson Santos</p>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;
