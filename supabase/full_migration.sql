-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 001_initial_schema.sql
-- Animalitos â€” Refugio de Animales
-- Schema inicial con todas las tablas del proyecto
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â”€â”€ Extensiones â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- â”€â”€ Enum helpers (usamos CHECK constraints por simplicidad) â”€â”€â”€â”€â”€â”€â”€

-- â”€â”€ Tabla: profiles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ Tabla: site_content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Contenido editable de las pÃ¡ginas pÃºblicas.
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

COMMENT ON TABLE public.site_content IS 'Contenido dinÃ¡mico de las pÃ¡ginas pÃºblicas del sitio.';

-- â”€â”€ Tabla: donors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ Tabla: income_records â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ Tabla: expense_records â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

-- â”€â”€ Tabla: contact_messages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- Mensajes del formulario de contacto pÃºblico.
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

COMMENT ON TABLE public.contact_messages IS 'Mensajes enviados a travÃ©s del formulario de contacto pÃºblico.';

-- â”€â”€ Tabla: site_settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- ConfiguraciÃ³n global editable del sitio.
CREATE TABLE public.site_settings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key          TEXT NOT NULL UNIQUE,
  value        TEXT NOT NULL DEFAULT '',
  description  TEXT,
  updated_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.site_settings IS 'ConfiguraciÃ³n global del sitio (redes sociales, info de contacto, mÃ©todos de donaciÃ³n, etc.).';
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 002_rls_policies.sql
-- Row Level Security para todas las tablas
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donors           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_records   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings    ENABLE ROW LEVEL SECURITY;

-- â”€â”€ FunciÃ³n helper: verificar si el usuario estÃ¡ autenticado y activo â”€â”€
CREATE OR REPLACE FUNCTION public.is_authenticated_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_active = true
  );
$$;

-- â”€â”€ FunciÃ³n helper: verificar rol y nivel de acceso â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE OR REPLACE FUNCTION public.has_access_level(required_level INTEGER)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND is_active = true
      AND access_level >= required_level
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
  );
$$;

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- PROFILES
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- Cada usuario puede leer su propio perfil
CREATE POLICY "profiles_self_read"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins pueden leer todos los perfiles
CREATE POLICY "profiles_admin_read"
  ON public.profiles FOR SELECT
  USING (public.has_access_level(7));

-- Solo super_admin puede modificar cualquier perfil
CREATE POLICY "profiles_superadmin_update"
  ON public.profiles FOR UPDATE
  USING (public.is_super_admin());

-- El trigger crea el perfil en INSERT, no se necesita polÃ­tica manual.
-- Pero permitimos que el propio user actualice su nombre/avatar:
CREATE POLICY "profiles_self_update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Evitar auto-escalada de rol
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    AND access_level = (SELECT access_level FROM public.profiles WHERE id = auth.uid())
  );

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- SITE_CONTENT
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- Lectura pÃºblica de contenido publicado
CREATE POLICY "site_content_public_read"
  ON public.site_content FOR SELECT
  USING (is_published = true);

-- Admins ven todo (incluso no publicado)
CREATE POLICY "site_content_admin_read"
  ON public.site_content FOR SELECT
  USING (public.has_access_level(4));

-- Editores pueden insertar/actualizar contenido
CREATE POLICY "site_content_editor_write"
  ON public.site_content FOR INSERT
  WITH CHECK (public.has_access_level(4));

CREATE POLICY "site_content_editor_update"
  ON public.site_content FOR UPDATE
  USING (public.has_access_level(4));

-- Solo admins pueden eliminar
CREATE POLICY "site_content_admin_delete"
  ON public.site_content FOR DELETE
  USING (public.has_access_level(7));

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- DONORS
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- Lectura pÃºblica de donadores no anÃ³nimos
CREATE POLICY "donors_public_read"
  ON public.donors FOR SELECT
  USING (is_anonymous = false);

-- Admins ven todos
CREATE POLICY "donors_admin_read"
  ON public.donors FOR SELECT
  USING (public.has_access_level(4));

