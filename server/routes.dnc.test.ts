import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import express from "express";
import { createServer, type Server } from "node:http";
import jwt from "jsonwebtoken";

const companyId = 12;
const adminId = 1;
const operatorId = 2;
const oldProfileId = 20;
const currentProfileId = 21;
const competencyId = 30;
const scenarioId = 40;
const programYear = 2030;

class DncTestStorage {
  users = [
    { id: adminId, name: "DNC Manager", email: "manager@example.test", role: "admin", companyId, password: "unused" },
    { id: operatorId, name: "Operator", email: "operator@example.test", role: "student", companyId, password: "unused" },
  ];
  profiles = [
    { id: oldProfileId, companyId, title: "Old profile", active: true },
    { id: currentProfileId, companyId, title: "Current profile", active: true },
  ];
  competencies = [{ id: competencyId, companyId, name: "System operation", active: true }];
  links = [
    { id: 1, profileId: oldProfileId, competencyId, requiredLevel: 2, isCritical: false },
    { id: 2, profileId: currentProfileId, competencyId, requiredLevel: 4, isCritical: true },
  ];
  assignments: any[] = [];
  assessments: any[] = [];
  requests: any[] = [];
  programs: any[] = [];
  sessions: any[] = [];
  executions: any[] = [];
  nextAssessmentId = 1;
  nextRequestId = 1;
  nextProgramId = 1;
  nextSessionId = 1;
  assessedMinute = 0;

  async getUser(id: number) { return this.users.find((user) => user.id === id); }
  async getUsersByCompany(id: number) { return this.users.filter((user) => user.companyId === id); }
  async getJobProfile(id: number) { return this.profiles.find((profile) => profile.id === id); }
  async getJobProfilesByCompany(id: number) { return this.profiles.filter((profile) => profile.companyId === id); }
  async getCompetency(id: number) { return this.competencies.find((item) => item.id === id); }
  async getCompetenciesByCompany(id: number) { return this.competencies.filter((item) => item.companyId === id); }
  async getJobProfileCompetenciesByCompany() { return this.links; }
  async getEmployeeJobProfilesByCompany(id: number) { return this.assignments.filter((item) => item.companyId === id); }

  async assignEmployeeJobProfile(input: any) {
    const existing = this.assignments.find((item) => item.employeeId === input.employeeId);
    const assignment = { ...existing, ...input, id: existing?.id ?? 1, assignedAt: new Date() };
    if (existing) Object.assign(existing, assignment);
    else this.assignments.push(assignment);
    return assignment;
  }

  async getCompetencyAssessmentsByCompany(id: number) {
    return this.assessments.filter((item) => item.companyId === id)
      .sort((a, b) => b.assessedAt.getTime() - a.assessedAt.getTime());
  }

  async createCompetencyAssessment(input: any) {
    const assessment = {
      ...input,
      id: this.nextAssessmentId++,
      assessedAt: new Date(Date.UTC(programYear, 0, 1, 0, this.assessedMinute++)),
    };
    this.assessments.push(assessment);
    return assessment;
  }

  async getTrainingRequestsByCompany(id: number) { return this.requests.filter((item) => item.companyId === id); }
  async getTrainingRequest(id: number) { return this.requests.find((item) => item.id === id); }

  async createDncTrainingRequest(input: any, studentId: number, year: number) {
    let program = this.programs.find((item) => item.companyId === input.companyId &&
      item.studentId === studentId && item.year === year);
    if (!program) {
      program = {
        id: this.nextProgramId++,
        companyId: input.companyId,
        studentId,
        year,
        targetHours: input.estimatedHours,
        targetSessions: 1,
        completedHours: 0,
        completedSessions: 0,
        progressPercentage: 0,
        isCompleted: false,
        completedAt: null,
      };
      this.programs.push(program);
    } else {
      program.targetHours += input.estimatedHours ?? 0;
      program.targetSessions += 1;
    }
    const request = { ...input, id: this.nextRequestId++, annualProgramId: program.id };
    this.requests.push(request);
    return request;
  }

  async updateTrainingRequest(id: number, updates: any) {
    const request = this.requests.find((item) => item.id === id);
    if (!request) return undefined;
    Object.assign(request, updates);
    return request;
  }

  async recalculateAnnualProgramProgress(id: number) {
    const program = this.programs.find((item) => item.id === id);
    if (!program) return undefined;
    const programRequests = this.requests.filter((item) => item.annualProgramId === id);
    const requestIds = new Set(programRequests.map((item) => item.id));
    const completedSessions = this.sessions.filter((item) =>
      requestIds.has(item.trainingRequestId) && item.endTime !== null
    );
    program.completedHours = Math.round(completedSessions.reduce(
      (sum, item) => sum + (item.duration ?? 0) / 3600, 0
    ) * 100) / 100;
    program.completedSessions = completedSessions.length;
    const completedRequests = programRequests.filter((item) => item.status === "completed").length;
    program.progressPercentage = programRequests.length
      ? Math.round(completedRequests / programRequests.length * 100)
      : 0;
    program.isCompleted = programRequests.length > 0 && completedRequests === programRequests.length;
    return program;
  }

