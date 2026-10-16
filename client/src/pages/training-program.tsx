import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardShell from "@/components/layout/dashboard-shell";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { trainingProgramAPI } from "@/lib/api";
import type { TrainingProgramOverview } from "@/lib/api";
import type { TrainingActivity, TrainingDocument } from "@shared/schema";
import { toast } from "sonner";
import {
  AlertCircle, ArrowDownToLine, BookOpenCheck, CalendarDays, Check, CheckCircle2,
  Clock3, FileCheck2, FilePlus2, GraduationCap, History, RefreshCw, ShieldAlert,
  Target, UsersRound, X,
} from "lucide-react";

type ActivityForm = {
  studentId: string; requestId: string; dncAssessmentId: string; cycleId: string; simulatorSessionId: string; title: string;
  objective: string; trainingType: string; plannedStart: string; plannedEnd: string; plannedHours: string;
};
type CompletionForm = {
  attendanceStatus: "present" | "absent" | "excused";
  outcome: "pass" | "fail" | "not_applicable";
  completedHours: string; score: string; feedback: string;
};
type DocumentForm = {
  title: string; documentType: "attendance" | "certificate" | "evaluation" | "material" | "feedback" | "other";
  documentUrl: string; revision: string; documentDate: string; expiresAt: string; notes: string;
};

const blankActivity: ActivityForm = {
  studentId: "", requestId: "", dncAssessmentId: "", cycleId: "", simulatorSessionId: "", title: "", objective: "",
  trainingType: "course", plannedStart: "", plannedEnd: "", plannedHours: "2",
};
const blankDocument: DocumentForm = {
  title: "", documentType: "other", documentUrl: "", revision: "1", documentDate: "", expiresAt: "", notes: "",
};
const years = Array.from({ length: 7 }, (_, index) => new Date().getFullYear() - 3 + index);

function dateLabel(value?: string | Date | null, withTime = false) {
  if (!value) return "Sin fecha";
  const dateOnly = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(dateOnly ? `${value}T12:00:00.000Z` : value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    ...(dateOnly ? { timeZone: "UTC" } : {}),
  }).format(date);
}

function localDateTime(value?: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    planned: "Planeada", scheduled: "Agendada", in_progress: "En curso", completed: "Cerrada",
    cancelled: "Cancelada", pending: "Pendiente",
  };
  return labels[status] ?? status;
}

function typeLabel(type: string) {
  const labels: Record<string, string> = {
    course: "Curso", simulator: "Simulador", field: "Práctica en campo",
    workshop: "Taller", briefing: "Reunión técnica", other: "Otro",
  };
  return labels[type] ?? type;
}

