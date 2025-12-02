import DashboardShell from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { simulatorScenarios } from "@/lib/mock-data";
import { Play, Activity, Zap, AlertTriangle, Server, GitBranch } from "lucide-react";
import simImg from "@assets/generated_images/electrical_grid_simulator_interface.png";

export default function SimulatorSessions() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-heading text-foreground">Simuladores de Red</h2>
            <p className="text-muted-foreground mt-1">Entrenamiento en escenarios virtuales de operación y fallas.</p>
          </div>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20">
            <Play className="mr-2 h-4 w-4" /> Nueva Sesión de Simulador
          </Button>
        </div>

        {/* Hero Banner for Simulator */}
        <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-border/50 shadow-2xl">
           <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
           <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10" />
           <img src={simImg} alt="Simulator" className="absolute inset-0 w-full h-full object-cover opacity-40" />
           
           <div className="relative z-20 p-8 md:p-12 max-w-2xl">
             <Badge variant="outline" className="mb-4 text-cyan-400 border-cyan-400/30 bg-cyan-400/10">Módulo Avanzado</Badge>
             <h3 className="text-3xl font-bold text-white mb-4 font-heading">Entrenamiento de Alta Fidelidad</h3>
             <p className="text-slate-300 text-lg mb-6">
               Replica condiciones críticas de operación, fallas en tiempo real y reconfiguraciones topológicas sin riesgo para la infraestructura real.
             </p>
             <div className="flex flex-wrap gap-4">
               <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-900/50 px-3 py-1.5 rounded-full border border-white/10">
                 <Activity className="h-4 w-4 text-emerald-500" /> Tiempo Real
               </div>
               <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-900/50 px-3 py-1.5 rounded-full border border-white/10">
                 <GitBranch className="h-4 w-4 text-blue-500" /> Topología Dinámica
               </div>
               <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-900/50 px-3 py-1.5 rounded-full border border-white/10">
                 <Server className="h-4 w-4 text-amber-500" /> SCADA Integrado
               </div>
             </div>
           </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold font-heading">Escenarios Disponibles</h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {simulatorScenarios.map((scenario) => (
              <Card key={scenario.id} className="group border-border/60 bg-card hover:border-accent/50 transition-all hover:shadow-lg hover:shadow-accent/5 cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className={
                      scenario.category === 'Fault' ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20" :
                      scenario.category === 'Overload' ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20" :
                      "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20"
                    }>
                      {scenario.category === 'Fault' && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {scenario.category === 'Overload' && <Activity className="h-3 w-3 mr-1" />}
                      {scenario.category === 'Topology' && <GitBranch className="h-3 w-3 mr-1" />}
                      {scenario.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs font-normal">{scenario.difficulty}</Badge>
                  </div>
                  <CardTitle className="text-lg font-bold group-hover:text-accent transition-colors">{scenario.title}</CardTitle>
                  <CardDescription>{scenario.description}</CardDescription>
                </CardHeader>
                <CardFooter className="pt-0">
                  <Button variant="ghost" className="w-full group-hover:bg-accent group-hover:text-accent-foreground transition-all">
                    Iniciar Simulación <Play className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
            
            {/* New Scenario Placeholder */}
            <Card className="border-dashed border-2 border-border/50 bg-transparent flex flex-col items-center justify-center p-6 min-h-[200px] hover:bg-muted/20 transition-colors cursor-pointer">
               <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                 <Zap className="h-6 w-6 text-muted-foreground" />
               </div>
               <h4 className="font-medium text-muted-foreground">Crear Nuevo Escenario</h4>
               <p className="text-xs text-muted-foreground/60 text-center mt-1">Define condiciones iniciales y eventos</p>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
           <Card>
             <CardHeader>
               <CardTitle>Sesiones Recientes</CardTitle>
               <CardDescription>Historial de simulaciones realizadas por operadores.</CardDescription>
             </CardHeader>
             <CardContent>
               <div className="space-y-4">
                 {[1, 2, 3].map((i) => (
                   <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/40">
                     <div className="flex items-center gap-3">
                       <div className="h-9 w-9 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                         <MonitorPlay className="h-4 w-4" />
                       </div>
                       <div>
                         <p className="text-sm font-medium">Falla Trifásica L-400</p>
                         <p className="text-xs text-muted-foreground">Juan Operador • Hace 2h</p>
                       </div>
                     </div>
                     <div className="text-right">
                       <span className="text-sm font-bold text-emerald-500">95%</span>
                       <p className="text-[10px] text-muted-foreground">Efectividad</p>
                     </div>
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>

           <Card>
             <CardHeader>
               <CardTitle>Métricas de Simulación</CardTitle>
               <CardDescription>Desempeño global en entorno virtual.</CardDescription>
             </CardHeader>
             <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Tiempo de Respuesta Promedio</span>
                      <span className="font-bold">45s</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[80%]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Precisión de Maniobras</span>
                      <span className="font-bold">92%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-[92%]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Adherencia a Procedimiento</span>
                      <span className="font-bold">88%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 w-[88%]" />
                    </div>
                  </div>
                </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

function MonitorPlay({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m10 7 5 3-5 3z" />
            <rect width="20" height="14" x="2" y="3" rx="2" />
            <path d="M12 17v4" />
            <path d="M8 21h8" />
        </svg>
    )
}
