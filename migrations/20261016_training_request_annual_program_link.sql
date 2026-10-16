-- Link training requests to an annual training program.
-- Additive only: existing requests remain unchanged with a NULL program.
ALTER TABLE training_requests
  ADD COLUMN IF NOT EXISTS annual_program_id integer
  REFERENCES annual_training_programs(id) ON DELETE SET NULL;
