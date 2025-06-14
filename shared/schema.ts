import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  unique,
  decimal
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { real } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table with standard email/password authentication and SSO support
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("free"),
  subscriptionTier: varchar("subscription_tier").default("free"), // 'free', 'pro', 'enterprise'
  subscriptionCurrentPeriodEnd: timestamp("subscription_current_period_end"),
  referralCode: varchar("referral_code").unique(),
  referredBy: varchar("referred_by"),
  referralCount: integer("referral_count").default(0),
  referralRewardClaimed: boolean("referral_reward_claimed").default(false),
  emailVerified: boolean("email_verified").default(false),
  resetToken: varchar("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  // SSO fields
  ssoId: varchar("sso_id"),
  ssoProvider: varchar("sso_provider"), // 'azure_ad', 'okta', 'google', etc.
  claims: jsonb("claims"), // Store SSO claims
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const repositories = pgTable("repositories", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  gitUrl: text("git_url").notNull(),
  defaultBranch: text("default_branch").default("main"),
  authToken: text("auth_token"),
  ownerEmail: text("owner_email").notNull(),
  slackWebhookUrl: text("slack_webhook_url"),
  status: varchar("status").default("active"),
  lastScannedAt: timestamp("last_scanned_at"),
  isDemo: boolean("is_demo").default(false),
  scanFrequency: varchar("scan_frequency").default("daily"), // 'hourly', 'daily', 'weekly', 'manual'
  autoScanEnabled: boolean("auto_scan_enabled").default(true),
  priorityScanning: boolean("priority_scanning").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dependencies = pgTable("dependencies", {
  id: serial("id").primaryKey(),
  repoId: integer("repo_id").notNull(),
  name: text("name").notNull(),
  currentVersion: text("current_version").notNull(),
  currentLicense: text("current_license"),
  lastScannedAt: timestamp("last_scanned_at"),
}, (table) => ({
  uniqueRepoDep: unique("unique_repo_dep").on(table.repoId, table.name),
}));

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  repositoryId: integer("repository_id").notNull(),
  repoId: integer("repo_id").notNull(),
  dependencyName: text("dependency_name").notNull(),
  packageName: text("package_name").notNull(),
  packageVersion: text("package_version"),
  cveId: text("cve_id"),
  alertType: varchar("alert_type").notNull(), // 'license' or 'vuln'
  oldValue: text("old_value"),
  newValue: text("new_value").notNull(),
  severity: varchar("severity").notNull(), // 'critical', 'high', 'medium', 'low'
  description: text("description"),
  isUsedInCode: boolean("is_used_in_code").default(false),
  usageCount: integer("usage_count").default(0),
  riskScore: integer("risk_score").default(0), // AI-calculated risk score 0-100
  status: varchar("status").default("new"), // 'new', 'reviewing', 'in_progress', 'resolved', 'closed'
  fixedVersion: text("fixed_version"),
  vulnerabilityType: text("vulnerability_type"),
  type: varchar("type"), // Additional type field for analytics compatibility
  resolvedAt: timestamp("resolved_at"), // Timestamp when alert was resolved
  createdAt: timestamp("created_at").defaultNow(),
});

