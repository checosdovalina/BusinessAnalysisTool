import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, Zap } from "lucide-react";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      setLocation("/");
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      <div className="w-full lg:w-[480px] flex flex-col justify-center items-center p-8 lg:p-12 bg-white">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 mb-6">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Iniciar Sesión</h1>
            <p className="text-sm text-gray-500">Ingresa tus credenciales para acceder al panel de control.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="operador@empresa.com" 
                  className="pl-10 h-11 bg-gray-50 border-gray-200 focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-email"
                  required 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Contraseña</Label>
                <a href="#" className="text-xs font-medium text-cyan-600 hover:text-cyan-700 transition-colors">¿Olvidaste tu contraseña?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  className="pl-10 h-11 bg-gray-50 border-gray-200 focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-password"
                  required 
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/25 transition-all duration-200" 
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? "Verificando..." : "Acceder al Panel"}
            </Button>
          </form>
          
          <p className="text-center text-xs text-gray-400">
            ¿Problemas de acceso? <a href="#" className="text-cyan-600 font-medium hover:underline">Contactar Soporte</a>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-[hsl(222,47%,11%)]">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-600/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(6,182,212,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)]" />
        
        <div className="relative z-10 flex flex-col justify-center p-16 max-w-2xl">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-white tracking-wide">OTS <span className="text-cyan-400">ENERGY</span></span>
          </div>
          
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Plataforma de Evaluación<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              para Operadores de Red
            </span>
          </h2>
          <p className="text-lg text-slate-400 max-w-md leading-relaxed">
            Gestión integral de entrenamiento, simulación de maniobras y certificación operativa para redes eléctricas.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <p className="text-2xl font-bold text-white">500+</p>
              <p className="text-xs text-slate-500 mt-1">Evaluaciones Completadas</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <p className="text-2xl font-bold text-white">98%</p>
              <p className="text-xs text-slate-500 mt-1">Tasa de Aprobación</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <p className="text-2xl font-bold text-white">24/7</p>
              <p className="text-xs text-slate-500 mt-1">Monitoreo Continuo</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      </div>
    </div>
  );
}
