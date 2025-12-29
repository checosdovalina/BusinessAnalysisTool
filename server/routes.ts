import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCycleSchema, insertEventSchema, insertSimulatorScenarioSchema, insertSimulatorSessionSchema, insertScenarioStepSchema, insertSessionStepResultSchema, insertEvaluationTopicSchema, insertEvaluationTopicItemSchema, insertCycleTopicItemSchema, insertCompanySchema, insertTrainingRequestSchema, insertRequestIncidentSchema, insertRequestRoleSchema, insertRequestProcedureSchema, insertRequestTopicSchema, insertRequestRecipientSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("FATAL: JWT_SECRET debe estar configurado en producción");
}
if (!JWT_SECRET) {
  console.error("⚠️ SEGURIDAD: JWT_SECRET no configurado. Usando clave temporal - NO usar en producción!");
}
const DEV_SECRET = "ots-dev-secret-key-not-for-production";
const getJwtSecret = () => JWT_SECRET || DEV_SECRET;

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: string;
    companyId: number;
  };
}

const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token de autenticación requerido" });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: number; role: string; companyId: number };
    req.user = {
      id: decoded.userId,
      role: decoded.role,
      companyId: decoded.companyId,
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: "Token inválido o expirado" });
  }
};

const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "No autenticado" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "No tienes permisos para realizar esta acción" });
    }
    next();
  };
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["super_admin", "admin", "trainer", "student"]).optional(),
  avatar: z.string().url().nullable().optional(),
}).strict();

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ============= AUTH ROUTES =============
  
  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const company = await storage.getCompany(user.companyId);
      
      const token = jwt.sign(
        { userId: user.id, role: user.role, companyId: user.companyId },
        getJwtSecret(),
        { expiresIn: "24h" }
      );
      
      res.json({ 
        user: { ...user, password: undefined },
        company,
        token
      });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Login failed" });
    }
  });

  // Register (only for testing - in production would have more controls)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const newUser = await storage.createUser(userData);
      res.json({ ...newUser, password: undefined });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Registration failed" });
    }
  });

  // ============= COMPANIES ROUTES =============
  
  app.get("/api/companies", async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  app.get("/api/companies/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const company = await storage.getCompany(id);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch company" });
    }
  });

  app.post("/api/companies", authenticateToken, authorizeRoles("super_admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const companyData = insertCompanySchema.parse(req.body);
      const newCompany = await storage.createCompany(companyData);
      res.status(201).json(newCompany);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos" });
      }
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create company" });
    }
  });

  app.patch("/api/companies/:id", authenticateToken, authorizeRoles("super_admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const company = await storage.getCompany(id);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      const updates = req.body;
      const updatedCompany = await storage.updateCompany(id, updates);
      res.json(updatedCompany);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update company" });
    }
  });

  app.delete("/api/companies/:id", authenticateToken, authorizeRoles("super_admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const company = await storage.getCompany(id);
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      await storage.deleteCompany(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete company" });
    }
  });

  // ============= USERS ROUTES =============
  
  app.get("/api/users/company/:companyId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      
      // Solo super_admin puede ver usuarios de cualquier empresa
      // Otros usuarios solo pueden ver usuarios de su propia empresa
      if (req.user?.role !== "super_admin" && req.user?.companyId !== companyId) {
        return res.status(403).json({ error: "No tienes permisos para ver usuarios de otra empresa" });
      }
      
      const users = await storage.getUsersByCompany(companyId);
      res.json(users.map(u => ({ ...u, password: undefined })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Solo super_admin puede ver cualquier usuario
      // Otros usuarios solo pueden ver usuarios de su propia empresa
      if (req.user?.role !== "super_admin" && req.user?.companyId !== user.companyId) {
        return res.status(403).json({ error: "No tienes permisos para ver este usuario" });
      }
      
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/users", authenticateToken, authorizeRoles("admin", "super_admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      if (req.user?.role !== "super_admin" && userData.companyId !== req.user?.companyId) {
        return res.status(403).json({ error: "No puedes crear usuarios en otra empresa" });
      }
      
      if (userData.role === "super_admin" && req.user?.role !== "super_admin") {
        return res.status(403).json({ error: "Solo un super_admin puede crear otro super_admin" });
      }
      
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const newUser = await storage.createUser({ ...userData, password: hashedPassword });
      res.status(201).json({ ...newUser, password: undefined });
    } catch (error) {
      if (error instanceof Error && error.message.includes("unique")) {
        return res.status(400).json({ error: "El correo electrónico ya está registrado" });
      }
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", authenticateToken, authorizeRoles("admin", "super_admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = updateUserSchema.parse(req.body);
      
      const targetUser = await storage.getUser(id);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (req.user?.role !== "super_admin" && targetUser.companyId !== req.user?.companyId) {
        return res.status(403).json({ error: "No puedes modificar usuarios de otra empresa" });
      }
      
      if (validatedData.role === "super_admin" && req.user?.role !== "super_admin") {
        return res.status(403).json({ error: "Solo un super_admin puede asignar rol super_admin" });
      }
      
      const updates: Record<string, any> = { ...validatedData };
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
      }
      
      const user = await storage.updateUser(id, updates);
      res.json({ ...user, password: undefined });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos: " + error.errors.map(e => e.message).join(", ") });
      }
      if (error instanceof Error && error.message.includes("unique")) {
        return res.status(400).json({ error: "El correo electrónico ya está registrado" });
      }
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", authenticateToken, authorizeRoles("admin", "super_admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const targetUser = await storage.getUser(id);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (req.user?.role !== "super_admin" && targetUser.companyId !== req.user?.companyId) {
        return res.status(403).json({ error: "No puedes eliminar usuarios de otra empresa" });
      }
      
      if (req.user?.id === id) {
        return res.status(400).json({ error: "No puedes eliminar tu propia cuenta" });
      }
      
      await storage.deleteUser(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // ============= CYCLES ROUTES =============
  
  app.get("/api/cycles/company/:companyId", async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const cycles = await storage.getCyclesByCompany(companyId);
      res.json(cycles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cycles" });
    }
  });

  app.get("/api/cycles/student/:studentId", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const cycles = await storage.getCyclesByStudent(studentId);
      res.json(cycles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cycles" });
    }
  });

  app.get("/api/cycles/trainer/:trainerId", async (req, res) => {
    try {
      const trainerId = parseInt(req.params.trainerId);
      const cycles = await storage.getCyclesByTrainer(trainerId);
      res.json(cycles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cycles" });
    }
  });

  app.get("/api/cycles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cycle = await storage.getCycle(id);
      if (!cycle) {
        return res.status(404).json({ error: "Cycle not found" });
      }
      res.json(cycle);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cycle" });
    }
  });

  app.post("/api/cycles", async (req, res) => {
    try {
      const cycleData = insertCycleSchema.parse(req.body);
      const newCycle = await storage.createCycle(cycleData);
      res.status(201).json(newCycle);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create cycle" });
    }
  });

  app.patch("/api/cycles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const updatedCycle = await storage.updateCycle(id, updates);
      if (!updatedCycle) {
        return res.status(404).json({ error: "Cycle not found" });
      }
      res.json(updatedCycle);
    } catch (error) {
      res.status(400).json({ error: "Failed to update cycle" });
    }
  });

  app.delete("/api/cycles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCycle(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete cycle" });
    }
  });

  // ============= EVENTS ROUTES =============
  
  app.get("/api/events/cycle/:cycleId", async (req, res) => {
    try {
      const cycleId = parseInt(req.params.cycleId);
      const events = await storage.getEventsByCycle(cycleId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const eventData = insertEventSchema.parse(req.body);
      const newEvent = await storage.createEvent(eventData);
      res.status(201).json(newEvent);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create event" });
    }
  });

  app.patch("/api/events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const updatedEvent = await storage.updateEvent(id, updates);
      if (!updatedEvent) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(updatedEvent);
    } catch (error) {
      res.status(400).json({ error: "Failed to update event" });
    }
  });

  // ============= SIMULATOR SCENARIOS ROUTES =============
  
  app.get("/api/simulator-scenarios", async (req, res) => {
    try {
      const scenarios = await storage.getAllSimulatorScenarios();
      res.json(scenarios);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scenarios" });
    }
  });

  app.get("/api/simulator-scenarios/company/:companyId", async (req, res) => {
    try {
      const companyId = req.params.companyId === 'null' ? null : parseInt(req.params.companyId);
      const scenarios = await storage.getSimulatorScenariosByCompany(companyId);
      res.json(scenarios);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scenarios" });
    }
  });

  app.get("/api/simulator-scenarios/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const scenario = await storage.getSimulatorScenario(id);
      if (!scenario) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      res.json(scenario);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scenario" });
    }
  });

  app.post("/api/simulator-scenarios", async (req, res) => {
    try {
      const scenarioData = insertSimulatorScenarioSchema.parse(req.body);
      const newScenario = await storage.createSimulatorScenario(scenarioData);
      res.status(201).json(newScenario);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create scenario" });
    }
  });

  app.patch("/api/simulator-scenarios/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const updatedScenario = await storage.updateSimulatorScenario(id, updates);
      if (!updatedScenario) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      res.json(updatedScenario);
    } catch (error) {
      res.status(400).json({ error: "Failed to update scenario" });
    }
  });

  app.delete("/api/simulator-scenarios/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSimulatorScenario(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete scenario" });
    }
  });

  // ============= SIMULATOR SESSIONS ROUTES =============
  
  app.get("/api/simulator-sessions/company/:companyId", async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const sessions = await storage.getSimulatorSessionsByCompany(companyId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.get("/api/simulator-sessions/student/:studentId", async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const sessions = await storage.getSimulatorSessionsByStudent(studentId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.get("/api/simulator-sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.getSimulatorSession(id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  app.post("/api/simulator-sessions", async (req, res) => {
    try {
      const sessionData = insertSimulatorSessionSchema.parse(req.body);
      const newSession = await storage.createSimulatorSession(sessionData);
      res.status(201).json(newSession);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create session" });
    }
  });

  app.patch("/api/simulator-sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const updatedSession = await storage.updateSimulatorSession(id, updates);
      if (!updatedSession) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(updatedSession);
    } catch (error) {
      res.status(400).json({ error: "Failed to update session" });
    }
  });

  // ============= SCENARIO STEPS ROUTES =============
  
  app.get("/api/scenario-steps/scenario/:scenarioId", async (req, res) => {
    try {
      const scenarioId = parseInt(req.params.scenarioId);
      const steps = await storage.getScenarioSteps(scenarioId);
      res.json(steps);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scenario steps" });
    }
  });

  app.get("/api/scenario-steps/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const step = await storage.getScenarioStep(id);
      if (!step) {
        return res.status(404).json({ error: "Step not found" });
      }
      res.json(step);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch step" });
    }
  });

  app.post("/api/scenario-steps", async (req, res) => {
    try {
      const stepData = insertScenarioStepSchema.parse(req.body);
      const newStep = await storage.createScenarioStep(stepData);
      res.status(201).json(newStep);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create step" });
    }
  });

  app.post("/api/scenario-steps/batch", async (req, res) => {
    try {
      const stepsSchema = z.array(insertScenarioStepSchema);
      const stepsData = stepsSchema.parse(req.body);
      const newSteps = await storage.createScenarioStepsBatch(stepsData);
      res.status(201).json(newSteps);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create steps" });
    }
  });

  app.patch("/api/scenario-steps/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const updatedStep = await storage.updateScenarioStep(id, updates);
      if (!updatedStep) {
        return res.status(404).json({ error: "Step not found" });
      }
      res.json(updatedStep);
    } catch (error) {
      res.status(400).json({ error: "Failed to update step" });
    }
  });

  app.delete("/api/scenario-steps/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteScenarioStep(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete step" });
    }
  });

  app.delete("/api/scenario-steps/scenario/:scenarioId", async (req, res) => {
    try {
      const scenarioId = parseInt(req.params.scenarioId);
      await storage.deleteScenarioSteps(scenarioId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete steps" });
    }
  });

  // ============= SESSION STEP RESULTS ROUTES =============
  
  app.get("/api/session-step-results/session/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const results = await storage.getSessionStepResults(sessionId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch step results" });
    }
  });

  app.post("/api/session-step-results", async (req, res) => {
    try {
      const resultData = insertSessionStepResultSchema.parse(req.body);
      const newResult = await storage.createSessionStepResult(resultData);
      res.status(201).json(newResult);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create step result" });
    }
  });

  // ============= EVALUATION TOPICS ROUTES =============
  
  app.get("/api/evaluation-topics", async (req, res) => {
    try {
      const topics = await storage.getAllEvaluationTopics();
      res.json(topics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch evaluation topics" });
    }
  });

  app.get("/api/evaluation-topics/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const topic = await storage.getEvaluationTopic(id);
      if (!topic) {
        return res.status(404).json({ error: "Topic not found" });
      }
      res.json(topic);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch topic" });
    }
  });

  app.post("/api/evaluation-topics", async (req, res) => {
    try {
      const topicData = insertEvaluationTopicSchema.parse(req.body);
      const newTopic = await storage.createEvaluationTopic(topicData);
      res.status(201).json(newTopic);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create topic" });
    }
  });

  app.patch("/api/evaluation-topics/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const updatedTopic = await storage.updateEvaluationTopic(id, updates);
      if (!updatedTopic) {
        return res.status(404).json({ error: "Topic not found" });
      }
      res.json(updatedTopic);
    } catch (error) {
      res.status(400).json({ error: "Failed to update topic" });
    }
  });

  app.delete("/api/evaluation-topics/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEvaluationTopic(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete topic" });
    }
  });

  // ============= EVALUATION TOPIC ITEMS ROUTES =============
  
  app.get("/api/evaluation-topic-items/topic/:topicId", async (req, res) => {
    try {
      const topicId = parseInt(req.params.topicId);
      const items = await storage.getEvaluationTopicItems(topicId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch topic items" });
    }
  });

  app.get("/api/evaluation-topic-items/company/:companyId", async (req, res) => {
    try {
      const companyId = req.params.companyId === 'null' ? null : parseInt(req.params.companyId);
      const items = await storage.getEvaluationTopicItemsByCompany(companyId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch topic items" });
    }
  });

  app.get("/api/evaluation-topic-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getEvaluationTopicItem(id);
      if (!item) {
        return res.status(404).json({ error: "Topic item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch topic item" });
    }
  });

  app.post("/api/evaluation-topic-items", async (req, res) => {
    try {
      const itemData = insertEvaluationTopicItemSchema.parse(req.body);
      const newItem = await storage.createEvaluationTopicItem(itemData);
      res.status(201).json(newItem);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create topic item" });
    }
  });

  app.patch("/api/evaluation-topic-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const updatedItem = await storage.updateEvaluationTopicItem(id, updates);
      if (!updatedItem) {
        return res.status(404).json({ error: "Topic item not found" });
      }
      res.json(updatedItem);
    } catch (error) {
      res.status(400).json({ error: "Failed to update topic item" });
    }
  });

  app.delete("/api/evaluation-topic-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEvaluationTopicItem(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete topic item" });
    }
  });

  // ============= CYCLE TOPIC ITEMS ROUTES =============
  
  app.get("/api/cycle-topic-items/cycle/:cycleId", async (req, res) => {
    try {
      const cycleId = parseInt(req.params.cycleId);
      const items = await storage.getCycleTopicItems(cycleId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cycle topic items" });
    }
  });

  app.post("/api/cycle-topic-items", async (req, res) => {
    try {
      const itemData = insertCycleTopicItemSchema.parse(req.body);
      const newItem = await storage.createCycleTopicItem(itemData);
      res.status(201).json(newItem);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create cycle topic item" });
    }
  });

  app.patch("/api/cycle-topic-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const updatedItem = await storage.updateCycleTopicItem(id, updates);
      if (!updatedItem) {
        return res.status(404).json({ error: "Cycle topic item not found" });
      }
      res.json(updatedItem);
    } catch (error) {
      res.status(400).json({ error: "Failed to update cycle topic item" });
    }
  });

  app.delete("/api/cycle-topic-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCycleTopicItem(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete cycle topic item" });
    }
  });

  app.delete("/api/cycle-topic-items/cycle/:cycleId", async (req, res) => {
    try {
      const cycleId = parseInt(req.params.cycleId);
      await storage.deleteCycleTopicItems(cycleId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete cycle topic items" });
    }
  });

  // Batch sync endpoint - atomic operation
  app.post("/api/cycle-topic-items/sync/:cycleId", async (req, res) => {
    try {
      const cycleId = parseInt(req.params.cycleId);
      const { items } = req.body as { items: Array<{ topicItemId: number; weight: number; customFocus?: string }> };
      
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: "items must be an array" });
      }
      
      const result = await storage.syncCycleTopicItems(cycleId, items);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to sync cycle topic items" });
    }
  });

  // ============= TRAINING REPORTS ROUTES =============

  app.get("/api/reports/company/:companyId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      
      if (req.user?.role !== "super_admin" && req.user?.companyId !== companyId) {
        return res.status(403).json({ error: "No tienes permisos para ver reportes de otra empresa" });
      }
      
      const reports = await storage.getTrainingReportsByCompany(companyId);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  app.get("/api/reports/student/:studentId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      
      // Verify student belongs to user's company
      const student = await storage.getUser(studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      if (req.user?.role !== "super_admin" && req.user?.companyId !== student.companyId) {
        return res.status(403).json({ error: "No tienes permisos para ver reportes de este estudiante" });
      }
      
      const reports = await storage.getTrainingReportsByStudent(studentId);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  app.get("/api/reports/cycle/:cycleId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const cycleId = parseInt(req.params.cycleId);
      
      // Verify cycle belongs to user's company
      const cycle = await storage.getCycle(cycleId);
      if (!cycle) {
        return res.status(404).json({ error: "Cycle not found" });
      }
      if (req.user?.role !== "super_admin" && req.user?.companyId !== cycle.companyId) {
        return res.status(403).json({ error: "No tienes permisos para ver este ciclo" });
      }
      
      const report = await storage.getTrainingReportByCycle(cycleId);
      res.json(report || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch report" });
    }
  });

  app.get("/api/reports/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const report = await storage.getTrainingReport(id);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      
      // Verify report belongs to user's company
      if (req.user?.role !== "super_admin" && req.user?.companyId !== report.companyId) {
        return res.status(403).json({ error: "No tienes permisos para ver este reporte" });
      }
      
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch report" });
    }
  });

  // Endpoint to verify content before generating report
  app.get("/api/reports/verify/:cycleId", authenticateToken, authorizeRoles("admin", "trainer", "super_admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const cycleId = parseInt(req.params.cycleId);
      const cycle = await storage.getCycle(cycleId);
      
      if (!cycle) {
        return res.status(404).json({ error: "Cycle not found" });
      }
      
      // Verify cycle belongs to user's company
      if (req.user?.role !== "super_admin" && req.user?.companyId !== cycle.companyId) {
        return res.status(403).json({ error: "No tienes permisos para este ciclo" });
      }
      
      const events = await storage.getEventsByCycle(cycleId);
      const issues: string[] = [];
      const warnings: string[] = [];
      let hasBlockingIssue = false;
      
      // Check for existing report - BLOCKING
      const existingReport = await storage.getTrainingReportByCycle(cycleId);
      if (existingReport) {
        issues.push("Ya existe un reporte generado para este ciclo");
        hasBlockingIssue = true;
      }
      
      // Check if there are events - BLOCKING
      if (events.length === 0) {
        issues.push("No hay eventos de evaluación registrados en este ciclo");
        hasBlockingIssue = true;
      }
      
      // Check if cycle is completed - WARNING (can still generate)
      if (cycle.status !== "completed") {
        warnings.push("El ciclo no está marcado como completado");
      }
      
      // Check if all events have scores (null means no score, 0 is a valid failing score)
      const eventsWithoutScore = events.filter(e => e.score === null || e.score === undefined);
      if (eventsWithoutScore.length > 0) {
        warnings.push(`${eventsWithoutScore.length} evento(s) no tienen calificación asignada`);
      }
      
      // Check if all events have feedback (whitespace-only is invalid)
      const eventsWithoutFeedback = events.filter(e => e.feedback === null || e.feedback === undefined || (typeof e.feedback === 'string' && e.feedback.trim() === ""));
      if (eventsWithoutFeedback.length > 0) {
        warnings.push(`${eventsWithoutFeedback.length} evento(s) no tienen retroalimentación`);
      }
      
      // Combine issues and warnings for display
      const allIssues = [...issues, ...warnings];
      
      res.json({
        canGenerate: !hasBlockingIssue,
        issues: allIssues,
        blockingIssues: issues,
        warnings,
        eventsCount: events.length,
        cycle,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify content" });
    }
  });

  app.post("/api/reports/generate/:cycleId", authenticateToken, authorizeRoles("admin", "trainer", "super_admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const cycleId = parseInt(req.params.cycleId);
      const cycle = await storage.getCycle(cycleId);
      
      if (!cycle) {
        return res.status(404).json({ error: "Cycle not found" });
      }
      
      // Verify cycle belongs to user's company
      if (req.user?.role !== "super_admin" && req.user?.companyId !== cycle.companyId) {
        return res.status(403).json({ error: "No tienes permisos para generar reportes de otra empresa" });
      }
      
      // Check if report already exists
      const existingReport = await storage.getTrainingReportByCycle(cycleId);
      if (existingReport) {
        return res.status(400).json({ error: "Ya existe un reporte para este ciclo" });
      }

      // Calculate scores from events with penalty support
      const events = await storage.getEventsByCycle(cycleId);
      
      if (events.length === 0) {
        return res.status(400).json({ error: "No hay eventos de evaluación para generar el reporte" });
      }
      
      let totalScore = 0;
      let totalWeight = 0;
      let totalPenalties = 0;
      const radarData: Array<{ subject: string; score: number; max: number }> = [];
      
      // Group scores by evaluation topic for radar chart
      const topicScores: Record<string, { total: number; count: number; weight: number }> = {};
      
      for (const event of events) {
        const weight = event.weight || 1;
        const maxScore = event.maxScore || 100;
        const score = event.score || 0;
        
        // Calculate penalty deductions
        const penaltyDeduction = (event.penaltyPoints || 0) * (event.attempts || 0);
        const adjustedScore = Math.max(0, score - penaltyDeduction);
        
        totalWeight += weight;
        totalScore += (adjustedScore / maxScore) * 100 * weight;
        totalPenalties += penaltyDeduction;
        
        // Group by evaluation topic
        const topic = event.evaluationTopic || "General";
        if (!topicScores[topic]) {
          topicScores[topic] = { total: 0, count: 0, weight: 0 };
        }
        topicScores[topic].total += (adjustedScore / maxScore) * 100;
        topicScores[topic].count++;
        topicScores[topic].weight += weight;
      }
      
      // Build radar data from grouped topics
      for (const [topic, data] of Object.entries(topicScores)) {
        radarData.push({
          subject: topic,
          score: Math.round(data.total / data.count),
          max: 100,
        });
      }
      
      const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
      const passingScore = cycle.minPassingScore || 70;
      const isPassed = finalScore >= passingScore;

      // Generate unique report code
      const reportCode = `OTS-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;

      const reportData = {
        reportCode,
        cycleId,
        studentId: cycle.studentId,
        trainerId: cycle.trainerId,
        companyId: cycle.companyId,
        status: "generated" as const,
        totalScore: Math.round(finalScore * 100) / 100,
        passingScore,
        isPassed,
        radarData: JSON.stringify(radarData),
        executiveSummary: `Reporte de evaluación para el ciclo "${cycle.title}". Total de eventos evaluados: ${events.length}. Penalizaciones aplicadas: ${totalPenalties} puntos.`,
        generatedById: req.user?.id,
        generatedAt: new Date(),
      };

      const report = await storage.createTrainingReport(reportData);
      
      // Update cycle with score
      await storage.updateCycle(cycleId, { score: finalScore });
      
      res.status(201).json(report);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate report" });
    }
  });

  app.patch("/api/reports/:id", authenticateToken, authorizeRoles("admin", "trainer", "super_admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verify report exists and belongs to user's company
      const existingReport = await storage.getTrainingReport(id);
      if (!existingReport) {
        return res.status(404).json({ error: "Report not found" });
      }
      if (req.user?.role !== "super_admin" && req.user?.companyId !== existingReport.companyId) {
        return res.status(403).json({ error: "No tienes permisos para modificar este reporte" });
      }
      
      const updates = req.body;
      const report = await storage.updateTrainingReport(id, updates);
      res.json(report);
    } catch (error) {
      res.status(400).json({ error: "Failed to update report" });
    }
  });

  app.post("/api/reports/:id/send", authenticateToken, authorizeRoles("admin", "trainer", "super_admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verify report exists and belongs to user's company
      const existingReport = await storage.getTrainingReport(id);
      if (!existingReport) {
        return res.status(404).json({ error: "Report not found" });
      }
      if (req.user?.role !== "super_admin" && req.user?.companyId !== existingReport.companyId) {
        return res.status(403).json({ error: "No tienes permisos para enviar este reporte" });
      }
      
      const { sendToSupervisor, sendToStudent, supervisorEmail } = req.body;
      
      const updates: Partial<{ sentToSupervisor: boolean; sentToStudent: boolean; supervisorEmail: string; sentAt: Date; status: "sent" }> = {
        sentAt: new Date(),
        status: "sent",
      };
      
      if (sendToSupervisor !== undefined) {
        updates.sentToSupervisor = sendToSupervisor;
        if (supervisorEmail) updates.supervisorEmail = supervisorEmail;
      }
      if (sendToStudent !== undefined) {
        updates.sentToStudent = sendToStudent;
      }
      
      const report = await storage.updateTrainingReport(id, updates);
      res.json({ success: true, report });
    } catch (error) {
      res.status(500).json({ error: "Failed to send report" });
    }
  });

  app.delete("/api/reports/:id", authenticateToken, authorizeRoles("admin", "super_admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verify report exists and belongs to user's company
      const existingReport = await storage.getTrainingReport(id);
      if (!existingReport) {
        return res.status(404).json({ error: "Report not found" });
      }
      if (req.user?.role !== "super_admin" && req.user?.companyId !== existingReport.companyId) {
        return res.status(403).json({ error: "No tienes permisos para eliminar este reporte" });
      }
      
      await storage.deleteTrainingReport(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete report" });
    }
  });

  // ============= ANNUAL TRAINING PROGRAMS ROUTES =============

  app.get("/api/annual-programs/company/:companyId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      
      if (req.user?.role !== "super_admin" && req.user?.companyId !== companyId) {
        return res.status(403).json({ error: "No tienes permisos para ver programas de otra empresa" });
      }
      
      const programs = await storage.getAnnualTrainingProgramsByCompany(companyId, year);
      res.json(programs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch annual programs" });
    }
  });

  app.get("/api/annual-programs/student/:studentId/:year", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const year = parseInt(req.params.year);
      const program = await storage.getAnnualTrainingProgramByStudent(studentId, year);
      res.json(program || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch annual program" });
    }
  });

  app.post("/api/annual-programs", authenticateToken, authorizeRoles("admin", "super_admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const program = await storage.createAnnualTrainingProgram(req.body);
      res.status(201).json(program);
    } catch (error) {
      res.status(400).json({ error: "Failed to create annual program" });
    }
  });

  app.patch("/api/annual-programs/:id", authenticateToken, authorizeRoles("admin", "trainer", "super_admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const program = await storage.updateAnnualTrainingProgram(id, req.body);
      if (!program) {
        return res.status(404).json({ error: "Annual program not found" });
      }
      res.json(program);
    } catch (error) {
      res.status(400).json({ error: "Failed to update annual program" });
    }
  });

  // ============= SETTINGS ROUTES =============

  // Company Settings
  app.get("/api/settings/company/:companyId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      
      if (req.user?.role !== "super_admin" && req.user?.companyId !== companyId) {
        return res.status(403).json({ error: "No tienes permisos para ver configuraciones de otra empresa" });
      }
      
      let settings = await storage.getCompanySettings(companyId);
      
      if (!settings) {
        settings = await storage.createCompanySettings({ companyId });
      }
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch company settings" });
    }
  });

  app.patch("/api/settings/company/:companyId", authenticateToken, authorizeRoles("admin", "super_admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      
      if (req.user?.role !== "super_admin" && req.user?.companyId !== companyId) {
        return res.status(403).json({ error: "No tienes permisos para modificar configuraciones de otra empresa" });
      }
      
      let settings = await storage.getCompanySettings(companyId);
      
      if (!settings) {
        settings = await storage.createCompanySettings({ companyId, ...req.body });
      } else {
        settings = await storage.updateCompanySettings(companyId, req.body);
      }
      
      res.json(settings);
    } catch (error) {
      res.status(400).json({ error: "Failed to update company settings" });
    }
  });

  // User Preferences
  app.get("/api/settings/user/:userId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (req.user?.id !== userId && req.user?.role !== "super_admin" && req.user?.role !== "admin") {
        return res.status(403).json({ error: "No tienes permisos para ver preferencias de otro usuario" });
      }
      
      let preferences = await storage.getUserPreferences(userId);
      
      if (!preferences) {
        preferences = await storage.createUserPreferences({ userId });
      }
      
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user preferences" });
    }
  });

  app.patch("/api/settings/user/:userId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (req.user?.id !== userId && req.user?.role !== "super_admin") {
        return res.status(403).json({ error: "No tienes permisos para modificar preferencias de otro usuario" });
      }
      
      let preferences = await storage.getUserPreferences(userId);
      
      if (!preferences) {
        preferences = await storage.createUserPreferences({ userId, ...req.body });
      } else {
        preferences = await storage.updateUserPreferences(userId, req.body);
      }
      
      res.json(preferences);
    } catch (error) {
      res.status(400).json({ error: "Failed to update user preferences" });
    }
  });

  // User Profile Update (change password, avatar, name)
  app.patch("/api/profile", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "No autenticado" });
      }
      
      const { name, avatar, currentPassword, newPassword } = req.body;
      const updates: Partial<{ name: string; avatar: string; password: string }> = {};
      
      if (name) updates.name = name;
      if (avatar !== undefined) updates.avatar = avatar;
      
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: "Debe proporcionar la contraseña actual" });
        }
        
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ error: "Usuario no encontrado" });
        }
        
        const bcrypt = await import("bcrypt");
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
          return res.status(400).json({ error: "Contraseña actual incorrecta" });
        }
        
        updates.password = await bcrypt.hash(newPassword, 10);
      }
      
      const updatedUser = await storage.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ error: "Failed to update profile" });
    }
  });

  // ============= EVALUATION TEMPLATES ROUTES =============

  app.get("/api/evaluation-templates", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.user?.role === "super_admin") {
        const templates = await storage.getAllEvaluationTemplates();
        return res.json(templates);
      }
      const globalTemplates = await storage.getEvaluationTemplatesByCompany(null);
      const companyTemplates = req.user?.companyId 
        ? await storage.getEvaluationTemplatesByCompany(req.user.companyId)
        : [];
      const allTemplates = [...globalTemplates, ...companyTemplates];
      res.json(allTemplates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch evaluation templates" });
    }
  });

  app.get("/api/evaluation-templates/company/:companyId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = req.params.companyId === 'null' ? null : parseInt(req.params.companyId);
      if (req.user?.role !== "super_admin" && companyId !== null && companyId !== req.user?.companyId) {
        return res.status(403).json({ error: "No tienes acceso a los templates de otra empresa" });
      }
      const templates = await storage.getEvaluationTemplatesByCompany(companyId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch evaluation templates" });
    }
  });

  app.get("/api/evaluation-templates/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const template = await storage.getEvaluationTemplate(id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      if (template.companyId !== null && req.user?.role !== "super_admin" && template.companyId !== req.user?.companyId) {
        return res.status(403).json({ error: "No tienes acceso a este template" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch evaluation template" });
    }
  });

  app.get("/api/evaluation-templates/:id/full", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.getEvaluationTemplateWithDetails(id);
      if (!result) {
        return res.status(404).json({ error: "Template not found" });
      }
      if (result.template.companyId !== null && req.user?.role !== "super_admin" && result.template.companyId !== req.user?.companyId) {
        return res.status(403).json({ error: "No tienes acceso a este template" });
      }
      
      const topicsWithDetails = await Promise.all(
        result.topics.map(async (tt) => {
          const topic = await storage.getEvaluationTopic(tt.topicId);
          return { ...tt, topic };
        })
      );
      
      res.json({ 
        ...result.template, 
        topics: topicsWithDetails, 
        events: result.events 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch evaluation template details" });
    }
  });

  // ============= TRAINING REQUESTS ROUTES =============

  app.get("/api/training-requests/company/:companyId", authenticateToken, authorizeRoles("admin", "super_admin", "trainer"), async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const requests = await storage.getTrainingRequestsByCompany(companyId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch training requests" });
    }
  });

  app.get("/api/training-requests/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.getTrainingRequest(id);
      if (!request) {
        return res.status(404).json({ error: "Training request not found" });
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch training request" });
    }
  });

  app.get("/api/training-requests/:id/full", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.getTrainingRequest(id);
      if (!request) {
        return res.status(404).json({ error: "Training request not found" });
      }
      
      const [incidents, roles, procedures, topics, recipients] = await Promise.all([
        storage.getRequestIncidents(id),
        storage.getRequestRoles(id),
        storage.getRequestProcedures(id),
        storage.getRequestTopics(id),
        storage.getRequestRecipients(id),
      ]);
      
      res.json({ ...request, incidents, roles, procedures, topics, recipients });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch training request details" });
    }
  });

  app.post("/api/training-requests", authenticateToken, authorizeRoles("admin", "super_admin", "trainer"), async (req: AuthenticatedRequest, res) => {
    try {
      const year = new Date().getFullYear();
      const existingRequests = await storage.getTrainingRequestsByCompany(req.body.companyId);
      const requestNumber = existingRequests.length + 1;
      const requestCode = `SOL-${year}-${String(requestNumber).padStart(3, '0')}`;
      
      const requestData = insertTrainingRequestSchema.parse({
        ...req.body,
        requestCode,
        requestedById: req.user?.id,
      });
      const newRequest = await storage.createTrainingRequest(requestData);
      res.status(201).json(newRequest);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create training request" });
    }
  });

  app.patch("/api/training-requests/:id", authenticateToken, authorizeRoles("admin", "super_admin", "trainer"), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      if (updates.status === "submitted" && !updates.submittedAt) {
        updates.submittedAt = new Date();
      }
      if (updates.status === "approved" && !updates.approvedAt) {
        updates.approvedAt = new Date();
      }
      if (updates.status === "rejected" && !updates.rejectedAt) {
        updates.rejectedAt = new Date();
      }
      
      const updatedRequest = await storage.updateTrainingRequest(id, updates);
      if (!updatedRequest) {
        return res.status(404).json({ error: "Training request not found" });
      }
      res.json(updatedRequest);
    } catch (error) {
      res.status(400).json({ error: "Failed to update training request" });
    }
  });

  app.delete("/api/training-requests/:id", authenticateToken, authorizeRoles("admin", "super_admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTrainingRequest(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete training request" });
    }
  });

  // Request Incidents
  app.get("/api/training-requests/:requestId/incidents", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const incidents = await storage.getRequestIncidents(requestId);
      res.json(incidents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch incidents" });
    }
  });

  app.post("/api/training-requests/:requestId/incidents", authenticateToken, authorizeRoles("admin", "super_admin", "trainer"), async (req: AuthenticatedRequest, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const incidentData = insertRequestIncidentSchema.parse({ ...req.body, requestId });
      const newIncident = await storage.createRequestIncident(incidentData);
      res.status(201).json(newIncident);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create incident" });
    }
  });

  app.patch("/api/request-incidents/:id", authenticateToken, authorizeRoles("admin", "super_admin", "trainer"), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateRequestIncident(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Incident not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Failed to update incident" });
    }
  });

  app.delete("/api/request-incidents/:id", authenticateToken, authorizeRoles("admin", "super_admin", "trainer"), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRequestIncident(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete incident" });
    }
  });

  // Request Roles
  app.get("/api/training-requests/:requestId/roles", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const roles = await storage.getRequestRoles(requestId);
      res.json(roles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch roles" });
    }
  });

  app.post("/api/training-requests/:requestId/roles", authenticateToken, authorizeRoles("admin", "super_admin", "trainer"), async (req: AuthenticatedRequest, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const roleData = insertRequestRoleSchema.parse({ ...req.body, requestId });
      const newRole = await storage.createRequestRole(roleData);
      res.status(201).json(newRole);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create role" });
    }
  });

  app.patch("/api/request-roles/:id", authenticateToken, authorizeRoles("admin", "super_admin", "trainer"), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateRequestRole(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Role not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Failed to update role" });
    }
  });

  app.delete("/api/request-roles/:id", authenticateToken, authorizeRoles("admin", "super_admin", "trainer"), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRequestRole(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete role" });
    }
  });

  // Request Procedures
  app.get("/api/training-requests/:requestId/procedures", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const procedures = await storage.getRequestProcedures(requestId);
      res.json(procedures);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch procedures" });
    }
  });

  app.post("/api/training-requests/:requestId/procedures", authenticateToken, authorizeRoles("admin", "super_admin", "trainer"), async (req: AuthenticatedRequest, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const procedureData = insertRequestProcedureSchema.parse({ ...req.body, requestId });
      const newProcedure = await storage.createRequestProcedure(procedureData);
      res.status(201).json(newProcedure);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create procedure" });
    }
  });

  app.patch("/api/request-procedures/:id", authenticateToken, authorizeRoles("admin", "super_admin", "trainer"), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateRequestProcedure(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Procedure not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Failed to update procedure" });
    }
  });

  app.delete("/api/request-procedures/:id", authenticateToken, authorizeRoles("admin", "super_admin", "trainer"), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRequestProcedure(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete procedure" });
    }
  });

  // Request Topics
  app.get("/api/training-requests/:requestId/topics", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const topics = await storage.getRequestTopics(requestId);
      res.json(topics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch topics" });
    }
  });

  app.post("/api/training-requests/:requestId/topics", authenticateToken, authorizeRoles("admin", "super_admin", "trainer"), async (req: AuthenticatedRequest, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const topicData = insertRequestTopicSchema.parse({ ...req.body, requestId });
      const newTopic = await storage.createRequestTopic(topicData);
      res.status(201).json(newTopic);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create topic" });
    }
  });

  app.patch("/api/request-topics/:id", authenticateToken, authorizeRoles("admin", "super_admin", "trainer"), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateRequestTopic(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Topic not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Failed to update topic" });
    }
  });

  app.delete("/api/request-topics/:id", authenticateToken, authorizeRoles("admin", "super_admin", "trainer"), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRequestTopic(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete topic" });
    }
  });

  // Request Recipients
  app.get("/api/training-requests/:requestId/recipients", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const recipients = await storage.getRequestRecipients(requestId);
      res.json(recipients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recipients" });
    }
  });

  app.post("/api/training-requests/:requestId/recipients", authenticateToken, authorizeRoles("admin", "super_admin", "trainer"), async (req: AuthenticatedRequest, res) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const recipientData = insertRequestRecipientSchema.parse({ ...req.body, requestId });
      const newRecipient = await storage.createRequestRecipient(recipientData);
      res.status(201).json(newRecipient);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to add recipient" });
    }
  });

  app.delete("/api/request-recipients/:id", authenticateToken, authorizeRoles("admin", "super_admin", "trainer"), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRequestRecipient(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to remove recipient" });
    }
  });

  return httpServer;
}
