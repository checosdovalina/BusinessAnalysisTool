import { db } from "./db";
import { companies, users, cycles, events, simulatorScenarios, evaluationTopics, evaluationTopicItems, cycleTopicItems, trainingReports, trainingRequests, requestIncidents, requestRoles, requestProcedures, requestTopics, requestRecipients, evaluationTemplates, templateTopics, templateEvents } from "@shared/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function seed() {
  console.log("🌱 Seeding database...");

  // Clear existing data (order matters due to foreign keys)
  await db.delete(requestRecipients);
  await db.delete(requestTopics);
  await db.delete(requestProcedures);
  await db.delete(requestRoles);
  await db.delete(requestIncidents);
  await db.delete(trainingRequests);
  await db.delete(trainingReports);
  await db.delete(templateEvents);
  await db.delete(templateTopics);
  await db.delete(evaluationTemplates);
  await db.delete(cycleTopicItems);
  await db.delete(evaluationTopicItems);
  await db.delete(evaluationTopics);
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
  const [admin, trainer, student, superAdmin, student2, superAdmin2] = await db.insert(users).values([
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
    {
      name: "Sergio Dovalina",
      email: "admin@otsenergy.com",
      password: superPass,
      role: "super_admin",
      companyId: company1.id,
    },
  ]).returning();

  console.log("✅ Users created");

  // Create Evaluation Topics (Temas de Evaluación)
  const topicsData = [
    { name: "Control de Voltaje", code: "control_voltaje", description: "Evaluación de la capacidad del operador para mantener niveles de voltaje dentro de límites operativos.", icon: "Zap", sortOrder: 1 },
    { name: "Conocimiento de Procedimientos", code: "conocimiento_procedimientos", description: "Evaluación del dominio teórico de los procedimientos operativos vigentes.", icon: "BookOpen", sortOrder: 2 },
    { name: "Ejecución de Procedimientos", code: "ejecucion_procedimientos", description: "Evaluación de la correcta aplicación práctica de los procedimientos operativos.", icon: "ClipboardCheck", sortOrder: 3 },
    { name: "Control de Frecuencia", code: "control_frecuencia", description: "Evaluación de la capacidad para mantener la frecuencia del sistema dentro de límites.", icon: "Activity", sortOrder: 4 },
    { name: "Topología", code: "topologia", description: "Evaluación del conocimiento de la configuración y estado de la red eléctrica.", icon: "Network", sortOrder: 5 },
    { name: "Comunicación Operativa", code: "comunicacion_operativa", description: "Evaluación de las habilidades de comunicación con centro de control y cuadrillas.", icon: "Radio", sortOrder: 6 },
    { name: "Protecciones Eléctricas", code: "protecciones_electricas", description: "Evaluación del conocimiento de sistemas de protección y su operación.", icon: "Shield", sortOrder: 7 },
  ];

  const createdTopics = await db.insert(evaluationTopics).values(topicsData).returning();
  console.log("✅ Evaluation topics created");

  // Create Topic Items (Elementos de evaluación por tema)
  const topicItemsData = [
    // Control de Voltaje
    { topicId: createdTopics[0].id, name: "Monitoreo de niveles de tensión en tiempo real", description: "Capacidad de identificar y monitorear niveles de voltaje en barras principales.", expectedOutcomes: ["Identificar barras fuera de límites", "Reportar desviaciones oportunamente"], gradingCriteria: "Identificación correcta dentro de 60 segundos", defaultWeight: 1.5, difficulty: "Medium" as const },
    { topicId: createdTopics[0].id, name: "Ajuste de taps de transformadores", description: "Ejecución correcta de cambios de tap para regulación de voltaje.", expectedOutcomes: ["Seleccionar dirección correcta del tap", "Verificar efecto en voltaje"], gradingCriteria: "Ajuste exitoso sin sobrecorrección", defaultWeight: 2.0, difficulty: "Hard" as const },
    { topicId: createdTopics[0].id, name: "Coordinación de reactivos con plantas generadoras", description: "Solicitar ajustes de reactivos a generadores para soporte de voltaje.", expectedOutcomes: ["Comunicación clara con operador de planta", "Seguimiento de respuesta"], gradingCriteria: "Mejora de perfil de voltaje verificada", defaultWeight: 1.5, difficulty: "Medium" as const },
    
    // Conocimiento de Procedimientos
    { topicId: createdTopics[1].id, name: "Procedimiento de libranza", description: "Conocimiento del proceso de solicitud y ejecución de libranzas.", expectedOutcomes: ["Identificar pasos del procedimiento", "Conocer formatos requeridos"], gradingCriteria: "Recitar pasos en orden correcto", defaultWeight: 1.0, difficulty: "Easy" as const },
    { topicId: createdTopics[1].id, name: "Procedimiento de emergencia por baja frecuencia", description: "Conocimiento del plan de defensa ante subtensión/subfrecuencia.", expectedOutcomes: ["Conocer etapas de deslastre", "Identificar prioridades de carga"], gradingCriteria: "Describir correctamente las 3 etapas", defaultWeight: 2.0, difficulty: "Hard" as const },
    { topicId: createdTopics[1].id, name: "Normativa de operación del MEM", description: "Conocimiento de las reglas del mercado eléctrico mayorista.", expectedOutcomes: ["Conocer roles de participantes", "Entender restricciones operativas"], gradingCriteria: "Responder correctamente 8 de 10 preguntas", defaultWeight: 1.0, difficulty: "Medium" as const },
    
    // Ejecución de Procedimientos
    { topicId: createdTopics[2].id, name: "Maniobra de apertura de interruptores", description: "Ejecución segura de secuencia de apertura.", expectedOutcomes: ["Verificar condiciones previas", "Ejecutar secuencia correcta", "Confirmar apertura"], gradingCriteria: "Secuencia completa sin errores en menos de 3 minutos", defaultWeight: 2.0, difficulty: "Medium" as const },
    { topicId: createdTopics[2].id, name: "Maniobra de cierre de interruptores", description: "Ejecución segura de secuencia de cierre.", expectedOutcomes: ["Verificar sincronismo cuando aplique", "Ejecutar cierre", "Confirmar estado"], gradingCriteria: "Cierre exitoso con verificaciones completas", defaultWeight: 2.0, difficulty: "Medium" as const },
    { topicId: createdTopics[2].id, name: "Restablecimiento de servicio post-falla", description: "Secuencia de restablecimiento gradual de carga.", expectedOutcomes: ["Verificar ausencia de falla", "Restablecer por etapas", "Monitorear parámetros"], gradingCriteria: "Restablecimiento completo sin disparos", defaultWeight: 2.5, difficulty: "Hard" as const },
    
    // Control de Frecuencia
    { topicId: createdTopics[3].id, name: "Monitoreo de frecuencia del sistema", description: "Vigilancia continua de la frecuencia y tendencias.", expectedOutcomes: ["Identificar desviaciones", "Anticipar problemas"], gradingCriteria: "Detección de desviación en menos de 30 segundos", defaultWeight: 1.0, difficulty: "Easy" as const },
    { topicId: createdTopics[3].id, name: "Coordinación de regulación secundaria", description: "Solicitar ajustes de generación para control de frecuencia.", expectedOutcomes: ["Calcular MW requeridos", "Coordinar con generadores"], gradingCriteria: "Recuperación de frecuencia nominal en 5 minutos", defaultWeight: 2.0, difficulty: "Hard" as const },
    
    // Topología
    { topicId: createdTopics[4].id, name: "Lectura de diagrama unifilar", description: "Interpretación correcta del estado de la red.", expectedOutcomes: ["Identificar configuración actual", "Detectar anomalías"], gradingCriteria: "Descripción correcta de la topología", defaultWeight: 1.0, difficulty: "Easy" as const },
    { topicId: createdTopics[4].id, name: "Identificación de rutas de flujo de potencia", description: "Análisis de caminos de transferencia de energía.", expectedOutcomes: ["Trazar rutas principales", "Identificar cuellos de botella"], gradingCriteria: "Identificar 3 rutas críticas correctamente", defaultWeight: 1.5, difficulty: "Medium" as const },
    { topicId: createdTopics[4].id, name: "Reconfiguración de red ante contingencia", description: "Proponer cambios topológicos para aliviar sobrecarga.", expectedOutcomes: ["Identificar maniobras posibles", "Evaluar impacto"], gradingCriteria: "Proponer solución viable y segura", defaultWeight: 2.0, difficulty: "Hard" as const },
    
    // Comunicación Operativa
    { topicId: createdTopics[5].id, name: "Protocolo de comunicación por radio", description: "Uso correcto del protocolo de comunicación operativa.", expectedOutcomes: ["Usar fraseología estándar", "Confirmar instrucciones"], gradingCriteria: "Comunicación clara sin ambigüedades", defaultWeight: 1.0, difficulty: "Easy" as const },
    { topicId: createdTopics[5].id, name: "Reporte de incidentes al Centro de Control", description: "Comunicación efectiva de eventos importantes.", expectedOutcomes: ["Describir evento claramente", "Proporcionar datos relevantes"], gradingCriteria: "Reporte completo en formato estándar", defaultWeight: 1.5, difficulty: "Medium" as const },
    { topicId: createdTopics[5].id, name: "Coordinación con cuadrillas de campo", description: "Instrucciones claras para personal de campo.", expectedOutcomes: ["Dar instrucciones específicas", "Verificar entendimiento", "Registrar comunicaciones"], gradingCriteria: "Cuadrilla ejecuta sin solicitar aclaraciones", defaultWeight: 1.5, difficulty: "Medium" as const },
    
    // Protecciones Eléctricas
    { topicId: createdTopics[6].id, name: "Identificación de protecciones activadas", description: "Lectura e interpretación de señales de protección.", expectedOutcomes: ["Identificar relay activado", "Determinar zona de falla"], gradingCriteria: "Identificación correcta en menos de 2 minutos", defaultWeight: 1.5, difficulty: "Medium" as const },
    { topicId: createdTopics[6].id, name: "Análisis de secuencia de eventos", description: "Interpretación cronológica de operación de protecciones.", expectedOutcomes: ["Ordenar eventos temporalmente", "Identificar protección primaria/respaldo"], gradingCriteria: "Secuencia correcta con tiempos", defaultWeight: 2.0, difficulty: "Hard" as const },
    { topicId: createdTopics[6].id, name: "Coordinación de protecciones", description: "Conocimiento de esquemas de coordinación.", expectedOutcomes: ["Explicar filosofía de coordinación", "Identificar posibles fallas de coordinación"], gradingCriteria: "Explicación correcta del esquema", defaultWeight: 2.0, difficulty: "Hard" as const },
  ];

  await db.insert(evaluationTopicItems).values(topicItemsData);
  console.log("✅ Evaluation topic items created");

  // Create Global Simulator Scenarios - Based on CENACE real evaluation scenarios
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

  // Additional CENACE-style scenarios
  await db.insert(simulatorScenarios).values([
    {
      title: "Licencia en Muerto de Emergencia sobre CEV",
      category: "Emergency",
      difficulty: "Hard",
      description: "Entrenando debe preguntar trabajos a realizar, equipo, duración de L.M.E., condiciones climatológicas, confirmar personal en P.T., llevar a 0 MVAR CEV y utilizar centrales fotovoltaicas para modificar potencia reactiva.",
      companyId: null,
    },
    {
      title: "D L.T. AND 93710 TRS, DRM no exitoso y pérdida de generación de VSU y VST",
      category: "Fault",
      difficulty: "Hard",
      description: "Detectar falla, determinar DRM no exitoso, determinar protecciones operadas, si existió CAD, indicio de falla, coordinar con ZOT para restablecimiento, esperar 3 min para segunda prueba, detectar disminución súbita de generación.",
      companyId: null,
    },
    {
      title: "Oscilaciones de Q de VSU y VST",
      category: "Stability",
      difficulty: "Medium",
      description: "Observar variaciones en los voltajes de la ZOTLGA, detectar oscilaciones de Q en VSU y VST, cuestionar a la central, solicitar cambiar modo de control de Q, solicitar desconectar de emergencia la central por confiabilidad de la red.",
      companyId: null,
    },
    {
      title: "P.V.C. a CCC IEL",
      category: "Verification",
      difficulty: "Medium",
      description: "Confirmar solicitud de realizar P.V.C. a la CCC, confirmar valor de generación ofertado, cuestionar a solicitud de quien se realiza, ejecutar orden de despacho, solicitar confirmación de la solicitud, conceder LVE a central para realizar PVC.",
      companyId: null,
    },
    {
      title: "D L.T. FVL 73370 DLD con sobre alcance en MOQ, VCM, LCS y DEL",
      category: "Fault",
      difficulty: "Hard",
      description: "Detectar falla, determinar protecciones operadas, si existió CAD, indicio de falla, sobre alcance en los demás interruptores, coordinar con ZOTCGO para restablecimiento, recuperar en primera instancia carga de subestaciones.",
      companyId: null,
    },
    {
      title: "D REMOTOS DE B-01 115 KV DE S.E. CZU SIN INDICIO",
      category: "Fault",
      difficulty: "Hard",
      description: "Detectar falla, determinar interruptores disparados, protecciones operadas, si existió CAD y/o carga afectada, indicio de falla, coordinarse con ZOTLGA y CCD para restablecimiento, seccionar LT's en anillo que convergen a la S.E.",
      companyId: null,
    },
    {
      title: "Disparo TER AT-99 con operación de DAC de TER",
      category: "Protection",
      difficulty: "Medium",
      description: "Detectar falla, determinar interruptores disparados, protecciones operadas, si existió CAD, indicio de falla, determinar operación del EAR, coordinar con ZOT para proceder con restablecimiento, poner en servicio TER AT-99 con cierre.",
      companyId: null,
    },
    {
      title: "D LT NCG 93950 AOD DRM N.E. con operación de DAC de NCG sin LT 93950",
      category: "Fault",
      difficulty: "Hard",
      description: "Detectar falla, determinar interruptores disparados, protecciones operadas, si existió CAD, indicio de falla, determinar operación del EAR, esperar 3 min para segunda prueba sobre LT, seccionar red de 115 para evitar sobrecarga.",
      companyId: null,
    },
    {
      title: "D L.T. CGD 93160 SGD, DRM NO EXITOSO",
      category: "Fault",
      difficulty: "Medium",
      description: "Detectar falla, determinar DRM no exitoso, protecciones operadas, si existió CAD, indicio de falla, coordinar con ZOT para restablecimiento, recuperar carga de PAI y ALV antes de cumplirse los 3 minutos para realizar segunda prueba.",
      companyId: null,
    },
    {
      title: "Operación de 81 en la GCRNTE",
      category: "Frequency",
      difficulty: "Medium",
      description: "Detectar decremento de frecuencia, determinar interruptores disparados, protecciones operadas, determinar operación de EPS, si existió indicio dentro de la GCRNTE, coordinar con CENAL para identificar causa de la caída de la frecuencia.",
      companyId: null,
    },
    {
      title: "FAMILIARIZACIÓN CON DESPLEGADOS DE COLAPSO",
      category: "Training",
      difficulty: "Easy",
      description: "Detectar Colapso, determinar interruptores disparados, protecciones operadas, si existió indicio de falla, solicitar ejecutar macroinstrucciones de Etapa 0, 1 y 2, solicitar recuperación de EAR y EPS.",
      companyId: null,
    },
  ]);

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

  // Create Evaluation Templates (Plantillas de Evaluación)
  const [templateCenace, templateSimulador, templateCampo] = await db.insert(evaluationTemplates).values([
    {
      code: "CENACE_STANDARD",
      name: "Evaluación CENACE Estándar",
      description: "Plantilla basada en los estándares de evaluación del Centro Nacional de Control de Energía (CENACE). Incluye todos los temas de competencia operativa.",
      templateType: "cenace",
      cycleType: "field",
      defaultMinPassingScore: 80,
      estimatedDuration: 240,
      icon: "Shield",
      color: "#00F0FF",
      isActive: true,
      isSystem: true,
      sortOrder: 1,
    },
    {
      code: "SIMULADOR_BASICO",
      name: "Evaluación en Simulador",
      description: "Plantilla para evaluaciones prácticas en simulador de operaciones. Enfocada en respuesta ante contingencias y manejo de emergencias.",
      templateType: "simulador",
      cycleType: "simulator",
      defaultMinPassingScore: 75,
      estimatedDuration: 120,
      icon: "Monitor",
      color: "#22C55E",
      isActive: true,
      isSystem: true,
      sortOrder: 2,
    },
    {
      code: "CAMPO_PRACTICO",
      name: "Evaluación de Campo",
      description: "Plantilla para evaluaciones prácticas en campo. Incluye maniobras, coordinación con cuadrillas y uso de EPP.",
      templateType: "campo",
      cycleType: "field",
      defaultMinPassingScore: 70,
      estimatedDuration: 180,
      icon: "Wrench",
      color: "#F59E0B",
      isActive: true,
      isSystem: true,
      sortOrder: 3,
    },
  ]).returning();

  console.log("✅ Evaluation templates created");

  // Create Template Topics (Temas por plantilla)
  await db.insert(templateTopics).values([
    // CENACE Standard - Todos los temas
    { templateId: templateCenace.id, topicId: createdTopics[0].id, categoryTag: "operacional", defaultMaxPoints: 100, defaultWeight: 1.5, isRequired: true, sortOrder: 1 },
    { templateId: templateCenace.id, topicId: createdTopics[1].id, categoryTag: "tecnico", defaultMaxPoints: 100, defaultWeight: 1.0, isRequired: true, sortOrder: 2 },
    { templateId: templateCenace.id, topicId: createdTopics[2].id, categoryTag: "operacional", defaultMaxPoints: 100, defaultWeight: 2.0, isRequired: true, sortOrder: 3 },
    { templateId: templateCenace.id, topicId: createdTopics[3].id, categoryTag: "operacional", defaultMaxPoints: 100, defaultWeight: 1.5, isRequired: true, sortOrder: 4 },
    { templateId: templateCenace.id, topicId: createdTopics[4].id, categoryTag: "tecnico", defaultMaxPoints: 100, defaultWeight: 1.0, isRequired: true, sortOrder: 5 },
    { templateId: templateCenace.id, topicId: createdTopics[5].id, categoryTag: "comunicacion", defaultMaxPoints: 100, defaultWeight: 1.0, isRequired: true, sortOrder: 6 },
    { templateId: templateCenace.id, topicId: createdTopics[6].id, categoryTag: "tecnico", defaultMaxPoints: 100, defaultWeight: 1.5, isRequired: true, sortOrder: 7 },
    
    // Simulador - Temas enfocados a emergencias
    { templateId: templateSimulador.id, topicId: createdTopics[2].id, categoryTag: "operacional", defaultMaxPoints: 100, defaultWeight: 2.0, isRequired: true, sortOrder: 1 },
    { templateId: templateSimulador.id, topicId: createdTopics[3].id, categoryTag: "operacional", defaultMaxPoints: 100, defaultWeight: 1.5, isRequired: true, sortOrder: 2 },
    { templateId: templateSimulador.id, topicId: createdTopics[6].id, categoryTag: "tecnico", defaultMaxPoints: 100, defaultWeight: 2.0, isRequired: true, sortOrder: 3 },
    { templateId: templateSimulador.id, topicId: createdTopics[4].id, categoryTag: "tecnico", defaultMaxPoints: 100, defaultWeight: 1.0, isRequired: false, sortOrder: 4 },
    
    // Campo Práctico - Temas de ejecución
    { templateId: templateCampo.id, topicId: createdTopics[2].id, categoryTag: "operacional", defaultMaxPoints: 100, defaultWeight: 2.0, isRequired: true, sortOrder: 1 },
    { templateId: templateCampo.id, topicId: createdTopics[5].id, categoryTag: "comunicacion", defaultMaxPoints: 100, defaultWeight: 1.5, isRequired: true, sortOrder: 2 },
    { templateId: templateCampo.id, topicId: createdTopics[4].id, categoryTag: "tecnico", defaultMaxPoints: 100, defaultWeight: 1.0, isRequired: true, sortOrder: 3 },
  ]);

  console.log("✅ Template topics created");

  // Create Template Events (Eventos predefinidos por plantilla)
  await db.insert(templateEvents).values([
    // CENACE Standard Events
    {
      templateId: templateCenace.id,
      title: "Análisis de Condiciones Iniciales",
      description: "Evaluación de la capacidad del operador para identificar el estado actual de la red.",
      evaluationTopic: "topologia",
      maxScore: 100,
      weight: 1.0,
      expectedActions: ["Revisar diagrama unifilar", "Identificar alarmas activas", "Verificar niveles de tensión"],
      gradingCriteria: "Identificación completa en menos de 5 minutos.",
      sortOrder: 1,
    },
    {
      templateId: templateCenace.id,
      title: "Respuesta ante Contingencia",
      description: "Evaluación de la respuesta operativa ante un evento de contingencia.",
      evaluationTopic: "ejecucion_procedimientos",
      maxScore: 100,
      weight: 2.0,
      expectedActions: ["Detectar la contingencia", "Evaluar impacto", "Ejecutar acciones correctivas", "Informar a centro de control"],
      gradingCriteria: "Respuesta correcta dentro del tiempo establecido por procedimiento.",
      sortOrder: 2,
    },
    {
      templateId: templateCenace.id,
      title: "Control de Voltaje y Frecuencia",
      description: "Evaluación del manejo de parámetros eléctricos del sistema.",
      evaluationTopic: "control_voltaje",
      maxScore: 100,
      weight: 1.5,
      expectedActions: ["Monitorear niveles", "Ajustar reactivos", "Coordinar con generadores"],
      gradingCriteria: "Mantener parámetros dentro de límites operativos.",
      sortOrder: 3,
    },
    {
      templateId: templateCenace.id,
      title: "Comunicación Operativa",
      description: "Evaluación de las habilidades de comunicación durante la operación.",
      evaluationTopic: "comunicacion_operativa",
      maxScore: 100,
      weight: 1.0,
      expectedActions: ["Usar protocolo estándar", "Confirmar instrucciones", "Registrar comunicaciones"],
      gradingCriteria: "Comunicación clara y sin ambigüedades.",
      sortOrder: 4,
    },
    
    // Simulador Events
    {
      templateId: templateSimulador.id,
      title: "Detección de Falla",
      description: "Identificación rápida de la condición de falla en el sistema.",
      evaluationTopic: "protecciones_electricas",
      maxScore: 100,
      weight: 2.0,
      expectedActions: ["Identificar protecciones operadas", "Determinar tipo de falla", "Localizar zona afectada"],
      gradingCriteria: "Detección correcta en menos de 60 segundos.",
      sortOrder: 1,
    },
    {
      templateId: templateSimulador.id,
      title: "Aislamiento y Restablecimiento",
      description: "Ejecución de maniobras de aislamiento y recuperación del sistema.",
      evaluationTopic: "ejecucion_procedimientos",
      maxScore: 100,
      weight: 2.0,
      expectedActions: ["Aislar zona fallada", "Verificar ausencia de falla", "Restablecer servicio por etapas"],
      gradingCriteria: "Restablecimiento completo sin disparos secundarios.",
      sortOrder: 2,
    },
    {
      templateId: templateSimulador.id,
      title: "Gestión de Carga Post-Contingencia",
      description: "Manejo de flujos de potencia después del evento.",
      evaluationTopic: "control_frecuencia",
      maxScore: 100,
      weight: 1.5,
      expectedActions: ["Monitorear flujos", "Identificar sobrecargas", "Redistribuir carga"],
      gradingCriteria: "Mantener sistema dentro de límites térmicos.",
      sortOrder: 3,
    },
    
    // Campo Práctico Events
    {
      templateId: templateCampo.id,
      title: "Preparación de Maniobra",
      description: "Verificación de condiciones previas a la ejecución de maniobra.",
      evaluationTopic: "conocimiento_procedimientos",
      maxScore: 100,
      weight: 1.0,
      expectedActions: ["Revisar procedimiento aplicable", "Verificar EPP", "Confirmar condiciones de seguridad"],
      gradingCriteria: "Checklist completo antes de iniciar.",
      sortOrder: 1,
    },
    {
      templateId: templateCampo.id,
      title: "Ejecución de Maniobra en Campo",
      description: "Ejecución física de la secuencia de maniobra.",
      evaluationTopic: "ejecucion_procedimientos",
      maxScore: 100,
      weight: 2.0,
      expectedActions: ["Seguir secuencia del procedimiento", "Verificar cada paso", "Registrar tiempos"],
      gradingCriteria: "Ejecución sin errores y dentro del tiempo establecido.",
      sortOrder: 2,
    },
    {
      templateId: templateCampo.id,
      title: "Comunicación con Centro de Control",
      description: "Reportes durante la ejecución de la maniobra.",
      evaluationTopic: "comunicacion_operativa",
      maxScore: 100,
      weight: 1.5,
      expectedActions: ["Reportar inicio de maniobra", "Informar avances", "Confirmar finalización"],
      gradingCriteria: "Comunicación oportuna y completa.",
      sortOrder: 3,
    },
  ]);

  console.log("✅ Template events created");

  console.log("🎉 Database seeded successfully!");
  console.log("\n📊 Created:");
  console.log(`  - ${3} Companies`);
  console.log(`  - ${5} Users`);
  console.log(`  - ${7} Evaluation Topics`);
  console.log(`  - ${20} Topic Items`);
  console.log(`  - ${4} Simulator Scenarios`);
  console.log(`  - ${3} Training Cycles`);
  console.log(`  - ${8} Events`);
  console.log(`  - ${3} Evaluation Templates`);
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
