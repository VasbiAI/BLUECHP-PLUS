import { pgTable, text, serial, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// UniPhi Integration Schema
export const uniphiProjects = pgTable('uniphi_projects', {
  id: serial('id').primaryKey(),
  uniphiId: text('uniphi_id').notNull().unique(), // Project ID from UniPhi
  projectName: text('project_name').notNull(),
  projectCode: text('project_code'),
  clientName: text('client_name'),
  status: text('status'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  lastSyncedAt: timestamp('last_synced_at').notNull(),
  rawData: jsonb('raw_data'), // Store the complete raw data from UniPhi API
});

export const uniphiRisks = pgTable('uniphi_risks', {
  id: serial('id').primaryKey(),
  uniphiId: text('uniphi_id').notNull().unique(), // Risk ID from UniPhi
  projectId: integer('project_id').references(() => uniphiProjects.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  likelihood: integer('likelihood'),
  impact: integer('impact'),
  riskRating: integer('risk_rating'),
  status: text('status'),
  category: text('category'),
  owner: text('owner'),
  mitigationStrategy: text('mitigation_strategy'),
  lastSyncedAt: timestamp('last_synced_at').notNull(),
  rawData: jsonb('raw_data'), // Store the complete raw data from UniPhi API
});

export const uniphiFinancialYears = pgTable('uniphi_financial_years', {
  id: serial('id').primaryKey(),
  label: text('label').notNull(), // e.g., "FY 2022-2023"
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  isCurrentYear: boolean('is_current_year').default(false),
  lastSyncedAt: timestamp('last_synced_at').notNull(),
});

export const uniphiFinancialPeriods = pgTable('uniphi_financial_periods', {
  id: serial('id').primaryKey(),
  financialYearId: integer('financial_year_id').references(() => uniphiFinancialYears.id, { onDelete: 'cascade' }),
  periodName: text('period_name').notNull(), // e.g., "July 2022"
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  isCurrentPeriod: boolean('is_current_period').default(false),
  lastSyncedAt: timestamp('last_synced_at').notNull(),
});

export const uniphiCashflows = pgTable('uniphi_cashflows', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => uniphiProjects.id, { onDelete: 'cascade' }),
  periodId: integer('period_id').references(() => uniphiFinancialPeriods.id, { onDelete: 'cascade' }),
  category: text('category'), // e.g., 'Land', 'Construction', etc.
  amount: text('amount'), // Money value
  type: text('type'), // 'inflow' or 'outflow'
  actualAmount: text('actual_amount'),
  forecastAmount: text('forecast_amount'),
  notes: text('notes'),
  lastSyncedAt: timestamp('last_synced_at').notNull(),
  rawData: jsonb('raw_data'), // Store the complete raw data from UniPhi API
});

export const uniphiOrganisations = pgTable('uniphi_organisations', {
  id: serial('id').primaryKey(),
  uniphiId: text('uniphi_id').notNull().unique(), // Organisation ID from UniPhi
  name: text('name').notNull(),
  tradingName: text('trading_name'),
  abn: text('abn'),
  acn: text('acn'),
  type: text('type'), // Client, Contractor, Supplier, etc.
  contactPerson: text('contact_person'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  lastSyncedAt: timestamp('last_synced_at').notNull(),
  rawData: jsonb('raw_data'), // Store the complete raw data from UniPhi API
});

// Create insert schemas
export const insertUniphiProjectSchema = createInsertSchema(uniphiProjects).omit({ id: true });
export const insertUniphiRiskSchema = createInsertSchema(uniphiRisks).omit({ id: true });
export const insertUniphiFinancialYearSchema = createInsertSchema(uniphiFinancialYears).omit({ id: true });
export const insertUniphiFinancialPeriodSchema = createInsertSchema(uniphiFinancialPeriods).omit({ id: true });
export const insertUniphiCashflowSchema = createInsertSchema(uniphiCashflows).omit({ id: true });
export const insertUniphiOrganisationSchema = createInsertSchema(uniphiOrganisations).omit({ id: true });

// Create types
export type UniphiProject = typeof uniphiProjects.$inferSelect;
export type InsertUniphiProject = z.infer<typeof insertUniphiProjectSchema>;

export type UniphiRisk = typeof uniphiRisks.$inferSelect;
export type InsertUniphiRisk = z.infer<typeof insertUniphiRiskSchema>;

export type UniphiFinancialYear = typeof uniphiFinancialYears.$inferSelect;
export type InsertUniphiFinancialYear = z.infer<typeof insertUniphiFinancialYearSchema>;

export type UniphiFinancialPeriod = typeof uniphiFinancialPeriods.$inferSelect;
export type InsertUniphiFinancialPeriod = z.infer<typeof insertUniphiFinancialPeriodSchema>;

export type UniphiCashflow = typeof uniphiCashflows.$inferSelect;
export type InsertUniphiCashflow = z.infer<typeof insertUniphiCashflowSchema>;

export type UniphiOrganisation = typeof uniphiOrganisations.$inferSelect;
export type InsertUniphiOrganisation = z.infer<typeof insertUniphiOrganisationSchema>;

// Define relationships
export const uniphiProjectsRelations = relations(uniphiProjects, ({ many }) => ({
  risks: many(uniphiRisks),
  cashflows: many(uniphiCashflows),
}));

export const uniphiFinancialYearsRelations = relations(uniphiFinancialYears, ({ many }) => ({
  periods: many(uniphiFinancialPeriods),
}));

export const uniphiFinancialPeriodsRelations = relations(uniphiFinancialPeriods, ({ one, many }) => ({
  financialYear: one(uniphiFinancialYears, {
    fields: [uniphiFinancialPeriods.financialYearId],
    references: [uniphiFinancialYears.id],
  }),
  cashflows: many(uniphiCashflows),
}));