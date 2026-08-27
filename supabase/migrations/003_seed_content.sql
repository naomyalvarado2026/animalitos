-- ═══════════════════════════════════════════════════════════════════
-- 003_seed_content.sql
-- Datos iniciales del sitio
-- ═══════════════════════════════════════════════════════════════════

-- ── Configuración inicial del sitio ──────────────────────────────
INSERT INTO public.site_settings (key, value, description) VALUES
  ('shelter_name',        'Animalitos',                     'Nombre oficial del refugio'),
  ('shelter_tagline',     'Cada vida merece una segunda oportunidad', 'Tagline del refugio'),
  ('shelter_email',       'hola@animalitos.org',            'Email de contacto principal'),
  ('shelter_phone',       '+1 (234) 567-890',               'Teléfono de contacto'),
  ('shelter_address',     'Tu dirección aquí, Ciudad, País','Dirección física del refugio'),
  ('shelter_schedule',    'Lun–Vie: 8am–6pm | Sáb–Dom: 9am–4pm', 'Horario de atención'),
  ('social_facebook',     '',                               'URL de Facebook'),
  ('social_instagram',    '',                               'URL de Instagram'),
  ('social_twitter',      '',                               'URL de Twitter/X'),
  ('social_tiktok',       '',                               'URL de TikTok'),
  ('donation_paypal',     'donaciones@animalitos.org',      'Email de PayPal para donaciones'),
  ('donation_bank_name',  'Banco Nacional',                 'Nombre del banco'),
  ('donation_bank_account','0001-2345-6789-01',             'Número de cuenta bancaria'),
  ('donation_bank_iban',  'XX00BANK0001234567890',          'IBAN/SWIFT'),
  ('donation_mercadopago','animalitos.refugio',             'Alias de Mercado Pago'),
  ('donation_btc',        '',                               'Dirección Bitcoin'),
  ('donation_eth',        '',                               'Dirección Ethereum/USDT')
ON CONFLICT (key) DO NOTHING;

-- ── Contenido de la página de inicio ────────────────────────────
INSERT INTO public.site_content (page_slug, section_key, content_type, content, sort_order) VALUES
  ('home', 'hero_title',    'text', 'Cada vida merece una segunda oportunidad', 1),
  ('home', 'hero_subtitle', 'text', 'En Animalitos rescatamos, cuidamos y buscamos un hogar para perros y gatos en necesidad.', 2),
  ('home', 'stat_rescued',  'number', '1240', 3),
  ('home', 'stat_adopted',  'number', '890', 4),
  ('home', 'stat_volunteers','number', '120', 5),
  ('home', 'stat_years',    'number', '8', 6),
  ('home', 'mission',       'rich_text', 'Somos un refugio sin fines de lucro comprometido con el bienestar animal. Rescatamos animales en situaciones de abandono, maltrato o peligro, les brindamos atención médica, alimentación y amor, y trabajamos incansablemente para encontrarles un hogar permanente y amoroso.', 7)
ON CONFLICT (page_slug, section_key) DO NOTHING;

-- ── Contenido de Nosotros ────────────────────────────────────────
INSERT INTO public.site_content (page_slug, section_key, content_type, content, sort_order) VALUES
  ('about', 'mission', 'rich_text', 'Rescatar, rehabilitar y reubicar animales domésticos en situación de abandono o riesgo, promoviendo la tenencia responsable de mascotas y el respeto por la vida animal en nuestra comunidad.', 1),
  ('about', 'vision',  'rich_text', 'Ser el refugio de referencia de nuestra región, reconocido por su transparencia, efectividad y el impacto positivo que generamos en el bienestar animal y la educación comunitaria.', 2)
ON CONFLICT (page_slug, section_key) DO NOTHING;

-- ── Donadores de muestra (para desarrollo) ───────────────────────
INSERT INTO public.donors (name, type, total_donated_usd, is_featured, is_anonymous, message) VALUES
  ('Familia García',    'individual',   500.00, true,  false, 'Adoptamos a Coco hace 2 años y desde entonces queremos devolver el amor.'),
  ('PetCare S.A.',      'company',      2500.00, true,  false, 'Comprometidos con el bienestar animal desde nuestros valores corporativos.'),
  ('Club Rotario',      'organization', 1200.00, true,  false, 'Apoyando causas que transforman nuestra comunidad.'),
  ('Donante Anónimo',   'individual',   300.00,  false, true,  null),
  ('Laura Mendez',      'individual',   150.00,  false, false, null)
ON CONFLICT DO NOTHING;

-- ── Ingresos de muestra ──────────────────────────────────────────
INSERT INTO public.income_records (category, description, amount_usd, date, event_name, is_public) VALUES
  ('donation', 'Donación mensual - Familia García',    500.00, '2026-07-15', null, true),
  ('donation', 'Aporte corporativo - PetCare S.A.',   2500.00, '2026-07-01', null, true),
  ('event',    'Bingo Solidario - Julio 2026',        450.00,  '2026-07-20', 'Bingo Solidario Julio', true),
  ('event',    'Bazar de Mascotas - Junio 2026',      320.00,  '2026-06-14', 'Bazar Junio', true),
  ('donation', 'Colecta redes sociales - Junio',      180.00,  '2026-06-30', null, true),
  ('donation', 'Donación anónima',                    300.00,  '2026-06-10', null, true)
ON CONFLICT DO NOTHING;

-- ── Egresos de muestra ───────────────────────────────────────────
INSERT INTO public.expense_records (category, description, amount_usd, date, vendor, is_public) VALUES
  ('food',           'Alimento seco - Junio', 280.00, '2026-06-05', 'Distribuidora PetFood', true),
  ('food',           'Alimento húmedo y snacks', 90.00, '2026-06-05', 'Distribuidora PetFood', true),
  ('medical',        'Consultas veterinarias - Junio', 350.00, '2026-06-20', 'Clínica Veterinaria Central', true),
  ('medical',        'Vacunación lote de rescatados', 210.00, '2026-06-15', 'Clínica Veterinaria Central', true),
  ('utilities',      'Agua y electricidad - Junio', 120.00, '2026-06-30', null, true),
  ('supplies',       'Materiales de limpieza', 65.00, '2026-06-10', 'Ferretería Local', true),
  ('infrastructure', 'Reparación cercado - Área Perros', 400.00, '2026-07-03', 'Construcciones Ramos', true),
  ('food',           'Alimento seco - Julio', 295.00, '2026-07-05', 'Distribuidora PetFood', true)
ON CONFLICT DO NOTHING;