-- Admins pueden gestionar donadores
CREATE POLICY "donors_admin_write"
  ON public.donors FOR INSERT
  WITH CHECK (public.has_access_level(4));

CREATE POLICY "donors_admin_update"
  ON public.donors FOR UPDATE
  USING (public.has_access_level(4));

CREATE POLICY "donors_admin_delete"
  ON public.donors FOR DELETE
  USING (public.has_access_level(7));

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- INCOME_RECORDS
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- Lectura pÃºblica de registros marcados como pÃºblicos
CREATE POLICY "income_public_read"
  ON public.income_records FOR SELECT
  USING (is_public = true);

-- Admins ven todos
CREATE POLICY "income_admin_read"
  ON public.income_records FOR SELECT
  USING (public.has_access_level(4));

-- Admins pueden gestionar ingresos
CREATE POLICY "income_admin_insert"
  ON public.income_records FOR INSERT
  WITH CHECK (public.has_access_level(4));

CREATE POLICY "income_admin_update"
  ON public.income_records FOR UPDATE
  USING (public.has_access_level(4));

CREATE POLICY "income_admin_delete"
  ON public.income_records FOR DELETE
  USING (public.has_access_level(7));

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- EXPENSE_RECORDS
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

CREATE POLICY "expense_public_read"
  ON public.expense_records FOR SELECT
  USING (is_public = true);

CREATE POLICY "expense_admin_read"
  ON public.expense_records FOR SELECT
  USING (public.has_access_level(4));

CREATE POLICY "expense_admin_insert"
  ON public.expense_records FOR INSERT
  WITH CHECK (public.has_access_level(4));

CREATE POLICY "expense_admin_update"
  ON public.expense_records FOR UPDATE
  USING (public.has_access_level(4));

CREATE POLICY "expense_admin_delete"
  ON public.expense_records FOR DELETE
  USING (public.has_access_level(7));

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- CONTACT_MESSAGES
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- InserciÃ³n pÃºblica (formulario de contacto)
CREATE POLICY "contact_public_insert"
  ON public.contact_messages FOR INSERT
  WITH CHECK (true);

-- Solo admins pueden leer mensajes
CREATE POLICY "contact_admin_read"
  ON public.contact_messages FOR SELECT
  USING (public.has_access_level(4));

CREATE POLICY "contact_admin_update"
  ON public.contact_messages FOR UPDATE
  USING (public.has_access_level(4));

CREATE POLICY "contact_admin_delete"
  ON public.contact_messages FOR DELETE
  USING (public.has_access_level(7));

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- SITE_SETTINGS
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- Todos pueden leer la configuraciÃ³n pÃºblica
CREATE POLICY "settings_public_read"
  ON public.site_settings FOR SELECT
  USING (true);

-- Solo admins pueden modificar
CREATE POLICY "settings_admin_write"
  ON public.site_settings FOR INSERT
  WITH CHECK (public.has_access_level(7));

CREATE POLICY "settings_admin_update"
  ON public.site_settings FOR UPDATE
  USING (public.has_access_level(7));
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 003_seed_content.sql
-- Datos iniciales del sitio
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â”€â”€ ConfiguraciÃ³n inicial del sitio â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO public.site_settings (key, value, description) VALUES
  ('shelter_name',        'Animalitos',                     'Nombre oficial del refugio'),
  ('shelter_tagline',     'Cada vida merece una segunda oportunidad', 'Tagline del refugio'),
  ('shelter_email',       'hola@animalitos.org',            'Email de contacto principal'),
  ('shelter_phone',       '+1 (234) 567-890',               'TelÃ©fono de contacto'),
  ('shelter_address',     'Tu direcciÃ³n aquÃ­, Ciudad, PaÃ­s','DirecciÃ³n fÃ­sica del refugio'),
  ('shelter_schedule',    'Lunâ€“Vie: 8amâ€“6pm | SÃ¡bâ€“Dom: 9amâ€“4pm', 'Horario de atenciÃ³n'),
  ('social_facebook',     '',                               'URL de Facebook'),
  ('social_instagram',    '',                               'URL de Instagram'),
  ('social_twitter',      '',                               'URL de Twitter/X'),
  ('social_tiktok',       '',                               'URL de TikTok'),
  ('donation_paypal',     'donaciones@animalitos.org',      'Email de PayPal para donaciones'),
  ('donation_bank_name',  'Banco Nacional',                 'Nombre del banco'),
  ('donation_bank_account','0001-2345-6789-01',             'NÃºmero de cuenta bancaria'),
  ('donation_bank_iban',  'XX00BANK0001234567890',          'IBAN/SWIFT'),
  ('donation_mercadopago','animalitos.refugio',             'Alias de Mercado Pago'),
  ('donation_btc',        '',                               'DirecciÃ³n Bitcoin'),
  ('donation_eth',        '',                               'DirecciÃ³n Ethereum/USDT')
