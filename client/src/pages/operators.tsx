import { useState } from "react";
import DashboardShell from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MoreHorizontal, Edit, Trash2, UserPlus, GraduationCap, Shield, UserCog, Crown, AlertTriangle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usersAPI } from "@/lib/api";
import { toast } from "sonner";
import { Link } from "wouter";
import type { User } from "@shared/schema";

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: "student" | "trainer" | "admin" | "super_admin";
  avatar: string;
}

const initialFormData: UserFormData = {
  name: "",
  email: "",
  password: "",
  role: "student",
  avatar: "",
};

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrador",
  trainer: "Entrenador",
  student: "Estudiante",
};

const roleIcons: Record<string, React.ReactNode> = {
  super_admin: <Crown className="h-4 w-4" />,
  admin: <Shield className="h-4 w-4" />,
  trainer: <UserCog className="h-4 w-4" />,
  student: <GraduationCap className="h-4 w-4" />,
};

const roleBadgeColors: Record<string, string> = {
  super_admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  admin: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  trainer: "bg-accent/20 text-accent border-accent/30",
  student: "bg-green-500/20 text-green-400 border-green-500/30",
};

export default function Operators() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users", user?.companyId],
    queryFn: () => user?.companyId ? usersAPI.getByCompany(user.companyId) : Promise.resolve([]),
    enabled: !!user?.companyId,
  });

  const filteredUsers = users.filter((u: User) => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedUser(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (userToEdit: User) => {
    setSelectedUser(userToEdit);
    setFormData({
      name: userToEdit.name,
      email: userToEdit.email,
      password: "",
      role: userToEdit.role as UserFormData["role"],
      avatar: userToEdit.avatar || "",
    });
    setIsEditOpen(true);
  };

  const handleOpenDelete = (userToDelete: User) => {
    setSelectedUser(userToDelete);
    setIsDeleteOpen(true);
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    if (!user?.companyId) {
      toast.error("Error: No se encontró la empresa");
      return;
    }

    setIsSubmitting(true);
    try {
      await usersAPI.create({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        companyId: user.companyId,
        avatar: formData.avatar || undefined,
      });
      
      await queryClient.invalidateQueries({ queryKey: ["users", user.companyId] });
      toast.success("Usuario creado exitosamente");
      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear usuario");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedUser || !formData.name.trim() || !formData.email.trim()) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData: Partial<{ name: string; email: string; password: string; role: string; avatar?: string }> = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        avatar: formData.avatar || undefined,
      };

      if (formData.password.trim()) {
        updateData.password = formData.password;
      }

      await usersAPI.update(selectedUser.id, updateData);
      
      await queryClient.invalidateQueries({ queryKey: ["users", user?.companyId] });
      toast.success("Usuario actualizado exitosamente");
      setIsEditOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar usuario");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    if (selectedUser.id === user?.id) {
      toast.error("No puedes eliminar tu propia cuenta");
      return;
    }

    setIsSubmitting(true);
    try {
      await usersAPI.delete(selectedUser.id);
      await queryClient.invalidateQueries({ queryKey: ["users", user?.companyId] });
      toast.success("Usuario eliminado exitosamente");
      setIsDeleteOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar usuario");
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

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const userCounts = {
    total: users.length,
    students: users.filter((u: User) => u.role === "student").length,
    trainers: users.filter((u: User) => u.role === "trainer").length,
    admins: users.filter((u: User) => u.role === "admin" || u.role === "super_admin").length,
  };

  const canManageUsers = user?.role === "admin" || user?.role === "super_admin";

  if (!canManageUsers) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md p-8 text-center border-destructive/30 bg-destructive/5">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Acceso Restringido</h2>
            <p className="text-muted-foreground mb-4">
              No tienes permisos para acceder a esta sección. Solo los administradores pueden gestionar usuarios.
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
            <p className="text-muted-foreground">Cargando usuarios...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const formContent = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="text-sm font-medium">Nombre Completo *</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ej: Juan Pérez García"
            className="mt-1"
            data-testid="input-user-name"
          />
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium">Correo Electrónico *</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="usuario@empresa.com"
            className="mt-1"
            data-testid="input-user-email"
          />
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium">
            {selectedUser ? "Nueva Contraseña (dejar vacío para mantener)" : "Contraseña *"}
          </label>
          <Input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            placeholder="••••••••"
            className="mt-1"
            data-testid="input-user-password"
          />
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium">Rol *</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserFormData["role"] }))}
            className="mt-1 w-full px-3 py-2 bg-background border border-border rounded-md"
            data-testid="select-user-role"
          >
            <option value="student">Estudiante / Operador</option>
            <option value="trainer">Entrenador / Instructor</option>
            <option value="admin">Administrador</option>
            {user?.role === "super_admin" && (
              <option value="super_admin">Super Administrador</option>
            )}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            {formData.role === "student" && "Puede realizar evaluaciones y ver sus resultados."}
            {formData.role === "trainer" && "Puede crear y evaluar ciclos de entrenamiento."}
            {formData.role === "admin" && "Acceso completo a la gestión de la empresa."}
            {formData.role === "super_admin" && "Acceso total al sistema incluyendo múltiples empresas."}
          </p>
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium">URL de Avatar (opcional)</label>
          <Input
            value={formData.avatar}
            onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
            placeholder="https://ejemplo.com/avatar.jpg"
            className="mt-1"
            data-testid="input-user-avatar"
          />
        </div>
      </div>
    </div>
  );

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight font-heading">Operadores</h2>
            <p className="text-muted-foreground">Gestiona los usuarios y sus roles en el sistema.</p>
          </div>
          <Button 
            className="bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all"
            onClick={handleOpenCreate}
            data-testid="button-new-user"
          >
            <UserPlus className="mr-2 h-4 w-4" /> Nuevo Usuario
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <GraduationCap className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userCounts.students}</p>
                  <p className="text-xs text-muted-foreground">Estudiantes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <UserCog className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userCounts.trainers}</p>
                  <p className="text-xs text-muted-foreground">Entrenadores</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Shield className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userCounts.admins}</p>
                  <p className="text-xs text-muted-foreground">Administradores</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Plus className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userCounts.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nombre o correo..."
              className="pl-9 bg-card"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-users"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-card border border-border rounded-md text-sm"
            data-testid="filter-role"
          >
            <option value="all">Todos los roles</option>
            <option value="student">Estudiantes</option>
            <option value="trainer">Entrenadores</option>
            <option value="admin">Administradores</option>
            <option value="super_admin">Super Admins</option>
          </select>
        </div>

        <Card className="border-border/50 bg-card/30 backdrop-blur">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead>Usuario</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u: User) => (
                <TableRow key={u.id} className="border-border/30 hover:bg-accent/5" data-testid={`row-user-${u.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-medium text-sm">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          getInitials(u.name)
                        )}
                      </div>
                      <div>
                        <p className="font-medium" data-testid={`text-user-name-${u.id}`}>{u.name}</p>
                        {u.id === user?.id && (
                          <span className="text-xs text-accent">(Tú)</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground" data-testid={`text-user-email-${u.id}`}>
                    {u.email}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`flex items-center gap-1.5 w-fit ${roleBadgeColors[u.role]}`}
                      data-testid={`badge-user-role-${u.id}`}
                    >
                      {roleIcons[u.role]}
                      {roleLabels[u.role]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(u.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`menu-user-${u.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleOpenEdit(u)} data-testid={`edit-user-${u.id}`}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleOpenDelete(u)}
                          disabled={u.id === user?.id}
                          data-testid={`delete-user-${u.id}`}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchTerm || roleFilter !== "all" 
                      ? "No se encontraron usuarios con ese criterio" 
                      : "No hay usuarios registrados"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-accent" />
              Nuevo Usuario
            </DialogTitle>
            <DialogDescription>Agrega un nuevo usuario al sistema.</DialogDescription>
          </DialogHeader>
          {formContent}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreate}
              disabled={isSubmitting}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              data-testid="button-save-new-user"
            >
              {isSubmitting ? "Creando..." : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-accent" />
              Editar Usuario
            </DialogTitle>
            <DialogDescription>Modifica los datos del usuario.</DialogDescription>
          </DialogHeader>
          {formContent}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdate}
              disabled={isSubmitting}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              data-testid="button-save-edit-user"
            >
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar usuario?</DialogTitle>
            <DialogDescription>
              Esta acción eliminará permanentemente al usuario "{selectedUser?.name}". Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
              data-testid="button-confirm-delete-user"
            >
              {isSubmitting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
