import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Mail } from "lucide-react";
import heroImg from "@assets/generated_images/professional_modern_corporate_training_environment.png";
import logoImg from "@assets/generated_images/abstract_logo_for_evaluation_system.png";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login delay
    setTimeout(() => {
      setIsLoading(false);
      setLocation("/");
    }, 1000);
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
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">Bienvenido de nuevo</h1>
            <p className="text-muted-foreground">Ingresa tus credenciales para acceder al sistema OTS.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="usuario@empresa.com" className="pl-9 bg-muted/30" required />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <a href="#" className="text-sm font-medium text-accent hover:underline">¿Olvidaste tu contraseña?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" className="pl-9 bg-muted/30" required />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base font-medium" disabled={isLoading}>
              {isLoading ? "Iniciando sesión..." : "Ingresar al Sistema"}
            </Button>
          </form>
          
          <div className="relative">
             <div className="absolute inset-0 flex items-center">
               <span className="w-full border-t border-border"></span>
             </div>
             <div className="relative flex justify-center text-xs uppercase">
               <span className="bg-background px-2 text-muted-foreground">Sistema Seguro</span>
             </div>
          </div>
          
          <p className="text-center text-sm text-muted-foreground">
            ¿Necesitas acceso para tu empresa? <a href="#" className="text-primary font-semibold hover:underline">Contáctanos</a>
          </p>
        </div>
      </div>

      {/* Right Side - Hero Image */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-primary/20 mix-blend-overlay z-10" />
        <img 
          src={heroImg} 
          alt="Training Environment" 
          className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute bottom-0 left-0 right-0 p-12 z-20 bg-gradient-to-t from-black/80 to-transparent text-white">
          <h2 className="text-3xl font-bold mb-4 font-heading">Estandarización Operativa de Clase Mundial</h2>
          <p className="text-lg text-white/80 max-w-xl">Gestiona evaluaciones, reportes y certificaciones de entrenamiento técnico con trazabilidad completa y seguridad multi-empresa.</p>
        </div>
      </div>
    </div>
  );
}
