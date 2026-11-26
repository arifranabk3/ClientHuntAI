import { z } from 'zod';

export const ApiEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().min(1000).max(65535))
      .default('4000'),
    MONGODB_URI: z
      .string()
      .min(1, 'MONGODB_URI is required')
      .default('mongodb://127.0.0.1:27017/clienthunt_ai'),
    CORS_ORIGIN: z.string().optional(),
    SESSION_SECRET: z.string().min(16).default('clienthunt_dev_session_secret_min_16_chars'),
    SESSION_MAX_AGE_SECONDS: z
      .string()
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().min(60))
      .default('86400'),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (!data.CORS_ORIGIN || data.CORS_ORIGIN.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CORS_ORIGIN'],
          message: 'CORS_ORIGIN is required in production environment',
        });
        return;
      }
      const origins = data.CORS_ORIGIN.split(',').map((o) => o.trim());
      for (const origin of origins) {
        if (
          origin.includes('localhost') ||
          origin.includes('127.0.0.1') ||
          origin === '*'
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['CORS_ORIGIN'],
            message: `Invalid production CORS_ORIGIN: "${origin}". Localhost and wildcard origins are rejected in production.`,
          });
        }
      }
    }
  })
  .transform((data) => ({
    ...data,
    CORS_ORIGIN: data.CORS_ORIGIN || (data.NODE_ENV === 'production' ? '' : 'http://localhost:3000'),
  }));

export const WorkerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  WORKER_PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1000).max(65535))
    .default('5000'),
  MONGODB_URI: z
    .string()
    .min(1, 'MONGODB_URI is required')
    .default('mongodb://127.0.0.1:27017/clienthunt_ai'),
});

export const WebEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:4000'),
});

export const RegisterInputSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password cannot exceed 128 characters'),
  firstName: z.string().trim().min(1, 'First name is required').max(60),
  lastName: z.string().trim().min(1, 'Last name is required').max(60),
  workspaceName: z
    .string()
    .trim()
    .min(2, 'Workspace name must be at least 2 characters')
    .max(80)
    .optional(),
});

export const LoginInputSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const CreateWorkspaceInputSchema = z.object({
  name: z.string().trim().min(2, 'Workspace name must be at least 2 characters').max(80),
});

export const AddMemberInputSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  role: z.enum(['workspace_admin', 'member']),
});

export const SwitchWorkspaceInputSchema = z.object({
  workspaceId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid workspace ID format'),
});

// -------------------------------------------------------------
// PHASE 04 — DISCOVERY INPUT SCHEMAS
// -------------------------------------------------------------
export const DiscoverySearchInputSchema = z.object({
  country: z.enum(['us', 'gb', 'ca', 'au'] as const, {
    errorMap: () => ({
      message: 'Country must be one of: USA (us), United Kingdom (gb), Canada (ca), Australia (au)',
    }),
  }),
  state: z.string().trim().max(100).optional(),
  city: z.string().trim().min(1, 'City is required').max(100),
  industry: z.enum([
    'Construction',
    'Cleaning Services',
    'Real Estate',
    'Consulting',
    'Accounting',
    'IT Services',
  ] as const),
  keywords: z.string().trim().max(150).optional(),
  websiteFilter: z.enum(['all', 'with_website', 'without_website']).default('all'),
  sourceProvider: z
    .enum(['osm_nominatim', 'public_directory', 'csv_import'])
    .default('osm_nominatim'),
});

export const DiscoveryImportCsvSchema = z.object({
  records: z
    .array(
      z.object({
        name: z.string().min(1, 'Business name is required'),
        websiteUrl: z.string().optional(),
        industry: z.string().optional(),
        category: z.string().optional(),
        address: z.string().optional(),
        city: z.string().min(1, 'City is required'),
        region: z.string().optional(),
        country: z.string().optional(),
        countryCode: z.enum(['us', 'gb', 'ca', 'au']).default('us'),
        publicPhone: z.string().optional(),
        publicEmail: z.string().optional(),
      })
    )
    .min(1, 'At least one record is required for CSV import')
    .max(500, 'Maximum 500 records per import batch'),
});

