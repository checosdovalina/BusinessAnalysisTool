import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { navItems, users } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Menu, Search, LogOut, Zap, Power } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import logoImg from "@assets/generated_images/abstract_logo_for_energy_evaluation_system.png";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const currentUser = users[0]; // Mock current user as Admin

  const NavContent = () => (
    <div className="flex flex-col h-full bg-sidebar/95 backdrop-blur-xl border-r border-white/5">
      <div className="h-16 flex items-center px-6 border-b border-white/5 bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center gap-3 font-bold text-lg text-white tracking-tight">
          <div className="p-1.5 bg-primary/20 rounded border border-primary/30 shadow-[0_0_15px_-5px_hsl(var(--primary))]">
             <Zap className="w-5 h-5 text-primary" />
          </div>
          <span className="font-heading tracking-wider">OTS <span className="text-primary">ENERGY</span></span>
        </div>
      </div>
      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 mb-3 text-[10px] font-bold text-muted-foreground/80 uppercase tracking-[0.2em]">
          Sistema de Control
        </div>
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                  isActive
                    ? "text-white bg-white/5 border-l-2 border-primary shadow-[inset_10px_0_20px_-10px_hsl(var(--primary)/0.1)]"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
                onClick={() => setIsMobileOpen(false)}
              >
                {isActive && <div className="absolute inset-0 bg-primary/5 z-0" />}
                <item.icon className={cn("w-4 h-4 z-10 transition-colors", isActive ? "text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]" : "text-muted-foreground group-hover:text-white")} />
                <span className="z-10">{item.label}</span>
              </a>
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-white/10 ring-2 ring-transparent group-hover:ring-primary/50 transition-all">
            <AvatarFallback className="bg-primary/20 text-primary font-bold">CS</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate text-white">{currentUser.name}</span>
            <span className="text-xs text-muted-foreground truncate">{currentUser.email}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 shadow-2xl shadow-black/50">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50 text-white hover:bg-white/10">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 border-r border-white/10 bg-sidebar">
          <NavContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen transition-all duration-300 ease-in-out bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
        {/* Header */}
        <header className="h-16 border-b border-white/5 bg-background/60 backdrop-blur-xl sticky top-0 z-40 px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4 md:ml-0 ml-10">
            <div className="relative hidden sm:block group">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Buscar eventos, fallas..."
                className="h-9 w-72 rounded-sm border border-white/10 bg-black/20 pl-9 pr-4 text-sm text-white placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center gap-2 mr-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-xs font-bold text-amber-500 border border-amber-500/20 shadow-[0_0_10px_-5px_orange]">
               <Power className="w-3 h-3" />
               RED ACTIVA: NORMAL
             </div>
             <div className="hidden sm:flex h-8 w-[1px] bg-white/10 mx-2"></div>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-white hover:bg-white/5">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-primary rounded-full shadow-[0_0_8px_hsl(var(--primary))]"></span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5">
                  <Avatar className="h-8 w-8 border border-white/10">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">CS</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-card border-white/10 text-white">
                <DropdownMenuLabel>Cuenta de Operador</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem className="focus:bg-white/10 focus:text-white">Perfil Profesional</DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-white/10 focus:text-white">Configuración</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                  <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
