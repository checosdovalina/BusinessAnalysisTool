import { 
  users, companies, cycles, events, simulatorScenarios, simulatorSessions,
  scenarioSteps, sessionStepResults,
  evaluationTopics, evaluationTopicItems, cycleTopicItems,
  trainingReports, annualTrainingPrograms,
  companySettings, userPreferences,
  trainingRequests, requestIncidents, requestRoles, requestProcedures, requestTopics, requestRecipients,
  evaluationTemplates, templateTopics, templateEvents,
  type User, type InsertUser,
  type Company, type InsertCompany,
  type Cycle, type InsertCycle,
  type Event, type InsertEvent,
  type SimulatorScenario, type InsertSimulatorScenario,
  type SimulatorSession, type InsertSimulatorSession,
  type ScenarioStep, type InsertScenarioStep,
  type SessionStepResult, type InsertSessionStepResult,
  type EvaluationTopic, type InsertEvaluationTopic,
  type EvaluationTopicItem, type InsertEvaluationTopicItem,
  type CycleTopicItem, type InsertCycleTopicItem,
  type TrainingReport, type InsertTrainingReport,
  type AnnualTrainingProgram, type InsertAnnualTrainingProgram,
  type CompanySettings, type InsertCompanySettings,
  type UserPreferences, type InsertUserPreferences,
  type TrainingRequest, type InsertTrainingRequest,
  type RequestIncident, type InsertRequestIncident,
  type RequestRole, type InsertRequestRole,
  type RequestProcedure, type InsertRequestProcedure,
  type RequestTopic, type InsertRequestTopic,
  type RequestRecipient, type InsertRequestRecipient,
  type EvaluationTemplate, type InsertEvaluationTemplate,
  type TemplateTopic, type InsertTemplateTopic,
  type TemplateEvent, type InsertTemplateEvent,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, isNull, asc, or } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;
  getUsersByCompany(companyId: number): Promise<User[]>;
  
  // Companies
  getCompany(id: number): Promise<Company | undefined>;
  getAllCompanies(): Promise<Company[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, updates: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: number): Promise<void>;
  
  // Cycles
  getCycle(id: number): Promise<Cycle | undefined>;
  getCyclesByCompany(companyId: number): Promise<Cycle[]>;
  getCyclesByStudent(studentId: number): Promise<Cycle[]>;
  getCyclesByTrainer(trainerId: number): Promise<Cycle[]>;
  createCycle(cycle: InsertCycle): Promise<Cycle>;
  updateCycle(id: number, updates: Partial<InsertCycle>): Promise<Cycle | undefined>;
  deleteCycle(id: number): Promise<void>;
  
  // Events
  getEvent(id: number): Promise<Event | undefined>;
  getEventsByCycle(cycleId: number): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, updates: Partial<InsertEvent>): Promise<Event | undefined>;
  
  // Simulator Scenarios
  getSimulatorScenario(id: number): Promise<SimulatorScenario | undefined>;
  getAllSimulatorScenarios(): Promise<SimulatorScenario[]>;
  getSimulatorScenariosByCompany(companyId: number | null): Promise<SimulatorScenario[]>;
  createSimulatorScenario(scenario: InsertSimulatorScenario): Promise<SimulatorScenario>;
  updateSimulatorScenario(id: number, updates: Partial<InsertSimulatorScenario>): Promise<SimulatorScenario | undefined>;
  deleteSimulatorScenario(id: number): Promise<void>;
  
  // Simulator Sessions
  getSimulatorSession(id: number): Promise<SimulatorSession | undefined>;
  getSimulatorSessionsByCompany(companyId: number): Promise<SimulatorSession[]>;
  getSimulatorSessionsByStudent(studentId: number): Promise<SimulatorSession[]>;
  createSimulatorSession(session: InsertSimulatorSession): Promise<SimulatorSession>;
  updateSimulatorSession(id: number, updates: Partial<InsertSimulatorSession>): Promise<SimulatorSession | undefined>;
  
  // Scenario Steps
  getScenarioStep(id: number): Promise<ScenarioStep | undefined>;
  getScenarioSteps(scenarioId: number): Promise<ScenarioStep[]>;
  createScenarioStep(step: InsertScenarioStep): Promise<ScenarioStep>;
  createScenarioStepsBatch(steps: InsertScenarioStep[]): Promise<ScenarioStep[]>;
  updateScenarioStep(id: number, updates: Partial<InsertScenarioStep>): Promise<ScenarioStep | undefined>;
  deleteScenarioStep(id: number): Promise<void>;
  deleteScenarioSteps(scenarioId: number): Promise<void>;
  
  // Session Step Results
  getSessionStepResult(id: number): Promise<SessionStepResult | undefined>;
  getSessionStepResults(sessionId: number): Promise<SessionStepResult[]>;
  createSessionStepResult(result: InsertSessionStepResult): Promise<SessionStepResult>;
  
  // Evaluation Topics
  getEvaluationTopic(id: number): Promise<EvaluationTopic | undefined>;
  getAllEvaluationTopics(): Promise<EvaluationTopic[]>;
  createEvaluationTopic(topic: InsertEvaluationTopic): Promise<EvaluationTopic>;
  updateEvaluationTopic(id: number, updates: Partial<InsertEvaluationTopic>): Promise<EvaluationTopic | undefined>;
  deleteEvaluationTopic(id: number): Promise<void>;
  
  // Evaluation Topic Items
  getEvaluationTopicItem(id: number): Promise<EvaluationTopicItem | undefined>;
  getEvaluationTopicItems(topicId: number): Promise<EvaluationTopicItem[]>;
  getEvaluationTopicItemsByCompany(companyId: number | null): Promise<EvaluationTopicItem[]>;
  createEvaluationTopicItem(item: InsertEvaluationTopicItem): Promise<EvaluationTopicItem>;
  updateEvaluationTopicItem(id: number, updates: Partial<InsertEvaluationTopicItem>): Promise<EvaluationTopicItem | undefined>;
  deleteEvaluationTopicItem(id: number): Promise<void>;
  
  // Cycle Topic Items
  getCycleTopicItem(id: number): Promise<CycleTopicItem | undefined>;
  getCycleTopicItems(cycleId: number): Promise<CycleTopicItem[]>;
  createCycleTopicItem(item: InsertCycleTopicItem): Promise<CycleTopicItem>;
  updateCycleTopicItem(id: number, updates: Partial<InsertCycleTopicItem>): Promise<CycleTopicItem | undefined>;
  deleteCycleTopicItem(id: number): Promise<void>;
  deleteCycleTopicItems(cycleId: number): Promise<void>;
  syncCycleTopicItems(cycleId: number, items: Array<{ topicItemId: number; weight: number; customFocus?: string }>): Promise<CycleTopicItem[]>;
  
  // Training Reports
  getTrainingReport(id: number): Promise<TrainingReport | undefined>;
  getTrainingReportsByCompany(companyId: number): Promise<TrainingReport[]>;
  getTrainingReportsByStudent(studentId: number): Promise<TrainingReport[]>;
  getTrainingReportByCycle(cycleId: number): Promise<TrainingReport | undefined>;
  createTrainingReport(report: InsertTrainingReport): Promise<TrainingReport>;
  updateTrainingReport(id: number, updates: Partial<InsertTrainingReport>): Promise<TrainingReport | undefined>;
  deleteTrainingReport(id: number): Promise<void>;
  
  // Annual Training Programs
  getAnnualTrainingProgram(id: number): Promise<AnnualTrainingProgram | undefined>;
  getAnnualTrainingProgramsByCompany(companyId: number, year?: number): Promise<AnnualTrainingProgram[]>;
  getAnnualTrainingProgramByStudent(studentId: number, year: number): Promise<AnnualTrainingProgram | undefined>;
  createAnnualTrainingProgram(program: InsertAnnualTrainingProgram): Promise<AnnualTrainingProgram>;
  updateAnnualTrainingProgram(id: number, updates: Partial<InsertAnnualTrainingProgram>): Promise<AnnualTrainingProgram | undefined>;
  
  // Company Settings
  getCompanySettings(companyId: number): Promise<CompanySettings | undefined>;
  createCompanySettings(settings: InsertCompanySettings): Promise<CompanySettings>;
  updateCompanySettings(companyId: number, updates: Partial<InsertCompanySettings>): Promise<CompanySettings | undefined>;
  
  // User Preferences
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: number, updates: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined>;
  
  // Training Requests
  getTrainingRequest(id: number): Promise<TrainingRequest | undefined>;
  getTrainingRequestsByCompany(companyId: number): Promise<TrainingRequest[]>;
  createTrainingRequest(request: InsertTrainingRequest): Promise<TrainingRequest>;
  updateTrainingRequest(id: number, updates: Partial<InsertTrainingRequest>): Promise<TrainingRequest | undefined>;
  deleteTrainingRequest(id: number): Promise<void>;
  
  // Request Incidents
  getRequestIncidents(requestId: number): Promise<RequestIncident[]>;
  createRequestIncident(incident: InsertRequestIncident): Promise<RequestIncident>;
  updateRequestIncident(id: number, updates: Partial<InsertRequestIncident>): Promise<RequestIncident | undefined>;
  deleteRequestIncident(id: number): Promise<void>;
  
  // Request Roles
  getRequestRoles(requestId: number): Promise<RequestRole[]>;
  createRequestRole(role: InsertRequestRole): Promise<RequestRole>;
  updateRequestRole(id: number, updates: Partial<InsertRequestRole>): Promise<RequestRole | undefined>;
  deleteRequestRole(id: number): Promise<void>;
  
  // Request Procedures
  getRequestProcedures(requestId: number): Promise<RequestProcedure[]>;
  createRequestProcedure(procedure: InsertRequestProcedure): Promise<RequestProcedure>;
  updateRequestProcedure(id: number, updates: Partial<InsertRequestProcedure>): Promise<RequestProcedure | undefined>;
  deleteRequestProcedure(id: number): Promise<void>;
  
  // Request Topics
  getRequestTopics(requestId: number): Promise<RequestTopic[]>;
  createRequestTopic(topic: InsertRequestTopic): Promise<RequestTopic>;
  updateRequestTopic(id: number, updates: Partial<InsertRequestTopic>): Promise<RequestTopic | undefined>;
  deleteRequestTopic(id: number): Promise<void>;
  
  // Request Recipients
  getRequestRecipients(requestId: number): Promise<RequestRecipient[]>;
  createRequestRecipient(recipient: InsertRequestRecipient): Promise<RequestRecipient>;
  deleteRequestRecipient(id: number): Promise<void>;
  
  // Evaluation Templates
  getEvaluationTemplate(id: number): Promise<EvaluationTemplate | undefined>;
  getAllEvaluationTemplates(): Promise<EvaluationTemplate[]>;
  getEvaluationTemplatesByCompany(companyId: number | null): Promise<EvaluationTemplate[]>;
  getEvaluationTemplateWithDetails(id: number): Promise<{ template: EvaluationTemplate; topics: TemplateTopic[]; events: TemplateEvent[] } | undefined>;
  createEvaluationTemplate(template: InsertEvaluationTemplate): Promise<EvaluationTemplate>;
  updateEvaluationTemplate(id: number, updates: Partial<InsertEvaluationTemplate>): Promise<EvaluationTemplate | undefined>;
  deleteEvaluationTemplate(id: number): Promise<void>;
  
  // Template Topics
  getTemplateTopics(templateId: number): Promise<TemplateTopic[]>;
  createTemplateTopic(topic: InsertTemplateTopic): Promise<TemplateTopic>;
  deleteTemplateTopics(templateId: number): Promise<void>;
  
  // Template Events
  getTemplateEvents(templateId: number): Promise<TemplateEvent[]>;
  createTemplateEvent(event: InsertTemplateEvent): Promise<TemplateEvent>;
  deleteTemplateEvents(templateId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getUsersByCompany(companyId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.companyId, companyId));
  }

  // Companies
  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async getAllCompanies(): Promise<Company[]> {
    return await db.select().from(companies);
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db.insert(companies).values(insertCompany).returning();
    return company;
  }

  async updateCompany(id: number, updates: Partial<InsertCompany>): Promise<Company | undefined> {
    const [company] = await db.update(companies).set(updates).where(eq(companies.id, id)).returning();
    return company || undefined;
  }

  async deleteCompany(id: number): Promise<void> {
    await db.delete(companies).where(eq(companies.id, id));
  }

  // Cycles
  async getCycle(id: number): Promise<Cycle | undefined> {
    const [cycle] = await db.select().from(cycles).where(eq(cycles.id, id));
    return cycle || undefined;
  }

  async getCyclesByCompany(companyId: number): Promise<Cycle[]> {
    return await db.select().from(cycles).where(eq(cycles.companyId, companyId)).orderBy(desc(cycles.createdAt));
  }

  async getCyclesByStudent(studentId: number): Promise<Cycle[]> {
    return await db.select().from(cycles).where(eq(cycles.studentId, studentId)).orderBy(desc(cycles.createdAt));
  }

  async getCyclesByTrainer(trainerId: number): Promise<Cycle[]> {
    return await db.select().from(cycles).where(eq(cycles.trainerId, trainerId)).orderBy(desc(cycles.createdAt));
  }

  async createCycle(insertCycle: InsertCycle): Promise<Cycle> {
    const [cycle] = await db.insert(cycles).values(insertCycle).returning();
    return cycle;
  }

  async updateCycle(id: number, updates: Partial<InsertCycle>): Promise<Cycle | undefined> {
    const [cycle] = await db.update(cycles).set(updates).where(eq(cycles.id, id)).returning();
    return cycle || undefined;
  }

  async deleteCycle(id: number): Promise<void> {
    await db.delete(events).where(eq(events.cycleId, id));
    await db.delete(cycles).where(eq(cycles.id, id));
  }

  // Events
  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async getEventsByCycle(cycleId: number): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.cycleId, cycleId)).orderBy(events.id);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(insertEvent).returning();
    return event;
  }

  async updateEvent(id: number, updates: Partial<InsertEvent>): Promise<Event | undefined> {
    const [event] = await db.update(events).set(updates).where(eq(events.id, id)).returning();
    return event || undefined;
  }

  // Simulator Scenarios
  async getSimulatorScenario(id: number): Promise<SimulatorScenario | undefined> {
    const [scenario] = await db.select().from(simulatorScenarios).where(eq(simulatorScenarios.id, id));
    return scenario || undefined;
  }

  async getAllSimulatorScenarios(): Promise<SimulatorScenario[]> {
    return await db.select().from(simulatorScenarios);
  }

  async getSimulatorScenariosByCompany(companyId: number | null): Promise<SimulatorScenario[]> {
    if (companyId === null) {
      return await db.select().from(simulatorScenarios).where(isNull(simulatorScenarios.companyId));
    }
    return await db.select().from(simulatorScenarios).where(eq(simulatorScenarios.companyId, companyId));
  }

  async createSimulatorScenario(insertScenario: InsertSimulatorScenario): Promise<SimulatorScenario> {
    const [scenario] = await db.insert(simulatorScenarios).values(insertScenario).returning();
    return scenario;
  }

  async updateSimulatorScenario(id: number, updates: Partial<InsertSimulatorScenario>): Promise<SimulatorScenario | undefined> {
    const [scenario] = await db.update(simulatorScenarios).set(updates).where(eq(simulatorScenarios.id, id)).returning();
    return scenario || undefined;
  }

  async deleteSimulatorScenario(id: number): Promise<void> {
    await db.delete(scenarioSteps).where(eq(scenarioSteps.scenarioId, id));
    await db.delete(simulatorScenarios).where(eq(simulatorScenarios.id, id));
  }

  // Simulator Sessions
  async getSimulatorSession(id: number): Promise<SimulatorSession | undefined> {
    const [session] = await db.select().from(simulatorSessions).where(eq(simulatorSessions.id, id));
    return session || undefined;
  }

  async getSimulatorSessionsByCompany(companyId: number): Promise<SimulatorSession[]> {
    return await db.select().from(simulatorSessions).where(eq(simulatorSessions.companyId, companyId)).orderBy(desc(simulatorSessions.createdAt));
  }

  async getSimulatorSessionsByStudent(studentId: number): Promise<SimulatorSession[]> {
    return await db.select().from(simulatorSessions).where(eq(simulatorSessions.studentId, studentId)).orderBy(desc(simulatorSessions.createdAt));
  }

  async createSimulatorSession(insertSession: InsertSimulatorSession): Promise<SimulatorSession> {
    const [session] = await db.insert(simulatorSessions).values(insertSession).returning();
    return session;
  }

  async updateSimulatorSession(id: number, updates: Partial<InsertSimulatorSession>): Promise<SimulatorSession | undefined> {
    const [session] = await db.update(simulatorSessions).set(updates).where(eq(simulatorSessions.id, id)).returning();
    return session || undefined;
  }

  // Scenario Steps
  async getScenarioStep(id: number): Promise<ScenarioStep | undefined> {
    const [step] = await db.select().from(scenarioSteps).where(eq(scenarioSteps.id, id));
    return step || undefined;
  }

  async getScenarioSteps(scenarioId: number): Promise<ScenarioStep[]> {
    return await db.select().from(scenarioSteps)
      .where(eq(scenarioSteps.scenarioId, scenarioId))
      .orderBy(asc(scenarioSteps.stepOrder));
  }

  async createScenarioStep(insertStep: InsertScenarioStep): Promise<ScenarioStep> {
    const [step] = await db.insert(scenarioSteps).values(insertStep).returning();
    return step;
  }

  async createScenarioStepsBatch(insertSteps: InsertScenarioStep[]): Promise<ScenarioStep[]> {
    if (insertSteps.length === 0) return [];
    return await db.insert(scenarioSteps).values(insertSteps).returning();
  }

  async updateScenarioStep(id: number, updates: Partial<InsertScenarioStep>): Promise<ScenarioStep | undefined> {
    const [step] = await db.update(scenarioSteps).set(updates).where(eq(scenarioSteps.id, id)).returning();
    return step || undefined;
  }

  async deleteScenarioStep(id: number): Promise<void> {
    await db.delete(scenarioSteps).where(eq(scenarioSteps.id, id));
  }

  async deleteScenarioSteps(scenarioId: number): Promise<void> {
    await db.delete(scenarioSteps).where(eq(scenarioSteps.scenarioId, scenarioId));
  }

  // Session Step Results
  async getSessionStepResult(id: number): Promise<SessionStepResult | undefined> {
    const [result] = await db.select().from(sessionStepResults).where(eq(sessionStepResults.id, id));
    return result || undefined;
  }

  async getSessionStepResults(sessionId: number): Promise<SessionStepResult[]> {
    return await db.select().from(sessionStepResults)
      .where(eq(sessionStepResults.sessionId, sessionId))
      .orderBy(asc(sessionStepResults.completedAt));
  }

  async createSessionStepResult(insertResult: InsertSessionStepResult): Promise<SessionStepResult> {
    const [result] = await db.insert(sessionStepResults).values(insertResult).returning();
    return result;
  }

  // Evaluation Topics
  async getEvaluationTopic(id: number): Promise<EvaluationTopic | undefined> {
    const [topic] = await db.select().from(evaluationTopics).where(eq(evaluationTopics.id, id));
    return topic || undefined;
  }

  async getAllEvaluationTopics(): Promise<EvaluationTopic[]> {
    return await db.select().from(evaluationTopics)
      .where(eq(evaluationTopics.isActive, true))
      .orderBy(asc(evaluationTopics.sortOrder));
  }

  async createEvaluationTopic(insertTopic: InsertEvaluationTopic): Promise<EvaluationTopic> {
    const [topic] = await db.insert(evaluationTopics).values(insertTopic).returning();
    return topic;
  }

  async updateEvaluationTopic(id: number, updates: Partial<InsertEvaluationTopic>): Promise<EvaluationTopic | undefined> {
    const [topic] = await db.update(evaluationTopics).set(updates).where(eq(evaluationTopics.id, id)).returning();
    return topic || undefined;
  }

  async deleteEvaluationTopic(id: number): Promise<void> {
    await db.delete(evaluationTopicItems).where(eq(evaluationTopicItems.topicId, id));
    await db.delete(evaluationTopics).where(eq(evaluationTopics.id, id));
  }

  // Evaluation Topic Items
  async getEvaluationTopicItem(id: number): Promise<EvaluationTopicItem | undefined> {
    const [item] = await db.select().from(evaluationTopicItems).where(eq(evaluationTopicItems.id, id));
    return item || undefined;
  }

  async getEvaluationTopicItems(topicId: number): Promise<EvaluationTopicItem[]> {
    return await db.select().from(evaluationTopicItems)
      .where(and(
        eq(evaluationTopicItems.topicId, topicId),
        eq(evaluationTopicItems.isActive, true)
      ))
      .orderBy(asc(evaluationTopicItems.name));
  }

  async getEvaluationTopicItemsByCompany(companyId: number | null): Promise<EvaluationTopicItem[]> {
    if (companyId === null) {
      return await db.select().from(evaluationTopicItems)
        .where(and(
          isNull(evaluationTopicItems.companyId),
          eq(evaluationTopicItems.isActive, true)
        ))
        .orderBy(asc(evaluationTopicItems.name));
    }
    return await db.select().from(evaluationTopicItems)
      .where(and(
        or(
          eq(evaluationTopicItems.companyId, companyId),
          isNull(evaluationTopicItems.companyId)
        ),
        eq(evaluationTopicItems.isActive, true)
      ))
      .orderBy(asc(evaluationTopicItems.name));
  }

  async createEvaluationTopicItem(insertItem: InsertEvaluationTopicItem): Promise<EvaluationTopicItem> {
    const [item] = await db.insert(evaluationTopicItems).values(insertItem).returning();
    return item;
  }

  async updateEvaluationTopicItem(id: number, updates: Partial<InsertEvaluationTopicItem>): Promise<EvaluationTopicItem | undefined> {
    const [item] = await db.update(evaluationTopicItems).set(updates).where(eq(evaluationTopicItems.id, id)).returning();
    return item || undefined;
  }

  async deleteEvaluationTopicItem(id: number): Promise<void> {
    await db.delete(cycleTopicItems).where(eq(cycleTopicItems.topicItemId, id));
    await db.delete(evaluationTopicItems).where(eq(evaluationTopicItems.id, id));
  }

  // Cycle Topic Items
  async getCycleTopicItem(id: number): Promise<CycleTopicItem | undefined> {
    const [item] = await db.select().from(cycleTopicItems).where(eq(cycleTopicItems.id, id));
    return item || undefined;
  }

  async getCycleTopicItems(cycleId: number): Promise<CycleTopicItem[]> {
    return await db.select().from(cycleTopicItems)
      .where(eq(cycleTopicItems.cycleId, cycleId))
      .orderBy(asc(cycleTopicItems.id));
  }

  async createCycleTopicItem(insertItem: InsertCycleTopicItem): Promise<CycleTopicItem> {
    const [item] = await db.insert(cycleTopicItems).values(insertItem).returning();
    return item;
  }

  async updateCycleTopicItem(id: number, updates: Partial<InsertCycleTopicItem>): Promise<CycleTopicItem | undefined> {
    const [item] = await db.update(cycleTopicItems).set(updates).where(eq(cycleTopicItems.id, id)).returning();
    return item || undefined;
  }

  async deleteCycleTopicItem(id: number): Promise<void> {
    await db.delete(cycleTopicItems).where(eq(cycleTopicItems.id, id));
  }

  async deleteCycleTopicItems(cycleId: number): Promise<void> {
    await db.delete(cycleTopicItems).where(eq(cycleTopicItems.cycleId, cycleId));
  }

  async syncCycleTopicItems(
    cycleId: number, 
    items: Array<{ topicItemId: number; weight: number; customFocus?: string }>
  ): Promise<CycleTopicItem[]> {
    await db.delete(cycleTopicItems).where(eq(cycleTopicItems.cycleId, cycleId));
    
    if (items.length === 0) {
      return [];
    }
    
    const itemsToInsert = items.map(item => ({
      cycleId,
      topicItemId: item.topicItemId,
      weight: item.weight,
      customFocus: item.customFocus || null,
    }));
    
    const insertedItems = await db.insert(cycleTopicItems).values(itemsToInsert).returning();
    return insertedItems;
  }

  // Training Reports
  async getTrainingReport(id: number): Promise<TrainingReport | undefined> {
    const [report] = await db.select().from(trainingReports).where(eq(trainingReports.id, id));
    return report || undefined;
  }

  async getTrainingReportsByCompany(companyId: number): Promise<TrainingReport[]> {
    return db.select().from(trainingReports).where(eq(trainingReports.companyId, companyId)).orderBy(desc(trainingReports.createdAt));
  }

  async getTrainingReportsByStudent(studentId: number): Promise<TrainingReport[]> {
    return db.select().from(trainingReports).where(eq(trainingReports.studentId, studentId)).orderBy(desc(trainingReports.createdAt));
  }

  async getTrainingReportByCycle(cycleId: number): Promise<TrainingReport | undefined> {
    const [report] = await db.select().from(trainingReports).where(eq(trainingReports.cycleId, cycleId));
    return report || undefined;
  }

  async createTrainingReport(report: InsertTrainingReport): Promise<TrainingReport> {
    const [newReport] = await db.insert(trainingReports).values(report).returning();
    return newReport;
  }

  async updateTrainingReport(id: number, updates: Partial<InsertTrainingReport>): Promise<TrainingReport | undefined> {
    const [report] = await db.update(trainingReports).set(updates).where(eq(trainingReports.id, id)).returning();
    return report || undefined;
  }

  async deleteTrainingReport(id: number): Promise<void> {
    await db.delete(trainingReports).where(eq(trainingReports.id, id));
  }

  // Annual Training Programs
  async getAnnualTrainingProgram(id: number): Promise<AnnualTrainingProgram | undefined> {
    const [program] = await db.select().from(annualTrainingPrograms).where(eq(annualTrainingPrograms.id, id));
    return program || undefined;
  }

  async getAnnualTrainingProgramsByCompany(companyId: number, year?: number): Promise<AnnualTrainingProgram[]> {
    if (year) {
      return db.select().from(annualTrainingPrograms)
        .where(and(eq(annualTrainingPrograms.companyId, companyId), eq(annualTrainingPrograms.year, year)));
    }
    return db.select().from(annualTrainingPrograms).where(eq(annualTrainingPrograms.companyId, companyId));
  }

  async getAnnualTrainingProgramByStudent(studentId: number, year: number): Promise<AnnualTrainingProgram | undefined> {
    const [program] = await db.select().from(annualTrainingPrograms)
      .where(and(eq(annualTrainingPrograms.studentId, studentId), eq(annualTrainingPrograms.year, year)));
    return program || undefined;
  }

  async createAnnualTrainingProgram(program: InsertAnnualTrainingProgram): Promise<AnnualTrainingProgram> {
    const [newProgram] = await db.insert(annualTrainingPrograms).values(program).returning();
    return newProgram;
  }

  async updateAnnualTrainingProgram(id: number, updates: Partial<InsertAnnualTrainingProgram>): Promise<AnnualTrainingProgram | undefined> {
    const [program] = await db.update(annualTrainingPrograms).set(updates).where(eq(annualTrainingPrograms.id, id)).returning();
    return program || undefined;
  }

  // Company Settings
  async getCompanySettings(companyId: number): Promise<CompanySettings | undefined> {
    const [settings] = await db.select().from(companySettings).where(eq(companySettings.companyId, companyId));
    return settings || undefined;
  }

  async createCompanySettings(settings: InsertCompanySettings): Promise<CompanySettings> {
    const [newSettings] = await db.insert(companySettings).values(settings).returning();
    return newSettings;
  }

  async updateCompanySettings(companyId: number, updates: Partial<InsertCompanySettings>): Promise<CompanySettings | undefined> {
    const [settings] = await db.update(companySettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companySettings.companyId, companyId))
      .returning();
    return settings || undefined;
  }

  // User Preferences
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    const [preferences] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return preferences || undefined;
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const [newPreferences] = await db.insert(userPreferences).values(preferences).returning();
    return newPreferences;
  }

  async updateUserPreferences(userId: number, updates: Partial<InsertUserPreferences>): Promise<UserPreferences | undefined> {
    const [preferences] = await db.update(userPreferences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userPreferences.userId, userId))
      .returning();
    return preferences || undefined;
  }

  // Training Requests
  async getTrainingRequest(id: number): Promise<TrainingRequest | undefined> {
    const [request] = await db.select().from(trainingRequests).where(eq(trainingRequests.id, id));
    return request || undefined;
  }

  async getTrainingRequestsByCompany(companyId: number): Promise<TrainingRequest[]> {
    return db.select().from(trainingRequests)
      .where(eq(trainingRequests.companyId, companyId))
      .orderBy(desc(trainingRequests.createdAt));
  }

  async createTrainingRequest(request: InsertTrainingRequest): Promise<TrainingRequest> {
    const [newRequest] = await db.insert(trainingRequests).values(request).returning();
    return newRequest;
  }

  async updateTrainingRequest(id: number, updates: Partial<InsertTrainingRequest>): Promise<TrainingRequest | undefined> {
    const [request] = await db.update(trainingRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(trainingRequests.id, id))
      .returning();
    return request || undefined;
  }

  async deleteTrainingRequest(id: number): Promise<void> {
    await db.delete(trainingRequests).where(eq(trainingRequests.id, id));
  }

  // Request Incidents
  async getRequestIncidents(requestId: number): Promise<RequestIncident[]> {
    return db.select().from(requestIncidents).where(eq(requestIncidents.requestId, requestId));
  }

  async createRequestIncident(incident: InsertRequestIncident): Promise<RequestIncident> {
    const [newIncident] = await db.insert(requestIncidents).values(incident).returning();
    return newIncident;
  }

  async updateRequestIncident(id: number, updates: Partial<InsertRequestIncident>): Promise<RequestIncident | undefined> {
    const [incident] = await db.update(requestIncidents).set(updates).where(eq(requestIncidents.id, id)).returning();
    return incident || undefined;
  }

  async deleteRequestIncident(id: number): Promise<void> {
    await db.delete(requestIncidents).where(eq(requestIncidents.id, id));
  }

  // Request Roles
  async getRequestRoles(requestId: number): Promise<RequestRole[]> {
    return db.select().from(requestRoles).where(eq(requestRoles.requestId, requestId));
  }

  async createRequestRole(role: InsertRequestRole): Promise<RequestRole> {
    const [newRole] = await db.insert(requestRoles).values(role).returning();
    return newRole;
  }

  async updateRequestRole(id: number, updates: Partial<InsertRequestRole>): Promise<RequestRole | undefined> {
    const [role] = await db.update(requestRoles).set(updates).where(eq(requestRoles.id, id)).returning();
    return role || undefined;
  }

  async deleteRequestRole(id: number): Promise<void> {
    await db.delete(requestRoles).where(eq(requestRoles.id, id));
  }

  // Request Procedures
  async getRequestProcedures(requestId: number): Promise<RequestProcedure[]> {
    return db.select().from(requestProcedures).where(eq(requestProcedures.requestId, requestId));
  }

  async createRequestProcedure(procedure: InsertRequestProcedure): Promise<RequestProcedure> {
    const [newProcedure] = await db.insert(requestProcedures).values(procedure).returning();
    return newProcedure;
  }

  async updateRequestProcedure(id: number, updates: Partial<InsertRequestProcedure>): Promise<RequestProcedure | undefined> {
    const [procedure] = await db.update(requestProcedures).set(updates).where(eq(requestProcedures.id, id)).returning();
    return procedure || undefined;
  }

  async deleteRequestProcedure(id: number): Promise<void> {
    await db.delete(requestProcedures).where(eq(requestProcedures.id, id));
  }

  // Request Topics
  async getRequestTopics(requestId: number): Promise<RequestTopic[]> {
    return db.select().from(requestTopics).where(eq(requestTopics.requestId, requestId));
  }

  async createRequestTopic(topic: InsertRequestTopic): Promise<RequestTopic> {
    const [newTopic] = await db.insert(requestTopics).values(topic).returning();
    return newTopic;
  }

  async updateRequestTopic(id: number, updates: Partial<InsertRequestTopic>): Promise<RequestTopic | undefined> {
    const [topic] = await db.update(requestTopics).set(updates).where(eq(requestTopics.id, id)).returning();
    return topic || undefined;
  }

  async deleteRequestTopic(id: number): Promise<void> {
    await db.delete(requestTopics).where(eq(requestTopics.id, id));
  }

  // Request Recipients
  async getRequestRecipients(requestId: number): Promise<RequestRecipient[]> {
    return db.select().from(requestRecipients).where(eq(requestRecipients.requestId, requestId));
  }

  async createRequestRecipient(recipient: InsertRequestRecipient): Promise<RequestRecipient> {
    const [newRecipient] = await db.insert(requestRecipients).values(recipient).returning();
    return newRecipient;
  }

  async deleteRequestRecipient(id: number): Promise<void> {
    await db.delete(requestRecipients).where(eq(requestRecipients.id, id));
  }

  // Evaluation Templates
  async getEvaluationTemplate(id: number): Promise<EvaluationTemplate | undefined> {
    const [template] = await db.select().from(evaluationTemplates).where(eq(evaluationTemplates.id, id));
    return template || undefined;
  }

  async getAllEvaluationTemplates(): Promise<EvaluationTemplate[]> {
    return db.select().from(evaluationTemplates).where(eq(evaluationTemplates.isActive, true)).orderBy(asc(evaluationTemplates.sortOrder));
  }

  async getEvaluationTemplatesByCompany(companyId: number | null): Promise<EvaluationTemplate[]> {
    if (companyId === null) {
      return db.select().from(evaluationTemplates)
        .where(and(
          isNull(evaluationTemplates.companyId),
          eq(evaluationTemplates.isActive, true)
        ))
        .orderBy(asc(evaluationTemplates.sortOrder));
    }
    return db.select().from(evaluationTemplates)
      .where(and(
        or(
          isNull(evaluationTemplates.companyId),
          eq(evaluationTemplates.companyId, companyId)
        ),
        eq(evaluationTemplates.isActive, true)
      ))
      .orderBy(asc(evaluationTemplates.sortOrder));
  }

  async getEvaluationTemplateWithDetails(id: number): Promise<{ template: EvaluationTemplate; topics: TemplateTopic[]; events: TemplateEvent[] } | undefined> {
    const template = await this.getEvaluationTemplate(id);
    if (!template) return undefined;
    
    const topics = await this.getTemplateTopics(id);
    const events = await this.getTemplateEvents(id);
    
    return { template, topics, events };
  }

  async createEvaluationTemplate(template: InsertEvaluationTemplate): Promise<EvaluationTemplate> {
    const [newTemplate] = await db.insert(evaluationTemplates).values(template).returning();
    return newTemplate;
  }

  async updateEvaluationTemplate(id: number, updates: Partial<InsertEvaluationTemplate>): Promise<EvaluationTemplate | undefined> {
    const [template] = await db.update(evaluationTemplates).set(updates).where(eq(evaluationTemplates.id, id)).returning();
    return template || undefined;
  }

  async deleteEvaluationTemplate(id: number): Promise<void> {
    await db.delete(evaluationTemplates).where(eq(evaluationTemplates.id, id));
  }

  // Template Topics
  async getTemplateTopics(templateId: number): Promise<TemplateTopic[]> {
    return db.select().from(templateTopics)
      .where(eq(templateTopics.templateId, templateId))
      .orderBy(asc(templateTopics.sortOrder));
  }

  async createTemplateTopic(topic: InsertTemplateTopic): Promise<TemplateTopic> {
    const [newTopic] = await db.insert(templateTopics).values(topic).returning();
    return newTopic;
  }

  async deleteTemplateTopics(templateId: number): Promise<void> {
    await db.delete(templateTopics).where(eq(templateTopics.templateId, templateId));
  }

  // Template Events
  async getTemplateEvents(templateId: number): Promise<TemplateEvent[]> {
    return db.select().from(templateEvents)
      .where(eq(templateEvents.templateId, templateId))
      .orderBy(asc(templateEvents.sortOrder));
  }

  async createTemplateEvent(event: InsertTemplateEvent): Promise<TemplateEvent> {
    const [newEvent] = await db.insert(templateEvents).values(event).returning();
    return newEvent;
  }

  async deleteTemplateEvents(templateId: number): Promise<void> {
    await db.delete(templateEvents).where(eq(templateEvents.templateId, templateId));
  }
}

export const storage = new DatabaseStorage();
