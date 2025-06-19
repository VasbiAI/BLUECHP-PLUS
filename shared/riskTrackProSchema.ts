
import { pgTable, text, uuid, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Risk severity and status enums
export const RiskSeverityEnum = z.enum(['low', 'medium', 'high', 'critical']);
export type RiskSeverity = z.infer<typeof RiskSeverityEnum>;

export const RiskStatusEnum = z.enum(['active', 'mitigated', 'accepted', 'closed', 'converted']);
export type RiskStatus = z.infer<typeof RiskStatusEnum>;

// Issue status and priority enums
export const IssueStatusEnum = z.enum(['open', 'in-progress', 'resolved', 'closed']);
export type IssueStatus = z.infer<typeof IssueStatusEnum>;

export const IssuePriorityEnum = z.enum(['low', 'medium', 'high']);
export type IssuePriority = z.infer<typeof IssuePriorityEnum>;

// Critical date status and priority enums
export const CriticalDateStatusEnum = z.enum(['pending', 'complete', 'overdue']);
export type CriticalDateStatus = z.infer<typeof CriticalDateStatusEnum>;

export const CriticalDatePriorityEnum = z.enum(['low', 'medium', 'high']);
export type CriticalDatePriority = z.infer<typeof CriticalDatePriorityEnum>;

// Risk categories table
export const risk_categories = pgTable("risk_categories", {
  id: integer("id").primaryKey().notNull(),
  name: text("name").notNull().unique(),
  description: text("description"),
  color: text("color").default('#6B7280'),
  created_at: timestamp("created_at").notNull().defaultNow()
});

// Risk table schema
export const risks = pgTable("risk_track_pro_risks", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: text("projectId").notNull(),  // New style
  project_id: text("project_id"),          // Old style
  riskId: text("riskId"),
  title: text("title").notNull(),
  description: text("description"),
  riskCause: text("riskCause"),
  riskEvent: text("riskEvent"),
  riskEffect: text("riskEffect"),
  category: text("category"),
  probability: integer("probability").notNull(),
  likelihood: integer("likelihood"),
  impact: integer("impact").notNull(),
  riskRating: integer("riskRating").notNull(),
  status: text("status").$type<RiskStatus>().notNull().default("active"),
  owner: text("owner"),
  raisedBy: text("raisedBy"),
  responseOwner: text("responseOwner"),
  responseType: text("responseType"),
  responseTimeframe: text("responseTimeframe"),
  mitigationStrategy: text("mitigationStrategy"),
  prevention: text("prevention"),
  contingencyPlan: text("contingencyPlan"),
  pertEstimation: jsonb("pertEstimation"),
  costImpact: jsonb("costImpact"),
  scheduleImpact: jsonb("scheduleImpact"), 
  dateIdentified: timestamp("dateIdentified"),
  dateUpdated: timestamp("dateUpdated"),
  createdAt: timestamp("dateCreated").notNull().defaultNow(),
  updatedAt: timestamp("dateUpdated").notNull().defaultNow(),
});

// Issues table schema
export const issues = pgTable("issues", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: text("projectId").notNull(),  // New style
  project_id: text("project_id"),          // Old style
  issueId: text("issueId"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").$type<IssueStatus>().notNull().default("open"),
  priority: text("priority").$type<IssuePriority>().notNull().default("medium"),
  assignedTo: text("assignedTo"),
  raisedBy: text("raisedBy"),
  dateRaised: text("dateRaised"),
  dueDate: text("dueDate"),
  resolution: text("resolution"),
  createdAt: timestamp("dateCreated").notNull().defaultNow(),
  updatedAt: timestamp("dateUpdated").notNull().defaultNow(),
});

// Critical dates table schema
export const criticalDates = pgTable("critical_dates", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: text("projectId").notNull(),  // New style
  project_id: text("project_id"),          // Old style
  title: text("title").notNull(),
  description: text("description"),
  dueDate: text("dueDate").notNull(),
  priority: text("priority").$type<CriticalDatePriority>().notNull().default("medium"),
  status: text("status").$type<CriticalDateStatus>().notNull().default("pending"),
  contractReference: text("contractReference"),
  contractClause: text("contractClause"),
  contractNotes: text("contractNotes"),
  responsibleParty: text("responsibleParty"),
  reminderDate: text("reminderDate"),
  reminderEnabled: text("reminderEnabled").default("false"),
  reminderFrequency: text("reminderFrequency").default("once"),
  reminderEmail: text("reminderEmail"),
  createdAt: timestamp("dateCreated").notNull().defaultNow(),
  updatedAt: timestamp("dateUpdated").notNull().defaultNow(),
});

// Table for linking risks and issues
export const issueRisks = pgTable("issue_risks", {
  id: uuid("id").primaryKey().defaultRandom(),
  issueId: uuid("issueId").notNull(),
  riskId: uuid("riskId").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Zod schema for validation
export const RiskSchema = z.object({
  id: z.string().uuid().optional(),
  projectId: z.string(),
  riskId: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  riskCause: z.string().optional(),
  riskEvent: z.string().optional(),
  riskEffect: z.string().optional(),
  category: z.string().optional(),
  probability: z.number().int().min(1).max(5).optional(),
  likelihood: z.number().int().min(1).max(5).optional(),
  impact: z.number().int().min(1).max(5),
  riskRating: z.number().int().min(1),
  status: RiskStatusEnum,
  owner: z.string().optional(),
  raisedBy: z.string().optional(),
  responseOwner: z.string().optional(),
  responseType: z.string().optional(),
  responseTimeframe: z.string().optional(),
  mitigationStrategy: z.string().optional(),
  prevention: z.string().optional(),
  contingencyPlan: z.string().optional(),
  pertEstimation: z.object({
    optimistic: z.number(),
    mostLikely: z.number(),
    pessimistic: z.number(),
    pert: z.number().optional(),
  }).optional(),
  costImpact: z.object({
    minCost: z.number().optional(),
    maxCost: z.number().optional(),
    expectedCost: z.number().optional(),
    currency: z.string().optional(),
  }).optional(),
  scheduleImpact: z.object({
    minDelay: z.number().optional(),
    maxDelay: z.number().optional(),
    expectedDelay: z.number().optional(),
    unit: z.string().optional(),
  }).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const IssueSchema = z.object({
  id: z.string().uuid().optional(),
  projectId: z.string(),
  issueId: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  status: IssueStatusEnum,
  priority: IssuePriorityEnum,
  assignedTo: z.string().optional(),
  raisedBy: z.string().optional(),
  dateRaised: z.string().optional(),
  dueDate: z.string().optional(),
  resolution: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const CriticalDateSchema = z.object({
  id: z.string().uuid().optional(),
  projectId: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  priority: CriticalDatePriorityEnum,
  status: CriticalDateStatusEnum,
  contractReference: z.string().optional(),
  contractClause: z.string().optional(),
  contractNotes: z.string().optional(),
  responsibleParty: z.string().optional(),
  reminderDate: z.string().optional(),
  reminderEnabled: z.string().optional(),
  reminderFrequency: z.string().optional(),
  reminderEmail: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Risk = z.infer<typeof RiskSchema>;
export type Issue = z.infer<typeof IssueSchema>;
export type CriticalDate = z.infer<typeof CriticalDateSchema>;
export type RiskCategory = typeof risk_categories.$inferSelect;
