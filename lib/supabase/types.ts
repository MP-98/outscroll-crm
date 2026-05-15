// Hand-written DB types. Replace with `supabase gen types typescript` output once
// the project is provisioned and the schema is applied.

export type UserRole = "admin" | "member" | "talent" | "brand";

export type TalentStatus = "active" | "paused" | "offboarded";
export type Exclusivity = "exclusive" | "non_exclusive";

export type ContactKind = "phone" | "whatsapp" | "ig_link" | "ig_dm" | "email" | "other";

export type Channel = "ig_dm" | "linkedin" | "whatsapp" | "email" | "call" | "other";
export type ActivityChannel = Channel | "note" | "status_change";
export type Direction = "outbound" | "inbound" | "internal";

export type OutreachStatus =
  | "prospected"
  | "contacted"
  | "in_conversation"
  | "brief_received"
  | "negotiating"
  | "confirmed"
  | "live"
  | "paid"
  | "lost"
  | "on_hold";

export type CampaignOutreachStatus =
  | "shortlisted"
  | "contacted"
  | "in_conversation"
  | "negotiating"
  | "confirmed"
  | "live"
  | "paid"
  | "lost"
  | "on_hold";

export type CampaignStatus = "planning" | "live" | "wrapping" | "done" | "cancelled";
export type ManagedBrandStatus = "active" | "paused" | "churned";
export type PaymentStatus = "pending" | "invoiced" | "paid" | "overdue" | "cancelled";
export type CampaignPaymentStatus = "pending" | "invoiced" | "paid" | "overdue" | "na";
export type DocumentKind = "contract" | "brief" | "invoice" | "id_proof" | "other";
export type SyncStatus = "queued" | "running" | "succeeded" | "failed";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: UserRole;
  linked_talent_id: string | null;
  linked_brand_id: string | null;
  linked_managed_brand_id: string | null;
  is_seed_admin: boolean;
  can_configure_team: boolean;
  allowed_sidebar: string[] | null;
  created_at: string;
}

export interface Niche {
  id: string;
  name: string;
  created_at: string;
}

export interface Talent {
  id: string;
  full_name: string;
  ig_handle: string;
  ig_followers: number | null;
  avg_reel_views: number | null;
  ig_metrics_synced_at: string | null;
  niches: string[];
  city: string | null;
  languages: string[];
  status: TalentStatus;
  exclusivity: Exclusivity;
  onboarded_at: string | null;
  manager_id: string | null;
  rate_reel: number | null;
  rate_story: number | null;
  rate_post: number | null;
  rate_integration: number | null;
  rate_exclusivity: number | null;
  default_commission_pct: number | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface TalentContact {
  id: string;
  talent_id: string;
  kind: ContactKind;
  value: string;
  is_primary: boolean;
  label: string | null;
}

export interface Brand {
  id: string;
  name: string;
  industry: string | null;
  ig_handle: string | null;
  website: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface BrandPoc {
  id: string;
  brand_id: string;
  full_name: string;
  role_title: string | null;
  email: string | null;
  phone: string | null;
  ig_handle: string | null;
  linkedin_url: string | null;
  notes: string | null;
}

export type OutreachDirection = "inbound" | "outbound";

export interface Outreach {
  id: string;
  talent_id: string | null;
  brand_id: string;
  primary_poc_id: string | null;
  channel: Channel;
  direction: OutreachDirection | null;
  status: OutreachStatus;
  deliverables: string | null;
  proposed_amount: number | null;
  negotiated_amount: number | null;
  agreed_amount: number | null;
  commission_pct: number | null;
  reached_out_at: string | null;
  next_followup_at: string | null;
  owner_id: string | null;
  notes: string | null;
  tags: string[];
  lost_reason: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ManagedBrand {
  id: string;
  name: string;
  industry: string | null;
  ig_handle: string | null;
  website: string | null;
  monthly_retainer: number | null;
  status: ManagedBrandStatus;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  notes: string | null;
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExternalInfluencer {
  id: string;
  full_name: string | null;
  ig_handle: string;
  ig_followers: number | null;
  avg_reel_views: number | null;
  ig_metrics_synced_at: string | null;
  niches: string[];
  city: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  rate_reel: number | null;
  rate_story: number | null;
  rate_post: number | null;
  notes: string | null;
  tags: string[];
  created_at: string;
}

export interface Campaign {
  id: string;
  managed_brand_id: string;
  name: string;
  brief: string | null;
  budget: number | null;
  deliverable_target: string | null;
  starts_on: string | null;
  ends_on: string | null;
  status: CampaignStatus;
  owner_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignOutreach {
  id: string;
  campaign_id: string;
  external_influencer_id: string | null;
  talent_id: string | null;
  channel: Channel | null;
  status: CampaignOutreachStatus;
  proposed_amount: number | null;
  agreed_amount: number | null;
  deliverables: string | null;
  deliverable_done: boolean;
  next_followup_at: string | null;
  owner_id: string | null;
  payment_status: CampaignPaymentStatus;
  paid_on: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OutreachActivity {
  id: string;
  outreach_id: string;
  occurred_at: string;
  channel: ActivityChannel;
  direction: Direction | null;
  summary: string;
  attachment_url: string | null;
  author_id: string | null;
}

export interface IgSyncRun {
  id: string;
  target_kind: "talent" | "external_influencer";
  target_id: string;
  ig_handle: string;
  apify_run_id: string | null;
  status: SyncStatus;
  followers: number | null;
  avg_reel_views: number | null;
  reels_sampled: number | null;
  cost_credits: number | null;
  error_message: string | null;
  triggered_by: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface Document {
  id: string;
  kind: DocumentKind;
  storage_path: string;
  filename: string;
  size_bytes: number | null;
  talent_id: string | null;
  brand_id: string | null;
  managed_brand_id: string | null;
  campaign_id: string | null;
  outreach_id: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface Reminder {
  id: string;
  user_id: string | null;
  outreach_id: string | null;
  campaign_outreach_id: string | null;
  due_at: string;
  message: string | null;
  done: boolean;
  created_at: string;
}
