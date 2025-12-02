import DashboardShell from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { events, cycles } from "@/lib/mock-data";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, CheckCircle2, XCircle, Camera, Save, AlertCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function EvaluationForm() {
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute("/evaluations/:id");
  const cycleId = params?.id;
  
  const cycle = cycles.find(c => c.id === cycleId);
  const cycleEvents = events.filter(e => e.cycleId === cycleId);
  
  // Simple state for demo purposes
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, string>>({});

  if (!cycle) return <div>Ciclo no encontrado</div>;

  const currentEvent = cycleEvents[currentEventIndex];
  const isLastEvent = currentEventIndex === cycleEvents.length - 1;

  const handleScoreChange = (value: string) => {
    setScores(prev => ({ ...prev, [currentEvent.id]: value }));
  };

  const handleNext = () => {
    if (isLastEvent) {
      // Finish
      setLocation("/evaluations");
    } else {
      setCurrentEventIndex(prev => prev + 1);
    }
  };

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
                        <span className="line-clamp-2 text-xs">{event.title}</span>
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
                  <Badge variant="outline" className="bg-background">Puntos: {currentEvent.maxScore}</Badge>
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
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                  >
                    <Label
                      htmlFor="r-pass"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent/5 hover:text-accent-foreground [&:has([data-state=checked])]:border-emerald-500 [&:has([data-state=checked])]:bg-emerald-50/50 cursor-pointer transition-all"
                    >
                      <RadioGroupItem value="pass" id="r-pass" className="sr-only" />
                      <CheckCircle2 className="mb-3 h-6 w-6 text-emerald-500" />
                      <div className="text-center">
                        <div className="font-bold">Cumple Estándar</div>
                        <span className="text-xs text-muted-foreground">Ejecución correcta y segura</span>
                      </div>
                    </Label>

                    <Label
                      htmlFor="r-fail"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent/5 hover:text-accent-foreground [&:has([data-state=checked])]:border-destructive [&:has([data-state=checked])]:bg-red-50/50 cursor-pointer transition-all"
                    >
                      <RadioGroupItem value="fail" id="r-fail" className="sr-only" />
                      <XCircle className="mb-3 h-6 w-6 text-destructive" />
                      <div className="text-center">
                        <div className="font-bold">No Cumple</div>
                        <span className="text-xs text-muted-foreground">Desviación crítica o error</span>
                      </div>
                    </Label>

                    <Label
                      htmlFor="r-na"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent/5 hover:text-accent-foreground [&:has([data-state=checked])]:border-primary [&:has([data-state=checked])]:bg-primary/5 cursor-pointer transition-all"
                    >
                      <RadioGroupItem value="na" id="r-na" className="sr-only" />
                      <AlertCircle className="mb-3 h-6 w-6 text-muted-foreground" />
                      <div className="text-center">
                        <div className="font-bold">No Aplica</div>
                        <span className="text-xs text-muted-foreground">Evento no realizado</span>
                      </div>
                    </Label>
                  </RadioGroup>
                </div>

                <Separator />

                {/* Feedback */}
                <div className="space-y-4">
                  <Label htmlFor="feedback">Observaciones y Retroalimentación</Label>
                  <Textarea 
                    id="feedback" 
                    placeholder="Ingrese comentarios detallados sobre el desempeño..." 
                    className="min-h-[120px] resize-none bg-muted/20"
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
                <Button variant="outline" onClick={() => setCurrentEventIndex(prev => Math.max(0, prev - 1))} disabled={currentEventIndex === 0}>
                  Anterior
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" className="text-muted-foreground">
                    <Save className="mr-2 h-4 w-4" /> Guardar Borrador
                  </Button>
                  <Button onClick={handleNext} className="bg-primary text-primary-foreground shadow-md hover:shadow-lg">
                    {isLastEvent ? "Finalizar Evaluación" : "Siguiente Evento"}
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
