-- Annual training cycle: planned activities, evidence register, and audit history.
-- Apply only to the intended application database after confirming its target.

CREATE TABLE IF NOT EXISTS training_activities (
  id serial PRIMARY KEY,
  company_id integer NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  annual_program_id integer NOT NULL REFERENCES annual_training_programs(id) ON DELETE CASCADE,
  student_id integer NOT NULL REFERENCES users(id),
  trainer_id integer REFERENCES users(id),
  request_id integer REFERENCES training_requests(id) ON DELETE SET NULL,
  dnc_assessment_id integer REFERENCES competency_assessments(id) ON DELETE SET NULL,
  reassessment_id integer REFERENCES competency_assessments(id) ON DELETE SET NULL,
  cycle_id integer REFERENCES cycles(id) ON DELETE SET NULL,
  simulator_session_id integer REFERENCES simulator_sessions(id) ON DELETE SET NULL,
  repeated_from_id integer REFERENCES training_activities(id) ON DELETE SET NULL,
  attempt_number integer NOT NULL DEFAULT 1,
  repetition_reason text,
  title text NOT NULL,
  objective text,
  training_type text NOT NULL DEFAULT 'course',
  status text NOT NULL DEFAULT 'planned',
  outcome text,
  attendance_status text,
  planned_start timestamp,
  planned_end timestamp,
  planned_hours real NOT NULL DEFAULT 0,
  completed_hours real NOT NULL DEFAULT 0,
  score real,
  feedback text,
  evidence text,
  reassessment_required boolean NOT NULL DEFAULT false,
  completed_at timestamp,
  created_by_id integer NOT NULL REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS training_activities_company_program_idx
  ON training_activities(company_id, annual_program_id);
CREATE INDEX IF NOT EXISTS training_activities_request_idx
  ON training_activities(request_id);
CREATE INDEX IF NOT EXISTS training_activities_dnc_idx
  ON training_activities(dnc_assessment_id);
CREATE INDEX IF NOT EXISTS training_activities_planned_start_idx
  ON training_activities(planned_start);

CREATE TABLE IF NOT EXISTS training_documents (
  id serial PRIMARY KEY,
  company_id integer NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  activity_id integer NOT NULL REFERENCES training_activities(id) ON DELETE CASCADE,
  title text NOT NULL,
  document_type text NOT NULL DEFAULT 'other',
  document_url text NOT NULL,
  revision text NOT NULL DEFAULT '1',
  document_date date,
  expires_at date,
  notes text,
  created_by_id integer NOT NULL REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS training_documents_activity_idx
  ON training_documents(activity_id);
CREATE INDEX IF NOT EXISTS training_documents_expiry_idx
  ON training_documents(expires_at);

CREATE TABLE IF NOT EXISTS training_activity_audit_events (
  id serial PRIMARY KEY,
  company_id integer NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  activity_id integer NOT NULL REFERENCES training_activities(id) ON DELETE CASCADE,
  actor_id integer NOT NULL REFERENCES users(id),
  action text NOT NULL,
  details text,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS training_activity_audit_company_created_idx
  ON training_activity_audit_events(company_id, created_at);
CREATE INDEX IF NOT EXISTS training_activity_audit_activity_idx
  ON training_activity_audit_events(activity_id);
