import type { User, Company, Cycle, Event, SimulatorScenario, SimulatorSession, ScenarioStep, SessionStepResult, EvaluationTopic, EvaluationTopicItem, CycleTopicItem, TrainingRequest, TrainingRequestExecution, RequestIncident, RequestRole, RequestProcedure, RequestTopic, RequestRecipient, TrainingReport, JobProfile, Competency, JobProfileCompetency, CompetencyAssessment, EmployeeJobProfile, AnnualTrainingProgram, TrainingActivity, TrainingDocument, TrainingActivityAuditEvent, ImprovementAction } from "@shared/schema";

const API_BASE = "/api";

function getAuthToken(): string | null {
  return localStorage.getItem("ots_token");
}

function clearAuthAndRedirect() {
  localStorage.removeItem("ots_user");
  localStorage.removeItem("ots_company");
  localStorage.removeItem("ots_token");
  window.location.href = "/auth";
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
    
    if (response.status === 403 && error.error === "Token inválido o expirado") {
      clearAuthAndRedirect();
      throw new Error("Sesión expirada. Por favor inicia sesión nuevamente.");
    }
    
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
  assign: (data: {
    cycle: Partial<Omit<Cycle, "studentId">>;
    studentIds: number[];
    topicItems: Array<{ topicItemId: number; weight: number; customFocus?: string | null }>;
  }) => fetcher<Cycle[]>("/cycles/assign", {
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
  delete: async (id: number) => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE}/evaluation-topics/${id}`, { 
      method: "DELETE",
      headers,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || "Error al eliminar el tema");
    }
  },
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
  executions: TrainingRequestExecution[];
}

// Training Requests API
export const trainingRequestsAPI = {
  getByCompany: (companyId: number) => fetcher<TrainingRequest[]>(`/training-requests/company/${companyId}`),
  getById: (id: number) => fetcher<TrainingRequest>(`/training-requests/${id}`),
  getFull: (id: number) => fetcher<TrainingRequestFull>(`/training-requests/${id}/full`),
  addExecution: (id: number, data: {
    executionDate: string;
    method: "field" | "classroom" | "workshop" | "other";
    durationHours: number;
    participantCount: number;
    feedback?: string | null;
  }) => fetcher<TrainingRequestExecution>(`/training-requests/${id}/executions`, {
    method: "POST",
    body: JSON.stringify(data),
  }),
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

// Reports API
export interface VerifyResult {
  canGenerate: boolean;
  issues: string[];
  blockingIssues: string[];
  warnings: string[];
  eventsCount: number;
  cycle: Cycle;
}

export const reportsAPI = {
  getByCompany: (companyId: number) => fetcher<TrainingReport[]>(`/reports/company/${companyId}`),
  getByStudent: (studentId: number) => fetcher<TrainingReport[]>(`/reports/student/${studentId}`),
  getByCycle: (cycleId: number) => fetcher<TrainingReport | null>(`/reports/cycle/${cycleId}`),
  verify: (cycleId: number) => fetcher<VerifyResult>(`/reports/verify/${cycleId}`),
  generate: (cycleId: number) => fetcher<TrainingReport>(`/reports/generate/${cycleId}`, { method: "POST" }),
  send: (id: number, data: { sendToSupervisor?: boolean; sendToStudent?: boolean; supervisorEmail?: string }) =>
    fetcher<{ success: boolean; report: TrainingReport }>(`/reports/${id}/send`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<TrainingReport>) => fetcher<TrainingReport>(`/reports/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
  delete: async (id: number) => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE}/reports/${id}`, {
      method: "DELETE",
      headers: token ? { "Authorization": `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || "Error al eliminar reporte");
    }
  },
};

export interface CompetencyDncData {
  profiles: JobProfile[];
  competencies: Competency[];
  profileCompetencies: JobProfileCompetency[];
  assessments: CompetencyAssessment[];
  requests: TrainingRequest[];
  executions: TrainingRequestExecution[];
  employees: Pick<User, "id" | "name" | "email" | "role">[];
  assignments: EmployeeJobProfile[];
  sessions: SimulatorSession[];
  annualPrograms: AnnualTrainingProgram[];
}

