import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { simulatorScenariosAPI, scenarioStepsAPI } from "@/lib/api";
import type { SimulatorScenario, ScenarioStep } from "@shared/schema";
import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit2, Trash2, ArrowLeft, Play, Save, GripVertical,
  Zap, AlertTriangle, Clock, CheckCircle2, XCircle, ChevronRight,
  Loader2, Monitor, Shield, Wrench, Activity, Network, Radio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

const CATEGORIES = [
  { value: "Fault", label: "Falla", icon: AlertTriangle, color: "text-red-400" },
  { value: "Maintenance", label: "Mantenimiento", icon: Wrench, color: "text-amber-400" },
  { value: "Overload", label: "Sobrecarga", icon: Activity, color: "text-orange-400" },
  { value: "Topology", label: "Topología", icon: Network, color: "text-blue-400" },
  { value: "Emergency", label: "Emergencia", icon: Zap, color: "text-red-500" },
  { value: "Stability", label: "Estabilidad", icon: Monitor, color: "text-purple-400" },
  { value: "Verification", label: "Verificación", icon: CheckCircle2, color: "text-green-400" },
  { value: "Protection", label: "Protección", icon: Shield, color: "text-cyan-400" },
  { value: "Frequency", label: "Frecuencia", icon: Radio, color: "text-indigo-400" },
  { value: "Training", label: "Entrenamiento", icon: Play, color: "text-emerald-400" },
];

const DIFFICULTIES = [
  { value: "Easy", label: "Fácil", color: "bg-green-500/20 text-green-400" },
  { value: "Medium", label: "Medio", color: "bg-amber-500/20 text-amber-400" },
  { value: "Hard", label: "Difícil", color: "bg-red-500/20 text-red-400" },
];

const ACTION_TYPES = [
  { value: "breaker_open", label: "Abrir Interruptor" },
  { value: "breaker_close", label: "Cerrar Interruptor" },
  { value: "voltage_adjust", label: "Ajustar Voltaje" },
  { value: "frequency_control", label: "Control de Frecuencia" },
  { value: "communication", label: "Comunicación" },
  { value: "verification", label: "Verificación" },
  { value: "protection_check", label: "Revisar Protección" },
  { value: "load_transfer", label: "Transferir Carga" },
  { value: "isolation", label: "Aislamiento" },
  { value: "restoration", label: "Restablecimiento" },
  { value: "monitoring", label: "Monitoreo" },
  { value: "coordination", label: "Coordinación" },
  { value: "documentation", label: "Documentación" },
  { value: "custom", label: "Otro (Personalizado)" },
];

