
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogService } from "@/services/LogService";

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Verificar se está autenticado
    const auth = localStorage.getItem("deltaAuthenticated");
    
    if (auth === "true") {
      // Se autenticado, redirecionar para o dashboard
      LogService.info("Usuário autenticado, redirecionando para o dashboard");
      navigate("/dashboard");
    } else {
      // Se não estiver autenticado, redirecionar para a página de login
      LogService.info("Usuário não autenticado, redirecionando para o login");
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-delta-50 to-delta-100 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg text-delta-700">Redirecionando...</h2>
      </div>
    </div>
  );
};

export default Index;
