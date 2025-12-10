import type { User, Company, Cycle, Event, SimulatorScenario, SimulatorSession, ScenarioStep, SessionStepResult, EvaluationTopic, EvaluationTopicItem, CycleTopicItem, TrainingRequest, RequestIncident, RequestRole, RequestProcedure, RequestTopic, RequestRecipient } from "@shared/schema";

const API_BASE = "/api";

function getAuthToken(): string | null {
  return localStorage.getItem("ots_token");
}

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
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
    return fetcher<{ user: User; company: Company; token: string }>("/auth/login", {
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
  delete: async (id: number) => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE}/users/${id}`, { 
      method: "DELETE",
      headers,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || "Failed to delete user");
    }
  },
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

// Training Request with full details
export interface TrainingRequestFull extends TrainingRequest {
  incidents: RequestIncident[];
  roles: RequestRole[];
  procedures: RequestProcedure[];
  topics: RequestTopic[];
  recipients: RequestRecipient[];
}

// Training Requests API
export const trainingRequestsAPI = {
  getByCompany: (companyId: number) => fetcher<TrainingRequest[]>(`/training-requests/company/${companyId}`),
  getById: (id: number) => fetcher<TrainingRequest>(`/training-requests/${id}`),
  getFull: (id: number) => fetcher<TrainingRequestFull>(`/training-requests/${id}/full`),
  create: (data: Partial<TrainingRequest>) => fetcher<TrainingRequest>("/training-requests", {
    method: "POST",
    body: JSON.stringify(data),
  }),
  update: (id: number, data: Partial<TrainingRequest>) => fetcher<TrainingRequest>(`/training-requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetch(`${API_BASE}/training-requests/${id}`, { 
    method: "DELETE",
    headers: { "Authorization": `Bearer ${getAuthToken()}` },
  }),
  
  // Incidents
  getIncidents: (requestId: number) => fetcher<RequestIncident[]>(`/training-requests/${requestId}/incidents`),
  createIncident: (requestId: number, data: Partial<RequestIncident>) => fetcher<RequestIncident>(`/training-requests/${requestId}/incidents`, {
    method: "POST",
    body: JSON.stringify(data),
  }),
  updateIncident: (id: number, data: Partial<RequestIncident>) => fetcher<RequestIncident>(`/request-incidents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
  deleteIncident: (id: number) => fetch(`${API_BASE}/request-incidents/${id}`, { 
    method: "DELETE",
    headers: { "Authorization": `Bearer ${getAuthToken()}` },
  }),
  
  // Roles
  getRoles: (requestId: number) => fetcher<RequestRole[]>(`/training-requests/${requestId}/roles`),
  createRole: (requestId: number, data: Partial<RequestRole>) => fetcher<RequestRole>(`/training-requests/${requestId}/roles`, {
    method: "POST",
    body: JSON.stringify(data),
  }),
  updateRole: (id: number, data: Partial<RequestRole>) => fetcher<RequestRole>(`/request-roles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
  deleteRole: (id: number) => fetch(`${API_BASE}/request-roles/${id}`, { 
    method: "DELETE",
    headers: { "Authorization": `Bearer ${getAuthToken()}` },
  }),
  
  // Procedures
  getProcedures: (requestId: number) => fetcher<RequestProcedure[]>(`/training-requests/${requestId}/procedures`),
  createProcedure: (requestId: number, data: Partial<RequestProcedure>) => fetcher<RequestProcedure>(`/training-requests/${requestId}/procedures`, {
    method: "POST",
    body: JSON.stringify(data),
  }),
  updateProcedure: (id: number, data: Partial<RequestProcedure>) => fetcher<RequestProcedure>(`/request-procedures/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
  deleteProcedure: (id: number) => fetch(`${API_BASE}/request-procedures/${id}`, { 
    method: "DELETE",
    headers: { "Authorization": `Bearer ${getAuthToken()}` },
  }),
  
  // Topics
  getTopics: (requestId: number) => fetcher<RequestTopic[]>(`/training-requests/${requestId}/topics`),
  createTopic: (requestId: number, data: Partial<RequestTopic>) => fetcher<RequestTopic>(`/training-requests/${requestId}/topics`, {
    method: "POST",
    body: JSON.stringify(data),
  }),
  updateTopic: (id: number, data: Partial<RequestTopic>) => fetcher<RequestTopic>(`/request-topics/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
  deleteTopic: (id: number) => fetch(`${API_BASE}/request-topics/${id}`, { 
    method: "DELETE",
    headers: { "Authorization": `Bearer ${getAuthToken()}` },
  }),
  
  // Recipients
  getRecipients: (requestId: number) => fetcher<RequestRecipient[]>(`/training-requests/${requestId}/recipients`),
  addRecipient: (requestId: number, data: Partial<RequestRecipient>) => fetcher<RequestRecipient>(`/training-requests/${requestId}/recipients`, {
    method: "POST",
    body: JSON.stringify(data),
  }),
  removeRecipient: (id: number) => fetch(`${API_BASE}/request-recipients/${id}`, { 
    method: "DELETE",
    headers: { "Authorization": `Bearer ${getAuthToken()}` },
  }),
};

// Evaluation Templates API
export interface EvaluationTemplateWithDetails {
  id: number;
  code: string;
  name: string;
  description: string | null;
  templateType: string;
  cycleType: string;
  companyId: number | null;
  defaultMinPassingScore: number | null;
  estimatedDuration: number | null;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  isSystem: boolean;
  sortOrder: number;
  topics: Array<{
    id: number;
    templateId: number;
    topicId: number;
    categoryTag: string | null;
    defaultMaxPoints: number | null;
    defaultWeight: number | null;
    isRequired: boolean;
    sortOrder: number;
    topic: EvaluationTopic | null;
  }>;
  events: Array<{
    id: number;
    templateId: number;
    title: string;
    description: string | null;
    evaluationTopic: string | null;
    maxScore: number;
    weight: number | null;
    expectedActions: string[] | null;
    gradingCriteria: string | null;
    sortOrder: number;
  }>;
}

export const evaluationTemplatesAPI = {
  getAll: () => fetcher<any[]>("/evaluation-templates"),
  getByCompany: (companyId: number | null) => 
    fetcher<any[]>(`/evaluation-templates/company/${companyId}`),
  getById: (id: number) => fetcher<any>(`/evaluation-templates/${id}`),
  getWithDetails: (id: number) => fetcher<EvaluationTemplateWithDetails>(`/evaluation-templates/${id}/full`),
};
