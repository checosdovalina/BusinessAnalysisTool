import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, serial, timestamp, integer, boolean, pgEnum, real } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["super_admin", "admin", "trainer", "student"]);
export const cycleStatusEnum = pgEnum("cycle_status", ["pending", "in_progress", "completed"]);
export const cycleTypeEnum = pgEnum("cycle_type", ["field", "simulator"]);
export const eventStatusEnum = pgEnum("event_status", ["pending", "pass", "fail", "skipped"]);
export const scenarioCategoryEnum = pgEnum("scenario_category", ["Fault", "Maintenance", "Overload", "Topology"]);
export const difficultyEnum = pgEnum("difficulty", ["Easy", "Medium", "Hard"]);

// Evaluation Topics / Temas de Evaluación
export const evaluationTopicEnum = pgEnum("evaluation_topic", [
  "control_voltaje",
  "conocimiento_procedimientos",
  "ejecucion_procedimientos", 
  "control_frecuencia",
  "topologia",
  "comunicacion_operativa",
  "protecciones_electricas",
  "personalizado"
]);

// Companies Table
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true });
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default("student"),
  companyId: integer("company_id").notNull().references(() => companies.id),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Cycles Table (Training Evaluation Cycles / Registro de Ciclo de Sesiones)
export const cycles = pgTable("cycles", {
  id: serial("id").primaryKey(),
  qualityCode: text("quality_code"), // Código de registro de calidad
  title: text("title").notNull(),
  generalObjective: text("general_objective"), // Objetivo general del ciclo de entrenamiento
  studentId: integer("student_id").notNull().references(() => users.id),
  trainerId: integer("trainer_id").notNull().references(() => users.id),
  companyId: integer("company_id").notNull().references(() => companies.id),
  status: cycleStatusEnum("status").notNull().default("pending"),
  type: cycleTypeEnum("type").notNull().default("field"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  trainingHours: real("training_hours"), // Horas de entrenamiento
  progress: integer("progress").notNull().default(0),
  score: real("score"), // Calificación general del entrenamiento
  minPassingScore: real("min_passing_score").default(70), // Calificación mínima aprobatoria
  evaluationTopics: text("evaluation_topics").array(), // Temas de evaluación seleccionados
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCycleSchema = createInsertSchema(cycles).omit({ id: true, createdAt: true });
export type InsertCycle = z.infer<typeof insertCycleSchema>;
export type Cycle = typeof cycles.$inferSelect;

// Events Table (Individual Evaluation Events / Registro de Eventos de Entrenamiento)
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  cycleId: integer("cycle_id").notNull().references(() => cycles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(), // Descripción de cada evento
  specificObjective: text("specific_objective"), // Objetivo particular de cada evento
  evaluationTopic: text("evaluation_topic"), // Tema de evaluación
  status: eventStatusEnum("status").notNull().default("pending"),
  score: real("score").notNull().default(0), // Calificación de cada evento
  maxScore: real("max_score").notNull(),
  weight: real("weight").default(1), // Ponderación
  expectedActions: text("expected_actions").array(), // Acciones operativas esperadas durante la actuación
  gradingCriteria: text("grading_criteria"), // Definición de criterios de calificación
  feedback: text("feedback"),
  maneuvers: text("maneuvers").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Simulator Scenarios Table
export const simulatorScenarios = pgTable("simulator_scenarios", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: scenarioCategoryEnum("category").notNull(),
  difficulty: difficultyEnum("difficulty").notNull(),
  description: text("description").notNull(),
  companyId: integer("company_id").references(() => companies.id), // null means global
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSimulatorScenarioSchema = createInsertSchema(simulatorScenarios).omit({ id: true, createdAt: true });
export type InsertSimulatorScenario = z.infer<typeof insertSimulatorScenarioSchema>;
export type SimulatorScenario = typeof simulatorScenarios.$inferSelect;

// Scenario Steps Table (Pasos configurables con validación)
export const scenarioSteps = pgTable("scenario_steps", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id").notNull().references(() => simulatorScenarios.id, { onDelete: "cascade" }),
  stepOrder: integer("step_order").notNull(),
  actionType: text("action_type").notNull(), // "breaker_open", "breaker_close", "voltage_adjust", "communication", etc.
  actionDescription: text("action_description").notNull(), // Descripción de la acción esperada
  expectedValue: text("expected_value"), // Valor esperado (ej: "ON", "230kV", etc.)
  correctResponse: text("correct_response").notNull(), // Respuesta afirmativa cuando es correcto
  incorrectResponse: text("incorrect_response").notNull(), // Respuesta cuando es incorrecto
  alternativeInterpretation: text("alternative_interpretation"), // Qué pasaría si no sigue el flujo
  points: integer("points").notNull().default(10), // Puntos por completar correctamente
  isCritical: boolean("is_critical").notNull().default(false), // Si falla este paso, falla toda la simulación
  timeLimit: integer("time_limit"), // Tiempo límite en segundos (opcional)
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertScenarioStepSchema = createInsertSchema(scenarioSteps).omit({ id: true, createdAt: true });
export type InsertScenarioStep = z.infer<typeof insertScenarioStepSchema>;
export type ScenarioStep = typeof scenarioSteps.$inferSelect;

// Simulator Sessions Table
export const simulatorSessions = pgTable("simulator_sessions", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id").notNull().references(() => simulatorScenarios.id),
  studentId: integer("student_id").notNull().references(() => users.id),
  trainerId: integer("trainer_id").references(() => users.id),
  companyId: integer("company_id").notNull().references(() => companies.id),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in seconds
  score: integer("score"),
  responseTime: integer("response_time"), // average in seconds
  maneuverPrecision: integer("maneuver_precision"), // percentage
  procedureAdherence: integer("procedure_adherence"), // percentage
  logs: text("logs").array().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSimulatorSessionSchema = createInsertSchema(simulatorSessions).omit({ id: true, createdAt: true });
export type InsertSimulatorSession = z.infer<typeof insertSimulatorSessionSchema>;
export type SimulatorSession = typeof simulatorSessions.$inferSelect;

// Session Step Results Table (Resultados de cada paso durante una sesión)
export const sessionStepResults = pgTable("session_step_results", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => simulatorSessions.id, { onDelete: "cascade" }),
  stepId: integer("step_id").notNull().references(() => scenarioSteps.id),
  actionTaken: text("action_taken"),
  isCorrect: boolean("is_correct").notNull(),
  pointsAwarded: integer("points_awarded").notNull().default(0),
  responseTime: integer("response_time"),
  feedbackShown: text("feedback_shown"),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const insertSessionStepResultSchema = createInsertSchema(sessionStepResults).omit({ id: true, completedAt: true });
export type InsertSessionStepResult = z.infer<typeof insertSessionStepResultSchema>;
export type SessionStepResult = typeof sessionStepResults.$inferSelect;

// Relations
export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  cycles: many(cycles),
  simulatorScenarios: many(simulatorScenarios),
  simulatorSessions: many(simulatorSessions),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  cyclesAsStudent: many(cycles, { relationName: "studentCycles" }),
  cyclesAsTrainer: many(cycles, { relationName: "trainerCycles" }),
  simulatorSessions: many(simulatorSessions),
}));

export const cyclesRelations = relations(cycles, ({ one, many }) => ({
  student: one(users, {
    fields: [cycles.studentId],
    references: [users.id],
    relationName: "studentCycles",
  }),
  trainer: one(users, {
    fields: [cycles.trainerId],
    references: [users.id],
    relationName: "trainerCycles",
  }),
  company: one(companies, {
    fields: [cycles.companyId],
    references: [companies.id],
  }),
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  cycle: one(cycles, {
    fields: [events.cycleId],
    references: [cycles.id],
  }),
}));

export const simulatorScenariosRelations = relations(simulatorScenarios, ({ one, many }) => ({
  company: one(companies, {
    fields: [simulatorScenarios.companyId],
    references: [companies.id],
  }),
  sessions: many(simulatorSessions),
  steps: many(scenarioSteps),
}));

export const scenarioStepsRelations = relations(scenarioSteps, ({ one, many }) => ({
  scenario: one(simulatorScenarios, {
    fields: [scenarioSteps.scenarioId],
    references: [simulatorScenarios.id],
  }),
  results: many(sessionStepResults),
}));

export const simulatorSessionsRelations = relations(simulatorSessions, ({ one, many }) => ({
  scenario: one(simulatorScenarios, {
    fields: [simulatorSessions.scenarioId],
    references: [simulatorScenarios.id],
  }),
  student: one(users, {
    fields: [simulatorSessions.studentId],
    references: [users.id],
  }),
  trainer: one(users, {
    fields: [simulatorSessions.trainerId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [simulatorSessions.companyId],
    references: [companies.id],
  }),
  stepResults: many(sessionStepResults),
}));

export const sessionStepResultsRelations = relations(sessionStepResults, ({ one }) => ({
  session: one(simulatorSessions, {
    fields: [sessionStepResults.sessionId],
    references: [simulatorSessions.id],
  }),
  step: one(scenarioSteps, {
    fields: [sessionStepResults.stepId],
    references: [scenarioSteps.id],
  }),
}));

// ============================================
// Evaluation Topics Module (Módulo de Temas de Evaluación)
// ============================================

// Evaluation Topics Table (Temas base de evaluación)
export const evaluationTopics = pgTable("evaluation_topics", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Nombre del tema: "Control de Voltaje", etc.
  code: text("code").notNull().unique(), // Código: "control_voltaje", etc.
  description: text("description"), // Descripción del tema
  icon: text("icon"), // Icono para UI
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEvaluationTopicSchema = createInsertSchema(evaluationTopics).omit({ id: true, createdAt: true });
export type InsertEvaluationTopic = z.infer<typeof insertEvaluationTopicSchema>;
export type EvaluationTopic = typeof evaluationTopics.$inferSelect;

// Evaluation Topic Items Table (Elementos específicos de cada tema - creados por instructores)
export const evaluationTopicItems = pgTable("evaluation_topic_items", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull().references(() => evaluationTopics.id, { onDelete: "cascade" }),
  companyId: integer("company_id").references(() => companies.id), // null = global
  createdById: integer("created_by_id").references(() => users.id), // Instructor que lo creó
  name: text("name").notNull(), // Nombre del elemento
  description: text("description"), // Descripción detallada
  expectedOutcomes: text("expected_outcomes").array(), // Resultados esperados
  gradingCriteria: text("grading_criteria"), // Criterios de calificación
  defaultWeight: real("default_weight").notNull().default(1), // Ponderación por defecto
  difficulty: difficultyEnum("difficulty").default("Medium"),
  estimatedTime: integer("estimated_time"), // Tiempo estimado en minutos
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEvaluationTopicItemSchema = createInsertSchema(evaluationTopicItems).omit({ id: true, createdAt: true });
export type InsertEvaluationTopicItem = z.infer<typeof insertEvaluationTopicItemSchema>;
export type EvaluationTopicItem = typeof evaluationTopicItems.$inferSelect;

// Cycle Topic Items Table (Elementos de temas seleccionados para un ciclo)
export const cycleTopicItems = pgTable("cycle_topic_items", {
  id: serial("id").primaryKey(),
  cycleId: integer("cycle_id").notNull().references(() => cycles.id, { onDelete: "cascade" }),
  topicItemId: integer("topic_item_id").notNull().references(() => evaluationTopicItems.id, { onDelete: "cascade" }),
  customFocus: text("custom_focus"), // Enfoque personalizado para este ciclo
  weight: real("weight").notNull().default(1), // Ponderación específica para este ciclo
  targetScore: real("target_score"), // Puntuación objetivo
  notes: text("notes"), // Notas del instructor
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCycleTopicItemSchema = createInsertSchema(cycleTopicItems).omit({ id: true, createdAt: true });
export type InsertCycleTopicItem = z.infer<typeof insertCycleTopicItemSchema>;
export type CycleTopicItem = typeof cycleTopicItems.$inferSelect;

// Relations for Evaluation Topics Module
export const evaluationTopicsRelations = relations(evaluationTopics, ({ many }) => ({
  items: many(evaluationTopicItems),
}));

export const evaluationTopicItemsRelations = relations(evaluationTopicItems, ({ one, many }) => ({
  topic: one(evaluationTopics, {
    fields: [evaluationTopicItems.topicId],
    references: [evaluationTopics.id],
  }),
  company: one(companies, {
    fields: [evaluationTopicItems.companyId],
    references: [companies.id],
  }),
  createdBy: one(users, {
    fields: [evaluationTopicItems.createdById],
    references: [users.id],
  }),
  cycleItems: many(cycleTopicItems),
}));

export const cycleTopicItemsRelations = relations(cycleTopicItems, ({ one }) => ({
  cycle: one(cycles, {
    fields: [cycleTopicItems.cycleId],
    references: [cycles.id],
  }),
  topicItem: one(evaluationTopicItems, {
    fields: [cycleTopicItems.topicItemId],
    references: [evaluationTopicItems.id],
  }),
}));
