-- AdoptaME — catálogo inicial de merchandising en borrador
-- No publica productos ni inventario: el equipo debe confirmar precio, stock y fotografía desde el admin.
INSERT INTO public.products (slug, name, description, price_cents, currency, image_url, inventory, is_active)
VALUES
  ('camiseta-adoptame', 'Camiseta AdoptaME', 'Una prenda para llevar la conversación sobre adopción a todas partes.', 2500, 'USD', '/images/hero.jpg', 0, false),
  ('panuelo-me-eligieron', 'Pañuelo “ME eligieron”', 'Un detalle especial para celebrar la conexión que cambia dos vidas.', 1200, 'USD', '/images/dog_max.jpg', 0, false),
  ('tote-bag-adoptame', 'Tote bag AdoptaME', 'Tu aliado cotidiano para que la causa viaje contigo cada día.', 1800, 'USD', '/images/shelter_hero_1785817115197.jpg', 0, false)
ON CONFLICT (slug) DO NOTHING;
