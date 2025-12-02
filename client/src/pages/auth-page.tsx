import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail, Zap } from "lucide-react";
import heroImg from "@assets/generated_images/high-tech_electrical_grid_control_center.png";
import logoImg from "@assets/generated_images/abstract_logo_for_energy_evaluation_system.png";

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
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-16 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col space-y-2 text-center lg:text-left">
            <div className="flex justify-center lg:justify-start mb-4">
              <img src={logoImg} alt="Logo" className="h-12 w-12 rounded-md" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">Sistema OTS Energía</h1>
            <p className="text-muted-foreground">Plataforma de evaluación para operadores de red y subestaciones.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Credencial Corporativa</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="operador@red-electrica.com" 
                  className="pl-9 bg-muted/30" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-email"
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <a href="#" className="text-sm font-medium text-accent hover:underline">¿Olvidaste tu contraseña?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type="password" 
                  className="pl-9 bg-muted/30" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-password"
                  required 
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-base font-medium" 
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? "Verificando..." : "Acceder al Panel de Control"}
            </Button>
          </form>
          
          <div className="relative">
             <div className="absolute inset-0 flex items-center">
               <span className="w-full border-t border-border"></span>
             </div>
             <div className="relative flex justify-center text-xs uppercase">
               <span className="bg-background px-2 text-muted-foreground">Acceso Seguro</span>
             </div>
          </div>
          
          <p className="text-center text-sm text-muted-foreground">
            ¿Problemas con tu token de acceso? <a href="#" className="text-primary font-semibold hover:underline">Soporte Técnico</a>
          </p>
        </div>
      </div>

      {/* Right Side - Hero Image */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-primary/20 mix-blend-overlay z-10" />
        <img 
          src={heroImg} 
          alt="Centro de Control de Energía" 
          className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute bottom-0 left-0 right-0 p-12 z-20 bg-gradient-to-t from-black/90 to-transparent text-white">
          <div className="flex items-center gap-2 mb-2 text-cyan-400">
            <Zap className="h-5 w-5" />
            <span className="text-sm font-bold uppercase tracking-widest">Sector Energético</span>
          </div>
          <h2 className="text-3xl font-bold mb-4 font-heading">Entrenamiento Operativo de Alta Tensión</h2>
          <p className="text-lg text-white/80 max-w-xl">Simulación de maniobras, gestión de fallas y protocolos de seguridad para redes eléctricas inteligentes.</p>
        </div>
      </div>
    </div>
  );
}
