import { 
  users, companies, cycles, events, simulatorScenarios, simulatorSessions,
  scenarioSteps, sessionStepResults,
  evaluationTopics, evaluationTopicItems, cycleTopicItems,
  trainingReports, annualTrainingPrograms, trainingActivities, trainingDocuments, trainingActivityAuditEvents,
  companySettings, userPreferences,
  trainingRequests, requestIncidents, requestRoles, requestProcedures, requestTopics, requestRecipients,
  evaluationTemplates, templateTopics, templateEvents,
  jobProfiles, competencies, jobProfileCompetencies, competencyAssessments,
  employeeJobProfiles,
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
  type TrainingActivity, type InsertTrainingActivity,
  type TrainingDocument, type InsertTrainingDocument,
  type TrainingActivityAuditEvent,
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
  type JobProfile, type InsertJobProfile,
  type Competency, type InsertCompetency,
  type JobProfileCompetency, type InsertJobProfileCompetency,
  type CompetencyAssessment, type InsertCompetencyAssessment,
  type EmployeeJobProfile,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, isNull, asc, or, ne } from "drizzle-orm";

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

  createCyclesForStudents(
    cycle: Omit<InsertCycle, "studentId">,
    studentIds: number[],
    topicItems: Array<Pick<InsertCycleTopicItem, "topicItemId" | "weight" | "customFocus">>
  ): Promise<Cycle[]>;

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

  // Annual training execution and controlled documents

  getTrainingActivitiesByCompany(companyId: number): Promise<TrainingActivity[]>;

  getTrainingActivity(id: number): Promise<TrainingActivity | undefined>;

  createTrainingActivity(activity: InsertTrainingActivity, audit: { actorId: number; action: string; details?: string | null }): Promise<TrainingActivity>;

  updateTrainingActivity(id: number, updates: Partial<InsertTrainingActivity>, audit?: { actorId: number; action: string; details?: string | null }): Promise<TrainingActivity | undefined>;

  completeTrainingActivity(id: number, updates: Partial<InsertTrainingActivity>, retry: InsertTrainingActivity | null, audit: { actorId: number; action: string; details?: string | null }): Promise<{ activity: TrainingActivity; retry?: TrainingActivity }>;

  getTrainingDocumentsByCompany(companyId: number): Promise<TrainingDocument[]>;

  getTrainingDocument(id: number): Promise<TrainingDocument | undefined>;

  createTrainingDocument(document: InsertTrainingDocument, audit: { actorId: number; action: string; details?: string | null }): Promise<TrainingDocument>;

  deleteTrainingDocument(id: number, audit: { actorId: number; action: string }): Promise<void>;

  getTrainingActivityAuditByCompany(companyId: number): Promise<TrainingActivityAuditEvent[]>;
  
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

  // Competency profiles and DNC

  getJobProfilesByCompany(companyId: number): Promise<JobProfile[]>;

  getJobProfile(id: number): Promise<JobProfile | undefined>;

  createJobProfile(profile: InsertJobProfile): Promise<JobProfile>;

  updateJobProfile(id: number, updates: Partial<InsertJobProfile>): Promise<JobProfile | undefined>;

  deleteJobProfile(id: number): Promise<void>;

  getCompetenciesByCompany(companyId: number): Promise<Competency[]>;

  getCompetency(id: number): Promise<Competency | undefined>;

  createCompetency(competency: InsertCompetency): Promise<Competency>;

  updateCompetency(id: number, updates: Partial<InsertCompetency>): Promise<Competency | undefined>;

  deleteCompetency(id: number): Promise<void>;

  getJobProfileCompetenciesByCompany(companyId: number): Promise<JobProfileCompetency[]>;

  getJobProfileCompetency(id: number): Promise<JobProfileCompetency | undefined>;

  createJobProfileCompetency(item: InsertJobProfileCompetency): Promise<JobProfileCompetency>;

  updateJobProfileCompetency(id: number, updates: Partial<InsertJobProfileCompetency>): Promise<JobProfileCompetency | undefined>;

  deleteJobProfileCompetency(id: number): Promise<void>;

  getCompetencyAssessmentsByCompany(companyId: number): Promise<CompetencyAssessment[]>;

  createCompetencyAssessment(assessment: InsertCompetencyAssessment & { assessedById: number }): Promise<CompetencyAssessment>;

  recordTrainingReassessment(
    activityId: number,
    assessment: InsertCompetencyAssessment & { assessedById: number },
    updates: Partial<InsertTrainingActivity>,
    retry: InsertTrainingActivity | null,
    audit: { actorId: number; action: string; details?: string | null },

  ): Promise<{ assessment: CompetencyAssessment; activity: TrainingActivity; retry?: TrainingActivity }>;

  createDncTrainingRequest(request: InsertTrainingRequest, studentId: number, year: number): Promise<TrainingRequest>;

  recalculateAnnualProgramProgress(programId: number): Promise<AnnualTrainingProgram | undefined>;

  // Company Settings

  getEmployeeJobProfilesByCompany(companyId: number): Promise<EmployeeJobProfile[]>;

  assignEmployeeJobProfile(assignment: Omit<EmployeeJobProfile, "id" | "assignedAt">): Promise<EmployeeJobProfile>;
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
    const [cycle] = await db.insert(cycles).values({
      ...insertCycle,
      endDate: insertCycle.endDate == null
        ? insertCycle.endDate
        : typeof insertCycle.endDate === "string" ? new Date(insertCycle.endDate) : insertCycle.endDate,
    }).returning();
    return cycle;
  }

  async createCyclesForStudents(
    cycleData: Omit<InsertCycle, "studentId">,
    studentIds: number[],
    topicItems: Array<Pick<InsertCycleTopicItem, "topicItemId" | "weight" | "customFocus">>
  ): Promise<Cycle[]> {
    return db.transaction(async (tx) => {
      const createdCycles: Cycle[] = [];

      for (const studentId of studentIds) {
        const [cycle] = await tx.insert(cycles)
          .values({
            ...cycleData,
            endDate: cycleData.endDate == null
              ? cycleData.endDate
              : typeof cycleData.endDate === "string" ? new Date(cycleData.endDate) : cycleData.endDate,
            studentId,
          })
          .returning();

        if (topicItems.length > 0) {
          await tx.insert(cycleTopicItems).values(
            topicItems.map((item) => ({ ...item, cycleId: cycle.id }))
          );
        }

        createdCycles.push(cycle);
      }

      return createdCycles;
    });
  }

  async updateCycle(id: number, updates: Partial<InsertCycle>): Promise<Cycle | undefined> {
    const [cycle] = await db.update(cycles).set({
      ...updates,
      endDate: updates.endDate == null
        ? updates.endDate
        : typeof updates.endDate === "string" ? new Date(updates.endDate) : updates.endDate,
    }).where(eq(cycles.id, id)).returning();
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

  // Annual training execution and controlled documents
  async getTrainingActivitiesByCompany(companyId: number): Promise<TrainingActivity[]> {
    return db.select().from(trainingActivities)
      .where(eq(trainingActivities.companyId, companyId))
      .orderBy(desc(trainingActivities.plannedStart), desc(trainingActivities.createdAt));
  }

  async getTrainingActivity(id: number): Promise<TrainingActivity | undefined> {
    const [activity] = await db.select().from(trainingActivities).where(eq(trainingActivities.id, id));
    return activity || undefined;
  }

  async createTrainingActivity(activity: InsertTrainingActivity, audit: { actorId: number; action: string; details?: string | null }): Promise<TrainingActivity> {
    return db.transaction(async (tx) => {
      const [created] = await tx.insert(trainingActivities).values(activity).returning();
      await tx.insert(trainingActivityAuditEvents).values({
        companyId: created.companyId, activityId: created.id, actorId: audit.actorId,
        action: audit.action, details: audit.details ?? null,
      });
      return created;
    });
  }

  async updateTrainingActivity(id: number, updates: Partial<InsertTrainingActivity>, audit?: { actorId: number; action: string; details?: string | null }): Promise<TrainingActivity | undefined> {
    return db.transaction(async (tx) => {
      const [updated] = await tx.update(trainingActivities)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(trainingActivities.id, id))
        .returning();
      if (!updated) return undefined;
      if (audit) {
        await tx.insert(trainingActivityAuditEvents).values({
          companyId: updated.companyId, activityId: updated.id, actorId: audit.actorId,
          action: audit.action, details: audit.details ?? null,
        });
      }
      return updated;
    });
  }

  async completeTrainingActivity(
    id: number,
    updates: Partial<InsertTrainingActivity>,
    retry: InsertTrainingActivity | null,
    audit: { actorId: number; action: string; details?: string | null },
  ): Promise<{ activity: TrainingActivity; retry?: TrainingActivity }> {
    return db.transaction(async (tx) => {
      const [activity] = await tx.update(trainingActivities)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(trainingActivities.id, id), ne(trainingActivities.status, "completed"), ne(trainingActivities.status, "cancelled")))
        .returning();
      if (!activity) throw new Error("La actividad ya no existe");
      await tx.insert(trainingActivityAuditEvents).values({
        companyId: activity.companyId, activityId: activity.id, actorId: audit.actorId,
        action: audit.action, details: audit.details ?? null,
      });
      if (!retry) return { activity };
      const [createdRetry] = await tx.insert(trainingActivities).values(retry).returning();
      await tx.insert(trainingActivityAuditEvents).values({
        companyId: createdRetry.companyId, activityId: createdRetry.id, actorId: audit.actorId,
        action: "repetition_created", details: `Actividad relacionada: ${activity.id}`,
      });
      return { activity, retry: createdRetry };
    });
  }

  async getTrainingDocumentsByCompany(companyId: number): Promise<TrainingDocument[]> {
    return db.select().from(trainingDocuments)
      .where(eq(trainingDocuments.companyId, companyId))
      .orderBy(desc(trainingDocuments.createdAt));
  }

  async getTrainingDocument(id: number): Promise<TrainingDocument | undefined> {
    const [document] = await db.select().from(trainingDocuments).where(eq(trainingDocuments.id, id));
    return document || undefined;
  }

  async createTrainingDocument(document: InsertTrainingDocument, audit: { actorId: number; action: string; details?: string | null }): Promise<TrainingDocument> {
    return db.transaction(async (tx) => {
      const [created] = await tx.insert(trainingDocuments).values(document).returning();
      await tx.insert(trainingActivityAuditEvents).values({
        companyId: created.companyId, activityId: created.activityId, actorId: audit.actorId,
        action: audit.action, details: audit.details ?? created.title,
      });
      return created;
    });
  }

  async deleteTrainingDocument(id: number, audit: { actorId: number; action: string }): Promise<void> {
    await db.transaction(async (tx) => {
      const [document] = await tx.select().from(trainingDocuments).where(eq(trainingDocuments.id, id));
      if (!document) return;
      await tx.delete(trainingDocuments).where(eq(trainingDocuments.id, id));
      await tx.insert(trainingActivityAuditEvents).values({
        companyId: document.companyId, activityId: document.activityId, actorId: audit.actorId,
        action: audit.action, details: `Documento eliminado: ${document.title} (rev. ${document.revision})`,
      });
    });
  }

  async getTrainingActivityAuditByCompany(companyId: number): Promise<TrainingActivityAuditEvent[]> {
    return db.select().from(trainingActivityAuditEvents)
      .where(eq(trainingActivityAuditEvents.companyId, companyId))
      .orderBy(desc(trainingActivityAuditEvents.createdAt));
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
    const normalizedRequest = {
      ...request,
      proposedStartDate: request.proposedStartDate instanceof Date ? request.proposedStartDate : request.proposedStartDate ? new Date(request.proposedStartDate) : null,
      proposedEndDate: request.proposedEndDate instanceof Date ? request.proposedEndDate : request.proposedEndDate ? new Date(request.proposedEndDate) : null,
    };
    const [newRequest] = await db.insert(trainingRequests).values(normalizedRequest).returning();
    return newRequest;
  }

  async updateTrainingRequest(id: number, updates: Partial<InsertTrainingRequest>): Promise<TrainingRequest | undefined> {
    const normalizedUpdates = {
      ...updates,
      ...(updates.proposedStartDate !== undefined ? {
        proposedStartDate: updates.proposedStartDate instanceof Date ? updates.proposedStartDate : updates.proposedStartDate ? new Date(updates.proposedStartDate) : null,
      } : {}),
      ...(updates.proposedEndDate !== undefined ? {
        proposedEndDate: updates.proposedEndDate instanceof Date ? updates.proposedEndDate : updates.proposedEndDate ? new Date(updates.proposedEndDate) : null,
      } : {}),
    } as Partial<typeof trainingRequests.$inferInsert>;
    const [request] = await db.update(trainingRequests)
      .set({ ...normalizedUpdates, updatedAt: new Date() })
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

  // Competency profiles and DNC
  async getJobProfilesByCompany(companyId: number): Promise<JobProfile[]> {
    return db.select().from(jobProfiles).where(eq(jobProfiles.companyId, companyId)).orderBy(asc(jobProfiles.title));
  }

  async getJobProfile(id: number): Promise<JobProfile | undefined> {
    const [profile] = await db.select().from(jobProfiles).where(eq(jobProfiles.id, id));
    return profile || undefined;
  }

  async createJobProfile(profile: InsertJobProfile): Promise<JobProfile> {
    const [created] = await db.insert(jobProfiles).values(profile).returning();
    return created;
  }

  async updateJobProfile(id: number, updates: Partial<InsertJobProfile>): Promise<JobProfile | undefined> {
    const [updated] = await db.update(jobProfiles).set({ ...updates, updatedAt: new Date() }).where(eq(jobProfiles.id, id)).returning();
    return updated || undefined;
  }

  async deleteJobProfile(id: number): Promise<void> {
    await db.delete(jobProfiles).where(eq(jobProfiles.id, id));
  }

  async getCompetenciesByCompany(companyId: number): Promise<Competency[]> {
    return db.select().from(competencies).where(eq(competencies.companyId, companyId)).orderBy(asc(competencies.name));
  }

  async getCompetency(id: number): Promise<Competency | undefined> {
    const [competency] = await db.select().from(competencies).where(eq(competencies.id, id));
    return competency || undefined;
  }

  async createCompetency(competency: InsertCompetency): Promise<Competency> {
    const [created] = await db.insert(competencies).values(competency).returning();
    return created;
  }

  async updateCompetency(id: number, updates: Partial<InsertCompetency>): Promise<Competency | undefined> {
    const [updated] = await db.update(competencies).set(updates).where(eq(competencies.id, id)).returning();
    return updated || undefined;
  }

  async deleteCompetency(id: number): Promise<void> {
    await db.delete(competencies).where(eq(competencies.id, id));
  }

  async getJobProfileCompetenciesByCompany(companyId: number): Promise<JobProfileCompetency[]> {
    const profiles = await this.getJobProfilesByCompany(companyId);
    if (profiles.length === 0) return [];
    const profileIds = profiles.map((profile) => profile.id);
    return db.select().from(jobProfileCompetencies).where(or(...profileIds.map((id) => eq(jobProfileCompetencies.profileId, id))));
  }

  async getJobProfileCompetency(id: number): Promise<JobProfileCompetency | undefined> {
    const [item] = await db.select().from(jobProfileCompetencies).where(eq(jobProfileCompetencies.id, id));
    return item || undefined;
  }

  async createJobProfileCompetency(item: InsertJobProfileCompetency): Promise<JobProfileCompetency> {
    const [created] = await db.insert(jobProfileCompetencies).values(item).returning();
    return created;
  }

  async updateJobProfileCompetency(id: number, updates: Partial<InsertJobProfileCompetency>): Promise<JobProfileCompetency | undefined> {
    const [updated] = await db.update(jobProfileCompetencies).set(updates).where(eq(jobProfileCompetencies.id, id)).returning();
    return updated || undefined;
  }

  async deleteJobProfileCompetency(id: number): Promise<void> {
    await db.delete(jobProfileCompetencies).where(eq(jobProfileCompetencies.id, id));
  }

  async getCompetencyAssessmentsByCompany(companyId: number): Promise<CompetencyAssessment[]> {
    return db.select().from(competencyAssessments)
      .where(eq(competencyAssessments.companyId, companyId))
      .orderBy(desc(competencyAssessments.assessedAt));
  }

  async createCompetencyAssessment(assessment: InsertCompetencyAssessment & { assessedById: number }): Promise<CompetencyAssessment> {
    const [created] = await db.insert(competencyAssessments).values(assessment).returning();
    return created;
  }

  async recordTrainingReassessment(
    activityId: number,
    assessment: InsertCompetencyAssessment & { assessedById: number },
    updates: Partial<InsertTrainingActivity>,
    retry: InsertTrainingActivity | null,
    audit: { actorId: number; action: string; details?: string | null },
  ): Promise<{ assessment: CompetencyAssessment; activity: TrainingActivity; retry?: TrainingActivity }> {
    return db.transaction(async (tx) => {
      const [createdAssessment] = await tx.insert(competencyAssessments).values(assessment).returning();
      const [updatedActivity] = await tx.update(trainingActivities)
        .set({ ...updates, reassessmentId: createdAssessment.id, reassessmentRequired: false, updatedAt: new Date() })
        .where(and(eq(trainingActivities.id, activityId), eq(trainingActivities.reassessmentRequired, true)))
        .returning();
      if (!updatedActivity) throw new Error("La actividad ya no existe");
      await tx.insert(trainingActivityAuditEvents).values({
        companyId: updatedActivity.companyId, activityId: updatedActivity.id, actorId: audit.actorId,
        action: audit.action, details: audit.details ?? `Nivel reevaluado: ${createdAssessment.currentLevel}/${createdAssessment.requiredLevel}`,
      });
      if (!retry) return { assessment: createdAssessment, activity: updatedActivity };
      const [createdRetry] = await tx.insert(trainingActivities).values({
        ...retry,
        dncAssessmentId: createdAssessment.id,
      }).returning();
      await tx.insert(trainingActivityAuditEvents).values({
        companyId: createdRetry.companyId, activityId: createdRetry.id, actorId: audit.actorId,
        action: "retraining_created", details: `Actividad relacionada: ${updatedActivity.id}`,
      });
      return { assessment: createdAssessment, activity: updatedActivity, retry: createdRetry };
    });
  }

  async createDncTrainingRequest(request: InsertTrainingRequest, studentId: number, year: number): Promise<TrainingRequest> {
    return db.transaction(async (tx) => {
      let [program] = await tx.select().from(annualTrainingPrograms).where(and(
        eq(annualTrainingPrograms.companyId, request.companyId),
        eq(annualTrainingPrograms.studentId, studentId),
        eq(annualTrainingPrograms.year, year),
      ));
      const plannedHours = request.estimatedHours ?? 0;
      if (!program) {
        const [created] = await tx.insert(annualTrainingPrograms).values({
          companyId: request.companyId,
          studentId,
          year,
          targetHours: plannedHours,
          targetSessions: 1,
        }).onConflictDoNothing().returning();
        program = created ?? (await tx.select().from(annualTrainingPrograms).where(and(
          eq(annualTrainingPrograms.companyId, request.companyId),
          eq(annualTrainingPrograms.studentId, studentId),
          eq(annualTrainingPrograms.year, year),
        )))[0];
      } else {
        const [updated] = await tx.update(annualTrainingPrograms).set({
          targetHours: program.targetHours + plannedHours,
          targetSessions: (program.targetSessions ?? 0) + 1,
          updatedAt: new Date(),
        }).where(eq(annualTrainingPrograms.id, program.id)).returning();
        program = updated;
      }
      if (!program) throw new Error("No se pudo preparar el programa anual");
      const normalizedRequest = {
        ...request,
        proposedStartDate: request.proposedStartDate instanceof Date ? request.proposedStartDate : request.proposedStartDate ? new Date(request.proposedStartDate) : null,
        proposedEndDate: request.proposedEndDate instanceof Date ? request.proposedEndDate : request.proposedEndDate ? new Date(request.proposedEndDate) : null,
      };
      const [createdRequest] = await tx.insert(trainingRequests).values({
        ...normalizedRequest,
        annualProgramId: program.id,
      }).returning();
      return createdRequest;
    });
  }

  async recalculateAnnualProgramProgress(programId: number): Promise<AnnualTrainingProgram | undefined> {
    const program = await this.getAnnualTrainingProgram(programId);
    if (!program) return undefined;
    const requests = await this.getTrainingRequestsByCompany(program.companyId);
    const programRequests = requests.filter((request) => request.annualProgramId === programId);
    const requestIds = new Set(programRequests.map((request) => request.id));
    const sessions = (await this.getSimulatorSessionsByCompany(program.companyId))
      .filter((session) => session.trainingRequestId !== null && requestIds.has(session.trainingRequestId));
    const completedSessions = sessions.filter((session) => session.endTime !== null);
    const completedHours = completedSessions.reduce((total, session) => total + (session.duration ?? 0) / 3600, 0);
    const completedRequests = programRequests.filter((request) => request.status === "completed").length;
    const progressPercentage = programRequests.length
      ? Math.round((completedRequests / programRequests.length) * 100)
      : 0;
    const isCompleted = programRequests.length > 0 && completedRequests === programRequests.length;
    return this.updateAnnualTrainingProgram(programId, {
      completedHours: Math.round(completedHours * 100) / 100,
      completedSessions: completedSessions.length,
      progressPercentage,
      isCompleted,
      completedAt: isCompleted ? (program.completedAt ?? new Date()) : null,
    });
  }

  async getEmployeeJobProfilesByCompany(companyId: number): Promise<EmployeeJobProfile[]> {
    return db.select().from(employeeJobProfiles).where(eq(employeeJobProfiles.companyId, companyId));
  }

  async assignEmployeeJobProfile(assignment: Omit<EmployeeJobProfile, "id" | "assignedAt">): Promise<EmployeeJobProfile> {
    const [saved] = await db.insert(employeeJobProfiles).values(assignment).onConflictDoUpdate({
      target: employeeJobProfiles.employeeId,
      set: {
        companyId: assignment.companyId,
        profileId: assignment.profileId,
        assignedById: assignment.assignedById,
        assignedAt: new Date(),
      },
    }).returning();
    return saved;
  }
}

export const storage = new DatabaseStorage();