// -------------------------------------------------------------
// PHASE 05 — WEBSITE ANALYZER SCHEMAS
// -------------------------------------------------------------
export const AnalyzeWebsiteInputSchema = z.object({
  businessId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid business ID format')
    .optional(),
  url: z.string().trim().min(3, 'URL or domain is required'),
});

export const ListAnalysisQuerySchema = z.object({
  page: z
    .string()
    .transform((v) => Math.max(1, parseInt(v, 10) || 1))
    .default('1'),
  limit: z
    .string()
    .transform((v) => Math.max(1, Math.min(100, parseInt(v, 10) || 15)))
    .default('15'),
  status: z.enum(['all', 'pending', 'processing', 'completed', 'failed']).default('all'),
  minScore: z
    .string()
    .transform((v) => parseInt(v, 10))
    .optional(),
  maxScore: z
    .string()
    .transform((v) => parseInt(v, 10))
    .optional(),
});

// -------------------------------------------------------------
// PHASE 06 — LEAD INTELLIGENCE SCHEMAS
// -------------------------------------------------------------
export const ScoreBusinessInputSchema = z.object({
  businessId: z.string().trim().min(1, 'Business ID is required'),
});

export const BulkScoreInputSchema = z.object({
  businessIds: z
    .array(z.string().trim().min(1))
    .min(1, 'At least one business ID is required')
    .max(100),
});

