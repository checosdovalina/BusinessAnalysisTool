import { useState } from "react";
import DashboardShell from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Building2, AlertTriangle, Globe, Phone, Mail, MapPin, Users, UserPlus, Eye, EyeOff } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { companiesAPI, usersAPI } from "@/lib/api";
import { toast } from "sonner";
import { Link } from "wouter";
import type { Company, User } from "@shared/schema";

interface CompanyFormData {
  name: string;
  description: string;
  industry: string;
  logo: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  active: boolean;
}

const initialFormData: CompanyFormData = {
  name: "",
  description: "",
  industry: "electric_utility",
  logo: "",
  address: "",
  city: "",
  state: "",
  country: "México",
  phone: "",
  email: "",
  website: "",
  active: true,
};

interface AdminFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const initialAdminFormData: AdminFormData = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
};

const industryLabels: Record<string, string> = {
  electric_utility: "Empresa Eléctrica",
  transmission: "Transmisión",
  distribution: "Distribución",
  generation: "Generación",
  renewable_energy: "Energías Renovables",
  oil_gas: "Petróleo y Gas",
  mining: "Minería",
  manufacturing: "Manufactura",
  government: "Gobierno",
  other: "Otro",
};

export default function Companies() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<CompanyFormData>(initialFormData);
  const [adminFormData, setAdminFormData] = useState<AdminFormData>(initialAdminFormData);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: () => companiesAPI.getAll(),
  });

  const filteredCompanies = companies.filter((c: Company) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.city?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesActive = activeFilter === "all" || (activeFilter === "active" ? c.active : !c.active);
    const matchesIndustry = industryFilter === "all" || c.industry === industryFilter;
    return matchesSearch && matchesActive && matchesIndustry;
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
      description: companyToEdit.description || "",
      industry: companyToEdit.industry || "electric_utility",
      logo: companyToEdit.logo || "",
      address: companyToEdit.address || "",
      city: companyToEdit.city || "",
      state: companyToEdit.state || "",
      country: companyToEdit.country || "México",
      phone: companyToEdit.phone || "",
      email: companyToEdit.email || "",
      website: companyToEdit.website || "",
      active: companyToEdit.active,
    });
    setIsEditOpen(true);
  };

  const handleOpenView = (company: Company) => {
    setSelectedCompany(company);
    setIsViewOpen(true);
  };

  const handleOpenDelete = (companyToDelete: Company) => {
    setSelectedCompany(companyToDelete);
    setIsDeleteOpen(true);
  };

  const handleOpenAddAdmin = (company: Company) => {
    setSelectedCompany(company);
    setAdminFormData(initialAdminFormData);
    setShowPassword(false);
    setIsAddAdminOpen(true);
  };

  const handleCreateAdmin = async () => {
    if (!selectedCompany) return;
    
    if (!adminFormData.firstName.trim() || !adminFormData.lastName.trim() || 
        !adminFormData.email.trim() || !adminFormData.password.trim()) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (adminFormData.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsAdminSubmitting(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("ots_token") || ""}`,
        },
        body: JSON.stringify({
          firstName: adminFormData.firstName.trim(),
          lastName: adminFormData.lastName.trim(),
          email: adminFormData.email.trim().toLowerCase(),
          password: adminFormData.password,
          role: "admin",
          companyId: selectedCompany.id,
          active: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al crear administrador");
      }
      
      toast.success(`Administrador creado para ${selectedCompany.name}`);
      setIsAddAdminOpen(false);
      setAdminFormData(initialAdminFormData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear el administrador");
    } finally {
      setIsAdminSubmitting(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Por favor ingresa el nombre de la empresa");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("ots_token") || ""}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description || null,
          industry: formData.industry,
          logo: formData.logo || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          country: formData.country || "México",
          phone: formData.phone || null,
          email: formData.email || null,
          website: formData.website || null,
          active: formData.active,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al crear empresa");
      }
      
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
      const response = await fetch(`/api/companies/${selectedCompany.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("ots_token") || ""}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description || null,
          industry: formData.industry,
          logo: formData.logo || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          country: formData.country || null,
          phone: formData.phone || null,
          email: formData.email || null,
          website: formData.website || null,
          active: formData.active,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar empresa");
      }
      
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
      const response = await fetch(`/api/companies/${selectedCompany.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("ots_token") || ""}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al eliminar empresa");
      }
      
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
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="contact">Contacto</TabsTrigger>
        <TabsTrigger value="location">Ubicación</TabsTrigger>
      </TabsList>
      
      <TabsContent value="general" className="space-y-4 mt-4">
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
          <label className="text-sm font-medium">Descripción</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Breve descripción de la empresa..."
            className="mt-1"
            rows={3}
            data-testid="input-company-description"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Industria / Sector</label>
          <select
            value={formData.industry}
            onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
            className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-md"
            data-testid="select-company-industry"
          >
            {Object.entries(industryLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="text-sm font-medium">URL del Logo</label>
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
      </TabsContent>
      
      <TabsContent value="contact" className="space-y-4 mt-4">
        <div>
          <label className="text-sm font-medium">Teléfono</label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+52 (55) 1234-5678"
            className="mt-1"
            data-testid="input-company-phone"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Correo Electrónico</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="contacto@empresa.com"
            className="mt-1"
            data-testid="input-company-email"
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Sitio Web</label>
          <Input
            value={formData.website}
            onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
            placeholder="https://www.empresa.com"
            className="mt-1"
            data-testid="input-company-website"
          />
        </div>
      </TabsContent>
      
      <TabsContent value="location" className="space-y-4 mt-4">
        <div>
          <label className="text-sm font-medium">Dirección</label>
          <Input
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            placeholder="Av. Insurgentes Sur 1234, Col. Del Valle"
            className="mt-1"
            data-testid="input-company-address"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Ciudad</label>
            <Input
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              placeholder="Ciudad de México"
              className="mt-1"
              data-testid="input-company-city"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Estado</label>
            <Input
              value={formData.state}
              onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
              placeholder="CDMX"
              className="mt-1"
              data-testid="input-company-state"
            />
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium">País</label>
          <Input
            value={formData.country}
            onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
            placeholder="México"
            className="mt-1"
            data-testid="input-company-country"
          />
        </div>
      </TabsContent>
    </Tabs>
  );

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Empresas</h1>
            <p className="text-muted-foreground mt-2">
              Total: <span className="font-semibold text-foreground">{companies.length}</span> empresas registradas
            </p>
          </div>
          <Button onClick={handleOpenCreate} className="gap-2" data-testid="button-create-company">
            <Plus className="h-4 w-4" />
            Nueva Empresa
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Building2 className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{companies.filter((c: Company) => c.active).length}</p>
                  <p className="text-xs text-muted-foreground">Activas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Building2 className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{companies.filter((c: Company) => !c.active).length}</p>
                  <p className="text-xs text-muted-foreground">Inactivas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Globe className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{companies.filter((c: Company) => c.industry === "electric_utility").length}</p>
                  <p className="text-xs text-muted-foreground">Eléctricas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Users className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{companies.length}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o ciudad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                  data-testid="input-search-company"
                />
              </div>
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-md text-sm"
                data-testid="select-filter-industry"
              >
                <option value="all">Todas las industrias</option>
                {Object.entries(industryLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
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
                    <TableHead className="font-semibold">Empresa</TableHead>
                    <TableHead className="font-semibold">Industria</TableHead>
                    <TableHead className="font-semibold">Ubicación</TableHead>
                    <TableHead className="font-semibold">Contacto</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="text-right font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {companies.length === 0 ? "No hay empresas registradas" : "No hay resultados"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCompanies.map((company: Company) => (
                      <TableRow key={company.id} className="hover:bg-muted/50 border-b border-border/30" data-testid={`row-company-${company.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {company.logo ? (
                              <img src={company.logo} alt={company.name} className="h-10 w-10 rounded-lg object-cover border border-border/50" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium" data-testid={`text-company-name-${company.id}`}>{company.name}</p>
                              {company.description && (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{company.description}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-primary/5">
                            {industryLabels[company.industry || "other"]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {company.city || company.state ? (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {[company.city, company.state].filter(Boolean).join(", ")}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {company.phone && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {company.phone}
                              </div>
                            )}
                            {company.email && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {company.email}
                              </div>
                            )}
                            {!company.phone && !company.email && (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
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
                              <DropdownMenuItem onClick={() => handleOpenView(company)}>
                                <Building2 className="h-4 w-4 mr-2" />
                                Ver Detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenAddAdmin(company)} data-testid={`menu-add-admin-${company.id}`}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Asignar Administrador
                              </DropdownMenuItem>
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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Crear Nueva Empresa</DialogTitle>
              <DialogDescription>
                Ingresa los detalles de la nueva empresa
              </DialogDescription>
            </DialogHeader>
            {formContent}
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={isSubmitting} data-testid="button-create-submit">
                {isSubmitting ? "Creando..." : "Crear Empresa"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Empresa</DialogTitle>
              <DialogDescription>
                Actualiza los detalles de la empresa
              </DialogDescription>
            </DialogHeader>
            {formContent}
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
              <Button onClick={handleUpdate} disabled={isSubmitting} data-testid="button-update-submit">
                {isSubmitting ? "Actualizando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalles de Empresa</DialogTitle>
            </DialogHeader>
            {selectedCompany && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {selectedCompany.logo ? (
                    <img src={selectedCompany.logo} alt={selectedCompany.name} className="h-16 w-16 rounded-lg object-cover" />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold">{selectedCompany.name}</h3>
                    <Badge variant="outline" className={selectedCompany.active ? "bg-green-500/10 text-green-400" : ""}>
                      {selectedCompany.active ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                </div>
                
                {selectedCompany.description && (
                  <p className="text-sm text-muted-foreground">{selectedCompany.description}</p>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Industria</p>
                    <p className="font-medium">{industryLabels[selectedCompany.industry || "other"]}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Creada</p>
                    <p className="font-medium">{formatDate(selectedCompany.createdAt)}</p>
                  </div>
                </div>
                
                {(selectedCompany.address || selectedCompany.city) && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      {selectedCompany.address && <p>{selectedCompany.address}</p>}
                      <p>{[selectedCompany.city, selectedCompany.state, selectedCompany.country].filter(Boolean).join(", ")}</p>
                    </div>
                  </div>
                )}
                
                {selectedCompany.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p>{selectedCompany.phone}</p>
                  </div>
                )}
                
                {selectedCompany.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p>{selectedCompany.email}</p>
                  </div>
                )}
                
                {selectedCompany.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {selectedCompany.website}
                    </a>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewOpen(false)}>Cerrar</Button>
              <Button onClick={() => { setIsViewOpen(false); handleOpenEdit(selectedCompany!); }}>
                Editar
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

        {/* Add Admin Dialog */}
        <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Asignar Administrador</DialogTitle>
              <DialogDescription>
                Crea un nuevo administrador para {selectedCompany?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nombre *</label>
                  <Input
                    value={adminFormData.firstName}
                    onChange={(e) => setAdminFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Juan"
                    className="mt-1"
                    data-testid="input-admin-firstname"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Apellido *</label>
                  <Input
                    value={adminFormData.lastName}
                    onChange={(e) => setAdminFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="García"
                    className="mt-1"
                    data-testid="input-admin-lastname"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Correo Electrónico *</label>
                <Input
                  type="email"
                  value={adminFormData.email}
                  onChange={(e) => setAdminFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="admin@empresa.com"
                  className="mt-1"
                  data-testid="input-admin-email"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Contraseña *</label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={adminFormData.password}
                    onChange={(e) => setAdminFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Mínimo 6 caracteres"
                    className="pr-10"
                    data-testid="input-admin-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-sm text-blue-400">
                  Este usuario tendrá rol de <strong>Administrador</strong> y podrá gestionar operadores, ciclos y evaluaciones de {selectedCompany?.name}.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddAdminOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateAdmin} disabled={isAdminSubmitting} data-testid="button-create-admin-submit">
                {isAdminSubmitting ? "Creando..." : "Crear Administrador"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  );
}