ON CONFLICT (key) DO NOTHING;

-- â”€â”€ Contenido de la pÃ¡gina de inicio â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO public.site_content (page_slug, section_key, content_type, content, sort_order) VALUES
  ('home', 'hero_title',    'text', 'Cada vida merece una segunda oportunidad', 1),
  ('home', 'hero_subtitle', 'text', 'En Animalitos rescatamos, cuidamos y buscamos un hogar para perros y gatos en necesidad.', 2),
  ('home', 'stat_rescued',  'number', '1240', 3),
  ('home', 'stat_adopted',  'number', '890', 4),
  ('home', 'stat_volunteers','number', '120', 5),
  ('home', 'stat_years',    'number', '8', 6),
  ('home', 'mission',       'rich_text', 'Somos un refugio sin fines de lucro comprometido con el bienestar animal. Rescatamos animales en situaciones de abandono, maltrato o peligro, les brindamos atenciÃ³n mÃ©dica, alimentaciÃ³n y amor, y trabajamos incansablemente para encontrarles un hogar permanente y amoroso.', 7)
ON CONFLICT (page_slug, section_key) DO NOTHING;

-- â”€â”€ Contenido de Nosotros â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO public.site_content (page_slug, section_key, content_type, content, sort_order) VALUES
  ('about', 'mission', 'rich_text', 'Rescatar, rehabilitar y reubicar animales domÃ©sticos en situaciÃ³n de abandono o riesgo, promoviendo la tenencia responsable de mascotas y el respeto por la vida animal en nuestra comunidad.', 1),
  ('about', 'vision',  'rich_text', 'Ser el refugio de referencia de nuestra regiÃ³n, reconocido por su transparencia, efectividad y el impacto positivo que generamos en el bienestar animal y la educaciÃ³n comunitaria.', 2)
ON CONFLICT (page_slug, section_key) DO NOTHING;

-- â”€â”€ Donadores de muestra (para desarrollo) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO public.donors (name, type, total_donated_usd, is_featured, is_anonymous, message) VALUES
  ('Familia GarcÃ­a',    'individual',   500.00, true,  false, 'Adoptamos a Coco hace 2 aÃ±os y desde entonces queremos devolver el amor.'),
  ('PetCare S.A.',      'company',      2500.00, true,  false, 'Comprometidos con el bienestar animal desde nuestros valores corporativos.'),
  ('Club Rotario',      'organization', 1200.00, true,  false, 'Apoyando causas que transforman nuestra comunidad.'),
  ('Donante AnÃ³nimo',   'individual',   300.00,  false, true,  null),
  ('Laura Mendez',      'individual',   150.00,  false, false, null)
ON CONFLICT DO NOTHING;

-- â”€â”€ Ingresos de muestra â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO public.income_records (category, description, amount_usd, date, event_name, is_public) VALUES
  ('donation', 'DonaciÃ³n mensual - Familia GarcÃ­a',    500.00, '2026-07-15', null, true),
  ('donation', 'Aporte corporativo - PetCare S.A.',   2500.00, '2026-07-01', null, true),
  ('event',    'Bingo Solidario - Julio 2026',        450.00,  '2026-07-20', 'Bingo Solidario Julio', true),
  ('event',    'Bazar de Mascotas - Junio 2026',      320.00,  '2026-06-14', 'Bazar Junio', true),
  ('donation', 'Colecta redes sociales - Junio',      180.00,  '2026-06-30', null, true),
  ('donation', 'DonaciÃ³n anÃ³nima',                    300.00,  '2026-06-10', null, true)
