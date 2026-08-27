-- ═══════════════════════════════════════════════════════════════════
-- 004_functions_triggers.sql
-- Funciones y triggers de automatización
-- ═══════════════════════════════════════════════════════════════════

-- ── Trigger: crear perfil al registrar usuario ────────────────────
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
    -- El primer usuario registrado será super_admin
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

-- ── Trigger: actualizar updated_at automáticamente ───────────────
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

-- ── Trigger: actualizar total_donated_usd del donador ────────────
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

-- ── Vista: balance financiero por mes ────────────────────────────
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
