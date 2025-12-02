import { db } from "./db";
import { companies, users, cycles, events, simulatorScenarios } from "@shared/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function seed() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await db.delete(events);
  await db.delete(cycles);
  await db.delete(simulatorScenarios);
  await db.delete(users);
  await db.delete(companies);

  // Hash passwords
  const adminPass = await hashPassword("admin123");
  const trainerPass = await hashPassword("trainer123");
  const studentPass = await hashPassword("student123");
  const superPass = await hashPassword("super123");

  // Create Companies
  const [company1, company2, company3] = await db.insert(companies).values([
    { name: "Red Eléctrica Nacional", active: true },
    { name: "Transmisión del Centro S.A.", active: true },
    { name: "Energía Sustentable Global", active: false },
  ]).returning();

  console.log("✅ Companies created");

  // Create Users with hashed passwords
  const [admin, trainer, student, superAdmin, student2] = await db.insert(users).values([
    {
      name: "Ing. Carlos Supervisor",
      email: "admin@red-electrica.com",
      password: adminPass,
      role: "admin",
      companyId: company1.id,
    },
    {
      name: "Roberto Instructor",
      email: "roberto@red-electrica.com",
      password: trainerPass,
      role: "trainer",
      companyId: company1.id,
    },
    {
      name: "Juan Operador",
      email: "juan@red-electrica.com",
      password: studentPass,
      role: "student",
      companyId: company1.id,
    },
    {
      name: "Ana Auditora",
      email: "ana@ots-system.com",
      password: superPass,
      role: "super_admin",
      companyId: company1.id,
    },
    {
      name: "María González",
      email: "maria@red-electrica.com",
      password: studentPass,
      role: "student",
      companyId: company1.id,
    },
  ]).returning();

  console.log("✅ Users created");

  // Create Global Simulator Scenarios
  const [scenario1, scenario2, scenario3, scenario4] = await db.insert(simulatorScenarios).values([
    {
      title: "Falla Trifásica en Línea 400kV",
      category: "Fault",
      difficulty: "Hard",
      description: "Simulación de corto circuito trifásico con rechazo de carga automático y coordinación de protecciones.",
      companyId: null,
    },
    {
      title: "Sobrecarga Transformador T1",
      category: "Overload",
      difficulty: "Medium",
      description: "Gestión de temperatura y alivio de carga por transferencia a transformador adyacente.",
      companyId: null,
    },
    {
      title: "Apertura de Anillo 230kV",
      category: "Topology",
      difficulty: "Easy",
      description: "Maniobras de reconfiguración topológica para mantenimiento programado.",
      companyId: null,
    },
    {
      title: "Falla a Tierra en Bus Principal",
      category: "Fault",
      difficulty: "Hard",
      description: "Detección y aislamiento de falla monofásica a tierra en bus de 115kV.",
      companyId: null,
    },
  ]).returning();

  console.log("✅ Simulator scenarios created");

  // Create Sample Cycles with enhanced fields
  const [cycle1, cycle2, cycle3] = await db.insert(cycles).values([
    {
      qualityCode: "OTS-2024-001",
      title: "Restablecimiento de Línea 115kV - Falla Bifásica",
      generalObjective: "Evaluar la capacidad del operador para ejecutar el procedimiento de restablecimiento de servicio después de una falla bifásica.",
      studentId: student.id,
      trainerId: trainer.id,
      companyId: company1.id,
      status: "in_progress",
      type: "field",
      startDate: new Date("2024-05-10"),
      trainingHours: 4.5,
      progress: 65,
      minPassingScore: 80,
      evaluationTopics: ["control_voltaje", "ejecucion_procedimientos", "protecciones_electricas"],
    },
    {
      qualityCode: "OTS-2024-002",
      title: "Maniobra en Subestación de Potencia (Libranza)",
      generalObjective: "Demostrar competencia en la ejecución de maniobras de libranza para mantenimiento programado.",
      studentId: student.id,
      trainerId: trainer.id,
      companyId: company1.id,
      status: "completed",
      type: "field",
      startDate: new Date("2024-04-01"),
      endDate: new Date("2024-04-05"),
      trainingHours: 6.0,
      progress: 100,
      score: 92,
      minPassingScore: 75,
      evaluationTopics: ["topologia", "comunicacion_operativa", "conocimiento_procedimientos"],
    },
    {
      qualityCode: "OTS-2024-003",
      title: "Simulación: Falla Trifásica 400kV",
      generalObjective: "Validar respuesta ante falla trifásica severa en línea de extra alta tensión.",
      studentId: student2.id,
      trainerId: trainer.id,
      companyId: company1.id,
      status: "pending",
      type: "simulator",
      startDate: new Date("2024-06-01"),
      progress: 0,
      minPassingScore: 85,
      evaluationTopics: ["control_frecuencia", "protecciones_electricas", "ejecucion_procedimientos"],
    },
  ]).returning();

  console.log("✅ Cycles created");

  // Create Events for Cycle 1 with enhanced fields
  await db.insert(events).values([
    {
      cycleId: cycle1.id,
      title: "Análisis de Diagrama Unifilar y Estado Inicial",
      description: "Validar topología de la red, estado de interruptores y alarmas activas en el SCADA.",
      specificObjective: "Identificar correctamente el punto de falla y elementos afectados.",
      evaluationTopic: "topologia",
      status: "pass",
      score: 10,
      maxScore: 10,
      weight: 1.0,
      expectedActions: [
        "Consultar diagrama unifilar actualizado",
        "Verificar estado de interruptores adyacentes",
        "Identificar protecciones activadas"
      ],
      gradingCriteria: "Completar análisis en menos de 5 minutos sin errores de identificación.",
      feedback: "Lectura correcta de protecciones activadas. Tiempo de respuesta excelente.",
    },
    {
      cycleId: cycle1.id,
      title: "Aislamiento de Falla (Apertura de Interruptores)",
      description: "Ejecución de secuencia de apertura de interruptores de línea para aislar el tramo fallado.",
      specificObjective: "Ejecutar la secuencia de aislamiento siguiendo el procedimiento operativo.",
      evaluationTopic: "ejecucion_procedimientos",
      status: "pass",
      score: 9,
      maxScore: 10,
      weight: 1.5,
      expectedActions: [
        "Solicitar autorización al Centro de Control",
        "Abrir interruptor 52-1 en secuencia",
        "Confirmar apertura por telemetría",
        "Registrar hora de apertura"
      ],
      gradingCriteria: "Secuencia correcta con confirmación de cada paso. Máximo 2 minutos por maniobra.",
      feedback: "Secuencia correcta, tiempo de respuesta adecuado. Mejorar confirmación verbal.",
    },
    {
      cycleId: cycle1.id,
      title: "Verificación de Ausencia de Tensión",
      description: "Confirmación visual y por telemetría de desenergización antes de autorizar puesta a tierra.",
      specificObjective: "Garantizar condiciones seguras antes de autorizar trabajos.",
      evaluationTopic: "control_voltaje",
      status: "pending",
      score: 0,
      maxScore: 15,
      weight: 2.0,
      expectedActions: [
        "Verificar lecturas de voltaje en puntos de prueba",
        "Confirmar indicadores de posición de seccionadores",
        "Documentar valores de tensión residual"
      ],
      gradingCriteria: "Verificación completa de los tres puntos antes de autorizar.",
    },
    {
      cycleId: cycle1.id,
      title: "Coordinación con Cuadrillas de Campo",
      description: "Protocolo de comunicación por radio para instruir inspección visual de la línea.",
      specificObjective: "Mantener comunicación efectiva y registro de instrucciones.",
      evaluationTopic: "comunicacion_operativa",
      status: "pending",
      score: 0,
      maxScore: 15,
      weight: 1.5,
      expectedActions: [
        "Establecer comunicación clara con cuadrilla",
        "Proporcionar instrucciones específicas",
        "Confirmar entendimiento de instrucciones",
        "Registrar hora y contenido de comunicación"
      ],
      gradingCriteria: "Protocolo de comunicación completo sin ambigüedades.",
    },
  ]);

  // Create Events for Cycle 2 (Completed)
  await db.insert(events).values([
    {
      cycleId: cycle2.id,
      title: "Solicitud y Autorización de Libranza",
      description: "Proceso formal de solicitud de libranza para mantenimiento.",
      specificObjective: "Completar el formato de solicitud y obtener autorizaciones.",
      evaluationTopic: "conocimiento_procedimientos",
      status: "pass",
      score: 18,
      maxScore: 20,
      weight: 1.0,
      feedback: "Documentación completa. Leve retraso en obtención de firma.",
    },
    {
      cycleId: cycle2.id,
      title: "Maniobras de Apertura",
      description: "Secuencia de apertura de elementos para aislamiento.",
      specificObjective: "Ejecutar secuencia sin errores.",
      evaluationTopic: "ejecucion_procedimientos",
      status: "pass",
      score: 25,
      maxScore: 25,
      weight: 1.5,
      feedback: "Ejecución perfecta de la secuencia.",
    },
    {
      cycleId: cycle2.id,
      title: "Comunicación con Centro de Control",
      description: "Reportes y confirmaciones durante la maniobra.",
      specificObjective: "Mantener comunicación continua y clara.",
      evaluationTopic: "comunicacion_operativa",
      status: "pass",
      score: 22,
      maxScore: 25,
      weight: 1.0,
      feedback: "Buena comunicación, pequeño retraso en un reporte.",
    },
    {
      cycleId: cycle2.id,
      title: "Verificación Final y Entrega",
      description: "Confirmación de condiciones seguras y entrega de equipo.",
      specificObjective: "Completar checklist de entrega.",
      evaluationTopic: "topologia",
      status: "pass",
      score: 27,
      maxScore: 30,
      weight: 1.0,
      feedback: "Verificación completa. Documentación bien organizada.",
    },
  ]);

  console.log("✅ Events created");

  console.log("🎉 Database seeded successfully!");
  console.log("\n📊 Created:");
  console.log(`  - ${3} Companies`);
  console.log(`  - ${5} Users`);
  console.log(`  - ${4} Simulator Scenarios`);
  console.log(`  - ${3} Training Cycles`);
  console.log(`  - ${8} Events`);
  console.log("\n🔑 Test Credentials:");
  console.log(`  Admin:      admin@red-electrica.com / admin123`);
  console.log(`  Trainer:    roberto@red-electrica.com / trainer123`);
  console.log(`  Student:    juan@red-electrica.com / student123`);
  console.log(`  Student 2:  maria@red-electrica.com / student123`);
  console.log(`  SuperAdmin: ana@ots-system.com / super123`);
}

seed()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
