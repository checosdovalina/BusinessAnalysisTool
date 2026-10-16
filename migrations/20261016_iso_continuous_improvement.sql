-- Controlled document revisions and continuous improvement records.
-- Existing training evidence is retained and receives a stable legacy code.
ALTER TABLE training_documents
  ALTER COLUMN activity_id DROP NOT NULL;

ALTER TABLE training_documents
  DROP CONSTRAINT IF EXISTS training_documents_activity_id_fkey;

ALTER TABLE training_documents
  ADD CONSTRAINT training_documents_activity_id_fkey
  FOREIGN KEY (activity_id) REFERENCES training_activities(id) ON DELETE SET NULL;

ALTER TABLE training_documents
  ADD COLUMN IF NOT EXISTS entity_type text NOT NULL DEFAULT 'activity',
  ADD COLUMN IF NOT EXISTS entity_id integer,
  ADD COLUMN IF NOT EXISTS document_code text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS effective_from date,
  ADD COLUMN IF NOT EXISTS responsible_id integer REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'current',
  ADD COLUMN IF NOT EXISTS supersedes_id integer;

UPDATE training_documents
SET entity_id = activity_id,
    document_code = 'LEGACY-ACT-' || activity_id::text || '-' || id::text
WHERE document_code = '';

ALTER TABLE training_documents ALTER COLUMN document_code DROP DEFAULT;

CREATE INDEX IF NOT EXISTS training_documents_entity_idx
  ON training_documents(company_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS training_documents_code_idx
  ON training_documents(company_id, document_code);
CREATE UNIQUE INDEX IF NOT EXISTS training_documents_company_code_revision_unique
  ON training_documents(company_id, document_code, revision);

CREATE TABLE IF NOT EXISTS improvement_actions (
  id serial PRIMARY KEY,
  company_id integer NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  cause text NOT NULL,
  responsible_id integer NOT NULL REFERENCES users(id),
  target_date date NOT NULL,
  status text NOT NULL DEFAULT 'planned',
  evidence text,
  effectiveness text NOT NULL DEFAULT 'pending',
  effectiveness_notes text,
  verified_by_id integer REFERENCES users(id),
  verified_at timestamp,
  created_by_id integer NOT NULL REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS improvement_actions_company_target_idx
  ON improvement_actions(company_id, target_date);
