import type { User, Company, Cycle, Event, SimulatorScenario, SimulatorSession, ScenarioStep, SessionStepResult, EvaluationTopic, EvaluationTopicItem, CycleTopicItem } from "@shared/schema";

const API_BASE = "/api";

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    return fetcher<{ user: User; company: Company }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
};

// Companies API
export const companiesAPI = {
  getAll: () => fetcher<Company[]>("/companies"),
  getById: (id: number) => fetcher<Company>(`/companies/${id}`),
};

// Users API
export const usersAPI = {
  getByCompany: (companyId: number) => fetcher<User[]>(`/users/company/${companyId}`),
  getById: (id: number) => fetcher<User>(`/users/${id}`),
  create: (data: { name: string; email: string; password: string; role: string; companyId: number; avatar?: string }) => 
    fetcher<User>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<{ name: string; email: string; password: string; role: string; avatar?: string }>) =>
    fetcher<User>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: number) => fetch(`${API_BASE}/users/${id}`, { method: "DELETE" }),
};

// Cycles API
export const cyclesAPI = {
  getByCompany: (companyId: number) => fetcher<Cycle[]>(`/cycles/company/${companyId}`),
  getByStudent: (studentId: number) => fetcher<Cycle[]>(`/cycles/student/${studentId}`),
  getByTrainer: (trainerId: number) => fetcher<Cycle[]>(`/cycles/trainer/${trainerId}`),
  getById: (id: number) => fetcher<Cycle>(`/cycles/${id}`),
  create: (data: Partial<Cycle>) => fetcher<Cycle>("/cycles", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  update: (id: number, data: Partial<Cycle>) => fetcher<Cycle>(`/cycles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetch(`${API_BASE}/cycles/${id}`, { method: "DELETE" }),
};

// Events API
export const eventsAPI = {
  getByCycle: (cycleId: number) => fetcher<Event[]>(`/events/cycle/${cycleId}`),
  getById: (id: number) => fetcher<Event>(`/events/${id}`),
  create: (data: Partial<Event>) => fetcher<Event>("/events", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  update: (id: number, data: Partial<Event>) => fetcher<Event>(`/events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
};

// Simulator Scenarios API
export const simulatorScenariosAPI = {
  getAll: () => fetcher<SimulatorScenario[]>("/simulator-scenarios"),
  getByCompany: (companyId: number | null) => fetcher<SimulatorScenario[]>(`/simulator-scenarios/company/${companyId}`),
  getById: (id: number) => fetcher<SimulatorScenario>(`/simulator-scenarios/${id}`),
  create: (data: Partial<SimulatorScenario>) => fetcher<SimulatorScenario>("/simulator-scenarios", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  update: (id: number, data: Partial<SimulatorScenario>) => fetcher<SimulatorScenario>(`/simulator-scenarios/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetch(`${API_BASE}/simulator-scenarios/${id}`, { method: "DELETE" }),
};

// Simulator Sessions API
export const simulatorSessionsAPI = {
  getByCompany: (companyId: number) => fetcher<SimulatorSession[]>(`/simulator-sessions/company/${companyId}`),
  getByStudent: (studentId: number) => fetcher<SimulatorSession[]>(`/simulator-sessions/student/${studentId}`),
  getById: (id: number) => fetcher<SimulatorSession>(`/simulator-sessions/${id}`),
  create: (data: Partial<SimulatorSession>) => fetcher<SimulatorSession>("/simulator-sessions", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  update: (id: number, data: Partial<SimulatorSession>) => fetcher<SimulatorSession>(`/simulator-sessions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
};

// Scenario Steps API
export const scenarioStepsAPI = {
  getByScenario: (scenarioId: number) => fetcher<ScenarioStep[]>(`/scenario-steps/scenario/${scenarioId}`),
  getById: (id: number) => fetcher<ScenarioStep>(`/scenario-steps/${id}`),
  create: (data: Partial<ScenarioStep>) => fetcher<ScenarioStep>("/scenario-steps", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  createBatch: (steps: Partial<ScenarioStep>[]) => fetcher<ScenarioStep[]>("/scenario-steps/batch", {
    method: "POST",
    body: JSON.stringify(steps),
  }),
  update: (id: number, data: Partial<ScenarioStep>) => fetcher<ScenarioStep>(`/scenario-steps/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetch(`${API_BASE}/scenario-steps/${id}`, { method: "DELETE" }),
  deleteByScenario: (scenarioId: number) => fetch(`${API_BASE}/scenario-steps/scenario/${scenarioId}`, { method: "DELETE" }),
};

// Session Step Results API
export const sessionStepResultsAPI = {
  getBySession: (sessionId: number) => fetcher<SessionStepResult[]>(`/session-step-results/session/${sessionId}`),
  create: (data: Partial<SessionStepResult>) => fetcher<SessionStepResult>("/session-step-results", {
    method: "POST",
    body: JSON.stringify(data),
  }),
};

// Evaluation Topics API
export const evaluationTopicsAPI = {
  getAll: () => fetcher<EvaluationTopic[]>("/evaluation-topics"),
  getById: (id: number) => fetcher<EvaluationTopic>(`/evaluation-topics/${id}`),
  create: (data: Partial<EvaluationTopic>) => fetcher<EvaluationTopic>("/evaluation-topics", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  update: (id: number, data: Partial<EvaluationTopic>) => fetcher<EvaluationTopic>(`/evaluation-topics/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetch(`${API_BASE}/evaluation-topics/${id}`, { method: "DELETE" }),
};

// Evaluation Topic Items API
export const evaluationTopicItemsAPI = {
  getByTopic: (topicId: number) => fetcher<EvaluationTopicItem[]>(`/evaluation-topic-items/topic/${topicId}`),
  getByCompany: (companyId: number | null) => fetcher<EvaluationTopicItem[]>(`/evaluation-topic-items/company/${companyId}`),
  getById: (id: number) => fetcher<EvaluationTopicItem>(`/evaluation-topic-items/${id}`),
  create: (data: Partial<EvaluationTopicItem>) => fetcher<EvaluationTopicItem>("/evaluation-topic-items", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  update: (id: number, data: Partial<EvaluationTopicItem>) => fetcher<EvaluationTopicItem>(`/evaluation-topic-items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetch(`${API_BASE}/evaluation-topic-items/${id}`, { method: "DELETE" }),
};

// Cycle Topic Items API
export const cycleTopicItemsAPI = {
  getByCycle: (cycleId: number) => fetcher<CycleTopicItem[]>(`/cycle-topic-items/cycle/${cycleId}`),
  create: (data: Partial<CycleTopicItem>) => fetcher<CycleTopicItem>("/cycle-topic-items", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  update: (id: number, data: Partial<CycleTopicItem>) => fetcher<CycleTopicItem>(`/cycle-topic-items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetch(`${API_BASE}/cycle-topic-items/${id}`, { method: "DELETE" }),
  deleteByCycle: (cycleId: number) => fetch(`${API_BASE}/cycle-topic-items/cycle/${cycleId}`, { method: "DELETE" }),
  sync: (cycleId: number, items: Array<{ topicItemId: number; weight: number; customFocus?: string }>) => 
    fetcher<CycleTopicItem[]>(`/cycle-topic-items/sync/${cycleId}`, {
      method: "POST",
      body: JSON.stringify({ items }),
    }),
};
