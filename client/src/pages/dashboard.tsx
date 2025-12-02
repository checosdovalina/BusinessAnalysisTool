import DashboardShell from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ArrowUpRight, Users, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
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
          <div className="text-center space-y-4">
            <div className="h-12 w-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Cargando datos...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-heading text-foreground">Dashboard General</h2>
          <p className="text-muted-foreground mt-1">Resumen de actividad de entrenamiento y certificaciones.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Evaluaciones</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">142</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1 text-accent">
                <ArrowUpRight className="h-3 w-3 mr-1" /> +20.1% este mes
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.inProgress}</div>
              <p className="text-xs text-muted-foreground mt-1">Ciclos activos actualmente</p>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completadas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.completed}</div>
              <p className="text-xs text-muted-foreground mt-1">Últimos 30 días</p>
            </CardContent>
          </Card>
          <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Aprobación</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1 text-emerald-600">
                <ArrowUpRight className="h-3 w-3 mr-1" /> +2% vs promedio
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Actividad Semanal</CardTitle>
              <CardDescription>Evaluaciones realizadas en los últimos 7 días.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}`} 
                  />
                  <Tooltip 
                    cursor={{fill: 'hsl(var(--muted))'}}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }} 
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                     {activityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 4 ? 'hsl(var(--accent))' : 'hsl(var(--primary))'} />
                      ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="col-span-3 border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle>Evaluaciones Recientes</CardTitle>
              <CardDescription>Últimos movimientos registrados.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {cycles.slice(0, 5).map((cycle) => (
                  <div key={cycle.id} className="flex items-center" data-testid={`cycle-item-${cycle.id}`}>
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center border border-border">
                      <span className="text-xs font-bold text-muted-foreground">
                        {cycle.studentId.toString().substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none truncate max-w-[200px]">{cycle.title}</p>
                      <p className="text-xs text-muted-foreground">Estudiante #{cycle.studentId}</p>
                    </div>
                    <div className="ml-auto font-medium">
                      {cycle.status === "completed" ? (
                        <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">Aprobado</Badge>
                      ) : cycle.status === "in_progress" ? (
                        <Badge variant="secondary" className="text-accent-foreground bg-accent/20">En curso</Badge>
                      ) : (
                        <Badge variant="outline">Pendiente</Badge>
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
