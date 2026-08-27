-- ═══════════════════════════════════════════════════════════════════
-- 002_rls_policies.sql
-- Row Level Security para todas las tablas
-- ═══════════════════════════════════════════════════════════════════

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donors           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_records   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings    ENABLE ROW LEVEL SECURITY;

-- ── Función helper: verificar si el usuario está autenticado y activo ──
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

-- ── Función helper: verificar rol y nivel de acceso ─────────────────
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

-- ════════════════════════════════════════════════
-- PROFILES
-- ════════════════════════════════════════════════

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

-- El trigger crea el perfil en INSERT, no se necesita política manual.
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

-- ════════════════════════════════════════════════
-- SITE_CONTENT
-- ════════════════════════════════════════════════

-- Lectura pública de contenido publicado
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

-- ════════════════════════════════════════════════
-- DONORS
-- ════════════════════════════════════════════════

-- Lectura pública de donadores no anónimos
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

-- ════════════════════════════════════════════════
-- INCOME_RECORDS
-- ════════════════════════════════════════════════

-- Lectura pública de registros marcados como públicos
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

-- ════════════════════════════════════════════════
-- EXPENSE_RECORDS
-- ════════════════════════════════════════════════

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

-- ════════════════════════════════════════════════
-- CONTACT_MESSAGES
-- ════════════════════════════════════════════════

-- Inserción pública (formulario de contacto)
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

-- ════════════════════════════════════════════════
-- SITE_SETTINGS
-- ════════════════════════════════════════════════

-- Todos pueden leer la configuración pública
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
