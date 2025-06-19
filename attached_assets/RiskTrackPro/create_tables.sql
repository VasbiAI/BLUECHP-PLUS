
-- Create the users table
CREATE TABLE "users" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL
);

-- Create the projects table
CREATE TABLE "projects" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "register_name" TEXT NOT NULL,
  "financial_option" TEXT,
  "project_manager" TEXT NOT NULL,
  "register_date" TEXT NOT NULL,
  "organization" TEXT NOT NULL
);

-- Create the critical_dates table
CREATE TABLE "critical_dates" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "entity" TEXT,
  "department" TEXT,
  "state" TEXT,
  "contract_value" REAL,
  "critical_issue" TEXT,
  "critical_issue_description" TEXT,
  "reminder_type" TEXT,
  "project_name" TEXT,
  "project_address" TEXT,
  "agreement_type" TEXT,
  "agreement_date" TIMESTAMP,
  "agreement_reference" TEXT,
  "due_date" TIMESTAMP NOT NULL,
  "reminder_scheduling" TEXT,
  "occurrence_frequency" TEXT,
  "occurrence_start_date" TIMESTAMP,
  "occurrence_last_notification_date" TIMESTAMP,
  "reminder1_days" INTEGER,
  "reminder2_days" INTEGER,
  "reminder3_days" INTEGER,
  "reminder4_days" INTEGER,
  "post_trigger_date_reminder_days" INTEGER,
  "has_related_clause" BOOLEAN DEFAULT false,
  "related_clause_and_contract_details" TEXT,
  "related_clause_action" TEXT,
  "related_agreement_type" TEXT,
  "related_agreement_date" TIMESTAMP,
  "bluechp_responsible_person" TEXT,
  "bluechp_manager" TEXT,
  "external_responsible_party_email" TEXT,
  "emails" TEXT[],
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW(),
  "created_by" INTEGER,
  "last_modified_by" INTEGER
);

