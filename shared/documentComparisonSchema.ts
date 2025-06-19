import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Document comparison schema for tracking document differences
export const documentComparisons = pgTable("document_comparisons", {
  id: serial("id").primaryKey(),
  sourceDocumentId: integer("source_document_id").notNull(),
  targetDocumentId: integer("target_document_id").notNull(),
  comparisonDate: timestamp("comparison_date").notNull().defaultNow(),
  status: text("status").notNull().default("pending"), // pending, in-progress, completed, failed
  differences: jsonb("differences"), // JSON structure containing the differences
  summary: text("summary"), // AI-generated summary of differences
  createdBy: integer("created_by"), // User who initiated comparison
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Document section comparisons for more granular difference tracking
export const sectionComparisons = pgTable("section_comparisons", {
  id: serial("id").primaryKey(),
  comparisonId: integer("comparison_id").notNull().references(() => documentComparisons.id, { onDelete: 'cascade' }),
  sourceSectionId: integer("source_section_id").notNull(),
  targetSectionId: integer("target_section_id").notNull(),
  differenceType: text("difference_type").notNull(), // added, removed, modified
  differenceDetails: jsonb("difference_details"), // Details of the differences
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Create insert schemas
export const insertDocumentComparisonSchema = createInsertSchema(documentComparisons, {
  id: z.number().optional(),
  comparisonDate: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const insertSectionComparisonSchema = createInsertSchema(sectionComparisons, {
  id: z.number().optional(),
  createdAt: z.date().optional(),
});

// Create types
export type DocumentComparison = typeof documentComparisons.$inferSelect;
export type InsertDocumentComparison = z.infer<typeof insertDocumentComparisonSchema>;

export type SectionComparison = typeof sectionComparisons.$inferSelect;
export type InsertSectionComparison = z.infer<typeof insertSectionComparisonSchema>;

// Define relationships
export const documentComparisonsRelations = relations(documentComparisons, ({ many }) => ({
  sectionComparisons: many(sectionComparisons),
}));

export const sectionComparisonsRelations = relations(sectionComparisons, ({ one }) => ({
  documentComparison: one(documentComparisons, {
    fields: [sectionComparisons.comparisonId],
    references: [documentComparisons.id],
  }),
}));