import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { simulatorScenarios } from "@/lib/mock-data";
import { ArrowLeft, AlertTriangle, Zap, Timer, CheckCircle, Activity, Power, Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Topology Component
const GridTopology = ({ status }: { status: string }) => (
  <div className="relative w-full h-full bg-[#0b0f19] overflow-hidden border border-white/10 rounded-lg p-8">
    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
    
    {/* Substation A */}
    <div className="absolute top-20 left-20 flex flex-col items-center z-10">
      <div className="w-24 h-24 border-2 border-cyan-500/50 bg-cyan-950/30 rounded flex items-center justify-center relative shadow-[0_0_15px_rgba(6,182,212,0.2)]">
         <Zap className="w-10 h-10 text-cyan-400" />
         <div className="absolute -top-6 text-xs text-cyan-400 font-mono">SUB-A 400kV</div>
      </div>
    </div>

    {/* Substation B */}
    <div className="absolute bottom-20 right-40 flex flex-col items-center z-10">
      <div className={cn(
        "w-24 h-24 border-2 bg-slate-900/30 rounded flex items-center justify-center relative transition-all duration-500",
        status === "fault" ? "border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.4)]" : "border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
      )}>
         <Activity className={cn("w-10 h-10", status === "fault" ? "text-red-500 animate-pulse" : "text-cyan-400")} />
         <div className="absolute -top-6 text-xs text-muted-foreground font-mono">SUB-B 115kV</div>
      </div>
    </div>

    {/* Transmission Line */}
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      <path 
        d="M 140 140 L 400 140 L 400 400 L 600 400" 
        fill="none" 
        stroke={status === "fault" ? "#ef4444" : "#06b6d4"} 
        strokeWidth="3"
        className={cn("transition-all duration-500", status === "fault" ? "opacity-100" : "opacity-60")}
        strokeDasharray={status === "fault" ? "10 5" : "0"} 
      />
      {status === "fault" && (
        <circle cx="400" cy="270" r="15" fill="rgba(239,68,68,0.2)" stroke="#ef4444" strokeWidth="2">
           <animate attributeName="r" values="10;20;10" dur="1.5s" repeatCount="indefinite" />
           <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
    
    {/* Status Overlay */}
    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded text-right font-mono text-xs space-y-1">
      <div className="flex justify-between w-48">
        <span className="text-muted-foreground">FREQ:</span>
        <span className={cn(status === "fault" ? "text-red-400" : "text-green-400")}>
           {status === "fault" ? "59.2 Hz" : "60.0 Hz"}
        </span>
      </div>
      <div className="flex justify-between w-48">
        <span className="text-muted-foreground">LOAD:</span>
        <span className="text-cyan-400">124 MW</span>
      </div>
      <div className="flex justify-between w-48">
        <span className="text-muted-foreground">V-Line:</span>
        <span className={cn(status === "fault" ? "text-red-400" : "text-green-400")}>
          {status === "fault" ? "380 kV" : "405 kV"}
        </span>
      </div>
    </div>
  </div>
);

export default function SimulatorRun() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/simulator/run/:id");
  const scenarioId = params?.id;
  const scenario = simulatorScenarios.find(s => s.id === scenarioId);

  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [simStatus, setSimStatus] = useState("normal"); // normal, fault, recovered
  const [logs, setLogs] = useState<{time: string, msg: string, type: string}[]>([]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Initial Start
  useEffect(() => {
    if (scenario) {
      addLog("Sistema Inicializado. Parámetros nominales.", "info");
      // Simulate fault after 3 seconds
      if (scenario.category === "Fault") {
         setTimeout(() => {
            if(isRunning) triggerFault();
         }, 5000);
      }
    }
  }, [scenario, isRunning]);

  const addLog = (msg: string, type: "info" | "warn" | "error" | "success") => {
    const now = new Date().toLocaleTimeString();
    setLogs(prev => [{time: now, msg, type}, ...prev]);
  };

  const triggerFault = () => {
    setSimStatus("fault");
    addLog("ALERTA: Disparo Protección Diferencial 87L - Tramo A-B", "error");
    addLog("ALERTA: Caída de Frecuencia detectada (59.2Hz)", "error");
  };

  const handleStart = () => {
    setIsRunning(true);
    addLog("Simulación Iniciada por Operador.", "info");
  };

  const handleStop = () => {
    setIsRunning(false);
    addLog("Simulación Pausada.", "warn");
  };

  const handleAction = (action: string) => {
    if (!isRunning) return;
    addLog(`COMANDO: ${action} ejecutado.`, "info");
    
    if (action === "Abrir Interruptor 52-1" && simStatus === "fault") {
      setTimeout(() => {
        addLog("CONFIRMACIÓN: Interruptor 52-1 Abierto. Falla Aislada.", "success");
        setSimStatus("recovered");
      }, 1000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!scenario) return <div>Escenario no encontrado</div>;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-white/10 bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/simulator")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold font-heading tracking-wide flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              SIMULACIÓN EN CURSO: <span className="text-cyan-400">{scenario.title.toUpperCase()}</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-black/30 px-4 py-2 rounded border border-white/10 font-mono text-xl text-cyan-400">
             <Timer className="h-5 w-5" />
             {formatTime(elapsedTime)}
          </div>
          {!isRunning ? (
             <Button onClick={handleStart} className="bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
               <Play className="mr-2 h-4 w-4" /> INICIAR
             </Button>
          ) : (
             <Button onClick={handleStop} variant="destructive" className="border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
               <Pause className="mr-2 h-4 w-4" /> PAUSAR
             </Button>
          )}
        </div>
      </header>

      {/* Main Control Interface */}
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 overflow-hidden">
        
        {/* Left Panel: Visualization & Controls */}
        <div className="flex flex-col gap-6">
           {/* Topology Map */}
           <Card className="flex-1 border-white/10 bg-card/50 backdrop-blur-sm">
             <CardHeader className="pb-2 border-b border-white/5 flex flex-row justify-between items-center">
               <CardTitle className="text-sm font-mono uppercase text-muted-foreground">Topología de Red en Tiempo Real</CardTitle>
               <Badge variant={simStatus === "normal" ? "outline" : simStatus === "fault" ? "destructive" : "default"} className="animate-pulse">
                  ESTADO: {simStatus === "normal" ? "NOMINAL" : simStatus === "fault" ? "CRÍTICO" : "ESTABILIZADO"}
               </Badge>
             </CardHeader>
             <CardContent className="p-0 h-[500px]">
                <GridTopology status={simStatus} />
             </CardContent>
           </Card>

           {/* Control Panel */}
           <div className="grid grid-cols-4 gap-4">
             <Button 
               variant="outline" 
               className="h-24 flex flex-col gap-2 border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all"
               onClick={() => handleAction("Abrir Interruptor 52-1")}
               disabled={!isRunning}
             >
               <Power className="h-8 w-8" />
               <span className="text-xs font-mono">ABRIR INT 52-1</span>
             </Button>
             <Button 
               variant="outline" 
               className="h-24 flex flex-col gap-2 border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all"
               onClick={() => handleAction("Cerrar Interruptor 52-1")}
               disabled={!isRunning}
             >
               <RotateCcw className="h-8 w-8" />
               <span className="text-xs font-mono">CERRAR INT 52-1</span>
             </Button>
             <Button 
               variant="outline" 
               className="h-24 flex flex-col gap-2 border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all"
               onClick={() => handleAction("Transferir Carga B")}
               disabled={!isRunning}
             >
               <Activity className="h-8 w-8" />
               <span className="text-xs font-mono">TRANSFERIR CARGA</span>
             </Button>
             <Button 
               variant="outline" 
               className="h-24 flex flex-col gap-2 border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all"
               onClick={() => handleAction("Resetear Protección")}
               disabled={!isRunning}
             >
               <CheckCircle className="h-8 w-8" />
               <span className="text-xs font-mono">RESET PROT 87L</span>
             </Button>
           </div>
        </div>

        {/* Right Panel: Event Log & Telemetry */}
        <div className="flex flex-col gap-6">
           {/* Logs */}
           <Card className="flex-1 border-white/10 bg-black/40 flex flex-col">
             <CardHeader className="py-3 border-b border-white/10 bg-white/5">
               <CardTitle className="text-xs font-mono uppercase tracking-widest text-cyan-400">Log de Eventos SCADA</CardTitle>
             </CardHeader>
             <CardContent className="flex-1 p-0 overflow-hidden relative">
               <div className="absolute inset-0 overflow-y-auto p-4 space-y-2 font-mono text-xs">
                 {logs.length === 0 && <div className="text-muted-foreground italic">Esperando inicio de secuencia...</div>}
                 {logs.map((log, idx) => (
                   <div key={idx} className="flex gap-2 animate-in slide-in-from-left-2 duration-300">
                     <span className="text-muted-foreground/50">[{log.time}]</span>
                     <span className={cn(
                       log.type === "error" ? "text-red-400 font-bold" :
                       log.type === "success" ? "text-green-400" :
                       log.type === "warn" ? "text-amber-400" :
                       "text-slate-300"
                     )}>
                       {log.type === "error" && "⚠ "}
                       {log.msg}
                     </span>
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>
           
           {/* Telemetry Details */}
           <Card className="h-1/3 border-white/10 bg-card/50">
             <CardHeader className="py-3 border-b border-white/10">
                <CardTitle className="text-xs font-mono uppercase tracking-widest">Telemetría Subestación A</CardTitle>
             </CardHeader>
             <CardContent className="p-4 grid grid-cols-2 gap-4">
               <div className="bg-black/30 p-2 rounded border border-white/5">
                 <div className="text-[10px] text-muted-foreground uppercase">Voltaje L1-L2</div>
                 <div className="text-xl font-mono text-cyan-400">402.5 kV</div>
               </div>
               <div className="bg-black/30 p-2 rounded border border-white/5">
                 <div className="text-[10px] text-muted-foreground uppercase">Corriente Ia</div>
                 <div className={cn("text-xl font-mono", simStatus === "fault" ? "text-red-500 animate-pulse" : "text-green-400")}>
                    {simStatus === "fault" ? "2450 A" : "320 A"}
                 </div>
               </div>
               <div className="bg-black/30 p-2 rounded border border-white/5">
                 <div className="text-[10px] text-muted-foreground uppercase">Potencia Activa</div>
                 <div className="text-xl font-mono text-white">125 MW</div>
               </div>
               <div className="bg-black/30 p-2 rounded border border-white/5">
                 <div className="text-[10px] text-muted-foreground uppercase">Factor Potencia</div>
                 <div className="text-xl font-mono text-white">0.98</div>
               </div>
             </CardContent>
           </Card>
        </div>

      </div>
    </div>
  );
}