export const ListIntelligenceQuerySchema = z.object({
  page: z
    .string()
    .transform((v) => Math.max(1, parseInt(v, 10) || 1))
    .default('1'),
  limit: z
    .string()
    .transform((v) => Math.max(1, Math.min(100, parseInt(v, 10) || 15)))
    .default('15'),
  search: z.string().optional(),
  country: z.string().optional(),
  industry: z.string().optional(),
  qualificationStatus: z
    .enum(['all', 'QUALIFIED', 'REVIEW_NEEDED', 'DISQUALIFIED'])
    .default('all'),
  priority: z
    .enum(['all', 'High Priority', 'Medium Priority', 'Low Priority', 'Not Qualified'])
    .default('all'),
  sortBy: z.enum(['score', 'date', 'name', 'opportunity', 'fit']).default('score'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  minScore: z
    .string()
    .transform((v) => parseInt(v, 10))
    .optional(),
  maxScore: z
    .string()
    .transform((v) => parseInt(v, 10))
    .optional(),
});

export type ApiEnv = z.infer<typeof ApiEnvSchema>;
export type WorkerEnv = z.infer<typeof WorkerEnvSchema>;
export type WebEnv = z.infer<typeof WebEnvSchema>;
export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceInputSchema>;
export type AddMemberInput = z.infer<typeof AddMemberInputSchema>;
export type SwitchWorkspaceInput = z.infer<typeof SwitchWorkspaceInputSchema>;
export type DiscoverySearchInput = z.infer<typeof DiscoverySearchInputSchema>;
export type DiscoveryImportCsvInput = z.infer<typeof DiscoveryImportCsvSchema>;

// -------------------------------------------------------------
// PHASE 07 — OUTREACH & CAMPAIGN MANAGEMENT SCHEMAS
// -------------------------------------------------------------
export const CreateCampaignInputSchema = z.object({
  name: z.string().trim().min(2, 'Campaign name must be at least 2 characters').max(100),
  description: z.string().trim().max(500).optional(),
  targetCountries: z
    .array(z.enum(['us', 'gb', 'ca', 'au']))
    .min(1, 'Select at least one country')
    .default(['us', 'gb', 'ca', 'au']),
  targetIndustries: z
    .array(
      z.enum([
        'Construction',
        'Cleaning Services',
        'Real Estate',
        'Consulting',
        'Accounting',
        'IT Services',
      ])
    )
    .min(1, 'Select at least one industry')
    .default([
      'Construction',
      'Cleaning Services',
      'Real Estate',
      'Consulting',
      'Accounting',
      'IT Services',
    ]),
  minPriority: z
    .enum(['High Priority', 'Medium Priority', 'Low Priority', 'Not Qualified'])
    .default('Medium Priority'),
  targetService: z.string().trim().default('Corporate Website Development & Redesign'),
});

export const AddCampaignLeadsInputSchema = z.object({
  businessIds: z.array(z.string().trim().min(1)).min(1, 'Select at least one business ID').max(500),
});

export const GenerateDraftsInputSchema = z.object({
  campaignId: z.string().trim().min(1, 'Campaign ID is required'),
  businessIds: z.array(z.string().trim().min(1)).optional(),
  pitchType: z
    .enum([
      'first_contact',
      'follow_up',
      'follow_up_1',
      'follow_up_2',
      'website_redesign',
      'new_website_build',
      'performance_improvement',
      'seo_technical_improvement',
    ])
    .default('first_contact'),
  overwriteExisting: z.boolean().default(false),
});

export const UpdateDraftInputSchema = z.object({
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters').max(200).optional(),
  body: z.string().trim().min(10, 'Body must be at least 10 characters').max(5000).optional(),
  recipientEmail: z.string().trim().email('Valid email address required').optional(),
  recipientPhone: z.string().trim().optional(),
  scheduledFollowUpDate: z.string().datetime().optional().nullable(),
  changeSummary: z.string().trim().max(300).optional(),
});

export const RejectDraftInputSchema = z.object({
  reason: z.string().trim().min(2, 'Rejection reason is required').max(300),
});

export const MarkSentInputSchema = z.object({
  notes: z.string().trim().max(500).optional(),
  followUpDate: z.string().datetime().optional(),
});

export const MarkRepliedInputSchema = z.object({
  notes: z.string().trim().max(500).optional(),
});

export const UnsubscribeInputSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
  reason: z
    .enum(['unsubscribe_request', 'manual_suppression', 'bounce', 'complaint', 'compliance_policy'])
    .default('unsubscribe_request'),
  notes: z.string().trim().max(500).optional(),
  scope: z.enum(['workspace', 'global']).default('workspace'),
});

export const ListCampaignsQuerySchema = z.object({
  page: z
    .string()
    .transform((v) => Math.max(1, parseInt(v, 10) || 1))
    .default('1'),
  limit: z
    .string()
    .transform((v) => Math.max(1, Math.min(100, parseInt(v, 10) || 15)))
    .default('15'),
  status: z.enum(['all', 'draft', 'active', 'paused', 'completed', 'archived']).default('all'),
});

export const ListDraftsQuerySchema = z.object({
  page: z
    .string()
    .transform((v) => Math.max(1, parseInt(v, 10) || 1))
    .default('1'),
  limit: z
    .string()
    .transform((v) => Math.max(1, Math.min(100, parseInt(v, 10) || 20)))
    .default('20'),
  campaignId: z.string().optional(),
  status: z
    .enum([
      'all',
      'pending_review',
      'approved',
      'rejected',
      'sent',
      'replied',
      'bounced',
      'suppressed',
    ])
    .default('all'),
  country: z.string().optional(),
  industry: z.string().optional(),
});

export const ListSuppressionQuerySchema = z.object({
  page: z
    .string()
    .transform((v) => Math.max(1, parseInt(v, 10) || 1))
    .default('1'),
  limit: z
    .string()
    .transform((v) => Math.max(1, Math.min(100, parseInt(v, 10) || 20)))
    .default('20'),
  scope: z.enum(['all', 'workspace', 'global']).default('all'),
  search: z.string().optional(),
});