export const competencyDncAPI = {
  getByCompany: (companyId: number, year?: number) => fetcher<CompetencyDncData>(`/competency-dnc/company/${companyId}${year ? `?year=${year}` : ""}`),
  assignJobProfile: (employeeId: number, companyId: number, profileId: number) =>
    fetcher<EmployeeJobProfile>(`/employee-job-profiles/${employeeId}`, {
      method: "PUT",
      body: JSON.stringify({ companyId, profileId }),
    }),
  createProfile: (data: { companyId: number; title: string; department?: string | null; description?: string | null }) =>
    fetcher<JobProfile>("/job-profiles", { method: "POST", body: JSON.stringify(data) }),
  updateProfile: (id: number, data: Partial<Pick<JobProfile, "title" | "department" | "description" | "active">>) =>
    fetcher<JobProfile>(`/job-profiles/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  createCompetency: (data: { companyId: number; name: string; category?: string | null; description?: string | null }) =>
    fetcher<Competency>("/competencies", { method: "POST", body: JSON.stringify(data) }),
  updateCompetency: (id: number, data: Partial<Pick<Competency, "name" | "category" | "description" | "active">>) =>
    fetcher<Competency>(`/competencies/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  setProfileCompetency: (data: { profileId: number; competencyId: number; requiredLevel: number; isCritical?: boolean }) =>
    fetcher<JobProfileCompetency>("/job-profile-competencies", { method: "POST", body: JSON.stringify(data) }),
  updateProfileCompetency: (id: number, data: Partial<Pick<JobProfileCompetency, "requiredLevel" | "isCritical">>) =>
    fetcher<JobProfileCompetency>(`/job-profile-competencies/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteProfileCompetency: async (id: number) => {
    const response = await fetch(`${API_BASE}/job-profile-competencies/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    });
    if (!response.ok) throw new Error("No se pudo quitar la competencia del perfil");
  },
  createAssessment: (data: {
    companyId: number;
    profileId: number;
    competencyId: number;
    employeeId: number;
    currentLevel: number;
    evidence?: string | null;
    observations?: string | null;
  }) => fetcher<CompetencyAssessment>("/competency-assessments", { method: "POST", body: JSON.stringify(data) }),
};

export interface TrainingProgramOverview {
  year: number;
  programs: Array<AnnualTrainingProgram & {
    completedHours: number;
    completedSessions: number;
    progressPercentage: number;
    student: Pick<User, "id" | "name" | "email" | "role"> | null;
  }>;
  activities: TrainingActivity[];
  documents: TrainingDocument[];
  improvementActions: ImprovementAction[];
  auditEvents: TrainingActivityAuditEvent[];
  auditActors: Record<number, string>;
  employees: Pick<User, "id" | "name" | "email" | "role">[];
  responsibles: Pick<User, "id" | "name" | "email" | "role">[];
  profiles: JobProfile[];
  requests: TrainingRequest[];
  scenarios: Pick<SimulatorScenario, "id" | "title" | "companyId">[];
  cycles: Pick<Cycle, "id" | "title" | "studentId" | "startDate" | "type" | "status">[];
  simulatorSessions: Array<Pick<SimulatorSession, "id" | "scenarioId" | "studentId" | "score" | "startTime" | "endTime" | "duration"> & { scenarioTitle: string }>;
  approvedRequests: TrainingRequest[];
  assessments: CompetencyAssessment[];
  metrics: {
    programCount: number;
    activityCount: number;
    plannedActivities: number;
    completedActivities: number;
    completionRate: number;
    programCompliance: number;
    passRate: number;
    attendanceRate: number;
    plannedHours: number;
    completedHours: number;
    overdueActivities: number;
    retrainingActivities: number;
    pendingReassessments: number;
    documentsExpiringSoon: number;
    expiredDocuments: number;
    needsDetected: number;
    needsAttended: number;
    needAttendanceRate: number;
    approvals: number;
    openDncGaps: number;
  };
}

