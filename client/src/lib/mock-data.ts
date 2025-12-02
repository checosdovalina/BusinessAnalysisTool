import { BookOpen, CheckCircle, Clock, FileText, LayoutDashboard, Settings, Users, BarChart3, Building2, MonitorPlay } from "lucide-react";

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
  type?: "field" | "simulator"; // Added type
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
  maneuvers?: string[]; // Specific maneuvers for simulator
}

export interface SimulatorScenario {
  id: string;
  title: string;
  category: "Fault" | "Maintenance" | "Overload" | "Topology";
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
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

export const simulatorScenarios: SimulatorScenario[] = [
  { id: "sim1", title: "Falla Trifásica en Línea 400kV", category: "Fault", difficulty: "Hard", description: "Simulación de corto circuito trifásico con rechazo de carga automático." },
  { id: "sim2", title: "Sobrecarga Transformador T1", category: "Overload", difficulty: "Medium", description: "Gestión de temperatura y alivio de carga por transferencia." },
  { id: "sim3", title: "Apertura de Anillo 230kV", category: "Topology", difficulty: "Easy", description: "Maniobras de reconfiguración para mantenimiento programado." },
];

export const cycles: Cycle[] = [
  { 
    id: "cy1", 
    title: "Restablecimiento de Línea 115kV - Falla Bifásica", 
    studentId: "u3", 
    trainerId: "u2", 
    status: "in_progress", 
    startDate: "2024-05-10", 
    progress: 65,
    type: "field"
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
    score: 92,
    type: "field"
  },
  { 
    id: "cy3", 
    title: "Simulación: Falla Trifásica 400kV", 
    studentId: "u3", 
    trainerId: "u2", 
    status: "pending", 
    startDate: "2024-06-01", 
    progress: 0,
    type: "simulator"
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
  },
  // Simulator Events
  {
    id: "es1",
    cycleId: "cy3",
    title: "Detección de Falla en SCADA",
    description: "Identificar alarmas de protección diferencial y distancia en pantalla de control.",
    status: "pending",
    score: 0,
    maxScore: 20,
    maneuvers: ["Lectura de Alarmas", "Verificación de Corrientes de Falla"]
  },
  {
    id: "es2",
    cycleId: "cy3",
    title: "Ejecución de Maniobras de Aislamiento",
    description: "Apertura remota de interruptores de potencia asociados al tramo en falla.",
    status: "pending",
    score: 0,
    maxScore: 30,
    maneuvers: ["Apertura Interruptor 52-1", "Apertura Interruptor 52-2", "Verificación Estado Abierto"]
  }
];

export const navItems = [
  { label: "Centro de Control", icon: LayoutDashboard, href: "/" },
  { label: "Evaluaciones", icon: BookOpen, href: "/evaluations" },
  { label: "Simuladores", icon: MonitorPlay, href: "/simulator" }, // New Item
  { label: "Operadores", icon: Users, href: "/users" },
  { label: "Empresas", icon: Building2, href: "/companies", role: "super_admin" },
  { label: "Reportes Ejecutivos", icon: BarChart3, href: "/reports" },
  { label: "Configuración", icon: Settings, href: "/settings" },
];
