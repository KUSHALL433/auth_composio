// ── Core domain models matching the FastAPI schemas ──────────────────────────

export type Difficulty = 'easy' | 'moderate' | 'hard' | 'unknown';
export type ApprovalStatus = 'yes' | 'no' | 'conditional' | 'unknown';
export type AvailabilityStatus =
  | 'confirmed_available'
  | 'confirmed_unavailable'
  | 'requires_verification'
  | 'not_applicable';
export type EvidenceStatus = 'curated' | 'partially_verified' | 'verified' | 'documented' | 'unverified';
export type InvestigationStatus = 'running' | 'completed' | 'failed';
export type RecommendedStrategy =
  | 'managed_oauth'
  | 'custom_oauth'
  | 'alternative_auth'
  | 'investigate_first';

export interface OAuthApp {
  id: string;
  name: string;
  description: string;
  website: string;
  provider: string;
  category: string;
  difficulty: Difficulty;
  guide_available: boolean;
}

export interface AppSearchResponse {
  results: OAuthApp[];
  total: number;
}

export interface GuideStep {
  title: string;
  description: string;
  estimated_minutes: number | null;
  required: boolean;
  source_urls: string[];
  human_action_required: boolean;
}

export interface ManagedAuthOption {
  provider: string;
  availability: AvailabilityStatus;
  description: string;
  source_urls: string[];
}

export interface OAuthGuide {
  app_name: string;
  website: string;
  difficulty: Difficulty;
  summary: string;
  prerequisites: string[];
  steps: GuideStep[];
  estimated_active_minutes: number | null;
  estimated_wait_days: number | null;
  approval_required: ApprovalStatus;
  approval_notes: string[];
  managed_auth_options: ManagedAuthOption[];
  custom_oauth_supported: boolean | null;
  blockers: string[];
  human_actions_required: string[];
  tested_actions: string[];
  untested_actions: string[];
  sources: string[];
  uncertainties: string[];
  evidence_status: EvidenceStatus;
  generated_at: string;
  investigation_id?: string;
  guide_url?: string;
  share_url?: string;
  effort_risk?: EffortRisk;
}

export interface EffortRisk {
  risk_score?: number;
  complexity?: string;
  [key: string]: unknown;
}

export interface GuideSummary {
  app_id: string;
  app_name: string;
  difficulty: Difficulty;
  approval_required: ApprovalStatus;
  estimated_active_minutes: number | null;
  estimated_wait_days: number | null;
  evidence_status: EvidenceStatus;
  guide_url: string;
  summary: string;
}

export interface GuidesListResponse {
  results: GuideSummary[];
  total: number;
}

export interface AuthStrategyRequest {
  app_id: string;
  use_case?: string;
  production?: boolean;
  needs_custom_branding?: boolean;
  needs_custom_scopes?: boolean;
  needs_dedicated_quota?: boolean;
}

export interface AuthStrategyResponse {
  app_id: string;
  app_name: string;
  recommended_strategy: RecommendedStrategy;
  reason: string;
  alternatives: string[];
  next_steps: string[];
  evidence_status: EvidenceStatus;
  sources: string[];
  uncertainties: string[];
}

export interface InvestigationRequest {
  app_name?: string;
  website?: string;
}

export interface InvestigationRecord {
  id: string;
  app_name: string;
  website: string | null;
  status: InvestigationStatus;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvestigationDetail extends InvestigationRecord {
  guide: OAuthGuide | null;
  research: unknown;
  analysis: unknown;
}

export interface InvestigationListResponse {
  items: InvestigationRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface FeedbackRequest {
  rating: number;
  comment?: string;
}

export interface FeedbackResponse {
  id: string;
  investigation_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

// SSE progress event shapes
export interface ProgressEvent {
  stage: string;
  message: string;
  investigation_id?: string;
  timestamp?: string;
}

export interface InvestigationStreamResult extends OAuthGuide {
  investigation_id: string;
  guide_url: string;
  share_url: string;
}