export const trainingProgramAPI = {
  getByCompany: (companyId: number, year: number) =>
    fetcher<TrainingProgramOverview>(`/training-program/company/${companyId}?year=${year}`),
  saveProgram: (data: { studentId: number; year: number; targetHours?: number; targetSessions?: number }) =>
    fetcher<AnnualTrainingProgram>("/annual-training-programs", { method: "POST", body: JSON.stringify(data) }),
  createActivity: (data: {
    studentId: number;
    trainerId?: number | null;
    year: number;
    requestId?: number | null;
    dncAssessmentId?: number | null;
    cycleId?: number | null;
    simulatorSessionId?: number | null;
    title: string;
    objective?: string | null;
    trainingType: string;
    plannedStart?: string | null;
    plannedEnd?: string | null;
    plannedHours: number;
    evidence?: string | null;
  }) => fetcher<TrainingActivity>("/training-activities", { method: "POST", body: JSON.stringify(data) }),
  updateActivity: (id: number, data: Partial<Pick<TrainingActivity, "trainerId" | "title" | "objective" | "trainingType" | "status" | "plannedStart" | "plannedEnd" | "plannedHours" | "evidence">>) =>
    fetcher<TrainingActivity>(`/training-activities/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  completeActivity: (id: number, data: {
    attendanceStatus: "present" | "absent" | "excused";
    outcome: "pass" | "fail" | "not_applicable";
    completedHours: number;
    score?: number | null;
    feedback?: string | null;
    evidence?: string | null;
  }) => fetcher<{ activity: TrainingActivity; retry?: TrainingActivity }>(`/training-activities/${id}/complete`, { method: "POST", body: JSON.stringify(data) }),
  reassessActivity: (id: number, data: { currentLevel: number; evidence?: string | null; observations?: string | null }) =>
    fetcher<{ assessment: CompetencyAssessment; activity: TrainingActivity; retry?: TrainingActivity }>(`/training-activities/${id}/reassess`, { method: "POST", body: JSON.stringify(data) }),
  addDocument: (activityId: number, data: {
    title: string;
    documentType: "attendance" | "certificate" | "evaluation" | "material" | "feedback" | "other";
    documentUrl: string;
    revision: string;
    documentDate?: string | null;
    expiresAt?: string | null;
    notes?: string | null;
  }) => fetcher<TrainingDocument>(`/training-activities/${activityId}/documents`, { method: "POST", body: JSON.stringify(data) }),
  createControlledDocument: (data: {
    companyId: number;
    entityType: "profile" | "request" | "scenario" | "session" | "evaluation" | "activity";
    entityId: number;
    title: string;
    documentCode: string;
    documentType: "attendance" | "certificate" | "evaluation" | "material" | "feedback" | "other";
    documentUrl: string;
    revision: string;
    effectiveFrom?: string | null;
    documentDate?: string | null;
    expiresAt?: string | null;
    responsibleId: number;
    notes?: string | null;
  }) => fetcher<TrainingDocument>("/controlled-documents", { method: "POST", body: JSON.stringify(data) }),
  retireDocument: (id: number) => fetcher<void>(`/training-documents/${id}`, { method: "DELETE" }),
  deleteDocument: async (id: number) => {
    const response = await fetch(`${API_BASE}/training-documents/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getAuthToken()}` } });
    if (!response.ok) throw new Error("No se pudo eliminar el documento");
  },
  createImprovementAction: (data: {
    companyId: number;
    title: string;
    cause: string;
    responsibleId: number;
    targetDate: string;
    evidence?: string | null;
  }) => fetcher<ImprovementAction>("/improvement-actions", { method: "POST", body: JSON.stringify(data) }),
  updateImprovementAction: (id: number, data: {
    status?: "planned" | "in_progress" | "implemented" | "verified" | "cancelled";
    evidence?: string | null;
    effectiveness?: "pending" | "effective" | "ineffective";
    effectivenessNotes?: string;
  }) => fetcher<ImprovementAction>(`/improvement-actions/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
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
