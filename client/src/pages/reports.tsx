import { useState, useMemo } from "react";
import DashboardShell from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Send, FileText, RefreshCw, AlertTriangle, CheckCircle2, XCircle, Clock, TrendingUp, Search, MoreHorizontal, Eye, Trash2, Target, GraduationCap } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cyclesAPI, usersAPI, reportsAPI, competencyDncAPI } from "@/lib/api";
import type { VerifyResult } from "@/lib/api";
import { toast } from "sonner";
import type { Cycle, User, TrainingReport, CompetencyAssessment } from "@shared/schema";

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En Progreso",
  completed: "Completado",
};

const statusColors: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700 border-slate-200",
  in_progress: "bg-amber-50 text-amber-800 border-amber-200",
  completed: "bg-teal-50 text-teal-800 border-teal-200",
};

const reportStatusLabels: Record<string, string> = {
  draft: "Borrador",
  generated: "Generado",
  sent: "Enviado",
  archived: "Archivado",
};

export default function Reports() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [sendingReportId, setSendingReportId] = useState<number | null>(null);
  const [sendOptions, setSendOptions] = useState({ supervisor: false, student: false, supervisorEmail: "" });
  const [viewReportId, setViewReportId] = useState<number | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteReportOpen, setIsDeleteReportOpen] = useState(false);
  const [reportToDeleteId, setReportToDeleteId] = useState<number | null>(null);
  const [annualProgramYear, setAnnualProgramYear] = useState(new Date().getFullYear());

  const { data: cycles = [], isLoading: cyclesLoading } = useQuery({
    queryKey: ["cycles", user?.companyId],
    queryFn: () => user?.companyId ? cyclesAPI.getByCompany(user.companyId) : Promise.resolve([]),
    enabled: !!user?.companyId,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users", user?.companyId],
    queryFn: () => user?.companyId ? usersAPI.getByCompany(user.companyId) : Promise.resolve([]),
    enabled: !!user?.companyId,
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["reports", user?.companyId],
    queryFn: () => user?.companyId ? reportsAPI.getByCompany(user.companyId) : Promise.resolve([]),
    enabled: !!user?.companyId,
  });
  const { data: competencyData } = useQuery({
    queryKey: ["competency-dnc", user?.companyId, annualProgramYear],
    queryFn: () => user?.companyId ? competencyDncAPI.getByCompany(user.companyId, annualProgramYear) : Promise.reject(new Error("Empresa no disponible")),
    enabled: !!user?.companyId && ["admin", "trainer", "super_admin"].includes(user.role),
  });

  const students = users.filter((u: User) => u.role === "student");
  const trainers = users.filter((u: User) => u.role === "trainer");

  const filteredCycles = useMemo(() => {
    return cycles.filter((cycle: Cycle) => {
      const matchesSearch = cycle.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cycle.qualityCode?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStudent = selectedStudentId === "all" || cycle.studentId.toString() === selectedStudentId;
      const matchesStatus = statusFilter === "all" || cycle.status === statusFilter;
      
      let matchesDate = true;
      if (dateRange !== "all") {
        const cycleDate = new Date(cycle.startDate);
        const now = new Date();
        switch (dateRange) {
          case "30d":
            matchesDate = (now.getTime() - cycleDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
            break;
          case "90d":
            matchesDate = (now.getTime() - cycleDate.getTime()) <= 90 * 24 * 60 * 60 * 1000;
            break;
          case "ytd":
            matchesDate = cycleDate.getFullYear() === now.getFullYear();
            break;
        }
      }
      
      return matchesSearch && matchesStudent && matchesStatus && matchesDate;
    });
  }, [cycles, searchTerm, selectedStudentId, statusFilter, dateRange]);

  const stats = useMemo(() => {
    const completedCycles = cycles.filter((c: Cycle) => c.status === "completed");
    const avgScore = completedCycles.length > 0
      ? completedCycles.reduce((acc: number, c: Cycle) => acc + (c.score || 0), 0) / completedCycles.length
      : 0;
    const totalHours = cycles.reduce((acc: number, c: Cycle) => acc + (c.trainingHours || 0), 0);
    
    return {
      totalCycles: cycles.length,
      completedCycles: completedCycles.length,
      avgScore: Math.round(avgScore),
      totalHours: Math.round(totalHours * 10) / 10,
      generatedReports: reports.length,
    };
  }, [cycles, reports]);

  const getStudentName = (studentId: number) => {
    const student = users.find((u: User) => u.id === studentId);
    return student?.name || "Desconocido";
  };

  const getTrainerName = (trainerId: number) => {
    const trainer = users.find((u: User) => u.id === trainerId);
    return trainer?.name || "Desconocido";
  };

  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [verifyingCycleId, setVerifyingCycleId] = useState<number | null>(null);

  const handleVerifyAndGenerate = async (cycleId: number) => {
    setVerifyingCycleId(cycleId);
    try {
      const result = await reportsAPI.verify(cycleId);
      setVerifyResult(result);
      setIsVerifyOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al verificar contenido");
      setVerifyingCycleId(null);
    }
  };

  const handleConfirmGenerate = async () => {
    if (!verifyingCycleId) return;
    setIsGenerating(true);
    setIsVerifyOpen(false);
    try {
      await reportsAPI.generate(verifyingCycleId);
      await queryClient.invalidateQueries({ queryKey: ["reports"] });
      await queryClient.invalidateQueries({ queryKey: ["cycles"] });
      toast.success("Reporte generado exitosamente");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al generar reporte");
    } finally {
      setIsGenerating(false);
      setVerifyingCycleId(null);
      setVerifyResult(null);
    }
  };

  const handleSendReport = async () => {
    if (!sendingReportId) return;
    
    try {
      await reportsAPI.send(sendingReportId, {
        sendToSupervisor: sendOptions.supervisor,
        sendToStudent: sendOptions.student,
        supervisorEmail: sendOptions.supervisorEmail || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Reporte enviado exitosamente");
      setIsSendOpen(false);
      setSendingReportId(null);
      setSendOptions({ supervisor: false, student: false, supervisorEmail: "" });
    } catch (error) {
      toast.error("Error al enviar reporte");
    }
  };

  const openSendDialog = (reportId: number) => {
    setSendingReportId(reportId);
    setIsSendOpen(true);
  };

  const openDeleteReportDialog = (id: number) => {
    setReportToDeleteId(id);
    setIsDeleteReportOpen(true);
  };

  const handleDeleteReport = async () => {
    if (!reportToDeleteId) return;
    try {
      await reportsAPI.delete(reportToDeleteId);
      await queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Reporte eliminado");
      setIsDeleteReportOpen(false);
      setReportToDeleteId(null);
    } catch (error) {
      toast.error("Error al eliminar reporte");
    }
  };

  const handleExportPdf = () => {
    window.print();
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getCycleReport = (cycleId: number) => {
    return reports.find((r: TrainingReport) => r.cycleId === cycleId);
  };

  const canGenerateReport = user?.role === "admin" || user?.role === "trainer" || user?.role === "super_admin";

  const selectedCycle = selectedCycleId ? cycles.find((c: Cycle) => c.id === selectedCycleId) : null;
  const selectedReport = viewReportId ? reports.find((r: TrainingReport) => r.id === viewReportId) : null;
  const annualPrograms = competencyData?.annualPrograms ?? [];
  const annualProgramIds = new Set(annualPrograms.map((program) => program.id));
  const annualDncRequests = (competencyData?.requests ?? []).filter((request) => request.annualProgramId !== null && annualProgramIds.has(request.annualProgramId));
  const latestAssessmentByCompetency = new Map<string, CompetencyAssessment>();
  for (const assessment of competencyData?.assessments ?? []) {
    const key = `${assessment.employeeId}:${assessment.profileId}:${assessment.competencyId}`;
    const current = latestAssessmentByCompetency.get(key);
    if (!current || new Date(assessment.assessedAt).getTime() > new Date(current.assessedAt).getTime()) {
      latestAssessmentByCompetency.set(key, assessment);
    }
  }
  const pendingDncRequests = annualDncRequests.filter((request) => {
    const original = competencyData?.assessments.find((assessment) => assessment.id === request.dncAssessmentId);
    if (!original) return false;
    const key = `${original.employeeId}:${original.profileId}:${original.competencyId}`;
    const latest = latestAssessmentByCompetency.get(key);
    return Boolean(latest && latest.currentLevel < original.requiredLevel);
  });
  const annualCompletedCount = annualDncRequests.filter((request) => request.status === "completed").length;
  const annualPlannedHours = annualDncRequests.reduce((sum, request) => sum + (request.estimatedHours ?? 0), 0);
  const annualExecutedHours = annualPrograms.reduce((sum, program) => sum + program.completedHours, 0);
  const canViewDncProgram = ["admin", "trainer", "super_admin"].includes(user?.role ?? "");

  const radarDataParsed = useMemo(() => {
    if (!selectedReport?.radarData) return [];
    try {
      return JSON.parse(selectedReport.radarData);
    } catch {
      return [];
    }
  }, [selectedReport]);

  const progressData = useMemo(() => {
    const monthlyData: Record<string, { month: string; score: number; count: number }> = {};
    
    cycles.forEach((cycle: Cycle) => {
      if (cycle.score && cycle.endDate) {
        const date = new Date(cycle.endDate);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        const monthName = date.toLocaleDateString("es-MX", { month: "short" });
        
        if (!monthlyData[key]) {
          monthlyData[key] = { month: monthName, score: 0, count: 0 };
        }
        monthlyData[key].score += cycle.score;
        monthlyData[key].count++;
      }
    });
    
    return Object.values(monthlyData)
      .map(d => ({ name: d.month, score: Math.round(d.score / d.count) }))
      .slice(-6);
  }, [cycles]);

  if (cyclesLoading) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Skeleton className="h-7 w-72" />
              <Skeleton className="h-4 w-96 mt-2" />
            </div>
            <Skeleton className="h-9 w-36" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reportes y Analítica Operativa</h1>
            <p className="text-sm text-muted-foreground mt-1">Generación de informes de desempeño y registros de calidad</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPdf} data-testid="button-export-pdf">
              <Download className="mr-2 h-4 w-4" /> Exportar PDF
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="border-border/80 bg-card shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalCycles}</p>
                  <p className="text-xs text-muted-foreground">Ciclos Totales</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/80 bg-card shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completedCycles}</p>
                  <p className="text-xs text-muted-foreground">Completados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/80 bg-card shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-50 flex items-center justify-center">
                  <Target className="h-4 w-4 text-cyan-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.avgScore}%</p>
                  <p className="text-xs text-muted-foreground">Promedio General</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/80 bg-card shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalHours}h</p>
                  <p className="text-xs text-muted-foreground">Horas Entrenamiento</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/80 bg-card shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Send className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.generatedReports}</p>
                  <p className="text-xs text-muted-foreground">Reportes Generados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="cycles" className="w-full">
          <TabsList className={`grid w-full ${canViewDncProgram ? "grid-cols-5" : "grid-cols-4"}`}>
            <TabsTrigger value="cycles">Ciclos de Entrenamiento</TabsTrigger>
            <TabsTrigger value="reports">Reportes Generados</TabsTrigger>
            {canViewDncProgram && <TabsTrigger value="dnc-program">Programa DNC</TabsTrigger>}
            <TabsTrigger value="analytics">Visualización</TabsTrigger>
            <TabsTrigger value="progress">Avance Anual</TabsTrigger>
          </TabsList>

          {/* Ciclos Tab */}
          <TabsContent value="cycles" className="space-y-4 mt-4">
            {/* Filters */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por título o código..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                      data-testid="input-search-cycles"
                    />
                  </div>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="px-3 py-2 bg-background border border-border rounded-md text-sm"
                    data-testid="select-filter-student"
                  >
                    <option value="all">Todos los operadores</option>
                    {students.map((s: User) => (
                      <option key={s.id} value={s.id.toString()}>{s.name}</option>
                    ))}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-background border border-border rounded-md text-sm"
                    data-testid="select-filter-status"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En Progreso</option>
                    <option value="completed">Completado</option>
                  </select>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="px-3 py-2 bg-background border border-border rounded-md text-sm"
                    data-testid="select-filter-date"
                  >
                    <option value="all">Todas las fechas</option>
                    <option value="30d">Últimos 30 días</option>
                    <option value="90d">Último trimestre</option>
                    <option value="ytd">Año actual</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
            <div className="overflow-x-auto rounded-lg border border-border/70">
                  <Table>
              <TableHeader className="bg-muted/60">
                <TableRow className="hover:bg-transparent border-b border-border/70">
                        <TableHead className="font-semibold">Ciclo</TableHead>
                        <TableHead className="font-semibold">Operador</TableHead>
                        <TableHead className="font-semibold">Entrenador</TableHead>
                        <TableHead className="font-semibold">Fecha</TableHead>
                        <TableHead className="font-semibold">Estado</TableHead>
                        <TableHead className="font-semibold">Calificación</TableHead>
                        <TableHead className="font-semibold">Reporte</TableHead>
                        <TableHead className="text-right font-semibold">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCycles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No hay ciclos que coincidan con los filtros
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCycles.map((cycle: Cycle) => {
                          const report = getCycleReport(cycle.id);
                          return (
                            <TableRow key={cycle.id} className="border-b border-border/70 transition-colors hover:bg-primary/[0.025]" data-testid={`row-cycle-${cycle.id}`}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{cycle.title}</p>
                                  {cycle.qualityCode && (
                                    <p className="text-xs text-muted-foreground">{cycle.qualityCode}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{getStudentName(cycle.studentId)}</TableCell>
                              <TableCell>{getTrainerName(cycle.trainerId)}</TableCell>
                              <TableCell>{formatDate(cycle.startDate)}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={statusColors[cycle.status]}>
                                  {statusLabels[cycle.status]}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {cycle.score !== null && cycle.score !== undefined ? (
                                  <span className={`font-bold ${cycle.score >= 70 ? "text-emerald-600" : "text-red-600"}`}>
                                    {Math.round(cycle.score)}%
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {report ? (
                                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                    {reportStatusLabels[report.status]}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-muted text-muted-foreground">
                                    Sin generar
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" data-testid={`button-menu-${cycle.id}`}>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {!report && canGenerateReport && (
                                      <DropdownMenuItem 
                                        onClick={() => handleVerifyAndGenerate(cycle.id)}
                                        disabled={isGenerating || verifyingCycleId === cycle.id}
                                        data-testid={`menu-generate-${cycle.id}`}
                                      >
                                        <RefreshCw className={`h-4 w-4 mr-2 ${verifyingCycleId === cycle.id ? "animate-spin" : ""}`} />
                                        {verifyingCycleId === cycle.id ? "Verificando..." : "Generar Reporte"}
                                      </DropdownMenuItem>
                                    )}
                                    {report && (
                                      <>
                                        <DropdownMenuItem onClick={() => { setViewReportId(report.id); setIsViewOpen(true); }}>
                                          <Eye className="h-4 w-4 mr-2" />
                                          Ver Reporte
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => openSendDialog(report.id)}>
                                          <Send className="h-4 w-4 mr-2" />
                                          Enviar Reporte
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reportes Generados Tab */}
          <TabsContent value="reports" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Reportes Generados</CardTitle>
                <CardDescription>Historial de reportes de entrenamiento generados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="hover:bg-transparent border-b border-border/50">
                        <TableHead className="font-semibold">Código</TableHead>
                        <TableHead className="font-semibold">Operador</TableHead>
                        <TableHead className="font-semibold">Calificación</TableHead>
                        <TableHead className="font-semibold">Resultado</TableHead>
                        <TableHead className="font-semibold">Estado</TableHead>
                        <TableHead className="font-semibold">Generado</TableHead>
                        <TableHead className="text-right font-semibold">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No hay reportes generados
                          </TableCell>
                        </TableRow>
                      ) : (
                        reports.map((report: TrainingReport) => (
                          <TableRow key={report.id} className="hover:bg-muted/50 border-b border-border/30" data-testid={`row-report-${report.id}`}>
                            <TableCell className="font-mono text-sm">{report.reportCode}</TableCell>
                            <TableCell>{getStudentName(report.studentId)}</TableCell>
                            <TableCell>
                              <span className={`font-bold ${(report.totalScore || 0) >= (report.passingScore || 70) ? "text-emerald-600" : "text-red-600"}`}>
                                {report.totalScore?.toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell>
                              {report.isPassed ? (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Aprobado
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Reprobado
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{reportStatusLabels[report.status]}</Badge>
                            </TableCell>
                            <TableCell>{formatDate(report.generatedAt)}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setViewReportId(report.id); setIsViewOpen(true); }}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver Detalle
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openSendDialog(report.id)}>
                                    <Send className="h-4 w-4 mr-2" />
                                    Enviar
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => openDeleteReportDialog(report.id)} className="text-destructive focus:text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {canViewDncProgram && <TabsContent value="dnc-program" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                  <div>
                    <CardTitle>Programa anual derivado de DNC</CardTitle>
                    <CardDescription>Seguimiento por empresa/año de necesidades, horas ejecutadas, cumplimiento y brechas abiertas.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <label htmlFor="dnc-program-year" className="text-sm text-muted-foreground">Año</label>
                    <Input id="dnc-program-year" type="number" min="2000" max="9999" className="w-28" value={annualProgramYear} onChange={(event) => setAnnualProgramYear(Number(event.target.value) || new Date().getFullYear())} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <div className="rounded-lg border p-3"><p className="text-2xl font-semibold">{annualPrograms.length}</p><p className="text-xs text-muted-foreground">Programas por operador</p></div>
                  <div className="rounded-lg border p-3"><p className="text-2xl font-semibold">{annualDncRequests.length}</p><p className="text-xs text-muted-foreground">Solicitudes planificadas</p></div>
                  <div className="rounded-lg border p-3"><p className="text-2xl font-semibold">{annualPlannedHours.toFixed(1)} h</p><p className="text-xs text-muted-foreground">Horas planeadas</p></div>
                  <div className="rounded-lg border p-3"><p className="text-2xl font-semibold">{annualExecutedHours.toFixed(1)} h</p><p className="text-xs text-muted-foreground">Horas ejecutadas</p></div>
                  <div className="rounded-lg border p-3"><p className="text-2xl font-semibold">{pendingDncRequests.length}</p><p className="text-xs text-muted-foreground">Brechas pendientes</p></div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span>Cumplimiento de solicitudes</span><strong>{annualDncRequests.length ? Math.round((annualCompletedCount / annualDncRequests.length) * 100) : 0}%</strong></div>
                  <Progress value={annualDncRequests.length ? (annualCompletedCount / annualDncRequests.length) * 100 : 0} />
                </div>
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Operador</TableHead><TableHead>Solicitudes</TableHead><TableHead>Horas ejecutadas</TableHead><TableHead>Avance</TableHead><TableHead>Estado</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {annualPrograms.length ? annualPrograms.map((program) => {
                        const operator = users.find((person) => person.id === program.studentId);
                        const programRequests = annualDncRequests.filter((request) => request.annualProgramId === program.id);
                        const openGaps = pendingDncRequests.filter((request) => request.annualProgramId === program.id).length;
                        return (
                          <TableRow key={program.id}>
                            <TableCell className="font-medium">{operator?.name ?? `Operador ${program.studentId}`}</TableCell>
                            <TableCell>{programRequests.filter((request) => request.status === "completed").length}/{programRequests.length} completadas</TableCell>
                            <TableCell>{program.completedHours.toFixed(1)} h de {program.targetHours.toFixed(1)} h</TableCell>
                            <TableCell><div className="flex min-w-28 items-center gap-2"><Progress value={program.progressPercentage} className="h-2" /><span className="text-xs">{Math.round(program.progressPercentage)}%</span></div></TableCell>
                            <TableCell><Badge variant="outline" className={openGaps ? "border-amber-200 bg-amber-50 text-amber-900" : "border-teal-200 bg-teal-50 text-teal-900"}>{openGaps ? `${openGaps} brecha(s) abierta(s)` : "Sin brechas pendientes"}</Badge></TableCell>
                          </TableRow>
                        );
                      }) : (
                        <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No hay planes DNC incorporados al programa anual para {annualProgramYear}.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold">Historial de ejecuciones de campo y aula</h3>
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Fecha</TableHead><TableHead>Solicitud DNC</TableHead><TableHead>Modalidad</TableHead>
                        <TableHead>Duración</TableHead><TableHead>Participantes</TableHead><TableHead>Feedback</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {(competencyData?.executions ?? []).length ? competencyData!.executions.map((execution) => {
                          const request = annualDncRequests.find((item) => item.id === execution.requestId);
                          const methodLabel = execution.method === "field" ? "Campo" :
                            execution.method === "classroom" ? "Aula" :
                            execution.method === "workshop" ? "Taller" : "Otro";
                          return (
                            <TableRow key={execution.id}>
                              <TableCell>{new Date(`${execution.executionDate}T00:00:00`).toLocaleDateString("es-MX")}</TableCell>
                              <TableCell className="min-w-48">
                                <span className="font-medium">{request?.requestCode ?? `Solicitud #${execution.requestId}`}</span>
                                {request?.title && <span className="block text-xs text-muted-foreground">{request.title}</span>}
                              </TableCell>
                              <TableCell>{methodLabel}</TableCell>
                              <TableCell>{execution.durationHours.toFixed(2)} h</TableCell>
                              <TableCell>{execution.participantCount}</TableCell>
                              <TableCell className="max-w-64 whitespace-normal">{execution.feedback || "—"}</TableCell>
                            </TableRow>
                          );
                        }) : (
                          <TableRow><TableCell colSpan={6} className="py-6 text-center text-muted-foreground">No hay ejecuciones de campo o aula para {annualProgramYear}.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>}

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Distribución por Estado</CardTitle>
                  <CardDescription>Ciclos de entrenamiento por estado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: "Pendiente", value: cycles.filter((c: Cycle) => c.status === "pending").length, fill: "hsl(45, 93%, 47%)" },
                        { name: "En Progreso", value: cycles.filter((c: Cycle) => c.status === "in_progress").length, fill: "hsl(210, 100%, 50%)" },
                        { name: "Completado", value: cycles.filter((c: Cycle) => c.status === "completed").length, fill: "hsl(142, 76%, 36%)" },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Evolución de Desempeño</CardTitle>
                  <CardDescription>Promedio de calificaciones por mes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={progressData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }} />
                        <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--background))', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Desempeño por Operador</CardTitle>
                <CardDescription>Calificaciones promedio de los estudiantes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {students.map((student: User) => {
                    const studentCycles = cycles.filter((c: Cycle) => c.studentId === student.id && c.score);
                    const avgScore = studentCycles.length > 0
                      ? studentCycles.reduce((acc: number, c: Cycle) => acc + (c.score || 0), 0) / studentCycles.length
                      : 0;
                    
                    return (
                      <div key={student.id} className="flex items-center gap-4">
                        <div className="w-32 truncate text-sm font-medium">{student.name}</div>
                        <div className="flex-1">
                          <Progress value={avgScore} className="h-2" />
                        </div>
                        <div className="w-16 text-right text-sm font-bold">
                          {avgScore > 0 ? `${Math.round(avgScore)}%` : "-"}
                        </div>
                        <div className="w-20 text-right text-xs text-muted-foreground">
                          {studentCycles.length} ciclos
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Avance Anual Tab */}
          <TabsContent value="progress" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Avance del Programa Anual {new Date().getFullYear()}</CardTitle>
                <CardDescription>Progreso de entrenamiento por operador</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {students.map((student: User) => {
                    const studentCycles = cycles.filter((c: Cycle) => c.studentId === student.id);
                    const completedCycles = studentCycles.filter((c: Cycle) => c.status === "completed");
                    const totalHours = studentCycles.reduce((acc: number, c: Cycle) => acc + (c.trainingHours || 0), 0);
                    const targetHours = 40;
                    const progressPercent = Math.min((totalHours / targetHours) * 100, 100);
                    
                    return (
                      <div key={student.id} className="p-4 rounded-lg border border-border/50 bg-muted/20">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <GraduationCap className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{student.name}</p>
                              <p className="text-xs text-muted-foreground">{student.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{Math.round(progressPercent)}%</p>
                            <p className="text-xs text-muted-foreground">Avance Anual</p>
                          </div>
                        </div>
                        
                        <Progress value={progressPercent} className="h-3 mb-3" />
                        
                        <div className="grid grid-cols-3 gap-4 text-center text-sm">
                          <div className="p-2 rounded bg-muted/50">
                            <p className="font-bold text-lg">{completedCycles.length}</p>
                            <p className="text-xs text-muted-foreground">Sesiones</p>
                          </div>
                          <div className="p-2 rounded bg-muted/50">
                            <p className="font-bold text-lg">{totalHours.toFixed(1)}h</p>
                            <p className="text-xs text-muted-foreground">Horas</p>
                          </div>
                          <div className="p-2 rounded bg-muted/50">
                            <p className="font-bold text-lg">{targetHours}h</p>
                            <p className="text-xs text-muted-foreground">Meta</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Send Report Dialog */}
        <Dialog open={isSendOpen} onOpenChange={setIsSendOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Enviar Reporte</DialogTitle>
              <DialogDescription>
                Selecciona a quién deseas enviar el reporte
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="sendSupervisor"
                  checked={sendOptions.supervisor}
                  onChange={(e) => setSendOptions(prev => ({ ...prev, supervisor: e.target.checked }))}
                  data-testid="checkbox-send-supervisor"
                />
                <label htmlFor="sendSupervisor" className="text-sm font-medium cursor-pointer">
                  Enviar al Jefe Inmediato
                </label>
              </div>
              {sendOptions.supervisor && (
                <Input
                  placeholder="Email del jefe inmediato"
                  value={sendOptions.supervisorEmail}
                  onChange={(e) => setSendOptions(prev => ({ ...prev, supervisorEmail: e.target.value }))}
                  className="ml-6"
                  data-testid="input-supervisor-email"
                />
              )}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="sendStudent"
                  checked={sendOptions.student}
                  onChange={(e) => setSendOptions(prev => ({ ...prev, student: e.target.checked }))}
                  data-testid="checkbox-send-student"
                />
                <label htmlFor="sendStudent" className="text-sm font-medium cursor-pointer">
                  Enviar al Operador (Entrenando)
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSendOpen(false)}>Cancelar</Button>
              <Button 
                onClick={handleSendReport}
                disabled={!sendOptions.supervisor && !sendOptions.student}
                data-testid="button-confirm-send"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Reporte
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Report Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalle del Reporte</DialogTitle>
              <DialogDescription>Información completa del reporte de entrenamiento</DialogDescription>
            </DialogHeader>
            {selectedReport && (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                  <div>
                    <p className="font-mono text-lg font-bold">{selectedReport.reportCode}</p>
                    <p className="text-sm text-muted-foreground">Generado: {formatDate(selectedReport.generatedAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${selectedReport.isPassed ? "text-emerald-600" : "text-red-600"}`}>
                      {selectedReport.totalScore?.toFixed(1)}%
                    </p>
                    <Badge variant="outline" className={selectedReport.isPassed ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}>
                      {selectedReport.isPassed ? "APROBADO" : "REPROBADO"}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground mb-1">Operador</p>
                    <p className="font-medium">{getStudentName(selectedReport.studentId)}</p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground mb-1">Entrenador</p>
                    <p className="font-medium">{getTrainerName(selectedReport.trainerId)}</p>
                  </div>
                </div>

                {radarDataParsed.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Gráfica de Competencias</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarDataParsed}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                              name="Resultado"
                              dataKey="score"
                              stroke="hsl(var(--accent))"
                              fill="hsl(var(--accent))"
                              fillOpacity={0.6}
                            />
                            <Radar
                              name="Meta"
                              dataKey="max"
                              stroke="hsl(var(--primary))"
                              fill="hsl(var(--primary))"
                              fillOpacity={0.1}
                            />
                            <Legend />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {(selectedReport.conclusions || selectedReport.recommendations) && (
                  <div className="space-y-4">
                    {selectedReport.conclusions && (
                      <div className="p-4 rounded-lg border">
                        <p className="text-sm font-medium mb-2">Conclusiones</p>
                        <p className="text-sm text-muted-foreground">{selectedReport.conclusions}</p>
                      </div>
                    )}
                    {selectedReport.recommendations && (
                      <div className="p-4 rounded-lg border">
                        <p className="text-sm font-medium mb-2">Recomendaciones</p>
                        <p className="text-sm text-muted-foreground">{selectedReport.recommendations}</p>
                      </div>
                    )}
                  </div>
                )}

                {(selectedReport.sentToSupervisor || selectedReport.sentToStudent) && (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                    <p className="text-sm font-medium text-green-400 mb-2">Enviado</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {selectedReport.sentToSupervisor && <p>Jefe inmediato: {selectedReport.supervisorEmail}</p>}
                      {selectedReport.sentToStudent && <p>Operador: Sí</p>}
                      <p>Fecha: {formatDate(selectedReport.sentAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewOpen(false)}>Cerrar</Button>
              <Button onClick={() => openSendDialog(selectedReport?.id || 0)}>
                <Send className="h-4 w-4 mr-2" />
                Enviar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Verify Content Dialog */}
        <Dialog open={isVerifyOpen} onOpenChange={(open) => { setIsVerifyOpen(open); if (!open) { setVerifyingCycleId(null); setVerifyResult(null); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Verificación de Contenido</DialogTitle>
              <DialogDescription>
                Revisión del ciclo antes de generar el reporte
              </DialogDescription>
            </DialogHeader>
            {verifyResult && (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="font-medium mb-2">{verifyResult.cycle?.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Eventos de evaluación: <span className="font-semibold text-foreground">{verifyResult.eventsCount}</span>
                  </p>
                </div>
                
                {verifyResult.blockingIssues?.length > 0 && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 space-y-2">
                    <p className="text-sm font-medium text-red-400 flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Problemas que impiden generar:
                    </p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {verifyResult.blockingIssues.map((issue, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {verifyResult.warnings?.length > 0 && (
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 space-y-2">
                    <p className="text-sm font-medium text-yellow-400 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Advertencias (puede continuar):
                    </p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {verifyResult.warnings.map((warning, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-yellow-400 mt-0.5">•</span>
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {verifyResult.canGenerate && verifyResult.blockingIssues?.length === 0 && verifyResult.warnings?.length === 0 && (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                    <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-400">Listo para generar</p>
                      <p className="text-sm text-muted-foreground">Todos los requisitos están completos</p>
                    </div>
                  </div>
                )}
                
                {verifyResult.canGenerate && verifyResult.warnings?.length > 0 && (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                    <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-400">Se puede generar</p>
                      <p className="text-sm text-muted-foreground">Las advertencias no impiden la generación</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsVerifyOpen(false); setVerifyingCycleId(null); setVerifyResult(null); }}>
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmGenerate}
                disabled={isGenerating || !verifyResult?.canGenerate}
                data-testid="button-confirm-generate"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generar Reporte
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Delete Report Confirmation Dialog */}
        <Dialog open={isDeleteReportOpen} onOpenChange={(open) => { setIsDeleteReportOpen(open); if (!open) setReportToDeleteId(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>¿Eliminar reporte?</DialogTitle>
              <DialogDescription>
                Esta acción eliminará permanentemente el reporte y no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setIsDeleteReportOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteReport} data-testid="button-confirm-delete-report">
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  );
}
