
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ACCESS_PASSWORD, DEBUG_MODE } from "@/env";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LogService } from "@/services/LogService";
import { useToast } from "@/hooks/use-toast";
import { Lock, AlertCircle, Moon, Sun } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useTheme } from "@/hooks/use-theme";

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
  const { theme, setTheme } = useTheme();

  // Verificar se já está autenticado no localStorage
  useEffect(() => {
    // Log ambiente e variáveis ao iniciar
    if (DEBUG_MODE) {
      console.log('📝 Ambiente: ', import.meta.env.MODE);
      console.log('📝 Senha configurada no env: ', ACCESS_PASSWORD ? '✓ Definida' : '❌ Indefinida');
      console.log('📝 VITE_ACCESS_PASSWORD está definida: ', import.meta.env.VITE_ACCESS_PASSWORD ? '✓ Sim' : '❌ Não');
      
      // Log outras variáveis de ambiente
      console.log('📝 VITE_GOOGLE_SHEETS_URL_CLIENTE: ', 
        import.meta.env.VITE_GOOGLE_SHEETS_URL_CLIENTE ? '✓ Definida' : '❌ Indefinida');
      console.log('📝 VITE_GOOGLE_SHEETS_URL_LEAD: ', 
        import.meta.env.VITE_GOOGLE_SHEETS_URL_LEAD ? '✓ Definida' : '❌ Indefinida');
      console.log('📝 VITE_GOOGLE_SHEET_VIEW_URL_CLIENTE: ', 
        import.meta.env.VITE_GOOGLE_SHEET_VIEW_URL_CLIENTE ? '✓ Definida' : '❌ Indefinida');
      console.log('📝 VITE_GOOGLE_SHEET_VIEW_URL_LEAD: ', 
        import.meta.env.VITE_GOOGLE_SHEET_VIEW_URL_LEAD ? '✓ Definida' : '❌ Indefinida');
      
      LogService.info("Verificando variáveis de ambiente na inicialização");
    }
    
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
    
    // Debug da senha informada vs senha configurada
    if (DEBUG_MODE) {
      console.log('🔑 Tentativa de login:');
      console.log('🔑 ACCESS_PASSWORD definida: ', ACCESS_PASSWORD ? '✓ Sim' : '❌ Não');
      console.log('🔑 Senha digitada: ', password);
      console.log('🔑 Comparação: ', password === ACCESS_PASSWORD ? '✓ Igual' : '❌ Diferente');
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

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-xl shadow-lg p-6 md:p-8 relative">
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">DELTA SELLS</h1>
          <p className="text-muted-foreground mt-2">Sistema de gerenciamento</p>
        </div>

        {DEBUG_MODE && (
          <Alert className="mb-4 text-xs md:text-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Modo Debug</AlertTitle>
            <AlertDescription className="break-words">
              Ambiente: {import.meta.env.MODE}<br/>
              Variáveis env: {ACCESS_PASSWORD ? '✓ ACCESS_PASSWORD definida' : '❌ ACCESS_PASSWORD não definida'}
            </AlertDescription>
          </Alert>
        )}

        {lockedUntil && Date.now() < lockedUntil && (
          <Alert variant="destructive" className="mb-4 text-xs md:text-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Conta bloqueada</AlertTitle>
            <AlertDescription>
              Muitas tentativas incorretas. Tente novamente em {remainingTime}.
            </AlertDescription>
          </Alert>
        )}
        
        {!lockedUntil && loginAttempts > 0 && loginAttempts < MAX_LOGIN_ATTEMPTS && (
          <Alert className="mb-4 text-xs md:text-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Atenção!</AlertTitle>
            <AlertDescription>
              Você tem {MAX_LOGIN_ATTEMPTS - loginAttempts} tentativa(s) restantes antes do bloqueio de 72 horas.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Digite a senha para acessar
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock className="h-5 w-5 text-muted-foreground" />
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
      
      <div className="mt-6 text-center text-muted-foreground text-xs md:text-sm px-4">
        <p>© 2025 DELTA SELLS. Todos os direitos reservados. Idealizado por Arinelson Santos</p>
      </div>
    </div>
  );
};

export default Login;
