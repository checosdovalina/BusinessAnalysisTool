import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCycleSchema, insertEventSchema, insertSimulatorScenarioSchema, insertSimulatorSessionSchema, insertScenarioStepSchema, insertSessionStepResultSchema, insertEvaluationTopicSchema, insertEvaluationTopicItemSchema, insertCycleTopicItemSchema, insertCompanySchema, insertTrainingRequestSchema, insertRequestIncidentSchema, insertRequestRoleSchema, insertRequestProcedureSchema, insertRequestTopicSchema, insertRequestRecipientSchema, type TrainingRequest } from "@shared/schema";
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
  const hasCompanyAccess = (req: AuthenticatedRequest, companyId: number) =>
    req.user?.role === "super_admin" || req.user?.companyId === companyId;
  
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

  app.post("/api/simulator-sessions", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const sessionData = insertSimulatorSessionSchema.parse(req.body);
      if (!hasCompanyAccess(req, sessionData.companyId)) {
        return res.status(403).json({ error: "No tienes acceso a esta empresa" });
      }
      if (req.user?.role === "student" && sessionData.studentId !== req.user.id) {
        return res.status(403).json({ error: "Solo puedes registrar tus propias sesiones" });
      }
      if (sessionData.trainingRequestId) {
        const request = await storage.getTrainingRequest(sessionData.trainingRequestId);
        if (!request || request.companyId !== sessionData.companyId || request.simulatorScenarioId !== sessionData.scenarioId) {
          return res.status(400).json({ error: "La solicitud, la empresa y el escenario deben coincidir" });
        }
        if (request.dncAssessmentId) {
          const assessments = await storage.getCompetencyAssessmentsByCompany(request.companyId);
          const source = assessments.find((assessment) => assessment.id === request.dncAssessmentId);
          if (!source || source.employeeId !== sessionData.studentId) {
            return res.status(400).json({ error: "La sesión debe corresponder al operador de la brecha DNC" });
          }
        }
      }
      if (sessionData.repeatOfSessionId) {
        const previous = await storage.getSimulatorSession(sessionData.repeatOfSessionId);
        if (!previous || previous.trainingRequestId !== sessionData.trainingRequestId || previous.studentId !== sessionData.studentId) {
          return res.status(400).json({ error: "La repetición debe vincularse a una sesión previa del mismo operador y solicitud" });
        }
      }
      const newSession = await storage.createSimulatorSession(sessionData);
      res.status(201).json(newSession);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create session" });
    }
  });

  app.patch("/api/simulator-sessions/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getSimulatorSession(id);
      if (!existing) return res.status(404).json({ error: "Session not found" });
      if (!hasCompanyAccess(req, existing.companyId)) return res.status(403).json({ error: "No tienes acceso a esta sesión" });
      if (req.user?.role === "student" && existing.studentId !== req.user.id) {
        return res.status(403).json({ error: "Solo puedes actualizar tus propias sesiones" });
      }
      const updates = z.object({
        endTime: z.union([z.date(), z.string(), z.null()]).optional().transform((value) => typeof value === "string" ? new Date(value) : value),
        duration: z.number().int().min(0).optional(),
        score: z.number().int().min(0).max(100).nullable().optional(),
        responseTime: z.number().int().min(0).nullable().optional(),
        maneuverPrecision: z.number().int().min(0).max(100).nullable().optional(),
        procedureAdherence: z.number().int().min(0).max(100).nullable().optional(),
        logs: z.array(z.string()).optional(),
        feedback: z.string().trim().max(3000).nullable().optional(),
        trainingRequestId: z.number().int().positive().optional(),
        repeatOfSessionId: z.number().int().positive().optional(),
      }).strict().parse(req.body);
      if (updates.trainingRequestId) {
        const request = await storage.getTrainingRequest(updates.trainingRequestId);
        if (!request || request.companyId !== existing.companyId || request.simulatorScenarioId !== existing.scenarioId) {
          return res.status(400).json({ error: "La solicitud debe corresponder a la empresa y escenario de la sesión" });
        }
        if (request.dncAssessmentId) {
          const assessments = await storage.getCompetencyAssessmentsByCompany(request.companyId);
          const source = assessments.find((assessment) => assessment.id === request.dncAssessmentId);
          if (!source || source.employeeId !== existing.studentId) {
            return res.status(400).json({ error: "La sesión existente debe corresponder al operador de la brecha" });
          }
        }
      }
      if (updates.repeatOfSessionId) {
        const previous = await storage.getSimulatorSession(updates.repeatOfSessionId);
        const expectedRequestId = updates.trainingRequestId ?? existing.trainingRequestId;
        if (!previous || previous.trainingRequestId !== expectedRequestId || previous.studentId !== existing.studentId) {
          return res.status(400).json({ error: "La repetición debe ser del mismo operador y solicitud" });
        }
      }
      const updatedSession = await storage.updateSimulatorSession(id, updates);
      if (!updatedSession) {
        return res.status(404).json({ error: "Session not found" });
      }
      if (updatedSession.endTime && updatedSession.trainingRequestId) {
        const request = await storage.getTrainingRequest(updatedSession.trainingRequestId);
        if (request?.annualProgramId) await storage.recalculateAnnualProgramProgress(request.annualProgramId);
      }
      if (existing.trainingRequestId && existing.trainingRequestId !== updatedSession.trainingRequestId) {
        const oldRequest = await storage.getTrainingRequest(existing.trainingRequestId);
        if (oldRequest?.annualProgramId) await storage.recalculateAnnualProgramProgress(oldRequest.annualProgramId);
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

  // ============= COMPETENCY PROFILES AND DNC =============
  const competencyManagers = ["admin", "trainer", "super_admin"];

  app.get("/api/competency-dnc/company/:companyId", authenticateToken, authorizeRoles(...competencyManagers), async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = Number(req.params.companyId);
      if (!Number.isInteger(companyId) || companyId <= 0) return res.status(400).json({ error: "Empresa inválida" });
      if (!hasCompanyAccess(req, companyId)) return res.status(403).json({ error: "No tienes acceso a esta empresa" });

      const selectedYear = req.query.year ? Number(req.query.year) : undefined;
      if (selectedYear !== undefined && (!Number.isInteger(selectedYear) || selectedYear < 2000 || selectedYear > 9999)) {
        return res.status(400).json({ error: "Año inválido" });
      }
      const [profiles, competencyList, profileCompetencies, assessments, employeeList, requests, assignments, sessions, annualPrograms] = await Promise.all([
        storage.getJobProfilesByCompany(companyId),
        storage.getCompetenciesByCompany(companyId),
        storage.getJobProfileCompetenciesByCompany(companyId),
        storage.getCompetencyAssessmentsByCompany(companyId),
        storage.getUsersByCompany(companyId),
        storage.getTrainingRequestsByCompany(companyId),
        storage.getEmployeeJobProfilesByCompany(companyId),
        storage.getSimulatorSessionsByCompany(companyId),
        storage.getAnnualTrainingProgramsByCompany(companyId, selectedYear),
      ]);
      res.json({
        profiles,
        competencies: competencyList,
        profileCompetencies,
        assessments,
        requests: requests.filter((request) => request.dncAssessmentId !== null),
        employees: employeeList.map(({ id, name, email, role }) => ({ id, name, email, role })),
        assignments,
        sessions,
        annualPrograms,
      });
    } catch (error) {
      res.status(500).json({ error: "No se pudo cargar el análisis de competencias" });
    }
  });

  app.put("/api/employee-job-profiles/:employeeId", authenticateToken, authorizeRoles(...competencyManagers), async (req: AuthenticatedRequest, res) => {
    try {
      const employeeId = Number(req.params.employeeId);
      const body = z.object({
        companyId: z.number().int().positive(),
        profileId: z.number().int().positive(),
      }).strict().parse(req.body);
      if (!hasCompanyAccess(req, body.companyId)) return res.status(403).json({ error: "No tienes acceso a esta empresa" });
      const [employee, profile] = await Promise.all([
        storage.getUser(employeeId),
        storage.getJobProfile(body.profileId),
      ]);
      if (!employee || employee.companyId !== body.companyId || employee.role !== "student") {
        return res.status(400).json({ error: "Selecciona un operador de la empresa autorizada" });
      }
      if (!profile || profile.companyId !== body.companyId || !profile.active) {
        return res.status(400).json({ error: "El perfil debe estar activo y pertenecer a la empresa" });
      }
      const assignment = await storage.assignEmployeeJobProfile({
        companyId: body.companyId,
        employeeId,
        profileId: body.profileId,
        assignedById: req.user!.id,
      });
      res.json(assignment);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "No se pudo asignar el perfil al operador" });
    }
  });

  app.post("/api/job-profiles", authenticateToken, authorizeRoles(...competencyManagers), async (req: AuthenticatedRequest, res) => {
    try {
      const body = z.object({
        companyId: z.number().int().positive(),
        title: z.string().trim().min(2).max(120),
        department: z.string().trim().max(120).nullable().optional(),
        description: z.string().trim().max(1000).nullable().optional(),
      }).parse(req.body);
      if (!hasCompanyAccess(req, body.companyId)) return res.status(403).json({ error: "No tienes acceso a esta empresa" });
      const profile = await storage.createJobProfile({ ...body, active: true });
      res.status(201).json(profile);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "No se pudo crear el perfil" });
    }
  });

  app.patch("/api/job-profiles/:id", authenticateToken, authorizeRoles(...competencyManagers), async (req: AuthenticatedRequest, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getJobProfile(id);
      if (!existing) return res.status(404).json({ error: "Perfil no encontrado" });
      if (!hasCompanyAccess(req, existing.companyId)) return res.status(403).json({ error: "No tienes acceso a este perfil" });
      const updates = z.object({
        title: z.string().trim().min(2).max(120).optional(),
        department: z.string().trim().max(120).nullable().optional(),
        description: z.string().trim().max(1000).nullable().optional(),
        active: z.boolean().optional(),
      }).strict().parse(req.body);
      const profile = await storage.updateJobProfile(id, updates);
      res.json(profile);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "No se pudo actualizar el perfil" });
    }
  });

  app.post("/api/competencies", authenticateToken, authorizeRoles(...competencyManagers), async (req: AuthenticatedRequest, res) => {
    try {
      const body = z.object({
        companyId: z.number().int().positive(),
        name: z.string().trim().min(2).max(160),
        category: z.string().trim().max(100).nullable().optional(),
        description: z.string().trim().max(1000).nullable().optional(),
      }).parse(req.body);
      if (!hasCompanyAccess(req, body.companyId)) return res.status(403).json({ error: "No tienes acceso a esta empresa" });
      const competency = await storage.createCompetency({ ...body, active: true });
      res.status(201).json(competency);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "No se pudo crear la competencia" });
    }
  });

  app.patch("/api/competencies/:id", authenticateToken, authorizeRoles(...competencyManagers), async (req: AuthenticatedRequest, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getCompetency(id);
      if (!existing) return res.status(404).json({ error: "Competencia no encontrada" });
      if (!hasCompanyAccess(req, existing.companyId)) return res.status(403).json({ error: "No tienes acceso a esta competencia" });
      const updates = z.object({
        name: z.string().trim().min(2).max(160).optional(),
        category: z.string().trim().max(100).nullable().optional(),
        description: z.string().trim().max(1000).nullable().optional(),
        active: z.boolean().optional(),
      }).strict().parse(req.body);
      const competency = await storage.updateCompetency(id, updates);
      res.json(competency);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "No se pudo actualizar la competencia" });
    }
  });

  app.post("/api/job-profile-competencies", authenticateToken, authorizeRoles(...competencyManagers), async (req: AuthenticatedRequest, res) => {
    try {
      const body = z.object({
        profileId: z.number().int().positive(),
        competencyId: z.number().int().positive(),
        requiredLevel: z.number().int().min(1).max(5),
        isCritical: z.boolean().optional(),
      }).parse(req.body);
      const [profile, competency] = await Promise.all([
        storage.getJobProfile(body.profileId),
        storage.getCompetency(body.competencyId),
      ]);
      if (!profile || !competency) return res.status(404).json({ error: "Perfil o competencia no encontrado" });
      if (profile.companyId !== competency.companyId || !hasCompanyAccess(req, profile.companyId)) {
        return res.status(403).json({ error: "Perfil y competencia deben pertenecer a la empresa autorizada" });
      }
      const currentLinks = await storage.getJobProfileCompetenciesByCompany(profile.companyId);
      const existing = currentLinks.find((link) => link.profileId === profile.id && link.competencyId === competency.id);
      const item = existing
        ? await storage.updateJobProfileCompetency(existing.id, { requiredLevel: body.requiredLevel, isCritical: body.isCritical ?? false })
        : await storage.createJobProfileCompetency({ ...body, isCritical: body.isCritical ?? false });
      res.status(existing ? 200 : 201).json(item);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "No se pudo asignar la competencia al perfil" });
    }
  });

  app.patch("/api/job-profile-competencies/:id", authenticateToken, authorizeRoles(...competencyManagers), async (req: AuthenticatedRequest, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getJobProfileCompetency(id);
      if (!existing) return res.status(404).json({ error: "Competencia del perfil no encontrada" });
      const profile = await storage.getJobProfile(existing.profileId);
      if (!profile || !hasCompanyAccess(req, profile.companyId)) return res.status(403).json({ error: "No tienes acceso a este perfil" });
      const updates = z.object({
        requiredLevel: z.number().int().min(1).max(5).optional(),
        isCritical: z.boolean().optional(),
      }).strict().parse(req.body);
      res.json(await storage.updateJobProfileCompetency(id, updates));
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "No se pudo actualizar el requisito" });
    }
  });

  app.delete("/api/job-profile-competencies/:id", authenticateToken, authorizeRoles(...competencyManagers), async (req: AuthenticatedRequest, res) => {
    try {
      const id = Number(req.params.id);
      const item = await storage.getJobProfileCompetency(id);
      if (!item) return res.status(404).json({ error: "Competencia del perfil no encontrada" });
      const profile = await storage.getJobProfile(item.profileId);
      if (!profile || !hasCompanyAccess(req, profile.companyId)) return res.status(403).json({ error: "No tienes acceso a este perfil" });
      await storage.deleteJobProfileCompetency(id);
      res.status(204).send();
    } catch {
      res.status(500).json({ error: "No se pudo eliminar el requisito" });
    }
  });

  app.post("/api/competency-assessments", authenticateToken, authorizeRoles(...competencyManagers), async (req: AuthenticatedRequest, res) => {
    try {
      const body = z.object({
        companyId: z.number().int().positive(),
        profileId: z.number().int().positive(),
        competencyId: z.number().int().positive(),
        employeeId: z.number().int().positive(),
        currentLevel: z.number().int().min(0).max(5),
        evidence: z.string().trim().max(1500).nullable().optional(),
        observations: z.string().trim().max(1500).nullable().optional(),
      }).parse(req.body);
      if (!hasCompanyAccess(req, body.companyId)) return res.status(403).json({ error: "No tienes acceso a esta empresa" });
      const [profile, competency, employee, links] = await Promise.all([
        storage.getJobProfile(body.profileId),
        storage.getCompetency(body.competencyId),
        storage.getUser(body.employeeId),
        storage.getJobProfileCompetenciesByCompany(body.companyId),
      ]);
      const link = links.find((item) => item.profileId === body.profileId && item.competencyId === body.competencyId);
      if (!profile || !competency || !employee || !link) return res.status(400).json({ error: "El operador, perfil y competencia deben existir y estar relacionados" });
      if (profile.companyId !== body.companyId || competency.companyId !== body.companyId || employee.companyId !== body.companyId) {
        return res.status(403).json({ error: "Los registros deben pertenecer a la empresa autorizada" });
      }
      const currentAssignment = (await storage.getEmployeeJobProfilesByCompany(body.companyId))
        .find((assignment) => assignment.employeeId === employee.id);
      if (!currentAssignment || currentAssignment.profileId !== profile.id) {
        return res.status(400).json({ error: "Asigna primero el perfil vigente del operador y evalúalo con ese perfil" });
      }
      const assessment = await storage.createCompetencyAssessment({
        ...body,
        requiredLevel: link.requiredLevel,
        assessedById: req.user!.id,
      });
      const requests = await storage.getTrainingRequestsByCompany(body.companyId);
      const records = await storage.getCompetencyAssessmentsByCompany(body.companyId);
      const affectedRequests: Array<{ request: TrainingRequest; status: "completed" | "approved" }> = [];
      for (const request of requests) {
        if (!request.dncAssessmentId) continue;
        const original = records.find((item) => item.id === request.dncAssessmentId);
        if (!original || original.employeeId !== assessment.employeeId || original.profileId !== assessment.profileId ||
          original.competencyId !== assessment.competencyId) continue;
        if (assessment.currentLevel >= original.requiredLevel && request.status !== "completed") {
          affectedRequests.push({ request, status: "completed" });
        }
        else if (assessment.currentLevel < original.requiredLevel && request.status === "completed") {
          affectedRequests.push({ request, status: "approved" });
        }
      }
      await Promise.all(affectedRequests.map(({ request, status }) => storage.updateTrainingRequest(request.id, { status })));
      const programIds = Array.from(new Set(affectedRequests.map(({ request }) => request.annualProgramId).filter((id): id is number => id !== null)));
      await Promise.all(programIds.map((programId) => storage.recalculateAnnualProgramProgress(programId)));
      res.status(201).json(assessment);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "No se pudo registrar la evaluación DNC" });
    }
  });

  // ============= ANNUAL TRAINING CYCLE =============
  const trainingManagers = ["admin", "super_admin", "trainer"];
  const activityTypes = ["course", "simulator", "field", "workshop", "briefing", "other"] as const;
  const activityStatuses = ["planned", "scheduled", "in_progress", "cancelled"] as const;

  app.get("/api/training-program/company/:companyId", authenticateToken, authorizeRoles(...trainingManagers), async (req: AuthenticatedRequest, res) => {
    try {
      const companyId = Number(req.params.companyId);
      const year = Number(req.query.year ?? new Date().getFullYear());
      if (!Number.isInteger(companyId) || companyId <= 0 || !Number.isInteger(year) || year < 2000 || year > 2200) {
        return res.status(400).json({ error: "Empresa o año inválido" });
      }
      if (!hasCompanyAccess(req, companyId)) return res.status(403).json({ error: "No tienes acceso a esta empresa" });

      const [programs, allActivities, allDocuments, allAuditEvents, users, requests, assessments, cycles, sessions, scenarios] = await Promise.all([
        storage.getAnnualTrainingProgramsByCompany(companyId, year),
        storage.getTrainingActivitiesByCompany(companyId),
        storage.getTrainingDocumentsByCompany(companyId),
        storage.getTrainingActivityAuditByCompany(companyId),
        storage.getUsersByCompany(companyId),
        storage.getTrainingRequestsByCompany(companyId),
        storage.getCompetencyAssessmentsByCompany(companyId),
        storage.getCyclesByCompany(companyId),
        storage.getSimulatorSessionsByCompany(companyId),
        storage.getSimulatorScenariosByCompany(companyId),
      ]);
      const programIds = new Set(programs.map((program) => program.id));
      const activities = allActivities.filter((activity) => programIds.has(activity.annualProgramId));
      const activityIds = new Set(activities.map((activity) => activity.id));
      const documents = allDocuments.filter((document) => activityIds.has(document.activityId));
      const auditEvents = allAuditEvents.filter((event) => activityIds.has(event.activityId));
      const yearActivities = activities;
      const closed = yearActivities.filter((activity) => activity.status === "completed");
      const completed = closed.filter((activity) => activity.attendanceStatus === "present");
      const evaluated = completed.filter((activity) => activity.outcome === "pass" || activity.outcome === "fail");
      const eligibleActivities = yearActivities.filter((activity) => activity.status !== "cancelled");
      const today = new Date().toISOString().slice(0, 10);
      const next30Days = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
      const metrics = {
        programCount: programs.length,
        activityCount: yearActivities.length,
        plannedActivities: yearActivities.filter((activity) => activity.status !== "completed" && activity.status !== "cancelled").length,
        completedActivities: completed.length,
        completionRate: eligibleActivities.length ? Math.round(completed.length / eligibleActivities.length * 100) : 0,
        passRate: evaluated.length ? Math.round(evaluated.filter((activity) => activity.outcome === "pass").length / evaluated.length * 100) : 0,
        attendanceRate: closed.length ? Math.round(completed.length / closed.length * 100) : 0,
        plannedHours: yearActivities.filter((activity) => activity.status !== "cancelled").reduce((sum, activity) => sum + Number(activity.plannedHours || 0), 0),
        completedHours: closed.reduce((sum, activity) => sum + Number(activity.completedHours || 0), 0),
        overdueActivities: yearActivities.filter((activity) =>
          activity.status !== "completed" && activity.status !== "cancelled" &&
          (activity.plannedEnd ?? activity.plannedStart) &&
          new Date(activity.plannedEnd ?? activity.plannedStart!).getTime() < Date.now()
        ).length,
        retrainingActivities: yearActivities.filter((activity) => activity.attemptNumber > 1).length,
        pendingReassessments: yearActivities.filter((activity) => activity.reassessmentRequired).length,
        documentsExpiringSoon: documents.filter((document) => {
          if (!document.expiresAt) return false;
          return document.expiresAt >= today && document.expiresAt <= next30Days;
        }).length,
        expiredDocuments: documents.filter((document) => document.expiresAt && document.expiresAt < today).length,
      };
      const programsWithProgress = programs.map((program) => {
        const programActivities = yearActivities.filter((activity) => activity.annualProgramId === program.id);
        const done = programActivities.filter((activity) => activity.status === "completed" && activity.attendanceStatus === "present");
        const hours = done.reduce((sum, activity) => sum + Number(activity.completedHours || 0), 0);
        const targetHours = Number(program.targetHours || 0);
        return {
          ...program,
          completedHours: hours,
          completedSessions: done.length,
          progressPercentage: targetHours > 0 ? Math.min(100, Math.round(hours / targetHours * 100)) : 0,
          student: users.find((user) => user.id === program.studentId)
            ? (({ id, name, email, role }) => ({ id, name, email, role }))(users.find((user) => user.id === program.studentId)!)
            : null,
        };
      });
      res.json({
        year,
        programs: programsWithProgress,
        activities,
        documents,
        auditEvents,
        auditActors: Object.fromEntries(users.map(({ id, name }) => [id, name])),
        employees: users.filter((user) => user.role === "student").map(({ id, name, email, role }) => ({ id, name, email, role })),
        cycles: cycles.map(({ id, title, studentId, startDate, type, status }) => ({ id, title, studentId, startDate, type, status })),
        simulatorSessions: sessions.map(({ id, scenarioId, studentId, score, startTime, endTime, duration }) => ({
          id,
          scenarioId,
          studentId,
          score,
          startTime,
          endTime,
          duration,
          scenarioTitle: scenarios.find((scenario) => scenario.id === scenarioId)?.title ?? `Escenario #${scenarioId}`,
        })),
        approvedRequests: requests.filter((request) => request.status === "approved"),
        assessments,
        metrics,
      });
    } catch (error) {
      console.error("Error al consultar el programa anual:", error);
      res.status(500).json({ error: "No se pudo cargar el programa anual" });
    }
  });

  app.post("/api/annual-training-programs", authenticateToken, authorizeRoles(...trainingManagers), async (req: AuthenticatedRequest, res) => {
    try {
      const body = z.object({
        studentId: z.number().int().positive(),
        year: z.number().int().min(2000).max(2200),
        targetHours: z.number().min(0).max(5000).optional(),
        targetSessions: z.number().int().min(0).max(500).optional(),
      }).parse(req.body);
      const student = await storage.getUser(body.studentId);
      if (!student || !hasCompanyAccess(req, student.companyId)) return res.status(403).json({ error: "El operador no pertenece a la empresa autorizada" });
      if (student.role !== "student") return res.status(400).json({ error: "Selecciona una cuenta de operador" });
      const existing = await storage.getAnnualTrainingProgramByStudent(body.studentId, body.year);
      if (existing) {
        if (existing.companyId !== student.companyId) return res.status(403).json({ error: "El programa no pertenece a la empresa autorizada" });
        const updated = await storage.updateAnnualTrainingProgram(existing.id, {
          targetHours: body.targetHours ?? existing.targetHours,
          targetSessions: body.targetSessions ?? existing.targetSessions,
        });
        return res.json(updated);
      }
      const settings = await storage.getCompanySettings(student.companyId);
      const program = await storage.createAnnualTrainingProgram({
        companyId: student.companyId,
        studentId: student.id,
        year: body.year,
        targetHours: body.targetHours ?? settings?.defaultTrainingHoursPerYear ?? 40,
        targetSessions: body.targetSessions ?? settings?.defaultSessionsPerYear ?? 12,
      });
      res.status(201).json(program);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "No se pudo crear el programa anual" });
    }
  });

  app.post("/api/training-activities", authenticateToken, authorizeRoles(...trainingManagers), async (req: AuthenticatedRequest, res) => {
    try {
      const body = z.object({
        studentId: z.number().int().positive(),
        trainerId: z.number().int().positive().nullable().optional(),
        year: z.number().int().min(2000).max(2200),
        requestId: z.number().int().positive().nullable().optional(),
        dncAssessmentId: z.number().int().positive().nullable().optional(),
        cycleId: z.number().int().positive().nullable().optional(),
        simulatorSessionId: z.number().int().positive().nullable().optional(),
        title: z.string().trim().min(2).max(180),
        objective: z.string().trim().max(2000).nullable().optional(),
        trainingType: z.enum(activityTypes).default("course"),
        plannedStart: z.string().datetime().nullable().optional(),
        plannedEnd: z.string().datetime().nullable().optional(),
        plannedHours: z.number().min(0).max(500).default(0),
        evidence: z.string().trim().max(2000).nullable().optional(),
      }).parse(req.body);
      const student = await storage.getUser(body.studentId);
      if (!student || !hasCompanyAccess(req, student.companyId)) return res.status(403).json({ error: "El operador no pertenece a la empresa autorizada" });
      if (student.role !== "student") return res.status(400).json({ error: "Selecciona una cuenta de operador" });

      if (body.trainerId) {
        const trainer = await storage.getUser(body.trainerId);
        if (!trainer || trainer.companyId !== student.companyId || !["admin", "super_admin", "trainer"].includes(trainer.role)) {
          return res.status(400).json({ error: "El instructor debe pertenecer a la empresa" });
        }
      }
      if (body.plannedStart && body.plannedEnd && new Date(body.plannedEnd) < new Date(body.plannedStart)) {
        return res.status(400).json({ error: "La fecha final no puede ser anterior a la fecha de inicio" });
      }
      if (body.requestId) {
        const request = await storage.getTrainingRequest(body.requestId);
        if (!request || request.companyId !== student.companyId || request.status !== "approved") {
          return res.status(400).json({ error: "Solo se pueden programar solicitudes aprobadas de esta empresa" });
        }
      }
      if (body.dncAssessmentId) {
        const assessment = (await storage.getCompetencyAssessmentsByCompany(student.companyId))
          .find((item) => item.id === body.dncAssessmentId);
        if (!assessment || assessment.employeeId !== student.id) {
          return res.status(400).json({ error: "La brecha DNC debe corresponder al operador seleccionado" });
        }
      }
      if (body.cycleId) {
        const cycle = await storage.getCycle(body.cycleId);
        if (!cycle || cycle.companyId !== student.companyId || cycle.studentId !== student.id) {
          return res.status(400).json({ error: "El ciclo debe pertenecer al operador seleccionado" });
        }
      }
      if (body.simulatorSessionId) {
        const session = await storage.getSimulatorSession(body.simulatorSessionId);
        if (!session || session.companyId !== student.companyId || session.studentId !== student.id || !session.endTime) {
          return res.status(400).json({ error: "Selecciona una sesión de simulador concluida del operador" });
        }
      }

      let program = await storage.getAnnualTrainingProgramByStudent(student.id, body.year);
      if (program && program.companyId !== student.companyId) return res.status(403).json({ error: "El programa no pertenece a la empresa autorizada" });
      if (!program) {
        const settings = await storage.getCompanySettings(student.companyId);
        program = await storage.createAnnualTrainingProgram({
          companyId: student.companyId,
          studentId: student.id,
          year: body.year,
          targetHours: settings?.defaultTrainingHoursPerYear ?? 40,
          targetSessions: settings?.defaultSessionsPerYear ?? 12,
        });
      }
      const activity = await storage.createTrainingActivity({
        companyId: student.companyId,
        annualProgramId: program.id,
        studentId: student.id,
        trainerId: body.trainerId ?? null,
        requestId: body.requestId ?? null,
        dncAssessmentId: body.dncAssessmentId ?? null,
        cycleId: body.cycleId ?? null,
        simulatorSessionId: body.simulatorSessionId ?? null,
        repeatedFromId: null,
        attemptNumber: 1,
        repetitionReason: null,
        title: body.title,
        objective: body.objective ?? null,
        trainingType: body.trainingType,
        status: body.plannedStart ? "scheduled" : "planned",
        outcome: null,
        attendanceStatus: null,
        plannedStart: body.plannedStart ? new Date(body.plannedStart) : null,
        plannedEnd: body.plannedEnd ? new Date(body.plannedEnd) : null,
        plannedHours: body.plannedHours,
        completedHours: 0,
        score: null,
        feedback: null,
        evidence: body.evidence ?? null,
        reassessmentRequired: false,
        completedAt: null,
        createdById: req.user!.id,
      }, { actorId: req.user!.id, action: "activity_created", details: `Tipo: ${body.trainingType}; año: ${body.year}` });
      res.status(201).json(activity);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "No se pudo agregar la actividad al programa" });
    }
  });

  app.patch("/api/training-activities/:id", authenticateToken, authorizeRoles(...trainingManagers), async (req: AuthenticatedRequest, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await storage.getTrainingActivity(id);
      if (!existing) return res.status(404).json({ error: "Actividad no encontrada" });
      if (!hasCompanyAccess(req, existing.companyId)) return res.status(403).json({ error: "No tienes acceso a esta actividad" });
      if (existing.status === "completed") return res.status(409).json({ error: "Una actividad concluida no se puede editar; conserva la trazabilidad del resultado" });
      const body = z.object({
        trainerId: z.number().int().positive().nullable().optional(),
        title: z.string().trim().min(2).max(180).optional(),
        objective: z.string().trim().max(2000).nullable().optional(),
        trainingType: z.enum(activityTypes).optional(),
        status: z.enum(activityStatuses).optional(),
        plannedStart: z.string().datetime().nullable().optional(),
        plannedEnd: z.string().datetime().nullable().optional(),
        plannedHours: z.number().min(0).max(500).optional(),
        evidence: z.string().trim().max(2000).nullable().optional(),
      }).strict().parse(req.body);
      if (body.trainerId) {
        const trainer = await storage.getUser(body.trainerId);
        if (!trainer || trainer.companyId !== existing.companyId || !["admin", "super_admin", "trainer"].includes(trainer.role)) {
          return res.status(400).json({ error: "El instructor debe pertenecer a la empresa" });
        }
      }
      const start = body.plannedStart === undefined ? existing.plannedStart : body.plannedStart ? new Date(body.plannedStart) : null;
      const end = body.plannedEnd === undefined ? existing.plannedEnd : body.plannedEnd ? new Date(body.plannedEnd) : null;
      if (start && end && end < start) return res.status(400).json({ error: "La fecha final no puede ser anterior a la fecha de inicio" });
      const updated = await storage.updateTrainingActivity(id, {
        ...body,
        plannedStart: body.plannedStart === undefined ? undefined : start,
        plannedEnd: body.plannedEnd === undefined ? undefined : end,
      }, { actorId: req.user!.id, action: "activity_updated", details: `Campos actualizados: ${Object.keys(body).join(", ")}` });
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "No se pudo actualizar la actividad" });
    }
  });

  app.post("/api/training-activities/:id/complete", authenticateToken, authorizeRoles(...trainingManagers), async (req: AuthenticatedRequest, res) => {
    try {
      const id = Number(req.params.id);
      const activity = await storage.getTrainingActivity(id);
      if (!activity) return res.status(404).json({ error: "Actividad no encontrada" });
      if (!hasCompanyAccess(req, activity.companyId)) return res.status(403).json({ error: "No tienes acceso a esta actividad" });
      if (activity.status === "completed") return res.status(409).json({ error: "La actividad ya fue concluida" });
      const body = z.object({
        attendanceStatus: z.enum(["present", "absent", "excused"]),
        outcome: z.enum(["pass", "fail", "not_applicable"]),
        completedHours: z.number().min(0).max(500),
        score: z.number().min(0).max(100).nullable().optional(),
        feedback: z.string().trim().max(3000).nullable().optional(),
        evidence: z.string().trim().max(2000).nullable().optional(),
      }).parse(req.body);
      if (body.attendanceStatus !== "present" && body.outcome !== "not_applicable") {
        return res.status(400).json({ error: "Un resultado aprobatorio o no aprobatorio requiere asistencia registrada" });
      }
      if (body.attendanceStatus !== "present" && body.completedHours > 0) {
        return res.status(400).json({ error: "No se pueden registrar horas completadas si la persona no asistió" });
      }
      if (body.outcome === "not_applicable" && body.score != null) {
        return res.status(400).json({ error: "No registres calificación cuando el resultado no aplica" });
      }

      const shouldRepeat = body.outcome === "fail" || body.attendanceStatus === "absent";
      const reason = body.outcome === "fail" ? "Reentrenamiento por resultado no aprobatorio" : "Reprogramación por inasistencia";
      const retry = shouldRepeat ? {
        companyId: activity.companyId,
        annualProgramId: activity.annualProgramId,
        studentId: activity.studentId,
        trainerId: activity.trainerId,
        requestId: activity.requestId,
        dncAssessmentId: activity.dncAssessmentId,
        cycleId: activity.cycleId,
        simulatorSessionId: null,
        repeatedFromId: activity.id,
        attemptNumber: activity.attemptNumber + 1,
        repetitionReason: reason,
        title: `${activity.title} — ${body.outcome === "fail" ? "Reentrenamiento" : "Reprogramación"} ${activity.attemptNumber + 1}`,
        objective: activity.objective,
        trainingType: activity.trainingType,
        status: "planned",
        outcome: null,
        attendanceStatus: null,
        plannedStart: null,
        plannedEnd: null,
        plannedHours: activity.plannedHours,
        completedHours: 0,
        score: null,
        feedback: null,
        evidence: null,
        reassessmentRequired: false,
        completedAt: null,
        createdById: req.user!.id,
      } : null;
      const result = await storage.completeTrainingActivity(id, {
        status: "completed",
        outcome: body.outcome,
        attendanceStatus: body.attendanceStatus,
        completedHours: body.completedHours,
        score: body.score ?? null,
        feedback: body.feedback ?? null,
        evidence: body.evidence ?? activity.evidence,
        reassessmentRequired: body.outcome === "pass" && !!activity.dncAssessmentId,
        completedAt: new Date(),
      }, retry, {
        actorId: req.user!.id,
        action: "activity_completed",
        details: `Asistencia: ${body.attendanceStatus}; resultado: ${body.outcome}; horas: ${body.completedHours}`,
      });
      if (activity.requestId) {
        const related = (await storage.getTrainingActivitiesByCompany(activity.companyId))
          .filter((item) => item.requestId === activity.requestId);
        if (related.length > 0 && related.every((item) => item.status === "completed")) {
          await storage.updateTrainingRequest(activity.requestId, { status: "completed" });
        }
      }
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "No se pudo cerrar la actividad" });
    }
  });

  app.post("/api/training-activities/:id/reassess", authenticateToken, authorizeRoles(...trainingManagers), async (req: AuthenticatedRequest, res) => {
    try {
      const activity = await storage.getTrainingActivity(Number(req.params.id));
      if (!activity) return res.status(404).json({ error: "Actividad no encontrada" });
      if (!hasCompanyAccess(req, activity.companyId)) return res.status(403).json({ error: "No tienes acceso a esta actividad" });
      if (!activity.reassessmentRequired || !activity.dncAssessmentId) {
        return res.status(409).json({ error: "Esta actividad no tiene una reevaluación DNC pendiente" });
      }
      const body = z.object({
        currentLevel: z.number().int().min(0).max(5),
        evidence: z.string().trim().max(1500).nullable().optional(),
        observations: z.string().trim().max(1500).nullable().optional(),
      }).parse(req.body);
      const assessments = await storage.getCompetencyAssessmentsByCompany(activity.companyId);
      const original = assessments.find((item) => item.id === activity.dncAssessmentId);
      if (!original || original.employeeId !== activity.studentId) return res.status(400).json({ error: "No se encontró la evaluación DNC original del operador" });
      const currentLink = (await storage.getJobProfileCompetenciesByCompany(activity.companyId))
        .find((link) => link.profileId === original.profileId && link.competencyId === original.competencyId);
      if (!currentLink) return res.status(400).json({ error: "La competencia ya no está configurada para este perfil" });
      const needsMoreTraining = body.currentLevel < currentLink.requiredLevel;
      const nextAttempt = activity.attemptNumber + 1;
      const retry = needsMoreTraining ? {
        companyId: activity.companyId,
        annualProgramId: activity.annualProgramId,
        studentId: activity.studentId,
        trainerId: activity.trainerId,
        requestId: activity.requestId,
        dncAssessmentId: null,
        reassessmentId: null,
        cycleId: activity.cycleId,
        simulatorSessionId: null,
        repeatedFromId: activity.id,
        attemptNumber: nextAttempt,
        repetitionReason: `La reevaluación DNC registró nivel ${body.currentLevel}/5; se requiere ${currentLink.requiredLevel}/5`,
        title: `${activity.title} — Reentrenamiento ${nextAttempt}`,
        objective: activity.objective,
        trainingType: activity.trainingType,
        status: "planned",
        outcome: null,
        attendanceStatus: null,
        plannedStart: null,
        plannedEnd: null,
        plannedHours: activity.plannedHours,
        completedHours: 0,
        score: null,
        feedback: null,
        evidence: null,
        reassessmentRequired: false,
        completedAt: null,
        createdById: req.user!.id,
      } : null;
      const result = await storage.recordTrainingReassessment(
        activity.id,
        {
          companyId: activity.companyId,
          profileId: original.profileId,
          competencyId: original.competencyId,
          employeeId: activity.studentId,
          requiredLevel: currentLink.requiredLevel,
          currentLevel: body.currentLevel,
          evidence: body.evidence ?? null,
          observations: body.observations ?? null,
          assessedById: req.user!.id,
        },
        {},
        retry,
        { actorId: req.user!.id, action: "dnc_reassessed", details: `Nivel ${body.currentLevel}/${currentLink.requiredLevel}` },
      );
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "No se pudo registrar la reevaluación" });
    }
  });

  app.post("/api/training-activities/:id/documents", authenticateToken, authorizeRoles(...trainingManagers), async (req: AuthenticatedRequest, res) => {
    try {
      const activityId = Number(req.params.id);
      const activity = await storage.getTrainingActivity(activityId);
      if (!activity) return res.status(404).json({ error: "Actividad no encontrada" });
      if (!hasCompanyAccess(req, activity.companyId)) return res.status(403).json({ error: "No tienes acceso a esta actividad" });
      const body = z.object({
        title: z.string().trim().min(2).max(180),
        documentType: z.enum(["attendance", "certificate", "evaluation", "material", "feedback", "other"]).default("other"),
        documentUrl: z.string().url().max(1500).refine((value) => value.startsWith("https://"), "El enlace del documento debe usar HTTPS"),
        revision: z.string().trim().min(1).max(40).default("1"),
        documentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
          const parsed = new Date(`${value}T00:00:00.000Z`);
          return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
        }, "Fecha inválida").nullable().optional(),
        expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
          const parsed = new Date(`${value}T00:00:00.000Z`);
          return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
        }, "Fecha inválida").nullable().optional(),
        notes: z.string().trim().max(1500).nullable().optional(),
      }).parse(req.body);
      const document = await storage.createTrainingDocument({
        companyId: activity.companyId,
        activityId,
        title: body.title,
        documentType: body.documentType,
        documentUrl: body.documentUrl,
        revision: body.revision,
        documentDate: body.documentDate ?? null,
        expiresAt: body.expiresAt ?? null,
        notes: body.notes ?? null,
        createdById: req.user!.id,
      }, { actorId: req.user!.id, action: "document_registered", details: `${body.title} (rev. ${body.revision})` });
      res.status(201).json(document);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "No se pudo registrar el documento" });
    }
  });

  app.delete("/api/training-documents/:id", authenticateToken, authorizeRoles(...trainingManagers), async (req: AuthenticatedRequest, res) => {
    try {
      const document = await storage.getTrainingDocument(Number(req.params.id));
      if (!document) return res.status(404).json({ error: "Documento no encontrado" });
      if (!hasCompanyAccess(req, document.companyId)) return res.status(403).json({ error: "No tienes acceso a este documento" });
      await storage.deleteTrainingDocument(document.id, { actorId: req.user!.id, action: "document_deleted" });
      res.status(204).send();
    } catch {
      res.status(500).json({ error: "No se pudo eliminar el documento" });
    }
  });

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
      const requestedCompanyId = Number(req.body.companyId);
      if (!Number.isInteger(requestedCompanyId) || requestedCompanyId <= 0) {
        return res.status(400).json({ error: "Empresa inválida" });
      }
      if (!hasCompanyAccess(req, requestedCompanyId)) {
        return res.status(403).json({ error: "No puedes crear solicitudes en otra empresa" });
      }
      const year = new Date().getFullYear();
      const existingRequests = await storage.getTrainingRequestsByCompany(requestedCompanyId);
      const requestNumber = existingRequests.length + 1;
      const requestCode = `SOL-${year}-${String(requestNumber).padStart(3, '0')}`;
      
      const requestData = insertTrainingRequestSchema.parse({
        ...req.body,
        requestCode,
        requestedById: req.user?.id,
      });
      if (!hasCompanyAccess(req, requestData.companyId)) {
        return res.status(403).json({ error: "No puedes crear solicitudes en otra empresa" });
      }
      if (!requestData.dncAssessmentId && requestData.annualProgramId) {
        return res.status(400).json({ error: "El programa anual solo se asigna automáticamente a partir de una brecha DNC" });
      }
      if (requestData.dncAssessmentId) {
        const assessments = await storage.getCompetencyAssessmentsByCompany(requestData.companyId);
        const source = assessments.find((assessment) => assessment.id === requestData.dncAssessmentId);
        if (!source) {
          return res.status(400).json({ error: "La evaluación DNC asociada no existe en esta empresa" });
        }
        if (existingRequests.some((request) => request.dncAssessmentId === requestData.dncAssessmentId)) {
          return res.status(409).json({ error: "Esta evaluación DNC ya está incorporada a una solicitud" });
        }
      }
      let newRequest;
      if (requestData.dncAssessmentId) {
        const assessmentList = await storage.getCompetencyAssessmentsByCompany(requestData.companyId);
        const source = assessmentList.find((assessment) => assessment.id === requestData.dncAssessmentId);
        if (!source || source.currentLevel >= source.requiredLevel) {
          return res.status(400).json({ error: "Solo se pueden planificar brechas DNC abiertas" });
        }
        if (!requestData.responsibleId || !requestData.proposedStartDate || !requestData.proposedEndDate ||
          !requestData.estimatedHours || requestData.estimatedHours <= 0 || !requestData.trainingMethod?.trim()) {
          return res.status(400).json({ error: "La solicitud DNC requiere responsable, fechas, horas mayores a cero y método de entrenamiento" });
        }
        const planStart = requestData.proposedStartDate instanceof Date ? requestData.proposedStartDate : new Date(requestData.proposedStartDate);
        const planEnd = requestData.proposedEndDate instanceof Date ? requestData.proposedEndDate : new Date(requestData.proposedEndDate);
        if (Number.isNaN(planStart.getTime()) || Number.isNaN(planEnd.getTime()) || planEnd < planStart) {
          return res.status(400).json({ error: "La fecha final debe ser igual o posterior a la fecha inicial" });
        }
        const responsible = await storage.getUser(requestData.responsibleId);
        if (!responsible || responsible.companyId !== requestData.companyId) {
          return res.status(400).json({ error: "El responsable debe pertenecer a la empresa" });
        }
        if (requestData.simulatorScenarioId) {
          const scenario = await storage.getSimulatorScenario(requestData.simulatorScenarioId);
          if (!scenario || (scenario.companyId !== null && scenario.companyId !== requestData.companyId)) {
            return res.status(400).json({ error: "El escenario debe estar disponible para la empresa" });
          }
        }
        newRequest = await storage.createDncTrainingRequest(
          requestData,
          source.employeeId,
          planStart.getFullYear(),
        );
      } else {
        newRequest = await storage.createTrainingRequest(requestData);
      }
      res.status(201).json(newRequest);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to create training request" });
    }
  });

  app.patch("/api/training-requests/:id", authenticateToken, authorizeRoles("admin", "super_admin", "trainer"), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await storage.getTrainingRequest(id);
      if (!existing) return res.status(404).json({ error: "Training request not found" });
      if (!hasCompanyAccess(req, existing.companyId)) return res.status(403).json({ error: "No tienes acceso a esta solicitud" });
      const updates = req.body;
      if (updates.annualProgramId !== undefined || updates.dncAssessmentId !== undefined) {
        return res.status(400).json({ error: "El origen DNC y el programa anual no se pueden cambiar después de crear la solicitud" });
      }
      if (updates.status === "completed" && existing.dncAssessmentId) {
        const records = await storage.getCompetencyAssessmentsByCompany(existing.companyId);
        const source = records.find((assessment) => assessment.id === existing.dncAssessmentId);
        const latest = source && records
          .filter((assessment) => assessment.employeeId === source.employeeId && assessment.profileId === source.profileId && assessment.competencyId === source.competencyId)
          .sort((a, b) => new Date(b.assessedAt).getTime() - new Date(a.assessedAt).getTime())[0];
        if (!source || !latest || latest.currentLevel < source.requiredLevel) {
          return res.status(400).json({ error: "No se puede cerrar la solicitud hasta que una reevaluación alcance el nivel requerido" });
        }
      }
      
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
      if (updatedRequest.status === "completed" && updatedRequest.annualProgramId) {
        await storage.recalculateAnnualProgramProgress(updatedRequest.annualProgramId);
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