export const CreateSenderProfileInputSchema = z.object({
  senderName: z.string().trim().min(2, 'Sender name must be at least 2 characters').max(100),
  senderEmail: z.string().trim().email('Invalid sender email address'),
  senderTitle: z.string().trim().max(100).optional(),
  companyName: z.string().trim().min(2, 'Company name must be at least 2 characters').max(100),
  physicalAddress: z
    .string()
    .trim()
    .min(10, 'A valid physical postal address is required for regulatory compliance (CAN-SPAM/CASL) and must be at least 10 characters')
    .max(300),
  isDefault: z.boolean().default(false),
});

export const UpdateSenderProfileInputSchema = CreateSenderProfileInputSchema.partial();

export type CreateCampaignInput = z.infer<typeof CreateCampaignInputSchema>;
export type AddCampaignLeadsInput = z.infer<typeof AddCampaignLeadsInputSchema>;
export type GenerateDraftsInput = z.infer<typeof GenerateDraftsInputSchema>;
export type UpdateDraftInput = z.infer<typeof UpdateDraftInputSchema>;
export type RejectDraftInput = z.infer<typeof RejectDraftInputSchema>;
export type MarkSentInput = z.infer<typeof MarkSentInputSchema>;
export type MarkRepliedInput = z.infer<typeof MarkRepliedInputSchema>;
export type UnsubscribeInput = z.infer<typeof UnsubscribeInputSchema>;
export type CreateSenderProfileInput = z.infer<typeof CreateSenderProfileInputSchema>;
export type UpdateSenderProfileInput = z.infer<typeof UpdateSenderProfileInputSchema>;

// -------------------------------------------------------------
// PHASE 08 — CRM & PIPELINE VALIDATION SCHEMAS
// -------------------------------------------------------------