ON CONFLICT DO NOTHING;

-- â”€â”€ Egresos de muestra â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO public.expense_records (category, description, amount_usd, date, vendor, is_public) VALUES
  ('food',           'Alimento seco - Junio', 280.00, '2026-06-05', 'Distribuidora PetFood', true),
  ('food',           'Alimento hÃºmedo y snacks', 90.00, '2026-06-05', 'Distribuidora PetFood', true),
  ('medical',        'Consultas veterinarias - Junio', 350.00, '2026-06-20', 'ClÃ­nica Veterinaria Central', true),
  ('medical',        'VacunaciÃ³n lote de rescatados', 210.00, '2026-06-15', 'ClÃ­nica Veterinaria Central', true),
  ('utilities',      'Agua y electricidad - Junio', 120.00, '2026-06-30', null, true),
  ('supplies',       'Materiales de limpieza', 65.00, '2026-06-10', 'FerreterÃ­a Local', true),
  ('infrastructure', 'ReparaciÃ³n cercado - Ãrea Perros', 400.00, '2026-07-03', 'Construcciones Ramos', true),
  ('food',           'Alimento seco - Julio', 295.00, '2026-07-05', 'Distribuidora PetFood', true)
ON CONFLICT DO NOTHING;
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 004_functions_triggers.sql
-- Funciones y triggers de automatizaciÃ³n
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â”€â”€ Trigger: crear perfil al registrar usuario â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, access_level)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    -- El primer usuario registrado serÃ¡ super_admin
    CASE WHEN NOT EXISTS (SELECT 1 FROM public.profiles) THEN 'super_admin' ELSE 'viewer' END,
    CASE WHEN NOT EXISTS (SELECT 1 FROM public.profiles) THEN 10 ELSE 1 END
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- â”€â”€ Trigger: actualizar updated_at automÃ¡ticamente â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER site_content_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER donors_updated_at
  BEFORE UPDATE ON public.donors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER income_records_updated_at
  BEFORE UPDATE ON public.income_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER expense_records_updated_at
  BEFORE UPDATE ON public.expense_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- â”€â”€ Trigger: actualizar total_donated_usd del donador â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE OR REPLACE FUNCTION public.update_donor_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.donors
    SET total_donated_usd = COALESCE((
      SELECT SUM(amount_usd) FROM public.income_records
      WHERE donor_id = OLD.donor_id
    ), 0)
    WHERE id = OLD.donor_id;
    RETURN OLD;
  ELSE
    IF NEW.donor_id IS NOT NULL THEN
      UPDATE public.donors
      SET total_donated_usd = COALESCE((
        SELECT SUM(amount_usd) FROM public.income_records
        WHERE donor_id = NEW.donor_id
      ), 0)
      WHERE id = NEW.donor_id;
    END IF;
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER income_update_donor_total
  AFTER INSERT OR UPDATE OR DELETE ON public.income_records
  FOR EACH ROW EXECUTE FUNCTION public.update_donor_total();

-- â”€â”€ Vista: balance financiero por mes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE OR REPLACE VIEW public.monthly_balance AS
WITH monthly_income AS (
  SELECT
    to_char(date, 'YYYY-MM') AS month,
    SUM(amount_usd) AS total_income
  FROM public.income_records
  GROUP BY 1
),
monthly_expense AS (
  SELECT
    to_char(date, 'YYYY-MM') AS month,
    SUM(amount_usd) AS total_expense
  FROM public.expense_records
  GROUP BY 1
)
SELECT
  COALESCE(i.month, e.month) AS month,
  COALESCE(i.total_income, 0)  AS total_income,
  COALESCE(e.total_expense, 0) AS total_expense,
  COALESCE(i.total_income, 0) - COALESCE(e.total_expense, 0) AS net_balance
