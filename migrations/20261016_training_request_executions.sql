-- Records field, classroom, and workshop executions linked to DNC training requests.
-- Apply only to the intended application database after confirming its target.

CREATE TABLE IF NOT EXISTS training_request_executions (
  id serial PRIMARY KEY,
  request_id integer NOT NULL REFERENCES training_requests(id) ON DELETE CASCADE,
  execution_date date NOT NULL,
  method text NOT NULL,
  duration_hours real NOT NULL CHECK (duration_hours > 0),
  participant_count integer NOT NULL CHECK (participant_count > 0),
  feedback text,
  created_by_id integer NOT NULL REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS training_request_executions_request_date_idx
  ON training_request_executions(request_id, execution_date);