export const CreateCRMContactInputSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required'),
  name: z.string().min(1, 'Contact name is required').trim(),
  jobTitle: z.string().trim().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  website: z.string().url().optional().or(z.literal('')),
  country: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  source: z.string().default('manual_entry'),
  verificationStatus: z
    .enum(['VERIFIED', 'UNVERIFIED', 'INVALID', 'MISSING'])
    .default('UNVERIFIED'),
  assignedUserId: z.string().optional(),
  status: z.string().default('active'),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export const UpdateCRMContactInputSchema = z.object({
  name: z.string().min(1).trim().optional(),
  jobTitle: z.string().trim().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  website: z.string().url().optional().or(z.literal('')),
  country: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  verificationStatus: z.enum(['VERIFIED', 'UNVERIFIED', 'INVALID', 'MISSING']).optional(),
  assignedUserId: z.string().optional().nullable(),
  status: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const ListCRMContactsQuerySchema = z.object({
  page: z
    .string()
    .transform((v) => Math.max(1, parseInt(v, 10) || 1))
    .default('1'),
  limit: z
    .string()
    .transform((v) => Math.max(1, Math.min(100, parseInt(v, 10) || 20)))
    .default('20'),
  businessId: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  verificationStatus: z.string().optional(),
  assignedUserId: z.string().optional(),
});

export const CreateCRMLeadInputSchema = z.object({
  businessId: z.string().min(1, 'Business ID is required'),
  contactId: z.string().optional(),
  stageId: z.string().optional(),
  assignedOwnerId: z.string().optional(),
  source: z.string().default('lead_discovery'),
  nextFollowUpDate: z.string().datetime().optional().nullable(),
});

export const UpdateCRMLeadInputSchema = z.object({
  contactId: z.string().optional().nullable(),
  stageId: z.string().optional(),
  assignedOwnerId: z.string().optional().nullable(),
  nextFollowUpDate: z.string().datetime().optional().nullable(),
});

export const AssignCRMLeadInputSchema = z.object({
  assignedOwnerId: z.string().nullable(),
});

export const MoveCRMLeadStageInputSchema = z.object({
  stageId: z.string().min(1, 'Stage ID is required'),
  notes: z.string().optional(),
  dealValue: z.number().min(0, 'Deal value cannot be negative').optional(),
  currency: z.string().length(3, 'Currency must be 3-letter ISO code').default('USD').optional(),
  lostReason: z.string().optional(),
  lossNotes: z.string().optional(),
  isOverride: z.boolean().default(false).optional(),
  overrideReason: z.string().optional(),
});

export const ListCRMLeadsQuerySchema = z.object({
  page: z
    .string()
    .transform((v) => Math.max(1, parseInt(v, 10) || 1))
    .default('1'),
  limit: z
    .string()
    .transform((v) => Math.max(1, Math.min(100, parseInt(v, 10) || 20)))
    .default('20'),
  stageId: z.string().optional(),
  assignedOwnerId: z.string().optional(),
  country: z.string().optional(),
  industry: z.string().optional(),
  priority: z.string().optional(),
  search: z.string().optional(),
  unassignedOnly: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  myLeadsOnly: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});

export const CreateCRMPipelineStageInputSchema = z.object({
  name: z.string().min(1, 'Stage name is required').trim(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid 6-character hex code'),
  order: z.number().int().min(0).optional(),
  isDefault: z.boolean().default(false),
  isWon: z.boolean().default(false),
  isLost: z.boolean().default(false),
});

export const UpdateCRMPipelineStageInputSchema = z.object({
  name: z.string().min(1).trim().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  order: z.number().int().min(0).optional(),
  isDefault: z.boolean().optional(),
  isWon: z.boolean().optional(),
  isLost: z.boolean().optional(),
});

export const ReorderCRMPipelineStagesInputSchema = z.object({
  stageIds: z.array(z.string()).min(1, 'Must provide stageIds array'),
});

export const DeleteCRMPipelineStageQuerySchema = z.object({
  reassignToStageId: z.string().optional(),
});

export const CreateCRMNoteInputSchema = z.object({
  content: z.string().min(1, 'Note content cannot be empty').trim(),
  isPinned: z.boolean().default(false),
});

export const UpdateCRMNoteInputSchema = z.object({
  content: z.string().min(1).trim().optional(),
  isPinned: z.boolean().optional(),
});

export const CreateCRMTaskInputSchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
  title: z.string().min(1, 'Task title is required').trim(),
  description: z.string().trim().optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  followUpSequence: z.enum(['first_follow_up', 'second_follow_up', 'custom']).optional(),
  draftId: z.string().optional(),
  contactId: z.string().optional(),
  waitingForReply: z.boolean().optional(),
});

export const ScheduleFollowUpInputSchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
  followUpSequence: z.enum(['first_follow_up', 'second_follow_up', 'custom']).default('first_follow_up'),
  dueDate: z.string().datetime({ message: 'Due date must be a valid ISO datetime' }),
  reason: z.string().min(1, 'Follow-up reason is required').trim(),
  assignedTo: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  draftId: z.string().optional(),
  contactId: z.string().optional(),
});

export const RecordReplyInputSchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
  replyDate: z.string().datetime().optional(),
  summary: z.string().min(1, 'Reply summary is required').trim(),
  interestLevel: z.enum(['not_interested', 'curious', 'interested', 'hot', 'do_not_contact']),
  nextAction: z.enum(['schedule_meeting', 'send_proposal', 'manual_follow_up', 'archive_lost', 'suppress_contact']),
  draftId: z.string().optional(),
  contactId: z.string().optional(),
  notes: z.string().trim().optional(),
});

export const UpdateCRMTaskInputSchema = z.object({
  title: z.string().min(1).trim().optional(),
  description: z.string().trim().optional(),
  assignedTo: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  cancelReason: z.string().trim().optional(),
  waitingForReply: z.boolean().optional(),
});

