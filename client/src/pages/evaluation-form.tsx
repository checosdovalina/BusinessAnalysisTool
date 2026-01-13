import DashboardShell from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, CheckCircle2, XCircle, Camera, Save, AlertCircle, Loader2, Plus, ClipboardList, Percent } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cyclesAPI, eventsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const EVALUATION_TOPICS = [
  { value: "control_voltaje", label: "Control de Voltaje" },
  { value: "conocimiento_procedimientos", label: "Conocimiento de Procedimientos Operativos" },
  { value: "ejecucion_procedimientos", label: "Ejecución de Procedimientos Operativos" },
  { value: "control_frecuencia", label: "Control de Frecuencia" },
  { value: "topologia", label: "Topología" },
  { value: "comunicacion_operativa", label: "Comunicación Operativa" },
  { value: "protecciones_electricas", label: "Conceptos de Protecciones Eléctricas" },
  { value: "personalizado", label: "Personalizado" },
];

export default function EvaluationForm() {
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute("/evaluations/:id");
  const cycleId = params?.id ? parseInt(params.id) : null;
  
  const { data: cycle, isLoading: cycleLoading } = useQuery({
    queryKey: ["cycle", cycleId],
    queryFn: () => cycleId ? cyclesAPI.getById(cycleId) : Promise.reject("No cycle ID"),
    enabled: !!cycleId,
  });

  const { data: cycleEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["events", cycleId],
    queryFn: () => cycleId ? eventsAPI.getByCycle(cycleId) : Promise.resolve([]),
    enabled: !!cycleId,
  });
  
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [scores, setScores] = useState<Record<number, string>>({});
  const [partialPercentages, setPartialPercentages] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    if (cycleEvents.length > 0 && !hasHydrated) {
      const initialScores: Record<number, string> = {};
      const initialPartialPercentages: Record<number, number> = {};
      const initialFeedback: Record<number, string> = {};
      
      cycleEvents.forEach((event) => {
        if (event.status === "pass") {
          if (event.score === event.maxScore) {
            initialScores[event.id] = "pass";
          } else if (event.score > 0 && event.score < event.maxScore) {
            initialScores[event.id] = "partial";
            const percentage = Math.round((event.score / event.maxScore) * 100);
            initialPartialPercentages[event.id] = Math.min(80, Math.max(10, Math.round(percentage / 10) * 10));
          } else {
            initialScores[event.id] = "pass";
          }
        } else if (event.status === "fail") {
          initialScores[event.id] = "fail";
        } else if (event.status === "skipped") {
          initialScores[event.id] = "na";
        }
        
        if (event.feedback) {
          initialFeedback[event.id] = event.feedback;
        }
      });
      
      setScores(initialScores);
      setPartialPercentages(initialPartialPercentages);
      setFeedback(initialFeedback);
      setHasHydrated(true);
    }
  }, [cycleEvents, hasHydrated]);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    specificObjective: "",
    evaluationTopic: "",
    maxScore: "20",
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createEventMutation = useMutation({
    mutationFn: async (data: { cycleId: number; title: string; description: string; specificObjective?: string; evaluationTopic?: string; maxScore: number }) => {
      return eventsAPI.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", cycleId] });
      setShowEventDialog(false);
      setNewEvent({ title: "", description: "", specificObjective: "", evaluationTopic: "", maxScore: "20" });
      toast({
        title: "Evento creado",
        description: "El evento de evaluación se agregó correctamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo crear el evento.",
        variant: "destructive",
      });
    },
  });

  const handleCreateEvent = () => {
    if (!cycleId || !newEvent.title || !newEvent.description) return;
    createEventMutation.mutate({
      cycleId,
      title: newEvent.title,
      description: newEvent.description,
      specificObjective: newEvent.specificObjective || undefined,
      evaluationTopic: newEvent.evaluationTopic || undefined,
      maxScore: parseFloat(newEvent.maxScore) || 20,
    });
  };

  const updateEventMutation = useMutation({
    mutationFn: async ({ eventId, data }: { eventId: number; data: { status: "pending" | "pass" | "fail" | "skipped"; score: number; feedback?: string } }) => {
      return eventsAPI.update(eventId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", cycleId] });
    },
  });

  const updateCycleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { status?: "pending" | "in_progress" | "completed"; progress?: number; score?: number } }) => {
      return cyclesAPI.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cycles"] });
    },
  });

  if (cycleLoading || eventsLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="h-12 w-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Cargando evaluación...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (!cycle) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-muted-foreground">Ciclo no encontrado</p>
          <Button onClick={() => setLocation("/evaluations")}>Volver a Evaluaciones</Button>
        </div>
      </DashboardShell>
    );
  }

  if (cycleEvents.length === 0) {
    return (
      <DashboardShell>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/evaluations")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-xl font-bold font-heading">{cycle.title}</h2>
              <p className="text-sm text-muted-foreground">{cycle.qualityCode}</p>
            </div>
          </div>

          <Card className="border-border/60 shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                <ClipboardList className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Sin eventos de evaluación</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Este ciclo aún no tiene eventos configurados. Agrega eventos para definir los criterios de evaluación del operador.
              </p>
              <Button 
                onClick={() => setShowEventDialog(true)}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                data-testid="button-add-first-event"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Primer Evento
              </Button>
            </CardContent>
          </Card>
        </div>

        <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
          <DialogContent className="sm:max-w-lg bg-card border-border/60">
            <DialogHeader>
              <DialogTitle>Nuevo Evento de Evaluación</DialogTitle>
              <DialogDescription>
                Define un evento para evaluar al operador durante este ciclo.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="event-title">Título del Evento *</Label>
                <Input
                  id="event-title"
                  placeholder="Ej: Verificación de Procedimientos de Seguridad"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  data-testid="input-event-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-description">Descripción *</Label>
                <Textarea
                  id="event-description"
                  placeholder="Describe las acciones esperadas del operador..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  className="min-h-[80px]"
                  data-testid="input-event-description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-objective">Objetivo Específico</Label>
                <Input
                  id="event-objective"
                  placeholder="Objetivo particular de este evento"
                  value={newEvent.specificObjective}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, specificObjective: e.target.value }))}
                  data-testid="input-event-objective"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event-topic">Tema de Evaluación</Label>
                  <Select value={newEvent.evaluationTopic} onValueChange={(value) => setNewEvent(prev => ({ ...prev, evaluationTopic: value }))}>
                    <SelectTrigger data-testid="select-event-topic">
                      <SelectValue placeholder="Seleccionar tema" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVALUATION_TOPICS.map(topic => (
                        <SelectItem key={topic.value} value={topic.value}>{topic.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-score">Puntos Máximos</Label>
                  <Input
                    id="event-score"
                    type="number"
                    min="1"
                    max="100"
                    value={newEvent.maxScore}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, maxScore: e.target.value }))}
                    data-testid="input-event-score"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEventDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateEvent}
                disabled={!newEvent.title || !newEvent.description || createEventMutation.isPending}
                data-testid="button-save-event"
              >
                {createEventMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
                ) : (
                  "Guardar Evento"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardShell>
    );
  }

  const currentEvent = cycleEvents[currentEventIndex];
  const isLastEvent = currentEventIndex === cycleEvents.length - 1;

  const handleScoreChange = (value: string) => {
    if (currentEvent) {
      setScores(prev => ({ ...prev, [currentEvent.id]: value }));
      if (value === "partial" && !partialPercentages[currentEvent.id]) {
        setPartialPercentages(prev => ({ ...prev, [currentEvent.id]: 50 }));
      }
    }
  };

  const handlePartialPercentageChange = (value: number[]) => {
    if (currentEvent) {
      setPartialPercentages(prev => ({ ...prev, [currentEvent.id]: value[0] }));
    }
  };

  const handleFeedbackChange = (value: string) => {
    if (currentEvent) {
      setFeedback(prev => ({ ...prev, [currentEvent.id]: value }));
    }
  };

  const saveCurrentEvent = async () => {
    if (!currentEvent) return;

    const scoreValue = scores[currentEvent.id];
    const feedbackValue = feedback[currentEvent.id] || "";
    
    let status: "pending" | "pass" | "fail" | "skipped";
    let score: number;

    if (scoreValue === "pass") {
      status = "pass";
      score = currentEvent.maxScore;
    } else if (scoreValue === "partial") {
      status = "pass";
      const percentage = partialPercentages[currentEvent.id] || 50;
      score = Math.round((currentEvent.maxScore * percentage) / 100);
    } else if (scoreValue === "fail") {
      status = "fail";
      score = 0;
    } else {
      status = "skipped";
      score = 0;
    }

    try {
      await updateEventMutation.mutateAsync({
        eventId: currentEvent.id,
        data: { status, score, feedback: feedbackValue },
      });

      const progress = Math.round(((currentEventIndex + 1) / cycleEvents.length) * 100);
      await updateCycleMutation.mutateAsync({
        id: cycle.id,
        data: { progress },
      });

      toast({
        title: "Evento guardado",
        description: "El evento ha sido evaluado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la evaluación.",
        variant: "destructive",
      });
    }
  };

  const handleNext = async () => {
    await saveCurrentEvent();

    if (isLastEvent) {
      const totalScore = cycleEvents.reduce((acc, event) => {
        const scoreVal = scores[event.id];
        if (scoreVal === "pass") {
          return acc + event.maxScore;
        } else if (scoreVal === "partial") {
          const percentage = partialPercentages[event.id] || 50;
          return acc + Math.round((event.maxScore * percentage) / 100);
        }
        return acc;
      }, 0);
      const maxTotalScore = cycleEvents.reduce((acc, event) => acc + event.maxScore, 0);
      const finalScore = Math.round((totalScore / maxTotalScore) * 100);

      await updateCycleMutation.mutateAsync({
        id: cycle.id,
        data: { status: "completed", progress: 100, score: finalScore },
      });

      toast({
        title: "Evaluación completada",
        description: `Calificación final: ${finalScore}%`,
      });
      
      setLocation("/evaluations");
    } else {
      setCurrentEventIndex(prev => prev + 1);
    }
  };

  const isSaving = updateEventMutation.isPending || updateCycleMutation.isPending;

  return (
    <DashboardShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/evaluations")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold font-heading">{cycle.title}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Alumno: Juan Operador</span>
              <span>•</span>
              <Badge variant="outline" className="text-xs font-normal">En Progreso</Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          {/* Sidebar Progress */}
          <div className="hidden md:block space-y-4">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Progreso del Ciclo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Avance Total</span>
                    <span>{Math.round(((currentEventIndex) / cycleEvents.length) * 100)}%</span>
                  </div>
                  <Progress value={((currentEventIndex) / cycleEvents.length) * 100} className="h-2" />
                </div>

                <div className="space-y-1 pt-4">
                  {cycleEvents.map((event, idx) => {
                    const isCurrent = idx === currentEventIndex;
                    const isCompleted = idx < currentEventIndex || scores[event.id];
                    
                    return (
                      <div 
                        key={event.id}
                        className={cn(
                          "text-sm p-2 rounded-md flex items-start gap-2 cursor-pointer transition-colors",
                          isCurrent ? "bg-accent/10 text-accent-foreground font-medium" : "text-muted-foreground hover:bg-muted",
                          isCompleted && !isCurrent && "text-emerald-600"
                        )}
                        onClick={() => setCurrentEventIndex(idx)}
                      >
                        <div className="mt-0.5">
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <div className={cn("h-4 w-4 rounded-full border-2", isCurrent ? "border-accent" : "border-muted-foreground/30")} />
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="line-clamp-2 text-xs">{event.title}</span>
                          {event.evaluationTopic && (
                            <span className="text-[10px] text-muted-foreground/70">
                              {EVALUATION_TOPICS.find(t => t.value === event.evaluationTopic)?.label || event.evaluationTopic}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Form Area */}
          <div className="space-y-6">
            <Card className="border-border/60 shadow-md overflow-hidden">
              <div className="bg-muted/30 border-b border-border/50 p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-accent tracking-wider uppercase">Evento {currentEventIndex + 1} de {cycleEvents.length}</span>
                    <h3 className="text-2xl font-bold mt-1 font-heading text-foreground">{currentEvent.title}</h3>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <Badge variant="outline" className="bg-background">Puntos: {currentEvent.maxScore}</Badge>
                    {currentEvent.evaluationTopic && (
                      <Badge variant="secondary" className="text-xs">
                        {EVALUATION_TOPICS.find(t => t.value === currentEvent.evaluationTopic)?.label || currentEvent.evaluationTopic}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-muted-foreground mt-2">{currentEvent.description}</p>
              </div>

              <CardContent className="p-6 space-y-8">
                {/* Evaluation Criteria */}
                <div className="space-y-4">
                  <Label className="text-base">Calificación del Desempeño</Label>
                  <RadioGroup 
                    value={scores[currentEvent.id] || "pending"} 
                    onValueChange={handleScoreChange}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                  >
                    <Label
                      htmlFor="r-pass"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent/5 hover:text-accent-foreground [&:has([data-state=checked])]:border-emerald-500 [&:has([data-state=checked])]:bg-emerald-500/10 cursor-pointer transition-all"
                    >
                      <RadioGroupItem value="pass" id="r-pass" className="sr-only" />
                      <CheckCircle2 className="mb-2 h-5 w-5 text-emerald-500" />
                      <div className="text-center">
                        <div className="font-bold text-sm">Cumple 100%</div>
                        <span className="text-xs text-muted-foreground">Ejecución correcta</span>
                      </div>
                    </Label>

                    <Label
                      htmlFor="r-partial"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent/5 hover:text-accent-foreground [&:has([data-state=checked])]:border-amber-500 [&:has([data-state=checked])]:bg-amber-500/10 cursor-pointer transition-all"
                    >
                      <RadioGroupItem value="partial" id="r-partial" className="sr-only" />
                      <Percent className="mb-2 h-5 w-5 text-amber-500" />
                      <div className="text-center">
                        <div className="font-bold text-sm">Parcial</div>
                        <span className="text-xs text-muted-foreground">10% - 80%</span>
                      </div>
                    </Label>

                    <Label
                      htmlFor="r-fail"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent/5 hover:text-accent-foreground [&:has([data-state=checked])]:border-destructive [&:has([data-state=checked])]:bg-red-500/10 cursor-pointer transition-all"
                    >
                      <RadioGroupItem value="fail" id="r-fail" className="sr-only" />
                      <XCircle className="mb-2 h-5 w-5 text-destructive" />
                      <div className="text-center">
                        <div className="font-bold text-sm">No Cumple</div>
                        <span className="text-xs text-muted-foreground">Error crítico</span>
                      </div>
                    </Label>

                    <Label
                      htmlFor="r-na"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent/5 hover:text-accent-foreground [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5 cursor-pointer transition-all"
                    >
                      <RadioGroupItem value="na" id="r-na" className="sr-only" />
                      <AlertCircle className="mb-2 h-5 w-5 text-muted-foreground" />
                      <div className="text-center">
                        <div className="font-bold text-sm">No Aplica</div>
                        <span className="text-xs text-muted-foreground">No realizado</span>
                      </div>
                    </Label>
                  </RadioGroup>

                  {scores[currentEvent.id] === "partial" && (
                    <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-amber-200 font-medium">Porcentaje de Calificación</Label>
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-lg px-3">
                          {partialPercentages[currentEvent.id] || 50}%
                        </Badge>
                      </div>
                      <Slider
                        value={[partialPercentages[currentEvent.id] || 50]}
                        onValueChange={handlePartialPercentageChange}
                        min={10}
                        max={80}
                        step={10}
                        className="py-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>10%</span>
                        <span>20%</span>
                        <span>30%</span>
                        <span>40%</span>
                        <span>50%</span>
                        <span>60%</span>
                        <span>70%</span>
                        <span>80%</span>
                      </div>
                      <p className="text-xs text-amber-300/70 mt-2">
                        Puntos a otorgar: <span className="font-bold">{Math.round((currentEvent.maxScore * (partialPercentages[currentEvent.id] || 50)) / 100)}</span> de {currentEvent.maxScore}
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Feedback */}
                <div className="space-y-4">
                  <Label htmlFor="feedback">Observaciones y Retroalimentación</Label>
                  <Textarea 
                    id="feedback" 
                    placeholder="Ingrese comentarios detallados sobre el desempeño..." 
                    className="min-h-[120px] resize-none bg-muted/20"
                    value={feedback[currentEvent.id] || ""}
                    onChange={(e) => handleFeedbackChange(e.target.value)}
                    data-testid="textarea-feedback"
                  />
                </div>

                {/* Evidence */}
                <div className="space-y-4">
                  <Label>Evidencias (Fotos/Videos)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-muted/20 transition-colors cursor-pointer">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <Camera className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">Arrastra archivos o haz clic para subir</p>
                    <p className="text-xs text-muted-foreground mt-1">Soporta JPG, PNG, MP4 (Max 10MB)</p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="bg-muted/30 p-6 flex justify-between border-t border-border/50">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentEventIndex(prev => Math.max(0, prev - 1))} 
                  disabled={currentEventIndex === 0 || isSaving}
                  data-testid="button-previous"
                >
                  Anterior
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    className="text-muted-foreground"
                    onClick={saveCurrentEvent}
                    disabled={isSaving || !scores[currentEvent.id]}
                    data-testid="button-save-draft"
                  >
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar
                  </Button>
                  <Button 
                    onClick={handleNext} 
                    className="bg-primary text-primary-foreground shadow-md hover:shadow-lg"
                    disabled={isSaving || !scores[currentEvent.id]}
                    data-testid="button-next"
                  >
                    {isSaving ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
                    ) : (
                      isLastEvent ? "Finalizar Evaluación" : "Siguiente Evento"
                    )}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