  async getAnnualTrainingProgram(id: number) { return this.programs.find((item) => item.id === id); }
  async getAnnualTrainingProgramByStudent(studentId: number, year: number) {
    return this.programs.find((item) => item.studentId === studentId && item.year === year);
  }
  async getAnnualTrainingProgramsByCompany(id: number, year?: number) {
    return this.programs.filter((item) => item.companyId === id && (year === undefined || item.year === year));
  }

  async getSimulatorScenario(id: number) {
    return id === scenarioId ? { id, companyId, title: "DNC simulation" } : undefined;
  }
  async getSimulatorSessionsByCompany(id: number) { return this.sessions.filter((item) => item.companyId === id); }
  async getSimulatorSessionsByStudent(id: number) { return this.sessions.filter((item) => item.studentId === id); }
  async getSimulatorSession(id: number) { return this.sessions.find((item) => item.id === id); }

  async createSimulatorSession(input: any) {
    const session = {
      ...input,
      id: this.nextSessionId++,
      startTime: new Date(Date.UTC(programYear, 0, 2)),
      endTime: null,
      duration: null,
      feedback: null,
      createdAt: new Date(),
    };
    this.sessions.push(session);
    return session;
  }

  async updateSimulatorSession(id: number, updates: any) {
    const session = this.sessions.find((item) => item.id === id);
    if (!session) return undefined;
    Object.assign(session, updates);
    return session;
  }

  async createTrainingRequestExecution(input: any) {
    const execution = { ...input, id: this.executions.length + 1, createdAt: new Date() };
    this.executions.push(execution);
    return execution;
  }
  async getTrainingRequestExecutionsByCompany(id: number) {
    const requestIds = new Set(this.requests.filter((item) => item.companyId === id).map((item) => item.id));
    return this.executions.filter((item) => requestIds.has(item.requestId));
  }

  // The annual overview endpoint needs these additional collections; this test
  // focuses its assertions on DNC gaps and annual-program totals.
  async getTrainingActivitiesByCompany() { return []; }
  async getTrainingDocumentsByCompany() { return []; }
  async getTrainingActivityAuditByCompany() { return []; }
  async getCyclesByCompany() { return []; }
  async getSimulatorScenariosByCompany() { return [{ id: scenarioId, companyId, title: "DNC simulation" }]; }
  async getImprovementActionsByCompany() { return []; }
}

let server: Server;
let baseUrl: string;
let token: string;
let repository: DncTestStorage;

before(async () => {
  // Route tests use only the in-memory adapter; this placeholder is never queried.
  process.env.DATABASE_URL = "postgresql://test:test@127.0.0.1:1/test";
  process.env.JWT_SECRET = "dnc-route-test-secret";
  const { registerRoutes } = await import("./routes");
  const app = express();
  app.use(express.json());
  server = createServer(app);
  repository = new DncTestStorage();
  await registerRoutes(server, app, repository as any);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind a TCP port");
  baseUrl = `http://127.0.0.1:${address.port}`;
  token = jwt.sign({ userId: adminId, role: "admin", companyId }, process.env.JWT_SECRET);
});

