import { 
  users, companies, cycles, events, simulatorScenarios, simulatorSessions,
  scenarioSteps, sessionStepResults,
  evaluationTopics, evaluationTopicItems, cycleTopicItems,
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
}

export const storage = new DatabaseStorage();
