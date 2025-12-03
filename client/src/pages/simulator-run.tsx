import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { simulatorScenariosAPI, scenarioStepsAPI, sessionStepResultsAPI, simulatorSessionsAPI } from "@/lib/api";
import { ArrowLeft, AlertTriangle, Zap, Timer, CheckCircle, Activity, Power, Play, Pause, RotateCcw, Target, XCircle, Info, ChevronRight, Award, Clock, Radio, Shield, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScenarioStep } from "@shared/schema";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

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

interface StepResult {
  stepId: number;
  isCorrect: boolean;
  actionPerformed: string;
  pointsAwarded: number;
  responseTime: number;
}

interface FeedbackModal {
  isOpen: boolean;
  isCorrect: boolean;
  title: string;
  message: string;
  alternativeInterpretation?: string;
  points: number;
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  "breaker_open": "Abrir Interruptor",
  "breaker_close": "Cerrar Interruptor",
  "voltage_adjust": "Ajustar Voltaje",
  "load_transfer": "Transferir Carga",
  "communication": "Comunicación Operativa",
  "alarm_acknowledge": "Reconocer Alarma",
  "protection_check": "Verificar Protección",
  "isolation": "Aislar Equipo",
  "grounding": "Puesta a Tierra",
  "custom": "Acción Personalizada",
};

