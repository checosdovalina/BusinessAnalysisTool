import { 
  users, companies, cycles, events, simulatorScenarios, simulatorSessions,
  type User, type InsertUser,
  type Company, type InsertCompany,
  type Cycle, type InsertCycle,
  type Event, type InsertEvent,
  type SimulatorScenario, type InsertSimulatorScenario,
  type SimulatorSession, type InsertSimulatorSession,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, isNull } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
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
  
  // Simulator Sessions
  getSimulatorSession(id: number): Promise<SimulatorSession | undefined>;
  getSimulatorSessionsByCompany(companyId: number): Promise<SimulatorSession[]>;
  getSimulatorSessionsByStudent(studentId: number): Promise<SimulatorSession[]>;
  createSimulatorSession(session: InsertSimulatorSession): Promise<SimulatorSession>;
  updateSimulatorSession(id: number, updates: Partial<InsertSimulatorSession>): Promise<SimulatorSession | undefined>;
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
}

export const storage = new DatabaseStorage();
