-- Schema fields and assignment table used by the DNC, requests, and simulator flows.
-- Additive only; no existing records are deleted or rewritten.

ALTER TABLE training_requests
  ADD COLUMN IF NOT EXISTS training_method text,
  ADD COLUMN IF NOT EXISTS simulator_scenario_id integer
    REFERENCES simulator_scenarios(id) ON DELETE SET NULL;

ALTER TABLE simulator_sessions
  ADD COLUMN IF NOT EXISTS training_request_id integer,
  ADD COLUMN IF NOT EXISTS repeat_of_session_id integer,
  ADD COLUMN IF NOT EXISTS feedback text;

CREATE TABLE IF NOT EXISTS employee_job_profiles (
  id serial PRIMARY KEY,
  company_id integer NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id integer NOT NULL REFERENCES job_profiles(id),
  assigned_by_id integer NOT NULL REFERENCES users(id),
  assigned_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT employee_job_profiles_employee_id_unique UNIQUE (employee_id)
);
