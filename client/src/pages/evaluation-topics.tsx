import { useState } from "react";
import DashboardShell from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Zap, BookOpen, ClipboardCheck, Activity, Network, Radio, Shield, Edit, Trash2, ChevronRight, Target, Clock, Scale } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { evaluationTopicsAPI, evaluationTopicItemsAPI } from "@/lib/api";
import { toast } from "sonner";
import type { EvaluationTopic, EvaluationTopicItem } from "@shared/schema";

const TOPIC_ICONS: Record<string, React.ReactNode> = {
  "Zap": <Zap className="h-5 w-5" />,
  "BookOpen": <BookOpen className="h-5 w-5" />,
  "ClipboardCheck": <ClipboardCheck className="h-5 w-5" />,
  "Activity": <Activity className="h-5 w-5" />,
  "Network": <Network className="h-5 w-5" />,
  "Radio": <Radio className="h-5 w-5" />,
  "Shield": <Shield className="h-5 w-5" />,
};

const DIFFICULTY_COLORS: Record<string, string> = {
  "Easy": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Medium": "bg-amber-100 text-amber-700 border-amber-200",
  "Hard": "bg-red-100 text-red-700 border-red-200",
};

interface ItemFormData {
  name: string;
  description: string;
  expectedOutcomes: string[];
  gradingCriteria: string;
  defaultWeight: number;
  difficulty: "Easy" | "Medium" | "Hard";
  estimatedTime: number | undefined;
}

const initialItemForm: ItemFormData = {
  name: "",
  description: "",
  expectedOutcomes: [],
  gradingCriteria: "",
  defaultWeight: 1,
  difficulty: "Medium",
  estimatedTime: undefined,
};

