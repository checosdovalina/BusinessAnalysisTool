import { useState } from "react";
import DashboardShell from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, MoreHorizontal, FileText, PlayCircle, Edit, Trash2, X, CheckCircle2, ExternalLink, Shield, Monitor, Wrench, FileQuestion } from "lucide-react";
import { Link } from "wouter";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cyclesAPI, usersAPI, evaluationTopicsAPI, evaluationTopicItemsAPI, cycleTopicItemsAPI, evaluationTemplatesAPI, type EvaluationTemplateWithDetails } from "@/lib/api";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import type { Cycle, User, EvaluationTopic, EvaluationTopicItem } from "@shared/schema";

interface SelectedTopicItem {
  topicItemId: number;
  weight: number;
  customFocus?: string;
}

interface CycleFormData {
  title: string;
  qualityCode: string;
  generalObjective: string;
  studentId: number | undefined;
  trainerId: number | undefined;
  type: "field" | "simulator";
  status: "pending" | "in_progress" | "completed";
  minPassingScore: number;
  evaluationTopics: string[];
  selectedTopicItems: SelectedTopicItem[];
}

const initialFormData: CycleFormData = {
  title: "",
  qualityCode: "",
  generalObjective: "",
  studentId: undefined,
  trainerId: undefined,
  type: "field",
  status: "pending",
  minPassingScore: 80,
  evaluationTopics: [],
  selectedTopicItems: [],
};

