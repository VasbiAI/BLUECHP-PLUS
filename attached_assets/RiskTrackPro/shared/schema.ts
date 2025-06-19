import { pgTable, text, serial, integer, boolean, timestamp, real, foreignKey, index, json, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  registerName: text("register_name").notNull(),
  financialOption: text("financial_option"),
  projectManager: text("project_manager").notNull(),
  registerDate: text("register_date").notNull(),
  organization: text("organization").notNull(),
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  registerName: true,
  financialOption: true,
  projectManager: true,
  registerDate: true,
  organization: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export const risks = pgTable("risks", {
  id: serial("id").primaryKey(),
  priorityRank: integer("priority_rank").notNull(),
  riskId: text("risk_id").notNull(),
  issueId: text("issue_id"),
  openDate: text("open_date").notNull(),
  raisedBy: text("raised_by").notNull(),
  ownedBy: text("owned_by").notNull(),
  riskCause: text("risk_cause").notNull(),
  riskEvent: text("risk_event").notNull(),
  riskEffect: text("risk_effect").notNull(),
  riskCategory: text("risk_category").notNull(),
  probability: real("probability").notNull(),
  impact: integer("impact").notNull(),
  riskRating: integer("risk_rating").notNull(),
  adjustedRiskRating: real("adjusted_risk_rating"),
  riskStatus: text("risk_status").notNull(),
  responseType: text("response_type").notNull(),
  mitigation: text("mitigation").notNull(),
  prevention: text("prevention").notNull(),
  comment: text("comment"),
  // Fields for controlling field visibility
  registerType: text("register_type").default("default"),
  department: text("department").default("default"),
  // Additional fields
  actionBy: text("action_by"),
  dueDate: text("due_date"),
  contingency: text("contingency"),
  // New fields
  responseOwner: text("response_owner"), // For when different from raised by/owned by
  statusChangeDate: text("status_change_date"), // Date when status was last changed
  
  // Critical Date Link
  criticalDateId: integer("critical_date_id"),
  
  // Cost estimation fields (PERT method)
  includeCost: boolean("include_cost").default(false),
  optimisticCost: real("optimistic_cost"),
  mostLikelyCost: real("most_likely_cost"),
  pessimisticCost: real("pessimistic_cost"),
  expectedCost: real("expected_cost"),
  emv: real("emv"), // Expected Monetary Value
  
  // Contract allocation model
  costAllocationModel: text("cost_allocation_model"), // "internal", "fixedCap", "shared"
  contractDetails: text("contract_details"),
  
  // PERT schedule estimation
  dayType: text("day_type"), // 'calendar' or 'business'
  optimisticDuration: real("optimistic_duration"),
  mostLikelyDuration: real("most_likely_duration"),
  pessimisticDuration: real("pessimistic_duration"),
  expectedDuration: real("expected_duration"),
  calculatedBusinessDays: real("calculated_business_days"),
  calculatedCalendarDays: real("calculated_calendar_days"),
  probabilityAdjustedDuration: real("probability_adjusted_duration"),
  
  // Construction schedule impact (for Construction category)
  delayDuration: integer("delay_duration"), // in days
  delayClassification: text("delay_classification"), // "EOT without cost", "EOT with cost", "Suspension", "Termination"
  criticalPathImpact: boolean("critical_path_impact"),
  floatConsumption: integer("float_consumption"), // in days
  
  // Residual risk tracking
  initialRiskRating: integer("initial_risk_rating"),
  residualRiskRating: integer("residual_risk_rating"),
  
  projectId: integer("project_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRiskSchema = createInsertSchema(risks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRisk = z.infer<typeof insertRiskSchema>;
export type Risk = typeof risks.$inferSelect & {
  taskLinks?: TaskRiskLink[];
};

export const riskLevels = [
  { name: "Extreme", minRating: 64, maxRating: 100, color: "#DC3545" },
  { name: "High", minRating: 36, maxRating: 63, color: "#FD7E14" },
  { name: "Moderate", minRating: 16, maxRating: 35, color: "#FFC107" },
  { name: "Low", minRating: 0, maxRating: 15, color: "#28A745" },
];

export const criticalDates = pgTable("critical_dates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  status: text("status").notNull(),
  
  // Company/Entity Information - Based on Fields 1-3
  entity: text("entity"), // Dropdown: BlueCHP Limited, BlueCHPQ Limited, etc.
  department: text("department"), // Dropdown: Finance, Development, Board, Governance, Asset and Tenancy, Other
  state: text("state"), // Dropdown: NSW, QLD, VIC, SA, TAS, NT, WA
  
  // Contract Information - Based on Fields 4-7
  contractValue: real("contract_value"), // Value in AUD (changed from text to real for proper calculations)
  criticalIssue: text("critical_issue"), // Dropdown: Licence Renewal, Insurance Renewal, Other
  criticalIssueDescription: text("critical_issue_description"), // Required if "Other" selected in CriticalIssue
  
  // Project Information - Based on Fields 8-10
  reminderType: text("reminder_type"), // Project, Operations
  projectName: text("project_name"), // Only if Reminder Type is "Project"
  projectAddress: text("project_address"), // Only if Reminder Type is "Project"
  
  // Agreement Information - Based on Field 11
  agreementType: text("agreement_type"), // Dropdown: Land Contract, Construction Works Contract, etc.
  agreementDate: timestamp("agreement_date"),
  agreementReference: text("agreement_reference"),
  
  // Date Information - Based on Fields 12-15
  dueDate: timestamp("due_date").notNull(),
  reminderScheduling: text("reminder_scheduling"), // One Off Event, Ongoing / Series of Events
  occurrenceFrequency: text("occurrence_frequency"), // Daily, Weekly, Monthly, etc.
  occurrenceStartDate: timestamp("occurrence_start_date"),
  occurrenceLastNotificationDate: timestamp("occurrence_last_notification_date"),
  
  // Reminder Settings - Based on Fields 16-20
  reminder1Days: integer("reminder1_days"),
  reminder2Days: integer("reminder2_days"),
  reminder3Days: integer("reminder3_days"),
  reminder4Days: integer("reminder4_days"),
  postTriggerDateReminderDays: integer("post_trigger_date_reminder_days"),
  
  // Related Clause Information - Based on Fields 21-25
  hasRelatedClause: boolean("has_related_clause").default(false),
  relatedClauseAndContractDetails: text("related_clause_and_contract_details"),
  relatedClauseAction: text("related_clause_action"),
  relatedAgreementType: text("related_agreement_type"),
  relatedAgreementDate: timestamp("related_agreement_date"),
  
  // Responsible Parties - Based on Fields 26-28
  blueCHPResponsiblePerson: text("bluechp_responsible_person"),
  blueCHPManager: text("bluechp_manager"),
  externalResponsiblePartyEmail: text("external_responsible_party_email"),
  
  // Additional fields for system functionality
  emails: text("emails").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: integer("created_by"), // User ID who created this date
  lastModifiedBy: integer("last_modified_by"), // User ID who last modified this date
});

// Table for managing external access to critical dates
export const externalAccessTokens = pgTable("external_access_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(), // Unique secure token
  email: text("email").notNull(), // Email of the external user
  name: text("name"), // Name of the external user or organization
  organization: text("organization"), // Organization name
  purpose: text("purpose"), // Purpose of access
  accessType: text("access_type").notNull(), // "view", "edit", "submit"
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at").notNull(), // When the token expires
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by"), // Internal user who created this token
  lastUsedAt: timestamp("last_used_at"), // When the token was last used
  ipAddress: text("ip_address"), // IP address of the last access
  accessCount: integer("access_count").default(0), // How many times the token was used
});

// Table for tracking which critical dates an external token can access
export const externalAccessPermissions = pgTable("external_access_permissions", {
  id: serial("id").primaryKey(),
  tokenId: integer("token_id").notNull().references(() => externalAccessTokens.id, { onDelete: 'cascade' }),
  criticalDateId: integer("critical_date_id").references(() => criticalDates.id, { onDelete: 'cascade' }),
  projectId: integer("project_id").references(() => projects.id), // For project-level access
  canView: boolean("can_view").default(true),
  canEdit: boolean("can_edit").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Create index for external access permissions
export const externalAccessPermissionsRelations = relations(externalAccessPermissions, ({ one }) => ({
  token: one(externalAccessTokens, {
    fields: [externalAccessPermissions.tokenId],
    references: [externalAccessTokens.id],
  }),
  criticalDate: one(criticalDates, {
    fields: [externalAccessPermissions.criticalDateId],
    references: [criticalDates.id],
  }),
  project: one(projects, {
    fields: [externalAccessPermissions.projectId],
    references: [projects.id],
  }),
}));

// Table for tracking document uploads related to critical dates
export const documentUploads = pgTable("document_uploads", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalFilename: text("original_filename").notNull(),
  filePath: text("file_path").notNull(), // Where the file is stored
  fileSize: integer("file_size").notNull(), // Size in bytes
  mimeType: text("mime_type").notNull(),
  uploadedBy: integer("uploaded_by"), // User ID who uploaded this document
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  analysisStatus: text("analysis_status").default("pending"), // pending, in_progress, completed, failed
  analysisResults: text("analysis_results"), // JSON blob with AI analysis results (as text for now)
  analysisCompletedAt: text("analysis_completed_at"),
});

// Table linking documents to critical dates
export const criticalDateDocuments = pgTable("critical_date_documents", {
  id: serial("id").primaryKey(),
  criticalDateId: integer("critical_date_id").notNull().references(() => criticalDates.id, { onDelete: 'cascade' }),
  documentId: integer("document_id").notNull().references(() => documentUploads.id, { onDelete: 'cascade' }),
  relationshipType: text("relationship_type").notNull(), // source, supporting, reference
  createdAt: timestamp("created_at").defaultNow(),
});

// Create index for document relations
export const criticalDateDocumentsRelations = relations(criticalDateDocuments, ({ one }) => ({
  criticalDate: one(criticalDates, {
    fields: [criticalDateDocuments.criticalDateId],
    references: [criticalDates.id],
  }),
  document: one(documentUploads, {
    fields: [criticalDateDocuments.documentId],
    references: [documentUploads.id],
  }),
}));

// Table for tracking dependencies between critical dates
export const criticalDateDependencies = pgTable("critical_date_dependencies", {
  id: serial("id").primaryKey(),
  predecessorId: integer("predecessor_id").notNull().references(() => criticalDates.id, { onDelete: 'cascade' }),
  successorId: integer("successor_id").notNull().references(() => criticalDates.id, { onDelete: 'cascade' }),
  dependencyType: text("dependency_type").notNull(), // "finish_to_start", "start_to_start", "finish_to_finish", "start_to_finish"
  lagDays: integer("lag_days").default(0), // Number of days between predecessor and successor
  description: text("description"), // Description of this dependency
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by"),
});

// Updated Insert schemas
export const insertCriticalDateSchema = createInsertSchema(criticalDates, {
  id: z.number().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  createdBy: z.number().optional(),
  lastModifiedBy: z.number().optional(),
});

export const insertExternalAccessTokenSchema = createInsertSchema(externalAccessTokens, {
  id: z.number().optional(),
  createdAt: z.date().optional(),
  lastUsedAt: z.date().optional(),
  accessCount: z.number().optional(),
});

export const insertExternalAccessPermissionSchema = createInsertSchema(externalAccessPermissions, {
  id: z.number().optional(),
  createdAt: z.date().optional(),
});

export const insertDocumentUploadSchema = createInsertSchema(documentUploads, {
  id: z.number().optional(),
  uploadedAt: z.date().optional(),
  analysisStatus: z.string().optional(),
  analysisResults: z.string().optional(),
  analysisCompletedAt: z.date().optional(),
});

export const insertCriticalDateDocumentSchema = createInsertSchema(criticalDateDocuments, {
  id: z.number().optional(),
  createdAt: z.date().optional(),
});

export const insertCriticalDateDependencySchema = createInsertSchema(criticalDateDependencies, {
  id: z.number().optional(),
  createdAt: z.date().optional(),
});

// Types for all the schemas
export type InsertCriticalDate = z.infer<typeof insertCriticalDateSchema>;
export type CriticalDate = typeof criticalDates.$inferSelect;

export type InsertExternalAccessToken = z.infer<typeof insertExternalAccessTokenSchema>;
export type ExternalAccessToken = typeof externalAccessTokens.$inferSelect;

export type InsertExternalAccessPermission = z.infer<typeof insertExternalAccessPermissionSchema>;
export type ExternalAccessPermission = typeof externalAccessPermissions.$inferSelect;

export type InsertDocumentUpload = z.infer<typeof insertDocumentUploadSchema>;
export type DocumentUpload = typeof documentUploads.$inferSelect;

export type InsertCriticalDateDocument = z.infer<typeof insertCriticalDateDocumentSchema>;
export type CriticalDateDocument = typeof criticalDateDocuments.$inferSelect;

export type InsertCriticalDateDependency = z.infer<typeof insertCriticalDateDependencySchema>;
export type CriticalDateDependency = typeof criticalDateDependencies.$inferSelect;

export const issues = pgTable("issues", {
  id: serial("id").primaryKey(),
  priorityRank: integer("priority_rank").notNull(),
  uniqueId: text("unique_id").notNull(), // Unique ID for the issue
  riskId: text("risk_id"), // Can be null if not linked to a risk
  issueDate: text("issue_date").notNull(), // The date the issue was identified
  raisedBy: text("raised_by").notNull(),
  ownedBy: text("owned_by").notNull(), // The person responsible for the issue
  issueEvent: text("issue_event").notNull(), // What happened
  issueEffect: text("issue_effect").notNull(), // The impact of the issue
  resolution: text("resolution"), // Can be null if not resolved
  category: text("category").notNull(),
  impact: integer("impact").notNull(), // Impact rating
  status: text("status").notNull(),
  assignedTo: text("assigned_to").notNull(),
  closedDate: text("closed_date"),
  comments: text("comments"),
  
  // Critical Date Link
  criticalDateId: integer("critical_date_id"),
  dueDate: text("due_date"),
  
  // Cost estimation fields (PERT method)
  includeCost: boolean("include_cost").default(false),
  optimisticCost: real("optimistic_cost"),
  mostLikelyCost: real("most_likely_cost"),
  pessimisticCost: real("pessimistic_cost"),
  expectedCost: real("expected_cost"),
  emv: real("emv"), // Expected Monetary Value
  
  // Contract allocation model
  costAllocationModel: text("cost_allocation_model"), // "internal", "fixedCap", "shared"
  contractDetails: text("contract_details"),
  
  // PERT schedule estimation
  dayType: text("day_type"), // 'calendar' or 'business'
  optimisticDuration: real("optimistic_duration"),
  mostLikelyDuration: real("most_likely_duration"),
  pessimisticDuration: real("pessimistic_duration"),
  expectedDuration: real("expected_duration"),
  calculatedBusinessDays: real("calculated_business_days"),
  calculatedCalendarDays: real("calculated_calendar_days"),
  probabilityAdjustedDuration: real("probability_adjusted_duration"),
  
  // Construction schedule impact (for Construction category)
  delayDuration: integer("delay_duration"), // in days
  delayClassification: text("delay_classification"), // "EOT without cost", "EOT with cost", "Suspension", "Termination"
  criticalPathImpact: boolean("critical_path_impact"),
  floatConsumption: integer("float_consumption"), // in days
  
  projectId: integer("project_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const issuesRelations = relations(issues, ({ one }) => ({
  risk: one(risks, {
    fields: [issues.riskId],
    references: [risks.riskId],
  }),
  criticalDate: one(criticalDates, {
    fields: [issues.criticalDateId],
    references: [criticalDates.id],
    relationName: "issue_critical_date"
  }),
}));

export const risksRelations = relations(risks, ({ many, one }) => ({
  issues: many(issues),
  criticalDate: one(criticalDates, {
    fields: [risks.criticalDateId],
    references: [criticalDates.id],
    relationName: "risk_critical_date"
  }),
}));

export const insertIssueSchema = createInsertSchema(issues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertIssue = z.infer<typeof insertIssueSchema>;
export type Issue = typeof issues.$inferSelect;

// Project Tasks from MS Project
export const projectTasks = pgTable("project_tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  taskId: text("task_id").notNull(), // This is the ID/UniqueID from MS Project
  taskName: text("task_name").notNull(),
  percentComplete: real("percent_complete").notNull().default(0),
  startDate: text("start_date"),
  finishDate: text("finish_date"),
  duration: real("duration"),
  predecessors: text("predecessors"),
  successors: text("successors"), // Task IDs that depend on this task
  milestoneFlag: boolean("milestone_flag").default(false), // Is this a milestone?
  priority: integer("priority"), // Task priority (1-999)
  resources: text("resources"), // Assigned resources
  notes: text("notes"),
  // Date tracking
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  lastUpdatedAt: timestamp("last_updated_at").defaultNow(),
  // Who uploaded this task
  uploadedBy: text("uploaded_by"),
  // Excluded flag (for tasks that should be ignored)
  excluded: boolean("excluded").default(false),
});

export const projectTasksRelations = relations(projectTasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [projectTasks.projectId],
    references: [projects.id],
  }),
}));

