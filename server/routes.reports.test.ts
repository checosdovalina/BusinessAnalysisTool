import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import express from "express";
import { createServer, type Server } from "node:http";
import jwt from "jsonwebtoken";

const companyId = 12;
const adminId = 1;
const cycleId = 30;

class ReportTestStorage {
  cycle = {
    id: cycleId,
    title: "Penalty report test",
    companyId,
    studentId: 2,
    trainerId: adminId,
    minPassingScore: 70,
    score: null as number | null,
  };
  events = [
    {
      id: 1,
      cycleId,
      evaluationTopic: "Operación",
      score: 80,
      maxScore: 100,
      weight: 1,
      hasPenalty: true,
      penaltyAmount: 10,
    },
    {
      id: 2,
      cycleId,
      evaluationTopic: "Operación",
      score: 90,
      maxScore: 100,
      weight: 1,
      hasPenalty: false,
      penaltyAmount: 50,
    },
    {
      id: 3,
      cycleId,
      evaluationTopic: "Operación",
      score: 5,
      maxScore: 100,
      weight: 1,
      hasPenalty: true,
      penaltyAmount: 20,
    },
  ];
  report: any;

  async getCycle(id: number) { return id === cycleId ? this.cycle : undefined; }
  async getTrainingReportByCycle() { return this.report; }
  async getEventsByCycle(id: number) { return id === cycleId ? this.events : []; }
  async createTrainingReport(input: any) {
    this.report = { ...input, id: 1 };
    return this.report;
  }
  async updateCycle(id: number, updates: any) {
    if (id !== cycleId) return undefined;
    Object.assign(this.cycle, updates);
    return this.cycle;
  }
}

let server: Server;
let baseUrl: string;
let token: string;
let repository: ReportTestStorage;

before(async () => {
  process.env.DATABASE_URL = "postgresql://test:test@127.0.0.1:1/test";
  process.env.JWT_SECRET = "report-route-test-secret";
  const { registerRoutes } = await import("./routes");
  const app = express();
  app.use(express.json());
  server = createServer(app);
  repository = new ReportTestStorage();
  await registerRoutes(server, app, repository as any);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind a TCP port");
  baseUrl = `http://127.0.0.1:${address.port}`;
  token = jwt.sign(
    { userId: adminId, role: "admin", companyId },
    process.env.JWT_SECRET,
  );
});

after(async () => {
  if (server?.listening) {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve()),
    );
  }
});

test("report generation applies event penalties, honors the zero floor, and summarizes actual deductions", async () => {
  const response = await fetch(`${baseUrl}/api/reports/generate/${cycleId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const report = await response.json();

  assert.equal(response.status, 201);
  // 80 - 10, 90 unchanged because hasPenalty is false, and max(0, 5 - 20).
  // The last event therefore contributes only 5 actually deducted points.
  assert.equal(report.totalScore, 53.33);
  assert.equal(repository.cycle.score, 160 / 3);
  assert.deepEqual(JSON.parse(report.radarData), [
    { subject: "Operación", score: 53, max: 100 },
  ]);
  assert.match(report.executiveSummary, /Penalizaciones aplicadas: 15 puntos\./);
});
