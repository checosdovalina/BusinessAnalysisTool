import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCycleSchema, insertEventSchema, insertSimulatorScenarioSchema, insertSimulatorSessionSchema, insertScenarioStepSchema, insertSessionStepResultSchema, insertEvaluationTopicSchema, insertEvaluationTopicItemSchema, insertCycleTopicItemSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

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
      
      res.json({ 
        user: { ...user, password: undefined },
        company 
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

  // ============= USERS ROUTES =============
  
  app.get("/api/users/company/:companyId", async (req, res) => {
    try {
      const companyId = parseInt(req.params.companyId);
      const users = await storage.getUsersByCompany(companyId);
      res.json(users.map(u => ({ ...u, password: undefined })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
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

  return httpServer;
}
