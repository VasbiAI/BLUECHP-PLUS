import { pgTable, text, serial, integer, boolean, jsonb, timestamp, primaryKey, customType } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Original schema to maintain compatibility with existing database

// Projects schema
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  projectName: text("project_name").notNull(),
  projectDescription: text("project_description"),
  clientName: text("client_name").notNull(),
  address: text("address"),
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
});