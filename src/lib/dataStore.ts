import type {
  Animal,
  IncomeRecord,
  ExpenseRecord,
  Donor,
  AdoptionApplication,
  VolunteerApplication,
  VolunteerActivity,
  SiteContent,
  SiteSettings,
} from '@/types';
import { supabase } from '@/lib/supabase';

// ── Initial Seed Data ────────────────────────────────────────────────────────

const SEED_ANIMALS: Animal[] = [
  {
    id: 'anim-1',
    name: 'Max',
    species: 'dog',
    breed: 'Mestizo de Labrador',
    age_months: 24,
    gender: 'male',
    size: 'large',
    status: 'available',
    description: 'Max es un perro súper cariñoso, juguetón y lleno de energía. Le encanta correr al aire libre y se lleva de maravilla con niños.',
    story: 'Fue rescatado en una carretera transitada cuando apenas tenía 6 meses.',
    health_status: 'Excelente salud. Esquema completo de vacunas al día.',
    is_vaccinated: true,
    is_neutered: true,
    is_special_needs: false,
    special_needs_desc: null,
    main_image_url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=800',
    gallery_urls: [],
    rescue_date: '2025-09-10',
    location: 'Refugio Principal',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'anim-2',
    name: 'Luna',
    species: 'dog',
    breed: 'Mestiza de compañía',
    age_months: 18,
    gender: 'female',
    size: 'medium',
    status: 'available',
    description: 'Luna es una perrita serena, elegante y muy mimosa. Disfruta los paseos tranquilos y las siestas al sol.',
    story: 'Encontrada en un parque comunitario. Es muy dócil y tranquila.',
    health_status: 'Desparasitada y vacunada.',
    is_vaccinated: true,
    is_neutered: true,
    is_special_needs: false,
    special_needs_desc: null,
    main_image_url: 'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&q=80&w=800',
    gallery_urls: [],
    rescue_date: '2025-11-20',
    location: 'Refugio Principal',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'anim-3',
    name: 'Toby',
    species: 'dog',
    breed: 'Mestizo Pastor',
    age_months: 8,
    gender: 'male',
    size: 'medium',
    status: 'available',
    description: 'Toby es un cachorro curioso, inteligente y muy obediente. Aprende trucos con mucha facilidad.',
    story: 'Nació en una camada rescatada de un terreno abandonado.',
    health_status: 'Vacunas de cachorro completas.',
    is_vaccinated: true,
    is_neutered: false,
    is_special_needs: false,
    special_needs_desc: null,
    main_image_url: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&q=80&w=800',
    gallery_urls: [],
    rescue_date: '2026-01-15',
    location: 'Refugio Principal',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'anim-4',
    name: 'Bella',
    species: 'dog',
    breed: 'Golden Retriever Mix',
    age_months: 36,
    gender: 'female',
    size: 'large',
    status: 'available',
    description: 'Bella es de temperamento extremadamente noble. Adora convivir con otros perritos y nadar.',
    story: 'Rescatada de un caso de abandono por mudanza.',
    health_status: 'Esterilizada y con chequeo veterinario al día.',
    is_vaccinated: true,
    is_neutered: true,
    is_special_needs: false,
    special_needs_desc: null,
    main_image_url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=800',
    gallery_urls: [],
    rescue_date: '2025-08-01',
    location: 'Refugio Principal',
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'anim-5',
    name: 'Milo',
    species: 'dog',
    breed: 'Mestizo pequeño',
    age_months: 12,
    gender: 'male',
    size: 'small',
    status: 'medical_care',
    description: 'Milo es un perrito conversador y muy juguetón. Actualmente recuperándose de una patita lastimada.',
    story: 'Rescatado durante una tormenta.',
    health_status: 'En tratamiento de fisioterapia leve.',
    is_vaccinated: true,
    is_neutered: true,
    is_special_needs: true,
    special_needs_desc: 'Requiere suplemento articular durante 2 meses.',
    main_image_url: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=800',
    gallery_urls: [],
    rescue_date: '2026-01-28',
    location: 'Clínica Veterinaria Aliada',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SEED_INCOME: IncomeRecord[] = [
  {
    id: 'inc-1',
    category: 'donation',
    description: 'Donación empresarial mensual - Grupo Carso',
    amount_usd: 1200,
    date: '2026-02-01',
    donor_id: 'don-1',
    event_name: null,
    receipt_url: 'https://example.com/receipt-1.pdf',
    is_public: true,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inc-2',
    category: 'event',
    description: 'Recaudación Croquetón 2026',
    amount_usd: 850,
    date: '2026-01-25',
    donor_id: null,
    event_name: 'Croquetón de Verano',
    receipt_url: null,
    is_public: true,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'inc-3',
    category: 'donation',
    description: 'Aporte de Padrinos Anónimos',
    amount_usd: 450,
    date: '2026-01-20',
    donor_id: 'don-2',
    event_name: null,
    receipt_url: null,
    is_public: true,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SEED_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp-1',
    category: 'food',
    description: 'Compra de 25 bultos de croqueta super premium 15kg',
    amount_usd: 620,
    date: '2026-02-02',
    vendor: 'ProPlan Distribuidora',
    receipt_url: 'https://example.com/invoice-food.pdf',
    is_public: true,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'exp-2',
    category: 'medical',
    description: 'Jornada de desparasitación y vacunas quíntuples',
    amount_usd: 340,
    date: '2026-01-28',
    vendor: 'Hospital Veterinario San Francisco',
    receipt_url: null,
    is_public: true,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'exp-3',
    category: 'services',
    description: 'Servicios de agua y energía eléctrica del refugio',
    amount_usd: 180,
    date: '2026-01-15',
    vendor: 'Compañía de Luz Local',
    receipt_url: null,
    is_public: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SEED_ACTIVITIES: VolunteerActivity[] = [
  {
    id: 'act-1',
    title: 'Paseo & Socialización Sabatina',
    description: 'Lleva a pasear a nuestros perritos por el parque del refugio y ayuda a socializarlos con otros humanos.',
    category: 'dog_walking',
    activity_date: '2026-02-14',
    start_time: '09:00',
    end_time: '12:00',
    location: 'Refugio Principal - Zona Canina',
    max_volunteers: 15,
    current_volunteers: 8,
    coordinator_name: 'Carlos Mendoza',
    coordinator_phone: '+52 55 1234 5678',
    requirements: ['Ropa cómoda', 'Zapatos cerrados', 'Amor por los perritos'],
    status: 'scheduled',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'act-2',
    title: 'Jornada de Baño & Estética Canina',
    description: 'Ayuda a bañar, cepillar y consentir a nuestros rescatados para su sesión de fotos de adopción.',
    category: 'cleaning',
    activity_date: '2026-02-21',
    start_time: '10:00',
    end_time: '14:00',
    location: 'Patio Central del Refugio',
    max_volunteers: 10,
    current_volunteers: 5,
    coordinator_name: 'Ana Sofia Ramos',
    coordinator_phone: '+52 55 9876 5432',
    requirements: ['Toalla propia', 'Delantal impermeable'],
    status: 'scheduled',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SEED_DONORS: Donor[] = [
  {
    id: 'don-1',
    name: 'Familia Valenzuela',
    type: 'individual',
    email: 'contacto@valenzuela.org',
    phone: '+52 55 1111 2222',
    total_donated_usd: 1500,
    first_donation_date: '2025-01-01T00:00:00.000Z',
    last_donation_date: '2026-02-01T00:00:00.000Z',
    is_featured: true,
    is_anonymous: false,
    logo_url: null,
    message: 'Gracias por su hermosa labor con los perritos de la calle.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'don-2',
    name: 'PetCare Solutions',
    type: 'corporate',
    email: 'donaciones@petcaresolutions.com',
    phone: '+52 55 3333 4444',
    total_donated_usd: 2800,
    first_donation_date: '2025-06-01T00:00:00.000Z',
    last_donation_date: '2026-02-01T00:00:00.000Z',
    is_featured: true,
    is_anonymous: false,
    logo_url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150',
    message: 'Comprometidos con el bienestar animal de la ciudad.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SEED_ADOPTIONS: AdoptionApplication[] = [
  {
    id: 'app-1',
    animal_id: 'anim-1',
    applicant_name: 'Roberto Gómez',
    applicant_email: 'roberto.gomez@gmail.com',
    applicant_phone: '+52 55 4433 2211',
    applicant_address: 'Av. Insurgentes Sur 1420, CDMX',
    city: 'CDMX',
    housing_type: 'house',
    has_yard: true,
    has_other_pets: false,
    has_children: false,
    other_pets_desc: null,
    housing_notes: 'Casa con patio amplio y bardeado.',
    reason: 'Queremos integrar un nuevo miembro a la familia para salir a hacer senderismo los fines de semana.',
    status: 'pending',
    admin_notes: 'Pendiente de llamada de entrevista inicial.',
    reviewed_by: null,
    consent_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ── Store Helper Engine ──────────────────────────────────────────────────────

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(`animalitos_ds_${key}`);
    if (item) return JSON.parse(item);
  } catch (e) {
    console.error(`Error loading key ${key}:`, e);
  }
  return fallback;
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(`animalitos_ds_${key}`, JSON.stringify(data));
    window.dispatchEvent(new Event('animalitos_store_updated'));
  } catch (e) {
    console.error(`Error saving key ${key}:`, e);
  }
}

// ── DataStore Public Interface ───────────────────────────────────────────────

export const dataStore = {
  // 🐶 ANIMALS
  getAnimals(): Animal[] {
    return loadFromStorage('animals', SEED_ANIMALS);
  },
  saveAnimal(animalData: Partial<Animal>): Animal {
    const current = this.getAnimals();
    let updated: Animal;
    if (animalData.id) {
      const idx = current.findIndex(a => a.id === animalData.id);
      if (idx !== -1) {
        updated = { ...current[idx], ...animalData, updated_at: new Date().toISOString() } as Animal;
        current[idx] = updated;
      } else {
        updated = { ...animalData, updated_at: new Date().toISOString() } as Animal;
        current.unshift(updated);
      }
    } else {
      updated = {
        id: `anim-${Date.now()}`,
        name: animalData.name || 'Sin nombre',
        species: animalData.species || 'dog',
        breed: animalData.breed || null,
        age_months: animalData.age_months || 12,
        gender: animalData.gender || 'male',
        size: animalData.size || 'medium',
        status: animalData.status || 'available',
        description: animalData.description || '',
        story: animalData.story || null,
        health_status: animalData.health_status || 'Buen estado de salud',
        is_vaccinated: animalData.is_vaccinated ?? true,
        is_neutered: animalData.is_neutered ?? true,
        is_special_needs: animalData.is_special_needs ?? false,
        special_needs_desc: animalData.special_needs_desc || null,
        main_image_url: animalData.main_image_url || 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800',
        gallery_urls: animalData.gallery_urls || [],
        rescue_date: animalData.rescue_date || new Date().toISOString().split('T')[0],
        location: animalData.location || 'Refugio Principal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      current.unshift(updated);
    }
    saveToStorage('animals', current);
    return updated;
  },
  deleteAnimal(id: string): void {
    const current = this.getAnimals().filter(a => a.id !== id);
    saveToStorage('animals', current);
  },

  // 💰 INCOME & FINANCES
  getIncome(): IncomeRecord[] {
    return loadFromStorage('income', SEED_INCOME);
  },
  addIncome(record: Partial<IncomeRecord>): IncomeRecord {
    const current = this.getIncome();
    const newRecord: IncomeRecord = {
      id: `inc-${Date.now()}`,
      category: record.category || 'donation',
      description: record.description || 'Donación recibida',
      amount_usd: record.amount_usd || 0,
      date: record.date || new Date().toISOString().split('T')[0],
      donor_id: record.donor_id || null,
      event_name: record.event_name || null,
      receipt_url: record.receipt_url || null,
      is_public: record.is_public ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    current.unshift(newRecord);
    saveToStorage('income', current);
    return newRecord;
  },
  deleteIncome(id: string): void {
    const current = this.getIncome().filter(r => r.id !== id);
    saveToStorage('income', current);
  },

  // 💸 EXPENSES
  getExpenses(): ExpenseRecord[] {
    return loadFromStorage('expenses', SEED_EXPENSES);
  },
  addExpense(record: Partial<ExpenseRecord>): ExpenseRecord {
    const current = this.getExpenses();
    const newRecord: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      category: record.category || 'food',
      description: record.description || 'Gasto operativo',
      amount_usd: record.amount_usd || 0,
      date: record.date || new Date().toISOString().split('T')[0],
      vendor: record.vendor || null,
      receipt_url: record.receipt_url || null,
      is_public: record.is_public ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    current.unshift(newRecord);
    saveToStorage('expenses', current);
    return newRecord;
  },
  deleteExpense(id: string): void {
    const current = this.getExpenses().filter(r => r.id !== id);
    saveToStorage('expenses', current);
  },

  // 📅 ACTIVITIES
  getActivities(): VolunteerActivity[] {
    return loadFromStorage('activities', SEED_ACTIVITIES);
  },
  saveActivity(act: Partial<VolunteerActivity>): VolunteerActivity {
    const current = this.getActivities();
    let updated: VolunteerActivity;
    if (act.id) {
      const idx = current.findIndex(a => a.id === act.id);
      if (idx !== -1) {
        updated = { ...current[idx], ...act, updated_at: new Date().toISOString() } as VolunteerActivity;
        current[idx] = updated;
      } else {
        updated = { ...act, updated_at: new Date().toISOString() } as VolunteerActivity;
        current.unshift(updated);
      }
    } else {
      updated = {
        id: `act-${Date.now()}`,
        title: act.title || 'Nueva Actividad',
        description: act.description || '',
        category: act.category || 'dog_walking',
        activity_date: act.activity_date || new Date().toISOString().split('T')[0],
        start_time: act.start_time || '10:00',
        end_time: act.end_time || '12:00',
        location: act.location || 'Refugio Principal',
        max_volunteers: act.max_volunteers || 10,
        current_volunteers: act.current_volunteers || 0,
        coordinator_name: act.coordinator_name || 'Coordinador del Refugio',
        coordinator_phone: act.coordinator_phone || null,
        requirements: act.requirements || [],
        status: act.status || 'scheduled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      current.unshift(updated);
    }
    saveToStorage('activities', current);
    return updated;
  },
  deleteActivity(id: string): void {
    const current = this.getActivities().filter(a => a.id !== id);
    saveToStorage('activities', current);
  },

  // 🤝 DONORS
  getDonors(): Donor[] {
    return loadFromStorage('donors', SEED_DONORS);
  },
  saveDonor(donorData: Partial<Donor>): Donor {
    const current = this.getDonors();
    let updated: Donor;
    if (donorData.id) {
      const idx = current.findIndex(d => d.id === donorData.id);
      if (idx !== -1) {
        updated = { ...current[idx], ...donorData, updated_at: new Date().toISOString() } as Donor;
        current[idx] = updated;
      } else {
        updated = { ...donorData, updated_at: new Date().toISOString() } as Donor;
        current.unshift(updated);
      }
    } else {
      const now = new Date().toISOString();
      updated = {
        id: `don-${Date.now()}`,
        name: donorData.name || 'Donador Anónimo',
        type: donorData.type || 'individual',
        email: donorData.email || null,
        phone: donorData.phone || null,
        total_donated_usd: donorData.total_donated_usd || 100,
        first_donation_date: donorData.first_donation_date || now,
        last_donation_date: donorData.last_donation_date || now,
        is_featured: donorData.is_featured ?? true,
        is_anonymous: donorData.is_anonymous ?? false,
        logo_url: donorData.logo_url || null,
        message: donorData.message || null,
        created_at: now,
        updated_at: now,
      };
      current.unshift(updated);
    }
    saveToStorage('donors', current);
    return updated;
  },
  deleteDonor(id: string): void {
    const current = this.getDonors().filter(d => d.id !== id);
    saveToStorage('donors', current);
  },

  // 📝 ADOPTION APPLICATIONS
  getAdoptionApplications(): AdoptionApplication[] {
    return loadFromStorage('adoption_applications', SEED_ADOPTIONS);
  },
  submitAdoptionApplication(app: Partial<AdoptionApplication>): AdoptionApplication {
    const current = this.getAdoptionApplications();
    const animals = this.getAnimals();
    const targetAnimal = animals.find(a => a.id === app.animal_id);
    const now = new Date().toISOString();

    const newApp: AdoptionApplication = {
      id: `app-${Date.now()}`,
      animal_id: app.animal_id || 'anim-1',
      animal: targetAnimal,
      applicant_name: app.applicant_name || 'Solicitante',
      applicant_email: app.applicant_email || '',
      applicant_phone: app.applicant_phone || '',
      applicant_address: app.applicant_address || '',
      city: app.city || 'Bogotá',
      housing_type: app.housing_type || 'house',
      has_yard: app.has_yard ?? true,
      has_other_pets: app.has_other_pets ?? false,
      has_children: app.has_children ?? false,
      other_pets_desc: app.other_pets_desc || null,
      housing_notes: app.housing_notes || null,
      reason: app.reason || '',
      status: 'pending',
      admin_notes: null,
      reviewed_by: null,
      consent_at: app.consent_at || now,
      created_at: now,
      updated_at: now,
    };
    current.unshift(newApp);
    saveToStorage('adoption_applications', current);
    return newApp;
  },
  updateAdoptionStatus(id: string, status: AdoptionApplication['status'], notes?: string): void {
    const current = this.getAdoptionApplications();
    const idx = current.findIndex(a => a.id === id);
    if (idx !== -1) {
      current[idx].status = status;
      if (notes !== undefined) current[idx].admin_notes = notes;
      current[idx].updated_at = new Date().toISOString();
      saveToStorage('adoption_applications', current);
    }
  },
};