// Scan Jobs table for tracking security and license scans
export const scanJobs = pgTable("scan_jobs", {
  id: serial("id").primaryKey(),
  repositoryId: integer("repository_id").notNull(),
  scanType: varchar("scan_type", { length: 50 }).notNull(), // "vulnerability", "license", "full"
  status: varchar("status", { length: 20 }).notNull(), // "queued", "running", "completed", "failed"
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  vulnerabilitiesFound: integer("vulnerabilities_found").default(0),
  licenseIssuesFound: integer("license_issues_found").default(0),
  errorMessage: text("error_message"),
  scanResults: jsonb("scan_results"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Security Alerts table for detailed vulnerability tracking
export const securityAlerts = pgTable("security_alerts", {
  id: serial("id").primaryKey(),
  repositoryId: integer("repository_id").notNull(),
  alertType: varchar("alert_type", { length: 50 }).notNull(), // "vulnerability", "license", "dependency"
  severity: varchar("severity", { length: 20 }).notNull(), // "critical", "high", "medium", "low"
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  packageName: varchar("package_name", { length: 255 }),
  packageVersion: varchar("package_version", { length: 50 }),
  cveId: varchar("cve_id", { length: 50 }),
  cvssScore: decimal("cvss_score", { precision: 3, scale: 1 }),
  fixVersion: varchar("fix_version", { length: 50 }),
  isResolved: boolean("is_resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dependencyUsage = pgTable("dependency_usage", {
  id: serial("id").primaryKey(),
  repoId: integer("repo_id").notNull(),
  dependencyName: text("dependency_name").notNull(),
  filePath: text("file_path").notNull(),
  lineNumber: integer("line_number").notNull(),
});

// Security policies for license compliance
export const securityPolicies = pgTable("security_policies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  allowedLicenses: jsonb("allowed_licenses").$type<string[]>(), // Array of allowed license types
  blockedLicenses: jsonb("blocked_licenses").$type<string[]>(), // Array of blocked license types
  maxSeverityLevel: varchar("max_severity_level").default("medium"), // critical, high, medium, low
  autoRemediation: boolean("auto_remediation").default(false),
  enforceCompliance: boolean("enforce_compliance").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vulnerability remediation suggestions
export const remediationSuggestions = pgTable("remediation_suggestions", {
  id: serial("id").primaryKey(),
  alertId: integer("alert_id").notNull(),
  repoId: integer("repo_id").notNull(),
  dependencyName: text("dependency_name").notNull(),
  vulnerabilityId: text("vulnerability_id").notNull(),
  currentVersion: text("current_version").notNull(),
  recommendedVersion: text("recommended_version"),
  fixType: varchar("fix_type").notNull(), // 'upgrade', 'patch', 'replace', 'remove'
  description: text("description").notNull(),
  remedationSteps: jsonb("remediation_steps").$type<string[]>(),
  confidence: integer("confidence").default(0), // 0-100 confidence score
  automationAvailable: boolean("automation_available").default(false),
  pullRequestUrl: text("pull_request_url"),
  status: varchar("status").default("pending"), // pending, applied, rejected, failed
  createdAt: timestamp("created_at").defaultNow(),
  appliedAt: timestamp("applied_at"),
});

// Security compliance reports
export const complianceReportsTable = pgTable("compliance_reports", {
  id: serial("id").primaryKey(),
  repoId: integer("repo_id").notNull(),
  policyId: integer("policy_id").notNull(),
  reportDate: timestamp("report_date").defaultNow(),
  complianceScore: integer("compliance_score").default(0), // 0-100
  totalDependencies: integer("total_dependencies").default(0),
  compliantDependencies: integer("compliant_dependencies").default(0),
  violatingDependencies: integer("violating_dependencies").default(0),
  criticalViolations: integer("critical_violations").default(0),
  highViolations: integer("high_violations").default(0),
  mediumViolations: integer("medium_violations").default(0),
  lowViolations: integer("low_violations").default(0),
  reportData: jsonb("report_data"), // Detailed compliance data
  status: varchar("status").default("completed"), // pending, completed, failed
});

// Automated security workflows
export const securityWorkflows = pgTable("security_workflows", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  repoId: integer("repo_id"),
  name: text("name").notNull(),
  description: text("description"),
  triggerType: varchar("trigger_type").notNull(), // 'vulnerability_detected', 'license_violation', 'scheduled'
  triggerConditions: jsonb("trigger_conditions"), // Conditions for workflow execution
  actions: jsonb("actions").$type<Array<{
    type: string;
    config: Record<string, any>;
  }>>(), // Array of workflow actions
  isActive: boolean("is_active").default(true),
  lastExecutedAt: timestamp("last_executed_at"),
  executionCount: integer("execution_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  repositories: many(repositories),
}));

export const repositoriesRelations = relations(repositories, ({ one, many }) => ({
  user: one(users, {
    fields: [repositories.userId],
    references: [users.id],
  }),
  dependencies: many(dependencies),
  alerts: many(alerts),
  dependencyUsage: many(dependencyUsage),
}));

export const dependenciesRelations = relations(dependencies, ({ one }) => ({
  repository: one(repositories, {
    fields: [dependencies.repoId],
    references: [repositories.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one, many }) => ({
  repository: one(repositories, {
    fields: [alerts.repoId],
    references: [repositories.id],
  }),
  autoFixExecutions: many(autoFixExecutions),
}));

export const dependencyUsageRelations = relations(dependencyUsage, ({ one }) => ({
  repository: one(repositories, {
    fields: [dependencyUsage.repoId],
    references: [repositories.id],
  }),
}));

export const securityPoliciesRelations = relations(securityPolicies, ({ one, many }) => ({
  user: one(users, {
    fields: [securityPolicies.userId],
    references: [users.id],
  }),
  complianceReports: many(complianceReportsTable),
}));

export const remediationSuggestionsRelations = relations(remediationSuggestions, ({ one }) => ({
  alert: one(alerts, {
    fields: [remediationSuggestions.alertId],
    references: [alerts.id],
  }),
  repository: one(repositories, {
    fields: [remediationSuggestions.repoId],
    references: [repositories.id],
  }),
}));

export const complianceReportsRelations = relations(complianceReportsTable, ({ one }) => ({
  repository: one(repositories, {
    fields: [complianceReportsTable.repoId],
    references: [repositories.id],
  }),
  policy: one(securityPolicies, {
    fields: [complianceReportsTable.policyId],
    references: [securityPolicies.id],
  }),
}));

export const securityWorkflowsRelations = relations(securityWorkflows, ({ one }) => ({
  user: one(users, {
    fields: [securityWorkflows.userId],
    references: [users.id],
  }),
  repository: one(repositories, {
    fields: [securityWorkflows.repoId],
    references: [repositories.id],
  }),
}));

// CI/CD Integration tables
export const cicdIntegrations = pgTable("cicd_integrations", {
  id: serial("id").primaryKey(),
  repositoryId: integer("repository_id").notNull().references(() => repositories.id, { onDelete: "cascade" }),
  platform: varchar("platform").notNull(), // 'github_actions', 'gitlab_ci', 'jenkins', 'azure_devops', etc.
  settings: jsonb("settings"), // Platform-specific configuration
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Issue Tracking Integration tables
export const issueIntegrations = pgTable("issue_integrations", {
  id: serial("id").primaryKey(),
  repositoryId: integer("repository_id").notNull().references(() => repositories.id, { onDelete: "cascade" }),
  platform: varchar("platform").notNull(), // 'jira', 'linear', 'github_issues', 'gitlab_issues'
  config: jsonb("config"), // API keys, project IDs, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enterprise integrations table
export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // 'siem', 'devops', 'identity'
  name: varchar("name").notNull(),
  config: jsonb("config").notNull(), // Integration-specific configuration
  isEnabled: boolean("is_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Auto-created tickets tracking
export const autoTickets = pgTable("auto_tickets", {
  id: serial("id").primaryKey(),
  alertId: integer("alert_id").notNull().references(() => alerts.id, { onDelete: "cascade" }),
  integrationId: integer("integration_id").notNull().references(() => issueIntegrations.id, { onDelete: "cascade" }),
  externalId: varchar("external_id").notNull(), // Ticket ID in external system
  externalUrl: varchar("external_url"), // Link to ticket
  status: varchar("status").default("open"), // 'open', 'in_progress', 'resolved', 'closed'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const integrationsRelations = relations(integrations, ({ one }) => ({
  user: one(users, {
    fields: [integrations.userId],
    references: [users.id],
  }),
}));

export const cicdIntegrationsRelations = relations(cicdIntegrations, ({ one }) => ({
  repository: one(repositories, {
    fields: [cicdIntegrations.repositoryId],
    references: [repositories.id],
  }),
}));

export const issueIntegrationsRelations = relations(issueIntegrations, ({ one, many }) => ({
  repository: one(repositories, {
    fields: [issueIntegrations.repositoryId],
    references: [repositories.id],
  }),
  autoTickets: many(autoTickets),
}));

export const autoTicketsRelations = relations(autoTickets, ({ one }) => ({
  alert: one(alerts, {
    fields: [autoTickets.alertId],
    references: [alerts.id],
  }),
  integration: one(issueIntegrations, {
    fields: [autoTickets.integrationId],
    references: [issueIntegrations.id],
  }),
}));

// AI Security Intelligence tables
export const vulnerabilityPatterns = pgTable("vulnerability_patterns", {
  id: serial("id").primaryKey(),
  pattern: varchar("pattern", { length: 255 }).notNull(),
  vulnerabilityType: varchar("vulnerability_type", { length: 100 }).notNull(),
  severity: varchar("severity", { length: 20 }).notNull(),
  frequency: integer("frequency").default(1),
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiRemediationSuggestions = pgTable("ai_remediation_suggestions", {
  id: serial("id").primaryKey(),
  alertId: integer("alert_id").references(() => alerts.id),
  vulnerabilityType: varchar("vulnerability_type", { length: 100 }).notNull(),
  suggestedFix: text("suggested_fix").notNull(),
  codeExample: text("code_example"),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).notNull(),
  automationLevel: varchar("automation_level", { length: 20 }).notNull(),
  isImplemented: boolean("is_implemented").default(false),
  implementedAt: timestamp("implemented_at"),
  feedbackScore: integer("feedback_score"), // User feedback on suggestion quality
  createdAt: timestamp("created_at").defaultNow(),
});

export const riskScores = pgTable("risk_scores", {
  id: serial("id").primaryKey(),
  alertId: integer("alert_id").references(() => alerts.id),
  exploitProbability: decimal("exploit_probability", { precision: 3, scale: 2 }).notNull(),
  businessImpact: decimal("business_impact", { precision: 3, scale: 2 }).notNull(),
  overallRiskScore: decimal("overall_risk_score", { precision: 3, scale: 2 }).notNull(),
  reasoning: text("reasoning"),
  calculatedAt: timestamp("calculated_at").defaultNow(),
});

export const falsePositivePatterns = pgTable("false_positive_patterns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  pattern: varchar("pattern", { length: 255 }).notNull(),
  alertType: varchar("alert_type", { length: 100 }).notNull(),
  dependencyName: varchar("dependency_name", { length: 255 }),
  dismissalCount: integer("dismissal_count").default(1),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).notNull(),
  lastDismissed: timestamp("last_dismissed").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// License Policy Management tables
export const licensePolicies = pgTable("license_policies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  allowedLicenses: text("allowed_licenses").array().default([]),
  blockedLicenses: text("blocked_licenses").array().default([]),
  requireApproval: text("require_approval").array().default([]),
  isActive: boolean("is_active").default(true),
  repositories: integer("repositories").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const licenseViolations = pgTable("license_violations", {
  id: serial("id").primaryKey(),
  policyId: integer("policy_id").references(() => licensePolicies.id),
  repositoryId: integer("repository_id").references(() => repositories.id),
  packageName: varchar("package_name", { length: 255 }).notNull(),
  packageVersion: varchar("package_version", { length: 100 }),
  license: varchar("license", { length: 100 }).notNull(),
  violationType: varchar("violation_type", { length: 50 }).notNull(), // 'blocked_license', 'requires_approval'
  severity: varchar("severity", { length: 20 }).notNull(),
  status: varchar("status", { length: 20 }).default("active"),
  detectedAt: timestamp("detected_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Insert schemas
export const insertRepositorySchema = createInsertSchema(repositories).omit({
  id: true,
  createdAt: true,
  lastScannedAt: true,
});

export const insertLicensePolicySchema = createInsertSchema(licensePolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type LicensePolicy = typeof licensePolicies.$inferSelect;
export type InsertLicensePolicy = typeof insertLicensePolicySchema._type;

export const insertDependencySchema = createInsertSchema(dependencies).omit({
  id: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
});

export const insertDependencyUsageSchema = createInsertSchema(dependencyUsage).omit({
  id: true,
});

export const insertSecurityPolicySchema = createInsertSchema(securityPolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRemediationSuggestionSchema = createInsertSchema(remediationSuggestions).omit({
  id: true,
  createdAt: true,
  appliedAt: true,
});

export const insertComplianceReportSchema = createInsertSchema(complianceReportsTable).omit({
  id: true,
  reportDate: true,
});

export const insertSecurityWorkflowSchema = createInsertSchema(securityWorkflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastExecutedAt: true,
  executionCount: true,
});

// User authentication schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  emailVerified: true,
  resetToken: true,
  resetTokenExpiry: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Repository = typeof repositories.$inferSelect;
export type InsertRepository = z.infer<typeof insertRepositorySchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;

export type Dependency = typeof dependencies.$inferSelect;
export type InsertDependency = z.infer<typeof insertDependencySchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type DependencyUsage = typeof dependencyUsage.$inferSelect;
export type InsertDependencyUsage = z.infer<typeof insertDependencyUsageSchema>;

// Advanced Security Types
export type SecurityPolicy = typeof securityPolicies.$inferSelect;
export type InsertSecurityPolicy = z.infer<typeof insertSecurityPolicySchema>;
export type RemediationSuggestion = typeof remediationSuggestions.$inferSelect;
export type InsertRemediationSuggestion = z.infer<typeof insertRemediationSuggestionSchema>;
export type ComplianceReport = typeof complianceReportsTable.$inferSelect;
export type InsertComplianceReport = z.infer<typeof insertComplianceReportSchema>;
export type SecurityWorkflow = typeof securityWorkflows.$inferSelect;
export type InsertSecurityWorkflow = z.infer<typeof insertSecurityWorkflowSchema>;

// Generated compliance reports table
export const generatedComplianceReports = pgTable("generated_compliance_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  framework: varchar("framework", { length: 50 }).notNull(),
  organizationName: varchar("organization_name", { length: 255 }).notNull(),
  reportPeriod: varchar("report_period", { length: 50 }).notNull(),
  score: integer("score").notNull(),
  status: varchar("status", { length: 20 }).default("completed"),
  generatedAt: timestamp("generated_at").defaultNow(),
});

// Signup table for landing page
export const signups = pgTable("signups", {
  id: serial("id").primaryKey(),
  email: varchar("email").notNull().unique(),
  githubUsername: varchar("github_username"),
  createdAt: timestamp("created_at").defaultNow(),
  source: varchar("source").default("landing_page"),
});

export const insertGeneratedComplianceReportSchema = createInsertSchema(generatedComplianceReports).omit({
  id: true,
  generatedAt: true,
});

export const insertSignupSchema = createInsertSchema(signups).omit({
  id: true,
  createdAt: true,
});

export type GeneratedComplianceReport = typeof generatedComplianceReports.$inferSelect;
export type InsertGeneratedComplianceReport = z.infer<typeof insertGeneratedComplianceReportSchema>;
export type Signup = typeof signups.$inferSelect;
export type InsertSignup = z.infer<typeof insertSignupSchema>;

// Feedback table for user bug reports and feature requests
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: varchar("type", { enum: ["bug", "feature", "general"] }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  userEmail: varchar("user_email").notNull(),
  repositoryContext: text("repository_context"), // JSON string of current repo info
  browserInfo: text("browser_info"), // User agent and other browser details
  status: varchar("status", { enum: ["new", "reviewing", "in_progress", "resolved", "closed"] }).default("new"),
  priority: varchar("priority", { enum: ["low", "medium", "high", "critical"] }).default("medium"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SBOM (Software Bill of Materials) records
export const sbomRecords = pgTable("sbom_records", {
  id: serial("id").primaryKey(),
  repositoryId: integer("repository_id").notNull().references(() => repositories.id),
  userId: integer("user_id").notNull().references(() => users.id),
  format: varchar("format", { length: 20 }).notNull().default("SPDX"),
  packageCount: integer("package_count").default(0),
  fileSize: integer("file_size").default(0),
  status: varchar("status", { enum: ["pending", "completed", "failed"] }).default("completed"),
  generatedAt: timestamp("generated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id],
  }),
}));

export const sbomRecordsRelations = relations(sbomRecords, ({ one }) => ({
  repository: one(repositories, {
    fields: [sbomRecords.repositoryId],
    references: [repositories.id],
  }),
  user: one(users, {
    fields: [sbomRecords.userId],
    references: [users.id],
  }),
}));

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSBOMRecordSchema = createInsertSchema(sbomRecords).omit({
  id: true,
  createdAt: true,
  generatedAt: true,
});

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type SBOMRecord = typeof sbomRecords.$inferSelect;
export type InsertSBOMRecord = z.infer<typeof insertSBOMRecordSchema>;

// Team collaboration tables
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").notNull(),
  settings: jsonb("settings"), // notification preferences, security policies
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull(),
  role: varchar("role").notNull().default("viewer"), // 'owner', 'admin', 'developer', 'security_admin', 'viewer'
  permissions: jsonb("permissions"), // specific permissions override
  invitedBy: varchar("invited_by"),
  invitedAt: timestamp("invited_at"),
  joinedAt: timestamp("joined_at").defaultNow(),
  status: varchar("status").default("active"), // 'active', 'pending', 'disabled'
});

export const teamRepositories = pgTable("team_repositories", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  repositoryId: integer("repository_id").notNull().references(() => repositories.id, { onDelete: "cascade" }),
  addedBy: varchar("added_by").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

export const alertAssignments = pgTable("alert_assignments", {
  id: serial("id").primaryKey(),
  alertId: integer("alert_id").notNull().references(() => alerts.id, { onDelete: "cascade" }),
  assignedTo: varchar("assigned_to").notNull(),
  assignedBy: varchar("assigned_by").notNull(),
  teamId: integer("team_id").references(() => teams.id),
  status: varchar("status").default("assigned"), // 'assigned', 'in_progress', 'resolved', 'escalated'
  priority: varchar("priority").default("medium"), // 'low', 'medium', 'high', 'critical'
  dueDate: timestamp("due_date"),
  notes: text("notes"),
  assignedAt: timestamp("assigned_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teamNotifications = pgTable("team_notifications", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // 'alert_created', 'alert_assigned', 'scan_completed', 'compliance_violation'
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // additional notification data
  severity: varchar("severity").default("info"), // 'info', 'warning', 'error', 'critical'
  recipients: jsonb("recipients"), // array of user IDs or roles
  channels: jsonb("channels"), // 'email', 'slack', 'in_app'
  readBy: jsonb("read_by"), // array of user IDs who read the notification
  createdAt: timestamp("created_at").defaultNow(),
});

// Team relations
export const teamRelations = relations(teams, ({ one, many }) => ({
  owner: one(users, {
    fields: [teams.ownerId],
    references: [users.id],
  }),
  members: many(teamMembers),
  repositories: many(teamRepositories),
  notifications: many(teamNotifications),
}));

export const teamMemberRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

export const teamRepositoryRelations = relations(teamRepositories, ({ one }) => ({
  team: one(teams, {
    fields: [teamRepositories.teamId],
    references: [teams.id],
  }),
  repository: one(repositories, {
    fields: [teamRepositories.repositoryId],
    references: [repositories.id],
  }),
}));

export const alertAssignmentRelations = relations(alertAssignments, ({ one }) => ({
  alert: one(alerts, {
    fields: [alertAssignments.alertId],
    references: [alerts.id],
  }),
  team: one(teams, {
    fields: [alertAssignments.teamId],
    references: [teams.id],
  }),
}));

export const teamNotificationRelations = relations(teamNotifications, ({ one }) => ({
  team: one(teams, {
    fields: [teamNotifications.teamId],
    references: [teams.id],
  }),
}));

// Team schema types
export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertAlertAssignmentSchema = createInsertSchema(alertAssignments).omit({
  id: true,
  assignedAt: true,
  updatedAt: true,
});

export const insertTeamNotificationSchema = createInsertSchema(teamNotifications).omit({
  id: true,
  createdAt: true,
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type AlertAssignment = typeof alertAssignments.$inferSelect;
export type InsertAlertAssignment = z.infer<typeof insertAlertAssignmentSchema>;
export type TeamNotification = typeof teamNotifications.$inferSelect;
export type InsertTeamNotification = z.infer<typeof insertTeamNotificationSchema>;
// Auto-Fix Rules table for production-ready auto-fix functionality
export const autoFixRules = pgTable("auto_fix_rules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  repositoryId: integer("repository_id").references(() => repositories.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  enabled: boolean("enabled").default(true),
  severity: jsonb("severity").$type<string[]>().default(['critical', 'high']),
  autoMerge: boolean("auto_merge").default(false),
  requiresReview: boolean("requires_review").default(true),
  maxDailyPRs: integer("max_daily_prs").default(5),
  testRequired: boolean("test_required").default(true),
  conditions: jsonb("conditions"), // Custom rule conditions
  allowedPackages: jsonb("allowed_packages").$type<string[]>(), // Specific packages to auto-fix
  excludedPackages: jsonb("excluded_packages").$type<string[]>(), // Packages to exclude
  isActive: boolean("is_active").default(true),
  lastTriggered: timestamp("last_triggered"),
  successRate: decimal("success_rate", { precision: 5, scale: 2 }).default('0.00'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Auto-Fix Execution History
export const autoFixExecutions = pgTable("auto_fix_executions", {
  id: serial("id").primaryKey(),
  ruleId: integer("rule_id").notNull().references(() => autoFixRules.id, { onDelete: "cascade" }),
  vulnerabilityId: integer("vulnerability_id").notNull().references(() => alerts.id),
  repositoryId: integer("repository_id").notNull().references(() => repositories.id),
  status: varchar("status", { length: 50 }).notNull(), // 'pending', 'in_progress', 'success', 'failed', 'cancelled'
  prNumber: integer("pr_number"),
  prUrl: varchar("pr_url"),
  branch: varchar("branch"),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  strategy: varchar("strategy", { length: 50 }), // 'patch-update', 'minor-update', 'major-update'
  estimatedTime: varchar("estimated_time"),
  breakingChanges: boolean("breaking_changes").default(false),
  testResults: jsonb("test_results"),
  errorMessage: text("error_message"),
  executionTime: integer("execution_time"), // in milliseconds
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Auto-Fix Rate Limiting
export const autoFixRateLimit = pgTable("auto_fix_rate_limit", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  repositoryId: integer("repository_id").references(() => repositories.id),
  apiProvider: varchar("api_provider", { length: 50 }).notNull(), // 'github', 'gitlab', etc.
  requestCount: integer("request_count").default(0),
  resetTime: timestamp("reset_time").notNull(),
  dailyLimit: integer("daily_limit").default(100),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const autoFixRulesRelations = relations(autoFixRules, ({ one, many }) => ({
  user: one(users, {
    fields: [autoFixRules.userId],
    references: [users.id],
  }),
  repository: one(repositories, {
    fields: [autoFixRules.repositoryId],
    references: [repositories.id],
  }),
  executions: many(autoFixExecutions),
}));

export const autoFixExecutionsRelations = relations(autoFixExecutions, ({ one }) => ({
  rule: one(autoFixRules, {
    fields: [autoFixExecutions.ruleId],
    references: [autoFixRules.id],
  }),
  vulnerability: one(alerts, {
    fields: [autoFixExecutions.vulnerabilityId],
    references: [alerts.id],
  }),
  repository: one(repositories, {
    fields: [autoFixExecutions.repositoryId],
    references: [repositories.id],
  }),
}));

export const autoFixRateLimitRelations = relations(autoFixRateLimit, ({ one }) => ({
  user: one(users, {
    fields: [autoFixRateLimit.userId],
    references: [users.id],
  }),
  repository: one(repositories, {
    fields: [autoFixRateLimit.repositoryId],
    references: [repositories.id],
  }),
}));

// Insert schemas
export const insertAutoFixRuleSchema = createInsertSchema(autoFixRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAutoFixExecutionSchema = createInsertSchema(autoFixExecutions).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

// Types
export type AutoFixRule = typeof autoFixRules.$inferSelect;
export type InsertAutoFixRule = z.infer<typeof insertAutoFixRuleSchema>;
export type AutoFixExecution = typeof autoFixExecutions.$inferSelect;
export type InsertAutoFixExecution = z.infer<typeof insertAutoFixExecutionSchema>;
export type AutoFixRateLimit = typeof autoFixRateLimit.$inferSelect;