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
    { subject: 'Seguridad Eléctrica', A: 135, B: 150, fullMark: 150 },
    { subject: 'Maniobras', A: 110, B: 140, fullMark: 150 },
    { subject: 'Diagramas Unifilares', A: 140, B: 130, fullMark: 150 },
    { subject: 'Protocolos CFE', A: 120, B: 130, fullMark: 150 },
    { subject: 'Respuesta a Fallas', A: 105, B: 140, fullMark: 150 },
    { subject: 'SCADA', A: 90, B: 120, fullMark: 150 },
  ];

  // Mock data for Line Chart (Progress over time)
  const progressData = [
    { name: 'Ene', score: 75 },
    { name: 'Feb', score: 78 },
    { name: 'Mar', score: 82 },
    { name: 'Abr', score: 80 },
    { name: 'May', score: 88 },
    { name: 'Jun', score: 92 },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight font-heading">Reportes y Analítica Operativa</h2>
            <p className="text-muted-foreground">Generación de informes de desempeño en maniobras y control.</p>
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
                  <label className="text-sm font-medium">Ciclo de Entrenamiento</label>
                  <Select defaultValue="cy1">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar ciclo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cy1">Restablecimiento Línea 115kV</SelectItem>
                      <SelectItem value="cy2">Libranza Subestación</SelectItem>
                      <SelectItem value="all">Todos los ciclos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Operador</label>
                  <Select defaultValue="u3">
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar operador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="u3">Juan Operador</SelectItem>
                      <SelectItem value="u5">Pedro Técnico</SelectItem>
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
                   <div className="text-sm opacity-80">Cumplimiento Normativo</div>
                 </div>
                 <div className="pt-4 border-t border-primary-foreground/20">
                   <div className="text-sm font-medium">Estado: Certificado</div>
                   <div className="text-xs opacity-80 mt-1">Vigencia hasta Dic 2025</div>
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
                      <CardTitle>Radar de Competencias Operativas</CardTitle>
                      <CardDescription>Comparativa vs. Estándar de Red</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillsData}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                            <Radar
                              name="Operador"
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
                      <CardDescription>Histórico de simulacros últimos 6 meses</CardDescription>
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
                            <h4 className="text-sm font-semibold">Análisis de Diagrama Unifilar</h4>
                            <p className="text-xs text-muted-foreground mt-1">12 Oct 2024 • 10:30 AM</p>
                            <p className="text-sm mt-2 text-foreground/80">
                              El operador identificó correctamente la topología de la red y los puntos de apertura necesarios para aislar la falla bifásica.
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
                       <h1 className="text-3xl font-bold uppercase tracking-wider text-gray-900">Reporte de Entrenamiento</h1>
                       <p className="text-gray-600 mt-2">Operación de Sistemas de Potencia (OTS)</p>
                     </div>
                     <div className="text-right">
                       <div className="font-bold text-xl text-blue-900">Red Eléctrica Nacional</div>
                       <div className="text-sm text-gray-500">ID Reporte: #OTS-2024-892</div>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-8 mb-8">
                     <div>
                       <h3 className="text-sm font-bold uppercase text-gray-500 mb-2">Datos del Operador</h3>
                       <div className="text-lg font-medium">Juan Operador</div>
                       <div className="text-gray-600">RPE: 98765</div>
                       <div className="text-gray-600">Cargo: Operador de Tablero</div>
                     </div>
                     <div>
                       <h3 className="text-sm font-bold uppercase text-gray-500 mb-2">Datos de Evaluación</h3>
                       <div className="text-lg font-medium">Restablecimiento Línea 115kV</div>
                       <div className="text-gray-600">Fecha: 12 Oct 2024</div>
                       <div className="text-gray-600">Instructor: Roberto Instructor</div>
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
                         <td className="py-3 text-gray-800">1. Interpretación de Unifilar</td>
                         <td className="py-3 text-right text-gray-600">20%</td>
                         <td className="py-3 text-right font-bold">100%</td>
                       </tr>
                       <tr className="border-b border-gray-200">
                         <td className="py-3 text-gray-800">2. Secuencia de Apertura</td>
                         <td className="py-3 text-right text-gray-600">25%</td>
                         <td className="py-3 text-right font-bold">95%</td>
                       </tr>
                       <tr className="border-b border-gray-200">
                         <td className="py-3 text-gray-800">3. Verificación de Tensión</td>
                         <td className="py-3 text-right text-gray-600">25%</td>
                         <td className="py-3 text-right font-bold">100%</td>
                       </tr>
                       <tr className="border-b border-gray-200">
                         <td className="py-3 text-gray-800">4. Bloqueo y Etiquetado</td>
                         <td className="py-3 text-right text-gray-600">30%</td>
                         <td className="py-3 text-right font-bold">92%</td>
                       </tr>
                     </tbody>
                     <tfoot>
                       <tr className="bg-gray-100">
                         <td className="py-4 pl-2 font-bold text-lg">Calificación Final</td>
                         <td></td>
                         <td className="py-4 pr-2 font-bold text-lg text-right">96.5%</td>
                       </tr>
                     </tfoot>
                   </table>

                   <div className="mb-12">
                     <h3 className="text-sm font-bold uppercase text-gray-500 mb-2">Conclusiones y Observaciones</h3>
                     <p className="text-gray-700 leading-relaxed">
                       El operador demuestra un dominio sólido de los procedimientos de restablecimiento ante fallas bifásicas. 
                       La comunicación con cuadrillas de campo fue clara y siguió el protocolo fonético estándar. 
                       Se validó correctamente la ausencia de potencial antes de autorizar maniobras de tierra.
                     </p>
                   </div>

                   <div className="flex justify-between mt-20 pt-8 border-t border-gray-300">
                     <div className="text-center w-64">
                       <div className="h-16 border-b border-gray-400 mb-2"></div>
                       <div className="font-medium">Firma del Instructor</div>
                     </div>
                     <div className="text-center w-64">
                       <div className="h-16 border-b border-gray-400 mb-2"></div>
                       <div className="font-medium">Firma del Operador</div>
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
