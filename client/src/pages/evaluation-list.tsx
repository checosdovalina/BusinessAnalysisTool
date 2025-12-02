import DashboardShell from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cycles } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, MoreHorizontal, FileText, PlayCircle } from "lucide-react";
import { Link } from "wouter";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function EvaluationList() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight font-heading">Evaluaciones</h2>
            <p className="text-muted-foreground">Gestiona los ciclos de entrenamiento y certificaciones.</p>
          </div>
          <Button className="bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all">
            <Plus className="mr-2 h-4 w-4" /> Nueva Evaluación
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nombre, alumno o ID..."
              className="pl-9 bg-card"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <Card className="border-border/60 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[300px]">Título del Ciclo</TableHead>
                <TableHead>Alumno</TableHead>
                <TableHead>Entrenador</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Progreso</TableHead>
                <TableHead>Fecha Inicio</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycles.map((cycle) => (
                <TableRow key={cycle.id} className="group">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/10 p-1.5 rounded text-primary group-hover:text-accent transition-colors">
                        <FileText className="h-4 w-4" />
                      </span>
                      {cycle.title}
                    </div>
                  </TableCell>
                  <TableCell>Juan Operador</TableCell>
                  <TableCell>Roberto Entrenador</TableCell>
                  <TableCell>
                    {cycle.status === "completed" ? (
                       <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 shadow-none">Completado</Badge>
                    ) : cycle.status === "in_progress" ? (
                       <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 shadow-none">En Progreso</Badge>
                    ) : (
                       <Badge variant="outline" className="text-muted-foreground">Pendiente</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent transition-all duration-500" 
                          style={{ width: `${cycle.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{cycle.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{cycle.startDate}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem>
                           <Link href={`/evaluations/${cycle.id}`}>
                             <a className="flex items-center w-full">
                               <PlayCircle className="mr-2 h-4 w-4" /> Continuar
                             </a>
                           </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardShell>
  );
}
