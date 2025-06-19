
-- Create the risk_track_pro_risks table
CREATE TABLE IF NOT EXISTS "risk_track_pro_risks" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" TEXT NOT NULL,
  "riskId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "riskCause" TEXT,
  "riskEvent" TEXT,
  "riskEffect" TEXT,
  "category" TEXT,
  "probability" INTEGER NOT NULL,
  "impact" INTEGER NOT NULL,
  "riskRating" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "owner" TEXT,
  "raisedBy" TEXT,
  "responseOwner" TEXT,
  "responseType" TEXT,
  "responseTimeframe" TEXT,
  "mitigationStrategy" TEXT,
  "prevention" TEXT,
  "contingencyPlan" TEXT,
  "dateCreated" TIMESTAMP NOT NULL DEFAULT NOW(),
  "dateUpdated" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create the issues table
CREATE TABLE IF NOT EXISTS "issues" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" TEXT NOT NULL,
  "issueId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "priority" TEXT NOT NULL DEFAULT 'medium',
  "assignedTo" TEXT,
  "raisedBy" TEXT,
  "dateRaised" TEXT,
  "dueDate" TEXT,
  "resolution" TEXT,
  "dateCreated" TIMESTAMP NOT NULL DEFAULT NOW(),
  "dateUpdated" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create the critical_dates table (if not already exists)
CREATE TABLE IF NOT EXISTS "critical_dates" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "dueDate" TEXT NOT NULL,
  "priority" TEXT NOT NULL DEFAULT 'medium',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "contractReference" TEXT,
  "contractClause" TEXT,
  "contractNotes" TEXT,
  "responsibleParty" TEXT,
  "dateCreated" TIMESTAMP NOT NULL DEFAULT NOW(),
  "dateUpdated" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create the risk_categories table
CREATE TABLE IF NOT EXISTS "risk_categories" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "color" TEXT DEFAULT '#6B7280',
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create the issue_risks table
CREATE TABLE IF NOT EXISTS "issue_risks" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "issueId" UUID NOT NULL,
  "riskId" UUID NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
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
  ('General', 'General risks that do not fit other categories', '#6B7280'),
  ('Construction', 'Risks related to construction activities', '#DC2626'),
  ('Site', 'Risks related to site conditions and location', '#0EA5E9'),
  ('Budget', 'Risks related to budget and cost management', '#F59E0B'),
  ('Design Construction and Commissioning', 'Risks related to design and commissioning', '#8B5CF6')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_risk_track_pro_risks_project_id ON risk_track_pro_risks(project_id);
CREATE INDEX IF NOT EXISTS idx_issues_project_id ON issues(project_id);
CREATE INDEX IF NOT EXISTS idx_critical_dates_project_id ON critical_dates(project_id);
