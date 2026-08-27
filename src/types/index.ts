// ── Entity types ──────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'admin' | 'editor' | 'viewer';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  access_level: number; // 0–10
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ContentType = 'text' | 'rich_text' | 'image' | 'number' | 'url' | 'json';

export interface SiteContent {
  id: string;
  page_slug: string;
  section_key: string;
  content_type: ContentType;
  content: string;
  sort_order: number;
  is_published: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export type IncomeCategory = 'donation' | 'event' | 'other';

export interface IncomeRecord {
  id: string;
  category: IncomeCategory;
  description: string;
  amount_usd: number; // stored in USD
  date: string;
  donor_id: string | null;
  event_name: string | null;
  receipt_url: string | null;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // joined
  donor?: Donor;
}

export type ExpenseCategory =
  | 'food'
  | 'medical'
  | 'infrastructure'
  | 'salary'
  | 'utilities'
  | 'supplies'
  | 'other';

export interface ExpenseRecord {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount_usd: number; // stored in USD
  date: string;
  vendor: string | null;
  receipt_url: string | null;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type DonorType = 'individual' | 'company' | 'organization';

export interface Donor {
  id: string;
  name: string;
  type: DonorType;
  email: string | null;
  phone: string | null;
  total_donated_usd: number; // stored in USD
  is_featured: boolean;
  is_anonymous: boolean;
  logo_url: string | null;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export type ContactType = 'general' | 'support' | 'donation' | 'volunteer';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  type: ContactType;
  is_read: boolean;
  created_at: string;
}

export interface SiteSettings {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
}

// ── UI / utility types ────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export interface StatCard {
  label: string;
  value: string | number;
  icon?: string;
  trend?: number; // percentage change
  color?: string;
}

export interface DonationMethod {
  id: string;
  name: string;
  type: 'bank_transfer' | 'paypal' | 'crypto' | 'cash' | 'other';
  details: string; // JSON string or plain text
  is_active: boolean;
  logo_url: string | null;
}

// ── Extended Features Types ─────────────────────────────────────

export type AnimalSpecies = 'dog';
export type AnimalGender = 'male' | 'female';
export type AnimalSize = 'small' | 'medium' | 'large' | 'extra_large';
export type AnimalStatus = 'available' | 'pending' | 'adopted' | 'medical_care';

export interface Animal {
  id: string;
  name: string;
  species: AnimalSpecies;
  breed: string | null;
  age_months: number;
  gender: AnimalGender;
  size: AnimalSize;
  status: AnimalStatus;
  description: string;
  story: string | null;
  health_status: string;
  is_vaccinated: boolean;
  is_neutered: boolean;
  is_special_needs: boolean;
  special_needs_desc: string | null;
  main_image_url: string;
  gallery_urls: string[];
  rescue_date: string;
  location: string;
  created_at: string;
  updated_at: string;
}

export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';
export type HousingType = 'house' | 'apartment' | 'farm';

export interface AdoptionApplication {
  id: string;
  animal_id: string;
  animal?: Animal;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  applicant_address: string;
  housing_type: HousingType;
  has_yard: boolean;
  has_other_pets: boolean;
  other_pets_desc: string | null;
  reason: string;
  status: ApplicationStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type VolunteerArea = 'dog_walking' | 'medical_support' | 'events' | 'social_media' | 'shelter_maintenance' | 'foster';

export interface VolunteerApplication {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  area_of_interest: VolunteerArea;
  availability: string;
  experience: string | null;
  status: 'pending' | 'contacted' | 'active' | 'archived';
  created_at: string;
}

export interface SuccessStory {
  id: string;
  animal_name: string;
  adopter_name: string;
  title: string;
  story: string;
  before_image_url: string | null;
  after_image_url: string;
  adoption_date: string;
  is_featured: boolean;
  created_at: string;
}

// ── Volunteer Calendar & Task Types ─────────────────────────────

export type ActivityCategory =
  | 'dog_walking'
  | 'medical'
  | 'events'
  | 'maintenance'
  | 'cleaning'
  | 'foster';

export type EventType = 'single_day' | 'multi_day';
export type RecurrencePattern = 'none' | 'weekly' | 'monthly' | 'yearly';
export type ActivityStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface VolunteerActivity {
  id: string;
  title: string;
  description: string;
  category: ActivityCategory;
  activity_date: string;
  end_date: string | null;
  event_type: EventType;
  recurrence_pattern: RecurrencePattern;
  parent_event_id: string | null;
  start_time: string;
  end_time: string;
  location: string;
  max_volunteers: number;
  current_volunteers: number;
  coordinator_name: string;
  coordinator_phone: string | null;
  requirements: string[];
  status: ActivityStatus;
  created_at: string;
  updated_at: string;
}

export interface ActivityRegistration {
  id: string;
  activity_id: string;
  volunteer_name: string;
  volunteer_email: string;
  volunteer_phone: string;
  notes: string | null;
  assigned_by_admin: boolean;
  created_at: string;
}

