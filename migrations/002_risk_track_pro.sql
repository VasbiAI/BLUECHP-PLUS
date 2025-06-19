-- RiskTrackPro Database Migration

-- Create the risks table
CREATE TABLE IF NOT EXISTS "risks" (
  "id" SERIAL PRIMARY KEY,
  "project_id" INTEGER NOT NULL,
  "priority_rank" INTEGER NOT NULL,
  "risk_id" TEXT NOT NULL,
  "issue_id" TEXT,
  "open_date" TEXT NOT NULL,
  "raised_by" TEXT NOT NULL,
  "owned_by" TEXT NOT NULL,
  "risk_cause" TEXT NOT NULL,
  "risk_event" TEXT NOT NULL,
  "risk_effect" TEXT NOT NULL,
  "risk_category" TEXT NOT NULL,
  "probability" REAL NOT NULL,
  "impact" INTEGER NOT NULL,
  "risk_rating" INTEGER NOT NULL,
  "adjusted_risk_rating" REAL,
  "risk_status" TEXT NOT NULL,
  "response_type" TEXT NOT NULL,
  "mitigation" TEXT NOT NULL,
  "prevention" TEXT NOT NULL,
  "comment" TEXT,
  "register_type" TEXT DEFAULT 'default',
  "department" TEXT DEFAULT 'default',
  "action_by" TEXT,
  "due_date" TEXT,
  "contingency" TEXT,
  "response_owner" TEXT,
  "status_change_date" TEXT,
  "critical_date_id" INTEGER,
  "cost_optimistic" REAL,
  "cost_most_likely" REAL,
  "cost_pessimistic" REAL,
  "cost_estimated_mean" REAL,
  "cost_estimated_std_dev" REAL,
  "schedule_impact_optimistic" INTEGER,
  "schedule_impact_most_likely" INTEGER,
  "schedule_impact_pessimistic" INTEGER,
  "schedule_impact_mean" REAL,
  "schedule_impact_std_dev" REAL,
  "schedule_impact_unit" TEXT DEFAULT 'days',
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("critical_date_id") REFERENCES "critical_dates" ("id") ON DELETE SET NULL
);

-- Create the issues table
CREATE TABLE IF NOT EXISTS "issues" (
  "id" SERIAL PRIMARY KEY,
  "project_id" INTEGER NOT NULL,
  "issue_id" TEXT NOT NULL,
  "risk_id" TEXT,
  "open_date" TEXT NOT NULL,
  "raised_by" TEXT NOT NULL,
  "owned_by" TEXT NOT NULL,
  "issue_cause" TEXT NOT NULL,
  "issue_event" TEXT NOT NULL,
  "issue_effect" TEXT NOT NULL,
  "issue_category" TEXT NOT NULL,
  "impact" INTEGER NOT NULL,
  "issue_status" TEXT NOT NULL,
  "response_type" TEXT NOT NULL,
  "resolution" TEXT NOT NULL,
  "close_date" TEXT,
  "comment" TEXT,
  "critical_date_id" INTEGER,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("critical_date_id") REFERENCES "critical_dates" ("id") ON DELETE SET NULL
);

-- Create the document_uploads table
CREATE TABLE IF NOT EXISTS "document_uploads" (
  "id" SERIAL PRIMARY KEY,
  "project_id" INTEGER NOT NULL,
  "file_name" TEXT NOT NULL,
  "original_name" TEXT NOT NULL,
  "file_type" TEXT NOT NULL,
  "file_size" INTEGER NOT NULL,
  "uploaded_by" TEXT,
  "uploaded_at" TIMESTAMP DEFAULT NOW(),
  "category" TEXT DEFAULT 'general',
  "description" TEXT,
  "risk_id" INTEGER,
  "issue_id" INTEGER,
  "critical_date_id" INTEGER,
  FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("risk_id") REFERENCES "risks" ("id") ON DELETE SET NULL,
  FOREIGN KEY ("issue_id") REFERENCES "issues" ("id") ON DELETE SET NULL,
  FOREIGN KEY ("critical_date_id") REFERENCES "critical_dates" ("id") ON DELETE SET NULL
);

