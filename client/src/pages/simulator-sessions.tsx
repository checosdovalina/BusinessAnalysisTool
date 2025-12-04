import { useState } from "react";
import DashboardShell from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Play, Activity, Zap, AlertTriangle, Server, GitBranch, X, Plus, Trash2, ChevronRight, ChevronLeft, Settings, CheckCircle2, Edit, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { SimulatorScenario } from "@shared/schema";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { simulatorScenariosAPI, scenarioStepsAPI } from "@/lib/api";
import simImg from "@assets/generated_images/electrical_grid_simulator_interface.png";
import { toast } from "sonner";
import type { InsertScenarioStep } from "@shared/schema";

interface StepConfig {
  stepOrder: number;
  actionType: string;
  actionDescription: string;
  expectedValue: string;
  correctResponse: string;
  incorrectResponse: string;
  alternativeInterpretation: string;
  points: number;
  isCritical: boolean;
  timeLimit: number | null;
}

const ACTION_TYPES = [
  { value: "breaker_open", label: "Abrir Interruptor" },
  { value: "breaker_close", label: "Cerrar Interruptor" },
  { value: "voltage_adjust", label: "Ajustar Voltaje" },
  { value: "load_transfer", label: "Transferir Carga" },
  { value: "communication", label: "Comunicación Operativa" },
  { value: "alarm_acknowledge", label: "Reconocer Alarma" },
  { value: "protection_check", label: "Verificar Protección" },
  { value: "isolation", label: "Aislar Equipo" },
  { value: "grounding", label: "Puesta a Tierra" },
  { value: "custom", label: "Acción Personalizada" },
];

