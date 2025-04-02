
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ACCESS_PASSWORD } from "@/env";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogService } from "@/services/LogService";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

const Login = () => {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Verificar se já está autenticado no localStorage
  useEffect(() => {
    const auth = localStorage.getItem("deltaAuthenticated");
    if (auth === "true") {
      setIsAuthenticated(true);
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password === ACCESS_PASSWORD) {
      // Senha correta
      LogService.info("Login bem-sucedido");
      localStorage.setItem("deltaAuthenticated", "true");
      setIsAuthenticated(true);
      
      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo ao sistema DELTA SELLS!",
      });
      
      navigate("/dashboard");
    } else {
      // Senha incorreta
      LogService.warn("Tentativa de login com senha incorreta");
      
      toast({
        title: "Senha incorreta",
        description: "Por favor, tente novamente.",
        variant: "destructive",
      });
      
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-delta-50 to-delta-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-delta-950">DELTA SELLS</h1>
          <p className="text-delta-600 mt-2">Sistema de gerenciamento</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-delta-700">
              Digite a senha para acessar
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock className="h-5 w-5 text-delta-400" />
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                placeholder="Digite a senha"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-delta-600 hover:bg-delta-700 text-white"
          >
            Entrar
          </Button>
        </form>
      </div>
      
      <div className="mt-8 text-center text-delta-700 text-sm">
        <p>© 2023 DELTA SELLS. Todos os direitos reservados.</p>
      </div>
    </div>
  );
};

export default Login;
