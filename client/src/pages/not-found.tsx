import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, CircleHelp } from "lucide-react";
import { OtsEnergyLogo } from "@/components/brand/ots-energy-logo";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden bg-background px-4 py-12 text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden="true">
        <div className="absolute -right-24 -top-28 h-96 w-96 rounded-full border border-primary/15" />
        <div className="absolute -right-12 -top-16 h-72 w-72 rounded-full border border-primary/10" />
        <div className="absolute bottom-0 left-0 h-1/2 w-full bg-gradient-to-t from-primary/[0.035] to-transparent" />
      </div>
      <div className="relative w-full max-w-lg">
        <div className="mb-6 flex justify-center">
          <OtsEnergyLogo
            iconClassName="h-11 w-11"
            wordmarkClassName="text-sm leading-tight tracking-[0.08em] [&_i]:not-italic [&_i]:text-primary"
            className="inline-flex items-center gap-3 text-foreground"
            subtitle="Operación · Formación · Evidencia"
          />
        </div>
        <Card className="overflow-hidden border-border/80 bg-card/95 shadow-xl shadow-primary/[0.06]">
          <div className="h-1 bg-gradient-to-r from-primary via-primary/55 to-accent" />
          <CardContent className="px-6 py-10 text-center sm:px-10">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/15 bg-primary/[0.07] text-primary">
              <CircleHelp className="h-8 w-8" strokeWidth={1.7} />
            </div>
            <p className="font-mono text-xs font-semibold tracking-[0.22em] text-primary">ERROR 404</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Esta ruta no está disponible</h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
              La página solicitada no existe o se movió. Vuelve al centro de control para continuar tu trabajo.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al centro de control
            </Link>
            <p className="mt-8 border-t border-border/70 pt-5 text-[11px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
              OTS Energy <span className="px-1 text-accent">·</span> Control de competencias
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
