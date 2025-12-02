import DashboardShell from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Printer, Share2, FileText, Filter } from "lucide-react";
import { cycles } from "@/lib/mock-data";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export default function Reports() {
  // Mock data for Radar Chart (Skills)
  const skillsData = [
    { subject: 'Seguridad', A: 120, B: 110, fullMark: 150 },
    { subject: 'Operación', A: 98, B: 130, fullMark: 150 },
    { subject: 'Mantenimiento', A: 86, B: 130, fullMark: 150 },
    { subject: 'Eficiencia', A: 99, B: 100, fullMark: 150 },
    { subject: 'Comms', A: 85, B: 90, fullMark: 150 },
    { subject: 'Protocolos', A: 65, B: 85, fullMark: 150 },
  ];

  // Mock data for Line Chart (Progress over time)
  const progressData = [
    { name: 'Ene', score: 65 },
    { name: 'Feb', score: 70 },
    { name: 'Mar', score: 68 },
    { name: 'Abr', score: 75 },
    { name: 'May', score: 82 },
    { name: 'Jun', score: 88 },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight font-heading">Reportes y Analítica</h2>
            <p className="text-muted-foreground">Generación de informes de desempeño y cumplimiento.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Share2 className="mr-2 h-4 w-4" /> Compartir
            </Button>
            <Button className="bg-primary text-primary-foreground">
              <Download className="mr-2 h-4 w-4" /> Exportar PDF
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          {/* Sidebar Filters */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Filtros de Reporte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ciclo de Evaluación</label>
                  <Select defaultValue="cy1">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar ciclo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cy1">Certificación CAEX 930E</SelectItem>
                      <SelectItem value="cy2">Inducción Planta</SelectItem>
                      <SelectItem value="all">Todos los ciclos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Alumno</label>
                  <Select defaultValue="u3">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar alumno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="u3">Juan Operador</SelectItem>
                      <SelectItem value="u5">Pedro Mecánico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                   <label className="text-sm font-medium">Rango de Fechas</label>
                   <Select defaultValue="30d">
                    <SelectTrigger>
                      <SelectValue placeholder="Periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30d">Últimos 30 días</SelectItem>
                      <SelectItem value="90d">Último Trimestre</SelectItem>
                      <SelectItem value="ytd">Año actual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full" variant="secondary">
                  <Filter className="mr-2 h-4 w-4" /> Aplicar Filtros
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground">
               <CardHeader>
                 <CardTitle className="text-base">Resumen Ejecutivo</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div>
                   <div className="text-3xl font-bold">92/100</div>
                   <div className="text-sm opacity-80">Puntaje Promedio</div>
                 </div>
                 <div>
                   <div className="text-3xl font-bold">100%</div>
                   <div className="text-sm opacity-80">Asistencia</div>
                 </div>
                 <div className="pt-4 border-t border-primary-foreground/20">
                   <div className="text-sm font-medium">Estado: Aprobado</div>
                   <div className="text-xs opacity-80 mt-1">Certificado vigente hasta Dic 2025</div>
                 </div>
               </CardContent>
            </Card>
          </div>

          {/* Main Report Area */}
          <div className="space-y-6">
             <Tabs defaultValue="visual" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="visual">Visualización</TabsTrigger>
                <TabsTrigger value="document">Documento Formal</TabsTrigger>
              </TabsList>
              
              <TabsContent value="visual" className="space-y-4 mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Análisis de Competencias (Radar)</CardTitle>
                      <CardDescription>Comparativa vs. Estándar del Rol</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillsData}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                            <Radar
                              name="Alumno"
                              dataKey="A"
                              stroke="hsl(var(--accent))"
                              fill="hsl(var(--accent))"
                              fillOpacity={0.6}
                            />
                            <Radar
                              name="Estándar"
                              dataKey="B"
                              stroke="hsl(var(--primary))"
                              fill="hsl(var(--primary))"
                              fillOpacity={0.1}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Evolución de Desempeño</CardTitle>
                      <CardDescription>Histórico de evaluaciones últimos 6 meses</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <LineChart data={progressData}>
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
                              domain={[0, 100]}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--popover))', 
                                borderColor: 'hsl(var(--border))',
                                borderRadius: 'var(--radius)',
                              }} 
                            />
                            <Line 
                              type="monotone" 
                              dataKey="score" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2} 
                              dot={{ r: 4, fill: 'hsl(var(--background))', strokeWidth: 2 }} 
                              activeDot={{ r: 6 }} 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Detalle de Eventos Críticos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/20 transition-colors">
                          <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                             <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold">Inspección Pre-operacional (Vuelta del Perro)</h4>
                            <p className="text-xs text-muted-foreground mt-1">12 Oct 2024 • 10:30 AM</p>
                            <p className="text-sm mt-2 text-foreground/80">
                              El alumno demostró conocimiento completo de los puntos de inspección. Se recomienda mejorar la velocidad de revisión en neumáticos traseros.
                            </p>
                          </div>
                          <div className="ml-auto text-right">
                             <div className="text-lg font-bold text-emerald-600">10/10</div>
                             <div className="text-xs text-muted-foreground">Puntos</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="document" className="mt-4">
                <Card className="bg-white text-black min-h-[800px] shadow-lg p-8 md:p-12 font-serif">
                   {/* Mock PDF View */}
                   <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
                     <div>
                       <h1 className="text-3xl font-bold uppercase tracking-wider text-gray-900">Informe de Evaluación</h1>
                       <p className="text-gray-600 mt-2">Entrenamiento Operativo Estándar (OTS)</p>
                     </div>
                     <div className="text-right">
                       <div className="font-bold text-xl text-blue-900">Minería del Norte S.A.</div>
                       <div className="text-sm text-gray-500">ID Reporte: #REQ-2024-892</div>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-8 mb-8">
                     <div>
                       <h3 className="text-sm font-bold uppercase text-gray-500 mb-2">Datos del Alumno</h3>
                       <div className="text-lg font-medium">Juan Operador</div>
                       <div className="text-gray-600">ID: 12.345.678-9</div>
                       <div className="text-gray-600">Cargo: Operador CAEX</div>
                     </div>
                     <div>
                       <h3 className="text-sm font-bold uppercase text-gray-500 mb-2">Datos de Evaluación</h3>
                       <div className="text-lg font-medium">Certificación 930E</div>
                       <div className="text-gray-600">Fecha: 12 Oct 2024</div>
                       <div className="text-gray-600">Entrenador: Roberto Entrenador</div>
                     </div>
                   </div>

                   <table className="w-full mb-8 border-collapse">
                     <thead>
                       <tr className="border-b-2 border-gray-800 text-left">
                         <th className="py-2 font-bold">Evento Evaluado</th>
                         <th className="py-2 font-bold text-right">Ponderación</th>
                         <th className="py-2 font-bold text-right">Resultado</th>
                       </tr>
                     </thead>
                     <tbody>
                       <tr className="border-b border-gray-200">
                         <td className="py-3 text-gray-800">1. Inspección Pre-operacional</td>
                         <td className="py-3 text-right text-gray-600">20%</td>
                         <td className="py-3 text-right font-bold">100%</td>
                       </tr>
                       <tr className="border-b border-gray-200">
                         <td className="py-3 text-gray-800">2. Procedimientos de Arranque</td>
                         <td className="py-3 text-right text-gray-600">15%</td>
                         <td className="py-3 text-right font-bold">95%</td>
                       </tr>
                       <tr className="border-b border-gray-200">
                         <td className="py-3 text-gray-800">3. Maniobras de Carguío</td>
                         <td className="py-3 text-right text-gray-600">35%</td>
                         <td className="py-3 text-right font-bold">88%</td>
                       </tr>
                       <tr className="border-b border-gray-200">
                         <td className="py-3 text-gray-800">4. Descarga y Estacionamiento</td>
                         <td className="py-3 text-right text-gray-600">30%</td>
                         <td className="py-3 text-right font-bold">92%</td>
                       </tr>
                     </tbody>
                     <tfoot>
                       <tr className="bg-gray-100">
                         <td className="py-4 pl-2 font-bold text-lg">Calificación Final</td>
                         <td></td>
                         <td className="py-4 pr-2 font-bold text-lg text-right">93.5%</td>
                       </tr>
                     </tfoot>
                   </table>

                   <div className="mb-12">
                     <h3 className="text-sm font-bold uppercase text-gray-500 mb-2">Conclusiones y Observaciones</h3>
                     <p className="text-gray-700 leading-relaxed">
                       El alumno ha demostrado las competencias necesarias para operar el equipo de manera segura y eficiente. 
                       Se observa un excelente manejo de los protocolos de seguridad y comunicación radial. 
                       Se recomienda reforzar levemente la precisión en el aculatamiento durante la carga, aunque cumple con los estándares mínimos.
                     </p>
                   </div>

                   <div className="flex justify-between mt-20 pt-8 border-t border-gray-300">
                     <div className="text-center w-64">
                       <div className="h-16 border-b border-gray-400 mb-2"></div>
                       <div className="font-medium">Firma del Entrenador</div>
                     </div>
                     <div className="text-center w-64">
                       <div className="h-16 border-b border-gray-400 mb-2"></div>
                       <div className="font-medium">Firma del Alumno</div>
                     </div>
                   </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
