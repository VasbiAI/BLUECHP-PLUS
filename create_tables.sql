
-- This file contains SQL queries to:
-- 1. List all tables in the database
-- 2. Create tables from your SQL request

-- List all tables in the database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- The tables defined in your schema files are:

-- Core schema tables:
-- users, documents, sections, versionHistory, 
-- developmentTypes, financeModels, contractTypes, fundingSources, revenueStreams, 
-- documentCategories, projects, projectStatuses, projectRisks, timelineEvents, 
-- criticalDates, documentApprovals, documentComments, manuals, manualSections, 
-- contentTypes, states, manualContents, contentStates, entityCategories, entities, 
-- diagramTemplates, diagrams

-- Risk Track Pro schema tables:
-- risks, issues, criticalDates, externalAccessTokens, externalAccessPermissions,
-- documentUploads, criticalDateDocuments, criticalDateDependencies, taskRiskLinks

-- UniPhi Integration schema tables:
-- uniphiProjects, uniphiRisks

-- Now creating the tables from your SQL request:

-- Create the users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL
);

-- Create the projects table
CREATE TABLE IF NOT EXISTS "projects" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "register_name" TEXT NOT NULL,
  "financial_option" TEXT,
  "project_manager" TEXT NOT NULL,
  "register_date" TEXT NOT NULL,
  "organization" TEXT NOT NULL
);

-- Create the critical_dates table
CREATE TABLE IF NOT EXISTS "critical_dates" (
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
CREATE TABLE IF NOT EXISTS "risks" (
  "id" SERIAL PRIMARY KEY,
  "priorityRank" INTEGER NOT NULL,
  "riskId" TEXT NOT NULL,
  "issueId" TEXT,
  "openDate" TEXT NOT NULL,
  "raisedBy" TEXT NOT NULL,
  "ownedBy" TEXT NOT NULL,
  "riskCause" TEXT NOT NULL,
  "riskEvent" TEXT NOT NULL,
  "riskEffect" TEXT NOT NULL,
  "riskCategory" TEXT NOT NULL,
  "probability" REAL NOT NULL,
  "impact" INTEGER NOT NULL,
  "riskRating" INTEGER NOT NULL,
  "adjustedRiskRating" REAL,
  "riskStatus" TEXT NOT NULL,
  "responseType" TEXT NOT NULL,
  "mitigation" TEXT NOT NULL,
  "prevention" TEXT NOT NULL,
  "comment" TEXT,
  "registerType" TEXT DEFAULT 'default',
  "department" TEXT DEFAULT 'default',
  "actionBy" TEXT,
  "dueDate" TEXT,
  "contingency" TEXT,
  "responseOwner" TEXT,
  "statusChangeDate" TEXT,
  "criticalDateId" INTEGER,
  "includeCost" BOOLEAN DEFAULT false,
  "optimisticCost" REAL,
  "mostLikelyCost" REAL,
  "pessimisticCost" REAL,
  "expectedCost" REAL,
  "emv" REAL,
  "costAllocationModel" TEXT,
  "contractDetails" TEXT,
  "dayType" TEXT,
  "optimisticDuration" REAL,
  "mostLikelyDuration" REAL,
  "pessimisticDuration" REAL,
  "expectedDuration" REAL,
  "calculatedBusinessDays" REAL,
  "calculatedCalendarDays" REAL,
  "probabilityAdjustedDuration" REAL,
  "delayDuration" INTEGER,
  "delayClassification" TEXT,
  "criticalPathImpact" BOOLEAN,
  "floatConsumption" INTEGER,
  "initialRiskRating" INTEGER,
  "residualRiskRating" INTEGER,
  "projectId" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Add foreign key relationships
ALTER TABLE "critical_dates" 
  ADD CONSTRAINT fk_critical_dates_created_by 
  FOREIGN KEY ("created_by") REFERENCES "users"("id") 
  ON DELETE SET NULL;

ALTER TABLE "critical_dates" 
  ADD CONSTRAINT fk_critical_dates_last_modified_by 
  FOREIGN KEY ("last_modified_by") REFERENCES "users"("id") 
  ON DELETE SET NULL;

-- Note: This file lists all tables and creates the ones you requested.
-- The existing tables may have different schemas than what you provided.
