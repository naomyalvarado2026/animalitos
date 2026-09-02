// ── Entity types ──────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'admin' | 'editor' | 'viewer';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone?: string | null;
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
  created_at: string;
  updated_at: string;
  donor?: Donor;
}

export type ExpenseCategory = 'food' | 'medical' | 'infrastructure' | 'services' | 'salary' | 'utilities' | 'supplies' | 'other';

export interface ExpenseRecord {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount_usd: number; // stored in USD
  date: string;
  vendor: string | null;
  receipt_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export type DonorType = 'individual' | 'corporate' | 'company' | 'organization';

export interface Donor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: DonorType;
  total_donated_usd: number;
  first_donation_date: string;
  last_donation_date: string;
  is_anonymous: boolean;
  is_featured: boolean;
  logo_url: string | null;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export type AnimalStatus = 'available' | 'pending' | 'adopted' | 'medical_care';
export type AnimalSpecies = 'dog';
export type AnimalGender = 'male' | 'female';
export type AnimalSize = 'unknown' | 'small' | 'medium' | 'large' | 'extra_large';
export type VaccinationStatus = 'unknown' | 'up_to_date' | 'pending';

export interface Animal {
  id: string;
  name: string;
  species: AnimalSpecies;
  breed: string | null;
  age_months: number | null;
  age_is_estimated?: boolean;
  gender: AnimalGender;
  size: AnimalSize;
  status: AnimalStatus;
  description: string;
  story: string | null;
  health_status: string;
  is_vaccinated: boolean | null;
  vaccination_status?: VaccinationStatus;
  is_neutered: boolean;
  is_special_needs: boolean;
  special_needs_desc: string | null;
  main_image_url: string;
  gallery_urls: string[];
  rescue_date: string;
  location: string;
  personality_summary?: string | null;
  ideal_home?: string | null;
  compatibility_notes?: string | null;
  adoption_slug?: string | null;
  is_published?: boolean;
  show_brand_moment?: boolean;
  brand_message?: string | null;
  sort_order?: number;
  created_at: string;
  updated_at: string;
}

export type MedicalRecordType = 'exam' | 'vaccine' | 'medication' | 'procedure' | 'lab' | 'note';
export interface AnimalMedicalRecord {
  id: string;
  animal_id: string;
  record_type: MedicalRecordType;
  title: string;
  notes: string;
  provider: string | null;
  occurred_on: string;
  next_due_on: string | null;
  created_at: string;
}

export type AnimalTaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type AnimalTaskStatus = 'open' | 'in_progress' | 'done' | 'cancelled';
export interface AnimalTask {
  id: string;
  animal_id: string | null;
  title: string;
  description: string;
  due_on: string | null;
  priority: AnimalTaskPriority;
  status: AnimalTaskStatus;
  created_at: string;
}

export type AnimalMovementType = 'intake' | 'foster' | 'transfer' | 'adoption' | 'return' | 'medical' | 'quarantine' | 'other';
export interface AnimalMovement {
  id: string;
  animal_id: string;
  movement_type: AnimalMovementType;
  from_location: string | null;
  to_location: string | null;
  moved_on: string;
  notes: string;
  created_at: string;
}

export type HousingType = 'house' | 'apartment' | 'farm';
export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

export interface AdoptionApplication {
  id: string;
  animal_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  applicant_address: string;
  city: string | null;
  housing_type: HousingType;
  has_yard: boolean;
  has_other_pets: boolean;
  has_children: boolean;
  other_pets_desc: string | null;
  housing_notes: string | null;
  reason: string;
  status: ApplicationStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  consent_at: string;
  created_at: string;
  updated_at: string;
  animal?: Animal;
}

export type VolunteerArea = 'dog_walking' | 'medical_support' | 'events' | 'social_media' | 'shelter_maintenance' | 'foster';
export type VolunteerStatus = 'pending' | 'contacted' | 'active' | 'archived';

export interface VolunteerApplication {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  area_of_interest: VolunteerArea;
  availability: string;
  experience: string | null;
  status: VolunteerStatus;
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

export type ActivityCategory = 'dog_walking' | 'medical' | 'events' | 'maintenance' | 'cleaning' | 'foster';
export type ActivityStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type EventType = 'single_day' | 'multi_day' | 'recurring';
export type RecurrencePattern = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface SiteSettings {
  key: string;
  value: string;
  description?: string | null;
  updated_at?: string;
}

export interface VolunteerActivity {
  id: string;
  title: string;
  description: string;
  category: ActivityCategory;
  activity_date: string;
  end_date?: string | null;
  event_type?: EventType;
  recurrence_pattern?: RecurrencePattern;
  parent_event_id?: string | null;
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
  assigned_by_admin?: boolean;
  created_at: string;
  activity?: VolunteerActivity;
}

// ── Product & Orders ────────────────────────────────────────────────
export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  image_url: string | null;
  inventory: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'paid' | 'shipped' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: Record<string, unknown> | null;
  status: OrderStatus;
  currency: string;
  total_cents: number;
  payment_reference: string | null;
  created_at: string;
  updated_at: string;
}

// ── Financial summary ───────────────────────────────────────────────
export interface FinancialSummary {
  total_income_usd: number;
  total_expenses_usd: number;
  net_balance_usd: number;
  top_income_category: IncomeCategory | null;
  top_expense_category: ExpenseCategory | null;
  donor_count: number;
  adoption_count: number;
}