-- Create the critical_date_documents table
CREATE TABLE IF NOT EXISTS "critical_date_documents" (
  "id" SERIAL PRIMARY KEY,
  "critical_date_id" INTEGER NOT NULL,
  "document_id" INTEGER NOT NULL,
  "added_at" TIMESTAMP DEFAULT NOW(),
  "added_by" TEXT,
  FOREIGN KEY ("critical_date_id") REFERENCES "critical_dates" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("document_id") REFERENCES "document_uploads" ("id") ON DELETE CASCADE
);

-- Create the critical_date_dependencies table
CREATE TABLE IF NOT EXISTS "critical_date_dependencies" (
  "id" SERIAL PRIMARY KEY,
  "source_date_id" INTEGER NOT NULL,
  "target_date_id" INTEGER NOT NULL,
  "dependency_type" TEXT DEFAULT 'finish-to-start',
  "lag" INTEGER DEFAULT 0,
  "description" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("source_date_id") REFERENCES "critical_dates" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("target_date_id") REFERENCES "critical_dates" ("id") ON DELETE CASCADE
);

-- Create the project_tasks table
CREATE TABLE IF NOT EXISTS "project_tasks" (
  "id" SERIAL PRIMARY KEY,
  "project_id" INTEGER NOT NULL,
  "task_id" TEXT NOT NULL,
  "task_name" TEXT NOT NULL,
  "percent_complete" REAL NOT NULL DEFAULT 0,
  "start_date" TEXT,
  "finish_date" TEXT,
  "duration" REAL,
  "predecessors" TEXT,
  "successors" TEXT,
  "milestone_flag" BOOLEAN DEFAULT false,
  "priority" INTEGER,
  "resources" TEXT,
  "notes" TEXT,
  "uploaded_at" TIMESTAMP DEFAULT NOW(),
  "last_updated_at" TIMESTAMP DEFAULT NOW(),
  "uploaded_by" TEXT,
  "excluded" BOOLEAN DEFAULT false,
  FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE
);

-- Create the task_risk_links table
CREATE TABLE IF NOT EXISTS "task_risk_links" (
  "id" SERIAL PRIMARY KEY,
  "task_id" INTEGER NOT NULL,
  "risk_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "created_by" TEXT,
  "ai_suggested" BOOLEAN DEFAULT false,
  "user_confirmed" BOOLEAN DEFAULT false,
  "last_validated" TIMESTAMP,
  FOREIGN KEY ("task_id") REFERENCES "project_tasks" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("risk_id") REFERENCES "risks" ("id") ON DELETE CASCADE
);

-- Create the schedule_uploads table
CREATE TABLE IF NOT EXISTS "schedule_uploads" (
  "id" SERIAL PRIMARY KEY,
  "project_id" INTEGER NOT NULL,
  "file_name" TEXT NOT NULL,
  "uploaded_at" TIMESTAMP DEFAULT NOW(),
  "uploaded_by" TEXT,
  "file_type" TEXT DEFAULT 'excel',
  "status" TEXT DEFAULT 'processed',
  "task_count" INTEGER,
  "completed_task_count" INTEGER,
  "linked_risks_count" INTEGER,
  "closed_risks_count" INTEGER,
  FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE
);

-- Create the external_access_tokens table
CREATE TABLE IF NOT EXISTS "external_access_tokens" (
  "id" SERIAL PRIMARY KEY,
  "project_id" INTEGER NOT NULL,
  "token" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "description" TEXT,
  "expiry_date" TIMESTAMP,
  "created_by" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "last_accessed" TIMESTAMP,
  "access_count" INTEGER DEFAULT 0,
  "active" BOOLEAN DEFAULT true,
  FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE
);