export default function EvaluationList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<Cycle | null>(null);
  const [formData, setFormData] = useState<CycleFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  
  const { data: cycles = [], isLoading } = useQuery({
    queryKey: ["cycles", user?.companyId],
    queryFn: () => user?.companyId ? cyclesAPI.getByCompany(user.companyId) : Promise.resolve([]),
    enabled: !!user?.companyId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users", user?.companyId],
    queryFn: () => user?.companyId ? usersAPI.getByCompany(user.companyId) : Promise.resolve([]),
    enabled: !!user?.companyId,
  });

  const { data: evaluationTopics = [] } = useQuery({
    queryKey: ["evaluation-topics"],
    queryFn: () => evaluationTopicsAPI.getAll(),
  });

  const { data: allTopicItems = [] } = useQuery({
    queryKey: ["evaluation-topic-items", user?.companyId],
    queryFn: () => user?.companyId ? evaluationTopicItemsAPI.getByCompany(user.companyId) : Promise.resolve([]),
    enabled: !!user?.companyId,
  });

  const { data: evaluationTemplates = [] } = useQuery({
    queryKey: ["evaluation-templates"],
    queryFn: () => evaluationTemplatesAPI.getAll(),
    enabled: !!user,
  });

  const applyTemplate = async (templateId: number) => {
    setIsLoadingTemplate(true);
    try {
      const templateDetails = await evaluationTemplatesAPI.getWithDetails(templateId);
      
      const topicCodes: string[] = [];
      templateDetails.topics.forEach((tt) => {
        if (tt.topic?.code) {
          topicCodes.push(tt.topic.code);
        }
      });
      
      setFormData(prev => ({
        ...prev,
        type: templateDetails.cycleType as "field" | "simulator",
        minPassingScore: templateDetails.defaultMinPassingScore || 80,
        evaluationTopics: topicCodes,
        generalObjective: templateDetails.description || "",
        selectedTopicItems: [],
      }));
      
      setSelectedTemplateId(templateId);
      toast.success(`Plantilla "${templateDetails.name}" aplicada`);
    } catch (error) {
      console.error("Error applying template:", error);
      toast.error("Error al aplicar la plantilla");
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  const getTemplateIcon = (templateType: string) => {
    switch (templateType) {
      case "cenace": return Shield;
      case "simulador": return Monitor;
      case "campo": return Wrench;
      default: return FileQuestion;
    }
  };

  const getItemsForTopic = (topicCode: string) => {
    const topic = evaluationTopics.find((t: EvaluationTopic) => t.code === topicCode);
    if (!topic) return [];
    return allTopicItems.filter((item: EvaluationTopicItem) => item.topicId === topic.id);
  };

  const students = users.filter((u: User) => u.role === "student");
  const trainers = users.filter((u: User) => u.role === "trainer" || u.role === "admin");

  const filteredCycles = cycles.filter(cycle => 
    cycle.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cycle.qualityCode && cycle.qualityCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (date: string | Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedCycle(null);
    setSelectedTemplateId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleOpenEdit = async (cycle: Cycle) => {
    setSelectedCycle(cycle);
    setIsLoadingEdit(true);
    setIsEditOpen(true);
    
    await queryClient.ensureQueryData({
      queryKey: ["evaluation-topics"],
      queryFn: () => evaluationTopicsAPI.getAll(),
    });
    
    if (user?.companyId) {
      await queryClient.ensureQueryData({
        queryKey: ["evaluation-topic-items", user.companyId],
        queryFn: () => evaluationTopicItemsAPI.getByCompany(user.companyId),
      });
    }
    
    const currentTopics = queryClient.getQueryData<EvaluationTopic[]>(["evaluation-topics"]) || [];
    const currentItems = queryClient.getQueryData<EvaluationTopicItem[]>(["evaluation-topic-items", user?.companyId]) || [];
    
    let loadedItems: SelectedTopicItem[] = [];
    let derivedTopicCodes: string[] = cycle.evaluationTopics || [];
    
    try {
      const cycleItems = await cycleTopicItemsAPI.getByCycle(cycle.id);
      loadedItems = cycleItems.map((item: any) => ({
        topicItemId: item.topicItemId,
        weight: item.weight || 1,
        customFocus: item.customFocus || undefined,
      }));
      
      const itemTopicIds = new Set<number>();
      for (const cti of cycleItems) {
        const topicItem = currentItems.find((ti: EvaluationTopicItem) => ti.id === cti.topicItemId);
        if (topicItem) {
          itemTopicIds.add(topicItem.topicId);
        }
      }
      
      Array.from(itemTopicIds).forEach(topicId => {
        const topic = currentTopics.find((t: EvaluationTopic) => t.id === topicId);
        if (topic && !derivedTopicCodes.includes(topic.code)) {
          derivedTopicCodes = [...derivedTopicCodes, topic.code];
        }
      });
    } catch (error) {
      console.error("Error loading cycle topic items:", error);
    }
    
    setFormData({
      title: cycle.title,
      qualityCode: cycle.qualityCode || "",
      generalObjective: cycle.generalObjective || "",
      studentId: cycle.studentId || undefined,
      trainerId: cycle.trainerId || undefined,
      type: cycle.type as "field" | "simulator",
      status: cycle.status as "pending" | "in_progress" | "completed",
      minPassingScore: cycle.minPassingScore || 80,
      evaluationTopics: derivedTopicCodes,
      selectedTopicItems: loadedItems,
    });
    setIsLoadingEdit(false);
  };

  const handleOpenDelete = (cycle: Cycle) => {
    setSelectedCycle(cycle);
    setIsDeleteOpen(true);
  };

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.studentId || !formData.trainerId) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    setIsSubmitting(true);
    try {
      const { selectedTopicItems, ...cycleData } = formData;
      const newCycle = await cyclesAPI.create({
        ...cycleData,
        companyId: user?.companyId,
        progress: 0,
        startDate: new Date(),
      });
      
      if (selectedTopicItems.length > 0) {
        await cycleTopicItemsAPI.sync(newCycle.id, selectedTopicItems);
      }
      
      toast.success("Evaluación creada exitosamente");
      queryClient.invalidateQueries({ queryKey: ["cycles"] });
      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Error al crear la evaluación");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedCycle || !formData.title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }

    setIsSubmitting(true);
    try {
      const { selectedTopicItems, ...cycleData } = formData;
      await cyclesAPI.update(selectedCycle.id, cycleData);
      await cycleTopicItemsAPI.sync(selectedCycle.id, selectedTopicItems);
      
      toast.success("Evaluación actualizada exitosamente");
      queryClient.invalidateQueries({ queryKey: ["cycles"] });
      setIsEditOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Error al actualizar la evaluación");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCycle) return;

    setIsSubmitting(true);
    try {
      await cyclesAPI.delete(selectedCycle.id);
      toast.success("Evaluación eliminada exitosamente");
      queryClient.invalidateQueries({ queryKey: ["cycles"] });
      setIsDeleteOpen(false);
      setSelectedCycle(null);
    } catch (error) {
      toast.error("Error al eliminar la evaluación");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTopic = (topicCode: string) => {
    setFormData(prev => {
      const isRemoving = prev.evaluationTopics.includes(topicCode);
      const newTopics = isRemoving
        ? prev.evaluationTopics.filter(t => t !== topicCode)
        : [...prev.evaluationTopics, topicCode];
      
      if (isRemoving) {
        const topic = evaluationTopics.find((t: EvaluationTopic) => t.code === topicCode);
        if (topic) {
          const itemsToRemove = allTopicItems
            .filter((item: EvaluationTopicItem) => item.topicId === topic.id)
            .map((item: EvaluationTopicItem) => item.id);
          return {
            ...prev,
            evaluationTopics: newTopics,
            selectedTopicItems: prev.selectedTopicItems.filter(s => !itemsToRemove.includes(s.topicItemId))
          };
        }
      }
      return { ...prev, evaluationTopics: newTopics };
    });
  };

  const toggleTopicItem = (itemId: number, defaultWeight: number) => {
    setFormData(prev => {
      const isSelected = prev.selectedTopicItems.some(s => s.topicItemId === itemId);
      if (isSelected) {
        return {
          ...prev,
          selectedTopicItems: prev.selectedTopicItems.filter(s => s.topicItemId !== itemId)
        };
      } else {
        return {
          ...prev,
          selectedTopicItems: [...prev.selectedTopicItems, { topicItemId: itemId, weight: defaultWeight }]
        };
      }
    });
  };

  const isTopicItemSelected = (itemId: number) => {
    return formData.selectedTopicItems.some(s => s.topicItemId === itemId);
  };

  const getUserName = (userId: number | null) => {
    if (!userId) return "-";
    const foundUser = users.find((u: User) => u.id === userId);
    return foundUser ? foundUser.name : `Usuario #${userId}`;
  };

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="h-12 w-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Cargando evaluaciones...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const formContent = (
    <div className="space-y-4">
      {!selectedCycle && evaluationTemplates.length > 0 && (
        <div className="mb-4">
          <label className="text-sm font-medium block mb-2">Tipo de Evaluación (Plantilla)</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {evaluationTemplates.map((template: any) => {
              const IconComponent = getTemplateIcon(template.templateType);
              const isSelected = selectedTemplateId === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template.id)}
                  disabled={isLoadingTemplate}
                  className={`relative flex flex-col items-center p-4 rounded-lg border-2 transition-all hover:border-accent/50 ${
                    isSelected 
                      ? "border-accent bg-accent/10" 
                      : "border-border bg-card hover:bg-accent/5"
                  }`}
                  style={{ borderColor: isSelected ? template.color : undefined }}
                  data-testid={`button-template-${template.code}`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                    </div>
                  )}
                  <div 
                    className="p-2 rounded-full mb-2"
                    style={{ backgroundColor: `${template.color}20` }}
                  >
                    <IconComponent className="h-6 w-6" style={{ color: template.color }} />
                  </div>
                  <span className="font-medium text-sm text-center">{template.name}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {template.templateType === "cenace" && "Estándar CENACE"}
                    {template.templateType === "simulador" && "Práctica en Simulador"}
                    {template.templateType === "campo" && "Evaluación en Campo"}
                    {template.templateType === "personalizado" && "Personalizado"}
                  </span>
                </button>
              );
            })}
          </div>
          {isLoadingTemplate && (
            <div className="flex items-center justify-center mt-2">
              <div className="h-4 w-4 border-2 border-accent border-t-transparent rounded-full animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Aplicando plantilla...</span>
            </div>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-sm font-medium">Título del Ciclo *</label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Ej: Restablecimiento de Línea 115kV"
            className="mt-1"
            data-testid="input-cycle-title"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Código de Calidad</label>
          <Input
            value={formData.qualityCode}
            onChange={(e) => setFormData(prev => ({ ...prev, qualityCode: e.target.value }))}
            placeholder="Ej: OTS-2024-001"
            className="mt-1"
            data-testid="input-cycle-code"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Tipo</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as "field" | "simulator" }))}
            className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-md"
            data-testid="select-cycle-type"
          >
            <option value="field">Campo</option>
            <option value="simulator">Simulador</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Estudiante *</label>
          <select
            value={formData.studentId || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value ? parseInt(e.target.value) : undefined }))}
            className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-md"
            data-testid="select-cycle-student"
          >
            <option value="">Seleccionar estudiante...</option>
            {students.map((student: User) => (
              <option key={student.id} value={student.id}>{student.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Entrenador *</label>
          <select
            value={formData.trainerId || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, trainerId: e.target.value ? parseInt(e.target.value) : undefined }))}
            className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-md"
            data-testid="select-cycle-trainer"
          >
            <option value="">Seleccionar entrenador...</option>
            {trainers.map((trainer: User) => (
              <option key={trainer.id} value={trainer.id}>{trainer.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Puntuación Mínima (%)</label>
          <Input
            type="number"
            min="0"
            max="100"
            value={formData.minPassingScore}
            onChange={(e) => setFormData(prev => ({ ...prev, minPassingScore: parseInt(e.target.value) || 0 }))}
            className="mt-1"
            data-testid="input-cycle-min-score"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Estado</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as "pending" | "in_progress" | "completed" }))}
            className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-md"
            data-testid="select-cycle-status"
          >
            <option value="pending">Pendiente</option>
            <option value="in_progress">En Progreso</option>
            <option value="completed">Completado</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium">Objetivo General</label>
          <textarea
            value={formData.generalObjective}
            onChange={(e) => setFormData(prev => ({ ...prev, generalObjective: e.target.value }))}
            placeholder="Describe el objetivo principal de esta evaluación..."
            className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-md resize-none h-20"
            data-testid="input-cycle-objective"
          />
        </div>
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Temas de Evaluación</label>
            <Link href="/evaluation-topics" className="text-xs text-accent hover:underline flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              Gestionar temas
            </Link>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {evaluationTopics.map((topic: EvaluationTopic) => (
              <Badge
                key={topic.code}
                variant={formData.evaluationTopics.includes(topic.code) ? "default" : "outline"}
                className={`cursor-pointer transition-all ${
                  formData.evaluationTopics.includes(topic.code) 
                    ? "bg-accent text-accent-foreground" 
                    : "hover:bg-accent/10"
                }`}
                onClick={() => toggleTopic(topic.code)}
                data-testid={`topic-${topic.code}`}
              >
                {topic.name}
              </Badge>
            ))}
          </div>
          
          {formData.evaluationTopics.length > 0 && (
            <div className="border border-border rounded-lg p-4 bg-background/50">
              <p className="text-sm font-medium mb-3">Elementos de Evaluación por Tema</p>
              <Accordion type="multiple" className="w-full">
                {formData.evaluationTopics.map(topicCode => {
                  const topic = evaluationTopics.find((t: EvaluationTopic) => t.code === topicCode);
                  const items = getItemsForTopic(topicCode);
                  if (!topic) return null;
                  
                  return (
                    <AccordionItem key={topicCode} value={topicCode}>
                      <AccordionTrigger className="text-sm hover:no-underline">
                        <div className="flex items-center gap-2">
                          <span>{topic.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {formData.selectedTopicItems.filter(s => 
                              items.some((item: EvaluationTopicItem) => item.id === s.topicItemId)
                            ).length} / {items.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {items.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-2">
                            No hay elementos definidos. Añade elementos desde la sección de Gestión de Temas.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {items.map((item: EvaluationTopicItem) => (
                              <div 
                                key={item.id}
                                className="flex items-start gap-3 p-2 rounded-md hover:bg-accent/5 transition-colors"
                              >
                                <Checkbox
                                  id={`item-${item.id}`}
                                  checked={isTopicItemSelected(item.id)}
                                  onCheckedChange={() => toggleTopicItem(item.id, item.defaultWeight || 1)}
                                  data-testid={`checkbox-item-${item.id}`}
                                />
                                <div className="flex-1">
                                  <label 
                                    htmlFor={`item-${item.id}`}
                                    className="text-sm cursor-pointer"
                                  >
                                    {item.name}
                                  </label>
                                  {item.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
              <p className="text-xs text-muted-foreground mt-3">
                {formData.selectedTopicItems.length} elemento(s) seleccionado(s) en total.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight font-heading">Evaluaciones</h2>
            <p className="text-muted-foreground">Gestiona los ciclos de entrenamiento y certificaciones.</p>
          </div>
          <Button 
            className="bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all"
            onClick={handleOpenCreate}
            data-testid="button-new-evaluation"
          >
            <Plus className="mr-2 h-4 w-4" /> Nueva Evaluación
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nombre o código..."
              className="pl-9 bg-card"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-evaluations"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <Card className="border-border/60 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[300px]">Título del Ciclo</TableHead>
                <TableHead>Alumno</TableHead>
                <TableHead>Entrenador</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead>Fecha Inicio</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCycles.map((cycle) => (
                <TableRow key={cycle.id} className="group" data-testid={`row-cycle-${cycle.id}`}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/10 p-1.5 rounded text-primary group-hover:text-accent transition-colors">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="truncate max-w-[280px]">{cycle.title}</p>
                        {cycle.qualityCode && (
                          <p className="text-xs text-muted-foreground">{cycle.qualityCode}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getUserName(cycle.studentId)}</TableCell>
                  <TableCell>{getUserName(cycle.trainerId)}</TableCell>
                  <TableCell>
                    {cycle.status === "completed" ? (
                       <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 shadow-none">Completado</Badge>
                    ) : cycle.status === "in_progress" ? (
                       <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 shadow-none">En Progreso</Badge>
                    ) : (
                       <Badge variant="outline" className="text-muted-foreground">Pendiente</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent transition-all duration-500" 
                          style={{ width: `${cycle.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{cycle.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(cycle.startDate)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0" data-testid={`button-actions-${cycle.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                           <Link href={`/evaluations/${cycle.id}`}>
                             <PlayCircle className="mr-2 h-4 w-4" /> Continuar
                           </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEdit(cycle)} data-testid={`edit-cycle-${cycle.id}`}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleOpenDelete(cycle)}
                          data-testid={`delete-cycle-${cycle.id}`}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCycles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No se encontraron evaluaciones con ese criterio" : "No hay evaluaciones registradas"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-accent" />
              Nueva Evaluación
            </DialogTitle>
            <DialogDescription>Crea un nuevo ciclo de entrenamiento para un operador.</DialogDescription>
          </DialogHeader>
          {formContent}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={isSubmitting}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              data-testid="button-save-new-cycle"
            >
              {isSubmitting ? "Creando..." : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Crear Evaluación
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-accent" />
              Editar Evaluación
            </DialogTitle>
            <DialogDescription>Modifica los detalles del ciclo de entrenamiento.</DialogDescription>
          </DialogHeader>
          {isLoadingEdit ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              <span className="ml-3 text-muted-foreground">Cargando datos...</span>
            </div>
          ) : (
            {formContent}
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdate}
              disabled={isSubmitting || isLoadingEdit}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              data-testid="button-save-edit-cycle"
            >
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar evaluación?</DialogTitle>
            <DialogDescription>
              Esta acción eliminará permanentemente la evaluación "{selectedCycle?.title}" y todos sus eventos asociados. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
              data-testid="button-confirm-delete-cycle"
            >
              {isSubmitting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