FROM monthly_income i
FULL OUTER JOIN monthly_expense e ON i.month = e.month
ORDER BY 1 DESC;

COMMENT ON VIEW public.monthly_balance IS 'Balance financiero mensual del refugio.';
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 005_extended_features.sql
-- MÃ³dulo de Animales en AdopciÃ³n, Solicitudes, Historias de Ã‰xito y Voluntariado
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â”€â”€ Tabla: animals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.animals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  species          TEXT NOT NULL CHECK (species IN ('dog', 'cat', 'other')),
  breed            TEXT,
  age_months       INTEGER NOT NULL CHECK (age_months >= 0),
  gender           TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  size             TEXT NOT NULL CHECK (size IN ('small', 'medium', 'large', 'extra_large')),
  status           TEXT NOT NULL DEFAULT 'available'
                     CHECK (status IN ('available', 'pending', 'adopted', 'medical_care')),
  description      TEXT NOT NULL,
  story            TEXT,
  health_status    TEXT NOT NULL DEFAULT 'healthy',
  is_vaccinated    BOOLEAN NOT NULL DEFAULT true,
  is_neutered      BOOLEAN NOT NULL DEFAULT true,
  is_special_needs BOOLEAN NOT NULL DEFAULT false,
  special_needs_desc TEXT,
  main_image_url   TEXT NOT NULL,
  gallery_urls     TEXT[] DEFAULT '{}',
  rescue_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  location         TEXT DEFAULT 'Refugio Principal',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_animals_species ON public.animals(species);
CREATE INDEX IF NOT EXISTS idx_animals_status ON public.animals(status);

COMMENT ON TABLE public.animals IS 'Animales del refugio disponibles para adopciÃ³n o en proceso.';

-- â”€â”€ Tabla: adoption_applications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.adoption_applications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id         UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  applicant_name    TEXT NOT NULL,
  applicant_email   TEXT NOT NULL,
  applicant_phone   TEXT NOT NULL,
  applicant_address TEXT NOT NULL,
  housing_type      TEXT NOT NULL CHECK (housing_type IN ('house', 'apartment', 'farm')),
  has_yard          BOOLEAN NOT NULL DEFAULT false,
  has_other_pets    BOOLEAN NOT NULL DEFAULT false,
  other_pets_desc   TEXT,
  reason            TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  admin_notes       TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.adoption_applications IS 'Solicitudes de adopciÃ³n enviadas por interesados.';