after(async () => {
  if (server?.listening) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

async function api(path: string, method = "GET", body?: unknown) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = response.status === 204 ? null : await response.json();
  return { response, data };
}

test("DNC closes only at the current standard, reopens after a drop, and updates annual totals", async () => {
  // Assignment can be changed; assessments must use the operator's current profile.
  const firstAssignment = await api(`/api/employee-job-profiles/${operatorId}`, "PUT", { companyId, profileId: oldProfileId });
  assert.equal(firstAssignment.response.status, 200);
  const currentAssignment = await api(`/api/employee-job-profiles/${operatorId}`, "PUT", { companyId, profileId: currentProfileId });
  assert.equal(currentAssignment.response.status, 200);
  assert.equal(currentAssignment.data.profileId, currentProfileId);

  const staleProfileAssessment = await api("/api/competency-assessments", "POST", {
    companyId, profileId: oldProfileId, competencyId, employeeId: operatorId, currentLevel: 1,
  });
  assert.equal(staleProfileAssessment.response.status, 400);

  const initialAssessment = await api("/api/competency-assessments", "POST", {
    companyId, profileId: currentProfileId, competencyId, employeeId: operatorId, currentLevel: 1,
    evidence: "Initial observation",
  });
  assert.equal(initialAssessment.response.status, 201);
  assert.equal(initialAssessment.data.requiredLevel, 4);

  const requestBody = {
    companyId,
    title: "DNC: System operation — Operator",
    description: "Training for a competency gap",
    objective: "Reach required level 4/5",
    justification: "DNC assessment identified a gap",
    status: "approved",
    priority: "high",
    responsibleId: adminId,
    proposedStartDate: "2030-03-01T00:00:00.000Z",
    proposedEndDate: "2030-03-31T00:00:00.000Z",
    estimatedHours: 6,
    targetAudience: "Operator",
    participantCount: 1,
    dncAssessmentId: initialAssessment.data.id,
    trainingMethod: "simulator",
    simulatorScenarioId: scenarioId,
  };
  const createdRequest = await api("/api/training-requests", "POST", requestBody);
  assert.equal(createdRequest.response.status, 201);
  assert.equal(createdRequest.data.annualProgramId, 1);
  assert.equal(repository.programs[0].year, 2030);

  const duplicateRequest = await api("/api/training-requests", "POST", requestBody);
  assert.equal(duplicateRequest.response.status, 409);
  assert.equal(repository.requests.length, 1);

  const firstSession = await api("/api/simulator-sessions", "POST", {
    scenarioId, studentId: operatorId, trainerId: adminId, companyId,
    trainingRequestId: createdRequest.data.id,
  });
  assert.equal(firstSession.response.status, 201);
  const repeatedSession = await api("/api/simulator-sessions", "POST", {
    scenarioId, studentId: operatorId, trainerId: adminId, companyId,
    trainingRequestId: createdRequest.data.id,
    repeatOfSessionId: firstSession.data.id,
  });
  assert.equal(repeatedSession.response.status, 201);
  assert.equal(repeatedSession.data.repeatOfSessionId, firstSession.data.id);

  const wrongOperatorRepeat = await api("/api/simulator-sessions", "POST", {
    scenarioId, studentId: 99, trainerId: adminId, companyId,
    trainingRequestId: createdRequest.data.id,
    repeatOfSessionId: firstSession.data.id,
  });
  assert.equal(wrongOperatorRepeat.response.status, 400);

  const prematureClose = await api(`/api/training-requests/${createdRequest.data.id}`, "PATCH", { status: "completed" });
  assert.equal(prematureClose.response.status, 400);
  assert.equal(repository.requests[0].status, "approved");

  for (const [session, duration, feedback] of [
    [firstSession.data, 3600, "First attempt feedback"],
    [repeatedSession.data, 1800, "Repeat feedback"],
  ] as const) {
    const updated = await api(`/api/simulator-sessions/${session.id}`, "PATCH", {
      endTime: "2030-03-15T12:00:00.000Z",
      duration,
      feedback,
    });
    assert.equal(updated.response.status, 200);
    assert.equal(updated.data.feedback, feedback);
  }
  assert.equal(repository.programs[0].completedHours, 1.5);
  assert.equal(repository.programs[0].completedSessions, 2);

  const passingReassessment = await api("/api/competency-assessments", "POST", {
    companyId, profileId: currentProfileId, competencyId, employeeId: operatorId, currentLevel: 4,
    evidence: "Required standard met",
  });
  assert.equal(passingReassessment.response.status, 201);
  assert.equal(repository.requests[0].status, "completed");
  assert.equal(repository.programs[0].progressPercentage, 100);

  const annualDnc = await api(`/api/competency-dnc/company/${companyId}?year=${programYear}`);
  assert.equal(annualDnc.response.status, 200);
  assert.equal(annualDnc.data.annualPrograms.length, 1);
  assert.equal(annualDnc.data.annualPrograms[0].year, programYear);
  assert.equal(annualDnc.data.requests.length, 1);
  assert.equal(annualDnc.data.sessions.length, 2);
  assert.equal(annualDnc.data.annualPrograms[0].completedHours, 1.5);
  assert.equal(annualDnc.data.annualPrograms[0].completedSessions, 2);
  assert.deepEqual(
    annualDnc.data.sessions.map((session: any) => session.feedback),
    ["First attempt feedback", "Repeat feedback"],
  );

  const closedAnnualReport = await api(`/api/training-program/company/${companyId}?year=${programYear}`);
  assert.equal(closedAnnualReport.response.status, 200);
  assert.equal(closedAnnualReport.data.metrics.openDncGaps, 0);

  const insufficientReassessment = await api("/api/competency-assessments", "POST", {
    companyId, profileId: currentProfileId, competencyId, employeeId: operatorId, currentLevel: 3,
    observations: "Performance fell below the required level",
  });
  assert.equal(insufficientReassessment.response.status, 201);
  assert.equal(repository.requests[0].status, "approved");
  assert.equal(repository.programs[0].progressPercentage, 0);
  assert.equal(repository.programs[0].isCompleted, false);

  const closedAgain = await api(`/api/training-requests/${createdRequest.data.id}`, "PATCH", { status: "completed" });
  assert.equal(closedAgain.response.status, 400);
  const reopenedAnnualReport = await api(`/api/training-program/company/${companyId}?year=${programYear}`);
  assert.equal(reopenedAnnualReport.response.status, 200);
  assert.equal(reopenedAnnualReport.data.metrics.openDncGaps, 1);
  assert.equal(reopenedAnnualReport.data.metrics.needsDetected, 1);

  const reopenedAnnualDnc = await api(`/api/competency-dnc/company/${companyId}?year=${programYear}`);
  assert.equal(reopenedAnnualDnc.response.status, 200);
  assert.equal(reopenedAnnualDnc.data.annualPrograms[0].completedHours, 1.5);
  assert.equal(reopenedAnnualDnc.data.requests[0].status, "approved");
});
