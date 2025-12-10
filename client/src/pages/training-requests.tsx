import DashboardShell from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trainingRequestsAPI, TrainingRequestFull, usersAPI } from "@/lib/api";
import type { TrainingRequest, RequestIncident, RequestRole, RequestProcedure, RequestTopic } from "@shared/schema";
import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, FileText, Send, CheckCircle2, XCircle, Clock, Edit2, Trash2, 
  AlertTriangle, Users, ClipboardList, Zap, ArrowLeft, Eye, 
  FileWarning, UserCog, BookOpen, Target, Loader2, Calendar, Building2
} from "lucide-react";

const STATUS_CONFIG = {
  draft: { label: "Borrador", color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: FileText },
  submitted: { label: "Enviada", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Send },
  approved: { label: "Aprobada", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  rejected: { label: "Rechazada", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
  completed: { label: "Completada", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: CheckCircle2 },
};

const PRIORITY_CONFIG = {
  low: { label: "Baja", color: "bg-slate-500/20 text-slate-400" },
  medium: { label: "Media", color: "bg-yellow-500/20 text-yellow-400" },
  high: { label: "Alta", color: "bg-orange-500/20 text-orange-400" },
  critical: { label: "Crítica", color: "bg-red-500/20 text-red-400" },
};

const ROLE_TYPES = [
  { value: "operator", label: "Operador" },
  { value: "supervisor", label: "Supervisor" },
  { value: "observer", label: "Observador" },
  { value: "trainer", label: "Entrenador" },
  { value: "external", label: "Externo" },
  { value: "custom", label: "Personalizado" },
];

export default function TrainingRequestsPage() {
  const { user, company } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TrainingRequestFull | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [activeTab, setActiveTab] = useState("info");
  
  const [newRequest, setNewRequest] = useState({
    title: "",
    description: "",
    objective: "",
    justification: "",
    priority: "medium" as const,
    targetAudience: "",
    participantCount: "",
    estimatedHours: "",
    proposedStartDate: "",
    notes: "",
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["training-requests", company?.id],
    queryFn: () => company?.id ? trainingRequestsAPI.getByCompany(company.id) : Promise.resolve([]),
    enabled: !!company?.id,
  });

  const { data: companyUsers = [] } = useQuery({
    queryKey: ["users", company?.id],
    queryFn: () => company?.id ? usersAPI.getByCompany(company.id) : Promise.resolve([]),
    enabled: !!company?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<TrainingRequest>) => trainingRequestsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-requests"] });
      setShowCreateDialog(false);
      resetForm();
      toast.success("Solicitud creada exitosamente");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al crear solicitud");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TrainingRequest> }) => 
      trainingRequestsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-requests"] });
      if (selectedRequest) {
        loadRequestDetails(selectedRequest.id);
      }
      toast.success("Solicitud actualizada");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => trainingRequestsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-requests"] });
      setViewMode("list");
      setSelectedRequest(null);
      toast.success("Solicitud eliminada");
    },
  });

  const resetForm = () => {
    setNewRequest({
      title: "",
      description: "",
      objective: "",
      justification: "",
      priority: "medium",
      targetAudience: "",
      participantCount: "",
      estimatedHours: "",
      proposedStartDate: "",
      notes: "",
    });
  };

  const handleCreate = () => {
    if (!company?.id || !user?.id) {
      toast.error("Error de autenticación. Por favor, cierra sesión y vuelve a iniciar sesión.");
      return;
    }
    createMutation.mutate({
      companyId: company.id,
      title: newRequest.title,
      description: newRequest.description || undefined,
      objective: newRequest.objective || undefined,
      justification: newRequest.justification || undefined,
      priority: newRequest.priority,
      targetAudience: newRequest.targetAudience || undefined,
      participantCount: newRequest.participantCount ? parseInt(newRequest.participantCount) : undefined,
      estimatedHours: newRequest.estimatedHours ? parseFloat(newRequest.estimatedHours) : undefined,
      proposedStartDate: newRequest.proposedStartDate ? new Date(newRequest.proposedStartDate) : undefined,
      notes: newRequest.notes || undefined,
    });
  };

  const loadRequestDetails = async (id: number) => {
    try {
      const fullRequest = await trainingRequestsAPI.getFull(id);
      setSelectedRequest(fullRequest);
      setViewMode("detail");
    } catch (error) {
      toast.error("Error al cargar detalles");
    }
  };

  const handleSubmitRequest = () => {
    if (!selectedRequest) return;
    updateMutation.mutate({
      id: selectedRequest.id,
      data: { status: "submitted" },
    });
  };

  const canEdit = user?.role === "admin" || user?.role === "super_admin" || user?.role === "trainer";

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="h-12 w-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Cargando solicitudes...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (viewMode === "detail" && selectedRequest) {
    return (
      <DashboardShell>
        <RequestDetailView 
          request={selectedRequest}
          onBack={() => { setViewMode("list"); setSelectedRequest(null); }}
          onSubmit={handleSubmitRequest}
          onDelete={() => deleteMutation.mutate(selectedRequest.id)}
          canEdit={canEdit}
          companyUsers={companyUsers}
          queryClient={queryClient}
        />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-heading bg-gradient-to-r from-white to-accent bg-clip-text text-transparent">
              Solicitudes de Entrenamiento
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestiona las solicitudes de entrenamiento OTS para tu organización
            </p>
          </div>
          {canEdit && (
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20"
              data-testid="button-new-request"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Solicitud
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(STATUS_CONFIG).slice(0, 4).map(([key, config]) => {
            const count = requests.filter(r => r.status === key).length;
            const Icon = config.icon;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden"
              >
                <Card className="border-white/10 bg-gradient-to-br from-card to-card/50 backdrop-blur">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{config.label}</p>
                        <p className="text-2xl font-bold mt-1">{count}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${config.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {requests.length === 0 ? (
              <Card className="border-white/10 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center mb-6">
                    <FileText className="h-10 w-10 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Sin solicitudes</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Aún no hay solicitudes de entrenamiento. Crea la primera para comenzar a planificar el programa OTS.
                  </p>
                  {canEdit && (
                    <Button onClick={() => setShowCreateDialog(true)} className="bg-accent text-accent-foreground">
                      <Plus className="mr-2 h-4 w-4" />
                      Crear Primera Solicitud
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              requests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className="border-white/10 hover:border-accent/50 transition-all cursor-pointer group overflow-hidden"
                    onClick={() => loadRequestDetails(request.id)}
                    data-testid={`card-request-${request.id}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-6 relative">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="text-xs font-mono">
                              {request.requestCode}
                            </Badge>
                            <Badge className={STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG]?.color}>
                              {STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG]?.label}
                            </Badge>
                            <Badge className={PRIORITY_CONFIG[request.priority as keyof typeof PRIORITY_CONFIG]?.color}>
                              {PRIORITY_CONFIG[request.priority as keyof typeof PRIORITY_CONFIG]?.label}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                            {request.title}
                          </h3>
                          {request.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {request.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            {request.proposedStartDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(request.proposedStartDate).toLocaleDateString("es-MX")}
                              </span>
                            )}
                            {request.participantCount && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {request.participantCount} participantes
                              </span>
                            )}
                            {request.estimatedHours && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {request.estimatedHours}h estimadas
                              </span>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-2xl bg-card border-border/60 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" />
              Nueva Solicitud de Entrenamiento
            </DialogTitle>
            <DialogDescription>
              Crea una solicitud para planificar un nuevo entrenamiento OTS
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-semibold text-accent">
                Título de la Solicitud * (Obligatorio)
              </Label>
              <Input
                id="title"
                placeholder="Ej: Entrenamiento de Fallas en Líneas 115kV"
                value={newRequest.title}
                onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                data-testid="input-request-title"
                className={!newRequest.title.trim() ? "border-destructive ring-1 ring-destructive" : ""}
              />
              {!newRequest.title.trim() && (
                <p className="text-sm text-destructive">Este campo es obligatorio para crear la solicitud</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select 
                  value={newRequest.priority} 
                  onValueChange={(value) => setNewRequest(prev => ({ ...prev, priority: value as typeof newRequest.priority }))}
                >
                  <SelectTrigger data-testid="select-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha Propuesta</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newRequest.proposedStartDate}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, proposedStartDate: e.target.value }))}
                  data-testid="input-start-date"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Describe el entrenamiento propuesto..."
                value={newRequest.description}
                onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[80px]"
                data-testid="input-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="objective">Objetivo del Entrenamiento</Label>
              <Textarea
                id="objective"
                placeholder="¿Qué se espera lograr con este entrenamiento?"
                value={newRequest.objective}
                onChange={(e) => setNewRequest(prev => ({ ...prev, objective: e.target.value }))}
                className="min-h-[60px]"
                data-testid="input-objective"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="justification">Justificación</Label>
              <Textarea
                id="justification"
                placeholder="¿Por qué es necesario este entrenamiento?"
                value={newRequest.justification}
                onChange={(e) => setNewRequest(prev => ({ ...prev, justification: e.target.value }))}
                className="min-h-[60px]"
                data-testid="input-justification"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="audience">Audiencia Objetivo</Label>
                <Input
                  id="audience"
                  placeholder="Operadores de red"
                  value={newRequest.targetAudience}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, targetAudience: e.target.value }))}
                  data-testid="input-audience"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="participants">Participantes</Label>
                <Input
                  id="participants"
                  type="number"
                  placeholder="10"
                  value={newRequest.participantCount}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, participantCount: e.target.value }))}
                  data-testid="input-participants"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">Horas Estimadas</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.5"
                  placeholder="8"
                  value={newRequest.estimatedHours}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, estimatedHours: e.target.value }))}
                  data-testid="input-hours"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas Adicionales</Label>
              <Textarea
                id="notes"
                placeholder="Información adicional relevante..."
                value={newRequest.notes}
                onChange={(e) => setNewRequest(prev => ({ ...prev, notes: e.target.value }))}
                data-testid="input-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={!newRequest.title.trim() || createMutation.isPending}
              className="bg-accent text-accent-foreground"
              data-testid="button-create-request"
            >
              {createMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando...</>
              ) : !newRequest.title.trim() ? (
                "Falta el Título"
              ) : (
                "Crear Solicitud"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

function RequestDetailView({ 
  request, 
  onBack, 
  onSubmit, 
  onDelete,
  canEdit,
  companyUsers,
  queryClient,
}: { 
  request: TrainingRequestFull;
  onBack: () => void;
  onSubmit: () => void;
  onDelete: () => void;
  canEdit: boolean;
  companyUsers: any[];
  queryClient: any;
}) {
  const [activeTab, setActiveTab] = useState("incidents");
  const [showAddDialog, setShowAddDialog] = useState<string | null>(null);
  
  const [incidentForm, setIncidentForm] = useState({ title: "", description: "", severity: "", gridZone: "", simulationGoal: "" });
  const [roleForm, setRoleForm] = useState({ participantName: "", roleType: "operator", responsibilities: "", contactEmail: "" });
  const [procedureForm, setProcedureForm] = useState({ procedureTitle: "", referenceCode: "", description: "", isMandatory: true });
  const [topicForm, setTopicForm] = useState({ topicTitle: "", description: "", simulationGoal: "", scenarioCategory: "" });

  const createIncidentMutation = useMutation({
    mutationFn: (data: Partial<RequestIncident>) => trainingRequestsAPI.createIncident(request.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-requests"] });
      setShowAddDialog(null);
      setIncidentForm({ title: "", description: "", severity: "", gridZone: "", simulationGoal: "" });
      toast.success("Reporte de falla agregado");
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: (data: Partial<RequestRole>) => trainingRequestsAPI.createRole(request.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-requests"] });
      setShowAddDialog(null);
      setRoleForm({ participantName: "", roleType: "operator", responsibilities: "", contactEmail: "" });
      toast.success("Rol agregado");
    },
  });

  const createProcedureMutation = useMutation({
    mutationFn: (data: Partial<RequestProcedure>) => trainingRequestsAPI.createProcedure(request.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-requests"] });
      setShowAddDialog(null);
      setProcedureForm({ procedureTitle: "", referenceCode: "", description: "", isMandatory: true });
      toast.success("Procedimiento agregado");
    },
  });

  const createTopicMutation = useMutation({
    mutationFn: (data: Partial<RequestTopic>) => trainingRequestsAPI.createTopic(request.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-requests"] });
      setShowAddDialog(null);
      setTopicForm({ topicTitle: "", description: "", simulationGoal: "", scenarioCategory: "" });
      toast.success("Tema agregado");
    },
  });

  const deleteIncidentMutation = useMutation({
    mutationFn: (id: number) => trainingRequestsAPI.deleteIncident(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-requests"] });
      toast.success("Reporte eliminado");
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id: number) => trainingRequestsAPI.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-requests"] });
      toast.success("Rol eliminado");
    },
  });

  const deleteProcedureMutation = useMutation({
    mutationFn: (id: number) => trainingRequestsAPI.deleteProcedure(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-requests"] });
      toast.success("Procedimiento eliminado");
    },
  });

  const deleteTopicMutation = useMutation({
    mutationFn: (id: number) => trainingRequestsAPI.deleteTopic(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-requests"] });
      toast.success("Tema eliminado");
    },
  });

  const statusConfig = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG];
  const priorityConfig = PRIORITY_CONFIG[request.priority as keyof typeof PRIORITY_CONFIG];
  const StatusIcon = statusConfig?.icon || FileText;

  const annexCounts = {
    incidents: request.incidents?.length || 0,
    roles: request.roles?.length || 0,
    procedures: request.procedures?.length || 0,
    topics: request.topics?.length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono">{request.requestCode}</Badge>
            <Badge className={statusConfig?.color}>{statusConfig?.label}</Badge>
            <Badge className={priorityConfig?.color}>{priorityConfig?.label}</Badge>
          </div>
          <h1 className="text-2xl font-bold font-heading mt-2">{request.title}</h1>
        </div>
        <div className="flex gap-2">
          {canEdit && request.status === "draft" && (
            <>
              <Button 
                variant="outline" 
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={onDelete}
                data-testid="button-delete-request"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
              <Button 
                onClick={onSubmit}
                className="bg-accent text-accent-foreground"
                data-testid="button-submit-request"
              >
                <Send className="mr-2 h-4 w-4" />
                Enviar Solicitud
              </Button>
            </>
          )}
        </div>
      </div>

      <Card className="border-white/10 bg-gradient-to-br from-card to-card/50">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Objetivo</p>
              <p className="text-sm">{request.objective || "No especificado"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Justificación</p>
              <p className="text-sm">{request.justification || "No especificada"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Detalles</p>
              <div className="text-sm space-y-1">
                {request.proposedStartDate && (
                  <p className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    {new Date(request.proposedStartDate).toLocaleDateString("es-MX")}
                  </p>
                )}
                {request.participantCount && (
                  <p className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    {request.participantCount} participantes
                  </p>
                )}
                {request.estimatedHours && (
                  <p className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {request.estimatedHours} horas
                  </p>
                )}
              </div>
            </div>
          </div>
          {request.description && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Descripción</p>
              <p className="text-sm text-muted-foreground">{request.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        {[
          { key: "incidents", label: "Reportes de Fallas", icon: FileWarning, count: annexCounts.incidents },
          { key: "roles", label: "Roles", icon: UserCog, count: annexCounts.roles },
          { key: "procedures", label: "Procedimientos", icon: BookOpen, count: annexCounts.procedures },
          { key: "topics", label: "Temas/Situaciones", icon: Target, count: annexCounts.topics },
        ].map((item) => (
          <Card 
            key={item.key}
            className={`border-white/10 cursor-pointer transition-all ${activeTab === item.key ? "ring-2 ring-accent border-accent/50" : "hover:border-white/20"}`}
            onClick={() => setActiveTab(item.key)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${activeTab === item.key ? "bg-accent/20 text-accent" : "bg-white/5 text-muted-foreground"}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-xl font-bold">{item.count}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-white/10">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">
            {activeTab === "incidents" && "Anexo: Reportes de Fallas a Reproducir"}
            {activeTab === "roles" && "Anexo: Roles del Entrenamiento"}
            {activeTab === "procedures" && "Anexo: Procedimientos y Criterios Operativos"}
            {activeTab === "topics" && "Anexo: Temas y Situaciones a Simular"}
          </CardTitle>
          {canEdit && request.status === "draft" && (
            <Button 
              size="sm" 
              onClick={() => setShowAddDialog(activeTab)}
              className="bg-accent/20 text-accent hover:bg-accent/30"
              data-testid={`button-add-${activeTab}`}
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {activeTab === "incidents" && (
            <AnnexList
              items={request.incidents}
              emptyText="No hay reportes de fallas configurados"
              emptyIcon={FileWarning}
              renderItem={(item: RequestIncident) => (
                <div className="flex items-start justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.title}</h4>
                    {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      {item.severity && <span>Severidad: {item.severity}</span>}
                      {item.gridZone && <span>Zona: {item.gridZone}</span>}
                    </div>
                  </div>
                  {canEdit && request.status === "draft" && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-400 hover:text-red-300"
                      onClick={() => deleteIncidentMutation.mutate(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            />
          )}
          {activeTab === "roles" && (
            <AnnexList
              items={request.roles}
              emptyText="No hay roles configurados"
              emptyIcon={UserCog}
              renderItem={(item: RequestRole) => (
                <div className="flex items-start justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{item.participantName}</h4>
                      <Badge variant="outline" className="text-xs">
                        {ROLE_TYPES.find(r => r.value === item.roleType)?.label || item.roleType}
                      </Badge>
                      {item.isConfirmed && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                    </div>
                    {item.responsibilities && <p className="text-sm text-muted-foreground mt-1">{item.responsibilities}</p>}
                    {item.contactEmail && <p className="text-xs text-muted-foreground mt-1">{item.contactEmail}</p>}
                  </div>
                  {canEdit && request.status === "draft" && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-400 hover:text-red-300"
                      onClick={() => deleteRoleMutation.mutate(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            />
          )}
          {activeTab === "procedures" && (
            <AnnexList
              items={request.procedures}
              emptyText="No hay procedimientos configurados"
              emptyIcon={BookOpen}
              renderItem={(item: RequestProcedure) => (
                <div className="flex items-start justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{item.procedureTitle}</h4>
                      {item.referenceCode && <Badge variant="outline" className="text-xs font-mono">{item.referenceCode}</Badge>}
                      {item.isMandatory && <Badge className="bg-red-500/20 text-red-400 text-xs">Obligatorio</Badge>}
                    </div>
                    {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                  </div>
                  {canEdit && request.status === "draft" && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-400 hover:text-red-300"
                      onClick={() => deleteProcedureMutation.mutate(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            />
          )}
          {activeTab === "topics" && (
            <AnnexList
              items={request.topics}
              emptyText="No hay temas configurados"
              emptyIcon={Target}
              renderItem={(item: RequestTopic) => (
                <div className="flex items-start justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{item.topicTitle}</h4>
                      {item.scenarioCategory && <Badge variant="outline" className="text-xs">{item.scenarioCategory}</Badge>}
                      {item.difficulty && <Badge className="bg-accent/20 text-accent text-xs">{item.difficulty}</Badge>}
                    </div>
                    {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
                    {item.simulationGoal && (
                      <p className="text-xs text-muted-foreground mt-2">
                        <span className="font-medium">Objetivo:</span> {item.simulationGoal}
                      </p>
                    )}
                  </div>
                  {canEdit && request.status === "draft" && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-400 hover:text-red-300"
                      onClick={() => deleteTopicMutation.mutate(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog === "incidents"} onOpenChange={() => setShowAddDialog(null)}>
        <DialogContent className="bg-card border-border/60">
          <DialogHeader>
            <DialogTitle>Agregar Reporte de Falla</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={incidentForm.title}
                onChange={(e) => setIncidentForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Nombre del incidente/falla"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Severidad</Label>
                <Select value={incidentForm.severity} onValueChange={(v) => setIncidentForm(prev => ({ ...prev, severity: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Zona de Red</Label>
                <Input
                  value={incidentForm.gridZone}
                  onChange={(e) => setIncidentForm(prev => ({ ...prev, gridZone: e.target.value }))}
                  placeholder="Ej: Subestación Norte"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={incidentForm.description}
                onChange={(e) => setIncidentForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe el incidente..."
              />
            </div>
            <div className="space-y-2">
              <Label>Objetivo de Simulación</Label>
              <Input
                value={incidentForm.simulationGoal}
                onChange={(e) => setIncidentForm(prev => ({ ...prev, simulationGoal: e.target.value }))}
                placeholder="¿Qué se quiere lograr simulando esta falla?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(null)}>Cancelar</Button>
            <Button 
              onClick={() => createIncidentMutation.mutate(incidentForm)}
              disabled={!incidentForm.title || createIncidentMutation.isPending}
              className="bg-accent text-accent-foreground"
            >
              {createIncidentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddDialog === "roles"} onOpenChange={() => setShowAddDialog(null)}>
        <DialogContent className="bg-card border-border/60">
          <DialogHeader>
            <DialogTitle>Agregar Rol</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre del Participante *</Label>
              <Input
                value={roleForm.participantName}
                onChange={(e) => setRoleForm(prev => ({ ...prev, participantName: e.target.value }))}
                placeholder="Nombre completo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Rol</Label>
                <Select value={roleForm.roleType} onValueChange={(v) => setRoleForm(prev => ({ ...prev, roleType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLE_TYPES.map(role => (
                      <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={roleForm.contactEmail}
                  onChange={(e) => setRoleForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Responsabilidades</Label>
              <Textarea
                value={roleForm.responsibilities}
                onChange={(e) => setRoleForm(prev => ({ ...prev, responsibilities: e.target.value }))}
                placeholder="Describe las responsabilidades durante el entrenamiento..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(null)}>Cancelar</Button>
            <Button 
              onClick={() => createRoleMutation.mutate(roleForm)}
              disabled={!roleForm.participantName || createRoleMutation.isPending}
              className="bg-accent text-accent-foreground"
            >
              {createRoleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddDialog === "procedures"} onOpenChange={() => setShowAddDialog(null)}>
        <DialogContent className="bg-card border-border/60">
          <DialogHeader>
            <DialogTitle>Agregar Procedimiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título del Procedimiento *</Label>
              <Input
                value={procedureForm.procedureTitle}
                onChange={(e) => setProcedureForm(prev => ({ ...prev, procedureTitle: e.target.value }))}
                placeholder="Nombre del procedimiento"
              />
            </div>
            <div className="space-y-2">
              <Label>Código de Referencia</Label>
              <Input
                value={procedureForm.referenceCode}
                onChange={(e) => setProcedureForm(prev => ({ ...prev, referenceCode: e.target.value }))}
                placeholder="Ej: PRO-OPS-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={procedureForm.description}
                onChange={(e) => setProcedureForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe el procedimiento y criterios operativos..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(null)}>Cancelar</Button>
            <Button 
              onClick={() => createProcedureMutation.mutate(procedureForm)}
              disabled={!procedureForm.procedureTitle || createProcedureMutation.isPending}
              className="bg-accent text-accent-foreground"
            >
              {createProcedureMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddDialog === "topics"} onOpenChange={() => setShowAddDialog(null)}>
        <DialogContent className="bg-card border-border/60">
          <DialogHeader>
            <DialogTitle>Agregar Tema/Situación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título del Tema *</Label>
              <Input
                value={topicForm.topicTitle}
                onChange={(e) => setTopicForm(prev => ({ ...prev, topicTitle: e.target.value }))}
                placeholder="Nombre del tema o situación"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoría de Escenario</Label>
              <Select value={topicForm.scenarioCategory} onValueChange={(v) => setTopicForm(prev => ({ ...prev, scenarioCategory: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar categoría" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fault">Falla</SelectItem>
                  <SelectItem value="Maintenance">Mantenimiento</SelectItem>
                  <SelectItem value="Overload">Sobrecarga</SelectItem>
                  <SelectItem value="Topology">Topología</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={topicForm.description}
                onChange={(e) => setTopicForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe la situación a simular..."
              />
            </div>
            <div className="space-y-2">
              <Label>Objetivo de la Simulación</Label>
              <Input
                value={topicForm.simulationGoal}
                onChange={(e) => setTopicForm(prev => ({ ...prev, simulationGoal: e.target.value }))}
                placeholder="¿Qué debe demostrar el operador?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(null)}>Cancelar</Button>
            <Button 
              onClick={() => createTopicMutation.mutate(topicForm)}
              disabled={!topicForm.topicTitle || createTopicMutation.isPending}
              className="bg-accent text-accent-foreground"
            >
              {createTopicMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AnnexList({ items, emptyText, emptyIcon: EmptyIcon, renderItem }: { 
  items: any[]; 
  emptyText: string; 
  emptyIcon: any;
  renderItem: (item: any) => React.ReactNode;
}) {
  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <EmptyIcon className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {renderItem(item)}
        </motion.div>
      ))}
    </div>
  );
}
