export type UserRole = 'super_admin' | 'workspace_owner' | 'workspace_admin' | 'member';

export interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isSuperAdmin: boolean;
  createdAt: string;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: string;
}

export interface WorkspaceMembershipSummary {
  id: string;
  userId: string;
  workspaceId: string;
  role: UserRole;
  createdAt: string;
}

export interface SessionContext {
  sessionId: string;
  user: UserSummary;
  activeWorkspace?: {
    workspace: WorkspaceSummary;
    role: UserRole;
  };
}

export interface AuthSuccessPayload {
  user: UserSummary;
  workspaces: Array<{
    workspace: WorkspaceSummary;
    role: UserRole;
  }>;
  activeWorkspace?: {
    workspace: WorkspaceSummary;
    role: UserRole;
  };
  csrfToken: string;
}

// -------------------------------------------------------------
// PHASE 04 — REAL BUSINESS LEAD DISCOVERY CONTRACTS
// -------------------------------------------------------------
export type SupportedCountryCode = 'us' | 'gb' | 'ca' | 'au';

export type SupportedIndustry =
  | 'Construction'
  | 'Cleaning Services'
  | 'Real Estate'
  | 'Consulting'
  | 'Accounting'
  | 'IT Services';

export type WebsiteStatus = 'available' | 'missing' | 'inaccessible' | 'requires_verification';

export type ContactStatus = 'email_and_phone' | 'email_only' | 'phone_only' | 'unavailable';

