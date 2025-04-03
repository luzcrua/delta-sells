
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ACCESS_PASSWORD } from "@/env";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogService } from "@/services/LogService";
import { useToast } from "@/hooks/use-toast";
import { Lock, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 72 * 60 * 60 * 1000; // 72 hours in milliseconds

const Login = () => {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Verificar se já está autenticado no localStorage
  useEffect(() => {
    const auth = localStorage.getItem("deltaAuthenticated");
    if (auth === "true") {
      setIsAuthenticated(true);
      navigate("/dashboard");
    }

    // Carregar informações de bloqueio do localStorage
    const storedAttempts = localStorage.getItem("deltaLoginAttempts");
    const storedLockedUntil = localStorage.getItem("deltaLockedUntil");
    
    if (storedAttempts) {
      setLoginAttempts(parseInt(storedAttempts));
    }
    
    if (storedLockedUntil) {
      const lockedTime = parseInt(storedLockedUntil);
      setLockedUntil(lockedTime);
    }
  }, [navigate]);

  // Atualizar o contador regressivo de bloqueio
  useEffect(() => {
    if (!lockedUntil) return;

    const now = Date.now();
    if (now >= lockedUntil) {
      // O período de bloqueio acabou
      setLockedUntil(null);
      setLoginAttempts(0);
      localStorage.removeItem("deltaLockedUntil");
      localStorage.setItem("deltaLoginAttempts", "0");
      return;
    }

    // Atualizar o tempo restante
    const updateRemainingTime = () => {
      if (!lockedUntil) return;
      
      const now = Date.now();
      const remainingMs = Math.max(0, lockedUntil - now);
      
      if (remainingMs <= 0) {
        setLockedUntil(null);
        setLoginAttempts(0);
        localStorage.removeItem("deltaLockedUntil");
        localStorage.setItem("deltaLoginAttempts", "0");
        return;
      }
      
      // Calcular horas, minutos e segundos
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
      
      setRemainingTime(`${hours}h ${minutes}m ${seconds}s`);
    };

    // Atualizar imediatamente e depois a cada segundo
    updateRemainingTime();
    const interval = setInterval(updateRemainingTime, 1000);
    
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se a conta está bloqueada
    if (lockedUntil && Date.now() < lockedUntil) {
      toast({
        title: "Acesso bloqueado",
        description: `Muitas tentativas falhas. Tente novamente em ${remainingTime}.`,
        variant: "destructive",
      });
      return;
    }
    
    if (password === ACCESS_PASSWORD) {
      // Senha correta
      LogService.info("Login bem-sucedido");
      localStorage.setItem("deltaAuthenticated", "true");
      localStorage.setItem("deltaLoginAttempts", "0");
      localStorage.removeItem("deltaLockedUntil");
      setIsAuthenticated(true);
      
      toast({
        title: "Login bem-sucedido",
        description: "Bem-vindo ao sistema DELTA SELLS!",
      });
      
      navigate("/dashboard");
    } else {
      // Senha incorreta
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem("deltaLoginAttempts", newAttempts.toString());
      
      LogService.warn(`Tentativa de login com senha incorreta (${newAttempts}/${MAX_LOGIN_ATTEMPTS})`);
      
      // Avisar o usuário sobre as tentativas restantes ou bloquear
      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        const lockTime = Date.now() + LOCKOUT_DURATION;
        setLockedUntil(lockTime);
        localStorage.setItem("deltaLockedUntil", lockTime.toString());
        
        toast({
          title: "Conta bloqueada",
          description: `Muitas tentativas falhas. Sua conta foi bloqueada por 72 horas.`,
          variant: "destructive",
        });
        
        LogService.warn(`Conta bloqueada por 72 horas devido a ${MAX_LOGIN_ATTEMPTS} tentativas falhas`);
      } else {
        const remainingAttempts = MAX_LOGIN_ATTEMPTS - newAttempts;
        
        toast({
          title: "Senha incorreta",
          description: `Você tem mais ${remainingAttempts} tentativa(s) antes do bloqueio de 72 horas.`,
          variant: "destructive",
        });
      }
      
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

        {lockedUntil && Date.now() < lockedUntil && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Conta bloqueada</AlertTitle>
            <AlertDescription>
              Muitas tentativas incorretas. Tente novamente em {remainingTime}.
            </AlertDescription>
          </Alert>
        )}
        
        {!lockedUntil && loginAttempts > 0 && loginAttempts < MAX_LOGIN_ATTEMPTS && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Atenção!</AlertTitle>
            <AlertDescription>
              Você tem {MAX_LOGIN_ATTEMPTS - loginAttempts} tentativa(s) restantes antes do bloqueio de 72 horas.
            </AlertDescription>
          </Alert>
        )}

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
                disabled={lockedUntil !== null && Date.now() < lockedUntil}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-delta-600 hover:bg-delta-700 text-white"
            disabled={lockedUntil !== null && Date.now() < lockedUntil}
          >
            Entrar
          </Button>
        </form>
      </div>
      
      <div className="mt-8 text-center text-delta-700 text-sm">
        <p>© 2025 DELTA SELLS. Todos os direitos reservados. Idealizado por Arinelson Santos</p>
      </div>
    </div>
  );
};

export default Login;
