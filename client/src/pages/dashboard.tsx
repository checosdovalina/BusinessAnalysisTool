import DashboardShell from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ArrowUpRight, Users, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { cyclesAPI } from "@/lib/api";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: cycles = [], isLoading } = useQuery({
    queryKey: ["cycles", user?.companyId],
    queryFn: () => user?.companyId ? cyclesAPI.getByCompany(user.companyId) : Promise.resolve([]),
    enabled: !!user?.companyId,
  });

  const activityData = [
    { name: "Lun", total: 12 },
    { name: "Mar", total: 18 },
    { name: "Mie", total: 24 },
    { name: "Jue", total: 20 },
    { name: "Vie", total: 28 },
    { name: "Sab", total: 8 },
    { name: "Dom", total: 0 },
  ];

  const statusCounts = {
    completed: cycles.filter(c => c.status === "completed").length,
    inProgress: cycles.filter(c => c.status === "in_progress").length,
    pending: cycles.filter(c => c.status === "pending").length,
  };

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-3">
            <div className="h-10 w-10 border-[3px] border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Cargando datos...</p>
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border shadow-sm" data-testid="card-total-evaluations">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-50 flex items-center justify-center">
                  <Users className="h-4 w-4 text-cyan-600" />
                </div>
                <Badge variant="secondary" className="text-[11px] font-medium bg-cyan-50 text-cyan-700 border-0">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" /> +20.1%
                </Badge>
              </div>
              <p className="text-2xl font-bold text-foreground">142</p>
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
              <p className="text-xs text-muted-foreground mt-0.5">Completadas (30 días)</p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm" data-testid="card-approval-rate">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-violet-600" />
                </div>
                <Badge variant="secondary" className="text-[11px] font-medium bg-emerald-50 text-emerald-700 border-0">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" /> +2%
                </Badge>
              </div>
              <p className="text-2xl font-bold text-foreground">94%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Tasa de Aprobación</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-7">
          <Card className="lg:col-span-4 border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Actividad Semanal</CardTitle>
              <CardDescription className="text-xs">Evaluaciones realizadas en los últimos 7 días.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
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
                    {activityData.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 4 ? 'hsl(217, 91%, 60%)' : 'hsl(199, 89%, 48%)'} 
                        opacity={0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Evaluaciones Recientes</CardTitle>
              <CardDescription className="text-xs">Últimos ciclos registrados.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cycles.slice(0, 5).map((cycle) => (
                  <div key={cycle.id} className="flex items-center gap-3" data-testid={`cycle-item-${cycle.id}`}>
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-[11px] font-bold text-muted-foreground">
                        {cycle.studentId.toString().substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate">{cycle.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">Operador #{cycle.studentId}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {cycle.status === "completed" ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-medium hover:bg-emerald-100">Aprobado</Badge>
                      ) : cycle.status === "in_progress" ? (
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[11px] font-medium hover:bg-blue-100">En curso</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[11px] font-medium">Pendiente</Badge>
                      )}
                    </div>
                  </div>
                ))}
                {cycles.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No hay ciclos de evaluación registrados</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