export type DiscoveryJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface BusinessSummary {
  id: string;
  workspaceId: string;
  name: string;
  normalizedName: string;
  websiteUrl?: string;
  normalizedDomain?: string;
  websiteStatus: WebsiteStatus;
  industry: SupportedIndustry;
  category?: string;
  address?: string;
  city: string;
  region?: string;
  country: string;
  countryCode: SupportedCountryCode;
  latitude?: number;
  longitude?: number;
  publicPhone?: string;
  publicEmail?: string;
  contactStatus: ContactStatus;
  sourceProvider: string;
  sourceRecordId: string;
  discoveryTimestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiscoveryJobSummary {
  id: string;
  workspaceId: string;
  country: SupportedCountryCode;
  state?: string;
  city: string;
  industry: SupportedIndustry;
  keywords?: string;
  websiteFilter?: 'all' | 'with_website' | 'without_website';
  sourceProvider: string;
  status: DiscoveryJobStatus;
  progressPercent: number;
  foundCount: number;
  savedCount: number;
  duplicateCount: number;
  errorMessage?: string;
  cancelledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

// -------------------------------------------------------------
// PHASE 05 — WEBSITE ANALYZER & OPPORTUNITY INTELLIGENCE TYPES
// -------------------------------------------------------------
export type AnalysisJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface WebsiteAvailabilityResult {
  isAvailable: boolean;
  httpStatus?: number;
  redirectChain: string[];
  finalUrl?: string;
  responseTimeMs: number;
  sslAvailable: boolean;
  errorMessage?: string;
}

export interface TechnologyDetectionResult {
  cms?: string; // WordPress, Shopify, Wix, Squarespace, Webflow, etc.
  backendFramework?: string; // Laravel, Django, Express, Rails, etc.
  frontendFramework?: string; // React, Next.js, Vue, Nuxt, Angular, jQuery, etc.
  analyticsAndTools: string[];
  detectedSignatures: string[];
}

export interface SeoAuditResult {
  title?: string;
  titleLength: number;
  titleStatus: 'good' | 'missing' | 'too_short' | 'too_long';
  metaDescription?: string;
  descriptionLength: number;
  descriptionStatus: 'good' | 'missing' | 'too_short' | 'too_long';
  h1Count: number;
  h1Texts: string[];
  h2Count: number;
  canonicalUrl?: string;
  hasRobotsMeta: boolean;
  robotsDirectives?: string;
  sitemapDetected: boolean;
  totalImages: number;
  imagesMissingAlt: number;
  hasStructuredData: boolean; // JSON-LD or microdata
}

export interface PerformanceAndMobileResult {
  htmlSizeBytes: number;
  renderBlockingScriptCount: number;
  renderBlockingCssCount: number;
  totalImages: number;
  hasViewportMeta: boolean;
  viewportContent?: string;
  isMobileResponsiveIndicators: boolean;
}

export interface ConversionAndTrustResult {
  hasContactForm: boolean;
  hasEmailVisible: boolean;
  hasPhoneVisible: boolean;
  hasCallToAction: boolean;
  ctaButtonsCount: number;
  brokenLinksDetected: number;
  servicePagesCount: number;
  hasTestimonialsOrReviews: boolean;
  hasPrivacyPolicyOrTerms: boolean;
  trustScoreIndicators: string[];
}

export interface OpportunityFinding {
  code: string;
  category: 'availability' | 'seo' | 'performance' | 'technology' | 'conversion';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  recommendedPitch: string;
}

export interface WebsiteAnalysisReport {
  id: string;
  workspaceId: string;
  businessId: string;
  targetUrl: string;
  status: AnalysisJobStatus;
  opportunityScore: number; // 0–100
  opportunityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  availability: WebsiteAvailabilityResult;
  technologies: TechnologyDetectionResult;
  seo: SeoAuditResult;
  performance: PerformanceAndMobileResult;
  conversion: ConversionAndTrustResult;
  findings: OpportunityFinding[];
  analyzedAt: string;
  createdAt: string;
}

// -------------------------------------------------------------
// PHASE 06 — AI LEAD INTELLIGENCE & OPPORTUNITY SCORING TYPES
// -------------------------------------------------------------
export type LeadPriorityTier =
  'High Priority' | 'Medium Priority' | 'Low Priority' | 'Not Qualified';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type LeadWebsiteState = 'EXISTING_WEBSITE' | 'NO_WEBSITE' | 'WEBSITE_STATUS_UNKNOWN';

export interface ScoreWeightBreakdown {
  component: string;
  weightPercent: number;
  score: number;
  weightedScore: number;
  reason: string;
}

export interface WebsiteOpportunityScoreBreakdown {
  score: number; // 0–100
  weights: {
    seoProblems: ScoreWeightBreakdown; // 20%
    mobileResponsivenessProblems: ScoreWeightBreakdown; // 20%
    performanceIndicators: ScoreWeightBreakdown; // 15%
    conversionCtaProblems: ScoreWeightBreakdown; // 25%
    trustContentGaps: ScoreWeightBreakdown; // 20%
  };
}

export interface BusinessFitScoreBreakdown {
  score: number; // 0–100
  weights: {
    targetCountryRelevance: ScoreWeightBreakdown; // 15%
    industryRelevance: ScoreWeightBreakdown; // 25%
    businessWebsiteServiceRelevance: ScoreWeightBreakdown; // 20%
    contactAvailability: ScoreWeightBreakdown; // 15%
    evidenceOfActivity: ScoreWeightBreakdown; // 15%
    serviceSuitability: ScoreWeightBreakdown; // 10%
  };
}

export interface LeadRecommendation {
  recommendedService: string; // e.g. "Corporate Website Redesign", "Mobile & Conversion Optimization", "New Corporate Web Platform"
  suggestedOutreachAngle: string;
  whyNeeded: string[];
  supportingEvidence: string[];
  missingInformation: string[];
}

export interface LeadIntelligenceSummary {
  id: string;
  workspaceId: string;
  businessId: string;
  businessName: string;
  country: string;
  industry: string;
  website?: string;
  websiteState: LeadWebsiteState;
  websiteAnalysisId?: string;
  websiteOpportunityScore: number; // 0–100
  businessFitScore: number; // 0–100
  combinedPriorityScore: number; // 0–100
  priority: LeadPriorityTier;
  confidence: ConfidenceLevel;
  recommendedService: string;
  suggestedOutreachAngle: string;
  findingsCount: number;
  qualificationStatus?: 'QUALIFIED' | 'REVIEW_NEEDED' | 'DISQUALIFIED';
  qualificationScore?: number;
  commercialPitchAngle?: string;
  crmLeadId?: string;
  convertedToCrmAt?: string;
  analyzedAt: string;
  createdAt: string;
}

export interface LeadIntelligenceDetail extends LeadIntelligenceSummary {
  websiteOpportunityBreakdown: WebsiteOpportunityScoreBreakdown;
  businessFitBreakdown: BusinessFitScoreBreakdown;
  findings: OpportunityFinding[];
  recommendation: LeadRecommendation;
  missingInformation: string[];
  scoringVersion: string;
  qualificationEvidence?: string[];
  evidenceSources?: string[];
  domainAssociation?: any;
  disqualificationReason?: string;
  disqualificationEvidence?: string[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthCheckResult {
  status: HealthStatus;
  service: string;
  uptimeSeconds: number;
  timestamp: string;
  version: string;
  checks?: Record<string, { status: HealthStatus; message?: string }>;
}

export const createSuccessResponse = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
  timestamp: new Date().toISOString(),
});

export const createErrorResponse = (
  code: string,
  message: string,
  details?: unknown
): ApiResponse<never> => ({
  success: false,
  error: {
    code,
    message,
    details,
  },
  timestamp: new Date().toISOString(),
});

// -------------------------------------------------------------
// PHASE 07 — OUTREACH & CAMPAIGN MANAGEMENT CONTRACTS
// -------------------------------------------------------------
export type ContactVerificationStatus =
  | 'VERIFIED'
  | 'UNVERIFIED'
  | 'INVALID'
  | 'MISSING'
  | 'NOT_PROVIDED'
  | 'INVALID_FORMAT'
  | 'DOMAIN_NO_MX'
  | 'DOMAIN_MX_FOUND'
  | 'MANUALLY_VERIFIED'
  | 'UNKNOWN';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type SendingMode = 'MANUAL';
export type OutreachPitchType =
  | 'first_contact'
  | 'follow_up'
  | 'follow_up_1'
  | 'follow_up_2'
  | 'website_redesign'
  | 'new_website_build'
  | 'performance_improvement'
  | 'seo_technical_improvement';

export interface IDraftRevisionItem {
  revisionNumber: number;
  subject: string;
  body: string;
  recipientEmail: string;
  recipientPhone?: string;
  editedBy?: string;
  editedAt: string;
  changeSummary?: string;
}
export type DraftStatus =
  'pending_review' | 'approved' | 'rejected' | 'sent' | 'replied' | 'bounced' | 'suppressed';
export type ActivityType =
  | 'draft_generated'
  | 'draft_approved'
  | 'draft_rejected'
  | 'manual_sent'
  | 'reply_received'
  | 'follow_up_scheduled'
  | 'opt_out_recorded';
export type SuppressionScope = 'workspace' | 'global';
export type SuppressionReason =
  'unsubscribe_request' | 'manual_suppression' | 'bounce' | 'complaint' | 'compliance_policy';

export interface ContactVerificationSummary {
  id: string;
  workspaceId: string;
  businessId: string;
  email?: string;
  phone?: string;
  officialWebsite?: string;
  contactPageUrl?: string;
  sourceUrl: string;
  status: ContactVerificationStatus;
  provenance: {
    sourceProvider: string;
    sourceRecordId?: string;
    discoveryDate: string;
  };
  verifiedAt?: string;
  lastCheckedAt: string;
}

export interface OutreachCampaignSummary {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  targetCountries: SupportedCountryCode[];
  targetIndustries: SupportedIndustry[];
  minPriority: LeadPriorityTier;
  targetService: string;
  sendingMode: SendingMode;
  totalLeads: number;
  approvedDrafts: number;
  sentCount: number;
  repliedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OutreachDraftSummary {
  id: string;
  workspaceId: string;
  campaignId: string;
  campaignName: string;
  businessId: string;
  businessName: string;
  country: string;
  countryCode: SupportedCountryCode;
  industry: SupportedIndustry;
  recipientEmail: string;
  recipientPhone?: string;
  contactStatus: ContactVerificationStatus;
  pitchType: OutreachPitchType;
  subject: string;
  body: string;
  status: DraftStatus;
  rejectionReason?: string;
  evidenceUsed: {
    opportunityScore: number;
    businessFitScore: number;
    websiteState: LeadWebsiteState;
    findingsCount: number;
    topFindingTitle?: string;
    recommendedService: string;
    verifiedProblems?: string[];
    callToAction?: string;
    isReviewRequired?: boolean;
    evidenceNotes?: string;
  };
  revisionHistory?: IDraftRevisionItem[];
  leadId?: string;
  scheduledFollowUpDate?: string;
  sentAt?: string;
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SuppressionRecordSummary {
  id: string;
  workspaceId?: string;
  scope: SuppressionScope;
  email: string;
  domain?: string;
  phone?: string;
  reason: SuppressionReason;
  notes?: string;
  source: string;
  suppressedAt: string;
}

export interface SenderProfileSummary {
  id: string;
  workspaceId: string;
  senderName: string;
  senderEmail: string;
  senderTitle?: string;
  companyName: string;
  physicalAddress: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CountryCompliancePolicy {
  countryCode: SupportedCountryCode;
  countryName: string;
  governingRegulation: string;
  requiresPriorConsent: boolean;
  requiresUnsubscribeNotice: boolean;
  requiresSenderAddress: boolean;
  requiresAccurateSubject: boolean;
  manualApprovalMandatory: boolean;
  commercialEmailPermittedForPublicB2B: boolean;
  complianceNotes: string[];
}

export interface OutreachAnalyticsSummary {
  totalCampaigns: number;
  activeCampaigns: number;
  totalLeadsContacted: number;
  draftsGenerated: number;
  draftsApproved: number;
  draftsRejected: number;
  sentCount: number;
  repliedCount: number;
  suppressionCount: number;
  responseRatePercent: number;
  industryBreakdown: Record<string, { sent: number; replied: number }>;
  countryBreakdown: Record<string, { sent: number; replied: number }>;
}

// -------------------------------------------------------------
// PHASE 08 — CRM & PIPELINE INTEGRATION
// -------------------------------------------------------------

export type CRMTaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type CRMTaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type FollowUpSequenceType = 'first_follow_up' | 'second_follow_up' | 'custom';
export type FollowUpQueueCategory =
  | 'due_today'
  | 'upcoming'
  | 'overdue'
  | 'completed'
  | 'cancelled'
  | 'waiting_for_reply';
export type LeadInterestLevel = 'not_interested' | 'curious' | 'interested' | 'hot' | 'do_not_contact';
export type ReplyNextAction =
  | 'schedule_meeting'
  | 'send_proposal'
  | 'manual_follow_up'
  | 'archive_lost'
  | 'suppress_contact';

export type CRMActivityType =
  | 'lead_created'
  | 'contact_added'
  | 'contact_updated'
  | 'lead_assigned'
  | 'stage_changed'
  | 'note_added'
  | 'task_created'
  | 'task_completed'
  | 'campaign_linked'
  | 'outreach_draft_generated'
  | 'outreach_draft_approved'
  | 'outreach_draft_rejected'
  | 'manual_email_sent'
  | 'reply_recorded'
  | 'follow_up_scheduled'
  | 'lead_marked_won'
  | 'lead_marked_lost';

export interface CRMPipelineStageSummary {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  order: number;
  color: string;
  isDefault: boolean;
  isWon: boolean;
  isLost: boolean;
  leadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CRMContactSummary {
  id: string;
  workspaceId: string;
  businessId: string;
  businessName?: string;
  name: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  website?: string;
  country?: string;
  industry?: string;
  source: string;
  verificationStatus: ContactVerificationStatus;
  assignedUserId?: string;
  assignedUserName?: string;
  status: string;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CRMStageHistoryItem {
  fromStageId?: string;
  fromStageName?: string;
  toStageId: string;
  toStageName: string;
  changedBy: string;
  timestamp: string;
  reason?: string;
  isOverride?: boolean;
}

export interface CRMLeadSummary {
  id: string;
  workspaceId: string;
  businessId: string;
  businessName: string;
  primaryContactId?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  website?: string;
  country: string;
  countryCode: SupportedCountryCode;
  industry: SupportedIndustry;
  websiteOpportunityScore: number;
  businessFitScore: number;
  priority: LeadPriorityTier;
  confidence: ConfidenceLevel;
  source: string;
  assignedOwnerId?: string;
  assignedOwnerName?: string;
  currentStageId: string;
  currentStageName: string;
  currentStageColor: string;
  lastActivityAt?: string;
  nextFollowUpDate?: string;
  dealValue?: number;
  currency?: string;
  closedAt?: string;
  lostReason?: string;
  lossNotes?: string;
  stageHistory?: CRMStageHistoryItem[];
  notesCount: number;
  tasksCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CRMNoteSummary {
  id: string;
  workspaceId: string;
  leadId: string;
  authorId: string;
  authorName: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  editHistory: Array<{
    content: string;
    editedAt: string;
    editedBy: string;
  }>;
}

export interface CRMTaskSummary {
  id: string;
  workspaceId: string;
  leadId: string;
  leadName?: string;
  title: string;
  description?: string;
  assignedTo?: string;
  assignedToName?: string;
  dueDate?: string;
  priority: CRMTaskPriority;
  status: CRMTaskStatus;
  completedAt?: string;
  completedBy?: string;
  createdAt: string;
  updatedAt: string;
  isOverdue?: boolean;
  followUpSequence?: FollowUpSequenceType;
  draftId?: string;
  contactId?: string;
  cancelReason?: string;
  waitingForReply?: boolean;
}

export interface CRMActivitySummary {
  id: string;
  workspaceId: string;
  leadId: string;
  activityType: CRMActivityType;
  description: string;
  actorId?: string;
  actorName?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CRMAnalyticsSummary {
  totalLeads: number;
  qualifiedLeads: number;
  contactReadyLeads: number;
  contactedLeads: number;
  repliedLeads: number;
  interestedLeads: number;
  meetingsScheduled: number;
  proposalsSent: number;
  wonDeals: number;
  lostDeals: number;
  totalWonValue: number;
  winRate: number;
  pendingTasks: number;
  overdueFollowUps: number;
  stageDistribution: Array<{
    stageId: string;
    stageName: string;
    stageColor: string;
    count: number;
  }>;
}

// -------------------------------------------------------------
// PHASE 09.6 MILESTONE 7 — CONVERSION ANALYTICS & REVENUE TELEMETRY
// -------------------------------------------------------------

export interface CurrencyRevenueSummary {
  currency: string;
  totalRevenue: number;
  wonDealsCount: number;
  averageDealValue: number;
}

export interface FunnelStageMetric {
  key: string;
  label: string;
  count: number;
  conversionFromPrevious: number;
  conversionFromDiscovered: number;
}

export interface CountryPerformanceMetric {
  countryCode: string;
  countryName: string;
  discoveredLeads: number;
  qualifiedLeads: number;
  contactedLeads: number;
  manuallyRecordedReplies: number;
  wonDeals: number;
  lostDeals: number;
  winRate: number;
  revenueByCurrency: Record<string, number>;
}

export interface ConversionAnalyticsSummary {
  workspaceId: string;
  filtersApplied: {
    startDate?: string;
    endDate?: string;
    country?: string;
    industry?: string;
    priority?: string;
    assignedOwnerId?: string;
  };
  metrics: {
    discoveredLeads: number;
    qualifiedLeads: number;
    contactReadyLeads: number;
    actuallyContactedLeads: number;
    manuallyRecordedReplies: number;
    interestedProspects: number;
    proposalsSent: number;
    wonDealsCount: number;
    wonDealsWithRecordedValue: number;
    wonDealsWithoutRecordedValue: number;
    lostDeals: number;
  };
  rates: {
    qualificationRate: number;
    contactRate: number;
    replyRate: number;
    interestRate: number;
    proposalRate: number;
    winRate: number;
    lossRate: number;
    overallConversionRate: number;
  };
  revenue: {
    byCurrency: CurrencyRevenueSummary[];
    totalCurrenciesCount: number;
  };
  funnel: FunnelStageMetric[];
  countryBreakdown: CountryPerformanceMetric[];
  stageDistribution: Array<{
    stageId: string;
    stageName: string;
    stageSlug: string;
    stageColor: string;
    count: number;
  }>;
}
