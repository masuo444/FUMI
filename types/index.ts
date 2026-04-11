// ============================================================
// Enums
// ============================================================
export type MemberStatus = 'active' | 'inactive'
export type PreferredLanguage = 'ja' | 'en'
export type PostStatus = 'draft' | 'published'
export type LanguageCode = 'ja' | 'en'
export type TranslationStatus = 'completed' | 'pending_insufficient_balance' | 'failed'
export type NotificationStatus = 'pending' | 'sent' | 'failed'
export type TransactionType = 'charge' | 'consume' | 'refund'
export type ReferenceType = 'translation' | 'manual_adjust' | 'stripe_charge'
export type DomainVerificationStatus = 'pending' | 'verified' | 'failed'

// ============================================================
// DB Row Types
// ============================================================
export interface Owner {
  id: string
  name: string
  email: string
  created_at: string
}

export type NotificationLanguage = 'member' | 'ja' | 'en'

export interface Salon {
  id: string
  owner_id: string
  name: string
  description: string | null
  payment_url: string | null
  hero_image_url: string | null
  notification_language: NotificationLanguage
  created_at: string
}

export interface Member {
  id: string
  salon_id: string
  email: string
  name: string | null
  preferred_language: PreferredLanguage
  status: MemberStatus
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  salon_id: string
  owner_id: string
  original_language: LanguageCode
  cover_image_url: string | null
  status: PostStatus
  send_notification: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface PostTranslation {
  id: string
  post_id: string
  language_code: LanguageCode
  title: string
  body: string
  status: TranslationStatus
  generated_at: string
}

export interface PostImage {
  id: string
  post_id: string
  image_url: string
  sort_order: number
  created_at: string
}

export interface Notification {
  id: string
  post_id: string
  salon_id: string
  status: NotificationStatus
  sent_at: string | null
  created_at: string
}

export interface OwnerWallet {
  id: string
  owner_id: string
  balance: number
  updated_at: string
}

export interface WalletTransaction {
  id: string
  owner_id: string
  type: TransactionType
  amount: number
  reference_type: ReferenceType
  reference_id: string | null
  note: string | null
  created_at: string
}

export interface OwnerSenderDomain {
  id: string
  owner_id: string
  domain: string
  resend_domain_id: string | null
  verification_status: DomainVerificationStatus
  dkim_status: boolean
  spf_status: boolean
  dmarc_status: boolean
  is_default: boolean
  created_at: string
  verified_at: string | null
}

export interface OwnerSenderAddress {
  id: string
  owner_id: string
  sender_domain_id: string | null
  from_name: string
  from_email: string
  reply_to_email: string | null
  is_default: boolean
}

// ============================================================
// Composite / View Types
// ============================================================
export interface PostWithTranslations extends Post {
  translations: PostTranslation[]
  images: PostImage[]
}

export interface PostCard {
  id: string
  salon_id: string
  cover_image_url: string | null
  status: PostStatus
  original_language: LanguageCode
  published_at: string | null
  created_at: string
  ja_title?: string
  en_title?: string
  ja_status?: TranslationStatus
  en_status?: TranslationStatus
}

export interface DashboardStats {
  balance: number
  memberCount: number
  untranslatedCount: number
  recentPosts: PostCard[]
}

// ============================================================
// API Request / Response Types
// ============================================================
export interface CreatePostRequest {
  salon_id: string
  original_language: LanguageCode
  title: string
  body: string
  cover_image_url?: string
  status: PostStatus
  send_notification: boolean
}

export interface UpdatePostRequest extends Partial<CreatePostRequest> {
  id: string
}

export interface TranslationEstimate {
  estimated_chars: number
  estimated_cost_jpy: number
  sufficient_balance: boolean
  current_balance: number
}

export interface CreateMemberRequest {
  salon_id: string
  email: string
  name?: string
  preferred_language: PreferredLanguage
}

export interface AddDomainRequest {
  domain: string
}

export interface UpdateSenderAddressRequest {
  sender_domain_id?: string
  from_name: string
  from_email: string
  reply_to_email?: string
  is_default?: boolean
}

// Credit unit: 1 credit = $0.001 USD
// Claude Haiku API cost ≈ $0.000005/char → 0.005 credits/char
// $5 of credits (5,000 units) → ~500 translations of a 2,000-char article
export const TRANSLATION_COST_PER_CHAR = 0.005
export const MIN_CHARGE_AMOUNT_USD = 5     // minimum $5 top-up
export const SUBSCRIPTION_CREDIT_GRANT = 5000  // credits added per billing period ($5 worth)
export const CREDIT_TOPUP_RATE = 0.5           // 50% of payment becomes credits
