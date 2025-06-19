import { pgTable, text, serial, integer, boolean, jsonb, timestamp, primaryKey, customType } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Risk status enumeration for better type safety
export const RiskStatusEnum = z.enum(['active', 'mitigated', 'accepted']);
export type RiskStatus = z.infer<typeof RiskStatusEnum>;

// Risk schema with validation
export const riskSchema = z.object({
  id: z.string(),
  description: z.string().min(3, "Description must be at least 3 characters"),
  likelihood: z.number().int().min(1).max(5),
  impact: z.number().int().min(1).max(5),
  riskRating: z.number().int().min(1).max(25),
  mitigationStrategies: z.array(z.string()),
  owner: z.string().optional(),
  comments: z.string().optional(),
  status: RiskStatusEnum,
  categoryId: z.string().optional() // The category this risk belongs to
});

// Risk category schema with validation
export const riskCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  risks: z.array(riskSchema)
});

// Risk template schema
export const riskTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Template name is required"),
  description: z.string(),
  categories: z.array(riskCategorySchema),
  createdAt: z.string()
});

// Export types for use throughout the application
export type Risk = z.infer<typeof riskSchema>;
export type RiskCategory = z.infer<typeof riskCategorySchema>;
export type RiskTemplate = z.infer<typeof riskTemplateSchema>;

// Risk register schema for API responses
export const riskRegisterSchema = z.object({
  documentId: z.number(),
  documentTitle: z.string(),
  projectId: z.number().optional(),
  projectName: z.string().optional(),
  categories: z.array(riskCategorySchema)
});

export type RiskRegister = z.infer<typeof riskRegisterSchema>;

// Authentication schema - Enhanced from the original basic user table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // Username for login
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isApproved: boolean("is_approved").default(false), // Approval flag for new accounts
  accessRights: text("access_rights").default("standard"), // Access rights level
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, updatedAt: true, isApproved: true })
  .extend({
    // Add validation for username
    username: z.string().min(3, "Username must be at least 3 characters"),
    // Add validation for email
    email: z.string().email("Please enter a valid email address"),
    // Add validation for password
    password: z.string().min(8, "Password must be at least 8 characters"),
  });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Document schema
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type"), // File type (PDF, Word, Excel, etc.)
  content: jsonb("content"), // For backwards compatibility
  status: text("status").default("draft"), // draft, under-review, approved, rejected
  projectId: integer("project_id"),
  manualId: integer("manual_id"),
  filename: text("filename"), // Original filename
  size: text("size"), // File size in formatted string (e.g., "1.2 MB")
  sizeBytes: integer("size_bytes"), // File size in bytes for sorting/filtering
  storagePath: text("storage_path"), // Path in the BLUECHP BUCKET
  storageUrl: text("storage_url"), // Full URL to the file in the bucket
  downloadUrl: text("download_url"), // URL to download the file
  category: text("category"), // Document category
  description: text("description"), // Document description
  version: text("version").default("1.0"), // Document version
  createdBy: text("created_by"), // Username who created the document
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Document section schema
export const sections = pgTable("sections", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  parentId: integer("parent_id"),
  title: text("title").notNull(),
  content: jsonb("content"), // Main content - not nullable but handled in code
  notes: jsonb("notes"), // Explanatory notes for the reader
  tenderContent: jsonb("tender_content"), // Tender-specific content
  order: integer("order").notNull(),
  level: integer("level").default(1),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const insertSectionSchema = createInsertSchema(sections).pick({
  documentId: true,
  parentId: true,
  title: true,
  content: true,
  notes: true,
  tenderContent: true,
  order: true,
  level: true,
});

// Section Version History schema
export const versionHistory = pgTable("version_history", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id").notNull(),
  content: jsonb("content").notNull(),
  createdAt: text("created_at").notNull(),
  version: integer("version").notNull(),
});

export const insertVersionHistorySchema = createInsertSchema(versionHistory).pick({
  sectionId: true,
  content: true,
  version: true,
});