-- â”€â”€ Tabla: volunteer_applications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.volunteer_applications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT NOT NULL,
  area_of_interest  TEXT NOT NULL CHECK (area_of_interest IN ('dog_walking', 'medical_support', 'events', 'social_media', 'shelter_maintenance', 'foster')),
  availability      TEXT NOT NULL,
  experience        TEXT,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'active', 'archived')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- â”€â”€ Tabla: success_stories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.success_stories (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_name        TEXT NOT NULL,
  adopter_name       TEXT NOT NULL,
  title              TEXT NOT NULL,
  story              TEXT NOT NULL,
  before_image_url   TEXT,
  after_image_url    TEXT NOT NULL,
  adoption_date      DATE NOT NULL,
  is_featured        BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- â”€â”€ RLS for new tables â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoption_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

-- Animals: Public read, Admin write
CREATE POLICY "animals_public_read" ON public.animals FOR SELECT USING (true);
CREATE POLICY "animals_admin_write" ON public.animals FOR ALL USING (public.has_access_level(4));

-- Adoption applications: Anyone insert, Admin read/write
CREATE POLICY "adoption_public_insert" ON public.adoption_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "adoption_admin_read" ON public.adoption_applications FOR SELECT USING (public.has_access_level(4));
CREATE POLICY "adoption_admin_update" ON public.adoption_applications FOR UPDATE USING (public.has_access_level(4));

-- Volunteer applications: Anyone insert, Admin read/write
CREATE POLICY "volunteer_public_insert" ON public.volunteer_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "volunteer_admin_read" ON public.volunteer_applications FOR SELECT USING (public.has_access_level(4));
CREATE POLICY "volunteer_admin_update" ON public.volunteer_applications FOR UPDATE USING (public.has_access_level(4));

-- Success stories: Public read, Admin write
CREATE POLICY "success_stories_public_read" ON public.success_stories FOR SELECT USING (true);
CREATE POLICY "success_stories_admin_write" ON public.success_stories FOR ALL USING (public.has_access_level(4));
-- Seed animals
INSERT INTO public.animals (
  name, species, breed, age_months, gender, size, status, description, story, health_status, is_vaccinated, is_neutered, is_special_needs, main_image_url, rescue_date
) VALUES
(
  'Max', 'dog', 'Mestizo de Labradador', 24, 'male', 'large', 'available',
  'Max es un perro sÃºper cariÃ±oso, juguetÃ³n y lleno de energÃ­a. Le encanta correr al aire libre y se lleva de maravilla con niÃ±os y otros perros.',
  'Fue rescatado en una carretera transitada cuando apenas tenÃ­a 6 meses. Tras recuperarse de desnutriciÃ³n, hoy estÃ¡ 100% sano y listo para encontrar una familia amorosa.',
  'Excelente salud. Chequeo completo al dÃ­a.', true, true, false,
  '/images/dog_max.jpg', '2025-09-10'
),
(
  'Luna', 'cat', 'CalicÃ³', 18, 'female', 'medium', 'available',
  'Luna es una gatita serena, elegante y muy mimosa. Disfruta tomar el sol en las ventanas y ronronea fuerte cuando la acaricias.',
  'Encontrada en un parque comunitario. Es muy dÃ³cil y se adapta rÃ¡pidamente a nuevos entornos tranquilos.',
  'Excelente estado de salud. Desparasitada y vacunada.', true, true, false,
  '/images/cat_luna.jpg', '2025-11-20'
),
(
  'Rocky', 'dog', 'Mestizo Pastor', 8, 'male', 'medium', 'available',
  'Rocky es un cachorro curioso, inteligente y muy obediente. Aprende trucos con mucha facilidad.',
  'NaciÃ³ en una camada rescatada de un terreno abandonado junto a su madre.',
  'Saludable. Vacunas de cachorro al dÃ­a.', true, false, false,
  '/images/dog_max.jpg', '2026-01-15'
),
(
  'Milo', 'cat', 'Mestizo Naranjito', 12, 'male', 'small', 'available',
  'Milo es un gatito hiperactivo y divertido que ama los juguetes con cascabel.',
  'Rescatado de una tuberÃ­a de lluvia durante una tormenta. Hoy es pura alegrÃ­a.',
  'Perfecto estado.', true, true, false,
  '/images/cat_luna.jpg', '2026-02-01'
)
ON CONFLICT DO NOTHING;

-- Seed success stories
INSERT INTO public.success_stories (
  animal_name, adopter_name, title, story, after_image_url, adoption_date, is_featured
) VALUES
(
  'Toby', 'Familia MartÃ­nez', 'Un nuevo hogar para Toby',
  'Toby llegÃ³ al refugio con una pata lastimada y temeroso. Hoy, tras 6 meses en su nuevo hogar, es el compaÃ±ero inseparable de los niÃ±os y adora las caminatas dominicales.',
  '/images/hero.jpg', '2025-12-10', true
),
(
  'Bella', 'Ana MarÃ­a & Carlos', 'La gatita que llenÃ³ nuestra casa de luz',
  'Adoptar a Bella fue la mejor decisiÃ³n. Se adaptÃ³ desde el primer dÃ­a y nos acompaÃ±a cada tarde mientras trabajamos.',
  '/images/cat_luna.jpg', '2026-01-20', true
)
ON CONFLICT DO NOTHING;
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 007_volunteer_calendar.sql
-- MÃ³dulo de Calendario de Actividades, Tareas y Disponibilidad de Voluntarios
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â”€â”€ Tabla: volunteer_activities â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.volunteer_activities (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title              TEXT NOT NULL,
  description        TEXT NOT NULL,
  category           TEXT NOT NULL CHECK (category IN ('dog_walking', 'medical', 'events', 'maintenance', 'cleaning', 'foster')),
  activity_date      DATE NOT NULL,
  start_time         TIME NOT NULL DEFAULT '09:00',
  end_time           TIME NOT NULL DEFAULT '12:00',
  location           TEXT NOT NULL DEFAULT 'Refugio Principal',
  max_volunteers     INTEGER NOT NULL DEFAULT 5 CHECK (max_volunteers > 0),
  current_volunteers INTEGER NOT NULL DEFAULT 0 CHECK (current_volunteers >= 0),
  coordinator_name   TEXT NOT NULL DEFAULT 'Equipo Animalitos',
  coordinator_phone  TEXT,
  requirements       TEXT[] DEFAULT '{}',
  status             TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_date ON public.volunteer_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_activities_category ON public.volunteer_activities(category);

COMMENT ON TABLE public.volunteer_activities IS 'Actividades y tareas programadas del refugio para participaciÃ³n de voluntarios.';

-- â”€â”€ Tabla: activity_registrations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.activity_registrations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id      UUID NOT NULL REFERENCES public.volunteer_activities(id) ON DELETE CASCADE,
  volunteer_name   TEXT NOT NULL,
  volunteer_email  TEXT NOT NULL,
  volunteer_phone  TEXT NOT NULL,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(activity_id, volunteer_email)
);

COMMENT ON TABLE public.activity_registrations IS 'Registro individual de inscripciones de voluntarios por actividad.';

-- â”€â”€ RLS Policies â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE public.volunteer_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities_public_read" ON public.volunteer_activities FOR SELECT USING (true);
CREATE POLICY "activities_admin_write" ON public.volunteer_activities FOR ALL USING (public.has_access_level(4));

CREATE POLICY "registrations_public_insert" ON public.activity_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "registrations_admin_read" ON public.activity_registrations FOR SELECT USING (public.has_access_level(4));

-- â”€â”€ Trigger: actualizar contador de voluntarios â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE OR REPLACE FUNCTION public.update_activity_volunteer_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.volunteer_activities
    SET current_volunteers = COALESCE((
      SELECT COUNT(*) FROM public.activity_registrations WHERE activity_id = OLD.activity_id
    ), 0)
    WHERE id = OLD.activity_id;
    RETURN OLD;
  ELSE
    UPDATE public.volunteer_activities
    SET current_volunteers = COALESCE((
      SELECT COUNT(*) FROM public.activity_registrations WHERE activity_id = NEW.activity_id
    ), 0)
    WHERE id = NEW.activity_id;
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER on_registration_change
  AFTER INSERT OR DELETE ON public.activity_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_activity_volunteer_count();

-- â”€â”€ Datos semilla para pruebas de calendario â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO public.volunteer_activities (
  title, description, category, activity_date, start_time, end_time, location, max_volunteers, current_volunteers, coordinator_name, requirements
) VALUES
(
  'Jornada de Paseo y SocializaciÃ³n ðŸ•',
  'Paseo matutino, ejercitaciÃ³n y juego al aire libre con los perritos del Ã¡rea B.',
  'dog_walking', CURRENT_DATE + INTERVAL '2 days', '09:00', '12:00', 'Parque Central & Refugio', 8, 4, 'Carlos GÃ³mez',
  ARRAY['Traer botella de agua', 'Calzado cÃ³modo']
),
(
  'CampanÌƒa de Sanidad y DesparasitaciÃ³n ðŸ¥',
  'Apoyo al equipo veterinario en pesaje, cepillado y aplicaciÃ³n de tratamientos a gatitos rescatados.',
  'medical', CURRENT_DATE + INTERVAL '5 days', '10:00', '13:00', 'Ãrea MÃ©dica Refugio', 4, 2, 'Dra. MarÃ­a Elena',
  ARRAY['Uso de mascarilla', 'Guantes de lÃ¡tex']
),
(
  'Bazar Solidario & Colecta ðŸŽŸï¸',
  'AtenciÃ³n en stand de donaciones y venta de artÃ­culos promocionales para recaudar fondos.',
  'events', CURRENT_DATE + INTERVAL '8 days', '11:00', '17:00', 'Plaza Principal', 6, 3, 'Laura MÃ©ndez',
  ARRAY['Camiseta institucional']
),
(
  'Mantenimiento de Caniles & Pintura ðŸ› ï¸',
  'ReparaciÃ³n de cercas, impermeabilizaciÃ³n y embellecimiento de Ã¡reas habitables de los peluditos.',
  'maintenance', CURRENT_DATE + INTERVAL '12 days', '08:30', '14:00', 'Refugio Principal', 10, 5, 'Ing. Roberto Ramos',
  ARRAY['Ropa para trabajo pesado', 'Guantes de trabajo']
)
ON CONFLICT DO NOTHING;
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- 008_recurring_events.sql
-- MÃ³dulo de Eventos Recurrentes, MultidÃ­a y AsignaciÃ³n Manual de Personas
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- â”€â”€ AÃ±adir columnas de recurrencia y multidÃ­a â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE public.volunteer_activities
  ADD COLUMN IF NOT EXISTS event_type TEXT NOT NULL DEFAULT 'single_day' CHECK (event_type IN ('single_day', 'multi_day')),
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT NOT NULL DEFAULT 'none' CHECK (recurrence_pattern IN ('none', 'weekly', 'monthly', 'yearly')),
  ADD COLUMN IF NOT EXISTS parent_event_id UUID REFERENCES public.volunteer_activities(id) ON DELETE CASCADE;

ALTER TABLE public.activity_registrations
  ADD COLUMN IF NOT EXISTS assigned_by_admin BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.volunteer_activities.event_type IS 'Define si es evento de un dÃ­a o de varios dÃ­as seguidos.';
COMMENT ON COLUMN public.volunteer_activities.recurrence_pattern IS 'Frecuencia de repeticiÃ³n: ninguna, semanal, mensual o anual.';
COMMENT ON COLUMN public.activity_registrations.assigned_by_admin IS 'Indica si la persona fue inscrita manualmente por un administrador.';

-- â”€â”€ Seed data para evento multidÃ­a y recurrente â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
INSERT INTO public.volunteer_activities (
  title, description, category, activity_date, end_date, event_type, recurrence_pattern, start_time, end_time, location, max_volunteers, current_volunteers, coordinator_name
) VALUES
(
  'Gran Bazar & Colecta Anual (3 DÃ­as) ðŸŽŸï¸',
  'Macro evento de recaudaciÃ³n de fondos y adopciones. Se requieren voluntarios para distintos turnos.',
  'events', CURRENT_DATE + INTERVAL '14 days', CURRENT_DATE + INTERVAL '16 days', 'multi_day', 'none', '10:00', '18:00', 'Parque de la ExposiciÃ³n', 15, 6, 'CoordinaciÃ³n General'
),
(
  'Paseo Semanal de Canes (SÃ¡bados) ðŸ•',
  'Jornada recurrente cada sÃ¡bado para dar paseo y amor a los perritos.',
  'dog_walking', CURRENT_DATE + INTERVAL '7 days', null, 'single_day', 'weekly', '09:00', '12:00', 'Refugio Principal', 8, 4, 'Carlos GÃ³mez'
)
ON CONFLICT DO NOTHING;
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- seed.sql
-- InserciÃ³n de cuenta super_admin por defecto para el refugio Animalitos
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- Crear usuario administrador en auth.users (ID fijo para referencias)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@animalitos.org',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Administrador Animalitos"}',
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Crear perfil de super_admin en public.profiles
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  avatar_url,
  role,
  access_level,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@animalitos.org',
  'Administrador Animalitos',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'super_admin',
  10,
  true
) ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin',
  access_level = 10,
  is_active = true;