-- Create the risks table
CREATE TABLE "risks" (
  "id" SERIAL PRIMARY KEY,
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
  "include_cost" BOOLEAN DEFAULT false,
  "optimistic_cost" REAL,
  "most_likely_cost" REAL,
  "pessimistic_cost" REAL,
  "expected_cost" REAL,
  "emv" REAL,
  "cost_allocation_model" TEXT,
  "contract_details" TEXT,
  "day_type" TEXT,
  "optimistic_duration" REAL,
  "most_likely_duration" REAL,
  "pessimistic_duration" REAL,
  "expected_duration" REAL,
  "calculated_business_days" REAL,
  "calculated_calendar_days" REAL,
  "probability_adjusted_duration" REAL,
  "delay_duration" INTEGER,
  "delay_classification" TEXT,
  "critical_path_impact" BOOLEAN,
  "float_consumption" INTEGER,
  "initial_risk_rating" INTEGER,
  "residual_risk_rating" INTEGER,
  "project_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Create the issues table
CREATE TABLE "issues" (
  "id" SERIAL PRIMARY KEY,
  "priority_rank" INTEGER NOT NULL,
  "unique_id" TEXT NOT NULL,
  "risk_id" TEXT,
  "issue_date" TEXT NOT NULL,
  "raised_by" TEXT NOT NULL,
  "owned_by" TEXT NOT NULL,
  "issue_event" TEXT NOT NULL,
  "issue_effect" TEXT NOT NULL,
  "resolution" TEXT,
  "category" TEXT NOT NULL,
  "impact" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "assigned_to" TEXT NOT NULL,
  "closed_date" TEXT,
  "comments" TEXT,
  "critical_date_id" INTEGER,
  "due_date" TEXT,
  "include_cost" BOOLEAN DEFAULT false,
  "optimistic_cost" REAL,
  "most_likely_cost" REAL,
  "pessimistic_cost" REAL,
  "expected_cost" REAL,
  "emv" REAL,
  "cost_allocation_model" TEXT,
  "contract_details" TEXT,
  "day_type" TEXT,
  "optimistic_duration" REAL,
  "most_likely_duration" REAL,
  "pessimistic_duration" REAL,
  "expected_duration" REAL,
  "calculated_business_days" REAL,
  "calculated_calendar_days" REAL,
  "probability_adjusted_duration" REAL,
  "delay_duration" INTEGER,
  "delay_classification" TEXT,
  "critical_path_impact" BOOLEAN,
  "float_consumption" INTEGER,
  "project_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Create the project_tasks table
CREATE TABLE "project_tasks" (
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
  "excluded" BOOLEAN DEFAULT false
);

-- Create the task_risk_links table
CREATE TABLE "task_risk_links" (
  "id" SERIAL PRIMARY KEY,
  "task_id" INTEGER NOT NULL,
  "risk_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "created_by" TEXT,
  "ai_suggested" BOOLEAN DEFAULT false,
  "user_confirmed" BOOLEAN DEFAULT false,
  "last_validated" TIMESTAMP
);

-- Create the schedule_uploads table
CREATE TABLE "schedule_uploads" (
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
  "closed_risks_count" INTEGER
);

-- Create the external_access_tokens table
CREATE TABLE "external_access_tokens" (
  "id" SERIAL PRIMARY KEY,
  "token" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "organization" TEXT,
  "purpose" TEXT,
  "access_type" TEXT NOT NULL,
  "is_active" BOOLEAN DEFAULT true,
  "expires_at" TIMESTAMP NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "created_by" INTEGER,
  "last_used_at" TIMESTAMP,
  "ip_address" TEXT,
  "access_count" INTEGER DEFAULT 0
);

-- Create the external_access_permissions table
CREATE TABLE "external_access_permissions" (
  "id" SERIAL PRIMARY KEY,
  "token_id" INTEGER NOT NULL REFERENCES "external_access_tokens"("id") ON DELETE CASCADE,
  "critical_date_id" INTEGER REFERENCES "critical_dates"("id") ON DELETE CASCADE,
  "project_id" INTEGER REFERENCES "projects"("id"),
  "can_view" BOOLEAN DEFAULT true,
  "can_edit" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Create the document_uploads table
CREATE TABLE "document_uploads" (
  "id" SERIAL PRIMARY KEY,
  "filename" TEXT NOT NULL,
  "original_filename" TEXT NOT NULL,
  "file_path" TEXT NOT NULL,
  "file_size" INTEGER NOT NULL,
  "mime_type" TEXT NOT NULL,
  "uploaded_by" INTEGER,
  "uploaded_at" TIMESTAMP DEFAULT NOW(),
  "analysis_status" TEXT DEFAULT 'pending',
  "analysis_results" TEXT,
  "analysis_completed_at" TEXT
);

-- Create the critical_date_documents table
CREATE TABLE "critical_date_documents" (
  "id" SERIAL PRIMARY KEY,
  "critical_date_id" INTEGER NOT NULL REFERENCES "critical_dates"("id") ON DELETE CASCADE,
  "document_id" INTEGER NOT NULL REFERENCES "document_uploads"("id") ON DELETE CASCADE,
  "relationship_type" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Create the critical_date_dependencies table
CREATE TABLE "critical_date_dependencies" (
  "id" SERIAL PRIMARY KEY,
  "predecessor_id" INTEGER NOT NULL REFERENCES "critical_dates"("id") ON DELETE CASCADE,
  "successor_id" INTEGER NOT NULL REFERENCES "critical_dates"("id") ON DELETE CASCADE,
  "dependency_type" TEXT NOT NULL,
  "lag_days" INTEGER DEFAULT 0,
  "description" TEXT,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "created_by" INTEGER
);

-- Add foreign key references
ALTER TABLE "risks" ADD CONSTRAINT "risks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id");
ALTER TABLE "risks" ADD CONSTRAINT "risks_critical_date_id_fkey" FOREIGN KEY ("critical_date_id") REFERENCES "critical_dates" ("id");

ALTER TABLE "issues" ADD CONSTRAINT "issues_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id");
ALTER TABLE "issues" ADD CONSTRAINT "issues_critical_date_id_fkey" FOREIGN KEY ("critical_date_id") REFERENCES "critical_dates" ("id");

ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id");

ALTER TABLE "task_risk_links" ADD CONSTRAINT "task_risk_links_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "project_tasks" ("id");
ALTER TABLE "task_risk_links" ADD CONSTRAINT "task_risk_links_risk_id_fkey" FOREIGN KEY ("risk_id") REFERENCES "risks" ("id");

ALTER TABLE "schedule_uploads" ADD CONSTRAINT "schedule_uploads_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id");

-- Create indexes for performance
CREATE INDEX "risks_project_id_idx" ON "risks" ("project_id");
CREATE INDEX "issues_project_id_idx" ON "issues" ("project_id");
CREATE INDEX "project_tasks_project_id_idx" ON "project_tasks" ("project_id");
CREATE INDEX "task_risk_links_task_id_idx" ON "task_risk_links" ("task_id");
CREATE INDEX "task_risk_links_risk_id_idx" ON "task_risk_links" ("risk_id");
CREATE INDEX "critical_dates_due_date_idx" ON "critical_dates" ("due_date");
CREATE INDEX "external_access_permissions_token_id_idx" ON "external_access_permissions" ("token_id");
CREATE INDEX "critical_date_documents_critical_date_id_idx" ON "critical_date_documents" ("critical_date_id");
CREATE INDEX "critical_date_dependencies_predecessor_id_idx" ON "critical_date_dependencies" ("predecessor_id");
CREATE INDEX "critical_date_dependencies_successor_id_idx" ON "critical_date_dependencies" ("successor_id");