interface TopicFormData {
  name: string;
  code: string;
  description: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

const initialTopicForm: TopicFormData = {
  name: "",
  code: "",
  description: "",
  icon: "Target",
  sortOrder: 0,
  isActive: true,
};

const ICON_OPTIONS = [
  { value: "Zap", label: "Voltaje" },
  { value: "BookOpen", label: "Libro" },
  { value: "ClipboardCheck", label: "Lista" },
  { value: "Activity", label: "Actividad" },
  { value: "Network", label: "Red" },
  { value: "Radio", label: "Radio" },
  { value: "Shield", label: "Escudo" },
  { value: "Target", label: "Objetivo" },
];

export default function EvaluationTopics() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCreateTopicOpen, setIsCreateTopicOpen] = useState(false);
  const [isEditTopicOpen, setIsEditTopicOpen] = useState(false);
  const [isDeleteTopicOpen, setIsDeleteTopicOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<EvaluationTopic | null>(null);
  const [selectedItem, setSelectedItem] = useState<EvaluationTopicItem | null>(null);
  const [itemForm, setItemForm] = useState<ItemFormData>(initialItemForm);
  const [topicForm, setTopicForm] = useState<TopicFormData>(initialTopicForm);
  const [newOutcome, setNewOutcome] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTopicSubmitting, setIsTopicSubmitting] = useState(false);

  const { data: topics = [], isLoading: topicsLoading } = useQuery({
    queryKey: ["evaluation-topics"],
    queryFn: () => evaluationTopicsAPI.getAll(),
  });

  const { data: allItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["evaluation-topic-items", user?.companyId],
    queryFn: () => user?.companyId ? evaluationTopicItemsAPI.getByCompany(user.companyId) : Promise.resolve([]),
    enabled: !!user?.companyId,
  });

  const getItemsForTopic = (topicId: number) => {
    return allItems.filter(item => item.topicId === topicId);
  };

  const filteredTopics = topics.filter(topic =>
    topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetItemForm = () => {
    setItemForm(initialItemForm);
    setSelectedItem(null);
    setNewOutcome("");
  };

  const handleOpenCreate = (topic: EvaluationTopic) => {
    setSelectedTopic(topic);
    resetItemForm();
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (item: EvaluationTopicItem) => {
    setSelectedItem(item);
    setItemForm({
      name: item.name,
      description: item.description || "",
      expectedOutcomes: item.expectedOutcomes || [],
      gradingCriteria: item.gradingCriteria || "",
      defaultWeight: item.defaultWeight,
      difficulty: (item.difficulty as "Easy" | "Medium" | "Hard") || "Medium",
      estimatedTime: item.estimatedTime || undefined,
    });
    setIsEditOpen(true);
  };

  const handleOpenDelete = (item: EvaluationTopicItem) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const addOutcome = () => {
    if (newOutcome.trim()) {
      setItemForm(prev => ({
        ...prev,
        expectedOutcomes: [...prev.expectedOutcomes, newOutcome.trim()]
      }));
      setNewOutcome("");
    }
  };

  const removeOutcome = (index: number) => {
    setItemForm(prev => ({
      ...prev,
      expectedOutcomes: prev.expectedOutcomes.filter((_, i) => i !== index)
    }));
  };

  const handleCreate = async () => {
    if (!itemForm.name.trim() || !selectedTopic) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setIsSubmitting(true);
    try {
      await evaluationTopicItemsAPI.create({
        topicId: selectedTopic.id,
        companyId: user?.companyId,
        createdById: user?.id,
        name: itemForm.name,
        description: itemForm.description || null,
        expectedOutcomes: itemForm.expectedOutcomes.length > 0 ? itemForm.expectedOutcomes : null,
        gradingCriteria: itemForm.gradingCriteria || null,
        defaultWeight: itemForm.defaultWeight,
        difficulty: itemForm.difficulty,
        estimatedTime: itemForm.estimatedTime || null,
      });
      toast.success("Elemento creado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["evaluation-topic-items"] });
      setIsCreateOpen(false);
      resetItemForm();
    } catch (error) {
      toast.error("Error al crear el elemento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem || !itemForm.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setIsSubmitting(true);
    try {
      await evaluationTopicItemsAPI.update(selectedItem.id, {
        name: itemForm.name,
        description: itemForm.description || null,
        expectedOutcomes: itemForm.expectedOutcomes.length > 0 ? itemForm.expectedOutcomes : null,
        gradingCriteria: itemForm.gradingCriteria || null,
        defaultWeight: itemForm.defaultWeight,
        difficulty: itemForm.difficulty,
        estimatedTime: itemForm.estimatedTime || null,
      });
      toast.success("Elemento actualizado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["evaluation-topic-items"] });
      setIsEditOpen(false);
      resetItemForm();
    } catch (error) {
      toast.error("Error al actualizar el elemento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    setIsSubmitting(true);
    try {
      await evaluationTopicItemsAPI.delete(selectedItem.id);
      toast.success("Elemento eliminado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["evaluation-topic-items"] });
      setIsDeleteOpen(false);
      setSelectedItem(null);
    } catch (error) {
      toast.error("Error al eliminar el elemento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetTopicForm = () => {
    setTopicForm(initialTopicForm);
    setSelectedTopic(null);
  };

  const handleOpenCreateTopic = () => {
    resetTopicForm();
    setTopicForm(prev => ({ ...prev, sortOrder: topics.length }));
    setIsCreateTopicOpen(true);
  };

  const handleOpenEditTopic = (topic: EvaluationTopic, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTopic(topic);
    setTopicForm({
      name: topic.name,
      code: topic.code,
      description: topic.description || "",
      icon: topic.icon || "Target",
      sortOrder: topic.sortOrder,
      isActive: topic.isActive,
    });
    setIsEditTopicOpen(true);
  };

  const handleOpenDeleteTopic = (topic: EvaluationTopic, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTopic(topic);
    setIsDeleteTopicOpen(true);
  };

  const generateCode = (name: string) => {
    return name.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 30);
  };

  const handleCreateTopic = async () => {
    if (!topicForm.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setIsTopicSubmitting(true);
    try {
      const code = topicForm.code.trim() || generateCode(topicForm.name);
      await evaluationTopicsAPI.create({
        name: topicForm.name.trim(),
        code,
        description: topicForm.description || null,
        icon: topicForm.icon,
        sortOrder: topicForm.sortOrder,
        isActive: topicForm.isActive,
      });
      toast.success("Tema creado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["evaluation-topics"] });
      setIsCreateTopicOpen(false);
      resetTopicForm();
    } catch (error) {
      toast.error("Error al crear el tema. Verifica que el código sea único.");
    } finally {
      setIsTopicSubmitting(false);
    }
  };

  const handleUpdateTopic = async () => {
    if (!selectedTopic || !topicForm.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setIsTopicSubmitting(true);
    try {
      await evaluationTopicsAPI.update(selectedTopic.id, {
        name: topicForm.name.trim(),
        code: topicForm.code.trim() || selectedTopic.code,
        description: topicForm.description || null,
        icon: topicForm.icon,
        sortOrder: topicForm.sortOrder,
        isActive: topicForm.isActive,
      });
      toast.success("Tema actualizado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["evaluation-topics"] });
      setIsEditTopicOpen(false);
      resetTopicForm();
    } catch (error) {
      toast.error("Error al actualizar el tema");
    } finally {
      setIsTopicSubmitting(false);
    }
  };

  const handleDeleteTopic = async () => {
    if (!selectedTopic) return;

    setIsTopicSubmitting(true);
    try {
      await evaluationTopicsAPI.delete(selectedTopic.id);
      toast.success("Tema eliminado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["evaluation-topics"] });
      setIsDeleteTopicOpen(false);
      resetTopicForm();
    } catch (error) {
      toast.error("Error al eliminar el tema. Puede que tenga elementos asociados.");
    } finally {
      setIsTopicSubmitting(false);
    }
  };

  const canManage = user?.role === "admin" || user?.role === "trainer" || user?.role === "super_admin";

  if (topicsLoading || itemsLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="h-12 w-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Cargando temas de evaluación...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const ItemFormContent = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Nombre del Elemento *</label>
        <Input
          value={itemForm.name}
          onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
          placeholder="Ej: Monitoreo de niveles de tensión"
          className="mt-1"
          data-testid="input-item-name"
        />
      </div>
      <div>
        <label className="text-sm font-medium">Descripción</label>
        <textarea
          value={itemForm.description}
          onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
          placeholder="Describe en detalle qué se evalúa..."
          className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-md resize-none h-20"
          data-testid="input-item-description"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Dificultad</label>
          <select
            value={itemForm.difficulty}
            onChange={(e) => setItemForm({ ...itemForm, difficulty: e.target.value as "Easy" | "Medium" | "Hard" })}
            className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-md"
            data-testid="select-item-difficulty"
          >
            <option value="Easy">Fácil</option>
            <option value="Medium">Medio</option>
            <option value="Hard">Difícil</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Ponderación</label>
          <Input
            type="number"
            min="0.1"
            step="0.1"
            value={itemForm.defaultWeight}
            onChange={(e) => setItemForm({ ...itemForm, defaultWeight: parseFloat(e.target.value) || 1 })}
            className="mt-1"
            data-testid="input-item-weight"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Tiempo (min)</label>
          <Input
            type="number"
            min="1"
            value={itemForm.estimatedTime || ""}
            onChange={(e) => setItemForm({ ...itemForm, estimatedTime: parseInt(e.target.value) || undefined })}
            placeholder="Opcional"
            className="mt-1"
            data-testid="input-item-time"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Resultados Esperados</label>
        <div className="flex gap-2 mt-1">
          <Input
            value={newOutcome}
            onChange={(e) => setNewOutcome(e.target.value)}
            placeholder="Agregar resultado esperado..."
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOutcome())}
            data-testid="input-new-outcome"
          />
          <Button type="button" variant="outline" onClick={addOutcome}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {itemForm.expectedOutcomes.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {itemForm.expectedOutcomes.map((outcome, idx) => (
              <Badge key={idx} variant="secondary" className="gap-1">
                {outcome}
                <button onClick={() => removeOutcome(idx)} className="ml-1 hover:text-destructive">×</button>
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div>
        <label className="text-sm font-medium">Criterios de Calificación</label>
        <textarea
          value={itemForm.gradingCriteria}
          onChange={(e) => setItemForm({ ...itemForm, gradingCriteria: e.target.value })}
          placeholder="Define cómo se evaluará este elemento..."
          className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-md resize-none h-20"
          data-testid="input-item-criteria"
        />
      </div>
    </div>
  );

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight font-heading">Temas de Evaluación</h2>
            <p className="text-muted-foreground">Gestiona los temas y elementos específicos para evaluar operadores.</p>
          </div>
          {canManage && (
            <Button onClick={handleOpenCreateTopic} className="gap-2" data-testid="button-create-topic">
              <Plus className="h-4 w-4" />
              Nuevo Tema
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar temas..."
              className="pl-9 bg-card"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-topics"
            />
          </div>
        </div>

        <div className="grid gap-4">
          <Accordion type="multiple" className="space-y-4">
            {filteredTopics.map((topic) => {
              const items = getItemsForTopic(topic.id);
              const icon = TOPIC_ICONS[topic.icon || "Target"] || <Target className="h-5 w-5" />;
              
              return (
                <AccordionItem 
                  key={topic.id} 
                  value={`topic-${topic.id}`}
                  className="border border-border/60 rounded-lg bg-card shadow-sm overflow-hidden"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-accent/10 text-accent">
                        {icon}
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="font-semibold text-base">{topic.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{topic.description}</p>
                      </div>
                      <Badge variant="outline" className="mr-2">
                        {items.length} {items.length === 1 ? "elemento" : "elementos"}
                      </Badge>
                      {canManage && (
                        <div className="flex gap-1 mr-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={(e) => handleOpenEditTopic(topic, e)}
                            data-testid={`button-edit-topic-${topic.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => handleOpenDeleteTopic(topic, e)}
                            data-testid={`button-delete-topic-${topic.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="pt-2 space-y-3">
                      {canManage && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenCreate(topic)}
                          className="mb-3"
                          data-testid={`button-add-item-${topic.id}`}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Elemento
                        </Button>
                      )}
                      
                      {items.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          No hay elementos definidos para este tema.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {items.map((item) => (
                            <Card key={item.id} className="border-border/40" data-testid={`card-item-${item.id}`}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-medium">{item.name}</h4>
                                      <Badge className={`text-xs ${DIFFICULTY_COLORS[item.difficulty || "Medium"]}`}>
                                        {item.difficulty === "Easy" ? "Fácil" : item.difficulty === "Hard" ? "Difícil" : "Medio"}
                                      </Badge>
                                      {item.companyId === null && (
                                        <Badge variant="outline" className="text-xs">Global</Badge>
                                      )}
                                    </div>
                                    {item.description && (
                                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Scale className="h-3 w-3" />
                                        Peso: {item.defaultWeight}x
                                      </span>
                                      {item.estimatedTime && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {item.estimatedTime} min
                                        </span>
                                      )}
                                      {item.expectedOutcomes && item.expectedOutcomes.length > 0 && (
                                        <span className="flex items-center gap-1">
                                          <Target className="h-3 w-3" />
                                          {item.expectedOutcomes.length} resultados
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {canManage && (item.companyId !== null || user?.role === "super_admin") && (
                                    <div className="flex gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8"
                                        onClick={() => handleOpenEdit(item)}
                                        data-testid={`button-edit-item-${item.id}`}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        onClick={() => handleOpenDelete(item)}
                                        data-testid={`button-delete-item-${item.id}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          {filteredTopics.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                {searchTerm ? "No se encontraron temas con ese criterio" : "No hay temas de evaluación disponibles"}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Item Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-accent" />
              Nuevo Elemento de Evaluación
            </DialogTitle>
            <DialogDescription>
              Crea un nuevo elemento para el tema "{selectedTopic?.name}"
            </DialogDescription>
          </DialogHeader>
          <ItemFormContent />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={isSubmitting}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              data-testid="button-save-new-item"
            >
              {isSubmitting ? "Creando..." : "Crear Elemento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-accent" />
              Editar Elemento
            </DialogTitle>
            <DialogDescription>
              Modifica los detalles del elemento de evaluación.
            </DialogDescription>
          </DialogHeader>
          <ItemFormContent />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdate}
              disabled={isSubmitting}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              data-testid="button-save-edit-item"
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
            <DialogTitle>¿Eliminar elemento?</DialogTitle>
            <DialogDescription>
              Esta acción eliminará permanentemente el elemento "{selectedItem?.name}". Esta acción no se puede deshacer.
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
              data-testid="button-confirm-delete-item"
            >
              {isSubmitting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Topic Modal */}
      <Dialog open={isCreateTopicOpen} onOpenChange={setIsCreateTopicOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-accent" />
              Nuevo Tema de Evaluación
            </DialogTitle>
            <DialogDescription>
              Crea un nuevo tema para organizar elementos de evaluación.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre del Tema *</label>
              <Input
                value={topicForm.name}
                onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })}
                placeholder="Ej: Control de Reactivos"
                className="mt-1"
                data-testid="input-topic-name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Código (opcional)</label>
              <Input
                value={topicForm.code}
                onChange={(e) => setTopicForm({ ...topicForm, code: e.target.value })}
                placeholder="Se genera automáticamente del nombre"
                className="mt-1"
                data-testid="input-topic-code"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <textarea
                value={topicForm.description}
                onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                placeholder="Descripción del tema..."
                className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-md resize-none h-20"
                data-testid="input-topic-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Icono</label>
                <select
                  value={topicForm.icon}
                  onChange={(e) => setTopicForm({ ...topicForm, icon: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-md"
                  data-testid="select-topic-icon"
                >
                  {ICON_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Orden</label>
                <Input
                  type="number"
                  min="0"
                  value={topicForm.sortOrder}
                  onChange={(e) => setTopicForm({ ...topicForm, sortOrder: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                  data-testid="input-topic-order"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={topicForm.isActive}
                onChange={(e) => setTopicForm({ ...topicForm, isActive: e.target.checked })}
                id="topic-active"
                data-testid="checkbox-topic-active"
              />
              <label htmlFor="topic-active" className="text-sm font-medium cursor-pointer">
                Tema Activo
              </label>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCreateTopicOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateTopic}
              disabled={isTopicSubmitting}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              data-testid="button-save-new-topic"
            >
              {isTopicSubmitting ? "Creando..." : "Crear Tema"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Topic Modal */}
      <Dialog open={isEditTopicOpen} onOpenChange={setIsEditTopicOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-accent" />
              Editar Tema
            </DialogTitle>
            <DialogDescription>
              Modifica los detalles del tema de evaluación.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre del Tema *</label>
              <Input
                value={topicForm.name}
                onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })}
                placeholder="Ej: Control de Reactivos"
                className="mt-1"
                data-testid="input-edit-topic-name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Código</label>
              <Input
                value={topicForm.code}
                onChange={(e) => setTopicForm({ ...topicForm, code: e.target.value })}
                className="mt-1"
                data-testid="input-edit-topic-code"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <textarea
                value={topicForm.description}
                onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                placeholder="Descripción del tema..."
                className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-md resize-none h-20"
                data-testid="input-edit-topic-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Icono</label>
                <select
                  value={topicForm.icon}
                  onChange={(e) => setTopicForm({ ...topicForm, icon: e.target.value })}
                  className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-md"
                  data-testid="select-edit-topic-icon"
                >
                  {ICON_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Orden</label>
                <Input
                  type="number"
                  min="0"
                  value={topicForm.sortOrder}
                  onChange={(e) => setTopicForm({ ...topicForm, sortOrder: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                  data-testid="input-edit-topic-order"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={topicForm.isActive}
                onChange={(e) => setTopicForm({ ...topicForm, isActive: e.target.checked })}
                id="edit-topic-active"
                data-testid="checkbox-edit-topic-active"
              />
              <label htmlFor="edit-topic-active" className="text-sm font-medium cursor-pointer">
                Tema Activo
              </label>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEditTopicOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateTopic}
              disabled={isTopicSubmitting}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              data-testid="button-save-edit-topic"
            >
              {isTopicSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Topic Confirmation Modal */}
      <Dialog open={isDeleteTopicOpen} onOpenChange={setIsDeleteTopicOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar tema?</DialogTitle>
            <DialogDescription>
              Esta acción eliminará permanentemente el tema "{selectedTopic?.name}" y todos sus elementos asociados. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteTopicOpen(false)} disabled={isTopicSubmitting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTopic}
              disabled={isTopicSubmitting}
              data-testid="button-confirm-delete-topic"
            >
              {isTopicSubmitting ? "Eliminando..." : "Eliminar Tema"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
