-- Seed animals
INSERT INTO public.animals (
  name, species, breed, age_months, gender, size, status, description, story, health_status, is_vaccinated, is_neutered, is_special_needs, main_image_url, rescue_date
) VALUES
(
  'Max', 'dog', 'Mestizo de Labradador', 24, 'male', 'large', 'available',
  'Max es un perro súper cariñoso, juguetón y lleno de energía. Le encanta correr al aire libre y se lleva de maravilla con niños y otros perros.',
  'Fue rescatado en una carretera transitada cuando apenas tenía 6 meses. Tras recuperarse de desnutrición, hoy está 100% sano y listo para encontrar una familia amorosa.',
  'Excelente salud. Chequeo completo al día.', true, true, false,
  '/images/dog_max.jpg', '2025-09-10'
),
(
  'Luna', 'cat', 'Calicó', 18, 'female', 'medium', 'available',
  'Luna es una gatita serena, elegante y muy mimosa. Disfruta tomar el sol en las ventanas y ronronea fuerte cuando la acaricias.',
  'Encontrada en un parque comunitario. Es muy dócil y se adapta rápidamente a nuevos entornos tranquilos.',
  'Excelente estado de salud. Desparasitada y vacunada.', true, true, false,
  '/images/cat_luna.jpg', '2025-11-20'
),
(
  'Rocky', 'dog', 'Mestizo Pastor', 8, 'male', 'medium', 'available',
  'Rocky es un cachorro curioso, inteligente y muy obediente. Aprende trucos con mucha facilidad.',
  'Nació en una camada rescatada de un terreno abandonado junto a su madre.',
  'Saludable. Vacunas de cachorro al día.', true, false, false,
  '/images/dog_max.jpg', '2026-01-15'
),
(
  'Milo', 'cat', 'Mestizo Naranjito', 12, 'male', 'small', 'available',
  'Milo es un gatito hiperactivo y divertido que ama los juguetes con cascabel.',
  'Rescatado de una tubería de lluvia durante una tormenta. Hoy es pura alegría.',
  'Perfecto estado.', true, true, false,
  '/images/cat_luna.jpg', '2026-02-01'
)
ON CONFLICT DO NOTHING;

-- Seed success stories
INSERT INTO public.success_stories (
  animal_name, adopter_name, title, story, after_image_url, adoption_date, is_featured
) VALUES
(
  'Toby', 'Familia Martínez', 'Un nuevo hogar para Toby',
  'Toby llegó al refugio con una pata lastimada y temeroso. Hoy, tras 6 meses en su nuevo hogar, es el compañero inseparable de los niños y adora las caminatas dominicales.',
  '/images/hero.jpg', '2025-12-10', true
),
(
  'Bella', 'Ana María & Carlos', 'La gatita que llenó nuestra casa de luz',
  'Adoptar a Bella fue la mejor decisión. Se adaptó desde el primer día y nos acompaña cada tarde mientras trabajamos.',
  '/images/cat_luna.jpg', '2026-01-20', true
)
ON CONFLICT DO NOTHING;
