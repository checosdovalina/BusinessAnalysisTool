import { useMemo } from "react";
import DashboardShell from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ArrowUpRight, Users, CheckCircle2, Clock, TrendingUp, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { cyclesAPI, usersAPI } from "@/lib/api";
import type { Cycle, User } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: cycles = [], isLoading: cyclesLoading } = useQuery({
    queryKey: ["cycles", user?.companyId],
    queryFn: () => user?.companyId ? cyclesAPI.getByCompany(user.companyId) : Promise.resolve([]),
    enabled: !!user?.companyId,
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["users", user?.companyId],
    queryFn: () => user?.companyId ? usersAPI.getByCompany(user.companyId) : Promise.resolve([]),
    enabled: !!user?.companyId,
  });

  const isLoading = cyclesLoading || usersLoading;

  const statusCounts = useMemo(() => ({
    total: cycles.length,
    completed: cycles.filter((c: Cycle) => c.status === "completed").length,
    inProgress: cycles.filter((c: Cycle) => c.status === "in_progress").length,
    pending: cycles.filter((c: Cycle) => c.status === "pending").length,
  }), [cycles]);

  const approvalRate = useMemo(() => {
    const completed = cycles.filter((c: Cycle) => c.status === "completed");
    if (completed.length === 0) return 0;
    const passed = completed.filter((c: Cycle) => c.score !== null && c.score >= (c.minPassingScore || 80));
    return Math.round((passed.length / completed.length) * 100);
  }, [cycles]);

  const activityData = useMemo(() => {
    const days = [
      { name: "Lun", total: 0 },
      { name: "Mar", total: 0 },
      { name: "Mié", total: 0 },
      { name: "Jue", total: 0 },
      { name: "Vie", total: 0 },
      { name: "Sáb", total: 0 },
      { name: "Dom", total: 0 },
    ];
    cycles.forEach((c: Cycle) => {
      if (c.startDate) {
        const d = new Date(c.startDate);
        const dow = d.getDay(); // 0=Dom, 1=Lun, ..., 6=Sáb
        const idx = dow === 0 ? 6 : dow - 1;
        days[idx].total++;
      }
    });
    return days;
  }, [cycles]);

  const getUserName = (userId: number | null) => {
    if (!userId) return "—";
    const u = users.find((u: User) => u.id === userId);
    return u?.name ?? `Operador #${userId}`;
  };

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-4 w-80 mt-2" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <div className="grid gap-4 lg:grid-cols-7">
            <Skeleton className="lg:col-span-4 h-[360px] rounded-xl" />
            <Skeleton className="lg:col-span-3 h-[360px] rounded-xl" />
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground" data-testid="text-page-title">Dashboard General</h1>
          <p className="text-sm text-muted-foreground mt-1">Resumen de actividad de entrenamiento y certificaciones.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border shadow-sm" data-testid="card-total-evaluations">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-50 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-cyan-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{statusCounts.total}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total Evaluaciones</p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm" data-testid="card-in-progress">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{statusCounts.inProgress}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Ciclos en Progreso</p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm" data-testid="card-completed">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{statusCounts.completed}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Completadas</p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm" data-testid="card-approval-rate">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-violet-600" />
                </div>
                {statusCounts.completed > 0 && (
                  <Badge variant="secondary" className="text-[11px] font-medium bg-emerald-50 text-emerald-700 border-0">
                    <ArrowUpRight className="h-3 w-3 mr-0.5" /> activo
                  </Badge>
                )}
              </div>
              <p className="text-2xl font-bold text-foreground">{approvalRate}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Tasa de Aprobación</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-7">
          {/* Weekly Activity Chart */}
          <Card className="lg:col-span-4 border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Actividad por Día de Semana</CardTitle>
              <CardDescription className="text-xs">Ciclos registrados agrupados por día de inicio.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {activityData.every(d => d.total === 0) ? (
                <div className="h-[300px] flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <BarChart className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Sin datos de actividad aún</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={activityData} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted) / 0.5)', radius: 4 }}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                      {activityData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.total > 0 ? 'hsl(217, 91%, 60%)' : 'hsl(var(--muted))'}
                          opacity={0.85}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Recent Evaluations */}
          <Card className="lg:col-span-3 border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Evaluaciones Recientes</CardTitle>
              <CardDescription className="text-xs">Últimos ciclos registrados.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cycles.slice(0, 5).map((cycle: Cycle) => (
                  <div key={cycle.id} className="flex items-center gap-3" data-testid={`cycle-item-${cycle.id}`}>
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-[11px] font-bold text-muted-foreground">
                        {getUserName(cycle.studentId).substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate">{cycle.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{getUserName(cycle.studentId)}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {cycle.status === "completed" ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-medium hover:bg-emerald-100">Completado</Badge>
                      ) : cycle.status === "in_progress" ? (
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[11px] font-medium hover:bg-blue-100">En curso</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[11px] font-medium">Pendiente</Badge>
                      )}
                    </div>
                  </div>
                ))}
                {cycles.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">No hay ciclos de evaluación registrados</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
