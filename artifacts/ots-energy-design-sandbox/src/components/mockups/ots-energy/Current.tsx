import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BarChart,
  BarChart3,
  BadgeCheck,
  Bell,
  BookOpen,
  Building2,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MonitorPlay,
  Search,
  Settings,
  Target,
  TrendingUp,
  Users,
  Wand2,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import "./_group.css";

const user = {
  name: "Administrador de Operaciones",
  email: "admin@ots-energy.example",
  role: "admin",
};
const company = { name: "OTS Energy" };

const navItems = [
  { label: "Centro de Control", icon: LayoutDashboard, href: "/" },
  { label: "Evaluaciones", icon: BookOpen, href: "/evaluations" },
  { label: "Temas de Evaluación", icon: Target, href: "/evaluation-topics" },
  { label: "Simuladores", icon: MonitorPlay, href: "/simulator" },
  { label: "Diseño de Simulaciones", icon: Wand2, href: "/scenario-designer", roles: ["admin", "super_admin", "trainer"] },
  { label: "Solicitudes OTS", icon: ClipboardList, href: "/training-requests", roles: ["admin", "super_admin", "trainer"] },
  { label: "Competencias y DNC", icon: BadgeCheck, href: "/competency-dnc", roles: ["admin", "super_admin", "trainer"] },
  { label: "Programa anual", icon: CalendarRange, href: "/training-program", roles: ["admin", "super_admin", "trainer"] },
  { label: "Operadores", icon: Users, href: "/operators", roles: ["admin", "super_admin"] },
  { label: "Empresas", icon: Building2, href: "/companies", roles: ["super_admin"] },
  { label: "Reportes Ejecutivos", icon: BarChart3, href: "/reports" },
  { label: "Configuración", icon: Settings, href: "/settings" },
];

type CycleStatus = "completed" | "in_progress" | "pending";
type Cycle = {
  id: number;
  title: string;
  studentId: number;
  status: CycleStatus;
  score: number | null;
  minPassingScore: number;
  startDate: string;
};

