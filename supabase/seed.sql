-- ═══════════════════════════════════════════════════════════════════
-- seed.sql
-- Inserción de cuenta super_admin por defecto para el refugio Animalitos
-- ═══════════════════════════════════════════════════════════════════

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