export default function SimulatorSessions() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [formData, setFormData] = useState<{title: string; category: "Fault" | "Overload" | "Topology"; difficulty: "Easy" | "Medium" | "Hard"; description: string}>({
    title: "",
    category: "Fault",
    difficulty: "Medium",
    description: "",
  });
  const [steps, setSteps] = useState<StepConfig[]>([]);
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<SimulatorScenario | null>(null);
  const [editFormData, setEditFormData] = useState<{title: string; category: "Fault" | "Overload" | "Topology"; difficulty: "Easy" | "Medium" | "Hard"; description: string}>({
    title: "",
    category: "Fault",
    difficulty: "Medium",
    description: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scenarioToDelete, setScenarioToDelete] = useState<SimulatorScenario | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: scenarios = [], isLoading } = useQuery({
    queryKey: ["simulator-scenarios"],
    queryFn: () => simulatorScenariosAPI.getAll(),
  });

  const addStep = () => {
    setSteps([...steps, {
      stepOrder: steps.length + 1,
      actionType: "breaker_open",
      actionDescription: "",
      expectedValue: "",
      correctResponse: "¡Correcto! La acción se ejecutó adecuadamente.",
      incorrectResponse: "Incorrecto. Esta no es la acción esperada en este momento.",
      alternativeInterpretation: "",
      points: 10,
      isCritical: false,
      timeLimit: null,
    }]);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps.map((s, i) => ({ ...s, stepOrder: i + 1 })));
  };

  const updateStep = (index: number, field: keyof StepConfig, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const resetForm = () => {
    setFormData({ title: "", category: "Fault", difficulty: "Medium", description: "" });
    setSteps([]);
    setCreateStep(1);
    setIsCreateOpen(false);
  };

  const handleEditClick = (scenario: SimulatorScenario) => {
    setEditingScenario(scenario);
    setEditFormData({
      title: scenario.title,
      category: scenario.category as "Fault" | "Overload" | "Topology",
      difficulty: scenario.difficulty as "Easy" | "Medium" | "Hard",
      description: scenario.description || "",
    });
    setIsEditOpen(true);
  };

  const handleUpdateScenario = async () => {
    if (!editingScenario || !editFormData.title.trim()) {
      toast.error("El nombre del escenario es obligatorio");
      return;
    }

    setIsUpdating(true);
    try {
      await simulatorScenariosAPI.update(editingScenario.id, editFormData);
      toast.success("Escenario actualizado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["simulator-scenarios"] });
      setIsEditOpen(false);
      setEditingScenario(null);
    } catch (error) {
      toast.error("Error al actualizar el escenario");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (scenario: SimulatorScenario) => {
    setScenarioToDelete(scenario);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!scenarioToDelete) return;

    setIsDeleting(true);
    try {
      await simulatorScenariosAPI.delete(scenarioToDelete.id);
      toast.success("Escenario eliminado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["simulator-scenarios"] });
      setDeleteDialogOpen(false);
      setScenarioToDelete(null);
    } catch (error) {
      toast.error("Error al eliminar el escenario");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateScenario = async () => {
    if (!formData.title.trim()) {
      toast.error("Ingresa un nombre para el escenario");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Ingresa una descripción");
      return;
    }

    setIsCreating(true);
    try {
      const result = await simulatorScenariosAPI.create(formData);
      
      if (steps.length > 0) {
        const stepsToCreate: Partial<InsertScenarioStep>[] = steps.map(step => ({
          scenarioId: result.id,
          stepOrder: step.stepOrder,
          actionType: step.actionType,
          actionDescription: step.actionDescription,
          expectedValue: step.expectedValue || null,
          correctResponse: step.correctResponse,
          incorrectResponse: step.incorrectResponse,
          alternativeInterpretation: step.alternativeInterpretation || null,
          points: step.points,
          isCritical: step.isCritical,
          timeLimit: step.timeLimit,
        }));
        await scenarioStepsAPI.createBatch(stepsToCreate);
      }
      
      toast.success(`Escenario creado con ${steps.length} pasos configurados`);
      queryClient.invalidateQueries({ queryKey: ["simulator-scenarios"] });
      resetForm();
    } catch (error: any) {
      console.error("Error creating scenario:", error);
      toast.error(error.message || "Error al crear escenario");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="h-12 w-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Cargando escenarios...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight font-heading text-foreground">Simuladores de Red</h2>
            <p className="text-muted-foreground mt-1">Entrenamiento en escenarios virtuales de operación y fallas.</p>
          </div>
          <Button 
            onClick={() => {
              if (scenarios.length > 0) {
                setLocation(`/simulator/run/${scenarios[0].id}`);
              }
            }}
            className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20"
          >
            <Play className="mr-2 h-4 w-4" /> Nueva Sesión de Simulador
          </Button>
        </div>

        {/* Hero Banner for Simulator */}
        <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-border/50 shadow-2xl group cursor-pointer">
           <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
           <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10" />
           <img src={simImg} alt="Simulator" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 group-hover:scale-105 transition-all duration-700" />
           
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

        {/* Create Form - Shown when isCreateOpen */}
        {isCreateOpen && (
          <Card className="border border-accent/50 bg-card">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <CardTitle>Crear Nuevo Escenario</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-8 rounded-full ${createStep >= 1 ? 'bg-accent' : 'bg-muted'}`} />
                    <div className={`h-2 w-8 rounded-full ${createStep >= 2 ? 'bg-accent' : 'bg-muted'}`} />
                  </div>
                </div>
                <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <CardDescription>
                {createStep === 1 ? "Paso 1: Información básica del escenario" : "Paso 2: Configura las acciones y validaciones"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {createStep === 1 ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Nombre del Escenario</label>
                    <Input 
                      placeholder="Ej: Falla en Línea 230kV"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-1"
                      data-testid="input-scenario-title"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-foreground">Categoría</label>
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as "Fault" | "Overload" | "Topology" })}
                        className="mt-1 w-full px-3 py-2 bg-muted border border-border rounded-md text-sm text-foreground"
                        data-testid="select-scenario-category"
                      >
                        <option value="Fault">Falla</option>
                        <option value="Overload">Sobrecarga</option>
                        <option value="Topology">Topología</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Dificultad</label>
                      <select 
                        value={formData.difficulty}
                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as "Easy" | "Medium" | "Hard" })}
                        className="mt-1 w-full px-3 py-2 bg-muted border border-border rounded-md text-sm text-foreground"
                        data-testid="select-scenario-difficulty"
                      >
                        <option value="Easy">Fácil</option>
                        <option value="Medium">Medio</option>
                        <option value="Hard">Difícil</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Descripción</label>
                    <textarea 
                      placeholder="Describe el escenario y los objetivos de aprendizaje..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 w-full px-3 py-2 bg-muted border border-border rounded-md text-sm text-foreground resize-none h-24"
                      data-testid="textarea-scenario-description"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={resetForm} className="flex-1">
                      Cancelar
                    </Button>
                    <Button 
                      onClick={() => {
                        if (!formData.title.trim()) {
                          toast.error("Ingresa un nombre para el escenario");
                          return;
                        }
                        if (!formData.description.trim()) {
                          toast.error("Ingresa una descripción");
                          return;
                        }
                        setCreateStep(2);
                      }}
                      className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                      data-testid="button-next-step"
                    >
                      Siguiente: Configurar Pasos <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Pasos de la Simulación</h4>
                      <p className="text-sm text-muted-foreground">Define cada acción que el operador debe ejecutar</p>
                    </div>
                    <Button onClick={addStep} size="sm" variant="outline" data-testid="button-add-step">
                      <Plus className="h-4 w-4 mr-1" /> Agregar Paso
                    </Button>
                  </div>

                  {steps.length === 0 ? (
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <Settings className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">No hay pasos configurados</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">Agrega pasos para definir las acciones que el operador debe realizar</p>
                      <Button onClick={addStep} className="mt-4" variant="outline">
                        <Plus className="h-4 w-4 mr-2" /> Agregar Primer Paso
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {steps.map((step, index) => (
                        <div key={index} className="border border-border rounded-lg p-4 bg-muted/20" data-testid={`step-config-${index}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="h-6 w-6 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                                {step.stepOrder}
                              </span>
                              <span className="font-medium text-sm">Paso {step.stepOrder}</span>
                              {step.isCritical && (
                                <Badge variant="destructive" className="text-xs">Crítico</Badge>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => removeStep(index)} className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Tipo de Acción</label>
                              <select
                                value={step.actionType}
                                onChange={(e) => updateStep(index, "actionType", e.target.value)}
                                className="mt-1 w-full px-2 py-1.5 bg-background border border-border rounded-md text-sm"
                              >
                                {ACTION_TYPES.map(type => (
                                  <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Valor Esperado</label>
                              <Input
                                value={step.expectedValue}
                                onChange={(e) => updateStep(index, "expectedValue", e.target.value)}
                                placeholder="Ej: ABIERTO, 230kV"
                                className="mt-1 h-8 text-sm"
                              />
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="text-xs font-medium text-muted-foreground">Descripción de la Acción</label>
                            <Input
                              value={step.actionDescription}
                              onChange={(e) => updateStep(index, "actionDescription", e.target.value)}
                              placeholder="Ej: Abrir interruptor 52-1 de la línea 230kV"
                              className="mt-1 h-8 text-sm"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="text-xs font-medium text-emerald-500">Respuesta Correcta</label>
                              <textarea
                                value={step.correctResponse}
                                onChange={(e) => updateStep(index, "correctResponse", e.target.value)}
                                placeholder="Mensaje cuando el operador ejecuta correctamente"
                                className="mt-1 w-full px-2 py-1.5 bg-background border border-emerald-500/30 rounded-md text-sm resize-none h-16"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-red-500">Respuesta Incorrecta</label>
                              <textarea
                                value={step.incorrectResponse}
                                onChange={(e) => updateStep(index, "incorrectResponse", e.target.value)}
                                placeholder="Mensaje cuando el operador comete un error"
                                className="mt-1 w-full px-2 py-1.5 bg-background border border-red-500/30 rounded-md text-sm resize-none h-16"
                              />
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="text-xs font-medium text-amber-500">Interpretación Alternativa (Qué pasaría si...)</label>
                            <textarea
                              value={step.alternativeInterpretation}
                              onChange={(e) => updateStep(index, "alternativeInterpretation", e.target.value)}
                              placeholder="Ej: Si el operador cierra el interruptor sin verificar las protecciones, podría causar una sobrecarga en el transformador adyacente..."
                              className="mt-1 w-full px-2 py-1.5 bg-background border border-amber-500/30 rounded-md text-sm resize-none h-16"
                            />
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <label className="text-xs font-medium text-muted-foreground">Puntos</label>
                              <Input
                                type="number"
                                value={step.points}
                                onChange={(e) => updateStep(index, "points", parseInt(e.target.value) || 0)}
                                className="mt-1 h-8 text-sm w-20"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-xs font-medium text-muted-foreground">Tiempo Límite (seg)</label>
                              <Input
                                type="number"
                                value={step.timeLimit || ""}
                                onChange={(e) => updateStep(index, "timeLimit", e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="Sin límite"
                                className="mt-1 h-8 text-sm w-24"
                              />
                            </div>
                            <div className="flex items-center gap-2 pt-4">
                              <input
                                type="checkbox"
                                id={`critical-${index}`}
                                checked={step.isCritical}
                                onChange={(e) => updateStep(index, "isCritical", e.target.checked)}
                                className="h-4 w-4 rounded border-border"
                              />
                              <label htmlFor={`critical-${index}`} className="text-xs font-medium text-muted-foreground">
                                Paso Crítico
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-border">
                    <Button variant="outline" onClick={() => setCreateStep(1)} className="flex-1">
                      <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
                    </Button>
                    <Button 
                      onClick={handleCreateScenario}
                      disabled={isCreating}
                      className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                      data-testid="button-create-scenario"
                    >
                      {isCreating ? "Creando..." : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Crear Escenario {steps.length > 0 && `(${steps.length} pasos)`}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          <h3 className="text-xl font-bold font-heading">Escenarios Disponibles</h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {scenarios.map((scenario) => (
              <Card key={scenario.id} className="group border-border/60 bg-card hover:border-accent/50 transition-all hover:shadow-lg hover:shadow-accent/5">
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
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs font-normal">{scenario.difficulty}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`menu-scenario-${scenario.id}`}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClick(scenario)} data-testid={`edit-scenario-${scenario.id}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteClick(scenario)} className="text-destructive focus:text-destructive" data-testid={`delete-scenario-${scenario.id}`}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardTitle className="text-lg font-bold group-hover:text-accent transition-colors">{scenario.title}</CardTitle>
                  <CardDescription>{scenario.description}</CardDescription>
                </CardHeader>
                <CardFooter className="pt-0">
                  <Button 
                    onClick={() => setLocation(`/simulator/run/${scenario.id}`)}
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90 transition-all"
                    data-testid={`start-scenario-${scenario.id}`}
                  >
                    Iniciar Simulación <Play className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
            
            {/* New Scenario Trigger */}
            {!isCreateOpen && (
              <Card className="border-dashed border-2 border-border/50 bg-transparent flex flex-col items-center justify-center p-6 min-h-[200px] hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setIsCreateOpen(true)}>
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-muted-foreground" />
                </div>
                <h4 className="font-medium text-muted-foreground">Crear Nuevo Escenario</h4>
                <p className="text-xs text-muted-foreground/60 text-center mt-1">Define condiciones iniciales y eventos</p>
              </Card>
            )}
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

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-border/60">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Edit className="h-5 w-5 text-accent" />
                    Editar Escenario
                  </CardTitle>
                  <CardDescription>Modifica los detalles del escenario</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsEditOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nombre del Escenario</label>
                <Input
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  placeholder="Ej: Falla en Línea de 230kV"
                  className="mt-1"
                  data-testid="input-edit-title"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Categoría</label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value as "Fault" | "Overload" | "Topology" })}
                    className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-md"
                    data-testid="select-edit-category"
                  >
                    <option value="Fault">Falla</option>
                    <option value="Overload">Sobrecarga</option>
                    <option value="Topology">Topología</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Dificultad</label>
                  <select
                    value={editFormData.difficulty}
                    onChange={(e) => setEditFormData({ ...editFormData, difficulty: e.target.value as "Easy" | "Medium" | "Hard" })}
                    className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-md"
                    data-testid="select-edit-difficulty"
                  >
                    <option value="Easy">Fácil</option>
                    <option value="Medium">Medio</option>
                    <option value="Hard">Difícil</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Descripción</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Describe el escenario..."
                  className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-md resize-none h-24"
                  data-testid="input-edit-description"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsEditOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpdateScenario}
                  disabled={isUpdating}
                  className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                  data-testid="button-save-edit"
                >
                  {isUpdating ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar escenario?</DialogTitle>
            <DialogDescription>
              Esta acción eliminará permanentemente el escenario "{scenarioToDelete?.title}" y todos sus pasos configurados. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              data-testid="button-confirm-delete"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