// Anonymous preview content; no account or operational records are used.
const users = [
  { id: 1, name: "Operador 01" },
  { id: 2, name: "Operador 02" },
  { id: 3, name: "Operador 03" },
  { id: 4, name: "Operador 04" },
  { id: 5, name: "Operador 05" },
];
const cycles: Cycle[] = [
  { id: 1, title: "Restablecimiento de línea de transmisión", studentId: 1, status: "completed", score: 94, minPassingScore: 80, startDate: "2025-02-03" },
  { id: 2, title: "Operación ante falla de transformador", studentId: 2, status: "in_progress", score: null, minPassingScore: 80, startDate: "2025-02-04" },
  { id: 3, title: "Maniobras de aislamiento y seguridad", studentId: 3, status: "completed", score: 88, minPassingScore: 80, startDate: "2025-02-05" },
  { id: 4, title: "Control de frecuencia del sistema", studentId: 4, status: "pending", score: null, minPassingScore: 80, startDate: "2025-02-06" },
  { id: 5, title: "Reposición de servicio en subestación", studentId: 5, status: "completed", score: 76, minPassingScore: 80, startDate: "2025-02-07" },
  { id: 6, title: "Respuesta ante contingencia N-1", studentId: 1, status: "in_progress", score: null, minPassingScore: 80, startDate: "2025-02-08" },
  { id: 7, title: "Coordinación de protecciones eléctricas", studentId: 2, status: "completed", score: 91, minPassingScore: 80, startDate: "2025-02-09" },
  { id: 8, title: "Operación segura de interruptores", studentId: 3, status: "completed", score: 86, minPassingScore: 80, startDate: "2025-02-10" },
  { id: 9, title: "Gestión de alarmas del centro de control", studentId: 4, status: "in_progress", score: null, minPassingScore: 80, startDate: "2025-02-11" },
  { id: 10, title: "Transferencia de carga entre circuitos", studentId: 5, status: "completed", score: 96, minPassingScore: 80, startDate: "2025-02-12" },
  { id: 11, title: "Apertura y cierre de equipo de potencia", studentId: 1, status: "pending", score: null, minPassingScore: 80, startDate: "2025-02-13" },
  { id: 12, title: "Restablecimiento de alimentación auxiliar", studentId: 2, status: "completed", score: 89, minPassingScore: 80, startDate: "2025-02-14" },
];

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = "/";
  const userInitials = user.name
    .split(" ")
    .map((namePart) => namePart[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const NavContent = () => (
    <div className="flex flex-col h-full bg-[hsl(222,47%,11%)]">
      <div className="h-16 flex items-center px-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-[15px] font-semibold text-white tracking-wide">OTS <span className="text-cyan-400">ENERGY</span></span>
          </div>
        </div>
      </div>

      <div className="flex-1 py-4 px-3 overflow-y-auto">
        <div className="px-3 mb-3">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em]">
            Sistema de Control
          </span>
        </div>
        <nav className="space-y-0.5">
          {navItems.filter((item) => !item.roles || item.roles.includes(user.role)).map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group ${
                  isActive
                    ? "bg-white/[0.08] text-white"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                }`}
                onClick={(event) => {
                  event.preventDefault();
                  setIsMobileOpen(false);
                }}
              >
                <Icon className={`w-[18px] h-[18px] transition-colors flex-shrink-0 ${
                  isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-400"
                }`} />
                <span>{item.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />}
              </a>
            );
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="h-8 w-8 ring-1 ring-white/10">
            <AvatarFallback className="bg-gradient-to-br from-cyan-500/30 to-blue-600/30 text-cyan-300 text-xs font-semibold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-medium truncate text-slate-200">{user.name}</span>
            <span className="text-[11px] text-slate-500 truncate">{user.email}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans">
      <aside className="hidden md:flex w-[260px] flex-col fixed inset-y-0 z-50 border-r border-white/[0.06]">
        <NavContent />
      </aside>

      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-3 left-3 z-50 text-foreground hover:bg-accent/10">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[260px] border-r border-white/[0.06] bg-[hsl(222,47%,11%)]">
          <NavContent />
        </SheetContent>
      </Sheet>

      <main className="flex-1 md:ml-[260px] flex flex-col min-h-screen">
        <header className="h-14 border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 md:ml-0 ml-10">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar..."
                className="h-9 w-64 rounded-lg border border-border bg-muted/50 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                data-testid="input-global-search"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-xs font-semibold text-emerald-600 border border-emerald-200">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              RED ACTIVA
            </div>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground h-9 w-9" data-testid="button-notifications">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-card"></span>
            </Button>
            <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 pl-2 pr-3 h-9 hover:bg-muted" data-testid="button-user-menu">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:inline">{user.name.split(" ")[0]}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground font-normal">{company.name}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" data-testid="menu-profile">
                  Perfil Profesional
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" data-testid="menu-settings">
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" data-testid="button-logout">
                  <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
          {children}
        </div>
      </main>
    </div>
  );
}

export function Current() {
  const statusCounts = useMemo(() => ({
    total: cycles.length,
    completed: cycles.filter((cycle) => cycle.status === "completed").length,
    inProgress: cycles.filter((cycle) => cycle.status === "in_progress").length,
    pending: cycles.filter((cycle) => cycle.status === "pending").length,
  }), []);

  const approvalRate = useMemo(() => {
    const completed = cycles.filter((cycle) => cycle.status === "completed");
    if (completed.length === 0) return 0;
    const passed = completed.filter((cycle) => cycle.score !== null && cycle.score >= cycle.minPassingScore);
    return Math.round((passed.length / completed.length) * 100);
  }, []);

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
    cycles.forEach((cycle) => {
      if (cycle.startDate) {
        const dow = new Date(cycle.startDate).getDay();
        const idx = dow === 0 ? 6 : dow - 1;
        days[idx].total++;
      }
    });
    return days;
  }, []);

  const getUserName = (userId: number | null) => {
    if (!userId) return "—";
    const matchingUser = users.find((entry) => entry.id === userId);
    return matchingUser?.name ?? `Operador #${userId}`;
  };

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
          <Card className="lg:col-span-4 border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Actividad por Día de Semana</CardTitle>
              <CardDescription className="text-xs">Ciclos registrados agrupados por día de inicio.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {activityData.every((day) => day.total === 0) ? (
                <div className="h-[300px] flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <BarChart className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Sin datos de actividad aún</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={activityData} barSize={32}>
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
                      cursor={{ fill: "hsl(var(--muted) / 0.5)", radius: 4 }}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                      {activityData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.total > 0 ? "hsl(217, 91%, 60%)" : "hsl(var(--muted))"}
                          opacity={0.85}
                        />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              )}
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
