import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { REFUGE_DOG_PROFILES } from '../src/data/refugeDogProfiles.ts';

test('incluye exactamente los 12 perfiles recibidos con identificadores estables', () => {
  assert.equal(REFUGE_DOG_PROFILES.length, 12);
  assert.equal(new Set(REFUGE_DOG_PROFILES.map((dog) => dog.adoption_slug)).size, 12);
  assert.deepEqual(REFUGE_DOG_PROFILES.map((dog) => dog.name), ['Blanquita', 'Brandon', 'Cheesy', 'Lobo', 'Manchas', 'Max', 'Minnie', 'Moana', 'Noah', 'Scooby', 'Tigresa', 'Yeri']);
});

test('cada perfil tiene foto local, historia y ficha editorial', () => {
  for (const dog of REFUGE_DOG_PROFILES) {
    assert.ok(existsSync(resolve('public', dog.main_image_url.replace(/^\//, '').replace(/^images\//, 'images/'))), `Falta la imagen de ${dog.name}`);
    assert.ok(dog.story.length > 250, `La historia de ${dog.name} quedó demasiado corta`);
    assert.ok(dog.description.length > 20);
    assert.ok(dog.health_status.length > 20);
    assert.ok(dog.personality_summary.length > 20);
  }
});

test('no inventa raza, tamaño, vacunas o edad cuando el texto no los confirma', () => {
  assert.ok(REFUGE_DOG_PROFILES.every((dog) => dog.breed === null));
  assert.deepEqual(REFUGE_DOG_PROFILES.filter((dog) => dog.size !== 'unknown').map((dog) => [dog.name, dog.size]), [['Lobo', 'large']]);
  assert.deepEqual(REFUGE_DOG_PROFILES.filter((dog) => dog.vaccination_status === 'up_to_date').map((dog) => dog.name), ['Blanquita']);
  assert.equal(REFUGE_DOG_PROFILES.find((dog) => dog.name === 'Manchas')?.age_months, null);
  assert.equal(REFUGE_DOG_PROFILES.find((dog) => dog.name === 'Brandon')?.age_is_estimated, true);
  assert.equal(REFUGE_DOG_PROFILES.find((dog) => dog.name === 'Lobo')?.age_is_estimated, true);
});

test('deja visible la información incompleta de Tigresa sin completarla artificialmente', () => {
  const tigresa = REFUGE_DOG_PROFILES.find((dog) => dog.name === 'Tigresa');
  assert.equal(tigresa?.ideal_home, null);
  assert.match(tigresa?.compatibility_notes ?? '', /incompleto/i);
});

test('los momentos de marca son opcionales, ocasionales y editables', () => {
  const branded = REFUGE_DOG_PROFILES.filter((dog) => dog.show_brand_moment);
  assert.ok(branded.length > 0 && branded.length < REFUGE_DOG_PROFILES.length / 2);
  assert.ok(branded.every((dog) => dog.brand_message?.startsWith('AdoptaME:')));
});

test('la migración mantiene publicación, orden y narrativa en la vista pública', () => {
  const sql = readFileSync('supabase/antigravity_migrations/0015_adoption_story_profiles.sql', 'utf8');
  for (const field of ['personality_summary', 'ideal_home', 'compatibility_notes', 'is_published', 'show_brand_moment', 'brand_message', 'sort_order']) assert.match(sql, new RegExp(field));
  assert.match(sql, /is_published = true AND status IN \('available', 'medical_care'\)/);
});

