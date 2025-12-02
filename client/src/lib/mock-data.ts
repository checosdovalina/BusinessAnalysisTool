import { BookOpen, CheckCircle, Clock, FileText, LayoutDashboard, Settings, Users, BarChart3, Building2 } from "lucide-react";

export type Role = "super_admin" | "admin" | "trainer" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId: string;
  avatar?: string;
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  active: boolean;
}

export interface Cycle {
  id: string;
  title: string;
  studentId: string;
  trainerId: string;
  status: "in_progress" | "completed" | "pending";
  startDate: string;
  endDate?: string;
  progress: number; // 0-100
  score?: number;
}

export interface Event {
  id: string;
  cycleId: string;
  title: string;
  description: string;
  status: "pending" | "pass" | "fail" | "skipped";
  score: number;
  maxScore: number;
  feedback?: string;
}

// MOCK DATA

export const companies: Company[] = [
  { id: "c1", name: "Minería del Norte S.A.", active: true },
  { id: "c2", name: "Transportes Logísticos Global", active: true },
  { id: "c3", name: "Constructora Andes", active: false },
];

export const users: User[] = [
  { id: "u1", name: "Carlos Admin", email: "admin@mineria.com", role: "admin", companyId: "c1" },
  { id: "u2", name: "Roberto Entrenador", email: "roberto@mineria.com", role: "trainer", companyId: "c1" },
  { id: "u3", name: "Juan Operador", email: "juan@mineria.com", role: "student", companyId: "c1" },
  { id: "u4", name: "Ana Super", email: "ana@ots-system.com", role: "super_admin", companyId: "root" },
];

export const cycles: Cycle[] = [
  { 
    id: "cy1", 
    title: "Certificación Operación Camión CAEX 930E", 
    studentId: "u3", 
    trainerId: "u2", 
    status: "in_progress", 
    startDate: "2024-05-10", 
    progress: 65 
  },
  { 
    id: "cy2", 
    title: "Inducción Seguridad Planta Concentradora", 
    studentId: "u3", 
    trainerId: "u2", 
    status: "completed", 
    startDate: "2024-04-01", 
    endDate: "2024-04-05",
    progress: 100,
    score: 92
  },
  { 
    id: "cy3", 
    title: "Mantenimiento Preventivo Pala Hidráulica", 
    studentId: "u3", 
    trainerId: "u2", 
    status: "pending", 
    startDate: "2024-06-01", 
    progress: 0 
  }
];

export const events: Event[] = [
  {
    id: "e1",
    cycleId: "cy1",
    title: "Inspección Pre-operacional (Vuelta del Perro)",
    description: "Verificar estado de neumáticos, fugas, niveles de fluidos y estructura general.",
    status: "pass",
    score: 10,
    maxScore: 10,
    feedback: "Excelente revisión de puntos críticos."
  },
  {
    id: "e2",
    cycleId: "cy1",
    title: "Procedimiento de Arranque y Testeo",
    description: "Secuencia correcta de encendido, prueba de frenos y comunicaciones radiales.",
    status: "pass",
    score: 9,
    maxScore: 10,
    feedback: "Comunicación radial un poco baja, pero procedimiento correcto."
  },
  {
    id: "e3",
    cycleId: "cy1",
    title: "Maniobra de Carguío en Pala",
    description: "Posicionamiento correcto bajo la pala, uso de freno de parqueo, espera de señal.",
    status: "pending",
    score: 0,
    maxScore: 15,
  },
  {
    id: "e4",
    cycleId: "cy1",
    title: "Transporte y Descarga en Botadero",
    description: "Velocidades controladas, aproximación a bermas, descarga segura.",
    status: "pending",
    score: 0,
    maxScore: 15,
  }
];

export const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Evaluaciones", icon: BookOpen, href: "/evaluations" },
  { label: "Usuarios", icon: Users, href: "/users" },
  { label: "Empresas", icon: Building2, href: "/companies", role: "super_admin" },
  { label: "Reportes", icon: BarChart3, href: "/reports" },
  { label: "Configuración", icon: Settings, href: "/settings" },
];