export const ListCRMTasksQuerySchema = z.object({
  page: z
    .string()
    .transform((v) => Math.max(1, parseInt(v, 10) || 1))
    .default('1'),
  limit: z
    .string()
    .transform((v) => Math.max(1, Math.min(100, parseInt(v, 10) || 20)))
    .default('20'),
  leadId: z.string().optional(),
  assignedTo: z.string().optional(),
  status: z.enum(['all', 'pending', 'in_progress', 'completed', 'cancelled']).default('all'),
  priority: z.enum(['all', 'low', 'medium', 'high', 'urgent']).default('all'),
  queueCategory: z
    .enum(['due_today', 'upcoming', 'overdue', 'completed', 'cancelled', 'waiting_for_reply', 'all'])
    .optional(),
  overdueOnly: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  country: z.string().optional(),
  stageSlug: z.string().optional(),
  userTimezone: z.string().optional(),
});

export const ConvertToCRMInputSchema = z
  .object({
    overrideConfidence: z.boolean().optional(),
    overrideReason: z.string().trim().optional(),
    targetStageId: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.overrideConfidence && (!data.overrideReason || data.overrideReason.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['overrideReason'],
        message: 'A non-empty override reason is required when manually overriding confidence',
      });
    }
  });

export type ConvertToCRMInput = z.infer<typeof ConvertToCRMInputSchema>;

export const GetConversionAnalyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  country: z.string().optional(),
  industry: z.string().optional(),
  priority: z.string().optional(),
  assignedOwnerId: z.string().optional(),
});

export type GetConversionAnalyticsQuery = z.infer<typeof GetConversionAnalyticsQuerySchema>;

