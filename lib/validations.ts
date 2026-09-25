import { z } from "zod";

export const channelEnum = z.enum([
  "SUPPORT_TICKET",
  "APP_STORE_REVIEW",
  "NPS_SURVEY",
  "CSAT_SURVEY",
  "SALES_CALL_NOTE",
  "SOCIAL_MENTION",
  "CSV_IMPORT",
  "MANUAL",
]);

export const sentimentEnum = z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]);
export const statusEnum = z.enum(["NEW", "REVIEWED", "ACTIONED"]);
export const roleEnum = z.enum(["ADMIN", "ANALYST", "VIEWER"]);

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  workspaceName: z.string().min(2, "Workspace name is required").max(100),
});

export const createFeedbackSchema = z.object({
  content: z.string().min(3, "Feedback content is required").max(5000),
  channel: channelEnum,
  customerLabel: z.string().max(200).optional(),
  sourceRef: z.string().max(200).optional(),
});

export const updateFeedbackStatusSchema = z.object({
  status: statusEnum,
});

export const feedbackListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  channel: channelEnum.optional(),
  sentiment: sentimentEnum.optional(),
  status: statusEnum.optional(),
  themeId: z.string().optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const askSchema = z.object({
  question: z.string().min(3, "Ask a real question").max(1000),
});

export const generateReportSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  periodStart: z.string(),
  periodEnd: z.string(),
});

export const updateMemberRoleSchema = z.object({
  role: roleEnum,
});

export const inviteMemberSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: roleEnum,
});

// Structured output contract for Gemini's classification call (AI1).
// The model is instructed to return exactly this shape as JSON.
export const classificationResultSchema = z.object({
  sentiment: sentimentEnum,
  sentimentScore: z.number().min(-1).max(1),
  themes: z.array(z.string().min(1)).min(1).max(3),
  featureArea: z.string().min(1).max(80),
  rationale: z.string().min(1).max(300),
});

export type ClassificationResult = z.infer<typeof classificationResultSchema>;