function auditActionLabel(action: string) {
  const labels: Record<string, string> = {
    activity_created: "Actividad programada",
    activity_updated: "Actividad actualizada",
    activity_completed: "Actividad cerrada",
    dnc_reassessed: "Reevaluación DNC registrada",
    document_registered: "Documento registrado",
    document_deleted: "Documento eliminado",
    repetition_created: "Repetición generada",
    retraining_created: "Reentrenamiento generado",
  };
  return labels[action] ?? "Actualización registrada";
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function Metric({ label, value, detail, icon: Icon, tone = "teal" }: {
  label: string; value: string | number; detail: string; icon: typeof Target; tone?: "teal" | "amber" | "red" | "blue";
}) {
  const tones = {
    teal: "border-teal-200 bg-teal-50 text-teal-900",
    amber: "border-amber-200 bg-amber-50 text-amber-950",
    red: "border-rose-200 bg-rose-50 text-rose-950",
    blue: "border-sky-200 bg-sky-50 text-sky-950",
  };
  return <Card className="border-slate-200/90 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
    <CardContent className="flex items-start justify-between gap-3 p-4 md:p-5">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-slate-500">{label}</p>
        <p className="mt-2 font-mono text-[1.8rem] font-semibold leading-none tracking-tight text-slate-900 tabular-nums">{value}</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
      </div>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${tones[tone]}`}><Icon className="h-4 w-4" /></span>
    </CardContent>
  </Card>;
}

function SectionTitle({ number, title, detail, trailing }: { number: string; title: string; detail: string; trailing?: ReactNode }) {
  return <div className="flex flex-wrap items-start justify-between gap-3">
    <div className="flex gap-3">
      <span className="mt-0.5 font-mono text-xs font-semibold tracking-wider text-teal-800">{number}</span>
      <div><h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{detail}</p></div>
    </div>
    {trailing}
  </div>;
}

export default function TrainingProgramPage() {
  const { company, user } = useAuth();
  const queryClient = useQueryClient();
  const companyId = Number(company?.id);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const queryKey = ["training-program", companyId, Number(year)];
  const [showActivity, setShowActivity] = useState(false);
  const [activityForm, setActivityForm] = useState<ActivityForm>(blankActivity);
  const [editActivity, setEditActivity] = useState<TrainingActivity | null>(null);
  const [completeActivity, setCompleteActivity] = useState<TrainingActivity | null>(null);
  const [reassessmentActivity, setReassessmentActivity] = useState<TrainingActivity | null>(null);
  const [reassessmentForm, setReassessmentForm] = useState({ currentLevel: "0", evidence: "", observations: "" });
  const [completion, setCompletion] = useState<CompletionForm>({
    attendanceStatus: "present", outcome: "pass", completedHours: "2", score: "", feedback: "",
  });
  const [documentActivity, setDocumentActivity] = useState<TrainingActivity | null>(null);
  const [documentForm, setDocumentForm] = useState<DocumentForm>(blankDocument);
  const [pendingDelete, setPendingDelete] = useState<TrainingDocument | null>(null);
  const [formError, setFormError] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery<TrainingProgramOverview>({
    queryKey,
    queryFn: () => trainingProgramAPI.getByCompany(companyId, Number(year)),
    enabled: Number.isFinite(companyId) && companyId > 0,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["training-program", companyId] });
  const saveProgram = useMutation({
    mutationFn: (input: { studentId: number; year: number; targetHours?: number; targetSessions?: number }) => trainingProgramAPI.saveProgram(input),
    onSuccess: () => { refresh(); toast.success("Meta anual guardada"); },
    onError: (err) => toast.error(errorMessage(err, "No se pudo guardar la meta anual")),
  });
  const createActivity = useMutation({
    mutationFn: (input: Parameters<typeof trainingProgramAPI.createActivity>[0]) => trainingProgramAPI.createActivity(input),
    onSuccess: () => {
      refresh(); setShowActivity(false); setActivityForm(blankActivity); setFormError("");
      toast.success("Actividad agregada al programa");
    },
    onError: (err) => setFormError(errorMessage(err, "No se pudo crear la actividad")),
  });
  const updateActivity = useMutation({
    mutationFn: ({ id, input }: { id: number; input: Parameters<typeof trainingProgramAPI.updateActivity>[1] }) => trainingProgramAPI.updateActivity(id, input),
    onSuccess: () => { refresh(); setEditActivity(null); toast.success("Actividad actualizada"); },
    onError: (err) => toast.error(errorMessage(err, "No se pudo actualizar la actividad")),
  });
  const closeActivity = useMutation({
    mutationFn: ({ id, input }: { id: number; input: Parameters<typeof trainingProgramAPI.completeActivity>[1] }) => trainingProgramAPI.completeActivity(id, input),
    onSuccess: (result) => {
      refresh(); setCompleteActivity(null);
      if (result.retry) toast.success("Cierre registrado. Se creó una repetición para dar seguimiento al resultado.");
      else toast.success("Actividad cerrada y resultado registrado");
    },
    onError: (err) => toast.error(errorMessage(err, "No se pudo cerrar la actividad")),
  });
  const reassessActivity = useMutation({
    mutationFn: ({ id, input }: {
      id: number;
      input: Parameters<typeof trainingProgramAPI.reassessActivity>[1];
    }) => trainingProgramAPI.reassessActivity(id, input),
    onSuccess: (result) => {
      refresh();
      setReassessmentActivity(null);
      if (result.retry) toast.success("Reevaluación registrada. El nivel sigue por debajo del requerido y se creó una repetición.");
      else toast.success("Reevaluación de competencia registrada");
    },
    onError: (err) => toast.error(errorMessage(err, "No se pudo registrar la reevaluación")),
  });
  const addDocument = useMutation({
    mutationFn: ({ activityId, input }: { activityId: number; input: Parameters<typeof trainingProgramAPI.addDocument>[1] }) => trainingProgramAPI.addDocument(activityId, input),
    onSuccess: () => { refresh(); setDocumentActivity(null); setDocumentForm(blankDocument); toast.success("Documento registrado en el expediente"); },
    onError: (err) => setFormError(errorMessage(err, "No se pudo registrar el documento")),
  });
  const deleteDocument = useMutation({
    mutationFn: (id: number) => trainingProgramAPI.deleteDocument(id),
    onSuccess: () => { refresh(); setPendingDelete(null); toast.success("Documento eliminado"); },
    onError: (err) => { setPendingDelete(null); toast.error(errorMessage(err, "No se pudo eliminar el documento")); },
  });

  const programs = data?.programs ?? [];
  const activities = data?.activities ?? [];
  const documents = data?.documents ?? [];
  const employees = data?.employees ?? [];
  const requests = data?.approvedRequests ?? [];
  const assessments = data?.assessments ?? [];
  const cycles = data?.cycles ?? [];
  const simulatorSessions = data?.simulatorSessions ?? [];
  const auditEvents = data?.auditEvents ?? [];
  const auditActors = data?.auditActors ?? {};
  const reassessmentActivities = useMemo(
    () => activities.filter((activity) => activity.reassessmentRequired),
    [activities],
  );
  const latestAssessments = useMemo(() => {
    const latestByCompetency = new Map<string, (typeof assessments)[number]>();
    for (const assessment of assessments) {
      const key = `${assessment.employeeId}:${assessment.profileId}:${assessment.competencyId}`;
      const current = latestByCompetency.get(key);
      if (!current || new Date(assessment.assessedAt).getTime() > new Date(current.assessedAt).getTime()) {
        latestByCompetency.set(key, assessment);
      }
    }
    return Array.from(latestByCompetency.values());
  }, [assessments]);
  const openGaps = useMemo(() => latestAssessments.filter((assessment) =>
      assessment.currentLevel < assessment.requiredLevel &&
      !activities.some((activity) =>
        activity.dncAssessmentId === assessment.id &&
        (activity.status === "planned" || activity.status === "scheduled" || activity.status === "in_progress" || activity.reassessmentRequired)
      )
    ), [latestAssessments, activities]);

  const submitActivity = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    const studentId = Number(activityForm.studentId);
    const hours = Number(activityForm.plannedHours);
    if (!studentId || !activityForm.title.trim() || !Number.isFinite(hours) || hours <= 0) {
      setFormError("Completa el operador, el nombre y una duración válida.");
      return;
    }
    const request = requests.find((item) => String(item.id) === activityForm.requestId);
    const assessment = assessments.find((item) => String(item.id) === activityForm.dncAssessmentId);
    const cycle = cycles.find((item) => String(item.id) === activityForm.cycleId && item.studentId === studentId);
    const simulatorSession = simulatorSessions.find((item) => String(item.id) === activityForm.simulatorSessionId && item.studentId === studentId && item.endTime);
    createActivity.mutate({
      studentId, year: Number(year), title: activityForm.title.trim(),
      objective: activityForm.objective.trim() || undefined, trainingType: activityForm.trainingType,
      plannedHours: hours, plannedStart: activityForm.plannedStart ? new Date(activityForm.plannedStart).toISOString() : undefined,
      plannedEnd: activityForm.plannedEnd ? new Date(activityForm.plannedEnd).toISOString() : undefined,
      requestId: request?.id, dncAssessmentId: assessment?.id,
      cycleId: cycle?.id, simulatorSessionId: simulatorSession?.id,
      trainerId: Number(user?.id) || undefined,
    });
  };

  const submitCompletion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!completeActivity) return;
    const hours = Number(completion.completedHours);
    if (!Number.isFinite(hours) || hours < 0) { toast.error("Ingresa horas completadas válidas"); return; }
    const score = completion.score === "" ? undefined : Number(completion.score);
    if (score !== undefined && (!Number.isFinite(score) || score < 0 || score > 100)) { toast.error("La calificación debe estar entre 0 y 100"); return; }
    closeActivity.mutate({
      id: completeActivity.id,
      input: {
        attendanceStatus: completion.attendanceStatus, outcome: completion.outcome, completedHours: hours,
        score, feedback: completion.feedback.trim() || undefined,
      },
    });
  };

  const submitReassessment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reassessmentActivity) return;
    const currentLevel = Number(reassessmentForm.currentLevel);
    if (!Number.isInteger(currentLevel) || currentLevel < 0 || currentLevel > 5) {
      toast.error("El nivel observado debe ser un entero entre 0 y 5");
      return;
    }
    reassessActivity.mutate({
      id: reassessmentActivity.id,
      input: {
        currentLevel,
        evidence: reassessmentForm.evidence.trim() || undefined,
        observations: reassessmentForm.observations.trim() || undefined,
      },
    });
  };

  const submitDocument = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!documentActivity) return;
    let url: URL;
    try { url = new URL(documentForm.documentUrl); } catch { setFormError("Escribe una URL válida con HTTPS."); return; }
    if (url.protocol !== "https:") { setFormError("La dirección del documento debe usar HTTPS."); return; }
    if (!documentForm.title.trim() || !documentForm.revision.trim()) { setFormError("El título y la revisión son obligatorios."); return; }
    addDocument.mutate({
      activityId: documentActivity.id,
      input: {
        title: documentForm.title.trim(), documentType: documentForm.documentType,
        documentUrl: url.toString(), revision: documentForm.revision.trim(),
        documentDate: documentForm.documentDate || undefined, expiresAt: documentForm.expiresAt || undefined,
        notes: documentForm.notes.trim() || undefined,
      },
    });
  };

  const openEdit = (activity: TrainingActivity) => setEditActivity(activity);
  const metric = data?.metrics;

  if (isLoading) return <DashboardShell><div className="space-y-5" aria-label="Cargando programa anual">
    <div className="h-32 animate-pulse rounded-2xl bg-teal-100/70" />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200/70" />)}</div>
    <div className="h-72 animate-pulse rounded-xl bg-slate-200/70" />
  </div></DashboardShell>;

  if (!companyId || isError) return <DashboardShell>
    <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-950">
      <div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div className="flex-1">
        <h1 className="font-semibold">{!companyId ? "No se encontró la empresa de la sesión" : "No se pudo cargar el programa anual"}</h1>
        <p className="mt-1 text-sm">{!companyId ? "Inicia sesión con una cuenta de una organización para consultar la capacitación." : errorMessage(error, "Revisa la conexión e inténtalo de nuevo.")}</p>
      </div>
      {companyId > 0 && <Button variant="outline" onClick={() => refetch()} className="border-rose-300 bg-white text-rose-900"><RefreshCw className="mr-2 h-4 w-4" />Reintentar</Button>}
      </div>
    </div>
  </DashboardShell>;

  return <DashboardShell>
    <div className="space-y-7">
      <header className="relative overflow-hidden rounded-2xl border border-teal-950/10 bg-[#e9f1ee] px-5 py-6 md:px-8 md:py-7">
        <div className="absolute -right-10 -top-24 h-64 w-64 rounded-full border-[30px] border-teal-950/[0.045]" aria-hidden="true" />
        <div className="absolute right-28 -bottom-24 h-56 w-56 rounded-full border border-teal-950/10" aria-hidden="true" />
        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-900">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-950 text-teal-50"><BookOpenCheck className="h-3.5 w-3.5" /></span>
              Aseguramiento operativo / capacitación
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-[2.15rem]">Programa anual de capacitación</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">De la brecha de competencia a la evidencia de cierre: planea, ejecuta y da seguimiento a cada operador.</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5"><Label htmlFor="program-year" className="text-xs text-slate-600">Ciclo anual</Label>
              <Select value={year} onValueChange={setYear}><SelectTrigger id="program-year" className="w-36 border-white/80 bg-white/80"><SelectValue /></SelectTrigger><SelectContent>{years.map((item) => <SelectItem key={item} value={String(item)}>{item}</SelectItem>)}</SelectContent></Select>
            </div>
            <Button onClick={() => { setActivityForm(blankActivity); setFormError(""); setShowActivity(true); }} className="bg-teal-950 text-white shadow-sm hover:bg-teal-900">
              <FilePlus2 className="mr-2 h-4 w-4" />Planear actividad
            </Button>
          </div>
        </div>
      </header>

      <section aria-label="Indicadores del programa" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={CalendarDays} label="Trabajo planeado" value={metric?.plannedActivities ?? 0} detail={`${metric?.plannedHours ?? 0} h consideradas en el ciclo`} />
        <Metric icon={CheckCircle2} label="Trabajo completado" value={metric?.completedActivities ?? 0} detail={`${metric?.completedHours ?? 0} h documentadas`} tone="blue" />
        <Metric icon={UsersRound} label="Asistencia / aprobación" value={`${metric?.attendanceRate ?? 0}% / ${metric?.passRate ?? 0}%`} detail={`Tasa de cierre: ${metric?.completionRate ?? 0}%`} />
        <Metric icon={Clock3} label="Fuera de fecha" value={metric?.overdueActivities ?? 0} detail="Actividades planeadas vencidas" tone={metric?.overdueActivities ? "amber" : "teal"} />
        <Metric icon={RefreshCw} label="Reentrenamientos" value={metric?.retrainingActivities ?? 0} detail="Repeticiones creadas por resultado" tone="amber" />
        <Metric icon={Target} label="Reevaluaciones DNC" value={reassessmentActivities.length} detail="Actividades que requieren registrar el nuevo nivel" tone="blue" />
        <Metric icon={FileCheck2} label="Documentos por vencer" value={metric?.documentsExpiringSoon ?? 0} detail={`${metric?.expiredDocuments ?? 0} vencidos · siguientes 30 días`} tone={metric?.expiredDocuments ? "red" : metric?.documentsExpiringSoon ? "amber" : "teal"} />
        <Metric icon={GraduationCap} label="Operadores en programa" value={metric?.programCount ?? programs.length} detail={`${metric?.activityCount ?? activities.length} actividades registradas`} />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <SectionTitle number="01" title="Metas por operador" detail="Define el compromiso anual de horas y sesiones; el avance se actualiza con los cierres." />
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead><tr className="border-y border-slate-100 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              <th className="py-3 pr-4">Operador</th><th className="px-3 py-3">Avance horas</th><th className="px-3 py-3">Meta anual</th><th className="px-3 py-3">Sesiones</th><th className="px-3 py-3 text-right">Acción</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {employees.filter((person) => person.role === "student").map((person) => {
                const program = programs.find((item) => item.studentId === person.id);
                const progress = Number(program?.progressPercentage ?? 0);
                return <tr key={person.id} className="group">
                  <td className="py-3 pr-4"><p className="text-sm font-semibold text-slate-800">{person.name}</p><p className="mt-0.5 text-xs text-slate-500">{person.email}</p></td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3"><div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-800 transition-transform" style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} /></div><span className="font-mono text-xs tabular-nums text-slate-600">{program?.completedHours ?? 0} h</span></div>
                  </td>
                  <td className="px-3 py-3"><TargetFields key={`${person.id}-${year}-${program?.id ?? "new"}`} id={`operator-${person.id}`} hours={program?.targetHours ?? 40} sessions={program?.targetSessions ?? 12} disabled={saveProgram.isPending} onSave={(targetHours, targetSessions) => saveProgram.mutate({ studentId: person.id, year: Number(year), targetHours, targetSessions })} /></td>
                  <td className="px-3 py-3"><span className="font-mono text-xs tabular-nums text-slate-700">{program?.completedSessions ?? 0} / {program?.targetSessions ?? 12}</span><p className="mt-1 text-[11px] text-slate-500">sesiones</p></td>
                  <td className="px-3 py-3 text-right"><span className="font-mono text-xs font-semibold tabular-nums text-teal-900">{Math.round(progress)}%</span></td>
                </tr>;
              })}
            </tbody>
          </table>
          {!employees.some((person) => person.role === "student") && <EmptyNotice title="Sin operadores disponibles" description="No hay operadores asociados a esta empresa para configurar sus metas." />}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <SectionTitle number="02" title="Plan y ejecución" detail="Programa actividades, actualiza su estado y registra asistencia, resultado y retroalimentación." />
        <div className="mt-5 space-y-3">
          {activities.length ? activities.slice().sort((a, b) => new Date(a.plannedStart ?? a.createdAt).getTime() - new Date(b.plannedStart ?? b.createdAt).getTime()).map((activity) => {
            const operator = employees.find((person) => person.id === activity.studentId);
            const linkedDocs = documents.filter((doc) => doc.activityId === activity.id);
            const linkedCycle = cycles.find((cycle) => cycle.id === activity.cycleId);
            const linkedSession = simulatorSessions.find((session) => session.id === activity.simulatorSessionId);
            const overdue = activity.status !== "completed" && activity.status !== "cancelled" && activity.plannedEnd && new Date(activity.plannedEnd).getTime() < Date.now();
            return <article key={activity.id} className="rounded-xl border border-slate-200 bg-[#fcfdfc] p-4 transition-colors hover:border-teal-800/25">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{activity.title}</h3>
                    <Badge variant="outline" className={activity.status === "completed" ? "border-teal-200 bg-teal-50 text-teal-900" : overdue ? "border-amber-300 bg-amber-50 text-amber-900" : "border-slate-200 bg-white text-slate-600"}>{overdue ? "Vencida" : statusLabel(activity.status)}</Badge>
                    {activity.attemptNumber > 1 && <Badge className="border-amber-200 bg-amber-100 text-amber-900 hover:bg-amber-100">Repetición {activity.attemptNumber}</Badge>}
                    {activity.dncAssessmentId && <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-900">DNC #{activity.dncAssessmentId}</Badge>}
                  </div>
                  <p className="mt-1.5 text-sm text-slate-600">{operator?.name ?? "Operador no disponible"} <span className="px-1 text-slate-300">/</span> {typeLabel(activity.trainingType)}</p>
                  {activity.objective && <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">{activity.objective}</p>}
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{dateLabel(activity.plannedStart, true)}{activity.plannedEnd ? ` — ${dateLabel(activity.plannedEnd, true)}` : ""}</span>
                    <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{activity.status === "completed" ? activity.completedHours : activity.plannedHours} h</span>
                    {linkedCycle && <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Ciclo: {linkedCycle.title}</span>}
                    {linkedSession && <span className="inline-flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" />Simulador: {linkedSession.scenarioTitle} · {linkedSession.score == null ? "sin calificación" : `${linkedSession.score} puntos`}</span>}
                    {activity.outcome && <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5" />{activity.outcome === "pass" ? "Aprobada" : activity.outcome === "fail" ? "No aprobada" : "Sin evaluación"}{activity.score != null ? ` · ${activity.score}/100` : ""}</span>}
                    {linkedDocs.length > 0 && <span className="inline-flex items-center gap-1.5"><FileCheck2 className="h-3.5 w-3.5" />{linkedDocs.length} {linkedDocs.length === 1 ? "documento" : "documentos"}</span>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <Button variant="outline" size="sm" className="h-8 border-slate-200 bg-white text-slate-700" onClick={() => { setDocumentActivity(activity); setDocumentForm(blankDocument); setFormError(""); }}><FilePlus2 className="mr-1.5 h-3.5 w-3.5" />Evidencia</Button>
                  {activity.status !== "completed" && activity.status !== "cancelled" && <>
                    <Button variant="outline" size="sm" className="h-8 border-slate-200 bg-white text-slate-700" onClick={() => openEdit(activity)}><CalendarDays className="mr-1.5 h-3.5 w-3.5" />Editar</Button>
                    <Button size="sm" className="h-8 bg-teal-950 text-white hover:bg-teal-900" onClick={() => {
                      setCompletion({ attendanceStatus: "present", outcome: "pass", completedHours: String(activity.plannedHours), score: "", feedback: "" });
                      setCompleteActivity(activity);
                    }}><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Cerrar</Button>
                  </>}
                </div>
              </div>
              {linkedDocs.length > 0 && <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                {linkedDocs.map((doc) => <div key={doc.id} className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs">
                  <FileCheck2 className="h-3.5 w-3.5 text-teal-800" /><a href={doc.documentUrl} target="_blank" rel="noreferrer" className="max-w-[220px] truncate font-medium text-slate-700 underline-offset-2 hover:text-teal-900 hover:underline">{doc.title}</a>
                  <span className="font-mono text-[10px] text-slate-400">Rev. {doc.revision}</span>
                  <button type="button" className="rounded p-0.5 text-slate-400 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-700" onClick={() => setPendingDelete(doc)} aria-label={`Eliminar documento ${doc.title}`}><X className="h-3.5 w-3.5" /></button>
                </div>)}
              </div>}
            </article>;
          }) : <EmptyNotice title="Aún no hay actividades planeadas" description="Agrega una actividad independiente o vincúlala con una solicitud aprobada o una brecha DNC." />}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <SectionTitle number="03" title="Reevaluaciones pendientes" detail="Registra el nivel observado en las actividades marcadas para reevaluación." />
          <div className="mt-4 space-y-2">
            {reassessmentActivities.length ? reassessmentActivities.slice(0, 8).map((activity) => {
              const record = assessments.find((assessment) => assessment.id === activity.dncAssessmentId);
              const operator = employees.find((person) => person.id === activity.studentId);
              return <div key={activity.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200/80 bg-amber-50/50 px-3.5 py-3">
                <div className="flex min-w-0 items-start gap-3"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-900"><ShieldAlert className="h-4 w-4" /></span>
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{operator?.name ?? "Operador"} · {activity.title}</p>
                    {record ? <p className="mt-1 text-xs text-slate-600">Nivel actual {record.currentLevel}/5 · requerido {record.requiredLevel}/5 · DNC #{record.id}</p> : <p className="mt-1 text-xs text-slate-600">Actividad #{activity.id} · se requiere registrar el nuevo nivel</p>}
                    {record?.observations && <p className="mt-1 line-clamp-1 text-xs text-slate-500">{record.observations}</p>}
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-8 shrink-0 border-amber-300 bg-white text-amber-950 hover:bg-amber-100" onClick={() => {
                  setReassessmentForm({ currentLevel: String(record?.currentLevel ?? 0), evidence: "", observations: "" });
                  setReassessmentActivity(activity);
                }}>Registrar reevaluación</Button>
              </div>;
            }) : <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/70 px-4 py-6 text-center"><p className="text-sm font-medium text-slate-700">Sin reevaluaciones por registrar</p><p className="mt-1 text-xs text-slate-500">Cuando una actividad requiera reevaluación, aparecerá aquí para capturar el nuevo nivel.</p></div>}
            {openGaps.length > 0 && <div className="mt-5 border-t border-slate-100 pt-4">
              <div className="mb-3"><h3 className="text-sm font-semibold text-slate-800">Brechas abiertas sin actividad</h3><p className="mt-1 text-xs text-slate-500">Planea capacitación para atender estas necesidades antes de reevaluar.</p></div>
              <div className="space-y-2">
                {openGaps.slice(0, 6).map((record) => {
                  const operator = employees.find((person) => person.id === record.employeeId);
                  return <div key={record.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sky-200/80 bg-sky-50/50 px-3.5 py-3">
                    <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{operator?.name ?? "Operador"} · DNC #{record.id}</p><p className="mt-1 text-xs text-slate-600">Nivel actual {record.currentLevel}/5 · requerido {record.requiredLevel}/5</p></div>
                    <Button size="sm" variant="outline" className="h-8 shrink-0 border-sky-300 bg-white text-sky-950 hover:bg-sky-100" onClick={() => {
                      setActivityForm({ ...blankActivity, studentId: String(record.employeeId), dncAssessmentId: String(record.id), title: `Capacitación para brecha DNC ${record.id}`, objective: `Desarrollar la competencia hasta el nivel requerido ${record.requiredLevel}/5.` });
                      setFormError(""); setShowActivity(true);
                    }}>Planear capacitación</Button>
                  </div>;
                })}
                {openGaps.length > 6 && <p className="text-xs text-slate-500">Mostrando 6 de {openGaps.length} brechas abiertas.</p>}
              </div>
            </div>}
          </div>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <SectionTitle number="04" title="Control documental" detail="Evidencia ligada a cada actividad, con revisión y vigencia." />
          <div className="mt-4">
            {documents.length ? <div className="divide-y divide-slate-100">
              {documents.slice().sort((a, b) => new Date(a.expiresAt ?? a.createdAt).getTime() - new Date(b.expiresAt ?? b.createdAt).getTime()).slice(0, 6).map((doc) => {
                const related = activities.find((activity) => activity.id === doc.activityId);
                const today = new Date().toISOString().slice(0, 10);
                const next30Days = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
                const expired = doc.expiresAt && doc.expiresAt < today;
                const expiring = !expired && doc.expiresAt && doc.expiresAt <= next30Days;
                return <div key={doc.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-900"><FileCheck2 className="h-4 w-4" /></span>
                    <div className="min-w-0"><a href={doc.documentUrl} target="_blank" rel="noreferrer" className="block truncate text-sm font-semibold text-slate-800 hover:text-teal-900 hover:underline">{doc.title}</a><p className="mt-1 truncate text-xs text-slate-500">{related?.title ?? "Actividad"} · Rev. {doc.revision}</p><p className={`mt-1 text-[11px] ${expired ? "font-semibold text-rose-800" : expiring ? "font-medium text-amber-800" : "text-slate-500"}`}>{expired ? `Vencido el ${dateLabel(doc.expiresAt)}` : doc.expiresAt ? `Vence ${dateLabel(doc.expiresAt)}` : "Sin fecha de vencimiento"}</p></div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-slate-400 hover:text-rose-700" aria-label={`Eliminar documento ${doc.title}`} onClick={() => setPendingDelete(doc)}><X className="h-4 w-4" /></Button>
                </div>;
              })}
              {documents.length > 6 && <p className="border-t border-slate-100 pt-3 text-xs text-slate-500">Mostrando 6 de {documents.length} documentos. Consulta cada actividad para ver el expediente completo.</p>}
            </div> : <EmptyNotice title="Sin documentos registrados" description="Agrega listas de asistencia, certificados, evaluaciones o material desde una actividad." compact />}
          </div>
        </section>
      </div>

      <section aria-labelledby="activity-audit-heading" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex gap-3">
            <span className="mt-0.5 font-mono text-xs font-semibold tracking-wider text-teal-800">05</span>
            <div>
              <h2 id="activity-audit-heading" className="text-lg font-semibold tracking-tight text-slate-900">Historial reciente</h2>
              <p className="mt-1 text-sm text-slate-500">Registro de cambios y resultados del programa anual.</p>
            </div>
          </div>
          {auditEvents.length > 0 && <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[11px] tabular-nums text-slate-600">{auditEvents.length} {auditEvents.length === 1 ? "evento" : "eventos"}</span>}
        </div>
        {auditEvents.length ? <ol className="mt-4 divide-y divide-slate-100" aria-label="Eventos recientes del programa">
          {auditEvents.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8).map((event) => {
            const activity = activities.find((item) => item.id === event.activityId);
            const actor = auditActors[event.actorId];
            return <li key={event.id} className="grid gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[132px_minmax(0,1fr)] sm:gap-4">
              <time dateTime={new Date(event.createdAt).toISOString()} className="pt-0.5 text-xs tabular-nums text-slate-500">{dateLabel(event.createdAt, true)}</time>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-900"><History className="h-3 w-3" />{auditActionLabel(event.action)}</span>
                  <span className="text-xs text-slate-500">por {actor || "Usuario sin identificar"}</span>
                </div>
                <p className="mt-1.5 truncate text-sm font-semibold text-slate-800">{activity?.title ?? `Actividad #${event.activityId}`}</p>
                {event.details && <p className="mt-1 break-words text-xs leading-5 text-slate-600">{event.details}</p>}
              </div>
            </li>;
          })}
        </ol> : <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50/70 px-4 py-6 text-center" role="status">
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm"><History className="h-4 w-4" /></div>
          <p className="mt-3 text-sm font-semibold text-slate-700">Aún no hay actividad registrada</p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">Al programar, actualizar, cerrar o documentar actividades, los cambios recientes aparecerán aquí con su responsable.</p>
        </div>}
      </section>

      <Dialog open={showActivity} onOpenChange={(open) => { setShowActivity(open); if (!open) setFormError(""); }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>Planear actividad de capacitación</DialogTitle><DialogDescription>Vincula la actividad con una brecha o solicitud aprobada, o déjala como actividad independiente.</DialogDescription></DialogHeader>
          <form onSubmit={submitActivity} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Operador" htmlFor="activity-student"><Select value={activityForm.studentId} onValueChange={(value) => setActivityForm((current) => ({ ...current, studentId: value, requestId: "", dncAssessmentId: "", cycleId: "", simulatorSessionId: "" }))}><SelectTrigger id="activity-student"><SelectValue placeholder="Selecciona operador" /></SelectTrigger><SelectContent>{employees.filter((person) => person.role === "student").map((person) => <SelectItem key={person.id} value={String(person.id)}>{person.name}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Tipo de capacitación" htmlFor="activity-type"><Select value={activityForm.trainingType} onValueChange={(value) => setActivityForm({ ...activityForm, trainingType: value })}><SelectTrigger id="activity-type"><SelectValue /></SelectTrigger><SelectContent>{[["course", "Curso"], ["simulator", "Simulador"], ["field", "Práctica en campo"], ["workshop", "Taller"], ["briefing", "Reunión técnica"], ["other", "Otro"]].map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Solicitud aprobada (opcional)" htmlFor="activity-request"><Select value={activityForm.requestId || "none"} onValueChange={(value) => {
                const request = requests.find((item) => String(item.id) === value);
                setActivityForm((current) => ({ ...current, requestId: value === "none" ? "" : value, title: request && !current.title ? request.title : current.title, objective: request && !current.objective ? request.objective ?? "" : current.objective, plannedHours: request?.estimatedHours ? String(request.estimatedHours) : current.plannedHours }));
              }}><SelectTrigger id="activity-request"><SelectValue placeholder="Sin solicitud asociada" /></SelectTrigger><SelectContent><SelectItem value="none">Sin solicitud asociada</SelectItem>{requests.map((request) => <SelectItem key={request.id} value={String(request.id)}>{request.requestCode} · {request.title}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Registro DNC (opcional)" htmlFor="activity-dnc"><Select value={activityForm.dncAssessmentId || "none"} onValueChange={(value) => setActivityForm({ ...activityForm, dncAssessmentId: value === "none" ? "" : value })} disabled={!activityForm.studentId}><SelectTrigger id="activity-dnc"><SelectValue placeholder={activityForm.studentId ? "Sin brecha asociada" : "Selecciona primero un operador"} /></SelectTrigger><SelectContent><SelectItem value="none">Sin brecha asociada</SelectItem>{latestAssessments.filter((record) => String(record.employeeId) === activityForm.studentId).map((record) => <SelectItem key={record.id} value={String(record.id)}>DNC #{record.id} · {record.currentLevel}/{record.requiredLevel}</SelectItem>)}</SelectContent></Select></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ciclo existente (opcional)" htmlFor="activity-cycle">
                <Select value={activityForm.cycleId || "none"} onValueChange={(value) => setActivityForm({ ...activityForm, cycleId: value === "none" ? "" : value })} disabled={!activityForm.studentId}>
                  <SelectTrigger id="activity-cycle"><SelectValue placeholder={activityForm.studentId ? "Sin ciclo asociado" : "Selecciona primero un operador"} /></SelectTrigger>
                  <SelectContent><SelectItem value="none">Sin ciclo asociado</SelectItem>{cycles.filter((cycle) => String(cycle.studentId) === activityForm.studentId).map((cycle) => <SelectItem key={cycle.id} value={String(cycle.id)}>{cycle.title} · {dateLabel(cycle.startDate)}</SelectItem>)}</SelectContent>
                </Select>
                <p className="text-[11px] text-slate-500">{activityForm.studentId ? "Solo se muestran ciclos del operador seleccionado." : "Elige un operador para consultar sus ciclos."}</p>
              </Field>
              <Field label="Sesión de simulador completada (opcional)" htmlFor="activity-simulator-session">
                <Select value={activityForm.simulatorSessionId || "none"} onValueChange={(value) => setActivityForm({ ...activityForm, simulatorSessionId: value === "none" ? "" : value })} disabled={!activityForm.studentId}>
                  <SelectTrigger id="activity-simulator-session"><SelectValue placeholder={activityForm.studentId ? "Sin sesión asociada" : "Selecciona primero un operador"} /></SelectTrigger>
                  <SelectContent><SelectItem value="none">Sin sesión asociada</SelectItem>{simulatorSessions.filter((session) => String(session.studentId) === activityForm.studentId && session.endTime).map((session) => <SelectItem key={session.id} value={String(session.id)}>{session.scenarioTitle} · {dateLabel(session.startTime)} · {session.score == null ? "sin calificación" : `${session.score} pts`}</SelectItem>)}</SelectContent>
                </Select>
                <p className="text-[11px] text-slate-500">{activityForm.studentId ? "Solo se muestran sesiones completadas del operador seleccionado." : "Elige un operador para consultar sus sesiones."}</p>
              </Field>
            </div>
            <Field label="Nombre de la actividad" htmlFor="activity-title"><Input id="activity-title" value={activityForm.title} onChange={(event) => setActivityForm({ ...activityForm, title: event.target.value })} required maxLength={180} /></Field>
            <Field label="Objetivo" htmlFor="activity-objective"><Textarea id="activity-objective" value={activityForm.objective} onChange={(event) => setActivityForm({ ...activityForm, objective: event.target.value })} rows={2} /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Inicio programado" htmlFor="activity-start"><Input id="activity-start" type="datetime-local" value={activityForm.plannedStart} onChange={(event) => setActivityForm({ ...activityForm, plannedStart: event.target.value })} /></Field>
              <Field label="Fin programado" htmlFor="activity-end"><Input id="activity-end" type="datetime-local" value={activityForm.plannedEnd} onChange={(event) => setActivityForm({ ...activityForm, plannedEnd: event.target.value })} /></Field>
              <Field label="Horas planeadas" htmlFor="activity-hours"><Input id="activity-hours" type="number" min="0.25" step="0.25" value={activityForm.plannedHours} onChange={(event) => setActivityForm({ ...activityForm, plannedHours: event.target.value })} required /></Field>
            </div>
            {formError && <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{formError}</p>}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowActivity(false)}>Cancelar</Button><Button type="submit" className="bg-teal-950 text-white hover:bg-teal-900" disabled={createActivity.isPending}>{createActivity.isPending ? "Guardando…" : "Agregar al programa"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editActivity} onOpenChange={(open) => { if (!open) setEditActivity(null); }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>Actualizar programación</DialogTitle><DialogDescription>Ajusta fechas, carga horaria y estado de la actividad.</DialogDescription></DialogHeader>
          {editActivity && <form className="space-y-4" onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const hours = Number(form.get("plannedHours"));
            updateActivity.mutate({ id: editActivity.id, input: {
              title: String(form.get("title") || "").trim(),
              trainingType: String(form.get("trainingType")),
              status: String(form.get("status")),
              plannedStart: form.get("plannedStart") ? new Date(String(form.get("plannedStart"))) : null,
              plannedEnd: form.get("plannedEnd") ? new Date(String(form.get("plannedEnd"))) : null,
              plannedHours: hours,
            } });
          }}>
            <Field label="Nombre" htmlFor="edit-title"><Input id="edit-title" name="title" defaultValue={editActivity.title} required /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tipo" htmlFor="edit-type"><select id="edit-type" name="trainingType" defaultValue={editActivity.trainingType} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{[["course", "Curso"], ["simulator", "Simulador"], ["field", "Práctica en campo"], ["workshop", "Taller"], ["briefing", "Reunión técnica"], ["other", "Otro"]].map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></Field>
              <Field label="Estado" htmlFor="edit-status"><select id="edit-status" name="status" defaultValue={editActivity.status} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="planned">Programada</option><option value="in_progress">En curso</option><option value="cancelled">Cancelada</option></select></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Inicio" htmlFor="edit-start"><Input id="edit-start" name="plannedStart" type="datetime-local" defaultValue={localDateTime(editActivity.plannedStart)} /></Field>
              <Field label="Fin" htmlFor="edit-end"><Input id="edit-end" name="plannedEnd" type="datetime-local" defaultValue={localDateTime(editActivity.plannedEnd)} /></Field>
              <Field label="Horas" htmlFor="edit-hours"><Input id="edit-hours" name="plannedHours" type="number" min="0.25" step="0.25" defaultValue={editActivity.plannedHours} required /></Field>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditActivity(null)}>Cancelar</Button><Button type="submit" className="bg-teal-950 text-white hover:bg-teal-900" disabled={updateActivity.isPending}>{updateActivity.isPending ? "Actualizando…" : "Guardar cambios"}</Button></DialogFooter>
          </form>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!completeActivity} onOpenChange={(open) => { if (!open) setCompleteActivity(null); }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>Cerrar actividad</DialogTitle><DialogDescription>Registra la asistencia y el resultado observado. Un resultado no aprobado puede crear una repetición.</DialogDescription></DialogHeader>
          {completeActivity && <form onSubmit={submitCompletion} className="space-y-4">
            <div className="rounded-lg border border-teal-900/10 bg-[#f2f7f4] p-3"><p className="text-sm font-semibold text-slate-800">{completeActivity.title}</p><p className="mt-1 text-xs text-slate-500">{employees.find((person) => person.id === completeActivity.studentId)?.name ?? "Operador"}</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Asistencia" htmlFor="completion-attendance"><Select value={completion.attendanceStatus} onValueChange={(value: CompletionForm["attendanceStatus"]) => setCompletion({ ...completion, attendanceStatus: value })}><SelectTrigger id="completion-attendance"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="present">Presente</SelectItem><SelectItem value="absent">Ausente</SelectItem><SelectItem value="excused">Justificada</SelectItem></SelectContent></Select></Field>
              <Field label="Resultado" htmlFor="completion-outcome"><Select value={completion.outcome} onValueChange={(value: CompletionForm["outcome"]) => setCompletion({ ...completion, outcome: value })}><SelectTrigger id="completion-outcome"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pass">Aprobado</SelectItem><SelectItem value="fail">No aprobado</SelectItem><SelectItem value="not_applicable">No aplica</SelectItem></SelectContent></Select></Field>
              <Field label="Horas completadas" htmlFor="completion-hours"><Input id="completion-hours" type="number" min="0" step="0.25" value={completion.completedHours} onChange={(event) => setCompletion({ ...completion, completedHours: event.target.value })} required /></Field>
              <Field label="Calificación (0–100, opcional)" htmlFor="completion-score"><Input id="completion-score" type="number" min="0" max="100" step="0.1" value={completion.score} onChange={(event) => setCompletion({ ...completion, score: event.target.value })} /></Field>
            </div>
            <Field label="Retroalimentación" htmlFor="completion-feedback"><Textarea id="completion-feedback" value={completion.feedback} onChange={(event) => setCompletion({ ...completion, feedback: event.target.value })} rows={3} /></Field>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setCompleteActivity(null)}>Cancelar</Button><Button type="submit" className="bg-teal-950 text-white hover:bg-teal-900" disabled={closeActivity.isPending}>{closeActivity.isPending ? "Registrando…" : "Guardar cierre"}</Button></DialogFooter>
          </form>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!reassessmentActivity} onOpenChange={(open) => { if (!open) setReassessmentActivity(null); }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>Registrar reevaluación DNC</DialogTitle><DialogDescription>Captura el nivel observado después de la capacitación. Si permanece debajo del requerido, el sistema generará una repetición.</DialogDescription></DialogHeader>
          {reassessmentActivity && <form onSubmit={submitReassessment} className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3">
              <p className="text-sm font-semibold text-slate-800">{reassessmentActivity.title}</p>
              <p className="mt-1 text-xs text-slate-600">{employees.find((person) => person.id === reassessmentActivity.studentId)?.name ?? "Operador"}
                {(() => {
                  const record = assessments.find((assessment) => assessment.id === reassessmentActivity.dncAssessmentId);
                  return record ? ` · DNC #${record.id} · requerido ${record.requiredLevel}/5` : "";
                })()}
              </p>
            </div>
            <Field label="Nuevo nivel observado (0–5)" htmlFor="reassessment-level">
              <Select value={reassessmentForm.currentLevel} onValueChange={(value) => setReassessmentForm({ ...reassessmentForm, currentLevel: value })}>
                <SelectTrigger id="reassessment-level"><SelectValue /></SelectTrigger>
                <SelectContent>{[0, 1, 2, 3, 4, 5].map((level) => <SelectItem key={level} value={String(level)}>{level === 0 ? "0 · Sin evidencia de dominio" : `${level} · Nivel ${level}`}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Evidencia" htmlFor="reassessment-evidence"><Textarea id="reassessment-evidence" value={reassessmentForm.evidence} onChange={(event) => setReassessmentForm({ ...reassessmentForm, evidence: event.target.value })} rows={2} /></Field>
            <Field label="Observaciones" htmlFor="reassessment-observations"><Textarea id="reassessment-observations" value={reassessmentForm.observations} onChange={(event) => setReassessmentForm({ ...reassessmentForm, observations: event.target.value })} rows={3} /></Field>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setReassessmentActivity(null)}>Cancelar</Button><Button type="submit" className="bg-teal-950 text-white hover:bg-teal-900" disabled={reassessActivity.isPending}>{reassessActivity.isPending ? "Registrando…" : "Guardar reevaluación"}</Button></DialogFooter>
          </form>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!documentActivity} onOpenChange={(open) => { if (!open) { setDocumentActivity(null); setFormError(""); } }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>Registrar evidencia documental</DialogTitle><DialogDescription>La evidencia queda ligada a “{documentActivity?.title}”. Usa un enlace HTTPS accesible para el equipo.</DialogDescription></DialogHeader>
          <form onSubmit={submitDocument} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Título del documento" htmlFor="document-title"><Input id="document-title" value={documentForm.title} onChange={(event) => setDocumentForm({ ...documentForm, title: event.target.value })} required /></Field>
              <Field label="Tipo documental" htmlFor="document-type"><Select value={documentForm.documentType} onValueChange={(value: DocumentForm["documentType"]) => setDocumentForm({ ...documentForm, documentType: value })}><SelectTrigger id="document-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="attendance">Asistencia</SelectItem><SelectItem value="certificate">Certificado</SelectItem><SelectItem value="evaluation">Evaluación</SelectItem><SelectItem value="material">Material</SelectItem><SelectItem value="feedback">Retroalimentación</SelectItem><SelectItem value="other">Otro</SelectItem></SelectContent></Select></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
              <Field label="URL segura (HTTPS)" htmlFor="document-url"><Input id="document-url" type="url" placeholder="https://…" value={documentForm.documentUrl} onChange={(event) => setDocumentForm({ ...documentForm, documentUrl: event.target.value })} required /></Field>
              <Field label="Revisión" htmlFor="document-revision"><Input id="document-revision" value={documentForm.revision} onChange={(event) => setDocumentForm({ ...documentForm, revision: event.target.value })} required /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Fecha del documento" htmlFor="document-date"><Input id="document-date" type="date" value={documentForm.documentDate} onChange={(event) => setDocumentForm({ ...documentForm, documentDate: event.target.value })} /></Field>
              <Field label="Fecha de vencimiento" htmlFor="document-expires"><Input id="document-expires" type="date" value={documentForm.expiresAt} onChange={(event) => setDocumentForm({ ...documentForm, expiresAt: event.target.value })} /></Field>
            </div>
            <Field label="Notas" htmlFor="document-notes"><Textarea id="document-notes" value={documentForm.notes} onChange={(event) => setDocumentForm({ ...documentForm, notes: event.target.value })} rows={2} /></Field>
            {formError && <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{formError}</p>}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setDocumentActivity(null)}>Cancelar</Button><Button type="submit" className="bg-teal-950 text-white hover:bg-teal-900" disabled={addDocument.isPending}>{addDocument.isPending ? "Registrando…" : "Registrar documento"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle><AlertDialogDescription>Se quitará “{pendingDelete?.title}” del expediente de capacitación. Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Conservar</AlertDialogCancel><AlertDialogAction className="bg-rose-700 text-white hover:bg-rose-800" onClick={() => pendingDelete && deleteDocument.mutate(pendingDelete.id)} disabled={deleteDocument.isPending}>{deleteDocument.isPending ? "Eliminando…" : "Eliminar documento"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </DashboardShell>;
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return <div className="space-y-2"><Label htmlFor={htmlFor}>{label}</Label>{children}</div>;
}

function TargetFields({ id, hours, sessions, disabled, onSave }: {
  id: string; hours: number; sessions: number; disabled: boolean; onSave: (hours: number, sessions: number) => void;
}) {
  const [targetHours, setTargetHours] = useState(String(hours));
  const [targetSessions, setTargetSessions] = useState(String(sessions));
  const changed = Number(targetHours) !== hours || Number(targetSessions) !== sessions;
  return <div className="flex items-center gap-2">
    <label className="sr-only" htmlFor={`target-hours-${id}`}>Meta anual en horas</label>
    <Input id={`target-hours-${id}`} type="number" min="0" step="0.5" className="h-8 w-[76px] px-2 font-mono text-xs" value={targetHours} onChange={(event) => setTargetHours(event.target.value)} />
    <span className="text-[11px] text-slate-500">h</span>
    <label className="sr-only" htmlFor={`target-sessions-${id}`}>Meta anual en sesiones</label>
    <Input id={`target-sessions-${id}`} type="number" min="0" step="1" className="h-8 w-[68px] px-2 font-mono text-xs" value={targetSessions} onChange={(event) => setTargetSessions(event.target.value)} />
    <Button type="button" size="sm" variant={changed ? "default" : "ghost"} className={changed ? "h-8 bg-teal-950 px-2.5 text-white hover:bg-teal-900" : "h-8 px-2.5 text-slate-400"} disabled={disabled || !changed || Number(targetHours) < 0 || Number(targetSessions) < 0} onClick={() => onSave(Number(targetHours), Number(targetSessions))}>{changed ? "Guardar" : "Actual"}</Button>
  </div>;
}

function EmptyNotice({ title, description, compact = false }: { title: string; description: string; compact?: boolean }) {
  return <div className={`rounded-lg border border-dashed border-slate-300 bg-slate-50/70 text-center ${compact ? "px-4 py-5" : "px-5 py-8"}`}>
    <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm"><ArrowDownToLine className="h-4 w-4" /></div>
    <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p><p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">{description}</p>
  </div>;
}
