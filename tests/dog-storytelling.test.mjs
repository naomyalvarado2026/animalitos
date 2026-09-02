import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFAULT_DOG_EDITORIAL_PROFILES } from '../src/data/dogEditorialProfiles.ts';
import { REFUGE_DOG_PROFILES } from '../src/data/refugeDogProfiles.ts';

test('cada perro real tiene voz, cronología, encuadre y foco de apadrinamiento', () => {
  assert.equal(DEFAULT_DOG_EDITORIAL_PROFILES.length, REFUGE_DOG_PROFILES.length);
  for (const profile of DEFAULT_DOG_EDITORIAL_PROFILES) {
    assert.match(profile.voice_line, /^ME llamo /);
    assert.ok(profile.social_caption.includes('AdoptaME'));
    assert.ok(profile.sponsor_focus.length > 20);
    assert.equal(profile.timeline.length, 3);
    assert.ok(profile.timeline.every((chapter) => chapter.title && chapter.description.length > 20));
    assert.ok(profile.focal_x >= 0 && profile.focal_x <= 100);
    assert.ok(profile.focal_y >= 0 && profile.focal_y <= 100);
  }
});

test('las nuevas experiencias están conectadas con rutas públicas y administración', () => {
  const app = readFileSync('src/App.tsx', 'utf8');
  const header = readFileSync('src/components/layout/PublicHeader.tsx', 'utf8');
  const admin = readFileSync('src/components/layout/AdminLayout.tsx', 'utf8');
  assert.match(app, /path="\/adopta\/:slug" element=\{<DogProfilePage/);
  assert.match(app, /path="\/apadrina\/:slug" element=\{<SponsorshipPage/);
  assert.match(app, /path="\/admin\/historias-perros" element=\{<DogStoryStudio/);
  assert.match(header, /Apadrinar un perrito/);
  assert.match(admin, /Historias de la manada/);
});

test('la migración futura protege edición y registra apadrinamientos sin exponer pagos', () => {
  const sql = readFileSync('supabase/antigravity_migrations/0017_dog_storytelling_and_sponsorship.sql', 'utf8');
  for (const table of ['dog_editorial_profiles', 'dog_story_milestones', 'animal_media', 'sponsorship_inquiries']) {
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS public\\.${table}`));
    assert.match(sql, new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`));
  }
  assert.match(sql, /SECURITY DEFINER/);
  assert.match(sql, /has_access_level\(4\)/);
  assert.match(sql, /kind IN \('cover', 'gallery', 'social', 'cutout', 'video'\)/);
});
