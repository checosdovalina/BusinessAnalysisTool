import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Menu, Search, LogOut, ChevronDown, RadioTower, ShieldCheck } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { OtsEnergyLogo } from "@/components/brand/ots-energy-logo";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, company, logout } = useAuth();
  
  const userInitials = user?.name
    .split(" ")
    .map(n => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "US";

  const NavContent = () => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="h-[76px] flex items-center px-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <OtsEnergyLogo
            iconClassName="h-9 w-9 shrink-0"
            wordmarkClassName="leading-tight text-[15px] tracking-[0.08em] [&_strong]:font-bold [&_i]:not-italic [&_i]:text-sidebar-primary"
            className="inline-flex items-center gap-2.5 text-white"
            subtitle="Operación · Formación · Evidencia"
          />
        </div>
      </div>

      <div className="flex-1 py-6 px-3 overflow-y-auto">
        <div className="px-3 mb-3 flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-sidebar-primary" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.16em]">
            Operación y formación
          </span>
        </div>
        <nav className="space-y-1">
          {navItems.filter((item: any) => {
            if (!item.roles) return true;
            return user?.role && item.roles.includes(user.role);
          }).map((item) => {
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-[10px] rounded-lg text-[13px] font-medium transition-all duration-150 group",
                  isActive
                    ? "bg-sidebar-accent text-white shadow-[inset_2px_0_0_hsl(var(--sidebar-primary))]"
                    : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.045]"
                )}
                onClick={() => setIsMobileOpen(false)}
              >
                <item.icon className={cn(
                  "w-[18px] h-[18px] transition-colors flex-shrink-0",
                  isActive ? "text-sidebar-primary" : "text-slate-500 group-hover:text-sidebar-foreground"
                )} />
                <span>{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary shadow-[0_0_0_3px_hsl(var(--sidebar-primary)/.12)]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-2 mb-1 rounded-lg bg-white/[0.035]">
          <ShieldCheck className="h-4 w-4 text-sidebar-primary shrink-0" />
          <span className="text-[10px] leading-tight text-slate-400">Trazabilidad para operación segura</span>
        </div>
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="h-8 w-8 ring-1 ring-white/10">
            <AvatarFallback className="bg-sidebar-primary/15 text-sidebar-primary text-xs font-semibold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-medium truncate text-slate-200">{user?.name}</span>
            <span className="text-[11px] text-slate-500 truncate">{user?.email}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans">
      <aside className="hidden md:flex w-[264px] flex-col fixed inset-y-0 z-50 border-r border-sidebar-border">
        <NavContent />
      </aside>

      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-3 left-3 z-50 text-foreground hover:bg-primary/10">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[264px] border-r border-sidebar-border bg-sidebar">
          <NavContent />
        </SheetContent>
      </Sheet>

      <main className="flex-1 md:ml-[264px] flex flex-col min-h-[100dvh]">
        <header className="h-[62px] border-b border-border bg-card/90 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-7 flex items-center justify-between">
          <div className="flex items-center gap-3 md:ml-0 ml-10">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Búsqueda no disponible"
                title="La búsqueda global aún no está disponible"
                aria-label="Búsqueda global no disponible"
                className="h-9 w-64 rounded-lg border border-border bg-background/80 pl-9 pr-4 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                data-testid="input-global-search"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/5 text-[10px] font-bold tracking-[0.1em] text-primary border border-primary/15">
              <RadioTower className="h-3.5 w-3.5" />
              ENTORNO OPERATIVO
            </div>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground h-9 w-9" data-testid="button-notifications">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-[hsl(var(--accent))] rounded-full border-2 border-card"></span>
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
                  <span className="text-sm font-medium hidden sm:inline">{user?.name?.split(' ')[0]}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground font-normal">{company?.name}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/settings">
                  <DropdownMenuItem className="cursor-pointer" data-testid="menu-profile">
                    Perfil Profesional
                  </DropdownMenuItem>
                </Link>
                <Link href="/settings">
                  <DropdownMenuItem className="cursor-pointer" data-testid="menu-settings">
                    Configuración
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={logout}
                  data-testid="button-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-7 lg:p-8 max-w-[1480px] mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
          {children}
        </div>
      </main>
    </div>
  );
}