-- Create the external_access_permissions table
CREATE TABLE IF NOT EXISTS "external_access_permissions" (
  "id" SERIAL PRIMARY KEY,
  "token_id" INTEGER NOT NULL,
  "resource_type" TEXT NOT NULL,
  "permission_level" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("token_id") REFERENCES "external_access_tokens" ("id") ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_risks_project_id" ON "risks" ("project_id");
CREATE INDEX IF NOT EXISTS "idx_issues_project_id" ON "issues" ("project_id");
CREATE INDEX IF NOT EXISTS "idx_documents_project_id" ON "document_uploads" ("project_id");
CREATE INDEX IF NOT EXISTS "idx_tasks_project_id" ON "project_tasks" ("project_id");
CREATE INDEX IF NOT EXISTS "idx_task_risk_links_task_id" ON "task_risk_links" ("task_id");
CREATE INDEX IF NOT EXISTS "idx_task_risk_links_risk_id" ON "task_risk_links" ("risk_id");
CREATE INDEX IF NOT EXISTS "idx_external_tokens_project_id" ON "external_access_tokens" ("project_id");

-- Create RiskTrackPro tables

-- Risk categories table
CREATE TABLE IF NOT EXISTS risk_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create enum types (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'risk_severity') THEN
        CREATE TYPE risk_severity AS ENUM ('low', 'medium', 'high', 'critical');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'risk_status') THEN
        CREATE TYPE risk_status AS ENUM ('active', 'mitigated', 'accepted', 'closed');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_status') THEN
        CREATE TYPE issue_status AS ENUM ('open', 'in-progress', 'resolved', 'closed');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'issue_priority') THEN
        CREATE TYPE issue_priority AS ENUM ('low', 'medium', 'high');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'critical_date_status') THEN
        CREATE TYPE critical_date_status AS ENUM ('pending', 'complete', 'overdue');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'critical_date_priority') THEN
        CREATE TYPE critical_date_priority AS ENUM ('low', 'medium', 'high');
    END IF;
END
$$;

-- Risks table
CREATE TABLE IF NOT EXISTS risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  likelihood INTEGER NOT NULL,
  impact INTEGER NOT NULL,
  risk_rating INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  owner TEXT,
  mitigation_strategy TEXT,
  contingency_plan TEXT,
  pert_estimation JSONB,
  cost_impact JSONB,
  schedule_impact JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create the issues table
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  assigned_to TEXT,
  due_date TEXT,
  resolution TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create the critical dates table
CREATE TABLE IF NOT EXISTS critical_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  contract_reference TEXT,
  contract_clause TEXT,
  contract_notes TEXT,
  responsible_party TEXT,
  reminder_date TEXT,
  reminder_enabled TEXT DEFAULT 'false',
  reminder_frequency TEXT DEFAULT 'once',
  reminder_email TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create issue-risk linking table
CREATE TABLE IF NOT EXISTS issue_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL,
  risk_id UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert default risk categories
INSERT INTO risk_categories (name, description, color)
VALUES 
  ('Financial', 'Risks related to financial aspects of the project', '#EF4444'),
  ('Schedule', 'Risks related to project timeline and schedule', '#F59E0B'),
  ('Technical', 'Risks related to technical aspects and implementation', '#3B82F6'),
  ('Resource', 'Risks related to human resources and staffing', '#10B981'),
  ('Quality', 'Risks related to quality standards and requirements', '#8B5CF6'),
  ('Contract', 'Risks related to contractual agreements', '#EC4899'),
  ('Environmental', 'Risks related to environmental factors', '#34D399'),
  ('Regulatory', 'Risks related to regulations and compliance', '#A78BFA'),
  ('Operational', 'Risks related to day-to-day operations', '#F97316'),
  ('Safety', 'Risks related to safety and health concerns', '#EF4444'),
  ('Market', 'Risks related to market conditions and competition', '#6366F1'),
  ('Stakeholder', 'Risks related to stakeholder management', '#8B5CF6'),
  ('Communication', 'Risks related to communication issues', '#14B8A6'),
  ('General', 'General risks that do not fit other categories', '#6B7280')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_risks_project_id ON risks(project_id);
CREATE INDEX IF NOT EXISTS idx_critical_dates_project_id ON critical_dates(project_id);

-- Create indexes for faster queries by project (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'risks_project_id_idx') THEN
        CREATE INDEX risks_project_id_idx ON risks(project_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'issues_project_id_idx') THEN
        CREATE INDEX issues_project_id_idx ON issues(project_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'critical_dates_project_id_idx') THEN
        CREATE INDEX critical_dates_project_id_idx ON critical_dates(project_id);
    END IF;
END
$$;