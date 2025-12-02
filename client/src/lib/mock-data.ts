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
  { id: "c1", name: "Red Eléctrica Nacional", active: true },
  { id: "c2", name: "Transmisión del Centro S.A.", active: true },
  { id: "c3", name: "Energía Sustentable Global", active: false },
];

export const users: User[] = [
  { id: "u1", name: "Ing. Carlos Supervisor", email: "admin@red-electrica.com", role: "admin", companyId: "c1" },
  { id: "u2", name: "Roberto Instructor", email: "roberto@red-electrica.com", role: "trainer", companyId: "c1" },
  { id: "u3", name: "Juan Operador", email: "juan@red-electrica.com", role: "student", companyId: "c1" },
  { id: "u4", name: "Ana Auditora", email: "ana@ots-system.com", role: "super_admin", companyId: "root" },
];

export const cycles: Cycle[] = [
  { 
    id: "cy1", 
    title: "Restablecimiento de Línea 115kV - Falla Bifásica", 
    studentId: "u3", 
    trainerId: "u2", 
    status: "in_progress", 
    startDate: "2024-05-10", 
    progress: 65 
  },
  { 
    id: "cy2", 
    title: "Maniobra en Subestación de Potencia (Libranza)", 
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
    title: "Control de Voltaje en Barra de Alta Tensión", 
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
    title: "Análisis de Diagrama Unifilar y Estado Inicial",
    description: "Validar topología de la red, estado de interruptores y alarmas activas en el SCADA.",
    status: "pass",
    score: 10,
    maxScore: 10,
    feedback: "Lectura correcta de protecciones activadas."
  },
  {
    id: "e2",
    cycleId: "cy1",
    title: "Aislamiento de Falla (Apertura de Interruptores)",
    description: "Ejecución de secuencia de apertura de interruptores de línea para aislar el tramo fallado.",
    status: "pass",
    score: 9,
    maxScore: 10,
    feedback: "Secuencia correcta, tiempo de respuesta adecuado."
  },
  {
    id: "e3",
    cycleId: "cy1",
    title: "Verificación de Ausencia de Tensión",
    description: "Confirmación visual y por telemetría de desenergización antes de autorizar puesta a tierra.",
    status: "pending",
    score: 0,
    maxScore: 15,
  },
  {
    id: "e4",
    cycleId: "cy1",
    title: "Coordinación con Cuadrillas de Campo",
    description: "Protocolo de comunicación por radio para instruir inspección visual de la línea.",
    status: "pending",
    score: 0,
    maxScore: 15,
  }
];

export const navItems = [
  { label: "Centro de Control", icon: LayoutDashboard, href: "/" },
  { label: "Evaluaciones", icon: BookOpen, href: "/evaluations" },
  { label: "Operadores", icon: Users, href: "/users" },
  { label: "Empresas", icon: Building2, href: "/companies", role: "super_admin" },
  { label: "Reportes Ejecutivos", icon: BarChart3, href: "/reports" },
  { label: "Configuración", icon: Settings, href: "/settings" },
];
