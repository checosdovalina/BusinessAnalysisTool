import { useState, useEffect } from "react";
import DashboardShell from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  User, Building2, Settings2, Save, RefreshCw, 
  Lock, Bell, Palette, Mail, Phone, Globe,
  Percent, Clock, Target, FileText, Eye, EyeOff
} from "lucide-react";
import type { CompanySettings, UserPreferences } from "@shared/schema";

const API_BASE = "";

async function fetcher<T>(url: string): Promise<T> {
  const token = localStorage.getItem("auth_token");
  const response = await fetch(`${API_BASE}/api${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Request failed");
  }
  return response.json();
}

async function patcher<T>(url: string, data: Record<string, unknown>): Promise<T> {
  const token = localStorage.getItem("auth_token");
  const response = await fetch(`${API_BASE}/api${url}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Request failed");
  }
  return response.json();
}

export default function SettingsPage() {
  const { user, company } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    avatar: user?.avatar || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [companySettingsData, setCompanySettingsData] = useState<Partial<CompanySettings>>({});
  const [userPreferencesData, setUserPreferencesData] = useState<Partial<UserPreferences>>({});
  
  const { data: companySettings, isLoading: loadingCompanySettings } = useQuery({
    queryKey: ["companySettings", user?.companyId],
    queryFn: () => user?.companyId ? fetcher<CompanySettings>(`/settings/company/${user.companyId}`) : Promise.resolve(null),
    enabled: !!user?.companyId && (user?.role === "admin" || user?.role === "super_admin"),
  });
  
  const { data: userPreferences, isLoading: loadingUserPreferences } = useQuery({
    queryKey: ["userPreferences", user?.id],
    queryFn: () => user?.id ? fetcher<UserPreferences>(`/settings/user/${user.id}`) : Promise.resolve(null),
    enabled: !!user?.id,
  });
  
  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        name: user.name || "",
        avatar: user.avatar || "",
      }));
    }
  }, [user]);
  
  useEffect(() => {
    if (companySettings) {
      setCompanySettingsData(companySettings);
    }
  }, [companySettings]);
  
  useEffect(() => {
    if (userPreferences) {
      setUserPreferencesData(userPreferences);
    }
  }, [userPreferences]);
  
  const handleSaveProfile = async () => {
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      toast.error("Las contraseñas nuevas no coinciden");
      return;
    }
    
    setIsSaving(true);
    try {
      const updateData: Record<string, unknown> = {
        name: profileData.name,
        avatar: profileData.avatar || null,
      };
      
      if (profileData.newPassword) {
        updateData.currentPassword = profileData.currentPassword;
        updateData.newPassword = profileData.newPassword;
      }
      
      const updatedUser = await patcher("/profile", updateData);
      localStorage.setItem("ots_user", JSON.stringify(updatedUser));
      setProfileData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      toast.success("Perfil actualizado correctamente. Recarga la página para ver los cambios.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar perfil");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSaveCompanySettings = async () => {
    if (!user?.companyId) return;
    
    setIsSaving(true);
    try {
      await patcher(`/settings/company/${user.companyId}`, companySettingsData);
      queryClient.invalidateQueries({ queryKey: ["companySettings"] });
      toast.success("Configuración de empresa actualizada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar configuración");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSaveUserPreferences = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      await patcher(`/settings/user/${user.id}`, userPreferencesData);
      queryClient.invalidateQueries({ queryKey: ["userPreferences"] });
      toast.success("Preferencias guardadas");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar preferencias");
    } finally {
      setIsSaving(false);
    }
  };
  
  const canEditCompanySettings = user?.role === "admin" || user?.role === "super_admin";
  
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Settings2 className="h-8 w-8 text-accent" />
            Configuración
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tu perfil, preferencias y configuración del sistema
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 border border-border/50">
            <TabsTrigger value="profile" className="flex items-center gap-2" data-testid="tab-profile">
              <User className="h-4 w-4" />
              Mi Perfil
            </TabsTrigger>
            {canEditCompanySettings && (
              <TabsTrigger value="company" className="flex items-center gap-2" data-testid="tab-company">
                <Building2 className="h-4 w-4" />
                Empresa
              </TabsTrigger>
            )}
            {canEditCompanySettings && (
              <TabsTrigger value="system" className="flex items-center gap-2" data-testid="tab-system">
                <Settings2 className="h-4 w-4" />
                Sistema
              </TabsTrigger>
            )}
            <TabsTrigger value="preferences" className="flex items-center gap-2" data-testid="tab-preferences">
              <Bell className="h-4 w-4" />
              Preferencias
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-accent" />
                  Información Personal
                </CardTitle>
                <CardDescription>
                  Actualiza tu nombre y foto de perfil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">Nombre completo</Label>
                    <Input
                      id="profile-name"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Tu nombre"
                      data-testid="input-profile-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-email">Correo electrónico</Label>
                    <Input
                      id="profile-email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted/50"
                      data-testid="input-profile-email"
                    />
                    <p className="text-xs text-muted-foreground">El correo no puede ser modificado</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-avatar">URL de Avatar</Label>
                  <Input
                    id="profile-avatar"
                    value={profileData.avatar}
                    onChange={(e) => setProfileData(prev => ({ ...prev, avatar: e.target.value }))}
                    placeholder="https://ejemplo.com/avatar.jpg"
                    data-testid="input-profile-avatar"
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-accent" />
                  Cambiar Contraseña
                </CardTitle>
                <CardDescription>
                  Actualiza tu contraseña de acceso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Contraseña actual</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={profileData.currentPassword}
                      onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="••••••••"
                      data-testid="input-current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nueva contraseña</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={profileData.newPassword}
                        onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="••••••••"
                        data-testid="input-new-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar contraseña</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={profileData.confirmPassword}
                      onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="••••••••"
                      data-testid="input-confirm-password"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end">
              <Button 
                onClick={handleSaveProfile} 
                disabled={isSaving}
                data-testid="button-save-profile"
              >
                {isSaving ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Guardando...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> Guardar Cambios</>
                )}
              </Button>
            </div>
          </TabsContent>
          
          {canEditCompanySettings && (
            <TabsContent value="company" className="space-y-6">
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-accent" />
                    Información de la Empresa
                  </CardTitle>
                  <CardDescription>
                    {company?.name || "Configuración de la empresa"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name" className="flex items-center gap-2">
                        <User className="h-4 w-4" /> Nombre del contacto
                      </Label>
                      <Input
                        id="contact-name"
                        value={companySettingsData.contactName || ""}
                        onChange={(e) => setCompanySettingsData(prev => ({ ...prev, contactName: e.target.value }))}
                        placeholder="Nombre del responsable"
                        data-testid="input-contact-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" /> Correo de contacto
                      </Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={companySettingsData.contactEmail || ""}
                        onChange={(e) => setCompanySettingsData(prev => ({ ...prev, contactEmail: e.target.value }))}
                        placeholder="contacto@empresa.com"
                        data-testid="input-contact-email"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" /> Teléfono
                      </Label>
                      <Input
                        id="contact-phone"
                        value={companySettingsData.contactPhone || ""}
                        onChange={(e) => setCompanySettingsData(prev => ({ ...prev, contactPhone: e.target.value }))}
                        placeholder="+52 55 1234 5678"
                        data-testid="input-contact-phone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supervisor-email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" /> Email Supervisor (Reportes)
                      </Label>
                      <Input
                        id="supervisor-email"
                        type="email"
                        value={companySettingsData.supervisorEmailDefault || ""}
                        onChange={(e) => setCompanySettingsData(prev => ({ ...prev, supervisorEmailDefault: e.target.value }))}
                        placeholder="supervisor@empresa.com"
                        data-testid="input-supervisor-email"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-accent" />
                    Personalización Visual
                  </CardTitle>
                  <CardDescription>
                    Colores de marca para reportes y documentos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="primary-color">Color Primario</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primary-color"
                          type="color"
                          value={companySettingsData.primaryColor || "#00F0FF"}
                          onChange={(e) => setCompanySettingsData(prev => ({ ...prev, primaryColor: e.target.value }))}
                          className="w-12 h-10 p-1 cursor-pointer"
                          data-testid="input-primary-color"
                        />
                        <Input
                          value={companySettingsData.primaryColor || "#00F0FF"}
                          onChange={(e) => setCompanySettingsData(prev => ({ ...prev, primaryColor: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondary-color">Color Secundario</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondary-color"
                          type="color"
                          value={companySettingsData.secondaryColor || "#0b0f19"}
                          onChange={(e) => setCompanySettingsData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                          className="w-12 h-10 p-1 cursor-pointer"
                          data-testid="input-secondary-color"
                        />
                        <Input
                          value={companySettingsData.secondaryColor || "#0b0f19"}
                          onChange={(e) => setCompanySettingsData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accent-color">Color de Acento</Label>
                      <div className="flex gap-2">
                        <Input
                          id="accent-color"
                          type="color"
                          value={companySettingsData.accentColor || "#3B82F6"}
                          onChange={(e) => setCompanySettingsData(prev => ({ ...prev, accentColor: e.target.value }))}
                          className="w-12 h-10 p-1 cursor-pointer"
                          data-testid="input-accent-color"
                        />
                        <Input
                          value={companySettingsData.accentColor || "#3B82F6"}
                          onChange={(e) => setCompanySettingsData(prev => ({ ...prev, accentColor: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-accent" />
                    Texto de Reportes
                  </CardTitle>
                  <CardDescription>
                    Personaliza el encabezado y pie de página de los reportes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="report-header">Encabezado de Reportes</Label>
                    <Textarea
                      id="report-header"
                      value={companySettingsData.reportHeaderText || ""}
                      onChange={(e) => setCompanySettingsData(prev => ({ ...prev, reportHeaderText: e.target.value }))}
                      placeholder="Texto que aparecerá en el encabezado de los reportes..."
                      rows={3}
                      data-testid="input-report-header"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="report-footer">Pie de Página de Reportes</Label>
                    <Textarea
                      id="report-footer"
                      value={companySettingsData.reportFooterText || ""}
                      onChange={(e) => setCompanySettingsData(prev => ({ ...prev, reportFooterText: e.target.value }))}
                      placeholder="Texto que aparecerá en el pie de página..."
                      rows={3}
                      data-testid="input-report-footer"
                    />
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveCompanySettings} 
                  disabled={isSaving || loadingCompanySettings}
                  data-testid="button-save-company"
                >
                  {isSaving ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Guardando...</>
                  ) : (
                    <><Save className="h-4 w-4 mr-2" /> Guardar Configuración</>
                  )}
                </Button>
              </div>
            </TabsContent>
          )}
          
          {canEditCompanySettings && (
            <TabsContent value="system" className="space-y-6">
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-accent" />
                    Parámetros de Evaluación
                  </CardTitle>
                  <CardDescription>
                    Configura los valores predeterminados para las evaluaciones
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Calificación Mínima Aprobatoria</Label>
                        <p className="text-sm text-muted-foreground">
                          Porcentaje mínimo para aprobar una evaluación
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Slider
                          value={[companySettingsData.defaultMinPassingScore || 70]}
                          onValueChange={([value]) => setCompanySettingsData(prev => ({ ...prev, defaultMinPassingScore: value }))}
                          min={50}
                          max={100}
                          step={5}
                          className="w-40"
                          data-testid="slider-min-score"
                        />
                        <span className="text-lg font-bold text-accent min-w-[3rem] text-right">
                          {companySettingsData.defaultMinPassingScore || 70}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Horas de Entrenamiento Anuales</Label>
                        <p className="text-sm text-muted-foreground">
                          Objetivo de horas por operador al año
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Input
                          type="number"
                          value={companySettingsData.defaultTrainingHoursPerYear || 40}
                          onChange={(e) => setCompanySettingsData(prev => ({ ...prev, defaultTrainingHoursPerYear: parseFloat(e.target.value) }))}
                          className="w-24 text-center"
                          min={0}
                          data-testid="input-training-hours"
                        />
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-4 w-4" /> horas
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Sesiones Anuales</Label>
                        <p className="text-sm text-muted-foreground">
                          Número de sesiones objetivo por año
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Input
                          type="number"
                          value={companySettingsData.defaultSessionsPerYear || 12}
                          onChange={(e) => setCompanySettingsData(prev => ({ ...prev, defaultSessionsPerYear: parseInt(e.target.value) }))}
                          className="w-24 text-center"
                          min={0}
                          data-testid="input-sessions-year"
                        />
                        <span className="text-muted-foreground">sesiones</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="h-5 w-5 text-accent" />
                    Configuración de Penalizaciones
                  </CardTitle>
                  <CardDescription>
                    Parámetros para el sistema de penalización por reprobación
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Habilitar Penalizaciones</Label>
                      <p className="text-sm text-muted-foreground">
                        Aplicar penalización en reintentos de evaluación
                      </p>
                    </div>
                    <Switch
                      checked={companySettingsData.enablePenalties ?? true}
                      onCheckedChange={(checked) => setCompanySettingsData(prev => ({ ...prev, enablePenalties: checked }))}
                      data-testid="switch-enable-penalties"
                    />
                  </div>
                  
                  {companySettingsData.enablePenalties !== false && (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">Porcentaje de Penalización</Label>
                          <p className="text-sm text-muted-foreground">
                            Reducción de calificación por reprobación previa
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[companySettingsData.penaltyPercentage || 30]}
                            onValueChange={([value]) => setCompanySettingsData(prev => ({ ...prev, penaltyPercentage: value }))}
                            min={0}
                            max={50}
                            step={5}
                            className="w-40"
                            data-testid="slider-penalty-percentage"
                          />
                          <span className="text-lg font-bold text-orange-400 min-w-[3rem] text-right">
                            {companySettingsData.penaltyPercentage || 30}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">Máximo de Reintentos</Label>
                          <p className="text-sm text-muted-foreground">
                            Número máximo de intentos permitidos
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Input
                            type="number"
                            value={companySettingsData.maxRetakeAttempts || 3}
                            onChange={(e) => setCompanySettingsData(prev => ({ ...prev, maxRetakeAttempts: parseInt(e.target.value) }))}
                            className="w-24 text-center"
                            min={1}
                            max={10}
                            data-testid="input-max-retakes"
                          />
                          <span className="text-muted-foreground">intentos</span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveCompanySettings} 
                  disabled={isSaving || loadingCompanySettings}
                  data-testid="button-save-system"
                >
                  {isSaving ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Guardando...</>
                  ) : (
                    <><Save className="h-4 w-4 mr-2" /> Guardar Parámetros</>
                  )}
                </Button>
              </div>
            </TabsContent>
          )}
          
          <TabsContent value="preferences" className="space-y-6">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-accent" />
                  Preferencias Regionales
                </CardTitle>
                <CardDescription>
                  Configura idioma y formato de fecha
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma</Label>
                    <Select
                      value={userPreferencesData.language || "es"}
                      onValueChange={(value) => setUserPreferencesData(prev => ({ ...prev, language: value }))}
                    >
                      <SelectTrigger id="language" data-testid="select-language">
                        <SelectValue placeholder="Selecciona idioma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Zona Horaria</Label>
                    <Select
                      value={userPreferencesData.timezone || "America/Mexico_City"}
                      onValueChange={(value) => setUserPreferencesData(prev => ({ ...prev, timezone: value }))}
                    >
                      <SelectTrigger id="timezone" data-testid="select-timezone">
                        <SelectValue placeholder="Selecciona zona horaria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Mexico_City">Ciudad de México (CST)</SelectItem>
                        <SelectItem value="America/Monterrey">Monterrey (CST)</SelectItem>
                        <SelectItem value="America/Tijuana">Tijuana (PST)</SelectItem>
                        <SelectItem value="America/Cancun">Cancún (EST)</SelectItem>
                        <SelectItem value="America/New_York">Nueva York (EST)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Los Ángeles (PST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-format">Formato de Fecha</Label>
                  <Select
                    value={userPreferencesData.dateFormat || "DD/MM/YYYY"}
                    onValueChange={(value) => setUserPreferencesData(prev => ({ ...prev, dateFormat: value }))}
                  >
                    <SelectTrigger id="date-format" data-testid="select-date-format">
                      <SelectValue placeholder="Selecciona formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-accent" />
                  Notificaciones
                </CardTitle>
                <CardDescription>
                  Configura qué notificaciones deseas recibir
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Notificaciones por Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibir notificaciones por correo electrónico
                    </p>
                  </div>
                  <Switch
                    checked={userPreferencesData.emailNotifications ?? true}
                    onCheckedChange={(checked) => setUserPreferencesData(prev => ({ ...prev, emailNotifications: checked }))}
                    data-testid="switch-email-notifications"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Notificaciones de Reportes</Label>
                    <p className="text-sm text-muted-foreground">
                      Avisos cuando se generen nuevos reportes
                    </p>
                  </div>
                  <Switch
                    checked={userPreferencesData.reportNotifications ?? true}
                    onCheckedChange={(checked) => setUserPreferencesData(prev => ({ ...prev, reportNotifications: checked }))}
                    data-testid="switch-report-notifications"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Recordatorios de Evaluación</Label>
                    <p className="text-sm text-muted-foreground">
                      Avisos de evaluaciones pendientes
                    </p>
                  </div>
                  <Switch
                    checked={userPreferencesData.evaluationReminders ?? true}
                    onCheckedChange={(checked) => setUserPreferencesData(prev => ({ ...prev, evaluationReminders: checked }))}
                    data-testid="switch-evaluation-reminders"
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-accent" />
                  Dashboard
                </CardTitle>
                <CardDescription>
                  Personaliza tu panel de control
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Mostrar Estadísticas Rápidas</Label>
                    <p className="text-sm text-muted-foreground">
                      Mostrar resumen de métricas en el dashboard
                    </p>
                  </div>
                  <Switch
                    checked={userPreferencesData.showQuickStats ?? true}
                    onCheckedChange={(checked) => setUserPreferencesData(prev => ({ ...prev, showQuickStats: checked }))}
                    data-testid="switch-quick-stats"
                  />
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end">
              <Button 
                onClick={handleSaveUserPreferences} 
                disabled={isSaving || loadingUserPreferences}
                data-testid="button-save-preferences"
              >
                {isSaving ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Guardando...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> Guardar Preferencias</>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