export const CreateCRMActivityInputSchema = z.object({
  activityType: z.enum([
    'lead_created',
    'contact_added',
    'contact_updated',
    'lead_assigned',
    'stage_changed',
    'note_added',
    'task_created',
    'task_completed',
    'campaign_linked',
    'outreach_draft_generated',
    'outreach_draft_approved',
    'manual_email_sent',
    'reply_recorded',
    'follow_up_scheduled',
    'lead_marked_won',
    'lead_marked_lost',
  ]),
  description: z.string().min(1, 'Description is required').trim(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateCRMContactInput = z.infer<typeof CreateCRMContactInputSchema>;
export type UpdateCRMContactInput = z.infer<typeof UpdateCRMContactInputSchema>;
export type CreateCRMLeadInput = z.infer<typeof CreateCRMLeadInputSchema>;
export type UpdateCRMLeadInput = z.infer<typeof UpdateCRMLeadInputSchema>;
export type AssignCRMLeadInput = z.infer<typeof AssignCRMLeadInputSchema>;
export type MoveCRMLeadStageInput = z.infer<typeof MoveCRMLeadStageInputSchema>;
export type CreateCRMPipelineStageInput = z.infer<typeof CreateCRMPipelineStageInputSchema>;
export type UpdateCRMPipelineStageInput = z.infer<typeof UpdateCRMPipelineStageInputSchema>;
export type ReorderCRMPipelineStagesInput = z.infer<typeof ReorderCRMPipelineStagesInputSchema>;
export type CreateCRMNoteInput = z.infer<typeof CreateCRMNoteInputSchema>;
export type UpdateCRMNoteInput = z.infer<typeof UpdateCRMNoteInputSchema>;
export type CreateCRMTaskInput = z.infer<typeof CreateCRMTaskInputSchema>;
export type ScheduleFollowUpInput = z.infer<typeof ScheduleFollowUpInputSchema>;
export type RecordReplyInput = z.infer<typeof RecordReplyInputSchema>;
export type UpdateCRMTaskInput = z.infer<typeof UpdateCRMTaskInputSchema>;
export type ListCRMTasksQuery = z.infer<typeof ListCRMTasksQuerySchema>;
export type CreateCRMActivityInput = z.infer<typeof CreateCRMActivityInputSchema>;

export const CreateScheduleInputSchema = z.object({
  scheduleName: z.string().trim().min(2, 'Schedule name must be at least 2 characters').max(100),
  scheduleType: z.enum(['recurring', 'one_time']).default('recurring'),
  jobType: z.enum([
    'LEAD_DISCOVERY',
    'LEAD_QUALIFICATION',
    'WEBSITE_MONITORING',
    'LEAD_REQUALIFICATION',
    'CONTACT_VERIFICATION_REFRESH',
    'OUTREACH_DRAFT_GENERATION',
    'CRM_FOLLOWUP_DISPATCH',
    'CLIENT_RETENTION_AUDIT',
  ]),
  enabled: z.boolean().default(true),
  timezone: z.string().trim().min(1, 'Timezone is required').default('UTC'),
  frequency: z.enum(['hourly', 'daily', 'weekly', 'weekdays', 'monthly', 'custom_interval']),
  interval: z.number().int().min(1).max(365).default(1),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional().default([]),
  localTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'localTime must be in HH:mm 24-hour format')
    .default('09:00'),
  configuration: z.record(z.unknown()).optional().default({}),
  executionLimits: z
    .object({
      maxRunsTotal: z.number().int().min(1).optional(),
      maxRunsPerDay: z.number().int().min(1).optional(),
      maxItemsPerRun: z.number().int().min(1).optional(),
      stopOnError: z.boolean().optional(),
    })
    .optional()
    .default({}),
});

export const UpdateScheduleInputSchema = z.object({
  scheduleName: z.string().trim().min(2).max(100).optional(),
  scheduleType: z.enum(['recurring', 'one_time']).optional(),
  jobType: z
    .enum([
      'LEAD_DISCOVERY',
      'LEAD_QUALIFICATION',
      'WEBSITE_MONITORING',
      'LEAD_REQUALIFICATION',
      'CONTACT_VERIFICATION_REFRESH',
      'OUTREACH_DRAFT_GENERATION',
      'CRM_FOLLOWUP_DISPATCH',
      'CLIENT_RETENTION_AUDIT',
    ])
    .optional(),
  enabled: z.boolean().optional(),
  timezone: z.string().trim().min(1).optional(),
  frequency: z.enum(['hourly', 'daily', 'weekly', 'weekdays', 'monthly', 'custom_interval']).optional(),
  interval: z.number().int().min(1).max(365).optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
  localTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'localTime must be in HH:mm 24-hour format')
    .optional(),
  configuration: z.record(z.unknown()).optional(),
  executionLimits: z
    .object({
      maxRunsTotal: z.number().int().min(1).optional(),
      maxRunsPerDay: z.number().int().min(1).optional(),
      maxItemsPerRun: z.number().int().min(1).optional(),
      stopOnError: z.boolean().optional(),
    })
    .optional(),
});

export const ListSchedulesQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(50, Math.max(1, parseInt(val, 10))) : 20)),
  enabled: z
    .string()
    .optional()
    .transform((val) => (val !== undefined ? val === 'true' : undefined)),
  jobType: z.string().optional(),
});

export const ScheduleHistoryQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(50, Math.max(1, parseInt(val, 10))) : 20)),
});

export type CreateScheduleInput = z.infer<typeof CreateScheduleInputSchema>;
export type UpdateScheduleInput = z.infer<typeof UpdateScheduleInputSchema>;
export type ListSchedulesQuery = z.infer<typeof ListSchedulesQuerySchema>;
export type ScheduleHistoryQuery = z.infer<typeof ScheduleHistoryQuerySchema>;

export const validateEnvironment = <T extends z.ZodTypeAny>(
  schema: T,
  rawEnv: NodeJS.ProcessEnv = process.env
): z.infer<T> => {
  const result = schema.safeParse(rawEnv);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => ` - [${i.path.join('.')}] ${i.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${issues}`);
  }
  return result.data;
};
