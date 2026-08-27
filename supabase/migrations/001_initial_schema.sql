-- ═══════════════════════════════════════════════════════════════════
-- 001_initial_schema.sql
-- Animalitos — Refugio de Animales
-- Schema inicial con todas las tablas del proyecto
-- ═══════════════════════════════════════════════════════════════════

-- ── Extensiones ──────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Enum helpers (usamos CHECK constraints por simplicidad) ───────

-- ── Tabla: profiles ───────────────────────────────────────────────
-- Extiende auth.users con roles y niveles de acceso.
CREATE TABLE public.profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email          TEXT NOT NULL,
  full_name      TEXT,
  avatar_url     TEXT,
  role           TEXT NOT NULL DEFAULT 'viewer'
                   CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer')),
  access_level   INTEGER NOT NULL DEFAULT 1
                   CHECK (access_level BETWEEN 0 AND 10),
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Perfiles de usuario extendidos con roles y niveles de acceso para el panel admin.';

-- ── Tabla: site_content ───────────────────────────────────────────
-- Contenido editable de las páginas públicas.
CREATE TABLE public.site_content (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug      TEXT NOT NULL,
  section_key    TEXT NOT NULL,
  content_type   TEXT NOT NULL DEFAULT 'text'
                   CHECK (content_type IN ('text', 'rich_text', 'image', 'number', 'url', 'json')),
  content        TEXT NOT NULL DEFAULT '',
  sort_order     INTEGER NOT NULL DEFAULT 0,
  is_published   BOOLEAN NOT NULL DEFAULT true,
  updated_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(page_slug, section_key)
);

COMMENT ON TABLE public.site_content IS 'Contenido dinámico de las páginas públicas del sitio.';

-- ── Tabla: donors ─────────────────────────────────────────────────
-- Donadores del refugio.
CREATE TABLE public.donors (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  type              TEXT NOT NULL DEFAULT 'individual'
                      CHECK (type IN ('individual', 'company', 'organization')),
  email             TEXT,
  phone             TEXT,
  total_donated_usd DECIMAL(12,2) NOT NULL DEFAULT 0,
  is_featured       BOOLEAN NOT NULL DEFAULT false,
  is_anonymous      BOOLEAN NOT NULL DEFAULT false,
  logo_url          TEXT,
  message           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.donors IS 'Donadores del refugio. total_donated_usd se actualiza via trigger.';

-- ── Tabla: income_records ─────────────────────────────────────────
-- Registros de ingresos.
CREATE TABLE public.income_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category     TEXT NOT NULL DEFAULT 'donation'
                 CHECK (category IN ('donation', 'event', 'other')),
  description  TEXT NOT NULL,
  amount_usd   DECIMAL(12,2) NOT NULL CHECK (amount_usd > 0),
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  donor_id     UUID REFERENCES public.donors(id) ON DELETE SET NULL,
  event_name   TEXT,
  receipt_url  TEXT,
  is_public    BOOLEAN NOT NULL DEFAULT true,
  created_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_income_records_date ON public.income_records(date DESC);
CREATE INDEX idx_income_records_category ON public.income_records(category);
CREATE INDEX idx_income_records_is_public ON public.income_records(is_public);

COMMENT ON TABLE public.income_records IS 'Registro de todos los ingresos del refugio. Montos en USD.';

-- ── Tabla: expense_records ────────────────────────────────────────
-- Registros de egresos.
CREATE TABLE public.expense_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category     TEXT NOT NULL DEFAULT 'other'
                 CHECK (category IN ('food', 'medical', 'infrastructure', 'salary', 'utilities', 'supplies', 'other')),
  description  TEXT NOT NULL,
  amount_usd   DECIMAL(12,2) NOT NULL CHECK (amount_usd > 0),
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  vendor       TEXT,
  receipt_url  TEXT,
  is_public    BOOLEAN NOT NULL DEFAULT true,
  created_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expense_records_date ON public.expense_records(date DESC);
CREATE INDEX idx_expense_records_category ON public.expense_records(category);
CREATE INDEX idx_expense_records_is_public ON public.expense_records(is_public);

COMMENT ON TABLE public.expense_records IS 'Registro de todos los egresos del refugio. Montos en USD.';

-- ── Tabla: contact_messages ───────────────────────────────────────
-- Mensajes del formulario de contacto público.
CREATE TABLE public.contact_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  email        TEXT NOT NULL,
  subject      TEXT NOT NULL,
  message      TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'general'
                 CHECK (type IN ('general', 'support', 'donation', 'volunteer')),
  is_read      BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contact_messages_is_read ON public.contact_messages(is_read);

COMMENT ON TABLE public.contact_messages IS 'Mensajes enviados a través del formulario de contacto público.';

-- ── Tabla: site_settings ─────────────────────────────────────────
-- Configuración global editable del sitio.
CREATE TABLE public.site_settings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key          TEXT NOT NULL UNIQUE,
  value        TEXT NOT NULL DEFAULT '',
  description  TEXT,
  updated_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.site_settings IS 'Configuración global del sitio (redes sociales, info de contacto, métodos de donación, etc.).';