export default function SimulatorRun() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/simulator/run/:id");
  const scenarioId = params?.id ? parseInt(params.id) : null;
  const { user } = useAuth();
  
  const { data: scenario, isLoading } = useQuery({
    queryKey: ["simulator-scenario", scenarioId],
    queryFn: () => scenarioId ? simulatorScenariosAPI.getById(scenarioId) : Promise.reject("No ID"),
    enabled: !!scenarioId,
  });

  const { data: scenarioSteps = [], isLoading: stepsLoading } = useQuery({
    queryKey: ["scenario-steps", scenarioId],
    queryFn: () => scenarioId ? scenarioStepsAPI.getByScenario(scenarioId) : Promise.resolve([]),
    enabled: !!scenarioId,
  });

  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [simStatus, setSimStatus] = useState("normal");
  const [logs, setLogs] = useState<{time: string, msg: string, type: string}[]>([]);
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepResults, setStepResults] = useState<StepResult[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [stepStartTime, setStepStartTime] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<FeedbackModal>({ isOpen: false, isCorrect: true, title: "", message: "", points: 0 });
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [stepElapsedTime, setStepElapsedTime] = useState(0);
  const [criticalFailures, setCriticalFailures] = useState(0);
  const [inputModal, setInputModal] = useState<{ isOpen: boolean; actionType: string; actionLabel: string }>({ isOpen: false, actionType: "", actionLabel: "" });
  const [inputValue, setInputValue] = useState("");

  const hasConfiguredSteps = scenarioSteps.length > 0;
  const currentStep = hasConfiguredSteps ? scenarioSteps[currentStepIndex] : null;
  const maxPoints = scenarioSteps.reduce((sum, s) => sum + s.points, 0);

  const createSession = async () => {
    if (!scenarioId || !user) return null;
    try {
      const session = await simulatorSessionsAPI.create({
        scenarioId,
        studentId: user.id,
        companyId: user.companyId,
        startTime: new Date(),
      });
      return session.id;
    } catch (error) {
      console.error("Error creating session:", error);
      return null;
    }
  };

  const saveStepResult = async (result: StepResult, sessId: number) => {
    try {
      await sessionStepResultsAPI.create({
        sessionId: sessId,
        stepId: result.stepId,
        isCorrect: result.isCorrect,
        actionTaken: result.actionPerformed,
        pointsAwarded: result.pointsAwarded,
        responseTime: result.responseTime,
      });
    } catch (error) {
      console.error("Error saving step result:", error);
    }
  };

  const completeSession = async (sessId: number, finalScore: number) => {
    try {
      await simulatorSessionsAPI.update(sessId, {
        endTime: new Date(),
        score: finalScore,
      });
    } catch (error) {
      console.error("Error completing session:", error);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (scenario) {
      addLog("Sistema Inicializado. Parámetros nominales.", "info");
      if (scenario.category === "Fault") {
         setTimeout(() => {
            if(isRunning) triggerFault();
         }, 5000);
      }
    }
  }, [scenario, isRunning]);

  useEffect(() => {
    if (isRunning && hasConfiguredSteps && stepStartTime === null) {
      setStepStartTime(Date.now());
    }
  }, [isRunning, hasConfiguredSteps, stepStartTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && stepStartTime && hasConfiguredSteps && !isCompleted) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - stepStartTime) / 1000);
        setStepElapsedTime(elapsed);
        
        if (currentStep?.timeLimit && elapsed >= currentStep.timeLimit && !feedback.isOpen) {
          handleTimeExpired();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, stepStartTime, hasConfiguredSteps, isCompleted, currentStep, feedback.isOpen]);

  const handleTimeExpired = () => {
    if (!currentStep) return;
    
    addLog(`⏱ TIEMPO AGOTADO: ${currentStep.actionDescription}`, "error");
    
    const result: StepResult = {
      stepId: currentStep.id,
      isCorrect: false,
      actionPerformed: "timeout",
      pointsAwarded: 0,
      responseTime: currentStep.timeLimit || 0,
    };
    
    setStepResults(prev => [...prev, result]);
    
    if (sessionId) {
      saveStepResult(result, sessionId);
    }
    
    setFeedback({
      isOpen: true,
      isCorrect: false,
      title: "Tiempo Agotado",
      message: `El tiempo límite de ${currentStep.timeLimit} segundos ha expirado. ${currentStep.incorrectResponse}`,
      alternativeInterpretation: currentStep.isCritical 
        ? "En un escenario real, esta demora podría haber causado daños significativos al sistema."
        : currentStep.alternativeInterpretation || undefined,
      points: 0,
    });

    if (currentStep.isCritical) {
      setCriticalFailures(prev => prev + 1);
      addLog("⚠ FALLA CRÍTICA POR TIEMPO - Impacto severo en el sistema.", "error");
    }

    if (currentStepIndex < scenarioSteps.length - 1) {
      setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
        setStepStartTime(Date.now());
        setStepElapsedTime(0);
        const nextStep = scenarioSteps[currentStepIndex + 1];
        addLog(`SIGUIENTE OBJETIVO: ${nextStep.actionDescription}`, "info");
      }, 3000);
    } else {
      setIsCompleted(true);
      setIsRunning(false);
      if (sessionId) {
        completeSession(sessionId, Math.round((totalPoints / maxPoints) * 100));
      }
    }
  };

  const addLog = (msg: string, type: "info" | "warn" | "error" | "success") => {
    const now = new Date().toLocaleTimeString();
    setLogs(prev => [{time: now, msg, type}, ...prev]);
  };

  const triggerFault = () => {
    setSimStatus("fault");
    addLog("ALERTA: Disparo Protección Diferencial 87L - Tramo A-B", "error");
    addLog("ALERTA: Caída de Frecuencia detectada (59.2Hz)", "error");
  };

  const handleStart = async () => {
    setIsRunning(true);
    setStepStartTime(Date.now());
    addLog("Simulación Iniciada por Operador.", "info");
    
    if (hasConfiguredSteps) {
      const newSessionId = await createSession();
      if (newSessionId) {
        setSessionId(newSessionId);
        addLog(`Sesión de simulación creada (ID: ${newSessionId})`, "info");
      }
      if (currentStep) {
        addLog(`OBJETIVO: ${currentStep.actionDescription}`, "info");
      }
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    addLog("Simulación Pausada.", "warn");
  };

  const validateAction = async (actionType: string, providedValue?: string) => {
    if (!isRunning || !hasConfiguredSteps || !currentStep || isCompleted) return;

    const responseTime = stepStartTime ? Math.floor((Date.now() - stepStartTime) / 1000) : 0;
    
    const actionTypeMatches = actionType === currentStep.actionType;
    const valueMatches = !currentStep.expectedValue || 
      (providedValue !== undefined && providedValue.trim().toLowerCase() === currentStep.expectedValue.trim().toLowerCase());
    
    const isCorrect = actionTypeMatches && valueMatches === true;
    const pointsAwarded = isCorrect ? currentStep.points : 0;

    const result: StepResult = {
      stepId: currentStep.id,
      isCorrect,
      actionPerformed: providedValue ? `${actionType}:${providedValue}` : actionType,
      pointsAwarded,
      responseTime,
    };

    setStepResults(prev => [...prev, result]);
    
    if (sessionId) {
      await saveStepResult(result, sessionId);
    }
    
    if (isCorrect) {
      const newTotalPoints = totalPoints + pointsAwarded;
      setTotalPoints(newTotalPoints);
      addLog(`✓ CORRECTO: ${currentStep.actionDescription}`, "success");
      
      setFeedback({
        isOpen: true,
        isCorrect: true,
        title: "¡Acción Correcta!",
        message: currentStep.correctResponse,
        points: pointsAwarded,
      });

      if (currentStepIndex < scenarioSteps.length - 1) {
        setTimeout(() => {
          setCurrentStepIndex(prev => prev + 1);
          setStepStartTime(Date.now());
          const nextStep = scenarioSteps[currentStepIndex + 1];
          addLog(`SIGUIENTE OBJETIVO: ${nextStep.actionDescription}`, "info");
        }, 2000);
      } else {
        setIsCompleted(true);
        setIsRunning(false);
        addLog("SIMULACIÓN COMPLETADA - Todos los pasos ejecutados correctamente.", "success");
        
        if (sessionId) {
          const finalScore = Math.round((newTotalPoints / maxPoints) * 100);
          await completeSession(sessionId, finalScore);
          addLog(`Sesión guardada con puntuación: ${finalScore}%`, "success");
        }
      }

      if (simStatus === "fault" && actionType === "breaker_open") {
        setTimeout(() => {
          setSimStatus("recovered");
        }, 1000);
      }
    } else {
      addLog(`✗ INCORRECTO: Se esperaba "${ACTION_TYPE_LABELS[currentStep.actionType] || currentStep.actionType}"`, "error");
      
      if (currentStep.isCritical) {
        setCriticalFailures(prev => prev + 1);
        addLog("⚠ PASO CRÍTICO FALLIDO - Esto tendría consecuencias graves en un escenario real.", "error");
      }
      
      setFeedback({
        isOpen: true,
        isCorrect: false,
        title: currentStep.isCritical ? "⚠ Falla Crítica" : "Acción Incorrecta",
        message: currentStep.incorrectResponse,
        alternativeInterpretation: currentStep.alternativeInterpretation || undefined,
        points: 0,
      });
    }
  };

  const handleAction = (actionType: string, actionLabel: string) => {
    if (!isRunning) return;
    
    if (hasConfiguredSteps && currentStep) {
      if (currentStep.actionType === actionType && currentStep.expectedValue) {
        setInputModal({ isOpen: true, actionType, actionLabel });
        setInputValue("");
        return;
      }
      addLog(`COMANDO: ${actionLabel} ejecutado.`, "info");
      validateAction(actionType);
    } else {
      addLog(`COMANDO: ${actionLabel} ejecutado.`, "info");
      if (actionType === "breaker_open" && simStatus === "fault") {
        setTimeout(() => {
          addLog("CONFIRMACIÓN: Interruptor 52-1 Abierto. Falla Aislada.", "success");
          setSimStatus("recovered");
        }, 1000);
      }
    }
  };

  const handleInputSubmit = () => {
    if (!currentStep) return;
    
    addLog(`COMANDO: ${inputModal.actionLabel} con valor "${inputValue}"`, "info");
    
    const valueMatches = inputValue.trim().toLowerCase() === (currentStep.expectedValue || "").trim().toLowerCase();
    
    if (valueMatches) {
      validateAction(inputModal.actionType, inputValue);
    } else {
      const responseTime = stepStartTime ? Math.floor((Date.now() - stepStartTime) / 1000) : 0;
      
      const result: StepResult = {
        stepId: currentStep.id,
        isCorrect: false,
        actionPerformed: `${inputModal.actionType}:${inputValue}`,
        pointsAwarded: 0,
        responseTime,
      };
      
      setStepResults(prev => [...prev, result]);
      
      if (sessionId) {
        saveStepResult(result, sessionId);
      }
      
      addLog(`✗ VALOR INCORRECTO: Se esperaba "${currentStep.expectedValue}", ingresado "${inputValue}"`, "error");
      
      if (currentStep.isCritical) {
        setCriticalFailures(prev => prev + 1);
        addLog("⚠ PASO CRÍTICO FALLIDO - Valor incorrecto en acción crítica.", "error");
      }
      
      setFeedback({
        isOpen: true,
        isCorrect: false,
        title: currentStep.isCritical ? "⚠ Falla Crítica" : "Valor Incorrecto",
        message: `${currentStep.incorrectResponse} (Se esperaba: ${currentStep.expectedValue})`,
        alternativeInterpretation: currentStep.alternativeInterpretation || undefined,
        points: 0,
      });
    }
    
    setInputModal({ isOpen: false, actionType: "", actionLabel: "" });
    setInputValue("");
  };

  const closeFeedback = () => {
    setFeedback(prev => ({ ...prev, isOpen: false }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Cargando simulador...</p>
        </div>
      </div>
    );
  }

  if (!scenario) return <div className="min-h-screen bg-background flex items-center justify-center text-red-500 font-bold text-lg">Escenario no encontrado</div>;

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

           {/* Current Step Objective - Only show if configured steps exist */}
           {hasConfiguredSteps && currentStep && !isCompleted && (
             <Card className="border-accent/50 bg-accent/5">
               <CardContent className="p-4">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="h-10 w-10 rounded-full bg-accent/20 border border-accent/50 flex items-center justify-center">
                       <Target className="h-5 w-5 text-accent" />
                     </div>
                     <div>
                       <div className="text-xs text-muted-foreground mb-1">Paso {currentStepIndex + 1} de {scenarioSteps.length}</div>
                       <div className="font-medium text-foreground">{currentStep.actionDescription}</div>
                       <div className="text-xs text-muted-foreground mt-1">
                         Acción requerida: <span className="text-accent">{ACTION_TYPE_LABELS[currentStep.actionType] || currentStep.actionType}</span>
                         {currentStep.isCritical && <Badge variant="destructive" className="ml-2 text-[10px]">Crítico</Badge>}
                       </div>
                     </div>
                   </div>
                   <div className="text-right">
                     <div className="text-2xl font-bold text-accent">{currentStep.points} pts</div>
                     {currentStep.timeLimit && (
                       <div className={cn(
                         "flex items-center gap-1 text-xs",
                         stepElapsedTime >= currentStep.timeLimit * 0.8 ? "text-red-400 animate-pulse" : "text-muted-foreground"
                       )}>
                         <Clock className="h-3 w-3" />
                         {currentStep.timeLimit - stepElapsedTime > 0 
                           ? `${currentStep.timeLimit - stepElapsedTime}s restantes`
                           : "¡Tiempo agotado!"
                         }
                       </div>
                     )}
                     {currentStep.expectedValue && (
                       <div className="text-xs text-amber-400 mt-1">
                         Valor: {currentStep.expectedValue}
                       </div>
                     )}
                   </div>
                 </div>
               </CardContent>
             </Card>
           )}

           {/* Completion Summary */}
           {isCompleted && (
             <Card className={cn(
               "border-2",
               criticalFailures > 0 ? "border-red-500/50 bg-red-500/10" : "border-emerald-500/50 bg-emerald-500/10"
             )}>
               <CardContent className="p-6 text-center">
                 <Award className={cn("h-12 w-12 mx-auto mb-4", criticalFailures > 0 ? "text-red-500" : "text-emerald-500")} />
                 <h3 className={cn("text-xl font-bold mb-2", criticalFailures > 0 ? "text-red-500" : "text-emerald-500")}>
                   {criticalFailures > 0 ? "Simulación Finalizada con Fallas" : "¡Simulación Completada!"}
                 </h3>
                 <div className="text-3xl font-bold text-foreground mb-2">{totalPoints} / {maxPoints} puntos</div>
                 <div className="text-sm text-muted-foreground mb-2">
                   {stepResults.filter(r => r.isCorrect).length} de {stepResults.length} acciones correctas
                 </div>
                 {criticalFailures > 0 && (
                   <div className="text-sm text-red-400 mb-2">
                     ⚠ {criticalFailures} falla(s) crítica(s) registrada(s)
                   </div>
                 )}
                 <Button onClick={() => setLocation("/simulator")} className="mt-4 bg-accent text-accent-foreground">
                   Volver a Escenarios
                 </Button>
               </CardContent>
             </Card>
           )}

           {/* Control Panel */}
           <div className="grid grid-cols-4 gap-4">
             <Button 
               variant="outline" 
               className={cn(
                 "h-24 flex flex-col gap-2 border-white/10 transition-all",
                 hasConfiguredSteps && currentStep?.actionType === "breaker_open" 
                   ? "border-accent/50 bg-accent/10 text-accent"
                   : "hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-400"
               )}
               onClick={() => handleAction("breaker_open", "Abrir Interruptor 52-1")}
               disabled={!isRunning || isCompleted}
               data-testid="button-breaker-open"
             >
               <Power className="h-8 w-8" />
               <span className="text-xs font-mono">ABRIR INT 52-1</span>
             </Button>
             <Button 
               variant="outline" 
               className={cn(
                 "h-24 flex flex-col gap-2 border-white/10 transition-all",
                 hasConfiguredSteps && currentStep?.actionType === "breaker_close" 
                   ? "border-accent/50 bg-accent/10 text-accent"
                   : "hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-400"
               )}
               onClick={() => handleAction("breaker_close", "Cerrar Interruptor 52-1")}
               disabled={!isRunning || isCompleted}
               data-testid="button-breaker-close"
             >
               <RotateCcw className="h-8 w-8" />
               <span className="text-xs font-mono">CERRAR INT 52-1</span>
             </Button>
             <Button 
               variant="outline" 
               className={cn(
                 "h-24 flex flex-col gap-2 border-white/10 transition-all",
                 hasConfiguredSteps && currentStep?.actionType === "load_transfer" 
                   ? "border-accent/50 bg-accent/10 text-accent"
                   : "hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-400"
               )}
               onClick={() => handleAction("load_transfer", "Transferir Carga B")}
               disabled={!isRunning || isCompleted}
               data-testid="button-load-transfer"
             >
               <Activity className="h-8 w-8" />
               <span className="text-xs font-mono">TRANSFERIR CARGA</span>
             </Button>
             <Button 
               variant="outline" 
               className={cn(
                 "h-24 flex flex-col gap-2 border-white/10 transition-all",
                 hasConfiguredSteps && currentStep?.actionType === "protection_check" 
                   ? "border-accent/50 bg-accent/10 text-accent"
                   : "hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-400"
               )}
               onClick={() => handleAction("protection_check", "Verificar Protección")}
               disabled={!isRunning || isCompleted}
               data-testid="button-protection-check"
             >
               <CheckCircle className="h-8 w-8" />
               <span className="text-xs font-mono">VERIFICAR PROT</span>
             </Button>
           </div>

           {/* Additional Action Buttons - Row 1 */}
           <div className="grid grid-cols-4 gap-4">
             <Button 
               variant="outline" 
               className={cn(
                 "h-20 flex flex-col gap-2 border-white/10 transition-all",
                 hasConfiguredSteps && currentStep?.actionType === "alarm_acknowledge" 
                   ? "border-accent/50 bg-accent/10 text-accent"
                   : "hover:border-amber-500/50 hover:bg-amber-500/10 hover:text-amber-400"
               )}
               onClick={() => handleAction("alarm_acknowledge", "Reconocer Alarma")}
               disabled={!isRunning || isCompleted}
               data-testid="button-alarm-acknowledge"
             >
               <AlertTriangle className="h-6 w-6" />
               <span className="text-xs font-mono">RECONOCER ALARMA</span>
             </Button>
             <Button 
               variant="outline" 
               className={cn(
                 "h-20 flex flex-col gap-2 border-white/10 transition-all",
                 hasConfiguredSteps && currentStep?.actionType === "isolation" 
                   ? "border-accent/50 bg-accent/10 text-accent"
                   : "hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
               )}
               onClick={() => handleAction("isolation", "Aislar Equipo")}
               disabled={!isRunning || isCompleted}
               data-testid="button-isolation"
             >
               <XCircle className="h-6 w-6" />
               <span className="text-xs font-mono">AISLAR EQUIPO</span>
             </Button>
             <Button 
               variant="outline" 
               className={cn(
                 "h-20 flex flex-col gap-2 border-white/10 transition-all",
                 hasConfiguredSteps && currentStep?.actionType === "grounding" 
                   ? "border-accent/50 bg-accent/10 text-accent"
                   : "hover:border-yellow-500/50 hover:bg-yellow-500/10 hover:text-yellow-400"
               )}
               onClick={() => handleAction("grounding", "Puesta a Tierra")}
               disabled={!isRunning || isCompleted}
               data-testid="button-grounding"
             >
               <Zap className="h-6 w-6" />
               <span className="text-xs font-mono">PUESTA A TIERRA</span>
             </Button>
             <Button 
               variant="outline" 
               className={cn(
                 "h-20 flex flex-col gap-2 border-white/10 transition-all",
                 hasConfiguredSteps && currentStep?.actionType === "communication" 
                   ? "border-accent/50 bg-accent/10 text-accent"
                   : "hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-400"
               )}
               onClick={() => handleAction("communication", "Comunicación Operativa")}
               disabled={!isRunning || isCompleted}
               data-testid="button-communication"
             >
               <Radio className="h-6 w-6" />
               <span className="text-xs font-mono">COMUNICACIÓN</span>
             </Button>
           </div>

           {/* Additional Action Buttons - Row 2 */}
           <div className="grid grid-cols-4 gap-4">
             <Button 
               variant="outline" 
               className={cn(
                 "h-20 flex flex-col gap-2 border-white/10 transition-all",
                 hasConfiguredSteps && currentStep?.actionType === "voltage_adjust" 
                   ? "border-accent/50 bg-accent/10 text-accent"
                   : "hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-purple-400"
               )}
               onClick={() => handleAction("voltage_adjust", "Ajustar Voltaje")}
               disabled={!isRunning || isCompleted}
               data-testid="button-voltage-adjust"
             >
               <Activity className="h-6 w-6" />
               <span className="text-xs font-mono">AJUSTAR VOLTAJE</span>
             </Button>
             <Button 
               variant="outline" 
               className={cn(
                 "h-20 flex flex-col gap-2 border-white/10 transition-all",
                 hasConfiguredSteps && currentStep?.actionType === "custom" 
                   ? "border-accent/50 bg-accent/10 text-accent"
                   : "hover:border-slate-500/50 hover:bg-slate-500/10 hover:text-slate-400"
               )}
               onClick={() => handleAction("custom", "Acción Personalizada")}
               disabled={!isRunning || isCompleted}
               data-testid="button-custom"
             >
               <Settings className="h-6 w-6" />
               <span className="text-xs font-mono">ACCIÓN CUSTOM</span>
             </Button>
             <div className="col-span-2"></div>
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

           {/* Progress Tracker - Show if configured steps */}
           {hasConfiguredSteps && (
             <Card className="border-white/10 bg-card/50">
               <CardHeader className="py-3 border-b border-white/10">
                 <CardTitle className="text-xs font-mono uppercase tracking-widest flex items-center justify-between">
                   <span>Progreso de Validación</span>
                   <span className="text-accent">{totalPoints} / {maxPoints} pts</span>
                 </CardTitle>
               </CardHeader>
               <CardContent className="p-4">
                 <div className="flex gap-1">
                   {scenarioSteps.map((step, idx) => {
                     const result = stepResults.find(r => r.stepId === step.id);
                     return (
                       <div 
                         key={step.id}
                         className={cn(
                           "flex-1 h-3 rounded-full transition-all",
                           idx === currentStepIndex && !result ? "bg-accent/50 animate-pulse" :
                           result?.isCorrect ? "bg-emerald-500" :
                           result ? "bg-red-500" :
                           "bg-muted"
                         )}
                         title={`Paso ${idx + 1}: ${step.actionDescription}`}
                       />
                     );
                   })}
                 </div>
               </CardContent>
             </Card>
           )}
        </div>

      </div>

      {/* Feedback Modal */}
      {feedback.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeFeedback}>
          <div 
            className={cn(
              "w-full max-w-lg rounded-xl border-2 p-6 shadow-2xl animate-in zoom-in-95 duration-200",
              feedback.isCorrect 
                ? "bg-emerald-950 border-emerald-500/50" 
                : "bg-red-950 border-red-500/50"
            )}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-4">
              {feedback.isCorrect ? (
                <div className="h-14 w-14 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
              ) : (
                <div className="h-14 w-14 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              )}
              <div>
                <h3 className={cn("text-xl font-bold", feedback.isCorrect ? "text-emerald-400" : "text-red-400")}>
                  {feedback.title}
                </h3>
                {feedback.isCorrect && feedback.points > 0 && (
                  <div className="flex items-center gap-1 text-emerald-300">
                    <Award className="h-4 w-4" />
                    <span>+{feedback.points} puntos</span>
                  </div>
                )}
              </div>
            </div>
            
            <p className="text-foreground mb-4">{feedback.message}</p>
            
            {/* Alternative Interpretation - Only show for incorrect actions */}
            {!feedback.isCorrect && feedback.alternativeInterpretation && (
              <div className="bg-amber-950/50 border border-amber-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-amber-400 font-medium mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>¿Qué pasaría si...?</span>
                </div>
                <p className="text-amber-200/80 text-sm">{feedback.alternativeInterpretation}</p>
              </div>
            )}
            
            <Button 
              onClick={closeFeedback} 
              className={cn(
                "w-full",
                feedback.isCorrect 
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                  : "bg-red-600 hover:bg-red-700 text-white"
              )}
            >
              {feedback.isCorrect ? "Continuar" : "Intentar de nuevo"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Input Value Modal */}
      {inputModal.isOpen && currentStep && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div 
            className="w-full max-w-md rounded-xl border-2 border-accent/50 bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-accent/20 border border-accent/50 flex items-center justify-center">
                <Target className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{inputModal.actionLabel}</h3>
                <p className="text-sm text-muted-foreground">Ingresa el valor requerido</p>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="text-sm font-medium text-muted-foreground block mb-2">
                {currentStep.actionDescription}
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInputSubmit()}
                placeholder={`Valor esperado: ${currentStep.expectedValue}`}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground text-lg font-mono focus:outline-none focus:ring-2 focus:ring-accent"
                autoFocus
                data-testid="input-expected-value"
              />
              <p className="text-xs text-amber-400 mt-2">
                Nota: Ingresa exactamente "{currentStep.expectedValue}"
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setInputModal({ isOpen: false, actionType: "", actionLabel: "" });
                  setInputValue("");
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleInputSubmit}
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                data-testid="button-submit-value"
              >
                Confirmar <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