// Task-Risk Links
export const taskRiskLinks = pgTable("task_risk_links", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  riskId: integer("risk_id").notNull(),
  // Link metadata
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: text("created_by"),
  aiSuggested: boolean("ai_suggested").default(false),
  userConfirmed: boolean("user_confirmed").default(false),
  // When was this link last checked against an uploaded schedule
  lastValidated: timestamp("last_validated"),
});

export const taskRiskLinksRelations = relations(taskRiskLinks, ({ one }) => ({
  task: one(projectTasks, {
    fields: [taskRiskLinks.taskId],
    references: [projectTasks.id],
  }),
  risk: one(risks, {
    fields: [taskRiskLinks.riskId],
    references: [risks.id],
  }),
}));

// Excel Schedule Uploads
export const scheduleUploads = pgTable("schedule_uploads", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  fileName: text("file_name").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  uploadedBy: text("uploaded_by"),
  fileType: text("file_type").default("excel"),
  status: text("status").default("processed"),
  taskCount: integer("task_count"),
  completedTaskCount: integer("completed_task_count"),
  linkedRisksCount: integer("linked_risks_count"),
  closedRisksCount: integer("closed_risks_count"),
});

export const scheduleUploadsRelations = relations(scheduleUploads, ({ one }) => ({
  project: one(projects, {
    fields: [scheduleUploads.projectId],
    references: [projects.id],
  }),
}));

// Add relations to the risks table
export const risksTasksRelations = relations(risks, ({ many }) => ({
  taskLinks: many(taskRiskLinks),
}));

export const insertProjectTaskSchema = createInsertSchema(projectTasks).omit({
  id: true,
  uploadedAt: true,
  lastUpdatedAt: true,
});

export const insertTaskRiskLinkSchema = createInsertSchema(taskRiskLinks).omit({
  id: true,
  createdAt: true,
  lastValidated: true,
});

export const insertScheduleUploadSchema = createInsertSchema(scheduleUploads).omit({
  id: true,
  uploadedAt: true,
});

export type InsertProjectTask = z.infer<typeof insertProjectTaskSchema>;
export type ProjectTask = typeof projectTasks.$inferSelect;

export type InsertTaskRiskLink = z.infer<typeof insertTaskRiskLinkSchema>;
export type TaskRiskLink = typeof taskRiskLinks.$inferSelect;

export type InsertScheduleUpload = z.infer<typeof insertScheduleUploadSchema>;
export type ScheduleUpload = typeof scheduleUploads.$inferSelect;