// Lookup tables for dropdowns
export const developmentTypes = pgTable("development_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const financeModels = pgTable("finance_models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const contractTypes = pgTable("contract_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const fundingSources = pgTable("funding_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const revenueStreams = pgTable("revenue_streams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Document categories lookup table
export const documentCategories = pgTable("document_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  iconName: text("icon_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDocumentCategorySchema = createInsertSchema(documentCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type DocumentCategory = typeof documentCategories.$inferSelect;
export type InsertDocumentCategory = z.infer<typeof insertDocumentCategorySchema>;

// Projects schema - with enhanced address fields
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  projectName: text("project_name").notNull(),
  projectDescription: text("project_description"),
  clientName: text("client_name").notNull(),
  
  // Enhanced address fields
  address: text("address"), // Full formatted address
  street: text("street"), // Street address
  city: text("city"), // City/Suburb
  state: text("state"), // State/Territory
  postalCode: text("postal_code"), // Postal code
  country: text("country").default("Australia"), // Country (default to Australia)
  
  latitude: text("latitude"),
  longitude: text("longitude"),
  
  developmentType: text("development_type").notNull(),
  financeModel: text("finance_model").notNull(),
  contractType: text("contract_type").notNull(),
  estimatedValue: text("estimated_value").notNull(),
  estimatedCompletionDate: text("estimated_completion_date").notNull(),
  includeCommercialStructure: boolean("include_commercial_structure").default(true),
  includeFundingDiagram: boolean("include_funding_diagram").default(true),
  requiresRiskMitigation: boolean("requires_risk_mitigation").default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  
  // Additional columns
  fundingSource: text("funding_source"),
  revenueStream: text("revenue_stream"),
});

// Insert schemas for lookup tables
export const insertDevelopmentTypeSchema = createInsertSchema(developmentTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFinanceModelSchema = createInsertSchema(financeModels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContractTypeSchema = createInsertSchema(contractTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFundingSourceSchema = createInsertSchema(fundingSources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRevenueStreamSchema = createInsertSchema(revenueStreams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// No need for duplicate insertDocumentCategorySchema declaration here

// Project insert schema
export const insertProjectSchema = createInsertSchema(projects).pick({
  projectName: true,
  projectDescription: true,
  clientName: true,
  // Address fields
  address: true,
  street: true,
  city: true,
  state: true,
  postalCode: true,
  country: true,
  latitude: true,
  longitude: true,
  // Project details
  developmentType: true,
  financeModel: true,
  contractType: true,
  fundingSource: true,
  revenueStream: true,
  estimatedValue: true,
  estimatedCompletionDate: true,
  includeCommercialStructure: true,
  includeFundingDiagram: true,
  requiresRiskMitigation: true,
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema> & {
  createdAt: string;
  updatedAt: string;
};

export type RiskDocument = Document;

export type Section = typeof sections.$inferSelect;
export type InsertSection = z.infer<typeof insertSectionSchema> & {
  createdAt: string;
  updatedAt: string;
};

export type VersionHistory = typeof versionHistory.$inferSelect;
export type InsertVersionHistory = z.infer<typeof insertVersionHistorySchema> & {
  createdAt: string;
};

// Types for lookup tables
export type DevelopmentType = typeof developmentTypes.$inferSelect;
export type InsertDevelopmentType = z.infer<typeof insertDevelopmentTypeSchema>;

export type FinanceModel = typeof financeModels.$inferSelect;
export type InsertFinanceModel = z.infer<typeof insertFinanceModelSchema>;

export type ContractType = typeof contractTypes.$inferSelect;
export type InsertContractType = z.infer<typeof insertContractTypeSchema>;

export type FundingSource = typeof fundingSources.$inferSelect;
export type InsertFundingSource = z.infer<typeof insertFundingSourceSchema>;

export type RevenueStream = typeof revenueStreams.$inferSelect;
export type InsertRevenueStream = z.infer<typeof insertRevenueStreamSchema>;

// Document category types are now declared above

// We'll add relations later when we migrate to the new schema

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema> & {
  documentId: number;
  createdAt: string;
  updatedAt: string;
};

// Project Status schema
export const projectStatusEnum = z.enum(['active', 'planning', 'on-hold', 'completed']);
export type ProjectStatusType = z.infer<typeof projectStatusEnum>;

export const projectStatuses = pgTable("project_statuses", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  status: text("status").notNull().default("active"),
  progress: integer("progress").notNull().default(0),
  targetCompletion: text("target_completion"),
  stakeholders: text("stakeholders").array(),
  allocatedFunding: integer("allocated_funding").notNull().default(0),
  spentFunding: integer("spent_funding").notNull().default(0),
  currencyCode: text("currency_code").default("AUD"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProjectStatusSchema = createInsertSchema(projectStatuses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ProjectStatus = typeof projectStatuses.$inferSelect;
export type InsertProjectStatus = z.infer<typeof insertProjectStatusSchema>;

// Risk schema
export const riskSeverityEnum = z.enum(['low', 'medium', 'high']);
export type RiskSeverity = z.infer<typeof riskSeverityEnum>;

export const riskStatusEnum = z.enum(['active', 'mitigated', 'accepted']);
export type ProjectRiskStatus = z.infer<typeof riskStatusEnum>;

export const projectRisks = pgTable("project_risks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"),
  severity: text("severity").notNull().default("medium"),
  dueDate: text("due_date"),
  assignedTo: text("assigned_to"),
  mitigationSteps: text("mitigation_steps"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProjectRiskSchema = createInsertSchema(projectRisks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ProjectRisk = typeof projectRisks.$inferSelect;
export type InsertProjectRisk = z.infer<typeof insertProjectRiskSchema>;

// Timeline Events schema
export const timelineEventTypeEnum = z.enum(['milestone', 'document', 'risk', 'update']);
export type TimelineEventType = z.infer<typeof timelineEventTypeEnum>;

export const timelineEvents = pgTable("timeline_events", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  date: text("date").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull().default("update"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTimelineEventSchema = createInsertSchema(timelineEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TimelineEvent = typeof timelineEvents.$inferSelect;
export type InsertTimelineEvent = z.infer<typeof insertTimelineEventSchema>;

// Critical dates calendar schemas
export const criticalDatePriorityEnum = z.enum(['high', 'medium', 'low']);
export type CriticalDatePriority = z.infer<typeof criticalDatePriorityEnum>;

export const criticalDateStatusEnum = z.enum(['upcoming', 'overdue', 'completed']);
export type CriticalDateStatus = z.infer<typeof criticalDateStatusEnum>;

export const criticalDates = pgTable("critical_dates", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: text("due_date").notNull(),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("upcoming"),
  assignedTo: text("assigned_to"),
  category: text("category"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCriticalDateSchema = createInsertSchema(criticalDates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CriticalDate = typeof criticalDates.$inferSelect;
export type InsertCriticalDate = z.infer<typeof insertCriticalDateSchema>;

// Document approval status enum
export const approvalStatusEnum = z.enum(['draft', 'in-review', 'approved', 'rejected']);
export type ApprovalStatus = z.infer<typeof approvalStatusEnum>;

// Document approvals schema
export const documentApprovals = pgTable("document_approvals", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  revisionDate: text("revision_date").notNull(),
  status: text("status").notNull(),
  discipline: text("discipline").notNull(), // Comma-separated list of disciplines: Legal, Finance, Development
  disciplineSignOff: text("discipline_sign_off"), // Name of the person who signed off
  disciplineSignOffDate: text("discipline_sign_off_date"), // Date of discipline sign-off
  ceoSignOff: text("ceo_sign_off"), // Name of CEO who signed off
  ceoSignOffDate: text("ceo_sign_off_date"), // Date of CEO sign-off
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const insertDocumentApprovalSchema = createInsertSchema(documentApprovals).pick({
  documentId: true,
  revisionDate: true,
  status: true,
  discipline: true,
  disciplineSignOff: true,
  disciplineSignOffDate: true,
  ceoSignOff: true,
  ceoSignOffDate: true,
});

export type DocumentApproval = typeof documentApprovals.$inferSelect;
export type InsertDocumentApproval = z.infer<typeof insertDocumentApprovalSchema> & {
  createdAt: string;
  updatedAt: string;
};



// Document comments schema
export const documentComments = pgTable("document_comments", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  userId: integer("user_id"),
  username: text("username").notNull(),
  department: text("department"),
  comment: text("comment").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const insertDocumentCommentSchema = createInsertSchema(documentComments).pick({
  documentId: true,
  userId: true,
  username: true,
  department: true,
  comment: true,
});

export type DocumentComment = typeof documentComments.$inferSelect;
export type InsertDocumentComment = z.infer<typeof insertDocumentCommentSchema> & {
  createdAt: string;
  updatedAt: string;
};

// Manuals schema
export const manuals = pgTable("manuals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertManualSchema = createInsertSchema(manuals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Manual sections schema
export const manualSections = pgTable("manual_sections", {
  id: serial("id").primaryKey(),
  manualId: integer("manual_id").notNull(),
  parentId: integer("parent_id"),
  title: text("title").notNull(),
  orderId: integer("order_id").notNull(),
  level: integer("level").default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertManualSectionSchema = createInsertSchema(manualSections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Content types for manual contents
export const contentTypes = pgTable("content_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertContentTypeSchema = createInsertSchema(contentTypes).omit({
  id: true,
  createdAt: true,
});

// Australian states
export const states = pgTable("states", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertStateSchema = createInsertSchema(states).omit({
  id: true,
  createdAt: true,
});

// Manual section contents
export const manualContents = pgTable("manual_contents", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id").notNull(),
  contentTypeId: integer("content_type_id").notNull(),
  title: text("title").notNull(),
  sfdtData: text("sfdt_data").notNull(), // Syncfusion document format
  htmlData: text("html_data").notNull(), // Rendered HTML for display
  orderId: integer("order_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertManualContentSchema = createInsertSchema(manualContents).omit({
  id: true,
  createdAt: true, 
  updatedAt: true,
});

// Content state mapping (which states each content applies to)
export const contentStates = pgTable("content_states", {
  contentId: integer("content_id").notNull(),
  stateId: integer("state_id").notNull()
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.contentId, table.stateId] }),
  };
});

export const insertContentStateSchema = createInsertSchema(contentStates);

// Type definitions for manuals
export type Manual = typeof manuals.$inferSelect;
export type InsertManual = z.infer<typeof insertManualSchema> & {
  createdAt: string;
  updatedAt: string;
};

export type ManualSection = typeof manualSections.$inferSelect;
export type InsertManualSection = z.infer<typeof insertManualSectionSchema> & {
  createdAt: string;
  updatedAt: string;
};

export type ContentType = typeof contentTypes.$inferSelect;
export type InsertContentType = z.infer<typeof insertContentTypeSchema> & {
  createdAt: string;
};

export type State = typeof states.$inferSelect;
export type InsertState = z.infer<typeof insertStateSchema> & {
  createdAt: string;
};

export type ManualContent = typeof manualContents.$inferSelect;
export type InsertManualContent = z.infer<typeof insertManualContentSchema> & {
  createdAt: string;
  updatedAt: string;
};

export type ContentState = typeof contentStates.$inferSelect;
export type InsertContentState = z.infer<typeof insertContentStateSchema>;

// ============== Diagram Editor Schema ==============

// Entity categories for diagram nodes
export const entityCategories = pgTable("entity_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Entities table to store companies, people, etc.
export const entities = pgTable("entities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: integer("category_id").notNull(),
  description: text("description"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Diagram templates
export const diagramTemplates = pgTable("diagram_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  layout: text("layout").notNull().default("hierarchical"), // hierarchical, mindmap, radial, organizational
  nodes: jsonb("nodes").notNull().default("[]"), // JSON array of node objects with category, id, label, etc.
  edges: jsonb("edges").notNull().default("[]"), // JSON array of edge objects with source, target, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Instantiated diagrams
export const diagrams = pgTable("diagrams", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  projectId: integer("project_id"),
  documentId: integer("document_id"),
  nodeEntities: jsonb("node_entities").notNull(), // Maps template nodes to entity IDs or custom text
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Create insert schemas for new tables
export const insertEntityCategorySchema = createInsertSchema(entityCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEntitySchema = createInsertSchema(entities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDiagramTemplateSchema = createInsertSchema(diagramTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDiagramSchema = createInsertSchema(diagrams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Define types for new tables
export type EntityCategory = typeof entityCategories.$inferSelect;
export type InsertEntityCategory = z.infer<typeof insertEntityCategorySchema>;

export type Entity = typeof entities.$inferSelect;
export type InsertEntity = z.infer<typeof insertEntitySchema>;

export type DiagramTemplate = typeof diagramTemplates.$inferSelect;
export type InsertDiagramTemplate = z.infer<typeof insertDiagramTemplateSchema>;

export type Diagram = typeof diagrams.$inferSelect;
export type InsertDiagram = z.infer<typeof insertDiagramSchema>;
