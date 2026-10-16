import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { OtsEnergyLogo } from "@/components/brand/ots-energy-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, ShieldCheck, Activity, Network, RadioTower } from "lucide-react";

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
    <div className="min-h-[100dvh] w-full flex bg-background">
      <section className="relative z-10 flex w-full lg:w-[43%] xl:w-[40%] min-h-[100dvh] flex-col justify-between bg-card px-6 py-7 sm:px-10 lg:px-14 xl:px-[5.5rem]">
        <div className="flex items-center gap-3">
          <OtsEnergyLogo
            iconClassName="h-10 w-10 shrink-0"
            wordmarkClassName="leading-tight text-[15px] tracking-[0.1em] [&_strong]:font-bold [&_i]:not-italic [&_i]:text-primary"
            className="inline-flex items-center gap-3"
            subtitle="Operación · Formación · Evidencia"
          />
        </div>
        <div className="mx-auto w-full max-w-[380px] py-10">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1.5 text-[11px] font-semibold tracking-wide text-primary">
            <ShieldCheck className="h-3.5 w-3.5" /> ACCESO SEGURO
          </div>
          <div className="mb-8 space-y-2">
            <h1 className="text-[32px] font-bold tracking-[-0.04em] text-foreground">Bienvenido de nuevo</h1>
            <p className="text-sm leading-6 text-muted-foreground">Ingresa para continuar con tu operación de entrenamiento.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold tracking-wide text-foreground">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="operador@empresa.com" className="h-12 rounded-xl border-border bg-background pl-10 text-sm placeholder:text-muted-foreground/70 focus-visible:ring-primary/25" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="input-email" required />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold tracking-wide text-foreground">Contraseña</Label>
                <a href="#" className="text-xs font-semibold text-primary hover:text-primary/80 focus-visible:underline">¿Olvidaste tu contraseña?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" className="h-12 rounded-xl border-border bg-background pl-10 text-sm focus-visible:ring-primary/25" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="input-password" required />
              </div>
            </div>
            <Button type="submit" className="mt-2 h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-md shadow-primary/15 hover:-translate-y-0.5 hover:bg-primary/90" disabled={isLoading} data-testid="button-login">
              {isLoading ? "Verificando credenciales…" : "Entrar al centro de control"}
            </Button>
          </form>
          <p className="mt-7 text-center text-xs text-muted-foreground">
            ¿Problemas de acceso? <a href="#" className="font-semibold text-primary hover:underline">Contactar soporte</a>
          </p>
        </div>
        <p className="text-[10px] tracking-wide text-muted-foreground">OTS Energy · Gestión de competencias y evidencia operativa</p>
      </section>

      <section className="relative hidden flex-1 overflow-hidden bg-[hsl(195,46%,13%)] lg:flex">
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(rgba(107,196,183,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(107,196,183,.08) 1px, transparent 1px)", backgroundSize: "54px 54px", maskImage: "linear-gradient(90deg, transparent, black 35%, black)" }} />
        <div className="absolute -right-24 top-[14%] h-[580px] w-[580px] rounded-full border border-teal-200/[0.11]" />
        <div className="absolute -right-4 top-[22%] h-[420px] w-[420px] rounded-full border border-teal-200/[0.13]" />
        <div className="absolute right-[9%] top-[30%] h-[270px] w-[270px] rounded-full border border-teal-200/[0.2]" />
        <div className="absolute right-[23%] top-[40%] h-3 w-3 rounded-full bg-[hsl(37,83%,53%)] shadow-[0_0_0_8px_rgba(225,171,70,.12)]" />
        <div className="relative z-10 flex w-full flex-col justify-center px-12 py-16 xl:px-20">
          <div className="mb-7 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[hsl(174,66%,65%)]">
            <span className="h-px w-8 bg-[hsl(174,66%,52%)]" /> Preparación que sostiene la red
          </div>
          <h2 className="max-w-[680px] text-[clamp(2.6rem,4.1vw,4.5rem)] font-bold leading-[1.05] tracking-[-0.055em] text-white">
            El criterio operativo también se entrena.
          </h2>
          <p className="mt-6 max-w-[480px] text-[15px] leading-7 text-slate-300/80">
            Un solo entorno para evaluación, práctica en simulador y evidencia de competencia. Diseñado para decisiones seguras, turno tras turno.
          </p>
          <div className="mt-12 grid max-w-[630px] grid-cols-3 gap-3">
            <div className="border-l border-[hsl(174,66%,52%)]/70 pl-4">
              <Activity className="mb-4 h-4 w-4 text-[hsl(174,66%,62%)]" />
              <p className="text-sm font-semibold text-white">Ciclos de evaluación</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">Seguimiento claro del avance y la competencia.</p>
            </div>
            <div className="border-l border-[hsl(37,83%,53%)]/80 pl-4">
              <RadioTower className="mb-4 h-4 w-4 text-[hsl(37,83%,60%)]" />
              <p className="text-sm font-semibold text-white">Práctica realista</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">Escenarios de red para afinar la respuesta.</p>
            </div>
            <div className="border-l border-slate-400/50 pl-4">
              <Network className="mb-4 h-4 w-4 text-slate-300" />
              <p className="text-sm font-semibold text-white">Trazabilidad</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">Evidencia organizada para mejora continua.</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(174,66%,52%)]/40 to-transparent" />
      </section>
    </div>
  );
}
