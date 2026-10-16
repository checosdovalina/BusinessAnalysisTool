import { useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  Network,
  RefreshCw,
  ShieldCheck,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DashboardShell from "@/components/layout/dashboard-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { cyclesAPI, usersAPI } from "@/lib/api";
import type { Cycle, User } from "@shared/schema";
import "./dashboard.css";

type ActivityDay = { key: string; name: string; total: number };

type MetricCardProps = {
  label: string;
  value: string | number;
  foot: string;
  icon: LucideIcon;
  tone: "teal" | "amber" | "green" | "slate";
};

function MetricCard({ label, value, foot, icon: Icon, tone }: MetricCardProps) {
  return (
    <article className="od-metric">
      <div className="od-metric-top">
        <span className={`od-metric-icon ${tone}`}><Icon size={18} strokeWidth={1.8} /></span>
      </div>
      <div className="od-metric-value">{value}</div>
      <div className="od-metric-label">{label}</div>
      <div className="od-metric-foot">{foot}</div>
    </article>
  );
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value: Date | string | null | undefined) {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseCycleStartDate(value: Date | string | null | undefined) {
  if (typeof value === "string") {
    const match = /^(\d{4})-(\d{2})-(\d{2})(?:T|$)/.exec(value);
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return parseLocalDate(value);
}

function formatDate(value: Date | string | null | undefined) {
  const date = parseLocalDate(value);
  if (!date) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(date);
}

function getCycleStatus(status: Cycle["status"]) {
  switch (status) {
    case "completed":
      return { label: "Completado", tone: "done" };
    case "in_progress":
      return { label: "En curso", tone: "active" };
    default:
      return { label: "Pendiente", tone: "pending" };
  }
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function Dashboard() {
  const { user } = useAuth();

  const {
    data: cycles = [],
    isLoading: cyclesLoading,
    isError: cyclesError,
    refetch: retryCycles,
  } = useQuery({
    queryKey: ["cycles", user?.companyId],
    queryFn: () => user?.companyId ? cyclesAPI.getByCompany(user.companyId) : Promise.resolve([]),
    enabled: !!user?.companyId,
  });

  const {
    data: users = [],
    isLoading: usersLoading,
    isError: usersError,
    refetch: retryUsers,
  } = useQuery({
    queryKey: ["users", user?.companyId],
    queryFn: () => user?.companyId ? usersAPI.getByCompany(user.companyId) : Promise.resolve([]),
    enabled: !!user?.companyId,
  });

  const isLoading = cyclesLoading || usersLoading;

  const statusCounts = useMemo(() => ({
    total: cycles.length,
    completed: cycles.filter((cycle: Cycle) => cycle.status === "completed").length,
    inProgress: cycles.filter((cycle: Cycle) => cycle.status === "in_progress").length,
    pending: cycles.filter((cycle: Cycle) => cycle.status === "pending").length,
  }), [cycles]);

  const approvalRate = useMemo(() => {
    const completed = cycles.filter((cycle: Cycle) => cycle.status === "completed");
    if (completed.length === 0) return 0;
    const passed = completed.filter(
      (cycle: Cycle) => cycle.score !== null && cycle.score >= (cycle.minPassingScore || 80),
    );
    return Math.round((passed.length / completed.length) * 100);
  }, [cycles]);

  const activityData = useMemo<ActivityDay[]>(() => {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6 + index);
      return {
        key: localDateKey(date),
        name: new Intl.DateTimeFormat("es-MX", { weekday: "short" })
          .format(date)
          .replace(".", ""),
        total: 0,
      };
    });
    const dayIndex = new Map(days.map((day, index) => [day.key, index]));

    cycles.forEach((cycle: Cycle) => {
      const startDate = parseCycleStartDate(cycle.startDate);
      if (!startDate) return;
      const index = dayIndex.get(localDateKey(startDate));
      if (index !== undefined) days[index].total += 1;
    });

    return days;
  }, [cycles]);

  const recentCycles = useMemo(
    () => [...cycles]
      .sort((a: Cycle, b: Cycle) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4),
    [cycles],
  );

  const todayLabel = useMemo(
    () => new Intl.DateTimeFormat("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date()),
    [],
  );

  const getUserName = (userId: number | null) => {
    if (!userId) return "Sin operador asignado";
    const foundUser = users.find((entry: User) => entry.id === userId);
    return foundUser?.name ?? `Operador #${userId}`;
  };

  const maxActivity = Math.max(0, ...activityData.map((day) => day.total));

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="ots-dashboard od-loading" aria-label="Cargando centro de control">
          <div className="od-loading-heading">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-3 h-8 w-56" />
            <Skeleton className="mt-2 h-4 w-80 max-w-full" />
          </div>
          <Skeleton className="h-32 rounded-xl" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, index) => <Skeleton key={index} className="h-32 rounded-xl" />)}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (cyclesError || usersError) {
    return (
      <DashboardShell>
        <div className="ots-dashboard">
          <section className="od-error-state" role="alert">
            <div className="od-empty-icon"><FileText size={22} /></div>
            <h1>No pudimos cargar el resumen</h1>
            <p>Verifica tu conexión e inténtalo de nuevo. Tus registros no se han modificado.</p>
            <button
              type="button"
              className="od-primary-button"
              onClick={() => { void retryCycles(); void retryUsers(); }}
            >
              <RefreshCw size={16} /> Reintentar
            </button>
          </section>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="ots-dashboard">
        <section className="od-welcome-row">
          <div>
            <div className="od-eyebrow"><span /> VISTA GENERAL <span className="od-eyebrow-line" /></div>
            <h1>Centro de control</h1>
            <p>Estado de la preparación operativa y los ciclos de competencia.</p>
          </div>
          <div className="od-date-chip">
            <CalendarDays size={15} />
            <span>{todayLabel}</span>
          </div>
        </section>

        <section className="od-network-banner" aria-label="Resumen de continuidad operativa">
          <div className="od-banner-grid" />
          <div className="od-banner-icon"><Network size={21} /></div>
          <div className="od-banner-copy">
            <span>CONTINUIDAD OPERATIVA</span>
            <h2>La preparación mantiene la red en marcha.</h2>
            <p>Capacitación, evaluación y evidencia en una sola línea de trabajo.</p>
          </div>
          <div className="od-banner-status">
            <span className={`od-status-beacon ${statusCounts.inProgress === 0 ? "is-idle" : ""}`} />
            <div>
              <b>{statusCounts.inProgress > 0 ? "Seguimiento activo" : "Sin ciclos en curso"}</b>
              <small>{statusCounts.inProgress} {statusCounts.inProgress === 1 ? "ciclo en progreso" : "ciclos en progreso"}</small>
            </div>
          </div>
          <div className="od-banner-ornament" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((bar) => <span key={bar} />)}
          </div>
        </section>

        <section className="od-metric-grid" aria-label="Indicadores de entrenamiento">
          <MetricCard label="Ciclos de evaluación" value={statusCounts.total} foot="En todos los formatos" icon={ClipboardList} tone="teal" />
          <MetricCard label="En progreso" value={statusCounts.inProgress} foot="Ciclos en seguimiento" icon={Activity} tone="amber" />
          <MetricCard label="Ciclos completados" value={statusCounts.completed} foot="Ciclos finalizados" icon={CheckCircle2} tone="green" />
          <MetricCard
            label="Aprobación"
            value={`${approvalRate}%`}
            foot={statusCounts.completed > 0 ? "De los ciclos completados" : "Sin ciclos completados"}
            icon={Target}
            tone="slate"
          />
        </section>

        <section className="od-dashboard-grid">
          <article className="od-panel od-activity-panel">
            <div className="od-panel-heading">
              <div>
                <span className="od-section-kicker">RITMO DE ACTIVIDAD</span>
                <h2>Ciclos iniciados</h2>
                <p>Registros de los últimos 7 días</p>
              </div>
              <span className="od-period-chip">Últimos 7 días</span>
            </div>
            <div className="od-chart-summary">
              <b>Actividad semanal</b>
              <span><i /> Ciclos registrados</span>
            </div>
            {activityData.every((day) => day.total === 0) ? (
              <div className="od-chart-empty">
                <div className="od-empty-icon"><BarChart3 size={21} /></div>
                <p>Sin actividad registrada en los últimos 7 días</p>
              </div>
            ) : (
              <div className="od-chart-wrap">
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={activityData} margin={{ top: 18, right: 4, left: -24, bottom: 0 }} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--od-line)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "var(--od-muted)", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      domain={[0, (dataMax: number) => Math.max(dataMax, 1)]}
                      tick={{ fill: "var(--od-muted)", fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                      width={28}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(22,122,114,.06)" }}
                      contentStyle={{
                        backgroundColor: "var(--od-card)",
                        borderColor: "var(--od-line)",
                        borderRadius: 8,
                        fontSize: 11,
                      }}
                      formatter={(value) => [value, "Ciclos"]}
                    />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="total" position="top" fill="var(--od-muted)" fontSize={9} />
                      {activityData.map((day) => (
                        <Cell
                          key={day.key}
                          fill={day.total === maxActivity && maxActivity > 0 ? "var(--od-amber)" : "var(--od-teal)"}
                          opacity={day.total > 0 ? 0.82 : 0.2}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="od-chart-foot">
              <span><ArrowUpRight size={14} /> Basado en fechas reales de inicio</span>
              <span>Actualizado al consultar</span>
            </div>
          </article>

          <article className="od-panel od-recent-panel">
            <div className="od-panel-heading">
              <div>
                <span className="od-section-kicker">SEGUIMIENTO</span>
                <h2>Evaluaciones recientes</h2>
                <p>Últimos ciclos registrados</p>
              </div>
              <Link className="od-text-action" href="/evaluations">
                Ver todas <ArrowUpRight size={14} />
              </Link>
            </div>
            <div className="od-recent-list">
              {recentCycles.map((cycle: Cycle) => {
                const operatorName = getUserName(cycle.studentId);
                const status = getCycleStatus(cycle.status);
                const typeLabel = cycle.type === "simulator"
                  ? "Simulador"
                  : cycle.type === "field"
                    ? "Evaluación de campo"
                    : "Entrenamiento";
                return (
                  <div className="od-recent-item" key={cycle.id} data-testid={`cycle-item-${cycle.id}`}>
                    <span className={`od-operator-avatar ${status.tone}`}>{getInitials(operatorName) || "—"}</span>
                    <div className="od-recent-detail">
                      <b>{cycle.title}</b>
                      <span>{operatorName} <i>·</i> {typeLabel} <i>·</i> {formatDate(cycle.createdAt)}</span>
                    </div>
                    <span className={`od-cycle-status ${status.tone}`}><i />{status.label}</span>
                  </div>
                );
              })}
              {recentCycles.length === 0 && (
                <div className="od-recent-empty">
                  <div className="od-empty-icon"><Users size={20} /></div>
                  <p>No hay ciclos de evaluación registrados</p>
                </div>
              )}
            </div>
            <div className="od-recent-bottom">
              <span><CalendarDays size={14} /> Fecha del sistema</span>
              <b>{formatDate(new Date())}</b>
            </div>
          </article>
        </section>

        {statusCounts.pending > 0 && (
          <section className="od-followup-strip" aria-label="Ciclos pendientes">
            <div className="od-strip-icon"><AlertTriangle size={16} /></div>
            <div className="od-strip-copy">
              <b>Pendientes de seguimiento</b>
              <span>{statusCounts.pending} {statusCounts.pending === 1 ? "ciclo requiere" : "ciclos requieren"} revisión.</span>
            </div>
            <Link href="/evaluations" className="od-strip-action">
              Revisar ciclos <ArrowUpRight size={14} />
            </Link>
          </section>
        )}

        <footer className="od-dashboard-footer">
          <span>OTS ENERGY <i>·</i> CONTROL DE COMPETENCIAS</span>
          <span><ShieldCheck size={12} /> Trazabilidad de capacitación ISO 9001</span>
        </footer>
      </div>
    </DashboardShell>
  );
}
