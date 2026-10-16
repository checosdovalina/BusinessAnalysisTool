import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardShell from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { competencyDncAPI, simulatorScenariosAPI, trainingRequestsAPI, simulatorSessionsAPI } from "@/lib/api";
import type { CompetencyDncData } from "@/lib/api";
import { toast } from "sonner";
import {
  AlertCircle, ArrowDownRight, ArrowUpRight, BookOpenCheck, Check, ChevronRight,
  ClipboardCheck, Clock3, FileCheck2, Plus, RefreshCw, ShieldCheck, Trash2,
  UsersRound, Zap,
} from "lucide-react";

const levels = [1, 2, 3, 4, 5];
const observedLevels = [0, 1, 2, 3, 4, 5];

const emptyProfile = { title: "", department: "", description: "" };
const emptyCompetency = { name: "", category: "", description: "" };

function levelLabel(level: number) {
  return level === 0 ? "Sin observar" : `Nivel ${level}`;
}

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    super_admin: "Superadministrador",
    admin: "Administrador",
    trainer: "Capacitador",
    student: "Operador en capacitación",
  };
  return labels[role] ?? "Sin rol especificado";
}

function formatDate(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(date);
}

export default function CompetencyDncPage() {
  const { company, user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const companyId = company?.id;
  const queryKey = ["competency-dnc", companyId];
  const [profileId, setProfileId] = useState("");
  const [competencyId, setCompetencyId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showCompetencyDialog, setShowCompetencyDialog] = useState(false);
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [competencyForm, setCompetencyForm] = useState(emptyCompetency);
  const [requirementLevel, setRequirementLevel] = useState("3");
  const [critical, setCritical] = useState(false);
  const [observedLevel, setObservedLevel] = useState("0");
  const [evidence, setEvidence] = useState("");
  const [observations, setObservations] = useState("");
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [planAssessment, setPlanAssessment] = useState<CompetencyDncData["assessments"][number] | null>(null);
  const [planForm, setPlanForm] = useState({
    responsibleId: user?.id ? String(user.id) : "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    hours: "4",
    method: "Práctica guiada y reevaluación",
    scenarioId: "",
  });

  const { data, isLoading, isError, error, refetch } = useQuery<CompetencyDncData>({
    queryKey,
    queryFn: () => competencyDncAPI.getByCompany(companyId as number),
    enabled: !!companyId,
  });
  const { data: scenarios = [] } = useQuery({
    queryKey: ["simulator-scenarios", companyId],
    queryFn: () => simulatorScenariosAPI.getByCompany(companyId ?? null),
    enabled: !!companyId,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey });
  const createProfile = useMutation({
    mutationFn: (input: { companyId: number; title: string; department?: string; description?: string }) =>
      competencyDncAPI.createProfile(input),
    onSuccess: (profile) => {
      refresh();
      setProfileId(String(profile.id));
      setShowProfileDialog(false);
      setProfileForm(emptyProfile);
      toast.success("Perfil de puesto creado");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "No se pudo crear el perfil de puesto"),
  });
  const updateProfile = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => competencyDncAPI.updateProfile(id, { active }),
    onSuccess: () => { refresh(); toast.success("Estado del perfil actualizado"); },
    onError: (err) => toast.error(err instanceof Error ? err.message : "No se pudo actualizar el perfil"),
  });
  const createCompetency = useMutation({
    mutationFn: (input: { companyId: number; name: string; category?: string; description?: string }) =>
      competencyDncAPI.createCompetency(input),
    onSuccess: (competency) => {
      refresh();
      setCompetencyId(String(competency.id));
      setShowCompetencyDialog(false);
      setCompetencyForm(emptyCompetency);
      toast.success("Competencia agregada al catálogo");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "No se pudo crear la competencia"),
  });
  const saveRequirement = useMutation({
    mutationFn: ({ existingId, profile, competency, level, isCritical }: {
      existingId?: number; profile: number; competency: number; level: number; isCritical: boolean;
    }) => existingId
      ? competencyDncAPI.updateProfileCompetency(existingId, { requiredLevel: level, isCritical })
      : competencyDncAPI.setProfileCompetency({ profileId: profile, competencyId: competency, requiredLevel: level, isCritical }),
    onSuccess: () => { refresh(); toast.success("Requisito del perfil guardado"); },
    onError: (err) => toast.error(err instanceof Error ? err.message : "No se pudo guardar el requisito"),
  });
  const removeRequirement = useMutation({
    mutationFn: (id: number) => competencyDncAPI.deleteProfileCompetency(id),
    onSuccess: () => { refresh(); toast.success("Requisito eliminado del perfil"); },
    onError: (err) => toast.error(err instanceof Error ? err.message : "No se pudo eliminar el requisito"),
  });
  const createAssessment = useMutation({
    mutationFn: (input: {
      companyId: number; profileId: number; competencyId: number; employeeId: number;
      currentLevel: number; evidence?: string; observations?: string;
    }) => competencyDncAPI.createAssessment(input),
    onSuccess: () => {
      refresh();
      setObservedLevel("0");
      setEvidence("");
      setObservations("");
      toast.success("Evaluación registrada. Se conservó el historial anterior.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "No se pudo registrar la evaluación"),
  });
  const assignProfile = useMutation({
    mutationFn: ({ employeeId: id, profileId: assignedProfileId }: { employeeId: number; profileId: number }) =>
      competencyDncAPI.assignJobProfile(id, companyId as number, assignedProfileId),
    onSuccess: () => { refresh(); toast.success("Perfil vigente asignado al operador"); },
    onError: (err) => toast.error(err instanceof Error ? err.message : "No se pudo asignar el perfil"),
  });
  const linkExistingSession = useMutation({
    mutationFn: ({ sessionId, requestId }: { sessionId: number; requestId: number }) =>
      simulatorSessionsAPI.update(sessionId, { trainingRequestId: requestId }),
    onSuccess: () => { refresh(); toast.success("Sesión existente vinculada al programa DNC"); },
    onError: (err) => toast.error(err instanceof Error ? err.message : "No se pudo vincular la sesión"),
  });
  const createTrainingRequest = useMutation({
    mutationFn: (input: {
      record: CompetencyDncData["assessments"][number];
      responsibleId: number;
      startDate: string;
      endDate: string;
      hours: number;
      method: string;
      scenarioId?: number;
    }) => {
      const { record } = input;
      if (!companyId) throw new Error("No se encontró la empresa");
      const person = data?.employees.find((employee) => employee.id === record.employeeId);
      const recordProfile = profiles.find((item) => item.id === record.profileId);
      const recordCompetency = competencies.find((item) => item.id === record.competencyId);
      return trainingRequestsAPI.create({
        companyId,
        title: `DNC: ${recordCompetency?.name ?? "Competencia"} — ${person?.name ?? "Operador"}`,
        description: `Brecha de competencia registrada para ${person?.name ?? "operador"} en el perfil ${recordProfile?.title ?? "de puesto"}.`,
        objective: `Desarrollar ${recordCompetency?.name ?? "la competencia"} hasta alcanzar el nivel requerido ${record.requiredLevel}/5.`,
        justification: `La evaluación DNC ${record.id} registró un nivel observado de ${record.currentLevel}/5 frente al nivel requerido ${record.requiredLevel}/5.`,
        targetAudience: person?.name ?? "Operador",
        participantCount: 1,
        priority: record.currentLevel === 0 ? "critical" : "high",
        responsibleId: input.responsibleId,
        proposedStartDate: new Date(`${input.startDate}T09:00:00`),
        proposedEndDate: new Date(`${input.endDate}T17:00:00`),
        estimatedHours: input.hours,
        trainingMethod: input.method,
        simulatorScenarioId: input.scenarioId,
        dncAssessmentId: record.id,
        notes: `Origen DNC: registro ${record.id}. Nivel requerido al evaluar: ${record.requiredLevel}/5; nivel observado: ${record.currentLevel}/5.`,
      });
    },
    onSuccess: () => {
      refresh();
      queryClient.invalidateQueries({ queryKey: ["training-requests"] });
      setShowPlanDialog(false);
      setPlanAssessment(null);
      toast.success("Solicitud de entrenamiento creada desde la brecha DNC");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "No se pudo crear la solicitud de entrenamiento"),
  });

  const profiles = data?.profiles ?? [];
  const competencies = data?.competencies ?? [];
  const profile = profiles.find((item) => String(item.id) === profileId);
  const activeProfiles = profiles.filter((item) => item.active);
  const activeCompetencies = competencies.filter((item) => item.active);
  const profileLinks = useMemo(
    () => (data?.profileCompetencies ?? []).filter((link) => String(link.profileId) === profileId),
    [data?.profileCompetencies, profileId],
  );
  const selectedLink = profileLinks.find((link) => String(link.competencyId) === competencyId);
  const selectedCompetency = competencies.find((item) => String(item.id) === competencyId);
  const requiredLevel = selectedLink?.requiredLevel ?? null;
  const observed = Number(observedLevel);
  const gap = requiredLevel === null ? null : Math.max(requiredLevel - observed, 0);
  const history = useMemo(() => {
    return [...(data?.assessments ?? [])]
      .filter((record) =>
        (!profileId || String(record.profileId) === profileId) &&
        (!competencyId || String(record.competencyId) === competencyId) &&
        (!employeeId || String(record.employeeId) === employeeId))
      .sort((a, b) => new Date(b.assessedAt).getTime() - new Date(a.assessedAt).getTime());
  }, [data?.assessments, profileId, competencyId, employeeId]);
  const currentAssignments = data?.assignments ?? [];
  const activeTrainers = (data?.employees ?? []).filter((person) => ["admin", "trainer", "super_admin"].includes(person.role));
  const dncRequests = data?.requests ?? [];
  const isPlanValid = !!planAssessment && !!planForm.responsibleId && !!planForm.startDate && !!planForm.endDate &&
    planForm.endDate >= planForm.startDate && Number(planForm.hours) > 0 && !!planForm.method.trim();
  const latestAssessmentsByCompetency = new Map<string, CompetencyDncData["assessments"][number]>();
  for (const item of data?.assessments ?? []) {
    const key = `${item.employeeId}:${item.profileId}:${item.competencyId}`;
    const current = latestAssessmentsByCompetency.get(key);
    if (!current || new Date(item.assessedAt).getTime() > new Date(current.assessedAt).getTime()) {
      latestAssessmentsByCompetency.set(key, item);
    }
  }

  const updateSelectedRequirement = (linkId: number, level: number, isCritical: boolean) => {
    saveRequirement.mutate({
      existingId: linkId,
      profile: Number(profileId),
      competency: Number(competencyId),
      level,
      isCritical,
    });
  };

  const handleRequirementSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile || !competencyId) return;
    saveRequirement.mutate({
      existingId: selectedLink?.id,
      profile: profile.id,
      competency: Number(competencyId),
      level: Number(requirementLevel),
      isCritical: critical,
    });
  };

  const canAssess = Boolean(companyId && profile?.active && selectedLink && employeeId);
  const assessmentError = !activeProfiles.length
    ? "Crea o activa un perfil de puesto antes de registrar una evaluación."
    : !activeCompetencies.length
      ? "Crea o activa una competencia antes de registrar una evaluación."
      : profile && !profile.active
        ? "Elige un perfil de puesto activo para registrar una evaluación."
      : employeeId && !currentAssignments.some((assignment) => assignment.employeeId === Number(employeeId))
        ? "Asigna el perfil vigente del operador antes de evaluarlo."
      : employeeId && currentAssignments.find((assignment) => assignment.employeeId === Number(employeeId))?.profileId !== Number(profileId)
        ? "La evaluación debe usar el perfil actualmente asignado al operador."
      : !profileLinks.length
        ? "Agrega al menos una competencia requerida a este perfil."
        : !employeeId ? "Selecciona a una persona para continuar." : "";

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="space-y-6" aria-label="Cargando datos de competencias">
          <div className="h-8 w-64 animate-pulse rounded bg-muted" />
          <div className="h-28 animate-pulse rounded-xl bg-muted" />
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="h-80 animate-pulse rounded-xl bg-muted" />
            <div className="h-80 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (!companyId) {
    return (
      <DashboardShell>
        <div className="mx-auto max-w-2xl rounded-xl border border-amber-300 bg-amber-50 p-6 text-amber-950" role="alert">
          <div className="flex gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div>
            <h1 className="font-semibold">No está disponible la información de la empresa</h1>
            <p className="mt-1 text-sm">Inicia sesión con una cuenta de la organización para consultar los registros de competencias.</p>
          </div></div>
        </div>
      </DashboardShell>
    );
  }

  if (isError) {
    return (
      <DashboardShell>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-950" role="alert">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div>
              <h1 className="font-semibold">No se pudieron cargar los registros de competencias</h1>
              <p className="mt-1 text-sm">{error instanceof Error ? error.message : "Revisa tu conexión e inténtalo de nuevo."}</p>
            </div></div>
            <Button variant="outline" onClick={() => refetch()} className="shrink-0 border-rose-300 bg-white text-rose-900 hover:bg-rose-100">
              <RefreshCw className="mr-2 h-4 w-4" /> Reintentar
            </Button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-7">
        <header className="relative overflow-hidden rounded-2xl border border-primary/10 bg-primary/[0.055] px-6 py-7 md:px-8">
          <div className="absolute -right-6 -top-14 h-56 w-56 rounded-full border-[30px] border-teal-900/[0.04]" aria-hidden="true" />
          <div className="absolute right-16 -bottom-20 h-52 w-52 rounded-full border-[1px] border-teal-900/10" aria-hidden="true" />
          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-800">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-900 text-teal-50"><Zap className="h-3.5 w-3.5" /></span>
                Aseguramiento operativo / personal
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-[2.15rem]">Competencias y necesidades de capacitación</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                Define estándares por puesto, documenta el desempeño observado y detecta brechas de competencia para orientar la capacitación.
              </p>
            </div>
            <div className="flex items-center gap-3 self-start rounded-lg border border-white/90 bg-white/75 px-3.5 py-2.5 text-xs text-slate-600 shadow-sm md:self-auto">
              <ShieldCheck className="h-4 w-4 text-teal-800" />
              <span><strong className="block text-slate-800">Registros controlados</strong>El historial de evaluaciones se conserva</span>
            </div>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryTile icon={BookOpenCheck} label="Perfiles de puesto activos" value={activeProfiles.length} detail={`${profiles.length} perfiles en total`} />
          <SummaryTile icon={ClipboardCheck} label="Estándares de competencia" value={data?.profileCompetencies.length ?? 0} detail="Requisitos por perfil y competencia" />
          <SummaryTile icon={UsersRound} label="Registros de evaluación" value={data?.assessments.length ?? 0} detail="Historial acumulativo de registros" />
        </div>

        <Card className="border-border/80 bg-card shadow-sm">
          <CardHeader className="border-b border-border/70 bg-muted/30">
            <SectionHeading step="00" icon={UsersRound} title="Perfil vigente por operador" description="Asigna o cambia el perfil de puesto que se usará como estándar en las siguientes evaluaciones." />
          </CardHeader>
          <CardContent className="grid gap-3 p-5 md:grid-cols-2">
            {(data?.employees ?? []).filter((person) => person.role === "student").map((person) => {
              const assignment = currentAssignments.find((item) => item.employeeId === person.id);
              return (
                <div key={person.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{person.name}</p>
                    <p className="text-xs text-slate-500">{assignment ? `Asignado ${formatDate(assignment.assignedAt)}` : "Sin perfil vigente"}</p>
                  </div>
                  <Select
                    value={assignment ? String(assignment.profileId) : ""}
                    onValueChange={(value) => assignProfile.mutate({ employeeId: person.id, profileId: Number(value) })}
                  >
                    <SelectTrigger className="w-full sm:w-56" aria-label={`Perfil vigente para ${person.name}`}><SelectValue placeholder="Asignar perfil" /></SelectTrigger>
                    <SelectContent>{activeProfiles.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              );
            })}
            {!(data?.employees ?? []).some((person) => person.role === "student") && (
              <p className="text-sm text-slate-500">No hay operadores registrados para asignar perfiles.</p>
            )}
          </CardContent>
        </Card>

        <div className="grid items-start gap-5 xl:grid-cols-[0.92fr_1.08fr]">
          <Card className="overflow-hidden border-border/80 bg-card shadow-sm">
            <CardHeader className="border-b border-border/70 bg-muted/30 pb-5">
              <SectionHeading step="01" icon={BookOpenCheck} title="Estándares por puesto" description="Crea el perfil y define los niveles de competencia requeridos." />
            </CardHeader>
            <CardContent className="space-y-6 p-5 md:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1 space-y-2">
                  <Label htmlFor="profile-select">Perfil de puesto</Label>
                  <Select value={profileId} onValueChange={(value) => { setProfileId(value); setCompetencyId(""); }}>
                    <SelectTrigger id="profile-select" aria-label="Seleccionar un perfil de puesto"><SelectValue placeholder="Selecciona un perfil" /></SelectTrigger>
                    <SelectContent>
                      {profiles.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.title}{item.active ? "" : " — inactivo"}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" className="shrink-0 border-teal-800/25 text-teal-900 hover:bg-teal-50" onClick={() => setShowProfileDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Nuevo perfil
                </Button>
              </div>

              {profile ? (
                 <div className="rounded-xl border border-border/80 bg-background">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{profile.title}</h3>
                        <Badge variant="outline" className={profile.active ? "border-teal-200 bg-teal-50 text-teal-800" : "border-slate-200 text-slate-500"}>
                          {profile.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{profile.department || "Sin departamento especificado"}</p>
                    </div>
                    <Button
                      variant="ghost" size="sm"
                      disabled={updateProfile.isPending}
                      onClick={() => updateProfile.mutate({ id: profile.id, active: !profile.active })}
                      aria-label={profile.active ? "Desactivar perfil" : "Activar perfil"}
                    >
                      {profile.active ? "Desactivar" : "Activar"}
                    </Button>
                  </div>
                  {profile.description && <p className="px-4 pt-3 text-sm leading-5 text-slate-600">{profile.description}</p>}
                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Competencias requeridas</h4>
                      <span className="text-xs tabular-nums text-slate-500">{profileLinks.length} asignadas</span>
                    </div>
                    {profileLinks.length ? (
                      <div className="divide-y divide-slate-100">
                        {profileLinks.map((link) => {
                          const item = competencies.find((competency) => competency.id === link.competencyId);
                          return (
                            <div key={link.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-1 last:pb-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setCompetencyId(String(link.competencyId));
                                  setRequirementLevel(String(link.requiredLevel));
                                  setCritical(link.isCritical);
                                }}
                                className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 rounded"
                              >
                                <span className="block truncate text-sm font-medium text-slate-800">{item?.name ?? "Competencia no disponible"}</span>
                                <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                  <span>Requerido: {link.requiredLevel}/5</span>
                                  {link.isCritical && <span className="rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-800">Crítica</span>}
                                  {item?.category && <span>{item.category}</span>}
                                </span>
                              </button>
                              <div className="flex items-center gap-2">
                                <Select
                                  value={String(link.requiredLevel)}
                                  onValueChange={(value) => updateSelectedRequirement(link.id, Number(value), link.isCritical)}
                                  disabled={saveRequirement.isPending}
                                >
                                  <SelectTrigger className="h-9 w-[108px]" aria-label={`Nivel requerido para ${item?.name ?? "la competencia"}`}><SelectValue /></SelectTrigger>
                                  <SelectContent>{levels.map((level) => <SelectItem key={level} value={String(level)}>Nivel {level}</SelectItem>)}</SelectContent>
                                </Select>
                                <label className="flex h-9 items-center gap-1.5 rounded-md border border-slate-200 px-2 text-xs text-slate-600">
                                  <input
                                    type="checkbox"
                                    checked={link.isCritical}
                                    onChange={(event) => updateSelectedRequirement(link.id, link.requiredLevel, event.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 accent-teal-800 focus-visible:ring-2 focus-visible:ring-teal-700"
                                    aria-label={`Marcar ${item?.name ?? "la competencia"} como crítica`}
                                  />
                                  Crítica
                                </label>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-rose-700" aria-label={`Quitar ${item?.name ?? "la competencia"} del perfil`} disabled={removeRequirement.isPending} onClick={() => removeRequirement.mutate(link.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 px-4 py-6 text-center">
                        <p className="text-sm font-medium text-slate-700">Aún no hay requisitos asignados</p>
                        <p className="mt-1 text-xs text-slate-500">Elige una competencia abajo para definir el estándar de este puesto.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <EmptyPanel icon={BookOpenCheck} title="Selecciona un perfil de puesto" description="Aquí se administran los requisitos del perfil. Crea un perfil para establecer los estándares del puesto." />
              )}

                <form onSubmit={handleRequirementSubmit} className="space-y-4 rounded-xl border border-primary/15 bg-primary/[0.035] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div><h3 className="text-sm font-semibold text-slate-900">{selectedLink ? "Actualizar requisito" : "Asignar competencia"}</h3>
                    <p className="mt-1 text-xs text-slate-500">Define el nivel mínimo de dominio y si es crítico para el puesto seleccionado.</p>
                  </div>
                  <span className="rounded-md bg-white px-2 py-1 font-mono text-[10px] text-slate-500">ESTÁNDAR</span>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requirement-competency">Competencia</Label>
                  <div className="flex gap-2">
                    <Select value={competencyId} onValueChange={(value) => {
                      setCompetencyId(value);
                      const match = profileLinks.find((link) => String(link.competencyId) === value);
                      setRequirementLevel(String(match?.requiredLevel ?? 3));
                      setCritical(match?.isCritical ?? false);
                    }}>
                      <SelectTrigger id="requirement-competency" className="bg-white"><SelectValue placeholder="Selecciona una competencia" /></SelectTrigger>
                      <SelectContent>{activeCompetencies.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button type="button" variant="outline" aria-label="Crear competencia" onClick={() => setShowCompetencyDialog(true)} className="shrink-0 bg-white">
                      <Plus className="h-4 w-4" /><span className="sr-only">Crear competencia</span>
                    </Button>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div className="space-y-2">
                    <Label htmlFor="required-level">Nivel requerido</Label>
                    <Select value={requirementLevel} onValueChange={setRequirementLevel}>
                      <SelectTrigger id="required-level" className="bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>{levels.map((level) => <SelectItem key={level} value={String(level)}>Nivel {level}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <label className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700">
                    <input type="checkbox" checked={critical} onChange={(event) => setCritical(event.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-teal-800 focus-visible:ring-2 focus-visible:ring-teal-700" />
                    Competencia crítica
                  </label>
                </div>
                <Button type="submit" className="w-full bg-teal-900 text-white hover:bg-teal-800" disabled={!profile || !competencyId || saveRequirement.isPending}>
                  {saveRequirement.isPending ? "Guardando estándar…" : selectedLink ? "Guardar requisito" : "Agregar al perfil"}
                </Button>
                {profile && !activeCompetencies.length && <p className="text-xs text-amber-800">Aún no hay competencias activas. Crea una para continuar.</p>}
              </form>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-[#fbfcfb] pb-5">
                <SectionHeading step="02" icon={ClipboardCheck} title="Registrar una evaluación" description="Documenta el desempeño observado frente al estándar del puesto." />
              </CardHeader>
              <CardContent className="space-y-5 p-5 md:p-6">
                {!activeProfiles.length || !activeCompetencies.length ? (
                  <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><p>{assessmentError}</p>
                  </div>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="assessment-profile">Perfil de puesto <span className="text-rose-700">*</span></Label>
                    <Select value={profileId} onValueChange={(value) => { setProfileId(value); setCompetencyId(""); }} disabled={!!employeeId}>
                      <SelectTrigger id="assessment-profile"><SelectValue placeholder="Perfil asignado al operador" /></SelectTrigger>
                      <SelectContent>{activeProfiles.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.title}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assessment-employee">Persona evaluada <span className="text-rose-700">*</span></Label>
                    <Select value={employeeId} onValueChange={(value) => {
                      setEmployeeId(value);
                      const assignment = currentAssignments.find((item) => item.employeeId === Number(value));
                      setProfileId(assignment ? String(assignment.profileId) : "");
                      setCompetencyId("");
                    }}>
                      <SelectTrigger id="assessment-employee"><SelectValue placeholder="Selecciona una persona" /></SelectTrigger>
                      <SelectContent>{(data?.employees ?? []).filter((person) => person.role === "student").map((person) => <SelectItem key={person.id} value={String(person.id)}>{person.name} · {roleLabel(person.role)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assessment-competency">Competencia del perfil <span className="text-rose-700">*</span></Label>
                  <Select value={competencyId} onValueChange={setCompetencyId} disabled={!profile || !profileLinks.length}>
                    <SelectTrigger id="assessment-competency"><SelectValue placeholder={profile ? "Selecciona una competencia requerida" : "Selecciona primero un perfil"} /></SelectTrigger>
                    <SelectContent>{profileLinks.map((link) => {
                      const item = competencies.find((competency) => competency.id === link.competencyId);
                      return item ? <SelectItem key={link.id} value={String(link.competencyId)}>{item.name} · requerido {link.requiredLevel}/5</SelectItem> : null;
                    })}</SelectContent>
                  </Select>
                </div>

                {selectedLink && selectedCompetency && (
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border border-slate-200 bg-[#f8faf9] p-4" aria-live="polite">
                    <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Requerido</p><p className="mt-1 text-lg font-semibold text-slate-900">{selectedLink.requiredLevel}<span className="text-xs font-normal text-slate-500"> / 5</span></p></div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                    <div className="text-right"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Observado</p><p className="mt-1 text-lg font-semibold text-teal-900">{observed}<span className="text-xs font-normal text-slate-500"> / 5</span></p></div>
                    <div className={`col-span-3 flex items-center justify-between rounded-md px-3 py-2 text-xs ${gap ? "bg-amber-50 text-amber-900" : "bg-teal-50 text-teal-900"}`}>
                      <span className="flex items-center gap-1.5 font-medium">{gap ? <ArrowDownRight className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}{gap ? "Se requiere capacitación" : "Estándar alcanzado"}</span>
                      <span className="tabular-nums">{gap ? `Brecha de ${gap} ${gap === 1 ? "nivel" : "niveles"}` : "Sin brecha"}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="observed-level">Nivel de dominio observado <span className="text-rose-700">*</span></Label>
                  <Select value={observedLevel} onValueChange={setObservedLevel} disabled={!selectedLink}>
                    <SelectTrigger id="observed-level"><SelectValue /></SelectTrigger>
                    <SelectContent>{observedLevels.map((level) => <SelectItem key={level} value={String(level)}>{levelLabel(level)}</SelectItem>)}</SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">El nivel 0 indica que no se demostró el dominio durante esta evaluación.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="assessment-evidence">Evidencia / referencia</Label>
                    <Textarea id="assessment-evidence" value={evidence} onChange={(event) => setEvidence(event.target.value)} placeholder="Procedimiento, sesión de simulador, referencia de observación…" className="min-h-[88px] resize-y" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assessment-observations">Observaciones</Label>
                    <Textarea id="assessment-observations" value={observations} onChange={(event) => setObservations(event.target.value)} placeholder="Describe las acciones observadas y el contexto…" className="min-h-[88px] resize-y" />
                  </div>
                </div>
                <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-slate-500">Cada envío crea un registro con fecha. Las evaluaciones anteriores no se reemplazan.</p>
                  <Button
                    className="shrink-0 bg-teal-900 text-white hover:bg-teal-800"
                    disabled={!canAssess || createAssessment.isPending}
                    onClick={() => {
                      if (!canAssess || !profile || !selectedLink || !companyId) return;
                      createAssessment.mutate({
                        companyId, profileId: profile.id, competencyId: selectedLink.competencyId,
                        employeeId: Number(employeeId), currentLevel: observed,
                        evidence: evidence.trim() || undefined, observations: observations.trim() || undefined,
                      });
                    }}
                  >
                    <FileCheck2 className="mr-2 h-4 w-4" />{createAssessment.isPending ? "Registrando…" : "Registrar evaluación"}
                  </Button>
                </div>
                {assessmentError && activeProfiles.length > 0 && activeCompetencies.length > 0 && (
                  <p className="text-xs text-amber-800">{assessmentError}</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-[#fbfcfb] pb-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <SectionHeading step="03" icon={Clock3} title="Historial de evaluaciones" description="Las observaciones anteriores se conservan para su consulta y auditoría." />
                  <Badge variant="outline" className="border-slate-200 bg-white font-mono text-slate-600">{history.length} REGISTROS</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {history.length ? (
                  <div className="divide-y divide-slate-100">
                    {history.map((record) => {
                      const person = data?.employees.find((entry) => entry.id === record.employeeId);
                      const recordProfile = profiles.find((entry) => entry.id === record.profileId);
                      const recordCompetency = competencies.find((entry) => entry.id === record.competencyId);
                      const recordGap = Math.max(record.requiredLevel - record.currentLevel, 0);
                      const hasTrainingRequest = data?.requests.some((request) => request.dncAssessmentId === record.id) ?? false;
                      return (
                        <article key={record.id} className="px-5 py-4 md:px-6">
                          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-medium text-slate-900">{person?.name ?? `Persona ${record.employeeId}`}</h3>
                                <Badge variant="outline" className="border-slate-200 font-mono text-[10px] text-slate-500">REG-{record.id}</Badge>
                                {recordGap !== null && <Badge className={recordGap ? "border-amber-200 bg-amber-50 text-amber-900" : "border-teal-200 bg-teal-50 text-teal-900"}>{recordGap ? "Se requiere capacitación" : "Estándar alcanzado"}</Badge>}
                              </div>
                              <p className="mt-1 text-sm text-slate-700">{recordCompetency?.name ?? "Competencia no disponible"} <span className="text-slate-400">·</span> {recordProfile?.title ?? "Perfil no disponible"}</p>
                              <p className="mt-1 text-xs text-slate-500">Evaluación: {formatDate(record.assessedAt)} · ID de quien evalúa: {record.assessedById}</p>
                            </div>
                            <div className="flex items-center gap-3 self-start rounded-lg bg-slate-50 px-3 py-2">
                              <div><span className="block text-[10px] uppercase tracking-wide text-slate-500">Requerido</span><span className="font-mono text-sm font-semibold text-slate-800">{record.requiredLevel}/5</span></div>
                              <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                              <div><span className="block text-[10px] uppercase tracking-wide text-slate-500">Observado</span><span className="font-mono text-sm font-semibold text-teal-900">{record.currentLevel}/5</span></div>
                              {recordGap !== null && <span className="border-l border-slate-200 pl-3 text-xs text-slate-600">Brecha: {recordGap}</span>}
                            </div>
                          </div>
                          {(record.evidence || record.observations) && (
                            <div className="mt-3 grid gap-2 rounded-md border border-slate-100 bg-[#fbfcfb] p-3 text-xs leading-5 sm:grid-cols-2">
                              {record.evidence && <p><span className="font-semibold text-slate-700">Evidencia: </span><span className="text-slate-600">{record.evidence}</span></p>}
                              {record.observations && <p><span className="font-semibold text-slate-700">Observación: </span><span className="text-slate-600">{record.observations}</span></p>}
                            </div>
                          )}
                          {recordGap > 0 && (
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2">
                              <p className="text-xs text-amber-950">
                                {hasTrainingRequest ? "Ya existe una solicitud vinculada con este registro DNC." : "Convierte esta brecha en una solicitud formal de entrenamiento."}
                              </p>
                              <Button
                                size="sm"
                                variant={hasTrainingRequest ? "outline" : "default"}
                                className={hasTrainingRequest ? "border-amber-300 bg-white text-amber-900" : "bg-amber-900 text-white hover:bg-amber-800"}
                                disabled={hasTrainingRequest || createTrainingRequest.isPending}
                                onClick={() => {
                                  setPlanAssessment(record);
                                  setPlanForm((form) => ({ ...form, responsibleId: user?.id ? String(user.id) : "" }));
                                  setShowPlanDialog(true);
                                }}
                              >
                                {hasTrainingRequest ? "Solicitud vinculada" : "Planificar en programa"}
                              </Button>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-5 py-9 md:px-6"><EmptyPanel icon={Clock3} title="Aún no hay evaluaciones registradas" description="Aquí aparecerán las observaciones con la persona evaluadora, fecha, evidencia y estado de la brecha." compact /></div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-[#fbfcfb]">
            <SectionHeading step="04" icon={Clock3} title="Programa anual DNC" description="Solicitudes planificadas, ejecución de simulador y estado de reevaluación por operador." />
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 p-0">
            {dncRequests.length ? dncRequests.map((request) => {
              const assessment = data?.assessments.find((record) => record.id === request.dncAssessmentId);
              const person = data?.employees.find((entry) => entry.id === assessment?.employeeId);
              const latestAssessment = assessment
                ? latestAssessmentsByCompetency.get(`${assessment.employeeId}:${assessment.profileId}:${assessment.competencyId}`) ?? assessment
                : undefined;
              const responsible = data?.employees.find((entry) => entry.id === request.responsibleId);
              const linkedSessions = (data?.sessions ?? []).filter((session) => session.trainingRequestId === request.id);
              const eligibleSessions = assessment && request.simulatorScenarioId
                ? (data?.sessions ?? []).filter((session) => session.trainingRequestId === null &&
                  session.studentId === assessment.employeeId && session.scenarioId === request.simulatorScenarioId && !!session.endTime)
                : [];
              const latestSession = [...linkedSessions].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];
              const selectedScenario = scenarios.find((scenario) => scenario.id === request.simulatorScenarioId);
              const currentGap = latestAssessment && assessment ? Math.max(assessment.requiredLevel - latestAssessment.currentLevel, 0) : 0;
              return (
                <article key={request.id} className="space-y-3 p-5">
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-slate-900">{request.title}</h3>
                        <Badge variant="outline" className={request.status === "completed" ? "border-teal-200 bg-teal-50 text-teal-900" : "border-amber-200 bg-amber-50 text-amber-900"}>
                          {request.status === "completed" ? "Brecha cerrada" : "Brecha pendiente"}
                        </Badge>
                        <Badge variant="outline">{request.requestCode}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{person?.name ?? "Operador"} · {request.trainingMethod ?? "Método pendiente"}{selectedScenario ? ` · ${selectedScenario.title}` : ""}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {request.proposedStartDate ? formatDate(request.proposedStartDate) : "Sin fecha"} — {request.proposedEndDate ? formatDate(request.proposedEndDate) : "Sin fecha"} · {request.estimatedHours ?? 0} h planeadas · {linkedSessions.length} sesión(es) · {latestSession?.duration ? `${(latestSession.duration / 3600).toFixed(2)} h ejecutadas` : "Sin ejecución"}
                      </p>
                      {responsible && <p className="mt-1 text-xs text-slate-600">Responsable: {responsible.name}</p>}
                      {latestAssessment && <p className="mt-1 text-xs text-slate-600">Última reevaluación: nivel {latestAssessment.currentLevel}/5 de {latestAssessment.requiredLevel}/5 · brecha {currentGap}</p>}
                      {latestSession?.feedback && <p className="mt-2 rounded-md bg-slate-50 p-2 text-xs text-slate-700">Feedback de sesión: {latestSession.feedback}</p>}
                      {eligibleSessions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {eligibleSessions.map((session) => (
                            <Button key={session.id} size="sm" variant="ghost" className="h-7 px-2 text-xs" disabled={linkExistingSession.isPending} onClick={() => linkExistingSession.mutate({ sessionId: session.id, requestId: request.id })}>
                              Vincular sesión existente #{session.id}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                    {request.simulatorScenarioId && assessment && (
                      <div className="flex shrink-0 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLocation(`/simulator/run/${request.simulatorScenarioId}?requestId=${request.id}&studentId=${assessment.employeeId}`)}
                        >
                          {linkedSessions.length ? "Iniciar sesión" : "Ejecutar escenario"}
                        </Button>
                        {latestSession && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setLocation(`/simulator/run/${request.simulatorScenarioId}?requestId=${request.id}&studentId=${assessment.employeeId}&repeatOf=${latestSession.id}`)}
                          >
                            Repetir evento
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            }) : (
              <div className="p-6 text-sm text-slate-500">Aún no hay solicitudes DNC incorporadas al programa anual.</div>
            )}
          </CardContent>
        </Card>

        <section className="rounded-xl border border-slate-200 bg-[#f8faf9] px-4 py-3 text-xs leading-5 text-slate-600">
          <div className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-800" /><p><strong className="text-slate-800">Nota de control documental.</strong> Los requisitos del perfil definen el nivel esperado (1–5). La evaluación registra el nivel observado (0–5) en ese momento; un resultado inferior al requerido indica que se necesita capacitación. Cada evaluación nueva se guarda como un registro adicional.</p></div>
        </section>
      </div>

      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Incorporar brecha al programa anual</DialogTitle>
            <DialogDescription>Asigna a la persona responsable, el calendario, las horas y el método para atender esta brecha.</DialogDescription>
          </DialogHeader>
          {planAssessment && (
            <form onSubmit={(event) => {
              event.preventDefault();
              if (!isPlanValid) return;
              createTrainingRequest.mutate({
                record: planAssessment,
                responsibleId: Number(planForm.responsibleId),
                startDate: planForm.startDate,
                endDate: planForm.endDate,
                hours: Number(planForm.hours),
                method: planForm.method.trim(),
                scenarioId: planForm.scenarioId ? Number(planForm.scenarioId) : undefined,
              });
            }} className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                Nivel observado {planAssessment.currentLevel}/5 · estándar {planAssessment.requiredLevel}/5
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-responsible">Responsable</Label>
                <Select value={planForm.responsibleId} onValueChange={(value) => setPlanForm({ ...planForm, responsibleId: value })}>
                  <SelectTrigger id="plan-responsible"><SelectValue placeholder="Selecciona responsable" /></SelectTrigger>
                  <SelectContent>{activeTrainers.map((person) => <SelectItem key={person.id} value={String(person.id)}>{person.name} · {roleLabel(person.role)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="plan-start">Fecha inicial</Label><Input id="plan-start" type="date" required value={planForm.startDate} onChange={(event) => setPlanForm({ ...planForm, startDate: event.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="plan-end">Fecha final</Label><Input id="plan-end" type="date" required min={planForm.startDate} value={planForm.endDate} onChange={(event) => setPlanForm({ ...planForm, endDate: event.target.value })} /></div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="plan-hours">Horas planeadas</Label><Input id="plan-hours" type="number" min="0.25" step="0.25" required value={planForm.hours} onChange={(event) => setPlanForm({ ...planForm, hours: event.target.value })} /></div>
                <div className="space-y-2">
                  <Label htmlFor="plan-scenario">Escenario (opcional)</Label>
                  <Select value={planForm.scenarioId || "none"} onValueChange={(value) => setPlanForm({ ...planForm, scenarioId: value === "none" ? "" : value })}>
                    <SelectTrigger id="plan-scenario"><SelectValue placeholder="Sin escenario de simulador" /></SelectTrigger>
                    <SelectContent><SelectItem value="none">Sin escenario</SelectItem>{scenarios.map((scenario) => <SelectItem key={scenario.id} value={String(scenario.id)}>{scenario.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label htmlFor="plan-method">Método / escenario de capacitación</Label><Textarea id="plan-method" required maxLength={500} value={planForm.method} onChange={(event) => setPlanForm({ ...planForm, method: event.target.value })} placeholder="Práctica guiada, simulación, taller, evaluación en campo…" /></div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowPlanDialog(false)}>Cancelar</Button>
                <Button type="submit" disabled={!isPlanValid || createTrainingRequest.isPending} className="bg-teal-900 text-white hover:bg-teal-800">
                  {createTrainingRequest.isPending ? "Guardando plan…" : "Agregar al programa anual"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Crear perfil de puesto</DialogTitle><DialogDescription>Define el estándar para un puesto operativo.</DialogDescription></DialogHeader>
          <form onSubmit={(event) => {
            event.preventDefault();
            if (!companyId || !profileForm.title.trim()) return;
            createProfile.mutate({
              companyId, title: profileForm.title.trim(),
              department: profileForm.department.trim() || undefined,
              description: profileForm.description.trim() || undefined,
            });
          }} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="profile-title">Nombre del perfil <span className="text-rose-700">*</span></Label><Input id="profile-title" required value={profileForm.title} onChange={(event) => setProfileForm({ ...profileForm, title: event.target.value })} placeholder="p. ej., Operador de centro de control de transmisión" /></div>
            <div className="space-y-2"><Label htmlFor="profile-department">Departamento</Label><Input id="profile-department" value={profileForm.department} onChange={(event) => setProfileForm({ ...profileForm, department: event.target.value })} placeholder="Operaciones" /></div>
            <div className="space-y-2"><Label htmlFor="profile-description">Alcance del puesto</Label><Textarea id="profile-description" value={profileForm.description} onChange={(event) => setProfileForm({ ...profileForm, description: event.target.value })} placeholder="Responsabilidades y contexto operativo…" /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowProfileDialog(false)}>Cancelar</Button><Button type="submit" className="bg-teal-900 text-white hover:bg-teal-800" disabled={!profileForm.title.trim() || createProfile.isPending}>{createProfile.isPending ? "Creando…" : "Crear perfil"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showCompetencyDialog} onOpenChange={setShowCompetencyDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Crear competencia</DialogTitle><DialogDescription>Agrega una capacidad medible al catálogo de la empresa.</DialogDescription></DialogHeader>
          <form onSubmit={(event) => {
            event.preventDefault();
            if (!companyId || !competencyForm.name.trim()) return;
            createCompetency.mutate({
              companyId, name: competencyForm.name.trim(),
              category: competencyForm.category.trim() || undefined,
              description: competencyForm.description.trim() || undefined,
            });
          }} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="competency-name">Nombre de la competencia <span className="text-rose-700">*</span></Label><Input id="competency-name" required value={competencyForm.name} onChange={(event) => setCompetencyForm({ ...competencyForm, name: event.target.value })} placeholder="p. ej., Coordinación de maniobras" /></div>
            <div className="space-y-2"><Label htmlFor="competency-category">Categoría</Label><Input id="competency-category" value={competencyForm.category} onChange={(event) => setCompetencyForm({ ...competencyForm, category: event.target.value })} placeholder="Procedimiento operativo" /></div>
            <div className="space-y-2"><Label htmlFor="competency-description">Definición</Label><Textarea id="competency-description" value={competencyForm.description} onChange={(event) => setCompetencyForm({ ...competencyForm, description: event.target.value })} placeholder="Describe la capacidad y el estándar observable…" /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowCompetencyDialog(false)}>Cancelar</Button><Button type="submit" className="bg-teal-900 text-white hover:bg-teal-800" disabled={!competencyForm.name.trim() || createCompetency.isPending}>{createCompetency.isPending ? "Creando…" : "Crear competencia"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}

function SummaryTile({ icon: Icon, label, value, detail }: { icon: typeof BookOpenCheck; label: string; value: number; detail: string }) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-slate-900">{value}</p><p className="mt-1 text-[11px] text-slate-500">{detail}</p></div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-900"><Icon className="h-5 w-5" /></div>
      </CardContent>
    </Card>
  );
}

function SectionHeading({ step, icon: Icon, title, description }: { step: string; icon: typeof BookOpenCheck; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-900 text-teal-50"><Icon className="h-4 w-4" /></div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2"><span className="font-mono text-[10px] font-semibold tracking-widest text-teal-800">{step}</span><CardTitle className="text-base">{title}</CardTitle></div>
        <CardDescription className="mt-1 text-xs leading-5">{description}</CardDescription>
      </div>
    </div>
  );
}

function EmptyPanel({ icon: Icon, title, description, compact = false }: { icon: typeof BookOpenCheck; title: string; description: string; compact?: boolean }) {
  return (
    <div className={`flex flex-col items-center text-center ${compact ? "py-1" : "rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-5 py-9"}`}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-900"><Icon className="h-5 w-5" /></div>
      <p className="text-sm font-medium text-slate-800">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}
