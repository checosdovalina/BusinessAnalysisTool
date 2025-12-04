import { useState } from "react";
import DashboardShell from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Building2, AlertTriangle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { companiesAPI } from "@/lib/api";
import { toast } from "sonner";
import { Link } from "wouter";
import type { Company } from "@shared/schema";

interface CompanyFormData {
  name: string;
  logo: string;
  active: boolean;
}

const initialFormData: CompanyFormData = {
  name: "",
  logo: "",
  active: true,
};

export default function Companies() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<CompanyFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: () => companiesAPI.getAll(),
  });

  const filteredCompanies = companies.filter((c: Company) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActive = activeFilter === "all" || (activeFilter === "active" ? c.active : !c.active);
    return matchesSearch && matchesActive;
  });

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedCompany(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (companyToEdit: Company) => {
    setSelectedCompany(companyToEdit);
    setFormData({
      name: companyToEdit.name,
      logo: companyToEdit.logo || "",
      active: companyToEdit.active,
    });
    setIsEditOpen(true);
  };

  const handleOpenDelete = (companyToDelete: Company) => {
    setSelectedCompany(companyToDelete);
    setIsDeleteOpen(true);
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Por favor ingresa el nombre de la empresa");
      return;
    }

    setIsSubmitting(true);
    try {
      await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("ots_token") || ""}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          logo: formData.logo || null,
          active: formData.active,
        }),
      });
      
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Empresa creada exitosamente");
      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Error al crear la empresa");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedCompany || !formData.name.trim()) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    setIsSubmitting(true);
    try {
      await fetch(`/api/companies/${selectedCompany.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("ots_token") || ""}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          logo: formData.logo || null,
          active: formData.active,
        }),
      });
      
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Empresa actualizada exitosamente");
      setIsEditOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Error al actualizar la empresa");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCompany) return;

    setIsSubmitting(true);
    try {
      await fetch(`/api/companies/${selectedCompany.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("ots_token") || ""}`,
        },
      });
      
      await queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Empresa eliminada exitosamente");
      setIsDeleteOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Error al eliminar la empresa");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const canManageCompanies = user?.role === "super_admin";

  if (!canManageCompanies) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md p-8 text-center border-destructive/30 bg-destructive/5">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Acceso Restringido</h2>
            <p className="text-muted-foreground mb-4">
              No tienes permisos para acceder a esta sección. Solo los super administradores pueden gestionar empresas.
            </p>
            <Link href="/">
              <Button variant="outline">Volver al Inicio</Button>
            </Link>
          </Card>
        </div>
      </DashboardShell>
    );
  }

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="h-12 w-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Cargando empresas...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const formContent = (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Nombre de la Empresa *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Ej: Red Eléctrica Nacional"
          className="mt-1"
          data-testid="input-company-name"
        />
      </div>
      <div>
        <label className="text-sm font-medium">URL del Logo (opcional)</label>
        <Input
          value={formData.logo}
          onChange={(e) => setFormData(prev => ({ ...prev, logo: e.target.value }))}
          placeholder="https://ejemplo.com/logo.png"
          className="mt-1"
          data-testid="input-company-logo"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.active}
          onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
          id="active"
          data-testid="checkbox-company-active"
        />
        <label htmlFor="active" className="text-sm font-medium cursor-pointer">
          Empresa Activa
        </label>
      </div>
    </div>
  );

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Empresas</h1>
            <p className="text-muted-foreground mt-2">
              Total de empresas: <span className="font-semibold text-foreground">{companies.length}</span>
            </p>
          </div>
          <Button onClick={handleOpenCreate} className="gap-2" data-testid="button-create-company">
            <Plus className="h-4 w-4" />
            Nueva Empresa
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  data-testid="input-search-company"
                />
              </div>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-md text-sm"
                data-testid="select-filter-active"
              >
                <option value="all">Todas</option>
                <option value="active">Activas</option>
                <option value="inactive">Inactivas</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-b border-border/50">
                    <TableHead className="font-semibold">Nombre</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold">Creada</TableHead>
                    <TableHead className="text-right font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {companies.length === 0 ? "No hay empresas registradas" : "No hay resultados"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCompanies.map((company: Company) => (
                      <TableRow key={company.id} className="hover:bg-muted/50 border-b border-border/30 data-testid-row-company" data-testid={`row-company-${company.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {company.logo ? (
                              <img src={company.logo} alt={company.name} className="h-8 w-8 rounded object-cover" />
                            ) : (
                              <Building2 className="h-8 w-8 text-muted-foreground" />
                            )}
                            <span className="font-medium" data-testid={`text-company-name-${company.id}`}>{company.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={company.active ? "bg-green-500/10 text-green-400 border-green-500/30" : "bg-muted text-muted-foreground"}
                            data-testid={`badge-status-${company.id}`}
                          >
                            {company.active ? "Activa" : "Inactiva"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm" data-testid={`text-date-${company.id}`}>
                          {formatDate(company.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" data-testid={`button-menu-${company.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleOpenEdit(company)} data-testid={`menu-edit-${company.id}`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenDelete(company)} className="text-destructive" data-testid={`menu-delete-${company.id}`}>
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

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nueva Empresa</DialogTitle>
              <DialogDescription>
                Ingresa los detalles de la nueva empresa
              </DialogDescription>
            </DialogHeader>
            {formContent}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={isSubmitting} data-testid="button-create-submit">
                {isSubmitting ? "Creando..." : "Crear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Empresa</DialogTitle>
              <DialogDescription>
                Actualiza los detalles de la empresa
              </DialogDescription>
            </DialogHeader>
            {formContent}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
              <Button onClick={handleUpdate} disabled={isSubmitting} data-testid="button-update-submit">
                {isSubmitting ? "Actualizando..." : "Actualizar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Eliminar Empresa</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas eliminar esta empresa? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            {selectedCompany && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 my-4">
                <p className="font-semibold text-foreground">{selectedCompany.name}</p>
                <p className="text-sm text-muted-foreground">Se eliminarán todos los datos asociados</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting} data-testid="button-delete-submit">
                {isSubmitting ? "Eliminando..." : "Eliminar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  );
}