export default function ScenarioDesigner() {
  const { user, company } = useAuth();
  const queryClient = useQueryClient();
  
  const [viewMode, setViewMode] = useState<"list" | "edit">("list");
  const [selectedScenario, setSelectedScenario] = useState<SimulatorScenario | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showStepDialog, setShowStepDialog] = useState(false);
  const [editingStep, setEditingStep] = useState<ScenarioStep | null>(null);
  
  const [scenarioForm, setScenarioForm] = useState({
    title: "",
    category: "Fault" as string,
    difficulty: "Medium" as string,
    description: "",
  });
  
  const [stepForm, setStepForm] = useState({
    stepOrder: 1,
    actionType: "breaker_open",
    actionDescription: "",
    expectedValue: "",
    correctResponse: "",
    incorrectResponse: "",
    alternativeInterpretation: "",
    points: 10,
    isCritical: false,
    timeLimit: undefined as number | undefined,
  });

  const { data: scenarios = [], isLoading } = useQuery({
    queryKey: ["simulator-scenarios"],
    queryFn: () => simulatorScenariosAPI.getAll(),
  });

  const { data: steps = [], refetch: refetchSteps } = useQuery({
    queryKey: ["scenario-steps", selectedScenario?.id],
    queryFn: () => selectedScenario ? scenarioStepsAPI.getByScenario(selectedScenario.id) : Promise.resolve([]),
    enabled: !!selectedScenario,
  });

  const createScenarioMutation = useMutation({
    mutationFn: (data: Partial<SimulatorScenario>) => simulatorScenariosAPI.create(data),
    onSuccess: (newScenario) => {
      queryClient.invalidateQueries({ queryKey: ["simulator-scenarios"] });
      setShowCreateDialog(false);
      resetScenarioForm();
      toast.success("Escenario creado exitosamente");
      setSelectedScenario(newScenario);
      setViewMode("edit");
    },
    onError: () => toast.error("Error al crear escenario"),
  });

  const updateScenarioMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SimulatorScenario> }) => 
      simulatorScenariosAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulator-scenarios"] });
      toast.success("Escenario actualizado");
    },
    onError: () => toast.error("Error al actualizar escenario"),
  });

  const deleteScenarioMutation = useMutation({
    mutationFn: (id: number) => simulatorScenariosAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["simulator-scenarios"] });
      setViewMode("list");
      setSelectedScenario(null);
      toast.success("Escenario eliminado");
    },
    onError: () => toast.error("Error al eliminar escenario"),
  });

  const createStepMutation = useMutation({
    mutationFn: (data: Partial<ScenarioStep>) => scenarioStepsAPI.create(data),
    onSuccess: () => {
      refetchSteps();
      setShowStepDialog(false);
      resetStepForm();
      toast.success("Paso agregado");
    },
    onError: () => toast.error("Error al agregar paso"),
  });

  const updateStepMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ScenarioStep> }) => 
      scenarioStepsAPI.update(id, data),
    onSuccess: () => {
      refetchSteps();
      setShowStepDialog(false);
      setEditingStep(null);
      resetStepForm();
      toast.success("Paso actualizado");
    },
    onError: () => toast.error("Error al actualizar paso"),
  });

  const deleteStepMutation = useMutation({
    mutationFn: (id: number) => scenarioStepsAPI.delete(id),
    onSuccess: () => {
      refetchSteps();
      toast.success("Paso eliminado");
    },
    onError: () => toast.error("Error al eliminar paso"),
  });

  const resetScenarioForm = () => {
    setScenarioForm({ title: "", category: "Fault", difficulty: "Medium", description: "" });
  };

  const resetStepForm = () => {
    setStepForm({
      stepOrder: steps.length + 1,
      actionType: "breaker_open",
      actionDescription: "",
      expectedValue: "",
      correctResponse: "",
      incorrectResponse: "",
      alternativeInterpretation: "",
      points: 10,
      isCritical: false,
      timeLimit: undefined,
    });
  };

  const handleCreateScenario = () => {
    if (!scenarioForm.title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    createScenarioMutation.mutate({
      ...scenarioForm,
      companyId: company?.id || null,
    });
  };

  const handleSaveStep = () => {
    if (!stepForm.actionDescription.trim() || !stepForm.correctResponse.trim() || !stepForm.incorrectResponse.trim()) {
      toast.error("Completa los campos obligatorios");
      return;
    }
    
    if (editingStep) {
      updateStepMutation.mutate({
        id: editingStep.id,
        data: stepForm,
      });
    } else {
      createStepMutation.mutate({
        ...stepForm,
        scenarioId: selectedScenario!.id,
      });
    }
  };

  const handleEditStep = (step: ScenarioStep) => {
    setEditingStep(step);
    setStepForm({
      stepOrder: step.stepOrder,
      actionType: step.actionType,
      actionDescription: step.actionDescription,
      expectedValue: step.expectedValue || "",
      correctResponse: step.correctResponse,
      incorrectResponse: step.incorrectResponse,
      alternativeInterpretation: step.alternativeInterpretation || "",
      points: step.points,
      isCritical: step.isCritical,
      timeLimit: step.timeLimit || undefined,
    });
    setShowStepDialog(true);
  };

  const handleOpenAddStep = () => {
    setEditingStep(null);
    resetStepForm();
    setShowStepDialog(true);
  };

  const canEdit = user?.role === "admin" || user?.role === "super_admin" || user?.role === "trainer";

  const getCategoryConfig = (category: string) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[0];
  };

  const getDifficultyConfig = (difficulty: string) => {
    return DIFFICULTIES.find(d => d.value === difficulty) || DIFFICULTIES[1];
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

  if (viewMode === "edit" && selectedScenario) {
    const categoryConfig = getCategoryConfig(selectedScenario.category);
    const difficultyConfig = getDifficultyConfig(selectedScenario.difficulty);
    const CategoryIcon = categoryConfig.icon;

    return (
      <DashboardShell>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => { setViewMode("list"); setSelectedScenario(null); }}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-card ${categoryConfig.color}`}>
                  <CategoryIcon className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{selectedScenario.title}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{categoryConfig.label}</Badge>
                    <Badge className={difficultyConfig.color}>{difficultyConfig.label}</Badge>
                    <span className="text-sm text-muted-foreground">{steps.length} pasos</span>
                  </div>
                </div>
              </div>
            </div>
            {canEdit && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => deleteScenarioMutation.mutate(selectedScenario.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar Escenario
              </Button>
            )}
          </div>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Descripción del Escenario</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{selectedScenario.description}</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Play className="h-5 w-5 text-accent" />
                Pasos de la Simulación
              </CardTitle>
              {canEdit && (
                <Button size="sm" onClick={handleOpenAddStep} className="bg-accent text-accent-foreground">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Paso
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {steps.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay pasos configurados</p>
                  <p className="text-sm">Agrega pasos para definir el flujo de la simulación</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {steps.map((step, index) => (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="group"
                      >
                        <div className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                          step.isCritical ? "border-red-500/50 bg-red-500/5" : "border-border/50 bg-card/50"
                        } hover:border-accent/50`}>
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              step.isCritical ? "bg-red-500/20 text-red-400" : "bg-accent/20 text-accent"
                            }`}>
                              {step.stepOrder}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {ACTION_TYPES.find(a => a.value === step.actionType)?.label || step.actionType}
                              </Badge>
                              {step.isCritical && (
                                <Badge className="bg-red-500/20 text-red-400 text-xs">
                                  <AlertTriangle className="mr-1 h-3 w-3" />
                                  Crítico
                                </Badge>
                              )}
                              {step.timeLimit && (
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="mr-1 h-3 w-3" />
                                  {step.timeLimit}s
                                </Badge>
                              )}
                              <Badge className="bg-accent/20 text-accent text-xs">
                                {step.points} pts
                              </Badge>
                            </div>
                            <p className="font-medium">{step.actionDescription}</p>
                            <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                              <div className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                                <span className="text-muted-foreground">{step.correctResponse}</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                                <span className="text-muted-foreground">{step.incorrectResponse}</span>
                              </div>
                            </div>
                          </div>
                          {canEdit && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" onClick={() => handleEditStep(step)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-red-400 hover:text-red-300"
                                onClick={() => deleteStepMutation.mutate(step.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={showStepDialog} onOpenChange={setShowStepDialog}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingStep ? "Editar Paso" : "Agregar Nuevo Paso"}</DialogTitle>
              <DialogDescription>
                Configura los detalles de este paso de la simulación
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Orden del Paso</Label>
                  <Input
                    type="number"
                    min="1"
                    value={stepForm.stepOrder}
                    onChange={(e) => setStepForm(prev => ({ ...prev, stepOrder: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Acción</Label>
                  <Select value={stepForm.actionType} onValueChange={(v) => setStepForm(prev => ({ ...prev, actionType: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Puntos</Label>
                  <Input
                    type="number"
                    min="0"
                    value={stepForm.points}
                    onChange={(e) => setStepForm(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción de la Acción *</Label>
                <Textarea
                  placeholder="Describe qué debe hacer el operador en este paso..."
                  value={stepForm.actionDescription}
                  onChange={(e) => setStepForm(prev => ({ ...prev, actionDescription: e.target.value }))}
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Valor Esperado</Label>
                <Input
                  placeholder="Ej: ON, 230kV, Confirmado..."
                  value={stepForm.expectedValue}
                  onChange={(e) => setStepForm(prev => ({ ...prev, expectedValue: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    Respuesta Correcta *
                  </Label>
                  <Textarea
                    placeholder="Mensaje cuando el operador hace bien el paso..."
                    value={stepForm.correctResponse}
                    onChange={(e) => setStepForm(prev => ({ ...prev, correctResponse: e.target.value }))}
                    className="min-h-[60px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-400" />
                    Respuesta Incorrecta *
                  </Label>
                  <Textarea
                    placeholder="Mensaje cuando el operador comete un error..."
                    value={stepForm.incorrectResponse}
                    onChange={(e) => setStepForm(prev => ({ ...prev, incorrectResponse: e.target.value }))}
                    className="min-h-[60px]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Interpretación Alternativa</Label>
                <Textarea
                  placeholder="Qué pasa si el operador toma un camino diferente..."
                  value={stepForm.alternativeInterpretation}
                  onChange={(e) => setStepForm(prev => ({ ...prev, alternativeInterpretation: e.target.value }))}
                  className="min-h-[60px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tiempo Límite (segundos)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Sin límite"
                    value={stepForm.timeLimit || ""}
                    onChange={(e) => setStepForm(prev => ({ 
                      ...prev, 
                      timeLimit: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Paso Crítico</Label>
                  <div className="flex items-center gap-3 h-10">
                    <Switch
                      checked={stepForm.isCritical}
                      onCheckedChange={(checked) => setStepForm(prev => ({ ...prev, isCritical: checked }))}
                    />
                    <span className="text-sm text-muted-foreground">
                      {stepForm.isCritical ? "Si falla, la simulación termina" : "El estudiante puede continuar si falla"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStepDialog(false)}>Cancelar</Button>
              <Button onClick={handleSaveStep} className="bg-accent text-accent-foreground">
                {editingStep ? "Guardar Cambios" : "Agregar Paso"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading">
              Diseñador de Simulaciones
            </h1>
            <p className="text-muted-foreground mt-1">
              Crea y configura escenarios de simulación paso a paso
            </p>
          </div>
          {canEdit && (
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-accent text-accent-foreground"
              data-testid="button-new-scenario"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Escenario
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {scenarios.map((scenario) => {
              const categoryConfig = getCategoryConfig(scenario.category);
              const difficultyConfig = getDifficultyConfig(scenario.difficulty);
              const CategoryIcon = categoryConfig.icon;
              
              return (
                <motion.div
                  key={scenario.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card 
                    className="cursor-pointer hover:border-accent/50 transition-all group overflow-hidden"
                    onClick={() => { setSelectedScenario(scenario); setViewMode("edit"); }}
                    data-testid={`card-scenario-${scenario.id}`}
                  >
                    <CardContent className="p-0">
                      <div className={`h-2 ${
                        scenario.difficulty === "Easy" ? "bg-green-500" :
                        scenario.difficulty === "Medium" ? "bg-amber-500" : "bg-red-500"
                      }`} />
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg bg-muted ${categoryConfig.color}`}>
                            <CategoryIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate group-hover:text-accent transition-colors">
                              {scenario.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{categoryConfig.label}</Badge>
                              <Badge className={`text-xs ${difficultyConfig.color}`}>{difficultyConfig.label}</Badge>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                          {scenario.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {scenarios.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Monitor className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No hay escenarios configurados</h3>
            <p className="text-sm mb-4">Crea tu primer escenario de simulación</p>
            {canEdit && (
              <Button onClick={() => setShowCreateDialog(true)} className="bg-accent text-accent-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Crear Escenario
              </Button>
            )}
          </div>
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Escenario de Simulación</DialogTitle>
            <DialogDescription>
              Define los detalles básicos del escenario
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título del Escenario *</Label>
              <Input
                placeholder="Ej: Falla Trifásica en Línea 400kV"
                value={scenarioForm.title}
                onChange={(e) => setScenarioForm(prev => ({ ...prev, title: e.target.value }))}
                data-testid="input-scenario-title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={scenarioForm.category} onValueChange={(v) => setScenarioForm(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger data-testid="select-scenario-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <cat.icon className={`h-4 w-4 ${cat.color}`} />
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dificultad</Label>
                <Select value={scenarioForm.difficulty} onValueChange={(v) => setScenarioForm(prev => ({ ...prev, difficulty: v }))}>
                  <SelectTrigger data-testid="select-scenario-difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((diff) => (
                      <SelectItem key={diff.value} value={diff.value}>{diff.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                placeholder="Describe el escenario y los objetivos de aprendizaje..."
                value={scenarioForm.description}
                onChange={(e) => setScenarioForm(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[100px]"
                data-testid="input-scenario-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
            <Button 
              onClick={handleCreateScenario}
              disabled={!scenarioForm.title.trim() || createScenarioMutation.isPending}
              className="bg-accent text-accent-foreground"
              data-testid="button-create-scenario"
            >
              {createScenarioMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando...</>
              ) : (
                <>Crear y Configurar Pasos</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
